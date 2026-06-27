/** Configurações da demo compartilhadas entre app e seed. */

/** Evento único da demo (escopo dos estabelecimentos/carteiras). */
export const DEMO_EVENT_ID = "evt_walleo_demo";

/**
 * Minutos até a RESERVA de um pedido pendente expirar e liberar o saldo
 * reservado. NÃO confundir com o TTL da cobrança PIX (recarga), que é menor.
 */
export const ORDER_RESERVATION_MINUTES = 60;
