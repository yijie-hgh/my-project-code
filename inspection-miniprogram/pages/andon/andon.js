// pages/andon/andon.js - 安灯呼叫页
const { andonApi, equipmentApi } = require('../../utils/api')
const { requireLogin, getUserInfo } = require('../../utils/auth')
const { toast, showLoading, hideLoading, confirm } = require('../../utils/util')

// 呼叫类型配置
const CALL_TYPES = [
  { value: '设备故障', icon: '🔧', color: '#ef4444', tag: 'tag-danger' },
  { value: '质量异常', icon: '⚠️', color: '#f59e0b', tag: 'tag-warning' },
  { value: '物料短缺', icon: '📦', color: '#6366f1', tag: 'tag-info' },
  { value: '求助支援', icon: '🆘', color: '#2563eb', tag: 'tag-primary' },
  { value: '其他', icon: '📋', color: '#6b7280', tag: 'tag-gray' }
]

// 状态映射
const STATUS_MAP = {
  '0': { text: '待响应', tag: 'tag-danger' },
  '1': { text: '已响应', tag: 'tag-warning' },
  '2': { text: '已处理', tag: 'tag-success' }
}

// 过滤Tab配置
const FILTER_TABS = [
  { value: 'all', text: '全部' },
  { value: '0', text: '待响应' },
  { value: '1', text: '已响应' },
  { value: '2', text: '已处理' }
]

Page({
  data: {
    callTypes: CALL_TYPES,
    statusMap: STATUS_MAP,
    filterTabs: FILTER_TABS,
    // 呼叫表单
    selectedType: '',
    form: {
      equipName: '',
      equipId: '',
      description: '',
      location: ''
    },
    equipList: [],
    equipIndex: -1,
    showForm: false,
    submitting: false,
    showSuccess: false,
    // 历史列表
    activeFilter: 'all',
    recordList: [],
    loading: false,
    expandedId: null
  },

  onLoad() {
    if (!requireLogin()) return
    this.loadEquipList()
    this.loadRecords()
  },

  onShow() {
    if (!requireLogin()) return
  },

  // 加载设备列表（用于选择）
  async loadEquipList() {
    try {
      const res = await equipmentApi.list({})
      this.setData({ equipList: res.data.rows || [] })
    } catch (err) {
      console.error('加载设备列表失败', err)
    }
  },

  // 加载呼叫记录
  async loadRecords() {
    this.setData({ loading: true })
    try {
      const params = { status: this.data.activeFilter }
      const res = await andonApi.list(params)
      const rows = res.data.rows || []
      // 预处理：补充状态文本与类型样式
      rows.forEach(r => {
        const st = STATUS_MAP[r.status] || { text: r.statusText || '未知', tag: 'tag-gray' }
        r.statusText = st.text
        r.statusTag = st.tag
        const ct = CALL_TYPES.find(c => c.value === r.callType)
        r.callTypeIcon = ct ? ct.icon : '📋'
        r.callTypeTag = ct ? ct.tag : 'tag-gray'
      })
      this.setData({ recordList: rows, loading: false })
    } catch (err) {
      console.error('加载呼叫记录失败', err)
      toast('加载呼叫记录失败')
      this.setData({ loading: false })
    }
  },

  // 选择呼叫类型
  onSelectType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      selectedType: type,
      showForm: true
    })
  },

  // 取消选择
  onCancelType() {
    this.setData({
      selectedType: '',
      showForm: false,
      'form.equipName': '',
      'form.equipId': '',
      'form.description': '',
      'form.location': '',
      equipIndex: -1
    })
  },

  // 输入设备名称
  onEquipNameInput(e) {
    this.setData({ 'form.equipName': e.detail.value })
  },

  // 选择设备
  onEquipChange(e) {
    const index = e.detail.value
    const equip = this.data.equipList[index]
    this.setData({
      equipIndex: index,
      'form.equipId': equip ? equip.id : '',
      'form.equipName': equip ? equip.equipName : ''
    })
  },

  // 输入描述
  onDescInput(e) {
    this.setData({ 'form.description': e.detail.value })
  },

  // 输入位置
  onLocationInput(e) {
    this.setData({ 'form.location': e.detail.value })
  },

  // 提交呼叫
  async onSubmitCall() {
    const { equipName, description, location } = this.data.form
    if (!equipName.trim()) {
      toast('请输入或选择设备名称')
      return
    }
    if (!description.trim()) {
      toast('请描述呼叫原因')
      return
    }

    this.setData({ submitting: true })
    showLoading('呼叫中...')
    try {
      const userInfo = getUserInfo()
      await andonApi.call({
        equipName: equipName.trim(),
        equipId: this.data.form.equipId,
        callType: this.data.selectedType,
        description: description.trim(),
        location: location.trim(),
        caller: userInfo ? userInfo.nickName || userInfo.userName : '未知'
      })
      hideLoading()
      // 显示成功动画
      this.setData({ showSuccess: true, submitting: false })
      setTimeout(() => {
        this.setData({ showSuccess: false })
        this.onCancelType()
        this.loadRecords()
      }, 1200)
    } catch (err) {
      hideLoading()
      console.error('发起呼叫失败', err)
      toast('呼叫失败')
      this.setData({ submitting: false })
    }
  },

  // 切换过滤Tab
  onFilterChange(e) {
    const value = e.currentTarget.dataset.value
    this.setData({ activeFilter: value, expandedId: null })
    this.loadRecords()
  },

  // 展开/收起详情
  onToggleExpand(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ expandedId: this.data.expandedId === id ? null : id })
  },

  // 响应呼叫
  async onRespond(e) {
    const id = e.currentTarget.dataset.id
    const sure = await confirm('确认响应此呼叫吗？')
    if (!sure) return
    showLoading('响应中...')
    try {
      const userInfo = getUserInfo()
      await andonApi.respond(id, {
        responder: userInfo ? userInfo.nickName || userInfo.userName : '当前用户'
      })
      hideLoading()
      toast('已响应', 'success')
      this.loadRecords()
    } catch (err) {
      hideLoading()
      console.error('响应失败', err)
      toast('响应失败')
    }
  },

  onPullDownRefresh() {
    this.loadRecords().then(() => wx.stopPullDownRefresh())
  }
})
