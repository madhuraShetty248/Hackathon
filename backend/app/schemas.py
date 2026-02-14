from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# Auth
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

# Workspace
class WorkspaceCreate(BaseModel):
    name: str
    address: Optional[str] = None
    timezone: str = "UTC"
    contact_email: Optional[str] = None

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    timezone: Optional[str] = None
    contact_email: Optional[str] = None
    onboarding_step: Optional[int] = None

class IntegrationConfig(BaseModel):
    sendgrid_api_key: Optional[str] = None
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None
    from_email: Optional[str] = None
    # Calendar
    google_calendar_id: Optional[str] = None
    google_credentials_json: Optional[str] = None
    # File storage (S3)
    s3_bucket: Optional[str] = None
    s3_credentials_json: Optional[str] = None

# Contact
class ContactCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    source: str = "form"

# Message
class MessageCreate(BaseModel):
    content: str
    channel: str = "email"  # email, sms

# Booking
class BookingTypeCreate(BaseModel):
    name: str
    duration_minutes: int = 60
    availability: Dict[str, List[int]] = {}
    location: Optional[str] = None

class BookingCreate(BaseModel):
    booking_type_id: int
    contact_name: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    scheduled_at: str  # ISO datetime

# Form
class FormCreate(BaseModel):
    name: str
    description: Optional[str] = None
    fields: List[Dict] = []
    is_contact_form: bool = False

class FormSubmissionCreate(BaseModel):
    data: Dict[str, Any] = {}

# Inventory
class InventoryItemCreate(BaseModel):
    name: str
    quantity: float = 0
    unit: str = "units"
    low_stock_threshold: float = 5
    quantity_per_booking: float = 1

class InventoryItemUpdate(BaseModel):
    quantity: Optional[float] = None
    low_stock_threshold: Optional[float] = None

# Staff
class StaffInvite(BaseModel):
    email: str
    full_name: str
    permissions: List[str] = ["inbox", "bookings", "forms", "inventory"]
