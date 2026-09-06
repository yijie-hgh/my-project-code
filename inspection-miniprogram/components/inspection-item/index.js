// components/inspection-item/index.js
Component({
  properties: {
    item: { type: Object, value: {} },
    index: { type: Number, value: 0 },
    disabled: { type: Boolean, value: false }
  },
  data: {},
  methods: {
    onInput(e) {
      this.triggerEvent('change', { index: this.data.index, field: 'value', value: e.detail.value })
    },
    onChoice(e) {
      const val = e.currentTarget.dataset.val
      this.triggerEvent('change', { index: this.data.index, field: 'value', value: val })
    },
    onMulti(e) {
      const val = e.currentTarget.dataset.val
      let current = this.data.item.value || []
      if (typeof current === 'string') current = current.split(',')
      let arr = [...current]
      if (arr.indexOf(val) > -1) {
        arr = arr.filter(v => v !== val)
      } else {
        arr.push(val)
      }
      this.triggerEvent('change', { index: this.data.index, field: 'value', value: arr })
    },
    onPhoto() {
      if (this.data.disabled) return
      wx.chooseMedia({
        count: 3,
        mediaType: ['image'],
        sourceType: ['camera', 'album'],
        success: (res) => {
          const paths = res.tempFiles.map(f => f.tempFilePath)
          const existing = this.data.item.value || []
          const all = [...existing, ...paths]
          this.triggerEvent('change', { index: this.data.index, field: 'value', value: all })
        }
      })
    },
    onPreviewPhoto(e) {
      const url = e.currentTarget.dataset.url
      wx.previewImage({ current: url, urls: this.data.item.value || [] })
    },
    onRemovePhoto(e) {
      const idx = e.currentTarget.dataset.idx
      let arr = [...(this.data.item.value || [])]
      arr.splice(idx, 1)
      this.triggerEvent('change', { index: this.data.index, field: 'value', value: arr })
    },
    onSignature() {
      if (this.data.disabled) return
      this.triggerEvent('signature', { index: this.data.index })
    }
  }
})
