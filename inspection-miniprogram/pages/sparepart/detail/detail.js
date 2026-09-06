// pages/sparepart/detail/detail.js
const { sparePartApi } = require('../../../utils/api')
const { requireLogin } = require('../../../utils/auth')
const { toast, showLoading, hideLoading, confirm } = require('../../../utils/util')

Page({
  data: {
    partId: null,
    detail: null,
    loading: true,
    isLow: false,
    stockRate: 0,
    totalValue: 0,
    // 入库/出库弹窗
    showModal: false,
    modalType: '', // 'in' or 'out'
    modalTitle: '',
    modalQty: '',
    modalRemark: ''
  },

  onLoad(options) {
    if (!requireLogin()) return
    this.setData({ partId: options.id })
    this.loadDetail()
  },

  async loadDetail() {
    this.setData({ loading: true })
    try {
      const res = await sparePartApi.detail(this.data.partId)
      const detail = res.data
      if (detail) {
        const isLow = detail.stock < detail.minStock
        const stockRate = detail.maxStock > 0 ? Math.min(100, Math.round((detail.stock / detail.maxStock) * 100)) : 0
        const totalValue = (detail.stock * detail.unitPrice).toFixed(2)
        this.setData({
          detail,
          loading: false,
          isLow,
          stockRate,
          totalValue
        })
      } else {
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error('加载备件详情失败', err)
      this.setData({ loading: false })
    }
  },

  // 打开入库弹窗
  openStockIn() {
    this.setData({
      showModal: true,
      modalType: 'in',
      modalTitle: '备件入库',
      modalQty: '',
      modalRemark: ''
    })
  },

  // 打开出库弹窗
  openStockOut() {
    this.setData({
      showModal: true,
      modalType: 'out',
      modalTitle: '备件出库',
      modalQty: '',
      modalRemark: ''
    })
  },

  // 关闭弹窗
  closeModal() {
    this.setData({ showModal: false })
  },

  // 阻止冒泡
  stopPropagation() {},

  // 数量输入
  onQtyInput(e) {
    this.setData({ modalQty: e.detail.value })
  },

  // 备注输入
  onModalRemarkInput(e) {
    this.setData({ modalRemark: e.detail.value })
  },

  // 确认入库/出库
  async onConfirmStock() {
    const qty = parseInt(this.data.modalQty)
    if (!qty || qty <= 0) {
      toast('请输入有效数量')
      return
    }

    // 出库时校验库存
    if (this.data.modalType === 'out' && qty > this.data.detail.stock) {
      toast('出库数量不能超过当前库存')
      return
    }

    const action = this.data.modalType === 'in' ? '入库' : '出库'
    const ok = await confirm('确认' + action + qty + this.data.detail.unit + '？')
    if (!ok) return

    showLoading('提交中...')
    try {
      const data = {
        qty: qty,
        remark: this.data.modalRemark,
        operateTime: new Date().toLocaleString()
      }
      if (this.data.modalType === 'in') {
        await sparePartApi.stockIn(this.data.partId, data)
      } else {
        await sparePartApi.stockOut(this.data.partId, data)
      }
      hideLoading()
      toast(action + '成功', 'success')
      this.setData({ showModal: false })
      this.loadDetail()
    } catch (err) {
      hideLoading()
      console.error(action + '失败', err)
      toast(action + '失败，请重试')
    }
  },

  onPullDownRefresh() {
    this.loadDetail().then(() => wx.stopPullDownRefresh())
  }
})
