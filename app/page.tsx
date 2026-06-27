"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image"; // Import Next.js Image component

import { RechargeModal } from "@/components/RechargeModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatBRL } from "@/lib/money";
import { fetchBalanceCents, getWalletId } from "@/lib/wallet-client";
import { fetchMerchants, type MerchantSummary } from "@/lib/catalog-client";

const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default function HomePage() {
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [balanceCents, setBalanceCents] = useState(0);
  const [walletId, setWalletId] = useState("");
  const [merchants, setMerchants] = useState<MerchantSummary[]>([]);
  const [loadingMerchants, setLoadingMerchants] = useState(true);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (isAuthenticated !== "true") {
      router.push("/welcome");
      return;
    }
    void (async () => {
      const id = getWalletId();
      const [balance, items] = await Promise.all([
        fetchBalanceCents(id),
        fetchMerchants().catch(() => []),
      ]);
      setWalletId(id);
      setBalanceCents(balance);
      setMerchants(items);
      setLoadingMerchants(false);
    })();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    router.push("/welcome");
  };

  return (
    <>
      <main className="min-h-screen text-neutral-950">
        <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          <header className="relative z-10 flex items-center justify-between rounded-[32px] border border-black/8 bg-white/70 px-5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-7">
            <div>
              <p className="font-mono text-[0.7rem] font-medium tracking-[0.28em] text-neutral-500 uppercase">
                Walleo Eventos
              </p>
              <h1 className="mt-2 text-xl font-semibold tracking-[-0.04em] sm:text-2xl">
                Minha Carteira
              </h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-right">
                    <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-neutral-500">
                        Saldo
                    </p>
                    <p className="text-sm font-semibold text-neutral-950">
                        {formatBRL(balanceCents)}
                    </p>
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
                        <div className="px-4 py-2">
                            <p className="text-sm text-neutral-600">Logado como</p>
                            <p className="font-semibold text-neutral-800">visitante@walleo.com.br</p>
                        </div>
                        <div className="my-2 h-px bg-black/10" />
                        <a
                            href="#"
                            className="block px-4 py-2 text-sm text-neutral-700 hover:bg-black/5"
                        >
                            Meu Perfil
                        </a>
                        <a
                            href="#"
                            className="block px-4 py-2 text-sm text-neutral-700 hover:bg-black/5"
                        >
                            Extrato
                        </a>
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
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-mono text-[0.68rem] font-medium tracking-[0.24em] uppercase text-neutral-500">
                            Consumo no evento
                        </p>
                        <h2 className="mt-3 text-2xl leading-tight font-semibold tracking-[-0.04em] text-balance sm:text-[2rem]">
                            Estabelecimentos
                        </h2>
                    </div>
                    <button
                        onClick={() => setIsRechargeModalOpen(true)}
                        className="flex h-14 items-center justify-center rounded-2xl bg-neutral-950 px-6 text-base font-semibold text-white transition hover:bg-neutral-800"
                    >
                        Recarregar
                    </button>
                </div>

                <div className="mt-6 flex flex-col gap-4">
                    {loadingMerchants ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="rounded-[24px] border border-black/8 bg-white/80 p-4 flex items-center gap-6">
                                <Skeleton className="h-24 w-24 shrink-0" />
                                <div className="flex-1 space-y-3">
                                    <Skeleton className="h-5 w-40" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                        ))
                    ) : merchants.length === 0 ? (
                        <p className="py-8 text-center text-sm text-neutral-500">
                            Nenhum estabelecimento disponível.
                        </p>
                    ) : (
                        merchants.map((item) => (
                        <Link href={`/establishment/${item.slug}`} key={item.id} className="group block">
                            <div
                                className="rounded-[24px] border border-black/8 bg-white/80 p-4 flex items-center gap-6 transition-all duration-300 group-hover:bg-white group-hover:shadow-lg"
                            >
                                <div className="relative h-24 w-24 rounded-2xl overflow-hidden bg-black/5">
                                    {item.imageUrl && (
                                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-lg font-semibold text-neutral-950">
                                        {item.name}
                                    </p>
                                    <p className="mt-1 text-sm leading-6 text-neutral-600">
                                        {item.category}
                                    </p>
                                </div>
                                <svg className="h-6 w-6 text-neutral-400 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </div>
                        </Link>
                        ))
                    )}
                </div>
            </div>
          </section>
        </section>
      </main>

      <RechargeModal
        isOpen={isRechargeModalOpen}
        walletId={walletId}
        onClose={() => setIsRechargeModalOpen(false)}
        onConfirmed={(newBalanceCents) => setBalanceCents(newBalanceCents)}
      />
    </>
  );
}