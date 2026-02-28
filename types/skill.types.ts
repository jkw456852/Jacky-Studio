import { ImageModel, VideoModel } from './common';

export interface ImageGenSkillParams {
  prompt: string;
  model: ImageModel;
  aspectRatio: string;
  imageSize?: '1K' | '2K' | '4K';
  referenceImage?: string;
  referenceImages?: string[];
  brandContext?: {
    colors?: string[];
    style?: string;
  };
}

export interface VideoGenSkillParams {
  prompt: string;
  model: VideoModel;
  aspectRatio: string;
  startFrame?: string;
  endFrame?: string;
  referenceImages?: string[];
}

export interface TextExtractSkillParams {
  imageData: string;
}

export interface RegionAnalyzeSkillParams {
  imageData: string;
  regionPrompt: string;
}

export interface TouchEditSkillParams {
  imageData: string;
  regionX: number;
  regionY: number;
  regionWidth: number;
  regionHeight: number;
  editInstruction: string;
}
