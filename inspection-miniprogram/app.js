// app.js - 设备巡检小程序入口
const { checkLogin } = require('./utils/auth')
const { account } = require('./utils/feishu')

App({
  globalData: {
    // 后端API基础地址（若依Spring Boot服务）
    baseUrl: 'http://localhost:8080',
    // 是否使用Mock数据（无后端时设为true，便于演示）
    useMock: true,
    // 用户信息
    userInfo: null,
    // JWT Token
    token: '',
    // 系统配置
    systemInfo: null,
    // 当前定位
    location: null,
    // 飞书账号信息
    feishuAccount: null,
    // 飞书集成是否已启用
    feishuEnabled: true,
    // 是否需要隐私授权
    needPrivacyAuth: false
  },

  onLaunch() {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync()
    this.globalData.systemInfo = systemInfo

    // 读取本地缓存的token
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
    }
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
    }

    // 检查隐私授权（解决 backgroundfetch privacy 警告）
    this.checkPrivacyAuth()

    // 检查登录状态
    if (!checkLogin()) {
      // 未登录跳转登录页
      wx.reLaunch({ url: '/pages/login/login' })
    }

    // 检查飞书账号登录状态
    this.globalData.feishuAccount = account.get()

    // 检查小程序更新
    this.checkUpdate()
  },

  // 检查隐私授权状态
  checkPrivacyAuth() {
    if (wx.getPrivacySetting) {
      wx.getPrivacySetting({
        success: (res) => {
          // needAuthorization 为 true 表示需要用户授权
          if (res.needAuthorization) {
            // 记录需要授权，由具体页面在用户交互时触发
            this.globalData.needPrivacyAuth = true
          } else {
            this.globalData.needPrivacyAuth = false
          }
        },
        fail: () => {
          // 低版本基础库不支持时忽略
          this.globalData.needPrivacyAuth = false
        }
      })
    }
  },

  // 请求隐私授权（需在用户点击事件中调用）
  requirePrivacyAuth() {
    return new Promise((resolve) => {
      if (!this.globalData.needPrivacyAuth) {
        resolve(true)
        return
      }
      // 唤起隐私协议授权弹窗（基础库 2.32.3+ 支持）
      if (wx.requirePrivacyAuthorize) {
        wx.requirePrivacyAuthorize({
          success: () => {
            this.globalData.needPrivacyAuth = false
            resolve(true)
          },
          fail: () => {
            resolve(false)
          }
        })
      } else {
        resolve(true)
      }
    })
  },

  // 检查小程序版本更新
  checkUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()
      updateManager.onCheckForUpdate(function (res) {
        if (res.hasUpdate) {
          updateManager.onUpdateReady(function () {
            wx.showModal({
              title: '更新提示',
              content: '新版本已就绪，是否重启应用？',
              success: function (res) {
                if (res.confirm) {
                  updateManager.applyUpdate()
                }
              }
            })
          })
        }
      })
    }
  },

  // 全局获取定位
  getLocation() {
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: 'gcj02',
        success: (res) => {
          this.globalData.location = res
          resolve(res)
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  }
})
