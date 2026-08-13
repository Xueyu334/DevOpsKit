import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import 'dayjs/locale/zh-cn'

// 统一启用时区能力与中文语言环境，供应用内所有 dayjs 调用复用
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('zh-cn')
