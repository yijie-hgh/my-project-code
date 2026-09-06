// utils/permission.js - 权限管理模块
// 支持角色级别、权限自定义、查看/修改权限控制

// ============ 角色定义 ============
const ROLES = {
  SUPER_ADMIN: { id: 'super_admin', name: '超级管理员', level: 5, color: '#dc2626', desc: '拥有所有权限，可管理系统配置和所有用户权限' },
  ADMIN: { id: 'admin', name: '系统管理员', level: 4, color: '#2563eb', desc: '管理设备、人员、配置，可查看和修改所有数据' },
  MANAGER: { id: 'manager', name: '部门主管', level: 3, color: '#7c3aed', desc: '管理本部门设备和巡检任务，可审批工单' },
  INSPECTOR: { id: 'inspector', name: '巡检员', level: 2, color: '#0891b2', desc: '执行巡检任务、上报事件、创建报修单' },
  REPAIRER: { id: 'repairer', name: '维修员', level: 2, color: '#ea580c', desc: '处理维修工单、记录维修过程、使用备件' },
  VIEWER: { id: 'viewer', name: '只读用户', level: 1, color: '#6b7280', desc: '仅可查看数据，不能修改' }
}

// ============ 权限定义 ============
const PERMISSIONS = {
  // 设备管理
  'equipment:view': { name: '查看设备', module: 'equipment' },
  'equipment:add': { name: '添加设备', module: 'equipment' },
  'equipment:edit': { name: '编辑设备', module: 'equipment' },
  'equipment:delete': { name: '删除设备', module: 'equipment' },
  'equipment:import': { name: '导入设备', module: 'equipment' },
  'equipment:export': { name: '导出设备', module: 'equipment' },
  // 巡检管理
  'inspection:view': { name: '查看巡检', module: 'inspection' },
  'inspection:execute': { name: '执行巡检', module: 'inspection' },
  'inspection:edit': { name: '编辑巡检', module: 'inspection' },
  'inspection:delete': { name: '删除巡检', module: 'inspection' },
  // 点检管理
  'spotcheck:view': { name: '查看点检', module: 'spotcheck' },
  'spotcheck:execute': { name: '执行点检', module: 'spotcheck' },
  'spotcheck:edit': { name: '编辑点检', module: 'spotcheck' },
  // 报修维修
  'repair:view': { name: '查看报修', module: 'repair' },
  'repair:create': { name: '创建报修', module: 'repair' },
  'repair:handle': { name: '处理维修', module: 'repair' },
  'repair:delete': { name: '删除报修', module: 'repair' },
  // 维护保养
  'maintain:view': { name: '查看保养', module: 'maintain' },
  'maintain:execute': { name: '执行保养', module: 'maintain' },
  'maintain:edit': { name: '编辑保养', module: 'maintain' },
  // 备件管理
  'sparepart:view': { name: '查看备件', module: 'sparepart' },
  'sparepart:in': { name: '备件入库', module: 'sparepart' },
  'sparepart:out': { name: '备件出库', module: 'sparepart' },
  'sparepart:edit': { name: '编辑备件', module: 'sparepart' },
  // 事件管理
  'event:view': { name: '查看事件', module: 'event' },
  'event:create': { name: '上报事件', module: 'event' },
  'event:handle': { name: '处理事件', module: 'event' },
  'event:delete': { name: '删除事件', module: 'event' },
  // 系统配置
  'config:view': { name: '查看配置', module: 'config' },
  'config:edit': { name: '修改配置', module: 'config' },
  // 飞书集成
  'feishu:sync': { name: '飞书同步', module: 'feishu' },
  'feishu:manage': { name: '飞书管理', module: 'feishu' },
  // 数据库管理
  'database:view': { name: '查看数据库', module: 'database' },
  'database:manage': { name: '管理数据库', module: 'database' },
  // 权限管理
  'permission:assign': { name: '分配权限', module: 'permission' },
  // 用户管理
  'user:manage': { name: '用户管理', module: 'user' }
}

// ============ 角色默认权限 ============
const ROLE_DEFAULT_PERMISSIONS = {
  super_admin: Object.keys(PERMISSIONS),
  admin: Object.keys(PERMISSIONS).filter(p => !p.startsWith('permission:') && !p.startsWith('user:')),
  manager: [
    'equipment:view', 'equipment:edit', 'equipment:import',
    'inspection:view', 'inspection:execute', 'inspection:edit',
    'spotcheck:view', 'spotcheck:execute',
    'repair:view', 'repair:create', 'repair:handle',
    'maintain:view', 'maintain:execute', 'maintain:edit',
    'sparepart:view', 'sparepart:in', 'sparepart:out',
    'event:view', 'event:create', 'event:handle',
    'config:view', 'feishu:sync'
  ],
  inspector: [
    'equipment:view',
    'inspection:view', 'inspection:execute',
    'spotcheck:view', 'spotcheck:execute',
    'repair:view', 'repair:create',
    'maintain:view',
    'sparepart:view',
    'event:view', 'event:create',
    'feishu:sync'
  ],
  repairer: [
    'equipment:view',
    'inspection:view',
    'spotcheck:view',
    'repair:view', 'repair:handle',
    'maintain:view', 'maintain:execute',
    'sparepart:view', 'sparepart:out',
    'event:view',
    'feishu:sync'
  ],
  viewer: [
    'equipment:view', 'inspection:view', 'spotcheck:view',
    'repair:view', 'maintain:view', 'sparepart:view',
    'event:view', 'config:view'
  ]
}

// ============ 权限管理器 ============
const STORAGE_KEY = 'custom_permissions'
const USER_ROLE_KEY = 'user_roles'

const permission = {
  // 获取当前用户角色
  getCurrentRole() {
    const userInfo = (getApp().globalData.userInfo) || {}
    return userInfo.role || userInfo.roleId || 'inspector'
  },

  // 获取角色信息
  getRole(roleId) {
    const role = Object.values(ROLES).find(r => r.id === roleId)
    return role || ROLES.VIEWER
  },

  // 获取所有角色
  getAllRoles() {
    return Object.values(ROLES)
  },

  // 获取用户权限列表
  getUserPermissions(userId) {
    const userInfo = (getApp().globalData.userInfo) || {}
    const uid = userId || userInfo.userId || 'default'
    const role = this.getCurrentRole()

    // 检查自定义权限
    const customPerms = wx.getStorageSync(STORAGE_KEY) || {}
    if (customPerms[uid]) {
      return customPerms[uid]
    }

    // 使用角色默认权限
    return ROLE_DEFAULT_PERMISSIONS[role] || ROLE_DEFAULT_PERMISSIONS.viewer
  },

  // 检查是否有权限
  hasPermission(perm) {
    const perms = this.getUserPermissions()
    return perms.indexOf(perm) > -1
  },

  // 检查是否有任一权限
  hasAnyPermission(perms) {
    return perms.some(p => this.hasPermission(p))
  },

  // 检查是否有全部权限
  hasAllPermissions(perms) {
    return perms.every(p => this.hasPermission(p))
  },

  // 设置用户自定义权限
  setUserPermissions(userId, permissions) {
    const customPerms = wx.getStorageSync(STORAGE_KEY) || {}
    customPerms[userId] = permissions
    wx.setStorageSync(STORAGE_KEY, customPerms)
  },

  // 设置用户角色
  setUserRole(userId, roleId) {
    const userRoles = wx.getStorageSync(USER_ROLE_KEY) || {}
    userRoles[userId] = roleId
    wx.setStorageSync(USER_ROLE_KEY, userRoles)
    // 同时更新全局用户信息
    const app = getApp()
    if (app && app.globalData.userInfo) {
      app.globalData.userInfo.role = roleId
      app.globalData.userInfo.roleName = this.getRole(roleId).name
    }
  },

  // 获取所有用户角色映射
  getAllUserRoles() {
    return wx.getStorageSync(USER_ROLE_KEY) || {}
  },

  // 获取所有权限定义
  getAllPermissions() {
    return PERMISSIONS
  },

  // 按模块分组权限
  getPermissionsByModule() {
    const groups = {}
    Object.entries(PERMISSIONS).forEach(([key, perm]) => {
      if (!groups[perm.module]) groups[perm.module] = []
      groups[perm.module].push({ key, ...perm })
    })
    return groups
  },

  // 获取角色默认权限
  getRoleDefaultPermissions(roleId) {
    return ROLE_DEFAULT_PERMISSIONS[roleId] || []
  },

  // 权限检查中间件（用于页面）
  checkPagePermission(requiredPerm) {
    if (!this.hasPermission(requiredPerm)) {
      wx.showModal({
        title: '权限不足',
        content: '您没有权限访问此功能，请联系管理员开通。',
        showCancel: false,
        confirmText: '知道了'
      })
      return false
    }
    return true
  }
}

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_DEFAULT_PERMISSIONS,
  permission
}
