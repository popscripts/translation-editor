import { NextResponse } from "next/server";
import { createTranslationFile, listTranslationFiles } from "@/lib/sqlite";

export const runtime = "nodejs";

export async function GET() {
  const files = listTranslationFiles();
  return NextResponse.json(files);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    translations?: Record<string, string>;
    keys_count?: number;
  };

  if (!body.name || !body.translations || typeof body.keys_count !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const created = createTranslationFile({
    name: body.name,
    translations: body.translations,
    keys_count: body.keys_count,
  });

  return NextResponse.json(created, { status: 201 });
}
