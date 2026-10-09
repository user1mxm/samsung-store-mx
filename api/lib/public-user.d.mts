type PublicKey='id'|'name'|'email'|'avatar'|'role'|'provider'|'emailVerified'|'mustChangePassword'|'createdAt'|'lastSignInAt';
export function publicUser<T extends object>(user:T|null|undefined):Pick<T,Extract<keyof T,PublicKey>>|null;
