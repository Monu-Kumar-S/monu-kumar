from fastapi import FastAPI
import requests

app = FastAPI()

@app.get("/health")
def health():
    return [
        {"name": "VS_APP_1", "status": "UP", "latency": 120},
        {"name": "VS_APP_2", "status": "DOWN", "latency": 0}
    ]
