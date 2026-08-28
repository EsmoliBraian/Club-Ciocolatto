import "dotenv/config";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Tests run against the local dev Postgres (docker-compose up -d) — see .env."
  );
}
