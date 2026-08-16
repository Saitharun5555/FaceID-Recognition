# FaceID System

A facial recognition system that identifies users and displays their profile by scanning their face via webcam.

## How It Works

1. **Register** — A user fills in their details (name, email, phone, age, occupation, bio) and captures their face via webcam. The face is encoded and stored alongside their profile.
2. **Scan** — Anyone can scan their face. The system matches it against enrolled users and displays the matching user's full profile with a confidence score.
3. **Users** — View all enrolled users and manage enrollments.

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- `cmake` (required by `dlib` which powers face recognition)
- A webcam

### Install cmake (Windows)

```
winget install Kitware.CMake
```
Or download from https://cmake.org/download/

---

## Setup & Run

### 1. Backend (FastAPI)

Open a terminal in the `backend/` folder:

```bash
# Windows
start.bat

# Manual (any OS)
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: http://localhost:8000  
API docs at: http://localhost:8000/docs

### 2. Frontend (React + Vite)

Open another terminal in the `frontend/` folder:

```bash
# Windows
start.bat

# Manual
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

---

## Project Structure

```
faceid/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app entry
│   │   ├── database.py      # SQLite + SQLAlchemy setup
│   │   ├── models.py        # User DB model
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── face_utils.py    # Face encoding / matching logic
│   │   └── routes/
│   │       └── users.py     # Register, scan, list, delete endpoints
│   ├── requirements.txt
│   └── start.bat
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── pages/
    │   │   ├── ScanPage.jsx      # Face scan + identification
    │   │   ├── RegisterPage.jsx  # User registration + face enrollment
    │   │   └── UsersPage.jsx     # Enrolled users list
    │   └── components/
    │       ├── Camera.jsx        # Webcam capture component
    │       └── UserCard.jsx      # User profile display card
    ├── package.json
    └── start.bat
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/users/register` | Register user + enroll face |
| POST | `/api/users/scan` | Scan face and identify user |
| GET | `/api/users/` | List all enrolled users |
| GET | `/api/users/{id}` | Get user by ID |
| DELETE | `/api/users/{id}` | Remove user enrollment |

---

## Privacy Note

- All face data is stored locally in a SQLite database (`backend/facerec.db`)
- No data is sent to any external service
- Only users who explicitly register are enrolled
- Face encodings are numerical vectors, not images
