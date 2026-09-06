// pages/maintain/detail/detail.js
const { maintainApi } = require('../../../utils/api')
const { requireLogin } = require('../../../utils/auth')
const { calcRate, toast } = require('../../../utils/util')

// 维护保养状态映射
const maintainStatusMap = {
  '0': { text: '待执行', tag: 'tag-warning' },
  '1': { text: '执行中', tag: 'tag-primary' },
  '2': { text: '已完成', tag: 'tag-success' },
  '3': { text: '已逾期', tag: 'tag-danger' }
}

Page({
  data: {
    maintainId: null,
    detail: null,
    loading: true,
    doneCount: 0,
    totalCount: 0,
    rate: 0,
    canExecute: false
  },

  onLoad(options) {
    if (!requireLogin()) return
    this.setData({ maintainId: options.id })
    this.loadDetail()
  },

  async loadDetail() {
    this.setData({ loading: true })
    try {
      const res = await maintainApi.detail(this.data.maintainId)
      const detail = res.data
      if (detail) {
        detail.statusInfo = maintainStatusMap[detail.status] || {}
        const items = detail.items || []
        const doneCount = items.filter(i => i.done).length
        const totalCount = items.length
        this.setData({
          detail,
          loading: false,
          doneCount,
          totalCount,
          rate: calcRate(doneCount, totalCount),
          canExecute: detail.status === '0' || detail.status === '1'
        })
      } else {
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error('加载保养详情失败', err)
      this.setData({ loading: false })
    }
  },

  // 查看设备详情
  goEquipDetail() {
    const equipId = this.data.detail.equipId
    if (equipId) {
      wx.navigateTo({ url: '/pages/equipment/detail/detail?id=' + equipId })
    }
  },

  // 执行保养
  goExecute() {
    if (!this.data.canExecute) {
      toast('当前状态不可执行')
      return
    }
    wx.navigateTo({
      url: '/pages/maintain/execute/execute?id=' + this.data.maintainId
    })
  },

  onPullDownRefresh() {
    this.loadDetail().then(() => wx.stopPullDownRefresh())
  }
})
