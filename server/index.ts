import express, {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction,
} from "express";
import cors from "cors";
import connectDB from "./src/db";
import { handleApi } from "./src/api";

const app = express();
const allowed = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) =>
      callback(null, !origin || allowed.includes(origin.replace(/\/$/, ""))),
    credentials: true,
  }),
);
app.use(express.text({ type: () => true, limit: "16kb" }));
app.use(async (req: ExpressRequest, res: ExpressResponse) => {
  const headers = new Headers();
  for (const name of ["authorization", "content-type"]) {
    const value = req.get(name);
    if (value) headers.set(name, value);
  }
  const request = new Request(`http://localhost${req.originalUrl}`, {
    method: req.method,
    headers,
    body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body || "",
  });
  const response = await handleApi(request);
  response.headers.forEach((value, name) => res.setHeader(name, value));
  res.status(response.status).send(Buffer.from(await response.arrayBuffer()));
});
app.use(
  (
    error: unknown,
    _req: ExpressRequest,
    res: ExpressResponse,
    next: NextFunction,
  ) => {
    void next;
    const large =
      typeof error === "object" &&
      error !== null &&
      "type" in error &&
      error.type === "entity.too.large";
    res
      .status(large ? 413 : 500)
      .json({
        error: large
          ? "Request body is too large."
          : "Your request could not be completed.",
      });
  },
);
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET)
  throw new Error("JWT_SECRET is required in production.");
connectDB()
  .then(() =>
    app.listen(process.env.PORT || 3001, () =>
      console.log("Finance API is ready."),
    ),
  )
  .catch(() => {
    console.error(
      "Database startup failed. Check MONGODB_URI and database access.",
    );
    process.exitCode = 1;
  });
