# invoice-app

A small invoicing tool for a freelancer: customers, quotes and invoices, stored in `data.json`
in the current folder. Written quickly with an AI assistant over a few weekends.

    node --experimental-strip-types src/cli.ts customer add acme "Acme Ltd" billing@acme.test
    node --experimental-strip-types src/cli.ts invoice new acme "Website redesign" 1200
    node --experimental-strip-types src/cli.ts invoice send 1
    node --experimental-strip-types src/cli.ts invoice pay 1
    node --experimental-strip-types src/cli.ts report

Run the tests with `npm test` (Node 22+, no dependencies).
