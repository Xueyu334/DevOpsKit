import Big from 'big.js'

/**
 * PERT (Program Evaluation and Review Technique) 三点估算核心工具库
 *
 * 核心原理：
 * 1. 期望工作量 Te (Expected Time/Effort):
 *    - Beta分布（经典加权）：Te = (O + 4M + P) / 6
 *    - 三角分布（算术平均）：Te = (O + M + P) / 3
 *    - 自定义权重：Te = (O + Wm * M + P) / (2 + Wm)
 * 2. 标准差 sigma (Standard Deviation):
 *    sigma = (P - O) / 6
 *    衡量任务的不确定性（风险敞口），sigma越大说明技术风险或需求模糊度越高
 * 3. 方差 V (Variance):
 *    V = sigma^2 = ((P - O) / 6)^2
 * 4. 多任务串联汇总（中心极限定理）：
 *    - 总期望：T_total = sum(Te_i)
 *    - 总方差：V_total = sum(V_i)
 *    - 总标准差：sigma_total = sqrt(V_total)
 *    注意：多任务汇总时，标准差不能直接相加，必须先将各任务的方差相加，再开平方！
 *
 * 本模块全程采用 Big.js 进行高精度浮点数四则运算，规避 JavaScript 浮点数累加与除法精度丢失。
 */

// 配置 Big.js 默认除法精度为 20 位有效小数
Big.DP = 20

/**
 * 安全构建 Big 实例
 */
function toBig(val, fallback = 0) {
  if (val === null || val === undefined || val === '') return new Big(fallback)
  try {
    return new Big(val)
  } catch {
    return new Big(fallback)
  }
}

/**
 * 误差函数 erf 近似计算 (Abramowitz & Stegun formula 7.1.26, 理论精度高于 1.5e-7)
 * 采用 Big.js 处理有理式倒数、霍纳法则高阶多项式连乘及差值运算，避免常规浮点数截断误差
 */
export function erf(x) {
  const xNum = Number(x) || 0
  if (xNum === 0) return 0

  const sign = xNum >= 0 ? 1 : -1
  const absX = Math.abs(xNum)
  const absXBig = new Big(absX)

  // 系数常量使用高精度 Big.js 实例
  const a1 = new Big('0.254829592')
  const a2 = new Big('-0.284496736')
  const a3 = new Big('1.421413741')
  const a4 = new Big('-1.453152027')
  const a5 = new Big('1.061405429')
  const p = new Big('0.3275911')

  // t = 1.0 / (1.0 + p * absX)
  const t = new Big(1).div(new Big(1).plus(p.times(absXBig)))

  // 霍纳法则多项式: ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t
  const poly = a5.times(t).plus(a4).times(t).plus(a3).times(t).plus(a2).times(t).plus(a1).times(t)

  // 指数项 exp(-absX^2)
  const expVal = new Big(Math.exp(-absX * absX))

  // y = 1.0 - poly * exp(-x^2)
  const y = new Big(1).minus(poly.times(expVal))

  return y.times(sign).toNumber()
}

/**
 * 标准正态分布累积分布函数 Cumulative Distribution Function: Phi(z)
 * 计算工期在指定 Z 值内的达成概率 [0, 1]，使用 Big.js 进行根号2与线性缩放高精度运算
 */
export function normalCdf(z) {
  const zBig = toBig(z, 0)
  // sqrt(2) 使用 Big.js 原生开方
  const sqrt2Big = new Big(2).sqrt()
  const zDivSqrt2 = zBig.div(sqrt2Big)
  const erfVal = toBig(erf(zDivSqrt2.toNumber()))
  // Phi(z) = 0.5 * (1 + erf(z / sqrt(2)))
  const cdfBig = new Big('0.5').times(new Big(1).plus(erfVal))
  return cdfBig.toNumber()
}

/**
 * 计算单个任务的 PERT 指标（全流程使用 Big.js 进行高精度计算）
 * @param {Object} task 任务对象 { o, m, p, weightMode, customWeight }
 * @param {Object} globalOptions 全局选项 { defaultWeightMode, defaultCustomWeight }
 */
export function calculateSingleTask(task, globalOptions = {}) {
  const oBig = toBig(task.o, 0)
  const mBig = toBig(task.m, 0)
  const pBig = toBig(task.p, 0)

  const o = oBig.toNumber()
  const m = mBig.toNumber()
  const p = pBig.toNumber()

  const mode =
    globalOptions.forceGlobalWeight || task.weightMode === 'custom-inherit' || !task.weightMode
      ? globalOptions.defaultWeightMode || 'beta'
      : task.weightMode || globalOptions.defaultWeightMode || 'beta'

  let wm = 4
  if (mode === 'beta') {
    wm = 4
  } else if (mode === 'triangular') {
    wm = 1
  } else if (mode === 'custom') {
    wm =
      Number(
        globalOptions.forceGlobalWeight
          ? globalOptions.defaultCustomWeight
          : task.customWeight !== undefined
            ? task.customWeight
            : globalOptions.defaultCustomWeight
      ) || 4
  }
  const wmBig = new Big(wm)

  // 校验有效性：O <= M <= P，且 O >= 0
  const isValuesEntered =
    task.o !== '' && task.m !== '' && task.p !== '' && task.o !== null && task.m !== null && task.p !== null
  let isValid = true
  let validationMessage = ''

  if (isValuesEntered) {
    if (oBig.lt(0) || mBig.lt(0) || pBig.lt(0)) {
      isValid = false
      validationMessage = '工时评估不能为负数'
    } else if (oBig.gt(mBig) && mBig.gt(pBig)) {
      isValid = false
      validationMessage = '数值完全倒置（需满足 乐观 ≤ 最可能 ≤ 悲观）'
    } else if (oBig.gt(mBig)) {
      isValid = false
      validationMessage = '乐观工时 (O) 不能大于最可能工时 (M)'
    } else if (mBig.gt(pBig)) {
      isValid = false
      validationMessage = '最可能工时 (M) 不能大于悲观工时 (P)'
    } else if (oBig.gt(pBig)) {
      isValid = false
      validationMessage = '乐观工时 (O) 不能大于悲观工时 (P)'
    }
  }

  // 计算期望值 Te (使用 Big.js 避免浮点数精度丢失)
  let teBig
  if (mode === 'triangular') {
    // Te = (O + M + P) / 3
    teBig = oBig.plus(mBig).plus(pBig).div(3)
  } else if (mode === 'beta') {
    // Te = (O + 4M + P) / 6
    teBig = oBig.plus(mBig.times(4)).plus(pBig).div(6)
  } else {
    // 自定义 M 权重: Te = (O + Wm * M + P) / (2 + Wm)
    teBig = oBig.plus(mBig.times(wmBig)).plus(pBig).div(wmBig.plus(2))
  }

  // 计算标准差 sigma = (P - O) / 6
  const sdBig = pBig.minus(oBig).div(6)

  // 计算方差 V = sigma^2
  const varianceBig = sdBig.times(sdBig)

  // 风险评估（变异系数 CV = (sigma / Te) * 100）
  const cvBig = teBig.gt(0) ? sdBig.div(teBig).times(100) : new Big(0)

  const te = teBig.toNumber()
  const sd = sdBig.toNumber()
  const variance = varianceBig.toNumber()
  const cv = cvBig.toNumber()

  let riskLevel = 'low'
  let riskLabel = '低风险'
  let riskTagType = 'success'
  let riskDescription = '需求清晰，技术方案确定，离散度低'

  if (cv > 25) {
    riskLevel = 'high'
    riskLabel = '高风险'
    riskTagType = 'danger'
    riskDescription = '乐观与悲观差距极大，需求模糊或技术不确定性高'
  } else if (cv > 12) {
    riskLevel = 'medium'
    riskLabel = '中风险'
    riskTagType = 'warning'
    riskDescription = '存在一定外部依赖或技术试错成本，具备中度风险'
  }

  return {
    o,
    m,
    p,
    wm,
    mode,
    te,
    sd,
    variance,
    cv,
    riskLevel,
    riskLabel,
    riskTagType,
    riskDescription,
    isValid,
    validationMessage,
    isValuesEntered
  }
}

/**
 * 多任务串联汇总（使用 Big.js 累加期望值与方差）
 * @param {Array} tasks 任务数组
 * @param {Object} globalOptions 全局选项
 */
export function calculateAggregate(tasks = [], globalOptions = {}) {
  let totalTeBig = new Big(0)
  let totalVarianceBig = new Big(0)
  let directSdSumBig = new Big(0)
  let validCount = 0
  let invalidCount = 0

  const highRiskCount = { low: 0, medium: 0, high: 0 }
  const aggregateOptions = {
    ...globalOptions,
    forceGlobalWeight: true
  }

  const computedTasks = tasks.map((task, index) => {
    const calc = calculateSingleTask(task, aggregateOptions)
    if (calc.isValid && calc.isValuesEntered) {
      validCount++
      totalTeBig = totalTeBig.plus(calc.te)
      totalVarianceBig = totalVarianceBig.plus(calc.variance)
      directSdSumBig = directSdSumBig.plus(calc.sd)
      highRiskCount[calc.riskLevel]++
    } else if (!calc.isValid) {
      invalidCount++
    }
    return {
      index: index + 1,
      ...calc,
      id: task.id,
      get name() {
        return task.name
      },
      set name(val) {
        task.name = val
      },
      get o() {
        return task.o
      },
      set o(val) {
        task.o = val
      },
      get m() {
        return task.m
      },
      set m(val) {
        task.m = val
      },
      get p() {
        return task.p
      },
      set p(val) {
        task.p = val
      }
    }
  })

  // 汇总总标准差：方差相加后再开根号（直接调用 Big.js 原生 sqrt）！
  const totalVarianceNum = totalVarianceBig.toNumber()
  const totalSdBig = totalVarianceBig.sqrt()
  const totalSdNum = totalSdBig.toNumber()

  // 标准差简单相加与合成标准差的差异（展现风险分散效益）
  const sdOverestimateBig = directSdSumBig.gt(totalSdBig) ? directSdSumBig.minus(totalSdBig) : new Big(0)
  const sdOverestimateRatioBig = directSdSumBig.gt(0) ? sdOverestimateBig.div(directSdSumBig).times(100) : new Big(0)

  // 整体项目变异系数: CV = (totalSd / totalTe) * 100
  const overallCvBig = totalTeBig.gt(0) ? totalSdBig.div(totalTeBig).times(100) : new Big(0)

  const totalTe = totalTeBig.toNumber()
  const totalVariance = totalVarianceNum
  const totalSd = totalSdNum
  const directSdSum = directSdSumBig.toNumber()
  const sdOverestimate = sdOverestimateBig.toNumber()
  const sdOverestimateRatio = sdOverestimateRatioBig.toNumber()
  const overallCv = overallCvBig.toNumber()

  // 置信区间计算（基于正态分布/中心极限定理）
  // 68.27% 对应 +/- 1 sigma (单侧交付概率约 84.13%)
  // 95.45% 对应 +/- 2 sigma (单侧交付概率约 97.72%)
  // 99.73% 对应 +/- 3 sigma (单侧交付概率约 99.87%)
  const confidenceIntervals = {
    oneSigma: {
      label: '68.27% 置信区间 (±1σ)',
      singleTailProb: 84.13,
      min: Math.max(0, totalTeBig.minus(totalSdBig).toNumber()),
      max: totalTeBig.plus(totalSdBig).toNumber(),
      sdMultiplier: 1
    },
    twoSigma: {
      label: '95.45% 置信区间 (±2σ)',
      singleTailProb: 97.72,
      min: Math.max(0, totalTeBig.minus(totalSdBig.times(2)).toNumber()),
      max: totalTeBig.plus(totalSdBig.times(2)).toNumber(),
      sdMultiplier: 2
    },
    threeSigma: {
      label: '99.73% 置信区间 (±3σ)',
      singleTailProb: 99.87,
      min: Math.max(0, totalTeBig.minus(totalSdBig.times(3)).toNumber()),
      max: totalTeBig.plus(totalSdBig.times(3)).toNumber(),
      sdMultiplier: 3
    }
  }

  return {
    computedTasks,
    totalTe,
    totalVariance,
    totalSd,
    directSdSum,
    sdOverestimate,
    sdOverestimateRatio,
    overallCv,
    validCount,
    invalidCount,
    totalCount: tasks.length,
    highRiskCount,
    confidenceIntervals
  }
}

/**
 * 测算指定工期目标的按期完成概率（使用 Big.js 计算精确 Z-Score）
 * @param {Number} totalTe 汇总期望工时
 * @param {Number} totalSd 汇总标准差
 * @param {Number} targetEffort 目标承诺工时
 */
export function calculateDeliveryProbability(totalTe, totalSd, targetEffort) {
  const target = Number(targetEffort)
  if (isNaN(target) || target <= 0) {
    return {
      z: 0,
      probability: 0,
      assessment: '请输入有效的目标工时',
      type: 'info'
    }
  }

  const sdBig = toBig(totalSd, 0)
  const teBig = toBig(totalTe, 0)
  const targetBig = toBig(target, 0)

  if (sdBig.eq(0)) {
    const prob = targetBig.gte(teBig) ? 100 : 0
    return {
      z: 0,
      probability: prob,
      assessment: prob === 100 ? '确定性达成' : '无法达成',
      type: prob === 100 ? 'success' : 'danger'
    }
  }

  // 标准正态变换 Z = (Target - Te) / sigma
  const zBig = targetBig.minus(teBig).div(sdBig)
  const z = zBig.toNumber()
  const probability = Math.min(99.99, Math.max(0.01, normalCdf(z) * 100))

  let assessment
  let type
  if (probability < 50) {
    assessment = '极高延期风险（目标过于激进，达成概率低于基准期望值 50%）'
    type = 'danger'
  } else if (probability < 75) {
    assessment = '偏高风险（承诺偏激进，仍有较大概率因不确定性逾期）'
    type = 'warning'
  } else if (probability < 90) {
    assessment = '稳妥平衡（行业推荐排期区间，兼顾效能与交付按期率）'
    type = 'primary'
  } else {
    assessment = '高置信保守（充裕缓冲，交付确定性极高，适合关键里程碑）'
    type = 'success'
  }

  return {
    z,
    probability,
    assessment,
    type
  }
}

/**
 * 格式化数值展示（使用 Big.js 进行高精度无偏差四舍五入）
 */
export function formatNum(num, precision = 2) {
  if (num === undefined || num === null || num === '' || isNaN(Number(num))) return '0.00'
  try {
    return new Big(num).toFixed(precision)
  } catch {
    return Number(num).toFixed(precision)
  }
}

/**
 * 演示案例数据集
 */
export const demoProjectCases = [
  {
    name: '敏捷迭代 Sprint 核心需求集',
    description: '典型的中大型功能迭代，包含需求分析、前后端研发、第三方联调与上线发布',
    tasks: [
      { id: 1, name: '需求澄清与数据库表结构评审', o: 1, m: 2, p: 4 },
      { id: 2, name: '用户中心微服务核心业务接口改造', o: 3, m: 5, p: 9 },
      { id: 3, name: '前端管理后台与移动端页面重构', o: 2, m: 4, p: 8 },
      { id: 4, name: '第三方支付网关与风控接口联调', o: 2, m: 3, p: 8 },
      { id: 5, name: '自动化接口测试与端到端回归', o: 1.5, m: 2.5, p: 5 },
      { id: 6, name: '全链路性能压测与慢查询排查优化', o: 1, m: 2, p: 6 },
      { id: 7, name: '生产环境发布、灰度监控与验证', o: 0.5, m: 1, p: 2 }
    ]
  }
]
