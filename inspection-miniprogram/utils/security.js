// utils/security.js - 安全工具模块
// 提供数据加密、防篡改、安全存储、输入校验等功能

const { uuid } = require('./util')

// ============ 简易加密/解密（Base64 + XOR）============
const ENCRYPT_KEY = 'inspection_sec_2026'

function encrypt(text) {
  if (!text) return ''
  let result = ''
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ ENCRYPT_KEY.charCodeAt(i % ENCRYPT_KEY.length))
  }
  return wx.arrayBufferToBase64(stringToArrayBuffer(result))
}

function decrypt(encrypted) {
  if (!encrypted) return ''
  try {
    const arr = wx.base64ToArrayBuffer(encrypted)
    let str = arrayBufferToString(arr)
    let result = ''
    for (let i = 0; i < str.length; i++) {
      result += String.fromCharCode(str.charCodeAt(i) ^ ENCRYPT_KEY.charCodeAt(i % ENCRYPT_KEY.length))
    }
    return result
  } catch (e) {
    return ''
  }
}

function stringToArrayBuffer(str) {
  const buf = new ArrayBuffer(str.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < str.length; i++) {
    view[i] = str.charCodeAt(i)
  }
  return buf
}

function arrayBufferToString(buf) {
  const view = new Uint8Array(buf)
  let str = ''
  for (let i = 0; i < view.length; i++) {
    str += String.fromCharCode(view[i])
  }
  return str
}

// ============ 安全存储 ============
const secureStorage = {
  set(key, value) {
    const encrypted = encrypt(typeof value === 'string' ? value : JSON.stringify(value))
    wx.setStorageSync('sec_' + key, encrypted)
  },
  get(key) {
    const encrypted = wx.getStorageSync('sec_' + key)
    if (!encrypted) return null
    const decrypted = decrypt(encrypted)
    try { return JSON.parse(decrypted) } catch (e) { return decrypted }
  },
  remove(key) {
    wx.removeStorageSync('sec_' + key)
  }
}

// ============ 输入安全校验 ============
const validator = {
  // 检测XSS风险
  hasXSS(input) {
    if (typeof input !== 'string') return false
    const patterns = /<script|javascript:|onerror=|onload=|onclick=|<iframe|<embed|<object|eval\(|alert\(|confirm\(/i
    return patterns.test(input)
  },

  // 检测SQL注入风险
  hasSQLInjection(input) {
    if (typeof input !== 'string') return false
    const patterns = /('OR'|'1'='1|UNION\s+SELECT|DROP\s+TABLE|DELETE\s+FROM|INSERT\s+INTO|UPDATE\s+SET|--|;DROP)/i
    return patterns.test(input)
  },

  // 清理输入
  sanitize(input) {
    if (typeof input !== 'string') return input
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/javascript:/gi, '')
  },

  // 验证手机号
  isPhone(phone) {
    return /^1[3-9]\d{9}$/.test(phone)
  },

  // 验证邮箱
  isEmail(email) {
    return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
  },

  // 验证密码强度
  checkPasswordStrength(password) {
    if (!password || password.length < 6) return { level: 0, text: '太短', color: '#ef4444' }
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++
    if (score <= 2) return { level: 1, text: '弱', color: '#ef4444' }
    if (score <= 4) return { level: 2, text: '中', color: '#f59e0b' }
    if (score <= 5) return { level: 3, text: '强', color: '#10b981' }
    return { level: 4, text: '极强', color: '#059669' }
  },

  // 综合安全检查
  validateInput(input, fieldName) {
    const errors = []
    if (this.hasXSS(input)) errors.push(fieldName + '包含不安全内容')
    if (this.hasSQLInjection(input)) errors.push(fieldName + '包含非法字符')
    return { valid: errors.length === 0, errors }
  }
}

// ============ 数据签名（防篡改） ============
function signData(data) {
  const str = JSON.stringify(data) + ENCRYPT_KEY
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return 'sig_' + Math.abs(hash).toString(36)
}

function verifyData(data, signature) {
  return signData(data) === signature
}

// ============ 敏感数据脱敏 ============
function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone
  return phone.substring(0, 3) + '****' + phone.substring(7)
}

function maskEmail(email) {
  if (!email) return email
  const at = email.indexOf('@')
  if (at <= 1) return email
  return email.substring(0, 2) + '***' + email.substring(at)
}

// ============ 访问令牌管理 ============
const accessToken = {
  generate() {
    return 'tok_' + uuid() + '_' + Date.now().toString(36)
  },
  // 检查令牌是否过期
  isExpired(token) {
    if (!token) return true
    const parts = token.split('_')
    if (parts.length < 3) return false
    const timestamp = parseInt(parts[parts.length - 1], 36)
    const maxAge = 24 * 3600 * 1000
    return Date.now() - timestamp > maxAge
  }
}

// ============ 操作审计日志 ============
const auditLog = {
  log(action, module, detail) {
    const entry = {
      id: uuid(),
      action,
      module,
      detail,
      time: new Date().toISOString(),
      user: (getApp().globalData.userInfo || {}).userName || 'unknown'
    }
    const logs = wx.getStorageSync('audit_logs') || []
    logs.unshift(entry)
    if (logs.length > 200) logs.length = 200
    wx.setStorageSync('audit_logs', logs)
  },
  list() {
    return wx.getStorageSync('audit_logs') || []
  },
  clear() {
    wx.removeStorageSync('audit_logs')
  }
}

module.exports = {
  encrypt,
  decrypt,
  secureStorage,
  validator,
  signData,
  verifyData,
  maskPhone,
  maskEmail,
  accessToken,
  auditLog
}
