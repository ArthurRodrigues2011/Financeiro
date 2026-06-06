const encoder = new TextEncoder();

const toHex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");

export const createSalt = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const hashPassword = async (password: string, salt: string) => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(`${salt}:${password}`));
  return toHex(digest);
};

export const verifyPassword = async (password: string, hash: string, salt: string) => {
  const candidate = await hashPassword(password, salt);
  return candidate === hash;
};
