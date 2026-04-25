import { useCallback, type MutableRefObject } from "react";
import type {
  CanvasElement,
  ChatMessage,
  WorkspaceNodeInteractionMode,
} from "../../../types";
import { imageGenSkill } from "../../../services/skills/image-gen.skill";
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

type UseWorkspaceElementImageGenerationOptions = {
  elementsRef: MutableRefObject<CanvasElement[]>;
  nodeInteractionMode: WorkspaceNodeInteractionMode;
  showAssistant: boolean;
  setShowAssistant: (show: boolean) => void;
  setElementGeneratingState: (
    elementId: string,
    isGenerating: boolean,
    errorMessage?: string,
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
    showAssistant,
    setShowAssistant,
    setElementGeneratingState,
    addMessage,
    translatePromptToEnglish,
    enforceChineseTextInImage,
    requiredChineseCopy,
    mergeConsistencyAnchorIntoReferences,
    retryWithConsistencyFix,
    applyGeneratedImageToElement,
    createGeneratingImagesNearElement,
    createGeneratingTreeImageChildren,
    getClosestAspectRatio,
  } = options;

  return useCallback(
    async (elementId: string) => {
      const requestStartedAt = Date.now();
      const el = elementsRef.current.find((element) => element.id === elementId);
      if (!el || !el.genPrompt) return;
      const isTreePromptNode =
        resolveWorkspaceTreeNodeKind(el, nodeInteractionMode) === "prompt";
      setElementGeneratingState(elementId, true);

      if (!showAssistant) {
        setShowAssistant(true);
      }

      const currentAspectRatio =
        el.genAspectRatio || getClosestAspectRatio(el.width, el.height);
      const model = el.genModel || "Nano Banana Pro";
      const imageSize = el.genResolution || "1K";
      const imageCount = Math.max(1, Math.min(4, el.genImageCount || 1));
      const referenceImages = mergeConsistencyAnchorIntoReferences(
        el.genRefImages || (el.genRefImage ? [el.genRefImage] : []),
      );

      addMessage({
        id: `gen-start-${Date.now()}`,
        role: "model",
        text:
          imageCount > 1
            ? `Created ${imageCount} generation nodes. Starting image 1/${imageCount}...`
            : `Generating image: ${el.genPrompt.slice(0, 40)}${el.genPrompt.length > 40 ? "..." : ""}`,
        timestamp: Date.now(),
      });

      try {
        const generationContext = {
          elementId,
          imageCount,
          model,
          aspectRatio: currentAspectRatio,
          imageSize,
          referenceCount: referenceImages.length,
        };
        console.info("[workspace.imggen] request.start", generationContext);
        const targetElementIds = isTreePromptNode
          ? createGeneratingTreeImageChildren(elementId, imageCount)
          : imageCount > 1
            ? [
                elementId,
                ...createGeneratingImagesNearElement(elementId, imageCount - 1),
              ]
            : [elementId];

        if (isTreePromptNode && targetElementIds.length === 0) {
          throw new Error("Failed to create tree image placeholders");
        }

        const buildVariantPrompt = (index: number, fixPrompt?: string) => {
          const basePrompt = fixPrompt
            ? `${el.genPrompt}\n\nConsistency fix: ${fixPrompt}`
            : el.genPrompt!;
          if (index === 0 || imageCount <= 1) {
            return basePrompt;
          }
          return `${basePrompt}\n\nVariation ${index + 1}/${imageCount}: keep the same subject and core prompt intent, but use a clearly different composition and framing.`;
        };

        const runGeneration = (index: number, fixPrompt?: string) =>
          imageGenSkill({
            prompt: buildVariantPrompt(index, fixPrompt),
            model,
            providerId: el.genProviderId,
            aspectRatio: currentAspectRatio,
            imageSize,
            referenceImages,
            referencePriority: referenceImages.length > 0 ? "first" : undefined,
            promptLanguagePolicy: translatePromptToEnglish
              ? "translate-en"
              : "original-zh",
            textPolicy: {
              enforceChinese: enforceChineseTextInImage,
              requiredCopy: (requiredChineseCopy || "").trim() || undefined,
            },
          });

        let successCount = 0;
        const failedResults: string[] = [];

        for (let index = 0; index < imageCount; index += 1) {
          const variantStartedAt = Date.now();
          const variantLabel = `${index + 1}/${imageCount}`;
          const targetElementId = targetElementIds[index] || elementId;
          console.info("[workspace.imggen] variant.start", {
            ...generationContext,
            variant: variantLabel,
            targetElementId,
          });

          if (imageCount > 1) {
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
              failedResults.push(`Image ${index + 1}: no result returned`);
              setElementGeneratingState(
                targetElementId,
                false,
                "No result returned",
              );
              console.warn("[workspace.imggen] variant.empty", {
                ...generationContext,
                variant: variantLabel,
                elapsedMs: Date.now() - variantStartedAt,
                targetElementId,
              });
              continue;
            }

            const consistencyAnchor =
              referenceImages.length > 0 ? referenceImages[0] : undefined;
            const finalUrl =
              index === 0
                ? await retryWithConsistencyFix(
                    `Canvas image result ${variantLabel}`,
                    resultUrl,
                    (fixPrompt?: string) => runGeneration(index, fixPrompt),
                    consistencyAnchor,
                    el.genPrompt,
                    referenceImages.length,
                  )
                : resultUrl;

            await applyGeneratedImageToElement(targetElementId, finalUrl, true);
            successCount += 1;
            console.info("[workspace.imggen] variant.success", {
              ...generationContext,
              variant: variantLabel,
              elapsedMs: Date.now() - variantStartedAt,
              targetElementId,
            });
          } catch (error) {
            const reason = formatGenerationError(error);
            failedResults.push(`Image ${index + 1}: ${reason}`);
            setElementGeneratingState(targetElementId, false, reason);
            console.error("[workspace.imggen] variant.failed", {
              ...generationContext,
              variant: variantLabel,
              elapsedMs: Date.now() - variantStartedAt,
              error: reason,
              targetElementId,
            });
          }
        }

        if (successCount === 0) {
          setElementGeneratingState(elementId, false);
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

        setElementGeneratingState(elementId, false);

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
        console.error("[workspace.imggen] request.failed", {
          elementId,
          elapsedMs: Date.now() - requestStartedAt,
          error: reason,
        });
        setElementGeneratingState(elementId, false);
        addMessage({
          id: Date.now().toString(),
          role: "model",
          text: `Image generation failed: ${reason}`,
          timestamp: Date.now(),
        });
      }
    },
    [
      addMessage,
      applyGeneratedImageToElement,
      elementsRef,
      enforceChineseTextInImage,
      getClosestAspectRatio,
      mergeConsistencyAnchorIntoReferences,
      nodeInteractionMode,
      requiredChineseCopy,
      retryWithConsistencyFix,
      createGeneratingImagesNearElement,
      createGeneratingTreeImageChildren,
      setElementGeneratingState,
      setShowAssistant,
      showAssistant,
      translatePromptToEnglish,
    ],
  );
}
