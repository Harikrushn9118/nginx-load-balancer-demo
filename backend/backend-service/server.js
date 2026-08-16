const http = require("http");
const PORT = 3000;
const INSTANCE = process.env.INSTANCE_ID || "1";

const posts = [
  { id: 1, user: "harik", text: "Hello world!", likes: 42 },
  { id: 2, user: "john", text: "Learning NGINX 🚀", likes: 100 },
  { id: 3, user: "alice", text: "Docker is great", likes: 78 },
];

function handleRequest(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("X-Served-By", `backend-${INSTANCE}`);
  const { url, method } = req;
  console.log(`📡 [backend-${INSTANCE}] ${method} ${url}`);

  if (url === "/api/posts" && method === "GET") {
    return res.end(JSON.stringify({ instance: INSTANCE, posts }));
  }
  if (url === "/api/posts" && method === "POST") {
    res.writeHead(201);
    return res.end(JSON.stringify({ instance: INSTANCE, message: "Post created", id: posts.length + 1 }));
  }
  if (url === "/api/health") {
    return res.end(JSON.stringify({ instance: INSTANCE, status: "ok" }));
  }
  if (url === "/api/slow") {
    return setTimeout(() => {
      res.end(JSON.stringify({ instance: INSTANCE, message: "Slow response (2s delay)" }));
    }, 2000);
  }

  // Backend talks to Auth service internally (container-to-container communication)
  if (url === "/api/secure-posts" && method === "GET") {
    console.log(`📡 [backend-${INSTANCE}] Calling auth service to verify user...`);

    const authReq = http.request(
      { hostname: "auth-1", port: 3000, path: "/auth/profile", method: "GET" },
      (authRes) => {
        let data = "";
        authRes.on("data", (chunk) => (data += chunk));
        authRes.on("end", () => {
          const user = JSON.parse(data);
          console.log(`📡 [backend-${INSTANCE}] Auth verified: ${user.user}`);
          res.end(JSON.stringify({
            instance: INSTANCE,
            verified_by: "auth-1",
            user: user.user,
            posts
          }));
        });
      }
    );
    authReq.on("error", (err) => {
      res.writeHead(503);
      res.end(JSON.stringify({ error: "Auth service unavailable", details: err.message }));
    });
    authReq.end();
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Not found" }));
}

http.createServer(handleRequest).listen(PORT, () => {
  console.log(`📡 backend-${INSTANCE} running on port ${PORT}`);
});
