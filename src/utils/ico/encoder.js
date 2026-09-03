/**
 * 将多个尺寸的 PNG 图像数据编码组装为符合微软标准的 .ico 二进制 Blob
 *
 * ICO 文件二进制结构：
 * - ICONDIR (6 字节)
 * - ICONDIRENTRY[] (每个尺寸 16 字节)
 * - IMAGE_DATA[] (各尺寸 PNG 数据顺序排列)
 *
 * @param {Array<{ size: number, pngData: Uint8Array }>} frames 包含尺寸与 PNG 二进制数据的帧数组
 * @returns {Blob} image/x-icon 格式的 Blob 对象
 */
export function encodeIco(frames) {
  if (!frames || frames.length === 0) {
    throw new Error('无法生成 ICO：至少需要包含一个尺寸的图像数据')
  }

  const count = frames.length
  const headerSize = 6
  const entrySize = 16
  const dirEntriesSize = count * entrySize
  const initialImageOffset = headerSize + dirEntriesSize

  // 1. 计算总字节大小
  let totalImageDataSize = 0
  for (const frame of frames) {
    totalImageDataSize += frame.pngData.byteLength
  }

  const totalFileSize = initialImageOffset + totalImageDataSize
  const buffer = new ArrayBuffer(totalFileSize)
  const view = new DataView(buffer)
  const byteView = new Uint8Array(buffer)

  // 2. 写入 ICONDIR 头部 (6 字节, Little-Endian)
  // Reserved: 必须为 0 (2 字节)
  view.setUint16(0, 0, true)
  // Type: 1 代表 ICO 资源类型 (2 字节)
  view.setUint16(2, 1, true)
  // Count: 包含的图标数量 (2 字节)
  view.setUint16(4, count, true)

  // 3. 写入各个 ICONDIRENTRY 目录项并拷贝 PNG 数据
  let currentImageOffset = initialImageOffset

  for (let i = 0; i < count; i++) {
    const frame = frames[i]
    const entryOffset = headerSize + i * entrySize
    const imageSize = frame.pngData.byteLength

    // ICO 规范：尺寸为 256 像素时需写入 0
    const widthVal = frame.size >= 256 ? 0 : frame.size
    const heightVal = frame.size >= 256 ? 0 : frame.size

    // bWidth: 宽度 0-255 (1 字节)
    view.setUint8(entryOffset + 0, widthVal)
    // bHeight: 高度 0-255 (1 字节)
    view.setUint8(entryOffset + 1, heightVal)
    // bColorCount: 调色板颜色数，PNG/32位为 0 (1 字节)
    view.setUint8(entryOffset + 2, 0)
    // bReserved: 保留字必须为 0 (1 字节)
    view.setUint8(entryOffset + 3, 0)
    // wPlanes: 颜色平面数，通常为 1 (2 字节)
    view.setUint16(entryOffset + 4, 1, true)
    // wBitCount: 像素位深，PNG RGBA 为 32 (2 字节)
    view.setUint16(entryOffset + 6, 32, true)
    // dwBytesInRes: 该尺寸资源数据的字节长度 (4 字节)
    view.setUint32(entryOffset + 8, imageSize, true)
    // dwImageOffset: 该尺寸资源数据相对于文件开头的字节偏移量 (4 字节)
    view.setUint32(entryOffset + 12, currentImageOffset, true)

    // 拷贝 PNG 数据到对应的偏移位置
    byteView.set(frame.pngData, currentImageOffset)

    // 累加下一个图像的偏移量
    currentImageOffset += imageSize
  }

  return new Blob([buffer], { type: 'image/x-icon' })
}
