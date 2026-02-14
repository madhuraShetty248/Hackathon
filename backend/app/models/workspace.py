from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Workspace(Base):
    __tablename__ = "workspaces"
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(100), unique=True, index=True, nullable=True)  # For public URLs
    name = Column(String(255), nullable=False)
    address = Column(Text, nullable=True)
    timezone = Column(String(100), default="UTC")
    contact_email = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=False)
    onboarding_step = Column(Integer, default=1)  # 1-8
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Integrations
    email_connected = Column(Boolean, default=False)
    sms_connected = Column(Boolean, default=False)
    sendgrid_api_key = Column(Text, nullable=True)
    twilio_account_sid = Column(Text, nullable=True)
    twilio_auth_token = Column(Text, nullable=True)
    twilio_phone_number = Column(String(50), nullable=True)
    from_email = Column(String(255), nullable=True)
    # Calendar integration
    calendar_connected = Column(Boolean, default=False)
    google_calendar_id = Column(String(255), nullable=True)
    google_credentials_json = Column(Text, nullable=True)
    # File storage (S3 optional)
    storage_connected = Column(Boolean, default=False)
    s3_bucket = Column(String(255), nullable=True)
    s3_credentials_json = Column(Text, nullable=True)

    owners = relationship("User", secondary="workspace_members", back_populates="workspaces")
    contacts = relationship("Contact", back_populates="workspace")
    booking_types = relationship("BookingType", back_populates="workspace")
    inventory_items = relationship("InventoryItem", back_populates="workspace")
    forms = relationship("Form", back_populates="workspace")
