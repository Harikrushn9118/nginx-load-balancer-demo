# NGINX Load Balancer Demo

This is a simple demo I built to learn how NGINX works as a reverse proxy and load balancer. I set up a bunch of Python containers behind it, and they all share a single database file using a Docker volume. 

The frontend is a super simple HTML page served by NGINX that lets you register a user or search for one.

## How it works

```text
User → NGINX (Port 80)
          │
          ├── /auth/register   → Auth Service (3 containers)
          │                      (Uses sticky sessions / ip_hash)
          │
          └── /api/search      → Backend Service (6 containers)
                                 (Uses least connections / least_conn)
```

The cool part is that I didn't set up Postgres or Redis. Instead, all 9 Python containers mount the same Docker Volume to `/app/data`. When you register a user on the Auth service, it writes to `/app/data/db.json`. When you search on the Backend service, it instantly reads that exact same `db.json` file. 

## Tech Stack
- **Proxy:** NGINX
- **Backend:** FastAPI (Python)
- **Frontend:** Vanilla HTML/JS/CSS
- **Database:** A shared JSON file mapped via Docker Volumes
- **Deployment:** Docker Compose

## Setup Instructions

If you want to run this yourself, make sure you have Docker and Docker Compose installed.

1. Start all 10 containers (plus the shared volume):
```bash
docker-compose up --build -d
```

2. Open your browser and go to:
```
http://localhost
```

3. Try registering a user, then try searching for that user. It proves that the Auth containers and the Backend containers are sharing the same state!

## Viewing Logs
If you want to see which specific container handled your request, you can check the logs for that container:
```bash
docker logs auth-1
docker logs backend-3
```
