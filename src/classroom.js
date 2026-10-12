import {DEFAULT_ROSTER,secondsFromFields,formatCountdown,parseRoster,drawWithoutReplacement,randomIndex} from './tools.js';
const $=id=>document.getElementById(id);
const $$=sel=>Array.from(document.querySelectorAll(sel));
let total=300,remainingMs=300000,endTime=0,running=false,tickId=null,soundCtx=null;
function renderTimer(){
 $('timer-display').textContent=formatCountdown(Math.ceil(remainingMs/1000));
 $('timer-progress-bar').style.width=String(total?Math.max(0,Math.min(100,remainingMs/total/10)):0)+'%';
 $('timer-status').textContent=running?'进行中':remainingMs===0?'已结束':remainingMs<total*1000?'已暂停':'准备开始';
 $('timer-start').textContent=running?'暂停计时':remainingMs<total*1000&&remainingMs>0?'继续计时':'开始倒计时';
 for(const el of [$('timer-hours'),$('timer-minutes'),$('timer-seconds'),...$$('[data-preset]')])el.disabled=running;
}
function getSeconds(){return secondsFromFields($('timer-hours').value,$('timer-minutes').value,$('timer-seconds').value);}
function setFields(s){$('timer-hours').value=Math.floor(s/3600);$('timer-minutes').value=Math.floor(s%3600/60);$('timer-seconds').value=s%60;}
function chime(){
 if(!$('timer-sound').checked||!soundCtx)return;
 try{soundCtx.resume();const now=soundCtx.currentTime;for(let i=0;i<3;i++){const o=soundCtx.createOscillator(),g=soundCtx.createGain();o.frequency.value=660+i*220;g.gain.setValueAtTime(.06,now+i*.2);g.gain.exponentialRampToValueAtTime(.001,now+i*.2+.18);o.connect(g);g.connect(soundCtx.destination);o.start(now+i*.2);o.stop(now+i*.2+.2);}}catch(_){}
}
function tick(){
 if(!running)return;
 remainingMs=Math.max(0,endTime-Date.now());
 if(remainingMs===0){running=false;clearInterval(tickId);tickId=null;$('timer-completion').hidden=false;chime();}
 renderTimer();
}
$('timer-start').addEventListener('click',()=>{
 if(running){remainingMs=Math.max(0,endTime-Date.now());running=false;clearInterval(tickId);tickId=null;renderTimer();return;}
 if(remainingMs===total*1000||remainingMs===0){
  try{total=getSeconds();remainingMs=total*1000;}catch(err){alert(err.message);return;}
 }
 if($('timer-sound').checked&&!soundCtx){try{const C=window.AudioContext||window.webkitAudioContext;if(C)soundCtx=new C();}catch(_){}}
 if(soundCtx&&soundCtx.state==='suspended')soundCtx.resume().catch(()=>{});
 endTime=Date.now()+remainingMs;running=true;$('timer-completion').hidden=true;
 clearInterval(tickId);tickId=setInterval(tick,200);renderTimer();
});
$('timer-reset').addEventListener('click',()=>{
 running=false;clearInterval(tickId);tickId=null;
 try{total=getSeconds();}catch(err){alert(err.message);total=300;setFields(300);}
 remainingMs=total*1000;$('timer-completion').hidden=true;renderTimer();
});
for(const b of $$('[data-preset]'))b.addEventListener('click',()=>{
 if(running)return;total=Number(b.dataset.preset);setFields(total);remainingMs=total*1000;$('timer-completion').hidden=true;renderTimer();
});
for(const el of [$('timer-hours'),$('timer-minutes'),$('timer-seconds')])el.addEventListener('change',()=>{
 if(running)return;
 try{total=getSeconds();remainingMs=total*1000;$('timer-completion').hidden=true;renderTimer();}catch(err){alert(err.message);}
});
renderTimer();

// No-replacement drawing from all 30 screenshot names. State is private to the current browser.
const KEY='tiantian.rollcall.v1';
function defaultState(){return {names:[...DEFAULT_ROSTER],remaining:[...DEFAULT_ROSTER],history:[]};}
function load(){
 try{
  const obj=JSON.parse(localStorage.getItem(KEY));
  if(!obj)return defaultState();
  const names=parseRoster(Array.isArray(obj.names)?obj.names.join('\n'):'');
  const history=Array.isArray(obj.history)?obj.history.filter((x,i)=>names.includes(x)&&obj.history.indexOf(x)===i):[];
  return {names,history,remaining:names.filter(x=>!history.includes(x))};
 }catch(_){return defaultState();}
}
let state=load(),drawing=false;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(_){}}
function renderRoster(){
 $('rollcall-total').textContent=state.names.length;$('rollcall-left').textContent=state.remaining.length;
 $('rollcall-count').textContent=state.history.length;$('rollcall-history-count').textContent=state.history.length+'人';
 const tags=$('roster-tags');tags.replaceChildren();
 for(const name of state.names){const e=document.createElement('span');e.textContent=name;e.className='roster-tag'+(state.history.includes(name)?' drawn':'');tags.append(e);}
 const history=$('rollcall-history');history.replaceChildren();
 if(!state.history.length){const e=document.createElement('li');e.textContent='暂无抽取记录';e.className='draw-history-empty';history.append(e);}
 for(const name of state.history){const e=document.createElement('li');e.textContent=name;history.append(e);}
 $('rollcall-draw').disabled=drawing||!state.remaining.length;$('rollcall-draw').textContent=state.remaining.length?'随机抽取一位':'本轮全部抽完';
 $('rollcall-status').textContent=state.remaining.length?'公平随机 · 一轮不重复':'本轮完成';
}
$('rollcall-draw').addEventListener('click',()=>{
 if(drawing||!state.remaining.length)return;
 drawing=true;$('rollcall-draw').disabled=true;$('rollcall-edit').disabled=true;$('rollcall-reset').disabled=true;
 let steps=0;const label=$('rollcall-result');label.classList.add('drawing');
 const id=setInterval(()=>{
  label.textContent=state.remaining[randomIndex(state.remaining.length)];
  if(++steps>=12){clearInterval(id);const result=drawWithoutReplacement(state.remaining);state.remaining=result.remaining;state.history.push(result.selected);label.textContent=result.selected;label.classList.remove('drawing');$('rollcall-subtitle').textContent='本轮第'+state.history.length+'位 · 抽取成功';drawing=false;save();renderRoster();$('rollcall-edit').disabled=false;$('rollcall-reset').disabled=false;}
 },65);
});
$('rollcall-reset').addEventListener('click',()=>{
 if(drawing)return;if(state.history.length&&!confirm('确定清空本轮记录并重新开始吗？'))return;
 state.remaining=[...state.names];state.history=[];save();$('rollcall-result').textContent='点击开始点名';$('rollcall-subtitle').textContent='名单中每位同学都有相同的机会';renderRoster();
});
function closeEditor(){$('roster-form').hidden=true;$('roster-tags').hidden=false;$('rollcall-edit').hidden=false;}
$('rollcall-edit').addEventListener('click',()=>{
 if(drawing)return;$('roster-input').value=state.names.join('\n');
 $('roster-form').hidden=false;$('roster-tags').hidden=true;$('rollcall-edit').hidden=true;$('roster-input').focus();
});
$('rollcall-cancel').addEventListener('click',closeEditor);
$('roster-form').addEventListener('submit',event=>{
 event.preventDefault();if(drawing)return;
 try{
  const names=parseRoster($('roster-input').value);
  if(state.history.length&&!confirm('保存名单将重新开始一轮抽取，确定吗？'))return;
  state={names,remaining:[...names],history:[]};save();closeEditor();
  $('rollcall-result').textContent='点击开始点名';$('rollcall-subtitle').textContent='名单已更新';renderRoster();
 }catch(err){alert(err.message);}
});
renderRoster();
