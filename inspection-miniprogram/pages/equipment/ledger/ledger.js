// pages/equipment/ledger/ledger.js
const { equipmentApi, configApi } = require('../../../utils/api')
const { requireLogin } = require('../../../utils/auth')
const { toast, showLoading, hideLoading, confirm } = require('../../../utils/util')

// 设备状态选项（与 equipStatusMap 值对应）
const STATUS_OPTIONS = [
  { value: '1', text: '正常运行' },
  { value: '2', text: '故障待修' },
  { value: '3', text: '停机保养' },
  { value: '0', text: '报废' },
  { value: '4', text: '待校验' }
]

Page({
  data: {
    isEdit: false,
    id: null,
    loading: false,
    submitting: false,
    equipTypes: [],
    statusOptions: STATUS_OPTIONS,
    today: '',
    form: {
      id: '',
      equipCode: '',
      equipName: '',
      equipType: '',
      equipTypeIndex: -1,
      equipCategory: '',
      spec: '',
      status: '',
      statusIndex: -1,
      workshop: '',
      location: '',
      manager: '',
      managerPhone: '',
      manufacturer: '',
      supplier: '',
      purchaseDate: '',
      startDate: '',
      calibrationCycle: '',
      calibrationDate: '',
      qrcode: '',
      nfcTag: ''
    }
  },

  onLoad(options) {
    if (!requireLogin()) return

    // 当天日期，用于 date picker 边界
    const now = new Date()
    const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0')
    this.setData({ today })

    const isEdit = !!options.id
    this.setData({ isEdit, id: options.id || null })

    if (isEdit) {
      wx.setNavigationBarTitle({ title: '编辑设备台账' })
      this.loadDetail(options.id)
    } else {
      wx.setNavigationBarTitle({ title: '新增设备台账' })
      // 新增模式自动生成二维码标识
      this.setData({ 'form.qrcode': 'EQ-' + Date.now() })
    }

    this.loadEquipTypes()
  },

  // 加载设备类型
  async loadEquipTypes() {
    try {
      const res = await configApi.getEquipTypes()
      const list = (res.data || []).filter(t => t.enabled !== false)
      this.setData({ equipTypes: list })
      // 编辑模式下，回填设备类型索引
      if (this.data.isEdit && this.data.form.equipType) {
        const index = list.findIndex(t => t.typeName === this.data.form.equipType)
        if (index >= 0) this.setData({ 'form.equipTypeIndex': index })
      }
    } catch (err) {
      console.error('加载设备类型失败', err)
    }
  },

  // 加载设备详情
  async loadDetail(id) {
    this.setData({ loading: true })
    try {
      const res = await equipmentApi.detail(id)
      const d = res.data || {}
      const form = {
        id: d.id || '',
        equipCode: d.equipCode || '',
        equipName: d.equipName || '',
        equipType: d.equipType || '',
        equipTypeIndex: -1,
        equipCategory: d.equipCategory || '',
        spec: d.spec || '',
        status: d.status || '',
        statusIndex: -1,
        workshop: d.workshop || '',
        location: d.location || '',
        manager: d.manager || '',
        managerPhone: d.managerPhone || '',
        manufacturer: d.manufacturer || '',
        supplier: d.supplier || '',
        purchaseDate: d.purchaseDate || '',
        startDate: d.startDate || '',
        calibrationCycle: d.calibrationCycle != null ? String(d.calibrationCycle) : '',
        calibrationDate: d.calibrationDate || '',
        qrcode: d.qrcode || '',
        nfcTag: d.nfcTag || ''
      }
      // 回填状态索引
      if (form.status) {
        const sIndex = STATUS_OPTIONS.findIndex(s => s.value === form.status)
        form.statusIndex = sIndex
      }
      // 回填类型索引（若类型列表已加载）
      if (form.equipType && this.data.equipTypes.length) {
        const tIndex = this.data.equipTypes.findIndex(t => t.typeName === form.equipType)
        form.equipTypeIndex = tIndex
      }
      this.setData({ form })
    } catch (err) {
      console.error('加载设备详情失败', err)
      toast('加载失败，请重试')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 通用输入
  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['form.' + field]: e.detail.value })
  },

  // 设备类型选择
  onEquipTypeChange(e) {
    const index = e.detail.value
    const item = this.data.equipTypes[index]
    this.setData({
      'form.equipTypeIndex': index,
      'form.equipType': item ? item.typeName : ''
    })
  },

  // 设备状态选择
  onStatusChange(e) {
    const index = e.detail.value
    const item = this.data.statusOptions[index]
    this.setData({
      'form.statusIndex': index,
      'form.status': item ? item.value : ''
    })
  },

  // 日期选择
  onDateChange(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['form.' + field]: e.detail.value })
  },

  // 重新生成二维码
  onGenQrcode() {
    this.setData({ 'form.qrcode': 'EQ-' + Date.now() })
    toast('已重新生成二维码标识', 'success')
  },

  // Excel 导入
  onImportExcel() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['xlsx', 'xls'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file) return
        showLoading('导入中...')
        equipmentApi.importExcel([{ name: file.name, path: file.path, size: file.size }]).then((response) => {
          hideLoading()
          const data = response.data || {}
          const count = data.importCount != null ? data.importCount : 0
          toast('导入成功，共' + count + '条', 'success')
        }).catch(() => {
          hideLoading()
          toast('导入失败，请重试')
        })
      },
      fail: () => {
        // 用户取消选择，不提示
      }
    })
  },

  // 表单校验
  validate() {
    const { equipName, equipCode, equipType } = this.data.form
    if (!equipName || !equipName.trim()) {
      toast('请输入设备名称')
      return false
    }
    if (!equipCode || !equipCode.trim()) {
      toast('请输入设备编码')
      return false
    }
    if (!equipType) {
      toast('请选择设备类型')
      return false
    }
    // 联系电话格式校验（选填）
    const phone = this.data.form.managerPhone
    if (phone && !/^1[3-9]\d{9}$/.test(phone) && !/^\d{3,4}-?\d{7,8}$/.test(phone)) {
      toast('请输入正确的联系电话')
      return false
    }
    return true
  },

  // 保存
  async onSave() {
    if (!this.validate()) return
    if (this.data.submitting) return
    this.setData({ submitting: true })

    const f = this.data.form
    const data = {
      id: f.id || undefined,
      equipCode: f.equipCode.trim(),
      equipName: f.equipName.trim(),
      equipType: f.equipType,
      equipCategory: f.equipCategory,
      spec: f.spec,
      status: f.status || '1',
      workshop: f.workshop,
      location: f.location,
      manager: f.manager,
      managerPhone: f.managerPhone,
      manufacturer: f.manufacturer,
      supplier: f.supplier,
      purchaseDate: f.purchaseDate,
      startDate: f.startDate,
      calibrationCycle: f.calibrationCycle ? Number(f.calibrationCycle) : '',
      calibrationDate: f.calibrationDate,
      qrcode: f.qrcode,
      nfcTag: f.nfcTag
    }

    showLoading('保存中...')
    try {
      if (this.data.isEdit) {
        await equipmentApi.update(data)
      } else {
        await equipmentApi.add(data)
      }
      hideLoading()
      toast('保存成功', 'success')
      setTimeout(() => wx.navigateBack(), 800)
    } catch (err) {
      hideLoading()
      console.error('保存设备台账失败', err)
      toast('保存失败，请重试')
      this.setData({ submitting: false })
    }
  },

  // 取消
  onCancel() {
    wx.navigateBack()
  },

  onPullDownRefresh() {
    if (this.data.isEdit && this.data.id) {
      this.loadDetail(this.data.id).then(() => wx.stopPullDownRefresh())
    } else {
      wx.stopPullDownRefresh()
    }
  }
})
