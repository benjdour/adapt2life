import { createHmac, timingSafeEqual } from "crypto";

const HEADER_NAME = "x-garmin-signature";

export type SignatureValidation = {
  valid: boolean;
  reason?: string;
};

export const verifyGarminSignature = (headers: Headers, rawBody: string): SignatureValidation => {
  const secret = process.env.GARMIN_WEBHOOK_SECRET;
  if (!secret) {
    return { valid: true, reason: "GARMIN_WEBHOOK_SECRET missing" };
  }

  const providedSignature = headers.get(HEADER_NAME);
  if (!providedSignature) {
    return { valid: false, reason: "signature header missing" };
  }

  try {
    const computed = createHmac("sha256", secret).update(rawBody).digest("base64");
    const providedBuffer = Buffer.from(providedSignature.trim(), "base64");
    const computedBuffer = Buffer.from(computed, "base64");

    if (providedBuffer.length !== computedBuffer.length) {
      return { valid: false, reason: "signature length mismatch" };
    }

    const isValid = timingSafeEqual(providedBuffer, computedBuffer);
    return { valid: isValid, reason: isValid ? undefined : "signature mismatch" };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown signature error";
    return { valid: false, reason };
  }
};
