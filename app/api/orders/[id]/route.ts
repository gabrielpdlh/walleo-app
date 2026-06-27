import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getSessionWalletId } from "@/lib/customer-auth";
import { cancelOrder, getOrderForOwner } from "@/db/orders";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const walletId = await getSessionWalletId();
  if (!walletId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  const { id } = await params;

  try {
    const order = await getOrderForOwner(id, walletId);
    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 },
      );
    }

    // O QR só faz sentido enquanto pendente; o token nunca vai em texto ao
    // cliente — só embutido na imagem.
    const { qrToken, ...rest } = order;
    let qrDataUrl: string | null = null;
    if (order.status === "pending") {
      try {
        qrDataUrl = await QRCode.toDataURL(qrToken, {
          width: 320,
          margin: 1,
          errorCorrectionLevel: "M",
        });
      } catch (err) {
        console.error("[orders] erro ao gerar QR:", err);
      }
    }

    return NextResponse.json({ order: { ...rest, qrDataUrl } });
  } catch (err) {
    console.error("[orders] erro ao carregar pedido:", err);
    return NextResponse.json(
      { error: "Falha ao carregar pedido." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const walletId = await getSessionWalletId();
  if (!walletId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  const { id } = await params;

  try {
    const result = await cancelOrder(id, walletId);
    if (!result.ok) {
      if (result.status === "not_found") {
        return NextResponse.json(
          { error: "Pedido não encontrado." },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: "Este pedido não pode mais ser cancelado." },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[orders] erro ao cancelar pedido:", err);
    return NextResponse.json(
      { error: "Falha ao cancelar pedido." },
      { status: 500 },
    );
  }
}
