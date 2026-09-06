// pages/feishu/settings/settings.js
const { account, bitable, sync, excelImport, cloud, stats } = require('../../../utils/feishu')
const { BITABLE_CONFIGS } = require('../../../utils/feishu-config')
const mock = require('../../../utils/mock')
const { toast, confirm } = require('../../../utils/util')

Page({
  data: {
    activeTab: 'overview',
    tabs: [
      { value: 'overview', label: '概览' },
      { value: 'tables', label: '多维表格' },
      { value: 'sync', label: '数据同步' },
      { value: 'cloud', label: '云盘' }
    ],
    // 概览
    overview: {},
    // 飞书表格列表
    tableList: [],
    allConfigs: [],
    // 同步日志
    syncLogs: [],
    syncing: false,
    syncingModule: '',
    syncProgress: '',
    // 云盘
    cloudFiles: [],
    cloudStats: {},
    // 账号
    accountInfo: null,
    loggedIn: false
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const overview = stats.getOverview()
    const acc = account.get()
    const tables = bitable.list()
    const allConfigs = Object.entries(BITABLE_CONFIGS).map(([key, config]) => {
      const linked = tables.find(t => t.moduleKey === key)
      return {
        moduleKey: key,
        name: config.name,
        icon: config.icon,
        description: config.description,
        fieldCount: config.fields.length,
        linked: !!linked,
        recordCount: linked ? linked.recordCount : 0,
        lastSyncTime: linked ? linked.lastSyncTime : null,
        syncStatus: linked ? linked.syncStatus : 'unlinked'
      }
    })
    const logs = sync.getLogs()
    const cloudFiles = cloud.listFiles()
    const cloudStats = cloud.getStats()

    this.setData({
      overview,
      accountInfo: acc,
      loggedIn: !!acc,
      tableList: tables,
      allConfigs,
      syncLogs: logs,
      cloudFiles,
      cloudStats
    })
  },

  // 切换Tab
  onTabChange(e) {
    this.setData({ activeTab: e.currentTarget.dataset.value })
  },

  // 飞书登录
  async onLogin() {
    wx.showLoading({ title: '登录中...', mask: true })
    const res = await account.login()
    wx.hideLoading()
    if (res.code === 0) {
      toast('飞书登录成功', 'success')
      this.loadData()
    } else {
      toast('登录失败: ' + res.msg)
    }
  },

  // 飞书退出
  async onLogout() {
    const res = await confirm('确认退出飞书账号？退出后关联的多维表格数据不会丢失。')
    if (!res) return
    await account.logout()
    toast('已退出飞书', 'success')
    this.loadData()
  },

  // 创建单个表格
  async onCreateTable(e) {
    const moduleKey = e.currentTarget.dataset.key
    if (!this.data.loggedIn) {
      toast('请先登录飞书账号')
      return
    }
    wx.showLoading({ title: '创建中...', mask: true })
    const res = await bitable.create(moduleKey)
    wx.hideLoading()
    if (res.code === 0) {
      toast('表格创建成功', 'success')
      this.loadData()
    } else {
      toast(res.msg || '创建失败')
    }
  },

  // 一键创建所有表格
  async onCreateAllTables() {
    if (!this.data.loggedIn) {
      toast('请先登录飞书账号')
      return
    }
    const res = await confirm('确认为所有功能模块创建飞书多维表格？共 ' + Object.keys(BITABLE_CONFIGS).length + ' 个表格。')
    if (!res) return
    wx.showLoading({ title: '批量创建中...', mask: true })
    const result = await bitable.createAll()
    wx.hideLoading()
    const successCount = result.data.filter(r => r.success).length
    const failCount = result.data.filter(r => !r.success).length
    toast('创建完成: 成功' + successCount + '个, 跳过' + failCount + '个', 'success')
    this.loadData()
  },

  // 删除表格
  async onDeleteTable(e) {
    const moduleKey = e.currentTarget.dataset.key
    const res = await confirm('确认删除该飞书表格？表格内的数据将一并清除。')
    if (!res) return
    await bitable.remove(moduleKey)
    toast('已删除', 'success')
    this.loadData()
  },

  // 同步单个模块
  async onSyncModule(e) {
    const moduleKey = e.currentTarget.dataset.key
    if (!this.data.loggedIn) {
      toast('请先登录飞书账号')
      return
    }
    this.setData({ syncing: true, syncingModule: moduleKey, syncProgress: '正在同步...' })

    // 获取本地mock数据
    const { MODULE_DATA_MAP } = require('../../../utils/feishu-config')
    const dataMap = MODULE_DATA_MAP[moduleKey]
    let localData = []
    if (dataMap && mock[dataMap.mockKey]) {
      localData = deepCloneArr(mock[dataMap.mockKey])
    }

    if (localData.length === 0) {
      toast('该模块暂无本地数据可同步')
      this.setData({ syncing: false, syncingModule: '' })
      return
    }

    const res = await sync.syncModule(moduleKey, localData)
    this.setData({ syncing: false, syncingModule: '', syncProgress: '' })

    if (res.code === 0) {
      const d = res.data
      toast('同步成功: 新增' + d.addCount + ' 更新' + d.updateCount, 'success')
      this.loadData()
    } else {
      toast(res.msg || '同步失败')
    }
  },

  // 一键同步所有
  async onSyncAll() {
    if (!this.data.loggedIn) {
      toast('请先登录飞书账号')
      return
    }
    const res = await confirm('确认同步所有模块数据到飞书多维表格？')
    if (!res) return

    this.setData({ syncing: true, syncProgress: '正在同步所有模块...' })
    const result = await sync.syncAll(mock)
    this.setData({ syncing: false, syncProgress: '' })

    const successCount = result.data.filter(r => r.success).length
    toast('同步完成: ' + successCount + '个模块成功', 'success')
    this.loadData()
  },

  // 从飞书拉取数据
  async onPullFromFeishu(e) {
    const moduleKey = e.currentTarget.dataset.key
    const res = await sync.pullFromFeishu(moduleKey)
    if (res.code === 0) {
      toast('拉取成功: ' + res.data.total + '条记录', 'success')
      console.log('拉取到的飞书数据', res.data.records)
    } else {
      toast(res.msg || '拉取失败')
    }
  },

  // Excel导入到飞书表格
  async onExcelImportToFeishu(e) {
    const moduleKey = e.currentTarget.dataset.key
    const tableInfo = bitable.getByModule(moduleKey)
    if (!tableInfo) {
      toast('请先创建飞书表格')
      return
    }
    // 选择文件
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['xlsx', 'xls', 'csv'],
      success: async (fileRes) => {
        const file = fileRes.tempFiles[0]
        wx.showLoading({ title: '导入飞书中...', mask: true })

        // 使用excel.js解析文件
        const { parseEquipmentExcel } = require('../../../utils/excel')
        const parseResult = await parseEquipmentExcel(file.path, file.name)

        if (!parseResult.success || parseResult.data.length === 0) {
          wx.hideLoading()
          const errMsg = parseResult.errors.length > 0 ? parseResult.errors[0].errors.join('；') : '解析失败'
          toast('导入失败: ' + errMsg)
          return
        }

        // 导入到飞书表格
        const importRes = await excelImport.importToBitable(moduleKey, parseResult.data)
        wx.hideLoading()

        if (importRes.code === 0) {
          toast('导入飞书成功: ' + importRes.data.importCount + '条', 'success')
          this.loadData()
        } else {
          toast(importRes.msg || '导入飞书失败')
        }
      },
      fail: () => {
        // 取消选择
      }
    })
  },

  // 清除同步日志
  async onClearLogs() {
    const res = await confirm('确认清除所有同步日志？')
    if (!res) return
    sync.clearLogs()
    toast('已清除', 'success')
    this.loadData()
  },

  // 上传文件到云盘
  onUploadFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: async (fileRes) => {
        const file = fileRes.tempFiles[0]
        wx.showLoading({ title: '上传中...', mask: true })
        const res = await cloud.uploadFile(file.name, file.size, file.name.split('.').pop(), file.path)
        wx.hideLoading()
        if (res.code === 0) {
          toast('上传成功', 'success')
          this.loadData()
        } else {
          toast('上传失败')
        }
      }
    })
  },

  // 删除云盘文件
  async onDeleteFile(e) {
    const fileId = e.currentTarget.dataset.id
    const res = await confirm('确认删除该文件？')
    if (!res) return
    await cloud.deleteFile(fileId)
    toast('已删除', 'success')
    this.loadData()
  },

  // 格式化时间
  formatTime(time) {
    if (!time) return '未同步'
    const d = new Date(time)
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
  }
})

// 深拷贝数组辅助
function deepCloneArr(arr) {
  return arr ? JSON.parse(JSON.stringify(arr)) : []
}
