import { NextResponse } from "next/server";
import { listMerchants } from "@/db/queries";
import { DEMO_EVENT_ID } from "@/lib/config";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId") ?? DEMO_EVENT_ID;
  const items = await listMerchants(eventId);
  return NextResponse.json({ items });
}
