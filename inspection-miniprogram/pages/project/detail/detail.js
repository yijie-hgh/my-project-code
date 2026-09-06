// pages/project/detail/detail.js
const { projectApi, pointApi } = require('../../../utils/api')
const { requireLogin } = require('../../../utils/auth')
const { formatDateTime, toast, showLoading, hideLoading, confirm, timeAgo } = require('../../../utils/util')

// 项目状态映射
const projectStatusMap = {
  '1': { text: '进行中', tag: 'tag-success' },
  '0': { text: '已停用', tag: 'tag-gray' }
}

Page({
  data: {
    id: null,
    detail: null,
    points: [],
    loading: true,
    // 编辑弹窗
    showForm: false,
    form: {
      id: '',
      projectName: '',
      projectCode: '',
      description: ''
    }
  },

  onLoad(options) {
    this.setData({ id: options.id })
  },

  onShow() {
    if (!requireLogin()) return
    if (this.data.id) this.loadData()
  },

  // 加载项目详情及关联巡检点
  async loadData() {
    this.setData({ loading: true })
    try {
      const [projectRes, pointRes] = await Promise.all([
        projectApi.detail(this.data.id),
        pointApi.list({ projectId: this.data.id })
      ])
      const detail = projectRes.data || {}
      detail.statusInfo = projectStatusMap[detail.status] || {}
      detail.createTimeText = formatDateTime(detail.createTime)
      const points = (pointRes.data.rows || []).map(p => ({
        ...p,
        lastTimeText: timeAgo(p.lastInspectTime)
      }))
      this.setData({ detail, points, loading: false })
    } catch (err) {
      console.error('加载项目详情失败', err)
      this.setData({ loading: false })
      toast('加载失败，请重试')
    }
  },

  // 打开编辑弹窗
  onEdit() {
    const d = this.data.detail
    this.setData({
      showForm: true,
      form: {
        id: d.id,
        projectName: d.projectName,
        projectCode: d.projectCode,
        description: d.description || ''
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

  // 提交编辑
  async onSubmitForm() {
    const { projectName, projectCode } = this.data.form
    if (!projectName.trim()) return toast('请输入项目名称')
    if (!projectCode.trim()) return toast('请输入项目编码')

    showLoading('保存中...')
    try {
      await projectApi.update(this.data.form)
      hideLoading()
      toast('保存成功', 'success')
      this.setData({ showForm: false })
      this.loadData()
    } catch (err) {
      hideLoading()
      console.error('保存项目失败', err)
      toast('保存失败，请重试')
    }
  },

  // 删除项目
  async onDelete() {
    const ok = await confirm('确定要删除该项目吗？删除后不可恢复')
    if (!ok) return

    showLoading('删除中...')
    try {
      await projectApi.remove(this.data.id)
      hideLoading()
      toast('删除成功', 'success')
      setTimeout(() => wx.navigateBack(), 800)
    } catch (err) {
      hideLoading()
      console.error('删除项目失败', err)
      toast('删除失败，请重试')
    }
  },

  // 跳转巡检点详情
  goPointDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/point/detail/detail?id=' + id })
  }
})
