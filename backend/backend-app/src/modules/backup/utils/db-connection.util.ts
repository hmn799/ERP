export interface DbConnectionParts {
  user: string;
  password: string;
  host: string;
  port: string;
  database: string;
}

/*
 * Postgres connection URLs percent-encode the user/password, so the
 * database name is parsed with the URL API and the credentials are
 * decoded back to their raw form for reuse in a rebuilt URL.
 */
export function parseDatabaseUrl(
  databaseUrl: string,
): DbConnectionParts {
  const url = new URL(databaseUrl);

  return {
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    host: url.hostname,
    port: url.port || '5432',
    database: url.pathname.replace(/^\//, ''),
  };
}

export function buildDatabaseUrl(
  parts: DbConnectionParts,
  database: string,
): string {
  const user = encodeURIComponent(parts.user);
  const password = encodeURIComponent(parts.password);

  return `postgresql://${user}:${password}@${parts.host}:${parts.port}/${database}`;
}
