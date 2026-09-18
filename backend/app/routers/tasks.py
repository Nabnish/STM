from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from .. import models, schemas
from ..auth import get_current_user, get_db

router = APIRouter(prefix="/api/tasks",tags=["tasks"])


@router.post("",response_model=schemas.TaskOut, status_code=201)
def create_task(task: schemas.TaskCreate,db: Session = Depends(get_db),current_user: models.User=Depends(get_current_user)):
    db_task = models.Task(**task.model_dump(), user_id=current_user.id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.get("", response_model=list[schemas.TaskOut])
def display_task(status: str | None = None,
    priority: int | None = None,
    category: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Task).filter(models.Task.user_id == current_user.id)
    if status == "pending":
        query = query.filter(models.Task.completed == False)
    elif status=="completed":
        query = query.filter(models.Task.completed == True)
        
    if category:
        query = query.filter(models.Task.category == category)
    if priority is not None:
        query = query.filter(models.Task.priority == priority)
    if search:
        like = f"%{search}%"
        query = query.filter(or_(models.Task.title.ilike(like), models.Task.description.ilike(like)))
    return query.order_by(models.Task.priority.asc(), models.Task.created_at.desc()).all()



@router.get("/{task_title}", response_model=schemas.TaskOut)
def get_task(task_title: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).filter(models.Task.title == task_title, models.Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(404, "Task not found")
    return task


@router.put("/{task_title}", response_model=schemas.TaskOut)
def update_task(task_title: str, updates: schemas.TaskUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).filter(models.Task.title == task_title, models.Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(404, "Task not found")
    for key, value in updates.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task





@router.delete("/{task_title}", status_code=204)
def delete_task(task_title: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).filter(models.Task.title == task_title, models.Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(404, "Task not found")
    db.delete(task)
    db.commit()

@router.patch("/{task_title}/toggle", response_model=schemas.TaskOut)
def toggle_task(task_title: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).filter(models.Task.title == task_title, models.Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(404, "Task not found")
    task.completed = not task.completed
    db.commit()
    db.refresh(task)
    return task


        

