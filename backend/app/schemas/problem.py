from typing import Optional

from pydantic import BaseModel


class ProblemCreate(BaseModel):
    title: str
    description: str
    category_id: Optional[str] = None
    priority: str = "medium"
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    people_affected: Optional[int] = None
    is_public: bool = True


class ProblemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    people_affected: Optional[int] = None
    is_public: Optional[bool] = None