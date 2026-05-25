# Axure11 静态原型维护规则

## 项目定位

本项目是 Axure11 导出的静态 HTML 原型，用于 GitHub Pages 部署。

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

## 默认执行流程

生成新页面时：

1. 查看现有目录、`data/document.js` 和菜单快照。
2. 确认页面挂载的菜单父节点。
3. 新增根目录 HTML、`files/页面名/data.js`、`files/页面名/styles.css`。
4. 新增 `custom/css/页面名.css`，如有交互再新增 `custom/js/页面名.js`。
5. 修改 `data/document.js` sitemap，保证 `id / packageId / url` 一致。
6. 检查 `#base class=""`、ready 脚本、ios 脚本和相对路径。
7. 执行 `.\restore-ai-menu.cmd save`，把确认后的菜单写入快照。
8. 做静态验证。

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
- 用一次 Node 读取 `$axure.loadDocument`，输出必要的菜单子树。
- 检查本次新增或修改的文件是否存在。
- 检查本次涉及的中文菜单名码点是否正常。

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
