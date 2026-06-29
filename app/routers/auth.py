import uuid

import bcrypt as _bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from starlette.requests import Request

from app.models.user import User
from app.schemas import AuthResponse, UserLogin, UserOut, UserRegister

router = APIRouter(prefix="/api/auth", tags=["auth"])


async def get_current_user(request: Request) -> User:
    auth = request.headers.get("Authorization", "")
    token = auth.replace("Bearer ", "") if auth.startswith("Bearer ") else ""
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    user = await User.get_or_none(session_token=token)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid session")
    return user


def _generate_token() -> str:
    return uuid.uuid4().hex


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(data: UserRegister):
    if await User.get_or_none(username=data.username):
        raise HTTPException(400, "Username already taken")
    if await User.get_or_none(email=data.email):
        raise HTTPException(400, "Email already registered")
    pw_hash = _bcrypt.hashpw(data.password.encode(), _bcrypt.gensalt()).decode()
    user = await User.create(
        username=data.username,
        email=data.email,
        password_hash=pw_hash,
        session_token=_generate_token(),
    )
    return AuthResponse(
        token=user.session_token,
        user=UserOut(id=user.id, username=user.username, email=user.email),
    )


@router.post("/login", response_model=AuthResponse)
async def login(data: UserLogin):
    user = await User.get_or_none(username=data.username)
    if not user or not _bcrypt.checkpw(data.password.encode(), user.password_hash.encode()):
        raise HTTPException(401, "Invalid username or password")
    user.session_token = _generate_token()
    await user.save()
    return AuthResponse(
        token=user.session_token,
        user=UserOut(id=user.id, username=user.username, email=user.email),
    )


@router.delete("/logout", status_code=204)
async def logout(current_user: User = Depends(get_current_user)):
    current_user.session_token = None
    await current_user.save()


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
    )
