<template>
  <div class="pert-formula-guide">
    <!-- 头部导读：什么是 PERT 计划评审技术 -->
    <el-card shadow="hover" class="guide-card hero-card">
      <template #header>
        <div class="card-header">
          <div class="header-title-wrap">
            <el-icon class="header-icon"><TrendCharts /></el-icon>
            <span class="title">什么是 PERT（计划评审技术）？</span>
          </div>
          <el-tag type="primary" effect="dark" round>核心理念与起源</el-tag>
        </div>
      </template>

      <div class="hero-body">
        <p class="lead-text">
          <strong>PERT（Program Evaluation and Review Technique，计划评审技术）</strong>
          于 1958
          年由美国海军在北极星（Polaris）导弹研发项目中首创，是面向<strong>研发攻关、技术创新、探索性工程等高度不确定性项目</strong>的经典概率统计评估方法，现已被广泛纳入
          PMP、敏捷开发及敏捷项目管理标准体系。
        </p>

        <div class="concept-grid">
          <div class="concept-box traditional">
            <div class="concept-badge">传统单点估算（拍脑袋）</div>
            <p class="concept-desc">
              通常只给出一个固定数字（如“做这个需要 5
              天”）。极易陷入<strong>过于乐观忽视风险</strong>（导致延期）或<strong>个人盲目注水</strong>（导致进度拖沓），且无法量化按期交付的概率。
            </p>
          </div>

          <div class="concept-box pert">
            <div class="concept-badge highlight">PERT 三点概率估算</div>
            <p class="concept-desc">
              承认软件与工程中“不确定性不可避免”。通过设定<strong>乐观 (O)、最可能 (M)、悲观 (P)</strong> 三个边界点构建
              Beta 分布模型，不仅算出<strong>科学期望工期 (T<sub>e</sub>)</strong>，还能精确量化<strong
                >风险敞口 (&sigma;)</strong
              >
              与<strong>不同概率下的承诺交付期</strong>。
            </p>
          </div>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20">
      <!-- 左列：核心数学模型 & 方差深度解析 -->
      <el-col :xs="24" :lg="12">
        <!-- 1. PERT 三点估算核心数学模型 -->
        <el-card shadow="hover" class="guide-card">
          <template #header>
            <div class="card-header">
              <span class="title">1. PERT 三点估算核心数学模型</span>
              <el-tag size="small" type="primary">单任务指标</el-tag>
            </div>
          </template>

          <div class="formula-block">
            <h5 class="formula-title">期望工作量 / 工期 (Expected Time - T<sub>e</sub>)</h5>
            <div class="math-box">
              <div class="math-row">
                <span class="formula-label">加权平均（经典 Beta 分布，最常用，给予最可能 4 倍权重）:</span>
                <div class="formula-expr">T<sub>e</sub> = (O + 4M + P) / 6</div>
              </div>
              <div class="math-row">
                <span class="formula-label">算术平均（三角分布 Triangular Distribution，历史数据匮乏时）:</span>
                <div class="formula-expr">T<sub>e</sub> = (O + M + P) / 3</div>
              </div>
              <div class="math-row">
                <span class="formula-label">自定义 M 权重（W<sub>m</sub>）:</span>
                <div class="formula-expr">T<sub>e</sub> = (O + W<sub>m</sub> &times; M + P) / (2 + W<sub>m</sub>)</div>
              </div>
            </div>
            <p class="formula-desc">
              <strong>三点参数含义：</strong><br />
              &bull; <strong>乐观工时 (O - Optimistic)</strong>：一切顺利、无任何意外阻碍时的最短可能耗时；<br />
              &bull;
              <strong>最可能工时 (M - Most Likely)</strong>：按常规节奏、最常见情况下发生概率最高的实际工作量；<br />
              &bull;
              <strong>悲观工时 (P - Pessimistic)</strong>：遭遇技术卡点、需求变更、返工重构等各种恶劣情况下的最长耗时。
            </p>
          </div>

          <div class="formula-block">
            <h5 class="formula-title">标准差 (&sigma; - Standard Deviation)</h5>
            <div class="math-box">
              <div class="formula-expr">&sigma; = (P - O) / 6</div>
            </div>
            <p class="formula-desc">
              <strong>衡量单个任务的不确定性与风险敞口</strong>：&sigma; 越大，说明该任务的技术风险或需求模糊度越高。<br />
              <strong>为什么分母是 6？</strong> 在统计学正态分布中，&plusmn;3&sigma; 区间覆盖了 99.73%
              的概率（几乎为全部可能事件）。假设悲观值 P 到乐观值 O 涵盖了该任务的全部波动范围，即跨度 P - O 对应 6
              个标准差（6&sigma;），因此单个标准差 &sigma; = (P - O) / 6。
            </p>
          </div>
        </el-card>

        <!-- 2. 重点解答：方差是干嘛的？ -->
        <el-card shadow="hover" class="guide-card variance-focus-card">
          <template #header>
            <div class="card-header">
              <span class="title">2. 核心剖析：方差（Variance）到底是什么、是干嘛的？</span>
              <el-tag size="small" type="warning" effect="dark">重点解析</el-tag>
            </div>
          </template>

          <div class="formula-block">
            <div class="math-box accent-box">
              <span class="formula-label">方差数学定义公式（标准差的平方）:</span>
              <div class="formula-expr warning-expr">V = &sigma;² = ((P - O) / 6)²</div>
            </div>

            <p class="section-lead">
              很多团队在接触 PERT 时都会困惑：<strong
                >“既然已经有了标准差 &sigma;，为什么还要算方差 V？方差究竟有什么用？”</strong
              >
            </p>

            <div class="feature-list">
              <div class="feature-item">
                <div class="feature-tag">作用一</div>
                <div class="feature-content">
                  <h6>多任务串联汇总的唯一数学桥梁（方差的可加性）</h6>
                  <p>
                    <strong>这是方差最重要的核心作用！</strong> 概率论中有一个根本定理：<strong
                      >相互独立的随机变量之和，其方差具有线性可加性（V<sub>total</sub> = &sum;
                      V<sub>i</sub>），但标准差绝对不可直接相加（&sigma;<sub>total</sub> &ne; &sum;
                      &sigma;<sub>i</sub>）</strong
                    >。<br />
                    因此，在多任务项目汇总时，<strong>方差充当了唯一的“中间计算货币”</strong>——我们必须先将各任务的标准差平方化为方差相加求和，最后再开方还原为项目总标准差。
                  </p>
                </div>
              </div>

              <div class="feature-item">
                <div class="feature-tag">作用二</div>
                <div class="feature-content">
                  <h6>量化“风险分散与对冲效应”，消除虚高排期水份</h6>
                  <p>
                    在实际工程中，各任务遇到的技术风险通常是相互独立的。任务 A 延期，并不意味着任务 B
                    也会同时以最坏情况爆发；部分任务提前完成，部分任务稍有耽搁，彼此会<strong>相互对冲与抵消</strong>。<br />
                    方差合成（平方再开方）反映了这种<strong>“不把鸡蛋放在一个篮子里”</strong>的统计规律，能够精确挤出直接加标准差产生的虚假缓冲，制定出紧凑而可靠的项目排期。
                  </p>
                </div>
              </div>

              <div class="feature-item">
                <div class="feature-tag">作用三</div>
                <div class="feature-content">
                  <h6>不确定性的平方放大器与高风险“攻坚任务”识别</h6>
                  <p>
                    标准差反映的是偏离均值的绝对线性距离，而方差通过平方，<strong>极大放大了不确定性对整体项目的冲击力</strong>。一个标准差为
                    4 天的任务，其贡献的方差（16）是标准差为 2 天任务（4）的整整 <strong>4 倍</strong>！<br />
                    借助方差，项目经理可以一眼定位哪几个核心任务是项目风险的“最大黑天鹅”，优先安排预研攻坚或任务细化拆解。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右列：多任务汇总原则 & 置信度决策 -->
      <el-col :xs="24" :lg="12">
        <!-- 3. 多任务串联汇总与方差合成原则 -->
        <el-card shadow="hover" class="guide-card">
          <template #header>
            <div class="card-header">
              <span class="title">3. 多任务串联汇总与方差合成原则</span>
              <el-tag size="small" type="danger">核心原则</el-tag>
            </div>
          </template>

          <div class="formula-block highlight-block">
            <h5 class="formula-title danger-text">⚠️ 为什么标准差不能直接相加？</h5>
            <div class="warning-box">
              <p>
                <strong>独立随机事件不应假设全盘崩溃</strong
                >：如果直接将各个任务的标准差相加（&sum;&sigma;），在统计学上等同于做出了极不现实的假设——<strong>“每个任务都在同一时刻以最倒霉的最坏悲观情况全线爆发”</strong>。
              </p>
              <p>
                这会导致汇总出的风险缓冲被严重夸大（甚至虚高 50%
                以上），给项目争取了不切实际过长的缓冲期，造成预算失控与市场窗口延误。
              </p>
            </div>
          </div>

          <div class="formula-block">
            <h5 class="formula-title">多任务科学合成四步法</h5>
            <div class="math-box">
              <div class="math-row">
                <span class="formula-label">① 项目总期望工作量（期望值直接线性相加）:</span>
                <div class="formula-expr">T<sub>total</sub> = &sum; T<sub>e, i</sub></div>
              </div>
              <div class="math-row">
                <span class="formula-label">② 项目总方差（各任务方差直接累加）:</span>
                <div class="formula-expr">V<sub>total</sub> = &sum; V<sub>i</sub> = &sum; &sigma;<sub>i</sub>²</div>
              </div>
              <div class="math-row">
                <span class="formula-label">③ 项目总标准差（对总方差取平方根）:</span>
                <div class="formula-expr success-expr">
                  &sigma;<sub>total</sub> = &radic;(V<sub>total</sub>) = &radic;(&sum; ((P<sub>i</sub> - O<sub>i</sub>)
                  / 6)²)
                </div>
              </div>
              <div class="math-row">
                <span class="formula-label">④ 整体变异系数 (CV - 综合风险等级衡量):</span>
                <div class="formula-expr info-expr">
                  CV = (&sigma;<sub>total</sub> / T<sub>total</sub>) &times; 100%
                </div>
              </div>
            </div>
          </div>

          <div class="formula-block">
            <h5 class="formula-title">置信度分布与项目承诺兑现概率</h5>
            <p class="formula-desc">
              根据<strong>中心极限定理（Central Limit Theorem）</strong
              >，无论各个单任务服从何种具体分布，当多个独立任务汇总相加后，总工期的概率分布将强收敛于<strong>正态分布（高斯分布）</strong>：
            </p>
            <ul class="guide-list">
              <li>
                <strong>68.27% 双侧置信区间 [T<sub>total</sub> - &sigma;, T<sub>total</sub> + &sigma;]</strong>：
                单侧最晚按期完成概率为 <strong>84.13%</strong>，适合内部敏捷冲刺迭代、常规发版排期。
              </li>
              <li>
                <strong>95.45% 双侧置信区间 [T<sub>total</sub> - 2&sigma;, T<sub>total</sub> + 2&sigma;]</strong>：
                单侧最晚按期完成概率为 <strong>97.72%</strong>，适合跨部门联调、外部合同及大版本商业交付基线。
              </li>
              <li>
                <strong>99.73% 双侧置信区间 [T<sub>total</sub> - 3&sigma;, T<sub>total</sub> + 3&sigma;]</strong>：
                单侧最晚按期完成概率为 <strong>99.87%</strong>，极高置信度，适合核心系统重构、监管合规等重大关键节点。
              </li>
            </ul>
          </div>
        </el-card>

        <!-- 4. 敏捷实战 FAQ -->
        <el-card shadow="hover" class="guide-card">
          <template #header>
            <div class="card-header">
              <span class="title">4. 敏捷估算实战常见疑问 (FAQ)</span>
              <el-tag size="small" type="info">实践指南</el-tag>
            </div>
          </template>

          <div class="faq-list">
            <div class="faq-item">
              <h6 class="faq-q">Q1: 乐观值 (O)、最可能值 (M)、悲观值 (P) 必须满足什么约束？</h6>
              <p class="faq-a">
                必须严格满足 <strong>O &le; M &le; P</strong> 且 <strong>P &gt; 0</strong>。如果 M 小于 O 或 P 小于
                M，说明评估逻辑存在矛盾，工具会自动触发校验拦截。
              </p>
            </div>

            <div class="faq-item">
              <h6 class="faq-q">Q2: 什么时候使用经典 Beta 分布（4x），什么时候使用三角分布（1x）？</h6>
              <p class="faq-a">
                <strong>经典 Beta 分布 (4x)</strong>：团队对常规开发流程较熟悉、有历史基准，最可能值 M
                具有较强置信度，推荐作为默认模式；<br />
                <strong>三角分布 (1x)</strong>：探索全新技术栈、接手未知的遗留代码，M
                的置信度不高，三者同等对待算术平均更稳妥。
              </p>
            </div>

            <div class="faq-item">
              <h6 class="faq-q">Q3: 遇到一个变异系数（CV）高于 30% 的任务该怎么办？</h6>
              <p class="faq-a">
                变异系数高说明该任务的不确定性很大（P 远大于 O）。推荐做法：<strong
                  >先安排 0.5~1 天的技术探针（Spike）进行概念验证</strong
                >，或者<strong>将大任务进一步拆解为若干职责明确的子任务</strong>，重新进行三点评估，即可显著降低方差与风险敞口。
              </p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { TrendCharts } from '@element-plus/icons-vue'
</script>

<style scoped>
.pert-formula-guide {
  margin-top: 8px;
}

.guide-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.hero-card {
  border-left: 4px solid var(--el-color-primary);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 18px;
  color: var(--el-color-primary);
}

.card-header .title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.lead-text {
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
  margin: 0 0 14px 0;
}

.concept-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

@media (max-width: 768px) {
  .concept-grid {
    grid-template-columns: 1fr;
  }
}

.concept-box {
  padding: 12px 14px;
  border-radius: 6px;
  background-color: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
}

.concept-box.pert {
  border-color: var(--el-color-primary-light-5);
  background-color: var(--el-color-primary-light-9);
}

html.dark .concept-box.pert {
  background-color: rgba(64, 158, 255, 0.1);
  border-color: rgba(64, 158, 255, 0.35);
}

.concept-badge {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}

.concept-badge.highlight {
  color: var(--el-color-primary);
}

.concept-desc {
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  margin: 0;
}

.formula-block {
  margin-bottom: 18px;
}

.formula-block:last-child {
  margin-bottom: 0;
}

.formula-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 8px 0;
}

.danger-text {
  color: var(--el-color-danger);
}

.math-box {
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 12px 14px;
  font-family: 'Times New Roman', Times, serif, monospace;
}

.accent-box {
  background: var(--el-color-warning-light-9);
  border-color: var(--el-color-warning-light-5);
}

html.dark .accent-box {
  background: rgba(230, 162, 60, 0.1);
  border-color: rgba(230, 162, 60, 0.35);
}

.math-row {
  margin-bottom: 8px;
}

.math-row:last-child {
  margin-bottom: 0;
}

.formula-label {
  display: block;
  font-size: 12px;
  font-family: var(--el-font-family);
  color: var(--el-text-color-secondary);
  margin-bottom: 2px;
}

.formula-expr {
  font-size: 15px;
  font-weight: bold;
  color: var(--el-color-primary);
}

.warning-expr {
  color: var(--el-color-warning);
}

.success-expr {
  color: var(--el-color-success);
}

.info-expr {
  color: #67c23a;
}

.formula-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
  margin: 6px 0 0 0;
}

.section-lead {
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  margin: 10px 0 12px 0;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feature-item {
  display: flex;
  gap: 10px;
  background-color: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 10px 12px;
}

.feature-tag {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
  border: 1px solid var(--el-color-warning-light-5);
  border-radius: 4px;
}

html.dark .feature-tag {
  background: rgba(230, 162, 60, 0.15);
  border-color: rgba(230, 162, 60, 0.4);
}

.feature-content h6 {
  margin: 0 0 4px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.feature-content p {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

.warning-box {
  background: var(--el-color-danger-light-9);
  border-left: 4px solid var(--el-color-danger);
  padding: 10px 14px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

html.dark .warning-box {
  background: rgba(245, 108, 108, 0.1);
}

.warning-box p {
  margin: 0 0 6px 0;
}

.warning-box p:last-child {
  margin: 0;
}

.guide-list {
  margin: 6px 0 0 0;
  padding-left: 18px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  line-height: 1.8;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.faq-item {
  border-bottom: 1px dashed var(--el-border-color-lighter);
  padding-bottom: 10px;
}

.faq-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.faq-q {
  margin: 0 0 4px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.faq-a {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}
</style>
