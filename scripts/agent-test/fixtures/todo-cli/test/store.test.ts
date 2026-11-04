import { test } from "node:test";
import assert from "node:assert/strict";
import { add, complete } from "../src/store.ts";

test("add gives the next id", () => {
  const todos = add(add([], "a"), "b");
  assert.deepEqual(todos.map((t) => t.id), [1, 2]);
});

test("complete marks one todo done", () => {
  const todos = complete(add([], "a"), 1);
  assert.equal(todos[0].done, true);
});
