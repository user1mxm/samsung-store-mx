// Samsung México UN75DU8000FXZX, checked 2026-10-09. Exterior proportions
// are documented; small details and material finishes remain illustrative.
export const DU8000_REFERENCE = 'https://www.samsung.com/mx/tvs/uhd-4k-tv/du8000-75-inch-crystal-uhd-4k-tizen-os-smart-tv-un75du8000fxzx/';
export function tvProfile(product) {
  const dimensions=product?.unitProfile?.dimensions;
  if(dimensions && dimensions.widthMm>100 && dimensions.heightMm>100 && dimensions.depthMm>0 && /^https:\/\//.test(dimensions.source||'')) {
    const width=dimensions.widthMm/1000,height=dimensions.heightMm/1000,depth=dimensions.depthMm/1000;
    return {documented:false,configured:true,width,height,depth,totalHeight:height+.04,standDepth:Math.max(.25,depth),standSpan:width*.75,vesa:null,reference:dimensions.source};
  }
  const documented = /^UN75DU8000(?:[A-Z0-9]*)$/.test(String(product?.model || '').toUpperCase());
  return documented
    ? { documented: true, width: 1.6767, height: .9603, depth: .0266, totalHeight: 1.0034, standDepth: .3319, standSpan: 1.2668, vesa: .4, reference: DU8000_REFERENCE }
    : { documented: false, width: 1.6, height: .92, depth: .035, totalHeight: 1.0, standDepth: .30, standSpan: 1.18, vesa: null, reference: null };
}
export function preferredViewerProduct(products = []) {
  return products.find(p => /^UN75DU8000(?:[A-Z0-9]*)$/i.test(String(p.model || '')))
    || products.find(p => /(?:^UN|^QN|OLED|QLED|Crystal|The Frame)/i.test(`${p.model || ''} ${p.name || ''}`));
}
