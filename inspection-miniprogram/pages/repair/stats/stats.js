// pages/repair/stats/stats.js - 维修统计看板
const { equipDashboardApi } = require('../../../utils/api')
const { requireLogin } = require('../../../utils/auth')
const { toast } = require('../../../utils/util')

Page({
  data: {
    loading: false,
    repairDist: null,
    // 故障类型饼图
    faultTypePie: [],
    faultPieGradient: '',
    faultPieTotal: 0,
    // 高频故障设备Top5
    repairByEquip: [],
    repairByEquipMax: 0,
    // 响应时间分布
    responseTimeDist: [],
    responseTotal: 0,
    // 月度维修趋势
    repairTrend: [],
    repairTrendMax: 0,
    repairCostTotal: 0,
    repairCostMax: 0
  },

  onLoad() {
    if (!requireLogin()) return
    this.loadStats()
  },

  onShow() {
    if (!requireLogin()) return
  },

  // 加载看板数据
  async loadStats() {
    this.setData({ loading: true })
    try {
      const res = await equipDashboardApi.getStats()
      const data = res.data || {}
      const dist = data.repairDist || null
      if (dist) {
        this.processRepairDist(dist)
      }
      this.setData({ repairDist: dist, loading: false })
    } catch (err) {
      console.error('加载维修统计数据失败', err)
      toast('加载维修统计数据失败')
      this.setData({ loading: false })
    }
  },

  // 处理维修分布数据
  processRepairDist(dist) {
    // 1. 故障类型分布 -> 饼图 conic-gradient
    const faultTypePie = (dist.byFaultType || []).map(f => ({
      name: f.name,
      count: f.count,
      color: f.color,
      percent: 0
    }))
    const faultPieTotal = faultTypePie.reduce((sum, f) => sum + f.count, 0)
    let cumPct = 0
    const segments = []
    faultTypePie.forEach(f => {
      const pct = faultPieTotal > 0 ? (f.count / faultPieTotal) * 100 : 0
      f.percent = Math.round(pct)
      const start = cumPct
      cumPct += pct
      segments.push(f.color + ' ' + start.toFixed(2) + '% ' + cumPct.toFixed(2) + '%')
    })
    const faultPieGradient = 'conic-gradient(' + segments.join(', ') + ')'

    // 2. 高频故障设备Top5 -> 横向柱状图
    const repairByEquip = (dist.byEquip || []).map((e, idx) => ({
      name: e.name,
      count: e.count,
      percent: 0,
      rank: idx + 1
    }))
    const equipMax = Math.max.apply(null, repairByEquip.map(e => e.count).concat([1]))
    repairByEquip.forEach(e => {
      e.percent = Math.round((e.count / equipMax) * 100)
    })

    // 3. 响应时间分布 -> 进度条
    const responseTimeDist = (dist.responseTimeDist || []).map(r => ({
      range: r.range,
      count: r.count,
      percent: 0
    }))
    const responseTotal = responseTimeDist.reduce((sum, r) => sum + r.count, 0)
    responseTimeDist.forEach(r => {
      r.percent = responseTotal > 0 ? Math.round((r.count / responseTotal) * 100) : 0
    })

    // 4. 月度维修趋势 -> 柱状图(次数 + 费用)
    const repairTrend = (dist.trend || []).map(t => ({
      month: t.month,
      count: t.count,
      cost: t.cost,
      countH: 0
    }))
    const repairTrendMax = Math.max.apply(null, repairTrend.map(t => t.count).concat([1]))
    repairTrend.forEach(t => {
      t.countH = Math.round((t.count / repairTrendMax) * 90)
    })
    const repairCostTotal = repairTrend.reduce((sum, t) => sum + (t.cost || 0), 0)
    const repairCostMax = Math.max.apply(null, repairTrend.map(t => t.cost || 0).concat([1]))

    this.setData({
      faultTypePie,
      faultPieGradient,
      faultPieTotal,
      repairByEquip,
      repairByEquipMax: equipMax,
      responseTimeDist,
      responseTotal,
      repairTrend,
      repairTrendMax,
      repairCostTotal,
      repairCostMax
    })
  },

  onRefresh() {
    this.loadStats()
  },

  onPullDownRefresh() {
    this.loadStats().then(() => wx.stopPullDownRefresh()).catch(() => wx.stopPullDownRefresh())
  }
})
