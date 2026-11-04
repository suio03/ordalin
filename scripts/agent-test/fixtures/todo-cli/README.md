# todo-cli

A tiny to-do list for the terminal. Tasks are stored in `todos.json` in the current folder.

    node --experimental-strip-types src/cli.ts add "Buy milk"
    node --experimental-strip-types src/cli.ts list
    node --experimental-strip-types src/cli.ts done 1

Run the tests with `npm test` (Node 22+, no dependencies).
