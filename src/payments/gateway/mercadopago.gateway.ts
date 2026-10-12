import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { CheckoutInput, GatewayTx, PaymentStatus } from '../payment.types';

type MercadoPagoPreference = {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
};

type MercadoPagoPayment = {
  id?: number | string;
  status?: string;
  external_reference?: string;
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
      throw new BadRequestException('E-mail do pagador é obrigatório');
    }

    const notificationUrl = process.env.MERCADOPAGO_NOTIFICATION_URL?.trim();
    const baseUrl = process.env.BASE_URL?.trim().replace(/\/$/, '');
    const returnUrl = this.publicReturnUrl(baseUrl, input.orderId);
    const body = {
      items: [
        {
          id: input.orderId,
          title: input.description,
          description: input.description,
          currency_id: 'BRL',
          quantity: 1,
          unit_price: input.amountCents / 100,
        },
      ],
      payer: { email: input.payerEmail.trim() },
      external_reference: input.orderId,
      payment_methods: {
        excluded_payment_types: [
          { id: 'credit_card' },
          { id: 'debit_card' },
          { id: 'prepaid_card' },
          { id: 'ticket' },
          { id: 'digital_currency' },
        ],
      },
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
      ...(returnUrl
        ? {
            back_urls: {
              success: returnUrl,
              pending: returnUrl,
              failure: returnUrl,
            },
            auto_return: 'approved',
          }
        : {}),
    };

    try {
      const response = await this.preferenceClient.create({
        body,
        requestOptions: { idempotencyKey: `convites-preference-${input.orderId}` },
      });

      return this.toPreferenceTx(response as MercadoPagoPreference);
    } catch (error: unknown) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      if (error instanceof Error && /access.?token|credentials/i.test(error.message)) {
        throw new ServiceUnavailableException(
          'Mercado Pago não está configurado: verifique as credenciais do ambiente',
        );
      }

      throw new BadGatewayException(
        'Não foi possível criar o checkout hospedado no Mercado Pago',
      );
    }
  }

  async getCheckout(preferenceId: string): Promise<GatewayTx> {
    try {
      const response = await this.preferenceClient.get({ preferenceId });
      return this.toPreferenceTx(response as MercadoPagoPreference);
    } catch (error: unknown) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      throw new BadGatewayException('Não foi possível consultar o checkout no Mercado Pago');
    }
  }

  async getPayment(transactionId: string): Promise<GatewayTx> {
    try {
      const response = await this.paymentClient.get({ id: transactionId });
      return this.toPaymentTx(response as MercadoPagoPayment);
    } catch (error: unknown) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      throw new BadGatewayException('Não foi possível consultar o pagamento no Mercado Pago');
    }
  }

  private get preferenceClient(): Preference {
    return new Preference(this.config);
  }

  private get paymentClient(): Payment {
    return new Payment(this.config);
  }

  private get config(): MercadoPagoConfig {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();

    if (!accessToken) {
      throw new ServiceUnavailableException(
        'Mercado Pago não está configurado: informe MERCADOPAGO_ACCESS_TOKEN',
      );
    }

    return new MercadoPagoConfig({ accessToken });
  }

  private toPreferenceTx(response: MercadoPagoPreference): GatewayTx {
    if (!response.id?.trim()) {
      throw new BadGatewayException(
        'Mercado Pago retornou uma preferência sem identificador',
      );
    }

    const checkoutUrl = response.init_point ?? response.sandbox_init_point;

    if (!checkoutUrl) {
      throw new BadGatewayException(
        'Mercado Pago retornou uma preferência sem checkout_url',
      );
    }

    return {
      id: response.id,
      status: PaymentStatus.PENDING,
      checkoutUrl,
    };
  }

  private toPaymentTx(response: MercadoPagoPayment): GatewayTx {
    if (response.id === undefined || response.id === null) {
      throw new BadGatewayException(
        'Mercado Pago retornou um pagamento sem identificador',
      );
    }

    return {
      id: String(response.id),
      orderId: response.external_reference ?? null,
      status: this.mapStatus(response.status),
    };
  }

  private publicReturnUrl(baseUrl: string | undefined, orderId: string) {
    if (!baseUrl || /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(baseUrl)) {
      return null;
    }

    return `${baseUrl}/mercadopago/return?order_id=${encodeURIComponent(orderId)}`;
  }

  private mapStatus(status: string | undefined): PaymentStatus {
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
