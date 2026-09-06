// components/stat-card/index.js
Component({
  properties: {
    label: { type: String, value: '' },
    value: { type: null, value: 0 },
    unit: { type: String, value: '' },
    icon: { type: String, value: '📊' },
    color: { type: String, value: '#2563eb' },
    sub: { type: String, value: '' }
  }
})
