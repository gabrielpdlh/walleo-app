"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

// Mock Data
const establishments = [
    { id: "bar-principal", name: "Bar Principal", category: "Bebidas" },
    { id: "food-truck-burgers", name: "Food Truck de Burgers", category: "Comida" },
    { id: "palco-sunset", name: "Bar Palco Sunset", category: "Bebidas" },
    { id: "loja-oficial", name: "Loja Oficial", category: "Produtos" },
];

const menus: { [key: string]: { id: string; name: string; price: number; image: string }[] } = {
  "bar-principal": [
    { id: "cerveja-pilsen", name: "Cerveja Pilsen", price: 12, image: "https://picsum.photos/seed/pilsen/400" },
    { id: "cerveja-ipa", name: "Cerveja IPA", price: 18, image: "https://picsum.photos/seed/ipa/400" },
    { id: "refri", name: "Refrigerante", price: 8, image: "https://picsum.photos/seed/refri/400" },
    { id: "agua-sem-gas", name: "Água sem gás", price: 5, image: "https://picsum.photos/seed/agua/400" },
  ],
  "food-truck-burgers": [
    { id: "x-burger", name: "X-Burger", price: 30, image: "https://picsum.photos/seed/burger/400" },
    { id: "x-salada", name: "X-Salada", price: 32, image: "https://picsum.photos/seed/salada/400" },
    { id: "fritas-simples", name: "Fritas Simples", price: 20, image: "https://picsum.photos/seed/fritas/400" },
  ],
  "palco-sunset": [
    { id: "gin-tonica", name: "Gin Tônica", price: 25, image: "https://picsum.photos/seed/gin/400" },
    { id: "caipirinha", name: "Caipirinha", price: 22, image: "https://picsum.photos/seed/caipi/400" },
  ],
  "loja-oficial": [
    { id: "camiseta", name: "Camiseta Oficial", price: 80, image: "https://picsum.photos/seed/shirt/400" },
    { id: "bone", name: "Boné Oficial", price: 50, image: "https://picsum.photos/seed/cap/400" },
  ],
};


const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
);

export default function EstablishmentPage() {
  const router = useRouter();
  const params = useParams();
  const establishmentId = params.id as string;

  const [credit, setCredit] = useState(100);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const establishment = establishments.find((e) => e.id === establishmentId);
  const menu = menus[establishmentId] || [];

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (isAuthenticated !== "true") {
      router.push("/welcome");
    }
    const storedCredit = localStorage.getItem('userCredit');
    if (storedCredit) {
        setCredit(parseFloat(storedCredit));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userCredit");
    router.push("/welcome");
  };

  const handlePayment = (price: number) => {
    if (credit >= price) {
      const newCredit = credit - price;
      setCredit(newCredit);
      localStorage.setItem('userCredit', newCredit.toString());
      alert("Pagamento realizado com sucesso!");
    } else {
      alert("Saldo insuficiente. Por favor, recarregue.");
    }
  };

  if (!establishment) {
    return (
        <main className="min-h-screen text-neutral-950 grid place-items-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Estabelecimento não encontrado</h1>
                <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">Voltar para a lista</Link>
            </div>
        </main>
    )
  }

  return (
    <main className="min-h-screen text-neutral-950">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="relative z-10 flex items-center justify-between rounded-[32px] border border-black/8 bg-white/70 px-5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-7">
            <div>
                <Link href="/" className="font-mono text-[0.7rem] font-medium tracking-[0.28em] text-neutral-500 uppercase hover:text-neutral-800">
                    &larr; Voltar
                </Link>
                <h1 className="mt-2 text-xl font-semibold tracking-[-0.04em] sm:text-2xl">
                    {establishment.name}
                </h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-right">
                    <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-neutral-500">
                        Saldo
                    </p>
                    <p className="text-sm font-semibold text-neutral-950">
                        R$ {credit.toFixed(2)}
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
                        Escolha seu item e pague com um clique.
                    </h2>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {menu.map((item) => (
                    <div
                        key={item.id}
                        className="rounded-[24px] border border-black/8 bg-white/80 p-4 flex flex-col group"
                    >
                        <div className="relative h-40 w-full rounded-2xl overflow-hidden mb-4">
                            <Image src={item.image} alt={item.name} layout="fill" objectFit="cover" className="transition-transform duration-300 group-hover:scale-105" />
                        </div>
                        <div className="flex-1 flex flex-col">
                            <div>
                                <p className="text-lg font-semibold text-neutral-950">
                                    {item.name}
                                </p>
                                <p className="mt-1 text-sm leading-6 text-neutral-600">
                                    R$ {item.price.toFixed(2)}
                                </p>
                            </div>
                            <button
                                onClick={() => handlePayment(item.price)}
                                disabled={credit < item.price}
                                className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl bg-neutral-950 px-5 text-base font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-40"
                            >
                                Comprar
                            </button>
                        </div>
                    </div>
                    ))}
                </div>
            </div>
          </section>
      </section>
    </main>
  );
}