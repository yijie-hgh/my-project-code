// pages/spotcheck/stats/stats.js - 点检统计看板
const { equipDashboardApi } = require('../../../utils/api')
const { requireLogin } = require('../../../utils/auth')
const { toast } = require('../../../utils/util')

Page({
  data: {
    loading: false,
    dist: null,
    // 概览统计
    overview: null,
    // 合格率
    passRate: 0,
    // 按设备类型分布（堆叠柱状图）
    byType: [],
    byTypeMax: 0,
    // 近7天点检趋势（双柱状图）
    trend: [],
    trendMax: 0,
    // 常见异常项Top5
    topAbnormal: []
  },

  onLoad() {
    if (!requireLogin()) return
    this.loadStats()
  },

  onShow() {
    if (!requireLogin()) return
  },

  // 加载统计数据
  async loadStats() {
    this.setData({ loading: true })
    try {
      const res = await equipDashboardApi.getStats()
      const data = res.data || {}
      const dist = data.spotCheckDist || null
      this.processData(dist)
      this.setData({ dist, loading: false })
    } catch (err) {
      console.error('加载点检统计数据失败', err)
      toast('加载点检统计数据失败')
      this.setData({ loading: false })
    }
  },

  // 处理点检分布数据
  processData(dist) {
    if (!dist) return

    // 1. 概览统计
    const overview = {
      total: dist.total || 0,
      normal: dist.normalCount || 0,
      abnormal: dist.abnormalCount || 0,
      completionRate: dist.completionRate || 0
    }

    // 2. 合格率
    const passRate = dist.passRate || 0

    // 3. 按设备类型分布 -> 堆叠横向柱状图
    const byType = (dist.byType || []).map(t => ({
      name: t.name,
      total: t.total,
      normal: t.normal,
      abnormal: t.abnormal,
      normalPercent: 0,
      abnormalPercent: 0,
      passRate: t.total > 0 ? Math.round((t.normal / t.total) * 100) : 0
    }))
    const maxTotal = Math.max.apply(null, byType.map(t => t.total).concat([1]))
    byType.forEach(t => {
      t.normalPercent = Math.round((t.normal / maxTotal) * 100)
      t.abnormalPercent = Math.round((t.abnormal / maxTotal) * 100)
    })

    // 4. 近7天趋势 -> 双柱状图
    const trend = (dist.trend || []).map(t => ({
      date: t.date,
      total: t.total,
      normal: t.normal,
      abnormal: t.abnormal,
      normalH: 0,
      abnormalH: 0
    }))
    const trendMax = Math.max.apply(null, trend.map(t => t.total).concat([1]))
    trend.forEach(t => {
      t.normalH = Math.round((t.normal / trendMax) * 90)
      t.abnormalH = Math.round((t.abnormal / trendMax) * 90)
    })

    // 5. 常见异常项Top5 -> 进度条
    const topAbnormal = (dist.topAbnormal || []).map(a => ({
      name: a.name,
      count: a.count,
      percent: a.percent,
      barWidth: a.percent || 0
    }))

    this.setData({
      overview,
      passRate,
      byType,
      byTypeMax: maxTotal,
      trend,
      trendMax,
      topAbnormal
    })
  },

  // 刷新
  onRefresh() {
    this.loadStats()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadStats().then(() => wx.stopPullDownRefresh()).catch(() => wx.stopPullDownRefresh())
  }
})
