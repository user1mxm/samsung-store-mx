export interface TVProfile { documented:boolean; width:number; height:number; depth:number; totalHeight:number; standDepth:number; standSpan:number; vesa:number|null; reference:string|null }
export const DU8000_REFERENCE:string;
export function tvProfile(product?:{model?:string}):TVProfile;
export function preferredViewerProduct<T extends {model?:string;name?:string}>(products?:T[]):T|undefined;
