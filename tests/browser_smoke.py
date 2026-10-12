"""浏览器交互烟雾测试。此执行环境禁止本地页面导航，因此以等价拼接脚本注入验证 UI。
注：不能替代真实 http.server 的模块加载与线上 API 集成测试。
"""
import pathlib, json, re
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
SHOTS=ROOT/'screenshots'
SHOTS.mkdir(exist_ok=True)
html=(ROOT/'index.html').read_text('utf-8')
html=re.sub(r'<link rel="stylesheet"[^>]*>', '', html)
html=re.sub(r'<script type="module"[^>]*></script>', '', html)
css=(ROOT/'src/styles.css').read_text('utf-8')
css=css[css.index(':root{'):]
core=(ROOT/'src/core.js').read_text('utf-8').replace('export ', '')
storage=(ROOT/'src/storage.js').read_text('utf-8').replace('export ', '')
app=(ROOT/'src/app.js').read_text('utf-8')
app=re.sub(r'^import .*?;\s*$', '',app,flags=re.M)
bundle='\n'.join([core,storage,app])
with sync_playwright() as play:
    browser=play.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    def inject():
        saved=page.evaluate("() => window.__fakeStore ? [...window.__fakeStore.entries()] : []")
        page.set_content(html,wait_until='load')
        page.add_style_tag(content=css)
        page.evaluate("""(entries) => {window.__fakeStore=new Map(entries); Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>window.__fakeStore.get(k)??null,setItem:(k,v)=>window.__fakeStore.set(k,String(v)),removeItem:k=>window.__fakeStore.delete(k)}})}""",saved)
        page.add_script_tag(content=bundle)
    inject()
    page.screenshot(path=str(SHOTS/'01_个人主页.png'),full_page=True)
    assert page.locator('#view-home').is_visible()
    assert page.locator('.project-card').count()==3
    page.locator('a[data-view="tasks"]').click()
    page.locator('#toggle-task-form').click()
    page.locator('#task-title').fill('E2E 测试任务')
    page.locator('#task-description').fill('验证持久化和筛选')
    page.locator('#task-priority').select_option('high')
    page.locator('#task-due').fill('2026-11-01')
    page.locator('#task-form button[type="submit"]').click()
    assert page.locator('#metric-total').inner_text()=='1'
    page.screenshot(path=str(SHOTS/'02_进阶待办应用.png'),full_page=True)
    stored=page.evaluate("() => [...window.__fakeStore.entries()]")
    page.close()
    page=browser.new_page(viewport={"width":1440,"height":900},device_scale_factor=1)
    page.on("pageerror",lambda error:errors.append(str(error)))
    page.evaluate("entries => window.__fakeStore=new Map(entries)",stored)
    inject()
    page.locator('a[data-view="tasks"]').click()
    assert page.locator('#metric-total').inner_text()=='1', '刷新页面后未保存任务'
    page.locator('.task-toggle').click()
    assert page.locator('#metric-done').inner_text()=='1'
    page.locator('button[data-filter="done"]').click()
    assert page.locator('.task-row').count()==1
    page.locator('a[data-view="notes"]').click()
    page.locator('#new-note').click()
    page.locator('#note-title').fill('E2E 笔记')
    page.locator('#note-content').fill('# 标题\n\n**重点** 与 <script>alert(1)</script>')
    page.locator('[data-note-tab="preview"]').click()
    assert page.locator('#note-preview h1').inner_text()=='标题'
    assert page.locator('#note-preview script').count()==0
    page.screenshot(path=str(SHOTS/'03_Markdown笔记.png'),full_page=True)
    stored=page.evaluate("() => [...window.__fakeStore.entries()]")
    page.close()
    page=browser.new_page(viewport={"width":1440,"height":900},device_scale_factor=1)
    page.on("pageerror",lambda error:errors.append(str(error)))
    page.evaluate("entries => window.__fakeStore=new Map(entries)",stored)
    inject()
    page.locator('a[data-view="notes"]').click()
    assert page.locator('#note-title').input_value()=='E2E 笔记'
    page.locator('a[data-view="weather"]').click()
    # 注入模拟 API 响应：仅证明数据处理/渲染，不表示实际联网获取。
    city={'results':[{'name':'大连','admin1':'辽宁省','country':'中国','latitude':38.914,'longitude':121.614}]}
    forecast={'current':{'time':'2026-10-12T09:00','temperature_2m':21.4,'weather_code':2,'apparent_temperature':20,'relative_humidity_2m':65,'wind_speed_10m':12.3},'daily':{'time':['2026-10-12','2026-10-13','2026-10-14','2026-10-15'],'weather_code':[2,3,0,61],'temperature_2m_max':[22,23,21,19],'temperature_2m_min':[13,14,11,10],'precipitation_probability_max':[10,20,5,60]}}
    page.evaluate('''([city,forecast]) => { window.fetch=async url=>({ok:true,json:async()=>String(url).includes('geocoding-api')?city:forecast});}''',[city,forecast])
    page.locator('button[data-city="大连"]').click()
    assert page.locator('.weather-now h2').inner_text()=='大连'
    assert page.locator('.forecast-day').count()==4
    page.screenshot(path=str(SHOTS/'04_天气查询_模拟接口示例.png'),full_page=True)
    stored=page.evaluate("() => [...window.__fakeStore.entries()]")
    page.close()
    page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
    page.on("pageerror",lambda error:errors.append(str(error)))
    page.evaluate("entries => window.__fakeStore=new Map(entries)",stored)
    inject()
    page.wait_for_timeout(400)
    page.screenshot(path=str(SHOTS/'05_移动端适配.png'),full_page=True)
    assert not errors, f'浏览器 JS 错误: {errors}'
    print('E2E PASS: 首页/任务增改查与刷新持久化/笔记预览与防脚本注入/模拟天气响应/移动端; 截图=5')
    browser.close()
