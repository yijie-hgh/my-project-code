// utils/request.js - HTTP请求封装（JWT鉴权 + 安全加密）
const { getToken, removeToken } = require('./auth')
const { encrypt, signData, validator, auditLog } = require('./security')

const app = getApp()

/**
 * 封装wx.request
 * @param {Object} options - { url, method, data, header, loading, loadingText }
 */
function request(options) {
  const {
    url,
    method = 'GET',
    data = {},
    header = {},
    loading = false,
    loadingText = '加载中...'
  } = options

  if (loading) {
    wx.showLoading({ title: loadingText, mask: true })
  }

  const baseUrl = (app && app.globalData.baseUrl) || 'http://localhost:8080'
  const token = getToken()

  // 注入JWT Token
  if (token) {
    header['Authorization'] = 'Bearer ' + token
  }
  header['Content-Type'] = header['Content-Type'] || 'application/json'

  // 安全增强：请求添加时间戳和签名
  const timestamp = Date.now()
  header['X-Timestamp'] = timestamp
  header['X-Request-Id'] = 'req_' + timestamp.toString(36) + '_' + Math.random().toString(36).substring(2, 8)

  // 对敏感数据进行安全检查
  if (data && typeof data === 'object') {
    for (const key in data) {
      if (typeof data[key] === 'string') {
        // XSS和SQL注入检测
        if (validator.hasXSS(data[key])) {
          return Promise.reject({ code: -1, msg: '检测到不安全内容: ' + key })
        }
        if (validator.hasSQLInjection(data[key])) {
          return Promise.reject({ code: -1, msg: '检测到非法字符: ' + key })
        }
      }
    }
    // 添加数据签名（防篡改）
    header['X-Data-Signature'] = signData({ ...data, _ts: timestamp })
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: url.startsWith('http') ? url : baseUrl + url,
      method: method,
      data: data,
      header: header,
      timeout: 15000,
      success: (res) => {
        if (loading) wx.hideLoading()

        const statusCode = res.statusCode
        if (statusCode === 200) {
          const resData = res.data
          // 若依统一返回格式 { code, msg, data }
          if (resData.code !== undefined) {
            if (resData.code === 200) {
              // 记录审计日志
              auditLog.log(method + ' ' + url, 'request', { status: 'success' })
              resolve(resData)
            } else if (resData.code === 401) {
              // Token过期
              handleUnauthorized()
              reject(resData)
            } else {
              wx.showToast({ title: resData.msg || '请求失败', icon: 'none' })
              auditLog.log(method + ' ' + url, 'request', { status: 'error', msg: resData.msg })
              reject(resData)
            }
          } else {
            resolve(resData)
          }
        } else if (statusCode === 401) {
          handleUnauthorized()
          reject(res)
        } else {
          wx.showToast({ title: '网络错误(' + statusCode + ')', icon: 'none' })
          reject(res)
        }
      },
      fail: (err) => {
        if (loading) wx.hideLoading()
        wx.showToast({ title: '网络连接失败', icon: 'none' })
        reject(err)
      }
    })
  })
}

/** 处理401未授权 */
function handleUnauthorized() {
  removeToken()
  wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
  setTimeout(() => {
    wx.reLaunch({ url: '/pages/login/login' })
  }, 1500)
}

/** GET请求 */
function get(url, data, options = {}) {
  return request({ url, method: 'GET', data, ...options })
}

/** POST请求 */
function post(url, data, options = {}) {
  return request({ url, method: 'POST', data, ...options })
}

/** PUT请求 */
function put(url, data, options = {}) {
  return request({ url, method: 'PUT', data, ...options })
}

/** DELETE请求 */
function del(url, data, options = {}) {
  return request({ url, method: 'DELETE', data, ...options })
}

/** 文件上传 */
function upload(url, filePath, formData = {}, name = 'file') {
  const token = getToken()
  const baseUrl = (app && app.globalData.baseUrl) || 'http://localhost:8080'
  wx.showLoading({ title: '上传中...', mask: true })
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: baseUrl + url,
      filePath: filePath,
      name: name,
      formData: formData,
      header: token ? { 'Authorization': 'Bearer ' + token } : {},
      success: (res) => {
        wx.hideLoading()
        const data = JSON.parse(res.data)
        if (data.code === 200) {
          resolve(data)
        } else {
          wx.showToast({ title: data.msg || '上传失败', icon: 'none' })
          reject(data)
        }
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({ title: '上传失败', icon: 'none' })
        reject(err)
      }
    })
  })
}

module.exports = {
  request,
  get,
  post,
  put,
  del,
  upload
}
