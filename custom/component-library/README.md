# B端后台静态原型组件库

本目录是独立组件库，用于后续新建或修改静态原型页面时复用常见 UI 片段。组件库不挂载到 Axure 左上角菜单，不修改现有页面。

## 使用原则

- 新建页面前先查 `component-map.json`，优先复用已有组件片段。
- 复制 `snippets/` 下的 HTML 片段到目标页面，再按业务字段改文案和列名。
- 页面需要统一样式时引用：

```html
<link rel="stylesheet" href="custom/component-library/css/tokens.css">
<link rel="stylesheet" href="custom/component-library/css/components.css">
```

- 只有用到 Tabs、弹窗、筛选重置、批量选择等轻交互时，才引用：

```html
<script src="custom/component-library/js/components.js"></script>
```

- 组件类名统一使用 `cl-` 前缀，交互属性统一使用 `data-cl-*`，避免和已有页面的 `.btn`、`.toolbar`、`.modal` 等类名冲突。
- 旧页面默认不迁移。只有明确要求修改某个旧页面时，才把局部结构改成组件库写法。

## 固定生成流程

每次新建页面或修改页面前，先根据本次需求判断需要哪些后台组件，再优先从组件库调用：

1. 先查看 `component-map.json`，按需求匹配筛选区、表格、分页、Tabs、弹窗、状态标签等组件。
2. 再读取对应 `snippets/*.html`，复制片段到目标页面并替换业务字段、列名、按钮文案和默认数据。
3. 新页面默认引用 `css/tokens.css` 和 `css/components.css`。
4. 只有使用 Tabs、弹窗、筛选重置、批量选择等交互组件时，才引用 `js/components.js`。
5. 如果组件库没有匹配组件，先在目标页面内按现有风格实现；确认可复用后，再把通用部分补回组件库。
6. 不因为调用组件库而改动无关旧页面，也不自动迁移旧页面。

## 当前组件

- `filter-bar.html`：筛选区，适合列表、报表、配置页。
- `toolbar.html`：操作工具栏，适合新增、导出、批量操作。
- `data-table.html`：标准数据表格，包含勾选列、状态标签和行内操作。
- `pagination.html`：分页条。
- `tabs.html`：页签切换，配合 `components.js` 使用。
- `status-tags.html`：状态标签。
- `form-grid.html`：表单网格。
- `modal-form.html`：表单弹窗，配合 `components.js` 使用。
- `stat-cards.html`：统计卡片。
- `empty-state.html`：空态。
- `batch-bar.html`：批量操作栏，配合表格勾选使用。

## 来源盘点

本次只读盘点了根目录 127 个 HTML 页面。高频组件包括：

- 表格：88 个页面出现。
- 筛选/查询：125 个页面出现。
- 工具栏/操作区：74 个页面出现。
- 弹窗/对话框：54 个页面出现。
- Tabs：92 个页面出现。
- 分页：63 个页面出现。
- 状态标签：67 个页面出现。
- 统计卡片：34 个页面出现。
- 空态：37 个页面出现。
- 表单控件：119 个页面出现。

代表来源页面包括：`商户账单.html`、`会员提现设置.html`、`优惠活动列表.html`、`任务统计报表.html`、`代理数据查询.html`。

## 预览

打开 `custom/component-library/index.html` 可以查看组件静态预览。该预览页不进入 Axure 菜单。
