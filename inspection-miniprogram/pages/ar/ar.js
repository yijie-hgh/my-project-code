// pages/ar/ar.js
const { requireLogin } = require('../../utils/auth')
const { toast, showLoading, hideLoading } = require('../../utils/util')

// 模拟AR巡检记录
const mockRecords = [
  { id: 1, deviceName: '1号生产线-主电机', deviceCode: 'PT001', location: 'A车间1楼', checkCount: 5, result: '正常', statusText: '运行中', statusTag: 'tag-success', time: '2026-08-03 09:30' },
  { id: 2, deviceName: '冷却塔-1号', deviceCode: 'PT003', location: 'B车间楼顶', checkCount: 6, result: '异常', statusText: '温度偏高', statusTag: 'tag-danger', time: '2026-08-02 14:20' },
  { id: 3, deviceName: '高压开关柜-3号', deviceCode: 'PT005', location: '变电站B区', checkCount: 7, result: '正常', statusText: '运行中', statusTag: 'tag-success', time: '2026-08-02 10:15' },
  { id: 4, deviceName: '中央空调主机', deviceCode: 'PT006', location: '机房B1', checkCount: 10, result: '正常', statusText: '运行中', statusTag: 'tag-success', time: '2026-08-02 08:30' }
]

// 模拟识别结果数据池
const mockDevices = [
  {
    deviceName: '1号生产线-主电机', deviceCode: 'PT001', statusText: '运行中', statusTag: 'tag-success',
    items: [
      { name: '设备外观', value: '正常', status: 'ok' },
      { name: '运行温度', value: '58℃', status: 'ok' },
      { name: '运行声音', value: '正常', status: 'ok' },
      { name: '振动幅度', value: '2.3mm/s', status: 'ok' },
      { name: '电压电流', value: '正常', status: 'ok' }
    ],
    temp: 58, vibration: 2.3, current: 152, voltage: 380
  },
  {
    deviceName: '冷却塔-1号', deviceCode: 'PT003', statusText: '温度偏高', statusTag: 'tag-danger',
    items: [
      { name: '设备外观', value: '正常', status: 'ok' },
      { name: '出水温度', value: '72℃', status: 'error' },
      { name: '风机运行', value: '正常', status: 'ok' },
      { name: '振动幅度', value: '3.1mm/s', status: 'ok' },
      { name: '水质检测', value: '偏浊', status: 'warn' }
    ],
    temp: 72, vibration: 3.1, current: 98, voltage: 220
  },
  {
    deviceName: '高压开关柜-3号', deviceCode: 'PT005', statusText: '运行中', statusTag: 'tag-success',
    items: [
      { name: '设备外观', value: '正常', status: 'ok' },
      { name: '指示灯状态', value: '正常', status: 'ok' },
      { name: '温度监测', value: '45℃', status: 'ok' },
      { name: '电气连接', value: '良好', status: 'ok' },
      { name: '绝缘性能', value: '合格', status: 'ok' }
    ],
    temp: 45, vibration: 1.2, current: 320, voltage: 10000
  }
]

Page({
  data: {
    scanning: false,
    scanTip: '将摄像头对准设备进行AR识别',
    scanProgress: 0,
    showResult: false,
    resultData: {},
    records: mockRecords
  },

  onLoad() {
    if (!requireLogin()) return
  },

  onShow() {
    if (!requireLogin()) return
  },

  // 空操作，阻止冒泡
  noop() {},

  // 设备识别
  onDeviceIdentify() {
    this.setData({ scanning: true, scanProgress: 0, scanTip: '将摄像头对准设备进行AR识别' })
  },

  // 开始识别（模拟AR扫描过程）
  onStartIdentify() {
    if (this.data.scanProgress > 0) return
    this.setData({ scanTip: '正在识别设备...' })
    let progress = 0
    this._scanTimer = setInterval(() => {
      progress += Math.random() * 18 + 8
      if (progress >= 100) {
        progress = 100
        clearInterval(this._scanTimer)
        this.setData({ scanProgress: 100 })
        setTimeout(() => {
          // 随机选择一个设备作为识别结果
          const device = mockDevices[Math.floor(Math.random() * mockDevices.length)]
          this.setData({
            scanning: false,
            showResult: true,
            resultData: device,
            scanProgress: 0
          })
        }, 400)
      } else {
        this.setData({ scanProgress: Math.floor(progress) })
      }
    }, 200)
  },

  // 关闭扫描界面
  onCloseScan() {
    if (this._scanTimer) {
      clearInterval(this._scanTimer)
      this._scanTimer = null
    }
    this.setData({ scanning: false, scanProgress: 0, scanTip: '将摄像头对准设备进行AR识别' })
  },

  // 关闭识别结果
  onCloseResult() {
    this.setData({ showResult: false })
  },

  // 确认记录巡检
  onConfirmResult() {
    const device = this.data.resultData
    const result = device.items.some(i => i.status === 'error') ? '异常' : '正常'
    const statusText = device.statusText
    const newRecord = {
      id: Date.now(),
      deviceName: device.deviceName,
      deviceCode: device.deviceCode,
      location: 'A车间1楼',
      checkCount: device.items.length,
      result: result,
      statusText: statusText,
      statusTag: device.statusTag,
      time: this._getNowTime()
    }
    this.setData({
      records: [newRecord, ...this.data.records],
      showResult: false
    })
    toast('巡检记录已保存', 'success')
  },

  // 故障标注
  onFaultMark() {
    toast('故障标注：在AR画面中点击设备故障点进行标记', 'none')
  },

  // 远程协助
  onRemoteAssist() {
    toast('正在连接远程专家协助...', 'none')
  },

  // AR导航
  onArNavigate() {
    toast('AR导航：通过AR实景箭头引导前往下一巡检点', 'none')
  },

  // 开始AR巡检
  onStartArInspect() {
    if (this.data.scanning) {
      this.onCloseScan()
      toast('已结束AR巡检', 'none')
    } else {
      this.onDeviceIdentify()
    }
  },

  // 获取当前时间字符串
  _getNowTime() {
    const d = new Date()
    const pad = (n) => (n < 10 ? '0' + n : '' + n)
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
  },

  onUnload() {
    if (this._scanTimer) {
      clearInterval(this._scanTimer)
    }
  }
})
