import { NextRequest, NextResponse } from "next/server";
import { handleApi } from "../../../../server/src/api";

export const runtime = "nodejs";

// Resolve at request time so deployments can configure the API without baking
// a loopback address into Next.js rewrite manifests.
async function proxy(request: NextRequest) {
  const configured =
    process.env.API_SERVER_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!configured) return handleApi(request);
  const base = configured;

  let destination: URL;
  try {
    const root = new URL(base);
    if (
      !["http:", "https:"].includes(root.protocol) ||
      root.username ||
      root.password ||
      root.search ||
      root.hash ||
      !["", "/"].includes(root.pathname)
    )
      throw new Error("Invalid backend origin");
    destination = new URL(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
      root,
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "The finance service configuration is invalid. Please contact the site owner.",
      },
      { status: 503 },
    );
  }

  try {
    const headers = new Headers();
    for (const name of ["authorization", "content-type"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    const upstream = await fetch(destination, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method)
        ? undefined
        : await request.text(),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    });
    const contentType = upstream.headers.get("content-type") || "";
    if (
      !contentType.includes("application/json") &&
      !contentType.includes("text/csv")
    ) {
      return NextResponse.json(
        {
          error:
            "The finance service is temporarily unavailable. Please try again shortly.",
        },
        { status: 502 },
      );
    }
    const responseHeaders = new Headers({
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    });
    const disposition = upstream.headers.get("content-disposition");
    if (disposition) responseHeaders.set("Content-Disposition", disposition);
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Unable to reach the finance service. Please try again shortly.",
      },
      { status: 502 },
    );
  }
}

export { proxy as GET, proxy as POST, proxy as DELETE };
