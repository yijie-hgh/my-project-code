// pages/qrcode/qrcode.js
const { pointApi } = require('../../utils/api')
const { requireLogin } = require('../../utils/auth')
const { toast, showLoading, hideLoading } = require('../../utils/util')

Page({
  data: {
    points: [],
    pointNames: [],
    pointIndex: -1,
    qrcode: '',
    pointName: '',
    loading: false,
    drawing: false
  },

  onLoad(options) {
    if (!requireLogin()) return
    this.loadPoints(options.pointId)
  },

  onShow() {
    if (!requireLogin()) return
  },

  // 加载巡检点列表
  async loadPoints(pointId) {
    try {
      const res = await pointApi.list()
      const points = res.data.rows || []
      const pointNames = points.map(p => p.pointName)
      this.setData({ points, pointNames })
      // 如果传入了pointId，自动选择
      if (pointId) {
        const index = points.findIndex(p => p.id == pointId)
        if (index > -1) {
          this.setData({ pointIndex: index })
          this.generateQrcode(points[index])
        }
      }
    } catch (err) {
      console.error('加载巡检点失败', err)
      toast('加载巡检点失败')
    }
  },

  // 选择巡检点
  onPointChange(e) {
    const index = Number(e.detail.value)
    this.setData({ pointIndex: index })
    const point = this.data.points[index]
    this.generateQrcode(point)
  },

  // 生成二维码
  async generateQrcode(point) {
    this.setData({ loading: true, qrcode: '', pointName: point.pointName })
    try {
      const res = await pointApi.generateQrcode(point.id)
      const data = res.data
      this.setData({
        qrcode: data.qrcode,
        pointName: data.pointName || point.pointName,
        loading: false
      })
      // 等待canvas渲染后绘制
      setTimeout(() => {
        this.drawQrcode(data.qrcode)
      }, 200)
    } catch (err) {
      console.error('生成二维码失败', err)
      this.setData({ loading: false })
      toast('生成二维码失败')
    }
  },

  // 用canvas绘制伪二维码图案
  drawQrcode(code) {
    this.setData({ drawing: true })
    const ctx = wx.createCanvasContext('qrcodeCanvas', this)
    const size = 280
    const modules = 25 // 25x25模块矩阵
    const moduleSize = size / modules

    // 白色背景
    ctx.setFillStyle('#ffffff')
    ctx.fillRect(0, 0, size, size)

    // 根据code生成伪随机种子
    let seed = 0
    for (let i = 0; i < code.length; i++) {
      seed += code.charCodeAt(i)
    }

    // 伪随机数生成器
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }

    // 绘制数据区（随机黑白点阵）
    ctx.setFillStyle('#000000')
    for (let row = 0; row < modules; row++) {
      for (let col = 0; col < modules; col++) {
        // 跳过三个定位角区域
        if (this._isPositionArea(row, col, modules)) continue
        if (random() > 0.5) {
          ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize)
        }
      }
    }

    // 绘制三个定位角（左上、右上、左下）
    this._drawPositionMarker(ctx, 0, 0, moduleSize)
    this._drawPositionMarker(ctx, (modules - 7) * moduleSize, 0, moduleSize)
    this._drawPositionMarker(ctx, 0, (modules - 7) * moduleSize, moduleSize)

    // 绘制中央小定位点
    this._drawAlignmentMarker(ctx, 16 * moduleSize, 16 * moduleSize, moduleSize)

    ctx.draw(false, () => {
      this.setData({ drawing: false })
    })
  },

  // 判断是否在定位角区域
  _isPositionArea(row, col, modules) {
    // 左上角 7x7
    if (row < 8 && col < 8) return true
    // 右上角 7x7
    if (row < 8 && col >= modules - 8) return true
    // 左下角 7x7
    if (row >= modules - 8 && col < 8) return true
    return false
  },

  // 绘制定位标记（三个大角）
  _drawPositionMarker(ctx, x, y, moduleSize) {
    // 外框 7x7 实心黑
    ctx.setFillStyle('#000000')
    ctx.fillRect(x, y, moduleSize * 7, moduleSize * 7)
    // 内部白色 5x5
    ctx.setFillStyle('#ffffff')
    ctx.fillRect(x + moduleSize, y + moduleSize, moduleSize * 5, moduleSize * 5)
    // 中心黑色 3x3
    ctx.setFillStyle('#000000')
    ctx.fillRect(x + moduleSize * 2, y + moduleSize * 2, moduleSize * 3, moduleSize * 3)
  },

  // 绘制对齐标记
  _drawAlignmentMarker(ctx, x, y, moduleSize) {
    ctx.setFillStyle('#000000')
    ctx.fillRect(x, y, moduleSize * 5, moduleSize * 5)
    ctx.setFillStyle('#ffffff')
    ctx.fillRect(x + moduleSize, y + moduleSize, moduleSize * 3, moduleSize * 3)
    ctx.setFillStyle('#000000')
    ctx.fillRect(x + moduleSize * 2, y + moduleSize * 2, moduleSize, moduleSize)
  },

  // 保存到相册
  onSaveAlbum() {
    if (!this.data.qrcode) {
      toast('请先生成二维码')
      return
    }
    wx.canvasToTempFilePath({
      canvasId: 'qrcodeCanvas',
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            toast('已保存到相册', 'success')
          },
          fail: (err) => {
            if (err.errMsg.indexOf('auth deny') > -1) {
              toast('请在设置中开启相册权限')
            } else {
              toast('保存失败')
            }
          }
        })
      },
      fail: () => {
        toast('生成图片失败')
      }
    }, this)
  },

  // 打印标签
  onPrint() {
    if (!this.data.qrcode) {
      toast('请先生成二维码')
      return
    }
    toast('打印标签功能演示：连接标签打印机进行打印', 'none')
  }
})
