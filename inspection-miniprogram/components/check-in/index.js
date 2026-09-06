// components/check-in/index.js
Component({
  properties: {
    point: { type: Object, value: {} },
    checked: { type: Boolean, value: false },
    checkInType: { type: String, value: '' },
    checkInTime: { type: String, value: '' }
  },
  data: {
    location: null,
    locating: false
  },
  methods: {
    onScan() {
      if (this.data.checked) return
      this.triggerEvent('checkin', { type: 'qrcode' })
    },
    onNfc() {
      if (this.data.checked) return
      this.triggerEvent('checkin', { type: 'nfc' })
    },
    onGps() {
      if (this.data.checked) return
      this.setData({ locating: true })
      wx.getLocation({
        type: 'gcj02',
        success: (res) => {
          this.setData({ locating: false, location: res })
          this.triggerEvent('checkin', { type: 'gps', location: res })
        },
        fail: () => {
          this.setData({ locating: false })
          wx.showToast({ title: '定位失败，请检查权限', icon: 'none' })
        }
      })
    }
  }
})
