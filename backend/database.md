# Database Setup

STM uses **PostgreSQL** as its relational database and **SQLAlchemy** as the ORM.

The database connection is configured through the `DATABASE_URL` environment variable. The backend loads this value using `python-dotenv`.

## 1. Install PostgreSQL

Install PostgreSQL locally and make sure the PostgreSQL server is running.

Create a database:

```sql
CREATE DATABASE stm;
```

## 2. Configure Environment Variables

Inside the `backend` directory, create a `.env` file:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/stm
SECRET_KEY=your-secret-key
```

Replace:

* `username` with your PostgreSQL username
* `password` with your PostgreSQL password
* `stm` with the database name if you use a different name

The application reads `DATABASE_URL` and passes it to SQLAlchemy's database engine.

## 3. Database Schema

### Users

The `users` table contains:

| Column          | Type     | Description           |
| --------------- | -------- | --------------------- |
| `id`            | UUID     | Primary key           |
| `name`          | VARCHAR  | User name             |
| `email`         | VARCHAR  | Unique user email     |
| `password_hash` | VARCHAR  | bcrypt password hash  |
| `created_at`    | DATETIME | Account creation time |

### Tasks

The `tasks` table contains:

| Column        | Type     | Description       |
| ------------- | -------- | ----------------- |
| `id`          | UUID     | Primary key       |
| `user_id`     | UUID     | Owner of the task |
| `title`       | VARCHAR  | Task title        |
| `description` | TEXT     | Task description  |
| `priority`    | INTEGER  | Task priority     |
| `category`    | VARCHAR  | Task category     |
| `due_date`    | DATE     | Optional deadline |
| `completed`   | BOOLEAN  | Completion status |
| `created_at`  | DATETIME | Creation time     |
| `updated_at`  | DATETIME | Last update time  |

The `user_id` column references `users.id` with cascading deletion. Each user therefore owns a collection of tasks.

## 4. Database Relationship

```text
Users
  │
  │ 1
  │
  │
  │ N
Tasks
```

A single user can have multiple tasks.

```text
users.id
    ↓
tasks.user_id
```

## 5. Authentication and Database Access

Passwords are never stored directly. During registration, the password is converted into a bcrypt hash before being stored. During login, the submitted password is verified against the stored hash.

After successful authentication, the backend creates a JWT containing the user's ID.

Protected task endpoints retrieve the authenticated user from the JWT and use that user's ID when querying tasks.

This provides user-level data isolation.

## 6. Testing the Database Connection

The backend provides:

```text
GET /test-db
```

A successful response confirms that the application can connect to PostgreSQL.
