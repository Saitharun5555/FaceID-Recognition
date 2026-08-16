from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.database import engine, Base
from app.routes import users

# Create all DB tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FaceID System",
    description="Facial recognition system for user identification",
    version="1.0.0",
)

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded profile images
os.makedirs("uploads/profiles", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Register routes
app.include_router(users.router)


@app.get("/")
def root():
    return {"message": "FaceID API is running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
