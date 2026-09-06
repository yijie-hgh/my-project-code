// utils/mock.js - Mock数据（无后端时用于演示）
const { formatDate, genTaskNo, uuid } = require('./util')

const today = formatDate(new Date(), 'yyyy-MM-dd')

// 巡检项目
const projects = [
  { id: 1, projectName: '厂区设备巡检', projectCode: 'PJ20260001', description: '厂区生产线设备日常巡检维护', status: '1', pointCount: 12, taskCount: 36, completionRate: 88, createTime: '2026-01-15 08:00:00' },
  { id: 2, projectName: '变电站巡检', projectCode: 'PJ20260002', description: '变电站高压设备巡检', status: '1', pointCount: 8, taskCount: 24, completionRate: 92, createTime: '2026-02-01 08:00:00' },
  { id: 3, projectName: '暖通空调巡检', projectCode: 'PJ20260003', description: '中央空调及暖通系统巡检', status: '1', pointCount: 15, taskCount: 45, completionRate: 75, createTime: '2026-02-20 08:00:00' },
  { id: 4, projectName: '消防设施巡检', projectCode: 'PJ20260004', description: '消防设备设施月度巡检', status: '0', pointCount: 6, taskCount: 12, completionRate: 60, createTime: '2026-03-01 08:00:00' }
]

// 巡检点
const points = [
  { id: 1, pointName: '1号生产线-主电机', pointCode: 'PT001', projectId: 1, projectName: '厂区设备巡检', location: 'A车间1楼', longitude: 116.404, latitude: 39.915, nfcTag: 'NFC-A001', qrcode: 'QR-A001', checkItems: 5, status: '1', lastInspectTime: '2026-08-02 09:30:00', lastResult: '正常' },
  { id: 2, pointName: '2号生产线-传送带', pointCode: 'PT002', projectId: 1, projectName: '厂区设备巡检', location: 'A车间1楼', longitude: 116.405, latitude: 39.916, nfcTag: 'NFC-A002', qrcode: 'QR-A002', checkItems: 4, status: '1', lastInspectTime: '2026-08-02 09:45:00', lastResult: '正常' },
  { id: 3, pointName: '冷却塔-1号', pointCode: 'PT003', projectId: 1, projectName: '厂区设备巡检', location: 'B车间楼顶', longitude: 116.406, latitude: 39.917, nfcTag: 'NFC-A003', qrcode: 'QR-A003', checkItems: 6, status: '1', lastInspectTime: '2026-08-01 14:20:00', lastResult: '异常' },
  { id: 4, pointName: '主变压器-1号', pointCode: 'PT004', projectId: 2, projectName: '变电站巡检', location: '变电站A区', longitude: 116.408, latitude: 39.920, nfcTag: 'NFC-B001', qrcode: 'QR-B001', checkItems: 8, status: '1', lastInspectTime: '2026-08-02 10:00:00', lastResult: '正常' },
  { id: 5, pointName: '高压开关柜-3号', pointCode: 'PT005', projectId: 2, projectName: '变电站巡检', location: '变电站B区', longitude: 116.409, latitude: 39.921, nfcTag: 'NFC-B002', qrcode: 'QR-B002', checkItems: 7, status: '1', lastInspectTime: '2026-08-02 10:15:00', lastResult: '正常' },
  { id: 6, pointName: '中央空调主机', pointCode: 'PT006', projectId: 3, projectName: '暖通空调巡检', location: '机房B1', longitude: 116.410, latitude: 39.922, nfcTag: 'NFC-C001', qrcode: 'QR-C001', checkItems: 10, status: '1', lastInspectTime: '2026-08-02 08:30:00', lastResult: '正常' },
  { id: 7, pointName: '冷却水泵-2号', pointCode: 'PT007', projectId: 3, projectName: '暖通空调巡检', location: '机房B1', longitude: 116.411, latitude: 39.923, nfcTag: 'NFC-C002', qrcode: 'QR-C002', checkItems: 5, status: '0', lastInspectTime: '2026-08-01 16:00:00', lastResult: '异常' },
  { id: 8, pointName: '消防泵房', pointCode: 'PT008', projectId: 4, projectName: '消防设施巡检', location: '地下1层', longitude: 116.412, latitude: 39.924, nfcTag: 'NFC-D001', qrcode: 'QR-D001', checkItems: 6, status: '1', lastInspectTime: '2026-08-02 11:00:00', lastResult: '正常' }
]

// 巡检项模板
const checkItemTemplates = [
  { id: 1, itemName: '设备外观检查', itemType: 'choice', required: true, options: ['正常', '异常'], unit: '' },
  { id: 2, itemName: '运行温度', itemType: 'number', required: true, options: [], unit: '℃', standard: '≤65' },
  { id: 3, itemName: '运行声音', itemType: 'choice', required: true, options: ['正常', '异响'], unit: '' },
  { id: 4, itemName: '振动幅度', itemType: 'number', required: false, options: [], unit: 'mm/s', standard: '≤4.5' },
  { id: 5, itemName: '电压电流', itemType: 'number', required: true, options: [], unit: 'A', standard: '额定值±5%' },
  { id: 6, itemName: '润滑油位', itemType: 'choice', required: false, options: ['正常', '偏低', '需更换'], unit: '' },
  { id: 7, itemName: '现场拍照', itemType: 'photo', required: true, options: [], unit: '' },
  { id: 8, itemName: '备注说明', itemType: 'input', required: false, options: [], unit: '' }
]

// 巡检计划
const plans = [
  { id: 1, planName: '厂区设备日巡检', projectId: 1, projectName: '厂区设备巡检', frequency: 'daily', cycleType: '每日', inspectPoints: '1,2,3', inspectorIds: '1,2', inspectorNames: '张巡检,李运维', startTime: '2026-01-01', endTime: '2026-12-31', status: '1', nextRunTime: '2026-08-03 08:00', taskCount: 36 },
  { id: 2, planName: '变电站周巡检', projectId: 2, projectName: '变电站巡检', frequency: 'weekly', cycleType: '每周', inspectPoints: '4,5', inspectorIds: '3', inspectorNames: '王电工', startTime: '2026-01-01', endTime: '2026-12-31', status: '1', nextRunTime: '2026-08-04 09:00', taskCount: 24 },
  { id: 3, planName: '暖通系统日巡检', projectId: 3, projectName: '暖通空调巡检', frequency: 'daily', cycleType: '每日', inspectPoints: '6,7', inspectorIds: '1,2', inspectorNames: '张巡检,李运维', startTime: '2026-02-01', endTime: '2026-12-31', status: '1', nextRunTime: '2026-08-03 07:30', taskCount: 45 },
  { id: 4, planName: '消防设施月巡检', projectId: 4, projectName: '消防设施巡检', frequency: 'monthly', cycleType: '每月', inspectPoints: '8', inspectorIds: '3', inspectorNames: '王电工', startTime: '2026-03-01', endTime: '2026-12-31', status: '0', nextRunTime: '2026-09-01 10:00', taskCount: 12 }
]

// 巡检任务
const tasks = [
  { id: 1, taskNo: 'XJ20260803001', taskName: '厂区设备日巡检-8月3日', planId: 1, projectId: 1, projectName: '厂区设备巡检', status: '0', inspectorName: '张巡检', inspectTime: today + ' 08:00', deadline: today + ' 18:00', pointCount: 3, doneCount: 0, points: [1,2,3], remark: '请于今日完成厂区A车间设备巡检' },
  { id: 2, taskNo: 'XJ20260802002', taskName: '暖通系统日巡检-8月2日', planId: 3, projectId: 3, projectName: '暖通空调巡检', status: '2', inspectorName: '张巡检', inspectTime: '2026-08-02 07:30', deadline: '2026-08-02 18:00', finishTime: '2026-08-02 09:15', pointCount: 2, doneCount: 2, points: [6,7], remark: '冷却水泵2号发现异响，已上报事件' },
  { id: 3, taskNo: 'XJ20260802001', taskName: '厂区设备日巡检-8月2日', planId: 1, projectId: 1, projectName: '厂区设备巡检', status: '2', inspectorName: '李运维', inspectTime: '2026-08-02 08:00', deadline: '2026-08-02 18:00', finishTime: '2026-08-02 10:30', pointCount: 3, doneCount: 3, points: [1,2,3], remark: '冷却塔1号温度偏高，已记录' },
  { id: 4, taskNo: 'XJ20260801004', taskName: '变电站周巡检-第31周', planId: 2, projectId: 2, projectName: '变电站巡检', status: '3', inspectorName: '王电工', inspectTime: '2026-07-28 09:00', deadline: '2026-08-01 18:00', pointCount: 2, doneCount: 1, points: [4,5], remark: '高压开关柜3号未完成巡检' },
  { id: 5, taskNo: 'XJ20260803005', taskName: '暖通系统日巡检-8月3日', planId: 3, projectId: 3, projectName: '暖通空调巡检', status: '1', inspectorName: '张巡检', inspectTime: today + ' 07:30', deadline: today + ' 18:00', pointCount: 2, doneCount: 1, points: [6,7], remark: '中央空调主机已完成，冷却水泵进行中' },
  { id: 6, taskNo: 'XJ20260803006', taskName: '厂区设备日巡检-8月3日(夜班)', planId: 1, projectId: 1, projectName: '厂区设备巡检', status: '0', inspectorName: '李运维', inspectTime: today + ' 20:00', deadline: '2026-08-04 06:00', pointCount: 3, doneCount: 0, points: [1,2,3], remark: '夜班设备巡检' }
]

// 巡检记录
const records = [
  { id: 1, taskId: 2, pointId: 6, pointName: '中央空调主机', inspectorName: '张巡检', inspectTime: '2026-08-02 08:15:00', checkInType: 'qrcode', checkInTime: '2026-08-02 08:10:00', status: '2', result: '正常', photos: [], remark: '运行正常' },
  { id: 2, taskId: 2, pointId: 7, pointName: '冷却水泵-2号', inspectorName: '张巡检', inspectTime: '2026-08-02 09:10:00', checkInType: 'nfc', checkInTime: '2026-08-02 09:05:00', status: '2', result: '异常', photos: [], remark: '发现异响，已上报事件' }
]

// 事件
const events = [
  { id: 1, title: '冷却水泵2号异响', taskId: 2, pointId: 7, pointName: '冷却水泵-2号', projectName: '暖通空调巡检', level: '3', status: '1', description: '巡检时发现冷却水泵2号运行有异常响声，疑似轴承磨损', createTime: '2026-08-02 09:12:00', handler: '张巡检', handlerName: '张巡检', images: [] },
  { id: 2, title: '冷却塔1号温度偏高', taskId: 3, pointId: 3, pointName: '冷却塔-1号', projectName: '厂区设备巡检', level: '2', status: '2', description: '冷却塔出水温度达到72℃，超出标准值65℃', createTime: '2026-08-02 09:50:00', finishTime: '2026-08-02 14:30:00', handler: '李运维', handlerName: '李运维', images: [] },
  { id: 3, title: '高压开关柜3号指示灯异常', taskId: 4, pointId: 5, pointName: '高压开关柜-3号', projectName: '变电站巡检', level: '4', status: '0', description: '运行指示灯闪烁，可能存在接触不良', createTime: '2026-08-01 15:00:00', handler: '', handlerName: '', images: [] },
  { id: 4, title: '消防泵房压力表读数偏低', taskId: 6, pointId: 8, pointName: '消防泵房', projectName: '消防设施巡检', level: '2', status: '3', description: '管网压力0.3MPa，低于标准0.4MPa', createTime: '2026-08-02 11:10:00', finishTime: '2026-08-02 16:00:00', handler: '王电工', handlerName: '王电工', images: [] }
]

// 事件跟踪记录
const eventTracks = {
  1: [
    { id: 1, eventId: 1, action: '上报事件', operator: '张巡检', operateTime: '2026-08-02 09:12:00', content: '巡检发现冷却水泵2号异响，上报事件', images: [] },
    { id: 2, eventId: 1, action: '分配处理人', operator: '系统管理员', operateTime: '2026-08-02 09:30:00', content: '分配给维修班组处理', images: [] },
    { id: 3, eventId: 1, action: '现场排查', operator: '维修班-赵师傅', operateTime: '2026-08-02 10:45:00', content: '初步判断为轴承磨损，需更换轴承', images: [] }
  ],
  2: [
    { id: 4, eventId: 2, action: '上报事件', operator: '李运维', operateTime: '2026-08-02 09:50:00', content: '冷却塔温度偏高72℃', images: [] },
    { id: 5, eventId: 2, action: '调整运行参数', operator: '李运维', operateTime: '2026-08-02 10:30:00', content: '增加冷却风机运行数量，降低负荷', images: [] },
    { id: 6, eventId: 2, action: '复测确认', operator: '李运维', operateTime: '2026-08-02 14:30:00', content: '温度已降至63℃，恢复正常', images: [] }
  ]
}

// 报表
const reports = [
  { id: 1, reportName: '2026年7月巡检月报', projectId: 0, projectName: '全部项目', period: '2026-07', totalTasks: 120, doneTasks: 108, completionRate: 90, abnormalCount: 8, eventCount: 5, resolvedCount: 4, createTime: '2026-08-01 08:00:00' },
  { id: 2, reportName: '厂区设备巡检-7月报表', projectId: 1, projectName: '厂区设备巡检', period: '2026-07', totalTasks: 36, doneTasks: 34, completionRate: 94, abnormalCount: 3, eventCount: 2, resolvedCount: 2, createTime: '2026-08-01 08:00:00' },
  { id: 3, reportName: '变电站巡检-7月报表', projectId: 2, projectName: '变电站巡检', period: '2026-07', totalTasks: 24, doneTasks: 22, completionRate: 92, abnormalCount: 1, eventCount: 1, resolvedCount: 1, createTime: '2026-08-01 08:00:00' },
  { id: 4, reportName: '暖通空调巡检-7月报表', projectId: 3, projectName: '暖通空调巡检', period: '2026-07', totalTasks: 45, doneTasks: 38, completionRate: 84, abnormalCount: 3, eventCount: 2, resolvedCount: 1, createTime: '2026-08-01 08:00:00' }
]

// 首页统计数据
const dashboardStats = {
  todayTaskTotal: 3,
  todayTaskDone: 1,
  todayTaskPending: 2,
  overdueTask: 1,
  totalPoints: 8,
  abnormalPoints: 1,
  pendingEvents: 2,
  totalEvents: 4,
  weekCompletionRate: 88,
  monthCompletionRate: 90,
  // 近7天巡检趋势
  weekTrend: [
    { date: '07-28', done: 4, abnormal: 0 },
    { date: '07-29', done: 5, abnormal: 1 },
    { date: '07-30', done: 3, abnormal: 0 },
    { date: '07-31', done: 6, abnormal: 2 },
    { date: '08-01', done: 4, abnormal: 1 },
    { date: '08-02', done: 5, abnormal: 2 },
    { date: '08-03', done: 1, abnormal: 0 }
  ],
  // 项目完成率
  projectRates: [
    { name: '厂区设备', rate: 88 },
    { name: '变电站', rate: 92 },
    { name: '暖通空调', rate: 75 },
    { name: '消防设施', rate: 60 }
  ]
}

// 用户信息
const mockUser = {
  userId: 1,
  userName: 'admin',
  nickName: '张巡检',
  phonenumber: '13800138000',
  avatar: '',
  deptId: 1,
  deptName: '巡检部',
  postId: 1,
  postName: '巡检员',
  roles: ['inspector'],
  authType: 'inspector'
}

// 系统监控数据
const monitorData = {
  server: {
    cpu: { usage: 35.6, cores: 8, name: 'Intel Xeon E5-2680' },
    jvm: { usage: 62.3, total: 2048, used: 1275, free: 773, version: 'OpenJDK 1.8.0_292' },
    mem: { usage: 58.2, total: 16384, used: 9544, free: 6840 },
    sys: { os: 'CentOS 7.9', serverIp: '192.168.1.100', osArch: 'amd64' },
    disk: [
      { path: 'C:', type: 'system', total: 512, used: 234, free: 278, usage: 45.7 },
      { path: 'D:', type: 'data', total: 1024, used: 678, free: 346, usage: 66.2 }
    ]
  },
  cache: {
    info: { redis_version: '6.2.6', connected_clients: 12, used_memory_human: '128.5M', dbSize: 1024, uptime_in_days: 45 },
    commandStats: [
      { name: 'get', count: 15823, percentage: 45.2 },
      { name: 'set', count: 8421, percentage: 24.1 },
      { name: 'exists', count: 4521, percentage: 12.9 },
      { name: 'expire', count: 2310, percentage: 6.6 },
      { name: 'del', count: 1892, percentage: 5.4 },
      { name: 'keys', count: 1230, percentage: 3.5 },
      { name: 'hget', count: 678, percentage: 1.9 }
    ]
  }
}

// ============ 设备档案/台账 ============
const equipmentList = [
  { id: 1, equipCode: 'DQ-BYQ-027', equipName: '1号变压器', equipType: '电气设备', equipCategory: '变压器', status: '0', statusText: '报废', spec: 'SFPZ9-120000/110', workshop: '生产车间', location: 'B-1区', manager: '张睿', managerPhone: '138****5678', manufacturer: '北京博驰设备有限公司', supplier: '南京达通设备有限公司', purchaseDate: '2021-05-20', startDate: '2021-05-24', lastSpotCheck: '2023-11-27 10:54', lastInspect: '2024-03-16', lastRepair: '', lastMaintain: '', calibrationCycle: 365, calibrationDate: '2023-11-27', calibrationExpire: '2024-11-27', imageUrl: '', manualUrl: '', qrcode: 'EQ-001', nfcTag: 'NFC-EQ001' },
  { id: 2, equipCode: 'DQ-BYQ-026', equipName: '2号变压器', equipType: '电气设备', equipCategory: '变压器', status: '1', statusText: '正常运行', spec: 'SFSZ9-31500/110', workshop: '配料间', location: 'B-2区', manager: '张睿', managerPhone: '138****5678', manufacturer: '西安昌和设备有限公司', supplier: '南京达通设备有限公司', purchaseDate: '2021-01-14', startDate: '2021-01-18', lastSpotCheck: '2026-07-12 09:51', lastInspect: '2026-07-07', lastRepair: '2026-05-22', lastMaintain: '2026-06-15', calibrationCycle: 365, calibrationDate: '2025-08-01', calibrationExpire: '2026-08-01', imageUrl: '', manualUrl: '', qrcode: 'EQ-002', nfcTag: 'NFC-EQ002' },
  { id: 3, equipCode: 'GY-SB-025', equipName: '冷却水泵-1号', equipType: '共用设备', equipCategory: '水泵', status: '1', statusText: '正常运行', spec: 'QW50-15-25-2.2', workshop: '原料预处理车间', location: 'C-1区', manager: '李运维', managerPhone: '139****1234', manufacturer: '上海凯泉泵业', supplier: '本地供应商', purchaseDate: '2020-03-15', startDate: '2020-04-01', lastSpotCheck: '2026-08-02 08:30', lastInspect: '2026-08-02', lastRepair: '', lastMaintain: '2026-07-20', calibrationCycle: 180, calibrationDate: '2026-02-01', calibrationExpire: '2026-08-01', imageUrl: '', manualUrl: '', qrcode: 'EQ-003', nfcTag: 'NFC-EQ003' },
  { id: 4, equipCode: 'GY-SB-026', equipName: '冷却水泵-2号', equipType: '共用设备', equipCategory: '水泵', status: '2', statusText: '故障待修', spec: 'QW50-15-25-2.2', workshop: '原料预处理车间', location: 'C-1区', manager: '李运维', managerPhone: '139****1234', manufacturer: '上海凯泉泵业', supplier: '本地供应商', purchaseDate: '2020-03-15', startDate: '2020-04-01', lastSpotCheck: '2026-08-02 09:10', lastInspect: '2026-08-02', lastRepair: '', lastMaintain: '2026-07-20', calibrationCycle: 180, calibrationDate: '2026-02-01', calibrationExpire: '2026-08-01', imageUrl: '', manualUrl: '', qrcode: 'EQ-004', nfcTag: 'NFC-EQ004' },
  { id: 5, equipCode: 'KT-ZJ-010', equipName: '中央空调主机', equipType: '暖通设备', equipCategory: '空调主机', status: '1', statusText: '正常运行', spec: 'LSBLX-1200', workshop: '机房B1', location: 'D-1区', manager: '王电工', managerPhone: '137****8888', manufacturer: '格力电器', supplier: '格力代理商', purchaseDate: '2019-06-20', startDate: '2019-07-01', lastSpotCheck: '2026-08-02 08:15', lastInspect: '2026-08-02', lastRepair: '2026-03-10', lastMaintain: '2026-07-05', calibrationCycle: 365, calibrationDate: '2025-09-01', calibrationExpire: '2026-09-01', imageUrl: '', manualUrl: '', qrcode: 'EQ-005', nfcTag: 'NFC-EQ005' },
  { id: 6, equipCode: 'XF-BF-008', equipName: '消防泵组', equipType: '消防设备', equipCategory: '消防泵', status: '1', statusText: '正常运行', spec: 'XBD-L 15/30', workshop: '地下1层', location: 'E-1区', manager: '王电工', managerPhone: '137****8888', manufacturer: '上海连成水泵', supplier: '消防设备商', purchaseDate: '2018-10-01', startDate: '2019-01-01', lastSpotCheck: '2026-08-02 11:00', lastInspect: '2026-08-02', lastRepair: '', lastMaintain: '2026-07-01', calibrationCycle: 365, calibrationDate: '2025-08-15', calibrationExpire: '2026-08-15', imageUrl: '', manualUrl: '', qrcode: 'EQ-006', nfcTag: 'NFC-EQ006' },
  { id: 7, equipCode: 'PLC-DCS-003', equipName: 'DCS控制系统-1号', equipType: '控制设备', equipCategory: 'DCS', status: '1', statusText: '正常运行', spec: 'HollySys MACS-V', workshop: '控制室', location: 'A-3区', manager: '张睿', managerPhone: '138****5678', manufacturer: '和利时', supplier: '和利时代理', purchaseDate: '2020-01-10', startDate: '2020-03-01', lastSpotCheck: '2026-08-03 07:00', lastInspect: '2026-07-28', lastRepair: '', lastMaintain: '2026-06-30', calibrationCycle: 730, calibrationDate: '2025-03-01', calibrationExpire: '2027-03-01', imageUrl: '', manualUrl: '', qrcode: 'EQ-007', nfcTag: 'NFC-EQ007' },
  { id: 8, equipCode: 'YB-LL-015', equipName: '电磁流量计-3号', equipType: '仪表设备', equipCategory: '流量计', status: '1', statusText: '正常运行', spec: 'LDG-100', workshop: '生产车间', location: 'A-1区', manager: '李运维', managerPhone: '139****1234', manufacturer: '开封仪表', supplier: '仪表供应商', purchaseDate: '2021-08-01', startDate: '2021-09-01', lastSpotCheck: '2026-08-01 14:00', lastInspect: '2026-07-20', lastRepair: '', lastMaintain: '2026-06-10', calibrationCycle: 365, calibrationDate: '2025-07-15', calibrationExpire: '2026-07-15', imageUrl: '', manualUrl: '', qrcode: 'EQ-008', nfcTag: 'NFC-EQ008' }
]

const equipStatusMap = {
  '0': { text: '报废', tag: 'tag-gray' },
  '1': { text: '正常运行', tag: 'tag-success' },
  '2': { text: '故障待修', tag: 'tag-danger' },
  '3': { text: '停机保养', tag: 'tag-warning' },
  '4': { text: '待校验', tag: 'tag-info' }
}

// ============ 设备点检 ============
const spotCheckTemplates = [
  { id: 1, itemName: '设备外观', itemType: 'choice', required: true, options: ['正常', '异常'] },
  { id: 2, itemName: '运行状态指示灯', itemType: 'choice', required: true, options: ['正常', '异常'] },
  { id: 3, itemName: '运行声音', itemType: 'choice', required: true, options: ['正常', '异响'] },
  { id: 4, itemName: '温度检查', itemType: 'choice', required: false, options: ['正常', '偏高'] },
  { id: 5, itemName: '清洁度', itemType: 'choice', required: false, options: ['清洁', '需清理'] },
  { id: 6, itemName: '现场拍照', itemType: 'photo', required: true, options: [] }
]

const spotCheckRecords = [
  { id: 1, equipId: 3, equipName: '冷却水泵-1号', equipCode: 'GY-SB-025', checker: '张巡检', checkTime: '2026-08-02 08:30:00', result: '正常', items: [{ itemName: '设备外观', value: '正常' }, { itemName: '运行声音', value: '正常' }, { itemName: '温度检查', value: '正常' }], remark: '一切正常' },
  { id: 2, equipId: 4, equipName: '冷却水泵-2号', equipCode: 'GY-SB-026', checker: '张巡检', checkTime: '2026-08-02 09:10:00', result: '异常', items: [{ itemName: '设备外观', value: '正常' }, { itemName: '运行声音', value: '异响' }, { itemName: '温度检查', value: '偏高' }], remark: '发现异响和温度偏高，已上报报修' },
  { id: 3, equipId: 5, equipName: '中央空调主机', equipCode: 'KT-ZJ-010', checker: '张巡检', checkTime: '2026-08-02 08:15:00', result: '正常', items: [{ itemName: '设备外观', value: '正常' }, { itemName: '运行声音', value: '正常' }, { itemName: '温度检查', value: '正常' }], remark: '运行稳定' },
  { id: 4, equipId: 7, equipName: 'DCS控制系统-1号', equipCode: 'PLC-DCS-003', checker: '李运维', checkTime: '2026-08-03 07:00:00', result: '正常', items: [{ itemName: '设备外观', value: '正常' }, { itemName: '运行状态指示灯', value: '正常' }], remark: '' }
]

// ============ 报修维修 ============
const repairStatusMap = {
  '0': { text: '待受理', tag: 'tag-warning' },
  '1': { text: '已派单', tag: 'tag-primary' },
  '2': { text: '维修中', tag: 'tag-primary' },
  '3': { text: '已完成', tag: 'tag-success' },
  '4': { text: '已关闭', tag: 'tag-gray' }
}

const repairs = [
  { id: 1, repairNo: 'BX20260802001', equipId: 4, equipName: '冷却水泵-2号', equipCode: 'GY-SB-026', title: '冷却水泵2号异响故障', description: '巡检时发现冷却水泵2号运行有异常响声，疑似轴承磨损，温度偏高72℃', level: '3', status: '2', reporter: '张巡检', reporterPhone: '138****5678', repairer: '维修班-赵师傅', createTime: '2026-08-02 09:15:00', acceptTime: '2026-08-02 09:30:00', startTime: '2026-08-02 10:00:00', finishTime: '', images: [], faultType: '机械故障', partsUsed: '轴承6308×2', repairDesc: '正在更换轴承，预计今日完成', cost: 0 },
  { id: 2, repairNo: 'BX20260522001', equipId: 2, equipName: '2号变压器', equipCode: 'DQ-BYQ-026', title: '变压器油温过高', description: '变压器运行油温达到85℃，超出告警值80℃', level: '4', status: '3', reporter: '李运维', reporterPhone: '139****1234', repairer: '电气班-孙师傅', createTime: '2026-05-22 08:00:00', acceptTime: '2026-05-22 08:30:00', startTime: '2026-05-22 09:00:00', finishTime: '2026-05-22 14:00:00', images: [], faultType: '电气故障', partsUsed: '散热风扇×1', repairDesc: '更换散热风扇，清洗散热器，油温恢复正常', cost: 1200 },
  { id: 3, repairNo: 'BX20260310001', equipId: 5, equipName: '中央空调主机', equipCode: 'KT-ZJ-010', title: '空调主机冷媒泄漏', description: '制冷效果下降，疑似冷媒泄漏', level: '3', status: '3', reporter: '王电工', reporterPhone: '137****8888', repairer: '暖通班-周师傅', createTime: '2026-03-10 10:00:00', acceptTime: '2026-03-10 11:00:00', startTime: '2026-03-10 14:00:00', finishTime: '2026-03-11 16:00:00', images: [], faultType: '制冷故障', partsUsed: 'R134a冷媒15kg', repairDesc: '查漏补焊，充注冷媒，制冷恢复正常', cost: 2800 },
  { id: 4, repairNo: 'BX20260803001', equipId: 8, equipName: '电磁流量计-3号', equipCode: 'YB-LL-015', title: '流量计读数不准', description: '流量计显示值与实际偏差较大，需校验', level: '2', status: '0', reporter: '李运维', reporterPhone: '139****1234', repairer: '', createTime: '2026-08-03 08:00:00', acceptTime: '', startTime: '', finishTime: '', images: [], faultType: '仪表故障', partsUsed: '', repairDesc: '', cost: 0 }
]

// ============ 维护保养 ============
const maintainStatusMap = {
  '0': { text: '待执行', tag: 'tag-warning' },
  '1': { text: '执行中', tag: 'tag-primary' },
  '2': { text: '已完成', tag: 'tag-success' },
  '3': { text: '已逾期', tag: 'tag-danger' }
}

const maintains = [
  { id: 1, maintainNo: 'BY20260720001', equipId: 3, equipName: '冷却水泵-1号', equipCode: 'GY-SB-025', planName: '月度保养', type: '定期保养', content: '更换润滑油、检查密封件、紧固螺栓', maintainer: '张巡检', status: '2', planDate: '2026-07-20', finishTime: '2026-07-20 15:30:00', items: [{ name: '更换润滑油', done: true }, { name: '检查密封件', done: true }, { name: '紧固螺栓', done: true }, { name: '运行测试', done: true }], remark: '保养完成，运行正常', cost: 200 },
  { id: 2, maintainNo: 'BY20260815001', equipId: 5, equipName: '中央空调主机', equipCode: 'KT-ZJ-010', planName: '季度保养', type: '定期保养', content: '清洗冷凝器、检查冷媒、更换滤芯', maintainer: '王电工', status: '0', planDate: '2026-08-15', finishTime: '', items: [{ name: '清洗冷凝器', done: false }, { name: '检查冷媒压力', done: false }, { name: '更换滤芯', done: false }, { name: '运行测试', done: false }], remark: '', cost: 0 },
  { id: 3, maintainNo: 'BY20260630001', equipId: 7, equipName: 'DCS控制系统-1号', equipCode: 'PLC-DCS-003', planName: '半年保养', type: '定期保养', content: '系统备份、卡件检查、接线紧固', maintainer: '张睿', status: '2', planDate: '2026-06-30', finishTime: '2026-06-30 17:00:00', items: [{ name: '系统备份', done: true }, { name: '卡件检查', done: true }, { name: '接线紧固', done: true }], remark: '系统备份完成，卡件正常', cost: 0 },
  { id: 4, maintainNo: 'BY20260801001', equipId: 1, equipName: '1号变压器', equipCode: 'DQ-BYQ-027', planName: '年度保养', type: '年度大修', content: '油样化验、绝缘测试、套管清洁', maintainer: '李运维', status: '3', planDate: '2026-08-01', finishTime: '', items: [{ name: '油样化验', done: false }, { name: '绝缘测试', done: false }, { name: '套管清洁', done: false }], remark: '设备已报废，保养取消', cost: 0 },
  { id: 5, maintainNo: 'BY20260901001', equipId: 6, equipName: '消防泵组', equipCode: 'XF-BF-008', planName: '月度保养', type: '定期保养', content: '启动测试、阀门润滑、压力校验', maintainer: '王电工', status: '0', planDate: '2026-09-01', finishTime: '', items: [{ name: '启动测试', done: false }, { name: '阀门润滑', done: false }, { name: '压力校验', done: false }], remark: '', cost: 0 }
]

// ============ 备件管理 ============
const spareParts = [
  { id: 1, partCode: 'SP-001', partName: '深沟球轴承6308', category: '机械备件', brand: 'SKF', spec: '6308-2RS', unit: '个', stock: 12, minStock: 5, maxStock: 30, unitPrice: 85.5, supplier: 'SKF代理商', location: 'A库-01架', relatedEquip: '冷却水泵', totalIn: 50, totalOut: 38, status: '1' },
  { id: 2, partName: 'R134a冷媒', partCode: 'SP-002', category: '制冷备件', brand: '杜邦', spec: '10kg/瓶', unit: '瓶', stock: 3, minStock: 2, maxStock: 10, unitPrice: 320, supplier: '制冷材料商', location: 'B库-03架', relatedEquip: '中央空调主机', totalIn: 20, totalOut: 17, status: '1' },
  { id: 3, partCode: 'SP-003', partName: '散热风扇120mm', category: '电气备件', brand: '台达', spec: 'AC220V/50W', unit: '个', stock: 2, minStock: 3, maxStock: 15, unitPrice: 145, supplier: '台达代理', location: 'A库-02架', relatedEquip: '变压器', totalIn: 15, totalOut: 13, status: '0' },
  { id: 4, partCode: 'SP-004', partName: '密封圈O型', category: '密封件', brand: 'NOK', spec: 'Φ50×3.5', unit: '个', stock: 80, minStock: 30, maxStock: 200, unitPrice: 2.5, supplier: '密封件商', location: 'C库-01架', relatedEquip: '水泵/阀门', totalIn: 200, totalOut: 120, status: '1' },
  { id: 5, partCode: 'SP-005', partName: '空气滤芯', category: '过滤备件', brand: '曼牌', spec: 'C30830', unit: '个', stock: 8, minStock: 5, maxStock: 20, unitPrice: 68, supplier: '曼牌代理', location: 'B库-02架', relatedEquip: '中央空调主机', totalIn: 30, totalOut: 22, status: '1' },
  { id: 6, partCode: 'SP-006', partName: '润滑油46号', category: '润滑材料', brand: '美孚', spec: '20L/桶', unit: '桶', stock: 4, minStock: 3, maxStock: 15, unitPrice: 580, supplier: '美孚代理', location: 'B库-04架', relatedEquip: '通用设备', totalIn: 15, totalOut: 11, status: '1' }
]

// ============ 安灯呼叫 ============
const andonRecords = [
  { id: 1, equipId: 4, equipName: '冷却水泵-2号', equipCode: 'GY-SB-026', caller: '张巡检', callType: '设备故障', callTime: '2026-08-02 09:12:00', status: '1', statusText: '已响应', responder: '维修班-赵师傅', responseTime: '2026-08-02 09:20:00', description: '设备异响，需紧急维修', location: 'C-1区' },
  { id: 2, equipId: 2, equipName: '2号变压器', equipCode: 'DQ-BYQ-026', caller: '李运维', callType: '质量异常', callTime: '2026-05-22 08:00:00', status: '2', statusText: '已处理', responder: '电气班-孙师傅', responseTime: '2026-05-22 08:10:00', resolveTime: '2026-05-22 14:00:00', description: '油温过高告警', location: 'B-2区' },
  { id: 3, equipId: 5, equipName: '中央空调主机', equipCode: 'KT-ZJ-010', caller: '王电工', callType: '求助支援', callTime: '2026-03-10 10:00:00', status: '2', statusText: '已处理', responder: '暖通班-周师傅', responseTime: '2026-03-10 10:30:00', resolveTime: '2026-03-11 16:00:00', description: '冷媒泄漏需专业维修', location: 'D-1区' }
]

// ============ 物联网数采 ============
const iotDevices = [
  { id: 1, equipId: 2, equipName: '2号变压器', equipCode: 'DQ-BYQ-026', online: true, sensors: [{ name: '油温', value: 62, unit: '℃', threshold: 80, status: 'normal' }, { name: '负载', value: 75, unit: '%', threshold: 95, status: 'normal' }, { name: '电压', value: 110.2, unit: 'kV', threshold: 121, status: 'normal' }], lastUpdate: '2026-08-03 08:00:00' },
  { id: 2, equipId: 3, equipName: '冷却水泵-1号', equipCode: 'GY-SB-025', online: true, sensors: [{ name: '出口压力', value: 0.35, unit: 'MPa', threshold: 0.5, status: 'normal' }, { name: '流量', value: 48, unit: 'm³/h', threshold: 60, status: 'normal' }, { name: '电流', value: 12.5, unit: 'A', threshold: 18, status: 'normal' }, { name: '振动', value: 2.1, unit: 'mm/s', threshold: 4.5, status: 'normal' }], lastUpdate: '2026-08-03 08:00:00' },
  { id: 3, equipId: 4, equipName: '冷却水泵-2号', equipCode: 'GY-SB-026', online: true, sensors: [{ name: '出口压力', value: 0.28, unit: 'MPa', threshold: 0.5, status: 'warning' }, { name: '流量', value: 35, unit: 'm³/h', threshold: 60, status: 'warning' }, { name: '电流', value: 15.8, unit: 'A', threshold: 18, status: 'warning' }, { name: '振动', value: 5.2, unit: 'mm/s', threshold: 4.5, status: 'danger' }], lastUpdate: '2026-08-03 08:00:00' },
  { id: 4, equipId: 5, equipName: '中央空调主机', equipCode: 'KT-ZJ-010', online: true, sensors: [{ name: '出水温度', value: 8.5, unit: '℃', threshold: 12, status: 'normal' }, { name: '回水温度', value: 15.2, unit: '℃', threshold: 20, status: 'normal' }, { name: '冷媒压力', value: 0.42, unit: 'MPa', threshold: 0.5, status: 'normal' }, { name: '功率', value: 85, unit: 'kW', threshold: 120, status: 'normal' }], lastUpdate: '2026-08-03 08:00:00' },
  { id: 5, equipId: 8, equipName: '电磁流量计-3号', equipCode: 'YB-LL-015', online: false, sensors: [{ name: '瞬时流量', value: 0, unit: 'm³/h', threshold: 100, status: 'offline' }, { name: '累计流量', value: 152836, unit: 'm³', threshold: 0, status: 'offline' }], lastUpdate: '2026-08-02 14:00:00' }
]

// ============ 到期提醒 ============
const reminders = [
  { id: 1, equipId: 3, equipName: '冷却水泵-1号', equipCode: 'GY-SB-025', type: '校验到期', expireDate: '2026-08-01', daysLeft: -2, status: 'expired', manager: '李运维' },
  { id: 2, equipId: 4, equipName: '冷却水泵-2号', equipCode: 'GY-SB-026', type: '校验到期', expireDate: '2026-08-01', daysLeft: -2, status: 'expired', manager: '李运维' },
  { id: 3, equipId: 6, equipName: '消防泵组', equipCode: 'XF-BF-008', type: '校验到期', expireDate: '2026-08-15', daysLeft: 12, status: 'soon', manager: '王电工' },
  { id: 4, equipId: 2, equipName: '2号变压器', equipCode: 'DQ-BYQ-026', type: '校验到期', expireDate: '2026-08-01', daysLeft: -2, status: 'expired', manager: '张睿' },
  { id: 5, equipId: 8, equipName: '电磁流量计-3号', equipCode: 'YB-LL-015', type: '校验到期', expireDate: '2026-07-15', daysLeft: -19, status: 'expired', manager: '李运维' },
  { id: 6, equipId: 5, equipName: '中央空调主机', equipCode: 'KT-ZJ-010', type: '保养到期', expireDate: '2026-08-15', daysLeft: 12, status: 'soon', manager: '王电工' },
  { id: 7, equipId: 7, equipName: 'DCS控制系统-1号', equipCode: 'PLC-DCS-003', type: '保养到期', expireDate: '2026-08-30', daysLeft: 27, status: 'normal', manager: '张睿' }
]

// ============ 设备动态看板 ============
const equipDashboard = {
  totalEquip: 8,
  normalCount: 5,
  faultCount: 1,
  scrapCount: 1,
  maintainCount: 0,
  pendingCalibration: 3,
  // OEE指标 (整体设备效率 = 可用率 × 表现率 × 质量率)
  oee: {
    availability: 92.5,   // 可用率
    performance: 87.3,     // 表现率
    quality: 98.1,         // 质量率
    oeeValue: 79.1         // OEE = 92.5% × 87.3% × 98.1% ≈ 79.1%
  },
  // MTBF/MTTR
  mtbf: 720, // 平均故障间隔时间(小时)
  mttr: 4.5, // 平均修复时间(小时)
  faultRate: 12.5, // 故障率(%)
  utilizationRate: 85.6, // 设备利用率(%)
  // 按类型分布
  typeDistribution: [
    { name: '电气设备', count: 2, color: '#2563eb' },
    { name: '共用设备', count: 2, color: '#10b981' },
    { name: '暖通设备', count: 1, color: '#f59e0b' },
    { name: '消防设备', count: 1, color: '#ef4444' },
    { name: '控制设备', count: 1, color: '#6366f1' },
    { name: '仪表设备', count: 1, color: '#8b5cf6' }
  ],
  // 按状态分布
  statusDistribution: [
    { name: '正常运行', count: 5, color: '#10b981' },
    { name: '故障待修', count: 1, color: '#ef4444' },
    { name: '报废', count: 1, color: '#9ca3af' },
    { name: '停机保养', count: 0, color: '#f59e0b' },
    { name: '待校验', count: 1, color: '#3b82f6' }
  ],
  // 各车间设备数
  workshopDistribution: [
    { name: '生产车间', count: 3 },
    { name: '配料间', count: 1 },
    { name: '机房B1', count: 1 },
    { name: '控制室', count: 1 },
    { name: '地下1层', count: 1 },
    { name: '原料预处理', count: 1 }
  ],
  // 近30天点检/巡检/维修趋势
  trend30: [
    { date: '07-05', spotCheck: 8, inspect: 3, repair: 0 },
    { date: '07-10', spotCheck: 10, inspect: 4, repair: 1 },
    { date: '07-15', spotCheck: 9, inspect: 3, repair: 0 },
    { date: '07-20', spotCheck: 12, inspect: 5, repair: 1 },
    { date: '07-25', spotCheck: 8, inspect: 2, repair: 0 },
    { date: '07-30', spotCheck: 11, inspect: 4, repair: 1 },
    { date: '08-03', spotCheck: 6, inspect: 2, repair: 1 }
  ],
  // 维修费用趋势
  costTrend: [
    { month: '3月', cost: 2800 },
    { month: '4月', cost: 500 },
    { month: '5月', cost: 1200 },
    { month: '6月', cost: 300 },
    { month: '7月', cost: 200 },
    { month: '8月', cost: 0 }
  ],
  // 故障率趋势(近6月)
  faultRateTrend: [
    { month: '3月', rate: 18.5 },
    { month: '4月', rate: 15.2 },
    { month: '5月', rate: 16.8 },
    { month: '6月', rate: 14.3 },
    { month: '7月', rate: 13.1 },
    { month: '8月', rate: 12.5 }
  ],
  // 点检分布统计
  spotCheckDist: {
    total: 156,
    normalCount: 142,
    abnormalCount: 14,
    completionRate: 91.2,
    passRate: 91.0,
    // 按设备类型分布
    byType: [
      { name: '电气设备', total: 40, normal: 38, abnormal: 2 },
      { name: '共用设备', total: 45, normal: 40, abnormal: 5 },
      { name: '暖通设备', total: 28, normal: 26, abnormal: 2 },
      { name: '消防设备', total: 15, normal: 15, abnormal: 0 },
      { name: '控制设备', total: 18, normal: 17, abnormal: 1 },
      { name: '仪表设备', total: 10, normal: 6, abnormal: 4 }
    ],
    // 近7天点检趋势
    trend: [
      { date: '07-28', total: 5, normal: 5, abnormal: 0 },
      { date: '07-29', total: 6, normal: 5, abnormal: 1 },
      { date: '07-30', total: 4, normal: 4, abnormal: 0 },
      { date: '07-31', total: 7, normal: 6, abnormal: 1 },
      { date: '08-01', total: 5, normal: 4, abnormal: 1 },
      { date: '08-02', total: 6, normal: 5, abnormal: 1 },
      { date: '08-03', total: 3, normal: 3, abnormal: 0 }
    ],
    // 常见异常项Top5
    topAbnormal: [
      { name: '运行声音异常', count: 5, percent: 35.7 },
      { name: '温度偏高', count: 4, percent: 28.6 },
      { name: '振动幅度大', count: 2, percent: 14.3 },
      { name: '外观破损', count: 2, percent: 14.3 },
      { name: '清洁度不达标', count: 1, percent: 7.1 }
    ]
  },
  // 维修分布统计
  repairDist: {
    total: 24,
    completed: 20,
    inProgress: 2,
    pending: 2,
    avgResponseTime: 28, // 平均响应时间(分钟)
    avgRepairTime: 5.2,  // 平均维修时间(小时)
    completionRate: 83.3,
    // 按故障类型分布
    byFaultType: [
      { name: '机械故障', count: 9, color: '#ef4444' },
      { name: '电气故障', count: 6, color: '#f59e0b' },
      { name: '仪表故障', count: 4, color: '#3b82f6' },
      { name: '制冷故障', count: 3, color: '#10b981' },
      { name: '其他', count: 2, color: '#9ca3af' }
    ],
    // 按设备分布Top5
    byEquip: [
      { name: '冷却水泵-2号', count: 5 },
      { name: '2号变压器', count: 4 },
      { name: '中央空调主机', count: 3 },
      { name: '电磁流量计-3号', count: 2 },
      { name: 'DCS控制系统', count: 1 }
    ],
    // 响应时间分布
    responseTimeDist: [
      { range: '0-15分钟', count: 12 },
      { range: '15-30分钟', count: 6 },
      { range: '30-60分钟', count: 4 },
      { range: '1小时以上', count: 2 }
    ],
    // 月度维修趋势
    trend: [
      { month: '3月', count: 3, cost: 2800 },
      { month: '4月', count: 5, cost: 500 },
      { month: '5月', count: 4, cost: 1200 },
      { month: '6月', count: 6, cost: 300 },
      { month: '7月', count: 4, cost: 200 },
      { month: '8月', count: 2, cost: 0 }
    ]
  },
  // 保养分布统计
  maintainDist: {
    total: 18,
    completed: 14,
    pending: 3,
    overdue: 1,
    completionRate: 77.8,
    // 按保养类型分布
    byType: [
      { name: '定期保养', count: 12, color: '#2563eb' },
      { name: '季度保养', count: 3, color: '#10b981' },
      { name: '年度大修', count: 2, color: '#f59e0b' },
      { name: '紧急保养', count: 1, color: '#ef4444' }
    ],
    // 保养费用统计
    costStats: {
      totalCost: 4200,
      avgCost: 233,
      // 月度费用趋势
      trend: [
        { month: '3月', cost: 800 },
        { month: '4月', cost: 1200 },
        { month: '5月', cost: 600 },
        { month: '6月', cost: 900 },
        { month: '7月', cost: 500 },
        { month: '8月', cost: 200 }
      ]
    }
  }
}

// ============ 设备健康分 ============
const equipHealthScores = {
  1: { score: 0, level: '报废', color: '#9ca3af', suggestions: '设备已报废，建议报废处理' },
  2: { score: 88, level: '良好', color: '#10b981', suggestions: '设备运行状态良好，保持日常维护' },
  3: { score: 82, level: '良好', color: '#10b981', suggestions: '设备校验即将到期，请及时安排' },
  4: { score: 35, level: '危险', color: '#ef4444', suggestions: '设备故障待修，振动值超标，需立即维修' },
  5: { score: 90, level: '优秀', color: '#10b981', suggestions: '设备运行优秀，各项指标正常' },
  6: { score: 85, level: '良好', color: '#10b981', suggestions: '设备校验即将到期，请关注' },
  7: { score: 92, level: '优秀', color: '#10b981', suggestions: '系统运行稳定，无异常' },
  8: { score: 45, level: '警告', color: '#f59e0b', suggestions: '设备已离线，校验已过期，需尽快处理' }
}

// ============ 可配置基础数据 ============
// 设备类型（可增删改）
const equipTypes = [
  { id: 1, typeName: '电气设备', code: 'DQ', description: '变压器、开关柜等电气设备', sort: 1, enabled: true },
  { id: 2, typeName: '共用设备', code: 'GY', description: '水泵、风机等共用设备', sort: 2, enabled: true },
  { id: 3, typeName: '暖通设备', code: 'KT', description: '空调、暖通系统设备', sort: 3, enabled: true },
  { id: 4, typeName: '消防设备', code: 'XF', description: '消防泵、灭火器等消防设备', sort: 4, enabled: true },
  { id: 5, typeName: '控制设备', code: 'PLC', description: 'PLC、DCS等控制系统', sort: 5, enabled: true },
  { id: 6, typeName: '仪表设备', code: 'YB', description: '流量计、温度计等仪表', sort: 6, enabled: true },
  { id: 7, typeName: '机械设备', code: 'JX', description: '传送带、电机等机械', sort: 7, enabled: true },
  { id: 8, typeName: '环保设备', code: 'HB', description: '除尘、废水处理等环保设备', sort: 8, enabled: false }
]

// 巡查类型（可增删改）
const inspectionTypes = [
  { id: 1, typeName: '日常巡检', code: 'RC', cycle: '每日', description: '每日例行巡检', sort: 1, enabled: true },
  { id: 2, typeName: '定期巡检', code: 'DQ', cycle: '每周', description: '每周定期巡检', sort: 2, enabled: true },
  { id: 3, typeName: '专项巡检', code: 'ZX', cycle: '不定期', description: '特定项目专项巡检', sort: 3, enabled: true },
  { id: 4, typeName: '月度巡检', code: 'YD', cycle: '每月', description: '月度综合巡检', sort: 4, enabled: true },
  { id: 5, typeName: '季度巡检', code: 'JD', cycle: '每季', description: '季度全面巡检', sort: 5, enabled: true },
  { id: 6, typeName: '年度巡检', code: 'ND', cycle: '每年', description: '年度大检修', sort: 6, enabled: true }
]

// 设备参数模板（可增删改）
const equipParams = [
  { id: 1, paramName: '额定电压', unit: 'V', paramType: 'number', defaultValue: '', description: '设备额定工作电压', applicableType: '电气设备' },
  { id: 2, paramName: '额定电流', unit: 'A', paramType: 'number', defaultValue: '', description: '设备额定工作电流', applicableType: '电气设备' },
  { id: 3, paramName: '额定功率', unit: 'kW', paramType: 'number', defaultValue: '', description: '设备额定功率', applicableType: '共用设备' },
  { id: 4, paramName: '额定流量', unit: 'm³/h', paramType: 'number', defaultValue: '', description: '设备额定流量', applicableType: '共用设备' },
  { id: 5, paramName: '工作压力', unit: 'MPa', paramType: 'number', defaultValue: '', description: '设备工作压力', applicableType: '共用设备' },
  { id: 6, paramName: '工作温度', unit: '℃', paramType: 'number', defaultValue: '', description: '设备工作温度范围', applicableType: '暖通设备' },
  { id: 7, paramName: '转速', unit: 'r/min', paramType: 'number', defaultValue: '', description: '设备额定转速', applicableType: '机械设备' },
  { id: 8, paramName: '防护等级', unit: '', paramType: 'text', defaultValue: 'IP54', description: '设备防护等级', applicableType: '通用' },
  { id: 9, paramName: '防爆等级', unit: '', paramType: 'text', defaultValue: '', description: '设备防爆等级', applicableType: '通用' },
  { id: 10, paramName: '绝缘等级', unit: '', paramType: 'text', defaultValue: 'F', description: '设备绝缘等级', applicableType: '电气设备' }
]

// 区域位置（可增删改，支持层级）
const areaLocations = [
  { id: 1, areaName: 'A厂区', code: 'A', parentId: 0, sort: 1, description: '主厂区', enabled: true },
  { id: 2, areaName: 'A车间1楼', code: 'A-1', parentId: 1, sort: 1, description: '生产线区域', enabled: true },
  { id: 3, areaName: 'A车间2楼', code: 'A-2', parentId: 1, sort: 2, description: '包装区域', enabled: true },
  { id: 4, areaName: 'B厂区', code: 'B', parentId: 0, sort: 2, description: '辅助厂区', enabled: true },
  { id: 5, areaName: 'B-1区', code: 'B-1', parentId: 4, sort: 1, description: '变配电区域', enabled: true },
  { id: 6, areaName: 'B-2区', code: 'B-2', parentId: 4, sort: 2, description: '配料间', enabled: true },
  { id: 7, areaName: 'C厂区', code: 'C', parentId: 0, sort: 3, description: '原料预处理区', enabled: true },
  { id: 8, areaName: 'C-1区', code: 'C-1', parentId: 7, sort: 1, description: '原料车间', enabled: true },
  { id: 9, areaName: 'D厂区', code: 'D', parentId: 0, sort: 4, description: '机房区域', enabled: true },
  { id: 10, areaName: 'D-1区', code: 'D-1', parentId: 9, sort: 1, description: '空调机房B1', enabled: true },
  { id: 11, areaName: 'E厂区', code: 'E', parentId: 0, sort: 5, description: '消防区域', enabled: true },
  { id: 12, areaName: 'E-1区', code: 'E-1', parentId: 11, sort: 1, description: '地下1层消防泵房', enabled: true }
]

// 保养类型（可增删改）
const maintainTypes = [
  { id: 1, typeName: '日常保养', code: 'RC', cycle: '每日', description: '日常清洁、检查', sort: 1, enabled: true },
  { id: 2, typeName: '定期保养', code: 'DQ', cycle: '每月', description: '月度定期保养', sort: 2, enabled: true },
  { id: 3, typeName: '季度保养', code: 'JD', cycle: '每季', description: '季度维护保养', sort: 3, enabled: true },
  { id: 4, typeName: '年度大修', code: 'ND', cycle: '每年', description: '年度大修保养', sort: 4, enabled: true },
  { id: 5, typeName: '紧急保养', code: 'JJ', cycle: '不定期', description: '紧急情况下的保养', sort: 5, enabled: true }
]

// 保养项目模板（可增删改）
const maintainItems = [
  { id: 1, itemName: '清洁设备外部', itemType: 'check', required: true, applicableType: '通用', description: '清洁设备外表面灰尘油污' },
  { id: 2, itemName: '检查紧固螺栓', itemType: 'check', required: true, applicableType: '机械', description: '检查并紧固各连接螺栓' },
  { id: 3, itemName: '更换润滑油', itemType: 'action', required: false, applicableType: '机械', description: '更换设备润滑油/脂' },
  { id: 4, itemName: '检查密封件', itemType: 'check', required: true, applicableType: '通用', description: '检查密封件是否老化破损' },
  { id: 5, itemName: '电气接线检查', itemType: 'check', required: true, applicableType: '电气', description: '检查电气接线是否松动' },
  { id: 6, itemName: '绝缘电阻测试', itemType: 'measure', required: false, applicableType: '电气', description: '测量绝缘电阻值', standard: '≥0.5MΩ' },
  { id: 7, itemName: '校准仪表', itemType: 'action', required: false, applicableType: '仪表', description: '校准仪表精度' },
  { id: 8, itemName: '更换滤芯', itemType: 'action', required: false, applicableType: '暖通', description: '更换空气/液体滤芯' },
  { id: 9, itemName: '系统备份', itemType: 'action', required: true, applicableType: '控制', description: '控制系统数据备份' },
  { id: 10, itemName: '运行测试', itemType: 'check', required: true, applicableType: '通用', description: '保养后运行测试验证' }
]

// 故障类型（可增删改）
const faultTypes = [
  { id: 1, typeName: '机械故障', code: 'JX', description: '轴承、密封件等机械故障', sort: 1, enabled: true },
  { id: 2, typeName: '电气故障', code: 'DQ', description: '电气元件、线路故障', sort: 2, enabled: true },
  { id: 3, typeName: '仪表故障', code: 'YB', description: '仪表读数异常、失灵', sort: 3, enabled: true },
  { id: 4, typeName: '制冷故障', code: 'ZL', description: '冷媒泄漏、制冷不足', sort: 4, enabled: true },
  { id: 5, typeName: '控制故障', code: 'KZ', description: 'PLC/DCS系统故障', sort: 5, enabled: true },
  { id: 6, typeName: '管道泄漏', code: 'GD', description: '管道、阀门泄漏', sort: 6, enabled: true },
  { id: 7, typeName: '其他', code: 'QT', description: '其他类型故障', sort: 99, enabled: true }
]

// 备件分类（可增删改）
const sparePartCategories = [
  { id: 1, categoryName: '机械备件', code: 'JX', description: '轴承、齿轮、传动件等', sort: 1, enabled: true },
  { id: 2, categoryName: '电气备件', code: 'DQ', description: '电机、开关、接触器等', sort: 2, enabled: true },
  { id: 3, categoryName: '制冷备件', code: 'ZL', description: '冷媒、压缩机、冷凝器等', sort: 3, enabled: true },
  { id: 4, categoryName: '密封件', code: 'MF', description: 'O型圈、油封、垫片等', sort: 4, enabled: true },
  { id: 5, categoryName: '过滤备件', code: 'GL', description: '滤芯、滤网等', sort: 5, enabled: true },
  { id: 6, categoryName: '润滑材料', code: 'RH', description: '润滑油、润滑脂等', sort: 6, enabled: true },
  { id: 7, categoryName: '仪表备件', code: 'YB', description: '传感器、变送器等', sort: 7, enabled: true },
  { id: 8, categoryName: '其他备件', code: 'QT', description: '其他类型备件', sort: 99, enabled: true }
]

// ============ 设备清单（综合关联所有模块） ============
const equipInventory = equipmentList.map(equip => {
  const spotChecks = spotCheckRecords.filter(s => s.equipId === equip.id)
  const equipRepairs = repairs.filter(r => r.equipId === equip.id)
  const equipMaintains = maintains.filter(m => m.equipId === equip.id)
  const iotDevice = iotDevices.find(d => d.equipId === equip.id)
  const remindersForEquip = reminders.filter(r => r.equipId === equip.id)
  const andonsForEquip = andonRecords.filter(a => a.equipId === equip.id)
  const healthScore = equipHealthScores[equip.id] || null
  return {
    ...equip,
    // 关联模块摘要
    spotCheckCount: spotChecks.length,
    lastSpotCheckResult: spotChecks.length > 0 ? spotChecks[spotChecks.length - 1].result : '未点检',
    repairCount: equipRepairs.length,
    pendingRepairCount: equipRepairs.filter(r => r.status !== '3' && r.status !== '4').length,
    maintainCount: equipMaintains.length,
    pendingMaintainCount: equipMaintains.filter(m => m.status === '0' || m.status === '3').length,
    iotOnline: iotDevice ? iotDevice.online : false,
    iotDevice: iotDevice || null,
    reminderCount: remindersForEquip.length,
    andonCount: andonsForEquip.length,
    healthScore: healthScore,
    // 设备参数（根据设备类型动态关联）
    params: equipParams.filter(p => p.applicableType === equip.equipType || p.applicableType === '通用').slice(0, 4).map(p => ({
      paramName: p.paramName,
      value: '',
      unit: p.unit
    })),
    // 适用的保养项目
    applicableMaintainItems: maintainItems.filter(m => m.applicableType === '通用' || equip.equipType.indexOf(m.applicableType) > -1).slice(0, 5)
  }
})

module.exports = {
  projects,
  points,
  checkItemTemplates,
  plans,
  tasks,
  records,
  events,
  eventTracks,
  reports,
  dashboardStats,
  mockUser,
  monitorData,
  equipmentList,
  equipStatusMap,
  spotCheckTemplates,
  spotCheckRecords,
  repairStatusMap,
  repairs,
  maintainStatusMap,
  maintains,
  spareParts,
  andonRecords,
  iotDevices,
  reminders,
  equipDashboard,
  equipHealthScores,
  equipTypes,
  inspectionTypes,
  equipParams,
  areaLocations,
  maintainTypes,
  maintainItems,
  faultTypes,
  sparePartCategories,
  equipInventory
}
