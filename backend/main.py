from fastapi import FastAPI

app = FastAPI(title="Internet Shop API")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
