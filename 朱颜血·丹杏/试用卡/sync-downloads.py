"""gpt：同步当前已检查整卡的英文下载副本与ZIP，防止下载旧版。"""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
import hashlib, json, argparse, re
base = Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description='同步明确指定的已检查成品')
parser.add_argument('--source', type=Path)
parser.add_argument('--map-assets', action='store_true', help='ZIP同时包含已配置的两张地图与放置说明')
parser.add_argument('--release', help='固定下载文件标签，例如zero-fix1；不改变协议版本')
args = parser.parse_args()
if args.release and not re.fullmatch(r'[a-z0-9][a-z0-9-]*', args.release):
    parser.error('release只允许小写字母、数字和连字符')
source = args.source.resolve() if args.source else base / '【朱颜血·丹杏】CCv3-刑狱状态栏试用.json'
data = source.read_bytes()
card = json.loads(data)
assert card['spec'] == 'chara_card_v3'
assert '<zyx_required_status_output>' in card['data']['extensions']['depth_prompt']['prompt']
assert len(card['data']['extensions']['regex_scripts']) == 6
assert card['data']['extensions']['depth_prompt']['depth'] == 0
assert card['data']['extensions']['depth_prompt']['role'] == 'system'
match = re.search(r'ZYX_STATUS_PROTOCOL_V([0-9]+)', card['data']['extensions']['depth_prompt']['prompt'])
assert match
version = match.group(1)
release = args.release or ('v' + version)
out = base.parent.parent / 'downloads'
out.mkdir(exist_ok=True)
(out / 'danxing-trial.json').write_bytes(data)
with ZipFile(out / 'danxing-trial.zip', 'w') as archive:
    info = ZipInfo('danxing-trial.json', date_time=(2026, 1, 1, 0, 0, 0))
    archive.writestr(info, data, compress_type=ZIP_DEFLATED, compresslevel=9)
    if args.map_assets:
        for filename in ('danxing-border-map.png', 'danxing-overview-map.png'):
            asset_info = ZipInfo('图包/地图/' + filename, date_time=(2026, 1, 1, 0, 0, 0))
            archive.writestr(asset_info, (out / filename).read_bytes(), compress_type=ZIP_DEFLATED, compresslevel=9)
        guide = 'gpt：丹杏二级地图接入\n\n1. 将danxing-trial.json导入酒馆。\n2. 把图包里的“地图”文件夹复制到现有zyx_gallery图包目录，与角色立绘、关押中立绘并列。最终应可访问：user/images/zyx_gallery/地图/danxing-border-map.png 和 danxing-overview-map.png。\n3. 打开状态栏地点入口，默认长宁周边小地图；点击罗霄山大地图切换，点击小地图标签返回。\n本地缺图会尝试联网读取仓库备用图；本地两图放好后可离线使用。\n地图只供查看，不涉及时间或事件推进。\n'
        guide_info = ZipInfo('地图接入说明.txt', date_time=(2026, 1, 1, 0, 0, 0))
        archive.writestr(guide_info, guide.encode('utf-8'), compress_type=ZIP_DEFLATED, compresslevel=9)
manifest = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(),
            'release': release,
            'source': str(source.relative_to(base.parent.parent)) if source.is_relative_to(base.parent.parent) else source.name,
            'worldbook_entries': len(card['data'].get('character_book', {}).get('entries', [])),
            'features': ['identity-menu', 'prison-hud', 'core-output-contract', 'native-depth-prompt-v' + version, 'read-only-map', 'portrait-config-port', 'player-martial-ledger']}
if release in ('hud-fix2', 'start-map-fix3', 'control-fix4', 'backend-v1', 'backend-v3', 'backend-v4', 'maps-v1', 'presentation-v1', 'render-fix1', 'maps-v2', 'opening-draft-v1', 'character-routing-v1', 'worldbook-v1'):
    manifest['features'] += ['prison-roster', 'turn-elapsed-log']
if release in ('start-map-fix3', 'control-fix4', 'backend-v1', 'backend-v3', 'backend-v4', 'maps-v1', 'presentation-v1', 'render-fix1', 'maps-v2', 'opening-draft-v1', 'character-routing-v1', 'worldbook-v1'):
    manifest['features'].remove('read-only-map')
    manifest['features'] += ['image-map-port', 'identity-opening-selection']
if release in ('control-fix4', 'backend-v1', 'backend-v3', 'backend-v4', 'maps-v1', 'presentation-v1', 'render-fix1', 'maps-v2', 'opening-draft-v1', 'character-routing-v1', 'worldbook-v1'):
    manifest['features'] += ['eight-character-custody', 'scoped-runtime-coordinator']
if release in ('backend-v1', 'backend-v3', 'backend-v4', 'maps-v1', 'presentation-v1', 'render-fix1', 'maps-v2', 'opening-draft-v1', 'character-routing-v1', 'worldbook-v1'):
    manifest['features'] += ['independent-character-backend', 'authoritative-clock', 'confirmed-clue-progress', 'configurable-node-conditions', 'native-message-snapshots']
if release in ('backend-v3', 'backend-v4', 'maps-v1', 'presentation-v1', 'render-fix1', 'maps-v2', 'opening-draft-v1', 'character-routing-v1', 'worldbook-v1'):
    manifest['features'] += ['single-writer', 'protocol-v8', 'evidence-events-intelligence', 'dynamic-custody-roster', 'current-request-npc-profiles', 'v2-art-preserved']
if release in ('backend-v4', 'maps-v1', 'presentation-v1', 'render-fix1', 'maps-v2', 'opening-draft-v1', 'character-routing-v1', 'worldbook-v1'):
    manifest['features'] += ['invalid-report-recovery', 'committed-opening-ledger', 'atomic-intel-batches', 'negative-custody-portrait', 'prefix-safe-person-swap', 'elapsed-history-dialog', 'custody-permission-revocation']
if release in ('maps-v1', 'presentation-v1', 'render-fix1', 'maps-v2', 'opening-draft-v1', 'character-routing-v1', 'worldbook-v1'):
    manifest['features'] += ['two-level-image-map', 'default-changning-region', 'luoxiao-overview-switch', 'local-assets-remote-fallback']
if release in ('presentation-v1', 'render-fix1', 'maps-v2', 'opening-draft-v1', 'character-routing-v1', 'worldbook-v1'):
    manifest['features'] += ['clean-card-metadata', 'collapsible-zero-prologue']
if release in ('render-fix1', 'maps-v2', 'opening-draft-v1', 'character-routing-v1', 'worldbook-v1'):
    manifest['features'] += ['single-source-hud-regex']
if release in ('opening-draft-v1', 'character-routing-v1', 'worldbook-v1'):
    manifest['features'] += ['identity-draft-on-opening-switch']
if release in ('character-routing-v1', 'worldbook-v1'):
    manifest['features'] += ['chat-scoped-identity-injection', 'node-only-npc-profiles', 'qingluo-yingque-combat-portrait', 'legacy-hud-read-only']
if release == 'worldbook-v1':
    manifest['features'] += ['worldbook-alias-cleanup', 'xieyunsu-realm-sync']
if args.map_assets:
    manifest['map_assets'] = [{'file': '图包/地图/' + filename, 'sha256': hashlib.sha256((out / filename).read_bytes()).hexdigest()} for filename in ('danxing-border-map.png', 'danxing-overview-map.png')]
# 固定版本文件方便区分旧下载；内容与latest一致。
(out / ('danxing-' + release + '.json')).write_bytes(data)
(out / ('danxing-' + release + '.zip')).write_bytes((out / 'danxing-trial.zip').read_bytes())
(out / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(manifest, ensure_ascii=False))
