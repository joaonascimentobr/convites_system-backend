import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MercadoPagoConfig, Order } from 'mercadopago';
import { CheckoutInput, GatewayTx, PaymentStatus } from '../payment.types';

type MercadoPagoOrderPayment = {
  id?: string;
  status?: string;
  payment_method?: {
    ticket_url?: string;
    redirect_url?: string;
    qr_code?: string;
    qr_code_base64?: string;
  };
};

type MercadoPagoOrder = {
  id?: string;
  status?: string;
  transactions?: {
    payments?: MercadoPagoOrderPayment[];
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
    const totalAmount = (input.amountCents / 100).toFixed(2);
    const testPayerFirstName =
      process.env.NODE_ENV === 'development'
        ? process.env.MERCADOPAGO_TEST_PAYER_FIRST_NAME?.trim() || 'APRO'
        : undefined;

    const body = {
      type: 'online',
      processing_mode: 'automatic',
      external_reference: input.orderId,
      total_amount: totalAmount,
      description: input.description,
      payer: {
        email: input.payerEmail.trim(),
        ...(testPayerFirstName ? { first_name: testPayerFirstName } : {}),
      },
      transactions: {
        payments: [
          {
            amount: totalAmount,
            payment_method: {
              id: 'pix',
              type: 'bank_transfer',
            },
          },
        ],
      },
      ...(notificationUrl
        ? { config: { online: { callback_url: notificationUrl } } }
        : {}),
    };

    try {
      const response = await this.client.create({
        body,
        requestOptions: { idempotencyKey: `convites-order-${input.orderId}` },
      });

      return this.toGatewayTx(response as MercadoPagoOrder);
    } catch (error: unknown) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      if (error instanceof Error && /access.?token|credentials/i.test(error.message)) {
        throw new ServiceUnavailableException(
          'Mercado Pago não está configurado: informe MERCADOPAGO_ACCESS_TOKEN',
        );
      }

      throw new BadGatewayException('Não foi possível criar a order no Mercado Pago');
    }
  }

  async getPayment(transactionId: string): Promise<GatewayTx> {
    try {
      const response = await this.client.get({ id: transactionId });
      return this.toGatewayTx(response as MercadoPagoOrder);
    } catch (error: unknown) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new BadGatewayException('Não foi possível consultar a order no Mercado Pago');
    }
  }

  private get client(): Order {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();

    if (!accessToken) {
      throw new ServiceUnavailableException(
        'Mercado Pago não está configurado: informe MERCADOPAGO_ACCESS_TOKEN',
      );
    }

    return new Order(new MercadoPagoConfig({ accessToken }));
  }

  private toGatewayTx(response: MercadoPagoOrder): GatewayTx {
    if (!response.id?.trim()) {
      throw new BadGatewayException('Mercado Pago retornou uma order sem identificador');
    }

    const payment = response.transactions?.payments?.[0];
    const paymentMethod = payment?.payment_method;

    return {
      // O ID persistido no Payment é o ID da order do Mercado Pago. As
      // notificações da Orders API usam esse mesmo identificador.
      id: response.id,
      status: this.mapStatus(payment?.status ?? response.status),
      checkoutUrl: paymentMethod?.ticket_url ?? paymentMethod?.redirect_url ?? null,
      qrCode: paymentMethod?.qr_code || null,
      qrCodeBase64: paymentMethod?.qr_code_base64 || null,
    };
  }

  private mapStatus(status?: string): PaymentStatus {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'processed':
      case 'accredited':
      case 'completed':
      case 'paid':
        return PaymentStatus.PAID;
      case 'rejected':
      case 'cancelled':
      case 'canceled':
      case 'failed':
      case 'refunded':
      case 'charged_back':
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.PENDING;
    }
  }
}
