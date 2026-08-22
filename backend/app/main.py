from fastapi import FastAPI

from app.routes import (
    auth,
    problems,
    tasks,
    comments,
    notifications
)


app = FastAPI(
    title="FixIt API",
    description="Backend API for the FixIt community problem reporting platform",
    version="1.0.0"
)


app.include_router(auth.router)
app.include_router(problems.router)
app.include_router(tasks.router)
app.include_router(comments.router)
app.include_router(notifications.router)


@app.get("/")
def root():
    return {
        "message": "FixIt API is running"
    }