export const bmiCategories = [
  { id: 'underweight', label: '偏瘦', range: 'BMI < 18.5', upper: 18.5, type: 'info' },
  { id: 'normal', label: '正常', range: '18.5 ≤ BMI < 24', upper: 24, type: 'success' },
  { id: 'overweight', label: '超重', range: '24 ≤ BMI < 28', upper: 28, type: 'warning' },
  { id: 'obese', label: '肥胖', range: 'BMI ≥ 28', upper: Infinity, type: 'danger' }
]

export function calculateBmi(height, weight) {
  if (![height, weight].every(value => Number.isFinite(value) && value > 0)) {
    throw new Error('请输入大于 0 的有效身高和体重')
  }
  const value = weight / (height / 100) ** 2
  if (!Number.isFinite(value) || value <= 0) throw new Error('输入数值超出可计算范围，请检查身高和体重')
  return { value, category: bmiCategories.find(category => value < category.upper) }
}
