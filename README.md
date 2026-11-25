# Internet Shop Demo

## Requirements

- Python 3.12 or newer
- Poetry
- Node.js and npm
- Docker Compose

## Start PostgreSQL and the backend

```bash
docker compose up -d db
cd backend
cp .env.example .env
poetry install
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload
```

The API health check is available at http://127.0.0.1:8000/health, and the
interactive API documentation is at http://127.0.0.1:8000/docs.

The local database URL is configured in `backend/.env`. The example file uses
development-only credentials; replace them before using a non-local database.

## Backend layers

- `backend/app/api` — HTTP routes and request/response handling
- `backend/app/services` — business rules and use cases
- `backend/app/repositories` — database queries and persistence
- `backend/app/models` — SQLAlchemy entities
- `backend/app/core` — application configuration and database session

To create a migration after changing models:

```bash
cd backend
poetry run alembic revision --autogenerate -m "describe the schema change"
```

## Run the frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite prints the local frontend URL when the development server starts.
