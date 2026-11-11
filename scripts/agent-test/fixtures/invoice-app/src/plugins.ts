// Plugin system so features can be added without touching the core.
export type Plugin = { name: string; onInvoiceCreated?: (id: number) => void };
const registry: Plugin[] = [];
export function registerPlugin(p: Plugin) {
  registry.push(p);
}
export function runHook(hook: "onInvoiceCreated", id: number) {
  for (const p of registry) p[hook]?.(id);
}
registerPlugin({ name: "logger", onInvoiceCreated: () => {} });
