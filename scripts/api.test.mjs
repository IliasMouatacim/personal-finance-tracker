import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createApi } = require("../server/dist/src/api.js");
const { ObjectId } = require("mongodb");

// Test the real auth, validation, routing and ownership logic against an
// isolated database fixture. MongoDB connectivity is a separate deployment check.
function fixture() {
  const data = { users: [], transactions: [], budgets: [], goals: [] };
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
        updateOne: async (filter, update, options = {}) => {
          let doc = data[name].find((d) => matches(d, filter));
          if (!doc && options.upsert) {
            doc = { ...filter, ...update.$setOnInsert, _id: new ObjectId() };
            data[name].push(doc);
          }
          if (doc) Object.assign(doc, update.$set);
          return { matchedCount: doc ? 1 : 0 };
        },
        findOneAndUpdate: async (filter, update) => {
          const doc = data[name].find((d) => matches(d, filter));
          if (!doc) return null;
          if (update.$set) Object.assign(doc, update.$set);
          for (const [key, value] of Object.entries(update.$inc || {}))
            doc[key] = (doc[key] || 0) + value;
          return { ...doc };
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
test("editing transactions preserves ownership and creation date", async () => {
  const { request, data } = fixture();
  const register = async (email) =>
    (
      await (
        await request("/auth/register", "POST", {
          email,
          password: "fixture-password",
        })
      ).json()
    ).token;
  const alice = await register("alice@example.com"),
    bob = await register("bob@example.com");
  const tx = await (
    await request(
      "/transactions",
      "POST",
      { description: "Coffee", amount: 4, type: "expense" },
      alice,
    )
  ).json();
  const created = data.transactions[0].createdAt;
  const update = {
    description: "Groceries",
    amount: 90,
    type: "expense",
    category: "Food",
    date: "2026-10-01",
  };
  assert.equal(
    (await request(`/transactions/${tx._id}`, "PATCH", update, bob)).status,
    404,
  );
  const changed = await request(
    `/transactions/${tx._id}`,
    "PATCH",
    update,
    alice,
  );
  assert.equal(changed.status, 200);
  assert.equal((await changed.json()).amount, 90);
  assert.equal(data.transactions[0].createdAt, created);
  assert.equal(
    (
      await request(
        `/transactions/${tx._id}`,
        "PATCH",
        { ...update, amount: -1 },
        alice,
      )
    ).status,
    400,
  );
});
test("monthly budgets upsert without duplicates and remain private", async () => {
  const { request } = fixture();
  const register = async (email) =>
    (
      await (
        await request("/auth/register", "POST", {
          email,
          password: "fixture-password",
        })
      ).json()
    ).token;
  const alice = await register("alice@example.com"),
    bob = await register("bob@example.com");
  const payload = { category: "Food", month: "2026-10", limit: 100 };
  const budget = await (
    await request("/budgets", "POST", payload, alice)
  ).json();
  assert.equal(
    (await request("/budgets", "POST", { ...payload, limit: 80 }, alice))
      .status,
    201,
  );
  const list = await (
    await request("/budgets", "GET", undefined, alice)
  ).json();
  assert.equal(list.length, 1);
  assert.equal(list[0].limit, 80);
  assert.deepEqual(
    await (await request("/budgets", "GET", undefined, bob)).json(),
    [],
  );
  assert.equal(
    (await request(`/budgets/${budget._id}`, "DELETE", undefined, bob)).status,
    404,
  );
  assert.equal(
    (await request("/budgets", "POST", { ...payload, month: "2026-13" }, alice))
      .status,
    400,
  );
  assert.equal(
    (await request(`/budgets/${budget._id}`, "DELETE", undefined, alice))
      .status,
    200,
  );
});
test("savings goals record contributions privately without creating transactions", async () => {
  const { request, data } = fixture();
  const register = async (email) =>
    (
      await (
        await request("/auth/register", "POST", {
          email,
          password: "fixture-password",
        })
      ).json()
    ).token;
  const alice = await register("alice@example.com"),
    bob = await register("bob@example.com");
  const goal = await (
    await request("/goals", "POST", { name: "Dream trip", target: 1000 }, alice)
  ).json();
  assert.equal(goal.saved, 0);
  assert.equal(
    (await request(`/goals/${goal._id}`, "PATCH", { contribution: 100 }, bob))
      .status,
    404,
  );
  assert.equal(
    (
      await (
        await request(
          `/goals/${goal._id}`,
          "PATCH",
          { contribution: 100 },
          alice,
        )
      ).json()
    ).saved,
    100,
  );
  assert.equal(
    (await request(`/goals/${goal._id}`, "PATCH", { contribution: -50 }, alice))
      .status,
    400,
  );
  assert.equal(
    (await (await request("/goals", "GET", undefined, alice)).json())[0].saved,
    100,
  );
  assert.equal(data.transactions.length, 0);
  assert.deepEqual(
    await (await request("/goals", "GET", undefined, bob)).json(),
    [],
  );
  assert.equal(
    (await request(`/goals/${goal._id}`, "DELETE", undefined, bob)).status,
    404,
  );
  assert.equal(
    (await request(`/goals/${goal._id}`, "DELETE", undefined, alice)).status,
    200,
  );
});
