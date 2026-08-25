import type { ImageToIcoOptions, RenderedIconFrame } from './types'
import {
  validateImageFile,
  parseImageInfo,
  renderFramesForSizes,
  MAX_FILE_SIZE_BYTES,
  isSvgFile
} from './image'
import { encodeIco } from './encoder'
import { downloadBlob } from './download'

export * from './types'
export {
  validateImageFile,
  parseImageInfo,
  renderFramesForSizes,
  encodeIco,
  downloadBlob,
  MAX_FILE_SIZE_BYTES,
  isSvgFile
}

/** 默认推荐生成的 ICO 尺寸列表 */
export const DEFAULT_ICO_SIZES: number[] = [16, 32, 48, 64, 128, 256]

/**
 * 纯前端将图片或 SVG 文件转换为符合微软标准的多尺寸 .ico 格式 Blob
 *
 * @param file 输入的图片 File 对象 (.png, .jpg, .jpeg, .webp, .svg)
 * @param options 转换配置选项（如指定生成的尺寸列表）
 * @returns 生成的 ICO 格式 Blob 对象
 *
 * @example
 * ```ts
 * const icoBlob = await imageToIco(file, { sizes: [16, 32, 48, 64, 128, 256] })
 * downloadBlob(icoBlob, 'favicon.ico')
 * ```
 */
export async function imageToIco(
  file: File,
  options?: ImageToIcoOptions
): Promise<Blob> {
  // 1. 基础校验
  const validation = validateImageFile(file)
  if (!validation.valid) {
    throw new Error(validation.error || '文件校验失败')
  }

  // 2. 解析尺寸配置
  const sizes =
    options?.sizes && options.sizes.length > 0
      ? [...new Set(options.sizes)].sort((a, b) => a - b)
      : DEFAULT_ICO_SIZES

  // 3. 渲染各尺寸图像数据帧
  const frames: RenderedIconFrame[] = await renderFramesForSizes(file, sizes)

  // 4. 将各尺寸 PNG 帧编码封装为 ICO 二进制数据
  const icoBlob = encodeIco(frames)

  // 5. 清理生成的临时帧 ObjectURL
  for (const frame of frames) {
    if (frame.previewUrl) {
      URL.revokeObjectURL(frame.previewUrl)
    }
  }

  return icoBlob
}
