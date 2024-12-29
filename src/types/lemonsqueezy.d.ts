export interface LemonSqueezy {
  Setup: (config: { eventHandler: (data: any) => void }) => void;
  Url: {
    Open: (url: string) => void;
  };
}

export interface CheckoutSuccessData {
  store_id: number;
  customer_id: number;
  order_id: number;
  identifier: string;
  order_number: number;
  [key: string]: any;
}

declare global {
  interface Window {
    LemonSqueezy?: LemonSqueezy;
  }
}