// pages/notifications/notifications.js
const { notification, MSG_TYPES } = require('../../utils/notification')
const { toast, confirm } = require('../../utils/util')

Page({
  data: {
    messages: [],
    unreadCount: 0,
    filterType: 'all',
    typeOptions: [{ value: 'all', label: '全部' }].concat(
      Object.entries(MSG_TYPES).map(([key, val]) => ({ value: key, label: val.name }))
    )
  },

  onShow() {
    this.loadMessages()
  },

  loadMessages() {
    const messages = notification.getMessages()
    const filtered = this.data.filterType === 'all' ? messages : messages.filter(m => m.type === this.data.filterType)
    this.setData({
      messages: filtered,
      unreadCount: notification.getUnreadCount()
    })
  },

  onFilterChange(e) {
    this.setData({ filterType: e.currentTarget.dataset.type })
    this.loadMessages()
  },

  onMarkRead(e) {
    const id = e.currentTarget.dataset.id
    notification.markRead(id)
    this.loadMessages()
  },

  onMarkAllRead() {
    notification.markAllRead()
    toast('已全部标记为已读', 'success')
    this.loadMessages()
  },

  async onDeleteMessage(e) {
    const id = e.currentTarget.dataset.id
    const ok = await confirm('确认删除此消息？')
    if (!ok) return
    notification.deleteMessage(id)
    this.loadMessages()
  },

  onClearAll() {
    const ok = confirm('确认清空所有消息？')
    ok.then(res => {
      if (!res) return
      notification.clearAll()
      toast('已清空', 'success')
      this.loadMessages()
    })
  },

  // 订阅消息
  onSubscribe() {
    const types = Object.keys(MSG_TYPES)
    notification.requestWxSubscribe(types).then(() => {
      toast('订阅成功', 'success')
    }).catch(() => {
      toast('订阅失败或已取消')
    })
  }
})
