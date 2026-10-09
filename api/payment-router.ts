import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware";

// Legacy checkout is retired. Hosted checkout is exposed through order.checkout.
const unavailable = () => { throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Usa el checkout actualizado" }); };
export const paymentRouter = createRouter({
  checkout: publicQuery.mutation(unavailable),
  confirm: publicQuery.mutation(unavailable),
  methods: publicQuery.query(() => ({ stripe: false, mercadopago: false, paypal: false })),
});
