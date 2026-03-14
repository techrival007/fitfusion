import os
from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from app.config import settings

ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/admin/auth/login")


def create_token(user: dict) -> str:
    payload = {
        "sub":  str(user["id"]),
        "role": user["role"],
        "name": user["name"],
        "iat":  datetime.utcnow(),
        "exp":  datetime.utcnow() + timedelta(hours=24),
    }
    if user["role"] == "warden" and user.get("hostel_name"):
        payload["hostel_id"] = user["hostel_name"]
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def decode_token(token: str = Depends(oauth2_scheme)) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def require_role(*roles: str):
    async def dep(payload: dict = Depends(decode_token)):
        if payload.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return payload
    return Depends(dep)
