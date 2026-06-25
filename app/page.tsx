import Link from "next/link";

const highlights = [
  {
    title: "Entrada mais fluida",
    description:
      "Reduza filas com um acesso digital pensado para credenciamento e consumo no mesmo ambiente.",
  },
  {
    title: "Experiencia centralizada",
    description:
      "Saldo, recarga, extrato e pagamentos organizados em uma unica jornada.",
  },
  {
    title: "Operacao profissional",
    description:
      "Fluxo seguro para eventos que precisam de controle, agilidade e suporte assistido.",
  },
];

const steps = [
  "Acesse sua area pelo link ou codigo de convite.",
  "Valide sua entrada em poucos segundos.",
  "Use a carteira durante todo o evento.",
];

export default function Home() {
  return (
    <main className="min-h-screen text-neutral-950">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-[32px] border border-black/8 bg-white/70 px-5 py-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-mono text-[0.7rem] font-medium tracking-[0.28em] text-neutral-500 uppercase">
                TAP Eventos
              </p>
              <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.05em] text-balance sm:text-5xl">
                A carteira digital que organiza a experiencia do seu evento.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-600 sm:text-base">
                Uma plataforma mais limpa, segura e direta para entrada,
                recarga via PIX e pagamentos durante o evento.
              </p>
            </div>

            <div className="rounded-[24px] border border-emerald-900/10 bg-emerald-50/80 px-4 py-3 text-left sm:min-w-56 sm:text-right">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-emerald-800/70">
                Disponivel
              </p>
              <p className="mt-1 text-sm font-semibold text-emerald-950">
                Acesso por convite
              </p>
            </div>
          </div>
        </header>

        <section className="mt-5 grid flex-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-black/8 bg-[rgba(255,255,255,0.82)] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-7">
            <div className="rounded-[28px] border border-black/6 bg-neutral-950 px-5 py-6 text-white sm:px-6 sm:py-7">
              <p className="font-mono text-[0.68rem] font-medium tracking-[0.24em] uppercase text-white/56">
                Inicio
              </p>
              <h2 className="mt-3 max-w-xl text-2xl leading-tight font-semibold tracking-[-0.04em] text-balance sm:text-[2.1rem]">
                Entre no ambiente do evento com uma experiencia simples e
                profissional.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
                A nova tela de inicio concentra a apresentacao do produto e
                direciona o participante para a area interna de acesso.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/convite"
                className="flex h-14 items-center justify-center rounded-2xl bg-neutral-950 px-6 text-base font-semibold text-white transition hover:bg-neutral-800"
              >
                Entrar
              </Link>
              <a
                href="#como-funciona"
                className="flex h-14 items-center justify-center rounded-2xl border border-black/10 bg-white px-6 text-base font-semibold text-neutral-900 transition hover:bg-neutral-50"
              >
                Como funciona
              </a>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[24px] border border-black/8 bg-white/80 p-4"
                >
                  <p className="text-sm font-semibold text-neutral-950">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside className="grid gap-4">
            <div
              id="como-funciona"
              className="rounded-[32px] border border-black/8 bg-white/76 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:p-6"
            >
              <p className="font-mono text-[0.68rem] tracking-[0.24em] text-neutral-500 uppercase">
                Fluxo de acesso
              </p>
              <div className="mt-4 grid gap-3">
                {steps.map((step, index) => (
                  <div
                    key={step}
                    className="rounded-[24px] border border-black/7 bg-neutral-50 p-4"
                  >
                    <p className="font-mono text-[0.68rem] tracking-[0.22em] text-neutral-500 uppercase">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-neutral-700">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-black/8 bg-neutral-950 p-5 text-white shadow-[0_24px_80px_rgba(15,23,42,0.16)] sm:p-6">
              <p className="font-mono text-[0.68rem] tracking-[0.24em] text-white/55 uppercase">
                Atendimento assistido
              </p>
              <p className="mt-4 text-lg font-semibold tracking-[-0.03em] text-balance">
                Se o participante tiver qualquer divergencia no acesso, a equipe
                do evento pode concluir o processo internamente.
              </p>
              <p className="mt-3 text-sm leading-6 text-white/70">
                Isso protege a operacao e evita bloquear credenciamento,
                recarga ou consumo.
              </p>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
