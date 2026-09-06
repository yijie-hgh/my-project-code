// pages/permission/permission.js
const { ROLES, PERMISSIONS, permission } = require('../../utils/permission')
const { toast, confirm } = require('../../utils/util')

Page({
  data: {
    roles: Object.values(ROLES),
    selectedRole: 'inspector',
    currentRoleInfo: null,
    permissionsByModule: {},
    currentPermissions: [],
    allPermissions: PERMISSIONS,
    activeModule: 'all'
  },

  onLoad() {
    this.loadPermissions()
  },

  loadPermissions() {
    const roleId = this.data.selectedRole
    const roleInfo = permission.getRole(roleId)
    const currentPerms = permission.getRoleDefaultPermissions(roleId)
    const permsByModule = permission.getPermissionsByModule()
    this.setData({
      currentRoleInfo: roleInfo,
      currentPermissions: currentPerms,
      permissionsByModule: permsByModule
    })
  },

  onRoleChange(e) {
    this.setData({ selectedRole: e.currentTarget.dataset.role })
    this.loadPermissions()
  },

  onModuleChange(e) {
    this.setData({ activeModule: e.currentTarget.dataset.module })
  },

  togglePermission(e) {
    const permKey = e.currentTarget.dataset.perm
    let perms = [...this.data.currentPermissions]
    const idx = perms.indexOf(permKey)
    if (idx > -1) {
      perms.splice(idx, 1)
    } else {
      perms.push(permKey)
    }
    this.setData({ currentPermissions: perms })
  },

  async onSavePermissions() {
    const ok = await confirm('确认保存权限配置？')
    if (!ok) return
    permission.setUserPermissions(this.data.selectedRole, this.data.currentPermissions)
    toast('权限配置已保存', 'success')
  },

  resetPermissions() {
    this.loadPermissions()
    toast('已重置为默认权限')
  }
})
