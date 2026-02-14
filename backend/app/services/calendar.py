"""Calendar integration - Google Calendar. Abstracted for graceful failure."""
import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)


def create_calendar_event(
    title: str,
    start: datetime,
    end: datetime,
    description: str = "",
    location: str = "",
    calendar_id: Optional[str] = None,
    credentials_json: Optional[str] = None,
) -> tuple[bool, Optional[str], Optional[str]]:
    """
    Create a Google Calendar event. Returns (success, error_message, event_id).
    Fails gracefully if not configured.
    """
    if not calendar_id or not credentials_json:
        logger.info("Calendar not configured - skipping event creation")
        return False, "Calendar not configured", None
    try:
        import json
        from google.oauth2 import service_account
        from googleapiclient.discovery import build

        creds_dict = json.loads(credentials_json)
        credentials = service_account.Credentials.from_service_account_info(creds_dict)
        service = build("calendar", "v3", credentials=credentials)

        event = {
            "summary": title,
            "description": description or "",
            "location": location or "",
            "start": {
                "dateTime": start.isoformat(),
                "timeZone": "UTC",
            },
            "end": {
                "dateTime": end.isoformat(),
                "timeZone": "UTC",
            },
        }
        created = service.events().insert(calendarId=calendar_id, body=event).execute()
        return True, None, created.get("id")
    except Exception as e:
        logger.exception("Calendar event creation failed")
        return False, str(e), None


def delete_calendar_event(
    calendar_id: Optional[str],
    event_id: Optional[str],
    credentials_json: Optional[str] = None,
) -> tuple[bool, Optional[str]]:
    """Delete a Google Calendar event. Returns (success, error_message)."""
    if not all([calendar_id, event_id, credentials_json]):
        return False, "Calendar not configured"
    try:
        import json
        from google.oauth2 import service_account
        from googleapiclient.discovery import build

        creds_dict = json.loads(credentials_json)
        credentials = service_account.Credentials.from_service_account_info(creds_dict)
        service = build("calendar", "v3", credentials=credentials)
        service.events().delete(calendarId=calendar_id, eventId=event_id).execute()
        return True, None
    except Exception as e:
        logger.exception("Calendar event deletion failed")
        return False, str(e)
