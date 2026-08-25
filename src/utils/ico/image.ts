import type { ParsedImageInfo, RenderedIconFrame } from './types'

/** 支持的输入文件 MIME 类型及扩展名映射 */
const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.svg']
const SUPPORTED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/pjpeg',
  'image/webp',
  'image/svg+xml'
]

/** 单文件默认最大限制：20 MB */
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024

/**
 * 校验上传的文件是否为支持的图片格式及大小
 *
 * @param file 待校验的 File 对象
 * @param maxSizeBytes 最大文件限制（字节，默认 20MB）
 * @returns 校验结果及错误描述
 */
export function validateImageFile(
  file: File,
  maxSizeBytes: number = MAX_FILE_SIZE_BYTES
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: '请选择需要转换的文件' }
  }

  if (file.size > maxSizeBytes) {
    const maxMB = Math.round(maxSizeBytes / (1024 * 1024))
    return { valid: false, error: `文件大小超过限制，单文件最大支持 ${maxMB} MB` }
  }

  const nameLower = file.name.toLowerCase()
  const hasValidExt = SUPPORTED_EXTENSIONS.some(ext => nameLower.endsWith(ext))
  const hasValidMime = file.type ? SUPPORTED_MIME_TYPES.includes(file.type.toLowerCase()) : false

  if (!hasValidExt && !hasValidMime) {
    return {
      valid: false,
      error: '不支持的文件格式，仅支持 .png, .jpg, .jpeg, .webp, .svg'
    }
  }

  return { valid: true }
}

/**
 * 检查文件是否为 SVG
 */
export function isSvgFile(file: File): boolean {
  return (
    file.type.toLowerCase() === 'image/svg+xml' ||
    file.name.toLowerCase().endsWith('.svg')
  )
}

/**
 * 处理 SVG 字符串，补全缺失的 width / height / viewBox / xmlns，并提升渲染分辨率基准，确保在各尺寸下极致清晰
 */
function normalizeSvgXml(svgText: string): {
  normalizedSvg: string
  width: number
  height: number
} {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgText, 'image/svg+xml')
  const svgEl = doc.querySelector('svg')

  if (!svgEl) {
    throw new Error('无效的 SVG 文件内容')
  }

  // 确保 xmlns 命名空间存在
  if (!svgEl.getAttribute('xmlns')) {
    svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  }

  let width = parseFloat(svgEl.getAttribute('width') || '0')
  let height = parseFloat(svgEl.getAttribute('height') || '0')
  const viewBox = svgEl.getAttribute('viewBox')

  if (viewBox) {
    const parts = viewBox
      .trim()
      .split(/[\s,]+/)
      .map(Number)
    if (parts.length === 4 && !isNaN(parts[2]) && !isNaN(parts[3])) {
      const vbWidth = parts[2]
      const vbHeight = parts[3]
      if (width <= 0 || isNaN(width)) width = vbWidth
      if (height <= 0 || isNaN(height)) height = vbHeight
    }
  }

  // 如果仍无宽高，赋予默认基准尺寸 (512x512)
  if (width <= 0 || isNaN(width) || height <= 0 || isNaN(height)) {
    width = 512
    height = 512
    if (!viewBox) {
      svgEl.setAttribute('viewBox', '0 0 512 512')
    }
  } else if (!viewBox) {
    // 确保有 viewBox 保证矢量缩放不失真
    svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`)
  }

  // 优化：将 SVG 根节点的渲染尺寸提升至高清基准 (最高 1024)，避免小尺寸 SVG 在大 Canvas 上栅格化模糊
  const maxDim = Math.max(width, height)
  const scale = maxDim < 1024 ? 1024 / maxDim : 1
  const renderWidth = Math.round(width * scale)
  const renderHeight = Math.round(height * scale)

  svgEl.setAttribute('width', String(renderWidth))
  svgEl.setAttribute('height', String(renderHeight))

  const serializer = new XMLSerializer()
  return {
    normalizedSvg: serializer.serializeToString(doc),
    width: Math.round(width),
    height: Math.round(height)
  }
}

/**
 * 解析并读取上传的图片/SVG 信息
 *
 * @param file 上传的 File 对象
 * @returns ParsedImageInfo 包含尺寸、预览 DataURL 等信息
 */
export async function parseImageInfo(file: File): Promise<ParsedImageInfo> {
  const isSvg = isSvgFile(file)

  if (isSvg) {
    const text = await file.text()
    const { normalizedSvg, width, height } = normalizeSvgXml(text)
    const svgBlob = new Blob([normalizedSvg], {
      type: 'image/svg+xml;charset=utf-8'
    })
    const previewUrl = URL.createObjectURL(svgBlob)

    return {
      name: file.name,
      size: file.size,
      type: file.type || 'image/svg+xml',
      width: Math.round(width),
      height: Math.round(height),
      previewUrl,
      isSvg: true,
      rawFile: file
    }
  }

  // 非 SVG 文件（PNG, JPG, WebP）
  const objectUrl = URL.createObjectURL(file)
  try {
    const dimensions = await getImageDimensionsFromUrl(objectUrl)
    return {
      name: file.name,
      size: file.size,
      type: file.type || 'image/png',
      width: dimensions.width,
      height: dimensions.height,
      previewUrl: objectUrl,
      isSvg: false,
      rawFile: file
    }
  } catch (error) {
    URL.revokeObjectURL(objectUrl)
    throw error
  }
}

/**
 * 通过 URL 异步加载 Image 获取自然宽高
 */
function getImageDimensionsFromUrl(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height
      })
    }
    img.onerror = () => {
      reject(new Error('图片加载失败，请检查文件是否损坏'))
    }
    img.src = url
  })
}

/**
 * 异步加载 Image 元素
 */
export function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('加载图像元素失败'))
    img.src = url
  })
}

/**
 * 等比居中绘制图像到指定大小的 Canvas 上
 *
 * @param sourceImage 图像源 (HTMLImageElement)
 * @param sourceWidth 原图宽度
 * @param sourceHeight 原图高度
 * @param targetSize 目标正方形边长 (px)
 * @returns 渲染完成的 HTMLCanvasElement
 */
export function renderAspectFitToCanvas(
  sourceImage: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  targetSize: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = targetSize
  canvas.height = targetSize

  const ctx = canvas.getContext('2d', { willReadFrequently: false })
  if (!ctx) {
    throw new Error('无法创建 Canvas 2D 上下文')
  }

  // 1. 清空画布，保持默认完全透明
  ctx.clearRect(0, 0, targetSize, targetSize)

  // 2. 开启高质量平滑渲染
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // 3. 计算等比缩放与居中坐标
  const scale = Math.min(targetSize / sourceWidth, targetSize / sourceHeight)
  const drawWidth = Math.max(1, Math.round(sourceWidth * scale))
  const drawHeight = Math.max(1, Math.round(sourceHeight * scale))

  const dx = Math.round((targetSize - drawWidth) / 2)
  const dy = Math.round((targetSize - drawHeight) / 2)

  // 4. 绘制居中图像
  ctx.drawImage(sourceImage, dx, dy, drawWidth, drawHeight)

  return canvas
}

/**
 * 将 Canvas 转为 PNG 格式的 Blob 和 Uint8Array
 */
export async function canvasToPngData(
  canvas: HTMLCanvasElement
): Promise<{ blob: Blob; bytes: Uint8Array }> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async blob => {
      if (!blob) {
        reject(new Error('Canvas 导出 PNG Blob 失败'))
        return
      }
      try {
        const buffer = await blob.arrayBuffer()
        resolve({
          blob,
          bytes: new Uint8Array(buffer)
        })
      } catch (err) {
        reject(err)
      }
    }, 'image/png')
  })
}

/**
 * 针对所有目标尺寸渲染出图标数据帧 (RenderedIconFrame)
 *
 * @param file 源文件
 * @param sizes 目标尺寸数组，例如 [16, 32, 48, 64, 128, 256]
 * @returns 渲染完成的所有帧列表
 */
export async function renderFramesForSizes(
  file: File,
  sizes: number[]
): Promise<RenderedIconFrame[]> {
  if (!sizes || sizes.length === 0) {
    throw new Error('至少需要选择一个 ICO 尺寸')
  }

  const isSvg = isSvgFile(file)
  let workingUrl = ''
  let needRevokeWorkingUrl = false

  try {
    let sourceWidth = 0
    let sourceHeight = 0

    if (isSvg) {
      const text = await file.text()
      const { normalizedSvg, width, height } = normalizeSvgXml(text)
      sourceWidth = width
      sourceHeight = height
      const svgBlob = new Blob([normalizedSvg], {
        type: 'image/svg+xml;charset=utf-8'
      })
      workingUrl = URL.createObjectURL(svgBlob)
      needRevokeWorkingUrl = true
    } else {
      workingUrl = URL.createObjectURL(file)
      needRevokeWorkingUrl = true
      const dim = await getImageDimensionsFromUrl(workingUrl)
      sourceWidth = dim.width
      sourceHeight = dim.height
    }

    const imageElement = await loadImageElement(workingUrl)
    const frames: RenderedIconFrame[] = []

    for (const size of sizes) {
      const canvas = renderAspectFitToCanvas(
        imageElement,
        sourceWidth,
        sourceHeight,
        size
      )

      const { blob, bytes } = await canvasToPngData(canvas)
      const previewUrl = URL.createObjectURL(blob)

      frames.push({
        size,
        width: size,
        height: size,
        pngData: bytes,
        blob,
        previewUrl
      })

      // 释放 Canvas 引用
      canvas.width = 0
      canvas.height = 0
    }

    return frames
  } finally {
    if (needRevokeWorkingUrl && workingUrl) {
      URL.revokeObjectURL(workingUrl)
    }
  }
}
