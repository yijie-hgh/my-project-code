// pages/index/index.js
const { dashboardApi, taskApi } = require('../../utils/api')
const { getUserInfo, requireLogin } = require('../../utils/auth')
const { taskStatusMap, calcRate, timeAgo, formatDateTime } = require('../../utils/util')

Page({
  data: {
    userInfo: null,
    stats: null,
    todayTasks: [],
    maxTrendDone: 1,
    loading: true
  },

  onLoad() {
    if (!requireLogin()) return
  },

  onShow() {
    if (!requireLogin()) return
    // 设置tabBar选中
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      const [statsRes, taskRes] = await Promise.all([
        dashboardApi.getStats(),
        taskApi.list({ status: '0,1' })
      ])
      const stats = statsRes.data
      const maxDone = Math.max(...stats.weekTrend.map(t => t.done), 1)
      const todayTasks = (taskRes.data.rows || []).map(t => ({
        ...t,
        statusInfo: taskStatusMap[t.status] || {},
        rate: calcRate(t.doneCount, t.pointCount)
      })).slice(0, 5)

      this.setData({
        userInfo: getUserInfo(),
        stats,
        todayTasks,
        maxTrendDone: maxDone,
        loading: false
      })
    } catch (err) {
      console.error('加载数据失败', err)
      this.setData({ loading: false })
    }
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh())
  },

  goTask(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/task/detail/detail?id=' + id })
  },

  goScan() {
    wx.switchTab({ url: '/pages/scan/scan' })
  },

  goPage(e) {
    const url = e.currentTarget.dataset.url
    if (url === '/pages/scan/scan') {
      wx.switchTab({ url })
    } else {
      wx.navigateTo({ url })
    }
  },

  goTaskList() {
    wx.switchTab({ url: '/pages/task/list/list' })
  },

  goEventList() {
    wx.switchTab({ url: '/pages/event/list/list' })
  }
})
