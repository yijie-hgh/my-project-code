// pages/event/create/create.js - 事件创建页
const { eventApi, projectApi, pointApi } = require('../../../utils/api')
const { requireLogin, getUserInfo } = require('../../../utils/auth')
const { toast, showLoading, hideLoading } = require('../../../utils/util')

Page({
  data: {
    form: {
      title: '',
      level: '2',
      projectId: '',
      projectName: '',
      pointId: '',
      pointName: '',
      description: ''
    },
    levelOptions: [
      { value: '1', text: '低', color: '#6366f1' },
      { value: '2', text: '中', color: '#f59e0b' },
      { value: '3', text: '高', color: '#ef4444' },
      { value: '4', text: '紧急', color: '#ef4444' }
    ],
    projectList: [],
    projectIndex: -1,
    pointList: [],
    pointIndex: -1,
    submitting: false
  },

  onLoad(options) {
    if (!requireLogin()) return
    // 接收从巡检执行页传来的关联巡检点参数
    if (options.pointId) {
      this.setData({ 'form.pointId': options.pointId })
    }
    if (options.pointName) {
      this.setData({ 'form.pointName': decodeURIComponent(options.pointName) })
      // 预填事件标题
      if (!this.data.form.title) {
        this.setData({ 'form.title': decodeURIComponent(options.pointName) + ' - 异常上报' })
      }
    }
    this.loadProjects()
  },

  onShow() {
    if (!requireLogin()) return
  },

  // 加载项目列表
  async loadProjects() {
    try {
      const res = await projectApi.list({})
      const list = (res.data.rows || []).map(p => ({
        id: p.id,
        projectName: p.projectName
      }))
      this.setData({ projectList: list })
    } catch (err) {
      console.error('加载项目失败', err)
    }
  },

  // 加载巡检点列表
  async loadPoints(projectId) {
    if (!projectId) {
      this.setData({ pointList: [], pointIndex: -1, 'form.pointId': '', 'form.pointName': '' })
      return
    }
    try {
      const res = await pointApi.list({ projectId: projectId })
      const list = (res.data.rows || []).map(p => ({
        id: p.id,
        pointName: p.pointName
      }))
      this.setData({ pointList: list, pointIndex: -1, 'form.pointId': '', 'form.pointName': '' })
    } catch (err) {
      console.error('加载巡检点失败', err)
    }
  },

  // 输入标题
  onTitleInput(e) {
    this.setData({ 'form.title': e.detail.value })
  },

  // 选择级别
  onLevelChange(e) {
    this.setData({ 'form.level': e.currentTarget.dataset.value })
  },

  // 选择项目
  onProjectChange(e) {
    const index = e.detail.value
    const project = this.data.projectList[index]
    this.setData({
      projectIndex: index,
      'form.projectId': project ? project.id : '',
      'form.projectName': project ? project.projectName : ''
    })
    // 加载该项目下的巡检点
    if (project) {
      this.loadPoints(project.id)
    }
  },

  // 选择巡检点
  onPointChange(e) {
    const index = e.detail.value
    const point = this.data.pointList[index]
    this.setData({
      pointIndex: index,
      'form.pointId': point ? point.id : '',
      'form.pointName': point ? point.pointName : ''
    })
  },

  // 输入描述
  onDescInput(e) {
    this.setData({ 'form.description': e.detail.value })
  },

  // 提交表单
  async onSubmit() {
    const { title, level, projectId, projectName, pointId, pointName, description } = this.data.form
    if (!title.trim()) {
      toast('请输入事件标题')
      return
    }
    if (!description.trim()) {
      toast('请输入事件描述')
      return
    }

    this.setData({ submitting: true })
    showLoading('提交中...')
    try {
      const userInfo = getUserInfo()
      await eventApi.add({
        title: title.trim(),
        level: level,
        projectId: projectId,
        projectName: projectName,
        pointId: pointId,
        pointName: pointName,
        description: description.trim(),
        handler: userInfo ? userInfo.userName : '',
        handlerName: userInfo ? userInfo.nickName : ''
      })
      hideLoading()
      toast('创建成功', 'success')
      setTimeout(() => {
        wx.navigateBack()
      }, 800)
    } catch (err) {
      hideLoading()
      console.error('创建事件失败', err)
      toast('创建失败')
      this.setData({ submitting: false })
    }
  },

  // 取消
  onCancel() {
    wx.navigateBack()
  }
})
