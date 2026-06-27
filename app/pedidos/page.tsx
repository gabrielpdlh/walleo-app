"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Skeleton } from "@/components/ui/Skeleton";
import { formatBRL } from "@/lib/money";
import { fetchCustomerSession } from "@/lib/customer-client";
import {
  fetchOrders,
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABELS,
  type OrderSummary,
} from "@/lib/orders-client";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${
        ORDER_STATUS_BADGE[status] ?? "bg-neutral-200 text-neutral-600"
      }`}
    >
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    void (async () => {
      const session = await fetchCustomerSession();
      if (!session) {
        router.replace("/welcome");
        return;
      }
      setAuthed(true);
      const items = await fetchOrders();
      setOrders(items);
      setLoading(false);
    })();
  }, [router]);

  if (!authed) {
    return (
      <main className="grid min-h-screen place-items-center text-sm text-neutral-500">
        Carregando…
      </main>
    );
  }

  return (
    <main className="min-h-screen text-neutral-950">
      <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="relative z-10 rounded-[32px] border border-black/8 bg-white/70 px-5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-7">
          <Link href="/" className="font-mono text-[0.7rem] font-medium tracking-[0.28em] text-neutral-500 uppercase hover:text-neutral-800">
            &larr; Voltar
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-[-0.04em] sm:text-2xl">
            Meus Pedidos
          </h1>
        </header>

        <section className="mt-5 flex-1">
          <div className="rounded-[32px] border border-black/8 bg-[rgba(255,255,255,0.82)] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-7 h-full">
            <div className="flex flex-col gap-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-[24px] border border-black/8 bg-white/80 p-4">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="mt-3 h-4 w-56" />
                    <Skeleton className="mt-3 h-4 w-24" />
                  </div>
                ))
              ) : orders.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-neutral-500">
                    Você ainda não tem pedidos.
                  </p>
                  <Link
                    href="/"
                    className="mt-4 inline-flex h-12 items-center justify-center rounded-2xl bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800"
                  >
                    Ver estabelecimentos
                  </Link>
                </div>
              ) : (
                orders.map((o) => (
                  <Link key={o.id} href={`/pedidos/${o.id}`} className="group block">
                    <div className="rounded-[24px] border border-black/8 bg-white/80 p-4 transition-all duration-300 group-hover:bg-white group-hover:shadow-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-lg font-semibold text-neutral-950">
                            {o.merchantName}
                          </p>
                          <p className="mt-1 truncate text-sm text-neutral-600">
                            {o.itemsSummary}
                          </p>
                        </div>
                        <StatusBadge status={o.status} />
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-base font-semibold text-neutral-950">
                          {formatBRL(o.totalCents)}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {formatDateTime(o.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
