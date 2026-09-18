# Architecture & Development Approach

## Architecture

STM follows a client-server architecture with a React frontend communicating with a FastAPI backend through REST APIs.

```text
┌──────────────────────────┐
│      React Frontend      │
│   TypeScript + Vite      │
│   Tailwind + Motion      │
└────────────┬─────────────┘
             │
             │ HTTP / REST API
             ▼
┌──────────────────────────┐
│      FastAPI Backend     │
│                          │
│  Authentication          │
│  Task APIs               │
│  Validation              │
│  Authorization           │
└────────────┬─────────────┘
             │
             │ SQLAlchemy
             ▼
┌──────────────────────────┐
│       PostgreSQL         │
│                          │
│  Users                   │
│  Tasks                   │
└──────────────────────────┘
```

The backend is divided into separate responsibilities:

* `main.py` — application initialization and authentication endpoints
* `database.py` — database connection and SQLAlchemy configuration
* `models.py` — database models
* `schemas.py` — request and response validation
* `auth.py` — password hashing and JWT authentication
* `routers/tasks.py` — task-related API endpoints

The task router uses the authenticated user's ID when creating and querying tasks, ensuring that task data remains associated with its owner.

## Authentication Approach

The application uses JWT-based authentication.

```text
Register
   ↓
Password → bcrypt hash
   ↓
Store user
   ↓
Login
   ↓
Verify password
   ↓
Generate JWT
   ↓
Frontend sends Bearer token
   ↓
Backend validates token
   ↓
Identify current user
```

Passwords are hashed with bcrypt and are not stored as plaintext. JWTs are used to identify the authenticated user on protected API requests.

## Task Management Approach

Tasks are associated with users through a foreign-key relationship.

When a task is created, the backend does not rely on the client to provide the owner. Instead, it obtains the authenticated user from the JWT and assigns that user's ID to the task.

For task retrieval, filtering is performed at the database query level using:

* completion status
* priority
* category
* text search

The API then orders results by priority and creation time.

## Development Approach

Development was iterative and focused on understanding the existing codebase, implementing features incrementally, and debugging issues as they appeared.

**Claude** was used primarily for:

* Understanding unfamiliar concepts
* Discussing architecture and implementation choices
* Breaking larger features into smaller tasks
* Debugging and reasoning through backend/frontend issues
* Reviewing approaches before implementation

**OpenAI Codex** was used as a coding assistant for:

* Exploring the repository
* Working with existing code
* Implementing and modifying code
* Debugging implementation issues
* Checking how different components fit together

The AI tools were used as development assistants rather than as a replacement for understanding the implementation. Changes were reviewed and tested against the project's existing architecture.

## Design Principle

The project was built around keeping the frontend, backend, authentication, and database responsibilities separated.

This makes individual parts easier to develop and debug while allowing the application to grow without putting all application logic into a single file or layer.
