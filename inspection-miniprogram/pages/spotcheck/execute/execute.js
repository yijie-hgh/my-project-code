// pages/spotcheck/execute/execute.js
const { spotCheckApi } = require('../../../utils/api')
const { requireLogin, getUserInfo } = require('../../../utils/auth')
const { toast, showLoading, hideLoading, deepClone } = require('../../../utils/util')

Page({
  data: {
    equipId: null,
    equipName: '',
    items: [],
    remark: '',
    submitting: false,
    hasAbnormal: false,
    loading: true
  },

  onLoad(options) {
    if (!requireLogin()) return
    const { equipId, equipName } = options
    this.setData({
      equipId: equipId || null,
      equipName: equipName ? decodeURIComponent(equipName) : ''
    })
    if (equipId) {
      this.loadTemplate(equipId)
    } else {
      this.setData({ loading: false })
    }
  },

  async loadTemplate(equipId) {
    try {
      const res = await spotCheckApi.getTemplate(equipId)
      const templates = res.data || []
      const items = templates.map(item => ({
        ...deepClone(item),
        value: item.itemType === 'photo' ? [] : ''
      }))
      this.setData({ items, loading: false })
    } catch (err) {
      console.error('加载点检模板失败', err)
      this.setData({ loading: false })
    }
  },

  // 选择检查项
  onChoiceChange(e) {
    const { index, value } = e.currentTarget.dataset
    const items = this.data.items
    items[index].value = value
    this.setData({ items })
    this.checkAbnormal()
  },

  // 选择照片
  onChoosePhoto(e) {
    const index = e.currentTarget.dataset.index
    const maxCount = 3
    const currentCount = this.data.items[index].value.length
    const count = maxCount - currentCount
    if (count <= 0) {
      toast('最多上传3张照片')
      return
    }
    wx.chooseMedia({
      count,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFiles = res.tempFiles || []
        const newPaths = tempFiles.map(f => f.tempFilePath)
        const items = this.data.items
        items[index].value = items[index].value.concat(newPaths)
        this.setData({ items })
      }
    })
  },

  // 删除照片
  onDeletePhoto(e) {
    const { index, pindex } = e.currentTarget.dataset
    const items = this.data.items
    items[index].value.splice(pindex, 1)
    this.setData({ items })
  },

  // 预览照片
  onPreviewPhoto(e) {
    const { urls, current } = e.currentTarget.dataset
    wx.previewImage({ current, urls })
  },

  // 输入备注
  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  // 检查是否有异常
  checkAbnormal() {
    const hasAbnormal = this.data.items.some(item => {
      if (item.itemType === 'choice') {
        return item.value === '异常' || item.value === '异响' || item.value === '偏高' || item.value === '需清理'
      }
      return false
    })
    this.setData({ hasAbnormal })
  },

  // 校验
  validate() {
    if (!this.data.equipId) {
      toast('缺少设备信息')
      return false
    }
    for (let i = 0; i < this.data.items.length; i++) {
      const item = this.data.items[i]
      if (item.required) {
        if (item.itemType === 'photo') {
          if (!item.value || item.value.length === 0) {
            toast('请完成：' + item.itemName)
            return false
          }
        } else {
          if (!item.value || item.value === '') {
            toast('请完成：' + item.itemName)
            return false
          }
        }
      }
    }
    return true
  },

  // 提交点检
  async onSubmit() {
    if (!this.validate()) return
    this.setData({ submitting: true })
    showLoading('提交中...')

    try {
      const userInfo = getUserInfo()
      const items = this.data.items.map(item => ({
        itemName: item.itemName,
        value: item.itemType === 'photo' ? (item.value.length + '张照片') : item.value
      }))
      const record = {
        equipId: this.data.equipId,
        equipName: this.data.equipName,
        items,
        remark: this.data.remark,
        result: this.data.hasAbnormal ? '异常' : '正常',
        checker: userInfo ? userInfo.nickName : '点检员'
      }
      await spotCheckApi.submit(record)
      hideLoading()

      // 如果有异常，提示发起报修
      if (this.data.hasAbnormal) {
        wx.showModal({
          title: '发现异常',
          content: '本次点检存在异常项，是否发起报修？',
          confirmText: '发起报修',
          cancelText: '暂不报修',
          success: (res) => {
            if (res.confirm) {
              wx.redirectTo({
                url: '/pages/repair/create/create?equipId=' + this.data.equipId + '&equipName=' + encodeURIComponent(this.data.equipName)
              })
            } else {
              toast('点检提交成功', 'success')
              setTimeout(() => wx.navigateBack(), 1000)
            }
          }
        })
      } else {
        toast('点检提交成功', 'success')
        setTimeout(() => wx.navigateBack(), 1000)
      }
    } catch (err) {
      hideLoading()
      console.error('提交点检失败', err)
      toast('提交失败')
    } finally {
      this.setData({ submitting: false })
    }
  }
})
