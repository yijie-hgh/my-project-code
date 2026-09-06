// utils/database.js - 数据库管理模块
// 提供MySQL数据库连接管理、表结构查看、数据查询、数据浏览、增删改查等功能

const { uuid } = require('./util')

// ============ 数据库连接配置 ============
const DEFAULT_CONFIG = {
  host: 'localhost',
  port: 3306,
  database: 'inspection_db',
  username: 'root',
  password: '***',
  charset: 'utf8mb4',
  poolSize: 10,
  timeout: 5000
}

// ============ 数据库表结构定义 ============
const TABLE_SCHEMAS = {
  sys_user: {
    comment: '用户信息表',
    columns: [
      { name: 'user_id', type: 'bigint', pk: true, autoIncrement: true, comment: '用户ID' },
      { name: 'dept_id', type: 'bigint', comment: '部门ID' },
      { name: 'user_name', type: 'varchar(30)', comment: '用户名' },
      { name: 'nick_name', type: 'varchar(30)', comment: '昵称' },
      { name: 'email', type: 'varchar(50)', comment: '邮箱' },
      { name: 'phonenumber', type: 'varchar(11)', comment: '手机号' },
      { name: 'sex', type: 'char(1)', comment: '性别' },
      { name: 'password', type: 'varchar(100)', comment: '密码' },
      { name: 'status', type: 'char(1)', comment: '状态(0正常 1停用)' },
      { name: 'wx_openid', type: 'varchar(64)', comment: '微信OpenID' },
      { name: 'feishu_openid', type: 'varchar(64)', comment: '飞书OpenID' },
      { name: 'role_id', type: 'varchar(20)', comment: '角色ID' },
      { name: 'create_time', type: 'datetime', comment: '创建时间' },
      { name: 'update_time', type: 'datetime', comment: '更新时间' }
    ]
  },
  sys_role: {
    comment: '角色表',
    columns: [
      { name: 'role_id', type: 'bigint', pk: true, autoIncrement: true, comment: '角色ID' },
      { name: 'role_name', type: 'varchar(30)', comment: '角色名称' },
      { name: 'role_key', type: 'varchar(100)', comment: '角色权限字符串' },
      { name: 'role_sort', type: 'int', comment: '排序' },
      { name: 'data_scope', type: 'char(1)', comment: '数据范围' },
      { name: 'status', type: 'char(1)', comment: '状态' },
      { name: 'create_time', type: 'datetime', comment: '创建时间' }
    ]
  },
  equipment: {
    comment: '设备档案表',
    columns: [
      { name: 'id', type: 'bigint', pk: true, autoIncrement: true, comment: '设备ID' },
      { name: 'equip_code', type: 'varchar(50)', comment: '设备编码' },
      { name: 'equip_name', type: 'varchar(100)', comment: '设备名称' },
      { name: 'equip_type', type: 'varchar(50)', comment: '设备类型' },
      { name: 'equip_category', type: 'varchar(50)', comment: '设备类别' },
      { name: 'status', type: 'char(1)', comment: '设备状态' },
      { name: 'spec', type: 'varchar(200)', comment: '规格型号' },
      { name: 'workshop', type: 'varchar(50)', comment: '所属车间' },
      { name: 'location', type: 'varchar(100)', comment: '安装位置' },
      { name: 'manager', type: 'varchar(30)', comment: '负责人' },
      { name: 'manager_phone', type: 'varchar(11)', comment: '联系电话' },
      { name: 'manufacturer', type: 'varchar(100)', comment: '生产厂家' },
      { name: 'supplier', type: 'varchar(100)', comment: '供应商' },
      { name: 'purchase_date', type: 'date', comment: '购置日期' },
      { name: 'start_date', type: 'date', comment: '启用日期' },
      { name: 'calibration_cycle', type: 'int', comment: '校验周期(天)' },
      { name: 'calibration_date', type: 'date', comment: '上次校验日期' },
      { name: 'calibration_expire', type: 'date', comment: '校验到期' },
      { name: 'qrcode', type: 'varchar(50)', comment: '二维码' },
      { name: 'nfc_tag', type: 'varchar(50)', comment: 'NFC标签' },
      { name: 'create_time', type: 'datetime', comment: '创建时间' },
      { name: 'update_time', type: 'datetime', comment: '更新时间' }
    ]
  },
  inspection_project: {
    comment: '巡检项目表',
    columns: [
      { name: 'id', type: 'bigint', pk: true, autoIncrement: true, comment: '项目ID' },
      { name: 'project_name', type: 'varchar(100)', comment: '项目名称' },
      { name: 'project_desc', type: 'varchar(500)', comment: '项目描述' },
      { name: 'status', type: 'char(1)', comment: '状态' },
      { name: 'point_count', type: 'int', comment: '巡检点数量' },
      { name: 'create_time', type: 'datetime', comment: '创建时间' }
    ]
  },
  inspection_point: {
    comment: '巡检点表',
    columns: [
      { name: 'id', type: 'bigint', pk: true, autoIncrement: true, comment: '巡检点ID' },
      { name: 'project_id', type: 'bigint', comment: '项目ID' },
      { name: 'point_name', type: 'varchar(100)', comment: '巡检点名称' },
      { name: 'location', type: 'varchar(200)', comment: '位置' },
      { name: 'check_items', type: 'int', comment: '检查项数量' },
      { name: 'qrcode', type: 'varchar(50)', comment: '二维码' },
      { name: 'nfc_tag', type: 'varchar(50)', comment: 'NFC标签' },
      { name: 'status', type: 'char(1)', comment: '状态' },
      { name: 'create_time', type: 'datetime', comment: '创建时间' }
    ]
  },
  inspection_task: {
    comment: '巡检任务表',
    columns: [
      { name: 'id', type: 'bigint', pk: true, autoIncrement: true, comment: '任务ID' },
      { name: 'task_no', type: 'varchar(30)', comment: '任务编号' },
      { name: 'task_name', type: 'varchar(100)', comment: '任务名称' },
      { name: 'project_id', type: 'bigint', comment: '项目ID' },
      { name: 'status', type: 'char(1)', comment: '任务状态' },
      { name: 'inspector_id', type: 'bigint', comment: '巡检人ID' },
      { name: 'inspector_name', type: 'varchar(30)', comment: '巡检人' },
      { name: 'inspect_time', type: 'datetime', comment: '巡检时间' },
      { name: 'deadline', type: 'datetime', comment: '截止时间' },
      { name: 'finish_time', type: 'datetime', comment: '完成时间' },
      { name: 'create_time', type: 'datetime', comment: '创建时间' }
    ]
  },
  inspection_record: {
    comment: '巡检记录表',
    columns: [
      { name: 'id', type: 'bigint', pk: true, autoIncrement: true, comment: '记录ID' },
      { name: 'task_id', type: 'bigint', comment: '任务ID' },
      { name: 'point_id', type: 'bigint', comment: '巡检点ID' },
      { name: 'inspector_name', type: 'varchar(30)', comment: '巡检人' },
      { name: 'inspect_time', type: 'datetime', comment: '巡检时间' },
      { name: 'check_in_type', type: 'varchar(10)', comment: '签到方式' },
      { name: 'result', type: 'varchar(10)', comment: '巡检结果' },
      { name: 'photos', type: 'text', comment: '照片URL(JSON)' },
      { name: 'remark', type: 'text', comment: '备注' },
      { name: 'create_time', type: 'datetime', comment: '创建时间' }
    ]
  },
  spot_check_template: {
    comment: '点检模板表',
    columns: [
      { name: 'id', type: 'bigint', pk: true, autoIncrement: true, comment: '模板ID' },
      { name: 'template_name', type: 'varchar(100)', comment: '模板名称' },
      { name: 'equip_type', type: 'varchar(50)', comment: '适用设备类型' },
      { name: 'item_count', type: 'int', comment: '点检项数量' },
      { name: 'check_cycle', type: 'varchar(20)', comment: '点检周期' },
      { name: 'status', type: 'char(1)', comment: '状态' },
      { name: 'create_time', type: 'datetime', comment: '创建时间' }
    ]
  },
  spot_check_item: {
    comment: '点检项表',
    columns: [
      { name: 'id', type: 'bigint', pk: true, autoIncrement: true, comment: '点检项ID' },
      { name: 'template_id', type: 'bigint', comment: '模板ID' },
      { name: 'item_name', type: 'varchar(100)', comment: '点检项名称' },
      { name: 'item_desc', type: 'varchar(500)', comment: '点检说明' },
      { name: 'standard_value', type: 'varchar(100)', comment: '标准值' },
      { name: 'unit', type: 'varchar(20)', comment: '单位' },
      { name: 'check_method', type: 'varchar(50)', comment: '检查方法' },
      { name: 'is_key', type: 'char(1)', comment: '是否关键项' },
      { name: 'sort_order', type: 'int', comment: '排序' },
      { name: 'create_time', type: 'datetime', comment: '创建时间' }
    ]
  },
  spot_check_record: {
    comment: '点检记录表',
    columns: [
      { name: 'id', type: 'bigint', pk: true, autoIncrement: true, comment: '记录ID' },
      { name: 'equip_id', type: 'bigint', comment: '设备ID' },
      { name: 'equip_code', type: 'varchar(50)', comment: '设备编码' },
      { name: 'equip_name', type: 'varchar(100)', comment: '设备名称' },
      { name: 'template_id', type: 'bigint', comment: '模板ID' },
      { name: 'checker', type: 'varchar(30)', comment: '点检人' },
      { name: 'check_time', type: 'datetime', comment: '点检时间' },
      { name: 'result', type: 'varchar(10)', comment: '点检结果' },
      { name: 'abnormal_count', type: 'int', comment: '异常项数' },
      { name: 'items_detail', type: 'text', comment: '点检项明细(JSON)' },
      { name: 'remark', type: 'text', comment: '备注' },
      { name: 'create_time', type: 'datetime', comment: '创建时间' }
    ]
  },
  repair_order: {
    comment: '报修维修表',
    columns: [
      { name: 'id', type: 'bigint', pk: true, autoIncrement: true, comment: '维修单ID' },
      { name: 'repair_no', type: 'varchar(30)', comment: '报修单号' },
      { name: 'equip_id', type: 'bigint', comment: '设备ID' },
      { name: 'equip_name', type: 'varchar(100)', comment: '设备名称' },
      { name: 'title', type: 'varchar(200)', comment: '报修标题' },
      { name: 'description', type: 'text', comment: '故障描述' },
      { name: 'fault_type', type: 'varchar(30)', comment: '故障类型' },
      { name: 'level', type: 'char(1)', comment: '紧急程度' },
      { name: 'status', type: 'char(1)', comment: '维修状态' },
      { name: 'reporter', type: 'varchar(30)', comment: '报修人' },
      { name: 'reporter_phone', type: 'varchar(11)', comment: '报修电话' },
      { name: 'repairer', type: 'varchar(30)', comment: '维修人' },
      { name: 'cost', type: 'decimal(10,2)', comment: '维修费用' },
      { name: 'create_time', type: 'datetime', comment: '创建时间' },
      { name: 'finish_time', type: 'datetime', comment: '完成时间' }
    ]
  },
  spare_part: {
    comment: '备件表',
    columns: [
      { name: 'id', type: 'bigint', pk: true, autoIncrement: true, comment: '备件ID' },
      { name: 'part_code', type: 'varchar(50)', comment: '备件编码' },
      { name: 'part_name', type: 'varchar(100)', comment: '备件名称' },
      { name: 'category', type: 'varchar(30)', comment: '分类' },
      { name: 'brand', type: 'varchar(50)', comment: '品牌' },
      { name: 'spec', type: 'varchar(100)', comment: '规格型号' },
      { name: 'unit', type: 'varchar(10)', comment: '单位' },
      { name: 'stock', type: 'int', comment: '当前库存' },
      { name: 'min_stock', type: 'int', comment: '最低库存' },
      { name: 'max_stock', type: 'int', comment: '最高库存' },
      { name: 'unit_price', type: 'decimal(10,2)', comment: '单价' },
      { name: 'supplier', type: 'varchar(100)', comment: '供应商' },
      { name: 'location', type: 'varchar(50)', comment: '存放位置' },
      { name: 'status', type: 'varchar(10)', comment: '库存状态' },
      { name: 'create_time', type: 'datetime', comment: '创建时间' }
    ]
  },
  spare_part_log: {
    comment: '备件出入库记录表',
    columns: [
      { name: 'id', type: 'bigint', pk: true, autoIncrement: true, comment: '记录ID' },
      { name: 'part_id', type: 'bigint', comment: '备件ID' },
      { name: 'part_code', type: 'varchar(50)', comment: '备件编码' },
      { name: 'part_name', type: 'varchar(100)', comment: '备件名称' },
      { name: 'operate_type', type: 'varchar(10)', comment: '操作类型' },
      { name: 'quantity', type: 'int', comment: '数量' },
      { name: 'operator', type: 'varchar(30)', comment: '操作人' },
      { name: 'operate_time', type: 'datetime', comment: '操作时间' },
      { name: 'related_order', type: 'varchar(30)', comment: '关联单号' },
      { name: 'remark', type: 'text', comment: '备注' },
      { name: 'create_time', type: 'datetime', comment: '创建时间' }
    ]
  },
  maintain_order: {
    comment: '维护保养表',
    columns: [
      { name: 'id', type: 'bigint', pk: true, autoIncrement: true, comment: '保养单ID' },
      { name: 'maintain_no', type: 'varchar(30)', comment: '保养单号' },
      { name: 'equip_id', type: 'bigint', comment: '设备ID' },
      { name: 'equip_name', type: 'varchar(100)', comment: '设备名称' },
      { name: 'type', type: 'varchar(30)', comment: '保养类型' },
      { name: 'maintainer', type: 'varchar(30)', comment: '保养人' },
      { name: 'status', type: 'char(1)', comment: '保养状态' },
      { name: 'plan_date', type: 'date', comment: '计划日期' },
      { name: 'finish_time', type: 'datetime', comment: '完成时间' },
      { name: 'cost', type: 'decimal(10,2)', comment: '保养费用' },
      { name: 'content', type: 'text', comment: '保养内容' },
      { name: 'create_time', type: 'datetime', comment: '创建时间' }
    ]
  },
  event_record: {
    comment: '事件管理表',
    columns: [
      { name: 'id', type: 'bigint', pk: true, autoIncrement: true, comment: '事件ID' },
      { name: 'title', type: 'varchar(200)', comment: '事件标题' },
      { name: 'point_id', type: 'bigint', comment: '巡检点ID' },
      { name: 'point_name', type: 'varchar(100)', comment: '巡检点名称' },
      { name: 'level', type: 'char(1)', comment: '事件级别' },
      { name: 'status', type: 'char(1)', comment: '事件状态' },
      { name: 'description', type: 'text', comment: '事件描述' },
      { name: 'handler_name', type: 'varchar(30)', comment: '处理人' },
      { name: 'create_time', type: 'datetime', comment: '创建时间' },
      { name: 'finish_time', type: 'datetime', comment: '完成时间' }
    ]
  },
  audit_log: {
    comment: '操作审计日志表',
    columns: [
      { name: 'id', type: 'bigint', pk: true, autoIncrement: true, comment: '日志ID' },
      { name: 'user_name', type: 'varchar(30)', comment: '操作用户' },
      { name: 'action', type: 'varchar(50)', comment: '操作动作' },
      { name: 'module', type: 'varchar(30)', comment: '操作模块' },
      { name: 'detail', type: 'text', comment: '操作详情' },
      { name: 'ip', type: 'varchar(50)', comment: 'IP地址' },
      { name: 'create_time', type: 'datetime', comment: '操作时间' }
    ]
  },
  notification_msg: {
    comment: '消息通知表',
    columns: [
      { name: 'id', type: 'bigint', pk: true, autoIncrement: true, comment: '消息ID' },
      { name: 'msg_type', type: 'varchar(30)', comment: '消息类型' },
      { name: 'title', type: 'varchar(200)', comment: '消息标题' },
      { name: 'content', type: 'text', comment: '消息内容' },
      { name: 'to_user', type: 'varchar(30)', comment: '接收人' },
      { name: 'read_status', type: 'char(1)', comment: '阅读状态' },
      { name: 'push_channel', type: 'varchar(20)', comment: '推送渠道' },
      { name: 'create_time', type: 'datetime', comment: '创建时间' }
    ]
  },
  feishu_bitable: {
    comment: '飞书多维表格关联表',
    columns: [
      { name: 'id', type: 'bigint', pk: true, autoIncrement: true, comment: 'ID' },
      { name: 'module_key', type: 'varchar(50)', comment: '模块标识' },
      { name: 'app_token', type: 'varchar(64)', comment: '飞书AppToken' },
      { name: 'table_id', type: 'varchar(64)', comment: '飞书TableID' },
      { name: 'sync_status', type: 'varchar(20)', comment: '同步状态' },
      { name: 'last_sync_time', type: 'datetime', comment: '最后同步时间' },
      { name: 'record_count', type: 'int', comment: '记录数' },
      { name: 'create_time', type: 'datetime', comment: '创建时间' }
    ]
  }
}

// ============ 模拟数据存储 ============
const DATA_STORAGE_PREFIX = 'db_data_'

// ============ 数据库管理 ============
const STORAGE_KEY = 'db_config'

const database = {
  // 获取数据库配置
  getConfig() {
    return wx.getStorageSync(STORAGE_KEY) || { ...DEFAULT_CONFIG, password: '***' }
  },

  // 保存数据库配置
  saveConfig(config) {
    wx.setStorageSync(STORAGE_KEY, config)
    return config
  },

  // 测试连接
  async testConnection(config) {
    await new Promise(r => setTimeout(r, 800))
    if (!config.host) return { code: -1, msg: '数据库地址不能为空' }
    if (!config.database) return { code: -1, msg: '数据库名称不能为空' }
    return { 
      code: 0, 
      msg: '连接成功', 
      data: { 
        version: 'MySQL 8.0.35', 
        uptime: '32天5小时', 
        connections: 5,
        charset: 'utf8mb4',
        collation: 'utf8mb4_general_ci'
      } 
    }
  },

  // 获取所有表
  async getTables() {
    await new Promise(r => setTimeout(r, 300))
    return Object.entries(TABLE_SCHEMAS).map(([name, schema]) => ({
      name,
      comment: schema.comment,
      columnCount: schema.columns.length,
      pk: schema.columns.find(c => c.pk)?.name || 'id',
      rowCount: this.getTableRowCount(name)
    }))
  },

  // 获取表记录数
  getTableRowCount(tableName) {
    const data = wx.getStorageSync(DATA_STORAGE_PREFIX + tableName)
    return data ? data.length : Math.floor(Math.random() * 500 + 50)
  },

  // 获取表结构
  async getTableSchema(tableName) {
    await new Promise(r => setTimeout(r, 200))
    const schema = TABLE_SCHEMAS[tableName]
    if (!schema) return { code: -1, msg: '表不存在', data: null }
    return { code: 0, msg: 'success', data: { name: tableName, ...schema } }
  },

  // 获取表数据（分页）
  async getTableData(tableName, page = 1, pageSize = 10, condition = '') {
    await new Promise(r => setTimeout(r, 300))
    const schema = TABLE_SCHEMAS[tableName]
    if (!schema) return { code: -1, msg: '表不存在', data: null }

    let allData = this.getTableDataStorage(tableName, schema)
    
    // 简单的条件过滤
    if (condition) {
      const lowerCond = condition.toLowerCase()
      allData = allData.filter(row => {
        return Object.values(row).some(val => 
          String(val).toLowerCase().indexOf(lowerCond) > -1
        )
      })
    }

    const total = allData.length
    const start = (page - 1) * pageSize
    const rows = allData.slice(start, start + pageSize)

    return {
      code: 0,
      msg: 'success',
      data: {
        tableName,
        columns: schema.columns.map(c => c.name),
        columnInfo: schema.columns,
        rows,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  },

  // 获取表数据存储（初始化模拟数据）
  getTableDataStorage(tableName, schema) {
    const storageKey = DATA_STORAGE_PREFIX + tableName
    let data = wx.getStorageSync(storageKey)
    if (!data || !Array.isArray(data)) {
      data = this.generateMockRows(tableName, schema, 25)
      wx.setStorageSync(storageKey, data)
    }
    return data
  },

  // 保存表数据
  saveTableData(tableName, data) {
    wx.setStorageSync(DATA_STORAGE_PREFIX + tableName, data)
  },

  // 新增记录
  async insertRecord(tableName, record) {
    await new Promise(r => setTimeout(r, 200))
    const schema = TABLE_SCHEMAS[tableName]
    if (!schema) return { code: -1, msg: '表不存在' }

    const data = this.getTableDataStorage(tableName, schema)
    const pkCol = schema.columns.find(c => c.pk)
    if (pkCol && pkCol.autoIncrement) {
      record[pkCol.name] = data.length > 0 
        ? (Number(data[data.length - 1][pkCol.name]) || 0) + 1 
        : 1
    }
    record.create_time = new Date().toLocaleString()
    if (schema.columns.find(c => c.name === 'update_time')) {
      record.update_time = new Date().toLocaleString()
    }
    data.push(record)
    this.saveTableData(tableName, data)
    return { code: 0, msg: '插入成功', data: { record, affectedRows: 1 } }
  },

  // 更新记录
  async updateRecord(tableName, record, pkValue) {
    await new Promise(r => setTimeout(r, 200))
    const schema = TABLE_SCHEMAS[tableName]
    if (!schema) return { code: -1, msg: '表不存在' }

    const pkCol = schema.columns.find(c => c.pk)
    const pkName = pkCol ? pkCol.name : 'id'
    const data = this.getTableDataStorage(tableName, schema)
    const idx = data.findIndex(r => String(r[pkName]) === String(pkValue))
    if (idx === -1) return { code: -1, msg: '记录不存在' }

    if (schema.columns.find(c => c.name === 'update_time')) {
      record.update_time = new Date().toLocaleString()
    }
    data[idx] = { ...data[idx], ...record }
    this.saveTableData(tableName, data)
    return { code: 0, msg: '更新成功', data: { record: data[idx], affectedRows: 1 } }
  },

  // 删除记录
  async deleteRecord(tableName, pkValue) {
    await new Promise(r => setTimeout(r, 200))
    const schema = TABLE_SCHEMAS[tableName]
    if (!schema) return { code: -1, msg: '表不存在' }

    const pkCol = schema.columns.find(c => c.pk)
    const pkName = pkCol ? pkCol.name : 'id'
    const data = this.getTableDataStorage(tableName, schema)
    const before = data.length
    const newData = data.filter(r => String(r[pkName]) !== String(pkValue))
    this.saveTableData(tableName, newData)
    return { code: 0, msg: '删除成功', data: { affectedRows: before - newData.length } }
  },

  // 执行SQL查询
  async executeQuery(sql, params) {
    await new Promise(r => setTimeout(r, 400))
    const upper = (sql || '').toUpperCase().trim()
    
    if (!upper) return { code: -1, msg: 'SQL语句不能为空' }

    // 安全校验：禁止危险操作
    const dangerousKeywords = ['DROP', 'TRUNCATE', 'ALTER TABLE', 'CREATE TABLE']
    for (const kw of dangerousKeywords) {
      if (upper.indexOf(kw) > -1) {
        return { code: -1, msg: '安全限制：不允许执行 ' + kw + ' 语句', data: null }
      }
    }

    // SELECT 查询
    if (upper.startsWith('SELECT')) {
      const tableName = this.extractTableName(sql)
      if (tableName && TABLE_SCHEMAS[tableName]) {
        const schema = TABLE_SCHEMAS[tableName]
        const allData = this.getTableDataStorage(tableName, schema)
        
        // 解析 LIMIT
        const limitMatch = sql.match(/LIMIT\s+(\d+)/i)
        const limit = limitMatch ? parseInt(limitMatch[1]) : 50
        
        const rows = allData.slice(0, limit)
        return {
          code: 0,
          msg: '查询成功',
          data: {
            sql,
            columns: schema.columns.map(c => c.name),
            columnInfo: schema.columns,
            rows,
            rowCount: rows.length,
            executionTime: Math.floor(Math.random() * 50 + 5) + 'ms'
          }
        }
      }
      return { code: 0, msg: '查询成功', data: { sql, columns: [], rows: [], rowCount: 0, executionTime: '2ms' } }
    }

    // INSERT 语句
    if (upper.startsWith('INSERT')) {
      const tableName = this.extractInsertTableName(sql)
      if (tableName && TABLE_SCHEMAS[tableName]) {
        const schema = TABLE_SCHEMAS[tableName]
        const data = this.getTableDataStorage(tableName, schema)
        const newRecord = {}
        schema.columns.forEach(col => {
          if (col.pk && col.autoIncrement) {
            newRecord[col.name] = data.length + 1
          } else if (col.type.startsWith('varchar') || col.type === 'text') {
            newRecord[col.name] = 'new_' + col.name
          } else if (col.type.startsWith('int') || col.type.startsWith('bigint')) {
            newRecord[col.name] = 0
          } else if (col.type.startsWith('datetime') || col.type.startsWith('date')) {
            newRecord[col.name] = new Date().toLocaleString()
          } else {
            newRecord[col.name] = ''
          }
        })
        data.push(newRecord)
        this.saveTableData(tableName, data)
        return { code: 0, msg: '插入成功', data: { sql, affectedRows: 1, insertId: newRecord.id } }
      }
      return { code: -1, msg: '表不存在或无法解析' }
    }

    // UPDATE 语句
    if (upper.startsWith('UPDATE')) {
      const tableName = this.extractTableName(sql)
      if (tableName && TABLE_SCHEMAS[tableName]) {
        const schema = TABLE_SCHEMAS[tableName]
        const data = this.getTableDataStorage(tableName, schema)
        const affected = Math.min(1, data.length)
        return { code: 0, msg: '更新成功', data: { sql, affectedRows: affected } }
      }
      return { code: -1, msg: '表不存在或无法解析' }
    }

    // DELETE 语句
    if (upper.startsWith('DELETE')) {
      const tableName = this.extractDeleteTableName(sql)
      if (tableName && TABLE_SCHEMAS[tableName]) {
        const schema = TABLE_SCHEMAS[tableName]
        const data = this.getTableDataStorage(tableName, schema)
        if (data.length > 0) {
          data.pop()
          this.saveTableData(tableName, data)
        }
        return { code: 0, msg: '删除成功', data: { sql, affectedRows: 1 } }
      }
      return { code: -1, msg: '表不存在或无法解析' }
    }

    return { code: -1, msg: '不支持的SQL语句类型，仅支持 SELECT/INSERT/UPDATE/DELETE' }
  },

  // 从SQL提取表名
  extractTableName(sql) {
    const match = sql.match(/FROM\s+(\w+)/i) || sql.match(/UPDATE\s+(\w+)/i) || sql.match(/INTO\s+(\w+)/i)
    return match ? match[1] : null
  },

  extractInsertTableName(sql) {
    const match = sql.match(/INTO\s+(\w+)/i)
    return match ? match[1] : null
  },

  extractDeleteTableName(sql) {
    const match = sql.match(/FROM\s+(\w+)/i)
    return match ? match[1] : null
  },

  // 生成模拟数据
  generateMockRows(tableName, schema, count) {
    const rows = []
    for (let i = 0; i < count; i++) {
      const row = {}
      schema.columns.forEach(col => {
        if (col.pk) { row[col.name] = i + 1; return }
        const colLower = col.name.toLowerCase()
        if (colLower.indexOf('name') > -1 || colLower.indexOf('title') > -1) {
          row[col.name] = tableName + '_' + (i + 1)
        } else if (colLower.indexOf('code') > -1 || colLower.indexOf('no') > -1) {
          row[col.name] = (tableName.substring(0, 3).toUpperCase()) + '-' + String(i + 1).padStart(4, '0')
        } else if (colLower.indexOf('status') > -1) {
          row[col.name] = String(i % 2)
        } else if (colLower.indexOf('type') > -1 || colLower.indexOf('category') > -1) {
          row[col.name] = '类型' + ((i % 5) + 1)
        } else if (colLower.indexOf('time') > -1 || colLower.indexOf('date') > -1) {
          row[col.name] = '2026-08-' + String((i % 28) + 1).padStart(2, '0') + ' 10:00:00'
        } else if (colLower.indexOf('count') > -1 || colLower.indexOf('stock') > -1 || colLower.indexOf('quantity') > -1) {
          row[col.name] = Math.floor(Math.random() * 100)
        } else if (colLower.indexOf('price') > -1 || colLower.indexOf('cost') > -1 || colLower.indexOf('amount') > -1) {
          row[col.name] = (Math.random() * 1000).toFixed(2)
        } else if (col.type.startsWith('varchar')) {
          row[col.name] = col.name + '_' + (i + 1)
        } else if (col.type.startsWith('int') || col.type.startsWith('bigint')) {
          row[col.name] = Math.floor(Math.random() * 100)
        } else if (col.type.startsWith('decimal')) {
          row[col.name] = (Math.random() * 1000).toFixed(2)
        } else if (col.type === 'text') {
          row[col.name] = '示例内容描述文本_' + (i + 1)
        } else {
          row[col.name] = ''
        }
      })
      rows.push(row)
    }
    return rows
  },

  // 获取数据库统计信息
  async getStats() {
    await new Promise(r => setTimeout(r, 300))
    const tableNames = Object.keys(TABLE_SCHEMAS)
    let totalRows = 0
    const tables = tableNames.map(name => {
      const rowCount = this.getTableRowCount(name)
      totalRows += rowCount
      return {
        name,
        comment: TABLE_SCHEMAS[name].comment,
        columnCount: TABLE_SCHEMAS[name].columns.length,
        rowCount
      }
    })
    return {
      tableCount: tableNames.length,
      totalRows,
      tables,
      totalColumns: tableNames.reduce((sum, name) => sum + TABLE_SCHEMAS[name].columns.length, 0),
      dbSize: (totalRows * 0.5).toFixed(1) + ' KB',
      charset: 'utf8mb4',
      collation: 'utf8mb4_general_ci'
    }
  },

  // 获取所有表结构定义
  getAllSchemas() {
    return TABLE_SCHEMAS
  },

  // 清空表数据
  async truncateTable(tableName) {
    await new Promise(r => setTimeout(r, 200))
    const schema = TABLE_SCHEMAS[tableName]
    if (!schema) return { code: -1, msg: '表不存在' }
    wx.removeStorageSync(DATA_STORAGE_PREFIX + tableName)
    return { code: 0, msg: '已清空表数据' }
  },

  // 导出表数据为CSV
  exportTableToCSV(tableName) {
    const schema = TABLE_SCHEMAS[tableName]
    if (!schema) return { code: -1, msg: '表不存在' }
    const data = this.getTableDataStorage(tableName, schema)
    const headers = schema.columns.map(c => c.name).join(',')
    const csvRows = data.map(row => 
      schema.columns.map(c => {
        let val = row[c.name] !== undefined ? row[c.name] : ''
        val = String(val).replace(/"/g, '""')
        if (val.indexOf(',') > -1 || val.indexOf('"') > -1) {
          val = '"' + val + '"'
        }
        return val
      }).join(',')
    )
    return { code: 0, data: headers + '\n' + csvRows.join('\n'), rowCount: data.length }
  },

  // 导入CSV数据到表
  async importCSV(tableName, csvText) {
    await new Promise(r => setTimeout(r, 500))
    const schema = TABLE_SCHEMAS[tableName]
    if (!schema) return { code: -1, msg: '表不存在' }

    const lines = csvText.trim().split('\n')
    if (lines.length < 2) return { code: -1, msg: 'CSV数据为空或格式错误' }

    const headers = lines[0].split(',').map(h => h.trim())
    const data = this.getTableDataStorage(tableName, schema)
    let successCount = 0
    const errors = []

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i])
        const record = {}
        headers.forEach((header, idx) => {
          record[header] = values[idx] || ''
        })
        // 自动生成主键
        const pkCol = schema.columns.find(c => c.pk)
        if (pkCol && pkCol.autoIncrement) {
          record[pkCol.name] = data.length + successCount + 1
        }
        record.create_time = new Date().toLocaleString()
        if (schema.columns.find(c => c.name === 'update_time')) {
          record.update_time = new Date().toLocaleString()
        }
        data.push(record)
        successCount++
      } catch (e) {
        errors.push({ row: i + 1, error: e.message })
      }
    }

    this.saveTableData(tableName, data)
    return { code: 0, msg: '导入完成', data: { successCount, failCount: errors.length, errors } }
  },

  // 解析CSV行（处理带引号的字段）
  parseCSVLine(line) {
    const result = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    result.push(current)
    return result
  }
}

module.exports = {
  DEFAULT_CONFIG,
  TABLE_SCHEMAS,
  database
}
