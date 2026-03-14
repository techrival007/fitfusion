from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import bcrypt
from app.database import get_db
from app.auth import create_token

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
async def login(body: LoginRequest, db=Depends(get_db)):
    row = await db.fetchrow(
        """SELECT u.id, u.name, u.email, u.password_hash, u.role, h.name as hostel_name
           FROM users u
           LEFT JOIN hostels h ON h.id = u.hostel_id
           WHERE u.email = $1""",
        body.email
    )
    if not row or not bcrypt.checkpw(body.password.encode(), row["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = dict(row)
    token = create_token(user)
    return {
        "token":     token,
        "role":      user["role"],
        "name":      user["name"],
        "hostel_id": user.get("hostel_name"),
    }
