// pages/event/list/list.js - 事件列表页（TAB页 selected=3）
const { eventApi } = require('../../../utils/api')
const { requireLogin } = require('../../../utils/auth')
const { eventStatusMap, eventLevelMap, timeAgo, toast } = require('../../../utils/util')

Page({
  data: {
    list: [],
    loading: true,
    queryParams: { status: '', title: '' },
    activeTab: '',
    tabs: [
      { key: '', text: '全部' },
      { key: '0', text: '待处理' },
      { key: '1', text: '处理中' },
      { key: '2', text: '已解决' },
      { key: '3', text: '已关闭' }
    ]
  },

  onLoad() {
    if (!requireLogin()) return
  },

  onShow() {
    if (!requireLogin()) return
    // 设置tabBar选中
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
    this.loadData()
  },

  // 加载事件列表
  async loadData() {
    this.setData({ loading: true })
    try {
      const res = await eventApi.list(this.data.queryParams)
      const list = (res.data.rows || []).map(e => ({
        ...e,
        statusInfo: eventStatusMap[e.status] || {},
        levelInfo: eventLevelMap[e.level] || {},
        timeAgoText: timeAgo(e.createTime)
      }))
      this.setData({ list, loading: false })
    } catch (err) {
      console.error('加载事件列表失败', err)
      this.setData({ loading: false })
      toast('加载失败')
    }
  },

  // 切换状态筛选
  onTabChange(e) {
    const key = e.currentTarget.dataset.key
    this.setData({ 'queryParams.status': key, activeTab: key }, () => {
      this.loadData()
    })
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ 'queryParams.title': e.detail.value })
  },

  // 确认搜索
  onSearchConfirm() {
    this.loadData()
  },

  // 清除搜索
  onSearchClear() {
    this.setData({ 'queryParams.title': '' }, () => {
      this.loadData()
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh())
  },

  // 跳转详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/event/detail/detail?id=' + id })
  },

  // 跳转创建
  goCreate() {
    wx.navigateTo({ url: '/pages/event/create/create' })
  }
})
