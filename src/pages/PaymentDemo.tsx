import { Link } from 'react-router';
import PaymentSimulator from '@/components/payments/PaymentSimulator';

export default function PaymentDemo() {
  return (
    <main className="min-h-screen bg-[#f4f6fb] px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-xl space-y-5">
        <div className="space-y-2">
          <Link to="/" className="text-sm font-semibold text-blue-800 underline">← Volver al catálogo</Link>
          <p className="text-xs font-bold tracking-[0.2em] text-blue-900">SAMSUNG STORE MX · QA</p>
          <h1 className="text-3xl font-black">Simulador de pagos</h1>
          <p className="text-sm text-slate-600">
            Prueba rápida para el socio responsable de cobros y devoluciones.
            El producto y el precio son ficticios; esta pantalla no necesita cuentas, tarjetas ni API keys.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">Producto de demostración</p>
          <p className="text-sm text-slate-600">Pantalla Samsung ficticia · 1 unidad</p>
          <p className="mt-1 text-xl font-bold">$12,999.00 MXN</p>
        </div>
        <PaymentSimulator amountMXN={12999} />
        <p className="text-xs text-slate-500">
          Modo de prueba local habilitado mediante VITE_PAYMENT_SIMULATOR=1.
          El checkout productivo sigue sujeto a validación de infraestructura, cuentas y webhooks.
        </p>
      </div>
    </main>
  );
}
