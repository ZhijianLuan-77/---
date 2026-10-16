# Cloudflare Pages 部署与课程截图指南

> 项目：汤甜甜的课程作品集  
> 仓库：https://github.com/ZhijianLuan-77/TTT-homework  
> 本文件是部署操作说明，并非已完成部署的证明。

## 一、部署前确认

本项目采用 **HTML + CSS + 原生 JavaScript ES Modules**，首页入口位于仓库根目录的 `index.html`，不需要 Vite、React、编译步骤、服务器和数据库。**不要选择 React 预设，也不要填写 dist 作为输出目录。**

## 二、Cloudflare Pages 从 GitHub 自动部署

1. 登录 https://dash.cloudflare.com/ ；进入 **Workers & Pages**（新版界面可能把 Workers 与 Pages 放在一个菜单中）。
2. 点击 **Create application / 创建应用**，切换到 **Pages**，选 **Import an existing Git repository / 导入现有 Git 仓库**。
3. 授权 Cloudflare 读取 GitHub 仓库；选择 `ZhijianLuan-77/TTT-homework`（若看不到仓库，回到 GitHub 安装设置，为 Cloudflare 授权此仓库）。
4. 项目名称建议 `tiantian-homework-2026`，可修改；最终域名由 Cloudflare 实际分配。
5. 逐项核对：
   - Production branch / 生产分支：`main`
   - Framework preset / 框架：`None` 或 `无`
   - Build command / 构建命令：`exit 0`
   - Build output directory / 构建输出目录：`.`（英文句点，即仓库根目录）
   - Root directory / 项目根目录：`/`（保持默认）
   - Environment variables / 环境变量：无需配置
6. 点击 **Save and Deploy**。等待界面显示 **Success / Ready** 等成功状态。
7. **复制 Cloudflare 实际提供的** `https://<实际项目名>.pages.dev/` 网址，不要凭项目名猜测链接。
8. 使用未登录的浏览器或无痕窗口打开真实网址，分别检查网站首页、`/admin/`、文档入口，并保留地址栏及运行界面的截图。
9. 如果部署日志提示构建输出路径不存在，核对根目录是否为仓库根目录、输出目录是否填写为一个英文句点 `.`。
10. 后续向 `main` 推送新代码时，使用 Git 集成创建的 Pages 项目将自动重新部署。

## 三、三个课程提交项

**03 三份文档内容截图：** 展示仓库根目录的 `PRD.md`、`TECH_DESIGN.md`、`AGENTS.md` 标题及正文段落。可使用 GitHub 的 Markdown 预览和电脑真实截图。

**04 成功部署后网页截图：** 需要真实打开 Cloudflare 提供的网页。建议至少截取前台首页与 `/admin/`，让老师看到个人网站和可以调整介绍、技能、项目/博客的管理页面。管理员编辑内容暂存于当前浏览器，不是云端认证后台。

**05 域名地址：** 填写 Cloudflare 控制台显示、已打开验证成功的完整 `https://....pages.dev/`，不要填写仓库网址和本地 `localhost`。

## 四、验收说明

页面菜单包含作品集、任务管理、Markdown 笔记、天气查询、倒计时和随机点名；新增内容管理页可修改作品集介绍、技能、项目和文章，并本地保存。天气查询依赖访问 Open-Meteo 外部接口。

**数据同步边界：** 该课程项目为静态网站，`/admin/` 展示内容的修改只保存在当前浏览器的 localStorage，无法自动发布给其他访问者。若课程需要真正的公共内容管理，则需另行接入有认证保护的服务端存储和 API。

## 五、参考

- Cloudflare 官方静态 HTML 部署：https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- Cloudflare 官方 Git 集成：https://developers.cloudflare.com/pages/get-started/git-integration/
- 本仓库 PRD：[PRD.md](PRD.md)
- 技术设计：[TECH_DESIGN.md](TECH_DESIGN.md)
- AI 开发规范：[AGENTS.md](AGENTS.md)
