export function publicUser(user) {
  if (!user) return null;
  return Object.fromEntries(['id', 'name', 'email', 'avatar', 'role', 'provider', 'emailVerified', 'mustChangePassword', 'createdAt', 'lastSignInAt'].map(key => [key, user[key]]));
}
