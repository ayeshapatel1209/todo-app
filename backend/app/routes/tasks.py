from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import schemas, crud, models
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.post("", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(task: schemas.TaskCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.create_task(db, task, current_user.id)

@router.get("", response_model=List[schemas.TaskResponse])
def get_tasks(skip: int = 0, limit: int = 100, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.get_tasks(db, current_user.id, skip, limit)

@router.get("/{task_id}", response_model=schemas.TaskResponse)
def get_task(task_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = crud.get_task(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task

@router.put("/{task_id}", response_model=schemas.TaskResponse)
def update_task(task_id: int, task_update: schemas.TaskUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = crud.update_task(db, task_id, current_user.id, task_update)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task

@router.delete("/{task_id}", response_model=schemas.Message)
def delete_task(task_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    success = crud.delete_task(db, task_id, current_user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return {"message": "Task deleted successfully"}