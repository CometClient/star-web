import Database from "better-sqlite3";
import { readFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "data");
const dbPath = process.env.DATABASE_PATH || join(dataDir, "comet.db");

if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const migrationsDir = join(__dirname, "migrations");
const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

db.exec(`
  CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

for (const file of files) {
  const applied = db.prepare("SELECT 1 FROM _migrations WHERE name = ?").get(file);
  if (applied) continue;
  const sql = readFileSync(join(migrationsDir, file), "utf8");
  db.exec(sql);
  db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(file);
  console.log(`Applied ${file}`);
}

if (process.argv.includes("--seed")) {
  const seedPath = join(__dirname, "seed.sql");
  if (existsSync(seedPath)) {
    db.exec(readFileSync(seedPath, "utf8"));
    console.log("Seed applied");
  }
}

console.log(`Database ready at ${dbPath}`);
db.close();
