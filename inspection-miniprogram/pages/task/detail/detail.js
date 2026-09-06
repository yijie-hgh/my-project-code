// pages/task/detail/detail.js
const { taskApi } = require('../../../utils/api')
const { requireLogin, getUserInfo } = require('../../../utils/auth')
const { taskStatusMap, checkInTypeMap, calcRate, formatDateTime, toast, confirm } = require('../../../utils/util')

Page({
  data: {
    taskId: null,
    task: null,
    loading: true,
    doneCount: 0,
    totalCount: 0,
    rate: 0,
    allDone: false
  },

  onLoad(options) {
    if (!requireLogin()) return
    this.setData({ taskId: options.id })
    this.loadDetail()
  },

  async loadDetail() {
    this.setData({ loading: true })
    try {
      const res = await taskApi.detail(this.data.taskId)
      const task = res.data
      if (task) {
        task.statusInfo = taskStatusMap[task.status] || {}
        const pointList = task.pointList || []
        pointList.forEach(p => {
          p.doneText = p.done ? '已完成' : '待巡检'
          if (p.record && p.record.checkInType) {
            p.checkInText = (checkInTypeMap[p.record.checkInType] || {}).text || ''
          }
        })
        const doneCount = pointList.filter(p => p.done).length
        const totalCount = pointList.length
        this.setData({
          task,
          loading: false,
          doneCount,
          totalCount,
          rate: calcRate(doneCount, totalCount),
          allDone: doneCount === totalCount && totalCount > 0
        })
      }
    } catch (err) {
      console.error('加载任务详情失败', err)
      this.setData({ loading: false })
    }
  },

  // 执行巡检
  goExecute(e) {
    const point = e.currentTarget.dataset.point
    if (point.done) {
      // 已完成，查看记录
      return
    }
    const status = this.data.task.status
    if (status === '2' || status === '4') {
      toast('该任务已结束')
      return
    }
    wx.navigateTo({
      url: '/pages/task/execute/execute?taskId=' + this.data.taskId + '&pointId=' + point.id + '&pointName=' + encodeURIComponent(point.pointName) + '&fromTask=1'
    })
  },

  // 查看已完成记录
  viewRecord(e) {
    const point = e.currentTarget.dataset.point
    if (point.done) {
      wx.navigateTo({
        url: '/pages/task/execute/execute?taskId=' + this.data.taskId + '&pointId=' + point.id + '&pointName=' + encodeURIComponent(point.pointName) + '&viewMode=1'
      })
    }
  },

  // 完成任务
  async onFinishTask() {
    if (!this.data.allDone) {
      toast('还有巡检点未完成')
      return
    }
    const ok = await confirm('确认完成该巡检任务吗？')
    if (!ok) return
    try {
      await taskApi.finishTask(this.data.taskId)
      toast('任务已完成', 'success')
      setTimeout(() => wx.navigateBack(), 1000)
    } catch (err) {
      console.error('完成任务失败', err)
    }
  },

  onPullDownRefresh() {
    this.loadDetail().then(() => wx.stopPullDownRefresh())
  }
})
