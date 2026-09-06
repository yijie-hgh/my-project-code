// pages/login/login.js
const { authApi } = require('../../utils/api')
const { setToken, setUserInfo, getToken } = require('../../utils/auth')
const { toast, showLoading, hideLoading } = require('../../utils/util')
const { account } = require('../../utils/feishu')
const { secureStorage, validator, accessToken, auditLog } = require('../../utils/security')
const { permission } = require('../../utils/permission')

Page({
  data: {
    username: '',
    password: '',
    loading: false,
    agree: false,
    activeTab: 'account',
    feishuAccount: null,
    feishuLoggedIn: false,
    // 短信登录
    phone: '',
    smsCode: '',
    smsSending: false,
    smsCountdown: 0,
    // 忘记密码
    showResetModal: false,
    resetForm: {
      phone: '',
      smsCode: '',
      newPassword: '',
      confirmPassword: ''
    },
    resetSmsCountdown: 0
  },

  onLoad() {
    const feishuAcc = account.get()
    this.setData({
      feishuAccount: feishuAcc,
      feishuLoggedIn: !!feishuAcc
    })
    // 检查是否有缓存的用户名
    const cachedUser = secureStorage.get('last_username')
    if (cachedUser) {
      this.setData({ username: cachedUser })
    } else {
      this.setData({ username: 'admin', password: 'admin123' })
    }
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ [field]: e.detail.value })
  },

  onResetInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ ['resetForm.' + field]: e.detail.value })
  },

  onAgree(e) {
    this.setData({ agree: e.detail.value.length > 0 })
  },

  onTabChange(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab })
  },

  // 账号密码登录
  async onLogin() {
    const { username, password, agree } = this.data
    if (!username) return toast('请输入用户名')
    if (!password) return toast('请输入密码')
    if (!agree) return toast('请阅读并同意用户协议')

    // 安全检查
    if (validator.hasXSS(username) || validator.hasSQLInjection(username)) {
      return toast('用户名包含非法字符')
    }

    this.setData({ loading: true })
    showLoading('登录中...')
    try {
      const res = await authApi.login({ username, password })
      const { token, user } = res.data
      setToken(token)
      secureStorage.set('last_username', username)
      if (user.role) {
        permission.setUserRole(user.userId || username, user.role)
      }
      setUserInfo(user)
      auditLog.log('login', 'auth', '用户登录: ' + username)
      toast('登录成功', 'success')
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 800)
    } catch (err) {
      console.error('登录失败', err)
    } finally {
      this.setData({ loading: false })
      hideLoading()
    }
  },

  // 短信验证码登录
  async onSmsLogin() {
    const { phone, smsCode, agree } = this.data
    if (!phone) return toast('请输入手机号')
    if (!validator.isPhone(phone)) return toast('手机号格式不正确')
    if (!smsCode) return toast('请输入验证码')
    if (smsCode.length !== 6) return toast('验证码为6位数字')
    if (!agree) return toast('请阅读并同意用户协议')

    this.setData({ loading: true })
    showLoading('登录中...')
    try {
      const res = await authApi.smsLogin({ phone, code: smsCode })
      const { token, user } = res.data
      setToken(token)
      secureStorage.set('last_username', user.userName || phone)
      if (user.role) {
        permission.setUserRole(user.userId || phone, user.role)
      }
      setUserInfo(user)
      auditLog.log('login', 'auth', '短信登录: ' + phone)
      toast('登录成功', 'success')
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 800)
    } catch (err) {
      console.error('短信登录失败', err)
      toast('登录失败')
    } finally {
      this.setData({ loading: false })
      hideLoading()
    }
  },

  // 发送短信验证码（登录）
  async onSendSms() {
    const phone = this.data.phone
    if (!phone) return toast('请输入手机号')
    if (!validator.isPhone(phone)) return toast('手机号格式不正确')

    this.setData({ smsSending: true })
    try {
      const res = await authApi.sendSmsCode(phone, 'login')
      if (res.data.success) {
        toast('验证码已发送', 'success')
        this.startCountdown()
      } else {
        toast(res.data.msg || '发送失败')
      }
    } catch (err) {
      toast('发送失败')
    } finally {
      this.setData({ smsSending: false })
    }
  },

  startCountdown() {
    let count = 60
    this.setData({ smsCountdown: count })
    this.timer && clearInterval(this.timer)
    this.timer = setInterval(() => {
      count--
      this.setData({ smsCountdown: count })
      if (count <= 0) {
        clearInterval(this.timer)
      }
    }, 1000)
  },

  // 发送短信验证码（重置密码）
  async onSendResetSms() {
    const phone = this.data.resetForm.phone
    if (!phone) return toast('请输入手机号')
    if (!validator.isPhone(phone)) return toast('手机号格式不正确')

    try {
      const res = await authApi.sendSmsCode(phone, 'reset')
      if (res.data.success) {
        toast('验证码已发送', 'success')
        this.startResetCountdown()
      } else {
        toast(res.data.msg || '发送失败')
      }
    } catch (err) {
      toast('发送失败')
    }
  },

  startResetCountdown() {
    let count = 60
    this.setData({ resetSmsCountdown: count })
    this.resetTimer && clearInterval(this.resetTimer)
    this.resetTimer = setInterval(() => {
      count--
      this.setData({ resetSmsCountdown: count })
      if (count <= 0) {
        clearInterval(this.resetTimer)
      }
    }, 1000)
  },

  // 重置密码
  async onResetPassword() {
    const { phone, smsCode, newPassword, confirmPassword } = this.data.resetForm
    if (!phone) return toast('请输入手机号')
    if (!validator.isPhone(phone)) return toast('手机号格式不正确')
    if (!smsCode) return toast('请输入验证码')
    if (!newPassword || newPassword.length < 6) return toast('密码至少6位')
    if (newPassword !== confirmPassword) return toast('两次密码不一致')

    showLoading('重置中...')
    try {
      const res = await authApi.resetPassword({ phone, code: smsCode, newPassword })
      if (res.data.success) {
        toast('密码重置成功', 'success')
        this.setData({ showResetModal: false, resetForm: { phone: '', smsCode: '', newPassword: '', confirmPassword: '' } })
      } else {
        toast(res.data.msg || '重置失败')
      }
    } catch (err) {
      toast('重置失败')
    } finally {
      hideLoading()
    }
  },

  showResetModal() {
    this.setData({ showResetModal: true })
  },

  hideResetModal() {
    this.setData({ showResetModal: false })
  },

  // 微信登录
  async onWxLogin() {
    if (!this.data.agree) return toast('请阅读并同意用户协议')
    showLoading('微信登录中...')
    try {
      const { code } = await new Promise((resolve, reject) => {
        wx.login({ success: resolve, fail: reject })
      })
      const res = await authApi.wxLogin(code)
      const { token, user } = res.data
      setToken(token)
      user.wxBound = true
      user.wxOpenId = code
      setUserInfo(user)
      auditLog.log('login', 'auth', '微信登录')
      toast('微信登录成功', 'success')
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 800)
    } catch (err) {
      console.error('微信登录失败', err)
    } finally {
      hideLoading()
    }
  },

  // 飞书登录
  async onFeishuLogin() {
    if (!this.data.agree) return toast('请阅读并同意用户协议')
    showLoading('飞书登录中...')
    try {
      const feishuRes = await account.login()
      if (feishuRes.code !== 0) {
        hideLoading()
        return toast('飞书登录失败')
      }
      const feishuAcc = feishuRes.data
      const res = await authApi.feishuLogin(feishuAcc.openId)
      const { token, user } = res.data
      user.feishuBound = true
      user.feishuOpenId = feishuAcc.openId
      user.feishuName = feishuAcc.name
      setToken(token)
      setUserInfo(user)
      this.setData({ feishuAccount: feishuAcc, feishuLoggedIn: true })
      auditLog.log('login', 'auth', '飞书登录')
      toast('飞书登录成功', 'success')
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 800)
    } catch (err) {
      console.error('飞书登录失败', err)
      toast('飞书登录失败')
    } finally {
      hideLoading()
    }
  },

  goRegister() {
    wx.navigateTo({ url: '/pages/register/register' })
  },

  onProtocol() {
    wx.navigateTo({ url: '/pages/mine/about/about' })
  },

  onUnload() {
    this.timer && clearInterval(this.timer)
    this.resetTimer && clearInterval(this.resetTimer)
  }
})
