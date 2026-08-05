import dayjs from 'dayjs'

// Base64URL 解码转换为标准 Base64 字符串
export function base64UrlToBase64(base64Url) {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4 !== 0) {
    base64 += '='
  }
  return base64
}

// 标准 Base64 转换为 Base64URL 字符串
export function base64ToBase64Url(base64) {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// 安全的 UTF-8 Base64URL 解码
export function decodeBase64Url(base64Url) {
  try {
    const base64 = base64UrlToBase64(base64Url)
    const binaryStr = atob(base64)
    const bytes = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i)
    }
    return new TextDecoder().decode(bytes)
  } catch {
    throw new Error('Base64URL 解码失败')
  }
}

// 安全的 UTF-8 字符串编码为 Base64URL
export function encodeBase64Url(str) {
  const bytes = new TextEncoder().encode(str)
  let binaryStr = ''
  for (let i = 0; i < bytes.length; i++) {
    binaryStr += String.fromCharCode(bytes[i])
  }
  const base64 = btoa(binaryStr)
  return base64ToBase64Url(base64)
}

// Uint8Array 转为 Base64URL 字符串
export function bytesToBase64Url(bytes) {
  let binaryStr = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binaryStr += String.fromCharCode(bytes[i])
  }
  return base64ToBase64Url(btoa(binaryStr))
}

// Base64 或 Base64URL 转 Uint8Array
export function base64ToBytes(base64Str) {
  const normalized = base64UrlToBase64(base64Str)
  const binaryStr = atob(normalized)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }
  return bytes
}

// 格式化时间戳 (秒)
function formatTimestamp(timestampSec) {
  if (typeof timestampSec !== 'number' || isNaN(timestampSec)) return null
  const date = dayjs.unix(timestampSec)
  if (!date.isValid()) return null
  return date.format('YYYY-MM-DD HH:mm:ss')
}

// 示例样本 Token
export const PRESET_JWTS = [
  {
    label: '示例 1: HS256 基础用户样本',
    secret: 'your-256-bit-secret',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkRldk9wc0tpdCBVc2VyIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoyNTI0NjA4MDAwfQ.XbP2Azz9zzaA5WoJJDm_XVyXAOOzEVI45n4L2nZ3180'
  },
  {
    label: '示例 2: 完整包含 RFC 7519 7个标准字段 (iss/sub/aud/exp/nbf/iat/jti)',
    secret: 'your-256-bit-secret',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2Rldm9wc2tpdC5jb20iLCJzdWIiOiJ1c2VyXzEyMzQ1NiIsImF1ZCI6ImRldm9wc2tpdC1hcHAiLCJleHAiOjI1MjQ2MDgwMDAsIm5iZiI6MTUxNjIzOTAyMiwiaWF0IjoxNTE2MjM5MDIyLCJqdGkiOiJqd3RfYjA4MDUxNl9zYW1wbGUifQ.X-K3K095QW_YIlyvj-sWc2dY7JzS7BfA2l1M1N3z4z8'
  },
  {
    label: '示例 3: 常见用户身份与权限 Claims',
    secret: 'secret-key-123456',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c3JfOTkwOCIsImVtYWlsIjoidXNlckBkZXZvcHNraXQuY29tIiwicm9sZXMiOlsiYWRtaW4iLCJkZXZlbG9wZXIiXSwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjI1MDAwMDAwMDB9.S31b1w9r1p5hY4L2aZ9kX8j7m6n5b4v3c2x1z0y9a8b'
  }
]

export const STANDARD_CLAIMS_DOC = [
  { key: 'iss', name: 'Issuer', desc: '签发者' },
  { key: 'sub', name: 'Subject', desc: '主题，一般放用户ID' },
  { key: 'aud', name: 'Audience', desc: '接收方' },
  { key: 'exp', name: 'Expiration', desc: '过期时间' },
  { key: 'nbf', name: 'Not Before', desc: '生效时间' },
  { key: 'iat', name: 'Issued At', desc: '签发时间' },
  { key: 'jti', name: 'JWT ID', desc: '唯一编号' }
]

export function useJwt() {
  // 解析 Token 结构
  const parseJwt = tokenStr => {
    if (!tokenStr || typeof tokenStr !== 'string') {
      return {
        isValidFormat: false,
        parts: [],
        headerRaw: '',
        payloadRaw: '',
        signatureRaw: '',
        headerObj: null,
        payloadObj: null,
        headerFormatted: '',
        payloadFormatted: '',
        error: '请输入有效的 JWT Token'
      }
    }

    const cleanToken = tokenStr.trim()
    const parts = cleanToken.split('.')

    if (parts.length !== 3) {
      return {
        isValidFormat: false,
        parts,
        headerRaw: parts[0] || '',
        payloadRaw: parts[1] || '',
        signatureRaw: parts[2] || '',
        headerObj: null,
        payloadObj: null,
        headerFormatted: '',
        payloadFormatted: '',
        error: `JWT 必须包含 3 个由点号 "." 分隔的部分，当前识别到 ${parts.length} 部分`
      }
    }

    const [headerRaw, payloadRaw, signatureRaw] = parts
    let headerObj = null
    let payloadObj = null
    let headerFormatted = ''
    let payloadFormatted = ''
    let parseError = ''

    // 解析 Header
    try {
      const decodedHeader = decodeBase64Url(headerRaw)
      headerObj = JSON.parse(decodedHeader)
      headerFormatted = JSON.stringify(headerObj, null, 2)
    } catch {
      parseError = 'Header 无效或无法解析为 JSON'
    }

    // 解析 Payload
    try {
      const decodedPayload = decodeBase64Url(payloadRaw)
      payloadObj = JSON.parse(decodedPayload)
      payloadFormatted = JSON.stringify(payloadObj, null, 2)
    } catch {
      if (parseError) {
        parseError += '；Payload 也无法解析为 JSON'
      } else {
        parseError = 'Payload 无效或无法解析为 JSON'
      }
    }

    return {
      isValidFormat: !parseError,
      parts,
      headerRaw,
      payloadRaw,
      signatureRaw,
      headerObj,
      payloadObj,
      headerFormatted,
      payloadFormatted,
      error: parseError
    }
  }

  // 分析 Claims 属性与过期状态
  const analyzeClaims = payloadObj => {
    if (!payloadObj || typeof payloadObj !== 'object') {
      return { claims: [], expirationStatus: 'none', expFormatted: null, timeDiffText: '' }
    }

    const nowSec = Math.floor(Date.now() / 1000)
    let expirationStatus = 'none' // 'active', 'expired', 'none'
    let expFormatted = null
    let timeDiffText = ''

    if (typeof payloadObj.exp === 'number') {
      expFormatted = formatTimestamp(payloadObj.exp)
      const diffSec = payloadObj.exp - nowSec

      if (diffSec > 0) {
        expirationStatus = 'active'
        const days = Math.floor(diffSec / 86400)
        const hours = Math.floor((diffSec % 86400) / 3600)
        const minutes = Math.floor((diffSec % 3600) / 60)
        const seconds = diffSec % 60

        if (days > 0) {
          timeDiffText = `剩余 ${days} 天 ${hours} 小时`
        } else if (hours > 0) {
          timeDiffText = `剩余 ${hours} 小时 ${minutes} 分`
        } else if (minutes > 0) {
          timeDiffText = `剩余 ${minutes} 分 ${seconds} 秒`
        } else {
          timeDiffText = `剩余 ${seconds} 秒`
        }
      } else {
        expirationStatus = 'expired'
        const agoSec = Math.abs(diffSec)
        const days = Math.floor(agoSec / 86400)
        const hours = Math.floor((agoSec % 86400) / 3600)
        const minutes = Math.floor((agoSec % 3600) / 60)

        if (days > 0) {
          timeDiffText = `已过期 ${days} 天 ${hours} 小时`
        } else if (hours > 0) {
          timeDiffText = `已过期 ${hours} 小时 ${minutes} 分`
        } else {
          timeDiffText = `已过期 ${minutes} 分`
        }
      }
    }

    const standardClaims = [
      { key: 'iss', label: '签发者 (iss)', name: 'Issuer', desc: '签发者', value: payloadObj.iss },
      { key: 'sub', label: '主题 (sub)', name: 'Subject', desc: '主题，一般放用户ID', value: payloadObj.sub },
      { key: 'aud', label: '接收方 (aud)', name: 'Audience', desc: '接收方', value: payloadObj.aud },
      {
        key: 'exp',
        label: '过期时间 (exp)',
        name: 'Expiration',
        desc: '过期时间',
        value: payloadObj.exp ? `${formatTimestamp(payloadObj.exp)} (${timeDiffText})` : null
      },
      {
        key: 'nbf',
        label: '生效时间 (nbf)',
        name: 'Not Before',
        desc: '生效时间',
        value: payloadObj.nbf ? formatTimestamp(payloadObj.nbf) : null
      },
      {
        key: 'iat',
        label: '签发时间 (iat)',
        name: 'Issued At',
        desc: '签发时间',
        value: payloadObj.iat ? formatTimestamp(payloadObj.iat) : null
      },
      { key: 'jti', label: '唯一编号 (jti)', name: 'JWT ID', desc: '唯一编号', value: payloadObj.jti }
    ].filter(item => item.value !== undefined && item.value !== null)

    return {
      claims: standardClaims,
      expirationStatus,
      expFormatted,
      timeDiffText
    }
  }

  // 校验 JWT 签名
  const verifySignature = async ({
    headerRaw,
    payloadRaw,
    signatureRaw,
    alg,
    secret = '',
    isSecretBase64 = false,
    publicKeyPem = ''
  }) => {
    if (!alg || alg.toUpperCase() === 'NONE') {
      if (!signatureRaw) {
        return { valid: true, message: '算法为 "none"，未包含签名' }
      } else {
        return { valid: false, message: '算法为 "none"，但 Token 中包含了签名部分' }
      }
    }

    const unsignedToken = `${headerRaw}.${payloadRaw}`
    const encoder = new TextEncoder()
    const dataBytes = encoder.encode(unsignedToken)

    // HMAC 签名校验
    if (['HS256', 'HS384', 'HS512'].includes(alg.toUpperCase())) {
      if (!secret) {
        return { valid: false, isMissingSecret: true, message: '请输入 Secret 密钥以校验 HMAC 签名' }
      }

      let secretBytes
      try {
        if (isSecretBase64) {
          secretBytes = base64ToBytes(secret)
        } else {
          secretBytes = encoder.encode(secret)
        }
      } catch {
        return { valid: false, message: '密钥的 Base64 格式无效' }
      }

      const hashAlgMap = {
        HS256: 'SHA-256',
        HS384: 'SHA-384',
        HS512: 'SHA-512'
      }

      try {
        const cryptoKey = await window.crypto.subtle.importKey(
          'raw',
          secretBytes,
          { name: 'HMAC', hash: { name: hashAlgMap[alg.toUpperCase()] } },
          false,
          ['verify']
        )

        const sigBytes = base64ToBytes(signatureRaw)
        const isValid = await window.crypto.subtle.verify('HMAC', cryptoKey, sigBytes, dataBytes)

        if (isValid) {
          return { valid: true, message: '签名校验有效 (Signature Verified)' }
        } else {
          return { valid: false, message: '签名不匹配，Secret 密钥不正确或 Token 内容已被篡改' }
        }
      } catch (err) {
        return { valid: false, message: `签名校验过程出错: ${err.message}` }
      }
    }

    // RSA (RS256, RS384, RS512) 公钥签名校验
    if (['RS256', 'RS384', 'RS512'].includes(alg.toUpperCase())) {
      if (!publicKeyPem.trim()) {
        return { valid: false, isMissingSecret: true, message: '请输入 RSA 公钥 (PEM 格式) 以校验签名' }
      }

      const hashAlgMap = {
        RS256: 'SHA-256',
        RS384: 'SHA-384',
        RS512: 'SHA-512'
      }

      try {
        // 清理 PEM 标头
        const cleanPem = publicKeyPem
          .replace(/-----BEGIN PUBLIC KEY-----/g, '')
          .replace(/-----END PUBLIC KEY-----/g, '')
          .replace(/\s+/g, '')
        const keyBuffer = base64ToBytes(cleanPem)

        const cryptoKey = await window.crypto.subtle.importKey(
          'spki',
          keyBuffer,
          { name: 'RSASSA-PKCS1-v1_5', hash: { name: hashAlgMap[alg.toUpperCase()] } },
          false,
          ['verify']
        )

        const sigBytes = base64ToBytes(signatureRaw)
        const isValid = await window.crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, sigBytes, dataBytes)

        if (isValid) {
          return { valid: true, message: 'RSA 签名校验有效 (Signature Verified)' }
        } else {
          return { valid: false, message: 'RSA 签名校验失败，公钥不匹配或内容被修改' }
        }
      } catch (err) {
        return { valid: false, message: `RSA 公钥解析或校验出错: ${err.message}` }
      }
    }

    return { valid: false, message: `暂不支持算法 "${alg}" 的本地校验` }
  }

  // 生成/签署 JWT Token
  const generateJwt = async ({ headerObj, payloadObj, alg = 'HS256', secret = '', isSecretBase64 = false }) => {
    try {
      const headerStr = JSON.stringify(headerObj)
      const payloadStr = JSON.stringify(payloadObj)

      const headerB64 = encodeBase64Url(headerStr)
      const payloadB64 = encodeBase64Url(payloadStr)

      const unsignedToken = `${headerB64}.${payloadB64}`

      if (alg.toUpperCase() === 'NONE') {
        return `${unsignedToken}.`
      }

      const encoder = new TextEncoder()
      const dataBytes = encoder.encode(unsignedToken)

      if (['HS256', 'HS384', 'HS512'].includes(alg.toUpperCase())) {
        if (!secret) {
          throw new Error('请输入 Secret 密钥进行 HMAC 签名')
        }

        let secretBytes
        if (isSecretBase64) {
          secretBytes = base64ToBytes(secret)
        } else {
          secretBytes = encoder.encode(secret)
        }

        const hashAlgMap = {
          HS256: 'SHA-256',
          HS384: 'SHA-384',
          HS512: 'SHA-512'
        }

        const cryptoKey = await window.crypto.subtle.importKey(
          'raw',
          secretBytes,
          { name: 'HMAC', hash: { name: hashAlgMap[alg.toUpperCase()] } },
          false,
          ['sign']
        )

        const signatureBuffer = await window.crypto.subtle.sign('HMAC', cryptoKey, dataBytes)
        const signatureB64 = bytesToBase64Url(new Uint8Array(signatureBuffer))

        return `${unsignedToken}.${signatureB64}`
      }

      throw new Error(`暂不支持使用 "${alg}" 算法生成签名，请选择 HS256 / HS384 / HS512 / none`)
    } catch (err) {
      throw new Error(err.message || '生成 JWT Token 失败')
    }
  }

  return {
    parseJwt,
    analyzeClaims,
    verifySignature,
    generateJwt
  }
}
