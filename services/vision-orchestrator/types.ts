import type {
  ImageGenSkillParams,
  ImageReferenceRoleMode,
  ImageTextPolicy,
  PromptLanguagePolicy,
} from "../../types";

export type VisualTaskIntent =
  | "poster_rebuild"
  | "product_scene"
  | "product_lock"
  | "background_replace"
  | "subject_consistency"
  | "multi_reference_fusion"
  | "text_preserve"
  | "style_transfer"
  | "unknown";

export type VisualReferenceRole =
  | "layout"
  | "style"
  | "product"
  | "brand"
  | "subject"
  | "detail"
  | "background"
  | "supporting";

export type VisualConstraintLock = {
  brandIdentity: boolean;
  subjectShape: boolean;
  packagingLayout: boolean;
  composition: boolean;
  textLayout: boolean;
  materialTexture: boolean;
};

export type VisualReferencePlan = {
  id: string;
  url: string;
  role: VisualReferenceRole;
  weight: number;
  source: "manual" | "consistency-anchor";
  notes?: string;
};

export type VisualGenerationPlan = {
  intent: VisualTaskIntent;
  strategyId: string;
  userGoal: string;
  references: VisualReferencePlan[];
  locks: VisualConstraintLock;
  allowedEdits: string[];
  forbiddenEdits: string[];
  qualityHint: NonNullable<ImageGenSkillParams["imageQuality"]>;
  plannerNotes: string[];
  requestedReferenceRoleMode: ImageReferenceRoleMode;
  effectiveReferenceRoleMode: ImageReferenceRoleMode;
};

export type PlannerConsistencyContext = {
  approvedAssetIds?: string[];
  subjectAnchors?: string[];
  referenceSummary?: string;
  forbiddenChanges?: string[];
};

export type PlannedImageGeneration = {
  plan: VisualGenerationPlan;
  plannerMeta?: {
    source: "rule" | "model";
    modelId?: string;
    providerId?: string | null;
  };
  execution: {
    basePrompt: string;
    composedPrompt: string;
    referenceImages: string[];
    referencePriority?: "first" | "all";
    referenceStrength?: number;
    referenceRoleMode: ImageReferenceRoleMode;
    promptLanguagePolicy: PromptLanguagePolicy;
    textPolicy?: ImageTextPolicy;
    disableTransportRetries: boolean;
    consistencyContext?: PlannerConsistencyContext;
  };
};

export type PlanVisualGenerationInput = {
  prompt: string;
  manualReferenceImages: string[];
  referenceImages: string[];
  requestedReferenceRoleMode?: ImageReferenceRoleMode;
  imageQuality?: NonNullable<ImageGenSkillParams["imageQuality"]>;
  translatePromptToEnglish?: boolean;
  enforceChineseTextInImage?: boolean;
  requiredChineseCopy?: string;
  disableTransportRetries?: boolean;
  consistencyContext?: PlannerConsistencyContext;
};

export type VisualPlannerModelConfig = {
  modelId: string;
  providerId?: string | null;
  label?: string;
};
