# 设备点巡检管理系统

> 基于若依（RuoYi）框架二次开发的设备点巡检管理系统，支持二维码/NFC/GPS巡检、AR巡检、无人机巡检等多种巡检方式。前后端分离架构，包含 Java 后端、微信小程序前端，二开方便，功能完善。

## 目录

- [项目简介](#项目简介)
- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [数据库配置](#数据库配置)
- [后端部署](#后端部署)
- [小程序配置](#小程序配置)
- [飞书集成](#飞书集成)
- [接口文档](#接口文档)
- [开源须知](#开源须知)
- [许可证](#许可证)

## 项目简介

本系统是一款面向工业场景的设备点巡检管理平台，覆盖设备全生命周期管理，从设备建档、巡检计划、巡检任务到报修维修、维护保养、备件管理等环节，提供完整的闭环管理。系统同时支持微信小程序端移动巡检，方便一线人员现场作业。

### 核心能力

- 二维码扫码签到巡检
- NFC 标签触碰签到
- GPS 定位签到打卡
- AR 增强现实巡检（商业版）
- 无人机巡检（商业版）
- 飞书多维表格数据同步
- AI 智能分析

## 功能特性

### 巡检管理

| 模块 | 功能说明 |
| --- | --- |
| 巡检项目管理 | 巡检项目的创建、编辑、启用/停用管理 |
| 巡检点管理 | 巡检点位置、二维码、NFC 标签、GPS 坐标管理 |
| 巡检计划 | 按周期制定巡检计划，关联巡检点和巡检人 |
| 巡检任务 | 任务生成、分配、执行、状态跟踪 |
| 巡检报表 | 巡检完成率统计、异常分析、趋势图表 |

### 设备管理

| 模块 | 功能说明 |
| --- | --- |
| 设备清单台账 | 设备基础信息、状态、位置、负责人管理 |
| 点检记录 | 设备日常点检项目执行与记录 |
| 报修维修 | 故障报修、维修派单、过程跟踪、费用统计 |
| 维护保养 | 保养计划、保养执行、保养记录管理 |
| 备件管理 | 备件库存、出入库流水、库存预警 |

### 事件与告警

| 模块 | 功能说明 |
| --- | --- |
| 事件管理 | 巡检异常事件记录、处理跟踪、闭环管理 |
| 安灯呼叫 | 设备故障/品质异常/物料短缺呼叫与响应 |
| IoT 数据采集 | 传感器数据实时采集与告警 |
| 到期提醒 | 设备校验、保养、质保等到期自动提醒 |

### 系统管理

| 模块 | 功能说明 |
| --- | --- |
| 用户管理 | 系统用户配置、角色分配 |
| 部门管理 | 组织机构树形结构，支持数据权限 |
| 岗位管理 | 用户职务配置 |
| 定时任务 | 在线任务调度（增/改/删），含执行日志 |
| 代码生成 | 前后端代码一键生成（Java/HTML/XML/SQL） |
| 服务监控 | CPU、内存、磁盘等系统状态监控 |
| 缓存监控 | Redis 缓存信息查询与命令统计 |
| 连接池监视 | 数据库连接池状态监控与 SQL 性能分析 |

## 技术栈

### 后端

| 技术 | 版本 | 说明 |
| --- | --- | --- |
| Spring Boot | 2.2.13 | 核心框架 |
| Spring Security | - | 权限控制 |
| MyBatis | 2.1.4 | ORM 框架 |
| PageHelper | 1.3.1 | 分页插件 |
| Druid | 1.2.6 | 数据库连接池 |
| Redis + Lettuce | - | 缓存与 Token 存储 |
| JWT (jjwt) | 0.9.1 | 多终端认证 |
| Swagger | 3.0.0 | 接口文档 |
| Quartz | - | 定时任务调度 |
| Velocity | 1.7 | 代码生成模板引擎 |
| Apache POI | 4.1.2 | Excel 导入导出 |
| FastJSON | 1.2.76 | JSON 解析 |
| Kaptcha | 2.3.2 | 验证码生成 |

### 小程序前端

| 技术 | 说明 |
| --- | --- |
| 微信小程序原生框架 | 基础框架 |
| 自定义 TabBar | 底部导航定制 |
| WeChat API | 扫码、NFC、GPS、相机等原生能力 |
| 飞书开放平台 API | 多维表格数据同步 |

### 基础环境

| 环境 | 要求 |
| --- | --- |
| JDK | 1.8+ |
| Maven | 3.6+ |
| MySQL | 8.0+ |
| Redis | 5.0+ |
| 微信开发者工具 | 最新稳定版 |

## 项目结构

```
inspection-master/
├── lh-admin/              # 主应用模块（启动入口、控制器、配置）
│   └── src/main/
│       ├── java/com/lh/
│       │   ├── LhApplication.java       # 启动类
│       │   └── web/controller/          # 各模块控制器
│       └── resources/
│           ├── application.yml          # 主配置文件
│           ├── application-druid.yml     # 数据源配置
│           ├── mapper/                  # MyBatis XML 映射
│           └── mybatis/                 # MyBatis 全局配置
├── lh-framework/         # 核心框架模块（安全、拦截器、服务）
├── lh-system/            # 业务系统模块（巡检、设备、工单等业务）
├── lh-common/            # 通用工具模块（工具类、常量、异常）
├── lh-quartz/            # 定时任务模块
├── lh-generator/         # 代码生成模块
├── inspection-miniprogram/  # 微信小程序前端
│   ├── app.js / app.json / app.wxss     # 小程序入口
│   ├── components/                      # 自定义组件
│   ├── pages/                           # 页面（50+ 页面）
│   ├── utils/                           # 工具函数
│   │   ├── api.js                       # API 接口定义
│   │   ├── request.js                   # 网络请求封装
│   │   ├── mock.js                      # Mock 数据
│   │   ├── feishu.js                    # 飞书同步逻辑
│   │   ├── feishu-config.js             # 飞书表格字段配置
│   │   ├── auth.js                      # 认证工具
│   │   └── ...
│   └── custom-tab-bar/                  # 自定义底部导航
├── sql/                  # 数据库脚本
│   └── lh_db.sql                        # 完整数据库 DDL + 初始数据
├── bin/                  # 脚本工具
├── pom.xml               # Maven 父级 POM
├── admin.sh              # Linux 部署脚本
├── admin.bat             # Windows 部署脚本
├── LICENSE               # 开源许可证
└── .gitignore
```

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/yijie-hgh/my-project-code.git
cd my-project-code
```

### 2. 初始化数据库

```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE lh_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"

# 导入初始数据
mysql -u root -p lh_db < sql/lh_db.sql
```

### 3. 配置后端连接

编辑 `lh-admin/src/main/resources/application-druid.yml`：

```yaml
spring:
    datasource:
        druid:
            master:
                url: jdbc:mysql://127.0.0.1:3306/lh_db?useUnicode=true&characterEncoding=utf8&zeroDateTimeBehavior=convertToNull&useSSL=true&serverTimezone=GMT%2B8
                username: root
                password: YOUR_DB_PASSWORD
```

编辑 `lh-admin/src/main/resources/application.yml` 中的 Redis 配置：

```yaml
spring:
  redis:
    host: 127.0.0.1
    port: 6379
    password: YOUR_REDIS_PASSWORD
```

### 4. 构建并启动后端

```bash
# 编译打包
mvn clean package -DskipTests

# 方式一：直接运行
java -jar lh-admin/target/lh-admin.jar

# 方式二：使用脚本（Linux/Mac）
chmod +x admin.sh
./admin.sh start

# 方式三：使用脚本（Windows）
admin.bat start
```

启动成功后访问：`http://localhost:8080`

### 5. 启动小程序前端

1. 打开**微信开发者工具**
2. 导入项目，选择 `inspection-miniprogram/` 目录
3. 在 `utils/request.js` 中配置后端 API 地址：
   ```javascript
   const BASE_URL = 'http://localhost:8080'
   ```
4. 如需使用 Mock 数据（无需后端），在 `app.js` 中设置：
   ```javascript
   globalData: { useMock: true }
   ```

## 数据库配置

系统使用 MySQL 8.0，默认数据库名为 `lh_db`。主要数据表分类如下：

| 前缀 | 说明 |
| --- | --- |
| `sys_*` | 系统管理表（用户、角色、菜单、部门等） |
| `base_*` | 基础数据表（文章、反馈等） |
| `qrtz_*` | Quartz 定时任务表 |
| `gen_*` | 代码生成器表 |

完整建表语句和初始数据见 `sql/lh_db.sql`。

## 后端部署

### 部署脚本

```bash
# 启动
./admin.sh start

# 停止
./admin.sh stop

# 重启
./admin.sh restart

# 查看状态
./admin.sh status
```

### JVM 参数

默认 JVM 参数（可按需调整）：

```
-Xms512M -Xmx512M -XX:PermSize=256M -XX:MaxPermSize=512M
-XX:+HeapDumpOnOutOfMemoryError -XX:+UseParallelGC
```

### 华为云 OBS 配置（可选）

如需使用云存储功能，在 `application.yml` 中配置：

```yaml
huaweicloud:
  obs:
      end_point: obs.cn-north-4.myhuaweicloud.com
      access_key_id: YOUR_ACCESS_KEY_ID
      secret_access_key: YOUR_SECRET_ACCESS_KEY
      bucket_name: your-bucket
```

## 小程序配置

### 页面总览

小程序包含 50+ 页面，覆盖完整巡检业务流程：

| 分类 | 页面 |
| --- | --- |
| 首页 | 首页、仪表盘 |
| 巡检 | 任务列表/详情/执行、巡检点、巡检项目、巡检计划 |
| 设备 | 设备清单/详情/台账/扫码、点检列表/执行/统计 |
| 维修 | 报修列表/详情/创建/统计、维护保养列表/详情/执行 |
| 备件 | 备件列表/详情/出入库 |
| 事件 | 事件列表/详情/跟踪/创建、安灯呼叫 |
| 高级 | AR 巡检、无人机巡检、IoT 监控、AI 分析 |
| 系统 | 登录、注册、个人中心、配置、权限、通知、账号绑定 |

### 登录方式

系统支持四种登录方式：
- 账号密码登录
- 微信快捷登录
- 短信验证码登录
- 飞书账号登录

### 签到方式

- 二维码扫码签到
- NFC 标签触碰签到
- GPS 定位签到

## 飞书集成

系统支持将巡检数据同步到飞书多维表格（Bitable），便于企业数据协同。

### 配置方式

1. 在小程序 `pages/feishu/settings/` 页面配置飞书应用凭证
2. 各模块的飞书表格字段映射定义在 `utils/feishu-config.js` 中
3. 支持同步的模块包括：设备清单、巡检任务、巡检记录、点检记录、报修维修、维护保养、备件管理、安灯记录、IoT 数据、到期提醒、事件管理、巡检项目、巡检点

### 飞书表格字段类型映射

```
FieldType.TEXT       -> 多行文本
FieldType.NUMBER     -> 数字
FieldType.SINGLE_SELECT -> 单选
FieldType.DATE_TIME  -> 日期时间
FieldType.ATTACHMENT -> 附件
FieldType.PHONE      -> 电话
...
```

## 接口文档

后端启动后，Swagger 接口文档访问地址：

```
http://localhost:8080/swagger-ui/index.html
```

接口路径前缀：`/api`

主要接口分类：
- `/api/wx/login` - 小程序登录
- `/api/wx/register` - 用户注册
- `/api/wx/getUserInfoData` - 获取用户信息
- `/system/*` - 系统管理接口
- `/monitor/*` - 监控接口
- `/tool/*` - 工具接口

## 开源须知

1. 本项目仅允许用于个人学习研究使用
2. 禁止将本开源的代码和资源进行任何形式任何名义的出售
3. 软件受国家计算机软件著作权保护（登记号：2021SR0805085）
4. 限制商用，如需商业使用请联系原作者

## 许可证

本项目基于若依（RuoYi）框架二次开发，遵循原框架开源协议。详见 [LICENSE](LICENSE) 文件。

## 致谢

- [若依（RuoYi）](https://gitee.com/y_project/RuoYi) - 基础框架
- [Druid](https://github.com/alibaba/druid) - 数据库连接池
- [MyBatis](https://mybatis.org/) - ORM 框架
- [Element UI](https://element.eleme.io/) - 前端 UI 组件库
