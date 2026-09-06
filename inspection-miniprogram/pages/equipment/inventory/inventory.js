// pages/equipment/inventory/inventory.js
const { equipmentApi } = require('../../../utils/api')
const { requireLogin } = require('../../../utils/auth')
const { debounce, toast, confirm } = require('../../../utils/util')
const { parseEquipmentExcel, generateTemplateCSV } = require('../../../utils/excel')
const { account, bitable, sync } = require('../../../utils/feishu')
const { formConfig } = require('../../../utils/form-config')
const { permission } = require('../../../utils/permission')

// 设备状态映射
const equipStatusMap = {
  '0': { text: '报废', tag: 'tag-gray' },
  '1': { text: '正常运行', tag: 'tag-success' },
  '2': { text: '故障待修', tag: 'tag-danger' },
  '3': { text: '停机保养', tag: 'tag-warning' },
  '4': { text: '待校验', tag: 'tag-info' }
}

Page({
  data: {
    list: [],
    loading: true,
    keyword: '',
    expandedId: null,
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
      pendingCalibration: 0
    },
    // Excel导入预览
    importPreview: {
      show: false,
      fileName: '',
      parsing: false,
      data: [],
      errors: [],
      total: 0,
      validCount: 0,
      failCount: 0,
      matchedColumns: {},
      headerRow: []
    },
    // 表单显示模式
    viewMode: 'card', // card | form
    formFields: [],
    formVisibleFields: [],
    fieldConfig: null,
    showFieldPicker: false,
    // 编辑表单
    editingItem: null,
    editMode: false,
    canEdit: false
  },

  onLoad() {
    this.searchDebounce = debounce(() => {
      this.loadData()
    }, 500)
    // 初始化表单配置
    this.initFormConfig()
  },

  // 初始化表单配置
  initFormConfig() {
    const config = formConfig.getConfig('equipment_inventory')
    const visibleFields = formConfig.getVisibleFields('equipment_inventory')
    const canEdit = permission.hasPermission('equipment:edit')
    this.setData({
      fieldConfig: config,
      formVisibleFields: visibleFields,
      canEdit
    })
  },

  onShow() {
    if (!requireLogin()) return
    this.loadData()
  },

  // 加载设备清单
  async loadData() {
    this.setData({ loading: true })
    try {
      const res = await equipmentApi.getInventory(this.data.queryParams)
      let list = (res.data.rows || []).map(item => {
        const statusInfo = equipStatusMap[item.status] || {}
        // 健康分等级颜色
        let healthLevel = null
        if (item.healthScore && item.healthScore.score !== undefined) {
          const score = item.healthScore.score
          if (score >= 85) {
            healthLevel = { text: '优秀', color: '#10b981', bg: '#d1fae5' }
          } else if (score >= 70) {
            healthLevel = { text: '良好', color: '#10b981', bg: '#d1fae5' }
          } else if (score >= 50) {
            healthLevel = { text: '警告', color: '#f59e0b', bg: '#fef3c7' }
          } else if (score > 0) {
            healthLevel = { text: '危险', color: '#ef4444', bg: '#fee2e2' }
          } else {
            healthLevel = { text: '报废', color: '#9ca3af', bg: '#f3f4f6' }
          }
        }
        return {
          ...item,
          statusInfo,
          healthLevel
        }
      })

      // 提取车间和类型选项（仅首次加载时）
      if (this.data.workshopOptions.length <= 1) {
        const allRes = await equipmentApi.getInventory({})
        const allItems = allRes.data.rows || []
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

      // 统计（基于全量数据，不受筛选影响）
      const allRes = await equipmentApi.getInventory({})
      const allList = allRes.data.rows || []
      const today = new Date()
      const stats = {
        total: allList.length,
        normal: allList.filter(e => e.status === '1').length,
        fault: allList.filter(e => e.status === '2').length,
        pendingCalibration: allList.filter(e => {
          if (!e.calibrationExpire) return false
          return new Date(e.calibrationExpire).getTime() <= today.getTime()
        }).length
      }

      this.setData({ list, stats, loading: false })
    } catch (err) {
      console.error('加载设备清单失败', err)
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

  // 展开/收起卡片
  async toggleExpand(e) {
    const id = e.currentTarget.dataset.id
    if (this.data.expandedId === id) {
      this.setData({ expandedId: null })
      return
    }
    this.setData({ expandedId: id })
    // 加载关联模块详情
    try {
      const res = await equipmentApi.getRelatedModules(id)
      const related = res.data || {}
      const idx = this.data.list.findIndex(item => item.id == id)
      if (idx > -1) {
        this.setData({
          ['list[' + idx + '].relatedModules']: related
        })
      }
    } catch (err) {
      console.error('加载关联模块失败', err)
    }
  },

  // 添加设备（跳转台账管理页）
  goAdd() {
    wx.navigateTo({ url: '/pages/equipment/ledger/ledger' })
  },

  // 导入Excel - 选择文件并解析
  onImportExcel() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['xlsx', 'xls', 'csv'],
      success: (fileRes) => {
        const file = fileRes.tempFiles[0]
        this.setData({
          'importPreview.show': true,
          'importPreview.parsing': true,
          'importPreview.fileName': file.name,
          'importPreview.data': [],
          'importPreview.errors': []
        })
        // 解析Excel文件
        parseEquipmentExcel(file.path, file.name).then(result => {
          if (result.success) {
            // 为预览数据添加状态文本
            const previewData = result.data.map((item, idx) => {
              const statusInfo = equipStatusMap[item.status] || equipStatusMap['1']
              return {
                ...item,
                statusText: statusInfo.text,
                index: idx + 1
              }
            })
            // 为错误添加显示文本
            const errorList = result.errors.map(err => ({
              row: err.row,
              message: (err.errors || []).join('；'),
              raw: err.raw
            }))
            this.setData({
              'importPreview.parsing': false,
              'importPreview.data': previewData,
              'importPreview.errors': errorList,
              'importPreview.total': result.total,
              'importPreview.validCount': result.validCount,
              'importPreview.failCount': result.failCount,
              'importPreview.matchedColumns': result.matchedColumns,
              'importPreview.headerRow': result.headerRow || []
            })
          } else {
            // 解析失败
            const errorList = result.errors.map(err => ({
              row: err.row,
              message: (err.errors || []).join('；'),
              raw: err.raw
            }))
            this.setData({
              'importPreview.parsing': false,
              'importPreview.data': [],
              'importPreview.errors': errorList,
              'importPreview.total': result.total,
              'importPreview.validCount': result.validCount,
              'importPreview.failCount': result.failCount
            })
          }
        }).catch(err => {
          console.error('解析失败', err)
          this.setData({
            'importPreview.parsing': false,
            'importPreview.errors': [{ row: 0, message: '文件解析失败：' + (err.message || '未知错误') }]
          })
        })
      },
      fail: () => {
        // 用户取消选择文件
      }
    })
  },

  // 确认导入 - 将解析的数据提交到后端
  async onConfirmImport() {
    const { data, validCount } = this.data.importPreview
    if (!data || data.length === 0) {
      toast('没有可导入的有效数据')
      return
    }
    const res = await confirm('确认导入 ' + validCount + ' 条设备数据？')
    if (!res) return

    wx.showLoading({ title: '导入中...', mask: true })
    try {
      const result = await equipmentApi.importExcel(data)
      wx.hideLoading()
      if (result.data.success) {
        toast('导入成功，共' + (result.data.importCount || validCount) + '条', 'success')
        this.setData({
          'importPreview.show': false,
          'importPreview.data': [],
          'importPreview.errors': []
        })
        // 重新重置筛选选项，让新导入的车间/类型能显示
        this.setData({
          workshopOptions: ['全部车间'],
          typeOptions: ['全部类型'],
          workshopIndex: 0,
          typeIndex: 0
        })
        this.loadData()
      } else {
        toast('导入失败：' + (result.data.msg || '服务器错误'))
      }
    } catch (err) {
      wx.hideLoading()
      console.error('导入失败', err)
      toast('导入失败，请重试')
    }
  },

  // 关闭导入预览
  onCloseImportPreview() {
    this.setData({
      'importPreview.show': false,
      'importPreview.data': [],
      'importPreview.errors': []
    })
  },

  // 下载导入模板
  onDownloadTemplate() {
    const csvContent = generateTemplateCSV()
    const fs = wx.getFileSystemManager()
    const fileName = '设备台账导入模板.csv'
    const filePath = wx.env.USER_DATA_PATH + '/' + fileName
    try {
      fs.writeFileSync(filePath, '\ufeff' + csvContent, 'utf8')
      wx.showModal({
        title: '模板已生成',
        content: '模板已保存到：' + fileName + '\n\n表头包含：设备编码、设备名称、设备类型、规格型号、设备状态、所属车间等字段。\n请按模板格式填写数据后导入。',
        showCancel: false
      })
    } catch (e) {
      console.error('生成模板失败', e)
      toast('模板生成失败')
    }
  },

  // 同步到飞书多维表格
  async onSyncToFeishu() {
    if (!account.isLoggedIn()) {
      const res = await confirm('飞书未登录，是否前往飞书设置页登录？')
      if (res) {
        wx.navigateTo({ url: '/pages/feishu/settings/settings' })
      }
      return
    }
    // 检查表格是否已创建
    const tableInfo = bitable.getByModule('equipment_inventory')
    if (!tableInfo) {
      const res = await confirm('飞书多维表格未创建，是否前往创建？')
      if (res) {
        wx.navigateTo({ url: '/pages/feishu/settings/settings' })
      }
      return
    }

    wx.showLoading({ title: '同步飞书中...', mask: true })
    try {
      const allRes = await equipmentApi.getInventory({})
      const localData = allRes.data.rows || []
      const result = await sync.syncModule('equipment_inventory', localData)
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
  },

  // 跳转飞书设置页
  goFeishuSettings() {
    wx.navigateTo({ url: '/pages/feishu/settings/settings' })
  },

  // 切换显示模式
  onToggleViewMode() {
    const mode = this.data.viewMode === 'card' ? 'form' : 'card'
    this.setData({ viewMode: mode })
    toast('已切换为' + (mode === 'card' ? '卡片' : '表单') + '视图', 'success')
  },

  // 打开字段选择器
  onOpenFieldPicker() {
    this.setData({ showFieldPicker: true })
  },

  // 关闭字段选择器
  onCloseFieldPicker() {
    this.setData({ showFieldPicker: false })
  },

  // 切换字段显示
  onToggleField(e) {
    const key = e.currentTarget.dataset.key
    const visible = [...this.data.formVisibleFields]
    const idx = visible.indexOf(key)
    const field = this.data.fieldConfig.fields.find(f => f.key === key)
    if (field && field.required) {
      toast('必填字段不可隐藏')
      return
    }
    if (idx > -1) {
      visible.splice(idx, 1)
    } else {
      visible.push(key)
    }
    this.setData({ formVisibleFields: visible })
  },

  // 保存字段配置
  onSaveFieldConfig() {
    formConfig.setVisibleFields('equipment_inventory', this.data.formVisibleFields)
    this.setData({ showFieldPicker: false })
    toast('字段配置已保存', 'success')
  },

  // 重置字段配置
  onResetFieldConfig() {
    const defaults = formConfig.resetVisibleFields('equipment_inventory')
    this.setData({ formVisibleFields: defaults })
    toast('已重置为默认字段')
  },

  // 编辑设备（表单模式）
  onEditItem(e) {
    if (!this.data.canEdit) {
      toast('您没有编辑权限')
      return
    }
    const id = e.currentTarget.dataset.id
    const item = this.data.list.find(i => i.id == id)
    if (item) {
      this.setData({
        editingItem: { ...item },
        editMode: true
      })
    }
  },

  // 表单输入
  onFormInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ ['editingItem.' + field]: e.detail.value })
  },

  // 保存编辑
  async onSaveEdit() {
    const item = this.data.editingItem
    if (!item) return
    if (!item.equipName) return toast('设备名称不能为空')
    if (!item.equipCode) return toast('设备编码不能为空')

    wx.showLoading({ title: '保存中...', mask: true })
    try {
      await equipmentApi.update(item)
      wx.hideLoading()
      toast('保存成功', 'success')
      this.setData({ editMode: false, editingItem: null })
      this.loadData()
    } catch (err) {
      wx.hideLoading()
      toast('保存失败')
    }
  },

  // 取消编辑
  onCancelEdit() {
    this.setData({ editMode: false, editingItem: null })
  }
})
