# Samsung Store MX — Simulador Stripe + Mercado Pago (sin dinero real)

## Objetivo de esta entrega
Un socio responsable de pagos y devoluciones puede evaluar el flujo de compra sin crear cuentas de cobro ni compartir credenciales. **No se generan transacciones, órdenes, webhooks, cambios de inventario, comisiones o saldos.** El simulador **no** es el sandbox real de Stripe o Mercado Pago.

La lógica y la UI de la demostración son locales al navegador. `demoPaymentResult` retorna siempre `kind: simulation_only`, `paid: false`, `charged: false`, `persisted: false` y referencia `DEMO-...`. Los tres resultados ilustrativos son `approved`, `declined` y `pending`; ninguno liquida una orden.

## Cómo probar

En una copia de desarrollo (no en el VPS de producción):

```bash
npm ci
VITE_PAYMENT_SIMULATOR=1 PAYMENTS_ENABLED=0 npm run dev
```

Abrir `http://localhost:5173/demo/pagos` (la dirección local puede variar si el puerto está ocupado). Alternativamente, agregar un producto al carrito, abrir el checkout y elegir los resultados de prueba. La demostración aparece en el carrito únicamente si `order.paymentProviders` retorna lista vacía.

La pantalla independiente utiliza un producto y precio ficticios ($12,999.00 MXN). En el checkout del catálogo, el subtotal es únicamente **ilustrativo**, calculado en el cliente y no confirmado por el servidor. No solicita datos de tarjetas ni datos personales y no transfiere credenciales a ningún proveedor.

**El valor predeterminado es desactivado.** Para una publicación normal, no establecer `VITE_PAYMENT_SIMULATOR` (o establecerlo en `0`). No usarlo como sustituto del checkout real y no desplegar una demostración como una tienda cobrando.

## Contrato preparado para activar APIs

El repositorio ya tiene los flujos reales aislados en `api/payments/providers.mjs`, `api/payments/checkout-service.mjs`, `api/payments/webhooks.ts` y `api/payments/config.ts`. **No se modifican para el simulador.** El selector real `order.paymentProviders` sigue protegido por `PAYMENTS_ENABLED=1`, configuración del proveedor y estado del esquema. El futuro trabajo es de **configuración y aceptación real**, además de las condiciones operativas pendientes; no basta con pegar claves para declarar pagos listos.

Después, mediante un cambio separado y revisión del socio propietario de las cuentas:
1. Completar correcciones abiertas del PR #22 y reconciliar versión y esquema del VPS (con respaldo y aprobación).
2. Obtener credenciales de prueba, asociar las aplicaciones **oficiales** de la entidad comercial y registrar webhooks de Stripe/Mercado Pago con HTTPS público.
3. Configurar credenciales **solo en el servidor** y probar aprobados, rechazados, pendientes, duplicados, avisos inválidos, cancelación, reintegros y conciliación usando los sandbox reales.
4. Resolver pendientes de liberación documentados en `docs/payments-rollout.md` (abandono de reservas, reembolsos, cobros de envío/impuestos). Solo tras esa aceptación evaluar el paso a producción.
5. Quitar `VITE_PAYMENT_SIMULATOR`, activar los proveedores reales con controles y `PAYMENTS_ENABLED=1` únicamente mediante una ventana de cambio autorizada.

### Rutas que se reservaron para uso real (no invocadas por el simulador)

- Stripe: `/api/payments/stripe/webhook` para `checkout.session.completed` y `checkout.session.async_payment_succeeded`.
- Mercado Pago: `/api/payments/mercadopago/webhook` para notificaciones de pagos autenticadas.

No publicar tokens, secretos webhook, contraseñas ni claves `sk_*` en GitHub, ChatGPT, mensajes o artefactos de CI.

## Pruebas automatizadas

```bash
node --test tests/payment-simulator.test.mjs
node --test tests/payment-contracts.test.mjs
npm run check
npm run build
```

El workflow de CI ejecuta las pruebas del simulador junto con los contratos del checkout real; ambos sistemas permanecen separados. No se hizo despliegue al VPS ni activación de cobros.
