import React from "react";
import {
  Download,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import type { CanvasElement } from "../../../types";
import {
  WORKSPACE_NODE_OUTLINE_RADIUS,
  WORKSPACE_NODE_SELECTION_RADIUS,
  WORKSPACE_NODE_SELECTION_SHADOW,
} from "./workspaceNodeStyles";

const LABEL_ME = "\u6211";
const LABEL_EDIT = "\u7f16\u8f91";
const LABEL_DOWNLOAD = "\u4e0b\u8f7d";
const LABEL_DELETE = "\u5220\u9664\u8282\u70b9";
const LABEL_DOUBLE_CLICK_PREVIEW = "\u53cc\u51fb\u9884\u89c8";
const LABEL_TREE_IMAGE_NODE = "\u6811\u72b6\u56fe\u7247\u8282\u70b9";

type WorkspaceTreeImageNodeProps = {
  element: CanvasElement;
  isSelected: boolean;
  displayUrl?: string;
  timestampLabel: string;
  onStartMaskEdit: () => void;
  onDelete: () => void;
};

const ImageCardFooter: React.FC<{
  timestampLabel: string;
}> = ({ timestampLabel }) => (
  <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/82 via-black/28 to-transparent px-4 pb-3 pt-12 text-white">
    <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.01em]">
      <span className="inline-block h-2 w-2 rounded-full bg-[#8BC34A] shadow-[0_0_0_3px_rgba(139,195,74,0.18)]" />
      <span>{LABEL_ME}</span>
    </div>
    <span className="text-[11px] font-medium text-white/86">{timestampLabel}</span>
  </div>
);

const ToolbarButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  destructive?: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}> = ({ icon, label, disabled = false, destructive = false, onClick }) => (
  <button
    type="button"
    aria-label={label}
    className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition ${
      destructive
        ? "text-[#111827] hover:bg-[#fff1f2] hover:text-[#dc2626]"
        : "text-[#111827] hover:bg-[#f6f3ff]"
    } disabled:cursor-not-allowed disabled:opacity-40`}
    disabled={disabled}
    onMouseDown={(event) => event.stopPropagation()}
    onClick={onClick}
  >
    {icon}
    <span className="whitespace-nowrap">{label}</span>
  </button>
);

const TreeImageToolbar: React.FC<{
  canEdit: boolean;
  isVisible: boolean;
  onStartMaskEdit: () => void;
  onDownload: () => void;
  onDelete: () => void;
}> = ({
  canEdit,
  isVisible,
  onStartMaskEdit,
  onDownload,
  onDelete,
}) => (
  <div
    aria-hidden={!isVisible}
    className={`pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center transition-opacity duration-200 ${
      isVisible ? "opacity-100" : "opacity-0"
    }`}
  >
    <div
      className={`flex w-max items-center gap-0.5 rounded-full border border-white/82 bg-[rgba(255,255,255,0.98)] px-2 py-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.10),0_1px_0_rgba(255,255,255,0.78)_inset] backdrop-blur-md transition-[transform,opacity] duration-200 ${
        isVisible
          ? "pointer-events-auto"
          : "pointer-events-none"
      }`}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      style={{
        transform: `translateY(calc(-100% - 12px)) scale(${isVisible ? 1 : 0.96})`,
        transformOrigin: "center bottom",
      }}
    >
      <ToolbarButton
        icon={<Pencil size={14} />}
        label={LABEL_EDIT}
        disabled={!canEdit}
        onClick={(event) => {
          event.stopPropagation();
          onStartMaskEdit();
        }}
      />
      <ToolbarButton
        icon={<Download size={14} />}
        label={LABEL_DOWNLOAD}
        onClick={(event) => {
          event.stopPropagation();
          onDownload();
        }}
      />
      <ToolbarButton
        icon={<Trash2 size={14} />}
        label={LABEL_DELETE}
        destructive
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
      />
    </div>
  </div>
);

const DoubleClickHint: React.FC<{
  isVisible: boolean;
}> = ({ isVisible }) => (
  <div
    aria-hidden={!isVisible}
    className={`pointer-events-none absolute right-3 top-3 z-[4] rounded-full border border-white/72 bg-[rgba(17,24,39,0.38)] px-2.5 py-1 text-[10px] font-medium tracking-[0.01em] text-white shadow-[0_8px_22px_rgba(0,0,0,0.16)] backdrop-blur-md transition-[opacity,transform] duration-200 ${
      isVisible ? "opacity-100" : "opacity-0"
    }`}
    style={{
      transform: `translateY(${isVisible ? "0px" : "-4px"}) scale(${isVisible ? 1 : 0.96})`,
      transformOrigin: "top right",
    }}
  >
    {LABEL_DOUBLE_CLICK_PREVIEW}
  </div>
);

export const WorkspaceTreeImageNode: React.FC<
  WorkspaceTreeImageNodeProps
> = ({
  element,
  isSelected,
  displayUrl,
  timestampLabel,
  onStartMaskEdit,
  onDelete,
}) => {
  const handleDownload = React.useCallback(() => {
    if (!displayUrl || typeof document === "undefined") return;
    const link = document.createElement("a");
    link.href = displayUrl;
    link.download = `tree-image-${element.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [displayUrl, element.id]);

  return (
    <div className="relative h-full w-full overflow-visible">
      {isSelected ? (
        <div
          className={`pointer-events-none absolute -inset-[4px] z-10 ${WORKSPACE_NODE_OUTLINE_RADIUS}`}
          style={{
            borderRadius: WORKSPACE_NODE_SELECTION_RADIUS,
            boxShadow: WORKSPACE_NODE_SELECTION_SHADOW,
          }}
        />
      ) : null}
      <TreeImageToolbar
        canEdit={Boolean(displayUrl)}
        isVisible={isSelected}
        onStartMaskEdit={onStartMaskEdit}
        onDownload={handleDownload}
        onDelete={onDelete}
      />
      <button
        type="button"
        aria-label={LABEL_TREE_IMAGE_NODE}
        className={`group/result relative block h-full w-full overflow-hidden rounded-[30px] border bg-[#ebe8e2] text-left transition duration-200 ${
          isSelected
            ? "z-20 border-white/82 shadow-[0_18px_42px_rgba(15,23,42,0.13)]"
            : "border-transparent shadow-[0_14px_30px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(15,23,42,0.12)]"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-0 z-[1] rounded-[30px] shadow-[0_1px_0_rgba(255,255,255,0.4)_inset]" />
        <div className="pointer-events-none absolute inset-0 z-[2] rounded-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0)_34%,rgba(0,0,0,0.02)_100%)]" />
        {displayUrl ? (
          <img
            src={displayUrl}
            className="h-full w-full object-cover transition duration-300 group-hover/result:scale-[1.018]"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#ece8e3] text-[#9ca3af]">
            <ImageIcon size={52} strokeWidth={1.5} />
          </div>
        )}
        <DoubleClickHint isVisible={isSelected} />
        {isSelected ? (
          <div className="pointer-events-none absolute inset-0 z-[3] rounded-[30px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_42%)]" />
        ) : null}
        <ImageCardFooter timestampLabel={timestampLabel} />
        {element.isGenerating ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/16 backdrop-blur-[1.5px]">
            <div className="flex items-center gap-2 rounded-full bg-white/94 px-3 py-2 text-[12px] font-semibold text-[#18181b] shadow-[0_10px_24px_rgba(0,0,0,0.14)]">
              <Loader2 size={14} className="animate-spin" />
              <span>Generating</span>
            </div>
          </div>
        ) : null}
      </button>
    </div>
  );
};
