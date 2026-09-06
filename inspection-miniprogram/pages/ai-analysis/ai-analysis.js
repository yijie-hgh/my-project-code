// pages/ai-analysis/ai-analysis.js
const { ai, FAULT_KNOWLEDGE, RISK_LEVELS } = require('../../utils/ai-analysis')
const mock = require('../../utils/mock')
const { deepClone } = require('../../utils/util')
const { notification } = require('../../utils/notification')

Page({
  data: {
    activeTab: 'overview',
    tabs: [
      { value: 'overview', label: '巡检汇总' },
      { value: 'fault', label: '故障识别' },
      { value: 'risk', label: '风险评估' },
      { value: 'predict', label: '故障预测' }
    ],
    // 巡检汇总
    analysisResult: null,
    // 故障识别
    faultInput: '',
    faultResult: null,
    faultKnowledge: Object.entries(FAULT_KNOWLEDGE).map(([key, val]) => ({ key, ...val })),
    // 风险评估
    equipmentList: [],
    selectedEquip: 0,
    riskResult: null,
    // 预测
    predictResult: null
  },

  onLoad() {
    this.loadAnalysis()
    this.loadEquipment()
  },

  loadAnalysis() {
    const records = deepClone(mock.records || [])
    const tasks = deepClone(mock.tasks || [])
    const result = ai.analyzeInspectionRecords(records, tasks)
    this.setData({ analysisResult: result })
  },

  loadEquipment() {
    const list = deepClone(mock.equipInventory || mock.equipmentList || [])
    this.setData({ equipmentList: list })
  },

  onTabChange(e) {
    this.setData({ activeTab: e.currentTarget.dataset.value })
  },

  onFaultInput(e) {
    this.setData({ faultInput: e.detail.value })
  },

  onIdentifyFault() {
    const desc = this.data.faultInput.trim()
    if (!desc) return wx.showToast({ title: '请输入故障描述', icon: 'none' })
    const result = ai.identifyFault(desc)
    this.setData({ faultResult: result })
    // 推送AI预警
    if (result.riskLevel && result.riskLevel >= 3) {
      notification.pushAIAlert('未知设备', result.riskName || '高风险', result.riskFactors || [])
    }
  },

  onEquipChange(e) {
    const idx = e.detail.value
    this.setData({ selectedEquip: idx })
    this.assessRisk(idx)
  },

  assessRisk(idx) {
    const equip = this.data.equipmentList[idx]
    if (!equip) return
    const repairs = deepClone(mock.repairs || []).filter(r => r.equipId === equip.id)
    const records = deepClone(mock.records || []).filter(r => r.pointId === equip.id)
    const result = ai.assessRisk(equip, records, repairs)
    this.setData({ riskResult: result })
    // 推送高风险预警
    if (result.riskLevel >= 3) {
      notification.pushAIAlert(equip.equipName, result.riskName, result.riskFactors)
    }
  },

  onPredict() {
    const equip = this.data.equipmentList[this.data.selectedEquip]
    if (!equip) return
    const repairs = deepClone(mock.repairs || []).filter(r => r.equipId === equip.id)
    const spotChecks = deepClone(mock.spotCheckRecords || []).filter(s => s.equipId === equip.id)
    const result = ai.predictFailure(equip, { repairs, spotChecks })
    this.setData({ predictResult: result })
  }
})
