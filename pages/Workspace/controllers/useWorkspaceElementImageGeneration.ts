import { useCallback, useRef, type MutableRefObject } from "react";
import type {
  CanvasElement,
  ChatMessage,
  WorkspaceNodeInteractionMode,
} from "../../../types";
import { imageGenSkill } from "../../../services/skills/image-gen.skill";
import { getVisualOrchestratorModelConfig } from "../../../services/provider-settings";
import { planVisualGenerationWithModel } from "../../../services/vision-orchestrator";
import { resolveWorkspaceTreeNodeKind } from "../workspaceTreeNode";

const formatGenerationError = (error: unknown) => {
  if (!error) return "Unknown error";
  const message =
    error instanceof Error
      ? error.message || error.name || "Unknown error"
      : String(error);

  const timeoutMatch = message.match(/timeout after (\d+)ms/i);
  if (timeoutMatch) {
    const timeoutMs = Number(timeoutMatch[1]);
    const timeoutSeconds =
      Number.isFinite(timeoutMs) && timeoutMs > 0
        ? Math.round(timeoutMs / 1000)
        : null;
    return timeoutSeconds
      ? `Image generation timed out after ${timeoutSeconds}s. Try 1K or 2K, reduce references, or switch to Nano Banana 2.`
      : "Image generation timed out. Try 1K or 2K, reduce references, or switch to Nano Banana 2.";
  }

  if (/524/.test(message) || /gateway timeout/i.test(message)) {
    return "The upstream image provider timed out (524). Try 1K or 2K, reduce references, wait a bit, or switch to another image route/provider.";
  }

  if (/408/.test(message) || /upstream timeout/i.test(message)) {
    return "The upstream image provider timed out (408). Please verify the current provider mirror fully supports the current gpt-image-2 edit payload, including multi-reference uploads and field names.";
  }

  if (
    /429/.test(message) ||
    /rate limited/i.test(message) ||
    /too many requests/i.test(message)
  ) {
    return "Image generation was rate limited by the upstream provider. Wait a bit and retry, or switch to another image route/key.";
  }

  if (/400/.test(message) || /bad request/i.test(message)) {
    const compactMessage = message.replace(/\s+/g, " ").trim();
    if (/upstream image provider/i.test(compactMessage)) {
      return `${compactMessage}. Try reducing references, retrying with 1K or 2K, or checking whether the current provider mirror fully supports gpt-image-2 generation parameters.`;
    }
    return "The upstream image provider rejected the current parameters (400). Try reducing references, retrying with 1K or 2K, or switching to another image route/provider.";
  }

  return message;
};

const HUMAN_INTENT_LABELS: Record<string, string> = {
  poster_rebuild: "海报复刻",
  multi_reference_fusion: "多图融合",
  product_lock: "主体锁定",
  product_scene: "场景生成",
  background_replace: "背景替换",
  text_preserve: "文案版式保留",
};

const HUMAN_REFERENCE_ROLE_MODE_LABELS: Record<string, string> = {
  none: "无约束",
  default: "智能分配",
  "poster-product": "海报参考 + 产品参考",
};

const HUMAN_QUALITY_LABELS: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

const formatPlannerNote = (note: string): string => {
  const value = String(note || "").trim();
  if (!value) return "";
  if (value.startsWith("planner-model=")) {
    return `编排模型：${value.slice("planner-model=".length)}`;
  }
  if (value.startsWith("intent=")) {
    const intent = value.slice("intent=".length);
    return `识别意图：${HUMAN_INTENT_LABELS[intent] || intent}`;
  }
  if (value.startsWith("reference-role-mode=")) {
    const mode = value.slice("reference-role-mode=".length);
    return `参考图分工：${HUMAN_REFERENCE_ROLE_MODE_LABELS[mode] || mode}`;
  }
  return value;
};

const buildPlanningStatusLines = (
  referenceCount: number,
  plannerLabel?: string | null,
) => {
  const lines = [
    "已创建生图节点，正在进入编排阶段",
    plannerLabel ? `正在调用编排模型：${plannerLabel}` : "正在调用编排模型",
    referenceCount > 0
      ? `正在分析 ${referenceCount} 张参考图的分工与约束`
      : "正在分析本次生图意图与约束",
    "正在生成视觉编排计划",
  ];
  return lines;
};

const buildPlannedStatusLines = ({
  intent,
  strategyId,
  referenceRoleMode,
  plannerNotes,
}: {
  intent: string;
  strategyId: string;
  referenceRoleMode: string;
  plannerNotes: string[];
}) => {
  const lines = [
    `意图：${HUMAN_INTENT_LABELS[intent] || intent}`,
    `分工：${HUMAN_REFERENCE_ROLE_MODE_LABELS[referenceRoleMode] || referenceRoleMode}`,
    `策略：${strategyId}`,
  ];

  for (const note of plannerNotes.map(formatPlannerNote)) {
    if (!note) continue;
    if (lines.includes(note)) continue;
    lines.push(note);
    if (lines.length >= 5) break;
  }

  return lines.slice(0, 5);
};

const buildGeneratingStatusLines = ({
  imageCount,
  variantLabel,
  model,
  aspectRatio,
  imageSize,
  imageQuality,
  referenceCount,
  planLines,
}: {
  imageCount: number;
  variantLabel: string;
  model: string;
  aspectRatio: string;
  imageSize: string;
  imageQuality: string;
  referenceCount: number;
  planLines: string[];
}) => {
  const lines = [
    imageCount > 1 ? `当前批次：${variantLabel}` : "已完成视觉编排，正在请求生图",
    `模型：${model}`,
    `参数：${aspectRatio} · ${imageSize} · 质量${HUMAN_QUALITY_LABELS[imageQuality] || imageQuality}`,
    `参考图：${referenceCount} 张`,
  ];

  const importantPlanLine = planLines.find((line) => line.startsWith("分工："));
  if (importantPlanLine) {
    lines.push(importantPlanLine);
  }

  return lines.slice(0, 5);
};

const buildQueuedStatusLines = ({
  variantLabel,
  waitingForLabel,
  planLines,
}: {
  variantLabel: string;
  waitingForLabel?: string;
  planLines: string[];
}) => {
  const lines = [
    `当前批次：${variantLabel}`,
    waitingForLabel
      ? `正在等待前序任务 ${waitingForLabel} 完成`
      : "正在等待前序任务完成",
    "轮到当前节点时会自动开始生图",
  ];

  const importantPlanLine = planLines.find((line) => line.startsWith("分工："));
  if (importantPlanLine) {
    lines.push(importantPlanLine);
  }

  return lines.slice(0, 5);
};

type UseWorkspaceElementImageGenerationOptions = {
  elementsRef: MutableRefObject<CanvasElement[]>;
  nodeInteractionMode: WorkspaceNodeInteractionMode;
  setElementGeneratingState: (
    elementId: string,
    isGenerating: boolean,
    errorMessage?: string,
  ) => void;
  setElementsGenerationStatus: (
    elementIds: string[],
    status?: {
      phase?: "planning" | "planned" | "queued" | "generating" | "retrying";
      title?: string;
      lines?: string[];
    } | null,
  ) => void;
  addMessage: (message: ChatMessage) => void;
  translatePromptToEnglish: boolean;
  enforceChineseTextInImage: boolean;
  requiredChineseCopy: string;
  getDesignConsistencyContext: () => Record<string, unknown>;
  mergeConsistencyAnchorIntoReferences: (referenceUrls?: string[]) => string[];
  retryWithConsistencyFix: (
    label: string,
    initialUrl: string,
    rerun: (fixPrompt?: string) => Promise<string | null>,
    anchorOverride?: string,
    genPrompt?: string,
    referenceCount?: number,
  ) => Promise<string>;
  applyGeneratedImageToElement: (
    elementId: string,
    resultUrl: string,
    keepCurrentSize?: boolean,
  ) => Promise<void>;
  createGeneratingImagesNearElement: (
    sourceElementId: string,
    additionalCount: number,
  ) => string[];
  createGeneratingTreeImageChildren: (
    sourceElementId: string,
    totalCount: number,
  ) => string[];
  getClosestAspectRatio: (width: number, height: number) => string;
};

export function useWorkspaceElementImageGeneration(
  options: UseWorkspaceElementImageGenerationOptions,
) {
  const {
    elementsRef,
    nodeInteractionMode,
    setElementGeneratingState,
    setElementsGenerationStatus,
    addMessage,
    translatePromptToEnglish,
    enforceChineseTextInImage,
    requiredChineseCopy,
    mergeConsistencyAnchorIntoReferences,
    getDesignConsistencyContext,
    retryWithConsistencyFix,
    applyGeneratedImageToElement,
    createGeneratingImagesNearElement,
    createGeneratingTreeImageChildren,
    getClosestAspectRatio,
  } = options;
  const activeRequestsRef = useRef(new Set<string>());

  return useCallback(
    async (elementId: string) => {
      const requestElement = elementsRef.current.find(
        (element) => element.id === elementId,
      );
      if (!requestElement) return;
      const isTreePromptRequest =
        resolveWorkspaceTreeNodeKind(requestElement, nodeInteractionMode) ===
        "prompt";
      const requestKey = isTreePromptRequest
        ? `${elementId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`
        : elementId;

      if (!isTreePromptRequest && activeRequestsRef.current.has(requestKey)) {
        return;
      }
      activeRequestsRef.current.add(requestKey);
      const requestStartedAt = Date.now();
      let plannerStartedAt = 0;
      let shouldTrackSourceElementState = false;
      let targetElementIds: string[] = [];
      try {
        const el = elementsRef.current.find((element) => element.id === elementId);
        if (!el) return;
        const isTreePromptNode =
          resolveWorkspaceTreeNodeKind(el, nodeInteractionMode) === "prompt";
        const isTreeImageNode =
          resolveWorkspaceTreeNodeKind(el, nodeInteractionMode) === "image";
        const parentPromptElement =
          isTreeImageNode && el.nodeParentId
            ? elementsRef.current.find(
                (element) =>
                  element.id === el.nodeParentId &&
                  resolveWorkspaceTreeNodeKind(element, nodeInteractionMode) ===
                    "prompt",
              ) || null
            : null;
        const sourceElement = parentPromptElement || el;
        if (!sourceElement.genPrompt) return;
        shouldTrackSourceElementState = !isTreePromptNode;
        if (shouldTrackSourceElementState) {
          setElementGeneratingState(elementId, true);
        }

        const currentAspectRatio =
          sourceElement.genAspectRatio ||
          getClosestAspectRatio(sourceElement.width, sourceElement.height);
        const model = sourceElement.genModel || "Nano Banana Pro";
        const imageSize = sourceElement.genResolution || "1K";
        const imageQuality = sourceElement.genImageQuality || "medium";
        const imageCount = isTreePromptNode
          ? Math.max(1, Math.min(4, sourceElement.genImageCount || 1))
          : 1;
        const manualReferenceImages =
          sourceElement.genRefImages ||
          (sourceElement.genRefImage ? [sourceElement.genRefImage] : []);
        const referenceImages = mergeConsistencyAnchorIntoReferences(
          manualReferenceImages,
        );
        const consistencyAnchorInjected =
          referenceImages.length > 0 &&
          (manualReferenceImages.length === 0 ||
            referenceImages[0] !== manualReferenceImages[0] ||
            referenceImages.length !== manualReferenceImages.length);
        const visualOrchestratorModel = getVisualOrchestratorModelConfig();
        const plannerLabel =
          visualOrchestratorModel?.displayLabel ||
          visualOrchestratorModel?.modelId ||
          null;

        if (isTreePromptNode) {
          targetElementIds = createGeneratingTreeImageChildren(elementId, imageCount);
          if (targetElementIds.length === 0) {
            throw new Error("Failed to create tree image placeholders");
          }
          setElementsGenerationStatus(targetElementIds, {
            phase: "planning",
            title: referenceImages.length > 0
              ? `正在分析 ${referenceImages.length} 张参考图分工`
              : "正在分析生图意图",
            lines: buildPlanningStatusLines(
              referenceImages.length,
              plannerLabel,
            ),
          });
        } else if (shouldTrackSourceElementState) {
          setElementsGenerationStatus([elementId], {
            phase: "planning",
            title: referenceImages.length > 0
              ? `正在分析 ${referenceImages.length} 张参考图分工`
              : "正在分析生图意图",
            lines: buildPlanningStatusLines(
              referenceImages.length,
              plannerLabel,
            ),
          });
        }

        plannerStartedAt = Date.now();
        console.info("[workspace.imggen] planner.start", {
          elementId,
          sourceElementId: sourceElement.id,
          imageCount,
          model,
          aspectRatio: currentAspectRatio,
          imageSize,
          imageQuality,
          manualReferenceCount: manualReferenceImages.length,
          mergedReferenceCount: referenceImages.length,
          requestedReferenceRoleMode: sourceElement.genReferenceRoleMode || "default",
          visualOrchestratorModel: visualOrchestratorModel
            ? {
                modelId: visualOrchestratorModel.modelId,
                providerId: visualOrchestratorModel.providerId || null,
                label: visualOrchestratorModel.displayLabel,
              }
            : null,
        });
        const plannedGeneration = await planVisualGenerationWithModel({
          prompt: sourceElement.genPrompt,
          manualReferenceImages,
          referenceImages,
          requestedReferenceRoleMode: sourceElement.genReferenceRoleMode,
          imageQuality,
          translatePromptToEnglish,
          enforceChineseTextInImage,
          requiredChineseCopy,
          disableTransportRetries: Boolean(sourceElement.genInfiniteRetry),
          consistencyContext: getDesignConsistencyContext(),
        }, visualOrchestratorModel
          ? {
              modelId: visualOrchestratorModel.modelId,
              providerId: visualOrchestratorModel.providerId || null,
              label: visualOrchestratorModel.displayLabel,
            }
          : null);
        const {
          plan,
          plannerMeta,
          execution: {
            basePrompt,
            composedPrompt,
            referenceImages: plannedReferenceImages,
            referencePriority,
            referenceStrength,
            referenceRoleMode,
            promptLanguagePolicy,
            textPolicy,
            disableTransportRetries,
            consistencyContext,
          },
        } = plannedGeneration;
        console.info("[workspace.imggen] planner.success", {
          elementId,
          sourceElementId: sourceElement.id,
          elapsedMs: Date.now() - plannerStartedAt,
          planIntent: plan.intent,
          planStrategy: plan.strategyId,
          referenceRoleMode,
          plannerSource: plannerMeta?.source || "model",
          plannerNotes: plan.plannerNotes,
        });

        addMessage({
          id: `gen-start-${Date.now()}`,
          role: "model",
          text:
            imageCount > 1
              ? `已完成视觉编排，开始生成 ${imageCount} 张图。\n编排后关键词：${composedPrompt}`
              : `编排后关键词：${composedPrompt}`,
          timestamp: Date.now(),
        });

        const generationContext = {
          elementId,
          sourceElementId: sourceElement.id,
          imageCount,
          model,
          aspectRatio: currentAspectRatio,
          imageSize,
          imageQuality,
          manualReferenceCount: manualReferenceImages.length,
          referenceCount: plannedReferenceImages.length,
          referenceRoleMode,
          referencePriority: referencePriority || null,
          referenceStrength: referenceStrength ?? null,
          consistencyAnchorInjected,
          planIntent: plan.intent,
          planStrategy: plan.strategyId,
          plannerSource: plannerMeta?.source || "rule",
          composedPromptPreview:
            composedPrompt.length > 320
              ? `${composedPrompt.slice(0, 320)}...`
              : composedPrompt,
          visualOrchestratorModel: visualOrchestratorModel
            ? {
                modelId: visualOrchestratorModel.modelId,
                providerId: visualOrchestratorModel.providerId || null,
                label: visualOrchestratorModel.displayLabel,
              }
            : null,
          planReferenceRoles: plan.references.map((item) => ({
            role: item.role,
            source: item.source,
            weight: item.weight,
          })),
          planLocks: plan.locks,
          plannerNotes: plan.plannerNotes,
          manualReferenceKinds: manualReferenceImages.map((item) =>
            String(item || "").startsWith("data:") ? "data" : "url",
          ),
          finalReferenceKinds: plannedReferenceImages.map((item) =>
            String(item || "").startsWith("data:") ? "data" : "url",
          ),
        };
        console.info("[workspace.imggen] request.start", generationContext);
        if (!isTreePromptNode) {
          targetElementIds =
            imageCount > 1
              ? [
                  elementId,
                  ...createGeneratingImagesNearElement(elementId, imageCount - 1),
                ]
              : [elementId];
        }

        const plannedStatusLines = buildPlannedStatusLines({
          intent: plan.intent,
          strategyId: plan.strategyId,
          referenceRoleMode,
          plannerNotes: plan.plannerNotes || [],
        });
        if (imageCount <= 1) {
          setElementsGenerationStatus(targetElementIds, {
            phase: "planned",
            title: "视觉编排已完成",
            lines: plannedStatusLines,
          });
        } else {
          targetElementIds.slice(1).forEach((queuedElementId, queuedIndex) => {
            const variantOrder = queuedIndex + 2;
            setElementsGenerationStatus([queuedElementId], {
              phase: "queued",
              title: `等待第 ${variantOrder}/${imageCount} 张开始`,
              lines: buildQueuedStatusLines({
                variantLabel: `${variantOrder}/${imageCount}`,
                waitingForLabel: `1/${imageCount}`,
                planLines: plannedStatusLines,
              }),
            });
          });
        }

        const buildVariantPrompt = (index: number, fixPrompt?: string) => {
          const basePrompt = fixPrompt
            ? `${basePromptSource}\n\nConsistency fix: ${fixPrompt}`
            : basePromptSource;
          if (index === 0 || imageCount <= 1) {
            return basePrompt;
          }
          return `${basePrompt}\n\nVariation ${index + 1}/${imageCount}: keep the same subject and core prompt intent, but use a clearly different composition and framing.`;
        };
        const basePromptSource = composedPrompt;

        const runGeneration = (index: number, fixPrompt?: string) =>
          imageGenSkill({
            prompt: buildVariantPrompt(index, fixPrompt),
            model,
            providerId: sourceElement.genProviderId,
            aspectRatio: currentAspectRatio,
            imageSize,
            imageQuality,
            disableTransportRetries,
            referenceImages: plannedReferenceImages,
            referencePriority,
            referenceStrength,
            referenceRoleMode,
            promptLanguagePolicy,
            textPolicy,
            consistencyContext,
          });

        let successCount = 0;
        const failedResults: string[] = [];

        for (let index = 0; index < imageCount; index += 1) {
          const variantLabel = `${index + 1}/${imageCount}`;
          const targetElementId = targetElementIds[index] || elementId;
          let attempt = 0;
          let enteredInfiniteRetry = false;

          while (true) {
            attempt += 1;
            const variantStartedAt = Date.now();
            targetElementIds.slice(index + 1).forEach((queuedElementId, queuedOffset) => {
              const queuedOrder = index + queuedOffset + 2;
              setElementsGenerationStatus([queuedElementId], {
                phase: "queued",
                title: `等待第 ${queuedOrder}/${imageCount} 张开始`,
                lines: buildQueuedStatusLines({
                  variantLabel: `${queuedOrder}/${imageCount}`,
                  waitingForLabel: variantLabel,
                  planLines: plannedStatusLines,
                }),
              });
            });
            setElementsGenerationStatus([targetElementId], {
              phase: enteredInfiniteRetry ? "retrying" : "generating",
              title:
                enteredInfiniteRetry
                  ? `正在重试第 ${variantLabel} 张`
                  : imageCount > 1
                    ? `正在生成第 ${variantLabel} 张`
                    : "正在请求生图接口",
              lines: buildGeneratingStatusLines({
                imageCount,
                variantLabel,
                model,
                aspectRatio: currentAspectRatio,
                imageSize,
                imageQuality,
                referenceCount: plannedReferenceImages.length,
                planLines: plannedStatusLines,
              }),
            });
            console.info("[workspace.imggen] variant.start", {
              ...generationContext,
              variant: variantLabel,
              attempt,
              targetElementId,
            });

            if (attempt === 1 && imageCount > 1) {
              addMessage({
                id: `gen-progress-${Date.now()}-${index}`,
                role: "model",
                text: `Generating image ${variantLabel}...`,
                timestamp: Date.now(),
              });
            }

            try {
              const resultUrl = await runGeneration(index);
              if (!resultUrl) {
                throw new Error("No result returned");
              }

              const consistencyAnchor =
                plannedReferenceImages.length > 0
                  ? plannedReferenceImages[0]
                  : undefined;
              const finalUrl =
                index === 0
                  ? await retryWithConsistencyFix(
                      `Canvas image result ${variantLabel}`,
                      resultUrl,
                      (fixPrompt?: string) => runGeneration(index, fixPrompt),
                      consistencyAnchor,
                      basePromptSource,
                      plannedReferenceImages.length,
                    )
                  : resultUrl;

              await applyGeneratedImageToElement(targetElementId, finalUrl, true);
              successCount += 1;
              console.info("[workspace.imggen] variant.success", {
                ...generationContext,
                variant: variantLabel,
                attempt,
                elapsedMs: Date.now() - variantStartedAt,
                targetElementId,
              });
              break;
            } catch (error) {
              const reason = formatGenerationError(error);
              const liveTarget = elementsRef.current.find(
                (element) => element.id === targetElementId,
              );
              const liveSource = elementsRef.current.find(
                (element) => element.id === sourceElement.id,
              );
              const shouldInfiniteRetry =
                Boolean(liveSource?.genInfiniteRetry) &&
                Boolean(liveTarget);

              if (shouldInfiniteRetry) {
                if (!enteredInfiniteRetry) {
                  enteredInfiniteRetry = true;
                  addMessage({
                    id: `gen-autoretry-${Date.now()}-${targetElementId}`,
                    role: "model",
                    text:
                      imageCount > 1
                        ? `Image ${variantLabel} failed once and will now start berserk polling retries on the same node until it succeeds or the page is refreshed.`
                        : "Image generation failed once and will now start berserk polling retries on the same node until it succeeds or the page is refreshed.",
                    timestamp: Date.now(),
                  });
                }

                setElementGeneratingState(targetElementId, true);
                setElementsGenerationStatus([targetElementId], {
                  phase: "retrying",
                  title: imageCount > 1 ? `正在重试第 ${variantLabel} 张` : "正在重试当前节点",
                  lines: [
                    imageCount > 1 ? `当前批次：${variantLabel}` : "当前节点正在立即重试",
                    `失败原因：${reason}`,
                    "不会新建图片节点",
                    "会一直在当前失败节点轮询重试，直到成功或刷新页面",
                  ],
                });
                console.warn("[workspace.imggen] variant.berserk-retrying", {
                  ...generationContext,
                  variant: variantLabel,
                  attempt,
                  retryDelayMs: 0,
                  disableTransportRetries: true,
                  error: reason,
                  targetElementId,
                });
                await Promise.resolve();
                continue;
              }

              failedResults.push(`Image ${index + 1}: ${reason}`);
              setElementsGenerationStatus([targetElementId], null);
              setElementGeneratingState(targetElementId, false, reason);
              console.error("[workspace.imggen] variant.failed", {
                ...generationContext,
                variant: variantLabel,
                attempt,
                elapsedMs: Date.now() - variantStartedAt,
                error: reason,
                targetElementId,
              });
              break;
            }
          }
        }

        if (successCount === 0) {
          if (shouldTrackSourceElementState) {
            setElementGeneratingState(elementId, false);
          }
          addMessage({
            id: Date.now().toString(),
            role: "model",
            text:
              failedResults.length > 0
                ? `Image generation failed for all ${imageCount} images. ${failedResults[0]}`
                : "Image generation returned no result. Please try again.",
            timestamp: Date.now(),
          });
          return;
        }

        if (shouldTrackSourceElementState) {
          setElementGeneratingState(elementId, false);
        }

        console.info("[workspace.imggen] request.complete", {
          ...generationContext,
          successCount,
          failedCount: failedResults.length,
          elapsedMs: Date.now() - requestStartedAt,
        });

        if (imageCount > 1 || failedResults.length > 0) {
          addMessage({
            id: `gen-summary-${Date.now()}`,
            role: "model",
            text:
              failedResults.length > 0
                ? `Generated ${successCount}/${imageCount} images. ${failedResults.length} failed.`
                : `Generated ${successCount}/${imageCount} images successfully.`,
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        const reason = formatGenerationError(error);
        if (plannerStartedAt > 0) {
          console.error("[workspace.imggen] planner.failed", {
            elementId,
            elapsedMs: Date.now() - plannerStartedAt,
            error: reason,
          });
        }
        console.error("[workspace.imggen] request.failed", {
          elementId,
          elapsedMs: Date.now() - requestStartedAt,
          error: reason,
        });
        if (targetElementIds.length > 0) {
          setElementsGenerationStatus(targetElementIds, null);
          targetElementIds.forEach((targetElementId) => {
            setElementGeneratingState(targetElementId, false, reason);
          });
        }
        if (shouldTrackSourceElementState) {
          setElementGeneratingState(elementId, false);
        }
        addMessage({
          id: Date.now().toString(),
          role: "model",
          text: `Image generation failed: ${reason}`,
          timestamp: Date.now(),
        });
      } finally {
        activeRequestsRef.current.delete(requestKey);
      }
    },
    [
      activeRequestsRef,
      addMessage,
      applyGeneratedImageToElement,
      elementsRef,
      enforceChineseTextInImage,
      getDesignConsistencyContext,
      getClosestAspectRatio,
      mergeConsistencyAnchorIntoReferences,
      nodeInteractionMode,
      requiredChineseCopy,
      retryWithConsistencyFix,
      createGeneratingImagesNearElement,
      createGeneratingTreeImageChildren,
      setElementsGenerationStatus,
      setElementGeneratingState,
      translatePromptToEnglish,
    ],
  );
}
