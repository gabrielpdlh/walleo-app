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
    category: "Bar & Comida",
    imageUrl: "/products/bar-sunset.jpg",
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
  // Bar Palco Sunset — cardápio completo (fotos reais em public/products)
  { id: "prd_espetinho_carne", merchantId: "mer_palco_sunset", name: "Espetinho de Carne", priceCents: 1200, imageUrl: "/products/espetinho-carne.jpg" },
  { id: "prd_espetinho_frango", merchantId: "mer_palco_sunset", name: "Espetinho de Frango", priceCents: 1000, imageUrl: "/products/espetinho-frango.jpg" },
  { id: "prd_hamburguer", merchantId: "mer_palco_sunset", name: "Hambúrguer Artesanal", priceCents: 2800, imageUrl: "/products/hamburguer.jpg" },
  { id: "prd_cachorro_quente", merchantId: "mer_palco_sunset", name: "Cachorro-quente", priceCents: 1800, imageUrl: "/products/cachorro-quente.jpg" },
  { id: "prd_batata_frita", merchantId: "mer_palco_sunset", name: "Batata Frita", priceCents: 2000, imageUrl: "/products/batata-frita.jpg" },
  { id: "prd_pastel", merchantId: "mer_palco_sunset", name: "Pastel", priceCents: 1500, imageUrl: "/products/pastel.jpg" },
  { id: "prd_cerveja_long", merchantId: "mer_palco_sunset", name: "Cerveja Long Neck", priceCents: 1200, imageUrl: "/products/cerveja.jpg" },
  { id: "prd_chopp", merchantId: "mer_palco_sunset", name: "Chopp", priceCents: 1000, imageUrl: "/products/chopp.jpg" },
  { id: "prd_gin_tonica", merchantId: "mer_palco_sunset", name: "Gin Tônica", priceCents: 2500, imageUrl: "/products/gin-tonica.jpg" },
  { id: "prd_caipirinha", merchantId: "mer_palco_sunset", name: "Caipirinha", priceCents: 2200, imageUrl: "/products/caipirinha.jpg" },
  { id: "prd_refrigerante_ps", merchantId: "mer_palco_sunset", name: "Refrigerante", priceCents: 800, imageUrl: "/products/refrigerante.jpg" },
  { id: "prd_agua_ps", merchantId: "mer_palco_sunset", name: "Água Mineral", priceCents: 500, imageUrl: "/products/agua.jpg" },
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
