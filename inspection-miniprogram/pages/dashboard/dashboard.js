// pages/dashboard/dashboard.js - 设备动态看板
const { equipDashboardApi } = require('../../utils/api')
const { requireLogin } = require('../../utils/auth')
const { toast } = require('../../utils/util')

Page({
  data: {
    stats: null,
    loading: false,
    activeTab: 'overview',
    tabs: [
      { value: 'overview', label: '设备概况' },
      { value: 'spotcheck', label: '点检分布' },
      { value: 'repair', label: '维修分布' },
      { value: 'maintain', label: '保养分布' }
    ],
    // 状态分布（饼图）
    statusDist: [],
    pieGradient: '',
    pieTotal: 0,
    // 类型分布（横向柱状图）
    typeDist: [],
    typeMax: 0,
    // 车间分布（柱状/进度条）
    workshopDist: [],
    workshopMax: 0,
    // 近期趋势（多柱状图）
    trendData: [],
    trendMax: 0,
    // 维修费用趋势
    costData: [],
    costMax: 0,
    costTotal: 0,
    // OEE数据
    oeeData: null,
    // 故障率趋势
    faultRateData: [],
    faultRateMax: 0,
    // 点检分布数据
    spotCheckDist: null,
    spotCheckByType: [],
    spotCheckTrend: [],
    spotCheckTrendMax: 0,
    topAbnormal: [],
    // 维修分布数据
    repairDist: null,
    repairByFaultType: [],
    repairByEquip: [],
    repairByEquipMax: 0,
    responseTimeDist: [],
    repairTrend: [],
    repairTrendMax: 0,
    // 保养分布数据
    maintainDist: null,
    maintainByType: [],
    maintainCostTrend: [],
    maintainCostMax: 0
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
      data.runRate = data.totalEquip > 0 ? Math.round((data.normalCount / data.totalEquip) * 100) : 0
      this.processData(data)
      this.setData({ stats: data, loading: false })
    } catch (err) {
      console.error('加载看板数据失败', err)
      toast('加载看板数据失败')
      this.setData({ loading: false })
    }
  },

  processData(data) {
    // 1. 状态分布 -> 构建饼图 conic-gradient
    const statusDist = (data.statusDistribution || []).map(s => ({
      name: s.name,
      count: s.count,
      color: s.color,
      percent: 0
    }))
    const pieTotal = statusDist.reduce((sum, s) => sum + s.count, 0)
    let cumPct = 0
    const segments = []
    statusDist.forEach(s => {
      const pct = pieTotal > 0 ? (s.count / pieTotal) * 100 : 0
      s.percent = Math.round(pct)
      const start = cumPct
      cumPct += pct
      segments.push(s.color + ' ' + start.toFixed(2) + '% ' + cumPct.toFixed(2) + '%')
    })
    const pieGradient = 'conic-gradient(' + segments.join(', ') + ')'
    this.setData({ statusDist, pieGradient, pieTotal })

    // 2. 类型分布 -> 横向柱状图
    const typeDist = (data.typeDistribution || []).map(t => ({
      name: t.name,
      count: t.count,
      color: t.color,
      percent: 0
    }))
    const typeMax = Math.max.apply(null, typeDist.map(t => t.count).concat([1]))
    typeDist.forEach(t => {
      t.percent = Math.round((t.count / typeMax) * 100)
    })
    this.setData({ typeDist, typeMax })

    // 3. 车间分布 -> 进度条
    const workshopDist = (data.workshopDistribution || []).map(w => ({
      name: w.name,
      count: w.count,
      percent: 0
    }))
    const workshopMax = Math.max.apply(null, workshopDist.map(w => w.count).concat([1]))
    workshopDist.forEach(w => {
      w.percent = Math.round((w.count / workshopMax) * 100)
    })
    this.setData({ workshopDist, workshopMax })

    // 4. 近期趋势 -> 多柱状图
    const trendData = (data.trend30 || []).map(t => ({
      date: t.date,
      spotCheck: t.spotCheck,
      inspect: t.inspect,
      repair: t.repair,
      spotCheckH: 0,
      inspectH: 0,
      repairH: 0
    }))
    let trendMax = 0
    trendData.forEach(t => {
      trendMax = Math.max(trendMax, t.spotCheck, t.inspect, t.repair)
    })
    trendMax = trendMax || 1
    trendData.forEach(t => {
      t.spotCheckH = Math.round((t.spotCheck / trendMax) * 90)
      t.inspectH = Math.round((t.inspect / trendMax) * 90)
      t.repairH = Math.round((t.repair / trendMax) * 90)
    })
    this.setData({ trendData, trendMax })

    // 5. 维修费用趋势 -> 柱状图
    const costData = (data.costTrend || []).map(c => ({
      month: c.month,
      cost: c.cost,
      height: 0
    }))
    const costMax = Math.max.apply(null, costData.map(c => c.cost).concat([1]))
    const costTotal = costData.reduce((sum, c) => sum + c.cost, 0)
    costData.forEach(c => {
      c.height = Math.round((c.cost / costMax) * 90)
    })
    this.setData({ costData, costMax, costTotal })

    // 6. OEE数据
    this.setData({ oeeData: data.oee || null })

    // 7. 故障率趋势 -> 折线图模拟
    const faultRateData = (data.faultRateTrend || []).map(f => ({
      month: f.month,
      rate: f.rate,
      height: 0
    }))
    const faultRateMax = Math.max.apply(null, faultRateData.map(f => f.rate).concat([1]))
    faultRateData.forEach(f => {
      f.height = Math.round((f.rate / faultRateMax) * 90)
    })
    this.setData({ faultRateData, faultRateMax })

    // 8. 点检分布数据
    this.processSpotCheckDist(data.spotCheckDist)

    // 9. 维修分布数据
    this.processRepairDist(data.repairDist)

    // 10. 保养分布数据
    this.processMaintainDist(data.maintainDist)
  },

  // 处理点检分布数据
  processSpotCheckDist(dist) {
    if (!dist) return
    // 按类型分布 -> 柱状图
    const spotCheckByType = (dist.byType || []).map(t => ({
      name: t.name,
      total: t.total,
      normal: t.normal,
      abnormal: t.abnormal,
      normalPercent: 0,
      abnormalPercent: 0,
      passRate: t.total > 0 ? Math.round((t.normal / t.total) * 100) : 0
    }))
    const maxTotal = Math.max.apply(null, spotCheckByType.map(t => t.total).concat([1]))
    spotCheckByType.forEach(t => {
      t.normalPercent = Math.round((t.normal / maxTotal) * 100)
      t.abnormalPercent = Math.round((t.abnormal / maxTotal) * 100)
    })

    // 近7天趋势
    const spotCheckTrend = (dist.trend || []).map(t => ({
      date: t.date,
      total: t.total,
      normal: t.normal,
      abnormal: t.abnormal,
      normalH: 0,
      abnormalH: 0
    }))
    const trendMax = Math.max.apply(null, spotCheckTrend.map(t => t.total).concat([1]))
    spotCheckTrend.forEach(t => {
      t.normalH = Math.round((t.normal / trendMax) * 90)
      t.abnormalH = Math.round((t.abnormal / trendMax) * 90)
    })

    // 常见异常项
    const topAbnormal = (dist.topAbnormal || []).map(a => ({
      ...a,
      barWidth: a.percent
    }))

    this.setData({
      spotCheckDist: dist,
      spotCheckByType,
      spotCheckTrend,
      spotCheckTrendMax: trendMax,
      topAbnormal
    })
  },

  // 处理维修分布数据
  processRepairDist(dist) {
    if (!dist) return
    // 按故障类型 -> 饼图
    const repairByFaultType = (dist.byFaultType || []).map(f => ({
      ...f,
      percent: 0
    }))
    const totalRepairs = repairByFaultType.reduce((sum, f) => sum + f.count, 0)
    repairByFaultType.forEach(f => {
      f.percent = totalRepairs > 0 ? Math.round((f.count / totalRepairs) * 100) : 0
    })

    // 按设备 -> 横向柱状图
    const repairByEquip = (dist.byEquip || []).map(e => ({
      ...e,
      percent: 0
    }))
    const equipMax = Math.max.apply(null, repairByEquip.map(e => e.count).concat([1]))
    repairByEquip.forEach(e => {
      e.percent = Math.round((e.count / equipMax) * 100)
    })

    // 响应时间分布
    const responseTimeDist = (dist.responseTimeDist || []).map(r => ({
      ...r,
      percent: 0
    }))
    const respTotal = responseTimeDist.reduce((sum, r) => sum + r.count, 0)
    responseTimeDist.forEach(r => {
      r.percent = respTotal > 0 ? Math.round((r.count / respTotal) * 100) : 0
    })

    // 月度维修趋势
    const repairTrend = (dist.trend || []).map(t => ({
      month: t.month,
      count: t.count,
      cost: t.cost,
      countH: 0
    }))
    const trendMax = Math.max.apply(null, repairTrend.map(t => t.count).concat([1]))
    repairTrend.forEach(t => {
      t.countH = Math.round((t.count / trendMax) * 90)
    })

    this.setData({
      repairDist: dist,
      repairByFaultType,
      repairByEquip,
      repairByEquipMax: equipMax,
      responseTimeDist,
      repairTrend,
      repairTrendMax: trendMax
    })
  },

  // 处理保养分布数据
  processMaintainDist(dist) {
    if (!dist) return
    // 按类型 -> 柱状图
    const maintainByType = (dist.byType || []).map(t => ({
      ...t,
      percent: 0
    }))
    const typeMax = Math.max.apply(null, maintainByType.map(t => t.count).concat([1]))
    maintainByType.forEach(t => {
      t.percent = Math.round((t.count / typeMax) * 100)
    })

    // 费用趋势
    const maintainCostTrend = (dist.costStats && dist.costStats.trend || []).map(c => ({
      month: c.month,
      cost: c.cost,
      height: 0
    }))
    const costMax = Math.max.apply(null, maintainCostTrend.map(c => c.cost).concat([1]))
    maintainCostTrend.forEach(c => {
      c.height = Math.round((c.cost / costMax) * 90)
    })

    this.setData({
      maintainDist: dist,
      maintainByType,
      maintainCostTrend,
      maintainCostMax: costMax
    })
  },

  // 切换Tab
  onTabChange(e) {
    this.setData({ activeTab: e.currentTarget.dataset.value })
  },

  onRefresh() {
    this.loadStats()
  },

  onPullDownRefresh() {
    this.loadStats().then(() => wx.stopPullDownRefresh()).catch(() => wx.stopPullDownRefresh())
  }
})
