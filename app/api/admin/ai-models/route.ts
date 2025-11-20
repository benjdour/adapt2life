import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { stackServerApp } from "@/stack/server";
import { canAccessAdminArea } from "@/lib/accessControl";
import { buildAiModelAdminSnapshot, saveAiModelForFeature } from "@/lib/services/aiModelConfig";
import { AI_FEATURE_LIST, type AiFeatureId } from "@/lib/constants/aiFeatures";
import { AVAILABLE_AI_MODELS, type AiModelId } from "@/lib/constants/aiModels";

const ensureAdmin = async (request: NextRequest) => {
  const user = await stackServerApp.getUser({ or: "return-null", tokenStore: request });
  if (!user || !canAccessAdminArea(user.id)) {
    return null;
  }
  return user;
};

export async function GET(request: NextRequest) {
  const user = await ensureAdmin(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await buildAiModelAdminSnapshot();
  return NextResponse.json(snapshot);
}

const UpdateSchema = z.object({
  featureId: z.enum(AI_FEATURE_LIST.map((feature) => feature.id) as [AiFeatureId, ...AiFeatureId[]]),
  modelId: z.enum(AVAILABLE_AI_MODELS.map((model) => model.id) as [AiModelId, ...AiModelId[]]),
});

export async function POST(request: NextRequest) {
  const user = await ensureAdmin(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const parsed = UpdateSchema.safeParse(payload);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Paramètres invalides";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await saveAiModelForFeature(parsed.data.featureId, parsed.data.modelId, user.id);

  const snapshot = await buildAiModelAdminSnapshot();
  return NextResponse.json(snapshot);
}
