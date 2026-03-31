import {md5, sha1, sha256, sha384, sha512} from 'hash-wasm'
import {readonly, shallowRef} from 'vue'

export const hashAlgorithmOptions = Object.freeze([
    {value: 'md5', label: 'MD5', digestSize: 128, description: '兼容性高，适合非安全校验场景'},
    {value: 'sha1', label: 'SHA-1', digestSize: 160, description: '老算法，适合兼容存量系统'},
    {value: 'sha256', label: 'SHA-256', digestSize: 256, description: '通用默认选择，兼顾安全性与性能'},
    {value: 'sha384', label: 'SHA-384', digestSize: 384, description: '比 SHA-256 更长的摘要结果'},
    {value: 'sha512', label: 'SHA-512', digestSize: 512, description: '更长摘要，适合高强度完整性校验'}
])

const hashRunners = {
    md5,
    sha1,
    sha256,
    sha384,
    sha512
}

export const defaultHashAlgorithms = ['md5']

/**
 * 根据指定的哈希算法名称获取对应的算法元数据。
 *
 * @param {string} algorithm - 哈希算法名称，例如 "SHA-256" 或 "MD5"。
 * @returns {Object|undefined} 返回与算法名称匹配的元数据对象，如果未找到匹配项则返回 undefined。
 */
export const getHashAlgorithmMeta = (algorithm) => {
    return hashAlgorithmOptions.find((item) => item.value === algorithm)
}

/**
 * `useHashGenerator` 是一个用于计算文本哈希摘要的自定义组合函数。它提供了内部状态及方法来支持哈希计算过程。
 *
 * @module useHashGenerator
 *
 * @description
 * 1. 管理哈希计算相关的状态，包括结果列表 (`results`)、加载状态 (`loading`) 和错误信息 (`errorMessage`)。
 * 2. 提供重置结果列表的方法 (`resetResults`)。
 * 3. 提供异步计算哈希摘要的方法 (`calculateHashes`)，支持多个算法并返回相关摘要。
 *
 * @property {Object[]} results 只读的结果列表，每个元素包含算法信息、摘要值、摘要大小和算法描述。
 * @property {boolean} loading 只读的加载状态，用于指示当前是否正在处理哈希计算。
 * @property {string} errorMessage 只读的错误信息变量，用于存储当操作失败时的提示。
 *
 * @method calculateHashes 异步方法，接受文本和哈希算法列表并计算摘要。
 * @method resetResults 重置结果列表和错误信息，使其返回到初始状态。
 *
 * 注意：
 * - 引入了外部函数 `getHashAlgorithmMeta` 和 `hashRunners`，分别用于获取算法元信息和执行算法的具体实现。
 * - 需要在外部上下文中初始化相关依赖。
 */
export const useHashGenerator = () => {
    const results = shallowRef([])
    const loading = shallowRef(false)
    const errorMessage = shallowRef('')

    const resetResults = () => {
        results.value = []
        errorMessage.value = ''
    }

    /**
     * 异步计算文本的哈希摘要。
     *
     * @param {Object} options 包含计算摘要所需的参数。
     * @param {string} options.text 输入的文本内容，需要对其计算摘要。
     * @param {Array<string>} options.algorithms 算法名称数组，指定需要使用的哈希算法。
     * @returns {Promise<boolean>} 返回一个 Promise，表示哈希计算是否成功。在成功时返回 true，失败时返回 false。
     *
     * @throws {Error} 如果发生未知错误，会抛出异常，记录错误日志并返回错误提示信息。
     *
     * @description
     * 1. 确保用户提供了待计算的文本内容和至少一种摘要算法。
     * 2. 支持多种哈希算法，通过 `hashRunners` 动态调用相关算法的实现。
     * 3. 使用 `getHashAlgorithmMeta` 获取算法相关的元信息，如描述、摘要大小等。
     * 4. 在执行过程中，更新加载状态及错误信息变量。
     * 5. 处理完成后返回相应的结果列表，包括算法名称、摘要值、摘要大小和描述。
     * 6. 如果发生异常，会清空结果并提示用户稍后重试。
     *
     * 注意：加载状态 (`loading`)、错误信息 (`errorMessage`) 和结果列表 (`results`) 是外部变量，
     * 并需要在外部上下文内进行适当的定义和初始化。
     */
    const calculateHashes = async ({text, algorithms}) => {
        if (!text) {
            errorMessage.value = '请输入需要计算摘要的文本'
            results.value = []
            return false
        }
        if (!algorithms.length) {
            errorMessage.value = '请至少选择一种摘要算法'
            results.value = []
            return false
        }
        loading.value = true
        errorMessage.value = ''
        try {
            results.value = await Promise.all(
                algorithms.map(async (algorithm) => {
                    const meta = getHashAlgorithmMeta(algorithm)
                    const digest = await hashRunners[algorithm](text)
                    return {
                        algorithm,
                        label: meta?.label ?? algorithm.toUpperCase(),
                        digest,
                        digestSize: meta?.digestSize ?? digest.length * 4,
                        description: meta?.description ?? ''
                    }
                })
            )
            return true
        } catch (error) {
            console.error(error)
            results.value = []
            errorMessage.value = '摘要计算失败，请稍后重试'
            return false
        } finally {
            loading.value = false
        }
    }
    return {
        results: readonly(results),
        loading: readonly(loading),
        errorMessage: readonly(errorMessage),
        calculateHashes,
        resetResults
    }
}
