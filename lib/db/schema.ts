/**
 * Schema do banco (Drizzle + PostgreSQL) — proposta inicial.
 *
 * Princípios herdados de docs/discovery/initial-domain-model.md:
 *  - O saldo da carteira é coerente com o ledger (saldo materializado p/ leitura).
 *  - Recarga e consumo são EVENTOS de domínio (linhas no ledger), não só campos.
 *  - O estabelecimento recebe CRÉDITO LÓGICO, não liquidação imediata.
 *  - IDs opacos e independentes de dado pessoal.
 *
 * Novidades desta fase (não estavam no modelo documentado):
 *  - `products`      → cardápio do estabelecimento (cadastrar item, mudar preço).
 *  - `merchant_users`→ login do "ambiente do estabelecimento".
 *  - `orders`/`order_items` → pedido do cliente com QR validado pelo estabelecimento.
 *    (generaliza o antigo `Charge`: produz os mesmos efeitos no ledger.)
 */

import { randomBytes, randomUUID } from "node:crypto";
import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Helpers de ID
// ---------------------------------------------------------------------------

/** ID opaco e prefixado, ex.: `ord_3f9a...`. Bom para logs e debugging. */
const id = (prefix: string) =>
  text("id")
    .primaryKey()
    .$defaultFn(() => `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 22)}`);

/** Token de alta entropia para o QR do pedido (separado do id, não-adivinhável). */
const qrToken = () => randomBytes(24).toString("base64url");

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const eventStatus = pgEnum("event_status", ["draft", "active", "closed"]);
export const consumerStatus = pgEnum("consumer_status", [
  "pending_access",
  "active",
  "blocked",
]);
export const merchantStatus = pgEnum("merchant_status", ["active", "inactive"]);
export const merchantUserRole = pgEnum("merchant_user_role", ["owner", "staff"]);
export const walletStatus = pgEnum("wallet_status", [
  "created",
  "active",
  "blocked",
  "closed",
]);
export const topUpStatus = pgEnum("top_up_status", [
  "created",
  "pending",
  "processing",
  "confirmed",
  "failed",
  "expired",
  "canceled",
]);
/**
 * Ciclo de vida do pedido — modelo RESERVA + CAPTURA.
 *  - pending   : criado, QR gerado, valor RESERVADO (wallets.reserved_cents).
 *                O saldo disponível (balance - reserved) já reflete o pedido.
 *  - redeemed  : staff bipou o QR → CAPTURA (débito real + crédito do lojista)
 *                e entrega. A reserva vira liquidação.
 *  - cancelled : cancelado antes da bipada → reserva liberada.
 *  - expired   : expirou sem bipar → reserva liberada (nunca houve débito real).
 */
export const orderStatus = pgEnum("order_status", [
  "pending",
  "redeemed",
  "cancelled",
  "expired",
]);
export const ledgerEntryType = pgEnum("ledger_entry_type", [
  "top_up",
  "purchase_debit",
  "merchant_credit",
  "refund",
  "adjustment",
]);
export const ledgerDirection = pgEnum("ledger_direction", ["credit", "debit"]);
export const ledgerRefType = pgEnum("ledger_ref_type", [
  "top_up",
  "order",
  "adjustment",
]);

// ---------------------------------------------------------------------------
// Event
// ---------------------------------------------------------------------------

export const events = pgTable("events", {
  id: id("evt"),
  name: text("name").notNull(),
  status: eventStatus("status").notNull().default("active"),
  location: text("location"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Consumer (frequentador)
// ---------------------------------------------------------------------------

export const consumers = pgTable(
  "consumers",
  {
    id: id("con"),
    fullName: text("full_name").notNull(),
    email: text("email"),
    cpf: text("cpf"),
    phone: text("phone"),
    status: consumerStatus("status").notNull().default("active"),
    ...timestamps,
  },
  (t) => [uniqueIndex("consumers_email_uq").on(t.email)],
);

// ---------------------------------------------------------------------------
// Merchant (estabelecimento) + usuários do estabelecimento
// ---------------------------------------------------------------------------

export const merchants = pgTable(
  "merchants",
  {
    id: id("mer"),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category"),
    description: text("description"),
    status: merchantStatus("status").notNull().default("active"),
    ...timestamps,
  },
  (t) => [index("merchants_event_idx").on(t.eventId)],
);

export const merchantUsers = pgTable(
  "merchant_users",
  {
    id: id("mus"),
    merchantId: text("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: merchantUserRole("role").notNull().default("staff"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("merchant_users_email_uq").on(t.email),
    index("merchant_users_merchant_idx").on(t.merchantId),
  ],
);

// ---------------------------------------------------------------------------
// Product (item do cardápio)
// ---------------------------------------------------------------------------

export const products = pgTable(
  "products",
  {
    id: id("prd"),
    merchantId: text("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    priceCents: integer("price_cents").notNull(),
    imageUrl: text("image_url"),
    category: text("category"),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (t) => [index("products_merchant_idx").on(t.merchantId)],
);

// ---------------------------------------------------------------------------
// Wallet (carteira do frequentador no evento)
// ---------------------------------------------------------------------------

export const wallets = pgTable(
  "wallets",
  {
    id: id("wal"),
    consumerId: text("consumer_id")
      .notNull()
      .references(() => consumers.id, { onDelete: "cascade" }),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    // Saldo LIQUIDADO (materializado p/ leitura; fonte conceitual é o ledger).
    balanceCents: integer("balance_cents").notNull().default(0),
    // Valor RESERVADO por pedidos pending (modelo reserva+captura).
    // Saldo disponível exibido ao cliente = balance_cents - reserved_cents.
    reservedCents: integer("reserved_cents").notNull().default(0),
    currency: text("currency").notNull().default("BRL"),
    status: walletStatus("status").notNull().default("active"),
    ...timestamps,
  },
  (t) => [
    // Uma carteira por consumidor por evento.
    uniqueIndex("wallets_consumer_event_uq").on(t.consumerId, t.eventId),
  ],
);

// ---------------------------------------------------------------------------
// TopUp (recarga via PIX — integração Confrapix)
// ---------------------------------------------------------------------------

export const topUps = pgTable(
  "top_ups",
  {
    id: id("top"),
    walletId: text("wallet_id")
      .notNull()
      .references(() => wallets.id, { onDelete: "cascade" }),
    amountCents: integer("amount_cents").notNull(),
    status: topUpStatus("status").notNull().default("pending"),
    // Dados usados na cobrança PIX.
    customerName: text("customer_name"),
    customerDocument: text("customer_document"),
    // Rastreabilidade com o provedor.
    provider: text("provider").notNull().default("confrapix"),
    providerTransactionId: text("provider_transaction_id"), // id numérico da Confrapix
    providerUuid: text("provider_uuid"),
    txid: text("txid"),
    pixQrCode: text("pix_qr_code"), // base64/url do QR
    pixCopyPasteCode: text("pix_copy_paste_code"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("top_ups_wallet_idx").on(t.walletId),
    uniqueIndex("top_ups_provider_uuid_uq").on(t.providerUuid),
  ],
);

// ---------------------------------------------------------------------------
// Order (pedido do cliente) + itens
// ---------------------------------------------------------------------------

export const orders = pgTable(
  "orders",
  {
    id: id("ord"),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    merchantId: text("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "restrict" }),
    walletId: text("wallet_id")
      .notNull()
      .references(() => wallets.id, { onDelete: "restrict" }),
    consumerId: text("consumer_id")
      .notNull()
      .references(() => consumers.id, { onDelete: "restrict" }),
    status: orderStatus("status").notNull().default("pending"),
    totalCents: integer("total_cents").notNull(),
    // O QR codifica este token (ou uma URL contendo-o); validado no servidor.
    qrToken: text("qr_token").notNull().$defaultFn(qrToken),
    note: text("note"),
    // Quem (staff) bipou/capturou o pedido.
    validatedByUserId: text("validated_by_user_id").references(
      () => merchantUsers.id,
      { onDelete: "set null" },
    ),
    // Captura (débito real) acontece na bipada → coincide com redeemedAt.
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    // Expiração da RESERVA (não da cobrança PIX). Padrão app: ~60 min, configurável.
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("orders_qr_token_uq").on(t.qrToken),
    index("orders_wallet_idx").on(t.walletId),
    index("orders_merchant_idx").on(t.merchantId),
    index("orders_status_idx").on(t.status),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: id("oit"),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    // Mantém referência, mas o snapshot abaixo preserva o histórico mesmo que
    // o produto seja editado/removido depois.
    productId: text("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    nameSnapshot: text("name_snapshot").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull().default(1),
    lineTotalCents: integer("line_total_cents").notNull(),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

// ---------------------------------------------------------------------------
// LedgerEntry (livro-razão imutável — fonte da verdade do saldo)
// ---------------------------------------------------------------------------

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: id("led"),
    eventId: text("event_id").references(() => events.id, { onDelete: "set null" }),
    // walletId p/ entradas do frequentador; merchantId p/ crédito lógico do lojista.
    walletId: text("wallet_id").references(() => wallets.id, {
      onDelete: "cascade",
    }),
    merchantId: text("merchant_id").references(() => merchants.id, {
      onDelete: "set null",
    }),
    entryType: ledgerEntryType("entry_type").notNull(),
    direction: ledgerDirection("direction").notNull(),
    amountCents: integer("amount_cents").notNull(), // magnitude positiva
    balanceAfterCents: integer("balance_after_cents"), // saldo da carteira após (quando aplicável)
    referenceType: ledgerRefType("reference_type").notNull(),
    referenceId: text("reference_id").notNull(),
    description: text("description"),
    createdAt: timestamps.createdAt,
  },
  (t) => [
    index("ledger_wallet_idx").on(t.walletId),
    index("ledger_merchant_idx").on(t.merchantId),
    // IDEMPOTÊNCIA: no máximo uma entrada de cada tipo por referência.
    // (1 top_up por recarga; 1 purchase_debit e 1 merchant_credit por pedido.)
    uniqueIndex("ledger_idempotency_uq").on(
      t.referenceType,
      t.referenceId,
      t.entryType,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Relations (ergonomia de query)
// ---------------------------------------------------------------------------

export const eventsRelations = relations(events, ({ many }) => ({
  merchants: many(merchants),
  wallets: many(wallets),
  orders: many(orders),
}));

export const merchantsRelations = relations(merchants, ({ one, many }) => ({
  event: one(events, { fields: [merchants.eventId], references: [events.id] }),
  users: many(merchantUsers),
  products: many(products),
  orders: many(orders),
}));

export const merchantUsersRelations = relations(merchantUsers, ({ one }) => ({
  merchant: one(merchants, {
    fields: [merchantUsers.merchantId],
    references: [merchants.id],
  }),
}));

export const productsRelations = relations(products, ({ one }) => ({
  merchant: one(merchants, {
    fields: [products.merchantId],
    references: [merchants.id],
  }),
}));

export const consumersRelations = relations(consumers, ({ many }) => ({
  wallets: many(wallets),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  consumer: one(consumers, {
    fields: [wallets.consumerId],
    references: [consumers.id],
  }),
  event: one(events, { fields: [wallets.eventId], references: [events.id] }),
  topUps: many(topUps),
  orders: many(orders),
  ledgerEntries: many(ledgerEntries),
}));

export const topUpsRelations = relations(topUps, ({ one }) => ({
  wallet: one(wallets, { fields: [topUps.walletId], references: [wallets.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  event: one(events, { fields: [orders.eventId], references: [events.id] }),
  merchant: one(merchants, {
    fields: [orders.merchantId],
    references: [merchants.id],
  }),
  wallet: one(wallets, { fields: [orders.walletId], references: [wallets.id] }),
  consumer: one(consumers, {
    fields: [orders.consumerId],
    references: [consumers.id],
  }),
  validatedBy: one(merchantUsers, {
    fields: [orders.validatedByUserId],
    references: [merchantUsers.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const ledgerEntriesRelations = relations(ledgerEntries, ({ one }) => ({
  wallet: one(wallets, {
    fields: [ledgerEntries.walletId],
    references: [wallets.id],
  }),
  merchant: one(merchants, {
    fields: [ledgerEntries.merchantId],
    references: [merchants.id],
  }),
}));
