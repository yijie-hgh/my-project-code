// pages/monitor/monitor.js
const { monitorApi } = require('../../utils/api')
const { requireLogin } = require('../../utils/auth')
const { toast } = require('../../utils/util')

Page({
  data: {
    activeTab: 'server',
    serverInfo: null,
    cacheInfo: null,
    autoRefresh: false
  },

  onLoad() {
    if (!requireLogin()) return
    this.loadData()
  },

  onShow() {
    if (!requireLogin()) return
  },

  // 切换Tab
  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    // 按需加载对应数据
    if (tab === 'server' && !this.data.serverInfo) {
      this.loadServerInfo()
    } else if (tab === 'cache' && !this.data.cacheInfo) {
      this.loadCacheInfo()
    }
  },

  // 加载所有数据
  async loadData() {
    await Promise.all([
      this.loadServerInfo(),
      this.loadCacheInfo()
    ])
  },

  // 加载服务器信息
  async loadServerInfo() {
    try {
      const res = await monitorApi.getServerInfo()
      this.setData({ serverInfo: res.data })
    } catch (err) {
      console.error('加载服务器信息失败', err)
      toast('加载服务器信息失败')
    }
  },

  // 加载缓存信息
  async loadCacheInfo() {
    try {
      const res = await monitorApi.getCacheInfo()
      this.setData({ cacheInfo: res.data })
    } catch (err) {
      console.error('加载缓存信息失败', err)
      toast('加载缓存信息失败')
    }
  },

  // 手动刷新
  onRefresh() {
    if (this.data.activeTab === 'server') {
      this.loadServerInfo()
    } else {
      this.loadCacheInfo()
    }
    toast('已刷新', 'none')
  },

  // 切换自动刷新
  onToggleRefresh() {
    const autoRefresh = !this.data.autoRefresh
    this.setData({ autoRefresh })
    if (autoRefresh) {
      toast('已开启自动刷新，每5秒刷新一次', 'none')
      this._refreshTimer = setInterval(() => {
        this.loadData()
      }, 5000)
    } else {
      toast('已关闭自动刷新', 'none')
      if (this._refreshTimer) {
        clearInterval(this._refreshTimer)
        this._refreshTimer = null
      }
    }
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh())
  },

  onUnload() {
    if (this._refreshTimer) {
      clearInterval(this._refreshTimer)
    }
  }
})
