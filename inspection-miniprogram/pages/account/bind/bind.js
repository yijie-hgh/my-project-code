// pages/account/bind/bind.js
const { authApi } = require('../../utils/api')
const { getUserInfo, setUserInfo } = require('../../utils/auth')
const { toast, showLoading, hideLoading, confirm } = require('../../utils/util')
const { account } = require('../../utils/feishu')
const { auditLog } = require('../../utils/security')

Page({
  data: {
    userInfo: null,
    wxBound: false,
    wxUserInfo: null,
    feishuBound: false,
    feishuUserInfo: null,
    loading: false
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const userInfo = getUserInfo()
    const feishuAcc = account.get()
    this.setData({
      userInfo,
      wxBound: !!(userInfo && userInfo.wxBound),
      wxUserInfo: userInfo && userInfo.wxBound ? { nickName: userInfo.wxName || '微信用户', openId: userInfo.wxOpenId } : null,
      feishuBound: !!(feishuAcc || (userInfo && userInfo.feishuBound)),
      feishuUserInfo: feishuAcc ? { name: feishuAcc.name, email: feishuAcc.email } : (userInfo && userInfo.feishuBound ? { name: userInfo.feishuName } : null)
    })
  },

  // 绑定微信
  async onBindWx() {
    if (this.data.loading) return
    this.setData({ loading: true })
    showLoading('微信授权中...')
    try {
      const { code } = await new Promise((resolve, reject) => {
        wx.login({ success: resolve, fail: reject })
      })
      const wxRes = await new Promise((resolve, reject) => {
        wx.getUserProfile({ desc: '用于完善用户资料', success: resolve, fail: reject })
      }).catch(() => ({ userInfo: null }))

      const res = await authApi.bindWxAccount({ code, userId: this.data.userInfo.userId })
      if (res.data.success) {
        const userInfo = getUserInfo()
        userInfo.wxBound = true
        userInfo.wxOpenId = code
        userInfo.wxName = wxRes.userInfo ? wxRes.userInfo.nickName : '微信用户'
        setUserInfo(userInfo)
        this.setData({
          wxBound: true,
          wxUserInfo: { nickName: userInfo.wxName, openId: code }
        })
        auditLog.log('bind', 'auth', '绑定微信账号')
        toast('微信账号绑定成功', 'success')
      } else {
        toast(res.data.msg || '绑定失败')
      }
    } catch (err) {
      console.error('微信绑定失败', err)
      toast('微信绑定失败')
    } finally {
      this.setData({ loading: false })
      hideLoading()
    }
  },

  // 解绑微信
  async onUnbindWx() {
    const ok = await confirm('确认解绑微信账号？解绑后将无法使用微信登录。')
    if (!ok) return
    showLoading('解绑中...')
    try {
      const res = await authApi.unbindWxAccount(this.data.userInfo.userId)
      if (res.data.success) {
        const userInfo = getUserInfo()
        userInfo.wxBound = false
        userInfo.wxOpenId = null
        userInfo.wxName = null
        setUserInfo(userInfo)
        this.setData({ wxBound: false, wxUserInfo: null })
        auditLog.log('unbind', 'auth', '解绑微信账号')
        toast('已解绑微信账号', 'success')
      } else {
        toast(res.data.msg || '解绑失败')
      }
    } catch (err) {
      toast('解绑失败')
    } finally {
      hideLoading()
    }
  },

  // 绑定飞书
  async onBindFeishu() {
    if (this.data.loading) return
    this.setData({ loading: true })
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
        name: feishuAcc.name,
        userId: this.data.userInfo.userId
      })
      if (res.data.success) {
        const userInfo = getUserInfo()
        userInfo.feishuBound = true
        userInfo.feishuOpenId = feishuAcc.openId
        userInfo.feishuName = feishuAcc.name
        setUserInfo(userInfo)
        this.setData({
          feishuBound: true,
          feishuUserInfo: { name: feishuAcc.name, email: feishuAcc.email }
        })
        auditLog.log('bind', 'auth', '绑定飞书账号')
        toast('飞书账号绑定成功', 'success')
      } else {
        toast(res.data.msg || '绑定失败')
      }
    } catch (err) {
      console.error('飞书绑定失败', err)
      toast('飞书绑定失败')
    } finally {
      this.setData({ loading: false })
      hideLoading()
    }
  },

  // 解绑飞书
  async onUnbindFeishu() {
    const ok = await confirm('确认解绑飞书账号？解绑后将无法使用飞书登录和同步功能。')
    if (!ok) return
    showLoading('解绑中...')
    try {
      await account.logout()
      const res = await authApi.unbindFeishuAccount(this.data.userInfo.userId)
      if (res.data.success) {
        const userInfo = getUserInfo()
        userInfo.feishuBound = false
        userInfo.feishuOpenId = null
        userInfo.feishuName = null
        setUserInfo(userInfo)
        this.setData({ feishuBound: false, feishuUserInfo: null })
        auditLog.log('unbind', 'auth', '解绑飞书账号')
        toast('已解绑飞书账号', 'success')
      } else {
        toast(res.data.msg || '解绑失败')
      }
    } catch (err) {
      toast('解绑失败')
    } finally {
      hideLoading()
    }
  },

  // 切换微信账号
  async onSwitchWx() {
    const ok = await confirm('确认切换微信账号？将重新进行微信授权。')
    if (!ok) return
    await this.onUnbindWx()
    if (!this.data.wxBound) {
      setTimeout(() => this.onBindWx(), 500)
    }
  },

  // 切换飞书账号
  async onSwitchFeishu() {
    const ok = await confirm('确认切换飞书账号？将重新进行飞书授权。')
    if (!ok) return
    await account.logout()
    const res = await account.login()
    if (res.code === 0) {
      const userInfo = getUserInfo()
      userInfo.feishuOpenId = res.data.openId
      userInfo.feishuName = res.data.name
      setUserInfo(userInfo)
      this.setData({
        feishuUserInfo: { name: res.data.name, email: res.data.email }
      })
      toast('飞书账号已切换', 'success')
    } else {
      toast('切换失败')
    }
  }
})
