from sqlalchemy.orm import Session
from typing import List, Optional
from app import models, schemas
from app.auth import hash_password, verify_password

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_password = hash_password(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_id(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def authenticate_user(db: Session, email: str, password: str) -> Optional[models.User]:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def create_task(db: Session, task: schemas.TaskCreate, user_id: int) -> models.Task:
    db_task = models.Task(title=task.title, description=task.description, owner_id=user_id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def get_tasks(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[models.Task]:
    return db.query(models.Task).filter(models.Task.owner_id == user_id).offset(skip).limit(limit).all()

def get_task(db: Session, task_id: int, user_id: int) -> Optional[models.Task]:
    return db.query(models.Task).filter(models.Task.id == task_id, models.Task.owner_id == user_id).first()

def update_task(db: Session, task_id: int, user_id: int, task_update: schemas.TaskUpdate) -> Optional[models.Task]:
    db_task = get_task(db, task_id, user_id)
    if not db_task:
        return None
    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
    db.commit()
    db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: int, user_id: int) -> bool:
    db_task = get_task(db, task_id, user_id)
    if not db_task:
        return False
    db.delete(db_task)
    db.commit()
    return True