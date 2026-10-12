/** 不依赖 DOM 的纯函数：供 UI 与 Node 内置测试复用。 */
export const PRIORITY_WEIGHT = Object.freeze({ high: 3, medium: 2, low: 1 });
export const MAX_TASK_TITLE = 120;
export const SCHEMA_VERSION = 1;

export function validateTask(input) {
  const title = typeof input?.title === 'string' ? input.title.trim() : '';
  if (!title || title.length > MAX_TASK_TITLE) throw new Error('任务名称必须为 1—120 个字符');
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  if (description.length > 500) throw new Error('任务说明不得超过 500 字符');
  const priority = PRIORITY_WEIGHT[input.priority] ? input.priority : 'medium';
  const due = input.due || '';
  if (due && (!/^\d{4}-\d{2}-\d{2}$/.test(due) || Number.isNaN(Date.parse(`${due}T00:00:00Z`)) || new Date(`${due}T00:00:00Z`).toISOString().slice(0,10) !== due)) throw new Error('截止日期格式无效');
  return { title, description, priority, due };
}
export function taskStats(tasks) {
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  return { total, done, active: total - done, rate: total ? Math.round(done / total * 100) : 0 };
}
export function filterTasks(tasks, { filter = 'all', query = '', sort = 'created' } = {}) {
  const q = query.trim().toLocaleLowerCase();
  const results = tasks.filter(t => (filter === 'active' ? !t.done : filter === 'done' ? t.done : true) && (`${t.title} ${t.description || ''}`).toLocaleLowerCase().includes(q));
  return results.sort((a,b) => {
    if (sort === 'priority') return (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0) || newest(a,b);
    if (sort === 'due') return (a.due || '9999-12-31').localeCompare(b.due || '9999-12-31') || newest(a,b);
    return newest(a,b);
  });
}
function newest(a,b){return (b.createdAt || '').localeCompare(a.createdAt || '') || b.id.localeCompare(a.id);}
export function isOverdue(due, done, today){return !!due && !done && due < today;}
export function escapeHtml(input = '') {return String(input).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

/** 常用 Markdown 子集；先转义 HTML，链接只允许 http/https，避免注入脚本。 */
function inlineMarkdown(text) {
  let escaped = escapeHtml(text);
  // 在转义之后识别可控 Markdown，并严格限制链接协议。
  escaped = escaped.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, (_match, label, url) => `<a href="${url.replace(/&amp;/g,'&amp;')}" target="_blank" rel="noopener noreferrer">${label}</a>`);
  escaped = escaped.replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>').replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g,'<em>$1</em>');
  escaped = escaped.replace(/`([^`\n]+)`/g,'<code>$1</code>');
  return escaped;
}
export function renderMarkdown(source = '') {
  const lines = String(source).replace(/\r\n?/g,'\n').split('\n');
  let html = '', inCode = false, inList = false;
  const closeList = () => {if(inList){html+='</ul>';inList=false;}};
  for(const line of lines){
    if(/^\s*```/.test(line)) {closeList(); html += inCode?'</code></pre>':'<pre><code>';inCode=!inCode;continue;}
    if(inCode){html += escapeHtml(line)+'\n';continue;}
    if(/^\s*[-*] /.test(line)){if(!inList){html+='<ul>';inList=true;} html+=`<li>${inlineMarkdown(line.replace(/^\s*[-*] /,''))}</li>`;continue;}
    closeList();
    if(!line.trim())continue;
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if(heading){const level=heading[1].length;html+=`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`;continue;}
    if(/^>\s?/.test(line)){html+=`<blockquote>${inlineMarkdown(line.replace(/^>\s?/,''))}</blockquote>`;continue;}
    html+=`<p>${inlineMarkdown(line)}</p>`;
  }
  closeList();if(inCode)html+='</code></pre>';
  return html || '<p class="placeholder">预览区将在这里显示内容。</p>';
}
export function safeImportedTasks(payload) {
  if(!payload || payload.kind !== 'zhixing-tasks' || payload.version !== SCHEMA_VERSION || !Array.isArray(payload.tasks) || payload.tasks.length > 5000)throw new Error('不是受支持的任务备份文件');
  const seen = new Set();
  return payload.tasks.map(item => {
    const validated=validateTask(item);
    if(typeof item.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(item.id) || seen.has(item.id))throw new Error('任务 ID 不合法或重复');
    seen.add(item.id);
    if(typeof item.done !== 'boolean' || typeof item.createdAt !== 'string' || !Number.isFinite(Date.parse(item.createdAt)))throw new Error('任务状态或创建时间无效');
    return {...validated,id:item.id,done:item.done,createdAt:item.createdAt};
  });
}
export const WEATHER_DESCRIPTIONS = {
  0:['晴朗','☀️'],1:['大致晴朗','🌤️'],2:['局部多云','⛅'],3:['阴天','☁️'],45:['雾','🌫️'],48:['冻雾','🌫️'],51:['小毛毛雨','🌦️'],53:['毛毛雨','🌦️'],55:['强毛毛雨','🌧️'],56:['冻毛毛雨','🌨️'],57:['强冻毛毛雨','🌨️'],61:['小雨','🌦️'],63:['中雨','🌧️'],65:['大雨','🌧️'],66:['冻雨','🌨️'],67:['强冻雨','🌨️'],71:['小雪','🌨️'],73:['中雪','❄️'],75:['大雪','❄️'],77:['雪粒','❄️'],80:['小阵雨','🌦️'],81:['中阵雨','🌧️'],82:['强阵雨','🌧️'],85:['阵雪','🌨️'],86:['强阵雪','❄️'],95:['雷暴','⛈️'],96:['雷暴伴冰雹','⛈️'],99:['强雷暴伴冰雹','⛈️']
};
export function describeWeather(code){return WEATHER_DESCRIPTIONS[code] || ['天气情况未知','🌡️'];}
export function normalizeCityResult(obj){if(!obj || typeof obj.latitude!=='number'||typeof obj.longitude!=='number'||typeof obj.name!=='string')throw new Error('城市查询结果格式无效');return {name:obj.name, region:[obj.admin1,obj.country].filter(Boolean).join(' · '),latitude:obj.latitude,longitude:obj.longitude,timezone:obj.timezone||'auto'};}
export function formatTemperature(v){return Number.isFinite(v)?`${Math.round(v)}°`:'--';}
