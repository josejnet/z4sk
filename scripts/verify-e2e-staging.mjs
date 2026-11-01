import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { neon } from "@neondatabase/serverless";

try {
  process.loadEnvFile(".env.local");
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const productionUrl = process.env.DATABASE_URL;
if (!productionUrl) throw new Error("DATABASE_URL is required in .env.local.");

const stagingDatabase = "z4sk_staging_e2e";
const adminSql = neon(productionUrl);

try {
  await adminSql.query(`CREATE DATABASE "${stagingDatabase}"`);
  console.log(`Created isolated Neon database: ${stagingDatabase}`);
} catch (error) {
  const alreadyExists = error?.code === "42P04" || String(error?.message || "").includes("already exists");
  if (!alreadyExists) {
    throw new Error(`Could not create the isolated staging database: ${error instanceof Error ? error.message : String(error)}`);
  }
  console.log(`Reusing isolated Neon database: ${stagingDatabase}`);
}

const stagingUrl = new URL(productionUrl);
stagingUrl.pathname = `/${stagingDatabase}`;
const stagingSql = neon(stagingUrl.toString());
const rows = await stagingSql.query("SELECT current_database() AS name");
if (rows[0]?.name !== stagingDatabase) throw new Error("The staging connection did not reach the isolated database.");

const port = process.env.Z4SK_STAGING_PORT || "3101";
const baseUrl = `http://127.0.0.1:${port}`;
const childEnvironment = {
  ...process.env,
  DATABASE_URL: stagingUrl.toString(),
  RATE_LIMIT_HMAC_SECRET: process.env.RATE_LIMIT_HMAC_SECRET || randomBytes(32).toString("base64url"),
  PORT: port,
  Z4SK_VERIFY_URL: baseUrl,
};

const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", port], {
  cwd: process.cwd(),
  env: childEnvironment,
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});

let serverOutput = "";
for (const stream of [server.stdout, server.stderr]) {
  stream?.on("data", (chunk) => {
    serverOutput = `${serverOutput}${chunk}`.slice(-8_000);
  });
}

function stopServer() {
  if (!server.pid || server.exitCode !== null) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], { stdio: "ignore", windowsHide: true });
  } else {
    server.kill("SIGTERM");
  }
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`The staging server stopped before becoming ready.\n${serverOutput}`);
    try {
      const response = await fetch(baseUrl, { redirect: "manual" });
      if (response.status < 500) return;
    } catch {
      // The server is still starting.
    }
    await delay(1_000);
  }
  throw new Error(`The staging server did not become ready.\n${serverOutput}`);
}

try {
  await waitForServer();
  const verifier = spawn(process.execPath, ["scripts/verify-e2ee.mjs"], {
    cwd: process.cwd(),
    env: childEnvironment,
    stdio: "inherit",
    windowsHide: true,
  });
  const exitCode = await new Promise((resolve, reject) => {
    verifier.once("error", reject);
    verifier.once("exit", (code) => resolve(code ?? 1));
  });
  if (exitCode !== 0) throw new Error(`The staging E2E verifier exited with code ${exitCode}.\n${serverOutput}`);
  console.log(`Staging E2E completed successfully against ${stagingDatabase}.`);
} finally {
  stopServer();
}
