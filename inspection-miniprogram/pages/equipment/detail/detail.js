// pages/equipment/detail/detail.js
const { equipmentApi, equipDashboardApi } = require('../../../utils/api')
const { requireLogin } = require('../../../utils/auth')
const { toast } = require('../../../utils/util')

// 设备状态映射
const equipStatusMap = {
  '0': { text: '报废', tag: 'tag-gray' },
  '1': { text: '正常运行', tag: 'tag-success' },
  '2': { text: '故障待修', tag: 'tag-danger' },
  '3': { text: '停机保养', tag: 'tag-warning' },
  '4': { text: '待校验', tag: 'tag-info' }
}

Page({
  data: {
    id: null,
    detail: null,
    loading: true,
    calibrationExpired: false,
    healthScore: null,
    timeline: []
  },

  onLoad(options) {
    this.setData({ id: options.id })
  },

  onShow() {
    if (!requireLogin()) return
    if (this.data.id) this.loadData()
  },

  // 加载设备详情
  async loadData() {
    this.setData({ loading: true })
    try {
      const [detailRes, healthRes] = await Promise.all([
        equipmentApi.detail(this.data.id),
        equipDashboardApi.getHealthScore(this.data.id)
      ])
      const detail = detailRes.data || {}
      detail.statusInfo = equipStatusMap[detail.status] || {}
      let calibrationExpired = false
      if (detail.calibrationExpire) {
        const expireTime = new Date(detail.calibrationExpire).getTime()
        calibrationExpired = expireTime < Date.now()
      }

      // 构建维护时间线
      const timeline = this.buildTimeline(detail)

      this.setData({
        detail,
        calibrationExpired,
        healthScore: healthRes.data,
        timeline,
        loading: false
      })
    } catch (err) {
      console.error('加载设备详情失败', err)
      this.setData({ loading: false })
      toast('加载失败，请重试')
    }
  },

  // 构建维护时间线
  buildTimeline(detail) {
    const events = []
    if (detail.lastSpotCheck) {
      events.push({ time: detail.lastSpotCheck, action: '设备点检', icon: '✅', color: '#10b981', desc: '完成日常点检' })
    }
    if (detail.lastInspect) {
      events.push({ time: detail.lastInspect, action: '设备巡检', icon: '📋', color: '#2563eb', desc: '完成周期巡检' })
    }
    if (detail.lastRepair) {
      events.push({ time: detail.lastRepair, action: '报修维修', icon: '🔧', color: '#ef4444', desc: '完成故障维修' })
    }
    if (detail.lastMaintain) {
      events.push({ time: detail.lastMaintain, action: '维护保养', icon: '🛠️', color: '#f59e0b', desc: '完成定期保养' })
    }
    if (detail.calibrationDate) {
      events.push({ time: detail.calibrationDate, action: '设备校验', icon: '📐', color: '#6366f1', desc: '完成设备校验' })
    }
    // 按时间倒序排列
    events.sort((a, b) => {
      return new Date(b.time) - new Date(a.time)
    })
    return events
  },

  // 拨打电话
  onCallPhone() {
    const phone = this.data.detail.managerPhone
    if (!phone) return toast('暂无联系电话')
    wx.makePhoneCall({
      phoneNumber: phone,
      fail: () => {}
    })
  },

  // 查看说明书
  onViewManual() {
    const url = this.data.detail.manualUrl
    if (!url) return toast('暂无设备说明书')
    wx.showLoading({ title: '加载中...' })
    wx.downloadFile({
      url: url,
      success: (res) => {
        wx.hideLoading()
        wx.openDocument({
          filePath: res.tempFilePath,
          fail: () => toast('打开文件失败')
        })
      },
      fail: () => {
        wx.hideLoading()
        toast('下载文件失败')
      }
    })
  },

  // 预览设备图片
  onViewImage() {
    const url = this.data.detail.imageUrl
    if (!url) return toast('暂无设备图片')
    wx.previewImage({ urls: [url] })
  },

  // 点检
  goSpotCheck() {
    const { id, equipName, equipCode } = this.data.detail
    wx.navigateTo({
      url: '/pages/spotcheck/execute/execute?equipId=' + id + '&equipName=' + encodeURIComponent(equipName) + '&equipCode=' + encodeURIComponent(equipCode)
    })
  },

  // 报修
  goRepair() {
    const { id, equipName, equipCode } = this.data.detail
    wx.navigateTo({
      url: '/pages/repair/create/create?equipId=' + id + '&equipName=' + encodeURIComponent(equipName) + '&equipCode=' + encodeURIComponent(equipCode)
    })
  },

  // 保养
  goMaintain() {
    const { id, equipName, equipCode } = this.data.detail
    wx.navigateTo({
      url: '/pages/maintain/list/list?equipId=' + id + '&equipName=' + encodeURIComponent(equipName) + '&equipCode=' + encodeURIComponent(equipCode)
    })
  },

  // 复制二维码
  onCopyQrcode() {
    wx.setClipboardData({
      data: this.data.detail.qrcode || '',
      success: () => toast('已复制二维码标识', 'success')
    })
  },

  // 查看点检记录
  goSpotCheckList() {
    wx.navigateTo({
      url: '/pages/spotcheck/list/list?equipId=' + this.data.id
    })
  },

  // 查看报修记录
  goRepairList() {
    wx.navigateTo({
      url: '/pages/repair/list/list?equipId=' + this.data.id
    })
  },

  // 编辑设备
  goEdit() {
    wx.navigateTo({
      url: '/pages/equipment/ledger/ledger?id=' + this.data.id
    })
  }
})
