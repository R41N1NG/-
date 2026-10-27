"""gpt：仅清理展示元数据、卷前美化与对应网关配置，保留上传卡其余内容。"""
from pathlib import Path
import json,re,html,sys,base64
root=Path(__file__).resolve().parents[2]
source=Path(sys.argv[1])
output=Path(sys.argv[2])
card=json.loads(source.read_text());d=card['data']
d['name']='朱颜血·丹杏'
d['description']='基于经典暗黑写实武侠《朱颜血·丹杏》构建的宏大沉浸角色卡。融汇明代宣德五年真实历史、厂卫特务倾轧、道家名门官僚互嵌、民间白莲教谋反、以及边陲私刑黑狱的残酷世情。具备完备的五幕中立天下大势自转、官方知晓度暗账情报系统、四身份自选开局与高沉浸状态栏态势感知。'
d['creator_notes']=''
# 输出协议已有独立depth=0 system注入，删减展示描述时保持该注入逐字不动。
assert '<zyx_required_status_output>' in d['extensions']['depth_prompt']['prompt']
prelude,sep,tail=d['first_mes'].partition('<zyx_gateway>')
assert sep and prelude.strip() and tail.endswith('</zyx_gateway>')
paragraphs=[p.strip() for p in prelude.strip().split('\n\n') if p.strip()]
prelude_html='\n'.join('<p>'+html.escape(p.removeprefix('❖ '))+'</p>' for p in paragraphs)
fragment='''
  <aside class="zyx-prologue" aria-label="卷前故事">
    <div class="zyx-prologue-meta"><span>卷前 · 山雨初起</span><span>宣德五年 · 暮春</span></div>
    <p class="zyx-prologue-lead">一封密函，一副重枷。三省边地，山雨将至。</p>
    <details class="zyx-prologue-story"><summary><span>展开前情</span><span class="zyx-prologue-cue" aria-hidden="true">＋</span></summary>
      <div class="zyx-prologue-copy">'''+prelude_html+'''</div>
    </details>
  </aside>
'''
css='''
/* gpt · 卷前新增故事与原剪影网关统一，默认折叠保留选身份首屏。 */
#zyx-zero-floor .zyx-prologue{position:relative;margin:0 0 24px;padding:18px 20px;border:1px solid #9c94734d;border-left:3px solid #984b41;background:linear-gradient(120deg,#29312be8,#131c1be8);box-shadow:inset 0 1px #c4b28b16}
#zyx-zero-floor .zyx-prologue-meta{display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px 16px;color:#c4b18c;font-size:11px;letter-spacing:.12em}
#zyx-zero-floor .zyx-prologue-lead{margin:12px 0 14px;color:#e5dcc7;font:18px/1.9 ui-serif,'Songti SC',SimSun,serif;letter-spacing:.05em}
#zyx-zero-floor .zyx-prologue-story{border-top:1px solid #a297732e}
#zyx-zero-floor .zyx-prologue-story>summary{display:flex;align-items:center;justify-content:space-between;min-height:44px;list-style:none;cursor:pointer;color:#c7bea6;font-size:12px;letter-spacing:.1em}
#zyx-zero-floor .zyx-prologue-story>summary::-webkit-details-marker{display:none}
#zyx-zero-floor .zyx-prologue-story>summary:focus-visible{outline:2px solid #c5b58e;outline-offset:3px}
#zyx-zero-floor .zyx-prologue-cue{font-size:18px;color:#b78b71;transition:transform .18s ease}
#zyx-zero-floor .zyx-prologue-story[open] .zyx-prologue-cue{transform:rotate(45deg)}
#zyx-zero-floor .zyx-prologue-copy{padding:8px 0 3px;color:#c9c9bb;font:14px/2.15 ui-serif,'Songti SC',SimSun,serif;overflow-wrap:anywhere}
#zyx-zero-floor .zyx-prologue-copy p{margin:0 0 15px;text-indent:2em}
#zyx-zero-floor .zyx-prologue-copy p:last-child{color:#ddc9ac;margin-bottom:8px}
@media(max-width:560px){#zyx-zero-floor .zyx-prologue{padding:14px 13px;margin-bottom:20px}#zyx-zero-floor .zyx-prologue-lead{font-size:16px}#zyx-zero-floor .zyx-prologue-copy{font-size:13px;line-height:2}}
@media(prefers-reduced-motion:reduce){#zyx-zero-floor .zyx-prologue-cue{transition:none}}
'''
s=next(s for s in d['extensions']['regex_scripts'] if str(s.get('id'))=='1')
assert '<div id="zyx-zero-floor">' in s['replaceString']
s['replaceString']=s['replaceString'].replace('<div id="zyx-zero-floor">','<div id="zyx-zero-floor">\n'+fragment,1)
# Append scoped stylesheet before body root; no script/image/code regeneration.
s['replaceString']=s['replaceString'].replace('<div id="zyx-zero-floor">','<style>\n'+css+'</style>\n<div id="zyx-zero-floor">',1)
# Keep the narrative in the model-visible message while matching it as one gateway.
d['first_mes']='<zyx_gateway>\n'+prelude.strip()+'\n\n'+tail
def update_config(match):
    raw=base64.b64decode(match.group(1)).decode('utf-8')
    prefix='window.ZYX_OPENING_CONFIG='
    if not raw.startswith(prefix): return match.group(0)
    config=json.loads(raw[len(prefix):].rstrip(';'))
    config['gateway']=d['first_mes']
    raw=prefix+json.dumps(config,ensure_ascii=False,separators=(',', ':')).replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026').replace('`','\\u0060')+';'
    return match.group(0).replace(match.group(1),base64.b64encode(raw.encode()).decode())
s['replaceString']=re.sub(r'<script\b[^>]*src="data:text/javascript;charset=utf-8;base64,([A-Za-z0-9+/=]+)"[^>]*></script>',update_config,s['replaceString'])
output.parent.mkdir(parents=True,exist_ok=True)
output.write_text(json.dumps(card,ensure_ascii=False,indent=2)+'\n')
print(output)
