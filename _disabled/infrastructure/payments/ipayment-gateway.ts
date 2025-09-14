export interface PixResponse { qrCode: string; qrCodeBase64?: string; expiresAt?: string; referenceId: string; }
export interface CardResponse { status: string; referenceId: string; }
export interface IPaymentGateway {
  createPix(p:{ referenceId:string; description:string; amount:number; }):Promise<PixResponse>;
  createCard(p:{ referenceId:string; description:string; amount:number; cardToken:string; }):Promise<CardResponse>;
  translateWebhook(payload:any): { referenceId:string; status:'paid'|'canceled'|'failed' } | null;
}
