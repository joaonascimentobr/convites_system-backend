import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { IPaymentGateway, PixResponse, CardResponse } from './ipayment-gateway';
@Injectable()
export class PagSeguroGateway implements IPaymentGateway {
  private api = process.env.PAGSEGURO_ENV === 'production'? 'https://api.pagseguro.com' : 'https://sandbox.api.pagseguro.com';
  private token = process.env.PAGSEGURO_TOKEN!;
  private headers(){ return { Authorization:`Bearer ${this.token}`, 'Content-Type':'application/json' }; }
  async createPix(p:{referenceId:string; description:string; amount:number;}):Promise<PixResponse>{
    const body={ reference_id:p.referenceId, description:p.description, amount:{ value:p.amount, currency:'BRL' }, payment_method:{ type:'PIX' } };
    const { data }= await axios.post(`${this.api}/orders`, body, { headers:this.headers() });
    const ch = data.charges?.[0];
    return { referenceId:p.referenceId, qrCode: ch?.payment_response?.qr_code || '', qrCodeBase64: ch?.payment_response?.qr_code_base64, expiresAt: ch?.payment_response?.expires_at };
  }
  async createCard(p:{referenceId:string; description:string; amount:number; cardToken:string;}):Promise<CardResponse>{
    const body={ reference_id:p.referenceId, description:p.description, amount:{ value:p.amount, currency:'BRL' }, payment_method:{ type:'CREDIT_CARD', installments:1, capture:true, card:{ token:p.cardToken }}};
    const { data }= await axios.post(`${this.api}/orders`, body,{ headers:this.headers() });
    return { referenceId:p.referenceId, status: data.charges?.[0]?.status || 'UNKNOWN' };
  }
  translateWebhook(payload:any){
    try{
      const ref = payload?.reference_id || payload?.order?.reference_id || payload?.charge?.reference_id;
      const status: string = payload?.charges?.[0]?.status || payload?.status;
      if(!ref||!status) return null;
      const map:Record<string,'paid'|'canceled'|'failed'>={ PAID:'paid', CANCELED:'canceled', DECLINED:'failed', FAILED:'failed' } as any;
      const s = (map[(status||'').toUpperCase()])||null; if(!s) return null;
      return { referenceId: ref, status: s };
    }catch{ return null; }
  }
}
