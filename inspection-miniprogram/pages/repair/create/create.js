// pages/repair/create/create.js
const { repairApi, equipmentApi } = require('../../../utils/api')
const { requireLogin, getUserInfo } = require('../../../utils/auth')
const { toast, showLoading, hideLoading } = require('../../../utils/util')

const FAULT_TYPES = ['机械故障', '电气故障', '仪表故障', '制冷故障', '其他']

const LEVEL_OPTIONS = [
  { value: '1', text: '低', color: '#9ca3af' },
  { value: '2', text: '中', color: '#2563eb' },
  { value: '3', text: '高', color: '#f59e0b' },
  { value: '4', text: '紧急', color: '#ef4444' }
]

Page({
  data: {
    form: {
      equipId: '',
      equipName: '',
      equipCode: '',
      title: '',
      description: '',
      faultType: '',
      faultTypeIndex: -1,
      level: '2',
      reporterPhone: ''
    },
    faultTypes: FAULT_TYPES,
    levelOptions: LEVEL_OPTIONS,
    equipmentList: [],
    equipPickerIndex: -1,
    images: [],
    maxImages: 6,
    submitting: false,
    editId: null,
    isEdit: false
  },

  onLoad(options) {
    if (!requireLogin()) return

    if (options.id) {
      this.setData({ editId: options.id, isEdit: true })
      wx.setNavigationBarTitle({ title: '编辑报修' })
      this.loadRepairDetail(options.id)
    }

    const userInfo = getUserInfo()
    if (userInfo && userInfo.phonenumber) {
      this.setData({ 'form.reporterPhone': userInfo.phonenumber })
    }

    if (options.equipId) {
      this.setData({
        'form.equipId': options.equipId,
        'form.equipName': options.equipName ? decodeURIComponent(options.equipName) : ''
      })
    }

    this.loadEquipment()
  },

  onShow() {
    if (!requireLogin()) return
  },

  // 加载设备列表
  async loadEquipment() {
    try {
      const res = await equipmentApi.list({})
      const list = (res.data.rows || []).map(e => ({
        id: e.id,
        equipName: e.equipName,
        equipCode: e.equipCode
      }))
      this.setData({ equipmentList: list })

      // 如果已从参数获取设备ID，查找索引
      if (this.data.form.equipId) {
        const index = list.findIndex(e => String(e.id) === String(this.data.form.equipId))
        if (index >= 0) {
          this.setData({
            equipPickerIndex: index,
            'form.equipCode': list[index].equipCode
          })
        }
      }
    } catch (err) {
      console.error('加载设备列表失败', err)
    }
  },

  // 加载报修详情（编辑模式）
  async loadRepairDetail(id) {
    try {
      const res = await repairApi.list({})
      const item = (res.data.rows || []).find(r => String(r.id) === String(id))
      if (!item) {
        toast('报修记录不存在')
        return
      }
      const faultTypeIndex = FAULT_TYPES.indexOf(item.faultType)
      this.setData({
        'form.equipId': item.equipId || '',
        'form.equipName': item.equipName || '',
        'form.equipCode': item.equipCode || '',
        'form.title': item.title || '',
        'form.description': item.description || '',
        'form.faultType': item.faultType || '',
        'form.faultTypeIndex': faultTypeIndex,
        'form.level': item.level || '2',
        'form.reporterPhone': item.reporterPhone || '',
        images: item.images || []
      })
    } catch (err) {
      console.error('加载报修详情失败', err)
      toast('加载失败')
    }
  },

  // 选择设备
  onEquipChange(e) {
    const index = e.detail.value
    const equip = this.data.equipmentList[index]
    this.setData({
      equipPickerIndex: index,
      'form.equipId': equip ? equip.id : '',
      'form.equipName': equip ? equip.equipName : '',
      'form.equipCode': equip ? equip.equipCode : ''
    })
  },

  // 输入标题
  onTitleInput(e) {
    this.setData({ 'form.title': e.detail.value })
  },

  // 输入描述
  onDescInput(e) {
    this.setData({ 'form.description': e.detail.value })
  },

  // 选择故障类型
  onFaultTypeChange(e) {
    const index = e.detail.value
    this.setData({
      'form.faultTypeIndex': index,
      'form.faultType': this.data.faultTypes[index]
    })
  },

  // 选择紧急程度
  onLevelChange(e) {
    this.setData({ 'form.level': e.currentTarget.dataset.value })
  },

  // 输入联系电话
  onPhoneInput(e) {
    this.setData({ 'form.reporterPhone': e.detail.value })
  },

  // 选择照片
  onChooseImage() {
    const count = this.data.maxImages - this.data.images.length
    if (count <= 0) {
      toast('最多上传' + this.data.maxImages + '张照片')
      return
    }
    wx.chooseMedia({
      count,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFiles = res.tempFiles || []
        const newPaths = tempFiles.map(f => f.tempFilePath)
        this.setData({ images: this.data.images.concat(newPaths) })
      }
    })
  },

  // 删除照片
  onDeleteImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.images
    images.splice(index, 1)
    this.setData({ images })
  },

  // 预览照片
  onPreviewImage(e) {
    const { urls, current } = e.currentTarget.dataset
    wx.previewImage({ current, urls })
  },

  // 校验表单
  validate() {
    const { equipId, title, description, faultType, reporterPhone } = this.data.form
    if (!equipId) {
      toast('请选择故障设备')
      return false
    }
    if (!title.trim()) {
      toast('请输入故障标题')
      return false
    }
    if (!description.trim()) {
      toast('请输入故障描述')
      return false
    }
    if (!faultType) {
      toast('请选择故障类型')
      return false
    }
    if (reporterPhone && !/^1[3-9]\d{9}$/.test(reporterPhone)) {
      toast('请输入正确的手机号码')
      return false
    }
    return true
  },

  // 提交
  async onSubmit() {
    if (!this.validate()) return
    this.setData({ submitting: true })
    showLoading('提交中...')

    try {
      const userInfo = getUserInfo()
      const data = {
        equipId: this.data.form.equipId,
        equipName: this.data.form.equipName,
        equipCode: this.data.form.equipCode,
        title: this.data.form.title.trim(),
        description: this.data.form.description.trim(),
        faultType: this.data.form.faultType,
        level: this.data.form.level,
        reporterPhone: this.data.form.reporterPhone,
        reporter: userInfo ? userInfo.nickName : '报修人',
        images: this.data.images
      }
      if (this.data.isEdit) {
        data.id = this.data.editId
        await repairApi.update(data)
        hideLoading()
        toast('保存成功', 'success')
      } else {
        await repairApi.add(data)
        hideLoading()
        toast('报修提交成功', 'success')
      }
      setTimeout(() => {
        wx.navigateBack()
      }, 800)
    } catch (err) {
      hideLoading()
      console.error('提交报修失败', err)
      toast('提交失败')
      this.setData({ submitting: false })
    }
  },

  onCancel() {
    wx.navigateBack()
  }
})
