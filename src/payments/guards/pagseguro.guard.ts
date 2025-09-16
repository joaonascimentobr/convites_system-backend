import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import * as crypto from 'crypto'
import { env } from '../../config/env'

function timingSafeEq(a: string, b: string) {
  const A = Buffer.from(a)
  const B = Buffer.from(b)
  return A.length === B.length && crypto.timingSafeEqual(A, B)
}

@Injectable()
export class PagSeguroWebhookGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req: any = ctx.switchToHttp().getRequest()

    const expectedToken = env().PAGSEGURO_WEBHOOK_TOKEN
    const providedToken =
      (req.headers['x-pagseguro-token'] as string) ||
      (req.headers['authorization']?.toString().replace(/^Bearer\s+/i, '') ?? '')

    if (!expectedToken) throw new UnauthorizedException('Webhook token não configurado')
    if (!providedToken || !timingSafeEq(expectedToken, providedToken)) {
      throw new UnauthorizedException('Token inválido')
    }

    // HMAC opcional (recomendado)
    const secret = env().PAGSEGURO_HMAC_SECRET
    if (secret) {
      const raw = (req as any).rawBody ?? JSON.stringify(req.body)
      const providedSig = (req.headers['x-pagseguro-signature'] as string) || ''
      const mac = crypto.createHmac('sha256', secret).update(raw).digest('hex')
      if (!timingSafeEq(mac, providedSig)) throw new UnauthorizedException('Assinatura inválida')
    }

    return true
  }
}
