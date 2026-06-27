import { NextResponse } from "next/server";
import { getSessionSlug } from "@/lib/merchant-auth";
import { getMerchantBasic } from "@/db/merchant";

export async function GET() {
  const slug = await getSessionSlug();
  if (!slug) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  const merchant = await getMerchantBasic(slug);
  if (!merchant) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  return NextResponse.json({
    merchant: { slug: merchant.slug, name: merchant.name },
  });
}
