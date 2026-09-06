// pages/task/execute/execute.js
const { taskApi, pointApi, eventApi } = require('../../../utils/api')
const { requireLogin, getUserInfo } = require('../../../utils/auth')
const { toast, showLoading, hideLoading, confirm, formatDateTime, deepClone } = require('../../../utils/util')

Page({
  data: {
    taskId: null,
    pointId: null,
    pointName: '',
    point: null,
    items: [],
    checked: false,
    checkInType: '',
    checkInTime: '',
    viewMode: false,
    fromTask: false,
    remark: '',
    submitting: false,
    hasAbnormal: false
  },

  onLoad(options) {
    if (!requireLogin()) return
    const { taskId, pointId, pointName, checkInType, fromTask, viewMode } = options
    this.setData({
      taskId: taskId || null,
      pointId: pointId,
      pointName: pointName ? decodeURIComponent(pointName) : '',
      checkInType: checkInType || '',
      fromTask: fromTask === '1',
      viewMode: viewMode === '1'
    })

    // 如果通过扫码进入且带checkInType，直接标记签到
    if (checkInType) {
      this.setData({
        checked: true,
        checkInTime: formatDateTime(new Date())
      })
    }

    this.loadPointDetail()
  },

  async loadPointDetail() {
    try {
      const res = await pointApi.detail(this.data.pointId)
      const point = res.data
      if (point) {
        // 深拷贝巡检项，避免污染
        const items = (point.items || []).map(item => ({
          ...deepClone(item),
          value: item.itemType === 'multi' ? [] : (item.itemType === 'photo' ? [] : '')
        }))
        this.setData({ point, items })
      }
    } catch (err) {
      console.error('加载巡检点失败', err)
    }
  },

  // 签到回调
  onCheckIn(e) {
    const { type, location } = e.detail
    this.setData({
      checked: true,
      checkInType: type,
      checkInTime: formatDateTime(new Date())
    })
    toast('签到成功', 'success')

    // GPS签到时记录位置
    if (type === 'gps' && location) {
      console.log('GPS位置:', location)
    }
  },

  // 巡检项变更
  onItemChange(e) {
    const { index, field, value } = e.detail
    const items = this.data.items
    items[index][field] = value
    // 检查是否有异常
    const hasAbnormal = items.some(item => {
      if (item.itemType === 'choice' && item.value === '异常') return true
      if (item.itemType === 'choice' && item.value === '异响') return true
      if (item.itemType === 'choice' && item.value === '需更换') return true
      return false
    })
    this.setData({ items, hasAbnormal })
  },

  // 签名回调
  onSignature(e) {
    // 模拟签名 - 实际可跳转签名页
    const { index } = e.detail
    const items = this.data.items
    items[index].value = 'signature_' + Date.now() + '.png'
    this.setData({ items })
    toast('签名完成', 'success')
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  // 校验必填项
  validate() {
    if (!this.data.checked) {
      toast('请先完成签到')
      return false
    }
    for (let i = 0; i < this.data.items.length; i++) {
      const item = this.data.items[i]
      if (item.required) {
        if (item.itemType === 'photo' || item.itemType === 'multi') {
          if (!item.value || item.value.length === 0) {
            toast('请完成：' + item.itemName)
            return false
          }
        } else {
          if (!item.value || item.value === '') {
            toast('请填写：' + item.itemName)
            return false
          }
        }
      }
    }
    return true
  },

  // 提交巡检记录
  async onSubmit() {
    if (this.data.viewMode) return
    if (!this.validate()) return

    this.setData({ submitting: true })
    showLoading('提交中...')

    try {
      const record = {
        taskId: this.data.taskId,
        pointId: this.data.pointId,
        pointName: this.data.pointName,
        checkInType: this.data.checkInType,
        checkInTime: this.data.checkInTime,
        items: this.data.items,
        remark: this.data.remark,
        result: this.data.hasAbnormal ? '异常' : '正常',
        inspectorName: getUserInfo().nickName || '巡检员'
      }
      await taskApi.submitRecord(record)
      hideLoading()

      // 如果有异常，提示上报事件
      if (this.data.hasAbnormal) {
        wx.showModal({
          title: '发现异常',
          content: '本次巡检存在异常项，是否上报事件？',
          confirmText: '上报事件',
          cancelText: '暂不上报',
          success: (res) => {
            if (res.confirm) {
              wx.redirectTo({
                url: '/pages/event/create/create?pointId=' + this.data.pointId + '&pointName=' + encodeURIComponent(this.data.pointName)
              })
            } else {
              this.navigateBack()
            }
          }
        })
      } else {
        toast('巡检提交成功', 'success')
        setTimeout(() => this.navigateBack(), 1000)
      }
    } catch (err) {
      hideLoading()
      console.error('提交失败', err)
    } finally {
      this.setData({ submitting: false })
    }
  },

  navigateBack() {
    if (this.data.fromTask) {
      wx.navigateBack()
    } else {
      // 从扫码进入，返回到首页
      wx.switchTab({ url: '/pages/index/index' })
    }
  }
})
