export const useCopyText = (defaultOptions = {}) => {
  const { copy, isSupported } = useClipboard()

  const copyText = async (text, options = {}) => {
    if (!text) {
      return false
    }

    const settings = {
      successMessage: '已复制到剪贴板',
      errorMessage: '复制失败，请手动复制',
      unsupportedMessage: '当前环境不支持剪贴板复制',
      ...defaultOptions,
      ...options
    }

    if (!isSupported.value) {
      if (settings.unsupportedMessage) {
        ElMessage.error(settings.unsupportedMessage)
      }
      return false
    }

    try {
      await copy(text)
      if (settings.successMessage) {
        ElMessage.success(settings.successMessage)
      }
      return true
    } catch {
      if (settings.errorMessage) {
        ElMessage.error(settings.errorMessage)
      }
      return false
    }
  }

  return {
    copyText,
    isCopySupported: isSupported
  }
}
