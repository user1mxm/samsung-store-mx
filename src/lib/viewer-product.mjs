// Only catalogue fields are facts. The rendered model is illustrative.
export function viewerProduct(product) {
  let specs = product?.specs;
  if (typeof specs === 'string') {
    try { specs = JSON.parse(specs); } catch { specs = {}; }
  }
  const entries = specs && typeof specs === 'object' && !Array.isArray(specs)
    ? Object.entries(specs).filter(([key, value]) => key && typeof value === 'string' && value.trim()).slice(0, 6)
    : [];
  return {
    name: product?.name || 'Vista ilustrativa del televisor',
    model: product?.model || 'Modelo por confirmar',
    specs: entries,
  };
}
