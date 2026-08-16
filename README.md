# NGINX Load Balancer Demo

NGINX reverse proxy setup with Docker Compose, load balancing traffic across multiple backend instances.

## Architecture

```
Client → NGINX (port 80)
              │
              ├── /api/*          → backend (6 instances, least_conn)
              ├── /api/secure-posts → backend → internally calls auth service
              └── /auth/*         → auth (3 instances, ip_hash)
```

## What's Running

| Component | Instances | Load Balancing | Route |
|-----------|-----------|---------------|-------|
| NGINX Proxy | 1 | — | Port 80 (entry point) |
| API Service | 6 | `least_conn` (picks least busy server) | `/api/*` |
| Auth Service | 3 | `ip_hash` (sticky sessions per client IP) | `/auth/*` |
| Static Files | served by NGINX directly | — | `/` |

Total: **10 containers** (1 NGINX + 6 backend + 3 auth)

## Inter-Service Communication

The backend service communicates with the auth service internally through Docker networking. When a request hits `/api/secure-posts`, the backend container calls `auth-1:3000/auth/profile` to verify the user before returning posts. This is container-to-container communication that bypasses NGINX.

## Features Configured

- **Load Balancing** — Two different algorithms across two service clusters
- **Reverse Proxy** — Path-based routing to separate upstream groups
- **Auto-Failover** — If a backend fails, NGINX retries the next healthy server automatically (`proxy_next_upstream`)
- **Health Monitoring** — Servers marked down after 3 consecutive failures, re-checked after 30s (`max_fails=3`, `fail_timeout=30s`)
- **Inter-Service Communication** — Backend containers call auth containers directly through Docker network
- **Keepalive Connections** — Persistent connections between NGINX and backends for lower latency
- **Hidden File Blocking** — Requests to `/.env`, `/.git`, etc. are denied with 404
- **Version Hiding** — `server_tokens off` prevents NGINX version from leaking in response headers
- **Custom Access Logs** — Logs include `$upstream_addr` and `$upstream_response_time` to verify which backend handled each request

## Setup

### Prerequisites
- Docker
- Docker Compose

### Run
```bash
docker-compose up --build
```

### Verify
```bash
curl http://localhost/health              # NGINX status
curl http://localhost/api/health          # API cluster
curl http://localhost/auth/health         # Auth cluster
curl http://localhost/api/secure-posts    # Backend → Auth inter-service call
```

### Monitor Traffic Distribution
```bash
docker logs -f nginx-proxy
```
Each log line shows which backend IP handled the request, so you can confirm load balancing is working.
