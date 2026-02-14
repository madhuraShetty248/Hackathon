from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models import init_db
from app.api.auth import router as auth_router
from app.api.workspaces import router as workspaces_router
from app.api.contacts import router as contacts_router
from app.api.conversations import router as conversations_router
from app.api.bookings import router as bookings_router
from app.api.forms import router as forms_router
from app.api.inventory import router as inventory_router
from app.api.dashboard import router as dashboard_router
from app.api.public import router as public_router
from app.api.staff import router as staff_router
from app.api.files import router as files_router

app = FastAPI(title="CareOps", description="Unified Operations Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176",
        "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5175", "http://127.0.0.1:5176",
        "https://hackathon-orcin-seven.vercel.app", "https://hackathon-5o5sgvkh1-madhurashetty248s-projects.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

app.include_router(auth_router)
app.include_router(workspaces_router)
app.include_router(contacts_router)
app.include_router(conversations_router)
app.include_router(bookings_router)
app.include_router(forms_router)
app.include_router(inventory_router)
app.include_router(dashboard_router)
app.include_router(public_router)
app.include_router(staff_router)
app.include_router(files_router)

@app.get("/")
def root():
    return {"message": "CareOps API", "docs": "/docs"}
