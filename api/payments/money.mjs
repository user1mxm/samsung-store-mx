export function toCents(value) {
  const text = String(value);
  if (!/^(0|[1-9]\d{0,7})(\.\d{1,2})?$/.test(text)) throw new Error('Invalid MXN amount');
  const [whole, fraction = ''] = text.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

export function fromCents(cents) {
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > 9999999999) throw new Error('Invalid MXN total');
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}
