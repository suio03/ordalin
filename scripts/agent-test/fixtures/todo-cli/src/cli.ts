import { add, complete, load, save } from "./store.ts";

const FILE = "todos.json";
const [command, ...rest] = process.argv.slice(2);
let todos = load(FILE);

switch (command) {
  case "add":
    todos = add(todos, rest.join(" "));
    save(FILE, todos);
    break;
  case "done":
    todos = complete(todos, Number(rest[0]));
    save(FILE, todos);
    break;
  case "list":
    for (const t of todos) console.log(`${t.done ? "[x]" : "[ ]"} ${t.id}. ${t.title}`);
    break;
  default:
    console.log("Usage: todo add <title> | done <id> | list");
}
