"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { Skeleton } from "@/components/ui/Skeleton";
import { formatBRL } from "@/lib/money";
import { fetchWallet } from "@/lib/wallet-client";
import { fetchCustomerSession, customerLogout } from "@/lib/customer-client";
import { createOrder } from "@/lib/orders-client";
import { fetchMerchant, type MerchantDetail } from "@/lib/catalog-client";

const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default function EstablishmentPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.id as string;

  const [availableCents, setAvailableCents] = useState(0);
  const [reservedCents, setReservedCents] = useState(0);
  const [merchant, setMerchant] = useState<MerchantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Carrinho local: productId → quantidade. Validado no servidor ao finalizar.
  const [cart, setCart] = useState<Record<string, number>>({});
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const session = await fetchCustomerSession();
      if (!session) {
        router.replace("/welcome");
        return;
      }
      const [wallet, data] = await Promise.all([
        fetchWallet(),
        fetchMerchant(slug).catch(() => null),
      ]);
      setAvailableCents(wallet.availableCents);
      setReservedCents(wallet.reservedCents);
      setMerchant(data);
      setLoading(false);
    })();
  }, [router, slug]);

  const handleLogout = async () => {
    await customerLogout();
    router.replace("/welcome");
  };

  const addItem = (id: string) =>
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));

  const decItem = (id: string) =>
    setCart((c) => {
      const next = { ...c };
      const n = (next[id] ?? 0) - 1;
      if (n <= 0) delete next[id];
      else next[id] = n;
      return next;
    });

  const { totalCents, itemCount } = useMemo(() => {
    let total = 0;
    let count = 0;
    for (const p of merchant?.products ?? []) {
      const qty = cart[p.id] ?? 0;
      total += qty * p.priceCents;
      count += qty;
    }
    return { totalCents: total, itemCount: count };
  }, [cart, merchant]);

  const insufficient = totalCents > availableCents;

  const handlePlaceOrder = async () => {
    if (placing || itemCount === 0 || insufficient) return;
    setPlacing(true);
    setError(null);
    try {
      const items = Object.entries(cart).map(([productId, quantity]) => ({
        productId,
        quantity,
      }));
      const { id } = await createOrder({ merchantSlug: slug, items });
      router.push(`/pedidos/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao criar pedido.");
      setPlacing(false);
    }
  };

  if (!loading && !merchant) {
    return (
      <main className="min-h-screen text-neutral-950 grid place-items-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Estabelecimento não encontrado</h1>
          <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
            Voltar para a lista
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-neutral-950">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 pb-32 sm:px-6 lg:px-8">
        <header className="relative z-10 flex items-center justify-between rounded-[32px] border border-black/8 bg-white/70 px-5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-7">
          <div>
            <Link href="/" className="font-mono text-[0.7rem] font-medium tracking-[0.28em] text-neutral-500 uppercase hover:text-neutral-800">
              &larr; Voltar
            </Link>
            {merchant ? (
              <h1 className="mt-2 text-xl font-semibold tracking-[-0.04em] sm:text-2xl">
                {merchant.name}
              </h1>
            ) : (
              <Skeleton className="mt-2 h-7 w-48" />
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-right">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-neutral-500">
                Disponível
              </p>
              <p className="text-sm font-semibold text-neutral-950">
                {formatBRL(availableCents)}
              </p>
              {reservedCents > 0 && (
                <p className="text-[0.7rem] text-amber-600">
                  {formatBRL(reservedCents)} reservado
                </p>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-black/8 bg-white/80"
              >
                <UserIcon className="h-6 w-6 text-neutral-700" />
              </button>
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-black/8 bg-white py-2 shadow-xl backdrop-blur-xl">
                  <Link
                    href="/pedidos"
                    className="block px-4 py-2 text-sm text-neutral-700 hover:bg-black/5"
                  >
                    Meus Pedidos
                  </Link>
                  <div className="my-2 h-px bg-black/10" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-black/5"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="mt-5 flex-1">
          <div className="rounded-[32px] border border-black/8 bg-[rgba(255,255,255,0.82)] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-7 h-full">
            <div className="rounded-[28px] border border-black/6 bg-neutral-950 px-5 py-6 text-white sm:px-6">
              <p className="font-mono text-[0.68rem] font-medium tracking-[0.24em] uppercase text-white/56">
                Cardápio
              </p>
              <h2 className="mt-3 text-2xl leading-tight font-semibold tracking-[-0.04em] text-balance sm:text-[2rem]">
                Monte seu pedido e gere um QR para retirar.
              </h2>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-[24px] border border-black/8 bg-white/80 p-4">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="mt-4 h-5 w-32" />
                    <Skeleton className="mt-2 h-4 w-20" />
                    <Skeleton className="mt-4 h-12 w-full" />
                  </div>
                ))
              ) : merchant && merchant.products.length === 0 ? (
                <p className="col-span-full py-8 text-center text-sm text-neutral-500">
                  Este estabelecimento ainda não tem itens no cardápio.
                </p>
              ) : (
                merchant?.products.map((item) => {
                  const qty = cart[item.id] ?? 0;
                  return (
                    <div
                      key={item.id}
                      className="rounded-[24px] border border-black/8 bg-white/80 p-4 flex flex-col group"
                    >
                      <div className="relative h-40 w-full rounded-2xl overflow-hidden mb-4 bg-black/5">
                        {item.imageUrl && (
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="flex-1">
                          <p className="text-lg font-semibold text-neutral-950">
                            {item.name}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-neutral-600">
                            {formatBRL(item.priceCents)}
                          </p>
                        </div>
                        {qty === 0 ? (
                          <button
                            onClick={() => addItem(item.id)}
                            className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl bg-neutral-950 px-5 text-base font-semibold text-white transition hover:bg-neutral-800"
                          >
                            Adicionar
                          </button>
                        ) : (
                          <div className="mt-4 flex h-12 w-full items-center justify-between rounded-2xl border border-neutral-950/15 bg-white px-2">
                            <button
                              onClick={() => decItem(item.id)}
                              aria-label="Remover um"
                              className="flex h-9 w-9 items-center justify-center rounded-xl text-xl font-semibold text-neutral-700 transition hover:bg-black/5"
                            >
                              −
                            </button>
                            <span className="text-base font-semibold tabular-nums">{qty}</span>
                            <button
                              onClick={() => addItem(item.id)}
                              aria-label="Adicionar um"
                              className="flex h-9 w-9 items-center justify-center rounded-xl text-xl font-semibold text-neutral-700 transition hover:bg-black/5"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </section>

      {/* Barra de checkout fixa — só aparece quando há itens no carrinho. */}
      {itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 px-4 pb-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl rounded-[28px] border border-black/8 bg-white/90 p-4 shadow-[0_-12px_50px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-5">
            <div>
              <p className="text-sm text-neutral-600">
                {itemCount} {itemCount === 1 ? "item" : "itens"} · Total{" "}
                <span className="font-semibold text-neutral-950">{formatBRL(totalCents)}</span>
              </p>
              {insufficient ? (
                <p className="mt-1 text-sm font-medium text-red-600">
                  Saldo insuficiente — disponível {formatBRL(availableCents)}.
                </p>
              ) : (
                error && <p className="mt-1 text-sm font-medium text-red-600">{error}</p>
              )}
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={placing || insufficient}
              className="mt-3 flex h-14 w-full items-center justify-center rounded-2xl bg-neutral-950 px-6 text-base font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-40 sm:mt-0 sm:w-auto"
            >
              {placing ? "Criando pedido…" : "Fazer pedido"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
