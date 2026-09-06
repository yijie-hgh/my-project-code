// pages/point/list/list.js
const { pointApi, projectApi } = require('../../../utils/api')
const { requireLogin } = require('../../../utils/auth')
const { debounce, toast, showLoading, hideLoading, timeAgo } = require('../../../utils/util')

// 巡检点状态映射
const pointStatusMap = {
  '1': { text: '启用', tag: 'tag-success' },
  '0': { text: '停用', tag: 'tag-gray' }
}

Page({
  data: {
    list: [],
    loading: true,
    queryParams: {
      pointName: '',
      projectId: ''
    },
    // 项目筛选
    projectList: [],
    projectNames: ['全部项目'],
    projectIndex: 0,
    // 新增弹窗
    showForm: false,
    form: {
      pointName: '',
      pointCode: '',
      projectId: '',
      location: '',
      nfcTag: '',
      qrcode: ''
    }
  },

  onLoad() {
    this.searchDebounce = debounce(() => {
      this.loadData()
    }, 500)
    this.loadProjects()
  },

  onShow() {
    if (!requireLogin()) return
    this.loadData()
  },

  // 加载项目列表（用于筛选下拉）
  async loadProjects() {
    try {
      const res = await projectApi.list({})
      const projects = res.data.rows || []
      this.setData({
        projectList: projects,
        projectNames: ['全部项目'].concat(projects.map(p => p.projectName))
      })
    } catch (err) {
      console.error('加载项目列表失败', err)
    }
  },

  // 加载巡检点列表
  async loadData() {
    this.setData({ loading: true })
    try {
      const res = await pointApi.list(this.data.queryParams)
      const list = (res.data.rows || []).map(item => ({
        ...item,
        statusInfo: pointStatusMap[item.status] || {},
        lastTimeText: timeAgo(item.lastInspectTime)
      }))
      this.setData({ list, loading: false })
    } catch (err) {
      console.error('加载巡检点列表失败', err)
      this.setData({ loading: false })
      toast('加载失败，请重试')
    }
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ 'queryParams.pointName': e.detail.value })
    this.searchDebounce()
  },

  // 清除搜索
  onClearSearch() {
    this.setData({ 'queryParams.pointName': '' })
    this.loadData()
  },

  // 项目筛选切换
  onProjectChange(e) {
    const index = Number(e.detail.value)
    const projectId = index === 0 ? '' : this.data.projectList[index - 1].id
    this.setData({
      projectIndex: index,
      'queryParams.projectId': projectId
    })
    this.loadData()
  },

  // 下拉刷新
  onPullDownRefresh() {
    Promise.all([this.loadProjects(), this.loadData()]).then(() => wx.stopPullDownRefresh())
  },

  // 跳转详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/point/detail/detail?id=' + id })
  },

  // 打开新增弹窗
  onAdd() {
    this.setData({
      showForm: true,
      form: {
        pointName: '',
        pointCode: '',
        projectId: '',
        location: '',
        nfcTag: '',
        qrcode: ''
      },
      formProjectIndex: 0
    })
  },

  // 表单输入
  onFormInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['form.' + field]: e.detail.value })
  },

  // 新增表单项目选择
  onFormProjectChange(e) {
    const index = Number(e.detail.value)
    const projectId = index === 0 ? '' : this.data.projectList[index - 1].id
    this.setData({ formProjectIndex: index, 'form.projectId': projectId })
  },

  // 关闭弹窗
  onCloseForm() {
    this.setData({ showForm: false })
  },

  // 阻止冒泡
  stopPropagation() {},

  // 提交新增
  async onSubmitForm() {
    const { pointName, pointCode, projectId } = this.data.form
    if (!pointName.trim()) return toast('请输入巡检点名称')
    if (!pointCode.trim()) return toast('请输入巡检点编码')
    if (!projectId) return toast('请选择所属项目')

    showLoading('保存中...')
    try {
      await pointApi.add(this.data.form)
      hideLoading()
      toast('保存成功', 'success')
      this.setData({ showForm: false })
      this.loadData()
    } catch (err) {
      hideLoading()
      console.error('保存巡检点失败', err)
      toast('保存失败，请重试')
    }
  }
})
