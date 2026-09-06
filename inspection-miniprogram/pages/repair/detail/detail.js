// pages/repair/detail/detail.js
const { repairApi } = require('../../../utils/api')
const { requireLogin, getUserInfo } = require('../../../utils/auth')
const { toast, confirm, showLoading, hideLoading } = require('../../../utils/util')

// 报修状态映射
const repairStatusMap = {
  '0': { text: '待受理', tag: 'tag-warning' },
  '1': { text: '已派单', tag: 'tag-primary' },
  '2': { text: '维修中', tag: 'tag-primary' },
  '3': { text: '已完成', tag: 'tag-success' },
  '4': { text: '已关闭', tag: 'tag-gray' }
}

// 紧急程度映射
const levelMap = {
  '1': { text: '低', tag: 'tag-gray' },
  '2': { text: '中', tag: 'tag-primary' },
  '3': { text: '高', tag: 'tag-warning' },
  '4': { text: '紧急', tag: 'tag-danger' }
}

// 时间线状态
const timelineSteps = [
  { status: '0', label: '报修', icon: '📝' },
  { status: '1', label: '受理', icon: '📋' },
  { status: '2', label: '维修中', icon: '🔧' },
  { status: '3', label: '完成', icon: '✅' }
]

Page({
  data: {
    id: null,
    repair: null,
    loading: true,
    timeline: []
  },

  onLoad(options) {
    if (!requireLogin()) return
    this.setData({ id: options.id })
    this.loadDetail()
  },

  onShow() {
    if (!requireLogin()) return
  },

  async loadDetail() {
    this.setData({ loading: true })
    try {
      const res = await repairApi.detail(this.data.id)
      const repair = res.data
      if (repair) {
        repair.statusInfo = repairStatusMap[repair.status] || {}
        repair.levelInfo = levelMap[repair.level] || {}
        // 构建时间线
        const timeline = this.buildTimeline(repair)
        this.setData({ repair, timeline, loading: false })
      } else {
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error('加载报修详情失败', err)
      this.setData({ loading: false })
      toast('加载失败')
    }
  },

  // 构建时间线
  buildTimeline(repair) {
    const currentStatus = parseInt(repair.status)
    return timelineSteps.map((step, index) => {
      const stepStatus = parseInt(step.status)
      const done = currentStatus >= stepStatus
      const active = currentStatus === stepStatus
      let time = ''
      if (stepStatus === 0 && repair.createTime) time = repair.createTime
      if (stepStatus === 1 && repair.acceptTime) time = repair.acceptTime
      if (stepStatus === 2 && repair.startTime) time = repair.startTime
      if (stepStatus === 3 && repair.finishTime) time = repair.finishTime
      return {
        ...step,
        done,
        active,
        time,
        isLast: index === timelineSteps.length - 1
      }
    })
  },

  // 跳转设备详情
  goEquipDetail() {
    const equipId = this.data.repair.equipId
    if (equipId) {
      wx.navigateTo({ url: '/pages/equipment/detail/detail?id=' + equipId })
    }
  },

  // 拨打电话
  onCallPhone() {
    const phone = this.data.repair.reporterPhone
    if (!phone) {
      toast('暂无联系电话')
      return
    }
    wx.makePhoneCall({ phoneNumber: phone })
  },

  // 受理报修
  async onAccept() {
    const ok = await confirm('确定受理该报修吗？')
    if (!ok) return
    showLoading('处理中...')
    try {
      const userInfo = getUserInfo()
      await repairApi.updateStatus(this.data.id, {
        status: '1',
        acceptTime: new Date().toLocaleString(),
        repairer: userInfo ? userInfo.nickName : ''
      })
      hideLoading()
      toast('已受理', 'success')
      this.loadDetail()
    } catch (err) {
      hideLoading()
      console.error('受理失败', err)
      toast('操作失败')
    }
  },

  // 开始维修
  async onStartRepair() {
    const ok = await confirm('确定开始维修吗？')
    if (!ok) return
    showLoading('处理中...')
    try {
      await repairApi.updateStatus(this.data.id, {
        status: '2',
        startTime: new Date().toLocaleString()
      })
      hideLoading()
      toast('已开始维修', 'success')
      this.loadDetail()
    } catch (err) {
      hideLoading()
      console.error('操作失败', err)
      toast('操作失败')
    }
  },

  // 完成维修
  async onFinishRepair() {
    const ok = await confirm('确定完成维修吗？')
    if (!ok) return
    showLoading('处理中...')
    try {
      await repairApi.updateStatus(this.data.id, {
        status: '3',
        finishTime: new Date().toLocaleString()
      })
      hideLoading()
      toast('维修已完成', 'success')
      this.loadDetail()
    } catch (err) {
      hideLoading()
      console.error('操作失败', err)
      toast('操作失败')
    }
  },

  onPullDownRefresh() {
    this.loadDetail().then(() => wx.stopPullDownRefresh())
  }
})
