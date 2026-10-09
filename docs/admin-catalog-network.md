# Catálogo y porcentajes administrativos

Base: PR #21, `e2640b6cbd14ce9f259db51fac47cb66eb8e876c`. No sustituirla por la rama principal antigua. El cambio está apilado sobre la versión cuyo despliegue fue reportado el 8 de octubre de 2026.

## Uso

1. Entrar en `/login/admin` con una cuenta administrativa; abrir **Catálogo por lotes y porcentajes** desde `/admin`.
2. En `/admin/catalogo`, exportar el catálogo o descargar la plantilla CSV. Se admiten también archivos JSON con un arreglo de objetos de las mismas columnas.
3. ID vacío crea; ID existente actualiza. Los valores vacíos conservan datos existentes. Los importes se expresan sin separadores de miles ni `$`, con punto decimal. Máximo 100 filas y 2 MB. No hay eliminación masiva.
4. Editar precios y stock directamente; abrir **Ficha y fuentes** para categoría, imagen y procedencia. **Cargar fotos por modelo** exige un único producto y una imagen por modelo completo. No adivina entre unidades o sufijos regionales.
5. **Revisar lote** muestra campos anteriores y nuevos. **Guardar productos** escribe todo o nada. Cambios concurrentes invalidan la vista previa. Un reintento con el mismo identificador no duplica altas.
6. **Porcentajes y red** muestra agentes y relaciones existentes. El nombre superior es el beneficiario. Indicar tasa entre 0 y 25%, hasta dos decimales, y motivo. Se conserva un registro de antes/después y responsable. Los agentes consultan su tasa, pero no pueden aumentarse su comisión.

## Alcance contable

Los porcentajes se guardan realmente: venta propia por usuario agente en `storeSettings`; vínculos de red en la tabla existente `ambassador_commissions`. Se conserva la semántica previa del vínculo: el referente es el beneficiario. No se modifica la asignación de miembros ni las tasas generales de niveles 2 y 3.

**La generación y liquidación automática de comisiones permanece desactivada**. Los importes del panel son ejemplos; no se emiten pagos, no se alteran saldos acumulados ni se recalculan comisiones históricas. No habilitar el endpoint legacy `generateCommissions`, que recibe totales del cliente. La tasa de venta propia queda configurada y visible al agente, pero no constituye por sí sola una integración de liquidación.

## Fuentes Samsung

`docs/samsung-source-examples.json` contiene dos referencias oficiales consultadas el 9 de octubre de 2026. Se comprobaron sus páginas, códigos completos, tamaño, resolución, frecuencia y una foto principal de cada página. Se descargaron y examinaron las dos fotos para esta revisión.

- QN65S95DAFXZX: 65 pulgadas, OLED, 3840 × 2160, 120 Hz (hasta 144 Hz, según fuente).
- UN75DU8000FXZX: 75 pulgadas, Crystal UHD, 3840 × 2160, 60 Hz.

Los ejemplos se cargan como borrador, sin precio comercial y con stock 0. El administrador debe confirmar que el modelo exacto coincide con su unidad, revisar la foto y fijar precio y disponibilidad propios. No son una auditoría exhaustiva de todo el catálogo de producción. La revisión humana se registra con usuario y fecha; el servidor no convierte una búsqueda o una URL en una afirmación de verificación automática. Cambiar modelo, imagen, nombre o especificaciones invalida la revisión anterior salvo nueva revisión explícita. Precios o stock no invalidan las especificaciones.

Las imágenes oficiales son referencias del modelo; no acreditan condición, accesorios o garantía de una unidad reacondicionada. Conservar fotos reales donde sean necesarias.

## Verificación y despliegue

Pruebas unitarias: `node --test tests/admin-tools.test.mjs tests/route-contracts.test.mjs`. Build: `npm run build && npm run check`.

CI ejecuta la suite `tests/admin-tools-mysql.mjs` sobre `samsung_store_test`, tras las suites previas del proyecto: transacciones, conflictos, idempotencia, tasas, permisos y UI desktop/móvil. El artefacto `admin-guide-evidence` contiene capturas de la app compilada con datos de demostración, nunca cuentas de producción.

La migración es aditiva: garantiza la tabla `ambassador_commissions` con el formato legacy. No reemplaza ni resetea datos. El despliegue existente conserva backup, gate de versión, rollback de aplicación y pagos desactivados. El manifiesto de entrada corresponde a PR #21. Las nuevas funciones requieren una versión publicada; su presencia en el PR no prueba despliegue.

Durante esta sesión la conexión SSH al VPS devolvió `Network is unreachable`. No se ha instalado esta revisión ni modificado catálogo, comisiones o credenciales de producción desde este entorno.
