// utils/api.js - API接口定义（含Mock回退）
const { get, post, put, del } = require('./request')
const mock = require('./mock')
const { uuid, genTaskNo, deepClone } = require('./util')

const app = getApp()
const USE_MOCK = app ? app.globalData.useMock : true

/** 模拟异步请求 */
function mockResponse(data, delay = 300) {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ code: 200, msg: 'success', data }), delay)
  })
}

// ============ 认证相关 ============
const authApi = {
  // 登录（账号密码）
  login(data) {
    if (USE_MOCK) {
      const user = deepClone(mock.mockUser)
      user.userName = data.username || 'admin'
      return mockResponse({ token: 'mock-jwt-token-' + Date.now(), user })
    }
    return post('/api/wx/login', data)
  },

  // 微信登录
  wxLogin(code) {
    if (USE_MOCK) {
      return mockResponse({ token: 'mock-jwt-token-' + Date.now(), user: deepClone(mock.mockUser) })
    }
    return post('/api/wx/wxLogin', { code })
  },

  // 获取用户信息
  getUserInfo() {
    if (USE_MOCK) return mockResponse(deepClone(mock.mockUser))
    return get('/api/wx/getUserInfoData')
  },

  // 退出登录
  logout() {
    if (USE_MOCK) return mockResponse({})
    return post('/logout')
  },

  // 注册
  register(data) {
    if (USE_MOCK) {
      const newUser = {
        userId: Date.now(),
        userName: data.username,
        nickName: data.nickName || data.username,
        phonenumber: data.phone || '',
        email: data.email || '',
        deptName: data.deptName || '巡检部',
        postName: '巡检员',
        role: data.role || 'inspector',
        avatar: '',
        createTime: new Date().toLocaleString()
      }
      return mockResponse({ success: true, user: newUser })
    }
    return post('/api/wx/register', data)
  },

  // 飞书登录
  feishuLogin(openId) {
    if (USE_MOCK) {
      const user = deepClone(mock.mockUser)
      user.feishuBound = true
      user.feishuOpenId = openId
      return mockResponse({ token: 'mock-jwt-token-' + Date.now(), user })
    }
    return post('/api/wx/feishuLogin', { openId })
  },

  // 发送短信验证码
  sendSmsCode(phone, type = 'register') {
    if (USE_MOCK) {
      const code = String(Math.floor(100000 + Math.random() * 900000))
      const smsStore = wx.getStorageSync('sms_codes') || {}
      smsStore[phone] = { code, type, expire: Date.now() + 5 * 60 * 1000 }
      wx.setStorageSync('sms_codes', smsStore)
      console.log('[Mock SMS] 验证码:', code)
      return mockResponse({ success: true, msg: '验证码已发送(模拟)' })
    }
    return post('/api/wx/sendSms', { phone, type })
  },

  // 验证短信验证码
  verifySmsCode(phone, code) {
    if (USE_MOCK) {
      const smsStore = wx.getStorageSync('sms_codes') || {}
      const record = smsStore[phone]
      if (!record) return mockResponse({ success: false, msg: '验证码不存在或已过期' })
      if (Date.now() > record.expire) return mockResponse({ success: false, msg: '验证码已过期' })
      if (record.code !== code) return mockResponse({ success: false, msg: '验证码不正确' })
      delete smsStore[phone]
      wx.setStorageSync('sms_codes', smsStore)
      return mockResponse({ success: true })
    }
    return post('/api/wx/verifySms', { phone, code })
  },

  // 找回密码
  resetPassword(data) {
    if (USE_MOCK) {
      return mockResponse({ success: true, msg: '密码重置成功' })
    }
    return post('/api/wx/resetPassword', data)
  },

  // 绑定微信账号
  bindWxAccount(data) {
    if (USE_MOCK) {
      const user = deepClone(mock.mockUser)
      user.wxBound = true
      user.wxOpenId = data.code || 'wx_open_id_mock'
      return mockResponse({ success: true, user })
    }
    return post('/api/wx/bindWx', data)
  },

  // 解绑微信账号
  unbindWxAccount(userId) {
    if (USE_MOCK) {
      return mockResponse({ success: true, msg: '微信账号已解绑' })
    }
    return post('/api/wx/unbindWx', { userId })
  },

  // 绑定飞书账号
  bindFeishuAccount(data) {
    if (USE_MOCK) {
      const user = deepClone(mock.mockUser)
      user.feishuBound = true
      user.feishuOpenId = data.openId || 'feishu_open_id_mock'
      user.feishuName = data.name || '飞书用户'
      return mockResponse({ success: true, user })
    }
    return post('/api/wx/bindFeishu', data)
  },

  // 解绑飞书账号
  unbindFeishuAccount(userId) {
    if (USE_MOCK) {
      return mockResponse({ success: true, msg: '飞书账号已解绑' })
    }
    return post('/api/wx/unbindFeishu', { userId })
  },

  // 手机号+验证码登录
  smsLogin(data) {
    if (USE_MOCK) {
      const user = deepClone(mock.mockUser)
      user.phonenumber = data.phone
      return mockResponse({ token: 'mock-jwt-token-' + Date.now(), user })
    }
    return post('/api/wx/smsLogin', data)
  }
}

// ============ 首页仪表盘 ============
const dashboardApi = {
  getStats() {
    if (USE_MOCK) return mockResponse(deepClone(mock.dashboardStats))
    return get('/api/inspection/dashboard/stats')
  }
}

// ============ 巡检项目 ============
const projectApi = {
  list(params) {
    if (USE_MOCK) {
      let list = deepClone(mock.projects)
      if (params && params.projectName) {
        list = list.filter(p => p.projectName.indexOf(params.projectName) > -1)
      }
      if (params && params.status) {
        list = list.filter(p => p.status === params.status)
      }
      return mockResponse({ rows: list, total: list.length })
    }
    return get('/api/inspection/project/list', params)
  },
  detail(id) {
    if (USE_MOCK) {
      const item = deepClone(mock.projects.find(p => p.id == id))
      return mockResponse(item)
    }
    return get('/api/inspection/project/' + id)
  },
  add(data) {
    if (USE_MOCK) {
      const item = { id: mock.projects.length + 1, ...data, createTime: new Date().toLocaleString(), taskCount: 0, completionRate: 0, pointCount: 0 }
      return mockResponse(item)
    }
    return post('/api/inspection/project', data)
  },
  update(data) {
    if (USE_MOCK) return mockResponse(data)
    return put('/api/inspection/project', data)
  },
  remove(id) {
    if (USE_MOCK) return mockResponse({})
    return del('/api/inspection/project/' + id)
  }
}

// ============ 巡检点 ============
const pointApi = {
  list(params) {
    if (USE_MOCK) {
      let list = deepClone(mock.points)
      if (params && params.pointName) {
        list = list.filter(p => p.pointName.indexOf(params.pointName) > -1)
      }
      if (params && params.projectId) {
        list = list.filter(p => p.projectId == params.projectId)
      }
      return mockResponse({ rows: list, total: list.length })
    }
    return get('/api/inspection/point/list', params)
  },
  detail(id) {
    if (USE_MOCK) {
      const item = deepClone(mock.points.find(p => p.id == id))
      if (item) {
        item.items = deepClone(mock.checkItemTemplates).slice(0, item.checkItems)
      }
      return mockResponse(item)
    }
    return get('/api/inspection/point/' + id)
  },
  add(data) {
    if (USE_MOCK) {
      const item = { id: mock.points.length + 1, ...data, status: '1', lastInspectTime: '', lastResult: '' }
      return mockResponse(item)
    }
    return post('/api/inspection/point', data)
  },
  update(data) {
    if (USE_MOCK) return mockResponse(data)
    return put('/api/inspection/point', data)
  },
  remove(id) {
    if (USE_MOCK) return mockResponse({})
    return del('/api/inspection/point/' + id)
  },
  // 生成二维码
  generateQrcode(id) {
    if (USE_MOCK) {
      const point = mock.points.find(p => p.id == id)
      return mockResponse({ qrcode: point ? point.qrcode : 'QR-' + id, pointName: point ? point.pointName : '' })
    }
    return get('/api/inspection/point/qrcode/' + id)
  }
}

// ============ 巡检计划 ============
const planApi = {
  list(params) {
    if (USE_MOCK) {
      let list = deepClone(mock.plans)
      if (params && params.planName) {
        list = list.filter(p => p.planName.indexOf(params.planName) > -1)
      }
      return mockResponse({ rows: list, total: list.length })
    }
    return get('/api/inspection/plan/list', params)
  },
  detail(id) {
    if (USE_MOCK) {
      const item = deepClone(mock.plans.find(p => p.id == id))
      return mockResponse(item)
    }
    return get('/api/inspection/plan/' + id)
  },
  add(data) {
    if (USE_MOCK) {
      const item = { id: mock.plans.length + 1, ...data, status: '1', taskCount: 0 }
      return mockResponse(item)
    }
    return post('/api/inspection/plan', data)
  },
  update(data) {
    if (USE_MOCK) return mockResponse(data)
    return put('/api/inspection/plan', data)
  },
  remove(id) {
    if (USE_MOCK) return mockResponse({})
    return del('/api/inspection/plan/' + id)
  }
}

// ============ 巡检任务 ============
const taskApi = {
  list(params) {
    if (USE_MOCK) {
      let list = deepClone(mock.tasks)
      if (params && params.status !== undefined && params.status !== '' && params.status !== 'all') {
        const statuses = String(params.status).split(',')
        list = list.filter(t => statuses.indexOf(String(t.status)) > -1)
      }
      if (params && params.projectId) {
        list = list.filter(t => t.projectId == params.projectId)
      }
      if (params && params.taskName) {
        list = list.filter(t => t.taskName.indexOf(params.taskName) > -1)
      }
      return mockResponse({ rows: list, total: list.length })
    }
    return get('/api/inspection/task/list', params)
  },
  detail(id) {
    if (USE_MOCK) {
      const task = deepClone(mock.tasks.find(t => t.id == id))
      if (task) {
        // 填充巡检点详情
        task.pointList = task.points.map(pid => {
          const p = deepClone(mock.points.find(pt => pt.id == pid))
          if (p) {
            p.items = deepClone(mock.checkItemTemplates).slice(0, p.checkItems)
            // 查找是否已有巡检记录
            const rec = mock.records.find(r => r.taskId == id && r.pointId == pid)
            p.record = rec ? deepClone(rec) : null
            p.done = !!rec
          }
          return p
        })
        task.records = deepClone(mock.records.filter(r => r.taskId == id))
      }
      return mockResponse(task)
    }
    return get('/api/inspection/task/' + id)
  },
  // 提交巡检记录
  submitRecord(data) {
    if (USE_MOCK) {
      const record = { id: uuid(), inspectTime: new Date().toLocaleString(), status: '2', ...data }
      return mockResponse(record)
    }
    return post('/api/inspection/task/record', data)
  },
  // 完成任务
  finishTask(id) {
    if (USE_MOCK) return mockResponse({ id, status: '2', finishTime: new Date().toLocaleString() })
    return post('/api/inspection/task/finish/' + id)
  },
  // 扫码识别巡检点
  scanIdentify(code) {
    if (USE_MOCK) {
      const point = deepClone(mock.points.find(p => p.qrcode === code || p.nfcTag === code))
      if (point) {
        point.items = deepClone(mock.checkItemTemplates).slice(0, point.checkItems)
        return mockResponse(point)
      }
      return mockResponse(null)
    }
    return get('/api/inspection/point/scan', { code })
  }
}

// ============ 事件管理 ============
const eventApi = {
  list(params) {
    if (USE_MOCK) {
      let list = deepClone(mock.events)
      if (params && params.status !== undefined && params.status !== '' && params.status !== 'all') {
        const statuses = String(params.status).split(',')
        list = list.filter(e => statuses.indexOf(String(e.status)) > -1)
      }
      if (params && params.title) {
        list = list.filter(e => e.title.indexOf(params.title) > -1)
      }
      return mockResponse({ rows: list, total: list.length })
    }
    return get('/api/inspection/event/list', params)
  },
  detail(id) {
    if (USE_MOCK) {
      const event = deepClone(mock.events.find(e => e.id == id))
      if (event) {
        event.tracks = deepClone(mock.eventTracks[id] || [])
      }
      return mockResponse(event)
    }
    return get('/api/inspection/event/' + id)
  },
  add(data) {
    if (USE_MOCK) {
      const item = { id: mock.events.length + 1, status: '0', createTime: new Date().toLocaleString(), ...data }
      return mockResponse(item)
    }
    return post('/api/inspection/event', data)
  },
  // 添加跟踪记录
  addTrack(data) {
    if (USE_MOCK) {
      const track = { id: uuid(), operateTime: new Date().toLocaleString(), ...data }
      return mockResponse(track)
    }
    return post('/api/inspection/event/track', data)
  },
  // 处理事件
  handle(id, data) {
    if (USE_MOCK) return mockResponse({ id, ...data })
    return put('/api/inspection/event/handle/' + id, data)
  }
}

// ============ 巡检报表 ============
const reportApi = {
  list(params) {
    if (USE_MOCK) {
      let list = deepClone(mock.reports)
      if (params && params.projectId) {
        list = list.filter(r => r.projectId == params.projectId || r.projectId == 0)
      }
      return mockResponse({ rows: list, total: list.length })
    }
    return get('/api/inspection/report/list', params)
  },
  detail(id) {
    if (USE_MOCK) {
      const report = deepClone(mock.reports.find(r => r.id == id))
      if (report) {
        report.trend = deepClone(mock.dashboardStats.weekTrend)
      }
      return mockResponse(report)
    }
    return get('/api/inspection/report/' + id)
  }
}

// ============ 系统监控 ============
const monitorApi = {
  getServerInfo() {
    if (USE_MOCK) return mockResponse(deepClone(mock.monitorData.server))
    return get('/api/monitor/server')
  },
  getCacheInfo() {
    if (USE_MOCK) return mockResponse(deepClone(mock.monitorData.cache))
    return get('/api/monitor/cache')
  }
}

// ============ 用户反馈 ============
const feedbackApi = {
  add(data) {
    if (USE_MOCK) return mockResponse({})
    return post('/api/wx/addFeddBack', data)
  }
}

// ============ 设备档案/台账 ============
const equipmentApi = {
  list(params) {
    if (USE_MOCK) {
      let list = deepClone(mock.equipmentList)
      if (params && params.equipName) {
        list = list.filter(e => e.equipName.indexOf(params.equipName) > -1)
      }
      if (params && params.equipCode) {
        list = list.filter(e => e.equipCode.indexOf(params.equipCode) > -1)
      }
      if (params && params.equipType) {
        list = list.filter(e => e.equipType === params.equipType)
      }
      if (params && params.status) {
        list = list.filter(e => e.status === params.status)
      }
      if (params && params.workshop) {
        list = list.filter(e => e.workshop === params.workshop)
      }
      return mockResponse({ rows: list, total: list.length })
    }
    return get('/api/equipment/list', params)
  },
  detail(id) {
    if (USE_MOCK) {
      const item = deepClone(mock.equipmentList.find(e => e.id == id))
      if (item) {
        item.statusInfo = deepClone(mock.equipStatusMap[item.status] || {})
      }
      return mockResponse(item)
    }
    return get('/api/equipment/' + id)
  },
  add(data) {
    if (USE_MOCK) {
      const item = { id: Date.now(), qrcode: 'EQ-' + Date.now(), nfcTag: 'NFC-EQ' + Date.now(), ...data }
      return mockResponse(item)
    }
    return post('/api/equipment', data)
  },
  update(data) {
    if (USE_MOCK) return mockResponse(data)
    return put('/api/equipment', data)
  },
  remove(id) {
    if (USE_MOCK) return mockResponse({})
    return del('/api/equipment/' + id)
  },
  // 扫码/NFC识别设备
  scanIdentify(code) {
    if (USE_MOCK) {
      const item = deepClone(mock.equipmentList.find(e => e.qrcode === code || e.nfcTag === code || e.equipCode === code))
      if (item) {
        item.statusInfo = deepClone(mock.equipStatusMap[item.status] || {})
      }
      return mockResponse(item)
    }
    return get('/api/equipment/scan', { code })
  },
  // 获取设备到期提醒
  getReminders() {
    if (USE_MOCK) return mockResponse(deepClone(mock.reminders))
    return get('/api/equipment/reminders')
  },
  // Excel批量导入
  importExcel(data) {
    if (USE_MOCK) {
      if (!data || data.length === 0) {
        return mockResponse({ success: false, msg: '没有可导入的数据' })
      }
      // 将导入的数据写入mock数组，模拟真实入库
      let importCount = 0
      const statusTexts = { '0': '报废', '1': '正常运行', '2': '故障待修', '3': '停机保养', '4': '待校验' }
      data.forEach(item => {
        const newId = Date.now() + importCount
        const equipItem = {
          id: newId,
          equipCode: item.equipCode || '',
          equipName: item.equipName || '',
          equipType: item.equipType || '',
          equipCategory: item.equipCategory || '',
          status: item.status || '1',
          statusText: statusTexts[item.status] || '正常运行',
          spec: item.spec || '',
          workshop: item.workshop || '',
          location: item.location || '',
          manager: item.manager || '',
          managerPhone: item.managerPhone || '',
          manufacturer: item.manufacturer || '',
          supplier: item.supplier || '',
          purchaseDate: item.purchaseDate || '',
          startDate: item.startDate || '',
          lastSpotCheck: '',
          lastInspect: '',
          lastRepair: '',
          lastMaintain: '',
          calibrationCycle: item.calibrationCycle || 365,
          calibrationDate: item.calibrationDate || '',
          calibrationExpire: item.calibrationExpire || '',
          imageUrl: '',
          manualUrl: '',
          qrcode: item.qrcode || 'EQ-IMP-' + newId,
          nfcTag: item.nfcTag || ''
        }
        mock.equipmentList.push(equipItem)
        // 同时更新 equipInventory
        mock.equipInventory.push({
          ...equipItem,
          spotCheckCount: 0,
          lastSpotCheckResult: '未点检',
          repairCount: 0,
          pendingRepairCount: 0,
          maintainCount: 0,
          pendingMaintainCount: 0,
          iotOnline: false,
          iotDevice: null,
          reminderCount: 0,
          andonCount: 0,
          healthScore: null,
          params: [],
          applicableMaintainItems: []
        })
        importCount++
      })
      return mockResponse({ success: true, importCount, failCount: 0 })
    }
    return post('/api/equipment/import', data)
  },
  // 获取设备清单（综合关联所有模块）
  getInventory(params) {
    if (USE_MOCK) {
      let list = deepClone(mock.equipInventory)
      if (params && params.equipName) {
        list = list.filter(e => e.equipName.indexOf(params.equipName) > -1)
      }
      if (params && params.equipType) {
        list = list.filter(e => e.equipType === params.equipType)
      }
      if (params && params.status) {
        list = list.filter(e => e.status === params.status)
      }
      if (params && params.workshop) {
        list = list.filter(e => e.workshop === params.workshop)
      }
      return mockResponse({ rows: list, total: list.length })
    }
    return get('/api/equipment/inventory', params)
  },
  // 获取设备关联的所有模块数据
  getRelatedModules(id) {
    if (USE_MOCK) {
      const spotChecks = deepClone(mock.spotCheckRecords.filter(s => s.equipId == id))
      const equipRepairs = deepClone(mock.repairs.filter(r => r.equipId == id))
      const equipMaintains = deepClone(mock.maintains.filter(m => m.equipId == id))
      const iotDevice = deepClone(mock.iotDevices.find(d => d.equipId == id))
      const equipReminders = deepClone(mock.reminders.filter(r => r.equipId == id))
      const equipAndons = deepClone(mock.andonRecords.filter(a => a.equipId == id))
      return mockResponse({
        spotChecks,
        repairs: equipRepairs,
        maintains: equipMaintains,
        iotDevice,
        reminders: equipReminders,
        andons: equipAndons
      })
    }
    return get('/api/equipment/related/' + id)
  },
  // 生成二维码
  generateQrcode(id) {
    if (USE_MOCK) {
      const item = mock.equipmentList.find(e => e.id == id)
      return mockResponse({ qrcode: item ? item.qrcode : 'EQ-' + id, equipName: item ? item.equipName : '' })
    }
    return get('/api/equipment/qrcode/' + id)
  }
}

// ============ 设备点检 ============
const spotCheckApi = {
  list(params) {
    if (USE_MOCK) {
      let list = deepClone(mock.spotCheckRecords)
      if (params && params.equipId) {
        list = list.filter(r => r.equipId == params.equipId)
      }
      if (params && params.result) {
        list = list.filter(r => r.result === params.result)
      }
      if (params && params.checker) {
        list = list.filter(r => r.checker.indexOf(params.checker) > -1)
      }
      return mockResponse({ rows: list, total: list.length })
    }
    return get('/api/spotcheck/list', params)
  },
  // 获取点检模板
  getTemplate(equipId) {
    if (USE_MOCK) return mockResponse(deepClone(mock.spotCheckTemplates))
    return get('/api/spotcheck/template', { equipId })
  },
  // 提交点检记录
  submit(data) {
    if (USE_MOCK) {
      const record = { id: Date.now(), checkTime: new Date().toLocaleString(), ...data }
      return mockResponse(record)
    }
    return post('/api/spotcheck/submit', data)
  },
  detail(id) {
    if (USE_MOCK) {
      const item = deepClone(mock.spotCheckRecords.find(r => r.id == id))
      return mockResponse(item)
    }
    return get('/api/spotcheck/' + id)
  },
  add(data) {
    if (USE_MOCK) {
      const record = { id: Date.now(), checkTime: new Date().toLocaleString(), ...data }
      return mockResponse(record)
    }
    return post('/api/spotcheck', data)
  },
  update(data) {
    if (USE_MOCK) return mockResponse(data)
    return put('/api/spotcheck', data)
  },
  remove(id) {
    if (USE_MOCK) return mockResponse({})
    return del('/api/spotcheck/' + id)
  }
}

// ============ 报修维修 ============
const repairApi = {
  list(params) {
    if (USE_MOCK) {
      let list = deepClone(mock.repairs)
      if (params && params.status !== undefined && params.status !== '' && params.status !== 'all') {
        list = list.filter(r => r.status === params.status)
      }
      if (params && params.equipId) {
        list = list.filter(r => r.equipId == params.equipId)
      }
      if (params && params.title) {
        list = list.filter(r => r.title.indexOf(params.title) > -1)
      }
      if (params && params.faultType) {
        list = list.filter(r => r.faultType === params.faultType)
      }
      return mockResponse({ rows: list, total: list.length })
    }
    return get('/api/repair/list', params)
  },
  detail(id) {
    if (USE_MOCK) {
      const item = deepClone(mock.repairs.find(r => r.id == id))
      if (item) {
        item.statusInfo = deepClone(mock.repairStatusMap[item.status] || {})
      }
      return mockResponse(item)
    }
    return get('/api/repair/' + id)
  },
  add(data) {
    if (USE_MOCK) {
      const item = { id: Date.now(), repairNo: 'BX' + Date.now(), status: '0', createTime: new Date().toLocaleString(), ...data }
      return mockResponse(item)
    }
    return post('/api/repair', data)
  },
  update(data) {
    if (USE_MOCK) return mockResponse(data)
    return put('/api/repair', data)
  },
  remove(id) {
    if (USE_MOCK) return mockResponse({})
    return del('/api/repair/' + id)
  },
  // 更新维修状态
  updateStatus(id, data) {
    if (USE_MOCK) return mockResponse({ id, ...data })
    return put('/api/repair/status/' + id, data)
  }
}

// ============ 维护保养 ============
const maintainApi = {
  list(params) {
    if (USE_MOCK) {
      let list = deepClone(mock.maintains)
      if (params && params.status !== undefined && params.status !== '' && params.status !== 'all') {
        list = list.filter(m => m.status === params.status)
      }
      if (params && params.equipId) {
        list = list.filter(m => m.equipId == params.equipId)
      }
      if (params && params.type) {
        list = list.filter(m => m.type === params.type)
      }
      return mockResponse({ rows: list, total: list.length })
    }
    return get('/api/maintain/list', params)
  },
  detail(id) {
    if (USE_MOCK) {
      const item = deepClone(mock.maintains.find(m => m.id == id))
      if (item) {
        item.statusInfo = deepClone(mock.maintainStatusMap[item.status] || {})
      }
      return mockResponse(item)
    }
    return get('/api/maintain/' + id)
  },
  add(data) {
    if (USE_MOCK) {
      const item = { id: Date.now(), maintainNo: 'BY' + Date.now(), status: '0', ...data }
      return mockResponse(item)
    }
    return post('/api/maintain', data)
  },
  update(data) {
    if (USE_MOCK) return mockResponse(data)
    return put('/api/maintain', data)
  },
  remove(id) {
    if (USE_MOCK) return mockResponse({})
    return del('/api/maintain/' + id)
  },
  // 执行保养
  execute(id, data) {
    if (USE_MOCK) return mockResponse({ id, status: '2', finishTime: new Date().toLocaleString(), ...data })
    return post('/api/maintain/execute/' + id, data)
  }
}

// ============ 备件管理 ============
const sparePartApi = {
  list(params) {
    if (USE_MOCK) {
      let list = deepClone(mock.spareParts)
      if (params && params.partName) {
        list = list.filter(p => p.partName.indexOf(params.partName) > -1)
      }
      if (params && params.partCode) {
        list = list.filter(p => p.partCode.indexOf(params.partCode) > -1)
      }
      if (params && params.category) {
        list = list.filter(p => p.category === params.category)
      }
      if (params && params.status) {
        list = list.filter(p => p.status === params.status)
      }
      return mockResponse({ rows: list, total: list.length })
    }
    return get('/api/sparepart/list', params)
  },
  detail(id) {
    if (USE_MOCK) {
      const item = deepClone(mock.spareParts.find(p => p.id == id))
      return mockResponse(item)
    }
    return get('/api/sparepart/' + id)
  },
  add(data) {
    if (USE_MOCK) {
      const item = { id: Date.now(), partCode: 'SP-' + Date.now(), ...data }
      return mockResponse(item)
    }
    return post('/api/sparepart', data)
  },
  update(data) {
    if (USE_MOCK) return mockResponse(data)
    return put('/api/sparepart', data)
  },
  remove(id) {
    if (USE_MOCK) return mockResponse({})
    return del('/api/sparepart/' + id)
  },
  // 入库
  stockIn(id, data) {
    if (USE_MOCK) return mockResponse({ id, ...data })
    return post('/api/sparepart/stockIn/' + id, data)
  },
  // 出库
  stockOut(id, data) {
    if (USE_MOCK) return mockResponse({ id, ...data })
    return post('/api/sparepart/stockOut/' + id, data)
  },
  // Excel批量导入
  importExcel(data) {
    if (USE_MOCK) {
      const count = (data && data.length) || 0
      return mockResponse({ success: true, importCount: count, failCount: 0 })
    }
    return post('/api/sparepart/import', data)
  },
  // 获取备件分类
  getCategories() {
    if (USE_MOCK) return mockResponse(deepClone(mock.sparePartCategories))
    return get('/api/sparepart/categories')
  }
}

// ============ 安灯呼叫 ============
const andonApi = {
  list(params) {
    if (USE_MOCK) {
      let list = deepClone(mock.andonRecords)
      if (params && params.status !== undefined && params.status !== '' && params.status !== 'all') {
        list = list.filter(a => a.status == params.status)
      }
      return mockResponse({ rows: list, total: list.length })
    }
    return get('/api/andon/list', params)
  },
  // 发起呼叫
  call(data) {
    if (USE_MOCK) {
      const item = { id: mock.andonRecords.length + 1, callTime: new Date().toLocaleString(), status: '0', statusText: '待响应', ...data }
      return mockResponse(item)
    }
    return post('/api/andon/call', data)
  },
  // 响应呼叫
  respond(id, data) {
    if (USE_MOCK) return mockResponse({ id, status: '1', statusText: '已响应', responseTime: new Date().toLocaleString(), ...data })
    return put('/api/andon/respond/' + id, data)
  }
}

// ============ 物联网数采 ============
const iotApi = {
  list(params) {
    if (USE_MOCK) {
      let list = deepClone(mock.iotDevices)
      if (params && params.equipId) {
        list = list.filter(d => d.equipId == params.equipId)
      }
      return mockResponse({ rows: list, total: list.length })
    }
    return get('/api/iot/list', params)
  },
  // 获取设备实时数据
  getRealtimeData(id) {
    if (USE_MOCK) {
      const item = deepClone(mock.iotDevices.find(d => d.id == id))
      return mockResponse(item)
    }
    return get('/api/iot/realtime/' + id)
  },
  add(data) {
    if (USE_MOCK) {
      const item = { id: Date.now(), online: false, lastUpdate: new Date().toLocaleString(), ...data }
      return mockResponse(item)
    }
    return post('/api/iot', data)
  },
  update(data) {
    if (USE_MOCK) return mockResponse(data)
    return put('/api/iot', data)
  },
  remove(id) {
    if (USE_MOCK) return mockResponse({})
    return del('/api/iot/' + id)
  }
}

// ============ 系统配置管理（设备类型、巡查类型、设备参数、区域位置等） ============
const configApi = {
  // 设备类型
  getEquipTypes() {
    if (USE_MOCK) return mockResponse(deepClone(mock.equipTypes))
    return get('/api/config/equipTypes')
  },
  addEquipType(data) {
    if (USE_MOCK) {
      const item = { id: Date.now(), enabled: true, sort: mock.equipTypes.length + 1, ...data }
      return mockResponse(item)
    }
    return post('/api/config/equipType', data)
  },
  updateEquipType(data) {
    if (USE_MOCK) return mockResponse(data)
    return put('/api/config/equipType', data)
  },
  removeEquipType(id) {
    if (USE_MOCK) return mockResponse({})
    return del('/api/config/equipType/' + id)
  },
  // 巡查类型
  getInspectionTypes() {
    if (USE_MOCK) return mockResponse(deepClone(mock.inspectionTypes))
    return get('/api/config/inspectionTypes')
  },
  addInspectionType(data) {
    if (USE_MOCK) {
      const item = { id: Date.now(), enabled: true, sort: mock.inspectionTypes.length + 1, ...data }
      return mockResponse(item)
    }
    return post('/api/config/inspectionType', data)
  },
  updateInspectionType(data) {
    if (USE_MOCK) return mockResponse(data)
    return put('/api/config/inspectionType', data)
  },
  removeInspectionType(id) {
    if (USE_MOCK) return mockResponse({})
    return del('/api/config/inspectionType/' + id)
  },
  // 设备参数
  getEquipParams() {
    if (USE_MOCK) return mockResponse(deepClone(mock.equipParams))
    return get('/api/config/equipParams')
  },
  addEquipParam(data) {
    if (USE_MOCK) {
      const item = { id: Date.now(), ...data }
      return mockResponse(item)
    }
    return post('/api/config/equipParam', data)
  },
  updateEquipParam(data) {
    if (USE_MOCK) return mockResponse(data)
    return put('/api/config/equipParam', data)
  },
  removeEquipParam(id) {
    if (USE_MOCK) return mockResponse({})
    return del('/api/config/equipParam/' + id)
  },
  // 区域位置
  getAreaLocations() {
    if (USE_MOCK) return mockResponse(deepClone(mock.areaLocations))
    return get('/api/config/areaLocations')
  },
  addAreaLocation(data) {
    if (USE_MOCK) {
      const item = { id: Date.now(), enabled: true, ...data }
      return mockResponse(item)
    }
    return post('/api/config/areaLocation', data)
  },
  updateAreaLocation(data) {
    if (USE_MOCK) return mockResponse(data)
    return put('/api/config/areaLocation', data)
  },
  removeAreaLocation(id) {
    if (USE_MOCK) return mockResponse({})
    return del('/api/config/areaLocation/' + id)
  },
  // 保养类型
  getMaintainTypes() {
    if (USE_MOCK) return mockResponse(deepClone(mock.maintainTypes))
    return get('/api/config/maintainTypes')
  },
  addMaintainType(data) {
    if (USE_MOCK) {
      const item = { id: Date.now(), enabled: true, sort: mock.maintainTypes.length + 1, ...data }
      return mockResponse(item)
    }
    return post('/api/config/maintainType', data)
  },
  updateMaintainType(data) {
    if (USE_MOCK) return mockResponse(data)
    return put('/api/config/maintainType', data)
  },
  removeMaintainType(id) {
    if (USE_MOCK) return mockResponse({})
    return del('/api/config/maintainType/' + id)
  },
  // 保养项目
  getMaintainItems() {
    if (USE_MOCK) return mockResponse(deepClone(mock.maintainItems))
    return get('/api/config/maintainItems')
  },
  addMaintainItem(data) {
    if (USE_MOCK) {
      const item = { id: Date.now(), ...data }
      return mockResponse(item)
    }
    return post('/api/config/maintainItem', data)
  },
  updateMaintainItem(data) {
    if (USE_MOCK) return mockResponse(data)
    return put('/api/config/maintainItem', data)
  },
  removeMaintainItem(id) {
    if (USE_MOCK) return mockResponse({})
    return del('/api/config/maintainItem/' + id)
  },
  // 故障类型
  getFaultTypes() {
    if (USE_MOCK) return mockResponse(deepClone(mock.faultTypes))
    return get('/api/config/faultTypes')
  },
  addFaultType(data) {
    if (USE_MOCK) {
      const item = { id: Date.now(), enabled: true, sort: mock.faultTypes.length + 1, ...data }
      return mockResponse(item)
    }
    return post('/api/config/faultType', data)
  },
  updateFaultType(data) {
    if (USE_MOCK) return mockResponse(data)
    return put('/api/config/faultType', data)
  },
  removeFaultType(id) {
    if (USE_MOCK) return mockResponse({})
    return del('/api/config/faultType/' + id)
  },
  // 备件分类
  getSparePartCategories() {
    if (USE_MOCK) return mockResponse(deepClone(mock.sparePartCategories))
    return get('/api/config/sparePartCategories')
  },
  addSparePartCategory(data) {
    if (USE_MOCK) {
      const item = { id: Date.now(), enabled: true, sort: mock.sparePartCategories.length + 1, ...data }
      return mockResponse(item)
    }
    return post('/api/config/sparePartCategory', data)
  },
  updateSparePartCategory(data) {
    if (USE_MOCK) return mockResponse(data)
    return put('/api/config/sparePartCategory', data)
  },
  removeSparePartCategory(id) {
    if (USE_MOCK) return mockResponse({})
    return del('/api/config/sparePartCategory/' + id)
  },
  // 巡检报表配置
  getReportConfig() {
    if (USE_MOCK) {
      return mockResponse({
        reportTypes: [
          { value: 'daily', label: '日报' },
          { value: 'weekly', label: '周报' },
          { value: 'monthly', label: '月报' },
          { value: 'quarterly', label: '季报' },
          { value: 'yearly', label: '年报' },
          { value: 'custom', label: '自定义' }
        ],
        reportFields: [
          { field: 'totalTasks', label: '巡检任务总数', enabled: true },
          { field: 'doneTasks', label: '已完成任务', enabled: true },
          { field: 'completionRate', label: '完成率', enabled: true },
          { field: 'abnormalCount', label: '异常数量', enabled: true },
          { field: 'eventCount', label: '事件数量', enabled: true },
          { field: 'resolvedCount', label: '已解决事件', enabled: true },
          { field: 'spotCheckCount', label: '点检次数', enabled: false },
          { field: 'repairCount', label: '维修次数', enabled: false },
          { field: 'maintainCount', label: '保养次数', enabled: false }
        ]
      })
    }
    return get('/api/config/reportConfig')
  }
}

// ============ 设备动态看板 ============
const equipDashboardApi = {
  getStats() {
    if (USE_MOCK) return mockResponse(deepClone(mock.equipDashboard))
    return get('/api/equipment/dashboard/stats')
  },
  // 获取设备健康分
  getHealthScore(id) {
    if (USE_MOCK) return mockResponse(deepClone(mock.equipHealthScores[id] || { score: 0, level: '未知', color: '#9ca3af', suggestions: '暂无评估数据' }))
    return get('/api/equipment/health/' + id)
  }
}

module.exports = {
  authApi,
  dashboardApi,
  projectApi,
  pointApi,
  planApi,
  taskApi,
  eventApi,
  reportApi,
  monitorApi,
  feedbackApi,
  equipmentApi,
  spotCheckApi,
  repairApi,
  maintainApi,
  sparePartApi,
  andonApi,
  iotApi,
  equipDashboardApi,
  configApi
}
