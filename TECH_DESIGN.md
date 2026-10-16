# TECH_DESIGN｜汤甜甜个人作品集网站技术设计

> 技术设计文档 · V1.0 · 2026-10-16  
> 对应需求：PRD.md · 仓库：ZhijianLuan-77/TTT-homework

## 1. 技术栈选择

| 层次 | 实际方案 | 设计理由 |
| --- | --- | --- |
| 页面与样式 | HTML5、CSS3 | 复用现有页面，响应式布局，静态部署简单 |
| 前端交互 | 原生 JavaScript ES Modules | 保持原项目实现，无构建依赖 |
| 数据存储 | localStorage | 任务、笔记、点名记录、内容编辑本地持久化 |
| 天气接口 | Open-Meteo Geocoding / Forecast API | 获取城市及气象数据 |
| 本地预览 | Python 标准库 HTTP Server | 执行 `python start_server.py` |
| 测试 | Node.js 内置测试运行器 | 执行 `npm test` |
| 部署 | Vercel / Cloudflare Pages 可选；现有 GitHub Pages 方案 | 静态 HTML/CSS/JS，无需打包命令 |

此仓库**不是 React、TypeScript 或 Vite 项目**。因此不为应付模板而引入与实际代码不一致的技术选型。

## 2. 主要文件和目录

```text
TTT-homework/
├── index.html                   # 作品集首页及功能页面
├── PRD.md                       # 产品需求
├── TECH_DESIGN.md               # 技术设计
├── AGENTS.md                    # AI协作开发规则
├── admin/index.html             # 本地内容管理界面
├── src/
│   ├── app.js                   # 导航、任务、笔记、天气
│   ├── core.js                  # 数据校验、排序、Markdown安全处理
│   ├── storage.js               # 任务与笔记持久化
│   ├── tools.js                 # 计时与随机点名工具逻辑
│   ├── classroom.js             # 课堂工具交互
│   ├── site-content.js          # 主页与管理页共用内容模型
│   ├── styles.css               # 作品集样式
│   └── classroom.css            # 课堂工具样式
├── tests/                       # 自动化测试
├── docs/                        # 原有工程说明书
└── deliverables/                # 报告与课程材料
```

## 3. 功能架构

**展示层：** 首页包含个人 Hero、作品卡片、技能、博客、工程文档。既有任务/笔记/天气/课堂工具由不同视图负责。

**业务层：** `core.js` 实现任务校验、筛选和 Markdown 安全渲染；`tools.js` 实现时间与随机抽取；`site-content.js` 负责统一内容默认值、输入规范化、本地读写及首页渲染。

**内容管理层：** `/admin/` 为独立管理页面，表单编辑姓名、主页介绍、标题、技能、项目名称与介绍、文章标题/日期/简介。提交时经字段检查后更新本地内容；返回主页或刷新后读取相同数据。

## 4. 数据模型

```text
SiteContent {
  version: 1,
  name: string,
  greeting: string,
  headline: string,
  highlight: string,
  description: string,
  skills: string[],
  projects: {title:string, description:string}[],
  posts: {title:string, date:string, summary:string}[]
}
```

内容管理采用 `ttt.site-content.v1` 键保存，与任务/笔记键 `tiantian.v1` 隔离，避免破坏已存的学习记录。页面展示文本通过 `textContent` 插入 DOM，不解析来自输入框的任意 HTML。导入 JSON 采用结构及长度检查。

## 5. 数据流与部署限制

```text
管理页修改 → 校验 → localStorage → 首页渲染
访客进入 → 加载默认内容/本地修改 → 展示项目与博客
天气查询 → 公共API → 解析结果 → 界面
```

**静态部署的边界：** localStorage 与具体浏览器绑定，管理页不是服务器后台，没有用户身份认证、统一数据库与跨浏览器发布机制；即使 URL 名称是 `/admin/` 也不能据此声称具备真实后台权限保护。

要实现“管理员修改后所有访客即时看到”，后续必须使用安全认证、后端存储和读写 API（例如 Vercel Functions + 数据库，或 Cloudflare Workers + D1），并在服务端保护写入权限。

## 6. 启动、测试和部署

- 本地运行：`python start_server.py --no-browser`，默认打开 `http://127.0.0.1:8000/`。
- 单元测试：`npm test`；HTTP检查：`python tests/http_smoke.py`。
- 静态托管：以仓库根目录为发布目录；无需 build 命令；首页入口 `index.html`。
- 当前 Cloudflare Pages 控制台已显示成功部署，分配网址为 `https://ttt-homework.pages.dev/`，仍需用真实浏览器确认外网访问。GitHub Pages 网址为原有备用目标地址。
- 使用 Vercel 或 Cloudflare Pages 时，关联该仓库，框架设为 Other/None，输出目录使用仓库根目录，并以平台实际颁发的 URL 为最终地址。

## 7. 验收重点

验证三个文档能在仓库根目录浏览；`/admin/` 保存后本浏览器首页更新；刷新保持；重置回到默认值；原任务、笔记、天气、计时、点名功能正常；部署网址应有真实浏览器访问证据。
