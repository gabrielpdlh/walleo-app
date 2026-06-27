/**
 * Utilitários de dinheiro. Internamente o ledger trabalha em centavos inteiros
 * (evita erros de ponto flutuante). A API Confrapix espera o valor em reais.
 */

export function centsToReais(cents: number): number {
  return Math.round(cents) / 100;
}

export function reaisToCents(reais: number): number {
  return Math.round(reais * 100);
}

export function formatBRL(cents: number): string {
  return centsToReais(cents).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Mantém apenas dígitos (para CPF). */
export function onlyDigits(value: string): string {
  return (value ?? "").replace(/\D/g, "");
}

/** Validação estrutural de CPF (11 dígitos + dígitos verificadores). */
export function isValidCPF(raw: string): boolean {
  const cpf = onlyDigits(raw);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const calcCheck = (slice: string, factor: number) => {
    let total = 0;
    for (const digit of slice) total += parseInt(digit, 10) * factor--;
    const rest = (total * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  const d1 = calcCheck(cpf.slice(0, 9), 10);
  const d2 = calcCheck(cpf.slice(0, 10), 11);
  return d1 === parseInt(cpf[9], 10) && d2 === parseInt(cpf[10], 10);
}
