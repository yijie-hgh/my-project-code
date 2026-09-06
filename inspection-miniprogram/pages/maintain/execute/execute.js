// pages/maintain/execute/execute.js
const { maintainApi } = require('../../../utils/api')
const { requireLogin } = require('../../../utils/auth')
const { toast, showLoading, hideLoading, confirm, deepClone } = require('../../../utils/util')

Page({
  data: {
    maintainId: null,
    detail: null,
    items: [],
    cost: '',
    remark: '',
    beforePhotos: [],
    afterPhotos: [],
    submitting: false,
    loading: true
  },

  onLoad(options) {
    if (!requireLogin()) return
    this.setData({ maintainId: options.id })
    this.loadDetail()
  },

  async loadDetail() {
    this.setData({ loading: true })
    try {
      const res = await maintainApi.detail(this.data.maintainId)
      const detail = res.data
      if (detail) {
        // 深拷贝保养项目，保留原始状态用于编辑
        const items = (detail.items || []).map(item => ({
          ...deepClone(item),
          done: item.done || false
        }))
        this.setData({ detail, items, loading: false })
      } else {
        this.setData({ loading: false })
        toast('保养记录不存在')
      }
    } catch (err) {
      console.error('加载保养详情失败', err)
      this.setData({ loading: false })
    }
  },

  // 切换保养项完成状态
  toggleItem(e) {
    const index = e.currentTarget.dataset.index
    const items = this.data.items
    items[index].done = !items[index].done
    this.setData({ items })
  },

  // 费用输入
  onCostInput(e) {
    this.setData({ cost: e.detail.value })
  },

  // 备注输入
  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  // 选择保养前照片
  chooseBeforePhoto() {
    const count = 9 - this.data.beforePhotos.length
    if (count <= 0) {
      toast('最多上传9张照片')
      return
    }
    wx.chooseMedia({
      count: count,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newPhotos = res.tempFiles.map(f => f.tempFilePath)
        this.setData({
          beforePhotos: [...this.data.beforePhotos, ...newPhotos]
        })
      }
    })
  },

  // 选择保养后照片
  chooseAfterPhoto() {
    const count = 9 - this.data.afterPhotos.length
    if (count <= 0) {
      toast('最多上传9张照片')
      return
    }
    wx.chooseMedia({
      count: count,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newPhotos = res.tempFiles.map(f => f.tempFilePath)
        this.setData({
          afterPhotos: [...this.data.afterPhotos, ...newPhotos]
        })
      }
    })
  },

  // 预览图片
  previewImage(e) {
    const { urls, current } = e.currentTarget.dataset
    wx.previewImage({ current, urls })
  },

  // 删除照片
  deletePhoto(e) {
    const { type, index } = e.currentTarget.dataset
    const photos = this.data[type]
    photos.splice(index, 1)
    this.setData({ [type]: photos })
  },

  // 校验
  validate() {
    if (this.data.items.length === 0) {
      toast('暂无保养项目')
      return false
    }
    const allDone = this.data.items.every(item => item.done)
    if (!allDone) {
      toast('请完成所有保养项目')
      return false
    }
    return true
  },

  // 提交保养
  async onSubmit() {
    if (!this.validate()) return

    const ok = await confirm('确认提交保养记录吗？')
    if (!ok) return

    this.setData({ submitting: true })
    showLoading('提交中...')

    try {
      const data = {
        items: this.data.items,
        cost: parseFloat(this.data.cost) || 0,
        remark: this.data.remark,
        beforePhotos: this.data.beforePhotos,
        afterPhotos: this.data.afterPhotos,
        finishTime: new Date().toLocaleString()
      }
      await maintainApi.execute(this.data.maintainId, data)
      hideLoading()
      toast('保养提交成功', 'success')
      setTimeout(() => wx.navigateBack(), 1500)
    } catch (err) {
      hideLoading()
      console.error('提交保养失败', err)
      toast('提交失败，请重试')
    } finally {
      this.setData({ submitting: false })
    }
  }
})
