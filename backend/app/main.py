from fastapi import FastAPI
from sqlalchemy import text
from . import models, schemas
from .database import engine, SessionLocal, Base
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from uuid import UUID
from .auth import hash_password, verify_password, create_access_token, get_current_user, get_db
from .routers import tasks
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()




app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://stm-7nq9.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(tasks.router)

@app.get("/health")
def root():
    return {"status":"yes good to go"}

@app.get("/test-db")
def test():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        if result.scalar() == 1:
            return{"message":"databse connected"}




@app.post("/api/auth/register", response_model=schemas.UserOut, status_code=201)
def resgister(user: schemas.UserCreate,db: Session = Depends(get_db)):
    exsisting = db.query(models.User).filter(models.User.email == user.email ).first()
    if exsisting:
        raise HTTPException(400, "Already exsisting")
    db_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/api/auth/login")
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user
    