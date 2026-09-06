// pages/equipment/list/list.js
const { equipmentApi } = require('../../../utils/api')
const { requireLogin } = require('../../../utils/auth')
const { debounce, toast } = require('../../../utils/util')
const { formConfig, createViewMixin } = require('../../../utils/form-config')
const { account, bitable, sync } = require('../../../utils/feishu')
const { parseEquipmentExcel } = require('../../../utils/excel')

// 设备状态映射
const equipStatusMap = {
  '0': { text: '报废', tag: 'tag-gray' },
  '1': { text: '正常运行', tag: 'tag-success' },
  '2': { text: '故障待修', tag: 'tag-danger' },
  '3': { text: '停机保养', tag: 'tag-warning' },
  '4': { text: '待校验', tag: 'tag-info' }
}

// 视图混入
const viewMixin = createViewMixin('equipment_inventory')

Page({
  data: {
    list: [],
    loading: true,
    keyword: '',
    queryParams: {
      equipName: '',
      status: '',
      workshop: '',
      equipType: ''
    },
    statusTabs: [
      { value: '', label: '全部' },
      { value: '1', label: '正常运行' },
      { value: '2', label: '故障待修' },
      { value: '3', label: '停机保养' },
      { value: '0', label: '报废' }
    ],
    // 筛选选项
    workshopOptions: ['全部车间'],
    workshopIndex: 0,
    typeOptions: ['全部类型'],
    typeIndex: 0,
    // 统计
    stats: {
      total: 0,
      normal: 0,
      fault: 0,
      other: 0
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
    this.searchDebounce = debounce(() => {
      this.loadData()
    }, 500)
    // 初始化视图配置
    viewMixin.initViewConfig.call(this)
  },

  onShow() {
    if (!requireLogin()) return
    this.loadData()
  },

  // 加载设备列表
  async loadData() {
    this.setData({ loading: true })
    try {
      const res = await equipmentApi.list(this.data.queryParams)
      let list = (res.data.rows || []).map(item => ({
        ...item,
        statusInfo: equipStatusMap[item.status] || {}
      }))

      // 提取车间和类型选项（仅首次加载时）
      if (this.data.workshopOptions.length <= 1) {
        const allItems = (await equipmentApi.list({})).data.rows || []
        const workshops = ['全部车间']
        const types = ['全部类型']
        allItems.forEach(item => {
          if (item.workshop && workshops.indexOf(item.workshop) === -1) {
            workshops.push(item.workshop)
          }
          if (item.equipType && types.indexOf(item.equipType) === -1) {
            types.push(item.equipType)
          }
        })
        this.setData({ workshopOptions: workshops, typeOptions: types })
      }

      // 统计
      const stats = {
        total: list.length,
        normal: list.filter(e => e.status === '1').length,
        fault: list.filter(e => e.status === '2').length,
        other: list.filter(e => e.status !== '1' && e.status !== '2').length
      }

      this.setData({ list, stats, loading: false })
    } catch (err) {
      console.error('加载设备列表失败', err)
      this.setData({ loading: false })
      toast('加载失败，请重试')
    }
  },

  // 搜索输入（防抖）
  onSearchInput(e) {
    const value = e.detail.value
    this.setData({
      keyword: value,
      'queryParams.equipName': value
    })
    this.searchDebounce()
  },

  // 清除搜索
  onClearSearch() {
    this.setData({
      keyword: '',
      'queryParams.equipName': ''
    })
    this.loadData()
  },

  // 切换状态筛选
  onStatusChange(e) {
    const status = e.currentTarget.dataset.value
    this.setData({ 'queryParams.status': status })
    this.loadData()
  },

  // 车间筛选
  onWorkshopChange(e) {
    const index = e.detail.value
    const workshop = index == 0 ? '' : this.data.workshopOptions[index]
    this.setData({
      workshopIndex: index,
      'queryParams.workshop': workshop
    })
    this.loadData()
  },

  // 类型筛选
  onTypeChange(e) {
    const index = e.detail.value
    const equipType = index == 0 ? '' : this.data.typeOptions[index]
    this.setData({
      typeIndex: index,
      'queryParams.equipType': equipType
    })
    this.loadData()
  },

  // 重置筛选
  onResetFilter() {
    this.setData({
      'queryParams.status': '',
      'queryParams.workshop': '',
      'queryParams.equipType': '',
      workshopIndex: 0,
      typeIndex: 0
    })
    this.loadData()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh())
  },

  // 跳转详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/equipment/detail/detail?id=' + id })
  },

  // 跳转扫码
  goScan() {
    wx.navigateTo({ url: '/pages/equipment/scan/scan' })
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

  // 获取字段显示文本
  getFieldDisplay(field, item) {
    return formConfig.getFieldDisplayText(field, item[field.key])
  },

  // ============ Excel导入 ============
  onOpenImport() {
    this.setData({ showImportModal: true, importResult: null })
  },

  onCloseImport() {
    this.setData({ showImportModal: false, importResult: null })
  },

  // 选择文件导入
  onChooseImportFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['xlsx', 'xls', 'csv'],
      success: async (res) => {
        const file = res.tempFiles[0]
        wx.showLoading({ title: '解析中...', mask: true })
        try {
          const result = await parseEquipmentExcel(file.path, file.name)
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

  // 确认导入
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
          await equipmentApi.add(data[i])
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

  // 下载模板
  onDownloadTemplate() {
    const { generateTemplateCSV } = require('../../../utils/excel')
    const csvContent = generateTemplateCSV()
    const fs = wx.getFileSystemManager()
    const filePath = `${wx.env.USER_DATA_PATH}/设备清单导入模板.csv`
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
    const tableInfo = bitable.getByModule('equipment_inventory')
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
      const result = await sync.syncModule('equipment_inventory', this.data.list)
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
