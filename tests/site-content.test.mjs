import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_SITE,normalizeSiteContent,readSiteContent,saveSiteContent,resetSiteContent,SITE_KEY} from '../src/site-content.js';

function fakeStorage(){
 const data=new Map();
 return {
  getItem:key=>data.get(key)??null,
  setItem:(key,value)=>{data.set(key,String(value));},
  removeItem:key=>{data.delete(key);}
 };
}
test('默认作品集内容包含姓名、五个作品和技能',()=>{
 const value=normalizeSiteContent(DEFAULT_SITE);
 assert.equal(value.name,'汤甜甜');
 assert.equal(value.projects.length,5);
 assert.ok(value.skills.length>=1);
});
test('编辑个人资料后本地保存、重载与恢复默认',()=>{
 const original=globalThis.localStorage;
 globalThis.localStorage=fakeStorage();
 try{
  assert.equal(readSiteContent().name,'汤甜甜');
  const edited=saveSiteContent({...DEFAULT_SITE,name:'课程项目演示',headline:'欢迎访问'});
  assert.equal(edited.name,'课程项目演示');
  assert.equal(readSiteContent().name,'课程项目演示');
  assert.ok(globalThis.localStorage.getItem(SITE_KEY));
  resetSiteContent();
  assert.equal(readSiteContent().name,'汤甜甜');
 }finally{globalThis.localStorage=original;}
});
test('非法数组类型会被拒绝',()=>{
 assert.throws(()=>normalizeSiteContent({...DEFAULT_SITE,posts:{title:'不是数组'}}));
});
test('不安全字符串不会改变数据类型，展示由 textContent 控制',()=>{
 const content=normalizeSiteContent({...DEFAULT_SITE,name:'<script>alert(1)</script>'});
 assert.equal(content.name,'<script>alert(1)</script>');
});
test('课程作品和博客数量有上限',()=>{
 const content=normalizeSiteContent({...DEFAULT_SITE,posts:Array.from({length:25},(_,i)=>({title:'笔记'+i,date:'2026-10-16',summary:'测试'}))});
 assert.equal(content.posts.length,12);
});
