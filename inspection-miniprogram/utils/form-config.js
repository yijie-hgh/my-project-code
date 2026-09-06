// utils/form-config.js - 表单显示配置模块
// 为各业务模块定义表单字段配置，支持字段自定义选择显示
// 支持卡片视图/表格视图一键切换，字段自定义选择和排序

// ============ 模块表单字段配置 ============
const FORM_CONFIGS = {
  // 设备清单
  equipment_inventory: {
    name: '设备清单',
    icon: '📋',
    tableName: 'equipment',
    primaryKey: 'id',
    fields: [
      { key: 'equipCode', label: '设备编码', type: 'text', required: true, group: '基本信息', width: 120 },
      { key: 'equipName', label: '设备名称', type: 'text', required: true, group: '基本信息', width: 150 },
      { key: 'equipType', label: '设备类型', type: 'select', required: true, options: ['电气设备', '共用设备', '暖通设备', '消防设备', '控制设备', '仪表设备'], group: '基本信息', width: 100 },
      { key: 'equipCategory', label: '设备类别', type: 'text', group: '基本信息', width: 100 },
      { key: 'spec', label: '规格型号', type: 'text', group: '基本信息', width: 120 },
      { key: 'status', label: '设备状态', type: 'select', options: [{ label: '报废', value: '0' }, { label: '正常运行', value: '1' }, { label: '故障待修', value: '2' }, { label: '停机保养', value: '3' }, { label: '待校验', value: '4' }], group: '状态信息', width: 100 },
      { key: 'workshop', label: '所属车间', type: 'text', group: '位置信息', width: 100 },
      { key: 'location', label: '安装位置', type: 'text', group: '位置信息', width: 120 },
      { key: 'manager', label: '负责人', type: 'text', group: '人员信息', width: 80 },
      { key: 'managerPhone', label: '联系电话', type: 'phone', group: '人员信息', width: 120 },
      { key: 'manufacturer', label: '生产厂家', type: 'text', group: '采购信息', width: 120 },
      { key: 'supplier', label: '供应商', type: 'text', group: '采购信息', width: 100 },
      { key: 'purchaseDate', label: '购置日期', type: 'date', group: '采购信息', width: 110 },
      { key: 'startDate', label: '启用日期', type: 'date', group: '采购信息', width: 110 },
      { key: 'calibrationCycle', label: '校验周期(天)', type: 'number', group: '校验信息', width: 100 },
      { key: 'calibrationDate', label: '上次校验日期', type: 'date', group: '校验信息', width: 110 },
      { key: 'calibrationExpire', label: '校验到期日期', type: 'date', group: '校验信息', width: 110 },
      { key: 'qrcode', label: '二维码编号', type: 'text', group: '标识信息', width: 100 },
      { key: 'nfcTag', label: 'NFC标签', type: 'text', group: '标识信息', width: 100 }
    ],
    defaultVisibleFields: ['equipCode', 'equipName', 'equipType', 'status', 'workshop', 'manager', 'location', 'spec'],
    defaultViewMode: 'card'
  },

  // 设备点检记录
  spotcheck_records: {
    name: '设备点检',
    icon: '✅',
    tableName: 'spotcheck_records',
    primaryKey: 'id',
    fields: [
      { key: 'equipCode', label: '设备编码', type: 'text', required: true, group: '设备信息', width: 120 },
      { key: 'equipName', label: '设备名称', type: 'text', required: true, group: '设备信息', width: 150 },
      { key: 'checker', label: '点检人', type: 'text', required: true, group: '点检信息', width: 80 },
      { key: 'checkTime', label: '点检时间', type: 'datetime', required: true, group: '点检信息', width: 150 },
      { key: 'result', label: '点检结果', type: 'select', required: true, options: ['正常', '异常'], group: '点检信息', width: 80 },
      { key: 'itemsDetail', label: '点检项明细', type: 'textarea', group: '点检详情', width: 200 },
      { key: 'remark', label: '备注', type: 'textarea', group: '其他', width: 150 }
    ],
    defaultVisibleFields: ['equipCode', 'equipName', 'checker', 'checkTime', 'result', 'remark'],
    defaultViewMode: 'card'
  },

  // 报修维修
  repair_records: {
    name: '报修维修',
    icon: '🔧',
    tableName: 'repair_records',
    primaryKey: 'id',
    fields: [
      { key: 'repairNo', label: '报修单号', type: 'text', readonly: true, group: '单据信息', width: 120 },
      { key: 'equipCode', label: '设备编码', type: 'text', group: '设备信息', width: 120 },
      { key: 'equipName', label: '设备名称', type: 'text', required: true, group: '设备信息', width: 150 },
      { key: 'title', label: '报修标题', type: 'text', required: true, group: '报修信息', width: 150 },
      { key: 'description', label: '故障描述', type: 'textarea', required: true, group: '报修信息', width: 200 },
      { key: 'faultType', label: '故障类型', type: 'select', options: ['机械故障', '电气故障', '仪表故障', '制冷故障', '其他'], group: '报修信息', width: 100 },
      { key: 'level', label: '紧急程度', type: 'select', options: [{ label: '低', value: '1' }, { label: '中', value: '2' }, { label: '高', value: '3' }, { label: '紧急', value: '4' }], group: '报修信息', width: 80 },
      { key: 'status', label: '维修状态', type: 'select', options: [{ label: '待受理', value: '0' }, { label: '已派单', value: '1' }, { label: '维修中', value: '2' }, { label: '已完成', value: '3' }, { label: '已关闭', value: '4' }], group: '维修信息', width: 90 },
      { key: 'reporter', label: '报修人', type: 'text', group: '人员信息', width: 80 },
      { key: 'reporterPhone', label: '报修电话', type: 'phone', group: '人员信息', width: 120 },
      { key: 'repairer', label: '维修人', type: 'text', group: '人员信息', width: 80 },
      { key: 'acceptTime', label: '受理时间', type: 'datetime', group: '维修时间', width: 150 },
      { key: 'startTime', label: '开始维修', type: 'datetime', group: '维修时间', width: 150 },
      { key: 'finishTime', label: '完成时间', type: 'datetime', group: '维修时间', width: 150 },
      { key: 'partsUsed', label: '使用备件', type: 'textarea', group: '维修详情', width: 150 },
      { key: 'repairDesc', label: '维修说明', type: 'textarea', group: '维修详情', width: 200 },
      { key: 'cost', label: '维修费用', type: 'number', group: '维修详情', width: 100 }
    ],
    defaultVisibleFields: ['repairNo', 'equipName', 'title', 'faultType', 'level', 'status', 'reporter', 'repairer', 'cost'],
    defaultViewMode: 'card'
  },

  // 维护保养
  maintenance_records: {
    name: '维护保养',
    icon: '🛠️',
    tableName: 'maintenance_records',
    primaryKey: 'id',
    fields: [
      { key: 'maintainNo', label: '保养单号', type: 'text', readonly: true, group: '单据信息', width: 120 },
      { key: 'equipCode', label: '设备编码', type: 'text', group: '设备信息', width: 120 },
      { key: 'equipName', label: '设备名称', type: 'text', required: true, group: '设备信息', width: 150 },
      { key: 'planName', label: '保养计划', type: 'text', group: '保养信息', width: 120 },
      { key: 'type', label: '保养类型', type: 'select', options: ['日常保养', '定期保养', '专项保养', '大修'], group: '保养信息', width: 100 },
      { key: 'content', label: '保养内容', type: 'textarea', group: '保养信息', width: 200 },
      { key: 'maintainer', label: '保养人', type: 'text', required: true, group: '人员信息', width: 80 },
      { key: 'status', label: '保养状态', type: 'select', options: [{ label: '待执行', value: '0' }, { label: '执行中', value: '1' }, { label: '已完成', value: '2' }, { label: '已逾期', value: '3' }], group: '状态信息', width: 90 },
      { key: 'planDate', label: '计划日期', type: 'date', group: '时间信息', width: 110 },
      { key: 'finishTime', label: '完成时间', type: 'datetime', group: '时间信息', width: 150 },
      { key: 'itemsDetail', label: '保养项明细', type: 'textarea', group: '保养详情', width: 200 },
      { key: 'remark', label: '备注', type: 'textarea', group: '其他', width: 150 },
      { key: 'cost', label: '保养费用', type: 'number', group: '其他', width: 100 }
    ],
    defaultVisibleFields: ['maintainNo', 'equipName', 'type', 'status', 'maintainer', 'planDate', 'content', 'cost'],
    defaultViewMode: 'card'
  },

  // 备件管理
  spare_parts: {
    name: '备件管理',
    icon: '📦',
    tableName: 'spare_parts',
    primaryKey: 'id',
    fields: [
      { key: 'partCode', label: '备件编码', type: 'text', required: true, group: '基本信息', width: 120 },
      { key: 'partName', label: '备件名称', type: 'text', required: true, group: '基本信息', width: 150 },
      { key: 'category', label: '分类', type: 'select', options: ['电气', '机械', '液压', '气动', '仪表', '密封', '其他'], group: '基本信息', width: 80 },
      { key: 'brand', label: '品牌', type: 'text', group: '基本信息', width: 100 },
      { key: 'spec', label: '规格型号', type: 'text', group: '基本信息', width: 120 },
      { key: 'unit', label: '单位', type: 'text', group: '基本信息', width: 60 },
      { key: 'stock', label: '当前库存', type: 'number', group: '库存信息', width: 90 },
      { key: 'minStock', label: '最低库存', type: 'number', group: '库存信息', width: 90 },
      { key: 'maxStock', label: '最高库存', type: 'number', group: '库存信息', width: 90 },
      { key: 'unitPrice', label: '单价', type: 'number', group: '库存信息', width: 90 },
      { key: 'supplier', label: '供应商', type: 'text', group: '采购信息', width: 120 },
      { key: 'location', label: '存放位置', type: 'text', group: '位置信息', width: 100 },
      { key: 'relatedEquip', label: '关联设备', type: 'text', group: '其他', width: 120 },
      { key: 'totalIn', label: '入库总数', type: 'number', group: '统计', width: 90 },
      { key: 'totalOut', label: '出库总数', type: 'number', group: '统计', width: 90 },
      { key: 'status', label: '库存状态', type: 'select', options: ['充足', '偏低', '不足', '缺货', '超储'], group: '统计', width: 80 }
    ],
    defaultVisibleFields: ['partCode', 'partName', 'category', 'brand', 'spec', 'stock', 'minStock', 'unitPrice', 'supplier', 'status'],
    defaultViewMode: 'card'
  },

  // 备件出入库
  spare_parts_inventory: {
    name: '备件清单',
    icon: '📑',
    tableName: 'spare_inventory',
    primaryKey: 'id',
    fields: [
      { key: 'partCode', label: '备件编码', type: 'text', required: true, group: '基本信息', width: 120 },
      { key: 'partName', label: '备件名称', type: 'text', required: true, group: '基本信息', width: 150 },
      { key: 'operateType', label: '操作类型', type: 'select', required: true, options: ['入库', '出库', '盘点'], group: '操作信息', width: 80 },
      { key: 'quantity', label: '数量', type: 'number', required: true, group: '操作信息', width: 80 },
      { key: 'operator', label: '操作人', type: 'text', group: '操作信息', width: 80 },
      { key: 'operateTime', label: '操作时间', type: 'datetime', group: '操作信息', width: 150 },
      { key: 'relatedEquip', label: '关联设备', type: 'text', group: '其他', width: 120 },
      { key: 'relatedOrder', label: '关联单号', type: 'text', group: '其他', width: 120 },
      { key: 'remark', label: '备注', type: 'textarea', group: '其他', width: 150 }
    ],
    defaultVisibleFields: ['partCode', 'partName', 'operateType', 'quantity', 'operator', 'operateTime', 'remark'],
    defaultViewMode: 'card'
  },

  // 事件管理
  events: {
    name: '事件管理',
    icon: '⚠️',
    tableName: 'events',
    primaryKey: 'id',
    fields: [
      { key: 'title', label: '事件标题', type: 'text', required: true, group: '基本信息', width: 180 },
      { key: 'pointName', label: '巡检点', type: 'text', group: '基本信息', width: 120 },
      { key: 'projectName', label: '项目名称', type: 'text', group: '基本信息', width: 120 },
      { key: 'level', label: '事件级别', type: 'select', options: [{ label: '低', value: '1' }, { label: '中', value: '2' }, { label: '高', value: '3' }, { label: '紧急', value: '4' }], group: '事件信息', width: 80 },
      { key: 'status', label: '事件状态', type: 'select', options: [{ label: '待处理', value: '0' }, { label: '处理中', value: '1' }, { label: '已解决', value: '2' }, { label: '已关闭', value: '3' }], group: '事件信息', width: 90 },
      { key: 'description', label: '事件描述', type: 'textarea', required: true, group: '事件信息', width: 250 },
      { key: 'createTime', label: '创建时间', type: 'datetime', readonly: true, group: '时间信息', width: 150 },
      { key: 'finishTime', label: '完成时间', type: 'datetime', group: '时间信息', width: 150 },
      { key: 'handlerName', label: '处理人', type: 'text', group: '人员信息', width: 80 },
      { key: 'images', label: '现场图片', type: 'images', group: '附件', width: 100 }
    ],
    defaultVisibleFields: ['title', 'pointName', 'level', 'status', 'description', 'createTime', 'handlerName', 'finishTime'],
    defaultViewMode: 'card'
  },

  // 设备档案
  equipment: {
    name: '设备档案',
    icon: '📦',
    tableName: 'equipment',
    primaryKey: 'id',
    fields: [
      { key: 'equipCode', label: '设备编码', type: 'text', required: true, group: '基本信息', width: 120 },
      { key: 'equipName', label: '设备名称', type: 'text', required: true, group: '基本信息', width: 150 },
      { key: 'equipType', label: '设备类型', type: 'select', options: ['电气设备', '共用设备', '暖通设备', '消防设备', '控制设备', '仪表设备'], group: '基本信息', width: 100 },
      { key: 'spec', label: '规格型号', type: 'text', group: '基本信息', width: 120 },
      { key: 'status', label: '设备状态', type: 'select', options: [{ label: '报废', value: '0' }, { label: '正常运行', value: '1' }, { label: '故障待修', value: '2' }, { label: '停机保养', value: '3' }, { label: '待校验', value: '4' }], group: '状态信息', width: 100 },
      { key: 'workshop', label: '所属车间', type: 'text', group: '位置信息', width: 100 },
      { key: 'location', label: '安装位置', type: 'text', group: '位置信息', width: 120 },
      { key: 'manager', label: '负责人', type: 'text', group: '人员信息', width: 80 },
      { key: 'managerPhone', label: '联系电话', type: 'phone', group: '人员信息', width: 120 },
      { key: 'manufacturer', label: '生产厂家', type: 'text', group: '采购信息', width: 120 },
      { key: 'supplier', label: '供应商', type: 'text', group: '采购信息', width: 100 },
      { key: 'purchaseDate', label: '购置日期', type: 'date', group: '采购信息', width: 110 },
      { key: 'startDate', label: '启用日期', type: 'date', group: '采购信息', width: 110 },
      { key: 'lastSpotCheck', label: '最近点检', type: 'datetime', group: '维护记录', width: 150 },
      { key: 'lastInspect', label: '最近巡检', type: 'datetime', group: '维护记录', width: 150 },
      { key: 'lastRepair', label: '最近维修', type: 'datetime', group: '维护记录', width: 150 },
      { key: 'lastMaintain', label: '最近保养', type: 'datetime', group: '维护记录', width: 150 },
      { key: 'calibrationCycle', label: '校验周期(天)', type: 'number', group: '校验信息', width: 100 },
      { key: 'calibrationDate', label: '上次校验', type: 'date', group: '校验信息', width: 110 },
      { key: 'calibrationExpire', label: '校验到期', type: 'date', group: '校验信息', width: 110 },
      { key: 'qrcode', label: '二维码', type: 'text', group: '标识信息', width: 100 },
      { key: 'nfcTag', label: 'NFC标签', type: 'text', group: '标识信息', width: 100 }
    ],
    defaultVisibleFields: ['equipCode', 'equipName', 'equipType', 'spec', 'status', 'workshop', 'manager', 'manufacturer', 'calibrationExpire'],
    defaultViewMode: 'card'
  }
}

// ============ 存储键前缀 ============
const STORAGE_PREFIX = 'form_visible_fields_'
const VIEW_MODE_PREFIX = 'form_view_mode_'

// ============ 表单配置管理 ============
const formConfig = {
  // 获取模块表单配置
  getConfig(moduleKey) {
    return FORM_CONFIGS[moduleKey] || null
  },

  // 获取所有模块配置
  getAllConfigs() {
    return FORM_CONFIGS
  },

  // 获取用户可见字段列表
  getVisibleFields(moduleKey, userId) {
    const config = FORM_CONFIGS[moduleKey]
    if (!config) return []
    const uid = userId || 'default'
    const storageKey = STORAGE_PREFIX + moduleKey + '_' + uid
    const saved = wx.getStorageSync(storageKey)
    if (saved && Array.isArray(saved) && saved.length > 0) return saved
    return config.defaultVisibleFields || config.fields.map(f => f.key)
  },

  // 设置用户可见字段
  setVisibleFields(moduleKey, fields, userId) {
    const uid = userId || 'default'
    const storageKey = STORAGE_PREFIX + moduleKey + '_' + uid
    wx.setStorageSync(storageKey, fields)
  },

  // 重置为默认字段
  resetVisibleFields(moduleKey, userId) {
    const uid = userId || 'default'
    const storageKey = STORAGE_PREFIX + moduleKey + '_' + uid
    wx.removeStorageSync(storageKey)
    const config = FORM_CONFIGS[moduleKey]
    return config ? (config.defaultVisibleFields || config.fields.map(f => f.key)) : []
  },

  // 获取视图模式 (card / table)
  getViewMode(moduleKey, userId) {
    const config = FORM_CONFIGS[moduleKey]
    if (!config) return 'card'
    const uid = userId || 'default'
    const storageKey = VIEW_MODE_PREFIX + moduleKey + '_' + uid
    const saved = wx.getStorageSync(storageKey)
    return saved || config.defaultViewMode || 'card'
  },

  // 设置视图模式
  setViewMode(moduleKey, mode, userId) {
    const uid = userId || 'default'
    const storageKey = VIEW_MODE_PREFIX + moduleKey + '_' + uid
    wx.setStorageSync(storageKey, mode)
  },

  // 切换视图模式
  toggleViewMode(moduleKey, userId) {
    const current = this.getViewMode(moduleKey, userId)
    const next = current === 'card' ? 'table' : 'card'
    this.setViewMode(moduleKey, next, userId)
    return next
  },

  // 按分组获取字段
  getFieldsByGroup(moduleKey) {
    const config = FORM_CONFIGS[moduleKey]
    if (!config) return {}
    const groups = {}
    config.fields.forEach(field => {
      const g = field.group || '其他'
      if (!groups[g]) groups[g] = []
      groups[g].push(field)
    })
    return groups
  },

  // 获取字段显示选项（用于字段选择器）
  getFieldOptions(moduleKey) {
    const config = FORM_CONFIGS[moduleKey]
    if (!config) return []
    return config.fields.map(f => ({
      key: f.key,
      label: f.label,
      group: f.group || '其他',
      required: f.required,
      type: f.type
    }))
  },

  // 获取可见字段的完整信息
  getVisibleFieldInfos(moduleKey, userId) {
    const config = FORM_CONFIGS[moduleKey]
    if (!config) return []
    const visibleKeys = this.getVisibleFields(moduleKey, userId)
    const fieldMap = {}
    config.fields.forEach(f => { fieldMap[f.key] = f })
    return visibleKeys.map(key => fieldMap[key]).filter(Boolean)
  },

  // 获取字段的显示文本（处理select类型的label/value映射）
  getFieldDisplayText(field, value) {
    if (value === undefined || value === null || value === '') return '-'
    if (field.type === 'select' && Array.isArray(field.options)) {
      const opt = field.options.find(o => {
        if (typeof o === 'object') return o.value === value
        return o === value
      })
      if (opt) return typeof opt === 'object' ? opt.label : opt
    }
    return String(value)
  },

  // 根据表单配置生成卡片视图的展示字段
  getCardDisplayFields(moduleKey, userId) {
    const visibleFields = this.getVisibleFieldInfos(moduleKey, userId)
    if (visibleFields.length === 0) return []
    // 卡片视图显示前4个主要字段 + 更多字段折叠
    return {
      primaryFields: visibleFields.slice(0, 4),
      moreFields: visibleFields.slice(4)
    }
  },

  // 获取表格视图列配置
  getTableColumns(moduleKey, userId) {
    return this.getVisibleFieldInfos(moduleKey, userId)
  }
}

// ============ 视图混入（页面级通用方法） ============
/**
 * 创建表单视图混入对象，提供卡片/表格切换、字段配置等通用方法
 * @param {string} moduleKey - 模块配置键
 * @param {Object} options - 配置选项
 * @returns {Object} - 混入方法对象
 */
function createViewMixin(moduleKey, options = {}) {
  return {
    // 初始化视图配置
    initViewConfig() {
      const viewMode = formConfig.getViewMode(moduleKey)
      const visibleFields = formConfig.getVisibleFields(moduleKey)
      const visibleFieldInfos = formConfig.getVisibleFieldInfos(moduleKey)
      const fieldOptions = formConfig.getFieldOptions(moduleKey)
      const config = formConfig.getConfig(moduleKey)
      
      this.setData({
        viewMode,
        visibleFields,
        visibleFieldInfos,
        fieldOptions,
        moduleConfig: config,
        showFieldConfig: false
      })
    },

    // 切换视图模式
    onToggleViewMode() {
      const newMode = formConfig.toggleViewMode(moduleKey)
      this.setData({ viewMode: newMode })
      wx.showToast({
        title: newMode === 'card' ? '卡片视图' : '表格视图',
        icon: 'none',
        duration: 800
      })
    },

    // 打开字段配置面板
    onOpenFieldConfig() {
      const visibleFields = formConfig.getVisibleFields(moduleKey)
      const fieldOptions = formConfig.getFieldOptions(moduleKey)
      const groups = formConfig.getFieldsByGroup(moduleKey)
      this.setData({
        showFieldConfig: true,
        configVisibleFields: [...visibleFields],
        fieldOptions,
        fieldGroups: groups
      })
    },

    // 关闭字段配置面板
    onCloseFieldConfig() {
      this.setData({ showFieldConfig: false })
    },

    // 切换字段选中状态
    onToggleField(e) {
      const key = e.currentTarget.dataset.key
      const field = this.data.fieldOptions.find(f => f.key === key)
      if (field && field.required) {
        wx.showToast({ title: '必填字段不可取消', icon: 'none' })
        return
      }
      let fields = [...this.data.configVisibleFields]
      const idx = fields.indexOf(key)
      if (idx > -1) {
        fields.splice(idx, 1)
      } else {
        fields.push(key)
      }
      this.setData({ configVisibleFields: fields })
    },

    // 保存字段配置
    onSaveFieldConfig() {
      const fields = this.data.configVisibleFields
      if (fields.length === 0) {
        wx.showToast({ title: '至少选择一个字段', icon: 'none' })
        return
      }
      formConfig.setVisibleFields(moduleKey, fields)
      const visibleFieldInfos = formConfig.getVisibleFieldInfos(moduleKey)
      this.setData({
        visibleFields: fields,
        visibleFieldInfos,
        showFieldConfig: false
      })
      wx.showToast({ title: '配置已保存', icon: 'success' })
      // 触发数据刷新
      if (typeof this.loadData === 'function') {
        this.loadData()
      }
    },

    // 重置字段配置
    onResetFieldConfig() {
      const defaultFields = formConfig.resetVisibleFields(moduleKey)
      const visibleFieldInfos = formConfig.getVisibleFieldInfos(moduleKey)
      this.setData({
        configVisibleFields: [...defaultFields],
        visibleFields: defaultFields,
        visibleFieldInfos
      })
      wx.showToast({ title: '已恢复默认', icon: 'success' })
    },

    // 全选/取消全选
    onSelectAllFields() {
      const allKeys = this.data.fieldOptions.map(f => f.key)
      this.setData({ configVisibleFields: allKeys })
    }
  }
}

module.exports = {
  FORM_CONFIGS,
  formConfig,
  createViewMixin
}
