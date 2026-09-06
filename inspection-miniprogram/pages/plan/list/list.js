// pages/plan/list/list.js
const { planApi, projectApi } = require('../../../utils/api')
const { requireLogin } = require('../../../utils/auth')
const { debounce, toast, showLoading, hideLoading } = require('../../../utils/util')

// 计划状态映射
const planStatusMap = {
  '1': { text: '启用', tag: 'tag-success' },
  '0': { text: '停用', tag: 'tag-gray' }
}

// 频率映射（用于标签颜色）
const frequencyMap = {
  'daily': { text: '每日', tag: 'tag-primary' },
  'weekly': { text: '每周', tag: 'tag-warning' },
  'monthly': { text: '每月', tag: 'tag-info' }
}

Page({
  data: {
    list: [],
    loading: true,
    queryParams: {
      planName: ''
    },
    // 新增弹窗
    showForm: false,
    projectList: [],
    projectNames: [],
    form: {
      planName: '',
      projectId: '',
      frequency: 'daily',
      startTime: '',
      endTime: '',
      inspectPoints: '',
      inspectorNames: ''
    },
    frequencyOptions: ['每日', '每周', '每月'],
    frequencyValues: ['daily', 'weekly', 'monthly'],
    formFreqIndex: 0,
    formProjectIndex: 0
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

  // 加载项目列表（新增时使用）
  async loadProjects() {
    try {
      const res = await projectApi.list({})
      const projects = res.data.rows || []
      this.setData({
        projectList: projects,
        projectNames: projects.map(p => p.projectName)
      })
    } catch (err) {
      console.error('加载项目列表失败', err)
    }
  },

  // 加载计划列表
  async loadData() {
    this.setData({ loading: true })
    try {
      const res = await planApi.list(this.data.queryParams)
      const list = (res.data.rows || []).map(item => {
        const freqInfo = frequencyMap[item.frequency] || { text: item.cycleType, tag: 'tag-gray' }
        // 巡检点数量
        const pointCount = item.inspectPoints ? item.inspectPoints.split(',').filter(Boolean).length : 0
        // 巡检人员列表
        const inspectors = item.inspectorNames ? item.inspectorNames.split(',') : []
        return {
          ...item,
          statusInfo: planStatusMap[item.status] || {},
          freqInfo,
          pointCount,
          inspectors
        }
      })
      this.setData({ list, loading: false })
    } catch (err) {
      console.error('加载计划列表失败', err)
      this.setData({ loading: false })
      toast('加载失败，请重试')
    }
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ 'queryParams.planName': e.detail.value })
    this.searchDebounce()
  },

  // 清除搜索
  onClearSearch() {
    this.setData({ 'queryParams.planName': '' })
    this.loadData()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh())
  },

  // 跳转详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/plan/detail/detail?id=' + id })
  },

  // 打开新增弹窗
  onAdd() {
    this.setData({
      showForm: true,
      form: {
        planName: '',
        projectId: '',
        frequency: 'daily',
        startTime: '',
        endTime: '',
        inspectPoints: '',
        inspectorNames: ''
      },
      formFreqIndex: 0,
      formProjectIndex: 0
    })
  },

  // 表单输入
  onFormInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['form.' + field]: e.detail.value })
  },

  // 频率选择
  onFreqChange(e) {
    const index = Number(e.detail.value)
    this.setData({
      formFreqIndex: index,
      'form.frequency': this.data.frequencyValues[index]
    })
  },

  // 项目选择
  onFormProjectChange(e) {
    const index = Number(e.detail.value)
    this.setData({
      formProjectIndex: index,
      'form.projectId': this.data.projectList[index] ? this.data.projectList[index].id : ''
    })
  },

  // 日期选择
  onDateChange(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['form.' + field]: e.detail.value })
  },

  // 关闭弹窗
  onCloseForm() {
    this.setData({ showForm: false })
  },

  // 阻止冒泡
  stopPropagation() {},

  // 提交新增
  async onSubmitForm() {
    const { planName, projectId } = this.data.form
    if (!planName.trim()) return toast('请输入计划名称')
    if (!projectId) return toast('请选择所属项目')

    // 补充周期类型文本
    const formData = { ...this.data.form }
    formData.cycleType = this.data.frequencyOptions[this.data.formFreqIndex]

    showLoading('保存中...')
    try {
      await planApi.add(formData)
      hideLoading()
      toast('保存成功', 'success')
      this.setData({ showForm: false })
      this.loadData()
    } catch (err) {
      hideLoading()
      console.error('保存计划失败', err)
      toast('保存失败，请重试')
    }
  }
})
