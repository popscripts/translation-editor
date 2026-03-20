import { NextResponse } from "next/server";

export const runtime = "nodejs";

type UatPushBody = {
  name?: string;
  translations?: Record<string, string>;
  keys_count?: number;
};

export async function POST(request: Request) {
  const targetUrl = process.env.UAT_TARGET_URL;
  const sharedSecret = process.env.UAT_SHARED_SECRET;
  const clientId = process.env.UAT_CLIENT_ID || "json-translator";

  if (!targetUrl || !sharedSecret) {
    return NextResponse.json(
      { error: "Brak konfiguracji UAT_TARGET_URL lub UAT_SHARED_SECRET." },
      { status: 500 }
    );
  }

  const body = (await request.json()) as UatPushBody;

  if (!body.name || !body.translations || typeof body.keys_count !== "number") {
    return NextResponse.json({ error: "Nieprawidłowy payload." }, { status: 400 });
  }

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${sharedSecret}`,
        "x-client-id": clientId,
      },
      body: JSON.stringify({
        name: body.name,
        translations: body.translations,
        keys_count: body.keys_count,
      }),
      cache: "no-store",
    });

    if (!upstreamResponse.ok) {
      const upstreamText = await upstreamResponse.text();
      return NextResponse.json(
        {
          error: `UAT endpoint zwrócił ${upstreamResponse.status}.`,
          upstream: upstreamText.slice(0, 500),
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd połączenia z UAT.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
