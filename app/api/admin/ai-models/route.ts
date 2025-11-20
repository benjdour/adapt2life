import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { stackServerApp } from "@/stack/server";
import { canAccessAdminArea } from "@/lib/accessControl";
import { buildAiModelAdminSnapshot, saveAiModelForFeature } from "@/lib/services/aiModelConfig";
import { AI_FEATURE_LIST, type AiFeatureId } from "@/lib/constants/aiFeatures";
import { getAvailableAiModels } from "@/lib/services/openRouterModels";

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
  modelId: z.string().min(1),
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

  const availableModels = await getAvailableAiModels();
  const allowedIds = new Set(availableModels.map((model) => model.id));
  if (!allowedIds.has(parsed.data.modelId)) {
    return NextResponse.json({ error: "Modèle IA indisponible sur OpenRouter." }, { status: 400 });
  }

  await saveAiModelForFeature(parsed.data.featureId, parsed.data.modelId, user.id);

  const snapshot = await buildAiModelAdminSnapshot();
  return NextResponse.json(snapshot);
}
