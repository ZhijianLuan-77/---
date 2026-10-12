import {validateTask,taskStats,filterTasks,isOverdue,escapeHtml,renderMarkdown,safeImportedTasks,describeWeather,normalizeCityResult,formatTemperature} from './core.js';
import {loadData,saveData} from './storage.js';

const state=loadData();
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const uid=()=>globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
let taskFilter='all',taskSort='created',taskQuery='',editingTaskId=null,selectedNoteId=state.notes[0]?.id || null,noteTab='edit',weatherController=null,toastTimer;
const VIEW_NAMES={home:'个人主页',tasks:'任务清单',notes:'知识笔记',weather:'实时天气'};
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const persist=()=>{if(!saveData(state))notify('本地存储不可用或空间已满，数据可能无法保存。');};
function notify(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3800);}
function showView(){let key=location.hash.slice(1).split('-')[0];if(!Object.hasOwn(VIEW_NAMES,key))key='home';$$('.view').forEach(e=>{e.hidden=e.id!==`view-${key}`;e.classList.toggle('active-view',!e.hidden);});$$('.nav-link').forEach(e=>{const on=e.dataset.view===key;e.classList.toggle('active',on);e.setAttribute('aria-current',on?'page':'false');});$('#breadcrumb-title').textContent=VIEW_NAMES[key];document.title=`${VIEW_NAMES[key]} · 汤甜甜课程项目`;closeMenu();if(location.hash==='#home-projects'){requestAnimationFrame(()=>$('#home-projects').scrollIntoView({behavior:'smooth'}));}else{window.scrollTo({top:0,behavior:'instant'});}if(key==='tasks')renderTasks();if(key==='notes')renderNotes();}
function closeMenu(){$('#sidebar').classList.remove('open');$('#mobile-overlay').hidden=true;$('#menu-toggle').setAttribute('aria-expanded','false');}
$('#menu-toggle').addEventListener('click',()=>{const open=$('#sidebar').classList.toggle('open');$('#mobile-overlay').hidden=!open;$('#menu-toggle').setAttribute('aria-expanded',String(open));});
$('#mobile-overlay').addEventListener('click',closeMenu);window.addEventListener('hashchange',showView);
$('#theme-toggle').addEventListener('click',()=>{state.theme=state.theme==='dark'?'light':'dark';applyTheme();persist();});
function applyTheme(){document.body.classList.toggle('dark',state.theme==='dark');$('#theme-toggle').setAttribute('aria-label',state.theme==='dark'?'切换浅色主题':'切换深色主题');}
applyTheme();

// TASKS — 统一 CRUD + 验证 + localStorage + 可校验 JSON 备份。
function renderTasks(){
  const s=taskStats(state.tasks);$('#metric-total').textContent=s.total;$('#metric-active').textContent=s.active;$('#metric-done').textContent=s.done;$('#metric-rate').textContent=`${s.rate}%`;$('#progress-bar').style.width=`${s.rate}%`;
  const visible=filterTasks(state.tasks,{filter:taskFilter,query:taskQuery,sort:taskSort});
  $('#task-summary').textContent=`共 ${s.total} 项，已完成 ${s.done} 项`;
  $('#task-footer-count').textContent=`显示 ${visible.length} / ${s.total} 项`;
  $('#clear-completed').disabled=s.done===0;
  const list=$('#task-list');
  if(!visible.length){list.innerHTML=`<div class="empty-state"><svg class="ic"><use href="#i-check"/></svg><h3>这里还没有符合条件的任务</h3><p>创建任务或调整筛选条件，开始新的计划。</p></div>`;return;}
  list.innerHTML=visible.map(t=>{
    const description=t.description?`<div class="task-description">${escapeHtml(t.description)}</div>`:'';
    const overdue=isOverdue(t.due,t.done,today());
    const priority={high:'高优先级',medium:'中优先级',low:'低优先级'}[t.priority] || '中优先级';
    const due=t.due?`<span class="due-pill ${overdue?'overdue':''}"><svg class="ic"><use href="#i-clock"/></svg>${overdue?'已逾期 · ':''}${escapeHtml(t.due)}</span>`:'';
    return `<article class="task-row ${t.done?'completed':''}" data-id="${escapeHtml(t.id)}"><button class="task-toggle ${t.done?'checked':''}" data-action="toggle" aria-label="${t.done?'标记未完成':'标记完成'}：${escapeHtml(t.title)}" aria-pressed="${t.done}">${t.done?'<svg class="ic"><use href="#i-check"/></svg>':''}</button><div class="task-text"><div class="task-name">${escapeHtml(t.title)}</div>${description}<div class="task-meta"><span class="priority-pill ${t.priority}">${priority}</span>${due}</div></div><div class="task-row-actions"><button data-action="edit" title="编辑任务" aria-label="编辑任务 ${escapeHtml(t.title)}"><svg class="ic"><use href="#i-edit"/></svg></button><button data-action="delete" title="删除任务" aria-label="删除任务 ${escapeHtml(t.title)}"><svg class="ic"><use href="#i-trash"/></svg></button></div></article>`;
  }).join('');
}
function openTaskForm(task=null){editingTaskId=task?.id||null;$('#task-form-title').textContent=task?'编辑任务':'创建新任务';$('#task-title').value=task?.title||'';$('#task-description').value=task?.description||'';$('#task-priority').value=task?.priority||'medium';$('#task-due').value=task?.due||'';$('#task-form').hidden=false;$('#task-title').focus();$('#task-form').scrollIntoView({block:'nearest',behavior:'smooth'});}
function hideTaskForm(){$('#task-form').hidden=true;editingTaskId=null;$('#task-form').reset();}
$('#toggle-task-form').addEventListener('click',()=>$('#task-form').hidden?openTaskForm():hideTaskForm());
$('#cancel-task').addEventListener('click',hideTaskForm);
$('#task-form').addEventListener('submit',event=>{event.preventDefault();try{const result=validateTask({title:$('#task-title').value,description:$('#task-description').value,priority:$('#task-priority').value,due:$('#task-due').value});if(editingTaskId){const old=state.tasks.find(t=>t.id===editingTaskId);if(!old)throw new Error('任务已不存在');Object.assign(old,result);notify('任务已更新');}else{state.tasks.unshift({...result,id:uid(),done:false,createdAt:new Date().toISOString()});notify('任务创建成功');}persist();hideTaskForm();renderTasks();}catch(e){notify(e.message);}});
$('#task-list').addEventListener('click',event=>{const button=event.target.closest('button[data-action]');if(!button)return;const row=button.closest('[data-id]');const item=state.tasks.find(t=>t.id===row?.dataset.id);if(!item)return;const action=button.dataset.action;if(action==='toggle'){item.done=!item.done;persist();renderTasks();}if(action==='edit')openTaskForm(item);if(action==='delete'&&confirm(`确定删除任务“${item.title}”吗？此操作无法撤销。`)){state.tasks=state.tasks.filter(t=>t.id!==item.id);persist();renderTasks();notify('任务已删除');}});
$$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{taskFilter=button.dataset.filter;$$('[data-filter]').forEach(el=>{const on=el===button;el.classList.toggle('selected',on);el.setAttribute('aria-pressed',String(on));});renderTasks();}));
$('#task-search').addEventListener('input',e=>{taskQuery=e.target.value;renderTasks();});
$('#task-sort').addEventListener('change',e=>{taskSort=e.target.value;renderTasks();});
$('#clear-completed').addEventListener('click',()=>{const n=state.tasks.filter(t=>t.done).length;if(n&&confirm(`确定永久删除 ${n} 项已完成任务吗？`)){state.tasks=state.tasks.filter(t=>!t.done);persist();renderTasks();notify('已完成任务已清除');}});
function downloadText(filename,content,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
$('#task-export').addEventListener('click',()=>{downloadText(`tiantian-tasks-${today()}.json`,JSON.stringify({kind:'tiantian-tasks',version:1,exportedAt:new Date().toISOString(),tasks:state.tasks},null,2),'application/json');notify('任务备份已导出');});
$('#task-import').addEventListener('click',()=>$('#task-file').click());
$('#task-file').addEventListener('change',async event=>{const file=event.target.files?.[0];event.target.value='';if(!file)return;if(file.size>3_000_000){notify('导入文件不能超过 3 MB');return;}try{const parsed=JSON.parse(await file.text());const imported=safeImportedTasks(parsed);if(!confirm(`将用 ${imported.length} 项备份任务替换当前 ${state.tasks.length} 项任务，确认吗？`))return;state.tasks=imported;persist();renderTasks();notify('任务恢复成功');}catch(e){notify(`导入失败：${e.message}`);}});

// NOTES — 保存标题及正文；原样 Markdown 文本从不作为 HTML 插入。
function getNote(){return state.notes.find(n=>n.id===selectedNoteId) || null;}
function renderNotes(){
  if(!getNote()&&state.notes.length)selectedNoteId=state.notes[0].id;
  const items=[...state.notes].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  $('#note-count').textContent=String(items.length);
  $('#note-list').innerHTML=items.map(n=>`<button class="note-list-btn ${n.id===selectedNoteId?'selected':''}" role="option" aria-selected="${n.id===selectedNoteId}" data-note-id="${escapeHtml(n.id)}"><strong>${escapeHtml(n.title || '未命名笔记')}</strong><small>${escapeHtml((n.updatedAt||'').slice(0,10))}</small></button>`).join('') || '<p class="empty-state">没有笔记，请新建。</p>';
  const note=getNote();$('#note-title').disabled=!note;$('#note-content').disabled=!note;$('#delete-note').disabled=!note;
  $('#note-title').value=note?.title||'';$('#note-content').value=note?.content||'';
  updateNotePreview();
}
function updateNotePreview(){const body=$('#note-content').value;$('#note-preview').innerHTML=renderMarkdown(body);$('#note-words').textContent=`${body.length} 字`;$('#note-content').hidden=noteTab==='preview';$('#note-preview').hidden=noteTab!=='preview';}
$('#note-list').addEventListener('click',e=>{const btn=e.target.closest('[data-note-id]');if(btn){selectedNoteId=btn.dataset.noteId;renderNotes();}});
$('#new-note').addEventListener('click',()=>{const note={id:uid(),title:'未命名笔记',content:'# 新笔记\n\n在这里记录你的想法。',updatedAt:new Date().toISOString()};state.notes.unshift(note);selectedNoteId=note.id;persist();renderNotes();$('#note-title').focus();$('#note-title').select();notify('已新建笔记');});
function saveCurrentNote(){const note=getNote();if(!note)return;note.title=$('#note-title').value.slice(0,100);note.content=$('#note-content').value;note.updatedAt=new Date().toISOString();persist();$('#save-status').textContent='本地自动保存';updateNotePreview();}
$('#note-title').addEventListener('input',saveCurrentNote);
$('#note-content').addEventListener('input',saveCurrentNote);
$('#note-title').addEventListener('change',renderNotes);
$$('[data-note-tab]').forEach(el=>el.addEventListener('click',()=>{noteTab=el.dataset.noteTab;$$('[data-note-tab]').forEach(b=>{const on=b===el;b.classList.toggle('selected',on);b.setAttribute('aria-selected',String(on));});updateNotePreview();}));
$('#delete-note').addEventListener('click',()=>{const note=getNote();if(note && confirm(`确定删除笔记“${note.title||'未命名笔记'}”吗？`)){state.notes=state.notes.filter(n=>n.id!==note.id);selectedNoteId=state.notes[0]?.id||null;persist();renderNotes();notify('笔记已删除');}});
$('#export-notes').addEventListener('click',()=>{const note=getNote();if(!note){notify('当前没有可导出的笔记');return;}const safeName=(note.title||'note').replace(/[\\/:*?"<>|]/g,'_').slice(0,50);downloadText(`${safeName}.md`,note.content,'text/markdown;charset=utf-8');notify('Markdown 文件已导出');});

// WEATHER — Open-Meteo free geocoding & forecast；不向后端上传任何笔记。
const WEATHER_API='https://api.open-meteo.com/v1/forecast';
const GEOCODE_API='https://geocoding-api.open-meteo.com/v1/search';
async function getJson(url,signal){const res=await fetch(url,{signal,headers:{Accept:'application/json'}});if(!res.ok)throw new Error(`服务暂不可用（HTTP ${res.status}）`);return res.json();}
function renderWeather(city,data){
  const current=data.current;const daily=data.daily;
  if(!current||!daily||!Array.isArray(daily.time))throw new Error('天气服务返回的数据不完整');
  const [condition,emoji]=describeWeather(current.weather_code);
  const safeCity=escapeHtml(city.name),safeRegion=escapeHtml(city.region);
  const days=daily.time.slice(0,4).map((date,index)=>{const [desc,icon]=describeWeather(daily.weather_code[index]);return `<article class="forecast-day"><small>${index===0?'今天':escapeHtml(date.slice(5))}</small><span class="emoji" aria-hidden="true">${icon}</span><strong>${formatTemperature(daily.temperature_2m_max[index])} / ${formatTemperature(daily.temperature_2m_min[index])}</strong><p>${desc} · 降水概率 ${Math.round(daily.precipitation_probability_max[index]??0)}%</p></article>`;}).join('');
  $('#weather-result').innerHTML=`<div class="weather-now"><div class="weather-now-head"><div><h2>${safeCity}</h2><p>${safeRegion} · 观测/模型时间：${escapeHtml(current.time||'未知')}（当地时间）</p></div><span class="weather-icon" aria-label="${condition}">${emoji}</span></div><div class="weather-temp">${formatTemperature(current.temperature_2m)}</div><div class="weather-condition">${condition}</div><div class="weather-details"><div class="weather-detail"><span>体感温度</span><strong>${formatTemperature(current.apparent_temperature)}</strong></div><div class="weather-detail"><span>相对湿度</span><strong>${Number.isFinite(current.relative_humidity_2m)?Math.round(current.relative_humidity_2m)+'%':'--'}</strong></div><div class="weather-detail"><span>风速</span><strong>${Number.isFinite(current.wind_speed_10m)?Math.round(current.wind_speed_10m)+' km/h':'--'}</strong></div></div></div><h3 class="forecast-heading">未来四日预报</h3><div class="forecast-grid">${days}</div>`;
}
async function queryWeather(name){
  const cityName=name.trim();if(!cityName)return;
  if(weatherController)weatherController.abort();
  const controller=new AbortController();weatherController=controller;
  const timeout=setTimeout(()=>controller.abort(),13000);
  const submit=$('#weather-submit');submit.disabled=true;submit.textContent='正在查询…';
  $('#weather-result').innerHTML='<div class="weather-placeholder"><h2>正在获取实时数据…</h2><p>正在连接 Open-Meteo 服务，请稍候。</p></div>';
  try{
    const geocodeUrl=new URL(GEOCODE_API);geocodeUrl.searchParams.set('name',cityName);geocodeUrl.searchParams.set('count','5');geocodeUrl.searchParams.set('language','zh');geocodeUrl.searchParams.set('format','json');
    const locations=await getJson(geocodeUrl,controller.signal);if(!locations.results?.length)throw new Error('未搜索到该城市，请尝试英文名称或更完整的地名');
    // 选择完全匹配的城市，无法匹配时使用服务返回的第一个结果。
    const match=locations.results.find(c=>c.name.toLowerCase()===cityName.toLowerCase()) || locations.results[0];
    const city=normalizeCityResult(match);
    const url=new URL(WEATHER_API);url.searchParams.set('latitude',city.latitude);url.searchParams.set('longitude',city.longitude);url.searchParams.set('current','temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m');url.searchParams.set('daily','weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max');url.searchParams.set('timezone','auto');url.searchParams.set('forecast_days','4');
    renderWeather(city,await getJson(url,controller.signal));
  }catch(error){if(controller!==weatherController)return;const msg=error.name==='AbortError'?'请求超时，请检查网络后重试':error.message;$('#weather-result').innerHTML=`<div class="weather-placeholder"><h2>本次查询未成功</h2><p>${escapeHtml(msg)}。请检查网络或更换城市名称后重试。</p></div>`;}
  finally{clearTimeout(timeout);if(controller===weatherController){submit.disabled=false;submit.innerHTML='查询天气 <svg class="ic"><use href="#i-arrow"/></svg>';weatherController=null;}}
}
$('#weather-form').addEventListener('submit',e=>{e.preventDefault();queryWeather($('#weather-city').value);});
$$('[data-city]').forEach(btn=>btn.addEventListener('click',()=>{$('#weather-city').value=btn.dataset.city;queryWeather(btn.dataset.city);}));

renderTasks();renderNotes();showView();
