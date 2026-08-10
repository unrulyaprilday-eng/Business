# AGENTS.md

本项目是 Axure11 导出的 B 端 SaaS 运营/管理后台静态原型，用于 GitHub Pages。保持 Axure 目录、运行方式和菜单导航，不改造成现代前端工程。

## 子代理调用

- 默认选择能可靠完成任务的最低级别；不确定时上调一级，质量优先于省 token。低到高：`Luna Max`（简单隔离/UI/CRUD/测试/文档）；`Terra High`（常规开发/bug/集成/中等重构）；`Terra Max`（中大型/跨模块/难 bug）；`Sol High`（重要功能/复杂业务/较大重构）；`Sol XHigh`（复杂架构/关键跨模块/困难调试）；`Sol Max`（关键架构/安全/支付钱包/数据库迁移/极端调试）。
- 只派发独立、可验收的子任务，并注明级别。子代理先读当前项目和目标端 `AGENTS.md`，检查现有代码，限范围修改，按目标端规则验证并回报改动/风险；超出级别只报 `ESCALATE`，由主代理决定升级。
- 最多 5 个并发，避免多个代理改同一文件；主代理负责整合、冲突处理和最终验证。本端作为独立项目打开时，本节直接生效；跨端访问先确认工作区权限。

## 操作手册任务

- 编辑 `B端后台操作手册.docx` 前先遵守 `操作手册编辑规则.md`。用户消息以“操作手册”开头时，默认只改手册；未明确要求时不改 HTML、菜单或页面 CSS/JS。
- 用户要求“按小节重建”或“新增图片后更新内容”时，整节重建：图片放 `custom/assets/manual-*/`，`scripts/manual-*.json` 明确 `module/image/caption/bullet` 顺序，`keep_existing_media=false`。
- 聊天截图是第一图源；优先级为当前会话原图、线程历史原图、Codex 日志原图、用户路径，之后才考虑旧 Word/HTML/Pillow 图。优先用 `scripts/extract_chat_images_from_codex_log.py`，失败后才做小范围日志定位。
- 原图确认后，脚本只引用该图，不保留自动示意图、HTML 截图等 fallback 分支。

## 硬性规则

- 只用静态 HTML、CSS、JS 和 Axure 页面壳；路径使用相对路径。
- 不引入 React、Vue、Angular、NextJS、Vite、Webpack、npm、TypeScript 工程化、Tailwind CLI、SPA 路由或大型 UI 框架。
- 不修改 `resources/`、Axure runtime、原有页面核心逻辑和全局 CSS，除非用户明确要求。
- 自定义资产放 `custom/`、`custom/css/`、`custom/js/`、`custom/assets/`；要进 Axure 菜单的 AI HTML 默认放项目根目录，不放 `custom/pages/`。
- 不依赖绝对路径、构建命令或外部网络资源，不为菜单调整移动 HTML，不批量改写无关文件。
- 中文文件名/内容使用 UTF-8；PowerShell 读取中文显式加 `-Encoding UTF8`。

## 新增菜单页面

先读取目标父级菜单片段、一个相近页面及所需组件，不默认全项目扫描。推荐结构：

```text
页面名.html
files/页面名/data.js
files/页面名/styles.css
custom/css/页面名.css
custom/js/页面名.js
```

HTML 引用 `resources/css/axure_rp_page.css`、`data/styles.css`、页面 styles、自有 CSS、`data/document.js`、页面 data、`custom/js/axure-custom-page-ready.js`、`resources/scripts/axure/ios.js`；有独立交互时再引自有 JS。

- `#base` 保持 Axure 空容器，自定义布局放内部容器；JS 渲染表格、Tab、弹窗或编辑态时，HTML 先有首屏静态内容/空态，JS 等 DOM 就绪并保护关键节点。
- 多 Tab 按截图顺序准备完整数据；编辑、保存、取消、确认弹窗应能回到正确状态。
- `files/页面名/styles.css` 即使为空也必须存在并引用。
- `files/页面名/data.js` 调用 `$axure.loadCurrentPage(...)`，保证 `url`、`page.packageId`、`page.name`、`variables`、`diagram.objects` 正确。通过 `index.html?id=...` 进入时，对齐稳定页面的完整最小结构，包含 `defaultAdaptiveView`、`adaptiveViews`、`sketchKeys`、annotations/style、masters/objectPaths 等必要字段。

## 组件库

- 先查 `custom/component-library/component-map.json`，再复用 `snippets/*.html`；按业务替换字段、列名、按钮和默认数据。
- 使用组件库样式时引用 `css/tokens.css`、`css/components.css`；只有 Tabs、弹窗、筛选重置、批量选择等交互才引 `js/components.js`。
- 组件类名保持 `cl-`，交互属性保持 `data-cl-*`；无匹配组件时先在目标页实现，确认可复用后再补组件库。不自动迁移旧页面或改无关页面。

## 菜单与快照

- 只改 `data/document.js` 的 `sitemap.rootNodes`，保留 `$axure.loadDocument(...)` 外壳；用 Node 解析对象后修改回写，不手拼压缩长行。
- 页面 id 唯一，`pageName`/`url` 与文件一致；复用节点时保留 `id/pageName/url/children`。按稳定 id 找父级和重复项，只插入/覆盖目标节点；例如 `用户管理` 常用 id 为 `user_management`。
- 写入后校验 sitemap id、`packageId`、页面 `url/name`、父级归属和文件存在；中文验证用稳定 id/url 或 Unicode 转义，不打印完整 sitemap。
- 菜单基准为 `scripts/ai-menu-snapshot.json`；Axure 重导出后执行 `.\restore-ai-menu.cmd`。调整目录或确认当前结构为新基准后执行 `.\restore-ai-menu.cmd save`；恢复时保留快照中没有的新导出节点。
- 新增 AI 节点 id 必须唯一。菜单中文码点异常时先修复，不保存 `????` 快照。

## B 端 UI 规则

- 白色科技感、低饱和蓝、圆角通常不超过 8px；高信息密度、紧凑可读。优先筛选区、工具栏、表格、状态、分页和行内操作，配置/报表/管理流程优先弹窗。
- 避免营销 Hero、过度渐变/动画/插画/留白、霓虹风；无需求不加顶部“保存/操作日志”，行内修改默认弹窗。
- 默认不加统计卡、KPI、数据概览或摘要横条；仅用户/参考明确要求，或看板、分析、经营报表确实需要时使用。列表、配置、审核、操作、普通查询页默认不用，疑问时不加。
- 单选框不得只靠 `accent-color`：在页面或 `cl-` 作用域内用 `appearance:none`，默认 16px 白底浅边框，选中蓝框蓝点，`:focus-visible` 用浅蓝轮廓；不混用原生与自定义外观。
- 弹窗包含标题、关闭、表单、取消/确定；遮罩默认 `hidden`，自定义 CSS 必须有 `[hidden] { display: none !important; }`。

## 编码与验证

- 中文显示为 `?` 不等于损坏；实际码点为 `0x3f` 才需恢复。写入中文 HTML、`data/document.js`、页面 data 或快照后做码点检查。
- 不用 PowerShell here-string/长 `node -e` 传递中文、正则、`$axure` 或多层引号；优先 `apply_patch` 或固定 `scripts/*.js`，命令行只传 ASCII/码点参数。失败后不要反复调同一条 inline 命令。
- 中文页面静态校验优先用 `node scripts/verify-static-page.js --page-cp <码点> --custom-js --custom-css`；新建 AI 菜单页追加 `--strict-page-data`。
- 默认只做相关静态验证，不启动服务、不截图、不跑 Playwright，除非用户明确要求。按需执行 `node -c data/document.js`、`node -c scripts/restore-ai-menu.js`、`node -c custom/js/页面名.js`，并检查文件、菜单子树、中文码点、首屏数据、关键按钮/弹窗和 ready 初始化。
- 页面靠 JS 显示数据/Tab 时确认 HTML 有兜底内容。若编码、脚本或 sitemap 写坏，先停止写入，从备份/快照/Git 恢复后只重跑必要检查。

## 默认流程与输出

新页面按“相近页面/组件 -> 父级菜单 -> HTML/data/styles/CSS/JS -> sitemap -> id/url/ready/交互 -> 中文码点 -> 必要时保存快照 -> 静态验证”执行。Axure 重导出后先恢复菜单，再检查新页面并做最小验证。

回复只说明实际改动、页面/菜单位置和关键验证结果；默认不输出 git 信息。
