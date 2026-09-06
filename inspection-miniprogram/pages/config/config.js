// pages/config/config.js - 系统配置管理
const { configApi } = require('../../utils/api')
const { requireLogin } = require('../../utils/auth')
const { toast, confirm, showLoading, hideLoading } = require('../../utils/util')

// 巡查/保养周期选项
const CYCLE_OPTIONS = [
  { label: '每日', value: '每日' },
  { label: '每周', value: '每周' },
  { label: '每月', value: '每月' },
  { label: '每季', value: '每季' },
  { label: '每年', value: '每年' },
  { label: '不定期', value: '不定期' }
]

// 各Tab数据结构定义：表单字段 + 列表展示行 + 标题/副标题 + 是否启用开关
const SCHEMAS = {
  // 设备类型
  equipType: {
    label: '设备类型',
    titleKey: 'typeName',
    subtitleKey: 'code',
    hasEnabled: true,
    sortKey: 'sort',
    fields: [
      { key: 'typeName', label: '类型名称', type: 'text', required: true, placeholder: '请输入类型名称' },
      { key: 'code', label: '编码', type: 'text', required: true, placeholder: '请输入编码' },
      { key: 'description', label: '描述', type: 'textarea', placeholder: '请输入描述' },
      { key: 'sort', label: '排序', type: 'number', placeholder: '请输入排序号' },
      { key: 'enabled', label: '启用状态', type: 'switch' }
    ],
    rows: [
      { key: 'description', label: '描述', type: 'text' },
      { key: 'sort', label: '排序', type: 'text' }
    ]
  },
  // 巡查类型
  inspectionType: {
    label: '巡查类型',
    titleKey: 'typeName',
    subtitleKey: 'code',
    hasEnabled: true,
    sortKey: 'sort',
    fields: [
      { key: 'typeName', label: '类型名称', type: 'text', required: true, placeholder: '请输入类型名称' },
      { key: 'code', label: '编码', type: 'text', required: true, placeholder: '请输入编码' },
      { key: 'cycle', label: '周期', type: 'picker', required: true, options: CYCLE_OPTIONS, placeholder: '请选择周期' },
      { key: 'description', label: '描述', type: 'textarea', placeholder: '请输入描述' },
      { key: 'sort', label: '排序', type: 'number', placeholder: '请输入排序号' },
      { key: 'enabled', label: '启用状态', type: 'switch' }
    ],
    rows: [
      { key: 'cycle', label: '周期', type: 'tag', tagClass: 'tag-primary' },
      { key: 'description', label: '描述', type: 'text' },
      { key: 'sort', label: '排序', type: 'text' }
    ]
  },
  // 设备参数
  equipParam: {
    label: '设备参数',
    titleKey: 'paramName',
    subtitleKey: 'unit',
    hasEnabled: false,
    fields: [
      { key: 'paramName', label: '参数名称', type: 'text', required: true, placeholder: '请输入参数名称' },
      { key: 'unit', label: '单位', type: 'text', placeholder: '请输入单位（选填）' },
      { key: 'paramType', label: '参数类型', type: 'picker', required: true, options: [{ label: '数值(number)', value: 'number' }, { label: '文本(text)', value: 'text' }], placeholder: '请选择参数类型' },
      { key: 'defaultValue', label: '默认值', type: 'text', placeholder: '请输入默认值（选填）' },
      { key: 'applicableType', label: '适用设备类型', type: 'picker', optionsKey: 'applicableType', placeholder: '请选择适用设备类型' },
      { key: 'description', label: '描述', type: 'textarea', placeholder: '请输入描述' }
    ],
    rows: [
      { key: 'unit', label: '单位', type: 'text' },
      { key: 'paramType', label: '参数类型', type: 'map', map: { number: { label: '数值', tag: 'tag-info' }, text: { label: '文本', tag: 'tag-primary' } } },
      { key: 'defaultValue', label: '默认值', type: 'text' },
      { key: 'applicableType', label: '适用设备', type: 'text' },
      { key: 'description', label: '描述', type: 'text' }
    ]
  },
  // 区域位置（支持层级）
  areaLocation: {
    label: '区域位置',
    titleKey: 'areaName',
    subtitleKey: 'code',
    hasEnabled: true,
    fields: [
      { key: 'areaName', label: '区域名称', type: 'text', required: true, placeholder: '请输入区域名称' },
      { key: 'code', label: '编码', type: 'text', required: true, placeholder: '请输入编码' },
      { key: 'parentId', label: '父级区域', type: 'picker', optionsKey: 'parentId', placeholder: '请选择父级区域（顶级可不选）' },
      { key: 'sort', label: '排序', type: 'number', placeholder: '请输入排序号' },
      { key: 'description', label: '描述', type: 'textarea', placeholder: '请输入描述' },
      { key: 'enabled', label: '启用状态', type: 'switch' }
    ],
    rows: [
      { key: 'parentName', label: '父级区域', type: 'text' },
      { key: 'description', label: '描述', type: 'text' },
      { key: 'sort', label: '排序', type: 'text' }
    ]
  },
  // 保养类型
  maintainType: {
    label: '保养类型',
    titleKey: 'typeName',
    subtitleKey: 'code',
    hasEnabled: true,
    sortKey: 'sort',
    fields: [
      { key: 'typeName', label: '类型名称', type: 'text', required: true, placeholder: '请输入类型名称' },
      { key: 'code', label: '编码', type: 'text', required: true, placeholder: '请输入编码' },
      { key: 'cycle', label: '周期', type: 'picker', required: true, options: CYCLE_OPTIONS, placeholder: '请选择周期' },
      { key: 'description', label: '描述', type: 'textarea', placeholder: '请输入描述' },
      { key: 'sort', label: '排序', type: 'number', placeholder: '请输入排序号' },
      { key: 'enabled', label: '启用状态', type: 'switch' }
    ],
    rows: [
      { key: 'cycle', label: '周期', type: 'tag', tagClass: 'tag-primary' },
      { key: 'description', label: '描述', type: 'text' },
      { key: 'sort', label: '排序', type: 'text' }
    ]
  },
  // 保养项目
  maintainItem: {
    label: '保养项目',
    titleKey: 'itemName',
    subtitleKey: 'itemType',
    subtitleMap: { check: '检查项', action: '操作项', measure: '测量项' },
    hasEnabled: false,
    fields: [
      { key: 'itemName', label: '项目名称', type: 'text', required: true, placeholder: '请输入项目名称' },
      { key: 'itemType', label: '项目类型', type: 'picker', required: true, options: [{ label: '检查项(check)', value: 'check' }, { label: '操作项(action)', value: 'action' }, { label: '测量项(measure)', value: 'measure' }], placeholder: '请选择项目类型' },
      { key: 'required', label: '是否必填', type: 'switch' },
      { key: 'applicableType', label: '适用类型', type: 'text', placeholder: '如：通用/电气/机械' },
      { key: 'standard', label: '标准值', type: 'text', placeholder: '请输入标准值（选填）' },
      { key: 'description', label: '描述', type: 'textarea', placeholder: '请输入描述' }
    ],
    rows: [
      { key: 'itemType', label: '项目类型', type: 'map', map: { check: { label: '检查项', tag: 'tag-primary' }, action: { label: '操作项', tag: 'tag-warning' }, measure: { label: '测量项', tag: 'tag-info' } } },
      { key: 'required', label: '是否必填', type: 'bool', trueLabel: '必填', trueTag: 'tag-danger', falseLabel: '选填', falseTag: 'tag-gray' },
      { key: 'applicableType', label: '适用类型', type: 'text' },
      { key: 'standard', label: '标准值', type: 'text' },
      { key: 'description', label: '描述', type: 'text' }
    ]
  },
  // 故障类型
  faultType: {
    label: '故障类型',
    titleKey: 'typeName',
    subtitleKey: 'code',
    hasEnabled: true,
    sortKey: 'sort',
    fields: [
      { key: 'typeName', label: '类型名称', type: 'text', required: true, placeholder: '请输入类型名称' },
      { key: 'code', label: '编码', type: 'text', required: true, placeholder: '请输入编码' },
      { key: 'description', label: '描述', type: 'textarea', placeholder: '请输入描述' },
      { key: 'sort', label: '排序', type: 'number', placeholder: '请输入排序号' },
      { key: 'enabled', label: '启用状态', type: 'switch' }
    ],
    rows: [
      { key: 'description', label: '描述', type: 'text' },
      { key: 'sort', label: '排序', type: 'text' }
    ]
  },
  // 备件分类
  sparePartCategory: {
    label: '备件分类',
    titleKey: 'categoryName',
    subtitleKey: 'code',
    hasEnabled: true,
    sortKey: 'sort',
    fields: [
      { key: 'categoryName', label: '分类名称', type: 'text', required: true, placeholder: '请输入分类名称' },
      { key: 'code', label: '编码', type: 'text', required: true, placeholder: '请输入编码' },
      { key: 'description', label: '描述', type: 'textarea', placeholder: '请输入描述' },
      { key: 'sort', label: '排序', type: 'number', placeholder: '请输入排序号' },
      { key: 'enabled', label: '启用状态', type: 'switch' }
    ],
    rows: [
      { key: 'description', label: '描述', type: 'text' },
      { key: 'sort', label: '排序', type: 'text' }
    ]
  }
}

// 各Tab对应的API方法映射
const apiMap = {
  equipType: { list: () => configApi.getEquipTypes(), add: configApi.addEquipType, update: configApi.updateEquipType, remove: configApi.removeEquipType },
  inspectionType: { list: () => configApi.getInspectionTypes(), add: configApi.addInspectionType, update: configApi.updateInspectionType, remove: configApi.removeInspectionType },
  equipParam: { list: () => configApi.getEquipParams(), add: configApi.addEquipParam, update: configApi.updateEquipParam, remove: configApi.removeEquipParam },
  areaLocation: { list: () => configApi.getAreaLocations(), add: configApi.addAreaLocation, update: configApi.updateAreaLocation, remove: configApi.removeAreaLocation },
  maintainType: { list: () => configApi.getMaintainTypes(), add: configApi.addMaintainType, update: configApi.updateMaintainType, remove: configApi.removeMaintainType },
  maintainItem: { list: () => configApi.getMaintainItems(), add: configApi.addMaintainItem, update: configApi.updateMaintainItem, remove: configApi.removeMaintainItem },
  faultType: { list: () => configApi.getFaultTypes(), add: configApi.addFaultType, update: configApi.updateFaultType, remove: configApi.removeFaultType },
  sparePartCategory: { list: () => configApi.getSparePartCategories(), add: configApi.addSparePartCategory, update: configApi.updateSparePartCategory, remove: configApi.removeSparePartCategory }
}

// 将区域列表按层级扁平化，并计算深度
function flattenAreas(list) {
  const nodes = {}
  const childrenMap = {}
  list.forEach(a => {
    nodes[a.id] = Object.assign({}, a)
    childrenMap[a.id] = []
  })
  const roots = []
  list.forEach(a => {
    if (a.parentId && nodes[a.parentId]) {
      childrenMap[a.parentId].push(nodes[a.id])
    } else {
      roots.push(nodes[a.id])
    }
  })
  const result = []
  function walk(node, depth) {
    node._depth = depth
    result.push(node)
    const kids = childrenMap[node.id] || []
    kids.sort((a, b) => (a.sort || 0) - (b.sort || 0))
    kids.forEach(c => walk(c, depth + 1))
  }
  roots.sort((a, b) => (a.sort || 0) - (b.sort || 0))
  roots.forEach(r => walk(r, 0))
  return result
}

// 获取某节点及其所有后代ID（用于编辑区域时排除自身及子孙作为父级）
function getDescendantIds(list, id) {
  const result = [id]
  let changed = true
  while (changed) {
    changed = false
    for (const a of list) {
      if (result.indexOf(a.parentId) > -1 && result.indexOf(a.id) === -1) {
        result.push(a.id)
        changed = true
      }
    }
  }
  return result
}

// 根据行配置构建展示行
function buildRows(item, rowConfigs) {
  return rowConfigs.map(rc => {
    const raw = item[rc.key]
    let value = raw
    let tag = ''
    if (rc.type === 'map' && rc.map) {
      const m = rc.map[raw]
      if (m) {
        value = m.label
        tag = m.tag
      } else {
        value = (raw === undefined || raw === null || raw === '') ? '' : raw
      }
    } else if (rc.type === 'bool') {
      const isTrue = !!raw
      value = isTrue ? rc.trueLabel : rc.falseLabel
      tag = isTrue ? rc.trueTag : rc.falseTag
    } else if (rc.type === 'tag') {
      value = raw
      tag = rc.tagClass || 'tag-gray'
    } else {
      value = raw
    }
    if (value === '' || value === undefined || value === null) {
      value = '—'
      tag = ''
    }
    return { label: rc.label, value, tag }
  })
}

// 装饰列表数据：补充标题、副标题、展示行、层级缩进等
function decorate(tab, rawList) {
  const schema = SCHEMAS[tab]
  let working = rawList || []
  if (tab === 'areaLocation') {
    working = flattenAreas(working)
  } else if (schema.sortKey) {
    working = [].concat(working).sort((a, b) => (a[schema.sortKey] || 0) - (b[schema.sortKey] || 0))
  }
  return working.map(item => {
    const decorated = Object.assign({}, item)
    decorated.enabled = (item.enabled === undefined || item.enabled === null) ? true : !!item.enabled
    decorated._title = item[schema.titleKey] || ''

    let sub = schema.subtitleKey ? item[schema.subtitleKey] : ''
    if (schema.subtitleMap && sub !== '' && sub !== undefined && sub !== null) {
      sub = schema.subtitleMap[sub] || sub
    }
    decorated._subtitle = (sub === '' || sub === undefined || sub === null) ? '' : sub

    if (tab === 'areaLocation') {
      decorated._depth = item._depth || 0
      decorated._marginLeft = (item._depth || 0) * 32
      const parent = item.parentId ? (rawList.find(a => a.id === item.parentId)) : null
      decorated.parentName = parent ? parent.areaName : '顶级区域'
    }
    decorated._rows = buildRows(decorated, schema.rows)
    return decorated
  })
}

// 构建新增表单默认值
function buildDefaultForm(tab, list) {
  const schema = SCHEMAS[tab]
  const form = {}
  schema.fields.forEach(f => {
    if (f.type === 'switch') {
      form[f.key] = f.key === 'enabled' ? true : false
    } else if (f.type === 'number') {
      form[f.key] = f.key === 'sort' ? (list.length + 1) : ''
    } else if (f.key === 'parentId') {
      // 区域位置：默认顶级区域
      form[f.key] = 0
    } else {
      form[f.key] = ''
    }
  })
  return form
}

// 从对象中按字段定义提取干净的提交数据
function buildPayload(tab, item) {
  const schema = SCHEMAS[tab]
  const payload = {}
  if (item.id !== undefined && item.id !== null) payload.id = item.id
  schema.fields.forEach(f => {
    let v = item[f.key]
    if (f.type === 'number' && v !== '' && v !== undefined && v !== null) v = Number(v)
    if (f.type === 'switch') v = !!v
    if (f.key === 'parentId' && (v === '' || v === undefined || v === null)) v = 0
    payload[f.key] = v
  })
  return payload
}

Page({
  data: {
    tabs: [
      { key: 'equipType', label: '设备类型', icon: '🔧' },
      { key: 'inspectionType', label: '巡查类型', icon: '📋' },
      { key: 'equipParam', label: '设备参数', icon: '📊' },
      { key: 'areaLocation', label: '区域位置', icon: '📍' },
      { key: 'maintainType', label: '保养类型', icon: '🛠️' },
      { key: 'maintainItem', label: '保养项目', icon: '✅' },
      { key: 'faultType', label: '故障类型', icon: '⚠️' },
      { key: 'sparePartCategory', label: '备件分类', icon: '📦' }
    ],
    activeTab: 'equipType',
    hasEnabled: true,
    tabLabel: '设备类型',
    list: [],
    loading: true,
    // 弹窗
    showForm: false,
    formMode: 'add', // add / edit
    editId: null,
    form: {},
    formFields: [],
    formPickerIndex: {},
    formPickerLabel: {}
  },

  onLoad() {
    if (!requireLogin()) return
    const schema = SCHEMAS[this.data.activeTab]
    this.setData({ hasEnabled: !!schema.hasEnabled, tabLabel: schema.label })
    this.loadList()
    this._loaded = true
  },

  onShow() {
    if (!requireLogin()) return
    if (this._loaded) this.loadList()
  },

  onPullDownRefresh() {
    this.loadList().then(() => wx.stopPullDownRefresh())
  },

  // 切换Tab
  onTabChange(e) {
    const key = e.currentTarget.dataset.key
    if (key === this.data.activeTab) return
    const schema = SCHEMAS[key]
    this.setData({
      activeTab: key,
      hasEnabled: !!schema.hasEnabled,
      tabLabel: schema.label,
      list: []
    }, () => {
      this.loadList()
    })
  },

  // 加载当前Tab列表
  loadList() {
    this.setData({ loading: true })
    return apiMap[this.data.activeTab].list().then(res => {
      const raw = res.data || []
      const list = decorate(this.data.activeTab, raw)
      this.setData({ list, loading: false })
    }).catch(err => {
      console.error('加载配置列表失败', err)
      this.setData({ list: [], loading: false })
      toast('加载失败，请重试')
    })
  },

  // 打开新增弹窗
  onAdd() {
    const tab = this.data.activeTab
    const form = buildDefaultForm(tab, this.data.list)
    this.prepareForm(tab, form, null).then(() => {
      this.setData({ showForm: true, formMode: 'add', editId: null })
    })
  },

  // 打开编辑弹窗
  onEdit(e) {
    const id = e.currentTarget.dataset.id
    const tab = this.data.activeTab
    const item = this.data.list.find(i => String(i.id) === String(id))
    if (!item) return
    const form = {}
    SCHEMAS[tab].fields.forEach(f => {
      const v = item[f.key]
      if (f.type === 'switch') form[f.key] = !!v
      else if (v === undefined || v === null) form[f.key] = ''
      else form[f.key] = v
    })
    this.prepareForm(tab, form, id).then(() => {
      this.setData({ showForm: true, formMode: 'edit', editId: id })
    })
  },

  // 准备表单：填充动态picker选项、计算picker索引与展示文本
  prepareForm(tab, form, editId) {
    const cachePromise = (tab === 'equipParam' && !this._equipTypesCache)
      ? configApi.getEquipTypes().then(res => { this._equipTypesCache = res.data || [] }).catch(() => { this._equipTypesCache = [] })
      : Promise.resolve()

    return cachePromise.then(() => {
      const schema = SCHEMAS[tab]
      const fields = schema.fields.map(f => {
        const field = Object.assign({}, f)
        if (f.type === 'picker' && f.optionsKey) {
          field.options = this.buildDynamicOptions(f.optionsKey, editId)
        }
        return field
      })
      const pickerIndex = {}
      const pickerLabel = {}
      fields.forEach(f => {
        if (f.type === 'picker') {
          const opts = f.options || []
          const idx = opts.findIndex(o => String(o.value) === String(form[f.key]))
          pickerIndex[f.key] = idx >= 0 ? idx : -1
          pickerLabel[f.key] = idx >= 0 ? opts[idx].label : ''
        }
      })
      this.setData({ formFields: fields, form, formPickerIndex: pickerIndex, formPickerLabel: pickerLabel })
    })
  },

  // 构建动态picker选项
  buildDynamicOptions(key, editId) {
    if (key === 'applicableType') {
      const types = this._equipTypesCache || []
      return [{ label: '通用', value: '通用' }].concat(types.map(t => ({ label: t.typeName, value: t.typeName })))
    }
    if (key === 'parentId') {
      const list = this.data.list
      const excludeIds = editId ? getDescendantIds(list, editId) : []
      const opts = [{ label: '顶级区域（无父级）', value: 0 }]
      list.forEach(a => {
        if (excludeIds.indexOf(a.id) === -1) {
          opts.push({ label: a.areaName, value: a.id })
        }
      })
      return opts
    }
    return []
  },

  // 表单输入
  onFormInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['form.' + field]: e.detail.value })
  },

  // 表单开关
  onFormSwitch(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['form.' + field]: e.detail.value })
  },

  // 表单picker选择
  onFormPickerChange(e) {
    const field = e.currentTarget.dataset.field
    const idx = Number(e.detail.value)
    const f = this.data.formFields.find(ff => ff.key === field)
    const opt = f && f.options ? f.options[idx] : null
    if (!opt) return
    this.setData({
      ['form.' + field]: opt.value,
      ['formPickerIndex.' + field]: idx,
      ['formPickerLabel.' + field]: opt.label
    })
  },

  // 关闭弹窗
  onCloseForm() {
    this.setData({ showForm: false })
  },

  // 阻止冒泡
  stopPropagation() {},

  // 提交表单（新增/编辑）
  onSubmitForm() {
    const tab = this.data.activeTab
    const fields = this.data.formFields
    for (const f of fields) {
      if (f.required) {
        const v = this.data.form[f.key]
        if (v === '' || v === undefined || v === null) {
          return toast('请填写' + f.label)
        }
      }
    }
    const payload = buildPayload(tab, this.data.form)
    if (this.data.formMode === 'edit') payload.id = this.data.editId

    showLoading('保存中...')
    const action = this.data.formMode === 'edit' ? apiMap[tab].update(payload) : apiMap[tab].add(payload)
    action.then(() => {
      hideLoading()
      toast('保存成功', 'success')
      this.setData({ showForm: false })
      this.loadList()
    }).catch(err => {
      hideLoading()
      console.error('保存配置失败', err)
      toast('保存失败，请重试')
    })
  },

  // 切换启用状态
  onToggleEnabled(e) {
    const id = e.currentTarget.dataset.id
    const newValue = e.detail.value
    const tab = this.data.activeTab
    const list = this.data.list
    const idx = list.findIndex(i => String(i.id) === String(id))
    if (idx < 0) return
    const item = list[idx]
    const payload = buildPayload(tab, item)
    payload.enabled = newValue
    apiMap[tab].update(payload).then(() => {
      this.setData({ ['list[' + idx + '].enabled']: newValue })
      toast(newValue ? '已启用' : '已停用', 'success')
    }).catch(() => {
      // 失败回滚
      this.setData({ ['list[' + idx + '].enabled']: !newValue })
      toast('操作失败，请重试')
    })
  },

  // 删除
  onRemove(e) {
    const id = e.currentTarget.dataset.id
    confirm('确定删除该配置项？删除后不可恢复。').then(ok => {
      if (!ok) return
      showLoading('删除中...')
      apiMap[this.data.activeTab].remove(id).then(() => {
        hideLoading()
        toast('删除成功', 'success')
        this.loadList()
      }).catch(err => {
        hideLoading()
        console.error('删除配置失败', err)
        toast('删除失败，请重试')
      })
    })
  }
})
