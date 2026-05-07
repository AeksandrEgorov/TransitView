const DB_SCHEMA = process.env.DB_SCHEMA ?? "transitview";

function quoteIdentifier(identifier: string) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid database identifier: ${identifier}`);
  }

  return `"${identifier}"`;
}

export function dbView(name: string) {
  return `${quoteIdentifier(DB_SCHEMA)}.${quoteIdentifier(name)}`;
}