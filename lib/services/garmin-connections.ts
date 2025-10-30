import { eq } from "drizzle-orm";

import { db } from "@/db";
import { garminConnections } from "@/db/schema";
import { refreshAccessToken } from "@/lib/adapters/garmin";
import { decryptSecret, encryptSecret } from "@/lib/crypto";

export type GarminConnectionRecord = {
  id: number;
  userId: number;
  garminUserId: string;
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string;
  accessTokenExpiresAt: Date | null;
  tokenType: string;
  scope: string;
};

const mapQueryResult = (record: {
  id: number;
  userId: number;
  garminUserId: string;
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string;
  accessTokenExpiresAt: Date | null;
  tokenType: string;
  scope: string;
}): GarminConnectionRecord => ({
  id: record.id,
  userId: record.userId,
  garminUserId: record.garminUserId,
  accessTokenEncrypted: record.accessTokenEncrypted,
  refreshTokenEncrypted: record.refreshTokenEncrypted,
  accessTokenExpiresAt: record.accessTokenExpiresAt,
  tokenType: record.tokenType,
  scope: record.scope,
});

export const fetchGarminConnectionByGarminUserId = async (
  garminUserId: string,
): Promise<GarminConnectionRecord | null> => {
  const [record] = await db
    .select({
      id: garminConnections.id,
      userId: garminConnections.userId,
      garminUserId: garminConnections.garminUserId,
      accessTokenEncrypted: garminConnections.accessTokenEncrypted,
      refreshTokenEncrypted: garminConnections.refreshTokenEncrypted,
      accessTokenExpiresAt: garminConnections.accessTokenExpiresAt,
      tokenType: garminConnections.tokenType,
      scope: garminConnections.scope,
    })
    .from(garminConnections)
    .where(eq(garminConnections.garminUserId, garminUserId))
    .limit(1);

  return record ? mapQueryResult(record) : null;
};

export const fetchGarminConnectionByUserId = async (
  userId: number,
): Promise<GarminConnectionRecord | null> => {
  const [record] = await db
    .select({
      id: garminConnections.id,
      userId: garminConnections.userId,
      garminUserId: garminConnections.garminUserId,
      accessTokenEncrypted: garminConnections.accessTokenEncrypted,
      refreshTokenEncrypted: garminConnections.refreshTokenEncrypted,
      accessTokenExpiresAt: garminConnections.accessTokenExpiresAt,
      tokenType: garminConnections.tokenType,
      scope: garminConnections.scope,
    })
    .from(garminConnections)
    .where(eq(garminConnections.userId, userId))
    .limit(1);

  return record ? mapQueryResult(record) : null;
};

export const ensureGarminAccessToken = async (
  connection: GarminConnectionRecord,
): Promise<{ accessToken: string; connection: GarminConnectionRecord }> => {
  let accessToken = decryptSecret(connection.accessTokenEncrypted);
  let updatedConnection = connection;

  const expiresAt = connection.accessTokenExpiresAt ? new Date(connection.accessTokenExpiresAt) : null;
  const shouldRefresh = !expiresAt || expiresAt.getTime() <= Date.now() + 60 * 1000;

  if (shouldRefresh) {
    const refreshToken = decryptSecret(connection.refreshTokenEncrypted);
    const refreshed = await refreshAccessToken(refreshToken);

    accessToken = refreshed.accessToken;
    const encryptedAccess = encryptSecret(refreshed.accessToken);
    const encryptedRefresh = encryptSecret(refreshed.refreshToken);

    await db
      .update(garminConnections)
      .set({
        accessTokenEncrypted: encryptedAccess,
        refreshTokenEncrypted: encryptedRefresh,
        tokenType: refreshed.tokenType,
        scope: refreshed.scope,
        accessTokenExpiresAt: refreshed.accessTokenExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(garminConnections.id, connection.id));

    updatedConnection = {
      ...connection,
      accessTokenEncrypted: encryptedAccess,
      refreshTokenEncrypted: encryptedRefresh,
      accessTokenExpiresAt: refreshed.accessTokenExpiresAt,
      tokenType: refreshed.tokenType,
      scope: refreshed.scope,
    };
  }

  return { accessToken, connection: updatedConnection };
};
