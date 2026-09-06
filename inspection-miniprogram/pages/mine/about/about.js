// pages/mine/about/about.js
const { requireLogin } = require('../../../utils/auth')
const { toast } = require('../../../utils/util')

Page({
  data: {
    modules: [
      '用户管理', '角色管理', '菜单管理', '部门管理',
      '岗位管理', '字典管理', '参数设置', '通知公告',
      '巡检项目', '巡检点管理', '巡检计划', '巡检任务',
      '事件管理', '巡检报表', 'AR巡检', '无人机巡检', '系统监控'
    ]
  },

  onLoad() {
    if (!requireLogin()) return
  },

  onShow() {
    if (!requireLogin()) return
  },

  // 复制QQ号
  onCopyQQ() {
    wx.setClipboardData({
      data: '110189312',
      success: () => {
        toast('QQ号已复制', 'success')
      }
    })
  },

  // 检查更新
  onCheckUpdate() {
    toast('当前已是最新版本 v3.6.0', 'none')
  }
})
