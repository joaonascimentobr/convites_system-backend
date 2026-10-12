import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { CheckoutInput, GatewayTx, PaymentStatus } from '../payment.types';

type MercadoPagoPayment = {
  id?: number;
  status?: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
};

@Injectable()
export class MercadoPagoGateway {
  async checkout(
    input: CheckoutInput & {
      amountCents: number;
      payerEmail: string;
      description: string;
    },
  ): Promise<GatewayTx> {
    if (input.method !== 'PIX') {
      throw new BadRequestException(
        'Neste momento o checkout do Mercado Pago está disponível apenas para PIX',
      );
    }

    if (!input.payerEmail?.trim()) {
      throw new BadRequestException('O pedido precisa ter um e-mail de comprador válido');
    }

    const notificationUrl = process.env.MERCADOPAGO_NOTIFICATION_URL?.trim();
    const body = {
      transaction_amount: input.amountCents / 100,
      description: input.description,
      external_reference: input.orderId,
      payment_method_id: 'pix',
      payer: { email: input.payerEmail.trim() },
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
    };

    try {
      const response = await this.client.create({
        body,
        requestOptions: { idempotencyKey: `convites-order-${input.orderId}` },
      });

      return this.toGatewayTx(response as MercadoPagoPayment);
    } catch (error: unknown) {
      if (error instanceof Error && /access.?token|credentials/i.test(error.message)) {
        throw new ServiceUnavailableException(
          'Mercado Pago não está configurado: informe MERCADOPAGO_ACCESS_TOKEN',
        );
      }

      throw new BadGatewayException('Não foi possível criar o pagamento no Mercado Pago');
    }
  }

  async getPayment(transactionId: string): Promise<GatewayTx> {
    try {
      const response = await this.client.get({ id: transactionId });
      return this.toGatewayTx(response as MercadoPagoPayment);
    } catch (error: unknown) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new BadGatewayException('Não foi possível consultar o pagamento no Mercado Pago');
    }
  }

  private get client(): Payment {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();

    if (!accessToken) {
      throw new ServiceUnavailableException(
        'Mercado Pago não está configurado: informe MERCADOPAGO_ACCESS_TOKEN',
      );
    }

    return new Payment(new MercadoPagoConfig({ accessToken }));
  }

  private toGatewayTx(response: MercadoPagoPayment): GatewayTx {
    if (response.id === undefined || response.id === null) {
      throw new BadGatewayException('Mercado Pago retornou um pagamento sem identificador');
    }

    const transactionData = response.point_of_interaction?.transaction_data;

    return {
      id: String(response.id),
      status: this.mapStatus(response.status),
      checkoutUrl: transactionData?.ticket_url ?? null,
      qrCode: transactionData?.qr_code ?? null,
      qrCodeBase64: transactionData?.qr_code_base64 ?? null,
    };
  }

  private mapStatus(status?: string): PaymentStatus {
    switch (status?.toLowerCase()) {
      case 'approved':
        return PaymentStatus.PAID;
      case 'rejected':
      case 'cancelled':
      case 'refunded':
      case 'charged_back':
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.PENDING;
    }
  }
}
