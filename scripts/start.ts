import "dotenv/config";
import { spawn } from "child_process";
import { setup } from "./setup";

async function main() {
  await setup();

  console.log("[app] Starting server...");
  const server = spawn("node", ["server.js"], { stdio: "inherit" });

  process.on("SIGTERM", () => server.kill("SIGTERM"));
  process.on("SIGINT", () => server.kill("SIGINT"));
  server.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
