from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.core.deps import get_current_user
from app.core.config import settings
from app.models.models import User, UserSettings
from app.schemas.common import ApiResponse, ApiErrorResponse
from app.schemas.dtos import (
    RegisterRequest,
    LoginRequest,
    RefreshTokenRequest,
    UserProfile,
    AuthTokens,
    AuthData,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def user_to_profile(user: User) -> UserProfile:
    return UserProfile(
        id=user.id,
        email=user.email,
        username=user.username,
        avatarUrl=user.avatar_url,
        createdAt=user.created_at.isoformat() if user.created_at else "",
    )


@router.post("/register", response_model=ApiResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if email already exists
    existing = await db.execute(select(User).where(User.email == req.email.lower().strip()))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )
    
    hashed_pwd = get_password_hash(req.password)
    new_user = User(
        email=req.email.lower().strip(),
        username=req.username.strip(),
        password_hash=hashed_pwd,
        avatar_url=f"https://api.dicebear.com/7.x/identicon/svg?seed={req.username.strip()}"
    )
    db.add(new_user)
    await db.flush()

    # Create default settings
    user_settings = UserSettings(user_id=new_user.id)
    db.add(user_settings)
    await db.commit()
    await db.refresh(new_user)

    access_token = create_access_token(new_user.id)
    refresh_token = create_refresh_token(new_user.id)

    auth_data = AuthData(
        user=user_to_profile(new_user),
        tokens=AuthTokens(
            accessToken=access_token,
            refreshToken=refresh_token,
            expiresIn=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
    )
    return ApiResponse(success=True, data=auth_data.model_dump())


@router.post("/login", response_model=ApiResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email.lower().strip()))
    user = result.scalars().first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    auth_data = AuthData(
        user=user_to_profile(user),
        tokens=AuthTokens(
            accessToken=access_token,
            refreshToken=refresh_token,
            expiresIn=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
    )
    return ApiResponse(success=True, data=auth_data.model_dump())


@router.post("/refresh", response_model=ApiResponse)
async def refresh_token_endpoint(req: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(req.refreshToken)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token."
        )
    
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    access_token = create_access_token(user.id)
    new_refresh = create_refresh_token(user.id)

    tokens = AuthTokens(
        accessToken=access_token,
        refreshToken=new_refresh,
        expiresIn=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return ApiResponse(success=True, data={"tokens": tokens.model_dump()})


@router.get("/me", response_model=ApiResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return ApiResponse(success=True, data=user_to_profile(current_user).model_dump())
