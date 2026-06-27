"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

import {
  fetchMerchantSession,
  merchantLogout,
  type MerchantInfo,
} from "@/lib/merchant-client";

const TABS = [
  { href: "/painel", label: "Bipar QR" },
  { href: "/painel/pedidos", label: "Pedidos" },
  { href: "/painel/produtos", label: "Produtos" },
];

/**
 * Layout do portal: gate de sessão hoisteado AQUI (persiste entre as abas, sem
 * flash nem refetch a cada navegação). A rota de login não é gateada.
 */
export default function PainelLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null);
  const [checking, setChecking] = useState(true);

  const isLogin = pathname === "/painel/login";

  useEffect(() => {
    if (isLogin) return;
    void (async () => {
      const m = await fetchMerchantSession();
      if (!m) {
        router.replace("/painel/login");
        return;
      }
      setMerchant(m);
      setChecking(false);
    })();
  }, [isLogin, router]);

  // A própria tela de login se vira (não é gateada).
  if (isLogin) return <>{children}</>;

  if (checking) {
    return (
      <main className="grid min-h-screen place-items-center text-sm text-neutral-500">
        Carregando portal…
      </main>
    );
  }

  const handleLogout = async () => {
    await merchantLogout();
    router.replace("/painel/login");
  };

  return (
    <main className="min-h-screen text-neutral-950">
      <section className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="relative z-10 flex items-center justify-between rounded-[32px] border border-black/8 bg-white/70 px-5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-7">
          <div>
            <p className="font-mono text-[0.7rem] font-medium tracking-[0.28em] text-neutral-500 uppercase">
              Portal do estabelecimento
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-[-0.04em] sm:text-2xl">
              {merchant?.name}
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            Sair
          </button>
        </header>

        <nav className="mt-4 flex gap-2">
          {TABS.map((t) => {
            const isActive = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={
                  isActive
                    ? "rounded-2xl bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white"
                    : "rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-black/5"
                }
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        <section className="mt-5 flex-1">{children}</section>
      </section>
    </main>
  );
}
