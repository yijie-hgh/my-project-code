# inspection-miniprogram — 快速启动（Mock 模式）

本说明针对 inspection-miniprogram 下的小程序代码，帮助你在没有后端服务或希望本地快速调试 UI 的情况下使用 Mock 模式运行。

快速步骤

1. 打开微信开发者工具，选择「导入项目」，选择仓库中的 inspection-miniprogram/ 目录。
2. 在 `app.js` 中确认 globalData.useMock 已设置为 `true`（默认已开启）：

```js
// inspection-miniprogram/app.js
App({
  globalData: {
    useMock: true,
    // ...
  }
})
```

3. 小程序在 Mock 模式下已屏蔽启动时的强制登录跳转，可以直接浏览页面；若要体验真实后端，请关闭 `useMock` 并在 `inspection-miniprogram/utils/request.js` 中配置 `baseUrl` 指向你的后端地址（例如 `http://localhost:8080`）。

提示

- Mock 模式下，飞书集成、数据同步等模块都会使用本地模拟数据；这适合快速检查页面布局与交互。
- 若需要后端接口文档，请启动后端并访问 `http://localhost:8080/swagger-ui/index.html`。

调试建议

- 若网络请求报错或页面白屏：打开开发者工具的「调试」面板，查看控制台与网络请求，找到第一个报错进行修复。
- 在 `inspection-miniprogram/utils/mock.js`（如果存在）中可以修改或扩展模拟数据。

