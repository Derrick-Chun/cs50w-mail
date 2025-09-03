# CS50W Project 3 — Mail

A single-page email client built with Django (backend APIs) and vanilla JavaScript (frontend). Users can compose, send, read, reply, and archive emails without full page reloads. The UI uses the Fetch API and the History API for a smooth SPA feel.

## Features
- **Mailboxes**: Inbox / Sent / Archive loaded dynamically
- **Compose**: Client-side validation + non-blocking submit
- **Read/Unread**: Toggle state instantly with visual feedback
- **Reply**: Prefills subject/body quoting the original
- **Archive/Unarchive**: Immediate UI updates
- **SPA Navigation**: pushState + popstate; deep links work
- **Graceful Errors**: Simple inline error messages on failures

## Tech Stack
- **Frontend**: HTML/CSS, Vanilla JS (Fetch, History API)
- **Backend**: Django (API endpoints provided by spec)

## Run Locally
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt || pip install "Django>=4,<6"
python manage.py migrate
python manage.py runserver
