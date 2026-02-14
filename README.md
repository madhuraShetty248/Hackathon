# CareOps - Unified Operations Platform

A single platform that connects leads, bookings, forms, inventory, and communication for service-based businesses.

## Tech Stack

- **Frontend**: React + Vite + Three.js (3D) + Framer Motion
- **Backend**: FastAPI (Python)
- **Database**: SQLite (dev) / PostgreSQL (production)

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Configure Vite Proxy (optional)

For dev, add to `frontend/vite.config.js` or use env `VITE_API_URL=http://localhost:8000` so the frontend can reach the API.

If frontend and backend run on different ports, set:
```
VITE_API_URL=http://localhost:8000
```

### 4. Use the App

1. **Register** at http://localhost:5173/register
2. Complete **Setup** (Onboarding) - configure workspace, email/SMS, contact form, bookings
3. **Activate** workspace
4. Share public links:
   - Contact form: `/contact/{workspaceId}`
   - Booking page: `/book/{workspaceId}`

## Features

- **Dashboard**: Today's bookings, unanswered messages, forms status, inventory alerts
- **Inbox**: All communication in one place (email, SMS)
- **Bookings**: Manage and track booking status
- **Forms**: Contact form + post-booking forms
- **Inventory**: Track items, low-stock alerts
- **Staff**: Invite team members with permissions
- **Automation**: Welcome message, booking confirmation, staff reply pauses automation

## Integrations

- **Email**: SendGrid (set in onboarding or `.env`)
- **SMS**: Twilio (set in onboarding or `.env`)
- **Calendar**: Google Calendar – bookings sync as events. Add Calendar ID + service account JSON in onboarding (Step 2, optional).
- **File Storage**: Local by default. Optional S3 – add bucket + credentials in onboarding for cloud storage.

### Migration (existing database)

If you have an existing `careops.db` from before calendar/storage support, run:

```bash
cd backend
python scripts/migrate_add_integrations.py
```

## API Docs

http://localhost:8000/docs
