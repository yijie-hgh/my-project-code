// pages/mine/mine.js
const { getUserInfo, removeToken, requireLogin } = require('../../utils/auth')
const { authApi } = require('../../utils/api')
const { confirm, toast, showLoading, hideLoading } = require('../../utils/util')
const { account } = require('../../utils/feishu')
const { notification } = require('../../utils/notification')
const { permission, ROLES } = require('../../utils/permission')

Page({
  data: {
    userInfo: null,
    feishuAccount: null,
    feishuLoggedIn: false,
    unreadCount: 0,
    currentRole: null,
    menuList: [
      { title: '巡检任务', icon: '📋', url: '/pages/task/list/list', color: '#2563eb' },
      { title: '事件管理', icon: '⚠️', url: '/pages/event/list/list', color: '#f59e0b' },
      { title: '设备档案', icon: '📦', url: '/pages/equipment/list/list', color: '#6366f1' },
      { title: '设备清单', icon: '📋', url: '/pages/equipment/inventory/inventory', color: '#2563eb' },
      { title: '设备台账', icon: '📝', url: '/pages/equipment/ledger/ledger', color: '#6366f1' },
      { title: '设备点检', icon: '✅', url: '/pages/spotcheck/list/list', color: '#10b981' },
      { title: '报修维修', icon: '🛠️', url: '/pages/repair/list/list', color: '#ef4444' },
      { title: '维护保养', icon: '🔧', url: '/pages/maintain/list/list', color: '#f59e0b' },
      { title: '备件管理', icon: '🔩', url: '/pages/sparepart/list/list', color: '#8b5cf6' },
      { title: '备件清单', icon: '📦', url: '/pages/sparepart/inventory/inventory', color: '#8b5cf6' },
      { title: '安灯呼叫', icon: '🚨', url: '/pages/andon/andon', color: '#ef4444' },
      { title: '物联网数采', icon: '📡', url: '/pages/iot/iot', color: '#0ea5e9' },
      { title: '设备看板', icon: '📊', url: '/pages/dashboard/dashboard', color: '#2563eb' },
      { title: 'AI智能分析', icon: '🤖', url: '/pages/ai-analysis/ai-analysis', color: '#7c3aed' },
      { title: '到期提醒', icon: '🔔', url: '/pages/reminder/reminder', color: '#f59e0b' },
      { title: '巡检报表', icon: '📊', url: '/pages/report/list/list', color: '#10b981' },
      { title: '系统配置', icon: '⚙️', url: '/pages/config/config', color: '#6b7280' },
      { title: '数据库管理', icon: '🗄️', url: '/pages/database/database', color: '#0891b2' }
    ],
    settingList: [
      { title: '个人资料', icon: '👤', url: '/pages/mine/profile/profile' },
      { title: '账号绑定', icon: '🔗', url: '/pages/account/bind/bind' },
      { title: '消息通知', icon: '🔔', url: '/pages/notifications/notifications', badge: true },
      { title: '飞书集成', icon: '📡', url: '/pages/feishu/settings/settings' },
      { title: '权限管理', icon: '🔐', url: '/pages/permission/permission' },
      { title: '意见反馈', icon: '💬', url: '/pages/mine/feedback/feedback' },
      { title: '关于系统', icon: 'ℹ️', url: '/pages/mine/about/about' }
    ]
  },

  onShow() {
    if (!requireLogin()) return
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 })
    }
    const userInfo = getUserInfo()
    const feishuAcc = account.get()
    const role = permission.getRole(permission.getCurrentRole())
    this.setData({
      userInfo,
      feishuAccount: feishuAcc,
      feishuLoggedIn: !!feishuAcc,
      unreadCount: notification.getUnreadCount(),
      currentRole: role
    })
  },

  goPage(e) {
    const url = e.currentTarget.dataset.url
    if (url.indexOf('task/list') > -1 || url.indexOf('event/list') > -1) {
      wx.switchTab({ url })
    } else {
      wx.navigateTo({ url })
    }
  },

  // 退出登录
  async onLogout() {
    const ok = await confirm('确定退出登录吗？')
    if (!ok) return
    try {
      await authApi.logout()
    } catch (e) {}
    removeToken()
    // 同时退出飞书
    await account.logout()
    toast('已退出登录')
    setTimeout(() => {
      wx.reLaunch({ url: '/pages/login/login' })
    }, 800)
  },

  // 切换微信账号
  async onSwitchWxAccount() {
    const ok = await confirm('确认切换微信账号？将重新进行微信授权。')
    if (!ok) return
    showLoading('切换中...')
    wx.login({
      success: async (res) => {
        try {
          const result = await authApi.wxLogin(res.code)
          const { token, user } = result.data
          // 保留原角色
          const oldRole = permission.getCurrentRole()
          if (oldRole) user.role = oldRole
          // 重新设置
          const { setToken, setUserInfo } = require('../../utils/auth')
          setToken(token)
          setUserInfo(user)
          toast('微信账号已切换', 'success')
          this.setData({ userInfo: user })
        } catch (err) {
          toast('切换失败')
        }
        hideLoading()
      },
      fail: () => {
        hideLoading()
        toast('微信授权失败')
      }
    })
  },

  // 切换飞书账号
  async onSwitchFeishuAccount() {
    const ok = await confirm('确认切换飞书账号？将重新进行飞书授权。')
    if (!ok) return
    await account.logout()
    const res = await account.login()
    if (res.code === 0) {
      toast('飞书账号已切换', 'success')
      this.setData({
        feishuAccount: res.data,
        feishuLoggedIn: true
      })
    } else {
      toast('飞书切换失败')
    }
  },

  // 退出飞书
  async onLogoutFeishu() {
    const ok = await confirm('确认退出飞书账号？')
    if (!ok) return
    await account.logout()
    toast('已退出飞书', 'success')
    this.setData({ feishuAccount: null, feishuLoggedIn: false })
  },

  onCallPhone() {
    wx.makePhoneCall({ phoneNumber: '110189312' })
  }
})
