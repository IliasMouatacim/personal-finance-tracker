import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";

let upstream, configured, unconfigured;
let lastRequest;
let mode = "json";
async function listen(server) {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return server.address().port;
}
async function startFrontend(backend) {
  const reservation = http.createServer();
  const port = await listen(reservation);
  await new Promise((resolve) => reservation.close(resolve));
  const env = { ...process.env, NODE_ENV: "production" };
  delete env.NEXT_PUBLIC_API_URL;
  delete env.API_SERVER_URL;
  delete env.MONGODB_URI;
  delete env.JWT_SECRET;
  if (backend) env.API_SERVER_URL = backend;
  const child = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    { env, stdio: ["ignore", "pipe", "pipe"] },
  );
  let log = "";
  child.stdout.on("data", (chunk) => {
    log += chunk;
  });
  child.stderr.on("data", (chunk) => {
    log += chunk;
  });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error(`Frontend failed: ${log}`);
    try {
      if ((await fetch(base)).ok) return { child, base };
    } catch {
      /* Wait for startup. */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  child.kill();
  throw new Error(`Frontend startup timed out: ${log}`);
}
async function stop(instance) {
  if (!instance || instance.child.exitCode !== null) return;
  await new Promise((resolve) => {
    instance.child.once("exit", resolve);
    instance.child.kill();
  });
}
before(async () => {
  upstream = http.createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    lastRequest = {
      method: req.method,
      url: req.url,
      token: req.headers.authorization,
      body,
    };
    if (mode === "html") {
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end("<html>The page could not be found</html>");
      return;
    }
    if (mode === "error") {
      res.writeHead(409, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ error: "An account with this email already exists." }),
      );
      return;
    }
    if (req.url.endsWith("/export")) {
      res.writeHead(200, {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="transactions.csv"',
      });
      res.end("Date,Description,Category,Type,Amount\n");
      return;
    }
    res.writeHead(req.method === "POST" ? 201 : 200, {
      "Content-Type": "application/json",
    });
    res.end(JSON.stringify({ status: "ok" }));
  });
  const port = await listen(upstream);
  configured = await startFrontend(`http://127.0.0.1:${port}`);
  unconfigured = await startFrontend();
});
after(async () => {
  await Promise.all([stop(configured), stop(unconfigured)]);
  if (upstream?.listening)
    await new Promise((resolve) => upstream.close(resolve));
});
test("built-in backend reports missing production database as JSON", async () => {
  const res = await fetch(`${unconfigured.base}/api/health`);
  assert.equal(res.status, 503);
  assert.match((await res.json()).error, /database is not configured/);
});
test("runtime backend configuration forwards JSON, method, path and authorization", async () => {
  const res = await fetch(`${configured.base}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer test-fixture",
    },
    body: JSON.stringify({
      email: "test@example.com",
      password: "fixture-only",
    }),
  });
  assert.equal(res.status, 201);
  assert.deepEqual(await res.json(), { status: "ok" });
  assert.equal(lastRequest.method, "POST");
  assert.equal(lastRequest.url, "/api/auth/register");
  assert.equal(lastRequest.token, "Bearer test-fixture");
  assert.equal(JSON.parse(lastRequest.body).email, "test@example.com");
});
test("HTML upstream failures become safe JSON errors", async () => {
  mode = "html";
  try {
    const res = await fetch(`${configured.base}/api/health`);
    assert.equal(res.status, 502);
    assert.match((await res.json()).error, /temporarily unavailable/);
  } finally {
    mode = "json";
  }
});
test("backend validation errors retain their status and message", async () => {
  mode = "error";
  try {
    const res = await fetch(`${configured.base}/api/auth/register`, {
      method: "POST",
      body: "{}",
    });
    assert.equal(res.status, 409);
    assert.match((await res.json()).error, /already exists/);
  } finally {
    mode = "json";
  }
});
test("CSV downloads preserve content and filename", async () => {
  const res = await fetch(`${configured.base}/api/transactions/export`);
  assert.match(res.headers.get("content-type"), /text\/csv/);
  assert.match(res.headers.get("content-disposition"), /transactions.csv/);
  assert.match(await res.text(), /^Date,Description/);
});
test("unreachable backend returns JSON 502", async () => {
  await new Promise((resolve) => upstream.close(resolve));
  const res = await fetch(`${configured.base}/api/health`);
  assert.equal(res.status, 502);
  assert.match((await res.json()).error, /Unable to reach/);
});
