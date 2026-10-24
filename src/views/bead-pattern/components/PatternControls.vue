<script setup>
defineProps({
  source: { type: Object, default: null },
  loading: Boolean,
  generating: Boolean
})
const options = defineModel('options', { type: Object, required: true })
defineEmits(['upload', 'clear'])

function update(key, value) {
  options.value = { ...options.value, [key]: value }
}
</script>

<template>
  <el-card class="controls-card" shadow="hover">
    <template #header>
      <div class="card-heading">
        <span>图片与图纸设置</span>
        <el-tag v-if="generating" size="small" type="warning">正在更新图纸</el-tag>
        <el-button v-if="source || loading" type="danger" link @click="$emit('clear')">清空</el-button>
      </div>
    </template>
    <el-scrollbar class="settings-scrollbar" always>
      <div class="settings-content">
        <el-upload
          class="source-uploader"
          v-loading="loading"
          drag
          action="#"
          :auto-upload="false"
          :show-file-list="false"
          accept="image/png,image/jpeg,image/webp"
          aria-label="上传拼豆原图"
          @change="$emit('upload', $event)"
        >
          <img v-if="source" class="source-image" :src="source.url" alt="拼豆原图，点击替换图片" />
          <template v-else>
            <el-icon class="upload-icon"><IconEpUploadFilled /></el-icon>
            <div class="el-upload__text">拖入图片，或 <em>点击选择</em></div>
          </template>
          <div class="hint">PNG / JPG / WebP · 最大 20MB、4000 万像素</div>
        </el-upload>
        <div v-if="source" class="file-info">
          <span class="filename" :title="source.name">{{ source.name }}</span>
          <el-tag size="small" type="info">{{ source.width }} × {{ source.height }} px</el-tag>
        </div>
        <el-form label-position="top" class="settings-form" :disabled="loading">
          <el-form-item label="图片范围">
            <el-radio-group :model-value="options.crop" @update:model-value="update('crop', $event)">
              <el-radio-button value="full">完整图片</el-radio-button>
              <el-radio-button value="square">居中正方形</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="最大边长（颗豆）">
            <el-input-number
              :model-value="options.maxEdge"
              :min="16"
              :max="512"
              :precision="0"
              aria-label="最大边长"
              @update:model-value="update('maxEdge', $event ?? 48)"
            />
            <div class="presets">
              <el-button v-for="size in [29, 48, 58, 80]" :key="size" size="small" @click="update('maxEdge', size)">
                {{ size }} 格
              </el-button>
            </div>
            <div class="hint">16–512 格，另一边按比例计算；建议先用 48 格预览。</div>
          </el-form-item>
          <el-form-item label="ARTKAL S 5mm 色卡子集">
            <el-radio-group :model-value="options.paletteSize" @update:model-value="update('paletteSize', $event)">
              <el-radio-button v-for="size in [16, 24, 32, 64]" :key="size" :value="size"
                >{{ size }} 色</el-radio-button
              >
            </el-radio-group>
            <div class="hint">选择可用色卡范围，实际用色可能更少。</div>
          </el-form-item>
          <el-form-item label="采样方式">
            <el-select
              :model-value="options.sampling"
              aria-label="采样方式"
              @update:model-value="update('sampling', $event)"
            >
              <el-option label="平均取色（照片、平滑色块）" value="average" />
              <el-option label="中心取色（像素画、清晰边缘）" value="center" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-checkbox :model-value="options.skipTransparent" @update:model-value="update('skipTransparent', $event)">
              透明区域留空（不计入用豆量）
            </el-checkbox>
            <div class="hint">平均透明度低于 10% 的格子留空；关闭后透明区域铺白底。</div>
          </el-form-item>
        </el-form>
      </div>
    </el-scrollbar>
    <template #footer>
      <p class="hint privacy">调整参数后，图纸会自动更新。</p>
      <p class="hint privacy">图片仅在浏览器本地处理，不上传服务器。</p>
    </template>
  </el-card>
</template>

<style scoped>
.controls-card {
  display: flex;
  flex-direction: column;
  height: min(720px, calc(100dvh - 160px));
}
.controls-card :deep(.el-card__header),
.controls-card :deep(.el-card__footer) {
  flex-shrink: 0;
}
.controls-card :deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  padding: 0;
}
.settings-scrollbar {
  height: 100%;
}
.settings-scrollbar :deep(.el-scrollbar__wrap) {
  overscroll-behavior: contain;
}
.settings-content {
  padding: 20px;
}
.source-uploader {
  max-width: 360px;
  margin: 0 auto;
}
.source-uploader :deep(.el-upload-dragger) {
  padding: 16px 12px;
}
.card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.source-image {
  display: block;
  max-width: 100%;
  height: 110px;
  object-fit: contain;
  margin: 0 auto 8px;
}
.upload-icon {
  font-size: 32px;
  color: var(--el-color-primary);
  margin-bottom: 8px;
}
.hint {
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
  width: 100%;
  margin-top: 6px;
}
.file-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}
.filename {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}
.settings-form {
  margin-top: 20px;
}
.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
  width: 100%;
}
.presets .el-button + .el-button {
  margin-left: 0;
}
.privacy {
  text-align: center;
  margin-bottom: 0;
}
</style>
