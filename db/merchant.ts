/**
 * Operações do PORTAL do estabelecimento (Postgres).
 *
 * - redeemOrder = CAPTURA: o staff bipa o qr_token → débito real na carteira
 *   (purchase_debit) + crédito lógico do lojista (merchant_credit) no ledger,
 *   ambos idempotentes (índice único reference_type/reference_id/entry_type, então
 *   bipar 2× não debita em dobro). A carteira é travada FOR UPDATE; a reserva vira
 *   liquidação (balance -= total, reserved -= total) e o pedido vira 'redeemed'.
 * - Posse: list/CRUD de produtos e pedidos são sempre escopados ao merchant do slug.
 *
 * GOTCHA: imports relativos em db/ (o alias @/ não resolve sob tsx).
 */

import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "./index";
import {
  consumers,
  ledgerEntries,
  merchants,
  orderItems,
  orders,
  products,
  wallets,
} from "./schema";

// --- erros tipados -----------------------------------------------------------

export class MerchantNotFoundError extends Error {
  constructor() {
    super("Estabelecimento não encontrado.");
    this.name = "MerchantNotFoundError";
  }
}
export class OrderNotFoundError extends Error {
  constructor() {
    super("Pedido não encontrado para este código.");
    this.name = "OrderNotFoundError";
  }
}
export class OrderWrongMerchantError extends Error {
  constructor() {
    super("Este pedido é de outro estabelecimento.");
    this.name = "OrderWrongMerchantError";
  }
}
export class OrderExpiredError extends Error {
  constructor() {
    super("Pedido expirado — a reserva foi liberada.");
    this.name = "OrderExpiredError";
  }
}
export class OrderNotRedeemableError extends Error {
  constructor(public readonly status: string) {
    super("Pedido não pode ser resgatado.");
    this.name = "OrderNotRedeemableError";
  }
}
export class ProductNotFoundError extends Error {
  constructor() {
    super("Produto não encontrado.");
    this.name = "ProductNotFoundError";
  }
}

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}
function isoOrNull(value: unknown): string | null {
  return value == null ? null : iso(value);
}

// --- merchant ----------------------------------------------------------------

export interface MerchantBasic {
  id: string;
  slug: string;
  name: string;
}

export async function getMerchantBasic(slug: string): Promise<MerchantBasic | null> {
  const m = await db.query.merchants.findFirst({
    where: and(eq(merchants.slug, slug), eq(merchants.status, "active")),
    columns: { id: true, slug: true, name: true },
  });
  return m ?? null;
}

// --- CAPTURA (redeem) --------------------------------------------------------

export interface RedeemResult {
  orderId: string;
  status: "redeemed";
  totalCents: number;
  merchantName: string;
  customerName: string | null;
  redeemedAt: string;
  items: { name: string; quantity: number; lineTotalCents: number }[];
}

export async function redeemOrder(input: {
  token: string;
  merchantSlug: string;
}): Promise<RedeemResult> {
  const token = (input.token ?? "").trim();
  if (!token) throw new OrderNotFoundError();

  const merchant = await getMerchantBasic(input.merchantSlug);
  if (!merchant) throw new MerchantNotFoundError();

  return db.transaction(async (tx) => {
    const found = await tx
      .select()
      .from(orders)
      .where(eq(orders.qrToken, token))
      .then((r) => r[0]);
    if (!found) throw new OrderNotFoundError();
    if (found.merchantId !== merchant.id) throw new OrderWrongMerchantError();

    // Trava a carteira: ponto de serialização com criação/cancelamento/expiração.
    const wallet = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.id, found.walletId))
      .for("update")
      .then((r) => r[0]);
    if (!wallet) throw new Error("Carteira não encontrada.");

    // Releitura do pedido após o lock (estado estável e comprometido).
    const order = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, found.id))
      .then((r) => r[0]);

    if (order.status !== "pending") {
      throw new OrderNotRedeemableError(order.status);
    }

    // Reserva vencida → expira e libera (não captura).
    if (order.expiresAt && order.expiresAt.getTime() < Date.now()) {
      await tx
        .update(orders)
        .set({ status: "expired", updatedAt: sql`now()` })
        .where(eq(orders.id, order.id));
      await tx
        .update(wallets)
        .set({
          reservedCents: sql`GREATEST(0, ${wallets.reservedCents} - ${order.totalCents})`,
          updatedAt: sql`now()`,
        })
        .where(eq(wallets.id, wallet.id));
      throw new OrderExpiredError();
    }

    const total = order.totalCents;

    // Ledger idempotente: débito do cliente + crédito do lojista.
    const debit = await tx
      .insert(ledgerEntries)
      .values({
        eventId: order.eventId,
        walletId: wallet.id,
        entryType: "purchase_debit",
        direction: "debit",
        amountCents: total,
        balanceAfterCents: wallet.balanceCents - total,
        referenceType: "order",
        referenceId: order.id,
        description: `Pedido em ${merchant.name}`,
      })
      .onConflictDoNothing({
        target: [
          ledgerEntries.referenceType,
          ledgerEntries.referenceId,
          ledgerEntries.entryType,
        ],
      })
      .returning({ id: ledgerEntries.id });

    await tx
      .insert(ledgerEntries)
      .values({
        eventId: order.eventId,
        merchantId: merchant.id,
        entryType: "merchant_credit",
        direction: "credit",
        amountCents: total,
        balanceAfterCents: null,
        referenceType: "order",
        referenceId: order.id,
        description: `Venda do pedido ${order.id}`,
      })
      .onConflictDoNothing({
        target: [
          ledgerEntries.referenceType,
          ledgerEntries.referenceId,
          ledgerEntries.entryType,
        ],
      });

    // Só liquida o saldo se o débito foi de fato inserido agora (idempotência).
    if (debit.length > 0) {
      await tx
        .update(wallets)
        .set({
          balanceCents: sql`${wallets.balanceCents} - ${total}`,
          reservedCents: sql`GREATEST(0, ${wallets.reservedCents} - ${total})`,
          updatedAt: sql`now()`,
        })
        .where(eq(wallets.id, wallet.id));
    }

    const redeemedAt = new Date();
    await tx
      .update(orders)
      .set({ status: "redeemed", redeemedAt, updatedAt: sql`now()` })
      .where(eq(orders.id, order.id));

    const items = await tx
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));
    const consumer = await tx
      .select({ fullName: consumers.fullName })
      .from(consumers)
      .where(eq(consumers.id, order.consumerId))
      .then((r) => r[0]);

    return {
      orderId: order.id,
      status: "redeemed" as const,
      totalCents: total,
      merchantName: merchant.name,
      customerName: consumer?.fullName ?? null,
      redeemedAt: redeemedAt.toISOString(),
      items: items.map((i) => ({
        name: i.nameSnapshot,
        quantity: i.quantity,
        lineTotalCents: i.lineTotalCents,
      })),
    };
  });
}

// --- pedidos do estabelecimento ----------------------------------------------

export interface MerchantOrder {
  id: string;
  status: string;
  totalCents: number;
  createdAt: string;
  redeemedAt: string | null;
  customerName: string;
  itemsSummary: string;
  itemCount: number;
}

export async function listMerchantOrders(slug: string): Promise<MerchantOrder[]> {
  const merchant = await getMerchantBasic(slug);
  if (!merchant) return [];
  const rows = await db.query.orders.findMany({
    where: eq(orders.merchantId, merchant.id),
    orderBy: (o, { desc }) => desc(o.createdAt),
    limit: 100,
    with: {
      items: { columns: { nameSnapshot: true, quantity: true } },
      consumer: { columns: { fullName: true } },
    },
  });
  return rows.map((o) => ({
    id: o.id,
    status: o.status,
    totalCents: o.totalCents,
    createdAt: iso(o.createdAt),
    redeemedAt: isoOrNull(o.redeemedAt),
    customerName: o.consumer?.fullName ?? "Visitante",
    itemsSummary: o.items.map((i) => `${i.quantity}× ${i.nameSnapshot}`).join(", "),
    itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
  }));
}

// --- produtos (CRUD) ---------------------------------------------------------

export interface MerchantProduct {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  category: string | null;
  active: boolean;
}

export async function listMerchantProducts(slug: string): Promise<MerchantProduct[]> {
  const merchant = await getMerchantBasic(slug);
  if (!merchant) return [];
  return db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      priceCents: products.priceCents,
      imageUrl: products.imageUrl,
      category: products.category,
      active: products.active,
    })
    .from(products)
    .where(eq(products.merchantId, merchant.id))
    .orderBy(asc(products.name));
}

export interface ProductInput {
  name?: string;
  description?: string | null;
  priceCents?: number;
  imageUrl?: string | null;
  category?: string | null;
  active?: boolean;
}

export async function createProduct(
  slug: string,
  data: { name: string; priceCents: number } & ProductInput,
): Promise<MerchantProduct> {
  const merchant = await getMerchantBasic(slug);
  if (!merchant) throw new MerchantNotFoundError();
  const [row] = await db
    .insert(products)
    .values({
      merchantId: merchant.id,
      name: data.name,
      description: data.description ?? null,
      priceCents: data.priceCents,
      imageUrl: data.imageUrl ?? null,
      category: data.category ?? null,
      active: data.active ?? true,
    })
    .returning();
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priceCents: row.priceCents,
    imageUrl: row.imageUrl,
    category: row.category,
    active: row.active,
  };
}

export async function updateProduct(
  slug: string,
  productId: string,
  data: ProductInput,
): Promise<void> {
  const merchant = await getMerchantBasic(slug);
  if (!merchant) throw new MerchantNotFoundError();

  const set: Partial<typeof products.$inferInsert> = { updatedAt: new Date() };
  if (data.name !== undefined) set.name = data.name;
  if (data.description !== undefined) set.description = data.description;
  if (data.priceCents !== undefined) set.priceCents = data.priceCents;
  if (data.imageUrl !== undefined) set.imageUrl = data.imageUrl;
  if (data.category !== undefined) set.category = data.category;
  if (data.active !== undefined) set.active = data.active;

  const res = await db
    .update(products)
    .set(set)
    .where(and(eq(products.id, productId), eq(products.merchantId, merchant.id)))
    .returning({ id: products.id });
  if (res.length === 0) throw new ProductNotFoundError();
}

export async function deleteProduct(slug: string, productId: string): Promise<void> {
  const merchant = await getMerchantBasic(slug);
  if (!merchant) throw new MerchantNotFoundError();
  const res = await db
    .delete(products)
    .where(and(eq(products.id, productId), eq(products.merchantId, merchant.id)))
    .returning({ id: products.id });
  if (res.length === 0) throw new ProductNotFoundError();
}
