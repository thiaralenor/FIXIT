from typing import Optional

from pydantic import BaseModel


class TaskCreate(BaseModel):
    problem_id: str


class TaskUpdate(BaseModel):
    status: Optional[str] = None