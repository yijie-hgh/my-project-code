// utils/feishu-config.js - 飞书多维表格字段配置
// 为小程序每个功能模块定义对应的飞书 Bitable 字段结构

// 飞书 Bitable 字段类型
const FieldType = {
  TEXT: 1,
  NUMBER: 2,
  SINGLE_SELECT: 3,
  MULTI_SELECT: 4,
  DATE_TIME: 5,
  PERSON: 7,
  PHONE: 9,
  EMAIL: 10,
  ATTACHMENT: 11,
  LINK: 13,
  CHECKBOX: 4,
  LOCATION: 19,
  AUTO_SERIAL: 21,
  CREATED_TIME: 22,
  MODIFIED_TIME: 23
}

// ============ 各模块 Bitable 配置 ============
const BITABLE_CONFIGS = {
  // 1. 设备清单（综合台账）
  equipment_inventory: {
    name: '设备清单台账',
    icon: '📋',
    description: '设备综合台账，包含设备状态、点检/维修/保养统计',
    primaryKey: 'equipCode',
    fields: [
      { name: '设备编码', type: FieldType.TEXT, required: true, localKey: 'equipCode' },
      { name: '设备名称', type: FieldType.TEXT, required: true, localKey: 'equipName' },
      { name: '设备类型', type: FieldType.SINGLE_SELECT, required: true, localKey: 'equipType', options: ['电气设备', '共用设备', '暖通设备', '消防设备', '控制设备', '仪表设备'] },
      { name: '设备类别', type: FieldType.SINGLE_SELECT, localKey: 'equipCategory' },
      { name: '规格型号', type: FieldType.TEXT, localKey: 'spec' },
      { name: '设备状态', type: FieldType.SINGLE_SELECT, localKey: 'status', options: [{ label: '报废', value: '0' }, { label: '正常运行', value: '1' }, { label: '故障待修', value: '2' }, { label: '停机保养', value: '3' }, { label: '待校验', value: '4' }] },
      { name: '所属车间', type: FieldType.SINGLE_SELECT, localKey: 'workshop' },
      { name: '安装位置', type: FieldType.TEXT, localKey: 'location' },
      { name: '负责人', type: FieldType.TEXT, localKey: 'manager' },
      { name: '联系电话', type: FieldType.PHONE, localKey: 'managerPhone' },
      { name: '生产厂家', type: FieldType.TEXT, localKey: 'manufacturer' },
      { name: '供应商', type: FieldType.TEXT, localKey: 'supplier' },
      { name: '购置日期', type: FieldType.DATE_TIME, localKey: 'purchaseDate' },
      { name: '启用日期', type: FieldType.DATE_TIME, localKey: 'startDate' },
      { name: '校验周期(天)', type: FieldType.NUMBER, localKey: 'calibrationCycle' },
      { name: '上次校验日期', type: FieldType.DATE_TIME, localKey: 'calibrationDate' },
      { name: '校验到期日期', type: FieldType.DATE_TIME, localKey: 'calibrationExpire' },
      { name: '二维码编号', type: FieldType.TEXT, localKey: 'qrcode' },
      { name: 'NFC标签', type: FieldType.TEXT, localKey: 'nfcTag' },
      { name: '点检次数', type: FieldType.NUMBER, localKey: 'spotCheckCount' },
      { name: '维修次数', type: FieldType.NUMBER, localKey: 'repairCount' },
      { name: '保养次数', type: FieldType.NUMBER, localKey: 'maintainCount' },
      { name: '健康分', type: FieldType.NUMBER, localKey: 'healthScore' }
    ]
  },

  // 2. 巡检任务
  inspection_tasks: {
    name: '巡检任务表',
    icon: '📝',
    description: '巡检任务记录表',
    primaryKey: 'taskNo',
    fields: [
      { name: '任务编号', type: FieldType.AUTO_SERIAL, required: true, localKey: 'taskNo' },
      { name: '任务名称', type: FieldType.TEXT, required: true, localKey: 'taskName' },
      { name: '项目名称', type: FieldType.TEXT, localKey: 'projectName' },
      { name: '任务状态', type: FieldType.SINGLE_SELECT, localKey: 'status', options: [{ label: '待执行', value: '0' }, { label: '执行中', value: '1' }, { label: '已完成', value: '2' }, { label: '已逾期', value: '3' }, { label: '已取消', value: '4' }] },
      { name: '巡检人', type: FieldType.TEXT, localKey: 'inspectorName' },
      { name: '巡检时间', type: FieldType.DATE_TIME, localKey: 'inspectTime' },
      { name: '截止时间', type: FieldType.DATE_TIME, localKey: 'deadline' },
      { name: '巡检点数', type: FieldType.NUMBER, localKey: 'pointCount' },
      { name: '完成点数', type: FieldType.NUMBER, localKey: 'doneCount' },
      { name: '备注', type: FieldType.TEXT, localKey: 'remark' },
      { name: '完成时间', type: FieldType.DATE_TIME, localKey: 'finishTime' }
    ]
  },

  // 3. 巡检记录
  inspection_records: {
    name: '巡检记录表',
    icon: '📋',
    description: '巡检签到和检查记录',
    primaryKey: 'id',
    fields: [
      { name: '任务ID', type: FieldType.TEXT, required: true, localKey: 'taskId' },
      { name: '巡检点', type: FieldType.TEXT, required: true, localKey: 'pointName' },
      { name: '巡检人', type: FieldType.TEXT, localKey: 'inspectorName' },
      { name: '巡检时间', type: FieldType.DATE_TIME, localKey: 'inspectTime' },
      { name: '签到方式', type: FieldType.SINGLE_SELECT, localKey: 'checkInType', options: ['二维码', 'NFC', 'GPS'] },
      { name: '签到时间', type: FieldType.DATE_TIME, localKey: 'checkInTime' },
      { name: '巡检结果', type: FieldType.SINGLE_SELECT, localKey: 'result', options: ['正常', '异常'] },
      { name: '状态', type: FieldType.SINGLE_SELECT, localKey: 'status', options: ['待巡检', '已巡检', '已跳过'] },
      { name: '照片', type: FieldType.ATTACHMENT, localKey: 'photos' },
      { name: '备注', type: FieldType.TEXT, localKey: 'remark' }
    ]
  },

  // 4. 点检记录
  spotcheck_records: {
    name: '点检记录表',
    icon: '✅',
    description: '设备点检记录',
    primaryKey: 'id',
    fields: [
      { name: '设备编码', type: FieldType.TEXT, required: true, localKey: 'equipCode' },
      { name: '设备名称', type: FieldType.TEXT, required: true, localKey: 'equipName' },
      { name: '点检人', type: FieldType.TEXT, localKey: 'checker' },
      { name: '点检时间', type: FieldType.DATE_TIME, localKey: 'checkTime' },
      { name: '点检结果', type: FieldType.SINGLE_SELECT, localKey: 'result', options: ['正常', '异常'] },
      { name: '点检项明细', type: FieldType.TEXT, localKey: 'itemsDetail' },
      { name: '备注', type: FieldType.TEXT, localKey: 'remark' }
    ]
  },

  // 5. 报修维修
  repair_records: {
    name: '报修维修表',
    icon: '🔧',
    description: '设备报修和维修记录',
    primaryKey: 'repairNo',
    fields: [
      { name: '报修单号', type: FieldType.AUTO_SERIAL, required: true, localKey: 'repairNo' },
      { name: '设备编码', type: FieldType.TEXT, localKey: 'equipCode' },
      { name: '设备名称', type: FieldType.TEXT, required: true, localKey: 'equipName' },
      { name: '报修标题', type: FieldType.TEXT, required: true, localKey: 'title' },
      { name: '故障描述', type: FieldType.TEXT, localKey: 'description' },
      { name: '故障类型', type: FieldType.SINGLE_SELECT, localKey: 'faultType', options: ['机械故障', '电气故障', '仪表故障', '制冷故障', '其他'] },
      { name: '紧急程度', type: FieldType.SINGLE_SELECT, localKey: 'level', options: [{ label: '低', value: '1' }, { label: '中', value: '2' }, { label: '高', value: '3' }, { label: '紧急', value: '4' }] },
      { name: '维修状态', type: FieldType.SINGLE_SELECT, localKey: 'status', options: [{ label: '待受理', value: '0' }, { label: '已派单', value: '1' }, { label: '维修中', value: '2' }, { label: '已完成', value: '3' }, { label: '已关闭', value: '4' }] },
      { name: '报修人', type: FieldType.TEXT, localKey: 'reporter' },
      { name: '报修电话', type: FieldType.PHONE, localKey: 'reporterPhone' },
      { name: '维修人', type: FieldType.TEXT, localKey: 'repairer' },
      { name: '创建时间', type: FieldType.CREATED_TIME, localKey: 'createTime' },
      { name: '受理时间', type: FieldType.DATE_TIME, localKey: 'acceptTime' },
      { name: '开始维修', type: FieldType.DATE_TIME, localKey: 'startTime' },
      { name: '完成时间', type: FieldType.DATE_TIME, localKey: 'finishTime' },
      { name: '使用备件', type: FieldType.TEXT, localKey: 'partsUsed' },
      { name: '维修说明', type: FieldType.TEXT, localKey: 'repairDesc' },
      { name: '维修费用', type: FieldType.NUMBER, localKey: 'cost' },
      { name: '现场照片', type: FieldType.ATTACHMENT, localKey: 'images' }
    ]
  },

  // 6. 维护保养
  maintenance_records: {
    name: '维护保养表',
    icon: '🛠️',
    description: '设备维护保养记录',
    primaryKey: 'maintainNo',
    fields: [
      { name: '保养单号', type: FieldType.AUTO_SERIAL, required: true, localKey: 'maintainNo' },
      { name: '设备编码', type: FieldType.TEXT, localKey: 'equipCode' },
      { name: '设备名称', type: FieldType.TEXT, required: true, localKey: 'equipName' },
      { name: '保养计划', type: FieldType.TEXT, localKey: 'planName' },
      { name: '保养类型', type: FieldType.SINGLE_SELECT, localKey: 'type', options: ['日常保养', '定期保养', '专项保养', '大修'] },
      { name: '保养内容', type: FieldType.TEXT, localKey: 'content' },
      { name: '保养人', type: FieldType.TEXT, localKey: 'maintainer' },
      { name: '保养状态', type: FieldType.SINGLE_SELECT, localKey: 'status', options: [{ label: '待执行', value: '0' }, { label: '执行中', value: '1' }, { label: '已完成', value: '2' }, { label: '已逾期', value: '3' }] },
      { name: '计划日期', type: FieldType.DATE_TIME, localKey: 'planDate' },
      { name: '完成时间', type: FieldType.DATE_TIME, localKey: 'finishTime' },
      { name: '保养项明细', type: FieldType.TEXT, localKey: 'itemsDetail' },
      { name: '备注', type: FieldType.TEXT, localKey: 'remark' },
      { name: '保养费用', type: FieldType.NUMBER, localKey: 'cost' }
    ]
  },

  // 7. 备件管理
  spare_parts: {
    name: '备件管理表',
    icon: '📦',
    description: '备件基础信息和库存',
    primaryKey: 'partCode',
    fields: [
      { name: '备件编码', type: FieldType.TEXT, required: true, localKey: 'partCode' },
      { name: '备件名称', type: FieldType.TEXT, required: true, localKey: 'partName' },
      { name: '分类', type: FieldType.SINGLE_SELECT, localKey: 'category' },
      { name: '品牌', type: FieldType.TEXT, localKey: 'brand' },
      { name: '规格型号', type: FieldType.TEXT, localKey: 'spec' },
      { name: '单位', type: FieldType.TEXT, localKey: 'unit' },
      { name: '当前库存', type: FieldType.NUMBER, localKey: 'stock' },
      { name: '最低库存', type: FieldType.NUMBER, localKey: 'minStock' },
      { name: '最高库存', type: FieldType.NUMBER, localKey: 'maxStock' },
      { name: '单价', type: FieldType.NUMBER, localKey: 'unitPrice' },
      { name: '供应商', type: FieldType.TEXT, localKey: 'supplier' },
      { name: '存放位置', type: FieldType.TEXT, localKey: 'location' },
      { name: '关联设备', type: FieldType.TEXT, localKey: 'relatedEquip' },
      { name: '入库总数', type: FieldType.NUMBER, localKey: 'totalIn' },
      { name: '出库总数', type: FieldType.NUMBER, localKey: 'totalOut' },
      { name: '库存状态', type: FieldType.SINGLE_SELECT, localKey: 'status', options: ['充足', '偏低', '不足', '缺货', '超储'] }
    ]
  },

  // 8. 备件出入库记录
  spare_parts_inventory: {
    name: '备件出入库记录',
    icon: '📑',
    description: '备件入库出库流水记录',
    primaryKey: 'id',
    fields: [
      { name: '备件编码', type: FieldType.TEXT, required: true, localKey: 'partCode' },
      { name: '备件名称', type: FieldType.TEXT, required: true, localKey: 'partName' },
      { name: '操作类型', type: FieldType.SINGLE_SELECT, required: true, localKey: 'operateType', options: ['入库', '出库', '盘点'] },
      { name: '数量', type: FieldType.NUMBER, required: true, localKey: 'quantity' },
      { name: '操作人', type: FieldType.TEXT, localKey: 'operator' },
      { name: '操作时间', type: FieldType.DATE_TIME, localKey: 'operateTime' },
      { name: '关联设备', type: FieldType.TEXT, localKey: 'relatedEquip' },
      { name: '关联单号', type: FieldType.TEXT, localKey: 'relatedOrder' },
      { name: '备注', type: FieldType.TEXT, localKey: 'remark' }
    ]
  },

  // 9. 安灯记录
  andon_records: {
    name: '安灯呼叫记录',
    icon: '🚨',
    description: '安灯呼叫和处理记录',
    primaryKey: 'id',
    fields: [
      { name: '设备名称', type: FieldType.TEXT, required: true, localKey: 'equipName' },
      { name: '设备编码', type: FieldType.TEXT, localKey: 'equipCode' },
      { name: '呼叫人', type: FieldType.TEXT, localKey: 'caller' },
      { name: '呼叫类型', type: FieldType.SINGLE_SELECT, localKey: 'callType', options: ['设备故障', '品质异常', '物料短缺', '安全报警', '其他'] },
      { name: '呼叫时间', type: FieldType.DATE_TIME, localKey: 'callTime' },
      { name: '处理状态', type: FieldType.SINGLE_SELECT, localKey: 'status', options: [{ label: '待响应', value: '0' }, { label: '处理中', value: '1' }, { label: '已解决', value: '2' }] },
      { name: '响应人', type: FieldType.TEXT, localKey: 'responder' },
      { name: '响应时间', type: FieldType.DATE_TIME, localKey: 'responseTime' },
      { name: '解决时间', type: FieldType.DATE_TIME, localKey: 'resolveTime' },
      { name: '问题描述', type: FieldType.TEXT, localKey: 'description' },
      { name: '设备位置', type: FieldType.TEXT, localKey: 'location' }
    ]
  },

  // 10. IoT数据采集
  iot_data: {
    name: 'IoT数据采集表',
    icon: '📡',
    description: '物联网传感器数据采集记录',
    primaryKey: 'id',
    fields: [
      { name: '设备名称', type: FieldType.TEXT, required: true, localKey: 'equipName' },
      { name: '设备编码', type: FieldType.TEXT, localKey: 'equipCode' },
      { name: '在线状态', type: FieldType.SINGLE_SELECT, localKey: 'online', options: [{ label: '在线', value: true }, { label: '离线', value: false }] },
      { name: '传感器数据', type: FieldType.TEXT, localKey: 'sensorsData' },
      { name: '最后更新', type: FieldType.DATE_TIME, localKey: 'lastUpdate' },
      { name: '告警状态', type: FieldType.SINGLE_SELECT, localKey: 'alertStatus', options: ['正常', '预警', '告警', '故障'] }
    ]
  },

  // 11. 到期提醒
  reminders: {
    name: '到期提醒表',
    icon: '🔔',
    description: '设备校验/保养等到期提醒',
    primaryKey: 'id',
    fields: [
      { name: '设备名称', type: FieldType.TEXT, required: true, localKey: 'equipName' },
      { name: '设备编码', type: FieldType.TEXT, localKey: 'equipCode' },
      { name: '提醒类型', type: FieldType.SINGLE_SELECT, localKey: 'type', options: ['校验到期', '保养到期', '质保到期', '合同到期'] },
      { name: '到期日期', type: FieldType.DATE_TIME, localKey: 'expireDate' },
      { name: '剩余天数', type: FieldType.NUMBER, localKey: 'daysLeft' },
      { name: '提醒状态', type: FieldType.SINGLE_SELECT, localKey: 'status', options: ['未到期', '即将到期', '已过期'] },
      { name: '负责人', type: FieldType.TEXT, localKey: 'manager' }
    ]
  },

  // 12. 事件管理
  events: {
    name: '事件管理表',
    icon: '⚠️',
    description: '巡检异常事件记录',
    primaryKey: 'id',
    fields: [
      { name: '事件标题', type: FieldType.TEXT, required: true, localKey: 'title' },
      { name: '巡检点', type: FieldType.TEXT, localKey: 'pointName' },
      { name: '项目名称', type: FieldType.TEXT, localKey: 'projectName' },
      { name: '事件级别', type: FieldType.SINGLE_SELECT, localKey: 'level', options: [{ label: '低', value: '1' }, { label: '中', value: '2' }, { label: '高', value: '3' }, { label: '紧急', value: '4' }] },
      { name: '事件状态', type: FieldType.SINGLE_SELECT, localKey: 'status', options: [{ label: '待处理', value: '0' }, { label: '处理中', value: '1' }, { label: '已解决', value: '2' }, { label: '已关闭', value: '3' }] },
      { name: '事件描述', type: FieldType.TEXT, localKey: 'description' },
      { name: '创建时间', type: FieldType.CREATED_TIME, localKey: 'createTime' },
      { name: '完成时间', type: FieldType.DATE_TIME, localKey: 'finishTime' },
      { name: '处理人', type: FieldType.TEXT, localKey: 'handlerName' },
      { name: '现场图片', type: FieldType.ATTACHMENT, localKey: 'images' }
    ]
  },

  // 13. 巡检项目
  projects: {
    name: '巡检项目表',
    icon: '📁',
    description: '巡检项目基础信息',
    primaryKey: 'projectCode',
    fields: [
      { name: '项目名称', type: FieldType.TEXT, required: true, localKey: 'projectName' },
      { name: '项目编号', type: FieldType.AUTO_SERIAL, localKey: 'projectCode' },
      { name: '项目描述', type: FieldType.TEXT, localKey: 'description' },
      { name: '项目状态', type: FieldType.SINGLE_SELECT, localKey: 'status', options: [{ label: '启用', value: '1' }, { label: '停用', value: '0' }] },
      { name: '巡检点数', type: FieldType.NUMBER, localKey: 'pointCount' },
      { name: '任务数', type: FieldType.NUMBER, localKey: 'taskCount' },
      { name: '完成率(%)', type: FieldType.NUMBER, localKey: 'completionRate' },
      { name: '创建时间', type: FieldType.CREATED_TIME, localKey: 'createTime' }
    ]
  },

  // 14. 巡检点
  points: {
    name: '巡检点表',
    icon: '📍',
    description: '巡检点基础信息',
    primaryKey: 'pointCode',
    fields: [
      { name: '巡检点名称', type: FieldType.TEXT, required: true, localKey: 'pointName' },
      { name: '巡检点编码', type: FieldType.AUTO_SERIAL, localKey: 'pointCode' },
      { name: '所属项目', type: FieldType.TEXT, localKey: 'projectName' },
      { name: '位置', type: FieldType.TEXT, localKey: 'location' },
      { name: '经度', type: FieldType.NUMBER, localKey: 'longitude' },
      { name: '纬度', type: FieldType.NUMBER, localKey: 'latitude' },
      { name: 'NFC标签', type: FieldType.TEXT, localKey: 'nfcTag' },
      { name: '二维码', type: FieldType.TEXT, localKey: 'qrcode' },
      { name: '检查项数', type: FieldType.NUMBER, localKey: 'checkItems' },
      { name: '状态', type: FieldType.SINGLE_SELECT, localKey: 'status', options: [{ label: '启用', value: '1' }, { label: '停用', value: '0' }] },
      { name: '最近巡检时间', type: FieldType.DATE_TIME, localKey: 'lastInspectTime' },
      { name: '最近结果', type: FieldType.SINGLE_SELECT, localKey: 'lastResult', options: ['正常', '异常'] }
    ]
  }
}

// ============ 模块与本地数据的映射 ============
// 用于同步时从 mock 数据中获取对应模块的数据
const MODULE_DATA_MAP = {
  equipment_inventory: { mockKey: 'equipInventory', idField: 'id' },
  inspection_tasks: { mockKey: 'tasks', idField: 'id' },
  inspection_records: { mockKey: 'records', idField: 'id' },
  spotcheck_records: { mockKey: 'spotCheckRecords', idField: 'id' },
  repair_records: { mockKey: 'repairs', idField: 'id' },
  maintenance_records: { mockKey: 'maintains', idField: 'id' },
  spare_parts: { mockKey: 'spareParts', idField: 'id' },
  spare_parts_inventory: { mockKey: 'sparePartsInventory', idField: 'id', optional: true },
  andon_records: { mockKey: 'andonRecords', idField: 'id' },
  iot_data: { mockKey: 'iotDevices', idField: 'id' },
  reminders: { mockKey: 'reminders', idField: 'id' },
  events: { mockKey: 'events', idField: 'id' },
  projects: { mockKey: 'projects', idField: 'id' },
  points: { mockKey: 'points', idField: 'id' }
}

module.exports = {
  FieldType,
  BITABLE_CONFIGS,
  MODULE_DATA_MAP
}
