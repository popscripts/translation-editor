import { NextResponse } from "next/server";
import { deleteTranslationFile, updateTranslationFile } from "@/lib/sqlite";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = (await request.json()) as {
    translations?: Record<string, string>;
    keys_count?: number;
  };

  if (!body.translations || typeof body.keys_count !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updated = updateTranslationFile(id, {
    translations: body.translations,
    keys_count: body.keys_count,
  });

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const ok = deleteTranslationFile(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
