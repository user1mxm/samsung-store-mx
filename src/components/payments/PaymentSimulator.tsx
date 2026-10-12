import { useEffect, useState } from 'react';
import { demoAmountCents, demoPaymentResult } from '@/lib/payment-simulator.mjs';

type Provider = 'stripe' | 'mercadopago';
type Outcome = 'approved' | 'declined' | 'pending';
type Receipt = ReturnType<typeof demoPaymentResult>;

const titles: Record<Outcome, string> = {
  approved: 'Aprobación simulada',
  declined: 'Rechazo simulado',
  pending: 'Pago pendiente simulado',
};
const descriptions: Record<Outcome, string> = {
  approved: 'Se mostró un resultado de éxito, pero no hubo un pago ni se generó un pedido.',
  declined: 'Se mostró el rechazo de la transacción. No hubo un intento real de cobro.',
  pending: 'Se mostró un estado pendiente. No se creó ninguna operación por conciliar.',
};
const mxn = (cents: number) => (cents / 100).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

export default function PaymentSimulator({ amountMXN, onClose }: { amountMXN: number; onClose?: () => void }) {
  const [provider, setProvider] = useState<Provider>('mercadopago');
  const [outcome, setOutcome] = useState<Outcome>('approved');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState('');
  const amountValid = Number.isFinite(amountMXN) && amountMXN > 0 && amountMXN <= 9999999.99;

  useEffect(() => { setReceipt(null); setError(''); }, [amountMXN]);

  const simulate = () => {
    setError('');
    try {
      if (!amountValid) throw new Error('Selecciona un producto con importe válido');
      setReceipt(demoPaymentResult({
        provider, outcome, amountCents: demoAmountCents(amountMXN), reference: crypto.randomUUID(),
      }));
    } catch (e) {
      setReceipt(null);
      setError(e instanceof Error ? e.message : 'No se pudo simular el pago');
    }
  };

  return (
    <section aria-label="Simulador de métodos de pago" className="space-y-4 rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 p-4 text-slate-900">
      <div className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-900" role="note">
        DEMOSTRACIÓN · SIN COBROS REALES
      </div>
      <p className="text-sm text-slate-700">
        Recorre los métodos de pago con datos ficticios. No ingreses información bancaria.
        La simulación no realiza llamadas a Stripe, Mercado Pago ni al servidor de pedidos.
      </p>
      <div>
        <span className="block text-sm font-semibold">Importe de prueba (MXN)</span>
        <strong className="text-2xl">{amountValid ? mxn(Math.round(amountMXN * 100)) : 'Sin importe válido'}</strong>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Selecciona el método</legend>
        <div className="grid grid-cols-2 gap-2">
          {(['stripe', 'mercadopago'] as const).map(option => (
            <button
              key={option} type="button" aria-pressed={provider === option}
              onClick={() => { setProvider(option); setReceipt(null); }}
              className={'rounded-xl border-2 px-3 py-3 text-sm font-bold transition-colors ' +
                (provider === option ? 'border-blue-700 bg-blue-50 text-blue-900' : 'border-slate-200 bg-white text-slate-700')}
            >
              {option === 'stripe' ? 'Stripe' : 'Mercado Pago'}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm font-semibold">
        Resultado de prueba
        <select className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
          value={outcome} onChange={event => { setOutcome(event.target.value as Outcome); setReceipt(null); }}>
          <option value="approved">Aprobado</option>
          <option value="declined">Rechazado</option>
          <option value="pending">Pendiente</option>
        </select>
      </label>
      <button type="button" onClick={simulate} disabled={!amountValid}
        className="w-full rounded-xl bg-[#1428A0] px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
        Simular pago de prueba
      </button>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {receipt && (
        <div role="status" aria-live="polite" className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold tracking-wide text-amber-700">RECIBO FICTICIO · NO ES COMPROBANTE DE PAGO</p>
          <h3 className="text-lg font-bold">{titles[receipt.outcome]}</h3>
          <p className="text-sm">{descriptions[receipt.outcome]}</p>
          <dl className="break-all text-xs text-slate-600">
            <dt className="font-semibold">Referencia de demo</dt><dd>{receipt.reference}</dd>
            <dt className="mt-2 font-semibold">Proveedor simulado</dt><dd>{receipt.provider === 'stripe' ? 'Stripe' : 'Mercado Pago'}</dd>
            <dt className="mt-2 font-semibold">Importe ilustrativo</dt><dd>{mxn(receipt.amountCents)}</dd>
          </dl>
          <p className="text-sm font-semibold text-red-700">
            Cargo real: NO · Pedido creado: NO · Inventario modificado: NO
          </p>
          <button type="button" className="text-sm font-semibold text-blue-800 underline"
            onClick={() => setReceipt(null)}>Hacer otra prueba</button>
        </div>
      )}
      {onClose && <button type="button" onClick={onClose} className="w-full text-sm font-semibold text-blue-900 underline">Cerrar demostración</button>}
    </section>
  );
}
