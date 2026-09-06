// pages/register/register.js
const { authApi } = require('../../utils/api')
const { validator, accessToken, secureStorage } = require('../../utils/security')
const { ROLES, permission } = require('../../utils/permission')
const { toast, showLoading, hideLoading } = require('../../utils/util')
const { account } = require('../../utils/feishu')

Page({
  data: {
    form: {
      username: '',
      password: '',
      confirmPassword: '',
      nickName: '',
      phone: '',
      smsCode: '',
      email: '',
      deptName: '',
      role: 'inspector'
    },
    roleOptions: Object.values(ROLES).filter(r => r.id !== 'super_admin'),
    roleIndex: 2,
    passwordStrength: { level: 0, text: '', color: '' },
    agree: false,
    loading: false,
    errors: {},
    // 短信验证码
    smsSending: false,
    smsCountdown: 0,
    // 账号绑定
    wxBound: false,
    wxUserInfo: null,
    feishuBound: false,
    feishuUserInfo: null,
    showBindSection: false
  },

  onLoad() {
    // 检查是否有缓存的用户名
    const cachedUser = secureStorage.get('last_username')
    if (cachedUser) {
      this.setData({ 'form.username': cachedUser })
    }
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ ['form.' + field]: e.detail.value })
    if (field === 'password') {
      this.setData({ passwordStrength: validator.checkPasswordStrength(e.detail.value) })
    }
    // 清除对应字段的错误
    if (this.data.errors[field]) {
      this.setData({ ['errors.' + field]: '' })
    }
  },

  onRoleChange(e) {
    this.setData({ roleIndex: e.detail.value, 'form.role': this.data.roleOptions[e.detail.value].id })
  },

  onAgree(e) {
    this.setData({ agree: e.detail.value.length > 0 })
  },

  // 发送短信验证码
  async onSendSms() {
    const phone = this.data.form.phone
    if (!phone) return toast('请先输入手机号')
    if (!validator.isPhone(phone)) return toast('手机号格式不正确')

    this.setData({ smsSending: true })
    try {
      const res = await authApi.sendSmsCode(phone, 'register')
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
    this.timer = setInterval(() => {
      count--
      this.setData({ smsCountdown: count })
      if (count <= 0) {
        clearInterval(this.timer)
      }
    }, 1000)
  },

  onUnload() {
    if (this.timer) clearInterval(this.timer)
  },

  // 展开/收起账号绑定区域
  toggleBindSection() {
    this.setData({ showBindSection: !this.data.showBindSection })
  },

  // 绑定微信账号
  async onBindWx() {
    showLoading('微信授权中...')
    try {
      const { code } = await new Promise((resolve, reject) => {
        wx.login({ success: resolve, fail: reject })
      })
      // 获取微信用户信息
      const wxRes = await new Promise((resolve, reject) => {
        wx.getUserProfile({ desc: '用于完善用户资料', success: resolve, fail: reject })
      }).catch(() => ({ userInfo: null }))

      const res = await authApi.bindWxAccount({ code })
      if (res.data.success) {
        this.setData({
          wxBound: true,
          wxUserInfo: wxRes.userInfo || { nickName: '微信用户' }
        })
        toast('微信账号绑定成功', 'success')
      } else {
        toast(res.data.msg || '绑定失败')
      }
    } catch (err) {
      console.error('微信绑定失败', err)
      toast('微信绑定失败')
    } finally {
      hideLoading()
    }
  },

  // 解绑微信账号
  async onUnbindWx() {
    const ok = await new Promise(resolve => {
      wx.showModal({ title: '提示', content: '确认解绑微信账号？', success: res => resolve(res.confirm) })
    })
    if (!ok) return
    this.setData({ wxBound: false, wxUserInfo: null })
    toast('已解绑微信账号')
  },

  // 绑定飞书账号
  async onBindFeishu() {
    showLoading('飞书授权中...')
    try {
      const feishuRes = await account.login()
      if (feishuRes.code !== 0) {
        hideLoading()
        return toast('飞书授权失败')
      }
      const feishuAcc = feishuRes.data
      const res = await authApi.bindFeishuAccount({
        openId: feishuAcc.openId,
        name: feishuAcc.name
      })
      if (res.data.success) {
        this.setData({
          feishuBound: true,
          feishuUserInfo: { name: feishuAcc.name, email: feishuAcc.email }
        })
        toast('飞书账号绑定成功', 'success')
      } else {
        toast(res.data.msg || '绑定失败')
      }
    } catch (err) {
      console.error('飞书绑定失败', err)
      toast('飞书绑定失败')
    } finally {
      hideLoading()
    }
  },

  // 解绑飞书账号
  async onUnbindFeishu() {
    const ok = await new Promise(resolve => {
      wx.showModal({ title: '提示', content: '确认解绑飞书账号？', success: res => resolve(res.confirm) })
    })
    if (!ok) return
    await account.logout()
    this.setData({ feishuBound: false, feishuUserInfo: null })
    toast('已解绑飞书账号')
  },

  async onRegister() {
    const { form, agree, wxBound, feishuBound } = this.data
    const errors = {}

    // 安全检查
    if (validator.hasXSS(form.username)) return toast('用户名包含非法内容')
    if (validator.hasSQLInjection(form.username)) return toast('用户名包含非法字符')

    if (!form.username || form.username.length < 3) errors.username = '用户名至少3个字符'
    if (!form.password || form.password.length < 6) errors.password = '密码至少6位'
    if (form.password !== form.confirmPassword) errors.confirmPassword = '两次密码不一致'
    if (!form.nickName) errors.nickName = '请输入昵称'
    if (!form.phone) { errors.phone = '请输入手机号' }
    else if (!validator.isPhone(form.phone)) errors.phone = '手机号格式不正确'
    if (!form.smsCode) errors.smsCode = '请输入验证码'
    else if (form.smsCode.length !== 6) errors.smsCode = '验证码为6位数字'
    if (form.email && !validator.isEmail(form.email)) errors.email = '邮箱格式不正确'
    if (!agree) return toast('请阅读并同意用户协议')

    this.setData({ errors })
    if (Object.keys(errors).length > 0) return

    this.setData({ loading: true })
    showLoading('注册中...')

    try {
      // 验证短信验证码
      const smsRes = await authApi.verifySmsCode(form.phone, form.smsCode)
      if (!smsRes.data.success) {
        hideLoading()
        this.setData({ 'errors.smsCode': smsRes.data.msg || '验证码错误' })
        return
      }

      // 调用注册API
      const regData = { ...form }
      if (wxBound) regData.wxBound = true
      if (feishuBound) regData.feishuBound = true
      await authApi.register(regData)

      // 安全存储凭据
      const token = accessToken.generate()
      secureStorage.set('reg_token', { token, username: form.username, time: Date.now() })

      // 设置用户角色
      permission.setUserRole(form.username, form.role)

      // 记录审计日志
      const { auditLog } = require('../../utils/security')
      auditLog.log('register', 'auth', '用户注册: ' + form.username + (wxBound ? '(微信已绑定)' : '') + (feishuBound ? '(飞书已绑定)' : ''))

      hideLoading()
      toast('注册成功，请登录', 'success')
      setTimeout(() => {
        wx.redirectTo({ url: '/pages/login/login' })
      }, 1000)
    } catch (err) {
      hideLoading()
      console.error('注册失败', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  goLogin() {
    wx.redirectTo({ url: '/pages/login/login' })
  },

  onProtocol() {
    wx.navigateTo({ url: '/pages/mine/about/about' })
  }
})
