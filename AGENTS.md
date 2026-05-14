# Axure11 静态原型维护规则

## 项目定位

本项目是 Axure11 导出的静态 HTML 原型，用于 GitHub Pages 部署。

维护目标：

- 保持 Axure11 原有 HTML 文件夹结构
- 保持左上角页面目录菜单可导航
- 支持后续 Axure11 再导出并增量覆盖
- AI 新页面作为静态页面资产独立维护
- 不重构为现代前端工程

项目默认是 B 端 SaaS 运营/管理后台风格。

## 禁止事项

禁止引入：

- React、Vue、Angular、NextJS
- Vite、Webpack、npm 工程化
- TypeScript 工程化
- Tailwind CLI
- SPA 路由
- 大型 UI 框架

禁止修改：

- `resources/` 下 Axure 核心脚本
- Axure runtime
- Axure 原有页面核心逻辑
- Axure 原有全局 CSS

## 新增文件位置

AI 新增页面如需加入 Axure 左上角菜单，HTML 默认放项目根目录：

```text
页面名.html
```

推荐结构：

```text
页面名.html
files/页面名/data.js
files/页面名/styles.css
custom/css/页面名.css
custom/js/页面名.js
```

公共自定义资产优先放：

```text
custom/
custom/css/
custom/js/
custom/assets/
```

不要默认把菜单页面放进 `custom/pages/`，否则 Axure 菜单可能无法识别。

## 菜单页面兼容要求

凡是要加入左上角菜单的新页面，必须：

- 使用独立 HTML、CSS，可选独立 JS
- 使用相对路径，GitHub Pages 可直接运行
- 保持 Axure 标准页面壳，脚本顺序参考现有根目录页面
- HTML 必须引用：
  - `resources/css/axure_rp_page.css`
  - `data/styles.css`
  - `files/页面名/styles.css`
  - `custom/css/页面名.css`
  - `data/document.js`
  - `files/页面名/data.js`
  - `custom/js/axure-custom-page-ready.js`
  - `resources/scripts/axure/ios.js`
- 如有独立交互 JS，再引用 `custom/js/页面名.js`

`#base` 必须保持 Axure 标准空容器：

```html
<div id="base" class="">
  <div class="custom-page-shell">
    ...
  </div>
</div>
```

自定义布局、背景、grid/flex、`min-height: 100vh` 等样式必须放在 `#base` 内部容器上，不能直接作用于 `#base`。

## 页面 data.js 规则

每个菜单页面必须有：

```text
files/页面名/data.js
files/页面名/styles.css
```

`files/页面名/styles.css` 可以为空，但必须存在并被 HTML 引用。

`files/页面名/data.js` 必须使用完整最小 Axure 页面数据结构，不能过度简化。可复制现有 AI 页面模板，但必须保证：

- `$axure.loadCurrentPage({...})` 存在
- `url` 等于页面 HTML 文件名
- `page.packageId` 与 `data/document.js` sitemap 节点 `id` 完全一致
- `page.name` 是页面名称
- 保留 Axure 常用 `variables`
- `diagram.objects` 至少为空数组

## sitemap 接入

新增菜单入口时，修改 `data/document.js` 的 sitemap：

- `id` 必须唯一
- `id` 与页面 `data.js` 的 `page.packageId` 一致
- `pageName` 是菜单显示名称
- `url` 是页面 HTML 相对路径
- 如果用户指定“放到某目录下面一级”，必须插入对应父级节点的 `children`

## B 端 SaaS UI 风格

默认风格：

- 现代后台 UI
- 白色科技感
- 高级 SaaS
- 数据密度高
- 表格、筛选、配置、弹窗优先
- 清晰信息层级
- 低饱和蓝
- 适中圆角，通常不超过 8px

避免：

- 营销页 Hero
- 过度渐变
- 夸张动画
- 大面积插画
- 低端霓虹风
- 过度留白

## 表格、配置页、报表页

优先包含：

- 筛选区
- 操作按钮
- 数据表格
- 状态标签
- 分页
- 行内操作
- 新增/修改弹窗
- 默认数据

行内“修改”默认使用弹窗，不跳转页面，除非用户明确要求。

弹窗统一包含：

- 标题栏
- 右上角关闭
- 中间表单
- 底部按钮：取消、确定

如果用户说“右上角保存不要”，页面顶部不要放保存按钮。  
如果用户说“操作日志也不要”，顶部不要放操作日志按钮。

## GitHub Pages 和编码

必须保证：

- 所有路径使用相对路径
- 中文文件名、中文菜单名、中文内容不乱码
- HTML、CSS、JS、`data/document.js`、页面 `data.js` 使用 UTF-8 读写
- 不依赖本地绝对路径
- 不依赖构建命令
- 不依赖外部网络资源作为必要能力
- 静态文件可直接访问

## 默认执行流程

生成新页面时：

1. 查看现有目录和 `data/document.js`
2. 确认页面挂载菜单节点
3. 新增根目录 HTML、`files/页面名/data.js`、`files/页面名/styles.css`
4. 新增 `custom/css/页面名.css`，如有交互再新增 `custom/js/页面名.js`
5. 修改 sitemap，保证 `id / packageId / url` 一致
6. 检查 `#base class=""`、ready 脚本、ios 脚本、相对路径
7. 跑 JS 语法检查，并确认能从 `index.html` 菜单打开

## 回复用户时

生成页面后的回复尽量简洁，包含：

- 页面说明
- 文件结构
- 页面放置路径
- 导航接入方式
- GitHub Pages 注意事项

不要输出冗长的内部排查清单。
