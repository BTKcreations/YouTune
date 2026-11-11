from typing import List, Optional, Any
from pydantic import BaseModel, Field


class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int
    totalPages: int
    nextPageToken: Optional[str] = None


class ApiResponse(BaseModel):
    success: bool = True
    data: Any
    message: Optional[str] = None
    pagination: Optional[PaginationMeta] = None


class ApiErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None


class ApiErrorResponse(BaseModel):
    success: bool = False
    error: ApiErrorDetail
