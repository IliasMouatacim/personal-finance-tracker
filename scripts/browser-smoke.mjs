/* Browser interaction checks with controlled API responses; does not validate MongoDB. */
import assert from "node:assert/strict";
import { chromium } from "playwright";
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] }
      : {}),
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let transactions = [
      {
        _id: "000000000000000000000001",
        description: "Monthly salary",
        amount: 5200,
        type: "income",
        category: "Salary",
        date: "2026-10-01T00:00:00Z",
      },
      {
        _id: "000000000000000000000002",
        description: "Groceries",
        amount: 80.5,
        type: "expense",
        category: "Food",
        date: "2026-10-02T00:00:00Z",
      },
    ];
    let budgets = [];
    let goals = [];
    let failList = false;
    let registrationFailure = true;
    await page.route("**/api/**", async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (path.endsWith("/auth/register") && registrationFailure) {
        return route.fulfill({
          status: 404,
          contentType: "text/plain",
          body: "The page could not be found",
        });
      }
      if (path.includes("/auth/"))
        return route.fulfill({
          json: { token: "browser-fixture-token", email: "test@example.com" },
        });
      if (/^\/api\/(budgets|goals)/.test(path)) {
        const type = path.split("/")[2],
          id = path.split("/")[3];
        let records = type === "budgets" ? budgets : goals;
        if (request.method() === "POST") {
          const data = request.postDataJSON();
          const existing =
            type === "budgets"
              ? records.find(
                  (x) => x.category === data.category && x.month === data.month,
                )
              : null;
          const item = {
            ...data,
            _id: existing ? existing._id : String(Date.now()),
            ...(type === "goals" ? { saved: 0 } : {}),
          };
          records = [...records.filter((x) => x._id !== item._id), item];
          if (type === "budgets") budgets = records;
          else goals = records;
          return route.fulfill({ status: 201, json: item });
        }
        if (request.method() === "PATCH") {
          const goal = goals.find((x) => x._id === id);
          goal.saved += request.postDataJSON().contribution;
          return route.fulfill({ json: goal });
        }
        if (request.method() === "DELETE") {
          if (type === "budgets") budgets = budgets.filter((x) => x._id !== id);
          else goals = goals.filter((x) => x._id !== id);
          return route.fulfill({ json: { message: "Removed." } });
        }
        return route.fulfill({ json: records });
      }
      if (request.method() === "PATCH") {
        const id = path.split("/").at(-1);
        const updated = { ...request.postDataJSON(), _id: id };
        transactions = transactions.map((t) => (t._id === id ? updated : t));
        return route.fulfill({ json: updated });
      }
      if (path.endsWith("/export"))
        return route.fulfill({
          contentType: "text/csv",
          body: "Date,Description,Category,Type,Amount\n",
        });
      if (request.method() === "DELETE") {
        transactions = transactions.filter(
          (t) => t._id !== path.split("/").at(-1),
        );
        return route.fulfill({ json: { message: "Transaction deleted." } });
      }
      if (request.method() === "POST") {
        const tx = {
          ...request.postDataJSON(),
          _id: "000000000000000000000003",
        };
        transactions.push(tx);
        return route.fulfill({ status: 201, json: tx });
      }
      return route.fulfill({
        status: failList ? 503 : 200,
        json: failList ? { error: "Unavailable" } : transactions,
      });
    });
    const base = process.env.BASE_URL || "http://127.0.0.1:3000";
    await page.goto(base);
    await page.getByRole("heading", { name: /Make room for/ }).waitFor();
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `Landing overflows at ${width}px`,
      );
    }
    await page.getByRole("button", { name: "Week", exact: true }).click();
    await page.getByLabel("Illustrative week cash flow chart").waitFor();
    await page.getByRole("button", { name: "Month", exact: true }).click();
    await page.getByLabel("Illustrative month cash flow chart").waitFor();
    await page.getByRole("link", { name: "Get started", exact: true }).click();
    await page.getByLabel("Email Address").fill("test@example.com");
    await page
      .getByLabel("Password", { exact: false })
      .first()
      .fill("test-password");
    await page.getByLabel("Confirm Password").fill("mismatch");
    await page
      .getByRole("button", { name: "Create Account", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: "Passwords don't match" })
      .waitFor();
    await page.getByLabel("Confirm Password").fill("test-password");
    await page
      .getByRole("button", { name: "Create Account", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: "unavailable or incorrectly configured" })
      .waitFor();
    registrationFailure = false;
    await page
      .getByRole("button", { name: "Create Account", exact: true })
      .click();
    await page.getByRole("heading", { name: "Your transactions" }).waitFor();
    await page.reload();
    await page.getByText("Monthly salary", { exact: true }).waitFor();
    assert(
      new URL(page.url()).pathname === "/dashboard",
      "Session survives reload",
    );
    await page
      .getByRole("button", { name: "Edit Groceries", exact: true })
      .click();
    const editor = page.getByRole("dialog");
    await editor.getByLabel("Description", { exact: true }).fill("Groceries");
    await editor.getByLabel("Amount ($)").fill("90");
    await editor.getByRole("button", { name: "Save changes" }).click();
    await editor.waitFor({ state: "hidden" });
    assert.equal(
      transactions.find((t) => t.description === "Groceries").amount,
      90,
    );
    await page.getByLabel("Dashboard month").selectOption("2026-10");
    await page.getByText("Period net", { exact: true }).waitFor();
    await page.getByLabel("Dashboard month").selectOption("all");
    await page.getByLabel("Budget month").fill("2026-10");
    await page.getByLabel("Budget limit").fill("100");
    await page
      .getByRole("button", { name: "Save budget", exact: true })
      .click();
    await page.getByText("$10.00 left to spend", { exact: true }).waitFor();
    await page.getByLabel("Budget limit").fill("80");
    await page
      .getByRole("button", { name: "Save budget", exact: true })
      .click();
    await page.getByText("$10.00 over budget", { exact: true }).waitFor();
    await page.getByLabel("Goal name").fill("Dream trip");
    await page.getByLabel("Goal target").fill("1000");
    await page
      .getByRole("button", { name: "Create goal", exact: true })
      .click();
    await page.getByLabel("Contribution to Dream trip").fill("100");
    await page
      .getByRole("button", { name: "Add savings", exact: false })
      .click();
    await page.getByText("$900.00 to go", { exact: true }).waitFor();
    await page.reload();
    await page.getByText("$900.00 to go", { exact: true }).waitFor();
    await page.getByRole("searchbox").fill("groceries");
    assert((await page.locator(".transaction-row").count()) === 1);
    await page.getByRole("searchbox").fill("");
    await page.getByLabel("Filter transactions by type").selectOption("income");
    assert((await page.locator(".transaction-row").count()) === 1);
    await page.getByLabel("Filter transactions by type").selectOption("all");
    await page
      .getByLabel("Description", { exact: true })
      .fill("Afternoon coffee");
    await page.getByLabel("Amount ($)").fill("4.50");
    await page
      .getByRole("button", { name: "+ Add Transaction", exact: true })
      .click();
    await page.getByText("Afternoon coffee", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Delete Afternoon coffee", exact: true })
      .click();
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    assert(
      (await page.getByText("Afternoon coffee", { exact: true }).count()) === 1,
    );
    await page
      .getByRole("button", { name: "Delete Afternoon coffee", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirm delete", exact: true })
      .click();
    await page
      .getByText("Afternoon coffee", { exact: true })
      .waitFor({ state: "hidden" });
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV" }).click();
    assert.equal((await download).suggestedFilename(), "transactions.csv");
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await page.waitForFunction(() =>
      document.documentElement.classList.contains("dark"),
    );
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `Dashboard overflows at ${width}px: ${await page.evaluate(() =>
          [...document.querySelectorAll("*")]
            .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
            .slice(0, 10)
            .map((e) => `${e.tagName}.${e.className}`)
            .join(", "),
        )}`,
      );
    }
    await page.waitForTimeout(350);
    await page.screenshot({
      path: "/tmp/ledger-dashboard-dark.png",
      fullPage: true,
    });
    failList = true;
    await page.reload();
    await page
      .getByRole("alert")
      .filter({ hasText: "load your transactions" })
      .waitFor();
    assert.equal(
      new URL(page.url()).pathname,
      "/dashboard",
      "Network errors do not log out the user",
    );
    failList = false;
    await page.getByRole("button", { name: "Retry loading" }).click();
    await page.getByText("Monthly salary", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Switch to light theme" }).click();
    await page.waitForFunction(() =>
      document.documentElement.classList.contains("light"),
    );
    await page.waitForTimeout(350);
    await page.screenshot({
      path: "/tmp/ledger-dashboard.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Sign out", exact: true })
      .first()
      .click();
    await page.getByRole("heading", { name: "Welcome back." }).waitFor();
    await page.goto(`${base}/dashboard`);
    await page.waitForURL("**/login");
    assert.deepEqual(errors, [], "No browser runtime errors");
    console.log(
      "PASS: responsive layouts, registration, session reload, monthly filters, editing, budgets, savings goals, search, add, delete confirmation, export, themes, retry, logout and route guard (mock API).",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
