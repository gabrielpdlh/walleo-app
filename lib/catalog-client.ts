/** Helpers de cliente (browser) para o catálogo (estabelecimentos e produtos). */

export interface MerchantSummary {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  imageUrl: string | null;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
}

export interface MerchantDetail extends MerchantSummary {
  products: Product[];
}

export async function fetchMerchants(): Promise<MerchantSummary[]> {
  const res = await fetch("/api/merchants", { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao carregar estabelecimentos.");
  const data = await res.json();
  return data.items ?? [];
}

/** Retorna o estabelecimento + produtos, ou null se não existir (404). */
export async function fetchMerchant(slug: string): Promise<MerchantDetail | null> {
  const res = await fetch(`/api/merchants/${slug}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Falha ao carregar estabelecimento.");
  const data = await res.json();
  return data.merchant;
}
