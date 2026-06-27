import { NextResponse } from "next/server";
import { getMerchantBySlug } from "@/db/queries";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const merchant = await getMerchantBySlug(slug);
  if (!merchant) {
    return NextResponse.json(
      { error: "Estabelecimento não encontrado." },
      { status: 404 },
    );
  }
  return NextResponse.json({ merchant });
}
