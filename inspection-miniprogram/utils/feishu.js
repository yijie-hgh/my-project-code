// utils/feishu.js - 飞书集成核心模块
// 提供飞书账号认证、多维表格管理、数据同步、Excel导入等功能

const { BITABLE_CONFIGS, MODULE_DATA_MAP } = require('./feishu-config')
const { deepClone, uuid } = require('./util')

// ============ 存储键 ============
const STORAGE_KEYS = {
  ACCOUNT: 'feishu_account',
  BITABLES: 'feishu_bitables',
  SYNC_LOG: 'feishu_sync_log',
  CLOUD_FILES: 'feishu_cloud_files'
}

// ============ 模拟网络延迟 ============
function mockDelay(data, delay = 400) {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ code: 0, msg: 'success', data }), delay)
  })
}

// ============ 本地存储工具 ============
function getStorage(key) {
  try {
    return wx.getStorageSync(key) || null
  } catch (e) {
    return null
  }
}

function setStorage(key, data) {
  try {
    wx.setStorageSync(key, data)
  } catch (e) {
    console.error('存储失败', key, e)
  }
}

// ============ 飞书账号管理 ============
const account = {
  // 获取当前飞书账号
  get() {
    return getStorage(STORAGE_KEYS.ACCOUNT)
  },

  // 是否已登录飞书
  isLoggedIn() {
    const acc = this.get()
    return !!(acc && acc.openId && acc.accessToken)
  },

  // 登录飞书（模拟OAuth流程）
  async login() {
    const mockAccount = {
      openId: 'ou_' + uuid().substring(0, 12),
      unionId: 'on_' + uuid().substring(0, 12),
      accessToken: 'feishu_token_' + Date.now(),
      refreshToken: 'feishu_refresh_' + Date.now(),
      name: '飞书用户',
      avatar: '',
      email: 'user@feishu.cn',
      mobile: '138****8888',
      deptId: '0',
      deptName: '设备管理部门',
      loginTime: new Date().toISOString(),
      expireTime: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
    }
    setStorage(STORAGE_KEYS.ACCOUNT, mockAccount)
    return mockDelay(mockAccount)
  },

  // 退出登录
  async logout() {
    setStorage(STORAGE_KEYS.ACCOUNT, null)
    setStorage(STORAGE_KEYS.BITABLES, null)
    return mockDelay({ success: true })
  },

  // 获取账号信息
  async getInfo() {
    const acc = this.get()
    if (!acc) {
      return { code: -1, msg: '未登录飞书', data: null }
    }
    return mockDelay(acc)
  }
}

// ============ 多维表格管理 ============
const bitable = {
  // 获取所有已创建的飞书表格
  list() {
    return getStorage(STORAGE_KEYS.BITABLES) || []
  },

  // 获取指定模块的表格
  getByModule(moduleKey) {
    const tables = this.list()
    return tables.find(t => t.moduleKey === moduleKey) || null
  },

  // 创建飞书多维表格（为指定模块）
  async create(moduleKey) {
    const config = BITABLE_CONFIGS[moduleKey]
    if (!config) {
      return { code: -1, msg: '未知的模块: ' + moduleKey, data: null }
    }

    // 检查是否已存在
    const existing = this.getByModule(moduleKey)
    if (existing) {
      return { code: -1, msg: '该模块的飞书表格已存在', data: existing }
    }

    const tableInfo = {
      appToken: 'bascn' + uuid().substring(0, 16),
      tableId: 'tbl' + uuid().substring(0, 12),
      moduleKey,
      name: config.name,
      icon: config.icon,
      description: config.description,
      fields: config.fields,
      primaryKey: config.primaryKey,
      createTime: new Date().toISOString(),
      recordCount: 0,
      lastSyncTime: null,
      syncStatus: 'idle'
    }

    const tables = this.list()
    tables.push(tableInfo)
    setStorage(STORAGE_KEYS.BITABLES, tables)

    // 初始化表格记录存储
    const recordsKey = 'feishu_records_' + moduleKey
    setStorage(recordsKey, [])

    return mockDelay(tableInfo)
  },

  // 批量创建所有模块的表格
  async createAll() {
    const moduleKeys = Object.keys(BITABLE_CONFIGS)
    const results = []
    for (const key of moduleKeys) {
      const res = await this.create(key)
      results.push({ moduleKey: key, success: res.code === 0, data: res.data, msg: res.msg })
    }
    return mockDelay(results, 800)
  },

  // 删除表格
  async remove(moduleKey) {
    let tables = this.list()
    tables = tables.filter(t => t.moduleKey !== moduleKey)
    setStorage(STORAGE_KEYS.BITABLES, tables)
    // 清除记录
    const recordsKey = 'feishu_records_' + moduleKey
    try { wx.removeStorageSync(recordsKey) } catch (e) {}
    return mockDelay({ success: true })
  },

  // 获取表格记录
  getRecords(moduleKey) {
    const key = 'feishu_records_' + moduleKey
    return getStorage(key) || []
  },

  // 设置表格记录
  setRecords(moduleKey, records) {
    const key = 'feishu_records_' + moduleKey
    setStorage(key, records)
    // 更新记录数
    const tables = this.list()
    const idx = tables.findIndex(t => t.moduleKey === moduleKey)
    if (idx > -1) {
      tables[idx].recordCount = records.length
      tables[idx].lastSyncTime = new Date().toISOString()
      setStorage(STORAGE_KEYS.BITABLES, tables)
    }
  },

  // 添加单条记录
  async addRecord(moduleKey, record) {
    const config = BITABLE_CONFIGS[moduleKey]
    if (!config) return { code: -1, msg: '未知模块', data: null }

    const records = this.getRecords(moduleKey)
    const newRecord = {
      recordId: 'rec' + uuid().substring(0, 12),
      ...record,
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString()
    }
    records.push(newRecord)
    this.setRecords(moduleKey, records)
    return mockDelay(newRecord)
  },

  // 批量添加记录
  async batchAddRecords(moduleKey, dataList) {
    const config = BITABLE_CONFIGS[moduleKey]
    if (!config) return { code: -1, msg: '未知模块', data: null }

    const records = this.getRecords(moduleKey)
    let addCount = 0
    dataList.forEach(item => {
      const newRecord = {
        recordId: 'rec' + uuid().substring(0, 12),
        ...item,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString()
      }
      records.push(newRecord)
      addCount++
    })
    this.setRecords(moduleKey, records)
    return mockDelay({ success: true, addCount, total: records.length })
  },

  // 更新记录
  async updateRecord(moduleKey, recordId, updates) {
    const records = this.getRecords(moduleKey)
    const idx = records.findIndex(r => r.recordId === recordId)
    if (idx === -1) {
      return { code: -1, msg: '记录不存在', data: null }
    }
    records[idx] = { ...records[idx], ...updates, _updatedAt: new Date().toISOString() }
    this.setRecords(moduleKey, records)
    return mockDelay(records[idx])
  },

  // 删除记录
  async deleteRecord(moduleKey, recordId) {
    let records = this.getRecords(moduleKey)
    const before = records.length
    records = records.filter(r => r.recordId !== recordId)
    this.setRecords(moduleKey, records)
    return mockDelay({ success: true, deleted: before - records.length })
  },

  // 按主键查找记录
  findByPrimaryKey(moduleKey, value) {
    const config = BITABLE_CONFIGS[moduleKey]
    if (!config) return null
    const records = this.getRecords(moduleKey)
    return records.find(r => r[config.primaryKey] === value) || null
  },

  // 更新同步状态
  updateSyncStatus(moduleKey, status) {
    const tables = this.list()
    const idx = tables.findIndex(t => t.moduleKey === moduleKey)
    if (idx > -1) {
      tables[idx].syncStatus = status
      if (status === 'synced') {
        tables[idx].lastSyncTime = new Date().toISOString()
      }
      setStorage(STORAGE_KEYS.BITABLES, tables)
    }
  }
}

// ============ 数据校验引擎 ============
const validator = {
  // 校验单条记录
  validateRecord(record, config) {
    const errors = []
    config.fields.forEach(field => {
      if (field.required) {
        const val = record[field.localKey]
        if (val === undefined || val === null || val === '') {
          errors.push({ field: field.localKey, label: field.name, error: '必填字段为空' })
        }
      }
      // 类型校验
      if (field.type === 'number' && record[field.localKey] !== undefined && record[field.localKey] !== '') {
        const num = Number(record[field.localKey])
        if (isNaN(num)) {
          errors.push({ field: field.localKey, label: field.name, error: '应为数字类型' })
        }
      }
      // 日期格式校验
      if (field.type === 'date' && record[field.localKey]) {
        const val = String(record[field.localKey])
        if (!/^\d{4}-\d{2}-\d{2}/.test(val)) {
          errors.push({ field: field.localKey, label: field.name, error: '日期格式不正确' })
        }
      }
    })
    return errors
  },

  // 批量校验
  validateBatch(data, config) {
    const allErrors = []
    const validData = []
    data.forEach((item, index) => {
      const errors = this.validateRecord(item, config)
      if (errors.length > 0) {
        allErrors.push({ rowIndex: index + 1, record: item, errors })
      } else {
        validData.push(item)
      }
    })
    return {
      valid: allErrors.length === 0,
      validData,
      errorCount: allErrors.length,
      errors: allErrors
    }
  }
}

// ============ 数据同步引擎 ============
const sync = {
  // 同步单个模块数据到飞书表格
  async syncModule(moduleKey, localData) {
    const config = BITABLE_CONFIGS[moduleKey]
    if (!config) {
      return { code: -1, msg: '未知模块', data: null }
    }

    const tableInfo = bitable.getByModule(moduleKey)
    if (!tableInfo) {
      return { code: -1, msg: '该模块尚未创建飞书表格，请先创建', data: null }
    }

    // 检查飞书账号登录状态
    if (!account.isLoggedIn()) {
      return { code: -1, msg: '飞书未登录，请先登录飞书账号', data: null }
    }

    // 检查数据有效性
    if (!localData || !Array.isArray(localData) || localData.length === 0) {
      return { code: -1, msg: '无有效数据可同步', data: null }
    }

    // 数据校验
    const validation = validator.validateBatch(localData, config)
    if (validation.errorCount > 0) {
      const errorSummary = validation.errors.slice(0, 5).map(e =>
        '第' + e.rowIndex + '行: ' + e.errors.map(err => err.label + '(' + err.error + ')').join(', ')
      ).join('\n')
      return {
        code: -1,
        msg: '数据校验失败，共' + validation.errorCount + '条错误:\n' + errorSummary,
        data: { errors: validation.errors, validCount: validation.validData.length }
      }
    }

    bitable.updateSyncStatus(moduleKey, 'syncing')

    try {
      // 获取飞书侧已有记录
      const feishuRecords = bitable.getRecords(moduleKey)
      const primaryKey = config.primaryKey

      let addCount = 0
      let updateCount = 0
      let skipCount = 0
      const syncErrors = []

      // 遍历本地数据，与飞书记录比对
      validation.validData.forEach((localItem, idx) => {
        try {
          // 映射字段
          const mappedRecord = {}
          config.fields.forEach(field => {
            if (field.localKey && localItem[field.localKey] !== undefined) {
              let value = localItem[field.localKey]
              // 处理数组/对象类型字段（转为JSON字符串）
              if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
                value = JSON.stringify(value)
              }
              // 安全处理：截断超长字段
              if (typeof value === 'string' && value.length > 5000) {
                value = value.substring(0, 5000)
              }
              mappedRecord[field.localKey] = value
            }
          })

          // 按主键查找是否已存在
          const localIdVal = localItem[primaryKey] || localItem.id
          const existing = feishuRecords.find(r => r[primaryKey] == localIdVal || r.id == localIdVal)

          if (existing) {
            Object.assign(existing, mappedRecord, { _updatedAt: new Date().toISOString() })
            updateCount++
          } else {
            feishuRecords.push({
              recordId: 'rec' + uuid().substring(0, 12),
              ...mappedRecord,
              _createdAt: new Date().toISOString(),
              _updatedAt: new Date().toISOString()
            })
            addCount++
          }
        } catch (err) {
          syncErrors.push({ rowIndex: idx + 1, error: err.message })
          skipCount++
        }
      })

      bitable.setRecords(moduleKey, feishuRecords)
      bitable.updateSyncStatus(moduleKey, 'synced')

      const syncResult = {
        moduleKey,
        moduleName: config.name,
        addCount,
        updateCount,
        skipCount,
        totalRemote: feishuRecords.length,
        totalLocal: localData.length,
        syncErrors,
        syncTime: new Date().toISOString(),
        success: syncErrors.length === 0
      }

      // 记录同步日志
      this.addLog(syncResult)

      return mockDelay(syncResult)
    } catch (err) {
      bitable.updateSyncStatus(moduleKey, 'error')
      console.error('同步失败', moduleKey, err)
      return { code: -1, msg: '同步失败: ' + (err.message || '未知错误'), data: null }
    }
  },

  // 同步所有模块
  async syncAll(mockData) {
    const moduleKeys = Object.keys(BITABLE_CONFIGS)
    const results = []
    let totalAdd = 0
    let totalUpdate = 0
    let totalErrors = 0

    for (const key of moduleKeys) {
      const dataMap = MODULE_DATA_MAP[key]
      if (!dataMap || !mockData[dataMap.mockKey]) {
        results.push({ moduleKey: key, success: false, msg: '无对应本地数据' })
        continue
      }
      const localData = mockData[dataMap.mockKey]
      const res = await this.syncModule(key, localData)
      const success = res.code === 0
      if (success) {
        totalAdd += res.data.addCount || 0
        totalUpdate += res.data.updateCount || 0
        totalErrors += res.data.syncErrors ? res.data.syncErrors.length : 0
      } else {
        totalErrors++
      }
      results.push({
        moduleKey: key,
        moduleName: BITABLE_CONFIGS[key].name,
        success,
        data: res.data,
        msg: res.msg
      })
    }

    return mockDelay({
      results,
      summary: {
        totalModules: moduleKeys.length,
        successModules: results.filter(r => r.success).length,
        totalAdd,
        totalUpdate,
        totalErrors
      }
    }, 1000)
  },

  // 从飞书表格拉取数据到本地
  async pullFromFeishu(moduleKey) {
    const config = BITABLE_CONFIGS[moduleKey]
    if (!config) return { code: -1, msg: '未知模块', data: null }

    const tableInfo = bitable.getByModule(moduleKey)
    if (!tableInfo) {
      return { code: -1, msg: '该模块尚未创建飞书表格', data: null }
    }

    const records = bitable.getRecords(moduleKey)
    const pullErrors = []

    // 将飞书记录反向映射为本地数据格式
    const localData = records.map((record, idx) => {
      try {
        const item = {}
        config.fields.forEach(field => {
          if (field.localKey && record[field.localKey] !== undefined) {
            let value = record[field.localKey]
            // 尝试还原JSON字段
            if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
              try { value = JSON.parse(value) } catch (e) {}
            }
            item[field.localKey] = value
          }
        })
        return item
      } catch (err) {
        pullErrors.push({ rowIndex: idx + 1, error: err.message })
        return null
      }
    }).filter(item => item !== null)

    return mockDelay({
      records: localData,
      total: localData.length,
      errors: pullErrors
    })
  },

  // 添加同步日志
  addLog(logEntry) {
    const logs = getStorage(STORAGE_KEYS.SYNC_LOG) || []
    logs.unshift({
      ...logEntry,
      id: uuid()
    })
    // 保留最近50条
    if (logs.length > 50) logs.length = 50
    setStorage(STORAGE_KEYS.SYNC_LOG, logs)
  },

  // 获取同步日志
  getLogs() {
    return getStorage(STORAGE_KEYS.SYNC_LOG) || []
  },

  // 清除同步日志
  clearLogs() {
    setStorage(STORAGE_KEYS.SYNC_LOG, [])
  }
}

// 辅助函数：根据主键名获取 localKey
function fieldLookup(primaryKeyName, config) {
  const field = config.fields.find(f => f.name === primaryKeyName || f.localKey === primaryKeyName)
  return field ? field.localKey : 'id'
}

// ============ Excel 导入到飞书多维表格 ============
const excelImport = {
  // 将解析后的Excel数据导入到飞书多维表格
  async importToBitable(moduleKey, data) {
    const config = BITABLE_CONFIGS[moduleKey]
    if (!config) {
      return { code: -1, msg: '未知模块', data: null }
    }

    const tableInfo = bitable.getByModule(moduleKey)
    if (!tableInfo) {
      return { code: -1, msg: '该模块尚未创建飞书表格', data: null }
    }

    if (!data || data.length === 0) {
      return { code: -1, msg: '没有可导入的数据', data: null }
    }

    // 将数据映射为飞书表格记录格式
    const records = data.map(item => {
      const record = {}
      config.fields.forEach(field => {
        if (field.localKey && item[field.localKey] !== undefined) {
          let value = item[field.localKey]
          if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
            value = JSON.stringify(value)
          }
          record[field.localKey] = value
        }
      })
      return {
        recordId: 'rec' + uuid().substring(0, 12),
        ...record,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString()
      }
    })

    // 合并到已有记录（去重：按主键）
    const existingRecords = bitable.getRecords(moduleKey)
    const primaryKey = config.primaryKey
    const existingKeys = new Set()

    // 更新已有记录
    records.forEach(newRec => {
      const existIdx = existingRecords.findIndex(r => r[primaryKey] == newRec[primaryKey])
      if (existIdx > -1) {
        existingRecords[existIdx] = { ...existingRecords[existIdx], ...newRec }
      } else {
        existingRecords.push(newRec)
      }
    })

    bitable.setRecords(moduleKey, existingRecords)
    bitable.updateSyncStatus(moduleKey, 'synced')

    const result = {
      moduleKey,
      moduleName: config.name,
      importCount: records.length,
      totalRecords: existingRecords.length,
      importTime: new Date().toISOString()
    }

    sync.addLog({
      ...result,
      type: 'excel_import'
    })

    return mockDelay(result)
  }
}

// ============ 云盘存储 ============
const cloud = {
  // 获取云盘文件列表
  listFiles() {
    return getStorage(STORAGE_KEYS.CLOUD_FILES) || []
  },

  // 上传文件到云盘
  async uploadFile(fileName, fileSize, fileType, localPath) {
    const files = this.listFiles()
    const file = {
      id: uuid(),
      name: fileName,
      size: fileSize,
      type: fileType,
      localPath,
      cloudPath: '/inspection/' + fileName,
      uploadTime: new Date().toISOString(),
      status: 'uploaded'
    }
    files.unshift(file)
    setStorage(STORAGE_KEYS.CLOUD_FILES, files)
    return mockDelay(file)
  },

  // 删除云盘文件
  async deleteFile(fileId) {
    let files = this.listFiles()
    files = files.filter(f => f.id !== fileId)
    setStorage(STORAGE_KEYS.CLOUD_FILES, files)
    return mockDelay({ success: true })
  },

  // 获取云盘统计
  getStats() {
    const files = this.listFiles()
    const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0)
    return {
      totalFiles: files.length,
      totalSize,
      totalSizeText: formatFileSize(totalSize),
      byType: groupByType(files)
    }
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + 'GB'
}

function groupByType(files) {
  const groups = {}
  files.forEach(f => {
    const type = f.type || 'other'
    if (!groups[type]) groups[type] = { count: 0, size: 0 }
    groups[type].count++
    groups[type].size += f.size || 0
  })
  return groups
}

// ============ 统计信息 ============
const stats = {
  // 获取飞书集成概览
  getOverview() {
    const acc = account.get()
    const tables = bitable.list()
    const logs = sync.getLogs()
    const cloudStats = cloud.getStats()

    const moduleCount = Object.keys(BITABLE_CONFIGS).length
    const linkedCount = tables.length
    const totalRecords = tables.reduce((sum, t) => sum + (t.recordCount || 0), 0)
    const syncedToday = logs.filter(l => {
      const today = new Date().toDateString()
      return new Date(l.syncTime || l.importTime).toDateString() === today
    }).length

    return {
      loggedIn: !!acc,
      account: acc,
      moduleCount,
      linkedCount,
      unlinkedCount: moduleCount - linkedCount,
      totalRecords,
      syncedToday,
      syncLogCount: logs.length,
      cloudFileCount: cloudStats.totalFiles,
      cloudTotalSize: cloudStats.totalSizeText,
      tables: tables.map(t => ({
        moduleKey: t.moduleKey,
        name: t.name,
        icon: t.icon,
        recordCount: t.recordCount,
        lastSyncTime: t.lastSyncTime,
        syncStatus: t.syncStatus
      }))
    }
  }
}

// ============ 统一导出 ============
module.exports = {
  STORAGE_KEYS,
  account,
  bitable,
  sync,
  excelImport,
  cloud,
  stats
}
