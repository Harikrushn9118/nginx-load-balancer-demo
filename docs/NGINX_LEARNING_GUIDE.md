# NGINX Learning Guide: Topic by Topic

This guide breaks down the core concepts of NGINX used in this project, topic by topic, so you can understand exactly what is happening under the hood.

---

## Topic 1: Load Balancing

Load balancing is the process of distributing incoming network traffic across multiple servers. This ensures no single server bears too much demand, improving responsiveness and availability.

In your `nginx.conf`, we define groups of servers (called `upstream` blocks) and NGINX balances traffic among them using different algorithms.

### 1. Round-Robin + Weighted
- **Where we use it:** The `api_backend`
- **How it works:** Requests are sent to each server in order (Server 1, then Server 2, then Server 1...).
- **What "Weighted" adds:** By adding `weight=3` to `api-1`, we tell NGINX to send 3 requests to `api-1` for every 1 request it sends to `api-2`.
- **The Code:**
  ```nginx
  upstream api_backend {
      server api-1:3000 weight=3;
      server api-2:3000 weight=1;
  }
  ```

### 2. IP Hash (Sticky Sessions)
- **Where we use it:** The `auth_backend`
- **How it works:** NGINX looks at the client's IP address and calculates a hash. It uses this hash to assign that IP to a specific server. That client will *always* connect to that exact same server.
- **Why it's useful:** If a user logs in on `auth-1`, their session data might be stored in `auth-1`'s memory. If their next request went to `auth-2`, they would appear logged out. IP Hash prevents this.
- **The Code:**
  ```nginx
  upstream auth_backend {
      ip_hash;
      server auth-1:3000;
      server auth-2:3000;
  }
  ```

### 3. Least Connections + Backup
- **Where we use it:** The `feed_backend`
- **How it works:** NGINX sends the next request to the server that currently has the *fewest active connections*.
- **What "Backup" adds:** By marking `feed-2` as `backup`, NGINX will *never* send traffic to it as long as `feed-1` is working. It's a standby server.
- **The Code:**
  ```nginx
  upstream feed_backend {
      least_conn;
      server feed-1:3000;
      server feed-2:3000 backup;
  }
  ```

---

## Topic 2: Health Checks & Failover

NGINX needs to know if a backend server has crashed so it can stop sending traffic to it.

### Active Monitoring Parameters
We added `max_fails=3` and `fail_timeout=30s` to our upstream servers.
- **What it does:** If NGINX fails to communicate with a server 3 times in a row, it marks that server as "down" for 30 seconds. During those 30 seconds, all traffic is routed to the other healthy servers.

### Auto-Failover Rules
In the `location` blocks, we define *what* counts as a failure.
- **The Code:**
  ```nginx
  proxy_next_upstream error timeout http_502 http_503;
  proxy_next_upstream_tries 2;
  ```
- **What it does:** If NGINX tries to send a request to a backend and gets a connection `error`, a `timeout`, or a 502/503 status, it will seamlessly catch that error and try sending the request to the *next* available server up to 2 times. The client never even notices the first server failed.

---

## Topic 3: Reverse Proxy

A Reverse Proxy sits in front of backend servers and forwards client requests to those servers. The client never talks directly to your Node.js apps; they only talk to NGINX.

### Routing based on Path
In the `server` block, we use `location` directives to tell NGINX where to send traffic based on the URL the client requested.
- **The Code:**
  ```nginx
  location /api/ {
      proxy_pass http://api_backend;
  }
  ```
- **What it does:** When a user visits `http://localhost/api/posts`, NGINX sees the `/api/` path and forwards the request to the `api_backend` load balancing group we defined earlier.

### Passing Headers
When NGINX forwards a request, the backend server thinks the request came *from NGINX's IP address*. We need to pass the real client's information along.
- **The Code:**
  ```nginx
  proxy_set_header X-Real-IP $remote_addr;
  ```
- **What it does:** This injects a header into the request called `X-Real-IP` containing the actual user's IP address, so the backend Node.js app can see who is really making the request.

---

## Topic 4: Security & Safety

We've added a few basic configuration lines to keep the server secure and provide visibility.

### 1. Hiding the NGINX Version
- **The Code:** `server_tokens off;`
- **What it does:** By default, NGINX includes its exact version number in HTTP response headers (e.g., `nginx/1.25.1`). Attackers can use this to look up known vulnerabilities for that specific version. Turning this off just says `nginx`.

### 2. Blocking Hidden Files
- **The Code:**
  ```nginx
  location ~ /\. {
      deny all;
      return 404;
  }
  ```
- **What it does:** This regular expression blocks access to any file or folder starting with a dot (`.`). This prevents attackers from accidentally downloading sensitive files like `.env` (which might contain passwords) or `.git` folders if they were accidentally placed in the web root.

### 3. Custom Logging
- **The Code:**
  ```nginx
  log_format upstream_log '... upstream=$upstream_addr response_time=${upstream_response_time}s';
  ```
- **What it does:** We created a custom log format that includes `$upstream_addr`. When you view the NGINX logs (`docker logs -f nginx-proxy`), you can see the exact internal IP address of the specific backend server (api-1 vs api-2) that handled the request. This is crucial for verifying your load balancer is actually working.
