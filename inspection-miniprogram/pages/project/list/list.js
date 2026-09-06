// pages/project/list/list.js
const { projectApi } = require('../../../utils/api')
const { requireLogin } = require('../../../utils/auth')
const { debounce, toast, showLoading, hideLoading } = require('../../../utils/util')

// 项目状态映射
const projectStatusMap = {
  '1': { text: '进行中', tag: 'tag-success' },
  '0': { text: '已停用', tag: 'tag-gray' }
}

Page({
  data: {
    list: [],
    loading: true,
    queryParams: {
      projectName: '',
      status: ''
    },
    statusTabs: [
      { value: '', label: '全部' },
      { value: '1', label: '进行中' },
      { value: '0', label: '已停用' }
    ],
    // 新增/编辑弹窗
    showForm: false,
    isEdit: false,
    form: {
      id: '',
      projectName: '',
      projectCode: '',
      description: ''
    }
  },

  onLoad() {
    // 创建防抖搜索
    this.searchDebounce = debounce(() => {
      this.loadData()
    }, 500)
  },

  onShow() {
    if (!requireLogin()) return
    this.loadData()
  },

  // 加载项目列表
  async loadData() {
    this.setData({ loading: true })
    try {
      const res = await projectApi.list(this.data.queryParams)
      const list = (res.data.rows || []).map(item => ({
        ...item,
        statusInfo: projectStatusMap[item.status] || {}
      }))
      this.setData({ list, loading: false })
    } catch (err) {
      console.error('加载项目列表失败', err)
      this.setData({ loading: false })
      toast('加载失败，请重试')
    }
  },

  // 搜索输入（防抖）
  onSearchInput(e) {
    this.setData({ 'queryParams.projectName': e.detail.value })
    this.searchDebounce()
  },

  // 清除搜索
  onClearSearch() {
    this.setData({ 'queryParams.projectName': '' })
    this.loadData()
  },

  // 切换状态筛选
  onStatusChange(e) {
    const status = e.currentTarget.dataset.value
    this.setData({ 'queryParams.status': status })
    this.loadData()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh())
  },

  // 跳转详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/project/detail/detail?id=' + id })
  },

  // 打开新增弹窗
  onAdd() {
    this.setData({
      showForm: true,
      isEdit: false,
      form: { id: '', projectName: '', projectCode: '', description: '' }
    })
  },

  // 打开编辑弹窗
  onEdit(e) {
    const item = e.currentTarget.dataset.item
    this.setData({
      showForm: true,
      isEdit: true,
      form: {
        id: item.id,
        projectName: item.projectName,
        projectCode: item.projectCode,
        description: item.description || ''
      }
    })
  },

  // 表单输入
  onFormInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['form.' + field]: e.detail.value })
  },

  // 关闭弹窗
  onCloseForm() {
    this.setData({ showForm: false })
  },

  // 阻止冒泡
  stopPropagation() {},

  // 提交表单
  async onSubmitForm() {
    const { projectName, projectCode } = this.data.form
    if (!projectName.trim()) return toast('请输入项目名称')
    if (!projectCode.trim()) return toast('请输入项目编码')

    showLoading('保存中...')
    try {
      if (this.data.isEdit) {
        await projectApi.update(this.data.form)
      } else {
        await projectApi.add(this.data.form)
      }
      hideLoading()
      toast('保存成功', 'success')
      this.setData({ showForm: false })
      this.loadData()
    } catch (err) {
      hideLoading()
      console.error('保存项目失败', err)
      toast('保存失败，请重试')
    }
  }
})
