import { spawn, type ChildProcess } from "node:child_process";
import process from "node:process";

const NEXT_PORT = Number.parseInt(process.env.E2E_PORT ?? "3131", 10);
const HOST = "127.0.0.1";
const READY_REGEX = /ready - started server on/i;

let serverProcess: ChildProcess | null = null;

const waitForReady = (child: ChildProcess) =>
  new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("Timeout while starting Next.js dev server"));
    }, 120_000);

    if (!child.stdout) {
      clearTimeout(timeout);
      reject(new Error("Next.js dev server stdout is not available"));
      return;
    }

    const onData = (data: Buffer) => {
      const text = data.toString();
      if (READY_REGEX.test(text)) {
        clearTimeout(timeout);
        child.stdout?.off("data", onData);
        resolve();
      }
    };

    child.stdout.on("data", onData);
    child.stderr?.on("data", (data) => {
      process.stderr.write(data);
    });
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Next.js dev server exited prematurely with code ${code ?? "unknown"}`));
    });
  });

export const startServer = async () => {
  if (serverProcess) {
    return;
  }

  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  serverProcess = spawn(npmCommand, ["run", "dev", "--", "--hostname", HOST, "--port", String(NEXT_PORT)], {
    env: {
      ...process.env,
      PORT: String(NEXT_PORT),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  await waitForReady(serverProcess);
};

export const stopServer = async () => {
  if (!serverProcess) {
    return;
  }

  const child = serverProcess;
  serverProcess = null;

  await new Promise<void>((resolve) => {
    child.once("exit", () => resolve());
    child.kill();
  });
};

export const baseUrl = `http://${HOST}:${NEXT_PORT}`;
