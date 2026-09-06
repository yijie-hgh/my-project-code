// utils/ai-analysis.js - AI故障识别和巡检记录分析模块
// 提供基于规则的智能故障识别、风险评估、巡检数据汇总分析

const mock = require('./mock')
const { deepClone } = require('./util')

// ============ AI故障类型知识库 ============
const FAULT_KNOWLEDGE = {
  mechanical: {
    name: '机械故障',
    keywords: ['振动', '噪音', '异响', '温度', '摩擦', '磨损', '轴承', '齿轮', '皮带', '松动'],
    severity: 'medium',
    commonCauses: ['轴承磨损', '润滑不良', '紧固件松动', '齿轮损坏', '皮带老化'],
    suggestions: ['检查润滑系统', '紧固松动的螺栓', '检查轴承状态', '必要时更换磨损件', '调整皮带张力']
  },
  electrical: {
    name: '电气故障',
    keywords: ['电压', '电流', '短路', '断路', '绝缘', '发热', '跳闸', '接触不良', '烧损', '过载'],
    severity: 'high',
    commonCauses: ['绝缘老化', '接触不良', '过载运行', '短路故障', '电压异常'],
    suggestions: ['检查绝缘电阻', '紧固电气连接', '检查保护装置', '测量电压电流', '必要时更换电缆']
  },
  thermal: {
    name: '温度异常',
    keywords: ['高温', '过热', '温升', '散热', '冷却', '发热', '烫手', '温度报警'],
    severity: 'high',
    commonCauses: ['散热不良', '冷却系统故障', '负载过大', '环境温度高', '摩擦发热'],
    suggestions: ['检查冷却系统', '清理散热器', '降低负载', '检查通风', '加装辅助散热']
  },
  fluid: {
    name: '泄漏/液压故障',
    keywords: ['泄漏', '漏油', '漏气', '压力', '液压', '气动', '密封', '管路'],
    severity: 'medium',
    commonCauses: ['密封件老化', '管路破损', '接头松动', '压力异常', '油液污染'],
    suggestions: ['更换密封件', '修复或更换管路', '紧固接头', '检查压力设定', '更换油液']
  },
  instrument: {
    name: '仪表故障',
    keywords: ['读数', '显示', '偏差', '校准', '传感器', '信号', '精度', '失灵'],
    severity: 'low',
    commonCauses: ['传感器故障', '校准漂移', '线路接触不良', '显示模块损坏', '信号干扰'],
    suggestions: ['重新校准仪表', '检查传感器', '检查信号线路', '更换显示模块', '排除干扰源']
  },
  vibration: {
    name: '振动异常',
    keywords: ['振动', '震幅', '抖动', '摆动', '不平衡', '共振', '不对中'],
    severity: 'medium',
    commonCauses: ['转子不平衡', '轴不对中', '基础松动', '共振', '轴承损坏'],
    suggestions: ['做动平衡校正', '检查对中情况', '紧固基础', '改变转速避开共振区', '更换轴承']
  }
}

// ============ 风险等级定义 ============
const RISK_LEVELS = {
  critical: { level: 4, name: '极高风险', color: '#dc2626', action: '立即停机检查' },
  high: { level: 3, name: '高风险', color: '#ea580c', action: '尽快安排检修' },
  medium: { level: 2, name: '中等风险', color: '#f59e0b', action: '计划检修' },
  low: { level: 1, name: '低风险', color: '#10b981', action: '持续观察' },
  safe: { level: 0, name: '正常', color: '#22c55e', action: '正常运行' }
}

// ============ AI 分析引擎 ============
const ai = {
  // 1. 故障识别 — 根据描述文本智能识别故障类型
  identifyFault(description, equipType) {
    if (!description) return null

    const lowerDesc = description.toLowerCase()
    const results = []

    Object.entries(FAULT_KNOWLEDGE).forEach(([key, knowledge]) => {
      let score = 0
      const matchedKeywords = []
      knowledge.keywords.forEach(keyword => {
        if (description.indexOf(keyword) > -1 || lowerDesc.indexOf(keyword.toLowerCase()) > -1) {
          score += 10
          matchedKeywords.push(keyword)
        }
      })
      if (score > 0) {
        results.push({
          faultType: key,
          faultName: knowledge.name,
          score,
          confidence: Math.min(score * 5, 95),
          matchedKeywords,
          severity: knowledge.severity,
          commonCauses: knowledge.commonCauses,
          suggestions: knowledge.suggestions
        })
      }
    })

    results.sort((a, b) => b.score - a.score)

    if (results.length === 0) {
      return {
        faultType: 'unknown',
        faultName: '未知故障',
        confidence: 0,
        matchedKeywords: [],
        severity: 'low',
        commonCauses: [],
        suggestions: ['建议人工检查', '联系专业技术人员']
      }
    }

    return results[0]
  },

  // 2. 风险评估 — 综合评估设备风险等级
  assessRisk(equipment, recentRecords, repairs) {
    let riskScore = 0
    const riskFactors = []

    // 设备状态风险
    if (equipment.status === '2') {
      riskScore += 40
      riskFactors.push('设备处于故障待修状态')
    } else if (equipment.status === '3') {
      riskScore += 20
      riskFactors.push('设备处于停机保养状态')
    } else if (equipment.status === '0') {
      riskScore += 10
      riskFactors.push('设备已报废')
    }

    // 维修频次风险
    const repairCount = repairs ? repairs.length : (equipment.repairCount || 0)
    if (repairCount >= 5) {
      riskScore += 25
      riskFactors.push('维修频次过高(' + repairCount + '次)')
    } else if (repairCount >= 3) {
      riskScore += 15
      riskFactors.push('维修频次偏高(' + repairCount + '次)')
    }

    // 校验到期风险
    if (equipment.calibrationExpire) {
      const expireDate = new Date(equipment.calibrationExpire)
      const daysLeft = Math.ceil((expireDate - new Date()) / (24 * 3600 * 1000))
      if (daysLeft < 0) {
        riskScore += 20
        riskFactors.push('校验已过期' + Math.abs(daysLeft) + '天')
      } else if (daysLeft <= 30) {
        riskScore += 10
        riskFactors.push('校验即将到期(' + daysLeft + '天后)')
      }
    }

    // 巡检异常风险
    if (recentRecords && recentRecords.length > 0) {
      const abnormal = recentRecords.filter(r => r.result === '异常' || r.status === '异常')
      const abnormalRate = abnormal.length / recentRecords.length
      if (abnormalRate > 0.3) {
        riskScore += 20
        riskFactors.push('巡检异常率' + (abnormalRate * 100).toFixed(0) + '%')
      } else if (abnormalRate > 0.1) {
        riskScore += 10
        riskFactors.push('巡检偶有异常(' + abnormal.length + '次)')
      }
    }

    // 健康分风险
    if (equipment.healthScore && equipment.healthScore.score !== undefined) {
      const hs = equipment.healthScore.score
      if (hs < 50) {
        riskScore += 20
        riskFactors.push('健康分偏低(' + hs + '分)')
      } else if (hs < 70) {
        riskScore += 10
        riskFactors.push('健康分一般(' + hs + '分)')
      }
    }

    // 确定风险等级
    let riskLevel
    if (riskScore >= 60) riskLevel = RISK_LEVELS.critical
    else if (riskScore >= 40) riskLevel = RISK_LEVELS.high
    else if (riskScore >= 20) riskLevel = RISK_LEVELS.medium
    else if (riskScore >= 10) riskLevel = RISK_LEVELS.low
    else riskLevel = RISK_LEVELS.safe

    return {
      riskScore,
      riskLevel: riskLevel.level,
      riskName: riskLevel.name,
      riskColor: riskLevel.color,
      recommendedAction: riskLevel.action,
      riskFactors,
      analysisTime: new Date().toISOString()
    }
  },

  // 3. 巡检记录汇总分析
  analyzeInspectionRecords(records, tasks) {
    if (!records || records.length === 0) {
      return {
        totalRecords: 0,
        summary: '暂无巡检记录',
        passRate: 0,
        abnormalRate: 0,
        trends: [],
        issues: [],
        suggestions: ['建议尽快开始执行巡检任务']
      }
    }

    const total = records.length
    const normal = records.filter(r => r.result === '正常' || r.status === '正常' || r.status === '2')
    const abnormal = records.filter(r => r.result === '异常' || r.status === '异常')
    const skipped = records.filter(r => r.status === '已跳过' || r.status === '3')

    const passRate = total > 0 ? ((normal.length / total) * 100).toFixed(1) : 0
    const abnormalRate = total > 0 ? ((abnormal.length / total) * 100).toFixed(1) : 0

    // 按日统计趋势
    const byDate = {}
    records.forEach(r => {
      const date = (r.inspectTime || r.checkInTime || '').substring(0, 10)
      if (!byDate[date]) byDate[date] = { total: 0, normal: 0, abnormal: 0 }
      byDate[date].total++
      if (r.result === '正常' || r.status === '正常' || r.status === '2') byDate[date].normal++
      if (r.result === '异常' || r.status === '异常') byDate[date].abnormal++
    })

    const trends = Object.entries(byDate).map(([date, data]) => ({
      date,
      total: data.total,
      normal: data.normal,
      abnormal: data.abnormal,
      passRate: data.total > 0 ? ((data.normal / data.total) * 100).toFixed(1) : 0
    })).sort((a, b) => a.date.localeCompare(b.date))

    // 异常项分析
    const issues = abnormal.map(r => ({
      pointName: r.pointName,
      inspector: r.inspectorName,
      time: r.inspectTime || r.checkInTime,
      remark: r.remark || '无备注',
      severity: this.identifyFault(r.remark || r.pointName || '')
    }))

    // 智能建议
    const suggestions = []
    if (parseFloat(abnormalRate) > 30) {
      suggestions.push('异常率较高(' + abnormalRate + '%)，建议增加巡检频次')
      suggestions.push('建议组织专项排查，找出异常集中区域')
    } else if (parseFloat(abnormalRate) > 10) {
      suggestions.push('存在一定异常率(' + abnormalRate + '%)，需关注异常点')
    } else {
      suggestions.push('巡检状况良好，继续保持')
    }
    if (skipped.length > total * 0.1) {
      suggestions.push('跳过率较高，建议检查巡检路线和计划')
    }
    // 分析趋势
    if (trends.length >= 2) {
      const recent = trends[trends.length - 1]
      const prev = trends[trends.length - 2]
      if (parseFloat(recent.passRate) < parseFloat(prev.passRate)) {
        suggestions.push('近期巡检合格率下降，建议重点关注')
      }
    }

    // 任务完成率
    let taskCompletionRate = 0
    if (tasks && tasks.length > 0) {
      const completed = tasks.filter(t => t.status === '2').length
      taskCompletionRate = ((completed / tasks.length) * 100).toFixed(1)
    }

    return {
      totalRecords: total,
      normalCount: normal.length,
      abnormalCount: abnormal.length,
      skippedCount: skipped.length,
      passRate,
      abnormalRate,
      taskCompletionRate,
      trends,
      issues,
      suggestions,
      analysisTime: new Date().toISOString()
    }
  },

  // 4. 设备故障预测
  predictFailure(equipment, historyData) {
    const factors = []
    let predictionScore = 0

    // 维修频率分析
    const repairs = historyData.repairs || []
    if (repairs.length >= 3) {
      const recentRepairs = repairs.filter(r => {
        const d = new Date(r.createTime)
        const diff = (new Date() - d) / (24 * 3600 * 1000)
        return diff <= 90
      })
      if (recentRepairs.length >= 3) {
        predictionScore += 30
        factors.push('近3个月维修' + recentRepairs.length + '次，频率偏高')
      }
    }

    // 异常点检分析
    const spotChecks = historyData.spotChecks || []
    if (spotChecks.length > 0) {
      const abnormalChecks = spotChecks.filter(s => s.result === '异常')
      if (abnormalChecks.length > 0) {
        const rate = (abnormalChecks.length / spotChecks.length * 100).toFixed(0)
        if (rate > 20) {
          predictionScore += 25
          factors.push('点检异常率' + rate + '%')
        }
      }
    }

    // 运行时长分析
    if (equipment.startDate) {
      const runDays = Math.ceil((new Date() - new Date(equipment.startDate)) / (24 * 3600 * 1000))
      if (runDays > 365 * 5) {
        predictionScore += 20
        factors.push('设备运行超过5年(' + Math.floor(runDays / 365) + '年)')
      } else if (runDays > 365 * 3) {
        predictionScore += 10
        factors.push('设备运行超过3年')
      }
    }

    // 状态分析
    if (equipment.status === '3') {
      predictionScore += 15
      factors.push('设备当前处于停机保养状态')
    }

    let prediction
    if (predictionScore >= 60) {
      prediction = { level: 'critical', text: '极可能故障', action: '建议立即安排预防性检修' }
    } else if (predictionScore >= 40) {
      prediction = { level: 'high', text: '故障概率较高', action: '建议加强监测并安排检修' }
    } else if (predictionScore >= 20) {
      prediction = { level: 'medium', text: '有一定故障风险', action: '建议增加巡检频次' }
    } else {
      prediction = { level: 'low', text: '运行稳定', action: '按正常计划维护' }
    }

    return {
      predictionScore,
      prediction: prediction.text,
      level: prediction.level,
      action: prediction.action,
      factors,
      analysisTime: new Date().toISOString()
    }
  },

  // 5. 生成智能报告
  generateReport(analysisResult, moduleName) {
    const lines = []
    lines.push('=== ' + (moduleName || 'AI分析') + '报告 ===')
    lines.push('生成时间：' + new Date().toLocaleString())
    lines.push('')

    if (analysisResult.totalRecords !== undefined) {
      lines.push('【巡检汇总】')
      lines.push('总记录数：' + analysisResult.totalRecords)
      lines.push('正常：' + (analysisResult.normalCount || 0) + ' (' + analysisResult.passRate + '%)')
      lines.push('异常：' + (analysisResult.abnormalCount || 0) + ' (' + analysisResult.abnormalRate + '%)')
      if (analysisResult.taskCompletionRate) {
        lines.push('任务完成率：' + analysisResult.taskCompletionRate + '%')
      }
      lines.push('')
    }

    if (analysisResult.riskName) {
      lines.push('【风险评估】')
      lines.push('风险等级：' + analysisResult.riskName)
      lines.push('风险因素：')
      ;(analysisResult.riskFactors || []).forEach(f => lines.push('  - ' + f))
      lines.push('建议措施：' + analysisResult.recommendedAction)
      lines.push('')
    }

    if (analysisResult.suggestions && analysisResult.suggestions.length > 0) {
      lines.push('【智能建议】')
      analysisResult.suggestions.forEach((s, i) => lines.push((i + 1) + '. ' + s))
    }

    return lines.join('\n')
  },

  // 获取知识库
  getKnowledgeBase() {
    return FAULT_KNOWLEDGE
  },

  // 获取风险等级定义
  getRiskLevels() {
    return RISK_LEVELS
  }
}

module.exports = {
  FAULT_KNOWLEDGE,
  RISK_LEVELS,
  ai
}
