# Arabic Course Monorepo

Monorepo setup for the Arabic course platform built on Cloudflare. The repository contains the Astro frontend, Cloudflare Pages Functions for APIs, and Drizzle ORM database tooling for D1.

## Structure

- `apps/web` – Astro frontend, Tailwind styles, Pages Functions, and lesson content.
- `packages/db` – Drizzle ORM schema, migrations, and tooling for Cloudflare D1.
- `.github/workflows` – CI for building and deploying to Cloudflare Pages.
- `wrangler.toml` – Cloudflare project configuration and database bindings.

## Getting Started

```bash
npm install
npm run dev
```

Key scripts:

- `npm run build` – build the Astro site.
- `npm run dev` – start the Astro dev server.
- `npm run db:generate` – generate Drizzle migrations.
- `npm run db:migrate` – apply migrations to the D1 database.
- `npm run db:push` – sync schema changes to the local SQLite file during development.

## Cloudflare

- `wrangler.toml` stores the D1 binding and environment configuration.
- D1 database management via `wrangler d1` commands.
- Deploy via Cloudflare Pages; attach the D1 database in project settings.
- GitHub Actions workflow `.github/workflows/deploy.yml` automates builds and deployments (requires `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `CLOUDFLARE_D1_DATABASE_ID` secrets).
