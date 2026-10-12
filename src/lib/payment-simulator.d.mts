export type DemoProvider = 'stripe' | 'mercadopago';
export type DemoOutcome = 'approved' | 'declined' | 'pending';
export declare const DEMO_PROVIDERS: readonly DemoProvider[];
export declare const DEMO_OUTCOMES: readonly DemoOutcome[];
export type DemoPaymentReceipt = Readonly<{
  kind: 'simulation_only';
  provider: DemoProvider;
  outcome: DemoOutcome;
  reference: string;
  currency: 'MXN';
  amountCents: number;
  charged: false;
  paid: false;
  persisted: false;
  orderId: null;
  providerSessionId: null;
  webhookEventId: null;
}>;
export declare function demoPaymentResult(input: {
  provider: DemoProvider;
  outcome: DemoOutcome;
  amountCents: number;
  reference: string;
}): DemoPaymentReceipt;
export declare function demoAmountCents(amountMXN: number): number;
