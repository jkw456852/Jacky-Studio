import React from "react";
import { ToolbarBottom } from "./ToolbarBottom";
import { WorkspaceCanvasElementsLayer } from "./WorkspaceCanvasElementsLayer";
import { WorkspaceCanvasOverlayLayer } from "./WorkspaceCanvasOverlayLayer";
import { WorkspaceCtrlCursor } from "./WorkspaceCtrlCursor";
import { WorkspaceHeaderBar } from "./WorkspaceHeaderBar";
import { WorkspaceTopToolbar } from "./WorkspaceTopToolbar";

type Point = {
  x: number;
  y: number;
};

type WorkspaceCanvasStageProps = {
  isCtrlPressed: boolean;
  headerBar: React.ComponentProps<typeof WorkspaceHeaderBar>;
  bottomToolbar: React.ComponentProps<typeof ToolbarBottom>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasLayerRef: React.RefObject<HTMLDivElement | null>;
  marqueeBoxRef: React.RefObject<HTMLDivElement | null>;
  creationMode: string;
  isPickingFromCanvas: boolean;
  activeTool: string;
  isPanning: boolean;
  onContextMenu: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMouseUp: () => void;
  onCanvasDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  topToolbar: React.ComponentProps<typeof WorkspaceTopToolbar>;
  isMarqueeSelecting: boolean;
  marqueeStart: Point;
  marqueeEnd: Point;
  pan: Point;
  zoom: number;
  canvasElementsLayer: React.ComponentProps<typeof WorkspaceCanvasElementsLayer>;
  canvasOverlayLayer: React.ComponentProps<typeof WorkspaceCanvasOverlayLayer>;
};

export const WorkspaceCanvasStage: React.FC<WorkspaceCanvasStageProps> = ({
  isCtrlPressed,
  headerBar,
  bottomToolbar,
  containerRef,
  canvasLayerRef,
  marqueeBoxRef,
  creationMode,
  isPickingFromCanvas,
  activeTool,
  isPanning,
  onContextMenu,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onCanvasDrop,
  topToolbar,
  isMarqueeSelecting,
  pan,
  zoom,
  canvasElementsLayer,
  canvasOverlayLayer,
}) => {
  React.useEffect(() => {
    const handleGlobalPointerRelease = () => {
      onMouseUp();
    };

    window.addEventListener("mouseup", handleGlobalPointerRelease);
    window.addEventListener("pointerup", handleGlobalPointerRelease);
    window.addEventListener("blur", handleGlobalPointerRelease);

    return () => {
      window.removeEventListener("mouseup", handleGlobalPointerRelease);
      window.removeEventListener("pointerup", handleGlobalPointerRelease);
      window.removeEventListener("blur", handleGlobalPointerRelease);
    };
  }, [onMouseUp]);

  return (
    <div
      className={`flex-1 relative flex flex-col h-full overflow-hidden ${isCtrlPressed ? "cursor-none" : ""}`}
    >
      <WorkspaceCtrlCursor visible={isCtrlPressed} />
      <WorkspaceHeaderBar {...headerBar} />
      <ToolbarBottom {...bottomToolbar} />

      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative bg-[#E8E8E8] w-full h-full select-none"
        onContextMenu={onContextMenu}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDrop={onCanvasDrop}
        style={{
          cursor:
            creationMode === "image" && isPickingFromCanvas
              ? "crosshair"
              : isCtrlPressed || activeTool === "mark"
                ? "none"
                : activeTool === "hand" || isPanning
                  ? isPanning
                    ? "grabbing"
                    : "grab"
                  : "default",
          WebkitUserSelect: "none",
        }}
      >
        <WorkspaceTopToolbar {...topToolbar} />

        <div
          ref={marqueeBoxRef}
          className={`workspace-marquee-box absolute border border-blue-500/80 bg-transparent pointer-events-none z-[9999] rounded-sm shadow-[0_0_0_1px_rgba(255,255,255,0.7)] ${isMarqueeSelecting ? "block" : "hidden"}`}
          style={{
            willChange: isMarqueeSelecting ? "left, top, width, height" : "auto",
          }}
        />

        <div
          ref={canvasLayerRef}
          className="absolute top-0 left-0 w-0 h-0 overflow-visible"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom / 100})`,
            transformOrigin: "0 0",
            willChange: isPanning ? "transform" : "auto",
            pointerEvents: isMarqueeSelecting ? "none" : "auto",
            WebkitFontSmoothing: "antialiased",
            textRendering: "optimizeLegibility",
          }}
        >
          <WorkspaceCanvasElementsLayer {...canvasElementsLayer} />
          <WorkspaceCanvasOverlayLayer {...canvasOverlayLayer} />
        </div>
      </div>
    </div>
  );
};
