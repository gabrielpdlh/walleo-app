/** Consultas de leitura do catálogo (usadas pelas API Routes). */

import { and, asc, eq } from "drizzle-orm";
import { db } from "./index";
import { merchants } from "./schema";

/** Lista estabelecimentos ativos de um evento. */
export async function listMerchants(eventId: string) {
  return db
    .select({
      id: merchants.id,
      slug: merchants.slug,
      name: merchants.name,
      category: merchants.category,
      imageUrl: merchants.imageUrl,
    })
    .from(merchants)
    .where(and(eq(merchants.eventId, eventId), eq(merchants.status, "active")))
    .orderBy(asc(merchants.name));
}

/** Estabelecimento (por slug) + seus produtos ativos. */
export async function getMerchantBySlug(slug: string) {
  const merchant = await db.query.merchants.findFirst({
    where: eq(merchants.slug, slug),
    columns: { id: true, slug: true, name: true, category: true, imageUrl: true },
    with: {
      products: {
        where: (p, { eq }) => eq(p.active, true),
        orderBy: (p, { asc }) => asc(p.name),
        columns: {
          id: true,
          name: true,
          description: true,
          priceCents: true,
          imageUrl: true,
        },
      },
    },
  });
  return merchant ?? null;
}
