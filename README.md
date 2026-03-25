This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## UAT Push (minimal security)

This app can send the currently edited translation file to another Next.js app using a server-side POST proxy.

### 1. Configure this app

Create `.env.local` in this project (you can copy from [.env.example](.env.example)):

```env
UAT_TARGET_URL=https://your-uat-app.example.com/api/translations/import
UAT_SHARED_SECRET=change-me-in-uat
UAT_CLIENT_ID=json-translator
```

After setting envs, restart the dev server.

### 2. What this app sends

When you click `Wyślij do UAT`, this app calls [app/api/uat/push/route.ts](app/api/uat/push/route.ts), which forwards JSON to `UAT_TARGET_URL` with headers:

- `Authorization: Bearer <UAT_SHARED_SECRET>`
- `x-client-id: <UAT_CLIENT_ID>`

Body:

```json
{
  "name": "translations.json",
  "translations": { "home.title": "Witaj" },
  "keys_count": 1
}
```

### 3. Add receiver endpoint in the second Next.js app

Create endpoint `app/api/translations/import/route.ts` in the other project:

```ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ImportBody = {
  name?: string;
  translations?: Record<string, string>;
  keys_count?: number;
};

export async function POST(request: Request) {
  const expectedSecret = process.env.UAT_SHARED_SECRET;
  const auth = request.headers.get("authorization");

  if (!expectedSecret || auth !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ImportBody;
  if (!body.name || !body.translations || typeof body.keys_count !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // TODO: save body.translations in your UAT app storage.
  // Example: write to DB/file and optionally keep body.name metadata.

  return NextResponse.json({ ok: true });
}
```

In the second app set `.env.local`:

```env
UAT_SHARED_SECRET=change-me-in-uat
```

### 4. Minimal hardening suggestions

- Keep both apps behind HTTPS.
- Use a long random `UAT_SHARED_SECRET`.
- Optionally check `x-client-id` against an allow-list.
- Add simple rate-limit on the receiver endpoint.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Run with Docker

This repository includes production Docker setup for Next.js with SQLite persistence.

1. Create Docker env file:

```bash
cp .env.docker.example .env.docker
```

2. Fill values in `.env.docker` (at minimum: `UAT_TARGET_URL`, `UAT_SHARED_SECRET`).

3. Build and start container:

```bash
docker compose up -d --build
```

App will be available on [http://localhost:3001](http://localhost:3001).

- Host port is `3001` to avoid conflict with an existing app on port `3000`.
- SQLite file persists on host in `./data/translations.db` via mounted volume `./data:/app/data`.

To stop:

```bash
docker compose down
```
