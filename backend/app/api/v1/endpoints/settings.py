import json
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, UserSettings
from app.schemas.common import ApiResponse
from app.schemas.dtos import UserSettingsDto, UpdateUserSettingsDto

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=ApiResponse)
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(UserSettings).where(UserSettings.user_id == current_user.id)
    result = await db.execute(stmt)
    settings_obj = result.scalars().first()
    if not settings_obj:
        settings_obj = UserSettings(user_id=current_user.id)
        db.add(settings_obj)
        await db.commit()
        await db.refresh(settings_obj)

    try:
        search_history = json.loads(settings_obj.search_history_json or "[]")
    except Exception:
        search_history = []

    dto = UserSettingsDto(
        theme=settings_obj.theme,
        audioQuality=settings_obj.audio_quality,
        autoplay=settings_obj.autoplay,
        volume=settings_obj.volume,
        searchHistory=search_history
    )
    return ApiResponse(success=True, data=dto.model_dump())


@router.put("", response_model=ApiResponse)
async def update_settings(
    dto: UpdateUserSettingsDto,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(UserSettings).where(UserSettings.user_id == current_user.id)
    result = await db.execute(stmt)
    settings_obj = result.scalars().first()
    if not settings_obj:
        settings_obj = UserSettings(user_id=current_user.id)
        db.add(settings_obj)

    if dto.theme is not None:
        settings_obj.theme = dto.theme
    if dto.audioQuality is not None:
        settings_obj.audio_quality = dto.audioQuality
    if dto.autoplay is not None:
        settings_obj.autoplay = dto.autoplay
    if dto.volume is not None:
        settings_obj.volume = dto.volume
    if dto.searchHistory is not None:
        settings_obj.search_history_json = json.dumps(dto.searchHistory[:20])

    await db.commit()
    await db.refresh(settings_obj)

    try:
        search_history = json.loads(settings_obj.search_history_json or "[]")
    except Exception:
        search_history = []

    res_dto = UserSettingsDto(
        theme=settings_obj.theme,
        audioQuality=settings_obj.audio_quality,
        autoplay=settings_obj.autoplay,
        volume=settings_obj.volume,
        searchHistory=search_history
    )
    return ApiResponse(success=True, data=res_dto.model_dump())
