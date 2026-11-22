'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const { extractWorldbookEntries } = require('./build_worldbook.cjs');
const ROOT=path.resolve(__dirname,'..');
const SOURCE=path.join(ROOT,'原始上传/奥克赫斯_R4配套.json');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const ASSETS=[
 ['region','全域图/regional-art.webp','image/webp'],['town','镇内图/town-art.webp','image/webp'],
 ['ground','室内图/断剑与麦酒旅店/ground-scene.webp','image/webp'],['upper','室内图/断剑与麦酒旅店/upper-scene.webp','image/webp'],
 ['journal','手札素材/journal-page.webp','image/webp'],['ink','字体/map-ink.woff','font/woff']
];

const NEW_FIRST_MES = `<content>
铅灰色的暮云压在荒原尽头，最后一缕暗红晚霞正顺着龟裂的古道寸寸褪去。

呼啸的冷风卷着砂砾抽打在破旧的皮甲与斗篷上，带走白昼仅存的温热。脚下斑驳干涸的车辙早已被荒草掩埋，四周除了枯风呜咽与乱石怪影，再寻不到半点人烟炊烟的痕迹。这是离开旧卫城跋涉向东的第五日，距离边境要塞奥克赫斯，少说还有两到三日的荒原路程。

“当啷”一声沉闷低鸣。
古兰在一处背风的灰白岩岗前勒住脚步，将那柄阔刃精钢双手重剑稳稳倚靠在岩壁旁。她乌黑的长发在冷风中轻扬，额前整齐的齐刘海下，一双琥珀色的竖瞳冷静地扫过逐渐被阴影吞没的荒野地平线。太阳穴两侧微微后弯的黑曜石角在昏暗光线下泛着冷硬的光泽，黑底金边的长裙裙摆沾着风尘，但她挺拔肃穆的身姿依然如山岳般沉稳。她没有叹气，只是用目光丈量了一圈四周的地势，视线落在几人马鞍旁那几个早已干瘪塌陷的粗麻行囊上。

古兰：“今晚只能走到这里。天黑之后，荒原的冷风会刮骨，乱石堆里也有夜行野兽。剩下的麦饼省着吃，抵镇之前没有补给点。”

妮丝拖着略显沉重的步子走上岩坡，一屁股坐在避风的干草堆旁。娇小的金发少女将那柄镶嵌着红晶石的见习短法杖横在膝头，小巧的皮靴靴尖烦躁地踢开脚边一颗小碎石。她头顶的长双马尾有些散乱，嘴唇因缺水泛着微白，却依然微扬着下巴轻哼。

妮丝：“哈……又是硬得像石头的麦饼。等到了奥克赫斯，我一定要先去公会接个赏金最高的驱逐委托……连吃三天干草根一样的粮食，我的火球术准星都要被饿歪了。”

一声轻巧的落地声从前方的乱石高处传来。伊丝娜反手将淬火双匕插回大腿外侧的皮带，如猫般轻盈地跃下石坎。赤褐色的毛茸茸猫耳在头顶微微抖动，捕捉着逆风方向的微弱动静，身后的长尾巴不耐烦地在半空甩了个半圈。她随手拍了拍露脐短衫上的尘土，咧开嘴露出半颗尖尖的小虎牙，半开玩笑地摸了摸腰间空瘪的水囊。

伊丝娜：“得了吧，大小姐，你那火球要是射偏点到了枯草堆，咱们今晚连避风的石头都没得窝。方圆两里内没见着兽人游骑的篝火，不过西北面的风里有股腥泥味，不是有烂泥塘就是有野兽饮水的洼地。生火取暖我没意见，但包里最后那小半袋风干肉，谁也别想一口吞了——那可是救命的哨探口粮。”

奥萝拉正半跪在背风处的干燥沙地上，小心翼翼地解开随身的草药皮匣与针线包。听到伊丝娜提及“最后的小半袋”，这位身材纤挑柔和的见习牧师手指微不可察地颤了一下，金丝圆框眼镜后的深蓝双眸悄悄垂落，掠过一丝难掩的愧疚。她轻轻把水囊放在一旁，抬起袖口替妮丝擦了擦额头的浮尘。

奥萝拉：“对不起……是我没算准行军的消耗，昨晚给伤口换药时又多用了一副消炎草……不过，我这里还留着两小块用蜜糖腌过的干果，待会儿分给大家垫垫肚子……”

古兰静静看着众人，没有插话，更没有自作主张替大家安排琐碎细务。作为随行长辈，她恪守着历练后辈的界线，只是缓缓转过身，将那双锐利而平静的琥珀色眼眸投向了身佩剑盾的伯里。
“扎营有先后。风势正在变大，天色完全黑下来后，摸黑取水容易踩入泥沼或惊动暗处的夜行兽；但若是先去寻水，留在风口的人会迅速失温。”

古兰：“伯里，你是队长。今晚小队先去顺风寻水，还是先在这背风岩下把篝火生起来？”
</content>
<status_bar>
<time elapsed="0" end="1日18:00" />
<move to="wilds" />
<interact npc="gulan" />
<focus npc="gulan" />
</status_bar>`;
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
 d.character_version='0.3.3-bubble';
 d.first_mes=NEW_FIRST_MES;
 d.character_book.name='奥克赫斯·纯净标准世界书（34条）';
 d.character_book.description='奥克赫斯边境要塞世界书，包含5大基础法则、5大核心场景与12位核心角色双轨档案。恶龙真身心智全案由后台状态机按剧情进度动态推送。';
 d.character_book.token_budget=2800;
 d.character_book.entries=extractWorldbookEntries();
 d.description=d.description.replace('镇内有领主山庄、圣辉大教堂、市井街区、旅店与地下赌场；城外是荒原与黑兽人前哨。','镇内有圣辉大教堂、市井街区、旅店与地下赌场；领主庄园位于镇外安全一侧的西北山上。农户分布在镇子周围，东南恶劣荒地是敌对的黑兽人前哨，与人类城镇没有相连道路。');
 d.description=d.description.replace('<focus> 与 <injury> 不使用 at。','<focus> 不使用 at。');
 d.description=d.description.replace(/【玩家伤情】[\s\S]*?(?=【后台与正文的边界】)/,'');
 d.description+='\n\n【地图、住宿与房间事实】\n地图由卡内脚本显示，包含全域、镇内、旅店一层与二层；浏览、切层、点门和拟定行动都不等于移动、拜访成功或时间推进。只有玩家发送行动，且正文确实发生对应事实后，才输出回执。未抵达镇子前不提供镇内和旅店地图，只有全域地形可供浏览。塞西莉亚是教堂人物，不属于初始队伍。不要在正文另造地图 HTML 或按钮。\n旅店二层同一侧一排六门：01 伯里（玩家）、02 古兰（母亲、独立住客）、03 伊丝娜、04 妮丝、05 奥萝拉、06 爱德。古兰不是领队，不属于冒险者小队。房号仅作界面导览，不新增后台地点 ID；未加入的爱德不提前入住。npc.location=inn 只证明人在旅店，不能证明在卧室；拜访先敲门，依据回应展开后续互动。\n<room npc="gulan" state="together" />\n仅当正文已经确认与古兰夜间同住时申报，须在抵镇后、双方均在旅店、夜晚或深夜，且满足后台好感和阶段条件。不能用此标签申报普通串门或和其他角色同房，也不能自行写固定房号状态。\n<room state="separate" />\n表示已经分开住宿。room 可用 at 指定本轮区间内发生时间；同住与分开都不是每轮重复申报的固定字段。\n\n【经济与补给事实】\n<economy op="work" tier="odd" />\nwork 的 tier 仅使用 odd、guild_normal、guild_high、church_paid、church_volunteer，表示实际完成对应短工、公会或教会差事，结算条件和冷却由后台核验。\n<economy op="repay" npc="aurora" tier="part" />\nrepay 仅用于 aurora 或 nise，tier 为 part 或 all；必须实际还款且已知该债务。\n<economy op="donate" npc="cecilia" tier="small" />\ndonate 的 tier 为 small 或 large，仅申报实际完成的捐助。\n<economy op="buy_supply" count="5" />\n表示在镇上或旅店实际购入补给；count 为 1～99 的整数，后台按背包剩余容量和实际入库量收费。经济标签可用 at 指定本轮时间，不接受 amount、gold、delta、value、add 等金额数值字段。只有事实发生时才申报，不因点击界面草稿而自动结算。\n';
 d.description+='\n【回忆相册】\n相册开局固定显示古兰、伊丝娜、妮丝、奥萝拉四人的独立分区；后续女性角色须在相识并取得立绘后新增分区。相册由后台按已配置的数值、标记或事件条件自动收录，不因浏览或设为默认立绘而解锁。未配置的图片与条件不得自行编造；无需另写 CG HTML 或图片地址。\n';
 d.description+='\n【对白气泡与发言格式】\n角色（包括NPC与主角）发言统一使用中文冒号与引号格式：角色名：“对白内容”。\n前端显示脚本将自动将其格式化为古典带框对白气泡并渲染专属头像，主角靠右显示，其余角色居左显示。\n';
 d.creator_notes='地图与相册整合版 0.3.3-bubble，核心 2.1.1，schemaVersion=3。\n基于用户原始 R4 卡，保留基础世界书条目与规范开场白，补入当前地图、经济、房间回执契约与对白气泡美化。\n已内嵌一份完整酒馆助手脚本及全域、镇内、旅店两层图稿、手札纸面和标注字体，无需另行下载地图或外置运行脚本。\n导入 JSON 后，在酒馆助手中启用本角色卡脚本；若曾独立安装完整后台，请停用旧的那份，只运行卡内这一份。需要已安装并启用酒馆助手，普通角色卡 JSON 导入器本身不执行 JavaScript。\n新聊天会在首条回复下挂载状态栏；既有聊天存档沿用原存储键，不强制重置。卡内显示正则隐藏回执和正文包装，并自动将 角色名：“对白” 渲染为左右分侧带头像气泡。点击任意头像支持查看大图与本地上传自定义头像。\n同伴名册下方增加回忆相册；当前图片目录留空，等待后续导入素材和指定解锁条件。\n本次打包不扩写未提供的专属剧情库。';
 d.tags=[...new Set([...(d.tags||[]),'地图整合','回忆相册','对白气泡'])];
 d.extensions||={};
 d.extensions.regex_scripts=[
  {id:'okh-display-hide-status',scriptName:'奥克赫斯 · 隐藏后台回执与流式片段',findRegex:'/<status_bar\\b[^>]*>[\\s\\S]*?(?:<\\/status_bar\\s*>|$)/gi',replaceString:'',trimStrings:[],placement:[2],disabled:false,markdownOnly:true,promptOnly:false,runOnEdit:true,substituteRegex:0,minDepth:null,maxDepth:null},
  {id:'okh-display-content-wrapper',scriptName:'奥克赫斯 · 去除正文包装',findRegex:'/<\\/?content\\b[^>]*>/gi',replaceString:'',trimStrings:[],placement:[2],disabled:false,markdownOnly:true,promptOnly:false,runOnEdit:true,substituteRegex:0,minDepth:null,maxDepth:null},
  {id:'okh-dialogue-bubble',scriptName:'奥克赫斯 · 对白气泡与发言美化',findRegex:'/(?:^|\\n)([\\u4e00-\\u9fa5A-Za-z0-9_]{1,10})[：:]\\s*[“「]((?:(?![\\r\\n]{2,}|[”」])[\\s\\S])+)[”」]/g',replaceString:'\n<div class="okh-dlg-row side-left" data-okh-dlg data-okh-speaker="$1" style="display:flex;align-items:flex-start;margin:16px 0;gap:12px;position:relative;box-sizing:border-box;"><div class="okh-avatar" data-okh-ava="$1" style="flex:0 0 44px;width:44px;height:56px;border-radius:4px;border:1px solid rgba(226,199,146,0.4);background:#181d25;background-size:cover;background-position:center;display:flex;align-items:center;justify-content:center;color:rgba(226,199,146,0.9);font-size:18px;font-weight:bold;cursor:pointer;box-sizing:border-box;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div><div class="okh-dlg-col" style="display:flex;flex-direction:column;max-width:min(82%,640px);align-items:flex-start;box-sizing:border-box;"><div class="okh-speaker-name" data-okh-dlg-name style="font-size:12px;color:#9b8764;margin-bottom:4px;letter-spacing:0.5px;text-align:left;padding-left:2px;">$1</div><div class="okh-dlg-bubble" data-okh-dlg-body="$2" style="padding:10px 16px;font-size:14.5px;line-height:1.68;box-shadow:0 4px 16px rgba(0,0,0,0.35);word-break:break-word;background:linear-gradient(135deg,rgba(27,32,40,0.96),rgba(18,22,28,0.94));border-left:2px solid rgba(226,199,146,0.55);border-right:1px solid rgba(211,216,222,0.12);border-top:1px solid rgba(211,216,222,0.12);border-bottom:1px solid rgba(211,216,222,0.12);border-radius:2px 12px 12px 12px;color:#f0dfbe;text-align:left;box-sizing:border-box;">$2</div></div></div>',trimStrings:[],placement:[2],disabled:false,markdownOnly:true,promptOnly:false,runOnEdit:true,substituteRegex:0,minDepth:null,maxDepth:null}
 ];
 d.extensions.tavern_helper={scripts:[{type:'script',enabled:true,id:'okh-complete-autostart',name:'奥克赫斯 · 地图与状态栏完整后台 2.1.1',content:runtime,info:'唯一完整后台；读取当前聊天存档，自动挂载地图手札，沿用原有计时、事件与回滚。',button:{enabled:false,buttons:[]},data:{},export_with:{data:true,button:true}}],variables:{}};
 d.extensions.okh_build={album_catalog_sha256:sha(fs.readFileSync(path.join(ROOT,'回忆相册/目录.json'))),album_catalog_count:JSON.parse(fs.readFileSync(path.join(ROOT,'回忆相册/目录.json'),'utf8')).length,format:1,core_version:'2.1.1',schema_version:3,source_card_sha256:sha(original),runtime_sha256:sha(runtime),map_views:['region','town','ground','upper'],room_order:['player','gulan','isna','nise','aurora','ed'],assets,licenses:{'map-ink.woff':fs.readFileSync(path.join(ROOT,'地图预览/字体/OFL.txt'),'utf8')}};
 const out=path.join(ROOT,'最新角色卡/奥克赫斯.json');fs.mkdirSync(path.dirname(out),{recursive:true});
 const text=JSON.stringify(card,null,2)+'\n';fs.writeFileSync(out,text);
 if(fs.readFileSync(out,'utf8')!==text)throw Error('角色卡写入回读不一致');
 console.log('已生成地图整合角色卡：'+out+' · '+Buffer.byteLength(text)+' 字节');return{card,path:out};
}
if(require.main===module)buildCard();
module.exports={buildCard,ASSETS};
