import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ObjectId, Db } from "mongodb";
import connectDB from "./db";

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
async function body(request: Request): Promise<Record<string, unknown>> {
  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > 16_384)
    throw new HttpError(413, "Request body is too large.");
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw new Error();
    return data as Record<string, unknown>;
  } catch {
    throw new HttpError(400, "Provide a valid JSON object.");
  }
}
function signingKey() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production")
    throw new HttpError(
      503,
      "Account security is not configured. Please contact the site owner.",
    );
  return "financetracker_jwt_secret_dev_key_2026";
}
function userId(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer "))
    throw new HttpError(401, "Please sign in to continue.");
  const key = signingKey();
  try {
    const claims = jwt.verify(authorization.slice(7), key, {
      algorithms: ["HS256"],
    });
    if (
      typeof claims === "string" ||
      typeof claims.userId !== "string" ||
      !ObjectId.isValid(claims.userId)
    )
      throw new Error();
    return claims.userId;
  } catch {
    throw new HttpError(403, "Your session has expired. Please sign in again.");
  }
}
function credentials(data: Record<string, unknown>) {
  const email =
    typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const password = data.password;
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254 ||
    typeof password !== "string" ||
    !password ||
    Buffer.byteLength(password, "utf8") > 72
  )
    throw new HttpError(
      400,
      "Enter a valid email and a password of at most 72 bytes.",
    );
  return { email, password };
}
function escapeCSV(value: unknown) {
  const text = String(value);
  const safe = /^(?:\s*[=+@-]|[\t\r\n])/.test(text) ? "'" + text : text;
  return `"${safe.replace(/"/g, '""')}"`;
}
export function createApi(database: () => Promise<Db> = connectDB) {
  return async function handleApi(request: Request): Promise<Response> {
    try {
      const path = new URL(request.url).pathname.replace(/\/$/, "");
      const method = request.method;
      if (path === "/api/health" && method === "GET") {
        const db = await database();
        await db.command({ ping: 1 });
        return json({ status: "ok" });
      }
      if (
        ["/api/auth/register", "/api/auth/login"].includes(path) &&
        method === "POST"
      ) {
        const { email, password } = credentials(await body(request));
        const key = signingKey();
        if (path.endsWith("/register") && password.length < 6)
          throw new HttpError(400, "Password must be at least 6 characters.");
        const users = (await database()).collection("users");
        const existing = await users.findOne({ email });
        if (path.endsWith("/register")) {
          if (existing)
            throw new HttpError(
              409,
              "An account with this email already exists.",
            );
          const result = await users.insertOne({
            email,
            password: await bcrypt.hash(password, 12),
            createdAt: new Date(),
          });
          return json(
            {
              token: jwt.sign({ userId: result.insertedId.toString() }, key, {
                expiresIn: "7d",
              }),
              email,
            },
            201,
          );
        }
        if (
          !existing ||
          !(await bcrypt.compare(password, existing.password as string))
        )
          throw new HttpError(401, "Invalid email or password.");
        return json({
          token: jwt.sign({ userId: existing._id.toString() }, key, {
            expiresIn: "7d",
          }),
          email: existing.email,
        });
      }
      if (
        path === "/api/transactions" ||
        path === "/api/transactions/export" ||
        /^\/api\/transactions\/[^/]+$/.test(path)
      ) {
        const id = userId(request);
        if (path === "/api/transactions" && method === "POST") {
          const { description, amount, type, category, date } =
            await body(request);
          if (
            typeof description !== "string" ||
            !description.trim() ||
            description.trim().length > 200
          )
            throw new HttpError(
              400,
              "Description must contain between 1 and 200 characters.",
            );
          if (type !== "income" && type !== "expense")
            throw new HttpError(400, "Type must be income or expense.");
          const parsed =
            typeof amount === "number"
              ? amount
              : typeof amount === "string" && amount.trim()
                ? Number(amount)
                : NaN;
          if (!Number.isFinite(parsed) || parsed < 0.01 || parsed > 1e12)
            throw new HttpError(
              400,
              "Amount must be a positive number of at least $0.01.",
            );
          if (
            category !== undefined &&
            (typeof category !== "string" || category.length > 80)
          )
            throw new HttpError(400, "Provide a valid category.");
          if (
            date !== undefined &&
            (typeof date !== "string" || !Number.isFinite(Date.parse(date)))
          )
            throw new HttpError(400, "Provide a valid date.");
          const transactions = (await database()).collection("transactions");
          const doc = {
            userId: id,
            description: description.trim(),
            amount: Math.round((parsed + Number.EPSILON) * 100) / 100,
            type,
            category: category || "Other",
            date: date ? new Date(date as string) : new Date(),
            createdAt: new Date(),
          };
          const result = await transactions.insertOne(doc);
          return json({ ...doc, _id: result.insertedId }, 201);
        }
        if (path === "/api/transactions" && method === "GET") {
          const rows = await (
            await database()
          )
            .collection("transactions")
            .find({ userId: id })
            .sort({ date: -1 })
            .toArray();
          return json(rows);
        }
        if (path === "/api/transactions/export" && method === "GET") {
          const rows = await (
            await database()
          )
            .collection("transactions")
            .find({ userId: id })
            .sort({ date: -1 })
            .toArray();
          const csv =
            "Date,Description,Category,Type,Amount\n" +
            rows
              .map(
                (t) =>
                  `${new Date(t.date as Date).toISOString().slice(0, 10)},${escapeCSV(t.description)},${escapeCSV(t.category)},${t.type},${Number(t.amount).toFixed(2)}`,
              )
              .join("\n");
          return new Response(csv, {
            headers: {
              "Content-Type": "text/csv; charset=utf-8",
              "Content-Disposition": 'attachment; filename="transactions.csv"',
              "Cache-Control": "no-store",
            },
          });
        }
        if (
          method === "DELETE" &&
          /^\/api\/transactions\/[^/]+$/.test(path) &&
          path !== "/api/transactions/export"
        ) {
          const transactionId = path.split("/").at(-1)!;
          if (!ObjectId.isValid(transactionId))
            throw new HttpError(400, "Invalid transaction ID.");
          const result = await (
            await database()
          )
            .collection("transactions")
            .deleteOne({ _id: new ObjectId(transactionId), userId: id });
          if (!result.deletedCount)
            throw new HttpError(404, "Transaction not found.");
          return json({ message: "Transaction deleted." });
        }
      }
      return json({ error: "API endpoint not found." }, 404);
    } catch (error) {
      if (error instanceof HttpError)
        return json({ error: error.message }, error.status);
      if (error instanceof Error && error.message === "DATABASE_NOT_CONFIGURED")
        return json(
          {
            error:
              "The finance database is not configured. Please contact the site owner.",
          },
          503,
        );
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      )
        return json(
          { error: "An account with this email already exists." },
          409,
        );
      // Do not include driver messages or connection strings in responses or logs.
      return json(
        {
          error:
            "The finance service is temporarily unavailable. Please try again shortly.",
        },
        503,
      );
    }
  };
}
export const handleApi = createApi();
