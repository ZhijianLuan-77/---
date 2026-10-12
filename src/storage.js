/** 本地存储：损坏数据自动退回默认值，防止白屏；不发送用户任务/笔记到服务器。 */
const KEY='tiantian.v1';
export const INITIAL_NOTE={id:'welcome',title:'Markdown 快速入门',content:'# 欢迎使用甜甜的学习笔记\n\n这里可以写下你的学习笔记与研究灵感。\n\n## 基础语法\n- **加粗文字**与 *斜体文字*\n- `行内代码`与 [Open-Meteo 官网](https://open-meteo.com/)\n- 使用三个反引号创建代码块\n\n> 记录，是更高效思考的开始。',updatedAt:'2026-01-01T00:00:00.000Z'};
export function defaultData(){return {version:1,tasks:[],notes:[{...INITIAL_NOTE}],theme:'light'};}
export function loadData(){
  try{
    const raw=localStorage.getItem(KEY);
    if(!raw)return defaultData();
    const parsed=JSON.parse(raw);
    if(!parsed || parsed.version!==1 || !Array.isArray(parsed.tasks)|| !Array.isArray(parsed.notes))return defaultData();
    return {version:1,tasks:parsed.tasks.slice(0,5000),notes:parsed.notes.filter(n=>n&&typeof n.id==='string'&&typeof n.title==='string'&&typeof n.content==='string').slice(0,500),theme:parsed.theme==='dark'?'dark':'light'};
  }catch(_){return defaultData();}
}
export function saveData(data){try{localStorage.setItem(KEY,JSON.stringify(data));return true;}catch(_){return false;}}
