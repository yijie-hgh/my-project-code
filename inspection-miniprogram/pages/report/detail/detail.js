// pages/report/detail/detail.js - 报表详情页
const { reportApi } = require('../../../utils/api')
const { requireLogin } = require('../../../utils/auth')
const { toast, showLoading, hideLoading } = require('../../../utils/util')

Page({
  data: {
    id: '',
    report: null,
    trend: [],
    maxTrendDone: 1,
    maxTrendAbnormal: 1,
    loading: true,
    // 统计卡片数据
    stats: []
  },

  onLoad(options) {
    if (!requireLogin()) return
    this.setData({ id: options.id })
    this.loadDetail()
  },

  onShow() {
    if (!requireLogin()) return
  },

  // 加载报表详情
  async loadDetail() {
    this.setData({ loading: true })
    try {
      const res = await reportApi.detail(this.data.id)
      const report = res.data || {}
      const trend = report.trend || []
      const maxDone = Math.max(...trend.map(t => t.done), 1)
      const maxAbnormal = Math.max(...trend.map(t => t.abnormal), 1)

      // 构建统计卡片
      const stats = [
        { label: '总任务', value: report.totalTasks || 0, icon: '📋', color: '#2563eb' },
        { label: '已完成', value: report.doneTasks || 0, icon: '✅', color: '#10b981' },
        { label: '异常数', value: report.abnormalCount || 0, icon: '⚠️', color: '#ef4444' },
        { label: '事件数', value: report.eventCount || 0, icon: '📢', color: '#f59e0b' },
        { label: '已解决', value: report.resolvedCount || 0, icon: '🔧', color: '#6366f1' },
        { label: '完成率', value: (report.completionRate || 0) + '%', icon: '📈', color: '#10b981' }
      ]

      this.setData({
        report,
        trend,
        maxTrendDone: maxDone,
        maxTrendAbnormal: maxAbnormal,
        stats,
        loading: false
      })
    } catch (err) {
      console.error('加载报表详情失败', err)
      this.setData({ loading: false })
      toast('加载失败')
    }
  },

  // 导出报表
  async onExport() {
    showLoading('导出中...')
    try {
      // 模拟导出
      await new Promise(resolve => setTimeout(resolve, 1000))
      hideLoading()
      toast('导出成功', 'success')
    } catch (err) {
      hideLoading()
      toast('导出失败')
    }
  }
})
