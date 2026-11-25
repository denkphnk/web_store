# Internet Shop Demo

## Requirements

- Python 3.12 or newer
- Poetry
- Node.js and npm

## Run the backend

```bash
cd backend
poetry install
poetry run uvicorn main:app --reload
```

The API health check is available at http://127.0.0.1:8000/health, and the
interactive API documentation is at http://127.0.0.1:8000/docs.

## Run the frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite prints the local frontend URL when the development server starts.
