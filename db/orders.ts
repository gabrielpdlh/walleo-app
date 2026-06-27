/**
 * Pedidos do cliente (modelo RESERVA + CAPTURA) no Postgres.
 *
 * - `createOrder` valida os produtos NO SERVIDOR (preço autoritativo do banco,
 *   nunca confia no preço enviado pelo cliente), confere saldo DISPONÍVEL
 *   (balance − reserved) e, na MESMA transação, cria o pedido pendente +
 *   itens e RESERVA o total (`wallets.reserved_cents += total`).
 * - A carteira é travada FOR UPDATE para serializar com outras criações/
 *   cancelamentos e impedir gasto duplo.
 * - A CAPTURA (staff bipando o QR → débito real + crédito do lojista) é uma
 *   fase posterior; aqui o pedido só nasce `pending` com seu `qr_token`.
 *
 * GOTCHA: imports relativos em `db/` (o alias `@/` não resolve sob `tsx`).
 */

import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "./index";
import { merchants, orderItems, orders, products, wallets } from "./schema";
import { ORDER_RESERVATION_MINUTES } from "../lib/config";
import {
  expireStaleOrders,
  getOrProvisionWallet,
  releaseStaleReservations,
} from "./wallet";

export class EmptyCartError extends Error {
  constructor() {
    super("Carrinho vazio.");
    this.name = "EmptyCartError";
  }
}
export class MerchantNotFoundError extends Error {
  constructor() {
    super("Estabelecimento não encontrado.");
    this.name = "MerchantNotFoundError";
  }
}
export class ProductUnavailableError extends Error {
  constructor() {
    super("Item indisponível.");
    this.name = "ProductUnavailableError";
  }
}
export class InsufficientBalanceError extends Error {
  constructor() {
    super("Saldo insuficiente.");
    this.name = "InsufficientBalanceError";
  }
}

function toIso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function toIsoOrNull(value: unknown): string | null {
  if (value == null) return null;
  return toIso(value);
}

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface CreateOrderResult {
  orderId: string;
  qrToken: string;
  totalCents: number;
}

export async function createOrder(input: {
  walletId: string;
  merchantSlug: string;
  items: CartLine[];
  note?: string | null;
}): Promise<CreateOrderResult> {
  // Sanitiza o carrinho: ids string + quantidades inteiras positivas.
  const cleanItems = (input.items ?? []).filter(
    (i) =>
      i &&
      typeof i.productId === "string" &&
      Number.isInteger(i.quantity) &&
      i.quantity > 0,
  );
  if (cleanItems.length === 0) throw new EmptyCartError();

  // Garante a carteira ANTES da transação (provisionamento idempotente).
  await getOrProvisionWallet(input.walletId);

  const merchant = await db.query.merchants.findFirst({
    where: and(
      eq(merchants.slug, input.merchantSlug),
      eq(merchants.status, "active"),
    ),
    columns: { id: true, name: true, eventId: true },
  });
  if (!merchant) throw new MerchantNotFoundError();

  return db.transaction(async (tx) => {
    const wallet = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.id, input.walletId))
      .for("update")
      .then((r) => r[0]);
    if (!wallet) throw new Error("Carteira não encontrada.");

    // Libera reservas vencidas na MESMA transação antes de checar o saldo.
    await releaseStaleReservations(tx, wallet.id);
    const w = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.id, wallet.id))
      .then((r) => r[0]);

    // Preço autoritativo: busca os produtos do estabelecimento no banco.
    const ids = [...new Set(cleanItems.map((i) => i.productId))];
    const prodRows = await tx
      .select()
      .from(products)
      .where(
        and(
          inArray(products.id, ids),
          eq(products.merchantId, merchant.id),
          eq(products.active, true),
        ),
      );
    const byId = new Map(prodRows.map((p) => [p.id, p]));
    for (const it of cleanItems) {
      if (!byId.has(it.productId)) throw new ProductUnavailableError();
    }

    let totalCents = 0;
    const itemValues = cleanItems.map((it) => {
      const p = byId.get(it.productId)!;
      const lineTotalCents = p.priceCents * it.quantity;
      totalCents += lineTotalCents;
      return {
        productId: p.id,
        nameSnapshot: p.name,
        unitPriceCents: p.priceCents,
        quantity: it.quantity,
        lineTotalCents,
      };
    });
    if (totalCents <= 0) throw new EmptyCartError();

    const availableCents = w.balanceCents - w.reservedCents;
    if (availableCents < totalCents) throw new InsufficientBalanceError();

    const expiresAt = new Date(Date.now() + ORDER_RESERVATION_MINUTES * 60_000);
    const [order] = await tx
      .insert(orders)
      .values({
        eventId: merchant.eventId,
        merchantId: merchant.id,
        walletId: wallet.id,
        consumerId: wallet.consumerId,
        status: "pending",
        totalCents,
        note: input.note ?? null,
        expiresAt,
      })
      .returning({ id: orders.id, qrToken: orders.qrToken });

    await tx
      .insert(orderItems)
      .values(itemValues.map((v) => ({ ...v, orderId: order.id })));

    await tx
      .update(wallets)
      .set({
        reservedCents: sql`${wallets.reservedCents} + ${totalCents}`,
        updatedAt: sql`now()`,
      })
      .where(eq(wallets.id, wallet.id));

    return { orderId: order.id, qrToken: order.qrToken, totalCents };
  });
}

// ---------------------------------------------------------------------------
// Leitura — lista e detalhe
// ---------------------------------------------------------------------------

export interface OrderListItem {
  id: string;
  status: string;
  totalCents: number;
  merchantName: string;
  createdAt: string;
  expiresAt: string | null;
  itemsSummary: string;
  itemCount: number;
}

export async function listOrders(walletId: string): Promise<OrderListItem[]> {
  await expireStaleOrders(walletId);
  const rows = await db.query.orders.findMany({
    where: eq(orders.walletId, walletId),
    orderBy: (o, { desc }) => desc(o.createdAt),
    with: {
      merchant: { columns: { name: true } },
      items: { columns: { nameSnapshot: true, quantity: true } },
    },
  });
  return rows.map((o) => ({
    id: o.id,
    status: o.status,
    totalCents: o.totalCents,
    merchantName: o.merchant?.name ?? "Estabelecimento",
    createdAt: toIso(o.createdAt),
    expiresAt: toIsoOrNull(o.expiresAt),
    itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
    itemsSummary: o.items.map((i) => `${i.quantity}× ${i.nameSnapshot}`).join(", "),
  }));
}

export interface OrderDetail {
  id: string;
  status: string;
  totalCents: number;
  qrToken: string;
  merchantName: string;
  createdAt: string;
  expiresAt: string | null;
  redeemedAt: string | null;
  cancelledAt: string | null;
  note: string | null;
  items: {
    id: string;
    name: string;
    unitPriceCents: number;
    quantity: number;
    lineTotalCents: number;
  }[];
}

export async function getOrderForOwner(
  orderId: string,
  walletId: string,
): Promise<OrderDetail | null> {
  await expireStaleOrders(walletId);
  const o = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.walletId, walletId)),
    with: {
      merchant: { columns: { name: true } },
      items: { orderBy: (i, { asc }) => asc(i.createdAt) },
    },
  });
  if (!o) return null;
  return {
    id: o.id,
    status: o.status,
    totalCents: o.totalCents,
    qrToken: o.qrToken,
    merchantName: o.merchant?.name ?? "Estabelecimento",
    createdAt: toIso(o.createdAt),
    expiresAt: toIsoOrNull(o.expiresAt),
    redeemedAt: toIsoOrNull(o.redeemedAt),
    cancelledAt: toIsoOrNull(o.cancelledAt),
    note: o.note,
    items: o.items.map((i) => ({
      id: i.id,
      name: i.nameSnapshot,
      unitPriceCents: i.unitPriceCents,
      quantity: i.quantity,
      lineTotalCents: i.lineTotalCents,
    })),
  };
}

// ---------------------------------------------------------------------------
// Cancelamento (cliente) — libera a reserva; só vale para pedido pendente
// ---------------------------------------------------------------------------

export async function cancelOrder(
  orderId: string,
  walletId: string,
): Promise<{ ok: boolean; status: string }> {
  return db.transaction(async (tx) => {
    const wallet = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.id, walletId))
      .for("update")
      .then((r) => r[0]);
    if (!wallet) return { ok: false, status: "not_found" };

    const order = await tx
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.walletId, walletId)))
      .then((r) => r[0]);
    if (!order) return { ok: false, status: "not_found" };
    if (order.status !== "pending") return { ok: false, status: order.status };

    await tx
      .update(orders)
      .set({ status: "cancelled", cancelledAt: sql`now()`, updatedAt: sql`now()` })
      .where(eq(orders.id, order.id));
    await tx
      .update(wallets)
      .set({
        reservedCents: sql`GREATEST(0, ${wallets.reservedCents} - ${order.totalCents})`,
        updatedAt: sql`now()`,
      })
      .where(eq(wallets.id, wallet.id));

    return { ok: true, status: "cancelled" };
  });
}
