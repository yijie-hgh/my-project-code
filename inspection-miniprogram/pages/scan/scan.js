// pages/scan/scan.js
const { taskApi } = require('../../utils/api')
const { requireLogin, getUserInfo } = require('../../utils/auth')
const { toast, showLoading, hideLoading } = require('../../utils/util')

Page({
  data: {
    scanType: 'qrcode', // qrcode | nfc | gps
    location: null,
    locating: false,
    recentScans: [],
    userInfo: null
  },

  onShow() {
    if (!requireLogin()) return
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
    this.setData({ userInfo: getUserInfo() })
  },

  switchType(e) {
    this.setData({ scanType: e.currentTarget.dataset.type })
  },

  // 扫码
  onScanCode() {
    wx.scanCode({
      onlyFromCamera: false,
      scanType: ['qrCode', 'barCode'],
      success: async (res) => {
        const code = res.result
        showLoading('识别中...')
        try {
          const pointRes = await taskApi.scanIdentify(code)
          if (pointRes.data) {
            const point = pointRes.data
            hideLoading()
            wx.showModal({
              title: '识别成功',
              content: '巡检点：' + point.pointName + '\n位置：' + point.location + '\n是否开始巡检？',
              confirmText: '开始巡检',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  // 跳转到巡检执行页，通过扫码进入
                  wx.navigateTo({
                    url: '/pages/task/execute/execute?pointId=' + point.id + '&pointName=' + encodeURIComponent(point.pointName) + '&checkInType=qrcode'
                  })
                }
              }
            })
          } else {
            hideLoading()
            toast('未识别到对应巡检点')
          }
        } catch (err) {
          hideLoading()
        }
      },
      fail: () => {
        toast('扫码取消')
      }
    })
  },

  // NFC读取
  onReadNfc() {
    // 模拟NFC读取
    showLoading('请将手机靠近NFC标签...')
    setTimeout(async () => {
      hideLoading()
      const nfcCode = 'NFC-A001'
      try {
        const pointRes = await taskApi.scanIdentify(nfcCode)
        if (pointRes.data) {
          const point = pointRes.data
          wx.showModal({
            title: 'NFC识别成功',
            content: '巡检点：' + point.pointName + '\n是否开始巡检？',
            confirmText: '开始巡检',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.navigateTo({
                  url: '/pages/task/execute/execute?pointId=' + point.id + '&pointName=' + encodeURIComponent(point.pointName) + '&checkInType=nfc'
                })
              }
            }
          })
        } else {
          toast('未识别到对应巡检点')
        }
      } catch (err) {}
    }, 1500)
  },

  // GPS定位
  onGetLocation() {
    this.setData({ locating: true })
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({ locating: false, location: res })
        toast('定位成功，经度' + res.longitude.toFixed(4) + ' 纬度' + res.latitude.toFixed(4), 'none', 3000)
        // 查找附近的巡检点
        this.findNearbyPoints(res)
      },
      fail: () => {
        this.setData({ locating: false })
        toast('定位失败，请检查定位权限')
      }
    })
  },

  // 查找附近巡检点
  async findNearbyPoints(location) {
    try {
      const pointRes = await taskApi.list({ status: '1' })
      // 实际应根据经纬度计算距离，这里模拟
      toast('已发现附近巡检点')
    } catch (err) {}
  },

  // 跳转到任务列表
  goTaskList() {
    wx.switchTab({ url: '/pages/task/list/list' })
  }
})
