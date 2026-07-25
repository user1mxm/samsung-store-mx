import { CheckCircle2, Clock, PackageCheck } from "lucide-react";
import { useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id") || "";
  const status = trpc.payment.checkoutStatus.useQuery(
    { sessionId },
    { enabled: sessionId.startsWith("cs_"), refetchInterval: (query) => query.state.data?.paymentStatus === "unpaid" ? 2000 : false },
  );

  useEffect(() => {
    if (status.data?.paymentStatus === "paid") localStorage.removeItem("cart");
  }, [status.data?.paymentStatus]);

  const paid = status.data?.paymentStatus === "paid";
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f3f6ff] to-white px-4 py-16">
      <section className="mx-auto max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl">
        {paid ? <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" /> : <Clock className="mx-auto h-16 w-16 text-amber-500" />}
        <h1 className="mt-5 text-2xl font-black">{paid ? "Pago confirmado" : "Confirmando tu pago"}</h1>
        <p className="mt-2 text-sm text-gray-500">
          {paid ? `Tu pedido #${status.data?.id} ya está en preparación.` : "Stripe procesó el checkout. Esperamos la confirmación segura del webhook."}
        </p>
        {status.data && (
          <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-left text-sm">
            <div className="flex justify-between"><span>Pedido</span><strong>#{status.data.id}</strong></div>
            <div className="mt-2 flex justify-between"><span>Total</span><strong>${Number(status.data.total).toLocaleString("es-MX")} MXN</strong></div>
            <div className="mt-2 flex justify-between"><span>Estado</span><strong>{status.data.paymentStatus}</strong></div>
          </div>
        )}
        {status.error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{status.error.message}</p>}
        <div className="mt-7 flex flex-col gap-2">
          <Button asChild className="bg-[#1428A0]"><Link to="/mis-pedidos"><PackageCheck className="mr-2 h-4 w-4" />Ver mis pedidos</Link></Button>
          <Button asChild variant="outline"><Link to="/">Volver a la tienda</Link></Button>
        </div>
      </section>
    </main>
  );
}
