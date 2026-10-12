import test from 'node:test';
import assert from 'node:assert/strict';
import {validateTask,taskStats,filterTasks,isOverdue,escapeHtml,renderMarkdown,safeImportedTasks,describeWeather,normalizeCityResult,formatTemperature} from '../src/core.js';

const sample=[
{id:'a',title:'研究报告',description:'完成方法部分',priority:'high',due:'2026-11-11',done:false,createdAt:'2026-10-01T00:00:00Z'},
{id:'b',title:'整理文献',description:'检索优化论文',priority:'low',due:'',done:true,createdAt:'2026-10-02T00:00:00Z'},
{id:'c',title:'编写测试',description:'单元测试',priority:'medium',due:'2026-10-15',done:false,createdAt:'2026-10-03T00:00:00Z'}
];
test('T01 有效任务正常清洗字段',()=>{assert.deepEqual(validateTask({title:'  任务  ',description:'  内容 ',priority:'high',due:'2026-10-12'}),{title:'任务',description:'内容',priority:'high',due:'2026-10-12'});});
test('T02 空白任务名会被拒绝',()=>assert.throws(()=>validateTask({title:'   '}),/任务名称/));
test('T03 超长任务名会被拒绝',()=>assert.throws(()=>validateTask({title:'x'.repeat(121)}),/任务名称/));
test('T04 无效日期（含不存在日期）会被拒绝',()=>{assert.throws(()=>validateTask({title:'foo',due:'2026-02-30'}),/日期/);assert.throws(()=>validateTask({title:'foo',due:'not-a-date'}),/日期/);});
test('T05 非法优先级退回默认值',()=>assert.equal(validateTask({title:'正常',priority:'super'}).priority,'medium'));
test('T06 汇总统计正确',()=>assert.deepEqual(taskStats(sample),{total:3,active:2,done:1,rate:33}));
test('T07 空任务列表的比例为0',()=>assert.equal(taskStats([]).rate,0));
test('T08 搜索覆盖标题和说明',()=>{assert.equal(filterTasks(sample,{query:'研究'}).length,1);assert.equal(filterTasks(sample,{query:'单元测试'})[0].id,'c');});
test('T09 状态筛选',()=>{assert.equal(filterTasks(sample,{filter:'active'}).length,2);assert.equal(filterTasks(sample,{filter:'done'}).length,1);});
test('T10 按优先级降序',()=>assert.deepEqual(filterTasks(sample,{sort:'priority'}).map(t=>t.id),['a','c','b']));
test('T11 按截止日期，空日期排末尾',()=>assert.deepEqual(filterTasks(sample,{sort:'due'}).map(t=>t.id),['c','a','b']));
test('T12 逾期必须尚未完成',()=>{assert.equal(isOverdue('2026-10-11',false,'2026-10-12'),true);assert.equal(isOverdue('2026-10-11',true,'2026-10-12'),false);assert.equal(isOverdue('',false,'2026-10-12'),false);});
test('T13 HTML 文本被正确转义',()=>assert.equal(escapeHtml('<script>"&'), '&lt;script&gt;&quot;&amp;'));
test('T14 Markdown 标题、粗体、列表和代码',()=>{const output=renderMarkdown('# 研究\n- **优化**\n```\n<danger>\n```');assert.match(output,/<h1>研究<\/h1>/);assert.match(output,/<li><strong>优化<\/strong><\/li>/);assert.match(output,/&lt;danger&gt;/);});
test('T15 Markdown 中的 script 标签不可执行',()=>{const output=renderMarkdown('<script>alert(1)</script>');assert.doesNotMatch(output,/<script>/);assert.match(output,/&lt;script&gt;/);});
test('T16 Markdown 中的 javascript 链接不转成锚标签',()=>{const output=renderMarkdown('[click](javascript:alert(1))');assert.doesNotMatch(output,/<a /);});
test('T17 有效 HTTPS 链接加了安全 rel',()=>{const output=renderMarkdown('[test](https://example.com)');assert.match(output,/rel="noopener noreferrer"/);});
test('T18 导入任务必须符合导出协议',()=>assert.throws(()=>safeImportedTasks({tasks:sample}),/支持/));
test('T19 导入数据不能有重复 ID',()=>{const items=[sample[0],sample[0]];assert.throws(()=>safeImportedTasks({kind:'zhixing-tasks',version:1,tasks:items}),/重复/);});
test('T20 正确恢复任务备份',()=>assert.equal(safeImportedTasks({kind:'zhixing-tasks',version:1,tasks:sample}).length,3));
test('T21 天气码可正确解读并支持未知码',()=>{assert.equal(describeWeather(0)[0],'晴朗');assert.equal(describeWeather(123456)[0],'天气情况未知');});
test('T22 城市数据缺坐标时报错',()=>assert.throws(()=>normalizeCityResult({name:'Dalian'}),/格式/));
test('T23 气温保留整数且异常值显示占位符',()=>{assert.equal(formatTemperature(23.6),'24°');assert.equal(formatTemperature(null),'--');});
test('T24 说明文字长度限制',()=>assert.throws(()=>validateTask({title:'合法',description:'x'.repeat(501)}),/说明/));
