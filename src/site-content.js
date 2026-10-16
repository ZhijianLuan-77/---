/** 课程作品集内容模型：支持本机编辑，不提供远程数据库或权限认证。 */
export const SITE_KEY = 'ttt.site-content.v1';
export const DEFAULT_SITE = Object.freeze({
  version: 1,
  name: '汤甜甜',
  greeting: '你好，我是汤甜甜，欢迎来到我的课程作品集',
  headline: '从一个想法，',
  highlight: '到能用的作品。',
  description: '这是我的生成式大模型辅助编程与软件工程实训项目。我将任务管理、Markdown 笔记、天气查询、倒计时和随机点名整合为网站，通过需求设计、代码开发与测试文档展示完整的软件工程交付。',
  skills: ['HTML / CSS', 'JavaScript', 'Markdown', '软件需求分析', 'AI 辅助编程', '软件测试'],
  projects: [
    {title:'进阶待办事项应用',description:'支持添加、编辑、完成与删除任务，具备优先级、截止日期、搜索筛选、进度统计和本地备份能力。'},
    {title:'Markdown学习笔记',description:'支持新建、编辑、实时预览和自动保存笔记，并可导出 Markdown 文件；预览内容进行安全转义。'},
    {title:'城市天气查询',description:'通过公开天气API查询城市气温、湿度和未来预报，并对超时、网络错误及未知城市给出明确提示。'},
    {title:'专注倒计时',description:'自定义时长、快捷预设、暂停继续、到时提示；切换标签后仍按真实时间计时。'},
    {title:'随机点名',description:'预置图片识别的30人名单，每轮不重复抽取，支持校正名单与查看记录。'}
  ],
  posts: [
    {title:'从需求文档到可运行的网站',date:'2026-10-12',summary:'围绕个人作品集和学习效率工具，记录需求澄清、工程设计和迭代验收的学习体会。'},
    {title:'将日常学习任务变成可测试的功能',date:'2026-10-14',summary:'把任务操作、边界校验与数据保存联系起来，理解功能实现与测试验证之间的关系。'}
  ]
});
const trim = (v,max=240)=>typeof v==='string'?v.trim().slice(0,max):'';
export function normalizeSiteContent(value){
  if(!value || typeof value!=='object'||Array.isArray(value))throw Error('站点资料格式不正确');
  const arr=(value.skills||DEFAULT_SITE.skills);
  const projects=(value.projects||DEFAULT_SITE.projects);
  const posts=(value.posts||DEFAULT_SITE.posts);
  if(!Array.isArray(arr)||!Array.isArray(projects)||!Array.isArray(posts))throw Error('技能、作品和博客必须是数组');
  const cleanProject=(v)=>({title:trim(v?.title,64),description:trim(v?.description,450)});
  const cleanPost=(v)=>({title:trim(v?.title,90),date:/^\d{4}-\d{2}-\d{2}$/.test(v?.date||'')?v.date:'',summary:trim(v?.summary,650)});
  const result={
    version:1,name:trim(value.name||DEFAULT_SITE.name,35),
    greeting:trim(value.greeting||DEFAULT_SITE.greeting,110),
    headline:trim(value.headline||DEFAULT_SITE.headline,65),
    highlight:trim(value.highlight||DEFAULT_SITE.highlight,65),
    description:trim(value.description||DEFAULT_SITE.description,800),
    skills:arr.map(v=>trim(v,35)).filter(Boolean).slice(0,16),
    projects:DEFAULT_SITE.projects.map((p,i)=>cleanProject(projects[i]||p)),
    posts:posts.slice(0,12).map(cleanPost).filter(p=>p.title)
  };
  if(!result.name||!result.description)throw Error('姓名与简介不能为空');
  return result;
}
export function readSiteContent(){
  try{const raw=localStorage.getItem(SITE_KEY);return raw?normalizeSiteContent(JSON.parse(raw)):normalizeSiteContent(DEFAULT_SITE);}
  catch(_){return normalizeSiteContent(DEFAULT_SITE);}
}
export function saveSiteContent(value){
  const normalized=normalizeSiteContent(value);
  localStorage.setItem(SITE_KEY,JSON.stringify(normalized));
  return normalized;
}
export function resetSiteContent(){localStorage.removeItem(SITE_KEY);return normalizeSiteContent(DEFAULT_SITE);}
function child(parent,tag,className,text){
  const node=document.createElement(tag);if(className)node.className=className;
  if(text!==undefined)node.textContent=text;parent.append(node);return node;
}
export function renderSiteContent(content=readSiteContent()){
  const hero=document.querySelector('.hero-pretitle');
  if(!hero)return;
  hero.textContent=content.greeting;
  const description=document.querySelector('.hero-description');if(description)description.textContent=content.description;
  const title=document.querySelector('#home-heading');
  if(title){title.replaceChildren(document.createTextNode(content.headline),document.createElement('br'));child(title,'em','',content.highlight);}
  document.querySelectorAll('.sidebar-profile strong').forEach(el=>el.textContent=content.name);
  document.querySelectorAll('.top-avatar,.mini-avatar').forEach(el=>el.textContent=content.name.slice(0,1));
  const cards=Array.from(document.querySelectorAll('.project-card'));
  cards.forEach((card,i)=>{
    const item=content.projects[i];if(!item)return;
    const h=card.querySelector('.project-copy h3'),p=card.querySelector('.project-copy p');
    if(h)h.textContent=item.title;if(p)p.textContent=item.description;
  });
  const anchor=document.querySelector('.about-heading');
  if(!anchor)return;
  document.querySelector('#site-profile-extras')?.remove();
  const wrap=child(anchor.parentElement,'div','site-profile-extras');
  wrap.id='site-profile-extras';
  anchor.before(wrap);
  const heading=child(wrap,'div','section-heading');
  const hLeft=child(heading,'div','');
  child(hLeft,'span','section-kicker','PROFILE & SKILLS');
  child(hLeft,'h2','','关于我与学习技能');
  const profile=child(wrap,'div','site-edit-card');
  child(profile,'p','site-edit-overline',content.name+' · 课程实训作品集');
  child(profile,'p','site-edit-intro','从实际问题出发，用设计、编程与测试将学习想法落地。');
  const skills=child(profile,'div','site-skills');
  content.skills.forEach(s=>child(skills,'span','site-skill',s));
  const head2=child(wrap,'div','section-heading site-blog-heading');
  const bLeft=child(head2,'div','');
  child(bLeft,'span','section-kicker','LEARNING JOURNAL');
  child(bLeft,'h2','','学习博客');
  const blogGrid=child(wrap,'div','site-blog-grid');
  if(!content.posts.length)child(blogGrid,'p','site-blog-empty','暂无公开文章');
  content.posts.forEach(p=>{
    const card=child(blogGrid,'article','site-blog-card');
    child(card,'span','site-blog-date',p.date||'学习记录');
    child(card,'h3','',p.title);
    child(card,'p','',p.summary);
  });
  const admin=child(wrap,'p','site-local-tip');
  admin.append('展示内容可在本机管理页面修改：');
  const link=child(admin,'a','','打开内容管理');
  link.href='admin/';
}
function installStyles(){
 if(document.getElementById('site-editor-style'))return;
 const s=document.createElement('style');s.id='site-editor-style';
 s.textContent=`.site-profile-extras{margin:35px 0 42px}.site-edit-card{background:var(--surface,#fff);border:1px solid var(--line,#e8ebf0);border-radius:18px;padding:24px 30px}.site-edit-overline{font-size:12px;letter-spacing:.08em;color:var(--primary,#4056c9);font-weight:750}.site-edit-intro{font-size:16px;color:var(--text,#182640);margin:6px 0 18px}.site-skills{display:flex;flex-wrap:wrap;gap:10px}.site-skill{background:#eff2fe;border:1px solid #dce3ff;color:#3448ab;padding:7px 12px;border-radius:20px;font-size:12px}.site-blog-heading{margin-top:30px}.site-blog-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.site-blog-card{padding:22px 25px;border-radius:17px;background:var(--surface,#fff);border:1px solid var(--line,#e8ebf0)}.site-blog-date{font-size:12px;color:var(--muted,#8290a5)}.site-blog-card h3{font-size:17px;margin:9px 0}.site-blog-card p{line-height:1.75;font-size:13px;color:#65758a}.site-local-tip{font-size:12px;color:#708199;margin-top:14px}.site-local-tip a{color:#4056c9;text-decoration:underline}@media(max-width:680px){.site-blog-grid{grid-template-columns:1fr}.site-edit-card{padding:20px}}`;
 document.head.append(s);
}
if(typeof document!=='undefined'){installStyles();renderSiteContent();window.addEventListener('storage',e=>{if(e.key===SITE_KEY)renderSiteContent();});}
