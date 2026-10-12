export const DEFAULT_ROSTER = Object.freeze([
'夏天明','于明雨','郭宏伟','付逸澜','崔桐浩',
'汤甜甜','李欣言','梁彩红','何易临','马鸣远',
'龚纯希','任嘉豪','赵翔宇','张宇轩','崔迎钊',
'蔡子婧','罗前宇','王略帆','金志达','高煜涵',
'晏凤萱','张浩宇','肖志鹏','张宏博','朱泽恩',
'卢嘉毅','薛志豪','曾培耕','王瑾','梁梓函'
]);
export function secondsFromFields(h,m,s){
 const p=[h,m,s].map(Number);
 if(p.some((v,i)=>!Number.isInteger(v)||v<0||v>(i===0?99:59)))throw Error('请输入有效的小时（0–99）、分钟和秒数（0–59）');
 const t=p[0]*3600+p[1]*60+p[2];if(t<1)throw Error('倒计时时长至少为1秒');return t;
}
export function formatCountdown(s){const n=Math.max(0,Math.floor(Number(s)||0));return [Math.floor(n/3600),Math.floor(n%3600/60),n%60].map(x=>String(x).padStart(2,'0')).join(':');}
export function parseRoster(text){
 const names=String(text).split(/[\n,，、;；]+/).map(x=>x.trim()).filter(Boolean);
 if(names.length>300)throw Error('名单最多支持300人');
 const result=[...new Set(names)];if(!result.length)throw Error('名单不能为空');
 if(result.some(x=>x.length>25))throw Error('单个姓名最多25个字符');return result;
}
export function randomIndex(length){
 if(!Number.isInteger(length)||length<1)throw Error('本轮已抽完');
 const limit=2**32-(2**32)%length;
 for(let k=0;k<128;k++){
  const a=new Uint32Array(1);
  if(typeof globalThis.crypto?.getRandomValues==='function')globalThis.crypto.getRandomValues(a);
  else a[0]=Math.floor(Math.random()*2**32);
  if(a[0]<limit)return a[0]%length;
 }throw Error('随机数生成失败');
}
export function drawWithoutReplacement(pool){
 if(!pool.length)throw Error('本轮已抽完');
 const i=randomIndex(pool.length);
 return {selected:pool[i],remaining:pool.filter((_,j)=>i!==j)};
}
