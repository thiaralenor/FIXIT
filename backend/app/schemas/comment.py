from pydantic import BaseModel, Field


class CommentCreate(BaseModel):
    comment: str = Field(
        min_length=1,
        max_length=1000
    )


class CommentUpdate(BaseModel):
    comment: str = Field(
        min_length=1,
        max_length=1000
    )