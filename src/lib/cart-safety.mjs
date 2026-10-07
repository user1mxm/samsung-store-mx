export function stockLimit(product) {
  const stock = Number(product?.stock);
  return Number.isSafeInteger(stock) && stock > 0 ? stock : 0;
}

export function clampQuantity(product, quantity) {
  return Number.isSafeInteger(quantity) && quantity > 0
    ? Math.min(quantity, stockLimit(product)) : 0;
}

export function restoreCart(raw) {
  try {
    const items = JSON.parse(raw ?? '[]');
    if (!Array.isArray(items)) return [];
    const seen = new Set();
    return items.flatMap(item => {
      const product = item?.product;
      if (!Number.isSafeInteger(product?.id) || product.id <= 0 || seen.has(product.id)
          || !Number.isFinite(Number(product.price)) || Number(product.price) < 0) return [];
      const quantity = clampQuantity(product, item.quantity);
      if (!quantity) return [];
      seen.add(product.id);
      return [{ product, quantity }];
    });
  } catch { return []; }
}

export function reconcileCart(cart, products) {
  const catalog = new Map(products.map(product => [product.id, product]));
  return cart.flatMap(item => {
    const product = catalog.get(item.product.id);
    const quantity = clampQuantity(product, item.quantity);
    return quantity ? [{ product, quantity }] : [];
  });
}

export function catalogPriceCeiling(products) {
  return products.reduce((max, product) => {
    const price = Number(product.price);
    return Number.isFinite(price) && price >= 0 ? Math.max(max, Math.ceil(price / 1000) * 1000) : max;
  }, 1000);
}
