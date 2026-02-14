from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.user import User
from app.models.contact import Contact
from app.models.conversation import Conversation, Message
from app.schemas import MessageCreate
from app.api.workspaces import _get_workspace_access
from app.auth import get_current_user
from app.services.automation import on_staff_reply
from app.services.integrations import send_email, send_sms

router = APIRouter(prefix="/workspaces", tags=["conversations"])

@router.get("/{workspace_id}/conversations")
def list_conversations(workspace_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_workspace_access(workspace_id, user, db)
    contacts = db.query(Contact).filter(Contact.workspace_id == workspace_id).all()
    result = []
    for c in contacts:
        conv = db.query(Conversation).filter(Conversation.contact_id == c.id).order_by(desc(Conversation.last_message_at)).first()
        if not conv:
            continue
        last_msg = db.query(Message).filter(Message.conversation_id == conv.id).order_by(desc(Message.sent_at)).first()
        unread = False  # simplified
        result.append({
            "id": conv.id,
            "contact_id": c.id,
            "contact_name": c.name,
            "contact_email": c.email,
            "contact_phone": c.phone,
            "last_message": last_msg.content if last_msg else None,
            "last_message_at": str(conv.last_message_at) if conv.last_message_at else str(conv.created_at),
            "status": conv.status,
            "unanswered": not conv.automation_paused and last_msg and last_msg.direction == "inbound"
        })
    result.sort(key=lambda x: x["last_message_at"] or "", reverse=True)
    return result

@router.get("/{workspace_id}/conversations/{conversation_id}/messages")
def get_messages(workspace_id: int, conversation_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_workspace_access(workspace_id, user, db)
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    c = db.query(Contact).filter(Contact.id == conv.contact_id, Contact.workspace_id == workspace_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Not found")
    messages = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.sent_at).all()
    return {
        "contact": {"id": c.id, "name": c.name, "email": c.email, "phone": c.phone},
        "messages": [{"id": m.id, "channel": m.channel, "direction": m.direction, "content": m.content, "sent_at": str(m.sent_at), "is_automated": m.is_automated} for m in messages]
    }

@router.post("/{workspace_id}/conversations/{conversation_id}/reply")
def reply_to_conversation(workspace_id: int, conversation_id: int, data: MessageCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_workspace_access(workspace_id, user, db)
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    c = db.query(Contact).filter(Contact.id == conv.contact_id, Contact.workspace_id == workspace_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Not found")
    from app.models.workspace import Workspace
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    msg = Message(conversation_id=conversation_id, channel=data.channel, direction="outbound", content=data.content, is_automated=False, created_by_user_id=user.id)
    db.add(msg)
    conv.last_message_at = msg.sent_at
    on_staff_reply(db, conversation_id)
    db.commit()
    # Send actual message
    if data.channel == "email" and c.email and ws and ws.email_connected:
        send_email(c.email, "Reply from your business", f"<p>{data.content}</p>", ws.from_email or ws.contact_email, ws.sendgrid_api_key)
    elif data.channel == "sms" and c.phone and ws and ws.sms_connected:
        send_sms(c.phone, data.content, ws.twilio_account_sid, ws.twilio_auth_token, ws.twilio_phone_number)
    return {"id": msg.id}
