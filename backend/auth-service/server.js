const http = require("http");
const PORT = 3000;
const SERVICE = "AUTH";
const INSTANCE = process.env.INSTANCE_ID || "1";

function handleRequest(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("X-Served-By", `${SERVICE}-${INSTANCE}`);
  const { url, method } = req;
  console.log(`🔐 [${SERVICE}-${INSTANCE}] ${method} ${url}`);

  if (url === "/auth/login" && method === "POST") {
    return res.end(JSON.stringify({ token: "fake-jwt-abc123", user: "harik" }));
  }
  if (url === "/auth/register" && method === "POST") {
    res.writeHead(201);
    return res.end(JSON.stringify({ message: "User registered", id: 1 }));
  }
  if (url === "/auth/profile" && method === "GET") {
    return res.end(JSON.stringify({ user: "harik", email: "harik@example.com" }));
  }
  if (url === "/auth/health") {
    return res.end(JSON.stringify({ service: SERVICE, instance: INSTANCE, status: "ok" }));
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Not found" }));
}

http.createServer(handleRequest).listen(PORT, () => {
  console.log(`🔐 ${SERVICE}-${INSTANCE} running on port ${PORT}`);
});
