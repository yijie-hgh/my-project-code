// pages/event/detail/detail.js - 事件详情页
const { eventApi } = require('../../../utils/api')
const { requireLogin, getUserInfo } = require('../../../utils/auth')
const {
  eventStatusMap,
  eventLevelMap,
  formatDateTime,
  toast,
  showLoading,
  hideLoading,
  confirm
} = require('../../../utils/util')

Page({
  data: {
    id: '',
    event: null,
    tracks: [],
    loading: true,
    showTrackInput: false,
    trackContent: ''
  },

  onLoad(options) {
    if (!requireLogin()) return
    this.setData({ id: options.id })
    this.loadDetail()
  },

  onShow() {
    if (!requireLogin()) return
  },

  // 加载事件详情
  async loadDetail() {
    this.setData({ loading: true })
    try {
      const res = await eventApi.detail(this.data.id)
      const event = res.data || {}
      const tracks = (event.tracks || []).map(t => ({
        ...t,
        operateTimeText: formatDateTime(t.operateTime)
      }))
      this.setData({
        event: {
          ...event,
          statusInfo: eventStatusMap[event.status] || {},
          levelInfo: eventLevelMap[event.level] || {},
          createTimeText: formatDateTime(event.createTime),
          finishTimeText: formatDateTime(event.finishTime)
        },
        tracks,
        loading: false
      })
    } catch (err) {
      console.error('加载事件详情失败', err)
      this.setData({ loading: false })
      toast('加载失败')
    }
  },

  // 开始处理
  async onStartHandle() {
    const ok = await confirm('确定开始处理该事件吗？')
    if (!ok) return
    showLoading('处理中...')
    try {
      const userInfo = getUserInfo()
      await eventApi.handle(this.data.id, {
        status: '1',
        handler: userInfo ? userInfo.userName : ''
      })
      hideLoading()
      toast('已开始处理', 'success')
      this.loadDetail()
    } catch (err) {
      hideLoading()
      console.error('处理失败', err)
      toast('操作失败')
    }
  },

  // 显示跟踪输入框
  onShowTrackInput() {
    this.setData({ showTrackInput: true, trackContent: '' })
  },

  // 隐藏跟踪输入框
  onHideTrackInput() {
    this.setData({ showTrackInput: false })
  },

  // 输入跟踪内容
  onTrackInput(e) {
    this.setData({ trackContent: e.detail.value })
  },

  // 提交跟踪记录
  async onSubmitTrack() {
    const content = this.data.trackContent.trim()
    if (!content) {
      toast('请输入跟踪内容')
      return
    }
    showLoading('提交中...')
    try {
      const userInfo = getUserInfo()
      await eventApi.addTrack({
        eventId: this.data.id,
        action: '更新进度',
        content: content,
        operator: userInfo ? userInfo.userName : ''
      })
      hideLoading()
      this.setData({ showTrackInput: false, trackContent: '' })
      toast('跟踪成功', 'success')
      this.loadDetail()
    } catch (err) {
      hideLoading()
      console.error('添加跟踪失败', err)
      toast('操作失败')
    }
  },

  // 标记解决
  async onMarkResolved() {
    const ok = await confirm('确定标记该事件为已解决吗？')
    if (!ok) return
    showLoading('处理中...')
    try {
      await eventApi.handle(this.data.id, { status: '2' })
      hideLoading()
      toast('已标记解决', 'success')
      this.loadDetail()
    } catch (err) {
      hideLoading()
      console.error('操作失败', err)
      toast('操作失败')
    }
  },

  // 关闭事件
  async onCloseEvent() {
    const ok = await confirm('确定关闭该事件吗？关闭后不可恢复。')
    if (!ok) return
    showLoading('处理中...')
    try {
      await eventApi.handle(this.data.id, { status: '3' })
      hideLoading()
      toast('已关闭事件', 'success')
      this.loadDetail()
    } catch (err) {
      hideLoading()
      console.error('操作失败', err)
      toast('操作失败')
    }
  },

  // 跳转完整跟踪页
  goTrack() {
    wx.navigateTo({ url: '/pages/event/track/track?id=' + this.data.id })
  },

  // 预览图片
  onPreviewImage(e) {
    const { urls, current } = e.currentTarget.dataset
    wx.previewImage({ current, urls })
  }
})
