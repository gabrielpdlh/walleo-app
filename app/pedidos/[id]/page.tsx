"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { Skeleton } from "@/components/ui/Skeleton";
import { formatBRL } from "@/lib/money";
import { fetchCustomerSession } from "@/lib/customer-client";
import {
  cancelOrder,
  fetchOrder,
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABELS,
  type OrderDetail,
} from "@/lib/orders-client";

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        ORDER_STATUS_BADGE[status] ?? "bg-neutral-200 text-neutral-600"
      }`}
    >
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function countdownLabel(expiresAt: string | null, nowMs: number): string | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - nowMs;
  if (Number.isNaN(ms)) return null;
  if (ms <= 0) return "expirando…";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [authed, setAuthed] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchOrder(orderId);
      if (!data) setNotFound(true);
      else setOrder(data);
    } catch {
      // mantém o último estado conhecido; o próximo ciclo tenta de novo.
    }
  }, [orderId]);

  useEffect(() => {
    void (async () => {
      const session = await fetchCustomerSession();
      if (!session) {
        router.replace("/welcome");
        return;
      }
      setAuthed(true);
      await load();
      setLoading(false);
    })();
  }, [router, load]);

  // Enquanto pendente: contagem regressiva (1s) + polling de status (5s).
  useEffect(() => {
    if (order?.status !== "pending") return;
    const tick = setInterval(() => setNowMs(Date.now()), 1000);
    const poll = setInterval(() => {
      void load();
    }, 5000);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [order?.status, load]);

  const handleCancel = async () => {
    if (cancelling) return;
    setCancelling(true);
    setError(null);
    try {
      await cancelOrder(orderId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao cancelar pedido.");
    } finally {
      setCancelling(false);
    }
  };

  if (!authed) {
    return (
      <main className="grid min-h-screen place-items-center text-sm text-neutral-500">
        Carregando…
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen text-neutral-950 grid place-items-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Pedido não encontrado</h1>
          <Link href="/pedidos" className="mt-4 inline-block text-blue-600 hover:underline">
            Voltar para Meus Pedidos
          </Link>
        </div>
      </main>
    );
  }

  const countdown =
    order?.status === "pending" ? countdownLabel(order.expiresAt, nowMs) : null;

  return (
    <main className="min-h-screen text-neutral-950">
      <section className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="relative z-10 flex items-center justify-between rounded-[32px] border border-black/8 bg-white/70 px-5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-7">
          <div>
            <Link href="/pedidos" className="font-mono text-[0.7rem] font-medium tracking-[0.28em] text-neutral-500 uppercase hover:text-neutral-800">
              &larr; Meus Pedidos
            </Link>
            {order ? (
              <h1 className="mt-2 text-xl font-semibold tracking-[-0.04em] sm:text-2xl">
                {order.merchantName}
              </h1>
            ) : (
              <Skeleton className="mt-2 h-7 w-44" />
            )}
          </div>
          {order && <StatusBadge status={order.status} />}
        </header>

        <section className="mt-5 flex-1">
          <div className="rounded-[32px] border border-black/8 bg-[rgba(255,255,255,0.82)] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-7 h-full">
            {loading || !order ? (
              <div className="space-y-4">
                <Skeleton className="mx-auto h-64 w-64" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                {order.status === "pending" && order.qrDataUrl && (
                  <div className="rounded-[28px] border border-black/6 bg-neutral-950 px-5 py-6 text-center text-white">
                    <p className="font-mono text-[0.68rem] font-medium tracking-[0.24em] uppercase text-white/56">
                      Apresente no balcão
                    </p>
                    <div className="mt-4 flex justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={order.qrDataUrl}
                        alt="QR Code do pedido"
                        className="h-64 w-64 rounded-2xl bg-white object-contain p-3"
                      />
                    </div>
                    {countdown && (
                      <p className="mt-4 text-sm text-white/70">
                        Reserva expira em{" "}
                        <span className="font-semibold tabular-nums text-white">{countdown}</span>
                      </p>
                    )}
                  </div>
                )}

                {order.status !== "pending" && (
                  <div className="rounded-[28px] border border-black/8 bg-white/70 px-5 py-6 text-center">
                    <p className="text-sm text-neutral-600">
                      {order.status === "redeemed" && "Pedido resgatado. Bom proveito!"}
                      {order.status === "cancelled" && "Pedido cancelado. O saldo reservado foi liberado."}
                      {order.status === "expired" && "Pedido expirado. O saldo reservado foi liberado."}
                    </p>
                  </div>
                )}

                <div>
                  <p className="font-mono text-[0.68rem] font-medium tracking-[0.24em] uppercase text-neutral-500">
                    Itens
                  </p>
                  <ul className="mt-3 divide-y divide-black/8">
                    {order.items.map((it) => (
                      <li key={it.id} className="flex items-center justify-between py-3">
                        <span className="text-sm text-neutral-800">
                          <span className="font-semibold tabular-nums">{it.quantity}×</span>{" "}
                          {it.name}
                          <span className="ml-1 text-neutral-500">
                            ({formatBRL(it.unitPriceCents)})
                          </span>
                        </span>
                        <span className="text-sm font-semibold text-neutral-950">
                          {formatBRL(it.lineTotalCents)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3">
                    <span className="text-base font-semibold text-neutral-950">Total</span>
                    <span className="text-base font-semibold text-neutral-950">
                      {formatBRL(order.totalCents)}
                    </span>
                  </div>
                </div>

                {error && <p className="text-sm font-medium text-red-600">{error}</p>}

                {order.status === "pending" && (
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="flex h-12 w-full items-center justify-center rounded-2xl border border-red-200 bg-white px-5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {cancelling ? "Cancelando…" : "Cancelar pedido"}
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
