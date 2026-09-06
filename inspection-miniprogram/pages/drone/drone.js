// pages/drone/drone.js
const { requireLogin } = require('../../utils/auth')
const { toast } = require('../../utils/util')

// 模拟航线列表
const mockRoutes = [
  { id: 1, routeName: '厂区设备巡检航线', area: '厂区A-B车间', pointCount: 12, duration: 15, distance: 2.3, status: 'ready', statusText: '待执行', statusTag: 'tag-warning' },
  { id: 2, routeName: '变电站高压线巡检', area: '变电站A区', pointCount: 8, duration: 20, distance: 3.8, status: 'ready', statusText: '待执行', statusTag: 'tag-warning' },
  { id: 3, routeName: '冷却塔全景巡检', area: 'B车间楼顶', pointCount: 6, duration: 10, distance: 1.5, status: 'done', statusText: '已完成', statusTag: 'tag-success' },
  { id: 4, routeName: '消防设施高空巡检', area: '厂区外围', pointCount: 10, duration: 18, distance: 2.8, status: 'ready', statusText: '待执行', statusTag: 'tag-warning' }
]

Page({
  data: {
    drone: {
      battery: 85,
      signalLevel: '强',
      altitude: 120,
      speed: 15,
      gpsFixed: true,
      satellites: 14,
      flying: false
    },
    countdown: 0,
    routes: mockRoutes,
    liveFps: 30,
    liveCoord: { lat: '39.9150', lng: '116.4040' },
    aiDetecting: false
  },

  onLoad() {
    if (!requireLogin()) return
  },

  onShow() {
    if (!requireLogin()) return
  },

  // 功能入口点击
  onFuncTap(e) {
    const name = e.currentTarget.dataset.name
    toast(name + '功能演示', 'none')
  },

  // 一键起飞
  onTakeoff() {
    if (this.data.drone.flying) {
      // 结束巡检返航
      this._stopInspect()
      toast('无人机已返航', 'success')
    } else {
      // 开始倒计时
      this._startCountdown()
    }
  },

  // 倒计时起飞
  _startCountdown() {
    let count = 3
    this.setData({ countdown: count })
    this._countTimer = setInterval(() => {
      count--
      if (count <= 0) {
        clearInterval(this._countTimer)
        this.setData({ countdown: 0 })
        this._startInspect()
      } else {
        this.setData({ countdown: count })
      }
    }, 1000)
  },

  // 开始巡检
  _startInspect() {
    this.setData({
      'drone.flying': true,
      'drone.altitude': 120,
      'drone.speed': 15,
      aiDetecting: true
    })
    toast('无人机已起飞，开始巡检', 'success')
    // 模拟实时数据更新
    this._liveTimer = setInterval(() => {
      const battery = Math.max(20, this.data.drone.battery - 1)
      const altitude = 100 + Math.floor(Math.random() * 40)
      const speed = 10 + Math.floor(Math.random() * 12)
      const fps = 28 + Math.floor(Math.random() * 5)
      const lat = (39.9150 + (Math.random() - 0.5) * 0.002).toFixed(4)
      const lng = (116.4040 + (Math.random() - 0.5) * 0.002).toFixed(4)
      this.setData({
        'drone.battery': battery,
        'drone.altitude': altitude,
        'drone.speed': speed,
        liveFps: fps,
        liveCoord: { lat, lng }
      })
      if (battery <= 20) {
        this._stopInspect()
        toast('电量不足，自动返航', 'none')
      }
    }, 1500)
  },

  // 停止巡检
  _stopInspect() {
    if (this._liveTimer) {
      clearInterval(this._liveTimer)
      this._liveTimer = null
    }
    this.setData({
      'drone.flying': false,
      'drone.altitude': 0,
      'drone.speed': 0,
      aiDetecting: false,
      'drone.battery': 85
    })
  },

  // 执行指定航线
  onStartRoute(e) {
    if (this.data.drone.flying) return
    const id = e.currentTarget.dataset.id
    const route = this.data.routes.find(r => r.id == id)
    if (route && route.status === 'done') {
      toast('该航线已完成巡检', 'none')
      return
    }
    this._startCountdown()
  },

  onUnload() {
    if (this._countTimer) clearInterval(this._countTimer)
    if (this._liveTimer) clearInterval(this._liveTimer)
  }
})
