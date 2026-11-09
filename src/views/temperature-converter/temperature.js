export const temperatureUnits = [
  { id: 'celsius', name: '摄氏度', symbol: '°C', english: 'Celsius', scale: 1, offset: 0, min: -273.15, formula: 'C' },
  {
    id: 'fahrenheit',
    name: '华氏度',
    symbol: '°F',
    english: 'Fahrenheit',
    scale: 1.8,
    offset: 32,
    min: -459.67,
    formula: 'C × 9/5 + 32'
  },
  {
    id: 'kelvin',
    name: '开尔文（开氏度）',
    symbol: 'K',
    english: 'Kelvin',
    scale: 1,
    offset: 273.15,
    min: 0,
    formula: 'C + 273.15'
  },
  {
    id: 'rankine',
    name: '兰氏度',
    symbol: '°R',
    english: 'Rankine',
    scale: 1.8,
    offset: 491.67,
    min: 0,
    formula: '(C + 273.15) × 9/5'
  },
  {
    id: 'reaumur',
    name: '列氏度',
    symbol: '°Ré',
    english: 'Réaumur',
    scale: 0.8,
    offset: 0,
    min: -218.52,
    formula: 'C × 4/5'
  }
]

export function convertTemperature(value, sourceId) {
  const source = temperatureUnits.find(unit => unit.id === sourceId)
  if (!source) throw new Error('请选择有效的温度单位')
  if (!Number.isFinite(value)) throw new Error('请输入有效的温度数值')
  if (value < source.min) {
    throw new Error(`温度不能低于绝对零度（${source.min} ${source.symbol}）`)
  }

  const celsius = Math.max(-273.15, (value - source.offset) / source.scale)
  return temperatureUnits.map(unit => {
    // 最低值钳制仅消除绝对零度处的浮点误差，输入范围已在上方校验。
    const converted = unit.id === sourceId ? value : Math.max(unit.min, celsius * unit.scale + unit.offset)
    if (!Number.isFinite(converted)) throw new Error('数值超出可换算范围，请减小输入值')
    return { ...unit, value: converted }
  })
}
