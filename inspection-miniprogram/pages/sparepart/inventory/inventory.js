// pages/sparepart/inventory/inventory.js
const { sparePartApi, configApi } = require('../../../utils/api')
const { requireLogin } = require('../../../utils/auth')
const { toast, showLoading, hideLoading, confirm } = require('../../../utils/util')

// 库存状态分类
function getStockStatus(stock, minStock) {
  if (stock <= minStock) {
    return { key: 'warning', text: '预警', tag: 'tag-danger', color: 'text-danger' }
  }
  if (minStock > 0 && stock <= minStock * 1.5) {
    return { key: 'insufficient', text: '不足', tag: 'tag-warning', color: 'text-warning' }
  }
  return { key: 'sufficient', text: '充足', tag: 'tag-success', color: 'text-success' }
}

Page({
  data: {
    rawList: [],
    list: [],
    loading: true,
    // 顶部统计
    stats: {
      total: 0,
      sufficient: 0,
      insufficient: 0,
      warning: 0
    },
    // 库存状态筛选
    statusTabs: [
      { key: '', label: '全部' },
      { key: 'sufficient', label: '充足' },
      { key: 'insufficient', label: '不足' },
      { key: 'warning', label: '预警' }
    ],
    activeStatus: '',
    // 分类筛选
    categoryOptions: ['全部'],
    categoryIndex: 0,
    // 添加弹窗用的分类（不含"全部"）
    addCategoryOptions: [],
    // 搜索
    keyword: '',
    queryParams: {
      partName: ''
    },
    // 入库/出库弹窗
    showStockModal: false,
    stockModalType: '',
    stockModalTitle: '',
    stockPart: null,
    stockQty: '',
    stockRemark: '',
    // 添加备件弹窗
    showAddModal: false,
    addSubmitting: false,
    addForm: {
      partName: '',
      partCode: '',
      category: '',
      categoryIndex: -1,
      brand: '',
      spec: '',
      unit: '个',
      stock: '',
      minStock: '',
      maxStock: '',
      unitPrice: '',
      supplier: '',
      location: ''
    }
  },

  onLoad() {
    if (!requireLogin()) return
    this.loadCategories()
    this.loadData()
  },

  onShow() {
    if (!requireLogin()) return
  },

  // 加载备件分类
  async loadCategories() {
    try {
      const res = await configApi.getSparePartCategories()
      const cats = (res.data || []).filter(c => c.enabled !== false)
      const options = ['全部'].concat(cats.map(c => c.categoryName))
      this.setData({ categoryOptions: options, addCategoryOptions: options.slice(1) })
    } catch (err) {
      console.error('加载备件分类失败', err)
    }
  },

  // 加载全部备件数据
  async loadData() {
    this.setData({ loading: true })
    try {
      const res = await sparePartApi.list({})
      let rawList = (res.data.rows || []).map(item => {
        const statusInfo = getStockStatus(item.stock, item.minStock)
        const stockRate = item.maxStock > 0 ? Math.min(100, Math.round((item.stock / item.maxStock) * 100)) : 0
        const totalValue = (item.stock * (item.unitPrice || 0)).toFixed(2)
        return {
          ...item,
          statusInfo,
          stockRate,
          totalValue
        }
      })

      // 统计（基于全量数据）
      const stats = {
        total: rawList.length,
        sufficient: rawList.filter(p => p.statusInfo.key === 'sufficient').length,
        insufficient: rawList.filter(p => p.statusInfo.key === 'insufficient').length,
        warning: rawList.filter(p => p.statusInfo.key === 'warning').length
      }

      this.setData({ rawList, stats, loading: false }, () => {
        this.applyFilter()
      })
    } catch (err) {
      console.error('加载备件清单失败', err)
      this.setData({ loading: false })
      toast('加载失败，请重试')
    }
  },

  // 应用筛选条件
  applyFilter() {
    let list = this.data.rawList.slice()
    const keyword = (this.data.queryParams.partName || '').trim()
    const category = this.data.categoryIndex > 0 ? this.data.categoryOptions[this.data.categoryIndex] : ''
    const status = this.data.activeStatus

    if (keyword) {
      list = list.filter(p =>
        (p.partName && p.partName.indexOf(keyword) > -1) ||
        (p.partCode && p.partCode.indexOf(keyword) > -1)
      )
    }
    if (category) {
      list = list.filter(p => p.category === category)
    }
    if (status) {
      list = list.filter(p => p.statusInfo.key === status)
    }

    this.setData({ list })
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      keyword: e.detail.value,
      'queryParams.partName': e.detail.value
    })
    if (this._searchTimer) clearTimeout(this._searchTimer)
    this._searchTimer = setTimeout(() => {
      this.applyFilter()
    }, 300)
  },

  // 清除搜索
  onClearSearch() {
    this.setData({ keyword: '', 'queryParams.partName': '' })
    this.applyFilter()
  },

  // 分类筛选
  onCategoryChange(e) {
    this.setData({ categoryIndex: e.detail.value }, () => {
      this.applyFilter()
    })
  },

  // 库存状态筛选
  onStatusTabChange(e) {
    this.setData({ activeStatus: e.currentTarget.dataset.key }, () => {
      this.applyFilter()
    })
  },

  // 跳转备件详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/sparepart/detail/detail?id=' + id })
  },

  // ============ 入库 / 出库 ============
  openStockIn(e) {
    const id = e.currentTarget.dataset.id
    const part = this.data.rawList.find(p => p.id == id)
    if (!part) return
    this.setData({
      showStockModal: true,
      stockModalType: 'in',
      stockModalTitle: '备件入库',
      stockPart: part,
      stockQty: '',
      stockRemark: ''
    })
  },

  openStockOut(e) {
    const id = e.currentTarget.dataset.id
    const part = this.data.rawList.find(p => p.id == id)
    if (!part) return
    this.setData({
      showStockModal: true,
      stockModalType: 'out',
      stockModalTitle: '备件出库',
      stockPart: part,
      stockQty: '',
      stockRemark: ''
    })
  },

  closeStockModal() {
    this.setData({ showStockModal: false })
  },

  stopPropagation() {},

  onStockQtyInput(e) {
    this.setData({ stockQty: e.detail.value })
  },

  onStockRemarkInput(e) {
    this.setData({ stockRemark: e.detail.value })
  },

  // 确认入库/出库
  async onConfirmStock() {
    const qty = parseInt(this.data.stockQty)
    if (!qty || qty <= 0) {
      toast('请输入有效数量')
      return
    }
    const part = this.data.stockPart
    if (this.data.stockModalType === 'out' && qty > part.stock) {
      toast('出库数量不能超过当前库存')
      return
    }

    const action = this.data.stockModalType === 'in' ? '入库' : '出库'
    const ok = await confirm('确认' + action + qty + part.unit + '？')
    if (!ok) return

    showLoading('提交中...')
    try {
      const data = {
        qty: qty,
        remark: this.data.stockRemark,
        operateTime: new Date().toLocaleString()
      }
      if (this.data.stockModalType === 'in') {
        await sparePartApi.stockIn(part.id, data)
      } else {
        await sparePartApi.stockOut(part.id, data)
      }
      hideLoading()
      toast(action + '成功', 'success')
      this.setData({ showStockModal: false })
      this.loadData()
    } catch (err) {
      hideLoading()
      console.error(action + '失败', err)
      toast(action + '失败，请重试')
    }
  },

  // ============ Excel 导入 ============
  onImportExcel() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['xlsx', 'xls'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file) return
        showLoading('导入中...')
        sparePartApi.importExcel([{ name: file.name, path: file.path, size: file.size }]).then((response) => {
          hideLoading()
          const data = response.data || {}
          const count = data.importCount != null ? data.importCount : 0
          toast('导入成功，共' + count + '条', 'success')
          this.loadData()
        }).catch(() => {
          hideLoading()
          toast('导入失败，请重试')
        })
      },
      fail: () => {}
    })
  },

  // ============ 添加备件 ============
  openAddModal() {
    this.setData({
      showAddModal: true,
      addForm: {
        partName: '',
        partCode: '',
        category: '',
        categoryIndex: -1,
        brand: '',
        spec: '',
        unit: '个',
        stock: '',
        minStock: '',
        maxStock: '',
        unitPrice: '',
        supplier: '',
        location: ''
      }
    })
  },

  closeAddModal() {
    this.setData({ showAddModal: false })
  },

  onAddInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['addForm.' + field]: e.detail.value })
  },

  onAddCategoryChange(e) {
    const index = e.detail.value
    const categoryName = this.data.addCategoryOptions[index]
    this.setData({
      'addForm.categoryIndex': index,
      'addForm.category': categoryName || ''
    })
  },

  async onConfirmAdd() {
    const f = this.data.addForm
    if (!f.partName || !f.partName.trim()) {
      toast('请输入备件名称')
      return
    }
    if (this.data.addSubmitting) return
    this.setData({ addSubmitting: true })

    const data = {
      partName: f.partName.trim(),
      partCode: f.partCode,
      category: f.category,
      brand: f.brand,
      spec: f.spec,
      unit: f.unit || '个',
      stock: f.stock ? Number(f.stock) : 0,
      minStock: f.minStock ? Number(f.minStock) : 0,
      maxStock: f.maxStock ? Number(f.maxStock) : 0,
      unitPrice: f.unitPrice ? Number(f.unitPrice) : 0,
      supplier: f.supplier,
      location: f.location,
      relatedEquip: '',
      totalIn: f.stock ? Number(f.stock) : 0,
      totalOut: 0,
      status: '1'
    }

    showLoading('保存中...')
    try {
      await sparePartApi.add(data)
      hideLoading()
      toast('添加成功', 'success')
      this.setData({ showAddModal: false, addSubmitting: false })
      this.loadData()
    } catch (err) {
      hideLoading()
      console.error('添加备件失败', err)
      toast('添加失败，请重试')
      this.setData({ addSubmitting: false })
    }
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh())
  }
})
