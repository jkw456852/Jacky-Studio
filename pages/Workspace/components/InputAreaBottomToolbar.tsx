import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowUp,
  Banana,
  Box,
  Check,
  ChevronDown,
  Globe,
  Image as ImageIcon,
  Lightbulb,
  Package2,
  Paperclip,
  Sparkles,
  Video,
  Zap,
  Layers,
  Cloud,
} from 'lucide-react';
import type { ChatMessage, InputBlock, ImageModel, VideoModel } from '../../../types';
import {
  getMappedModelDisplaySummary,
  getMappedPrimaryModelLabel,
} from '../../../services/provider-settings';

const MODEL_OPTIONS: Record<
  string,
  {
    id: string;
    name: string;
    desc: string;
    time?: string;
    icon: React.ElementType;
    badge?: string;
  }[]
> = {
  image: [
    { id: 'Nano Banana Pro', name: 'Nano Banana Pro', desc: "Professional's choice for advanced outputs.", time: '20s', icon: Banana },
    { id: 'NanoBanana2', name: 'Nano Banana 2', desc: 'Generalist fast image generation model.', time: '15s', icon: Zap },
    { id: 'dall-e-3', name: 'DALL·E 3', desc: "OpenAI's most advanced image model.", time: '120s', icon: Sparkles },
    { id: 'Seedream5.0', name: 'Seedream 5.0 Lite', desc: "Bytedance's latest image generation model.", time: '120s', icon: Activity },
    { id: 'flux-schnell', name: 'Flux Schnell', desc: "BFL's fast image generation model.", time: '10s', icon: Layers },
    { id: 'flux-pro', name: 'Flux.1 Pro', desc: "BFL's image generation model.", time: '10s', icon: Layers },
    { id: 'gemini-1.5-pro', name: 'Gemini Imagen 4', desc: "Google's most advanced image model.", time: '10s', icon: Sparkles },
    { id: 'midjourney', name: 'Midjourney', desc: 'A model that transforms text into artistic visuals.', time: '20s', icon: Globe },
  ],
  video: [
    { id: 'veo-3.1-fast-generate-preview', name: 'Veo 3.1 Fast', desc: "Google's ultra-fast video generation model.", time: '10s', icon: Cloud, badge: '极速版' },
    { id: 'veo-3.1-generate-preview', name: 'Veo 3.1 Pro', desc: "Google's high-quality video generation model.", time: '180s', icon: Cloud, badge: '专业版' },
    { id: 'kling-3.0', name: 'Kling 3.0', desc: "Kling's latest video model.", time: '300s', icon: Video, badge: '蓝海5型' },
    { id: 'sora-2', name: 'Sora 2', desc: "OpenAI's flagship video generation model. Single image only.", time: '300s', icon: Sparkles, badge: '单图参考' },
    { id: 'runway-gen3', name: 'Runway Gen-3', desc: 'Video generation model with built-in audio.', time: '600s', icon: Activity },
  ],
  '3d': [{ id: 'Tripo', name: 'Tripo', desc: 'High-quality 3D model generator.', icon: Box }],
};

type InputAreaBottomToolbarProps = {
  creationMode: 'agent' | 'image' | 'video';
  setCreationMode: (mode: 'agent' | 'image' | 'video') => void;
  handleSend: (
    overridePrompt?: string,
    overrideAttachments?: File[],
    overrideWeb?: boolean,
    skillData?: ChatMessage['skillData'],
  ) => Promise<void>;
  handleModeSwitch: (mode: 'thinking' | 'fast') => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  showModeSelector: boolean;
  setShowModeSelector: (value: boolean) => void;
  showRatioPicker: boolean;
  setShowRatioPicker: (value: boolean) => void;
  showModelPicker: boolean;
  setShowModelPicker: (value: boolean) => void;
  showVideoSettingsDropdown: boolean;
  setShowVideoSettingsDropdown: (value: boolean) => void;
  showModelPreference: boolean;
  setShowModelPreference: (value: boolean) => void;
  modelPreferenceTab: 'image' | 'video' | '3d';
  setModelPreferenceTab: (tab: 'image' | 'video' | '3d') => void;
  autoModelSelect: boolean;
  setAutoModelSelect: (value: boolean) => void;
  preferredImageModel: ImageModel;
  setPreferredImageModel: (value: ImageModel) => void;
  preferredVideoModel: VideoModel;
  setPreferredVideoModel: (value: VideoModel) => void;
  preferred3DModel: string;
  setPreferred3DModel: (value: string) => void;
  imageGenRatio: string;
  setImageGenRatio: (value: string) => void;
  imageGenRes: '1K' | '2K' | '4K';
  setImageGenRes: (value: string) => void;
  imageGenCount: 1 | 2 | 3 | 4;
  setImageGenCount: (value: 1 | 2 | 3 | 4) => void;
  imageGenUploads: File[];
  videoGenRatio: string;
  setVideoGenRatio: (value: string) => void;
  videoGenDuration: string;
  setVideoGenDuration: (value: string) => void;
  videoGenModel: VideoModel;
  setVideoGenModel: (value: VideoModel) => void;
  videoGenMode: 'startEnd' | 'multiRef';
  setVideoGenMode: (value: 'startEnd' | 'multiRef') => void;
  modelMode: 'thinking' | 'fast';
  webEnabled: boolean;
  setWebEnabled: (value: boolean) => void;
  setIsAgentMode: (value: boolean) => void;
  translatePromptToEnglish: boolean;
  setTranslatePromptToEnglish: (value: boolean) => void;
  enforceChineseTextInImage: boolean;
  setEnforceChineseTextInImage: (value: boolean) => void;
  requiredChineseCopy: string;
  setRequiredChineseCopy: (value: string) => void;
  inputBlocks: InputBlock[];
  sendSkill?: ChatMessage['skillData'];
  isSoraVideoModel: boolean;
  handlePickedFiles: (files: File[]) => void;
  onOpenEcommerceWorkflow?: () => void;
};

export const InputAreaBottomToolbar: React.FC<InputAreaBottomToolbarProps> = (
  props,
) => {
  const {
    creationMode,
    setCreationMode,
    handleSend,
    handleModeSwitch,
    fileInputRef,
    showModeSelector,
    setShowModeSelector,
    showRatioPicker,
    setShowRatioPicker,
    showModelPicker,
    setShowModelPicker,
    showVideoSettingsDropdown,
    setShowVideoSettingsDropdown,
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
    imageGenRatio,
    setImageGenRatio,
    imageGenRes,
    setImageGenRes,
    imageGenCount,
    setImageGenCount,
    imageGenUploads,
    videoGenRatio,
    setVideoGenRatio,
    videoGenDuration,
    setVideoGenDuration,
    videoGenModel,
    setVideoGenModel,
    videoGenMode,
    setVideoGenMode,
    modelMode,
    webEnabled,
    setWebEnabled,
    setIsAgentMode,
    translatePromptToEnglish,
    setTranslatePromptToEnglish,
    enforceChineseTextInImage,
    setEnforceChineseTextInImage,
    requiredChineseCopy,
    setRequiredChineseCopy,
    inputBlocks,
    sendSkill,
    isSoraVideoModel,
    handlePickedFiles,
    onOpenEcommerceWorkflow,
  } = props;

  const mappedImageSummary = getMappedModelDisplaySummary('image');
  const mappedVideoSummary = getMappedModelDisplaySummary('video');
  const mappedScriptSummary = getMappedModelDisplaySummary('script');
  const activeMappingSummary =
    creationMode === 'video' ? mappedVideoSummary : mappedImageSummary;
  const activePrimaryModel =
    creationMode === 'video'
      ? getMappedPrimaryModelLabel('video')
      : getMappedPrimaryModelLabel('image');
  const [showImageCountPicker, setShowImageCountPicker] = React.useState(false);

  return (
    <>
      <div className="px-3 py-1.5 flex items-center justify-between relative border-t border-gray-100/80">
        <div className="flex items-center gap-1">
          {creationMode === 'agent' && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            >
              <Paperclip size={17} strokeWidth={1.8} />
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowModeSelector(!showModeSelector)}
              className="h-8 px-3.5 rounded-full flex items-center justify-center gap-1.5 text-[13px] font-medium transition-all bg-white border border-blue-200 text-blue-500 hover:bg-blue-50/50 hover:border-blue-300 shadow-sm"
            >
              {creationMode === 'agent' && (
                <>
                  <Sparkles size={15} /> Agent
                </>
              )}
              {creationMode === 'image' && (
                <>
                  <ImageIcon size={15} /> 图像
                </>
              )}
              {creationMode === 'video' && (
                <>
                  <Video size={15} /> 视频
                </>
              )}
            </button>
            {showModeSelector && (
              <div className="absolute bottom-full left-0 mb-3 w-[160px] bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden">
                <button
                  onClick={() => {
                    setCreationMode('agent');
                    setShowModeSelector(false);
                    setIsAgentMode(true);
                  }}
                  className={`w-full px-4 py-2.5 flex items-center justify-between text-sm font-medium hover:bg-gray-50 transition ${
                    creationMode === 'agent' ? 'text-blue-500' : 'text-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles
                      size={14}
                      className={
                        creationMode === 'agent' ? 'text-blue-500' : 'text-gray-400'
                      }
                    />
                    Agent
                  </div>
                  {creationMode === 'agent' && <Check size={14} strokeWidth={2.5} />}
                </button>
                <button
                  onClick={() => {
                    setCreationMode('image');
                    setShowModeSelector(false);
                    setIsAgentMode(false);
                  }}
                  className={`w-full px-4 py-2.5 flex items-center justify-between text-sm font-medium hover:bg-gray-50 transition ${
                    creationMode === 'image' ? 'text-blue-500' : 'text-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ImageIcon
                      size={14}
                      className={
                        creationMode === 'image' ? 'text-blue-500' : 'text-gray-400'
                      }
                    />
                    图像生成器
                  </div>
                  {creationMode === 'image' && <Check size={14} strokeWidth={2.5} />}
                </button>
                <button
                  onClick={() => {
                    setCreationMode('video');
                    setShowModeSelector(false);
                    setIsAgentMode(false);
                  }}
                  className={`w-full px-4 py-2.5 flex items-center justify-between text-sm font-medium hover:bg-gray-50 transition ${
                    creationMode === 'video' ? 'text-blue-500' : 'text-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Video
                      size={14}
                      className={
                        creationMode === 'video' ? 'text-blue-500' : 'text-gray-400'
                      }
                    />
                    视频生成器
                  </div>
                  {creationMode === 'video' && <Check size={14} strokeWidth={2.5} />}
                </button>
              </div>
            )}
          </div>

          {onOpenEcommerceWorkflow && (
            <button
              type="button"
              onClick={onOpenEcommerceWorkflow}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
              aria-label="打开电商工作流"
              title="打开电商工作流"
            >
              <Package2 size={16} strokeWidth={1.9} />
            </button>
          )}

          {creationMode === 'image' && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowRatioPicker(!showRatioPicker);
                  setShowModelPicker(false);
                  setShowVideoSettingsDropdown(false);
                }}
                className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-gray-50 rounded-lg transition-colors group"
              >
                <span className="text-[13px] font-bold text-gray-800">
                  {imageGenRes} · {imageGenRatio}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-gray-400 group-hover:text-gray-600 transition-transform ${
                    showRatioPicker ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {showRatioPicker && (
                <div className="absolute bottom-full left-0 mb-3 w-[260px] bg-white rounded-[24px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-gray-100 p-5 z-[70] animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-4">
                    分辨率
                  </div>
                  <div className="flex gap-2 mb-6">
                    {['1K', '2K', '4K'].map((res) => (
                      <button
                        key={res}
                        onClick={() => setImageGenRes(res)}
                        className={`flex-1 py-1.5 text-[12px] font-bold rounded-xl transition-all ${
                          imageGenRes === res
                            ? 'bg-gray-200 text-black shadow-inner'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                  <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-4">
                    Size
                  </div>
                  <div className="grid grid-cols-4 gap-2.5">
                    {[
                      { r: '8:1', i: 'w-6 h-2' },
                      { r: '4:1', i: 'w-6 h-2.5' },
                      { r: '21:9', i: 'w-5 h-2' },
                      { r: '16:9', i: 'w-5 h-3' },
                      { r: '3:2', i: 'w-5 h-3.5' },
                      { r: '4:3', i: 'w-5 h-3.5' },
                      { r: '5:4', i: 'w-4.5 h-4' },
                      { r: '1:1', i: 'w-4 h-4' },
                      { r: '4:5', i: 'w-4 h-4.5' },
                      { r: '3:4', i: 'w-3.5 h-5' },
                      { r: '2:3', i: 'w-3.5 h-5' },
                      { r: '9:16', i: 'w-3 h-5' },
                      { r: '1:4', i: 'w-2.5 h-6' },
                      { r: '1:8', i: 'w-2 h-6' },
                    ].map((item) => (
                      <button
                        key={item.r}
                        onClick={() => {
                          setImageGenRatio(item.r);
                          setShowRatioPicker(false);
                        }}
                        className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border transition-all ${
                          imageGenRatio === item.r
                            ? 'bg-gray-100 border-gray-300 ring-1 ring-gray-300'
                            : 'border-gray-100 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div
                          className={`border-[1.5px] border-gray-400 rounded-[2px] ${item.i} ${
                            imageGenRatio === item.r ? 'bg-gray-400' : 'bg-transparent'
                          }`}
                        />
                        <span className="text-[10px] font-bold text-gray-600">
                          {item.r}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {creationMode === 'video' && (
            <div className="relative">
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setShowVideoSettingsDropdown(!showVideoSettingsDropdown);
                  setShowRatioPicker(false);
                  setShowModelPicker(false);
                }}
                className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-gray-50 rounded-lg transition-colors group"
              >
                <span className="text-[13px] font-bold text-gray-800">
                  Frames · {videoGenRatio} · {videoGenDuration}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-gray-400 group-hover:text-gray-600 transition-transform ${
                    showVideoSettingsDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {showVideoSettingsDropdown && (
                <div
                  onClick={(event) => event.stopPropagation()}
                  className="absolute bottom-full left-0 mb-3 w-[300px] bg-white rounded-[24px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-gray-100 p-5 z-[70] animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col gap-5"
                >
                  <div className="flex flex-col gap-2.5">
                    <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                      Generate method
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                      {(isSoraVideoModel
                        ? [{ id: 'startEnd', label: '单图参考' }]
                        : [
                            { id: 'startEnd', label: '首尾帧' },
                            { id: 'multiRef', label: '多图参考' },
                          ]
                      ).map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() =>
                            setVideoGenMode(mode.id as 'startEnd' | 'multiRef')
                          }
                          className={`flex-1 py-1.5 text-[12px] font-bold rounded-lg transition-all ${
                            videoGenMode === mode.id
                              ? 'bg-white shadow-sm text-black'
                              : 'text-gray-400'
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                      Size
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(isSoraVideoModel
                        ? [
                            { r: '16:9', i: 'w-6 h-3.5' },
                            { r: '9:16', i: 'w-3.5 h-6' },
                          ]
                        : videoGenModel === 'kling-3.0'
                          ? [
                              { r: '16:9', i: 'w-6 h-3.5' },
                              { r: '9:16', i: 'w-3.5 h-6' },
                              { r: '1:1', i: 'w-4 h-4' },
                            ]
                          : [
                              { r: '16:9', i: 'w-6 h-3.5' },
                              { r: '9:16', i: 'w-3.5 h-6' },
                              { r: '1:1', i: 'w-4 h-4' },
                              { r: '4:3', i: 'w-5 h-4' },
                              { r: '3:4', i: 'w-4 h-5' },
                              { r: '21:9', i: 'w-6 h-2.5' },
                            ]
                      ).map((item) => (
                        <button
                          key={item.r}
                          onClick={() => setVideoGenRatio(item.r)}
                          className={`flex flex-col items-center justify-center gap-2 py-3.5 rounded-xl border transition-all h-20 ${
                            videoGenRatio === item.r
                              ? 'bg-gray-100 border-gray-200'
                              : 'border-gray-100 hover:border-gray-200 bg-white'
                          }`}
                        >
                          <div
                            className={`border-[1.5px] border-gray-400 rounded-[2px] ${item.i} ${
                              videoGenRatio === item.r ? 'bg-gray-400' : 'bg-transparent'
                            }`}
                          />
                          <span className="text-[11px] font-bold text-gray-600">
                            {item.r}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                      Duration
                    </div>
                    <div className="flex gap-2">
                      {(
                        isSoraVideoModel
                          ? ['10s', '15s']
                          : videoGenModel === 'kling-3.0'
                            ? ['5s', '10s']
                            : ['4s', '6s', '8s']
                      ).map((sec) => (
                        <button
                          key={sec}
                          onClick={() => setVideoGenDuration(sec)}
                          className={`flex-1 py-2 text-[12px] font-bold rounded-xl border transition-all ${
                            videoGenDuration === sec
                              ? 'bg-gray-100 border-gray-200 text-black'
                              : 'bg-white border-gray-100 text-gray-400'
                          }`}
                        >
                          {sec}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {(creationMode === 'image' || creationMode === 'video') && (
            <>
              <div className="relative">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowModelPicker(!showModelPicker);
                    setShowRatioPicker(false);
                    setShowVideoSettingsDropdown(false);
                  }}
                  className={`w-9 h-9 flex items-center justify-center rounded-full transition-all border ${
                    showModelPicker
                      ? 'bg-black text-white border-black shadow-lg'
                      : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300 shadow-sm'
                  }`}
                >
                  {creationMode === 'video' ? (
                    <Activity size={18} strokeWidth={2} />
                  ) : (
                    <Banana size={18} strokeWidth={2} />
                  )}
                </button>
                {showModelPicker && (
                  <div className="absolute bottom-full right-0 mb-3 w-[260px] bg-white rounded-[24px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-gray-100 p-4 z-[100] animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="px-1 mb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      本次任务临时覆盖
                    </div>
                    <div className="px-1 mb-3 text-[11px] text-gray-500 leading-5">
                      设置映射：{activeMappingSummary}
                    </div>
                    <div className="flex flex-col gap-2.5">
                      <input
                        autoFocus
                        type="text"
                        value={creationMode === 'video' ? videoGenModel : preferredImageModel}
                        onChange={(event) => {
                          const value = event.target.value;
                          if (creationMode === 'video') {
                            setVideoGenModel(value as VideoModel);
                          } else {
                            setPreferredImageModel(value as ImageModel);
                          }
                          setAutoModelSelect(false);
                        }}
                        placeholder={`当前默认来自设置映射：${activePrimaryModel}`}
                        className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 hover:bg-white focus:bg-white rounded-xl text-[13px] font-bold text-gray-800 outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all placeholder:font-medium placeholder:text-gray-400"
                      />

                      <div className="flex flex-col gap-1 mt-1 max-h-[160px] overflow-y-auto pr-1 select-none custom-scrollbar">
                        {(creationMode === 'video' ? MODEL_OPTIONS.video : MODEL_OPTIONS.image).map(
                          (preset) => {
                            const isSelected =
                              (creationMode === 'video' && videoGenModel === preset.id) ||
                              (creationMode === 'image' &&
                                preferredImageModel === preset.id);

                            return (
                              <button
                                key={preset.id}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  if (creationMode === 'video') {
                                    setVideoGenModel(preset.id as VideoModel);
                                  } else {
                                    setPreferredImageModel(preset.id as ImageModel);
                                  }
                                  setAutoModelSelect(false);
                                  setShowModelPicker(false);
                                }}
                                className={`text-left px-3 py-2.5 rounded-xl transition-all w-full flex items-center justify-between group ${
                                  isSelected ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-700'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={`w-6 h-6 rounded-md flex items-center justify-center ${
                                      isSelected
                                        ? 'bg-white/10 text-white'
                                        : 'bg-white shadow-sm border border-gray-100 text-gray-600'
                                    }`}
                                  >
                                    <preset.icon size={13} strokeWidth={2.5} />
                                  </div>
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={`text-[13px] font-bold ${
                                          isSelected
                                            ? 'text-white'
                                            : 'text-gray-900 group-hover:text-black'
                                        }`}
                                      >
                                        {preset.name}
                                      </span>
                                      {preset.badge && (
                                        <span
                                          className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                                            isSelected
                                              ? 'bg-white/20 text-white'
                                              : 'bg-blue-50 text-blue-500 border border-blue-100/50'
                                          }`}
                                        >
                                          {preset.badge}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {isSelected && <Check size={14} className="text-white shrink-0" />}
                              </button>
                            );
                          },
                        )}
                      </div>

                      <div className="text-[10px] text-gray-400 font-medium px-1 leading-relaxed mt-1">
                        默认会优先读取设置里的模型映射；这里选择的是本次任务的临时覆盖模型。若未找到通道可能导致响应失败。
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {creationMode === 'image' && (
                  <>
                    <div className="relative">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          setShowImageCountPicker(!showImageCountPicker);
                          setShowModelPicker(false);
                          setShowRatioPicker(false);
                          setShowVideoSettingsDropdown(false);
                        }}
                        className={`h-8 px-2.5 rounded-full text-[11px] font-bold border transition inline-flex items-center gap-1.5 ${
                          showImageCountPicker
                            ? 'bg-gray-100 text-gray-900 border-gray-300'
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                        }`}
                        title="选择本次生成图片数量"
                      >
                        <span>{imageGenCount}张</span>
                        <ChevronDown
                          size={12}
                          className={`transition-transform ${
                            showImageCountPicker ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {showImageCountPicker && (
                        <div
                          onClick={(event) => event.stopPropagation()}
                          className="absolute bottom-full right-0 mb-3 w-[132px] bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-gray-100 p-2 z-[90]"
                        >
                          <div className="grid grid-cols-2 gap-2">
                            {([1, 2, 3, 4] as const).map((count) => (
                              <button
                                key={count}
                                onClick={() => {
                                  setImageGenCount(count);
                                  setShowImageCountPicker(false);
                                }}
                                className={`h-9 rounded-xl text-[12px] font-bold transition ${
                                  imageGenCount === count
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                {count}张
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setTranslatePromptToEnglish(!translatePromptToEnglish)}
                      className={`h-8 px-2.5 rounded-full text-[11px] font-bold border transition ${
                        translatePromptToEnglish
                          ? 'bg-blue-50 text-blue-600 border-blue-200'
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                      title={
                        translatePromptToEnglish
                          ? '当前：提示词会翻译为英文'
                          : '当前：优先保留中文提示词'
                      }
                    >
                      英译
                    </button>
                    <button
                      onClick={() =>
                        setEnforceChineseTextInImage(!enforceChineseTextInImage)
                      }
                      className={`h-8 px-2.5 rounded-full text-[11px] font-bold border transition ${
                        enforceChineseTextInImage
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                      title={
                        enforceChineseTextInImage
                          ? '当前：强制画面文字为中文'
                          : '当前：不强制画面文字中文'
                      }
                    >
                      中文字
                    </button>
                    <input
                      type="text"
                      value={requiredChineseCopy}
                      onChange={(event) => setRequiredChineseCopy(event.target.value)}
                      placeholder="指定文案"
                      className="h-8 w-24 px-2 rounded-full border border-gray-200 text-[11px] font-medium text-gray-700 bg-white focus:outline-none focus:border-gray-400"
                      title="可选：指定画面中必须出现的中文文案"
                    />
                  </>
                )}
                <button
                  onClick={() =>
                    handleSend(
                      undefined,
                      imageGenUploads.length > 0 ? imageGenUploads : [],
                      undefined,
                      sendSkill,
                    )
                  }
                  disabled={
                    imageGenUploads.length === 0 &&
                    inputBlocks.every((block) => block.type === 'text' && !block.text)
                  }
                  className="h-9 pl-3 pr-4 rounded-full flex items-center gap-2 text-[13px] font-bold transition bg-[#f3f4f6] text-[#6b7280] hover:bg-gray-200 hover:text-gray-700 disabled:opacity-50"
                >
                  <Zap
                    size={14}
                    fill="currentColor"
                    strokeWidth={0}
                    className="text-blue-400"
                  />
                  <span>生成</span>
                </button>
              </div>
            </>
          )}

          {creationMode === 'agent' && (
            <>
              <div className="h-8 bg-gray-100 rounded-full flex items-center p-1 gap-1">
                <button
                  onClick={() => handleModeSwitch('thinking')}
                  className={`w-6 h-6 flex items-center justify-center rounded-full ${
                    modelMode === 'thinking' ? 'bg-white shadow-sm' : 'text-gray-400'
                  }`}
                >
                  <Lightbulb size={14} />
                </button>
                <button
                  onClick={() => handleModeSwitch('fast')}
                  className={`w-6 h-6 flex items-center justify-center rounded-full ${
                    modelMode === 'fast' ? 'bg-white shadow-sm' : 'text-gray-400'
                  }`}
                >
                  <Zap size={14} />
                </button>
              </div>
              <button
                onClick={() => setWebEnabled(!webEnabled)}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  webEnabled ? 'text-blue-500' : 'text-gray-500'
                }`}
              >
                <Globe size={16} />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowModelPreference(!showModelPreference)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500"
                >
                  <Box size={16} />
                </button>
                {showModelPreference && (
                  <div className="absolute bottom-full right-0 mb-4 w-[350px] bg-white rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-gray-100 z-50 p-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[17px] font-bold tracking-tight text-gray-900 font-display">
                        模型偏好
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          自动选择
                        </span>
                        <button
                          onClick={() => setAutoModelSelect(!autoModelSelect)}
                          className={`w-11 h-6 rounded-full transition-all duration-300 relative ${
                            autoModelSelect ? 'bg-black' : 'bg-gray-200 p-0.5'
                          }`}
                        >
                          <motion.div
                            animate={{ x: autoModelSelect ? 24 : 2 }}
                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="flex bg-gray-100/60 rounded-2xl p-1.5 mb-6">
                      {['image', 'video', '3d'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() =>
                            setModelPreferenceTab(tab as 'image' | 'video' | '3d')
                          }
                          className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all duration-300 uppercase tracking-wider ${
                            modelPreferenceTab === tab
                              ? 'bg-white text-black shadow-sm'
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-4 px-1 pb-2">
                      <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          设置映射
                        </div>
                        <div className="mt-2 text-[12px] font-semibold text-gray-700 leading-6">
                          图像：{mappedImageSummary}
                        </div>
                        <div className="text-[12px] font-semibold text-gray-700 leading-6">
                          视频：{mappedVideoSummary}
                        </div>
                        <div className="text-[12px] font-semibold text-gray-700 leading-6">
                          文本：{mappedScriptSummary}
                        </div>
                      </div>
                      <div className="text-[11px] font-bold text-gray-600 uppercase">
                        {modelPreferenceTab === 'image'
                          ? '图像'
                          : modelPreferenceTab === 'video'
                            ? '视频'
                            : '3D'}{' '}
                        生成调度模型
                      </div>
                      <input
                        type="text"
                        value={
                          modelPreferenceTab === 'image'
                            ? preferredImageModel
                            : modelPreferenceTab === 'video'
                              ? preferredVideoModel
                              : preferred3DModel
                        }
                        onChange={(event) => {
                          const value = event.target.value;
                          if (modelPreferenceTab === 'image') {
                            setPreferredImageModel(value as ImageModel);
                          } else if (modelPreferenceTab === 'video') {
                            setPreferredVideoModel(value as VideoModel);
                          } else {
                            setPreferred3DModel(value);
                          }
                          setAutoModelSelect(false);
                        }}
                        placeholder={`当前映射：${
                          modelPreferenceTab === 'image'
                            ? mappedImageSummary
                            : modelPreferenceTab === 'video'
                              ? mappedVideoSummary
                              : '未配置'
                        }`}
                        className={`w-full px-4 py-3 bg-gray-50/50 border hover:bg-white focus:bg-white rounded-xl text-[13px] text-gray-800 font-bold outline-none focus:ring-4 focus:ring-black/5 transition-all ${
                          !autoModelSelect
                            ? 'border-black'
                            : 'border-gray-200 focus:border-black'
                        }`}
                      />

                      <div className="flex flex-col gap-1.5 mt-2 max-h-[220px] overflow-y-auto pr-2 select-none custom-scrollbar border-b border-gray-100 pb-4">
                        {(
                          modelPreferenceTab === 'video'
                            ? MODEL_OPTIONS.video
                            : modelPreferenceTab === 'image'
                              ? MODEL_OPTIONS.image
                              : MODEL_OPTIONS['3d']
                        ).map((preset) => {
                          const isSelected =
                            (modelPreferenceTab === 'video' &&
                              preferredVideoModel === preset.id) ||
                            (modelPreferenceTab === 'image' &&
                              preferredImageModel === preset.id) ||
                            (modelPreferenceTab === '3d' &&
                              preferred3DModel === preset.id);

                          return (
                            <button
                              key={preset.id}
                              onClick={(event) => {
                                event.stopPropagation();
                                if (modelPreferenceTab === 'video') {
                                  setPreferredVideoModel(preset.id as VideoModel);
                                } else if (modelPreferenceTab === 'image') {
                                  setPreferredImageModel(preset.id as ImageModel);
                                } else {
                                  setPreferred3DModel(preset.id);
                                }
                                setAutoModelSelect(false);
                                setShowModelPreference(false);
                              }}
                              className={`text-left p-3 rounded-2xl transition-all border ${
                                isSelected
                                  ? 'bg-gray-50/80 border-gray-200/60 shadow-sm'
                                  : 'bg-transparent border-transparent hover:bg-gray-50/50 hover:border-gray-100'
                              }`}
                            >
                              <div className="flex gap-3">
                                <div
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? 'bg-black text-white shadow-sm'
                                      : 'bg-white border border-gray-200 text-gray-700 shadow-sm'
                                  }`}
                                >
                                  <preset.icon size={16} strokeWidth={2} />
                                </div>
                                <div className="flex flex-col flex-1 min-w-0 justify-center">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`text-[14px] font-bold ${
                                          isSelected ? 'text-gray-900' : 'text-gray-700'
                                        }`}
                                      >
                                        {preset.name}
                                      </span>
                                      {preset.badge && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-blue-50 text-blue-500 border border-blue-100/50">
                                          {preset.badge}
                                        </span>
                                      )}
                                    </div>
                                    {isSelected && (
                                      <div className="w-5 h-5 rounded-md bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                                        <Check
                                          size={12}
                                          className="text-black"
                                          strokeWidth={3}
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500 font-medium truncate">
                                    {preset.desc}
                                  </span>
                                  {preset.time && (
                                    <div className="mt-1.5 flex items-center">
                                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100/80 px-1.5 py-0.5 rounded-md">
                                        {preset.time}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <p className="text-[11px] text-gray-400 font-medium leading-relaxed pt-2">
                        绕过原有选择限制。系统将会将您的请求调度至设定的模型。填入的值须确保您绑定的
                        API 供应商提供支持。
                        <br />
                        若在特定任务中由于未找到模型导致失败，重试前请核对模型标识符。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files) {
            handlePickedFiles(Array.from(event.target.files));
          }
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
      />
    </>
  );
};
