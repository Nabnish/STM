from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict, Field
from uuid import UUID



class TaskBase(BaseModel):
    title: str
    description: Optional[str] = ""
    priority: Optional[int] = Field(default=2, ge=1, le=3)
    category: Optional[str] = "academic"
    due_date: Optional[date] = None
    completed: Optional[bool] = False

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[int] = None
    category: Optional[str] = None
    due_date: Optional[date] = None
    completed: Optional[bool] = None

class TaskOut(TaskBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    created_at: datetime
    updated_at: datetime

class UserCreate(BaseModel):
    
    name: str
    email: EmailStr
    password: str = Field(min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    email: EmailStr
    created_at: datetime