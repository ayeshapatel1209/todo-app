from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app import models
from app.database import engine
from app.routes import auth, tasks

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Task Management System", description="A secure task management API with JWT authentication", version="1.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/", tags=["Health"])
def read_root():
    return {"status": "healthy", "message": "Task Management API is running"}

# Include routers
app.include_router(auth.router)
app.include_router(tasks.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)