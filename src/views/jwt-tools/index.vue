<script setup>
import { useCopyText } from '@/composables/useCopyText'
import { PRESET_JWTS, STANDARD_CLAIMS_DOC, useJwt } from './composables/useJwt'

const activeTab = ref('decode')
const { copyText } = useCopyText()
const { parseJwt, analyzeClaims, verifySignature, generateJwt } = useJwt()

// ----------------------------------------------------
// 解码与校验 Tab 数据状态
// ----------------------------------------------------
const tokenInput = ref('')
const verifySecret = ref('')
const isSecretBase64 = ref(false)
const publicKeyPem = ref('')

// 格式化解析结果
const parsedResult = computed(() => parseJwt(tokenInput.value))

// Claims 分析
const claimsAnalysis = computed(() => analyzeClaims(parsedResult.value.payloadObj))

// 自动侦测的算法
const detectedAlg = computed(() => {
  if (parsedResult.value.headerObj && parsedResult.value.headerObj.alg) {
    return String(parsedResult.value.headerObj.alg).toUpperCase()
  }
  return 'HS256'
})

// 签名校验结果
const verifyResult = ref({
  valid: false,
  isMissingSecret: true,
  message: '请输入 Secret 密钥以校验签名'
})

// 监听 Token 或密钥变化，自动运行校验
const runVerification = async () => {
  if (!parsedResult.value.isValidFormat) {
    verifyResult.value = {
      valid: false,
      isMissingSecret: false,
      message: parsedResult.value.error || 'Token 格式无效，无法校验签名'
    }
    return
  }

  const result = await verifySignature({
    headerRaw: parsedResult.value.headerRaw,
    payloadRaw: parsedResult.value.payloadRaw,
    signatureRaw: parsedResult.value.signatureRaw,
    alg: detectedAlg.value,
    secret: verifySecret.value,
    isSecretBase64: isSecretBase64.value,
    publicKeyPem: publicKeyPem.value
  })

  verifyResult.value = result
}

watch(
  [tokenInput, verifySecret, isSecretBase64, publicKeyPem, () => parsedResult.value.isValidFormat, detectedAlg],
  () => {
    runVerification()
  },
  { immediate: true }
)

// 加载预设样本
const loadPreset = preset => {
  tokenInput.value = preset.token
  if (preset.secret) {
    verifySecret.value = preset.secret
  }
  ElMessage.success(`已加载${preset.label}`)
}

const handleClearInput = () => {
  tokenInput.value = ''
  verifySecret.value = ''
  publicKeyPem.value = ''
}

// ----------------------------------------------------
// JWT 生成器 Tab 数据状态
// ----------------------------------------------------
const genHeaderStr = ref(
  JSON.stringify(
    {
      alg: 'HS256',
      typ: 'JWT'
    },
    null,
    2
  )
)

const genPayloadStr = ref(
  JSON.stringify(
    {
      sub: '1234567890',
      name: 'DevOps User',
      admin: true,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    },
    null,
    2
  )
)

const genAlg = ref('HS256')
const genSecret = ref('your-256-bit-secret')
const isGenSecretBase64 = ref(false)
const generatedToken = ref('')

// 当生成算法改变时，同步更新 Header 中的 alg
watch(genAlg, newAlg => {
  try {
    const obj = JSON.parse(genHeaderStr.value)
    obj.alg = newAlg
    genHeaderStr.value = JSON.stringify(obj, null, 2)
  } catch {
    // 忽略格式错误
  }
})

// 快捷设置 Payload 中的过期时间
const setPayloadExp = secondsFromNow => {
  try {
    const obj = JSON.parse(genPayloadStr.value)
    if (secondsFromNow === null) {
      delete obj.exp
    } else {
      obj.exp = Math.floor(Date.now() / 1000) + secondsFromNow
      if (!obj.iat) {
        obj.iat = Math.floor(Date.now() / 1000)
      }
    }
    genPayloadStr.value = JSON.stringify(obj, null, 2)
    ElMessage.success('Payload 已更新')
  } catch {
    ElMessage.error('Payload 不是有效的 JSON 格式，无法自动更新')
  }
}

// 快捷填充 7 个 RFC 7519 标准 Payload 声明字段
const fillStandardClaims = () => {
  const now = Math.floor(Date.now() / 1000)
  const standardTemplate = {
    iss: 'https://devopskit.com',
    sub: 'user_123456',
    aud: 'devopskit-app',
    exp: now + 3600,
    nbf: now,
    iat: now,
    jti: 'jwt_' + Math.random().toString(36).substring(2, 10)
  }
  genPayloadStr.value = JSON.stringify(standardTemplate, null, 2)
  ElMessage.success('已载入 7 个 RFC 7519 标准声明字段模板 (iss, sub, aud, exp, nbf, iat, jti)')
}

// 插入单个标准声明字段
const insertStandardClaim = key => {
  let obj = {}
  try {
    if (genPayloadStr.value.trim()) {
      obj = JSON.parse(genPayloadStr.value)
    }
  } catch {
    ElMessage.error('当前 Payload 不是有效的 JSON 格式，无法插入字段')
    return
  }

  const now = Math.floor(Date.now() / 1000)
  const defaultValues = {
    iss: 'https://devopskit.com',
    sub: 'user_123456',
    aud: 'devopskit-app',
    exp: now + 3600,
    nbf: now,
    iat: now,
    jti: 'jwt_' + Math.random().toString(36).substring(2, 10)
  }

  if (obj[key] !== undefined) {
    ElMessage.info(`Payload 中已存在 "${key}" 字段`)
    return
  }

  obj[key] = defaultValues[key]
  genPayloadStr.value = JSON.stringify(obj, null, 2)
  ElMessage.success(`已在 Payload 中补充 "${key}" 标准字段`)
}

// 执行生成 Token
const handleGenerateToken = async () => {
  let headerObj, payloadObj
  try {
    headerObj = JSON.parse(genHeaderStr.value)
  } catch {
    ElMessage.error('Header 格式错误，请输入有效的 JSON')
    return
  }

  try {
    payloadObj = JSON.parse(genPayloadStr.value)
  } catch {
    ElMessage.error('Payload 格式错误，请输入有效的 JSON')
    return
  }

  try {
    const token = await generateJwt({
      headerObj,
      payloadObj,
      alg: genAlg.value,
      secret: genSecret.value,
      isSecretBase64: isGenSecretBase64.value
    })
    generatedToken.value = token
    ElMessage.success('JWT Token 生成成功！')
  } catch (err) {
    ElMessage.error(err.message || '生成失败')
  }
}

// 跳转到解码页面调试生成的 Token
const debugGeneratedToken = () => {
  if (!generatedToken.value) return
  tokenInput.value = generatedToken.value
  verifySecret.value = genSecret.value
  isSecretBase64.value = isGenSecretBase64.value
  activeTab.value = 'decode'
  ElMessage.info('已将生成的 Token 载入解码校验视图')
}
</script>

<template>
  <div class="app-container jwt-tools-page">
    <el-alert
      :closable="false"
      class="notice-banner"
      show-icon
      title="JWT (JSON Web Token) 在线解码与签名校验完全在客户端浏览器本地完成，密钥与 Token 均不会发送至服务端，保障数据隐私安全。"
      type="info"
    />

    <el-tabs v-model="activeTab" class="main-tabs" type="border-card">
      <!-- Tab 1: 解码与校验 -->
      <el-tab-pane label="JWT 解码与签名校验" name="decode">
        <el-row :gutter="16">
          <!-- 左侧：Input 与 Token 结构 -->
          <el-col :lg="11" :md="24" :sm="24" :xs="24">
            <el-card class="box-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span class="card-title">Token 输入</span>
                  <div class="header-actions">
                    <el-dropdown trigger="click">
                      <el-button size="small" type="primary" plain>
                        预设示例 <el-icon><IconEpArrowDown /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item
                            v-for="(preset, index) in PRESET_JWTS"
                            :key="index"
                            @click="loadPreset(preset)"
                          >
                            {{ preset.label }}
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                    <el-button link type="danger" @click="handleClearInput">清空</el-button>
                  </div>
                </div>
              </template>

              <el-input
                v-model="tokenInput"
                :rows="6"
                clearable
                placeholder="在此粘贴编码后的 Encoded JWT Token (例: eyJhbGciOiJIUzI1Ni...)"
                resize="vertical"
                type="textarea"
              />

              <!-- 色彩结构拆分视图 -->
              <div v-if="tokenInput.trim() && parsedResult.parts.length === 3" class="visual-jwt">
                <div class="visual-label">三段结构高亮展示：</div>
                <div class="jwt-part-box">
                  <span class="part-header" title="Header (头部)">{{ parsedResult.headerRaw }}</span>
                  <span class="part-dot">.</span>
                  <span class="part-payload" title="Payload (载荷)">{{ parsedResult.payloadRaw }}</span>
                  <span class="part-dot">.</span>
                  <span class="part-signature" title="Signature (签名)">{{ parsedResult.signatureRaw }}</span>
                </div>
              </div>

              <!-- Claims 分析卡片 -->
              <div v-if="parsedResult.payloadObj" class="claims-summary-card">
                <div class="claims-header">
                  <span class="claims-title">Claims 状态分析</span>
                  <!-- Expiry Tag -->
                  <el-tag v-if="claimsAnalysis.expirationStatus === 'active'" effect="dark" type="success">
                    🟢 令牌有效中
                  </el-tag>
                  <el-tag v-else-if="claimsAnalysis.expirationStatus === 'expired'" effect="dark" type="danger">
                    🔴 令牌已过期
                  </el-tag>
                  <el-tag v-else effect="plain" type="info"> ⚪ 未设过期时间 (exp) </el-tag>
                </div>

                <div v-if="claimsAnalysis.timeDiffText" class="time-diff-bar">
                  <span class="diff-label">时间状态:</span>
                  <span
                    :class="{
                      'text-success': claimsAnalysis.expirationStatus === 'active',
                      'text-danger': claimsAnalysis.expirationStatus === 'expired'
                    }"
                    class="diff-value"
                  >
                    {{ claimsAnalysis.timeDiffText }}
                  </span>
                  <span v-if="claimsAnalysis.expFormatted" class="diff-sub"> ({{ claimsAnalysis.expFormatted }}) </span>
                </div>

                <div v-if="claimsAnalysis.claims.length > 0" class="claims-grid">
                  <div v-for="item in claimsAnalysis.claims" :key="item.key" class="claim-item">
                    <div class="claim-label-box">
                      <span class="claim-label">{{ item.label }}:</span>
                      <el-tooltip :content="`${item.name} - ${item.desc}`" placement="top">
                        <el-tag size="small" type="info" class="claim-badge">{{ item.name }}</el-tag>
                      </el-tooltip>
                    </div>
                    <span class="claim-val">{{ item.value }}</span>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- 右侧：Header JSON、Payload JSON 与签名校验 -->
          <el-col :lg="13" :md="24" :sm="24" :xs="24">
            <!-- Header (头部) -->
            <el-card class="box-card mb-4" shadow="never">
              <template #header>
                <div class="card-header">
                  <span class="card-title title-header">HEADER (算法与类型)</span>
                  <el-button
                    v-if="parsedResult.headerFormatted"
                    link
                    type="primary"
                    @click="copyText(parsedResult.headerFormatted)"
                  >
                    复制 Header JSON
                  </el-button>
                </div>
              </template>
              <pre class="json-code header-json">{{
                parsedResult.headerFormatted || parsedResult.error || '// Header 解码结果'
              }}</pre>
            </el-card>

            <!-- Payload (载荷) -->
            <el-card class="box-card mb-4" shadow="never">
              <template #header>
                <div class="card-header">
                  <span class="card-title title-payload">PAYLOAD (数据与声明)</span>
                  <el-button
                    v-if="parsedResult.payloadFormatted"
                    link
                    type="primary"
                    @click="copyText(parsedResult.payloadFormatted)"
                  >
                    复制 Payload JSON
                  </el-button>
                </div>
              </template>
              <pre class="json-code payload-json">{{
                parsedResult.payloadFormatted || parsedResult.error || '// Payload 解码结果'
              }}</pre>
            </el-card>

            <!-- Signature (签名校验) -->
            <el-card class="box-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span class="card-title title-signature">VERIFY SIGNATURE (签名校验)</span>
                  <el-tag size="small" type="info">算法: {{ detectedAlg }}</el-tag>
                </div>
              </template>

              <!-- 验证结果 Banner -->
              <div
                :class="{
                  'is-valid': verifyResult.valid,
                  'is-invalid': !verifyResult.valid && !verifyResult.isMissingSecret,
                  'is-waiting': !verifyResult.valid && verifyResult.isMissingSecret
                }"
                class="verify-banner"
              >
                <div class="verify-status-icon">
                  <el-icon v-if="verifyResult.valid" color="#67C23A" size="24"><IconEpCircleCheck /></el-icon>
                  <el-icon v-else-if="!verifyResult.isMissingSecret" color="#F56C6C" size="24"
                    ><IconEpCircleClose
                  /></el-icon>
                  <el-icon v-else color="#E6A23C" size="24"><IconEpWarning /></el-icon>
                </div>
                <div class="verify-status-text">
                  <div class="status-title">
                    {{
                      verifyResult.valid
                        ? 'Signature Verified (签名有效)'
                        : verifyResult.isMissingSecret
                          ? '等待校验密钥 (Secret Required)'
                          : 'Invalid Signature (签名无效)'
                    }}
                  </div>
                  <div class="status-desc">{{ verifyResult.message }}</div>
                </div>
              </div>

              <!-- HMAC 密钥输入 -->
              <div v-if="['HS256', 'HS384', 'HS512'].includes(detectedAlg)" class="secret-input-block">
                <el-form label-position="top" size="default">
                  <el-form-item label="HMAC Secret 密钥:">
                    <el-input
                      v-model="verifySecret"
                      clearable
                      placeholder="请输入生成该 JWT 时使用的 Secret (如: your-256-bit-secret)"
                      show-password
                      type="password"
                    />
                  </el-form-item>
                  <div class="secret-checkbox-wrap">
                    <el-checkbox v-model="isSecretBase64"> Secret Key 为 Base64 编码 (Base64 Encoded Key) </el-checkbox>
                    <el-tooltip
                      content="部分框架/系统（如 Auth0、Spring Security）的 Secret 密钥是以 Base64 编码形式存储的。勾选后计算 HMAC 签名时会将 Secret 解码为原始二进制字节流，而非直接按 UTF-8 字符串处理。"
                      placement="top"
                    >
                      <el-icon class="help-icon"><IconEpQuestionFilled /></el-icon>
                    </el-tooltip>
                  </div>
                </el-form>
              </div>

              <!-- RSA / ECDSA 公钥输入 -->
              <div v-else-if="['RS256', 'RS384', 'RS512'].includes(detectedAlg)" class="secret-input-block">
                <el-form label-position="top" size="default">
                  <el-form-item label="RSA 公钥 (Public Key PEM):">
                    <el-input
                      v-model="publicKeyPem"
                      :rows="4"
                      placeholder="-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...\n-----END PUBLIC KEY-----"
                      type="textarea"
                    />
                  </el-form-item>
                </el-form>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- Tab 2: JWT 生成器 -->
      <el-tab-pane label="JWT 生成器 (Token Generator)" name="generate">
        <el-row :gutter="16">
          <el-col :lg="12" :md="12" :sm="24" :xs="24">
            <el-card class="box-card mb-4" shadow="never">
              <template #header>
                <div class="card-header">
                  <span class="card-title">1. 配置 Header JSON</span>
                </div>
              </template>
              <el-input v-model="genHeaderStr" :rows="6" class="font-mono" resize="none" type="textarea" />
            </el-card>

            <el-card class="box-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span class="card-title">2. 配置 Payload JSON</span>
                  <div class="payload-quick-btns">
                    <el-button size="small" type="success" plain @click="fillStandardClaims"> 标准7字段模板 </el-button>
                    <el-dropdown trigger="click" @command="insertStandardClaim">
                      <el-button size="small" type="primary" plain>
                        插入标准字段 <el-icon><IconEpArrowDown /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="iss">iss (签发者 Issuer)</el-dropdown-item>
                          <el-dropdown-item command="sub">sub (主题 Subject)</el-dropdown-item>
                          <el-dropdown-item command="aud">aud (接收方 Audience)</el-dropdown-item>
                          <el-dropdown-item command="exp">exp (过期时间 Expiration)</el-dropdown-item>
                          <el-dropdown-item command="nbf">nbf (生效时间 Not Before)</el-dropdown-item>
                          <el-dropdown-item command="iat">iat (签发时间 Issued At)</el-dropdown-item>
                          <el-dropdown-item command="jti">jti (JWT ID 唯一编号)</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                    <el-button size="small" type="primary" plain @click="setPayloadExp(3600)">+1小时</el-button>
                    <el-button size="small" type="primary" plain @click="setPayloadExp(86400)">+1天</el-button>
                    <el-button size="small" type="primary" plain @click="setPayloadExp(2592000)">+30天</el-button>
                    <el-button size="small" type="info" plain @click="setPayloadExp(null)">无过期</el-button>
                  </div>
                </div>
              </template>
              <el-input v-model="genPayloadStr" :rows="10" class="font-mono" resize="none" type="textarea" />
            </el-card>
          </el-col>

          <el-col :lg="12" :md="12" :sm="24" :xs="24">
            <el-card class="box-card mb-4" shadow="never">
              <template #header>
                <div class="card-header">
                  <span class="card-title">3. 签名设置与生成</span>
                </div>
              </template>

              <el-form label-position="top">
                <el-form-item label="签名算法 (Algorithm):">
                  <el-select v-model="genAlg" style="width: 100%">
                    <el-option label="HS256 (HMAC SHA-256)" value="HS256" />
                    <el-option label="HS384 (HMAC SHA-384)" value="HS384" />
                    <el-option label="HS512 (HMAC SHA-512)" value="HS512" />
                    <el-option label="none (不加密签名)" value="none" />
                  </el-select>
                </el-form-item>

                <el-form-item v-if="genAlg !== 'none'" label="Secret 签名密钥:">
                  <el-input v-model="genSecret" placeholder="请输入自定义 Secret 密钥" show-password type="password" />
                  <div class="secret-checkbox-wrap" style="margin-top: 6px">
                    <el-checkbox v-model="isGenSecretBase64"> Secret Key 为 Base64 编码 </el-checkbox>
                    <el-tooltip
                      content="部分框架/系统（如 Auth0、Spring Security）的 Secret 密钥是以 Base64 编码形式存储的。勾选后计算 HMAC 签名时会将 Secret 解码为原始二进制字节流，而非直接按 UTF-8 字符串处理。"
                      placement="top"
                    >
                      <el-icon class="help-icon"><IconEpQuestionFilled /></el-icon>
                    </el-tooltip>
                  </div>
                </el-form-item>

                <el-button class="w-full mt-2" size="large" type="primary" @click="handleGenerateToken">
                  <el-icon style="margin-right: 6px"><IconEpKey /></el-icon>
                  签名并生成 JWT Token
                </el-button>
              </el-form>
            </el-card>

            <!-- 生成结果展板 -->
            <el-card v-if="generatedToken" class="box-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span class="card-title text-success">生成成功 (Generated JWT)</span>
                  <div>
                    <el-button size="small" type="primary" plain @click="copyText(generatedToken)">
                      复制 Token
                    </el-button>
                    <el-button size="small" type="success" @click="debugGeneratedToken"> 载入解码调试 </el-button>
                  </div>
                </div>
              </template>
              <div class="gen-token-display font-mono">
                {{ generatedToken }}
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- Tab 3: JWT 规范与原理介绍 -->
      <el-tab-pane label="JWT 规范与原理介绍" name="intro">
        <div class="intro-container">
          <!-- 1. 功能作用与基本概念 -->
          <el-card class="box-card mb-4" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="card-title">1. JWT 的功能作用与基本概念</span>
              </div>
            </template>
            <div class="intro-section">
              <p class="intro-text">
                <strong>JSON Web Token (JWT)</strong> 是一种基于 RFC 7519
                开放标准的轻量级自包含安全凭证，用于在网络各方之间以 JSON 对象的形式安全传输与校验身份信息。
              </p>
              <el-row :gutter="16" class="mt-3">
                <el-col :lg="8" :md="8" :sm="24" :xs="24">
                  <div class="concept-item">
                    <div class="concept-icon">
                      <el-icon color="#409EFF" size="20"><IconEpLock /></el-icon>
                    </div>
                    <div class="concept-content">
                      <h4>无状态身份验证 (Stateless)</h4>
                      <p>
                        服务端无需保存 Session 状态，凭证与身份信息全部保存在 Token 中，极大地提升了系统横向扩展能力。
                      </p>
                    </div>
                  </div>
                </el-col>
                <el-col :lg="8" :md="8" :sm="24" :xs="24">
                  <div class="concept-item">
                    <div class="concept-icon">
                      <el-icon color="#67C23A" size="20"><IconEpConnection /></el-icon>
                    </div>
                    <div class="concept-content">
                      <h4>跨域与单点登录 (SSO)</h4>
                      <p>天然支持跨域名、跨服务认证，是单页应用 (SPA)、微服务架构与 API 网关鉴权的核心标准。</p>
                    </div>
                  </div>
                </el-col>
                <el-col :lg="8" :md="8" :sm="24" :xs="24">
                  <div class="concept-item">
                    <div class="concept-icon">
                      <el-icon color="#E6A23C" size="20"><IconEpCircleCheck /></el-icon>
                    </div>
                    <div class="concept-content">
                      <h4>防篡改数字签名</h4>
                      <p>利用 HMAC 密钥或 RSA/ECDSA 公私钥对计算签名，保证凭证传输过程中任何字段未被非授权篡改。</p>
                    </div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-card>

          <!-- 2. 组成结构 -->
          <el-card class="box-card mb-4" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="card-title">2. JWT 的三段式组成结构</span>
              </div>
            </template>
            <div class="intro-section">
              <p class="intro-text">
                一个标准的 JWT 字符串由 3 个 Base64URL 编码部分组成，各部分之间用半角点号 <code>.</code> 分隔：
                <code class="token-formula">Header.Payload.Signature</code>
              </p>

              <div class="structure-grid mt-3">
                <div class="struct-card struct-header">
                  <div class="struct-title">① HEADER (头部)</div>
                  <div class="struct-desc">
                    包含 Token 元数据，如签名算法 (<code>alg</code>, 如 HS256/RS256) 和令牌类型 (<code>typ</code>,
                    固定为 JWT)。
                  </div>
                  <div class="struct-code">{"alg": "HS256", "typ": "JWT"}</div>
                </div>

                <div class="struct-card struct-payload">
                  <div class="struct-title">② PAYLOAD (载荷)</div>
                  <div class="struct-desc">
                    包含声明 (Claims) 与业务数据。采用 Base64URL
                    编码而非加密，<strong>请勿存放明文密码等极度敏感数据</strong>。
                  </div>
                  <div class="struct-code">{"sub": "user_10001", "roles": ["admin"], "exp": 1750000000}</div>
                </div>

                <div class="struct-card struct-signature">
                  <div class="struct-title">③ SIGNATURE (签名)</div>
                  <div class="struct-desc">
                    使用指定算法将编码后的 Header、Payload 与服务端密钥 (Secret) 结合计算得出的哈希校验值。
                  </div>
                  <div class="struct-code">HMACSHA256(base64Url(header) + "." + base64Url(payload), secret)</div>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 3. 标准 Claims 字段说明表格 -->
          <el-card class="box-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="card-title">3. JWT 标准 Payload 声明字段说明 (Standard Claims)</span>
              </div>
            </template>
            <el-table :data="STANDARD_CLAIMS_DOC" border stripe style="width: 100%">
              <el-table-column prop="key" label="字段 (Claim Key)" width="160">
                <template #default="{ row }">
                  <el-tag size="small" effect="plain" type="primary" class="font-mono text-bold">{{ row.key }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="英文名称" width="200" />
              <el-table-column prop="desc" label="含义与作用说明" />
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.jwt-tools-page {
  padding: 12px;

  :deep(.el-card__body) {
    padding: 10px 14px;
  }

  :deep(.el-card__header) {
    padding: 8px 14px;
  }

  :deep(.el-form-item) {
    margin-bottom: 8px;
  }
}

.notice-banner {
  margin-bottom: 10px;
}

.main-tabs {
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
}

.box-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .card-title {
    font-size: 14px;
    font-weight: 600;

    &.title-header {
      color: #f43f5e;
    }

    &.title-payload {
      color: #8b5cf6;
    }

    &.title-signature {
      color: #0ea5e9;
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.visual-jwt {
  margin-top: 8px;
  padding: 8px 10px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.visual-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.jwt-part-box {
  word-break: break-all;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.5;

  .part-header {
    color: #f43f5e;
    font-weight: 600;
  }

  .part-payload {
    color: #8b5cf6;
    font-weight: 600;
  }

  .part-signature {
    color: #0ea5e9;
    font-weight: 600;
  }

  .part-dot {
    color: var(--el-text-color-regular);
    font-weight: bold;
    margin: 0 1px;
  }
}

.claims-summary-card {
  margin-top: 8px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-bg-color);
}

.claims-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;

  .claims-title {
    font-weight: 600;
    font-size: 13px;
  }
}

.time-diff-bar {
  font-size: 12px;
  margin-bottom: 6px;
  padding: 4px 8px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;

  .diff-label {
    color: var(--el-text-color-secondary);
    margin-right: 6px;
  }

  .diff-value {
    font-weight: 600;

    &.text-success {
      color: var(--el-color-success);
    }

    &.text-danger {
      color: var(--el-color-danger);
    }
  }

  .diff-sub {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    margin-left: 6px;
  }
}

.claims-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .claim-item {
    font-size: 12px;
    display: flex;
    align-items: center;

    .claim-label-box {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 170px;
      flex-shrink: 0;

      .claim-label {
        color: var(--el-text-color-secondary);
      }

      .claim-badge {
        font-size: 10px;
        padding: 0 4px;
        height: 18px;
        line-height: 16px;
      }
    }

    .claim-val {
      font-family: monospace;
      color: var(--el-text-color-primary);
      word-break: break-all;
    }
  }
}

.mt-4 {
  margin-top: 10px;
}

.text-bold {
  font-weight: 600;
}

.json-code {
  background: var(--el-fill-color-dark);
  color: var(--el-text-color-primary);
  padding: 8px 10px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 12px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  min-height: 50px;
  max-height: 220px;

  &.header-json {
    border-left: 3px solid #f43f5e;
  }

  &.payload-json {
    border-left: 3px solid #8b5cf6;
  }
}

.verify-banner {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 8px;
  gap: 10px;

  &.is-valid {
    background: rgba(103, 194, 58, 0.1);
    border: 1px solid var(--el-color-success-light-5);
  }

  &.is-invalid {
    background: rgba(245, 108, 108, 0.1);
    border: 1px solid var(--el-color-danger-light-5);
  }

  &.is-waiting {
    background: rgba(230, 162, 60, 0.1);
    border: 1px solid var(--el-color-warning-light-5);
  }

  .status-title {
    font-weight: 600;
    font-size: 13px;
  }

  .status-desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.secret-input-block {
  margin-top: 6px;
}

.mb-4 {
  margin-bottom: 10px;
}

.w-full {
  width: 100%;
}

.font-mono {
  font-family: monospace;
}

.gen-token-display {
  padding: 12px;
  background: var(--el-fill-color-dark);
  color: #67c23a;
  word-break: break-all;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
}

.payload-quick-btns {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.intro-container {
  line-height: 1.5;
}

.intro-text {
  font-size: 13px;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;

  code {
    background: var(--el-fill-color);
    padding: 2px 5px;
    border-radius: 4px;
    font-family: monospace;
    color: var(--el-color-primary);
  }

  .token-formula {
    font-weight: bold;
    font-size: 14px;
  }
}

.concept-item {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  height: 100%;
  box-sizing: border-box;

  .concept-content {
    h4 {
      margin: 0 0 4px 0;
      font-size: 13px;
      color: var(--el-text-color-primary);
    }
    p {
      margin: 0;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      line-height: 1.4;
    }
  }
}

.structure-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 10px;
}

.struct-card {
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);

  .struct-title {
    font-weight: 600;
    font-size: 13px;
    margin-bottom: 4px;
  }

  &.struct-header .struct-title {
    color: #f43f5e;
  }

  &.struct-payload .struct-title {
    color: #8b5cf6;
  }

  &.struct-signature .struct-title {
    color: #0ea5e9;
  }

  .struct-desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 6px;
    line-height: 1.4;
  }

  .struct-code {
    font-family: monospace;
    font-size: 12px;
    background: var(--el-fill-color-dark);
    color: var(--el-text-color-primary);
    padding: 6px 8px;
    border-radius: 4px;
    word-break: break-all;
  }
}
</style>
