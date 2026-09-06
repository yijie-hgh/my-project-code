// pages/reminder/reminder.js
const { equipmentApi } = require('../../utils/api')
const { requireLogin } = require('../../utils/auth')
const { toast } = require('../../utils/util')

// 提醒状态映射
const reminderStatusMap = {
  'expired': { text: '已过期', tag: 'tag-danger', color: '#ef4444' },
  'soon': { text: '即将到期', tag: 'tag-warning', color: '#f59e0b' },
  'normal': { text: '正常', tag: 'tag-success', color: '#10b981' }
}

Page({
  data: {
    list: [],
    filteredList: [],
    loading: true,
    activeTab: 'all',
    tabs: [
      { value: 'all', label: '全部' },
      { value: 'expired', label: '已过期' },
      { value: 'soon', label: '即将到期' }
    ],
    stats: {
      total: 0,
      expired: 0,
      soon: 0,
      normal: 0
    }
  },

  onShow() {
    if (!requireLogin()) return
    this.loadData()
  },

  // 加载到期提醒
  async loadData() {
    this.setData({ loading: true })
    try {
      const res = await equipmentApi.getReminders()
      let list = (res.data || []).map(item => ({
        ...item,
        statusInfo: reminderStatusMap[item.status] || {},
        daysLeftText: this.formatDaysLeft(item.daysLeft)
      }))
      // 按紧急程度排序：已过期 -> 即将到期 -> 正常
      const order = { expired: 0, soon: 1, normal: 2 }
      list.sort((a, b) => {
        if (order[a.status] !== order[b.status]) {
          return order[a.status] - order[b.status]
        }
        // 同一状态内按剩余天数升序
        return a.daysLeft - b.daysLeft
      })
      // 统计
      const stats = {
        total: list.length,
        expired: list.filter(i => i.status === 'expired').length,
        soon: list.filter(i => i.status === 'soon').length,
        normal: list.filter(i => i.status === 'normal').length
      }
      this.setData({ list, stats, loading: false })
      this.filterList()
    } catch (err) {
      console.error('加载到期提醒失败', err)
      this.setData({ loading: false })
      toast('加载失败，请重试')
    }
  },

  // 格式化剩余天数
  formatDaysLeft(daysLeft) {
    if (daysLeft < 0) {
      return '已过期' + Math.abs(daysLeft) + '天'
    } else if (daysLeft === 0) {
      return '今日到期'
    } else {
      return '剩余' + daysLeft + '天'
    }
  },

  // 切换筛选
  onTabChange(e) {
    const value = e.currentTarget.dataset.value
    this.setData({ activeTab: value })
    this.filterList()
  },

  // 过滤列表
  filterList() {
    const { list, activeTab } = this.data
    let filteredList = list
    if (activeTab !== 'all') {
      filteredList = list.filter(item => item.status === activeTab)
    }
    this.setData({ filteredList })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh())
  },

  // 跳转设备详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/equipment/detail/detail?id=' + id })
  }
})
