# Axure11 静态原型维护规则

## 项目定位

本项目是 Axure11 导出的静态 HTML 原型，用于 GitHub Pages 部署。

如需编辑 `B端后台操作手册.docx`，先遵守独立规则文档：`操作手册编辑规则.md`。

补充约定：

- 用户消息如果以“操作手册”开头，默认表示本次任务只需要修改操作手册相关内容。
- 除非用户在同一条需求里明确要求同步原型页面、菜单或静态资源，否则不要改 HTML、`data/document.js`、页面 CSS/JS 或其他原型文件。
- 这类请求优先按操作手册流程执行：定位目标章节、更新 `B端后台操作手册.docx`、保留或新增所需手册图片资产，并做最小校验。
- 如果用户在聊天里直接发了截图，默认把该截图视为手册配图第一来源；不要先生成示意图、不要先截图 HTML、不要先讨论替代图源。
- 手册配图固定优先级：当前会话原图 > 当前线程历史原图 > 本机 Codex 日志中的原图 > 用户重新上传/提供路径；只有用户没有提供聊天原图时，才考虑旧 Word 截图、本地 HTML 截图或 Pillow 示意图。
- 对“使用聊天中的原图”这类需求，固定动作是：读取线程或日志中的 `data:image` -> 落盘到 `custom/assets/manual-模块名/` 或 `custom/assets/manual-模块名-original/` -> 核对图片内容 -> 让手册脚本引用该原图；不要每次临时换方案。
- 不要为了确认聊天原图而先大范围扫描缓存、浏览器存储或无关目录；优先复用现成脚本 `scripts/extract_chat_images_from_codex_log.py`，仅在它失败时再做最小范围日志定位。
- 如果手册脚本已经确认使用聊天原图，脚本中不要再保留自动生成示意图、自动截 HTML 或其他 fallback 图源分支，避免后续误用。

维护目标：

- 保持 Axure11 原有 HTML 文件夹结构和运行方式。
- 保持左上角页面目录菜单可导航。
- 支持后续 Axure11 再导出并增量覆盖。
- AI 新页面作为静态页面资产独立维护。
- 不改造成现代前端工程。

默认页面风格为 B 端 SaaS 运营/管理后台。

## 必须遵守

- 使用静态 HTML、CSS、JS 和 Axure 原有页面壳。
- 所有路径使用相对路径，保证 GitHub Pages 可直接访问。
- 中文文件名、中文菜单名、中文内容使用 UTF-8，不能乱码。
- 公共自定义资产放在 `custom/`、`custom/css/`、`custom/js/`、`custom/assets/`。
- AI 新增且要进入 Axure 菜单的 HTML 默认放项目根目录。
- 修改菜单只改 `data/document.js` 的 `sitemap.rootNodes`，保留 `$axure.loadDocument(...)` 外壳。
- 复用已有菜单节点时保留原 `id / pageName / url / children`，不要无故重建节点。

## 避免事项

- 不引入 React、Vue、Angular、NextJS、Vite、Webpack、npm 工程化、TypeScript 工程化、Tailwind CLI、SPA 路由或大型 UI 框架。
- 不修改 `resources/` 下 Axure 核心脚本、Axure runtime、Axure 原有页面核心逻辑和 Axure 原有全局 CSS。
- 不把需要进入左上角菜单的页面默认放进 `custom/pages/`，否则 Axure 菜单可能无法识别。
- 不依赖本地绝对路径、构建命令或外部网络资源作为必要能力。
- 不为了菜单目录调整而移动 HTML 文件位置，除非用户明确要求。

## 新增菜单页面

推荐结构：

```text
页面名.html
files/页面名/data.js
files/页面名/styles.css
custom/css/页面名.css
custom/js/页面名.js
```

菜单页面 HTML 必须引用：

- `resources/css/axure_rp_page.css`
- `data/styles.css`
- `files/页面名/styles.css`
- `custom/css/页面名.css`
- `data/document.js`
- `files/页面名/data.js`
- `custom/js/axure-custom-page-ready.js`
- `resources/scripts/axure/ios.js`
- 如有独立交互 JS，再引用 `custom/js/页面名.js`

如页面依赖自定义 JS 渲染表格、Tab、弹窗或编辑态：

- HTML 中先放可展示的首屏静态内容或兜底空态，不能只留空容器等待 JS 渲染。
- 自定义 JS 必须等 DOM 就绪后再查询元素和绑定事件，可使用 `DOMContentLoaded` 或项目已有 ready 工具。
- JS 初始化前要做关键 DOM 空值保护，避免一个元素没取到导致整页交互失效。
- 多 Tab 页面必须为每个 Tab 准备完整展示态数据；用户截图有顺序时，按截图顺序和选中态实现。
- 编辑态如果由点击主表单元格触发，展示态和编辑态都要可用；保存、取消、确认弹窗要能回到正确状态。

`#base` 必须保持 Axure 标准空容器：

```html
<div id="base" class="">
  <div class="custom-page-shell">
    ...
  </div>
</div>
```

自定义布局、背景、grid/flex、`min-height: 100vh` 等样式放在 `#base` 内部容器上，不直接作用于 `#base`。

## 页面 data.js

每个菜单页面必须有：

```text
files/页面名/data.js
files/页面名/styles.css
```

`files/页面名/styles.css` 可以为空，但必须存在并被 HTML 引用。

`files/页面名/data.js` 使用完整最小 Axure 页面数据结构，至少保证：

- 存在 `$axure.loadCurrentPage({...})`。
- `url` 等于页面 HTML 文件名。
- `page.packageId` 与 `data/document.js` sitemap 节点 `id` 一致。
- `page.name` 是页面名称。
- 保留 Axure 常用 `variables`。
- `diagram.objects` 至少为空数组。
- 若页面需要通过 `index.html?id=...` 进入，不要把 `files/页面名/data.js` 写成过薄的极简壳；应直接对齐项目内稳定页面的完整最小结构，至少补齐 `defaultAdaptiveView`、`adaptiveViews`、`sketchKeys`、完整 `variables`、`page.annotations`、`page.style`、顶层 `masters/objectPaths`。

## 菜单与快照

当前菜单基准保存在：

```text
scripts/ai-menu-snapshot.json
```

恢复脚本：

```text
restore-ai-menu.cmd
scripts/restore-ai-menu.js
```

Axure 重新导出后，执行一条命令恢复菜单：

```powershell
.\restore-ai-menu.cmd
```

当用户确认当前菜单结构已经调整正确，并希望作为以后恢复基准时，保存新快照：

```powershell
.\restore-ai-menu.cmd save
```

菜单恢复规则：

- 默认按 `scripts/ai-menu-snapshot.json` 恢复菜单结构。
- 恢复时保留 Axure 新导出的、快照里没有的菜单节点。
- 调整目录结构或移动菜单节点后，必须执行 `.\restore-ai-menu.cmd save` 更新快照。
- 新增 AI 页面菜单节点时，新增页面 `data.js` 的 `page.packageId` 必须与 sitemap 节点 `id` 一致。
- AI 新增节点的 `id` 应唯一；移动或复用已有节点时保留原 `id`。

手动调整 sitemap 时：

- 先解析 `data/document.js` 得到真实 `sitemap.rootNodes`，不要直接手改 Axure 压缩变量表。
- 如果 `data/document.js` 是 `$axure.loadDocument((function(){...})())` 形式，可用 Node 临时提供 `$axure.loadDocument = d => doc = d` 读取对象。
- 写回时保留 `$axure.loadDocument(...)` 外壳，可以写成格式化 JSON，便于后续维护。
- 重排后检查顶层顺序、关键子级归属、页面 `url` 和文件是否存在。

菜单挂载快速规则：

- 已知父级中文名时，优先按截图/面包屑推断父级，再用一次 `data/document.js` 解析确认；不要反复全局搜索和打印大段菜单。
- 父级节点优先用稳定 `id` 查找；如本项目常见父级：`用户管理` 对应 `user_management`。
- 新增节点只做“查父级、查是否已有同 id/pageName/url、插入或覆盖该节点”三步，不重建同级节点。
- 打印菜单校验时只输出目标父级的 `id/pageName/url` 三列，避免输出完整 `document.js` 或整棵 sitemap。
- 写入后立即校验：菜单节点 `id`、页面 `data.js` 的 `page.packageId`、页面 `url`、页面 `name` 四项必须一致。

## B 端 SaaS 页面风格

优先使用：

- 现代后台 UI，白色科技感，低饱和蓝，适中圆角，通常不超过 8px。
- 高信息密度、清晰层级、紧凑但可读的布局。
- 筛选区、操作按钮、数据表格、状态标签、分页、行内操作。
- 配置页、报表页、管理页优先用表格和弹窗承载流程。
- 默认数据要完整，方便静态原型直接演示。

避免使用：

- 营销页 Hero、过度渐变、夸张动画、大面积插画、低端霓虹风、过度留白。
- 页面顶部无需求的“保存”或“操作日志”按钮。
- 行内“修改”跳转页面；默认使用弹窗，除非用户明确要求跳转。

弹窗统一包含：

- 标题栏。
- 右上角关闭。
- 中间表单。
- 底部按钮：取消、确定。
- 遮罩默认使用 `hidden` 关闭态。
- 自定义 CSS 必须包含 `[hidden] { display: none !important; }`。

## 编码与 Windows 注意事项

- HTML、CSS、JS、`data/document.js`、页面 `data.js` 均使用 UTF-8 读写。
- 控制台显示中文为 `?` 不一定代表文件损坏；必须检查文件实际内容或字符码点。
- 若码点是 `0x3f`，说明中文已经真实损坏，需要从备份或 Git 对象恢复。
- 写入 `data/document.js`、页面 `data.js` 或中文 HTML 后，至少做一次中文关键字/码点验证。
- 不要把包含中文字符串的长脚本通过 PowerShell here-string 管道传给 Node/Python 后直接写入项目文件。
- 不要在 PowerShell 双引号命令中直接写未转义的 `$axure`，否则可能被展开成空字符串并写坏 `data/document.js` 外壳。
- 需要写中文内容时，优先使用 `apply_patch`；脚本写入时使用 Unicode 转义字符串生成 UTF-8。
- 不假设系统一定存在 `git` 命令；需要恢复文件时优先用可用 Git 工具，必要时再从 `.git` 对象库读取。

Windows 中文文件名与脚本省 token 规则：

- 不用 PowerShell here-string 向 Node 传递包含中文文件名、中文正则、中文菜单名的脚本；这类脚本可能在进入 Node 前已变成 `????`。
- 需要用脚本处理中文路径时，在脚本内部用 Unicode 码点或 `\uXXXX` 拼出中文字符串，例如 `String.fromCharCode(...)`，不要在命令文本里直接写中文。
- 需要校验中文时，也不要在验证脚本里直接写中文正则；用 Unicode 转义生成目标词，再检查 `includes` 和码点。
- 如果控制台输出 `????`，不要继续保存快照；先做码点验证。若目标字符串码点包含 `3f`，先修复文件，再执行 `.\restore-ai-menu.cmd save`。
- 创建中文命名页面文件本身优先用 `apply_patch`，不要用 PowerShell/Node 脚本批量写中文文件名。
- `.\restore-ai-menu.cmd save` 只能在菜单中文码点确认正常后执行；如果误保存了 `????` 快照，修复 `data/document.js` 后必须重新 save。
- 与中文无关的语法检查继续用 `node -c`；涉及中文路径的存在性检查用脚本内部生成路径，避免命令行字面中文被转码。

新增页面少绕路基线：

- 如项目已有相似 AI 静态页面，优先复用其 HTML Axure 壳、`data.js` 最小结构、CSS/JS 引用顺序，不再从零探索 Axure 运行时结构。
- 常规新增菜单页只需要读取：目标父级菜单片段、一个相似页面 HTML、一个相似页面 `files/页面名/data.js`；除非报错，不做全项目结构深挖。
- 默认不做浏览器预览，不启动服务；只做静态验证和交互源码连通检查。
- 如果验证脚本本身因中文转码失败，立即改为 Unicode 转义脚本，不要反复重跑同一类失败命令。

## 默认执行流程

生成新页面时：

1. 读取目标父级菜单片段和一个相似页面作为模板；不要默认全量扫描项目结构。
2. 确认页面挂载的菜单父节点；如果用户提供截图，优先根据截图左上角的菜单/面包屑文字判断新页面应挂载的位置，再结合现有 `sitemap.rootNodes` 校验父级是否存在。
3. 新增根目录 HTML、`files/页面名/data.js`、`files/页面名/styles.css`。
4. 新增 `custom/css/页面名.css`，如有交互再新增 `custom/js/页面名.js`。
5. 修改 `data/document.js` sitemap，保证 `id / packageId / url` 一致。
6. 检查 `#base class=""`、ready 脚本、ios 脚本和相对路径。
7. 对 Tab、按钮、弹窗、编辑态等交互做简单连通检查：确认入口元素存在、默认数据不为空、事件脚本在 DOM 就绪后初始化。
8. 先做中文码点和 sitemap 对齐校验，确认没有 `0x3f` 后再执行 `.\restore-ai-menu.cmd save`。
9. 做静态验证。

Axure 重新导出后：

1. 执行 `.\restore-ai-menu.cmd`。
2. 检查新导出页面是否被保留在菜单中。
3. 如需调整目录位置，调整后执行 `.\restore-ai-menu.cmd save`。
4. 做最小静态验证。

## 验证约定

默认只做静态验证，不做浏览器预览、截图或 Playwright 检查，除非用户明确要求。

优先运行与本次修改直接相关的最小验证：

- `node -c data/document.js`
- `node -c scripts/restore-ai-menu.js`
- `node -c custom/js/页面名.js`，仅当本次新增或修改了独立交互 JS。
- 用一次 Node 读取 `$axure.loadDocument`，输出必要的菜单子树。
- 检查本次新增或修改的文件是否存在。
- 检查本次涉及的中文菜单名码点是否正常。
- 对新页面做简单源码检查：Tab 数量、首屏表格行数、关键按钮/弹窗节点、`DOMContentLoaded` 或等价 ready 初始化是否存在。
- 验证脚本涉及中文词、中文路径时，使用 Unicode 转义或 `String.fromCharCode` 生成字符串，不直接在命令里写中文。

检查保持简单，不要求每次都做完整浏览器预览；但如果页面靠 JS 才能显示数据或切换 Tab，至少要确认 HTML 有兜底内容，JS 不会在 DOM 未生成时提前绑定失败。

避免重复打印完整 `data/document.js` 或做无关的全项目扫描。

如果发现编码写坏、脚本误写或 sitemap 结构异常：

1. 先停止继续写入。
2. 优先从修改前备份、菜单快照或 Git HEAD 恢复目标文件。
3. 用不会破坏中文编码的方式重新应用变更。
4. 只重复必要的最小验证。

## 回复用户

生成页面或调整菜单后的回复保持简洁，通常包含：

- 改了什么页面或菜单。
- 涉及的文件结构。
- 页面放置路径。
- 导航接入方式。
- GitHub Pages 注意事项。

默认不输出 git 信息，除非用户明确要求。
