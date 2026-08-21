from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import os
import json

app = FastAPI()

INSTANCE = os.getenv("INSTANCE_ID", "1")
DB_PATH = "/app/data/db.json"

def get_users():
    if not os.path.exists(DB_PATH):
        return {}
    try:
        with open(DB_PATH, "r") as f:
            return json.load(f)
    except:
        return {}

@app.get("/api/search")
async def search(username: str = ""):
    print(f"📡 [backend-{INSTANCE}] GET /api/search?username={username}")
    username = username.strip()
    
    if not username:
        return {"message": "provide a username to search", "instance": INSTANCE}
        
    users = get_users()
    
    if username in users:
        return {"message": "we have this person", "instance": INSTANCE}
    else:
        return {"message": "not find this", "instance": INSTANCE}

@app.get("/api/health")
async def health():
    return {"instance": INSTANCE, "status": "ok"}
