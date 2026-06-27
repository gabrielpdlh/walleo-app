/**
 * Seed do catálogo de demonstração — migra os mocks de `app/page.tsx` e
 * `app/establishment/[id]/page.tsx` para o banco.
 *
 * Idempotente: usa ids determinísticos + ON CONFLICT DO UPDATE, então pode
 * rodar quantas vezes quiser sem duplicar (atualiza nome/preço/imagem).
 *
 *   npx drizzle-kit migrate   # cria as tabelas
 *   npm run db:seed           # popula o catálogo
 */

import "dotenv/config";
import { sql } from "drizzle-orm";

import { DEMO_EVENT_ID } from "../lib/config";
import { db } from "./index";
import { events, merchants, products } from "./schema";

const merchantImg = (seed: string) =>
  `https://picsum.photos/seed/${seed}/600/400`;
const productImg = (seed: string) => `https://picsum.photos/seed/${seed}/400`;

const merchantRows = [
  {
    id: "mer_bar_principal",
    eventId: DEMO_EVENT_ID,
    slug: "bar-principal",
    name: "Bar Principal",
    category: "Bebidas",
    imageUrl: merchantImg("bar1"),
  },
  {
    id: "mer_food_truck_burgers",
    eventId: DEMO_EVENT_ID,
    slug: "food-truck-burgers",
    name: "Food Truck de Burgers",
    category: "Comida",
    imageUrl: merchantImg("truck1"),
  },
  {
    id: "mer_palco_sunset",
    eventId: DEMO_EVENT_ID,
    slug: "palco-sunset",
    name: "Bar Palco Sunset",
    category: "Bebidas",
    imageUrl: merchantImg("sunset"),
  },
  {
    id: "mer_loja_oficial",
    eventId: DEMO_EVENT_ID,
    slug: "loja-oficial",
    name: "Loja Oficial",
    category: "Produtos",
    imageUrl: merchantImg("store1"),
  },
];

// priceCents = preço em centavos (os mocks usavam reais).
const productRows = [
  // Bar Principal
  { id: "prd_cerveja_pilsen", merchantId: "mer_bar_principal", name: "Cerveja Pilsen", priceCents: 1200, imageUrl: productImg("pilsen") },
  { id: "prd_cerveja_ipa", merchantId: "mer_bar_principal", name: "Cerveja IPA", priceCents: 1800, imageUrl: productImg("ipa") },
  { id: "prd_refri", merchantId: "mer_bar_principal", name: "Refrigerante", priceCents: 800, imageUrl: productImg("refri") },
  { id: "prd_agua_sem_gas", merchantId: "mer_bar_principal", name: "Água sem gás", priceCents: 500, imageUrl: productImg("agua") },
  // Food Truck de Burgers
  { id: "prd_x_burger", merchantId: "mer_food_truck_burgers", name: "X-Burger", priceCents: 3000, imageUrl: productImg("burger") },
  { id: "prd_x_salada", merchantId: "mer_food_truck_burgers", name: "X-Salada", priceCents: 3200, imageUrl: productImg("salada") },
  { id: "prd_fritas_simples", merchantId: "mer_food_truck_burgers", name: "Fritas Simples", priceCents: 2000, imageUrl: productImg("fritas") },
  // Bar Palco Sunset
  { id: "prd_gin_tonica", merchantId: "mer_palco_sunset", name: "Gin Tônica", priceCents: 2500, imageUrl: productImg("gin") },
  { id: "prd_caipirinha", merchantId: "mer_palco_sunset", name: "Caipirinha", priceCents: 2200, imageUrl: productImg("caipi") },
  // Loja Oficial
  { id: "prd_camiseta", merchantId: "mer_loja_oficial", name: "Camiseta Oficial", priceCents: 8000, imageUrl: productImg("shirt") },
  { id: "prd_bone", merchantId: "mer_loja_oficial", name: "Boné Oficial", priceCents: 5000, imageUrl: productImg("cap") },
];

async function seed() {
  console.log("→ Semeando evento, estabelecimentos e produtos…");

  await db
    .insert(events)
    .values({ id: DEMO_EVENT_ID, name: "Festival Walleo", status: "active" })
    .onConflictDoUpdate({
      target: events.id,
      set: { name: sql`excluded.name`, updatedAt: sql`now()` },
    });

  await db
    .insert(merchants)
    .values(merchantRows)
    .onConflictDoUpdate({
      target: merchants.id,
      set: {
        slug: sql`excluded.slug`,
        name: sql`excluded.name`,
        category: sql`excluded.category`,
        imageUrl: sql`excluded.image_url`,
        updatedAt: sql`now()`,
      },
    });

  await db
    .insert(products)
    .values(productRows)
    .onConflictDoUpdate({
      target: products.id,
      set: {
        name: sql`excluded.name`,
        priceCents: sql`excluded.price_cents`,
        imageUrl: sql`excluded.image_url`,
        updatedAt: sql`now()`,
      },
    });

  console.log(
    `✓ Seed concluído: 1 evento, ${merchantRows.length} estabelecimentos, ${productRows.length} produtos.`,
  );
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("✗ Falha no seed:", err);
    process.exit(1);
  });
