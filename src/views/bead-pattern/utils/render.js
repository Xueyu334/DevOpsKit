export function drawPattern(canvas, pattern, options = {}) {
    const {grid = true, codes = true, coordinates = true, cellSize = 24, legend = false} = options
    const {cols, rows, cells, materials} = pattern
    const margin = coordinates ? 30 : 8
    const header = legend ? 64 : 0
    const width = Math.max(legend ? 640 : 0, cols * cellSize + margin * 2)
    const legendColumns = Math.max(1, Math.floor((width - 32) / 200))
    const legendHeight = legend ? 88 + Math.ceil(materials.length / legendColumns) * 28 : 0
    canvas.width = width
    canvas.height = rows * cellSize + margin * 2 + header + legendHeight
    const context = canvas.getContext('2d')
    if (!context) throw new Error('当前浏览器不支持 Canvas')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    const left = margin
    const top = margin + header
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const color = cells[y * cols + x]
            if (!color) continue
            context.fillStyle = color.hex
            context.fillRect(left + x * cellSize, top + y * cellSize, cellSize, cellSize)
            if (codes) {
                context.fillStyle = color.lab[0] > 55 ? '#17202a' : '#ffffff'
                context.font = `${Math.max(6, Math.floor(cellSize * 0.34))}px sans-serif`
                context.textAlign = 'center'
                context.textBaseline = 'middle'
                context.fillText(color.code, left + (x + 0.5) * cellSize, top + (y + 0.5) * cellSize, cellSize - 1)
            }
        }
    }
    if (grid) {
        for (let axis = 0; axis < 2; axis++) {
            const length = axis === 0 ? cols : rows
            for (let index = 0; index <= length; index++) {
                context.beginPath()
                context.strokeStyle = index % 10 === 0 ? '#334155' : index % 5 === 0 ? '#64748b' : '#b8bec680'
                context.lineWidth = index % 10 === 0 ? 1.5 : 0.5
                context.moveTo(left + (axis === 0 ? index * cellSize : 0), top + (axis === 1 ? index * cellSize : 0))
                context.lineTo(
                    left + (axis === 0 ? index * cellSize : cols * cellSize),
                    top + (axis === 1 ? index * cellSize : rows * cellSize)
                )
                context.stroke()
            }
        }
    }
    context.fillStyle = '#334155'
    context.font = '10px sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    if (coordinates) {
        const step = cellSize >= 16 ? 1 : 5
        for (let x = 1; x <= cols; x++) {
            if (x !== 1 && x !== cols && x % step !== 0) continue
            context.fillText(String(x), left + (x - 0.5) * cellSize, top - 12)
            context.fillText(String(x), left + (x - 0.5) * cellSize, top + rows * cellSize + 14)
        }
        for (let y = 1; y <= rows; y++) {
            if (y !== 1 && y !== rows && y % step !== 0) continue
            context.fillText(String(y), left - 15, top + (y - 0.5) * cellSize)
            context.fillText(String(y), left + cols * cellSize + 15, top + (y - 0.5) * cellSize)
        }
    }
    if (legend) {
        context.textAlign = 'left'
        context.font = 'bold 20px sans-serif'
        context.fillText('拼豆图纸 · ARTKAL S 5mm', 16, 24)
        context.font = '13px sans-serif'
        context.fillText(`${cols} × ${rows} 格 · ${pattern.total} 颗 · ${materials.length} 色 · 空白格不放豆`, 16, 50)
        const startY = top + rows * cellSize + margin + 24
        context.fillText('用料清单（屏幕参考色，备料请核对实物色卡）', 16, startY)
        materials.forEach((color, index) => {
            const x = 16 + (index % legendColumns) * ((width - 32) / legendColumns)
            const y = startY + 22 + Math.floor(index / legendColumns) * 28
            context.fillStyle = color.hex
            context.fillRect(x, y - 8, 16, 16)
            context.strokeStyle = '#94a3b8'
            context.lineWidth = 0.5
            context.strokeRect(x, y - 8, 16, 16)
            context.fillStyle = '#334155'
            context.fillText(`${color.code} ${color.name} × ${color.count}`, x + 23, y, (width - 32) / legendColumns - 30)
        })
    }
    return {left, top, cellSize}
}

export function exportPatternPng(pattern) {
    const canvas = document.createElement('canvas')
    // 限制导出画布尺寸；大图缩小单格，但保留色号与每五格坐标。
    const cellSize = Math.min(24, Math.floor(6000 / Math.max(pattern.cols, pattern.rows)))
    drawPattern(canvas, pattern, {cellSize, legend: true})
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            canvas.width = canvas.height = 1
            if (blob) resolve(blob)
            else reject(new Error('图纸导出失败，请减小网格尺寸后重试'))
        }, 'image/png')
    })
}
