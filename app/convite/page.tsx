import Link from "next/link";

const benefits = [
  "Valide seu convite com rapidez.",
  "Acesse saldo, recarga e pagamentos.",
  "Entre no fluxo do evento com seguranca.",
];

export default function ConvitePage() {
  return (
    <main className="min-h-screen text-neutral-950">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-[32px] border border-black/8 bg-white/70 px-5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-7">
          <div>
            <p className="font-mono text-[0.7rem] font-medium tracking-[0.28em] text-neutral-500 uppercase">
              TAP Eventos
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-[-0.04em] sm:text-2xl">
              Codigo de convite
            </h1>
          </div>

          <Link
            href="/"
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
          >
            Voltar
          </Link>
        </header>

        <section className="mt-5 grid flex-1 gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[32px] border border-black/8 bg-[rgba(255,255,255,0.82)] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-7">
            <div className="rounded-[28px] border border-black/6 bg-neutral-950 px-5 py-6 text-white sm:px-6">
              <p className="font-mono text-[0.68rem] font-medium tracking-[0.24em] uppercase text-white/56">
                Area interna
              </p>
              <h2 className="mt-3 text-2xl leading-tight font-semibold tracking-[-0.04em] text-balance sm:text-[2rem]">
                Digite o codigo enviado para liberar sua entrada.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
                Esse fluxo foi separado da home para deixar o acesso mais claro
                e manter a navegacao mais organizada.
              </p>
            </div>

            <form className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="invite-code"
                  className="mb-2 block text-sm font-medium text-neutral-800"
                >
                  Codigo de convite
                </label>
                <input
                  id="invite-code"
                  name="invite-code"
                  type="text"
                  inputMode="text"
                  placeholder="Digite seu codigo"
                  className="h-14 w-full rounded-2xl border border-black/10 bg-white px-4 text-base uppercase tracking-[0.18em] text-neutral-950 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-neutral-400 focus:border-neutral-950/30 focus:ring-4 focus:ring-neutral-950/6"
                />
              </div>

              <button
                type="button"
                className="flex h-14 w-full items-center justify-center rounded-2xl bg-neutral-950 px-5 text-base font-semibold text-white transition hover:bg-neutral-800"
              >
                Validar convite
              </button>
            </form>
          </div>

          <aside className="grid gap-4">
            <div className="rounded-[32px] border border-black/8 bg-white/76 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:p-6">
              <p className="font-mono text-[0.68rem] tracking-[0.24em] text-neutral-500 uppercase">
                O que acontece depois
              </p>
              <div className="mt-4 grid gap-3">
                {benefits.map((item, index) => (
                  <div
                    key={item}
                    className="rounded-[24px] border border-black/7 bg-neutral-50 p-4"
                  >
                    <p className="font-mono text-[0.68rem] tracking-[0.22em] text-neutral-500 uppercase">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-neutral-700">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-black/8 bg-neutral-950 p-5 text-white shadow-[0_24px_80px_rgba(15,23,42,0.16)] sm:p-6">
              <p className="font-mono text-[0.68rem] tracking-[0.24em] text-white/55 uppercase">
                Suporte
              </p>
              <p className="mt-4 text-lg font-semibold tracking-[-0.03em] text-balance">
                Caso o codigo esteja invalido ou expirado, o atendimento pode
                orientar o participante e concluir a liberacao.
              </p>
              <p className="mt-3 text-sm leading-6 text-white/70">
                O fluxo manual continua disponivel para garantir continuidade na
                operacao do evento.
              </p>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
