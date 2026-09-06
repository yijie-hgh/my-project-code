// utils/notification.js - 消息推送模块
// 支持微信订阅消息和飞书消息推送

const { uuid } = require('./util')
const { account } = require('./feishu')

// ============ 消息类型定义 ============
const MSG_TYPES = {
  INSPECTION_REMINDER: { key: 'inspection_reminder', name: '巡检提醒', icon: '📋', feishuTemplate: '巡检任务提醒' },
  REPAIR_NOTIFY: { key: 'repair_notify', name: '报修通知', icon: '🔧', feishuTemplate: '设备报修通知' },
  REPAIR_STATUS: { key: 'repair_status', name: '维修状态更新', icon: '🔄', feishuTemplate: '维修进度通知' },
  MAINTAIN_REMINDER: { key: 'maintain_reminder', name: '保养提醒', icon: '🛠️', feishuTemplate: '保养任务提醒' },
  EVENT_ALERT: { key: 'event_alert', name: '事件告警', icon: '⚠️', feishuTemplate: '巡检事件告警' },
  CALIBRATION_EXPIRE: { key: 'calibration_expire', name: '校验到期', icon: '🔔', feishuTemplate: '校验到期提醒' },
  SPAREPART_LOW: { key: 'sparepart_low', name: '备件不足', icon: '📦', feishuTemplate: '备件库存预警' },
  AI_ALERT: { key: 'ai_alert', name: 'AI风险预警', icon: '🤖', feishuTemplate: 'AI风险预警通知' },
  SYSTEM_NOTICE: { key: 'system_notice', name: '系统通知', icon: '📢', feishuTemplate: '系统通知' }
}

const STORAGE_KEY = 'notification_messages'
const SUBSCRIBE_KEY = 'notification_subscriptions'

// ============ 消息管理 ============
const notification = {
  // 获取本地消息列表
  getMessages() {
    const msgs = wx.getStorageSync(STORAGE_KEY) || []
    return msgs
  },

  // 获取未读消息数
  getUnreadCount() {
    return this.getMessages().filter(m => !m.read).length
  },

  // 添加消息
  addMessage(type, title, content, extra) {
    const msg = {
      id: uuid(),
      type,
      typeName: (MSG_TYPES[type] || {}).name || type,
      icon: (MSG_TYPES[type] || {}).icon || '📢',
      title,
      content,
      extra: extra || {},
      read: false,
      time: new Date().toISOString()
    }
    const msgs = this.getMessages()
    msgs.unshift(msg)
    if (msgs.length > 100) msgs.length = 100
    wx.setStorageSync(STORAGE_KEY, msgs)

    // 如果开启了微信订阅，尝试发送
    this.trySendWxSubscribe(msg)
    // 如果飞书已登录，推送飞书消息
    this.trySendFeishuMessage(msg)

    return msg
  },

  // 标记已读
  markRead(msgId) {
    const msgs = this.getMessages()
    const idx = msgs.findIndex(m => m.id === msgId)
    if (idx > -1) {
      msgs[idx].read = true
      wx.setStorageSync(STORAGE_KEY, msgs)
    }
  },

  // 全部已读
  markAllRead() {
    const msgs = this.getMessages()
    msgs.forEach(m => m.read = true)
    wx.setStorageSync(STORAGE_KEY, msgs)
  },

  // 删除消息
  deleteMessage(msgId) {
    let msgs = this.getMessages()
    msgs = msgs.filter(m => m.id !== msgId)
    wx.setStorageSync(STORAGE_KEY, msgs)
  },

  // 清空所有消息
  clearAll() {
    wx.removeStorageSync(STORAGE_KEY)
  },

  // ============ 微信订阅消息 ============
  // 获取订阅状态
  getSubscriptions() {
    return wx.getStorageSync(SUBSCRIBE_KEY) || {}
  },

  // 请求微信订阅消息授权
  requestWxSubscribe(types) {
    const tmplIds = this.getWxTemplateIds(types)
    return new Promise((resolve, reject) => {
      wx.requestSubscribeMessage({
        tmplIds: tmplIds,
        success: (res) => {
          const subs = this.getSubscriptions()
          tmplIds.forEach((id, i) => {
            if (res[id] === 'accept') {
              subs[types[i]] = { templateId: id, status: 'subscribed', time: new Date().toISOString() }
            }
          })
          wx.setStorageSync(SUBSCRIBE_KEY, subs)
          resolve(res)
        },
        fail: reject
      })
    })
  },

  // 微信模板ID映射（实际部署时需在微信公众平台配置）
  getWxTemplateIds(types) {
    const templateMap = {
      inspection_reminder: 'tmpl_inspection_reminder',
      repair_notify: 'tmpl_repair_notify',
      repair_status: 'tmpl_repair_status',
      maintain_reminder: 'tmpl_maintain_reminder',
      event_alert: 'tmpl_event_alert',
      calibration_expire: 'tmpl_calibration_expire',
      sparepart_low: 'tmpl_sparepart_low',
      ai_alert: 'tmpl_ai_alert',
      system_notice: 'tmpl_system_notice'
    }
    return (types || Object.keys(templateMap)).map(t => templateMap[t] || t)
  },

  // 尝试发送微信订阅消息
  async trySendWxSubscribe(msg) {
    const subs = this.getSubscriptions()
    if (subs[msg.type] && subs[msg.type].status === 'subscribed') {
      // 实际部署时调用后端API发送订阅消息
      console.log('微信订阅消息发送（mock）:', msg.type, msg.title)
    }
  },

  // ============ 飞书消息推送 ============
  async trySendFeishuMessage(msg) {
    if (!account.isLoggedIn()) return
    // 实际部署时通过飞书API推送消息
    console.log('飞书消息推送（mock）:', msg.type, msg.title)
  },

  // 发送飞书卡片消息（模拟）
  async sendFeishuCard(toUser, title, content) {
    if (!account.isLoggedIn()) {
      return { code: -1, msg: '飞书未登录', data: null }
    }
    // 模拟飞书消息发送
    const cardMsg = {
      msgType: 'interactive',
      card: {
        header: { title: { content: title }, template: 'blue' },
        elements: [
          { tag: 'markdown', content: content }
        ]
      },
      toUser,
      time: new Date().toISOString()
    }
    return { code: 0, msg: 'success', data: cardMsg }
  },

  // ============ 便捷推送方法 ============
  // 巡检提醒
  pushInspectionReminder(taskName, inspector, deadline) {
    return this.addMessage(
      'inspection_reminder',
      '巡检任务提醒',
      '巡检任务"' + taskName + '"待执行\n巡检人：' + inspector + '\n截止时间：' + deadline,
      { taskName, inspector, deadline }
    )
  },

  // 报修通知
  pushRepairNotify(repairNo, equipName, reporter, level) {
    return this.addMessage(
      'repair_notify',
      '新报修单：' + repairNo,
      '设备：' + equipName + '\n报修人：' + reporter + '\n紧急程度：' + level,
      { repairNo, equipName, reporter, level }
    )
  },

  // 维修状态更新
  pushRepairStatus(repairNo, status, repairer) {
    return this.addMessage(
      'repair_status',
      '维修状态更新：' + repairNo,
      '当前状态：' + status + '\n维修人：' + repairer,
      { repairNo, status, repairer }
    )
  },

  // 保养提醒
  pushMaintainReminder(maintainNo, equipName, planDate) {
    return this.addMessage(
      'maintain_reminder',
      '保养任务提醒',
      '保养单号：' + maintainNo + '\n设备：' + equipName + '\n计划日期：' + planDate,
      { maintainNo, equipName, planDate }
    )
  },

  // 事件告警
  pushEventAlert(eventTitle, level, pointName) {
    return this.addMessage(
      'event_alert',
      '巡检事件告警：' + eventTitle,
      '级别：' + level + '\n巡检点：' + pointName,
      { eventTitle, level, pointName }
    )
  },

  // 校验到期
  pushCalibrationExpire(equipName, expireDate, daysLeft) {
    return this.addMessage(
      'calibration_expire',
      '设备校验到期提醒',
      '设备：' + equipName + '\n到期日期：' + expireDate + '\n剩余天数：' + daysLeft + '天',
      { equipName, expireDate, daysLeft }
    )
  },

  // 备件不足
  pushSparepartLow(partName, stock, minStock) {
    return this.addMessage(
      'sparepart_low',
      '备件库存不足',
      '备件：' + partName + '\n当前库存：' + stock + '\n最低库存：' + minStock,
      { partName, stock, minStock }
    )
  },

  // AI风险预警
  pushAIAlert(equipName, riskLevel, factors) {
    return this.addMessage(
      'ai_alert',
      'AI风险预警：' + equipName,
      '风险等级：' + riskLevel + '\n风险因素：' + (factors || []).join('、'),
      { equipName, riskLevel, factors }
    )
  },

  // 系统通知
  pushSystemNotice(title, content) {
    return this.addMessage('system_notice', title, content, {})
  },

  // 获取消息类型定义
  getMsgTypes() {
    return MSG_TYPES
  }
}

module.exports = {
  MSG_TYPES,
  notification
}
