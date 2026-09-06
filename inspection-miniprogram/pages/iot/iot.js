// pages/iot/iot.js - 物联网数采页
const { iotApi, equipmentApi } = require('../../utils/api')
const { requireLogin } = require('../../utils/auth')
const { toast, confirm, showLoading, hideLoading } = require('../../utils/util')

// 传感器状态配置
const SENSOR_STATUS_MAP = {
  normal: { text: '正常', color: '#10b981', tag: 'tag-success' },
  warning: { text: '预警', color: '#f59e0b', tag: 'tag-warning' },
  danger: { text: '危险', color: '#ef4444', tag: 'tag-danger' },
  offline: { text: '离线', color: '#9ca3af', tag: 'tag-gray' }
}

// 过滤Tab配置
const FILTER_TABS = [
  { value: 'all', text: '全部' },
  { value: 'online', text: '在线' },
  { value: 'offline', text: '离线' }
]

// 设备类型选项
const DEVICE_TYPES = ['温度传感器', '压力传感器', '振动传感器', '电流传感器', '流量计', '其他']

// 通信协议选项
const PROTOCOLS = ['MQTT', 'Modbus', 'HTTP', 'CoAP', 'TCP']

Page({
  data: {
    filterTabs: FILTER_TABS,
    activeFilter: 'all',
    deviceList: [],
    filteredDevices: [],
    onlineCount: 0,
    offlineCount: 0,
    dangerCount: 0,
    loading: false,
    autoRefresh: false,
    lastRefreshTime: '',
    // 表单相关
    showForm: false,
    formMode: 'add',
    editId: '',
    equipmentList: [],
    equipPickerIndex: -1,
    deviceTypes: DEVICE_TYPES,
    protocols: PROTOCOLS,
    form: {
      deviceName: '',
      equipId: '',
      equipName: '',
      equipCode: '',
      deviceType: '',
      deviceTypeIndex: -1,
      location: '',
      protocol: '',
      protocolIndex: -1,
      online: false,
      remark: ''
    }
  },

  // 根据过滤条件计算展示列表
  applyFilter(devices) {
    const filter = this.data.activeFilter
    let list = devices
    if (filter === 'online') {
      list = devices.filter(d => d.online)
    } else if (filter === 'offline') {
      list = devices.filter(d => !d.online)
    }
    this.setData({ filteredDevices: list })
  },

  onLoad() {
    if (!requireLogin()) return
    this.loadEquipment()
    this.loadDevices()
  },

  onShow() {
    if (!requireLogin()) return
  },

  // 加载设备列表
  async loadDevices() {
    this.setData({ loading: true })
    try {
      const res = await iotApi.list({})
      let rows = res.data.rows || []
      // 预处理传感器：计算进度百分比、补充状态信息
      rows = rows.map(d => {
        let hasDanger = false
        const sensors = (d.sensors || []).map(s => {
          const st = SENSOR_STATUS_MAP[s.status] || SENSOR_STATUS_MAP.offline
          // 进度百分比：value / threshold，离线为0
          let percent = 0
          if (s.threshold && s.threshold > 0 && s.status !== 'offline') {
            percent = Math.min(100, Math.round((Number(s.value) / Number(s.threshold)) * 100))
          }
          if (s.status === 'danger') hasDanger = true
          return Object.assign({}, s, {
            statusText: st.text,
            statusColor: st.color,
            statusTag: st.tag,
            percent: percent
          })
        })
        return Object.assign({}, d, {
          sensors: sensors,
          hasDanger: hasDanger
        })
      })

      const onlineCount = rows.filter(d => d.online).length
      const offlineCount = rows.filter(d => !d.online).length
      const dangerCount = rows.filter(d => d.hasDanger).length

      const now = new Date()
      this.setData({
        deviceList: rows,
        onlineCount,
        offlineCount,
        dangerCount,
        loading: false,
        lastRefreshTime: this.formatTime(now)
      })
      this.applyFilter(rows)
    } catch (err) {
      console.error('加载IoT设备失败', err)
      toast('加载数据失败')
      this.setData({ loading: false })
    }
  },

  // 格式化时间
  formatTime(date) {
    const pad = n => (n < 10 ? '0' + n : '' + n)
    return pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds())
  },

  // 切换过滤
  onFilterChange(e) {
    this.setData({ activeFilter: e.currentTarget.dataset.value })
    this.applyFilter(this.data.deviceList)
  },

  // 手动刷新
  onRefresh() {
    this.loadDevices()
    toast('已刷新', 'none')
  },

  // 切换自动刷新
  onToggleRefresh() {
    const autoRefresh = !this.data.autoRefresh
    this.setData({ autoRefresh })
    if (autoRefresh) {
      toast('已开启自动刷新(10s)', 'none')
      this._refreshTimer = setInterval(() => {
        this.loadDevices()
      }, 10000)
    } else {
      toast('已关闭自动刷新', 'none')
      if (this._refreshTimer) {
        clearInterval(this._refreshTimer)
        this._refreshTimer = null
      }
    }
  },

  // 查看设备详情
  onDeviceTap(e) {
    const id = e.currentTarget.dataset.id
    const equipId = e.currentTarget.dataset.equipid
    if (equipId) {
      wx.navigateTo({
        url: '/pages/equipment/detail/detail?id=' + equipId
      })
    }
  },

  onPullDownRefresh() {
    this.loadDevices().then(() => wx.stopPullDownRefresh())
  },

  // ============ 设备增删改 ============

  // 加载设备列表（供表单picker选择）
  async loadEquipment() {
    try {
      const res = await equipmentApi.list({})
      const list = (res.data.rows || []).map(e => ({
        id: e.id,
        equipName: e.equipName,
        equipCode: e.equipCode
      }))
      this.setData({ equipmentList: list })
    } catch (err) {
      console.error('加载设备列表失败', err)
    }
  },

  // 打开新增弹窗
  onAdd() {
    this.setData({
      showForm: true,
      formMode: 'add',
      editId: '',
      equipPickerIndex: -1,
      form: {
        deviceName: '',
        equipId: '',
        equipName: '',
        equipCode: '',
        deviceType: '',
        deviceTypeIndex: -1,
        location: '',
        protocol: '',
        protocolIndex: -1,
        online: false,
        remark: ''
      }
    })
  },

  // 打开编辑弹窗（预填数据）
  onEdit(e) {
    const id = e.currentTarget.dataset.id
    const device = this.data.deviceList.find(d => String(d.id) === String(id))
    if (!device) {
      toast('设备不存在')
      return
    }
    const list = this.data.equipmentList
    let equipPickerIndex = -1
    if (device.equipId) {
      const idx = list.findIndex(eq => String(eq.id) === String(device.equipId))
      if (idx >= 0) equipPickerIndex = idx
    }
    let deviceTypeIndex = -1
    if (device.deviceType) {
      const idx = DEVICE_TYPES.indexOf(device.deviceType)
      if (idx >= 0) deviceTypeIndex = idx
    }
    let protocolIndex = -1
    if (device.protocol) {
      const idx = PROTOCOLS.indexOf(device.protocol)
      if (idx >= 0) protocolIndex = idx
    }
    this.setData({
      showForm: true,
      formMode: 'edit',
      editId: id,
      equipPickerIndex,
      form: {
        deviceName: device.deviceName || device.equipName || '',
        equipId: device.equipId || '',
        equipName: device.equipName || '',
        equipCode: device.equipCode || '',
        deviceType: device.deviceType || '',
        deviceTypeIndex,
        location: device.location || '',
        protocol: device.protocol || '',
        protocolIndex,
        online: !!device.online,
        remark: device.remark || ''
      }
    })
  },

  // 删除设备
  async onDelete(e) {
    const id = e.currentTarget.dataset.id
    const ok = await confirm('确定删除此IoT设备吗？')
    if (!ok) return
    showLoading('删除中...')
    try {
      await iotApi.remove(id)
      hideLoading()
      toast('删除成功', 'success')
      this.loadDevices()
    } catch (err) {
      hideLoading()
      console.error('删除IoT设备失败', err)
      toast('删除失败')
    }
  },

  // 表单输入处理
  onFormInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['form.' + field]: e.detail.value })
  },

  // 设备选择picker
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

  // 设备类型选择picker
  onTypeChange(e) {
    const index = e.detail.value
    this.setData({
      'form.deviceTypeIndex': index,
      'form.deviceType': this.data.deviceTypes[index]
    })
  },

  // 通信协议选择picker
  onProtocolChange(e) {
    const index = e.detail.value
    this.setData({
      'form.protocolIndex': index,
      'form.protocol': this.data.protocols[index]
    })
  },

  // 在线状态切换
  onOnlineChange(e) {
    this.setData({ 'form.online': e.detail.value })
  },

  // 校验表单
  validateForm() {
    const { deviceName, equipId } = this.data.form
    if (!deviceName.trim()) {
      toast('请输入设备名称')
      return false
    }
    if (!equipId) {
      toast('请选择关联设备')
      return false
    }
    return true
  },

  // 提交表单
  async onSubmitForm() {
    if (!this.validateForm()) return
    showLoading('保存中...')
    try {
      const f = this.data.form
      const data = {
        deviceName: f.deviceName.trim(),
        equipId: f.equipId,
        equipName: f.equipName,
        equipCode: f.equipCode,
        deviceType: f.deviceType,
        location: f.location.trim(),
        protocol: f.protocol,
        online: f.online,
        remark: f.remark.trim()
      }
      if (this.data.formMode === 'edit') {
        data.id = this.data.editId
        await iotApi.update(data)
      } else {
        await iotApi.add(data)
      }
      hideLoading()
      toast(this.data.formMode === 'edit' ? '更新成功' : '新增成功', 'success')
      this.onCloseForm()
      this.loadDevices()
    } catch (err) {
      hideLoading()
      console.error('保存IoT设备失败', err)
      toast('保存失败')
    }
  },

  // 关闭弹窗
  onCloseForm() {
    this.setData({ showForm: false })
  },

  // 阻止冒泡
  stopPropagation() {},

  onUnload() {
    if (this._refreshTimer) {
      clearInterval(this._refreshTimer)
    }
  }
})
