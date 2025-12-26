type LoginMode = "admin" | "client";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function joinUrl(base: string, path: string): string {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function extractCookieHeader(res: Response): string | null {
  // Node 20+ (undici) supports getSetCookie() which preserves multiple Set-Cookie headers.
  const anyHeaders = res.headers as any;
  const setCookies: string[] =
    typeof anyHeaders.getSetCookie === "function"
      ? (anyHeaders.getSetCookie() as string[])
      : res.headers.get("set-cookie")
        ? [res.headers.get("set-cookie") as string]
        : [];

  if (!setCookies.length) return null;
  // Convert Set-Cookie headers into a Cookie header (name=value; name2=value2)
  return setCookies
    .map((sc) => sc.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

async function httpJson(
  url: string,
  opts: {
    method?: string;
    body?: any;
    cookie?: string | null;
  } = {},
): Promise<{ status: number; headers: Headers; json: any; cookie: string | null }> {
  const res = await fetch(url, {
    method: opts.method || "GET",
    headers: {
      "content-type": "application/json",
      ...(opts.cookie ? { cookie: opts.cookie } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    redirect: "manual",
  });

  const cookie = extractCookieHeader(res);

  let json: any = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    json = await res.json().catch(() => null);
  } else {
    json = await res.text().catch(() => null);
  }

  return { status: res.status, headers: res.headers, json, cookie };
}

async function runLoginFlow(mode: LoginMode) {
  const baseUrl = (process.env.BASE_URL || "http://localhost:5000").trim();
  const healthUrl = joinUrl(baseUrl, "/api/health");

  console.log(`[SMOKE] Base URL: ${baseUrl}`);
  console.log(`[SMOKE] Health: ${healthUrl}`);

  const health = await httpJson(healthUrl);
  if (health.status !== 200) {
    throw new Error(
      `[SMOKE] Health check failed (status ${health.status}). Response: ${JSON.stringify(health.json)}`,
    );
  }

  const email =
    mode === "admin" ? requiredEnv("SMOKE_ADMIN_EMAIL") : requiredEnv("SMOKE_CLIENT_EMAIL");
  const password =
    mode === "admin"
      ? requiredEnv("SMOKE_ADMIN_PASSWORD")
      : requiredEnv("SMOKE_CLIENT_PASSWORD");

  const loginPath = mode === "admin" ? "/api/admin/login" : "/api/client-login";
  const loginUrl = joinUrl(baseUrl, loginPath);
  console.log(`[SMOKE] Logging in (${mode}) via ${loginPath} as ${email}`);

  const loginRes = await httpJson(loginUrl, {
    method: "POST",
    body: { email, password, rememberMe: false },
  });

  if (loginRes.status !== 200) {
    throw new Error(
      `[SMOKE] ${mode} login failed (status ${loginRes.status}). Response: ${JSON.stringify(loginRes.json)}`,
    );
  }

  const cookie = loginRes.cookie;
  if (!cookie) {
    throw new Error(
      `[SMOKE] ${mode} login returned 200 but did not set a session cookie (no Set-Cookie). This usually indicates a cookie/CORS/proxy issue in production.`,
    );
  }

  const whoamiUrl = joinUrl(baseUrl, "/api/auth/user");
  const whoami = await httpJson(whoamiUrl, { cookie });

  if (whoami.status !== 200) {
    throw new Error(
      `[SMOKE] /api/auth/user failed (status ${whoami.status}). Response: ${JSON.stringify(whoami.json)}`,
    );
  }

  if (!whoami.json) {
    throw new Error(`[SMOKE] /api/auth/user returned null after login (session not persisted).`);
  }

  const role = String((whoami.json as any).role || "");
  if (mode === "admin" && role.toLowerCase() === "client") {
    throw new Error(`[SMOKE] Expected admin/staff role after admin login, got role="${role}".`);
  }
  if (mode === "client" && role.toLowerCase() !== "client") {
    throw new Error(`[SMOKE] Expected role="client" after client login, got role="${role}".`);
  }

  console.log(`[SMOKE] Logged in OK. /api/auth/user role="${role}" id="${(whoami.json as any).id}"`);

  const logoutUrl = joinUrl(baseUrl, "/api/logout");
  const logout = await httpJson(logoutUrl, { cookie });
  if (![200, 204, 302, 303].includes(logout.status)) {
    throw new Error(
      `[SMOKE] Logout returned unexpected status ${logout.status}. Response: ${JSON.stringify(logout.json)}`,
    );
  }

  const afterLogout = await httpJson(whoamiUrl, { cookie });
  if (afterLogout.status !== 200) {
    throw new Error(
      `[SMOKE] /api/auth/user after logout failed (status ${afterLogout.status}). Response: ${JSON.stringify(afterLogout.json)}`,
    );
  }
  if (afterLogout.json !== null) {
    throw new Error(
      `[SMOKE] Expected /api/auth/user to return null after logout, got: ${JSON.stringify(afterLogout.json)}`,
    );
  }

  console.log(`[SMOKE] Logout OK. Session cleared.`);
}

async function main() {
  const mode = ((process.env.SMOKE_MODE || "").trim().toLowerCase() as LoginMode) || null;

  if (mode === "admin" || mode === "client") {
    await runLoginFlow(mode);
    return;
  }

  // Default: run any flows that have credentials configured.
  const hasAdmin =
    !!process.env.SMOKE_ADMIN_EMAIL && !!process.env.SMOKE_ADMIN_PASSWORD;
  const hasClient =
    !!process.env.SMOKE_CLIENT_EMAIL && !!process.env.SMOKE_CLIENT_PASSWORD;

  if (!hasAdmin && !hasClient) {
    throw new Error(
      `No smoke credentials provided.\n` +
        `Set at least one of:\n` +
        `- SMOKE_ADMIN_EMAIL + SMOKE_ADMIN_PASSWORD\n` +
        `- SMOKE_CLIENT_EMAIL + SMOKE_CLIENT_PASSWORD\n` +
        `Optional:\n` +
        `- BASE_URL (defaults to http://localhost:5000)\n` +
        `- SMOKE_MODE=admin|client`,
    );
  }

  if (hasAdmin) await runLoginFlow("admin");
  if (hasClient) await runLoginFlow("client");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


