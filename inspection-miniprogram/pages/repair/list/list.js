// pages/repair/list/list.js
const { repairApi } = require('../../../utils/api')
const { requireLogin } = require('../../../utils/auth')
const { toast, confirm, showLoading, hideLoading } = require('../../../utils/util')
const { account, bitable, sync } = require('../../../utils/feishu')
const { formConfig, createViewMixin } = require('../../../utils/form-config')
const { parseRepairExcel, generateRepairTemplateCSV } = require('../../../utils/excel')

// 报修状态映射
const repairStatusMap = {
  '0': { text: '待受理', tag: 'tag-warning' },
  '1': { text: '已派单', tag: 'tag-primary' },
  '2': { text: '维修中', tag: 'tag-primary' },
  '3': { text: '已完成', tag: 'tag-success' },
  '4': { text: '已关闭', tag: 'tag-gray' }
}

// 紧急程度映射
const levelMap = {
  '1': { text: '低', tag: 'tag-gray', color: '#9ca3af' },
  '2': { text: '中', tag: 'tag-primary', color: '#2563eb' },
  '3': { text: '高', tag: 'tag-warning', color: '#f59e0b' },
  '4': { text: '紧急', tag: 'tag-danger', color: '#ef4444' }
}

// 视图混入
const viewMixin = createViewMixin('repair_records')

Page({
  data: {
    list: [],
    loading: true,
    activeTab: 'all',
    tabs: [
      { key: 'all', label: '全部' },
      { key: '0', label: '待受理' },
      { key: '2', label: '维修中' },
      { key: '3', label: '已完成' }
    ],
    queryParams: {
      title: '',
      status: ''
    },
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
      const params = { ...this.data.queryParams }
      if (this.data.activeTab !== 'all') {
        params.status = this.data.activeTab
      } else {
        params.status = ''
      }
      const res = await repairApi.list(params)
      const list = (res.data.rows || []).map(item => ({
        ...item,
        statusInfo: repairStatusMap[item.status] || {},
        levelInfo: levelMap[item.level] || {}
      }))
      this.setData({ list, loading: false })
    } catch (err) {
      console.error('加载报修列表失败', err)
      this.setData({ loading: false })
    }
  },

  onTabChange(e) {
    this.setData({ activeTab: e.currentTarget.dataset.key }, () => {
      this.loadData()
    })
  },

  onSearch(e) {
    this.setData({ 'queryParams.title': e.detail.value }, () => {
      this.loadData()
    })
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh())
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/repair/detail/detail?id=' + id })
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/repair/create/create' })
  },

  onEdit(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/repair/create/create?id=' + id })
  },

  async onDelete(e) {
    const id = e.currentTarget.dataset.id
    const ok = await confirm('确定删除此报修记录吗？')
    if (!ok) return
    showLoading('删除中...')
    try {
      await repairApi.remove(id)
      hideLoading()
      toast('删除成功', 'success')
      this.loadData()
    } catch (err) {
      hideLoading()
      console.error('删除报修失败', err)
      toast('删除失败')
    }
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
          const result = await parseRepairExcel(file.path, file.name)
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
          await repairApi.add(data[i])
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
    const csvContent = generateRepairTemplateCSV()
    const fs = wx.getFileSystemManager()
    const filePath = `${wx.env.USER_DATA_PATH}/维修记录导入模板.csv`
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
    const tableInfo = bitable.getByModule('repair_records')
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
      const result = await sync.syncModule('repair_records', this.data.list)
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
