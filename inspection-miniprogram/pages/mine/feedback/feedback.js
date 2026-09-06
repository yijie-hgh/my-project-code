// pages/mine/feedback/feedback.js
const { feedbackApi } = require('../../../utils/api')
const { requireLogin } = require('../../../utils/auth')
const { toast, showLoading, hideLoading } = require('../../../utils/util')

Page({
  data: {
    typeList: [
      { value: 'suggest', text: '功能建议', icon: '💡' },
      { value: 'bug', text: '问题反馈', icon: '🐛' },
      { value: 'experience', text: '体验问题', icon: '📱' },
      { value: 'other', text: '其他', icon: '✉️' }
    ],
    feedbackType: 'suggest',
    content: '',
    images: [],
    contact: '',
    submitting: false
  },

  onLoad() {
    if (!requireLogin()) return
  },

  onShow() {
    if (!requireLogin()) return
  },

  // 切换反馈类型
  onTypeChange(e) {
    this.setData({ feedbackType: e.currentTarget.dataset.value })
  },

  // 内容输入
  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  // 联系方式输入
  onContactInput(e) {
    this.setData({ contact: e.detail.value })
  },

  // 添加图片
  onAddImage() {
    const count = 3 - this.data.images.length
    if (count <= 0) return
    wx.chooseMedia({
      count: count,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const newImages = res.tempFiles.map(f => ({ path: f.tempFilePath }))
        this.setData({
          images: [...this.data.images, ...newImages]
        })
      },
      fail: (err) => {
        if (err.errMsg.indexOf('cancel') === -1) {
          console.error('选择图片失败', err)
        }
      }
    })
  },

  // 删除图片
  onDeleteImage(e) {
    const index = e.currentTarget.dataset.index
    const images = [...this.data.images]
    images.splice(index, 1)
    this.setData({ images })
  },

  // 预览图片
  onPreviewImage(e) {
    const index = e.currentTarget.dataset.index
    const urls = this.data.images.map(img => img.path)
    wx.previewImage({
      current: urls[index],
      urls: urls
    })
  },

  // 提交反馈
  async onSubmit() {
    const { feedbackType, content, images, contact } = this.data
    if (this.data.submitting) return

    if (!content.trim()) {
      toast('请填写反馈内容')
      return
    }
    if (content.trim().length < 10) {
      toast('反馈内容至少10个字')
      return
    }

    this.setData({ submitting: true })
    showLoading('提交中...')
    try {
      await feedbackApi.add({
        type: feedbackType,
        content: content.trim(),
        images: images.map(img => img.path),
        contact: contact.trim()
      })
      hideLoading()
      toast('反馈提交成功，感谢您的支持', 'success')
      // 延迟返回
      setTimeout(() => {
        wx.navigateBack()
      }, 1200)
    } catch (err) {
      hideLoading()
      console.error('提交反馈失败', err)
      toast('提交失败，请稍后重试')
    } finally {
      this.setData({ submitting: false })
    }
  }
})
