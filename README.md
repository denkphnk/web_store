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
poetry run python -m seed_demo
poetry run uvicorn app.main:app --reload
```

The API health check is available at http://127.0.0.1:8000/health, and the
interactive API documentation is at http://127.0.0.1:8000/docs.
The API exposes `GET /api/v1/categories`, `GET /api/v1/filters`,
`GET /api/v1/products`, `GET /api/v1/products/{product_id}`,
`POST /api/v1/cart/validate`, and `POST /api/v1/orders`.

The administration page is available at http://127.0.0.1:5173/admin. Set
`ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_TOKEN_SECRET` in `backend/.env`
before signing in; use a password with at least 12 characters and a random
token secret with at least 32 characters. Admin tokens expire after eight
hours by default. There is no public admin registration.

The local database URL is configured in `backend/.env`. The example file uses
development-only credentials; replace them before using a non-local database.

## Backend layers

- `backend/app/api` — HTTP routes and request/response handling
- `backend/app/services` — business rules and use cases
- `backend/app/repositories` — database queries and persistence
- `backend/app/schemas` — API request/response schemas
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
