from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class BookingType(Base):
    __tablename__ = "booking_types"
    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    name = Column(String(255), nullable=False)
    duration_minutes = Column(Integer, default=60)
    availability = Column(JSON, default=dict)  # {"mon":[9,10,11],"tue":[...]}
    location = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    workspace = relationship("Workspace", back_populates="booking_types")
    bookings = relationship("Booking", back_populates="booking_type")
    form_ids = Column(JSON, default=list)  # [1,2] form IDs to send after booking

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=False)
    booking_type_id = Column(Integer, ForeignKey("booking_types.id"), nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(50), default="confirmed")  # confirmed, completed, no_show, cancelled
    notes = Column(Text, nullable=True)
    confirmation_sent = Column(Boolean, default=False)
    reminder_sent = Column(Boolean, default=False)
    calendar_event_id = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    contact = relationship("Contact", back_populates="bookings")
    booking_type = relationship("BookingType", back_populates="bookings")
    form_submissions = relationship("FormSubmission", back_populates="booking")
