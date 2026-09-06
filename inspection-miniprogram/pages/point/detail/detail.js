// pages/point/detail/detail.js
const { pointApi } = require('../../../utils/api')
const { requireLogin } = require('../../../utils/auth')
const { itemTypeMap, formatDateTime, timeAgo, toast, showLoading, hideLoading, confirm } = require('../../../utils/util')

// 巡检点状态映射
const pointStatusMap = {
  '1': { text: '启用', tag: 'tag-success' },
  '0': { text: '停用', tag: 'tag-gray' }
}

Page({
  data: {
    id: null,
    detail: null,
    loading: true,
    // 编辑弹窗
    showForm: false,
    form: {
      id: '',
      pointName: '',
      pointCode: '',
      location: '',
      nfcTag: '',
      qrcode: ''
    }
  },

  onLoad(options) {
    this.setData({ id: options.id })
  },

  onShow() {
    if (!requireLogin()) return
    if (this.data.id) this.loadData()
  },

  // 加载巡检点详情
  async loadData() {
    this.setData({ loading: true })
    try {
      const res = await pointApi.detail(this.data.id)
      const detail = res.data || {}
      detail.statusInfo = pointStatusMap[detail.status] || {}
      detail.lastTimeText = timeAgo(detail.lastInspectTime)
      detail.lastInspectTimeText = formatDateTime(detail.lastInspectTime)
      // 巡检项类型映射
      detail.items = (detail.items || []).map(item => ({
        ...item,
        typeText: itemTypeMap[item.itemType] || item.itemType,
        requiredText: item.required ? '必填' : '选填',
        requiredTag: item.required ? 'tag-danger' : 'tag-gray'
      }))
      this.setData({ detail, loading: false })
    } catch (err) {
      console.error('加载巡检点详情失败', err)
      this.setData({ loading: false })
      toast('加载失败，请重试')
    }
  },

  // 打开编辑弹窗
  onEdit() {
    const d = this.data.detail
    this.setData({
      showForm: true,
      form: {
        id: d.id,
        pointName: d.pointName,
        pointCode: d.pointCode,
        location: d.location || '',
        nfcTag: d.nfcTag || '',
        qrcode: d.qrcode || ''
      }
    })
  },

  // 表单输入
  onFormInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['form.' + field]: e.detail.value })
  },

  // 关闭弹窗
  onCloseForm() {
    this.setData({ showForm: false })
  },

  // 阻止冒泡
  stopPropagation() {},

  // 提交编辑
  async onSubmitForm() {
    const { pointName, pointCode } = this.data.form
    if (!pointName.trim()) return toast('请输入巡检点名称')
    if (!pointCode.trim()) return toast('请输入巡检点编码')

    showLoading('保存中...')
    try {
      await pointApi.update(this.data.form)
      hideLoading()
      toast('保存成功', 'success')
      this.setData({ showForm: false })
      this.loadData()
    } catch (err) {
      hideLoading()
      console.error('保存巡检点失败', err)
      toast('保存失败，请重试')
    }
  },

  // 删除巡检点
  async onDelete() {
    const ok = await confirm('确定要删除该巡检点吗？删除后不可恢复')
    if (!ok) return

    showLoading('删除中...')
    try {
      await pointApi.remove(this.data.id)
      hideLoading()
      toast('删除成功', 'success')
      setTimeout(() => wx.navigateBack(), 800)
    } catch (err) {
      hideLoading()
      console.error('删除巡检点失败', err)
      toast('删除失败，请重试')
    }
  },

  // 生成二维码
  onGenerateQrcode() {
    wx.navigateTo({ url: '/pages/qrcode/qrcode?pointId=' + this.data.id })
  }
})
