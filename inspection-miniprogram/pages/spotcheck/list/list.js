// pages/spotcheck/list/list.js
const { spotCheckApi, repairApi, maintainApi, equipmentApi } = require('../../../utils/api')
const { requireLogin } = require('../../../utils/auth')
const { toast, confirm } = require('../../../utils/util')
const { formConfig, createViewMixin } = require('../../../utils/form-config')
const { account, bitable, sync } = require('../../../utils/feishu')
const { parseSpotCheckExcel, generateSpotCheckTemplateCSV } = require('../../../utils/excel')

// 视图混入
const viewMixin = createViewMixin('spotcheck_records')

Page({
  data: {
    list: [],
    loading: true,
    activeTab: 'all',
    tabs: [
      { key: 'all', label: '全部' },
      { key: '正常', label: '正常' },
      { key: '异常', label: '异常' }
    ],
    queryParams: {
      equipName: '',
      result: ''
    },
    showDetail: false,
    detailRecord: null,
    relatedData: null,
    loadingRelated: false,
    stats: {
      total: 0,
      normal: 0,
      abnormal: 0,
      passRate: 0
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
      const params = {}
      if (this.data.activeTab !== 'all') {
        params.result = this.data.activeTab
      }
      const res = await spotCheckApi.list(params)
      let list = res.data.rows || []
      if (this.data.queryParams.equipName) {
        const keyword = this.data.queryParams.equipName
        list = list.filter(item => item.equipName.indexOf(keyword) > -1)
      }
      const stats = {
        total: list.length,
        normal: list.filter(i => i.result === '正常').length,
        abnormal: list.filter(i => i.result === '异常').length,
        passRate: list.length > 0 ? Math.round(list.filter(i => i.result === '正常').length / list.length * 100) : 0
      }
      this.setData({ list, stats, loading: false })
    } catch (err) {
      console.error('加载点检记录失败', err)
      this.setData({ loading: false })
    }
  },

  onTabChange(e) {
    this.setData({ activeTab: e.currentTarget.dataset.key }, () => {
      this.loadData()
    })
  },

  onSearch(e) {
    this.setData({ 'queryParams.equipName': e.detail.value }, () => {
      this.loadData()
    })
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh())
  },

  async viewDetail(e) {
    const id = e.currentTarget.dataset.id
    const record = this.data.list.find(item => item.id === id)
    if (record) {
      this.setData({ showDetail: true, detailRecord: record, relatedData: null, loadingRelated: true })
      this.loadRelatedData(record.equipId)
    }
  },

  async loadRelatedData(equipId) {
    try {
      const res = await equipmentApi.getRelatedModules(equipId)
      this.setData({ relatedData: res.data, loadingRelated: false })
    } catch (err) {
      console.error('加载关联数据失败', err)
      this.setData({ loadingRelated: false })
    }
  },

  closeDetail() {
    this.setData({ showDetail: false, detailRecord: null, relatedData: null })
  },

  goEquipDetail(e) {
    const equipId = e.currentTarget.dataset.equipid
    this.closeDetail()
    wx.navigateTo({ url: '/pages/equipment/detail/detail?id=' + equipId })
  },

  goRepair(e) {
    const equipId = e.currentTarget.dataset.equipid
    const equipName = e.currentTarget.dataset.equipname
    this.closeDetail()
    wx.navigateTo({ url: '/pages/repair/create/create?equipId=' + equipId + '&equipName=' + encodeURIComponent(equipName) })
  },

  goMaintain(e) {
    const equipId = e.currentTarget.dataset.equipid
    wx.navigateTo({ url: '/pages/maintain/list/list?equipId=' + equipId })
  },

  goQrcode(e) {
    const equipId = e.currentTarget.dataset.equipid
    wx.navigateTo({ url: '/pages/qrcode/qrcode?equipId=' + equipId })
  },

  goExecute() {
    wx.navigateTo({ url: '/pages/spotcheck/execute/execute' })
  },

  async onDeleteRecord(e) {
    const id = e.currentTarget.dataset.id
    const ok = await confirm('确定删除此点检记录吗？')
    if (!ok) return
    try {
      await spotCheckApi.remove(id)
      toast('删除成功')
      this.loadData()
    } catch (err) {
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
          const result = await parseSpotCheckExcel(file.path, file.name)
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
          await spotCheckApi.add(data[i])
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
    const csvContent = generateSpotCheckTemplateCSV()
    const fs = wx.getFileSystemManager()
    const filePath = `${wx.env.USER_DATA_PATH}/点检记录导入模板.csv`
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
          fail: () => {
            toast('模板已生成，请在文件管理器中查看')
          }
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
    const tableInfo = bitable.getByModule('spotcheck_records')
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
      const result = await sync.syncModule('spotcheck_records', this.data.list)
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
