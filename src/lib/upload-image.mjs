export async function uploadProductImage(file, request = fetch) {
  if (!['image/jpeg','image/png','image/webp','image/gif','image/avif'].includes(file.type) || file.size > 8 * 1024 * 1024) throw new Error('Usa una imagen JPG, PNG, WEBP, GIF o AVIF de hasta 8 MB');
  const body = new FormData(); body.append('file', file);
  const response = await request('/api/upload', { method: 'POST', credentials: 'same-origin', body, signal: AbortSignal.timeout(30000) });
  const result = await response.json();
  if (!response.ok || !result.success || typeof result.url !== 'string') throw new Error(result.error || 'No se pudo guardar la imagen');
  if (!/^\/uploads\/[a-zA-Z0-9._-]+$/.test(result.url)) {
    const url = new URL(result.url);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('URL de imagen inválida');
  }
  return result.url;
}
