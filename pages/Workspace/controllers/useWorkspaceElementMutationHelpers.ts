import { useCallback, type MutableRefObject } from "react";
import type {
  CanvasElement,
  Marker,
  WorkspaceNodeInteractionMode,
} from "../../../types";
import { useProjectStore } from "../../../stores/project.store";
import {
  mergeUniqueStrings,
  rememberApprovedAsset,
  summarizeReferenceSet,
} from "../../../services/topic-memory";
import {
  DEFAULT_PROXY_MAX_DIM,
  getCanvasViewportSize,
  makeImageProxyFromUrl,
} from "../workspaceShared";
import {
  reflowGenerationRowForParent,
  resolveNodeGraphPlacement,
} from "../workspaceNodeGraph";
import {
  getWorkspaceImageNodeHeight,
  WORKSPACE_IMAGE_NODE_WIDTH,
  resolveWorkspaceTreeNodeKind,
} from "../workspaceTreeNode";

type UseWorkspaceElementMutationHelpersOptions = {
  showAssistant: boolean;
  nodeInteractionMode: WorkspaceNodeInteractionMode;
  elementsRef: MutableRefObject<CanvasElement[]>;
  markersRef: MutableRefObject<Marker[]>;
  setElementsSynced: (nextElements: CanvasElement[]) => void;
  saveToHistory: (newElements: CanvasElement[], newMarkers: Marker[]) => void;
  getCurrentTopicId: () => string;
  updateDesignSession: (payload: {
    approvedAssetIds?: string[];
    subjectAnchors?: string[];
    subjectAnchorMode?: "auto" | "manual";
    referenceSummary?: string;
  }) => void;
};

const GENERATED_IMAGE_GAP = 16;

const parseAspectRatioDimensions = (
  aspectRatio: string | null | undefined,
): { width: number; height: number } | null => {
  const raw = String(aspectRatio || "").trim();
  if (!raw.includes(":")) return null;
  const [widthText, heightText] = raw.split(":");
  const width = Number(widthText);
  const height = Number(heightText);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }
  return { width, height };
};

type CreateGeneratingTreeImageChildrenOptions = {
  baseElementsOverride?: CanvasElement[];
  sourceElementOverride?: CanvasElement | null;
};

const shouldAutoPromoteGeneratedResultToAnchor = (session: {
  subjectAnchorMode?: "auto" | "manual";
  subjectAnchors?: string[];
}) =>
  session.subjectAnchorMode === "auto" ||
  (!session.subjectAnchorMode && (session.subjectAnchors || []).length === 0);

export function useWorkspaceElementMutationHelpers(
  options: UseWorkspaceElementMutationHelpersOptions,
) {
  const {
    showAssistant,
    nodeInteractionMode,
    elementsRef,
    markersRef,
    setElementsSynced,
    saveToHistory,
    getCurrentTopicId,
    updateDesignSession,
  } = options;

  const urlToBase64 = useCallback(async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Conversion failed", error);
      return url;
    }
  }, []);

  const applyGeneratedImageToElement = useCallback(
    async (
      elementId: string,
      resultUrl: string,
      keepCurrentSize: boolean = true,
    ) => {
      const normalizedResultUrl = String(resultUrl || "").trim();
      if (!normalizedResultUrl) {
        throw new Error("generated image url is empty");
      }

      const viewport = getCanvasViewportSize(showAssistant);
      const {
        originalUrl,
        displayUrl,
        originalWidth,
        originalHeight,
        displayWidth,
        displayHeight,
      } = await makeImageProxyFromUrl(
        normalizedResultUrl,
        DEFAULT_PROXY_MAX_DIM,
        viewport,
      );
      const resolvedOriginalUrl = String(
        originalUrl || normalizedResultUrl,
      ).trim();
      const resolvedDisplayUrl = String(
        displayUrl || resolvedOriginalUrl,
      ).trim();

      const baseElements = elementsRef.current;
      let changed = false;
      const nextElements = baseElements.map((element) => {
        if (element.id !== elementId) return element;
        changed = true;
        return {
          ...element,
          isGenerating: false,
          generatingType: undefined,
          genError: undefined,
          url: resolvedDisplayUrl,
          originalUrl: resolvedOriginalUrl,
          proxyUrl:
            resolvedDisplayUrl !== resolvedOriginalUrl
              ? resolvedDisplayUrl
              : undefined,
          width:
            element.type === "image" || element.type === "gen-image"
              ? WORKSPACE_IMAGE_NODE_WIDTH
              : keepCurrentSize
                ? element.width
                : displayWidth,
          height:
            element.type === "image" || element.type === "gen-image"
              ? getWorkspaceImageNodeHeight(originalWidth, originalHeight)
              : keepCurrentSize
                ? element.height
                : displayHeight,
          genAspectRatio: `${originalWidth}:${originalHeight}`,
        };
      });

      if (!changed) {
        throw new Error(`target image node not found: ${elementId}`);
      }

      setElementsSynced(nextElements);
      saveToHistory(nextElements, markersRef.current);

      const updatedElement = nextElements.find((element) => element.id === elementId);
      if (!updatedElement?.url) {
        throw new Error(
          `generated image did not persist to canvas node: ${elementId}`,
        );
      }
      const projectState = useProjectStore.getState().designSession;
      const topicId = getCurrentTopicId();
      const shouldAutoPromoteAnchor =
        shouldAutoPromoteGeneratedResultToAnchor(projectState);
      const decisionText = updatedElement?.genPrompt
        ? shouldAutoPromoteAnchor
          ? `Adopted generated result as the next design anchor: ${updatedElement.genPrompt}`
          : `Saved generated result without replacing the current manual anchor: ${updatedElement.genPrompt}`
        : shouldAutoPromoteAnchor
          ? `Adopted asset ${elementId} as the next design anchor`
          : `Saved generated asset ${elementId} without replacing the current manual anchor`;
      const approvedIds = mergeUniqueStrings(
        projectState.approvedAssetIds || [],
        [elementId],
        12,
      );

      updateDesignSession(
        shouldAutoPromoteAnchor
          ? {
              approvedAssetIds: approvedIds,
              subjectAnchorMode: "auto",
              subjectAnchors: mergeUniqueStrings(
                projectState.subjectAnchors || [],
                [resolvedOriginalUrl],
                8,
              ),
              referenceSummary: summarizeReferenceSet([resolvedOriginalUrl]),
            }
          : {
              approvedAssetIds: approvedIds,
            },
      );

      if (topicId) {
        await rememberApprovedAsset(topicId, {
          url: resolvedOriginalUrl,
          role: "result",
          summary: summarizeReferenceSet([resolvedOriginalUrl]),
          decision: decisionText,
        });
      }
    },
    [
      elementsRef,
      getCurrentTopicId,
      markersRef,
      saveToHistory,
      setElementsSynced,
      showAssistant,
      updateDesignSession,
    ],
  );

  const setElementGeneratingState = useCallback(
    (
      elementId: string,
      isGenerating: boolean,
      errorMessage?: string,
    ) => {
      const baseElements = elementsRef.current;
      let changed = false;
      const nextElements = baseElements.map((element) => {
        if (element.id !== elementId) return element;
        const nextError = isGenerating
          ? undefined
          : errorMessage !== undefined
            ? errorMessage
            : element.genError;
        if (
          element.isGenerating === isGenerating &&
          element.genError === nextError
        ) {
          return element;
        }
        changed = true;
        return {
          ...element,
          isGenerating,
          genError: nextError,
        };
      });
      if (!changed) return;
      setElementsSynced(nextElements);
    },
    [elementsRef, setElementsSynced],
  );

  const appendGeneratedImagesNearElement = useCallback(
    async (sourceElementId: string, resultUrls: string[]) => {
      if (!Array.isArray(resultUrls) || resultUrls.length === 0) return;

      const sourceElement = elementsRef.current.find(
        (element) => element.id === sourceElementId,
      );
      if (!sourceElement) return;

      const viewport = getCanvasViewportSize(showAssistant);
      const proxied = await Promise.all(
        resultUrls.map((url) =>
          makeImageProxyFromUrl(url, DEFAULT_PROXY_MAX_DIM, viewport),
        ),
      );

      const baseZIndex =
        elementsRef.current.reduce(
          (max, element) => Math.max(max, element.zIndex || 0),
          0,
        ) + 1;

      const newElements: CanvasElement[] = proxied.map((asset, index) => ({
        id: `image-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
        type: "image",
        url: asset.displayUrl,
        originalUrl: asset.originalUrl,
        proxyUrl:
          asset.displayUrl !== asset.originalUrl ? asset.displayUrl : undefined,
        x:
          sourceElement.x +
          (WORKSPACE_IMAGE_NODE_WIDTH + GENERATED_IMAGE_GAP) * (index + 1),
        y: sourceElement.y,
        width: WORKSPACE_IMAGE_NODE_WIDTH,
        height: getWorkspaceImageNodeHeight(
          asset.originalWidth,
          asset.originalHeight,
        ),
        zIndex: baseZIndex + index,
        genPrompt: sourceElement.genPrompt,
        genModel: sourceElement.genModel,
        genProviderId: sourceElement.genProviderId,
        genAspectRatio: `${asset.originalWidth}:${asset.originalHeight}`,
        genResolution: sourceElement.genResolution,
        genImageCount: sourceElement.genImageCount,
        genInfiniteRetry: sourceElement.genInfiniteRetry,
        genReferenceRoleMode: sourceElement.genReferenceRoleMode,
        genRefImage: sourceElement.genRefImage,
        genRefImages: sourceElement.genRefImages,
        genRefPreviewImage: sourceElement.genRefPreviewImage,
        genRefPreviewImages: sourceElement.genRefPreviewImages,
      }));

      const nextElements = [...elementsRef.current, ...newElements];
      setElementsSynced(nextElements);
      saveToHistory(nextElements, markersRef.current);

      const projectState = useProjectStore.getState().designSession;
      const topicId = getCurrentTopicId();
      const originalUrls = newElements
        .map((element) => element.originalUrl || element.url)
        .filter((url): url is string => Boolean(url));
      const approvedIds = mergeUniqueStrings(
        projectState.approvedAssetIds || [],
        newElements.map((element) => element.id),
        12,
      );
      const shouldAutoPromoteAnchor =
        shouldAutoPromoteGeneratedResultToAnchor(projectState);

      updateDesignSession(
        shouldAutoPromoteAnchor
          ? {
              approvedAssetIds: approvedIds,
              subjectAnchorMode: "auto",
              subjectAnchors: mergeUniqueStrings(
                projectState.subjectAnchors || [],
                originalUrls,
                8,
              ),
              referenceSummary:
                originalUrls.length > 0
                  ? summarizeReferenceSet(originalUrls)
                  : projectState.referenceSummary || "",
            }
          : {
              approvedAssetIds: approvedIds,
            },
      );

      if (topicId) {
        await Promise.all(
          newElements.map(async (element) => {
            const originalUrl = element.originalUrl || element.url;
            if (!originalUrl) return;
            await rememberApprovedAsset(topicId, {
              url: originalUrl,
              role: "result",
              summary: summarizeReferenceSet([originalUrl]),
              decision: element.genPrompt
                ? shouldAutoPromoteAnchor
                  ? `Adopted generated sibling result: ${element.genPrompt}`
                  : `Saved generated sibling result without replacing the current manual anchor: ${element.genPrompt}`
                : shouldAutoPromoteAnchor
                  ? `Adopted sibling asset ${element.id} as a design anchor`
                  : `Saved sibling asset ${element.id} without replacing the current manual anchor`,
            });
          }),
        );
      }
    },
    [
      elementsRef,
      getCurrentTopicId,
      markersRef,
      saveToHistory,
      setElementsSynced,
      showAssistant,
      updateDesignSession,
    ],
  );

  const createGeneratingImagesNearElement = useCallback(
    (sourceElementId: string, additionalCount: number): string[] => {
      if (!Number.isFinite(additionalCount) || additionalCount <= 0) return [];

      const sourceElement = elementsRef.current.find(
        (element) => element.id === sourceElementId,
      );
      if (!sourceElement) return [];

      const baseZIndex =
        elementsRef.current.reduce(
          (max, element) => Math.max(max, element.zIndex || 0),
          0,
        ) + 1;
      const createdAt = Date.now();

      const placeholderElements: CanvasElement[] = Array.from(
        { length: additionalCount },
        (_, index) => {
          const sourceAspect =
            parseAspectRatioDimensions(sourceElement.genAspectRatio) || {
              width: sourceElement.width,
              height: sourceElement.height,
            };
          const normalizedHeight = getWorkspaceImageNodeHeight(
            sourceAspect.width,
            sourceAspect.height,
          );

          return {
          id: `image-pending-${createdAt}-${index}-${Math.random().toString(36).slice(2, 8)}`,
          type: "image",
          x:
            sourceElement.x +
            (WORKSPACE_IMAGE_NODE_WIDTH + GENERATED_IMAGE_GAP) * (index + 1),
          y: sourceElement.y,
          width: WORKSPACE_IMAGE_NODE_WIDTH,
          height: normalizedHeight,
          zIndex: baseZIndex + index,
          isGenerating: true,
          generatingType: "gen-image",
          genPrompt: sourceElement.genPrompt,
          genModel: sourceElement.genModel,
          genProviderId: sourceElement.genProviderId,
          genAspectRatio: sourceElement.genAspectRatio,
          genResolution: sourceElement.genResolution,
          genImageCount: sourceElement.genImageCount,
          genInfiniteRetry: sourceElement.genInfiniteRetry,
          genReferenceRoleMode: sourceElement.genReferenceRoleMode,
          genRefImage: sourceElement.genRefImage,
          genRefImages: sourceElement.genRefImages,
          genRefPreviewImage: sourceElement.genRefPreviewImage,
          genRefPreviewImages: sourceElement.genRefPreviewImages,
          };
        },
      );

      const nextElements = [...elementsRef.current, ...placeholderElements];
      setElementsSynced(nextElements);
      saveToHistory(nextElements, markersRef.current);

      return placeholderElements.map((element) => element.id);
    },
    [elementsRef, markersRef, saveToHistory, setElementsSynced],
  );

  const createGeneratingTreeImageChildren = useCallback(
    (
      sourceElementId: string,
      totalCount: number,
      options?: CreateGeneratingTreeImageChildrenOptions,
    ): string[] => {
      if (!Number.isFinite(totalCount) || totalCount <= 0) return [];

      const baseElements = options?.baseElementsOverride || elementsRef.current;
      const sourceElement =
        options?.sourceElementOverride ||
        baseElements.find((element) => element.id === sourceElementId) ||
        null;
      if (!sourceElement) return [];
      if (resolveWorkspaceTreeNodeKind(sourceElement, nodeInteractionMode) !== "prompt") {
        return [];
      }

      const baseZIndex =
        baseElements.reduce((max, element) => Math.max(max, element.zIndex || 0), 0) +
        1;
      const createdAt = Date.now();
      const nextElements = [...baseElements];
      const placeholderElements: CanvasElement[] = [];
      const treeImageAspect =
        parseAspectRatioDimensions(sourceElement.genAspectRatio) || {
          width: sourceElement.width,
          height: sourceElement.height,
        };
      const treeImageWidth = WORKSPACE_IMAGE_NODE_WIDTH;
      const treeImageHeight = getWorkspaceImageNodeHeight(
        treeImageAspect.width,
        treeImageAspect.height,
      );

      for (let index = 0; index < totalCount; index += 1) {
        const placement = resolveNodeGraphPlacement({
          elements: nextElements,
          parentElement: sourceElement,
          childWidth: treeImageWidth,
          childHeight: treeImageHeight,
          preferredLinkKind: "generation",
        });

        const placeholderElement: CanvasElement = {
          id: `tree-image-pending-${createdAt}-${index}-${Math.random().toString(36).slice(2, 8)}`,
          type: "image",
          x: placement.x,
          y: placement.y,
          width: treeImageWidth,
          height: treeImageHeight,
          zIndex: baseZIndex + index,
          isGenerating: true,
          generatingType: "gen-image",
          genPrompt: sourceElement.genPrompt,
          genModel: sourceElement.genModel,
          genProviderId: sourceElement.genProviderId,
          genAspectRatio: sourceElement.genAspectRatio,
          genResolution: sourceElement.genResolution,
          genImageCount: sourceElement.genImageCount,
          genInfiniteRetry: sourceElement.genInfiniteRetry,
          genReferenceRoleMode: sourceElement.genReferenceRoleMode,
          genRefImage: sourceElement.genRefImage,
          genRefImages: sourceElement.genRefImages,
          genRefPreviewImage: sourceElement.genRefPreviewImage,
          genRefPreviewImages: sourceElement.genRefPreviewImages,
          nodeInteractionMode: "branch",
          nodeParentId: placement.nodeParentId,
          nodeParentIds: [placement.nodeParentId],
          nodeLinkKind: placement.nodeLinkKind,
          treeNodeKind: "image",
          treeNodeTone: sourceElement.treeNodeTone,
        };

        nextElements.push(placeholderElement);
        placeholderElements.push(placeholderElement);
      }

      if (placeholderElements.length === 0) return [];

      const reflowedElements = reflowGenerationRowForParent(
        nextElements,
        sourceElement,
      );

      setElementsSynced(reflowedElements);
      saveToHistory(reflowedElements, markersRef.current);

      return placeholderElements.map((element) => element.id);
    },
    [elementsRef, markersRef, nodeInteractionMode, saveToHistory, setElementsSynced],
  );

  return {
    urlToBase64,
    applyGeneratedImageToElement,
    appendGeneratedImagesNearElement,
    createGeneratingImagesNearElement,
    createGeneratingTreeImageChildren,
    setElementGeneratingState,
  };
}
