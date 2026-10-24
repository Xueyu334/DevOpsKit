import {ALL_COLORS, paletteSets} from '../palette.js'

// CIE Lab 匹配参考 PinDouStudio；许可见同目录上级 THIRD_PARTY_LICENSE.txt。
export function rgbToLab(rgb) {
    const [r, g, b] = rgb.map(channel => {
        const value = channel / 255
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    })
    const pivot = value => (value > 0.008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116)
    const x = pivot((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047)
    const y = pivot(r * 0.2126 + g * 0.7152 + b * 0.0722)
    const z = pivot((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883)
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}

export function makePalette(size) {
    if (!paletteSets[size]) throw new Error('不支持的色板精度')
    return paletteSets[size].map(index => {
        const [code, name, , hex] = ALL_COLORS[index]
        const rgb = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16))
        return {code, name, hex, rgb, lab: rgbToLab(rgb)}
    })
}

export function deriveGrid(width, height, maxEdge) {
    if (!(width > 0 && height > 0 && Number.isInteger(maxEdge) && maxEdge >= 16 && maxEdge <= 512)) {
        throw new Error('图片尺寸无效，最大边长须为 16–512 的整数')
    }
    const scale = maxEdge / Math.max(width, height)
    return {cols: Math.max(1, Math.round(width * scale)), rows: Math.max(1, Math.round(height * scale))}
}

export function nearestColor(rgb, palette) {
    const lab = rgbToLab(rgb)
    let nearest = palette[0]
    let best = Infinity
    for (const color of palette) {
        const distance = color.lab.reduce((sum, value, index) => sum + (value - lab[index]) ** 2, 0)
        if (distance < best) {
            best = distance
            nearest = color
        }
    }
    return nearest
}

// 在有界采样图中按格平均，透明像素按 alpha 加权，避免透明边缘混入黑色。
export function sampleCell(data, width, height, x, y, cols, rows, sampling, skipTransparent) {
    const center = sampling === 'center'
    const x0 = Math.min(width - 1, Math.floor(((x + (center ? 0.5 : 0)) * width) / cols))
    const y0 = Math.min(height - 1, Math.floor(((y + (center ? 0.5 : 0)) * height) / rows))
    const x1 = center ? x0 + 1 : Math.min(width, Math.max(x0 + 1, Math.floor(((x + 1) * width) / cols)))
    const y1 = center ? y0 + 1 : Math.min(height, Math.max(y0 + 1, Math.floor(((y + 1) * height) / rows)))
    const sums = [0, 0, 0]
    let alpha = 0
    for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
            const offset = (sy * width + sx) * 4
            const opacity = data[offset + 3] / 255
            alpha += opacity
            for (let channel = 0; channel < 3; channel++) sums[channel] += data[offset + channel] * opacity
        }
    }
    const count = (x1 - x0) * (y1 - y0)
    if (skipTransparent && alpha / count < 0.1) return null
    return sums.map(sum => Math.round(skipTransparent ? sum / alpha : (sum + (count - alpha) * 255) / count))
}

export function summarizeCells(cells) {
    const counts = new Map()
    for (const color of cells) {
        if (!color) continue
        const item = counts.get(color.code)
        if (item) item.count++
        else counts.set(color.code, {...color, count: 1})
    }
    return [...counts.values()].sort((a, b) => b.count - a.count || a.code.localeCompare(b.code))
}

export async function generatePattern(image, options, isCancelled = () => false) {
    const originalWidth = image.naturalWidth || image.width
    const originalHeight = image.naturalHeight || image.height
    const square = options.crop === 'square'
    const width = square ? Math.min(originalWidth, originalHeight) : originalWidth
    const height = square ? width : originalHeight
    const {cols, rows} = deriveGrid(width, height, options.maxEdge)
    const scale = Math.min(1, 1600 / Math.max(width, height))
    const source = document.createElement('canvas')
    source.width = Math.max(1, Math.round(width * scale))
    source.height = Math.max(1, Math.round(height * scale))
    const context = source.getContext('2d', {willReadFrequently: true})
    if (!context) throw new Error('当前浏览器不支持 Canvas')
    context.drawImage(
        image,
        (originalWidth - width) / 2,
        (originalHeight - height) / 2,
        width,
        height,
        0,
        0,
        source.width,
        source.height
    )
    const {data} = context.getImageData(0, 0, source.width, source.height)
    const palette = makePalette(options.paletteSize)
    const cache = new Map()
    const cells = new Array(cols * rows)
    for (let y = 0; y < rows; y++) {
        if (y % 16 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0))
            if (isCancelled()) return null
        }
        for (let x = 0; x < cols; x++) {
            const rgb = sampleCell(
                data,
                source.width,
                source.height,
                x,
                y,
                cols,
                rows,
                options.sampling,
                options.skipTransparent
            )
            if (!rgb) {
                cells[y * cols + x] = null
                continue
            }
            const key = rgb.join(',')
            if (!cache.has(key)) cache.set(key, nearestColor(rgb, palette))
            cells[y * cols + x] = cache.get(key)
        }
    }
    const materials = summarizeCells(cells)
    return {cols, rows, cells, materials, total: materials.reduce((sum, color) => sum + color.count, 0)}
}

export function materialsCsv(pattern) {
    const rows = [['品牌', '系列', '色号', '颜色名称', '参考 HEX', '数量']]
    for (const color of pattern.materials) rows.push(['ARTKAL', 'S 5mm', color.code, color.name, color.hex, color.count])
    rows.push(['总计', '', '', '', '', pattern.total])
    return '\uFEFF' + rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n')
}
