// pages/mine/profile/profile.js
const { authApi } = require('../../../utils/api')
const { requireLogin, getUserInfo, setUserInfo } = require('../../../utils/auth')
const { toast } = require('../../../utils/util')

Page({
  data: {
    userInfo: {},
    form: {
      nickName: '',
      phonenumber: '',
      email: ''
    },
    showPwdModal: false,
    pwdForm: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  },

  onLoad() {
    if (!requireLogin()) return
    this.loadUserInfo()
  },

  onShow() {
    if (!requireLogin()) return
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      const res = await authApi.getUserInfo()
      const user = res.data
      this.setData({
        userInfo: user,
        form: {
          nickName: user.nickName || '',
          phonenumber: user.phonenumber || '',
          email: user.email || ''
        }
      })
    } catch (err) {
      console.error('获取用户信息失败', err)
      // 回退到本地缓存
      const localUser = getUserInfo()
      if (localUser) {
        this.setData({
          userInfo: localUser,
          form: {
            nickName: localUser.nickName || '',
            phonenumber: localUser.phonenumber || '',
            email: localUser.email || ''
          }
        })
      }
    }
  },

  // 表单输入
  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({
      ['form.' + field]: e.detail.value
    })
  },

  // 密码表单输入
  onPwdInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({
      ['pwdForm.' + field]: e.detail.value
    })
  },

  // 阻止冒泡
  noop() {},

  // 保存修改
  onSave() {
    const { nickName, phonenumber, email } = this.data.form
    if (!nickName.trim()) {
      toast('请输入昵称')
      return
    }
    if (phonenumber && !/^1[3-9]\d{9}$/.test(phonenumber)) {
      toast('请输入正确的手机号')
      return
    }
    if (email && !/^[\w.-]+@[\w.-]+\.\w+$/.test(email)) {
      toast('请输入正确的邮箱')
      return
    }
    // 更新本地缓存的用户信息
    const userInfo = { ...this.data.userInfo, ...this.data.form }
    setUserInfo(userInfo)
    this.setData({ userInfo })
    toast('保存成功', 'success')
  },

  // 打开修改密码弹窗
  onChangePassword() {
    this.setData({
      showPwdModal: true,
      pwdForm: { oldPassword: '', newPassword: '', confirmPassword: '' }
    })
  },

  // 关闭密码弹窗
  onClosePwd() {
    this.setData({ showPwdModal: false })
  },

  // 确认修改密码
  onConfirmPwd() {
    const { oldPassword, newPassword, confirmPassword } = this.data.pwdForm
    if (!oldPassword) {
      toast('请输入旧密码')
      return
    }
    if (!newPassword) {
      toast('请输入新密码')
      return
    }
    if (newPassword.length < 6) {
      toast('新密码至少6位')
      return
    }
    if (newPassword !== confirmPassword) {
      toast('两次密码输入不一致')
      return
    }
    this.setData({ showPwdModal: false })
    toast('密码修改成功', 'success')
  }
})
