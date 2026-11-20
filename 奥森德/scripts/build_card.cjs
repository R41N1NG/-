'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const SOURCE=path.join(ROOT,'原始上传/奥克赫斯_R4配套.json');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const ASSETS=[
 ['region','全域图/regional-art.webp','image/webp'],['town','镇内图/town-art.webp','image/webp'],
 ['ground','室内图/断剑与麦酒旅店/ground-scene.webp','image/webp'],['upper','室内图/断剑与麦酒旅店/upper-scene.webp','image/webp'],
 ['journal','手札素材/journal-page.webp','image/webp'],['ink','字体/map-ink.woff','font/woff']
];
function buildCard({runtimePath=path.join(ROOT,'dist/okh_complete_autostart.js')}={}){
 const original=fs.readFileSync(SOURCE),card=JSON.parse(original),d=card.data;
 const runtime=fs.readFileSync(runtimePath,'utf8');
 if(!runtime.includes('root.OKH_APP_MAP')||/__OKH_MAP_[A-Z_]+__/.test(runtime))throw Error('请先构建包含地图资源的完整自动启动脚本');
 const assets={};
 for(const [key,rel,mime]of ASSETS){
  const bytes=fs.readFileSync(path.join(ROOT,'地图预览',rel));
  if(!runtime.includes('data:'+mime+';base64,'+bytes.toString('base64')))throw Error('运行库未内嵌地图素材：'+rel);
  assets[key]={path:'地图预览/'+rel,sha256:sha(bytes)};
 }
 d.character_version='0.3.0-map';
 d.character_book.name='奥克赫斯·地图整合版基础世界书';
 d.description=d.description.replace('镇内有领主山庄、圣辉大教堂、市井街区、旅店与地下赌场；城外是荒原与黑兽人前哨。','镇内有圣辉大教堂、市井街区、旅店与地下赌场；领主庄园位于镇外安全一侧的西北山上。农户分布在镇子周围，东南恶劣荒地是敌对的黑兽人前哨，与人类城镇没有相连道路。');
 d.description=d.description.replace('<focus> 与 <injury> 不使用 at。','<focus> 不使用 at。');
 d.description=d.description.replace(/【玩家伤情】[\s\S]*?(?=【后台与正文的边界】)/,'');
 d.description+='\n\n【地图、住宿与房间事实】\n地图由卡内脚本显示，包含全域、镇内、旅店一层与二层；浏览、切层、点门和拟定行动都不等于移动、拜访成功或时间推进。只有玩家发送行动，且正文确实发生对应事实后，才输出回执。不要在正文另造地图 HTML 或按钮。\n旅店二层同一侧一排六门：01 伯里（玩家）、02 古兰（母亲、独立住客）、03 伊丝娜、04 妮丝、05 奥萝拉、06 爱德。古兰不是领队，不属于冒险者小队。房号仅作界面导览，不新增后台地点 ID；未加入的爱德不提前入住。npc.location=inn 只证明人在旅店，不能证明在卧室；拜访先敲门，依据回应展开后续互动。\n<room npc="gulan" state="together" />\n仅当正文已经确认与古兰夜间同住时申报，须在抵镇后、双方均在旅店、夜晚或深夜，且满足后台好感和阶段条件。不能用此标签申报普通串门或和其他角色同房，也不能自行写固定房号状态。\n<room state="separate" />\n表示已经分开住宿。room 可用 at 指定本轮区间内发生时间；同住与分开都不是每轮重复申报的固定字段。\n\n【经济与补给事实】\n<economy op="work" tier="odd" />\nwork 的 tier 仅使用 odd、guild_normal、guild_high、church_paid、church_volunteer，表示实际完成对应短工、公会或教会差事，结算条件和冷却由后台核验。\n<economy op="repay" npc="aurora" tier="part" />\nrepay 仅用于 aurora 或 nise，tier 为 part 或 all；必须实际还款且已知该债务。\n<economy op="donate" npc="cecilia" tier="small" />\ndonate 的 tier 为 small 或 large，仅申报实际完成的捐助。\n<economy op="buy_supply" count="5" />\n表示在镇上或旅店实际购入补给；count 为 1～99 的整数，后台按背包剩余容量和实际入库量收费。经济标签可用 at 指定本轮时间，不接受 amount、gold、delta、value、add 等金额数值字段。只有事实发生时才申报，不因点击界面草稿而自动结算。\n';
 for(const e of d.character_book.entries){
  if(e.id===0)e.content=e.content.replace('城镇有旅店、教堂、街区、练武场、山庄和地下赌场；城外存在黑兽人前哨。','镇内有旅店、教堂、街区、练武场和地下赌场。领主庄园在镇外安全一侧的西北山上，农户环绕镇子；东南恶劣荒地存在敌对黑兽人前哨，与人类城镇不通道路。');
  if(e.id===10)e.content=e.content.replace('manor 是领主山庄','manor 是位于镇外西北山上的领主庄园');
 }
 d.creator_notes='地图整合版 0.3.0-map，核心 2.1.1，schemaVersion=3。\n基于用户原始 R4 卡，保留 11 条世界书与原开场，补入当前地图与经济、房间回执契约。\n已内嵌一份完整酒馆助手脚本及全域、镇内、旅店两层图稿、手札纸面和标注字体，无需另行下载地图或外置运行脚本。\n导入 JSON 后，在酒馆助手中启用本角色卡脚本；若曾独立安装完整后台，请停用旧的那份，只运行卡内这一份。需要已安装并启用酒馆助手，普通角色卡 JSON 导入器本身不执行 JavaScript。\n新聊天会在首条回复下挂载状态栏；既有聊天存档沿用原存储键，不强制重置。卡内显示正则仅隐藏回执和正文包装，不改写模型收到的原始消息。\n本次打包不扩写未提供的专属剧情库。';
 d.tags=[...new Set([...(d.tags||[]),'地图整合'])];
 d.extensions||={};
 d.extensions.regex_scripts=[
  {id:'okh-display-hide-status',scriptName:'奥克赫斯 · 隐藏后台回执与流式片段',findRegex:'/<status_bar\\b[^>]*>[\\s\\S]*?(?:<\\/status_bar\\s*>|$)/gi',replaceString:'',trimStrings:[],placement:[2],disabled:false,markdownOnly:true,promptOnly:false,runOnEdit:true,substituteRegex:0,minDepth:null,maxDepth:null},
  {id:'okh-display-content-wrapper',scriptName:'奥克赫斯 · 去除正文包装',findRegex:'/<\\/?content\\b[^>]*>/gi',replaceString:'',trimStrings:[],placement:[2],disabled:false,markdownOnly:true,promptOnly:false,runOnEdit:true,substituteRegex:0,minDepth:null,maxDepth:null}
 ];
 d.extensions.tavern_helper={scripts:[{type:'script',enabled:true,id:'okh-complete-autostart',name:'奥克赫斯 · 地图与状态栏完整后台 2.1.1',content:runtime,info:'唯一完整后台；读取当前聊天存档，自动挂载地图手札，沿用原有计时、事件与回滚。',button:{enabled:false,buttons:[]},data:{},export_with:{data:true,button:true}}],variables:{}};
 d.extensions.okh_build={format:1,core_version:'2.1.1',schema_version:3,source_card_sha256:sha(original),runtime_sha256:sha(runtime),map_views:['region','town','ground','upper'],room_order:['player','gulan','isna','nise','aurora','ed'],assets,licenses:{'map-ink.woff':fs.readFileSync(path.join(ROOT,'地图预览/字体/OFL.txt'),'utf8')}};
 const out=path.join(ROOT,'最新角色卡/奥克赫斯.json');fs.mkdirSync(path.dirname(out),{recursive:true});
 const text=JSON.stringify(card,null,2)+'\n';fs.writeFileSync(out,text);
 if(fs.readFileSync(out,'utf8')!==text)throw Error('角色卡写入回读不一致');
 console.log('已生成地图整合角色卡：'+out+' · '+Buffer.byteLength(text)+' 字节');return{card,path:out};
}
if(require.main===module)buildCard();
module.exports={buildCard,ASSETS};
