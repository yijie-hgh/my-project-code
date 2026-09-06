// pages/sparepart/list/list.js
const { sparePartApi } = require('../../../utils/api')
const { requireLogin } = require('../../../utils/auth')
const { toast, confirm } = require('../../../utils/util')
const { account, bitable, sync } = require('../../../utils/feishu')
const { formConfig, createViewMixin } = require('../../../utils/form-config')
const { parseSparePartExcel, generateSparePartTemplateCSV } = require('../../../utils/excel')

// 视图混入
const viewMixin = createViewMixin('spare_parts')

Page({
  data: {
    list: [],
    loading: true,
    activeTab: 'all',
    tabs: [
      { key: 'all', label: '全部' },
      { key: '1', label: '充足' },
      { key: '0', label: '库存不足' }
    ],
    queryParams: {
      partName: ''
    },
    totalValue: 0,
    totalParts: 0,
    lowStockCount: 0,
    // 视图相关
    viewMode: 'card',
    visibleFields: [],
    visibleFieldInfos: [],
    fieldOptions: [],
    showFieldConfig: false,
    configVisibleFields: [],
    fieldGroups: {},
    moduleConfig: null,
    // 导入弹窗
    showImportModal: false,
    importResult: null
  },

  onLoad() {
    if (!requireLogin()) return
    viewMixin.initViewConfig.call(this)
    this.loadData()
  },

  onShow() {
    if (!requireLogin()) return
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      const res = await sparePartApi.list(this.data.queryParams)
      let list = res.data.rows || []
      list = list.map(item => {
        const isLow = item.stock < item.minStock
        const stockRate = item.maxStock > 0 ? Math.min(100, Math.round((item.stock / item.maxStock) * 100)) : 0
        const stockStatus = isLow ? '0' : '1'
        return {
          ...item,
          isLow,
          stockRate,
          stockStatus,
          statusInfo: isLow
            ? { text: '库存不足', tag: 'tag-danger' }
            : { text: '充足', tag: 'tag-success' },
          totalValue: (item.stock * item.unitPrice).toFixed(2)
        }
      })

      // 按tab筛选
      if (this.data.activeTab !== 'all') {
        list = list.filter(item => item.stockStatus === this.data.activeTab)
      }

      // 统计总库存价值（基于全部数据，不受tab筛选影响）
      const allList = res.data.rows || []
      const totalValue = allList.reduce((sum, item) => {
        return sum + item.stock * item.unitPrice
      }, 0)
      const lowStockCount = allList.filter(item => item.stock < item.minStock).length

      this.setData({
        list,
        loading: false,
        totalValue: totalValue.toFixed(2),
        totalParts: allList.length,
        lowStockCount
      })
    } catch (err) {
      console.error('加载备件列表失败', err)
      this.setData({ loading: false })
    }
  },

  onTabChange(e) {
    this.setData({ activeTab: e.currentTarget.dataset.key }, () => {
      this.loadData()
    })
  },

  onSearch(e) {
    this.setData({ 'queryParams.partName': e.detail.value }, () => {
      this.loadData()
    })
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh())
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/sparepart/detail/detail?id=' + id })
  },

  // ============ 视图切换方法 ============
  onToggleViewMode() {
    viewMixin.onToggleViewMode.call(this)
  },

  onOpenFieldConfig() {
    viewMixin.onOpenFieldConfig.call(this)
  },

  onCloseFieldConfig() {
    viewMixin.onCloseFieldConfig.call(this)
  },

  onToggleField(e) {
    viewMixin.onToggleField.call(this, e)
  },

  onSaveFieldConfig() {
    viewMixin.onSaveFieldConfig.call(this)
  },

  onResetFieldConfig() {
    viewMixin.onResetFieldConfig.call(this)
  },

  onSelectAllFields() {
    viewMixin.onSelectAllFields.call(this)
  },

  // ============ Excel导入 ============
  onOpenImport() {
    this.setData({ showImportModal: true, importResult: null })
  },

  onCloseImport() {
    this.setData({ showImportModal: false, importResult: null })
  },

  onChooseImportFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['xlsx', 'xls', 'csv'],
      success: async (res) => {
        const file = res.tempFiles[0]
        wx.showLoading({ title: '解析中...', mask: true })
        try {
          const result = await parseSparePartExcel(file.path, file.name)
          wx.hideLoading()
          this.setData({ importResult: result })
          if (result.success) {
            toast(`解析成功: ${result.validCount}条有效`)
          } else {
            toast('解析失败，请检查文件格式')
          }
        } catch (err) {
          wx.hideLoading()
          toast('文件解析失败')
        }
      },
      fail: () => {}
    })
  },

  async onConfirmImport() {
    if (!this.data.importResult || !this.data.importResult.success) return
    const data = this.data.importResult.data
    if (data.length === 0) {
      toast('没有可导入的数据')
      return
    }
    wx.showLoading({ title: '导入中...', mask: true })
    try {
      let successCount = 0
      for (let i = 0; i < data.length; i++) {
        try {
          await sparePartApi.add(data[i])
          successCount++
        } catch (e) {
          console.error('导入单条失败', e)
        }
      }
      wx.hideLoading()
      toast(`导入完成: 成功${successCount}条`, 'success')
      this.setData({ showImportModal: false, importResult: null })
      this.loadData()
    } catch (err) {
      wx.hideLoading()
      toast('导入失败')
    }
  },

  onDownloadTemplate() {
    const csvContent = generateSparePartTemplateCSV()
    const fs = wx.getFileSystemManager()
    const filePath = `${wx.env.USER_DATA_PATH}/备件管理导入模板.csv`
    fs.writeFile({
      filePath,
      data: csvContent,
      encoding: 'utf-8',
      success: () => {
        wx.openDocument({
          filePath,
          fileType: 'csv',
          showMenu: true,
          success: () => {},
          fail: () => toast('模板已生成，请在文件管理器中查看')
        })
      },
      fail: () => toast('模板生成失败')
    })
  },

  // ============ 飞书同步 ============
  async onSyncToFeishu() {
    if (!account.isLoggedIn()) {
      const res = await wx.showModal({
        title: '提示',
        content: '飞书未登录，是否前往飞书设置页登录？',
        confirmText: '去登录',
        cancelText: '取消'
      })
      if (res.confirm) {
        wx.navigateTo({ url: '/pages/feishu/settings/settings' })
      }
      return
    }
    const tableInfo = bitable.getByModule('spare_parts')
    if (!tableInfo) {
      const res = await wx.showModal({
        title: '提示',
        content: '飞书多维表格未创建，是否前往创建？',
        confirmText: '去创建',
        cancelText: '取消'
      })
      if (res.confirm) {
        wx.navigateTo({ url: '/pages/feishu/settings/settings' })
      }
      return
    }
    wx.showLoading({ title: '同步飞书中...', mask: true })
    try {
      const result = await sync.syncModule('spare_parts', this.data.list)
      wx.hideLoading()
      if (result.code === 0) {
        const d = result.data
        toast('同步成功: 新增' + d.addCount + ' 更新' + d.updateCount, 'success')
      } else {
        toast(result.msg || '同步失败')
      }
    } catch (err) {
      wx.hideLoading()
      console.error('飞书同步失败', err)
      toast('同步失败，请重试')
    }
  }
})
