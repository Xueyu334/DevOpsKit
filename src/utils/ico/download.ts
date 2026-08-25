/**
 * 将 Blob 数据触发为浏览器本地文件下载，并在下载完成后安全释放 ObjectURL
 *
 * @param blob 待下载的 Blob 数据对象
 * @param filename 下载保存的文件名（例如 logo.ico）
 */
export function downloadBlob(blob: Blob, filename: string): void {
  if (!blob) {
    throw new Error('下载失败：Blob 对象为空')
  }

  const safeFilename = filename.trim() || 'favicon.ico'
  const objectUrl = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.style.display = 'none'
  link.href = objectUrl
  link.download = safeFilename

  // 兼容 Firefox 等浏览器的 DOM 挂载
  document.body.appendChild(link)
  link.click()

  // 延迟清理，保证下载请求已被浏览器成功捕获
  setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(objectUrl)
  }, 1000)
}
