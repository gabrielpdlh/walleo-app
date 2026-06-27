import { NextResponse } from "next/server";
import { getHistory } from "@/lib/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return NextResponse.json({ items: getHistory(id) });
}
