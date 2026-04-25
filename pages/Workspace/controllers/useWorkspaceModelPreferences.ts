import { useEffect, useState } from "react";
import type { ImageModel, VideoModel } from "../../../types";
import { getMappedModelIds } from "../../../services/provider-settings";
import { safeLocalStorageSetItem } from "../../../utils/safe-storage";

type WorkspaceModelMode = "thinking" | "fast";
type WorkspaceModelPreferenceTab = "image" | "video" | "3d";

type UseWorkspaceModelPreferencesArgs = {
  modelMode: WorkspaceModelMode;
  clearMessages: () => void;
  setModelMode: (mode: WorkspaceModelMode) => void;
};

const DEFAULT_AUTO_IMAGE_MODEL: ImageModel = "Nano Banana Pro";
const DEFAULT_VIDEO_MODEL: VideoModel = "veo-3.1-fast-generate-preview";
const LOCAL_STORAGE_KEYS = {
  autoModelSelect: "workspace_auto_model_select",
  preferredImageModel: "workspace_preferred_image_model",
  preferredVideoModel: "workspace_preferred_video_model",
  preferred3DModel: "workspace_preferred_3d_model",
} as const;

const STORAGE_ID_TO_PREFERRED_IMAGE_MODEL: Record<string, ImageModel> = {
  "gemini-3-pro-image-preview": "Nano Banana Pro",
  "Nano Banana Pro": "Nano Banana Pro",
  "gemini-3.1-flash-image-preview": "NanoBanana2",
  NanoBanana2: "NanoBanana2",
  "doubao-seedream-5-0-260128": "Seedream5.0",
  "Seedream5.0": "Seedream5.0",
  "gpt-image-2": "GPT Image 2",
  "GPT Image 2": "GPT Image 2",
  "gpt-image-1.5-all": "GPT Image 1.5",
  "GPT Image 1.5": "GPT Image 1.5",
  "Flux.2 Max": "Flux.2 Max",
};

const readStoredBoolean = (key: string, fallback: boolean): boolean => {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw === "true") return true;
  if (raw === "false") return false;
  return fallback;
};

const readStoredString = (key: string, fallback: string): string => {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  return raw?.trim() || fallback;
};

const getMappedPrimaryImageRuntimeModel = (): ImageModel => {
  const [firstModel] = getMappedModelIds("image");
  return (firstModel?.trim() as ImageModel) || DEFAULT_AUTO_IMAGE_MODEL;
};

const getMappedPrimaryImageDisplayModel = (): ImageModel => {
  const mappedModel = getMappedPrimaryImageRuntimeModel();
  return STORAGE_ID_TO_PREFERRED_IMAGE_MODEL[mappedModel] || mappedModel;
};

const getMappedPrimaryVideoModel = (): VideoModel => {
  const [firstModel] = getMappedModelIds("video");
  return (firstModel?.trim() as VideoModel) || DEFAULT_VIDEO_MODEL;
};

const normalizePreferredImageModel = (raw: string): ImageModel => {
  const normalized = raw.trim();
  if (!normalized || normalized.toLowerCase() === "auto") {
    return getMappedPrimaryImageDisplayModel();
  }
  return STORAGE_ID_TO_PREFERRED_IMAGE_MODEL[normalized] || (normalized as ImageModel);
};

const normalizePreferredVideoModel = (raw: string): VideoModel => {
  const normalized = raw.trim();
  if (!normalized || normalized.toLowerCase() === "auto") {
    return getMappedPrimaryVideoModel();
  }
  return normalized as VideoModel;
};

export const useWorkspaceModelPreferences = ({
  modelMode,
  clearMessages,
  setModelMode,
}: UseWorkspaceModelPreferencesArgs) => {
  const [showModeSwitchDialog, setShowModeSwitchDialog] = useState(false);
  const [pendingModelMode, setPendingModelMode] =
    useState<WorkspaceModelMode | null>(null);
  const [doNotAskModeSwitch, setDoNotAskModeSwitch] = useState(false);

  const [showModelPreference, setShowModelPreference] = useState(false);
  const [modelPreferenceTab, setModelPreferenceTab] =
    useState<WorkspaceModelPreferenceTab>("image");
  const [autoModelSelect, setAutoModelSelect] = useState(() =>
    readStoredBoolean(LOCAL_STORAGE_KEYS.autoModelSelect, true),
  );
  const [preferredImageModel, setPreferredImageModel] =
    useState<ImageModel>(() =>
      normalizePreferredImageModel(
        readStoredString(
          LOCAL_STORAGE_KEYS.preferredImageModel,
          getMappedPrimaryImageDisplayModel(),
        ),
      ),
    );
  const [preferredVideoModel, setPreferredVideoModel] =
    useState<VideoModel>(() =>
      normalizePreferredVideoModel(
        readStoredString(
          LOCAL_STORAGE_KEYS.preferredVideoModel,
          getMappedPrimaryVideoModel(),
        ),
      ),
    );
  const [preferred3DModel, setPreferred3DModel] = useState(() =>
    readStoredString(LOCAL_STORAGE_KEYS.preferred3DModel, "Auto"),
  );

  const activeImageModel = autoModelSelect
    ? getMappedPrimaryImageRuntimeModel()
    : preferredImageModel;

  useEffect(() => {
    safeLocalStorageSetItem(
      LOCAL_STORAGE_KEYS.autoModelSelect,
      autoModelSelect ? "true" : "false",
    );
  }, [autoModelSelect]);

  useEffect(() => {
    safeLocalStorageSetItem(
      LOCAL_STORAGE_KEYS.preferredImageModel,
      preferredImageModel,
    );
  }, [preferredImageModel]);

  useEffect(() => {
    safeLocalStorageSetItem(
      LOCAL_STORAGE_KEYS.preferredVideoModel,
      preferredVideoModel,
    );
  }, [preferredVideoModel]);

  useEffect(() => {
    safeLocalStorageSetItem(
      LOCAL_STORAGE_KEYS.preferred3DModel,
      preferred3DModel,
    );
  }, [preferred3DModel]);

  const handleModeSwitch = (newMode: WorkspaceModelMode) => {
    if (newMode === modelMode) return;

    if (doNotAskModeSwitch) {
      setModelMode(newMode);
      clearMessages();
      return;
    }

    setPendingModelMode(newMode);
    setShowModeSwitchDialog(true);
  };

  const closeModeSwitchDialog = () => {
    setShowModeSwitchDialog(false);
    setPendingModelMode(null);
  };

  const toggleDoNotAskModeSwitch = () => {
    setDoNotAskModeSwitch((value) => !value);
  };

  const confirmModeSwitch = () => {
    if (pendingModelMode) {
      setModelMode(pendingModelMode);
      clearMessages();
    }

    closeModeSwitchDialog();
  };

  return {
    activeImageModel,
    handleModeSwitch,
    modelPreferences: {
      showModelPreference,
      setShowModelPreference,
      modelPreferenceTab,
      setModelPreferenceTab,
      autoModelSelect,
      setAutoModelSelect,
      preferredImageModel,
      setPreferredImageModel,
      preferredVideoModel,
      setPreferredVideoModel,
      preferred3DModel,
      setPreferred3DModel,
    },
    modeSwitchDialog: {
      open: showModeSwitchDialog,
      doNotAsk: doNotAskModeSwitch,
      onClose: closeModeSwitchDialog,
      onToggleDoNotAsk: toggleDoNotAskModeSwitch,
      onConfirm: confirmModeSwitch,
    },
  };
};
