"""Event-based automation rules - predictable, no hidden logic"""
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.contact import Contact
from app.models.conversation import Conversation, Message
from app.models.booking import Booking
from app.models.form import FormSubmission
from app.models.inventory import InventoryItem
from app.models.workspace import Workspace
from app.services.integrations import send_email, send_sms
from app.services.calendar import create_calendar_event

logger = logging.getLogger(__name__)

def on_new_contact(db: Session, contact: Contact, workspace: Workspace) -> None:
    """New contact -> welcome message"""
    conv = db.query(Conversation).filter(Conversation.contact_id == contact.id).first()
    if not conv:
        conv = Conversation(contact_id=contact.id)
        db.add(conv)
        db.commit()
        db.refresh(conv)
    msg = Message(
        conversation_id=conv.id,
        channel="email" if contact.email else "sms",
        direction="outbound",
        content="Thank you for reaching out! We'll get back to you shortly.",
        is_automated=True
    )
    db.add(msg)
    conv.last_message_at = datetime.utcnow()
    db.commit()
    # Send actual message
    if contact.email and workspace.email_connected:
        send_email(
            contact.email,
            "Thanks for contacting us",
            "<p>Thank you for reaching out! We'll get back to you shortly.</p>",
            workspace.from_email or workspace.contact_email or "noreply@careops.app",
            workspace.sendgrid_api_key
        )
    elif contact.phone and workspace.sms_connected:
        send_sms(
            contact.phone,
            "Thanks for reaching out! We'll get back to you shortly.",
            workspace.twilio_account_sid,
            workspace.twilio_auth_token,
            workspace.twilio_phone_number
        )

def on_booking_created(db: Session, booking: Booking, workspace: Workspace) -> None:
    """Booking created -> confirmation"""
    contact = booking.contact
    bt = booking.booking_type
    msg_body = f"Your {bt.name} is confirmed for {booking.scheduled_at}. We look forward to seeing you!"

    # Ensure all communication also appears in the Inbox
    conv = db.query(Conversation).filter(Conversation.contact_id == contact.id).first()
    if not conv:
        conv = Conversation(contact_id=contact.id)
        db.add(conv)
        db.commit()
        db.refresh(conv)

    channel = "email" if contact.email else ("sms" if contact.phone else "system")
    msg = Message(
        conversation_id=conv.id,
        channel=channel,
        direction="outbound",
        content=msg_body,
        is_automated=True,
    )
    db.add(msg)
    conv.last_message_at = datetime.utcnow()
    db.commit()

    # Send actual confirmation via configured integrations
    sent = False
    if contact.email and workspace.email_connected:
        ok, _ = send_email(
            contact.email,
            f"Booking confirmed: {bt.name}",
            f"<p>{msg_body}</p>",
            workspace.from_email or workspace.contact_email or "noreply@careops.app",
            workspace.sendgrid_api_key,
        )
        sent = sent or ok

    if contact.phone and workspace.sms_connected:
        ok, _ = send_sms(
            contact.phone,
            msg_body,
            workspace.twilio_account_sid,
            workspace.twilio_auth_token,
            workspace.twilio_phone_number,
        )
        sent = sent or ok

    if sent:
        booking.confirmation_sent = True
        db.commit()
    # Calendar sync - create event if configured
    if workspace.calendar_connected and workspace.google_calendar_id and workspace.google_credentials_json:
        start_dt = booking.scheduled_at
        end_dt = start_dt + timedelta(minutes=bt.duration_minutes or 60)
        ok, err, event_id = create_calendar_event(
            title=f"{bt.name}: {contact.name}",
            start=start_dt,
            end=end_dt,
            description=f"Contact: {contact.email or contact.phone or ''}",
            location=bt.location or workspace.address or "",
            calendar_id=workspace.google_calendar_id,
            credentials_json=workspace.google_credentials_json,
        )
        if ok and event_id:
            booking.calendar_event_id = event_id
            db.commit()
        elif err:
            logger.warning("Calendar sync failed for booking %s: %s", booking.id, err)

def on_staff_reply(db: Session, conversation_id: int) -> None:
    """Staff reply -> automation stops"""
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conv:
        conv.automation_paused = True
        db.commit()

def check_inventory_alerts(db: Session, workspace_id: int) -> list:
    """Return list of low-stock items"""
    items = db.query(InventoryItem).filter(
        InventoryItem.workspace_id == workspace_id,
        InventoryItem.quantity <= InventoryItem.low_stock_threshold
    ).all()
    return [{"id": i.id, "name": i.name, "quantity": i.quantity, "threshold": i.low_stock_threshold} for i in items]
