// pages/equipment/scan/scan.js
const { equipmentApi } = require('../../../utils/api')
const { requireLogin } = require('../../../utils/auth')
const { toast, showLoading, hideLoading } = require('../../../utils/util')

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
    manualCode: '',
    result: null,
    notFound: false,
    searching: false
  },

  onShow() {
    if (!requireLogin()) return
  },

  // 扫码识别
  onScanCode() {
    wx.scanCode({
      onlyFromCamera: false,
      scanType: ['qrCode', 'barCode'],
      success: (res) => {
        const code = res.result
        this.setData({ manualCode: code })
        this.identifyEquipment(code)
      },
      fail: () => {
        toast('扫码取消')
      }
    })
  },

  // 手动输入
  onManualInput(e) {
    this.setData({ manualCode: e.detail.value })
  },

  // 手动查询
  onManualSearch() {
    const code = this.data.manualCode.trim()
    if (!code) return toast('请输入设备编码')
    this.identifyEquipment(code)
  },

  // 识别设备
  async identifyEquipment(code) {
    this.setData({ searching: true, notFound: false, result: null })
    showLoading('识别中...')
    try {
      const res = await equipmentApi.scanIdentify(code)
      hideLoading()
      if (res.data) {
        const equipment = res.data
        equipment.statusInfo = equipStatusMap[equipment.status] || {}
        this.setData({ result: equipment, searching: false })
      } else {
        this.setData({ notFound: true, searching: false })
      }
    } catch (err) {
      hideLoading()
      this.setData({ searching: false })
      toast('识别失败，请重试')
    }
  },

  // 跳转设备详情
  goDetail() {
    const id = this.data.result.id
    wx.navigateTo({ url: '/pages/equipment/detail/detail?id=' + id })
  },

  // 点检
  goSpotCheck() {
    const { id, equipName, equipCode } = this.data.result
    wx.navigateTo({
      url: '/pages/spotcheck/execute/execute?equipId=' + id + '&equipName=' + encodeURIComponent(equipName) + '&equipCode=' + encodeURIComponent(equipCode)
    })
  },

  // 报修
  goRepair() {
    const { id, equipName, equipCode } = this.data.result
    wx.navigateTo({
      url: '/pages/repair/create/create?equipId=' + id + '&equipName=' + encodeURIComponent(equipName) + '&equipCode=' + encodeURIComponent(equipCode)
    })
  },

  // 重置
  onReset() {
    this.setData({
      manualCode: '',
      result: null,
      notFound: false
    })
  }
})
