// pages/task/list/list.js
const { taskApi } = require('../../../utils/api')
const { requireLogin } = require('../../../utils/auth')
const { taskStatusMap, calcRate, formatDateTime, timeAgo } = require('../../../utils/util')

Page({
  data: {
    list: [],
    loading: true,
    activeTab: 'all',
    tabs: [
      { key: 'all', label: '全部' },
      { key: '0', label: '待执行' },
      { key: '1', label: '执行中' },
      { key: '2', label: '已完成' },
      { key: '3', label: '已逾期' }
    ],
    queryParams: {
      status: '',
      taskName: ''
    }
  },

  onLoad() {
    if (!requireLogin()) return
    this.loadData()
  },

  onShow() {
    if (!requireLogin()) return
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
    // 每次显示刷新数据
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      const params = { ...this.data.queryParams }
      if (this.data.activeTab !== 'all') {
        params.status = this.data.activeTab
      } else {
        params.status = ''
      }
      const res = await taskApi.list(params)
      const list = (res.data.rows || []).map(item => ({
        ...item,
        statusInfo: taskStatusMap[item.status] || {},
        rate: calcRate(item.doneCount, item.pointCount),
        timeText: timeAgo(item.inspectTime)
      }))
      this.setData({ list, loading: false })
    } catch (err) {
      console.error('加载任务失败', err)
      this.setData({ loading: false })
    }
  },

  onTabChange(e) {
    this.setData({ activeTab: e.currentTarget.dataset.key }, () => {
      this.loadData()
    })
  },

  onSearch(e) {
    this.setData({ 'queryParams.taskName': e.detail.value }, () => {
      this.loadData()
    })
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh())
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/task/detail/detail?id=' + id })
  }
})
