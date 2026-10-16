import {DEFAULT_SITE,SITE_KEY,normalizeSiteContent,readSiteContent,saveSiteContent,resetSiteContent} from '../src/site-content.js';
const $=sel=>document.querySelector(sel);
const editor=$('#editor'),status=$('#notification'),pageTitle=$('#page-title'),pageDesc=$('#page-description');
let draft=readSiteContent(),activeTab='dashboard',statusTimer;
const pages={
 dashboard:['内容管理概览','集中查看个人资料、技能、作品及学习博客，便于统一维护课程作品集。'],
 profile:['个人资料管理','编辑前台首页展示的姓名、介绍文字和主视觉标题。'],
 skills:['技能展示管理','每行输入一个技能标签，保存后即可在作品集主页看到更新。'],
 projects:['项目展示管理','修改五个已实现功能项目的展示标题和介绍，不影响原有模块的实际功能。'],
 posts:['学习博客管理','添加或修改学习记录，保存后会显示在个人主页的学习博客区域。'],
 settings:['数据与发布说明','导入导出作品集展示数据，或重置为仓库默认内容。']
};
function el(tag,cls,text,parent){
 const x=document.createElement(tag);if(cls)x.className=cls;
 if(text!==undefined)x.textContent=text;if(parent)parent.append(x);return x;
}
function field(parent,label,value,max,multi=false){
 const l=el('label','field',undefined,parent);
 el('span','',label,l);
 const x=el(multi?'textarea':'input','',undefined,l);
 x.value=value||'';x.maxLength=max||500;
 if(multi)x.rows=4;else x.type='text';
 return x;
}
function section(title,description){
 const s=el('section','section',undefined,editor);
 el('h2','',title,s);el('p','helper',description,s);return s;
}
function actions(parent,save){const wrap=el('div','actions',undefined,parent);
 const b=el('button','primary','保存修改',wrap);b.type='button';b.addEventListener('click',save);
 const q=el('button','secondary','查看主页 ↗',wrap);q.type='button';q.addEventListener('click',()=>{window.location.href='../';});
 return wrap;
}
function report(msg,error=false){clearTimeout(statusTimer);status.textContent=msg;status.classList.toggle('error',error);statusTimer=setTimeout(()=>{status.textContent='';},7000);}
function commit(next){
 try{draft=saveSiteContent(next);report('修改已保存至当前浏览器。返回个人主页或刷新页面即可查看。');}
 catch(e){report('保存失败：'+e.message,true);}
}
function panelDashboard(){
 const cards=el('div','cards',undefined,editor);
 [['课程作品',draft.projects.length],['技能标签',draft.skills.length],['学习博客',draft.posts.length]].forEach(([title,num])=>{
   const c=el('article','summary',undefined,cards);el('strong','',String(num).padStart(2,'0'),c);el('span','',title,c);
 });
 const s=section('项目资料概览','所有内容在一个管理入口维护，无需直接修改 HTML 文案。');
 const tags=el('div','tagline',undefined,s);
 [draft.name,'个人作品集',...draft.skills.slice(0,5)].forEach(t=>el('span','',t,tags));
 const hint=el('div','hintbox',undefined,s);
 hint.textContent='演示模式：这里保存的资料只作用于当前浏览器。发布到 Vercel 或 Cloudflare Pages 的其他访客不会自动同步你的本地改动；要对外统一发布内容，须更新仓库默认数据或接入真正的服务端。';
 const a=el('div','actions',undefined,s);
 const go=el('button','primary','开始编辑个人资料 →',a);go.addEventListener('click',()=>goTab('profile'));
 const visit=el('button','secondary','查看个人主页 ↗',a);visit.addEventListener('click',()=>window.location.href='../');
}
function panelProfile(){
 const s=section('基本信息','这些字段直接对应个人主页的欢迎词、主标题与个人介绍。');
 const grid=el('div','form-grid',undefined,s);
 const name=field(grid,'展示姓名',draft.name,35);
 const greeting=field(grid,'首页欢迎语',draft.greeting,110);
 const title=field(grid,'主标题第一行',draft.headline,65);
 const highlight=field(grid,'主标题强调文字',draft.highlight,65);
 const full=el('div','field full',undefined,grid);
 el('span','','个人介绍',full);
 const desc=el('textarea','',undefined,full);desc.value=draft.description;desc.maxLength=800;desc.rows=5;
 actions(s,()=>commit({...draft,name:name.value,greeting:greeting.value,headline:title.value,highlight:highlight.value,description:desc.value}));
}
function panelSkills(){
 const s=section('技能标签编辑','每行一个技能名称。最多 16 项，名称最长 35 字。');
 const area=field(s,'技能清单（每行一项）',draft.skills.join('\n'),1400,true);area.rows=11;
 actions(s,()=>commit({...draft,skills:area.value.split(/[\r\n]+/).map(v=>v.trim()).filter(Boolean)}));
}
function panelProjects(){
 const s=section('已实现项目展示','仅编辑项目卡片的标题和简介，五个原有功能及访问链接保持不变。');
 const inputs=[];
 draft.projects.forEach((item,i)=>{
  const box=el('div','rowbox',undefined,s);
  el('h3','','0'+(i+1)+' · 项目展示',box);
  const title=field(box,'项目名称',item.title,64),desc=field(box,'项目介绍',item.description,450,true);
  desc.rows=2;inputs.push([title,desc]);
 });
 actions(s,()=>commit({...draft,projects:inputs.map(([a,b])=>({title:a.value,description:b.value}))}));
}
function panelPosts(){
 const s=section('学习博客','文章用于展示课程学习过程中的思考和技术收获。支持新增、修改、删除记录。');
 const holder=el('div','rows',undefined,s);
 let local=draft.posts.map(p=>({...p}));
 function renderRows(){
  holder.replaceChildren();
  local.forEach((post,i)=>{
   const box=el('div','rowbox',undefined,holder);
   el('h3','','文章 '+(i+1),box);
   const title=field(box,'文章标题',post.title,90);
   const date=field(box,'发布日期 YYYY-MM-DD',post.date,10);
   const summary=field(box,'文章摘要',post.summary,650,true);summary.rows=3;
   [title,date,summary].forEach(n=>n.addEventListener('input',()=>{
    local[i]={title:title.value,date:date.value,summary:summary.value};
   }));
   const buttons=el('div','rowtools',undefined,box);
   el('span','', '内容保存后同步到主页',buttons);
   const rm=el('button','smallbtn','删除本篇',buttons);rm.type='button';
   rm.addEventListener('click',()=>{
    if(!confirm('确认删除这篇学习博客吗？保存修改后生效。'))return;
    local.splice(i,1);renderRows();
   });
  });
 }
 renderRows();
 const buttons=el('div','actions',undefined,s);
 const add=el('button','secondary','＋ 添加文章',buttons);add.type='button';
 add.addEventListener('click',()=>{
  if(local.length>=12){report('最多添加12篇文章',true);return;}
  local.push({title:'新的学习记录',date:new Date().toISOString().slice(0,10),summary:'请在这里填写文章摘要。'});renderRows();
 });
 const save=el('button','primary','保存全部文章',buttons);save.type='button';
 save.addEventListener('click',()=>{if(local.some(v=>v.date&&!/^\d{4}-\d{2}-\d{2}$/.test(v.date))){report('请输入正确的日期格式 YYYY-MM-DD',true);return;}commit({...draft,posts:local});});
}
function downloadText(content,name){
 const blob=new Blob([content],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(blob);const a=document.createElement('a');
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function panelSettings(){
 const s=section('数据管理','为课程演示保留可恢复的配置备份，不涉及任务和笔记数据。');
 const buttons=el('div','actions',undefined,s);
 const exportBtn=el('button','primary','导出展示内容 JSON',buttons);
 exportBtn.addEventListener('click',()=>downloadText(JSON.stringify(draft,null,2),'tiantian-site-content.json'));
 const importBtn=el('button','secondary','导入展示内容 JSON',buttons);
 const file=el('input','fileinput',undefined,s);file.type='file';file.accept='.json,application/json';
 importBtn.addEventListener('click',()=>file.click());
 file.addEventListener('change',async()=>{
  const f=file.files?.[0];if(!f)return;
  if(f.size>1024*1024){report('导入文件不得超过1MB',true);file.value='';return;}
  try{
   const value=normalizeSiteContent(JSON.parse(await f.text()));
   if(!confirm('确认用导入的数据覆盖当前作品集展示内容吗？'))return;
   commit(value);render();
  }catch(e){report('导入失败：'+e.message,true);}finally{file.value='';}
 });
 const reset=el('button','danger','恢复仓库默认展示内容',buttons);
 reset.addEventListener('click',()=>{
  if(!confirm('确认清除当前浏览器的个人主页、技能、作品和博客编辑记录吗？此操作不会删除任务或笔记。'))return;
  draft=resetSiteContent();report('已恢复默认内容。');render();
 });
 const tips=el('div','hintbox',undefined,s);
 tips.textContent='注意：本页仅用于课程静态站点的本地内容管理演示。数据储存在当前浏览器 localStorage；没有服务端登录，也无法保证不同访客看到相同的本地修改。不应上传敏感资料。';
 const extra=section('部署与验收建议','提交截图时建议同时展示前台页面、此管理页面和三份标准开发文档。');
 const ul=el('ol','checklist',undefined,extra);
 ['确认在线网站首页能够公开打开','验证个人资料修改、保存、刷新及恢复默认值','确保 PRD.md、TECH_DESIGN.md 和 AGENTS.md 在仓库根目录','在 Vercel / Cloudflare Pages 控制台确认 Ready/Successful 状态','填报实际分配的网址，而不是未验证的目标地址'].forEach(t=>el('li','',t,ul));
}
function render(){
 [pageTitle.textContent,pageDesc.textContent]=pages[activeTab];
 editor.replaceChildren();
 if(activeTab==='dashboard')panelDashboard();
 else if(activeTab==='profile')panelProfile();
 else if(activeTab==='skills')panelSkills();
 else if(activeTab==='projects')panelProjects();
 else if(activeTab==='posts')panelPosts();
 else panelSettings();
}
function goTab(tab){
 if(!pages[tab])tab='dashboard';activeTab=tab;
 document.querySelectorAll('[data-tab]').forEach(b=>{
  const selected=b.dataset.tab===tab;b.classList.toggle('current',selected);
  b.setAttribute('aria-current',selected?'page':'false');
 });
 window.location.hash=tab;render();
}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>goTab(b.dataset.tab)));
window.addEventListener('hashchange',()=>goTab(location.hash.slice(1)));
goTab(location.hash.slice(1));
