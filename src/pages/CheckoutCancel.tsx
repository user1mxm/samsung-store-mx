import { ArrowLeft, ShoppingCart } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export default function CheckoutCancel() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f3f6ff] to-white px-4 py-16">
      <section className="mx-auto max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl">
        <ShoppingCart className="mx-auto h-14 w-14 text-[#1428A0]" />
        <h1 className="mt-5 text-2xl font-black">Pago cancelado</h1>
        <p className="mt-2 text-sm text-gray-500">No se realizó ningún cargo. Tu carrito continúa disponible para cuando quieras intentarlo de nuevo.</p>
        <Button asChild className="mt-7 bg-[#1428A0]"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Volver al carrito</Link></Button>
      </section>
    </main>
  );
}
