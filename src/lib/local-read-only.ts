export const LOCAL_READ_ONLY_MESSAGE = "Local preview is read-only. Submissions and changes are disabled.";

function blocked(): never {
  throw new Error(LOCAL_READ_ONLY_MESSAGE);
}

// Fail closed: only the SELECT statements used by catalogue readers are allowed.
// No SQL batch, exec, session, write method, comments or multiple statements.
export function readOnlyDatabase(database: D1Database): D1Database {
  function statement(sql: string, bindings: unknown[] = []): D1PreparedStatement {
    const query = sql.trim().replace(/;$/, "");
    if (!/^SELECT\s/i.test(query) || /;|--|\/\*/.test(query)) blocked();
    return new Proxy({} as D1PreparedStatement, {
      get(_, property) {
        if (property === "then") return undefined;
        if (property === "bind") return (...values: unknown[]) => statement(query, values);
        if (["first", "all", "raw"].includes(String(property))) {
          return (...args: unknown[]) => {
            const prepared = database.prepare(query).bind(...bindings);
            const method = Reflect.get(prepared, property) as (...values: unknown[]) => unknown;
            return method.apply(prepared, args);
          };
        }
        return blocked;
      },
    });
  }
  return new Proxy({} as D1Database, {
    get(_, property) {
      if (property === "then") return undefined;
      return property === "prepare" ? statement : blocked;
    },
  });
}

export function readOnlyBucket(bucket: R2Bucket): R2Bucket {
  return new Proxy({} as R2Bucket, {
    get(_, property) {
      if (property === "then") return undefined;
      if (!["get", "head", "list"].includes(String(property))) return blocked;
      const method = Reflect.get(bucket, property) as (...args: unknown[]) => unknown;
      return method.bind(bucket);
    },
  });
}

export function localReadOnlyEnv(env: CloudflareEnv): CloudflareEnv {
  return {
    ...env,
    DB: readOnlyDatabase(env.DB),
    CATALOG_ASSETS: readOnlyBucket(env.CATALOG_ASSETS),
    BROWSER: new Proxy({} as CloudflareEnv["BROWSER"], { get: () => blocked }),
  };
}
