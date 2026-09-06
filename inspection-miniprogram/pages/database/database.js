// pages/database/database.js
const { database, TABLE_SCHEMAS } = require('../../utils/database')
const { toast, confirm, showLoading, hideLoading } = require('../../utils/util')

Page({
  data: {
    activeTab: 'tables',
    tabs: [
      { value: 'tables', label: '数据表' },
      { value: 'query', label: 'SQL查询' },
      { value: 'import', label: '导入导出' },
      { value: 'config', label: '连接配置' },
      { value: 'stats', label: '统计' }
    ],
    // 表列表
    tableList: [],
    selectedTable: null,
    tableSchema: null,
    // 表数据浏览
    tableData: null,
    currentPage: 1,
    pageSize: 10,
    searchKeyword: '',
    dataLoading: false,
    // 编辑记录
    showEditModal: false,
    editMode: 'add', // add | edit
    editRecord: {},
    editFields: [],
    // SQL查询
    sqlInput: '',
    queryResult: null,
    queryHistory: [],
    queryLoading: false,
    // 导入导出
    importTable: '',
    importText: '',
    importResult: null,
    // 配置
    dbConfig: {},
    testing: false,
    connectionResult: null,
    // 统计
    dbStats: null
  },

  onLoad() {
    this.loadTables()
    this.loadConfig()
    this.loadStats()
    this.loadHistory()
  },

  // ========== 表列表 ==========
  async loadTables() {
    const res = await database.getTables()
    this.setData({ tableList: res })
  },

  async onSelectTable(e) {
    const tableName = e.currentTarget.dataset.name
    const res = await database.getTableSchema(tableName)
    if (res.code === 0) {
      this.setData({ selectedTable: tableName, tableSchema: res.data })
      this.loadTableData(tableName, 1)
    }
  },

  // ========== 表数据浏览 ==========
  async loadTableData(tableName, page = 1) {
    this.setData({ dataLoading: true, currentPage: page })
    const res = await database.getTableData(tableName, page, this.data.pageSize, this.data.searchKeyword)
    if (res.code === 0) {
      this.setData({ tableData: res.data, dataLoading: false })
    } else {
      this.setData({ dataLoading: false })
      toast(res.msg || '加载失败')
    }
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  onSearchConfirm() {
    if (this.data.selectedTable) {
      this.loadTableData(this.data.selectedTable, 1)
    }
  },

  onClearSearch() {
    this.setData({ searchKeyword: '' })
    if (this.data.selectedTable) {
      this.loadTableData(this.data.selectedTable, 1)
    }
  },

  onPageChange(e) {
    const page = e.currentTarget.dataset.page
    if (page < 1 || page > this.data.tableData.totalPages) return
    this.loadTableData(this.data.selectedTable, page)
  },

  // ========== 新增/编辑记录 ==========
  onAddRecord() {
    if (!this.data.selectedTable) return toast('请先选择数据表')
    const schema = TABLE_SCHEMAS[this.data.selectedTable]
    if (!schema) return
    const editFields = schema.columns.filter(c => !c.autoIncrement)
    const record = {}
    editFields.forEach(f => { record[f.name] = '' })
    this.setData({
      showEditModal: true,
      editMode: 'add',
      editRecord: record,
      editFields
    })
  },

  onEditRecord(e) {
    const rowIndex = e.currentTarget.dataset.index
    if (!this.data.tableData || !this.data.tableData.rows) return
    const record = { ...this.data.tableData.rows[rowIndex] }
    const schema = TABLE_SCHEMAS[this.data.selectedTable]
    const editFields = schema.columns
    this.setData({
      showEditModal: true,
      editMode: 'edit',
      editRecord: record,
      editFields
    })
  },

  onEditInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['editRecord.' + field]: e.detail.value })
  },

  async onSaveRecord() {
    const { selectedTable, editMode, editRecord, editFields } = this.data
    showLoading('保存中...')
    try {
      let res
      if (editMode === 'add') {
        res = await database.insertRecord(selectedTable, editRecord)
      } else {
        const pkCol = editFields.find(f => f.pk)
        const pkName = pkCol ? pkCol.name : 'id'
        res = await database.updateRecord(selectedTable, editRecord, editRecord[pkName])
      }
      if (res.code === 0) {
        toast('保存成功', 'success')
        this.setData({ showEditModal: false })
        this.loadTableData(selectedTable, this.data.currentPage)
        this.loadTables()
        this.loadStats()
      } else {
        toast(res.msg || '保存失败')
      }
    } catch (err) {
      toast('保存失败')
    } finally {
      hideLoading()
    }
  },

  async onDeleteRecord(e) {
    const rowIndex = e.currentTarget.dataset.index
    if (!this.data.tableData || !this.data.tableData.rows) return
    const ok = await confirm('确定删除此条记录吗？此操作不可撤销。')
    if (!ok) return

    const record = this.data.tableData.rows[rowIndex]
    const schema = TABLE_SCHEMAS[this.data.selectedTable]
    const pkCol = schema.columns.find(c => c.pk)
    const pkName = pkCol ? pkCol.name : 'id'

    showLoading('删除中...')
    try {
      const res = await database.deleteRecord(this.data.selectedTable, record[pkName])
      if (res.code === 0) {
        toast('删除成功', 'success')
        this.loadTableData(this.data.selectedTable, this.data.currentPage)
        this.loadTables()
        this.loadStats()
      } else {
        toast(res.msg || '删除失败')
      }
    } catch (err) {
      toast('删除失败')
    } finally {
      hideLoading()
    }
  },

  closeEditModal() {
    this.setData({ showEditModal: false })
  },

  // ========== SQL查询 ==========
  onTabChange(e) {
    this.setData({ activeTab: e.currentTarget.dataset.value })
  },

  onSqlInput(e) {
    this.setData({ sqlInput: e.detail.value })
  },

  async onExecuteQuery() {
    const sql = this.data.sqlInput.trim()
    if (!sql) return toast('请输入SQL语句')
    
    this.setData({ queryLoading: true })
    const res = await database.executeQuery(sql)
    this.setData({ queryLoading: false })
    
    if (res.code === 0) {
      this.setData({ queryResult: res.data })
      const history = this.data.queryHistory
      history.unshift({ sql, time: new Date().toLocaleString(), rowCount: res.data.rowCount || res.data.affectedRows || 0 })
      if (history.length > 20) history.length = 20
      this.setData({ queryHistory: history })
      wx.setStorageSync('sql_history', history)
      toast('执行成功', 'success')
    } else {
      this.setData({ queryResult: null })
      toast(res.msg || '执行失败')
    }
  },

  loadHistory() {
    this.setData({ queryHistory: wx.getStorageSync('sql_history') || [] })
  },

  onUseHistory(e) {
    const sql = e.currentTarget.dataset.sql
    this.setData({ sqlInput: sql })
  },

  onClearHistory() {
    wx.removeStorageSync('sql_history')
    this.setData({ queryHistory: [] })
    toast('已清除')
  },

  // ========== 导入导出 ==========
  onImportTableChange(e) {
    this.setData({ importTable: e.detail.value })
  },

  onImportTextInput(e) {
    this.setData({ importText: e.detail.value })
  },

  async onImportCSV() {
    const { importTable, importText } = this.data
    if (!importTable) return toast('请选择目标数据表')
    if (!importText.trim()) return toast('请输入CSV数据')
    
    showLoading('导入中...')
    try {
      const res = await database.importCSV(importTable, importText)
      if (res.code === 0) {
        this.setData({ importResult: res.data })
        toast(`导入完成：成功${res.data.successCount}条，失败${res.data.failCount}条`, 'success')
        this.loadTables()
        this.loadStats()
      } else {
        toast(res.msg || '导入失败')
      }
    } catch (err) {
      toast('导入失败')
    } finally {
      hideLoading()
    }
  },

  async onExportCSV() {
    if (!this.data.selectedTable) return toast('请先在数据表Tab选择要导出的表')
    
    showLoading('导出中...')
    try {
      const res = database.exportTableToCSV(this.data.selectedTable)
      if (res.code === 0) {
        // 复制到剪贴板
        wx.setClipboardData({
          data: res.data,
          success: () => {
            toast(`已导出${res.rowCount}条数据（已复制到剪贴板）`, 'success')
          }
        })
      } else {
        toast(res.msg || '导出失败')
      }
    } catch (err) {
      toast('导出失败')
    } finally {
      hideLoading()
    }
  },

  // 选择本地文件导入
  onChooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['csv', 'txt'],
      success: (res) => {
        const file = res.tempFiles[0]
        wx.getFileSystemManager().readFile({
          filePath: file.path,
          encoding: 'utf-8',
          success: (r) => {
            this.setData({ importText: r.data })
            toast(`已读取文件：${file.name}`)
          },
          fail: () => toast('文件读取失败')
        })
      },
      fail: () => {}
    })
  },

  async onTruncateTable() {
    if (!this.data.selectedTable) return toast('请先选择数据表')
    const ok = await confirm(`确定清空 ${this.data.selectedTable} 表的所有数据吗？此操作不可撤销！`)
    if (!ok) return
    
    showLoading('清空中...')
    try {
      const res = await database.truncateTable(this.data.selectedTable)
      if (res.code === 0) {
        toast('已清空表数据', 'success')
        this.loadTableData(this.data.selectedTable, 1)
        this.loadTables()
        this.loadStats()
      } else {
        toast(res.msg || '清空失败')
      }
    } catch (err) {
      toast('清空失败')
    } finally {
      hideLoading()
    }
  },

  // ========== 配置 ==========
  loadConfig() {
    this.setData({ dbConfig: database.getConfig() })
  },

  onConfigInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ ['dbConfig.' + field]: e.detail.value })
  },

  async onTestConnection() {
    this.setData({ testing: true })
    const res = await database.testConnection(this.data.dbConfig)
    this.setData({ testing: false, connectionResult: res })
    if (res.code === 0) {
      toast('连接成功', 'success')
    } else {
      toast(res.msg || '连接失败')
    }
  },

  onSaveConfig() {
    database.saveConfig(this.data.dbConfig)
    toast('配置已保存', 'success')
  },

  // ========== 统计 ==========
  async loadStats() {
    const res = await database.getStats()
    this.setData({ dbStats: res })
  },

  // 阻止冒泡
  noop() {}
})
