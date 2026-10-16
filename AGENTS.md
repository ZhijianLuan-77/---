# AGENTS｜TTT-homework AI 协作开发说明

## 项目概述

汤甜甜的“生成式大模型辅助编程与软件工程实践”课程作品：个人展示网站、任务管理、Markdown 笔记、天气查询、倒计时、随机点名、学习技能与博客、可编辑的本地内容管理页。课程交付还包括 PRD、技术设计、测试和部署文档。

## 先阅读

开始修改之前先阅读 `PRD.md` 与 `TECH_DESIGN.md`，并检查真实仓库结构。遵循“先保持已有功能稳定，再新增必要功能”的原则，不得凭模板假定项目使用 React/Vite。

## 技术与文件约定

- 技术栈为 HTML5、CSS3、原生 JavaScript ES Modules；Python 只用于本地预览/HTTP 测试。
- `index.html` 为前台，`admin/index.html` 为内容编辑页；静态资源保持相对路径，兼容 GitHub Pages 子路径及 Vercel/Cloudflare 根路径。
- 保持 `src/core.js` 的纯函数风格与 Node 内置测试运行器兼容。
- 按职责拆分：UI 交互在 `src/app.js` 等页面控制模块；内容模型与持久化放在 `src/site-content.js`；不要修改无关模块。
- 不能把浏览器 localStorage 称为数据库或安全认证后台，不得在静态前端放账号密码、私密 API 密钥或 GitHub Token。

## 编码与安全

- 变量/函数表达明确用途；保留已有中文 UI 和注释风格。
- 输入需要长度与结构校验；向 DOM 写入用户内容使用 `textContent`，不得未经转义插入 `innerHTML`。
- 删除和重置操作必须二次确认；保存与异常需给用户可见反馈。
- 不删除已有功能、原有五类文档和课程交付材料；不挪动已有网页关键锚点。
- 尊重本地隐私，不向第三方发送任务、笔记或点名名单。

## 运行与测试

```bash
python start_server.py --no-browser
npm test
python tests/http_smoke.py
```

新增功能后至少检查首页、`/admin/`、保存与刷新、手机布局、控制台异常及原有核心流程。不能把未经执行的测试写成“已通过”。

## 版本管理与交付

- 提交代码时说明修改内容，保持文件命名与 Markdown 标题一致。
- 新增或修改与需求直接有关的内容时，同步更新 `PRD.md`、`TECH_DESIGN.md`。
- 部署地址只填写实际打开确认过的公网网址；未完成 Cloudflare/Vercel 授权时，不宣称这两个平台已成功发布。
- 面向教师提交真实文档内容截图、真实网页运行截图和准确网址；本地预览截图不得冒充在线部署截图。
