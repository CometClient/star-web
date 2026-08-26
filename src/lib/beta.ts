import { verifyBetaToken as apiVerifyBetaToken, confirmBetaIdentity } from "./api";

export { generateToken, hashToken } from "./beta-crypto";
export type { BetaVerifyResponse } from "./api";

/** Step 1 — validate the token without consuming it. */
export const verifyBetaToken = apiVerifyBetaToken;

/** Step 2 — confirm the identity, burn the token, receive a one-time link. */
export const confirmBetaDownload = confirmBetaIdentity;
