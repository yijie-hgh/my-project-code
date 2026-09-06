// custom-tab-bar/index.js
Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/index/index', text: '首页', icon: '🏠' },
      { pagePath: '/pages/task/list/list', text: '任务', icon: '📋' },
      { pagePath: '/pages/scan/scan', text: '扫码', icon: 'scan', center: true },
      { pagePath: '/pages/event/list/list', text: '事件', icon: '⚠️' },
      { pagePath: '/pages/mine/mine', text: '我的', icon: '👤' }
    ]
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      wx.switchTab({ url })
    },
    // 中间扫码按钮 - 直接跳转扫码页（switchTab）
    onScan() {
      wx.switchTab({ url: '/pages/scan/scan' })
    }
  }
})
