import React, { memo } from "react";
import { motion } from "framer-motion";
import { useAgentStore } from "../../../stores/agent.store";
import { useAssistantSidebarConversationUi } from "../controllers/useAssistantSidebarConversationUi";
import { useAssistantSidebarPanelUi } from "../controllers/useAssistantSidebarPanelUi";
import { useAssistantSidebarQuickSkills } from "../controllers/useAssistantSidebarQuickSkills";
import { AssistantSidebarHeader } from "./AssistantSidebarHeader";
import { AssistantSidebarQuickSkills } from "./AssistantSidebarQuickSkills";
import { AssistantSidebarStatusBanner } from "./AssistantSidebarStatusBanner";
import { MessageList } from "./MessageList";
import { InputArea } from "./InputArea";
import { EcommerceWorkflowSummaryCard } from "./workflow/EcommerceWorkflowSummaryCard";
import { isEcommerceWorkflowChatMessage } from "./workflow/ecommerceWorkflowUi";
import type {
  InputAreaComposerProps,
  InputAreaInputUiProps,
  InputAreaModelPreferencesProps,
} from "./InputArea";

import { ConversationSession, Marker } from "../../../types";
import type { ChatMessage } from "../../../types";
import type {
  EcommerceImageAnalysis,
  EcommerceOverlayState,
  EcommercePlanGroup,
  EcommerceResultItem,
  EcommerceRecommendedType,
  EcommerceSupplementField,
  Requirements,
  ModelGenOptions,
} from "../../../types/workflow.types";

type AssistantSidebarComposerProps = Omit<
  InputAreaComposerProps,
  "handleSend"
> & {
  setPrompt: (prompt: string) => void;
};

type AssistantSidebarInputUiProps = InputAreaInputUiProps;

type AssistantSidebarModelPreferenceProps = InputAreaModelPreferencesProps;

type AssistantSidebarSessionProps = {
  workspaceId: string;
  conversations: ConversationSession[];
  setConversations: React.Dispatch<React.SetStateAction<ConversationSession[]>>;
  activeConversationId: string;
  setActiveConversationId: (id: string) => void;
};

type AssistantSidebarPanelUiProps = {
  showAssistant: boolean;
  setShowAssistant: (show: boolean) => void;
  setPreviewUrl: (url: string) => void;
  onOpenEcommerceWorkflow: () => void;
};

type AssistantSidebarMessageActionsProps = {
  handleSend: (
    overridePrompt?: string,
    overrideAttachments?: File[],
    overrideWeb?: boolean,
    skillData?: ChatMessage["skillData"],
  ) => Promise<void>;
  handleSmartGenerate: (prompt: string, proposalId?: string) => void;
};

type AssistantSidebarClothingActionsProps = {
  onClothingSubmitRequirements?: (data: Requirements) => void;
  onClothingGenerateModel?: (data: ModelGenOptions) => void;
  onClothingPickModelCandidate?: (url: string) => void;
  onClothingInsertToCanvas?: (url: string, label?: string) => void;
  onClothingRetryFailed?: () => void;
};

type AssistantSidebarEcommerceActionsProps = {
  onEcommerceRefineAnalysis?: (feedback: string) => Promise<void> | void;
  onEcommerceConfirmTypes?: (items: EcommerceRecommendedType[]) => void;
  onEcommerceConfirmImageAnalyses?: (items: EcommerceImageAnalysis[]) => void;
  onEcommerceRetryImageAnalysis?: (imageId: string) => void;
  onEcommerceRewritePlanPrompt?: (
    groups: EcommercePlanGroup[],
    planItemId: string,
    feedback?: string,
  ) => Promise<string | null>;
  onEcommerceGeneratePlanItem?: (
    groups: EcommercePlanGroup[],
    planItemId: string,
  ) => Promise<void>;
  onEcommerceGenerateExtraPlanItem?: (
    groups: EcommercePlanGroup[],
    typeId: string,
  ) => Promise<void>;
  onEcommerceOpenResultOverlayEditor?: (url: string) => void | Promise<void>;
  onEcommerceCloseResultOverlayEditor?: () => void | Promise<void>;
  onEcommerceSaveResultOverlayDraft?: (
    url: string,
    overlayState: EcommerceOverlayState | null,
  ) => void | Promise<void>;
  onEcommerceApplyResultOverlay?: (
    url: string,
    overlayState: EcommerceOverlayState | null,
  ) => void | Promise<void>;
  onEcommerceUploadResultOverlayFont?: (
    url: string,
    file: File,
  ) => void | Promise<void>;
  onEcommerceUploadResultOverlayIcon?: (
    url: string,
    file: File,
  ) => void | Promise<void>;
  onEcommerceResetResultOverlay?: (url: string) => void | Promise<void>;
  onEcommercePromoteResult?: (url: string) => void;
  onEcommercePromoteSelectedResults?: (urls: string[]) => void;
  onEcommerceDeleteResult?: (url: string) => void;
  onEcommerceConfirmPlans?: (groups: EcommercePlanGroup[]) => void;
  onEcommerceConfirmSupplements?: (fields: EcommerceSupplementField[]) => void;
  onEcommerceSelectModel?: (modelId: string, promptLanguage?: "zh" | "en" | "auto") => void;
  onEcommerceSyncBatchPlanItemRatio?: (
    planItemId: string,
    ratio: string,
  ) => Promise<void> | void;
  onEcommerceSyncBatchPrompt?: (
    planItemId: string,
    prompt: string,
  ) => Promise<void> | void;
  onEcommerceOpenBatchWorkbench?: () => void | Promise<void>;
  onEcommerceRunBatchGenerate?: (
    promptOverrides?: Record<string, string>,
    options?: {
      promptOnly?: boolean;
      targetPlanItemIds?: string[];
      preserveExistingResults?: boolean;
    },
  ) => void;
  onEcommerceRetryFailedBatch?: () => void;
  onEcommerceInsertToCanvas?: (result: EcommerceResultItem | string, label?: string) => void;
};

interface AssistantSidebarProps {
  session: AssistantSidebarSessionProps;
  panelUi: AssistantSidebarPanelUiProps;
  messageActions: AssistantSidebarMessageActionsProps;
  composer: AssistantSidebarComposerProps;
  inputUi: AssistantSidebarInputUiProps;
  modelPreferences: AssistantSidebarModelPreferenceProps;
  markers: Marker[];
  onSaveMarkerLabel?: (markerId: string, label: string) => void;
  clothingActions?: AssistantSidebarClothingActionsProps;
  ecommerceActions?: AssistantSidebarEcommerceActionsProps;
}

export const AssistantSidebar: React.FC<AssistantSidebarProps> = memo(({
  session,
  panelUi,
  messageActions,
  composer,
  inputUi,
  modelPreferences,
  markers,
  onSaveMarkerLabel,
  clothingActions,
  ecommerceActions,
}) => {
  const {
    workspaceId,
    conversations,
    setConversations,
    activeConversationId,
    setActiveConversationId,
  } = session;
  const { setShowAssistant, setPreviewUrl, onOpenEcommerceWorkflow } = panelUi;
  const { handleSend, handleSmartGenerate } = messageActions;
  const messages = useAgentStore((s) => s.messages);
  const visibleMessages = React.useMemo(
    () =>
      messages.filter((message) => !isEcommerceWorkflowChatMessage(message)),
    [messages],
  );
  const { setMessages, clearMessages } = useAgentStore((s) => s.actions);
  const {
    currentTask,
    currentTaskLabel,
    showHistoryPopover,
    historySearch,
    showFileListModal,
    setHistorySearch,
    toggleHistoryPopover,
    closeHistoryPopover,
    toggleFileListModal,
  } = useAssistantSidebarPanelUi();
  const {
    activeQuickSkill,
    handleSendWithQuickSkill,
    clearActiveQuickSkill,
    quickSkillsProps,
  } = useAssistantSidebarQuickSkills({
    conversations,
    setConversations,
    activeConversationId,
    creationMode: composer.creationMode,
    onOpenEcommerceWorkflow,
    handleSend,
  });

  const {
    handleCreateConversation,
    handleSelectConversation,
    handleDeleteConversation,
    activeConversationTitle,
  } = useAssistantSidebarConversationUi({
    workspaceId,
    conversations,
    setConversations,
    activeConversationId,
    setActiveConversationId,
    messages,
    clearMessages,
    setMessages,
    setPrompt: composer.setPrompt,
    setCreationMode: composer.setCreationMode,
    resetActiveQuickSkill: clearActiveQuickSkill,
    closeHistoryPopover,
  });

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute top-0 right-0 w-[480px] h-full min-h-0 bg-[#f8f9fc] border-l border-gray-200 shadow-[-10px_0_30px_rgba(0,0,0,0.03)] z-50 flex flex-col overflow-hidden"
    >
      <AssistantSidebarHeader
        title={activeConversationTitle}
        historyOpen={showHistoryPopover}
        historySearch={historySearch}
        setHistorySearch={setHistorySearch}
        conversations={conversations}
        activeConversationId={activeConversationId}
        filesOpen={showFileListModal}
        messages={messages}
        onPreview={setPreviewUrl}
        onToggleHistory={toggleHistoryPopover}
        onCreateConversation={handleCreateConversation}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onToggleFiles={toggleFileListModal}
        onClose={() => setShowAssistant(false)}
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 no-scrollbar relative">
        <div className="space-y-4">
          <EcommerceWorkflowSummaryCard
            onOpen={onOpenEcommerceWorkflow}
            compact
          />
          {visibleMessages.length === 0 ? (
            <AssistantSidebarQuickSkills {...quickSkillsProps} />
          ) : (
            <MessageList
              onSend={handleSend}
              onSmartGenerate={handleSmartGenerate}
              onPreview={setPreviewUrl}
              clothingActions={clothingActions}
              ecommerceActions={ecommerceActions}
            />
          )}
        </div>
      </div>

      <AssistantSidebarStatusBanner
        label={currentTaskLabel}
        statusKey={currentTask?.status}
      />

      <div className="shrink-0 flex-shrink-0 border-t border-gray-100 bg-[#f8f9fc]">
        <InputArea
          composer={{
            ...composer,
            handleSend: handleSendWithQuickSkill,
          }}
          inputUi={inputUi}
          modelPreferences={modelPreferences}
          markers={markers}
          onSaveMarkerLabel={onSaveMarkerLabel}
          activeQuickSkill={activeQuickSkill}
          onClearQuickSkill={clearActiveQuickSkill}
          onOpenEcommerceWorkflow={onOpenEcommerceWorkflow}
        />
      </div>
    </motion.div>
  );
});
