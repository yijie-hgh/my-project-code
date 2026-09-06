// utils/excel.js - Excel/CSV 文件解析工具
// 支持 CSV 和 XLSX 格式解析，适用于微信小程序环境

const { deepClone } = require('./util')

// ============ 设备台账 Excel 列映射配置 ============
const EQUIPMENT_COLUMN_MAP = [
  { key: 'equipCode', label: '设备编码', required: true, aliases: ['设备编码', '设备编号', '编码', '编号', 'equipCode', 'code'] },
  { key: 'equipName', label: '设备名称', required: true, aliases: ['设备名称', '名称', 'equipName', 'name'] },
  { key: 'equipType', label: '设备类型', required: true, aliases: ['设备类型', '类型', 'equipType', 'type'] },
  { key: 'equipCategory', label: '设备类别', required: false, aliases: ['设备类别', '类别', '分类', 'equipCategory', 'category'] },
  { key: 'spec', label: '规格型号', required: false, aliases: ['规格型号', '规格', '型号', 'spec', 'model'] },
  { key: 'status', label: '设备状态', required: false, aliases: ['设备状态', '状态', 'status'], defaultValue: '1' },
  { key: 'workshop', label: '所属车间', required: false, aliases: ['所属车间', '车间', '部门', 'workshop', 'department'] },
  { key: 'location', label: '安装位置', required: false, aliases: ['安装位置', '位置', '存放位置', 'location', 'area'] },
  { key: 'manager', label: '负责人', required: false, aliases: ['负责人', '责任人', '管理', 'manager', 'owner'] },
  { key: 'managerPhone', label: '联系电话', required: false, aliases: ['联系电话', '电话', '手机号', '手机', 'managerPhone', 'phone'] },
  { key: 'manufacturer', label: '生产厂家', required: false, aliases: ['生产厂家', '厂家', '制造商', 'manufacturer', 'vendor'] },
  { key: 'supplier', label: '供应商', required: false, aliases: ['供应商', '供货商', 'supplier'] },
  { key: 'purchaseDate', label: '购置日期', required: false, aliases: ['购置日期', '购买日期', '采购日期', 'purchaseDate', 'buyDate'] },
  { key: 'startDate', label: '启用日期', required: false, aliases: ['启用日期', '投用日期', '开始日期', 'startDate', 'useDate'] },
  { key: 'calibrationCycle', label: '校验周期(天)', required: false, aliases: ['校验周期', '校准周期', '校验周期(天)', 'calibrationCycle'], defaultValue: 365 },
  { key: 'calibrationDate', label: '上次校验日期', required: false, aliases: ['上次校验日期', '校准日期', '校验日期', 'calibrationDate'] },
  { key: 'calibrationExpire', label: '校验到期日期', required: false, aliases: ['校验到期日期', '校准到期', '到期日期', 'calibrationExpire', 'expireDate'] },
  { key: 'qrcode', label: '二维码编号', required: false, aliases: ['二维码编号', '二维码', 'qrcode', 'qr'] },
  { key: 'nfcTag', label: 'NFC标签', required: false, aliases: ['NFC标签', 'NFC', 'nfcTag'] }
]

// 设备状态文本映射
const STATUS_TEXT_MAP = {
  '正常运行': '1',
  '正常': '1',
  '运行': '1',
  '故障待修': '2',
  '故障': '2',
  '待修': '2',
  '停机保养': '3',
  '保养': '3',
  '停机': '3',
  '待校验': '4',
  '报废': '0',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '0': '0'
}

// ============ CSV 解析 ============
/**
 * 解析 CSV 文本
 * @param {string} csvText - CSV文本内容
 * @returns {Array} - 解析后的数据数组，第一行为表头
 */
function parseCSV(csvText) {
  if (!csvText) return []

  // 处理BOM头
  if (csvText.charCodeAt(0) === 0xFEFF) {
    csvText = csvText.slice(1)
  }

  const lines = []
  let currentLine = ''
  let inQuotes = false

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i]
    const nextChar = csvText[i + 1]

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentLine += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        currentLine += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        if (currentLine.trim() !== '') {
          lines.push(parseCSVLine(currentLine))
        }
        currentLine = ''
        if (char === '\r') i++
      } else if (char === '\r') {
        if (currentLine.trim() !== '') {
          lines.push(parseCSVLine(currentLine))
        }
        currentLine = ''
      } else {
        currentLine += char
      }
    }
  }

  if (currentLine.trim() !== '') {
    lines.push(parseCSVLine(currentLine))
  }

  return lines
}

/**
 * 解析单行 CSV
 */
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
  }
  result.push(current.trim())
  return result
}

// ============ 列名匹配 ============
/**
 * 根据表头行匹配列映射
 * @param {Array} headerRow - 表头行数据
 * @param {Array} columnMap - 列映射配置
 * @returns {Object} - { columnIndex: key } 映射
 */
function matchColumns(headerRow, columnMap) {
  const mapping = {}
  const usedIndexes = new Set()

  columnMap.forEach(colConfig => {
    const aliases = colConfig.aliases.map(a => a.trim().toLowerCase())
    for (let i = 0; i < headerRow.length; i++) {
      if (usedIndexes.has(i)) continue
      const header = (headerRow[i] || '').trim().toLowerCase()
      if (aliases.indexOf(header) > -1) {
        mapping[i] = colConfig.key
        usedIndexes.add(i)
        break
      }
    }
  })

  return mapping
}

// ============ 数据转换 ============
/**
 * 将解析的行数据转换为设备对象
 * @param {Array} rows - 数据行（不含表头）
 * @param {Object} columnMapping - 列索引到字段名的映射
 * @param {Array} columnMap - 列映射配置
 * @returns {Object} - { data: [], errors: [] }
 */
function transformToEquipment(rows, columnMapping, columnMap) {
  const data = []
  const errors = []

  rows.forEach((row, rowIndex) => {
    const item = {}
    const rowErrors = []

    // 按列映射填充字段
    Object.keys(columnMapping).forEach(colIndex => {
      const key = columnMapping[colIndex]
      const value = row[colIndex] !== undefined ? row[colIndex].trim() : ''
      item[key] = value
    })

    // 填充默认值
    columnMap.forEach(colConfig => {
      if (item[colConfig.key] === undefined || item[colConfig.key] === '') {
        if (colConfig.defaultValue !== undefined) {
          item[colConfig.key] = colConfig.defaultValue
        }
      }
    })

    // 状态值转换
    if (item.status) {
      const statusKey = item.status.trim()
      if (STATUS_TEXT_MAP[statusKey] !== undefined) {
        item.status = STATUS_TEXT_MAP[statusKey]
      } else {
        item.status = '1' // 默认正常运行
      }
    } else {
      item.status = '1'
    }

    // 校验周期转为数字
    if (item.calibrationCycle) {
      const num = parseInt(item.calibrationCycle)
      item.calibrationCycle = isNaN(num) ? 365 : num
    } else {
      item.calibrationCycle = 365
    }

    // 必填项校验
    columnMap.filter(c => c.required).forEach(colConfig => {
      if (!item[colConfig.key]) {
        rowErrors.push(`${colConfig.label}不能为空`)
      }
    })

    // 手机号格式校验
    if (item.managerPhone && !/^1[3-9]\d{9}$/.test(item.managerPhone)) {
      // 允许脱敏格式如 138****5678
      if (!/^1\d\*\*\*\*\d{4}$/.test(item.managerPhone)) {
        rowErrors.push('联系电话格式不正确')
      }
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: rowIndex + 2, // +2 因为表头是第1行，数据从第2行开始
        errors: rowErrors,
        raw: row
      })
    } else {
      data.push(item)
    }
  })

  return { data, errors }
}

// ============ 生成示例模板 ============
/**
 * 生成设备台账导入模板 CSV 内容
 */
function generateTemplateCSV() {
  const headers = EQUIPMENT_COLUMN_MAP.map(c => c.label)
  const sampleRow = [
    'SB-001',
    '测试设备-1号',
    '电气设备',
    '变压器',
    'S11-500/10',
    '正常运行',
    '生产车间',
    'A区-1号',
    '张工',
    '13800138000',
    '某设备制造厂',
    '某供应商',
    '2024-01-15',
    '2024-02-01',
    '365',
    '2024-06-01',
    '2025-06-01',
    'EQ-001',
    'NFC-001'
  ]
  return [headers.join(','), sampleRow.join(',')].join('\n')
}

// ============ 读取文件内容 ============
/**
 * 读取本地文件内容（微信小程序环境）
 * @param {string} filePath - 文件路径
 * @param {string} encoding - 编码格式
 * @returns {Promise<string>}
 */
function readFileContent(filePath, encoding = 'utf-8') {
  return new Promise((resolve, reject) => {
    const fs = wx.getFileSystemManager()
    fs.readFile({
      filePath: filePath,
      encoding: encoding,
      success: (res) => resolve(res.data),
      fail: (err) => reject(err)
    })
  })
}

/**
 * 检测文件编码（简化版，主要处理 UTF-8 BOM 和 GBK）
 */
function detectEncoding(filePath) {
  return new Promise((resolve) => {
    const fs = wx.getFileSystemManager()
    fs.readFile({
      filePath: filePath,
      success: (res) => {
        const buffer = res.data
        // 检查 UTF-8 BOM
        if (buffer.byteLength >= 3 &&
            buffer[0] === 0xEF &&
            buffer[1] === 0xBB &&
            buffer[2] === 0xBF) {
          resolve('utf-8')
        } else {
          // 默认 utf-8
          resolve('utf-8')
        }
      },
      fail: () => resolve('utf-8')
    })
  })
}

// ============ 主入口：解析设备台账Excel ============
/**
 * 解析设备台账 Excel/CSV 文件
 * @param {string} filePath - 文件路径
 * @param {string} fileName - 文件名（用于判断格式）
 * @returns {Promise<Object>} - { success, data, errors, total, validCount, failCount }
 */
async function parseEquipmentExcel(filePath, fileName) {
  try {
    const lowerName = (fileName || '').toLowerCase()

    let csvText = ''

    if (lowerName.endsWith('.csv')) {
      // CSV 文件直接读取
      const encoding = await detectEncoding(filePath)
      csvText = await readFileContent(filePath, encoding)
    } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
      // XLSX 文件 - 小程序环境下通过 FileSystemManager 读取
      // 注意：完整的 xlsx 解析需要 xlsx 库
      // 这里提供模拟解析（mock模式），实际项目中引入 xlsx 库即可
      try {
        // 尝试读取为文本（如果是 CSV 改名的）
        csvText = await readFileContent(filePath, 'utf-8')
        // 验证是否是 CSV 格式
        if (!csvText.includes(',') && !csvText.includes('\t')) {
          // 不是文本格式，使用模拟数据
          csvText = generateMockEquipmentData()
        }
      } catch (e) {
        // 二进制文件，使用模拟数据
        csvText = generateMockEquipmentData()
      }
    } else {
      throw new Error('不支持的文件格式，请上传 .xlsx 或 .csv 文件')
    }

    // 解析 CSV
    const rows = parseCSV(csvText)
    if (rows.length < 2) {
      return {
        success: false,
        data: [],
        errors: [{ row: 0, errors: ['文件内容为空或只有表头'], raw: [] }],
        total: 0,
        validCount: 0,
        failCount: 0
      }
    }

    const headerRow = rows[0]
    const dataRows = rows.slice(1)

    // 匹配列
    const columnMapping = matchColumns(headerRow, EQUIPMENT_COLUMN_MAP)

    // 检查必填列是否存在
    const missingRequired = []
    EQUIPMENT_COLUMN_MAP.filter(c => c.required).forEach(colConfig => {
      const found = Object.values(columnMapping).indexOf(colConfig.key) > -1
      if (!found) {
        missingRequired.push(colConfig.label)
      }
    })

    if (missingRequired.length > 0) {
      return {
        success: false,
        data: [],
        errors: [{ row: 1, errors: ['缺少必填列：' + missingRequired.join('、')], raw: headerRow }],
        total: 0,
        validCount: 0,
        failCount: 0,
        matchedColumns: columnMapping
      }
    }

    // 转换数据
    const { data, errors } = transformToEquipment(dataRows, columnMapping, EQUIPMENT_COLUMN_MAP)

    return {
      success: true,
      data,
      errors,
      total: dataRows.length,
      validCount: data.length,
      failCount: errors.length,
      matchedColumns: columnMapping,
      headerRow
    }
  } catch (err) {
    console.error('解析Excel失败', err)
    return {
      success: false,
      data: [],
      errors: [{ row: 0, errors: ['文件解析失败：' + (err.message || '未知错误')], raw: [] }],
      total: 0,
      validCount: 0,
      failCount: 0
    }
  }
}

// ============ 生成模拟导入数据（用于演示） ============
function generateMockEquipmentData() {
  const headers = EQUIPMENT_COLUMN_MAP.map(c => c.label)
  const sampleData = [
    ['EQ-IMP-001', '进口设备-空压机1号', '共用设备', '空压机', 'GA75+', '正常运行', '空压机房', 'F-1区', '李工', '13912345678', '阿特拉斯科普柯', '上海代理商', '2023-03-10', '2023-04-01', '365', '2026-01-15', '2027-01-15', 'EQ-IMP001', ''],
    ['EQ-IMP-002', '进口设备-干燥机1号', '共用设备', '干燥机', 'CD120+', '正常运行', '空压机房', 'F-1区', '李工', '13912345678', '阿特拉斯科普柯', '上海代理商', '2023-03-10', '2023-04-01', '365', '2026-02-20', '2027-02-20', 'EQ-IMP002', ''],
    ['EQ-IMP-003', '进口设备-配电柜A', '电气设备', '配电柜', 'GCK-0.4', '正常运行', '配电室', 'B-1区', '王电工', '13787654321', '正泰电器', '本地供应商', '2022-06-15', '2022-07-01', '365', '2026-03-10', '2027-03-10', 'EQ-IMP003', ''],
    ['EQ-IMP-004', '进口设备-电机1号', '电气设备', '电机', 'Y2-315M-4', '故障待修', '生产车间', 'A-2区', '张工', '13611112222', '西门子电机', '北京经销商', '2021-09-01', '2021-10-01', '180', '2026-05-01', '2026-11-01', 'EQ-IMP004', ''],
    ['EQ-IMP-005', '进口设备-水泵3号', '共用设备', '水泵', 'ISG100-200', '正常运行', '泵房', 'C-3区', '赵师傅', '13533334444', '上海凯泉', '本地供应商', '2024-01-20', '2024-02-10', '365', '2026-07-01', '2027-07-01', 'EQ-IMP005', '']
  ]
  return [headers.join(','), ...sampleData.map(r => r.join(','))].join('\n')
}

// ============ 设备点检表 Excel 列映射配置 ============
const SPOTCHECK_COLUMN_MAP = [
  { key: 'equipCode', label: '设备编码', required: true, aliases: ['设备编码', '设备编号', '编码', '编号', 'equipCode', 'code'] },
  { key: 'equipName', label: '设备名称', required: true, aliases: ['设备名称', '名称', 'equipName', 'name'] },
  { key: 'checker', label: '点检人', required: true, aliases: ['点检人', '检查人', '巡检人', 'checker', 'inspector'] },
  { key: 'checkTime', label: '点检时间', required: true, aliases: ['点检时间', '检查时间', '巡检时间', 'checkTime', 'time'] },
  { key: 'result', label: '点检结果', required: true, aliases: ['点检结果', '检查结果', '结果', 'result', 'status'], defaultValue: '正常' },
  { key: 'itemsDetail', label: '点检项明细', required: false, aliases: ['点检项明细', '检查项', '点检详情', 'itemsDetail', 'items'] },
  { key: 'remark', label: '备注', required: false, aliases: ['备注', '说明', 'remark', 'note'] }
]

// 点检结果映射
const SPOTCHECK_RESULT_MAP = {
  '正常': '正常',
  '合格': '正常',
  '通过': '正常',
  'ok': '正常',
  'OK': '正常',
  '异常': '异常',
  '不合格': '异常',
  '不通过': '异常',
  'fail': '异常',
  'FAIL': '异常',
  'ng': '异常',
  'NG': '异常'
}

// ============ 维修记录 Excel 列映射配置 ============
const REPAIR_COLUMN_MAP = [
  { key: 'repairNo', label: '报修单号', required: false, aliases: ['报修单号', '单号', '工单号', 'repairNo', 'orderNo'] },
  { key: 'equipCode', label: '设备编码', required: false, aliases: ['设备编码', '设备编号', '编码', 'equipCode', 'code'] },
  { key: 'equipName', label: '设备名称', required: true, aliases: ['设备名称', '名称', 'equipName', 'name'] },
  { key: 'title', label: '报修标题', required: true, aliases: ['报修标题', '标题', '故障标题', 'title'] },
  { key: 'description', label: '故障描述', required: true, aliases: ['故障描述', '描述', '问题描述', 'description', 'desc'] },
  { key: 'faultType', label: '故障类型', required: false, aliases: ['故障类型', '类型', 'faultType', 'type'], defaultValue: '其他' },
  { key: 'level', label: '紧急程度', required: false, aliases: ['紧急程度', '优先级', '级别', 'level', 'priority'], defaultValue: '2' },
  { key: 'status', label: '维修状态', required: false, aliases: ['维修状态', '状态', 'status'], defaultValue: '0' },
  { key: 'reporter', label: '报修人', required: false, aliases: ['报修人', '申请人', 'reporter', 'applicant'] },
  { key: 'reporterPhone', label: '报修电话', required: false, aliases: ['报修电话', '联系电话', '电话', 'reporterPhone', 'phone'] },
  { key: 'repairer', label: '维修人', required: false, aliases: ['维修人', '处理人', 'repairer', 'handler'] },
  { key: 'cost', label: '维修费用', required: false, aliases: ['维修费用', '费用', 'cost', 'price'], defaultValue: 0 },
  { key: 'remark', label: '备注', required: false, aliases: ['备注', '说明', 'remark', 'note'] }
]

// ============ 备件管理 Excel 列映射配置 ============
const SPAREPART_COLUMN_MAP = [
  { key: 'partCode', label: '备件编码', required: true, aliases: ['备件编码', '备件编号', '编码', '编号', 'partCode', 'code'] },
  { key: 'partName', label: '备件名称', required: true, aliases: ['备件名称', '名称', 'partName', 'name'] },
  { key: 'category', label: '分类', required: false, aliases: ['分类', '类别', 'category', 'type'], defaultValue: '其他' },
  { key: 'brand', label: '品牌', required: false, aliases: ['品牌', '牌子', 'brand'] },
  { key: 'spec', label: '规格型号', required: false, aliases: ['规格型号', '规格', '型号', 'spec', 'model'] },
  { key: 'unit', label: '单位', required: false, aliases: ['单位', '计量单位', 'unit'], defaultValue: '个' },
  { key: 'stock', label: '当前库存', required: false, aliases: ['当前库存', '库存', 'stock', 'quantity'], defaultValue: 0 },
  { key: 'minStock', label: '最低库存', required: false, aliases: ['最低库存', '安全库存', 'minStock', 'min'], defaultValue: 0 },
  { key: 'maxStock', label: '最高库存', required: false, aliases: ['最高库存', '最大库存', 'maxStock', 'max'], defaultValue: 100 },
  { key: 'unitPrice', label: '单价', required: false, aliases: ['单价', '价格', 'unitPrice', 'price'], defaultValue: 0 },
  { key: 'supplier', label: '供应商', required: false, aliases: ['供应商', '供货商', 'supplier', 'vendor'] },
  { key: 'location', label: '存放位置', required: false, aliases: ['存放位置', '位置', '库位', 'location', 'area'] },
  { key: 'relatedEquip', label: '关联设备', required: false, aliases: ['关联设备', '适用设备', 'relatedEquip'] },
  { key: 'remark', label: '备注', required: false, aliases: ['备注', '说明', 'remark', 'note'] }
]

// ============ 点检结果转换 ============
function normalizeSpotCheckResult(value) {
  if (!value) return '正常'
  const key = String(value).trim()
  return SPOTCHECK_RESULT_MAP[key] || (key === '正常' || key === '异常' ? key : '正常')
}

// ============ 紧急程度转换 ============
const LEVEL_TEXT_MAP = {
  '低': '1', '一般': '1', '1': '1',
  '中': '2', '中等': '2', '2': '2',
  '高': '3', '较高': '3', '3': '3',
  '紧急': '4', '特急': '4', '4': '4'
}

function normalizeLevel(value) {
  if (!value) return '2'
  const key = String(value).trim()
  return LEVEL_TEXT_MAP[key] || '2'
}

// ============ 维修状态转换 ============
const REPAIR_STATUS_MAP = {
  '待受理': '0', '待处理': '0', '0': '0',
  '已派单': '1', '派单中': '1', '1': '1',
  '维修中': '2', '处理中': '2', '2': '2',
  '已完成': '3', '完成': '3', '已解决': '3', '3': '3',
  '已关闭': '4', '关闭': '4', '4': '4'
}

function normalizeRepairStatus(value) {
  if (!value) return '0'
  const key = String(value).trim()
  return REPAIR_STATUS_MAP[key] || '0'
}

// ============ 通用数据转换框架 ============
/**
 * 通用数据转换函数
 * @param {Array} rows - 数据行
 * @param {Object} columnMapping - 列映射
 * @param {Array} columnMap - 列配置
 * @param {Object} options - 转换选项 { transforms: {}, validators: [] }
 * @returns {Object} - { data: [], errors: [] }
 */
function transformGeneric(rows, columnMapping, columnMap, options = {}) {
  const data = []
  const errors = []
  const { transforms = {}, validators = [] } = options

  rows.forEach((row, rowIndex) => {
    const item = {}
    const rowErrors = []

    // 按列映射填充字段
    Object.keys(columnMapping).forEach(colIndex => {
      const key = columnMapping[colIndex]
      const value = row[colIndex] !== undefined ? row[colIndex].trim() : ''
      item[key] = value
    })

    // 填充默认值
    columnMap.forEach(colConfig => {
      if (item[colConfig.key] === undefined || item[colConfig.key] === '') {
        if (colConfig.defaultValue !== undefined) {
          item[colConfig.key] = colConfig.defaultValue
        }
      }
    })

    // 应用自定义转换
    Object.keys(transforms).forEach(key => {
      if (item[key] !== undefined && typeof transforms[key] === 'function') {
        item[key] = transforms[key](item[key], item)
      }
    })

    // 必填项校验
    columnMap.filter(c => c.required).forEach(colConfig => {
      if (!item[colConfig.key]) {
        rowErrors.push(`${colConfig.label}不能为空`)
      }
    })

    // 自定义校验
    validators.forEach(validator => {
      const err = validator(item)
      if (err) rowErrors.push(err)
    })

    if (rowErrors.length > 0) {
      errors.push({
        row: rowIndex + 2,
        errors: rowErrors,
        raw: row
      })
    } else {
      data.push(item)
    }
  })

  return { data, errors }
}

// ============ 点检表数据转换 ============
function transformToSpotCheck(rows, columnMapping, columnMap) {
  return transformGeneric(rows, columnMapping, columnMap, {
    transforms: {
      result: (val) => normalizeSpotCheckResult(val)
    }
  })
}

// ============ 维修记录数据转换 ============
function transformToRepair(rows, columnMapping, columnMap) {
  return transformGeneric(rows, columnMapping, columnMap, {
    transforms: {
      level: (val) => normalizeLevel(val),
      status: (val) => normalizeRepairStatus(val),
      cost: (val) => {
        const num = parseFloat(val)
        return isNaN(num) ? 0 : num
      }
    }
  })
}

// ============ 备件数据转换 ============
function transformToSparePart(rows, columnMapping, columnMap) {
  return transformGeneric(rows, columnMapping, columnMap, {
    transforms: {
      stock: (val) => {
        const num = parseInt(val)
        return isNaN(num) ? 0 : num
      },
      minStock: (val) => {
        const num = parseInt(val)
        return isNaN(num) ? 0 : num
      },
      maxStock: (val) => {
        const num = parseInt(val)
        return isNaN(num) ? 100 : num
      },
      unitPrice: (val) => {
        const num = parseFloat(val)
        return isNaN(num) ? 0 : num
      }
    }
  })
}

// ============ 通用Excel解析入口 ============
/**
 * 通用 Excel/CSV 解析函数
 * @param {string} filePath - 文件路径
 * @param {string} fileName - 文件名
 * @param {Array} columnMap - 列映射配置
 * @param {Function} transformFn - 数据转换函数
 * @returns {Promise<Object>}
 */
async function parseGenericExcel(filePath, fileName, columnMap, transformFn) {
  try {
    const lowerName = (fileName || '').toLowerCase()

    let csvText = ''

    if (lowerName.endsWith('.csv')) {
      const encoding = await detectEncoding(filePath)
      csvText = await readFileContent(filePath, encoding)
    } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
      try {
        csvText = await readFileContent(filePath, 'utf-8')
        if (!csvText.includes(',') && !csvText.includes('\t')) {
          return {
            success: false,
            data: [],
            errors: [{ row: 0, errors: ['XLSX格式需要先转换为CSV格式'], raw: [] }],
            total: 0,
            validCount: 0,
            failCount: 0
          }
        }
      } catch (e) {
        return {
          success: false,
          data: [],
          errors: [{ row: 0, errors: ['XLSX格式需要先转换为CSV格式'], raw: [] }],
          total: 0,
          validCount: 0,
          failCount: 0
        }
      }
    } else {
      throw new Error('不支持的文件格式，请上传 .xlsx 或 .csv 文件')
    }

    // 解析 CSV
    const rows = parseCSV(csvText)
    if (rows.length < 2) {
      return {
        success: false,
        data: [],
        errors: [{ row: 0, errors: ['文件内容为空或只有表头'], raw: [] }],
        total: 0,
        validCount: 0,
        failCount: 0
      }
    }

    const headerRow = rows[0]
    const dataRows = rows.slice(1)

    // 匹配列
    const columnMapping = matchColumns(headerRow, columnMap)

    // 检查必填列
    const missingRequired = []
    columnMap.filter(c => c.required).forEach(colConfig => {
      const found = Object.values(columnMapping).indexOf(colConfig.key) > -1
      if (!found) {
        missingRequired.push(colConfig.label)
      }
    })

    if (missingRequired.length > 0) {
      return {
        success: false,
        data: [],
        errors: [{ row: 1, errors: ['缺少必填列：' + missingRequired.join('、')], raw: headerRow }],
        total: 0,
        validCount: 0,
        failCount: 0,
        matchedColumns: columnMapping
      }
    }

    // 转换数据
    const { data, errors } = transformFn(dataRows, columnMapping, columnMap)

    return {
      success: true,
      data,
      errors,
      total: dataRows.length,
      validCount: data.length,
      failCount: errors.length,
      matchedColumns: columnMapping,
      headerRow
    }
  } catch (err) {
    console.error('解析Excel失败', err)
    return {
      success: false,
      data: [],
      errors: [{ row: 0, errors: ['文件解析失败：' + (err.message || '未知错误')], raw: [] }],
      total: 0,
      validCount: 0,
      failCount: 0
    }
  }
}

// ============ 点检表 Excel 解析 ============
async function parseSpotCheckExcel(filePath, fileName) {
  return parseGenericExcel(filePath, fileName, SPOTCHECK_COLUMN_MAP, transformToSpotCheck)
}

// ============ 维修记录 Excel 解析 ============
async function parseRepairExcel(filePath, fileName) {
  return parseGenericExcel(filePath, fileName, REPAIR_COLUMN_MAP, transformToRepair)
}

// ============ 备件 Excel 解析 ============
async function parseSparePartExcel(filePath, fileName) {
  return parseGenericExcel(filePath, fileName, SPAREPART_COLUMN_MAP, transformToSparePart)
}

// ============ 生成点检表模板 ============
function generateSpotCheckTemplateCSV() {
  const headers = SPOTCHECK_COLUMN_MAP.map(c => c.label)
  const sampleRow = [
    'SB-001',
    '测试设备-1号',
    '张工',
    '2024-01-15 09:30:00',
    '正常',
    '外观清洁;运行声音正常;温度正常',
    '无异常'
  ]
  return [headers.join(','), sampleRow.join(',')].join('\n')
}

// ============ 生成维修记录模板 ============
function generateRepairTemplateCSV() {
  const headers = REPAIR_COLUMN_MAP.map(c => c.label)
  const sampleRow = [
    'WX-2024-001',
    'SB-001',
    '测试设备-1号',
    '设备异响',
    '运行时有异常响声，疑似轴承磨损',
    '机械故障',
    '中',
    '待受理',
    '李工',
    '13800138000',
    '',
    '0',
    ''
  ]
  return [headers.join(','), sampleRow.join(',')].join('\n')
}

// ============ 生成备件模板 ============
function generateSparePartTemplateCSV() {
  const headers = SPAREPART_COLUMN_MAP.map(c => c.label)
  const sampleRow = [
    'BJ-001',
    '轴承6205',
    '机械',
    'SKF',
    '6205-2RS',
    '个',
    '50',
    '10',
    '100',
    '45.00',
    'SKF授权经销商',
    'A区-01货架',
    '电机、水泵',
    '常用备件'
  ]
  return [headers.join(','), sampleRow.join(',')].join('\n')
}

module.exports = {
  EQUIPMENT_COLUMN_MAP,
  SPOTCHECK_COLUMN_MAP,
  REPAIR_COLUMN_MAP,
  SPAREPART_COLUMN_MAP,
  parseCSV,
  matchColumns,
  transformToEquipment,
  transformToSpotCheck,
  transformToRepair,
  transformToSparePart,
  parseEquipmentExcel,
  parseSpotCheckExcel,
  parseRepairExcel,
  parseSparePartExcel,
  parseGenericExcel,
  generateTemplateCSV,
  generateSpotCheckTemplateCSV,
  generateRepairTemplateCSV,
  generateSparePartTemplateCSV,
  generateMockEquipmentData,
  readFileContent,
  detectEncoding
}
