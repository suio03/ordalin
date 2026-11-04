import { existsSync, readFileSync, writeFileSync } from "node:fs";

export type Todo = { id: number; title: string; done: boolean };

export function load(file: string): Todo[] {
  return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as Todo[]) : [];
}

export function save(file: string, todos: Todo[]): void {
  writeFileSync(file, JSON.stringify(todos, null, 2));
}

export function add(todos: Todo[], title: string): Todo[] {
  const id = todos.reduce((max, t) => Math.max(max, t.id), 0) + 1;
  return [...todos, { id, title, done: false }];
}

export function complete(todos: Todo[], id: number): Todo[] {
  return todos.map((t) => (t.id === id ? { ...t, done: true } : t));
}
