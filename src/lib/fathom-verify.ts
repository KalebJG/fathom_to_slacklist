import crypto from "crypto";

/**
 * Verify Fathom webhook signature per https://developers.fathom.ai/webhooks#verifying-webhooks
 */
export function verifyFathomWebhook(
  secret: string,
  headers: Headers,
  rawBody: string
): boolean {
  const webhookId = headers.get("webhook-id");
  const webhookTimestamp = headers.get("webhook-timestamp");
  const webhookSignature = headers.get("webhook-signature");

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return false;
  }

  const timestamp = parseInt(webhookTimestamp, 10);
  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTimestamp - timestamp) > 300) {
    return false;
  }

  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const secretPart = secret.split("_")[1];
  if (!secretPart) return false;

  let secretBytes: Buffer;
  try {
    secretBytes = Buffer.from(secretPart, "base64");
  } catch {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");

  const signatures = webhookSignature.split(" ").map((sig) => {
    const parts = sig.split(",");
    return parts.length > 1 ? parts[1] : parts[0];
  });

  return signatures.some((sig) => {
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(sig)
      );
    } catch {
      return false;
    }
  });
}
