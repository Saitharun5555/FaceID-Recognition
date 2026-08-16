import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional
import numpy as np
import json

from app.database import get_db
from app.models import User
from app.schemas import UserResponse, RegisterResponse, FaceMatchResponse
from app.face_utils import (
    embedding_to_string,
    string_to_embedding,
    compare_embeddings,
)

router = APIRouter(prefix="/api/users", tags=["users"])

UPLOAD_DIR = "uploads/profiles"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/register", response_model=RegisterResponse)
async def register_user(
    full_name: str = Form(...),
    email: str = Form(...),
    phone: Optional[str] = Form(None),
    age: Optional[int] = Form(None),
    occupation: Optional[str] = Form(None),
    bio: Optional[str] = Form(None),
    face_embedding: str = Form(...),  # JSON array of floats from face-api.js
    profile_photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    """Register a new user with profile details and face embedding."""

    # Check email uniqueness
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")

    # Parse embedding
    try:
        embedding = json.loads(face_embedding)
        if not isinstance(embedding, list) or len(embedding) < 32:
            raise ValueError("Invalid embedding")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid face embedding data.")

    # Save profile photo if provided
    profile_image_path = None
    if profile_photo and profile_photo.filename:
        ext = os.path.splitext(profile_photo.filename)[1] or ".jpg"
        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        contents = await profile_photo.read()
        with open(filepath, "wb") as f:
            f.write(contents)
        profile_image_path = filepath

    user = User(
        full_name=full_name,
        email=email,
        phone=phone,
        age=age,
        occupation=occupation,
        bio=bio,
        face_encoding=embedding_to_string(embedding),
        profile_image=profile_image_path,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return RegisterResponse(
        success=True,
        message="Registration successful! Your face has been enrolled.",
        user=UserResponse.model_validate(user),
    )


@router.post("/scan", response_model=FaceMatchResponse)
async def scan_face(
    face_embedding: str = Form(...),  # JSON array of floats from face-api.js
    db: Session = Depends(get_db),
):
    """Match a face embedding against all enrolled users."""

    try:
        embedding = json.loads(face_embedding)
        if not isinstance(embedding, list) or len(embedding) < 32:
            raise ValueError("Invalid embedding")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid face embedding data.")

    unknown_np = np.array(embedding)

    users = db.query(User).filter(User.face_encoding.isnot(None)).all()
    if not users:
        return FaceMatchResponse(
            matched=False,
            message="No enrolled users found. Please register first.",
        )

    best_match = None
    best_confidence = 0.0

    for user in users:
        known_np = string_to_embedding(user.face_encoding)
        is_match, confidence = compare_embeddings(known_np, unknown_np)
        if is_match and confidence > best_confidence:
            best_match = user
            best_confidence = confidence

    if best_match:
        return FaceMatchResponse(
            matched=True,
            confidence=best_confidence,
            user=UserResponse.model_validate(best_match),
            message=f"Identity verified! Matched with {best_confidence:.1f}% confidence.",
        )

    return FaceMatchResponse(
        matched=False,
        message="No matching user found. Face not recognized.",
    )


@router.get("/", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).all()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully."}
