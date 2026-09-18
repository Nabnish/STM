# STM — Student Task Manager

STM is a full-stack student task management application designed to help students organize, track, and manage their academic and personal tasks.

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Motion
* Lucide React

### Backend

* FastAPI
* Python
* SQLAlchemy
* PostgreSQL
* JWT Authentication
* bcrypt

## Features

* User registration and login
* JWT-based authentication
* Create, update and delete tasks
* Mark tasks as completed
* Task priority and categories
* Due dates
* Search tasks
* Filter by status, priority and category
* User-specific task management
* Responsive frontend interface

## Project Structure

```text
STM/
├── backend/
│   └── app/
│       ├── auth.py
│       ├── database.py
│       ├── main.py
│       ├── models.py
│       ├── schemas.py
│       └── routers/
│           └── tasks.py
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── package.json
└── README.md
```

## Running the Project

### 1. Clone the repository

```bash
git clone https://github.com/Nabnish/STM.git
cd STM
```

### 2. Set up the backend

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:

**Windows**

```bash
venv\Scripts\activate
```

Install the backend dependencies:

```bash
pip install fastapi uvicorn sqlalchemy psycopg2-binary python-dotenv python-jose bcrypt
```

Create a `.env` file:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/stm
SECRET_KEY=your-secret-key
```

Start the FastAPI server:

```bash
uvicorn app.main:app --reload
```

The backend will run on:

```text
http://localhost:8000
```

### Deploying the backend to Vercel

Set the Vercel project Root Directory to `backend`. Add these Environment Variables to the Vercel project before redeploying:

```env
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
SECRET_KEY=replace-with-a-long-random-production-secret
```

`DATABASE_URL` must point to a hosted PostgreSQL database. A local `localhost` database URL only works during local development and will cause a Vercel Function Invocation Error.

API documentation:

```text
http://localhost:8000/docs
```

### 3. Set up the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on the Vite development server.

## API

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Tasks

```text
POST   /api/tasks
GET    /api/tasks
GET    /api/tasks/{task_title}
PUT    /api/tasks/{task_title}
DELETE /api/tasks/{task_title}
PATCH  /api/tasks/{task_title}/toggle
```

The backend automatically associates tasks with the authenticated user, preventing users from accessing another user's tasks.

## Database

STM uses PostgreSQL with SQLAlchemy as the ORM.

The main tables are:

* `users`
* `tasks`

See [`DATABASE.md`](DATABASE.md) for database setup and schema details.
