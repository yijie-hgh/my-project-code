// utils/auth.js - 鉴权工具

const TOKEN_KEY = 'token'
const USER_KEY = 'userInfo'

/** 获取Token */
function getToken() {
  return wx.getStorageSync(TOKEN_KEY) || ''
}

/** 设置Token */
function setToken(token) {
  wx.setStorageSync(TOKEN_KEY, token)
  const app = getApp()
  if (app) app.globalData.token = token
}

/** 移除Token */
function removeToken() {
  wx.removeStorageSync(TOKEN_KEY)
  wx.removeStorageSync(USER_KEY)
  const app = getApp()
  if (app) {
    app.globalData.token = ''
    app.globalData.userInfo = null
  }
}

/** 获取用户信息 */
function getUserInfo() {
  return wx.getStorageSync(USER_KEY) || null
}

/** 设置用户信息 */
function setUserInfo(userInfo) {
  wx.setStorageSync(USER_KEY, userInfo)
  const app = getApp()
  if (app) app.globalData.userInfo = userInfo
}

/** 检查是否已登录 */
function checkLogin() {
  return !!getToken()
}

/** 跳转登录页 */
function toLogin() {
  removeToken()
  wx.reLaunch({ url: '/pages/login/login' })
}

/** 检查登录，未登录则跳转 */
function requireLogin() {
  if (!checkLogin()) {
    toLogin()
    return false
  }
  return true
}

module.exports = {
  getToken,
  setToken,
  removeToken,
  getUserInfo,
  setUserInfo,
  checkLogin,
  toLogin,
  requireLogin
}
