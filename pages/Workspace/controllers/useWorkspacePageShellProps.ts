import React from "react";
import type { CanvasElement, WorkspaceNodeInteractionMode } from "../../../types";
import { AssistantSidebar } from "../components";
import { ToolbarBottom } from "../components/ToolbarBottom";
import { WorkspaceCanvasElementsLayer } from "../components/WorkspaceCanvasElementsLayer";
import { WorkspaceCanvasOverlayLayer } from "../components/WorkspaceCanvasOverlayLayer";
import { WorkspaceCanvasStage } from "../components/WorkspaceCanvasStage";
import { WorkspaceContextMenu } from "../components/WorkspaceContextMenu";
import { WorkspaceFeatureNotice } from "../components/WorkspaceFeatureNotice";
import { WorkspaceLeftPanel } from "../components/WorkspaceLeftPanel";
import { WorkspaceModeSwitchDialog } from "../components/WorkspaceModeSwitchDialog";
import { WorkspacePageOverlays } from "../components/WorkspacePageOverlays";
import { WorkspacePreviewModal } from "../components/WorkspacePreviewModal";
import { WorkspaceSidebarLayer } from "../components/WorkspaceSidebarLayer";
import { WorkspaceTopToolbar } from "../components/WorkspaceTopToolbar";
import { WorkspaceTouchEditIndicator } from "../components/WorkspaceTouchEditIndicator";
import { WorkspaceTouchEditPopup } from "../components/WorkspaceTouchEditPopup";

type Point = {
  x: number;
  y: number;
};

type UseWorkspacePageShellPropsArgs = {
  workspaceLeftPanelProps: React.ComponentProps<typeof WorkspaceLeftPanel>;
  assistantSidebarProps: React.ComponentProps<typeof AssistantSidebar>;
  workspaceCanvasElementsLayerProps: React.ComponentProps<
    typeof WorkspaceCanvasElementsLayer
  >;
  workspaceCanvasOverlayLayerProps: React.ComponentProps<
    typeof WorkspaceCanvasOverlayLayer
  >;
  showAssistant: boolean;
  setShowAssistant: React.Dispatch<React.SetStateAction<boolean>>;
  isCtrlPressed: boolean;
  projectTitle: string;
  setProjectTitle: React.Dispatch<React.SetStateAction<string>>;
  nodeInteractionMode: WorkspaceNodeInteractionMode;
  setNodeInteractionMode: React.Dispatch<React.SetStateAction<WorkspaceNodeInteractionMode>>;
  navigateToDashboard: () => void;
  leftPanelMode: React.ComponentProps<typeof ToolbarBottom>["leftPanelMode"];
  setLeftPanelMode: React.ComponentProps<typeof ToolbarBottom>["setLeftPanelMode"];
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasLayerRef: React.RefObject<HTMLDivElement | null>;
  marqueeBoxRef: React.RefObject<HTMLDivElement | null>;
  cutterTrailGlowRef: React.RefObject<SVGPathElement | null>;
  cutterTrailPathRef: React.RefObject<SVGPathElement | null>;
  cutterTrailTipRef: React.RefObject<SVGCircleElement | null>;
  creationMode: string;
  isPickingFromCanvas: boolean;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  isPanning: boolean;
  handleContextMenu: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseUp: () => void;
  handleCanvasDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  handleFileUpload: React.ComponentProps<typeof WorkspaceTopToolbar>["handleFileUpload"];
  showFeatureComingSoon: React.ComponentProps<
    typeof WorkspaceTopToolbar
  >["showFeatureComingSoon"];
  addShape: React.ComponentProps<typeof WorkspaceTopToolbar>["addShape"];
  addGenImage: React.ComponentProps<typeof WorkspaceTopToolbar>["addGenImage"];
  addGenVideo: React.ComponentProps<typeof WorkspaceTopToolbar>["addGenVideo"];
  consistencyCheckEnabled: boolean;
  currentConsistencyAnchorUrl: string | null;
  handleToggleConsistencyCheck: (enabled: boolean) => void;
  handleUploadConsistencyAnchor: (
    file: File,
  ) => void | Promise<void>;
  handleClearConsistencyAnchor: () => void | Promise<void>;
  handlePreviewConsistencyAnchor: (anchorUrl: string) => void;
  isMarqueeSelecting: boolean;
  marqueeStart: Point;
  marqueeEnd: Point;
  pan: Point;
  contextMenu: React.ComponentProps<typeof WorkspaceContextMenu>["contextMenu"];
  selectedElement: CanvasElement | null;
  handleManualPaste: React.ComponentProps<
    typeof WorkspaceContextMenu
  >["onManualPaste"];
  handleDownload: React.ComponentProps<typeof WorkspaceContextMenu>["onDownload"];
  fitToScreen: React.ComponentProps<typeof WorkspaceContextMenu>["onFitToScreen"];
  setContextMenu: React.Dispatch<
    React.SetStateAction<
      React.ComponentProps<typeof WorkspaceContextMenu>["contextMenu"]
    >
  >;
  previewUrl: React.ComponentProps<typeof WorkspacePreviewModal>["previewUrl"];
  setPreviewUrl: React.Dispatch<React.SetStateAction<string | null>>;
  modeSwitchDialog: React.ComponentProps<typeof WorkspaceModeSwitchDialog>;
  featureNotice: React.ComponentProps<typeof WorkspaceFeatureNotice>["featureNotice"];
  touchEditMode: React.ComponentProps<
    typeof WorkspaceTouchEditIndicator
  >["touchEditMode"];
  setTouchEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  touchEditPopup: React.ComponentProps<typeof WorkspaceTouchEditPopup>["popup"];
  touchEditInstruction: React.ComponentProps<
    typeof WorkspaceTouchEditPopup
  >["instruction"];
  isTouchEditing: React.ComponentProps<
    typeof WorkspaceTouchEditPopup
  >["isTouchEditing"];
  setTouchEditPopup: React.Dispatch<
    React.SetStateAction<React.ComponentProps<typeof WorkspaceTouchEditPopup>["popup"]>
  >;
  setTouchEditInstruction: React.ComponentProps<
    typeof WorkspaceTouchEditPopup
  >["onInstructionChange"];
  handleTouchEditExecute: React.ComponentProps<
    typeof WorkspaceTouchEditPopup
  >["onExecute"];
};

export const useWorkspacePageShellProps = ({
  workspaceLeftPanelProps,
  assistantSidebarProps,
  workspaceCanvasElementsLayerProps,
  workspaceCanvasOverlayLayerProps,
  showAssistant,
  setShowAssistant,
  isCtrlPressed,
  projectTitle,
  setProjectTitle,
  nodeInteractionMode,
  setNodeInteractionMode,
  navigateToDashboard,
  leftPanelMode,
  setLeftPanelMode,
  zoom,
  setZoom,
  containerRef,
  canvasLayerRef,
  marqueeBoxRef,
  cutterTrailGlowRef,
  cutterTrailPathRef,
  cutterTrailTipRef,
  creationMode,
  isPickingFromCanvas,
  activeTool,
  setActiveTool,
  isPanning,
  handleContextMenu,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleCanvasDrop,
  handleFileUpload,
  showFeatureComingSoon,
  addShape,
  addGenImage,
  addGenVideo,
  consistencyCheckEnabled,
  currentConsistencyAnchorUrl,
  handleToggleConsistencyCheck,
  handleUploadConsistencyAnchor,
  handleClearConsistencyAnchor,
  handlePreviewConsistencyAnchor,
  isMarqueeSelecting,
  marqueeStart,
  marqueeEnd,
  pan,
  contextMenu,
  selectedElement,
  handleManualPaste,
  handleDownload,
  fitToScreen,
  setContextMenu,
  previewUrl,
  setPreviewUrl,
  modeSwitchDialog,
  featureNotice,
  touchEditMode,
  setTouchEditMode,
  touchEditPopup,
  touchEditInstruction,
  isTouchEditing,
  setTouchEditPopup,
  setTouchEditInstruction,
  handleTouchEditExecute,
}: UseWorkspacePageShellPropsArgs) => {
  const handleOpenAssistant = React.useCallback(
    () => setShowAssistant(true),
    [setShowAssistant],
  );

  const handleZoomIn = React.useCallback(() => {
    setZoom((prev) => Math.min(prev + 10, 500));
  }, [setZoom]);

  const handleZoomOut = React.useCallback(() => {
    setZoom((prev) => Math.max(prev - 10, 10));
  }, [setZoom]);

  const handleResetZoom = React.useCallback(() => {
    setZoom(100);
  }, [setZoom]);

  const handleCloseContextMenu = React.useCallback(
    () => setContextMenu(null),
    [setContextMenu],
  );

  const handlePreviewClose = React.useCallback(
    () => setPreviewUrl(null),
    [setPreviewUrl],
  );

  const handleTouchEditIndicatorClose = React.useCallback(
    () => setTouchEditMode(false),
    [setTouchEditMode],
  );

  const handleTouchEditPopupClose = React.useCallback(() => {
    setTouchEditPopup(null);
    setTouchEditInstruction("");
  }, [setTouchEditInstruction, setTouchEditPopup]);

  const workspaceSidebarLayerProps = React.useMemo<
    React.ComponentProps<typeof WorkspaceSidebarLayer>
  >(
    () => ({
      leftPanel: workspaceLeftPanelProps,
      assistant: assistantSidebarProps,
      showAssistant,
    }),
    [assistantSidebarProps, showAssistant, workspaceLeftPanelProps],
  );

  const workspaceCanvasStageProps = React.useMemo<
    React.ComponentProps<typeof WorkspaceCanvasStage>
  >(
    () => ({
      isCtrlPressed,
      headerBar: {
        showAssistant,
        projectTitle,
        setProjectTitle,
        nodeInteractionMode,
        setNodeInteractionMode,
        onOpenDashboard: navigateToDashboard,
        onShowAssistant: handleOpenAssistant,
      },
      bottomToolbar: {
        leftPanelMode,
        setLeftPanelMode,
        zoom,
        setZoom,
      },
      containerRef,
      canvasLayerRef,
      marqueeBoxRef,
      cutterTrailGlowRef,
      cutterTrailPathRef,
      cutterTrailTipRef,
      creationMode,
      isPickingFromCanvas,
      activeTool,
      isPanning,
      onContextMenu: handleContextMenu,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onCanvasDrop: handleCanvasDrop,
      topToolbar: {
        activeTool,
        showAssistant,
        setActiveTool,
        handleFileUpload,
        showFeatureComingSoon,
        addShape,
        addGenImage,
        addGenVideo,
        consistencyCheckEnabled,
        currentConsistencyAnchorUrl,
        onToggleConsistencyCheck: handleToggleConsistencyCheck,
        onUploadConsistencyAnchor: handleUploadConsistencyAnchor,
        onClearConsistencyAnchor: handleClearConsistencyAnchor,
        onPreviewConsistencyAnchor: handlePreviewConsistencyAnchor,
      },
      isMarqueeSelecting,
      marqueeStart,
      marqueeEnd,
      pan,
      zoom,
      canvasElementsLayer: workspaceCanvasElementsLayerProps,
      canvasOverlayLayer: workspaceCanvasOverlayLayerProps,
    }),
    [
      activeTool,
      addGenImage,
      addGenVideo,
      addShape,
      canvasLayerRef,
      consistencyCheckEnabled,
      containerRef,
      cutterTrailGlowRef,
      cutterTrailPathRef,
      cutterTrailTipRef,
      creationMode,
      currentConsistencyAnchorUrl,
      handleCanvasDrop,
      handleClearConsistencyAnchor,
      handleContextMenu,
      handleFileUpload,
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleOpenAssistant,
      handlePreviewConsistencyAnchor,
      handleToggleConsistencyCheck,
      handleUploadConsistencyAnchor,
      isCtrlPressed,
      isMarqueeSelecting,
      isPanning,
      isPickingFromCanvas,
      leftPanelMode,
      marqueeBoxRef,
      marqueeEnd,
      marqueeStart,
      navigateToDashboard,
      nodeInteractionMode,
      pan,
      projectTitle,
      setActiveTool,
      setLeftPanelMode,
      setNodeInteractionMode,
      setProjectTitle,
      showAssistant,
      showFeatureComingSoon,
      workspaceCanvasElementsLayerProps,
      workspaceCanvasOverlayLayerProps,
      zoom,
      setZoom,
    ],
  );

  const workspacePageOverlaysProps = React.useMemo<
    React.ComponentProps<typeof WorkspacePageOverlays>
  >(
    () => ({
      contextMenu: {
        contextMenu,
        canDownloadImage: Boolean(
          selectedElement &&
            selectedElement.url &&
            (selectedElement.type === "image" ||
              selectedElement.type === "gen-image"),
        ),
        onClose: handleCloseContextMenu,
        onManualPaste: handleManualPaste,
        onDownload: handleDownload,
        onZoomIn: handleZoomIn,
        onZoomOut: handleZoomOut,
        onFitToScreen: fitToScreen,
        onResetZoom: handleResetZoom,
      },
      previewModal: {
        previewUrl,
        onClose: handlePreviewClose,
      },
      modeSwitchDialog,
      featureNotice: {
        featureNotice,
      },
      touchEditIndicator: {
        touchEditMode,
        onClose: handleTouchEditIndicatorClose,
      },
      touchEditPopup: {
        popup: touchEditPopup,
        instruction: touchEditInstruction,
        isTouchEditing,
        onClose: handleTouchEditPopupClose,
        onInstructionChange: setTouchEditInstruction,
        onExecute: handleTouchEditExecute,
      },
    }),
    [
      contextMenu,
      featureNotice,
      fitToScreen,
      handleCloseContextMenu,
      handleDownload,
      handleManualPaste,
      handlePreviewClose,
      handleResetZoom,
      handleTouchEditExecute,
      handleTouchEditIndicatorClose,
      handleTouchEditPopupClose,
      handleZoomIn,
      handleZoomOut,
      isTouchEditing,
      modeSwitchDialog,
      previewUrl,
      selectedElement,
      setTouchEditInstruction,
      touchEditInstruction,
      touchEditMode,
      touchEditPopup,
    ],
  );

  return {
    workspaceSidebarLayerProps,
    workspaceCanvasStageProps,
    workspacePageOverlaysProps,
  };
};
