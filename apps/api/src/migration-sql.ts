// Migrations run inside the runner's single transaction. Older immutable files
// have an outer BEGIN/COMMIT pair; remove only that pair at execution time, never
// from the bytes used to calculate their recorded checksum.
function migrationStatements(sql: string) {
  const statements: { start: number; end: number; command: string }[] = [];
  let start = 0, visible = "", index = 0;
  const finish = (end: number) => {
    const command = visible.trim().replace(/\s+/g, " ").toLowerCase();
    if (command) statements.push({ start, end, command });
    start = end; visible = "";
  };
  while (index < sql.length) {
    if (sql.startsWith("--", index)) {
      const newline = sql.indexOf("\n", index + 2);
      index = newline < 0 ? sql.length : newline + 1;
      visible += " ";
    } else if (sql.startsWith("/*", index)) {
      let depth = 1;
      index += 2;
      while (index < sql.length && depth) {
        if (sql.startsWith("/*", index)) { depth++; index += 2; }
        else if (sql.startsWith("*/", index)) { depth--; index += 2; }
        else index++;
      }
      if (depth) throw new Error("Unterminated migration comment");
      visible += " ";
    } else if (sql[index] === "'" || sql[index] === '"') {
      const quote = sql[index];
      const escapes = quote === "'" && /(?:^|[^\w$])[eE]$/.test(sql.slice(0, index));
      let closed = false;
      index++;
      while (index < sql.length) {
        if (escapes && sql[index] === "\\") { index += 2; continue; }
        if (sql[index++] !== quote) continue;
        if (sql[index] === quote) { index++; continue; }
        closed = true; break;
      }
      if (!closed) throw new Error("Unterminated migration quoted value");
      visible += " <quoted> ";
    } else if (sql[index] === "$" && (index === 0 || !/[\w$]/.test(sql[index - 1]!))) {
      const delimiter = /^\$(?:[a-zA-Z_][a-zA-Z_0-9]*)?\$/.exec(sql.slice(index))?.[0];
      if (!delimiter) { visible += sql[index++]; continue; }
      const end = sql.indexOf(delimiter, index + delimiter.length);
      if (end < 0) throw new Error("Unterminated migration dollar quote");
      index = end + delimiter.length;
      visible += " <quoted> ";
    } else if (sql[index] === ";") {
      finish(++index);
    } else {
      visible += sql[index++];
    }
  }
  finish(sql.length);
  const wrapped = statements[0]?.command === "begin" && statements.at(-1)?.command === "commit";
  const body = wrapped ? statements.slice(1, -1) : statements;
  for (const statement of body) {
    if (/^(?:begin|commit|end|rollback|abort|savepoint|release|start\s+transaction|prepare\s+transaction|set\s+(?:local\s+)?transaction)\b/.test(statement.command)) {
      throw new Error("Migration transaction control must be owned by the runner");
    }
  }
  return { statements, body, wrapped };
}

export function migrationTransactionBody(sql: string): string {
  const { statements, wrapped } = migrationStatements(sql);
  return wrapped ? sql.slice(statements[0]!.end, statements.at(-1)!.start) : sql;
}

/** Prepared-statement transports still execute every statement in one caller-owned transaction. */
export function migrationTransactionStatements(sql: string): string[] {
  return migrationStatements(sql).body.map(statement => sql.slice(statement.start, statement.end));
}

/** Identify only explicit transfers to Rillora service roles, never quoted SQL text. */
export function migrationOwnershipRole(sql: string): string | null {
  const statements = migrationStatements(sql).body;
  if (statements.length !== 1) return null;
  return /^alter (?:function|procedure|table|sequence|type|view) app\.[\s\S]+ owner to (continuity_[a-z_]+)$/.exec(statements[0]!.command)?.[1] ?? null;
}
