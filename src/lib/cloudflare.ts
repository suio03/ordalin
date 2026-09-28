import { localReadOnlyEnv } from "./local-read-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getCloudflareRuntime() {
  const runtime = await getCloudflareContext({ async: true });
  return process.env.NODE_ENV === "development"
    ? { ...runtime, env: localReadOnlyEnv(runtime.env) }
    : runtime;
}

export async function getCloudflareEnv() {
  return (await getCloudflareRuntime()).env;
}
