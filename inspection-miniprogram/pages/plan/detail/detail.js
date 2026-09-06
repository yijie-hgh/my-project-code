// pages/plan/detail/detail.js
const { planApi, pointApi, projectApi } = require('../../../utils/api')
const { requireLogin } = require('../../../utils/auth')
const { toast, showLoading, hideLoading, confirm } = require('../../../utils/util')

// 计划状态映射
const planStatusMap = {
  '1': { text: '启用', tag: 'tag-success' },
  '0': { text: '停用', tag: 'tag-gray' }
}

// 频率映射
const frequencyMap = {
  'daily': { text: '每日', tag: 'tag-primary' },
  'weekly': { text: '每周', tag: 'tag-warning' },
  'monthly': { text: '每月', tag: 'tag-info' }
}

Page({
  data: {
    id: null,
    detail: null,
    points: [],
    inspectors: [],
    loading: true,
    // 编辑弹窗
    showForm: false,
    projectList: [],
    projectNames: [],
    form: {
      id: '',
      planName: '',
      projectId: '',
      frequency: 'daily',
      cycleType: '每日',
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

  onLoad(options) {
    this.setData({ id: options.id })
  },

  onShow() {
    if (!requireLogin()) return
    if (this.data.id) this.loadData()
  },

  // 加载计划详情
  async loadData() {
    this.setData({ loading: true })
    try {
      const res = await planApi.detail(this.data.id)
      const detail = res.data || {}
      detail.statusInfo = planStatusMap[detail.status] || {}
      detail.freqInfo = frequencyMap[detail.frequency] || { text: detail.cycleType, tag: 'tag-gray' }
      // 巡检人员列表
      const inspectors = detail.inspectorNames ? detail.inspectorNames.split(',').filter(Boolean) : []
      this.setData({ detail, inspectors, loading: false })
      // 加载关联巡检点详情
      this.loadPoints(detail)
    } catch (err) {
      console.error('加载计划详情失败', err)
      this.setData({ loading: false })
      toast('加载失败，请重试')
    }
  },

  // 加载关联巡检点
  async loadPoints(detail) {
    const pointIds = detail.inspectPoints ? detail.inspectPoints.split(',').filter(Boolean) : []
    if (pointIds.length === 0) {
      this.setData({ points: [] })
      return
    }
    try {
      const res = await pointApi.list({})
      const allPoints = res.data.rows || []
      const points = allPoints.filter(p => pointIds.indexOf(String(p.id)) > -1)
      this.setData({ points })
    } catch (err) {
      console.error('加载巡检点失败', err)
    }
  },

  // 打开编辑弹窗
  async onEdit() {
    const d = this.data.detail
    // 加载项目列表
    try {
      const res = await projectApi.list({})
      const projects = res.data.rows || []
      const projectIndex = projects.findIndex(p => p.id == d.projectId)
      this.setData({
        projectList: projects,
        projectNames: projects.map(p => p.projectName),
        formProjectIndex: projectIndex > -1 ? projectIndex : 0
      })
    } catch (err) {
      console.error('加载项目列表失败', err)
    }

    const freqIndex = this.data.frequencyValues.indexOf(d.frequency)
    this.setData({
      showForm: true,
      form: {
        id: d.id,
        planName: d.planName,
        projectId: d.projectId,
        frequency: d.frequency,
        cycleType: d.cycleType,
        startTime: d.startTime || '',
        endTime: d.endTime || '',
        inspectPoints: d.inspectPoints || '',
        inspectorNames: d.inspectorNames || ''
      },
      formFreqIndex: freqIndex > -1 ? freqIndex : 0
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
      'form.frequency': this.data.frequencyValues[index],
      'form.cycleType': this.data.frequencyOptions[index]
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

  // 提交编辑
  async onSubmitForm() {
    const { planName, projectId } = this.data.form
    if (!planName.trim()) return toast('请输入计划名称')
    if (!projectId) return toast('请选择所属项目')

    showLoading('保存中...')
    try {
      await planApi.update(this.data.form)
      hideLoading()
      toast('保存成功', 'success')
      this.setData({ showForm: false })
      this.loadData()
    } catch (err) {
      hideLoading()
      console.error('保存计划失败', err)
      toast('保存失败，请重试')
    }
  },

  // 删除计划
  async onDelete() {
    const ok = await confirm('确定要删除该巡检计划吗？删除后不可恢复')
    if (!ok) return

    showLoading('删除中...')
    try {
      await planApi.remove(this.data.id)
      hideLoading()
      toast('删除成功', 'success')
      setTimeout(() => wx.navigateBack(), 800)
    } catch (err) {
      hideLoading()
      console.error('删除计划失败', err)
      toast('删除失败，请重试')
    }
  },

  // 跳转巡检点详情
  goPointDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/point/detail/detail?id=' + id })
  }
})
