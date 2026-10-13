export function searchCatalog(products,query) {
  const normal=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  let text=normal(query); if(!text.trim())return products;
  const budget=/(?:menos de|hasta|maximo|presupuesto|bajo)\s*\$?\s*([\d,.]+)(?:\s*(mil|k))?/.exec(text);
  let max=Infinity;if(budget){max=Number(budget[1].replace(/,/g,''))*(budget[2]?1000:1);text=text.replace(budget[0],'');}
  const size=/(\d{2,3})\s*(?:pulgadas|pulg|inch|\")/.exec(text);if(size)text=text.replace(size[0],'');
  const stock=/\b(disponible|disponibles|en stock|con stock)\b/.test(text);text=text.replace(/\b(disponible|disponibles|en stock|con stock)\b/g,'');
  const tokens=text.split(/\s+/).filter(t=>t&&!['quiero','una','un','tv','television','televisor','de','por','para','con','y'].includes(t));
  return products.filter(p=>{
    if(Number(p.price)>max || stock&&p.stock<=0)return false;
    const sizeValue=/^(?:UN|QN|UE|QE)(\d{2,3})/i.exec(p.model||'')?.[1];
    if(size && size[1]!==sizeValue && !normal(p.name+' '+p.specs).includes(size[1]+' pulgadas'))return false;
    const hay=normal([p.name,p.model,p.category,p.description,typeof p.specs==='object'?JSON.stringify(p.specs):p.specs,p.features].join(' '));
    return tokens.every(t=>hay.includes(t));
  });
}
