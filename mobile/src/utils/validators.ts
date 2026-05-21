export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isValidUsername = (username: string): boolean =>
  /^[a-zA-Z0-9_]{3,30}$/.test(username);

export const isValidPassword = (password: string): boolean =>
  password.length >= 6;
