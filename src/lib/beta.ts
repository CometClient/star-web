import { verifyBetaToken as apiVerifyBetaToken } from "./api";

export { generateToken, hashToken } from "./beta-crypto";

export async function verifyBetaToken(email: string, token: string): Promise<boolean> {
  return apiVerifyBetaToken(email.trim().toLowerCase(), token.trim());
}
