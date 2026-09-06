// pages/event/track/track.js - 事件跟踪页
const { eventApi } = require('../../../utils/api')
const { requireLogin, getUserInfo } = require('../../../utils/auth')
const {
  eventStatusMap,
  formatDateTime,
  toast,
  showLoading,
  hideLoading
} = require('../../../utils/util')

// 操作类型图标映射
const actionIconMap = {
  '上报事件': '📢',
  '分配处理人': '👤',
  '现场排查': '🔍',
  '调整运行参数': '⚙️',
  '复测确认': '✅',
  '更新进度': '📝',
  '关闭事件': '🔒'
}

Page({
  data: {
    id: '',
    event: null,
    tracks: [],
    loading: true,
    showInput: false,
    trackContent: ''
  },

  onLoad(options) {
    if (!requireLogin()) return
    this.setData({ id: options.id })
    this.loadData()
  },

  onShow() {
    if (!requireLogin()) return
  },

  // 加载事件详情和跟踪记录
  async loadData() {
    this.setData({ loading: true })
    try {
      const res = await eventApi.detail(this.data.id)
      const event = res.data || {}
      const tracks = (event.tracks || []).map(t => ({
        ...t,
        operateTimeText: formatDateTime(t.operateTime),
        icon: actionIconMap[t.action] || '📌'
      }))
      this.setData({
        event: {
          ...event,
          statusInfo: eventStatusMap[event.status] || {}
        },
        tracks,
        loading: false
      })
    } catch (err) {
      console.error('加载跟踪记录失败', err)
      this.setData({ loading: false })
      toast('加载失败')
    }
  },

  // 显示输入框
  onShowInput() {
    this.setData({ showInput: true, trackContent: '' })
  },

  // 隐藏输入框
  onHideInput() {
    this.setData({ showInput: false })
  },

  // 输入内容
  onInput(e) {
    this.setData({ trackContent: e.detail.value })
  },

  // 提交跟踪记录
  async onSubmit() {
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
      this.setData({ showInput: false, trackContent: '' })
      toast('添加成功', 'success')
      this.loadData()
    } catch (err) {
      hideLoading()
      console.error('添加跟踪失败', err)
      toast('操作失败')
    }
  },

  // 预览图片
  onPreviewImage(e) {
    const { urls, current } = e.currentTarget.dataset
    wx.previewImage({ current, urls })
  }
})
