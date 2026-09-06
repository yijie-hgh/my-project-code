// utils/util.js - 通用工具函数

/** 格式化日期 yyyy-MM-dd */
function formatDate(date, fmt = 'yyyy-MM-dd') {
  if (!date) return ''
  if (typeof date === 'string' || typeof date === 'number') {
    date = new Date(date)
  }
  const o = {
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'h+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds()
  }
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
  }
  for (const k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length))
    }
  }
  return fmt
}

/** 格式化日期时间 yyyy-MM-dd HH:mm */
function formatDateTime(date) {
  return formatDate(date, 'yyyy-MM-dd hh:mm')
}

/** 相对时间：刚刚、x分钟前、x小时前、x天前 */
function timeAgo(time) {
  if (!time) return ''
  const now = Date.now()
  const t = new Date(time).getTime()
  const diff = (now - t) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return Math.floor(diff / 60) + '分钟前'
  if (diff < 86400) return Math.floor(diff / 3600) + '小时前'
  if (diff < 2592000) return Math.floor(diff / 86400) + '天前'
  return formatDate(time)
}

/** 任务状态映射 */
const taskStatusMap = {
  '0': { text: '待执行', tag: 'tag-warning' },
  '1': { text: '执行中', tag: 'tag-primary' },
  '2': { text: '已完成', tag: 'tag-success' },
  '3': { text: '已逾期', tag: 'tag-danger' },
  '4': { text: '已取消', tag: 'tag-gray' }
}

/** 事件状态映射 */
const eventStatusMap = {
  '0': { text: '待处理', tag: 'tag-warning' },
  '1': { text: '处理中', tag: 'tag-primary' },
  '2': { text: '已解决', tag: 'tag-success' },
  '3': { text: '已关闭', tag: 'tag-gray' }
}

/** 事件级别映射 */
const eventLevelMap = {
  '1': { text: '低', tag: 'tag-info' },
  '2': { text: '中', tag: 'tag-warning' },
  '3': { text: '高', tag: 'tag-danger' },
  '4': { text: '紧急', tag: 'tag-danger' }
}

/** 签到方式映射 */
const checkInTypeMap = {
  'qrcode': { text: '二维码', icon: '📋' },
  'nfc': { text: 'NFC', icon: '📡' },
  'gps': { text: 'GPS定位', icon: '📍' }
}

/** 巡检项类型映射 */
const itemTypeMap = {
  'input': '文本填写',
  'number': '数值录入',
  'choice': '单选',
  'multi': '多选',
  'photo': '拍照',
  'signature': '签名'
}

/** 防抖 */
function debounce(fn, delay = 500) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

/** 深拷贝 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

/** 生成UUID */
function uuid() {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** 生成任务编号 */
function genTaskNo() {
  const d = new Date()
  const ymd = formatDate(d, 'yyyyMMdd')
  const rand = Math.floor(Math.random() * 9000 + 1000)
  return 'XJ' + ymd + rand
}

/** 计算完成率 */
function calcRate(done, total) {
  if (!total || total === 0) return 0
  return Math.round((done / total) * 100)
}

/** 显示提示 */
function toast(title, icon = 'none', duration = 2000) {
  wx.showToast({ title, icon, duration })
}

/** 显示加载 */
function showLoading(title = '加载中...') {
  wx.showLoading({ title, mask: true })
}

/** 隐藏加载 */
function hideLoading() {
  wx.hideLoading()
}

/** 确认弹窗 */
function confirm(content, title = '提示') {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => resolve(res.confirm)
    })
  })
}

/** 预览图片 */
function previewImage(urls, current) {
  wx.previewImage({
    current: current || urls[0],
    urls: urls
  })
}

module.exports = {
  formatDate,
  formatDateTime,
  timeAgo,
  taskStatusMap,
  eventStatusMap,
  eventLevelMap,
  checkInTypeMap,
  itemTypeMap,
  debounce,
  deepClone,
  uuid,
  genTaskNo,
  calcRate,
  toast,
  showLoading,
  hideLoading,
  confirm,
  previewImage
}
