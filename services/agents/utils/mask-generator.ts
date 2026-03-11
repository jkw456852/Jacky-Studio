/**
 * 根据 MarkerInfo 生成二值遮罩 (Inpainting Mask)
 * MarkerInfo 包含起始图的大小和标记框的相对坐标
 */

export interface MarkerInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

/**
 * 创建一个二值遮罩 (PNG DataURL)
 * 黑色 (#000000) = 锁定区域
 * 白色 (#FFFFFF) = 可编辑区域
 */
export async function createMaskDataUrl(info: MarkerInfo): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = info.originalWidth;
  canvas.height = info.originalHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // 1. 填充背景为黑色 (锁定不可变)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. 绘制白色矩形覆盖标记区域 (可编辑)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(info.x, info.y, info.width, info.height);

  return canvas.toDataURL('image/png');
}
