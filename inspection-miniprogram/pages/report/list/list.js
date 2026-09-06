// pages/report/list/list.js - 报表列表页
const { reportApi, projectApi } = require('../../../utils/api')
const { requireLogin } = require('../../../utils/auth')
const { toast } = require('../../../utils/util')

Page({
  data: {
    list: [],
    loading: true,
    queryParams: { projectId: '' },
    projectList: [],
    projectIndex: 0
  },

  onLoad() {
    if (!requireLogin()) return
    this.loadProjects()
  },

  onShow() {
    if (!requireLogin()) return
    this.loadData()
  },

  // 加载项目列表（用于筛选）
  async loadProjects() {
    try {
      const res = await projectApi.list({})
      const list = [{ id: '', projectName: '全部项目' }, ...(res.data.rows || []).map(p => ({
        id: p.id,
        projectName: p.projectName
      }))]
      this.setData({ projectList: list })
    } catch (err) {
      console.error('加载项目失败', err)
    }
  },

  // 加载报表列表
  async loadData() {
    this.setData({ loading: true })
    try {
      const res = await reportApi.list(this.data.queryParams)
      this.setData({
        list: res.data.rows || [],
        loading: false
      })
    } catch (err) {
      console.error('加载报表失败', err)
      this.setData({ loading: false })
      toast('加载失败')
    }
  },

  // 切换项目筛选
  onProjectChange(e) {
    const index = e.detail.value
    const project = this.data.projectList[index]
    this.setData({
      projectIndex: index,
      'queryParams.projectId': project ? project.id : ''
    }, () => {
      this.loadData()
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh())
  },

  // 跳转详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/report/detail/detail?id=' + id })
  }
})
