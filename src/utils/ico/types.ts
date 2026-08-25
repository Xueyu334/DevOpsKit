/**
 * ICO 生成预设常见尺寸
 */
export type IcoPresetSize = 16 | 32 | 48 | 64 | 128 | 256

/**
 * imageToIco 转换选项
 */
export interface ImageToIcoOptions {
  /**
   * 需要打包到 ICO 中的尺寸列表（像素），例如 [16, 32, 48, 64, 128, 256]
   * 默认：[16, 32, 48, 64, 128, 256]
   */
  sizes?: number[]
}

/**
 * 解析后的原始图像信息
 */
export interface ParsedImageInfo {
  /** 原始文件名 */
  name: string
  /** 文件大小（字节） */
  size: number
  /** MIME 类型 */
  type: string
  /** 原始宽度（像素） */
  width: number
  /** 原始高度（像素） */
  height: number
  /** 预览 URL (DataURL 或 BlobURL) */
  previewUrl: string
  /** 是否为 SVG 文件 */
  isSvg: boolean
  /** 原始 File 句柄 */
  rawFile: File
}

/**
 * 渲染生成的单个尺寸图标数据帧
 */
export interface RenderedIconFrame {
  /** 目标方形边长（例如 32 代表 32x32） */
  size: number
  /** 实际绘制宽度 */
  width: number
  /** 实际绘制高度 */
  height: number
  /** PNG 格式的二进制字节数据 */
  pngData: Uint8Array
  /** PNG 格式的 Blob 对象 */
  blob: Blob
  /** 单个尺寸图标的预览 DataURL/BlobURL（可选） */
  previewUrl?: string
}

/**
 * ICO 文件头部 (ICONDIR - 6 字节)
 */
export interface IconDirHeader {
  /** 保留字段，必须为 0 */
  reserved: number
  /** 资源类型：1 表示图标 (.ico)，2 表示光标 (.cur) */
  type: number
  /** 包含的图像总数 */
  count: number
}

/**
 * ICO 目录项 (ICONDIRENTRY - 16 字节)
 */
export interface IconDirEntry {
  /** 图标宽度（像素，256 时写入 0） */
  width: number
  /** 图标高度（像素，256 时写入 0） */
  height: number
  /** 调色板颜色数（32 位/PNG 设为 0） */
  colorCount: number
  /** 保留字段，必须为 0 */
  reserved: number
  /** 颜色平面数，通常为 1 */
  planes: number
  /** 像素位数，PNG RGBA 设为 32 */
  bitCount: number
  /** 该尺寸图像数据的字节大小 */
  bytesInRes: number
  /** 图像数据相对于文件开头的字节偏移量 */
  imageOffset: number
}
