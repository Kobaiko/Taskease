export interface CheckoutAttributes {
  checkout_data?: {
    email?: string;
    custom?: Record<string, any>;
  };
  checkout_options?: {
    dark?: boolean;
    success_url?: string;
    cancel_url?: string;
  };
}

export interface CheckoutResponse {
  data: {
    type: string;
    id: string;
    attributes: {
      url: string;
      [key: string]: any;
    };
  };
}

export interface CheckoutRelationships {
  store: {
    data: {
      type: 'stores';
      id: string;
    };
  };
  variant: {
    data: {
      type: 'variants';
      id: string;
    };
  };
}