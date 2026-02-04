"""
Secure file upload validation.
"""
from fastapi import UploadFile, HTTPException
import os
from pathlib import Path
import re

# Try to import python-magic, but make it optional
try:
    import magic
    MAGIC_AVAILABLE = True
except (ImportError, OSError):
    MAGIC_AVAILABLE = False

# Configuration
MAX_UPLOAD_SIZE_MB = int(os.environ.get("MAX_UPLOAD_SIZE_MB", "5"))
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
ALLOWED_MIME_TYPES = {"image/png", "image/jpeg", "image/webp"}

# File signature magic bytes for validation (fallback when python-magic not available)
FILE_SIGNATURES = {
    b'\x89PNG\r\n\x1a\n': 'image/png',
    b'\xff\xd8\xff': 'image/jpeg',  # JPEG/JPG
    b'RIFF': 'image/webp',  # WEBP (needs additional check)
}


def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename to prevent path traversal and other attacks.
    
    Args:
        filename: Original filename
    
    Returns:
        Sanitized filename
    """
    # Remove path components
    filename = os.path.basename(filename)
    
    # Remove any non-alphanumeric characters except dots, dashes, and underscores
    filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
    
    # Limit length
    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        filename = name[:250] + ext
    
    return filename


async def validate_image_upload(file: UploadFile) -> tuple[bool, str]:
    """
    Validate an uploaded image file.
    
    Args:
        file: FastAPI UploadFile object
    
    Returns:
        Tuple of (is_valid: bool, error_message: str)
    """
    # Check file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        return False, f"Invalid file extension. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
    
    # Read file content
    content = await file.read()
    file_size = len(content)
    
    # Reset file pointer for later use
    await file.seek(0)
    
    # Check file size
    if file_size > MAX_UPLOAD_SIZE_BYTES:
        return False, f"File too large. Maximum size: {MAX_UPLOAD_SIZE_MB}MB"
    
    # Validate MIME type
    if MAGIC_AVAILABLE:
        # Use python-magic if available (most accurate)
        try:
            mime = magic.from_buffer(content, mime=True)
            if mime not in ALLOWED_MIME_TYPES:
                return False, f"Invalid file type. Detected: {mime}. Allowed: {', '.join(ALLOWED_MIME_TYPES)}"
        except Exception as e:
            return False, f"Failed to validate file type: {str(e)}"
    else:
        # Fallback: Check file signatures (magic bytes)
        detected_type = None
        for signature, mime_type in FILE_SIGNATURES.items():
            if content.startswith(signature):
                # Special handling for WEBP (needs WEBP string after RIFF)
                if signature == b'RIFF' and len(content) > 12:
                    if content[8:12] == b'WEBP':
                        detected_type = mime_type
                        break
                else:
                    detected_type = mime_type
                    break
        
        if not detected_type:
            return False, f"Invalid file type. Could not detect image format. Allowed: {', '.join(ALLOWED_MIME_TYPES)}"
        
        if detected_type not in ALLOWED_MIME_TYPES:
            return False, f"Invalid file type. Detected: {detected_type}. Allowed: {', '.join(ALLOWED_MIME_TYPES)}"
    
    return True, ""



async def secure_file_upload(file: UploadFile, upload_dir: str) -> str:
    """
    Securely upload a file after validation.
    
    Args:
        file: FastAPI UploadFile object
        upload_dir: Directory to save file
    
    Returns:
        Relative path to saved file
    
    Raises:
        HTTPException: If validation fails
    """
    # Validate file
    is_valid, error_msg = await validate_image_upload(file)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Sanitize filename
    safe_filename = sanitize_filename(file.filename)
    
    # Generate unique filename to prevent overwrites
    import uuid
    unique_filename = f"{uuid.uuid4().hex[:8]}_{safe_filename}"
    
    # Ensure upload directory exists
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save file
    file_path = os.path.join(upload_dir, unique_filename)
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Return relative path
    return f"/{upload_dir.split('/')[-1]}/{unique_filename}"
