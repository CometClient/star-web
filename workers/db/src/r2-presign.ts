import { AwsClient } from "aws4fetch";

/** R2 S3-API credentials, supplied as worker secrets. */
export interface R2Creds {
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET?: string;
}

const DEFAULT_BUCKET = "comet-beta-builds";

export function hasR2Creds(env: R2Creds): boolean {
  return Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY);
}

/**
 * Presign an S3-style PUT URL for R2 so the browser can upload a build straight
 * to the bucket, bypassing the Worker/Pages request-body limit (~100 MB). Only
 * the host is signed (signQuery), so the client may send any content-type/body.
 */
export async function presignR2Put(
  env: R2Creds,
  storageKey: string,
  expiresSeconds = 3600,
): Promise<string> {
  const bucket = env.R2_BUCKET || DEFAULT_BUCKET;
  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID as string,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY as string,
    service: "s3",
    region: "auto",
  });
  // Encode each path segment but keep the slashes between them.
  const key = storageKey.split("/").map(encodeURIComponent).join("/");
  const url = new URL(`https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucket}/${key}`);
  url.searchParams.set("X-Amz-Expires", String(expiresSeconds));
  const signed = await client.sign(url.toString(), {
    method: "PUT",
    aws: { signQuery: true },
  });
  return signed.url;
}
