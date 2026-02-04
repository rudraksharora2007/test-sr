"""
Cryptographic hashing utilities.
"""
import hashlib


def hash_sha256(value: str) -> str:
    """
    Hash a string using SHA256.
    
    Args:
        value: String to hash
    
    Returns:
        Hexadecimal hash string
    """
    return hashlib.sha256(value.encode()).hexdigest()


def verify_sha256(plain: str, hashed: str) -> bool:
    """
    Verify a plain string against a SHA256 hash.
    
    Args:
        plain: Plain text string
        hashed: SHA256 hash to compare against
    
    Returns:
        True if match, False otherwise
    """
    return hash_sha256(plain) == hashed
