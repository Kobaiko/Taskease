export interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  taskLimit: number;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'trial' | 'active' | 'canceled' | 'expired';
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface UserSubscriptionData {
  subscriptionId?: string;
  trialEndsAt?: Date;
  creditsUsed: number;
}