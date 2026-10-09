export function hashPassword(password:string):Promise<string>;
export function verifyPassword(password:string,stored:string|null|undefined,appSecret:string):Promise<boolean>;
export function isLegacyHash(stored:string|null|undefined):boolean;
