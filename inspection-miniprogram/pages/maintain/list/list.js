// pages/maintain/list/list.js
const { maintainApi, equipmentApi, configApi } = require('../../../utils/api')
const { requireLogin } = require('../../../utils/auth')
const { calcRate, toast, confirm, showLoading, hideLoading, formatDate } = require('../../../utils/util')
const { account, bitable, sync } = require('../../../utils/feishu')

// 维护保养状态映射
const maintainStatusMap = {
  '0': { text: '待执行', tag: 'tag-warning' },
  '1': { text: '执行中', tag: 'tag-primary' },
  '2': { text: '已完成', tag: 'tag-success' },
  '3': { text: '已逾期', tag: 'tag-danger' }
}

Page({
  data: {
    list: [],
    loading: true,
    activeTab: 'all',
    tabs: [
      { key: 'all', label: '全部' },
      { key: '0', label: '待执行' },
      { key: '1', label: '执行中' },
      { key: '2', label: '已完成' },
      { key: '3', label: '已逾期' }
    ],
    queryParams: {
      status: '',
      equipName: ''
    },
    // 表单弹窗
    showForm: false,
    formMode: 'add',
    editId: null,
    form: {
      planName: '',
      equipId: '',
      equipName: '',
      equipIndex: 0,
      type: '',
      typeIndex: 0,
      planDate: '',
      maintainer: '',
      content: '',
      remark: ''
    },
    equipList: [],
    maintainTypes: []
  },

  onLoad() {
    if (!requireLogin()) return
    this.loadData()
    this.loadEquipList()
    this.loadMaintainTypes()
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
      const res = await maintainApi.list(params)
      const list = (res.data.rows || []).map(item => {
        const statusInfo = maintainStatusMap[item.status] || {}
        const items = item.items || []
        const doneCount = items.filter(i => i.done).length
        return {
          ...item,
          statusInfo,
          doneCount,
          totalCount: items.length,
          rate: calcRate(doneCount, items.length),
          overdue: item.status === '3'
        }
      })
      this.setData({ list, loading: false })
    } catch (err) {
      console.error('加载保养列表失败', err)
      this.setData({ loading: false })
    }
  },

  // 加载设备列表
  async loadEquipList() {
    try {
      const res = await equipmentApi.list()
      this.setData({ equipList: res.data.rows || [] })
    } catch (err) {
      console.error('加载设备列表失败', err)
    }
  },

  // 加载保养类型
  async loadMaintainTypes() {
    try {
      const res = await configApi.getMaintainTypes()
      this.setData({ maintainTypes: res.data || [] })
    } catch (err) {
      console.error('加载保养类型失败', err)
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

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/maintain/detail/detail?id=' + id })
  },

  // 新增保养计划
  onAdd() {
    const today = formatDate(new Date(), 'yyyy-MM-dd')
    this.setData({
      showForm: true,
      formMode: 'add',
      editId: null,
      form: {
        planName: '',
        equipId: '',
        equipName: '',
        equipIndex: 0,
        type: '',
        typeIndex: 0,
        planDate: today,
        maintainer: '',
        content: '',
        remark: ''
      }
    })
  },

  // 编辑保养计划
  onEdit(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.list.find(i => i.id == id)
    if (!item) return
    const equipIndex = this.data.equipList.findIndex(eq => eq.id == item.equipId)
    const typeIndex = this.data.maintainTypes.findIndex(t => t.typeName === item.type)
    this.setData({
      showForm: true,
      formMode: 'edit',
      editId: item.id,
      form: {
        planName: item.planName || '',
        equipId: item.equipId || '',
        equipName: item.equipName || '',
        equipIndex: equipIndex > -1 ? equipIndex : 0,
        type: item.type || '',
        typeIndex: typeIndex > -1 ? typeIndex : 0,
        planDate: item.planDate || '',
        maintainer: item.maintainer || '',
        content: item.content || '',
        remark: item.remark || ''
      }
    })
  },

  // 删除保养计划
  async onDelete(e) {
    const id = e.currentTarget.dataset.id
    const ok = await confirm('确定删除此保养计划吗？')
    if (!ok) return
    try {
      showLoading('删除中...')
      await maintainApi.remove(id)
      hideLoading()
      toast('删除成功', 'success')
      this.loadData()
    } catch (err) {
      hideLoading()
      toast('删除失败')
    }
  },

  // 表单输入
  onFormInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['form.' + field]: e.detail.value })
  },

  // 设备选择
  onEquipChange(e) {
    const index = e.detail.value
    const equip = this.data.equipList[index]
    if (equip) {
      this.setData({
        'form.equipIndex': index,
        'form.equipId': equip.id,
        'form.equipName': equip.equipName
      })
    }
  },

  // 保养类型选择
  onTypeChange(e) {
    const index = e.detail.value
    const type = this.data.maintainTypes[index]
    if (type) {
      this.setData({
        'form.typeIndex': index,
        'form.type': type.typeName
      })
    }
  },

  // 日期选择
  onDateChange(e) {
    this.setData({ 'form.planDate': e.detail.value })
  },

  // 提交表单
  async onSubmitForm() {
    const { form, formMode, editId } = this.data
    if (!form.planName) {
      return toast('请输入计划名称')
    }
    if (!form.equipId) {
      return toast('请选择关联设备')
    }
    if (!form.type) {
      return toast('请选择保养类型')
    }
    if (!form.planDate) {
      return toast('请选择计划日期')
    }
    const submitData = {
      planName: form.planName,
      equipId: form.equipId,
      equipName: form.equipName,
      type: form.type,
      planDate: form.planDate,
      maintainer: form.maintainer,
      content: form.content,
      remark: form.remark
    }
    try {
      showLoading('保存中...')
      if (formMode === 'edit') {
        submitData.id = editId
        await maintainApi.update(submitData)
        hideLoading()
        toast('更新成功', 'success')
      } else {
        await maintainApi.add(submitData)
        hideLoading()
        toast('添加成功', 'success')
      }
      this.onCloseForm()
      this.loadData()
    } catch (err) {
      hideLoading()
      toast('保存失败')
    }
  },

  // 关闭弹窗
  onCloseForm() {
    this.setData({ showForm: false })
  },

  // 阻止冒泡
  stopPropagation() {},

  // 同步到飞书多维表格
  async onSyncToFeishu() {
    if (!account.isLoggedIn()) {
      const res = await confirm('飞书未登录，是否前往飞书设置页登录？')
      if (res) {
        wx.navigateTo({ url: '/pages/feishu/settings/settings' })
      }
      return
    }
    const tableInfo = bitable.getByModule('maintenance_records')
    if (!tableInfo) {
      const res = await confirm('飞书多维表格未创建，是否前往创建？')
      if (res) {
        wx.navigateTo({ url: '/pages/feishu/settings/settings' })
      }
      return
    }
    wx.showLoading({ title: '同步飞书中...', mask: true })
    try {
      const result = await sync.syncModule('maintenance_records', this.data.list)
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
