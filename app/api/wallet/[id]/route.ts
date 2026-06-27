import { NextResponse } from "next/server";
import { getOrCreateWallet } from "@/lib/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const wallet = getOrCreateWallet(id);
  return NextResponse.json({ wallet });
}
