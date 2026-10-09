# Comercio y operación — 15 mejoras

Implementación sobre PR19 (54136f8698e31a916fb6c3e5bbd67a87834eae0e). No incluye alertas de disponibilidad/precio ni la renovación integral de accesibilidad solicitada como excepción.

| Mejora | Integración | Configuración real |
|---|---|---|
| Passkeys administrativas | WebAuthn, verificación de usuario, desafío de un uso de 5 minutos, revocación con contraseña | Registrar cada dispositivo en /admin/operaciones → Seguridad; conservar contraseña de recuperación |
| Catálogo multimedia | Un modelo por swipe, fotos por unidad, miniaturas y compra fija en móvil | Cargar fotos reales y ficha de cada unidad |
| CSP | Report-Only, reportes sin URL completa, límites de solicitudes, comprobación de origen | Revisar reportes antes de convertir política a bloqueo |
| Control maestro | Inventario, alertas de stock bajo, pedidos, soporte, entregas, historial de escrituras y roles del panel existente | /admin/operaciones, sólo administradores |
| Checkout y reembolsos | Totales canónicos, reserva atómica, webhooks firmados, reembolso completo idempotente y conciliación GET | Credenciales Stripe/MP, webhook y PAYMENTS_ENABLED. El despliegue mantiene pagos deshabilitados |
| Comparación y 3D por modelo | Comparación de atributos reales, galería y geometría con dimensiones administradas/fuente | Medidas documentadas sin base. Base y detalles siguen ilustrativos; no son CAD oficial |
| Búsqueda por intención | Tamaño, tecnología, presupuesto y existencias combinados | Sin proveedor IA ni hechos inventados |
| Simulador de habitación | Foto local, referencia física ajustable, dimensiones 16:9, distancia y ángulo de visión | Medir ancho en el mismo plano; perspectiva afecta precisión |
| Posventa | Casos por pedido, conversaciones, garantías/devoluciones y evidencia autenticada | Archivos privados fuera de la carpeta pública; reglas de aceptación gestionadas por tienda |
| Inventario multicanal | API autenticada, ventas serializadas/idempotentes, stock central actualizado | Conectar adaptador real del POS/marketplace. No se afirma conexión automática con cuentas externas |
| Monitoreo y respaldos | Verificación cada 5 min, archivo de alertas importante, respaldo diario con restauración aislada y SHA-256 | Ejecutar scripts/install-monitoring.sh; MySQL necesita CREATE/DROP en esquema temporal |
| Cotizaciones | Snapshot servidor, enlace aleatorio, precio fijo 48 horas, compra por dueño, seguimiento de asesores | El stock sólo se reserva al pagar. Cierre de seguimiento no declara pago |
| Entrega/instalación | Código postal exacto, tarifa MXN, cupos por fecha y cobro en checkout | Crear zonas y capacidad real; sin zona no se inicia pago por interfaz |
| Unidad de exhibición | Código, fotos, estado, accesorios y garantía específica | Introducir información y fotos reales; no se generan garantías |
| Fidelidad | Libro de puntos, crédito pagado/entregado, canje concurrente seguro y entrega de beneficios | Activar regla y beneficios reales; inactivo por defecto |

## Despliegue y configuración

El deploy valida la huella del código desplegado, compila aislado, detiene escrituras, respalda MySQL y crea 18 tablas adicionales InnoDB. No altera datos históricos ni cambia la contraseña administrativa. Recupera aplicación/dependencias ante fallo; las tablas adicionales permanecen.

Después del deploy, ejecutar como root:

```bash
bash /opt/samsung-store-mx/scripts/install-monitoring.sh
```

El instalador sólo programa las tareas después de restaurar un respaldo en un esquema temporal con nombre aleatorio. Los logs/dumps quedan privados en /opt/samsung-backups/operations. El respaldo de datos del monitor omite rutinas, eventos y triggers; el respaldo completo previo al deploy los conserva. Archivos privados de soporte y uploads se deben incluir en el respaldo externo de archivos del VPS. No se envían avisos a destinatarios externos no configurados.

En Seguridad registrar passkey con contraseña actual; no se deshabilita el login con contraseña. En Unidades introducir rutas /uploads/ o /media/ obtenidas del cargador de imágenes del panel general. En Entregas publicar CPs, precio en centavos y capacidad. En Recompensas activar una regla explícita y beneficios.

## Conector de inventario

Crear canal desde el maestro, copiar el token una vez y guardarlo en el servidor del adaptador. Nunca colocarlo en JavaScript público. Protocolo:

- GET /api/inventory/ID, Authorization: Bearer TOKEN → snapshot autoritativo de modelos, precios y stock; no cachear existencias.
- POST /api/inventory/ID/sale, JSON {"eventId":"sale-unique-123","items":[{"productId":1,"quantity":1}]} con la misma autorización → reserva/pedido externo. El mismo evento devuelve el pedido previo; un evento modificado falla.
- Cancelar reserva externa desde Pedidos del panel general si la venta no se realizó. Un canal desactivado no puede consultar/reservar.

La reserva externa no constituye prueba de pago web ni genera puntos. El adaptador debe reservar antes de confirmar venta y actualizar los listados usando el snapshot; un marketplace que cobre sin reservar previamente necesita reconciliación operativa. No garantiza sincronización de una plataforma ajena sin adaptador.

## Reembolsos y fidelidad

Reembolsos completos únicamente desde pago con settlementId verificado. Resultado remoto incierto queda en revisión; consultar proveedor nunca vuelve a emitir POST. Si el proveedor confirma, se cancela el pedido/agenda y se revierte el crédito de puntos. Sólo existencias no enviadas regresan automáticamente; una devolución enviada requiere recepción e inspección explícita del administrador, idempotente. Saldo negativo después de reembolso impide canjes adicionales.

Las cotizaciones visibles por token excluyen identidad/domicilio del comprador. Sólo el dueño autenticado convierte una cotización; los asesores consultan seguimiento en /asesoria. El portal /mi-cuenta verifica propiedad del pedido/caso y de cada evidencia.

## Validación

Pruebas unitarias de búsqueda, escala, reglas y proveedor de reembolso; pruebas existentes de carrito/pagos/rollback/seguridad/modelo; MySQL dedicado para cotizaciones, capacidad simultánea, canje simultáneo, puntos verificables y reembolso ambiguo; navegador compilado móvil/escritorio; WebAuthn virtual con registro y firma reales, replay rechazado y cookie administrativa. Nunca ejecutar suites MYSQL_TEST_URL contra producción: sólo aceptan samsung_store_test.
