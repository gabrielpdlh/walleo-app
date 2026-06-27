import { NextResponse } from "next/server";
import {
  ConfrapixError,
  createPixTopUp,
  toConfrapixDate,
} from "@/lib/confrapix";
import { isValidCPF, onlyDigits } from "@/lib/money";
import { createTopUp } from "@/lib/store";

const MIN_CENTS = 100; // R$ 1,00
const MAX_CENTS = 5_000_00; // R$ 5.000,00
const EXPIRATION_MINUTES = 30;

export async function POST(req: Request) {
  let body: {
    walletId?: string;
    amountCents?: number;
    cpf?: string;
    name?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const { walletId, amountCents, cpf, name } = body;

  if (!walletId) {
    return NextResponse.json({ error: "walletId é obrigatório." }, { status: 400 });
  }
  if (!Number.isInteger(amountCents) || (amountCents ?? 0) < MIN_CENTS) {
    return NextResponse.json(
      { error: "Valor mínimo de recarga é R$ 1,00." },
      { status: 400 },
    );
  }
  if ((amountCents ?? 0) > MAX_CENTS) {
    return NextResponse.json(
      { error: "Valor acima do limite permitido." },
      { status: 400 },
    );
  }
  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
  }
  if (!cpf || !isValidCPF(cpf)) {
    return NextResponse.json({ error: "CPF inválido." }, { status: 400 });
  }

  const expiresAt = new Date(Date.now() + EXPIRATION_MINUTES * 60_000);
  const callbackUrl = process.env.CONFRAPIX_CALLBACK_URL || undefined;

  try {
    const tx = await createPixTopUp({
      amountCents: amountCents!,
      customerName: name.trim(),
      customerDocument: onlyDigits(cpf),
      description: "Recarga de carteira Walleo",
      expirationDate: toConfrapixDate(expiresAt),
      callbackUrl,
    });

    const topUp = createTopUp({
      walletId,
      amountCents: amountCents!,
      status: "pending",
      customerName: name.trim(),
      customerDocument: onlyDigits(cpf),
      confrapixId: tx.id,
      uuid: tx.uuid,
      txid: tx.pix?.txid ?? null,
      qrUrl: tx.pix?.url ?? null,
      copyPasteCode: tx.pix?.code ?? null,
      expiresAt: tx.expired_in ?? expiresAt.toISOString(),
      confirmedAt: null,
    });

    // Resposta enxuta para o frontend — sem token, sem dados sensíveis.
    return NextResponse.json(
      {
        topUp: {
          id: topUp.id,
          status: topUp.status,
          amountCents: topUp.amountCents,
          expiresAt: topUp.expiresAt,
        },
        pix: {
          qrUrl: topUp.qrUrl,
          copyPasteCode: topUp.copyPasteCode,
          txid: topUp.txid,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof ConfrapixError) {
      // 4xx da Confrapix = erro do pedido; demais = falha de integração (502).
      const status = err.httpStatus >= 400 && err.httpStatus < 500 ? err.httpStatus : 502;
      return NextResponse.json(
        { error: err.message, source: "confrapix" },
        { status },
      );
    }
    console.error("[recharge] erro inesperado:", err);
    return NextResponse.json(
      { error: "Falha ao criar recarga PIX." },
      { status: 500 },
    );
  }
}
