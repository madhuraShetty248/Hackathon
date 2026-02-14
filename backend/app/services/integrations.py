"""Email and SMS integrations - abstracted for graceful failure"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)

def send_email(
    to_email: str,
    subject: str,
    body_html: str,
    from_email: str,
    api_key: Optional[str] = None
) -> tuple[bool, Optional[str]]:
    """Send email via SendGrid. Returns (success, error_message)"""
    if not api_key:
        logger.warning("SendGrid API key not configured - email not sent")
        return False, "Email not configured"
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail
        message = Mail(
            from_email=from_email,
            to_emails=to_email,
            subject=subject,
            html_content=body_html
        )
        sg = SendGridAPIClient(api_key)
        sg.send(message)
        return True, None
    except Exception as e:
        logger.exception("Email send failed")
        return False, str(e)

def send_sms(
    to_phone: str,
    body: str,
    account_sid: Optional[str] = None,
    auth_token: Optional[str] = None,
    from_phone: Optional[str] = None
) -> tuple[bool, Optional[str]]:
    """Send SMS via Twilio. Returns (success, error_message)"""
    if not all([account_sid, auth_token, from_phone]):
        logger.warning("Twilio not configured - SMS not sent")
        return False, "SMS not configured"
    try:
        from twilio.rest import Client
        client = Client(account_sid, auth_token)
        client.messages.create(body=body, from_=from_phone, to=to_phone)
        return True, None
    except Exception as e:
        logger.exception("SMS send failed")
        return False, str(e)
