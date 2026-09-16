from fastapi import FastAPI
from sqlalchemy import text

from app.database import engine

app = FastAPI();

@app.get("/")
def root():
    return {"status":"yes good to go"}

@app.get("/test-db")
def test():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        return {"result": result.scalar()}
