import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { orderItems, orders, products } from "@db/schema";
import { authedQuery, createRouter } from "./middleware";
import { getStripe } from "./lib/stripe";
import { getDb } from "./queries/connection";

const checkoutItem = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(10),
});

function checkoutBaseUrl(request: Request) {
  const configured = process.env.APP_URL?.replace(/\/$/, "");
  if (configured) return configured;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  if (!host) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo determinar la URL de la tienda." });
  const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export const paymentRouter = createRouter({
  createCheckout: authedQuery
    .input(z.object({ items: z.array(checkoutItem).min(1).max(25) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const ids = [...new Set(input.items.map((item) => item.productId))];
      const productRows = await db.select().from(products).where(inArray(products.id, ids));
      const productMap = new Map(productRows.map((product) => [product.id, product]));

      const normalized = input.items.map((item) => {
        const product = productMap.get(item.productId);
        if (!product) throw new TRPCError({ code: "BAD_REQUEST", message: `Producto ${item.productId} no disponible.` });
        if (product.stock < item.quantity) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Stock insuficiente para ${product.name}.` });
        }
        const amount = Math.round(Number(product.price) * 100);
        if (!Number.isSafeInteger(amount) || amount < 100) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Precio inválido para ${product.name}.` });
        }
        return { product, quantity: item.quantity, amount };
      });

      const totalCents = normalized.reduce((sum, item) => sum + item.amount * item.quantity, 0);
      const insertResult = await db.insert(orders).values({
        userId: ctx.user.id,
        total: (totalCents / 100).toFixed(2),
        paymentStatus: "unpaid",
        status: "pending",
      });
      const orderId = Number((insertResult as unknown as [{ insertId: number }])[0].insertId);

      for (const item of normalized) {
        await db.insert(orderItems).values({
          orderId,
          productId: item.product.id,
          quantity: item.quantity,
          price: (item.amount / 100).toFixed(2),
        });
      }

      try {
        const baseUrl = checkoutBaseUrl(ctx.req);
        const session = await getStripe().checkout.sessions.create({
          mode: "payment",
          locale: "es",
          client_reference_id: String(orderId),
          customer_email: ctx.user.email || undefined,
          billing_address_collection: "required",
          shipping_address_collection: { allowed_countries: ["MX"] },
          phone_number_collection: { enabled: true },
          line_items: normalized.map(({ product, quantity, amount }) => ({
            quantity,
            price_data: {
              currency: "mxn",
              unit_amount: amount,
              product_data: {
                name: product.name,
                description: product.model,
                images: product.imageUrl.startsWith("https://") ? [product.imageUrl] : undefined,
                metadata: { productId: String(product.id) },
              },
            },
          })),
          metadata: { orderId: String(orderId), userId: String(ctx.user.id) },
          payment_intent_data: { metadata: { orderId: String(orderId), userId: String(ctx.user.id) } },
          success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/checkout/cancel?order_id=${orderId}`,
          expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        });

        await db.update(orders)
          .set({ stripeCheckoutSessionId: session.id })
          .where(and(eq(orders.id, orderId), eq(orders.userId, ctx.user.id)));

        return { url: session.url, orderId };
      } catch (error) {
        await db.update(orders).set({ status: "cancelled", paymentStatus: "failed" }).where(eq(orders.id, orderId));
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "No se pudo iniciar el pago.",
        });
      }
    }),

  checkoutStatus: authedQuery
    .input(z.object({ sessionId: z.string().startsWith("cs_") }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const rows = await db.select({
        id: orders.id,
        total: orders.total,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
      }).from(orders).where(and(
        eq(orders.userId, ctx.user.id),
        eq(orders.stripeCheckoutSessionId, input.sessionId),
      )).limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido no encontrado." });
      return rows[0];
    }),
});
