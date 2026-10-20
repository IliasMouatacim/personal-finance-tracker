import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createApi } = require("../server/dist/src/api.js");
const { ObjectId } = require("mongodb");

// Test the real auth, validation, routing and ownership logic against an
// isolated database fixture. MongoDB connectivity is a separate deployment check.
function fixture() {
  const data = { users: [], transactions: [] };
  const matches = (doc, filter) =>
    Object.entries(filter).every(
      ([key, value]) => String(doc[key]) === String(value),
    );
  const db = {
    command: async () => ({ ok: 1 }),
    collection(name) {
      return {
        findOne: async (filter) =>
          data[name].find((doc) => matches(doc, filter)) || null,
        insertOne: async (doc) => {
          const _id = new ObjectId();
          data[name].push({ ...doc, _id });
          return { insertedId: _id };
        },
        deleteOne: async (filter) => {
          const i = data[name].findIndex((doc) => matches(doc, filter));
          if (i < 0) return { deletedCount: 0 };
          data[name].splice(i, 1);
          return { deletedCount: 1 };
        },
        find: (filter) => ({
          sort: () => ({
            toArray: async () =>
              data[name]
                .filter((doc) => matches(doc, filter))
                .sort((a, b) => b.date - a.date),
          }),
        }),
      };
    },
  };
  const api = createApi(async () => db);
  async function request(path, method = "GET", body, token) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    return api(
      new Request(`http://test.local/api${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );
  }
  return { data, request, api };
}
test("registration normalizes email, hashes password, rejects duplicates, and supports login", async () => {
  const { data, request } = fixture();
  const registered = await request("/auth/register", "POST", {
    email: " Alice@Example.com ",
    password: "fixture-password",
  });
  assert.equal(registered.status, 201);
  const account = await registered.json();
  assert.equal(account.email, "alice@example.com");
  assert.ok(account.token);
  assert.notEqual(data.users[0].password, "fixture-password");
  assert.equal(
    (
      await request("/auth/register", "POST", {
        email: "ALICE@example.com",
        password: "fixture-password",
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request("/auth/login", "POST", {
        email: "alice@example.com",
        password: "wrong-password",
      })
    ).status,
    401,
  );
  const login = await request("/auth/login", "POST", {
    email: "ALICE@example.com",
    password: "fixture-password",
  });
  assert.equal(login.status, 200);
  assert.ok((await login.json()).token);
});
test("transaction CRUD and export are isolated by authenticated account", async () => {
  const { request } = fixture();
  const login = async (email) =>
    (
      await (
        await request("/auth/register", "POST", {
          email,
          password: "fixture-password",
        })
      ).json()
    ).token;
  const alice = await login("alice@example.com");
  const bob = await login("bob@example.com");
  assert.equal((await request("/transactions")).status, 401);
  assert.equal(
    (await request("/transactions", "GET", undefined, "invalid-token")).status,
    403,
  );
  const created = await request(
    "/transactions",
    "POST",
    {
      description: '=HYPERLINK("bad")',
      amount: 12.345,
      type: "expense",
      category: "Food",
      date: "2026-10-21",
    },
    alice,
  );
  assert.equal(created.status, 201);
  const tx = await created.json();
  assert.equal(tx.amount, 12.35);
  assert.equal(
    (await (await request("/transactions", "GET", undefined, alice)).json())
      .length,
    1,
  );
  assert.deepEqual(
    await (await request("/transactions", "GET", undefined, bob)).json(),
    [],
  );
  assert.equal(
    (await request(`/transactions/${tx._id}`, "DELETE", undefined, bob)).status,
    404,
  );
  const exported = await request(
    "/transactions/export",
    "GET",
    undefined,
    alice,
  );
  assert.match(exported.headers.get("content-type"), /text\/csv/);
  assert.match(await exported.text(), /"'=HYPERLINK\(""bad""\)"/);
  assert.equal(
    (await request(`/transactions/${tx._id}`, "DELETE", undefined, alice))
      .status,
    200,
  );
  assert.deepEqual(
    await (await request("/transactions", "GET", undefined, alice)).json(),
    [],
  );
});
test("malformed credentials, JSON, amounts and dates return actionable client errors", async () => {
  const { request, api } = fixture();
  assert.equal(
    (
      await request("/auth/register", "POST", {
        email: { $ne: null },
        password: "fixture-password",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/auth/register", "POST", {
        email: "alice@example.com",
        password: "short",
      })
    ).status,
    400,
  );
  const malformed = await api(
    new Request("http://test.local/api/auth/register", {
      method: "POST",
      body: "{",
    }),
  );
  assert.equal(malformed.status, 400);
  const { token } = await (
    await request("/auth/register", "POST", {
      email: "alice@example.com",
      password: "fixture-password",
    })
  ).json();
  for (const overrides of [
    { amount: "12abc" },
    { amount: 0 },
    { amount: 0.001 },
    { description: " " },
    { type: "unknown" },
    { date: "invalid-date" },
  ]) {
    const res = await request(
      "/transactions",
      "POST",
      { description: "Coffee", amount: 4, type: "expense", ...overrides },
      token,
    );
    assert.equal(res.status, 400, JSON.stringify(overrides));
  }
});
test("database failures return safe JSON without exposing connection details", async () => {
  const api = createApi(async () => {
    throw new Error("mongodb://private-host/password");
  });
  const response = await api(new Request("http://test.local/api/health"));
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /private-host|password/);
});
