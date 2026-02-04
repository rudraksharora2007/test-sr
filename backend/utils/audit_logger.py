"""
Structured audit logging for security events.
"""
import logging
import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import os

# Configure audit logger
audit_logger = logging.getLogger("audit")
audit_logger.setLevel(logging.INFO)

# Create logs directory if it doesn't exist
os.makedirs("logs", exist_ok=True)

# File handler for audit logs
file_handler = logging.FileHandler("logs/audit.log")
file_handler.setLevel(logging.INFO)

# JSON formatter
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "event": record.getMessage(),
            "extra": getattr(record, "extra", {})
        }
        return json.dumps(log_data)

file_handler.setFormatter(JSONFormatter())
audit_logger.addHandler(file_handler)


def log_event(event_type: str, details: Dict[str, Any], ip: Optional[str] = None):
    """
    Log a security event.
    
    Args:
        event_type: Type of event (e.g., "failed_login", "password_reset")
        details: Event details
        ip: IP address of the request
    """
    log_data = {
        "event_type": event_type,
        "ip": ip,
        **details
    }
    audit_logger.info(event_type, extra=log_data)


def log_failed_login(email: str, ip: str, reason: str):
    """Log a failed login attempt."""
    log_event("failed_login", {
        "email": email,
        "reason": reason
    }, ip)


def log_account_locked(email: str, ip: str, attempts: int):
    """Log an account lockout."""
    log_event("account_locked", {
        "email": email,
        "failed_attempts": attempts
    }, ip)


def log_password_reset_request(email: str, ip: str):
    """Log a password reset request."""
    log_event("password_reset_request", {
        "email": email
    }, ip)


def log_password_reset_success(email: str, ip: str):
    """Log a successful password reset."""
    log_event("password_reset_success", {
        "email": email
    }, ip)


def log_admin_action(admin_id: str, admin_email: str, action: str, resource: str, ip: str, details: Optional[Dict] = None):
    """Log an admin action."""
    log_event("admin_action", {
        "admin_id": admin_id,
        "admin_email": admin_email,
        "action": action,
        "resource": resource,
        "details": details or {}
    }, ip)


def log_order_lookup(order_id: str, email: Optional[str], ip: str, authenticated: bool, success: bool):
    """Log an order lookup attempt."""
    log_event("order_lookup", {
        "order_id": order_id,
        "email": email,
        "authenticated": authenticated,
        "success": success
    }, ip)


def log_suspicious_activity(event: str, details: Dict[str, Any], ip: str):
    """Log suspicious activity."""
    log_event("suspicious_activity", {
        "event": event,
        "details": details
    }, ip)


def log_rate_limit_exceeded(endpoint: str, ip: str):
    """Log rate limit exceeded."""
    log_event("rate_limit_exceeded", {
        "endpoint": endpoint
    }, ip)
