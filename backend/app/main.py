from fastapi import FastAPI
from sqlalchemy import text
import models, schemas
from database import engine, SessionLocal, Base
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_


app = FastAPI();

@app.get("/health")
def root():
    return {"status":"yes good to go"}

@app.get("/test-db")
def test():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        if result.scalar() == 1:
            return{"message":"databse connected"}


def get_db():
    db = SessionLocal()
    try:
        yield db 
    finally:
        db.close()
