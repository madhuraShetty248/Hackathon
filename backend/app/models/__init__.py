from app.models.user import User, WorkspaceMember
from app.models.workspace import Workspace
from app.models.contact import Contact
from app.models.conversation import Conversation, Message
from app.models.booking import Booking, BookingType
from app.models.form import Form, FormSubmission
from app.models.inventory import InventoryItem
from app.models.stored_file import StoredFile
from app.database import Base, engine

def init_db():
    Base.metadata.create_all(bind=engine)
