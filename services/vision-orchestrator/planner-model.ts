import { Type } from "@google/genai";
import { generateJsonResponse } from "../gemini";
import { normalizeReferenceToModelInputDataUrl } from "../image-reference-resolver";
import { getVisualOrchestratorInputPolicy } from "../provider-settings";
import type {
  PlannerConsistencyContext,
  PlanVisualGenerationInput,
  VisualConstraintLock,
  VisualTaskIntent,
} from "./types";

const VALID_INTENTS = new Set<VisualTaskIntent>([
  "poster_rebuild",
  "product_scene",
  "product_lock",
  "background_replace",
  "subject_consistency",
  "multi_reference_fusion",
  "text_preserve",
  "style_transfer",
  "unknown",
]);

const VALID_REFERENCE_ROLE_MODES = new Set(["none", "default", "poster-product"]);

type VisualPlanModelPatch = {
  intent?: VisualTaskIntent;
  strategyId?: string;
  referenceRoleMode?: "none" | "default" | "poster-product";
  locks?: Partial<VisualConstraintLock>;
  allowedEdits?: string[];
  forbiddenEdits?: string[];
  plannerNotes?: string[];
  rawResponseText?: string;
};

const hasCompleteModelPatch = (patch: VisualPlanModelPatch | null): patch is VisualPlanModelPatch => {
  if (!patch) return false;
  return Boolean(
    patch.intent &&
      patch.strategyId &&
      patch.referenceRoleMode &&
      patch.locks &&
      patch.allowedEdits &&
      patch.allowedEdits.length > 0 &&
      patch.forbiddenEdits &&
      patch.forbiddenEdits.length > 0,
  );
};

const VISUAL_PLAN_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    intent: { type: Type.STRING },
    strategyId: { type: Type.STRING },
    referenceRoleMode: { type: Type.STRING },
    locks: {
      type: Type.OBJECT,
      properties: {
        brandIdentity: { type: Type.BOOLEAN },
        subjectShape: { type: Type.BOOLEAN },
        packagingLayout: { type: Type.BOOLEAN },
        composition: { type: Type.BOOLEAN },
        textLayout: { type: Type.BOOLEAN },
        materialTexture: { type: Type.BOOLEAN },
      },
    },
    allowedEdits: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    forbiddenEdits: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    plannerNotes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    "intent",
    "strategyId",
    "referenceRoleMode",
    "locks",
    "allowedEdits",
    "forbiddenEdits",
    "plannerNotes",
  ],
};

const trimStringArray = (value: unknown, limit = 8) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, limit);
};

const normalizeLocks = (value: unknown): Partial<VisualConstraintLock> | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  const next: Partial<VisualConstraintLock> = {};
  const keys: Array<keyof VisualConstraintLock> = [
    "brandIdentity",
    "subjectShape",
    "packagingLayout",
    "composition",
    "textLayout",
    "materialTexture",
  ];

  keys.forEach((key) => {
    if (typeof raw[key] === "boolean") {
      next[key] = raw[key] as boolean;
    }
  });

  return Object.keys(next).length > 0 ? next : undefined;
};

const normalizeModelPatch = (raw: unknown): VisualPlanModelPatch | null => {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const next: VisualPlanModelPatch = {};

  if (typeof data.intent === "string" && VALID_INTENTS.has(data.intent as VisualTaskIntent)) {
    next.intent = data.intent as VisualTaskIntent;
  }

  if (typeof data.strategyId === "string" && data.strategyId.trim()) {
    next.strategyId = data.strategyId.trim().slice(0, 80);
  }

  if (
    typeof data.referenceRoleMode === "string" &&
    VALID_REFERENCE_ROLE_MODES.has(data.referenceRoleMode)
  ) {
    next.referenceRoleMode = data.referenceRoleMode as
      | "none"
      | "default"
      | "poster-product";
  }

  const locks = normalizeLocks(data.locks);
  if (locks) next.locks = locks;

  const allowedEdits = trimStringArray(data.allowedEdits);
  if (allowedEdits.length > 0) next.allowedEdits = allowedEdits;

  const forbiddenEdits = trimStringArray(data.forbiddenEdits);
  if (forbiddenEdits.length > 0) next.forbiddenEdits = forbiddenEdits;

  const plannerNotes = trimStringArray(data.plannerNotes, 10);
  if (plannerNotes.length > 0) next.plannerNotes = plannerNotes;

  if (!next.intent && !next.strategyId && !next.referenceRoleMode) {
    return null;
  }

  return next;
};

const buildRepairPrompt = (rawResponseText: string) =>
  [
    "Rewrite the following model output into a strict JSON object for a visual orchestration planner.",
    "Return JSON only.",
    "Do not include markdown fences.",
    "Do not include any fields except:",
    "- intent",
    "- strategyId",
    "- referenceRoleMode",
    "- locks",
    "- allowedEdits",
    "- forbiddenEdits",
    "- plannerNotes",
    "",
    "[Requirements]",
    "- strategyId must be a short stable identifier and should normally match the intent unless a clearer strategy id is required.",
    "- locks must include all six boolean fields: brandIdentity, subjectShape, packagingLayout, composition, textLayout, materialTexture.",
    "- allowedEdits must be a non-empty array of strings.",
    "- forbiddenEdits must be a non-empty array of strings.",
    "- plannerNotes must be a non-empty array of short strings.",
    "- Keep the original meaning; only repair the structure.",
    "",
    "[Raw Model Output]",
    rawResponseText,
  ].join("\n");

const summarizeConsistencyContext = (context?: PlannerConsistencyContext) => ({
  subjectAnchorCount: context?.subjectAnchors?.length || 0,
  hasReferenceSummary: Boolean(context?.referenceSummary),
  forbiddenChanges: (context?.forbiddenChanges || []).slice(0, 6),
});

const buildPlannerPrompt = (
  input: PlanVisualGenerationInput,
  referenceImageCount: number,
  multimodalDiagnostics: {
    inputReferenceCount: number;
    includedReferenceCount: number;
    totalInlineBytes: number;
    maxInlineBytes: number;
  },
) => {
  const requestedMode = input.requestedReferenceRoleMode || "default";
  const consistencySummary = summarizeConsistencyContext(input.consistencyContext);

  return [
    "You are a visual generation planner for an image-generation workspace.",
    "Your job is to classify the user's task and refine the orchestration plan before image generation.",
    "Return JSON only.",
    "Do not include markdown fences.",
    "Do not include explanatory prose.",
    "You must return all required fields: intent, strategyId, referenceRoleMode, locks, allowedEdits, forbiddenEdits, plannerNotes.",
    "",
    "[User Prompt]",
    input.prompt,
    "",
    "[Planner Context]",
    `requestedReferenceRoleMode=${requestedMode}`,
    `manualReferenceCount=${input.manualReferenceImages.length}`,
    `totalReferenceCount=${referenceImageCount}`,
    `includedReferenceCount=${multimodalDiagnostics.includedReferenceCount}`,
    `plannerInlineBudgetBytes=${multimodalDiagnostics.maxInlineBytes}`,
    `plannerInlineBytesUsed=${multimodalDiagnostics.totalInlineBytes}`,
    `imageQuality=${input.imageQuality || "medium"}`,
    `translatePromptToEnglish=${input.translatePromptToEnglish ? "true" : "false"}`,
    `enforceChineseTextInImage=${input.enforceChineseTextInImage ? "true" : "false"}`,
    `requiredChineseCopy=${String(input.requiredChineseCopy || "").trim() || "none"}`,
    "",
    "[Consistency Context]",
    JSON.stringify(consistencySummary),
    "",
    "[Rules]",
    "- If the user clearly wants poster/layout reconstruction with product replacement, use intent=poster_rebuild.",
    "- If the user mainly wants the product identity to stay stable, use intent=product_lock.",
    "- If the user mainly wants background changes while keeping subject stable, use intent=background_replace.",
    "- If the user references multiple images with mixed duties, use intent=multi_reference_fusion unless poster_rebuild is clearly better.",
    "- Only output referenceRoleMode=poster-product when there are at least two manual reference images and the user intent clearly assigns different jobs to them.",
    "- Preserve brand identity, product silhouette, packaging structure, and text layout when the user clearly implies they should stay stable.",
    "- strategyId must be present and should usually match the intent unless a clearer strategy id is necessary.",
    "- locks must include all six boolean fields even if some are false.",
    "- Keep allowedEdits and forbiddenEdits concise and practical.",
    "- plannerNotes should explain why you chose the strategy in short phrases.",
  ].join("\n");
};

const estimateDataUrlBytes = (dataUrl: string): number => {
  const value = String(dataUrl || "");
  const commaIndex = value.indexOf(",");
  const base64 = commaIndex >= 0 ? value.slice(commaIndex + 1) : value;
  return Math.floor((base64.length * 3) / 4);
};

const MAX_REFERENCE_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_REFERENCE_IMAGE_EDGE = 2048;
const REFERENCE_COMPRESS_QUALITIES = [0.9, 0.82, 0.74, 0.66, 0.58, 0.5, 0.42];

const blobToDataUrl = async (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("reference image read failed"));
    reader.readAsDataURL(blob);
  });

const loadImageFromBlob = async (blob: Blob): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("reference image decode failed"));
    };
    image.src = objectUrl;
  });

const renderCanvasToBlob = async (
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob | null> =>
  new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });

const shouldPreserveReferenceTransparency = (mimeType: string): boolean => {
  const normalized = String(mimeType || "").toLowerCase();
  return (
    normalized.includes("png") ||
    normalized.includes("webp") ||
    normalized.includes("gif")
  );
};

const compressReferenceDataUrlIfNeeded = async (
  dataUrl: string,
  maxBytes: number,
): Promise<string> => {
  const originalBytes = estimateDataUrlBytes(dataUrl);
  if (originalBytes <= maxBytes) {
    return dataUrl;
  }

  if (typeof document === "undefined") {
    return dataUrl;
  }

  const sourceBlob = await fetch(dataUrl).then((response) => response.blob());
  const sourceMimeType =
    String(sourceBlob.type || "").trim() ||
    String(dataUrl.match(/^data:(.+);base64,/)?.[1] || "").trim() ||
    "image/png";
  const preserveTransparency = shouldPreserveReferenceTransparency(sourceMimeType);
  const image = await loadImageFromBlob(sourceBlob);
  const sourceWidth = Math.max(1, image.naturalWidth || image.width || 1);
  const sourceHeight = Math.max(1, image.naturalHeight || image.height || 1);

  let scale = Math.min(1, MAX_REFERENCE_IMAGE_EDGE / Math.max(sourceWidth, sourceHeight));
  let bestDataUrl = dataUrl;
  let bestBytes = originalBytes;

  for (let pass = 0; pass < 6; pass += 1) {
    const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
    const targetHeight = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("canvas context unavailable");
    }
    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    if (preserveTransparency) {
      const blob = await renderCanvasToBlob(canvas, "image/png");
      if (blob) {
        const candidateDataUrl = await blobToDataUrl(blob);
        const candidateBytes = estimateDataUrlBytes(candidateDataUrl);
        if (candidateBytes < bestBytes) {
          bestBytes = candidateBytes;
          bestDataUrl = candidateDataUrl;
        }
        if (candidateBytes <= maxBytes) {
          return candidateDataUrl;
        }
      }
    } else {
      for (const quality of REFERENCE_COMPRESS_QUALITIES) {
        const blob = await renderCanvasToBlob(canvas, "image/jpeg", quality);
        if (!blob) continue;
        const candidateDataUrl = await blobToDataUrl(blob);
        const candidateBytes = estimateDataUrlBytes(candidateDataUrl);
        if (candidateBytes < bestBytes) {
          bestBytes = candidateBytes;
          bestDataUrl = candidateDataUrl;
        }
        if (candidateBytes <= maxBytes) {
          return candidateDataUrl;
        }
      }
    }

    scale *= 0.82;
  }

  return bestDataUrl;
};

const buildReferenceParts = async (referenceImages: string[]) => {
  const policy = getVisualOrchestratorInputPolicy();
  const maxReferenceImages = policy.maxReferenceImages;
  const maxInlineBytes = Math.max(1, policy.maxInlineImageBytesMb) * 1024 * 1024;
  if (maxReferenceImages > 0 && referenceImages.length > maxReferenceImages) {
    throw new Error(
      `Visual orchestration received ${referenceImages.length} reference images, which exceeds the configured limit of ${maxReferenceImages}. Raise the limit in Settings or reduce the references before generating.`,
    );
  }

  const parts: Array<{ text?: string; inlineData?: { mimeType?: string; data?: string } }> = [];
  let totalInlineBytes = 0;

  for (let index = 0; index < referenceImages.length; index += 1) {
    const normalized = await normalizeReferenceToModelInputDataUrl(referenceImages[index]);
    if (!normalized) {
      throw new Error(
        `Visual orchestration could not load reference image ${index + 1}. Planning was stopped to avoid silently ignoring that reference.`,
      );
    }
    const match = normalized.match(/^data:(.+);base64,(.+)$/);
    if (!match) {
      throw new Error(
        `Visual orchestration could not decode reference image ${index + 1} into a valid multimodal input.`,
      );
    }
    const compressed = await compressReferenceDataUrlIfNeeded(
      normalized,
      MAX_REFERENCE_IMAGE_BYTES,
    );
    const compressedMatch = compressed.match(/^data:(.+);base64,(.+)$/);
    if (!compressedMatch) {
      throw new Error(
        `Visual orchestration could not decode reference image ${index + 1} after compression.`,
      );
    }
    const candidateBytes = estimateDataUrlBytes(compressed);
    if (candidateBytes > MAX_REFERENCE_IMAGE_BYTES) {
      throw new Error(
        `Visual orchestration could not compress reference image ${index + 1} under the per-image limit of 8MB. Current size is ${(candidateBytes / 1024 / 1024).toFixed(2)}MB. Please reduce that reference image before generating.`,
      );
    }
    if (totalInlineBytes + candidateBytes > maxInlineBytes) {
      throw new Error(
        `Visual orchestration image budget exceeded at reference ${index + 1}. Used ${(totalInlineBytes / 1024 / 1024).toFixed(2)}MB, next image adds ${(candidateBytes / 1024 / 1024).toFixed(2)}MB, budget is ${policy.maxInlineImageBytesMb}MB. Raise the budget in Settings or reduce the references before generating.`,
      );
    }

    parts.push({
      text: `Reference image ${index + 1}`,
    });
    parts.push({
      inlineData: {
        mimeType: compressedMatch[1],
        data: compressedMatch[2],
      },
    });
    totalInlineBytes += candidateBytes;
  }

  return {
    parts,
    diagnostics: {
      inputReferenceCount: referenceImages.length,
      includedReferenceCount: referenceImages.length,
      totalInlineBytes,
      maxInlineBytes,
    },
  };
};

export const generateVisualPlanModelPatch = async (args: {
  input: PlanVisualGenerationInput;
  modelId: string;
  providerId?: string | null;
}): Promise<VisualPlanModelPatch | null> => {
  const { input, modelId, providerId } = args;
  const { parts: referenceParts, diagnostics } = await buildReferenceParts(
    input.referenceImages,
  );
  const prompt = buildPlannerPrompt(
    input,
    input.referenceImages.length,
    diagnostics,
  );
  const parts = [
    ...referenceParts,
    {
      text: prompt,
    },
  ];

  try {
    const response = await generateJsonResponse({
      model: modelId,
      providerId,
      parts,
      temperature: 0.2,
      responseSchema: VISUAL_PLAN_RESPONSE_SCHEMA,
      operation: "visualOrchestratorPlan",
      queueKey: "visualOrchestratorPlan",
      minIntervalMs: 400,
      requestTuning: {
        timeoutMs: 45000,
        retries: 1,
        baseDelayMs: 800,
        maxDelayMs: 3000,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const normalized = normalizeModelPatch(parsed);
    if (normalized) {
      normalized.rawResponseText = response.text || "";
    }
    if (hasCompleteModelPatch(normalized)) {
      return normalized;
    }

    const repairResponse = await generateJsonResponse({
      model: modelId,
      providerId,
      parts: [
        {
          text: buildRepairPrompt(response.text || "{}"),
        },
      ],
      temperature: 0.1,
      responseSchema: VISUAL_PLAN_RESPONSE_SCHEMA,
      operation: "visualOrchestratorPlan.repair",
      queueKey: "visualOrchestratorPlan",
      minIntervalMs: 400,
      requestTuning: {
        timeoutMs: 30000,
        retries: 0,
        baseDelayMs: 500,
        maxDelayMs: 1500,
      },
    });

    const repairedParsed = JSON.parse(repairResponse.text || "{}");
    const repaired = normalizeModelPatch(repairedParsed);
    if (repaired) {
      repaired.rawResponseText = repairResponse.text || "";
    }
    return repaired;
  } catch (error) {
    console.warn("[vision-orchestrator] model planning failed", {
      modelId,
      providerId: providerId || null,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};
