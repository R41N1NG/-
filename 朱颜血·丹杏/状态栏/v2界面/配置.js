/**
 * 朱颜血 · 全局静态配置模块 (zyx_config.js)
 * 职责：定义图包基础路径、立绘映射表、地图底图配置与全局常量。
 */

(function (root) {
  'use strict';

  const ZYXConfig = {
    version: '1.2.0',
    portraits: {
      baseUrl: 'user/images/zyx_gallery/',
      files: {
        // --- 1. 常态立绘 (角色立绘/) ---
        '白雪莲': '角色立绘/白雪莲.png',
        '白雪莲-拔剑': '角色立绘/白雪莲-拔剑.png',
        '白雪莲-牢狱0': '角色立绘/白雪莲-牢狱0.png',
        '白雪莲-牢狱1': '角色立绘/白雪莲-牢狱1.png',
        '薛霜灵': '角色立绘/薛霜灵.png',
        '薛霜灵-牢狱0': '角色立绘/薛霜灵-牢狱0.png',
        '薛霜灵-牢狱1': '角色立绘/薛霜灵-牢狱1.png',
        '薛霜灵-牢狱2': '角色立绘/薛霜灵-牢狱2.png',
        '薛霜灵-牢狱3': '角色立绘/薛霜灵-牢狱3.png',
        '薛霜灵牢狱4': '角色立绘/薛霜灵牢狱4.png',
        '丹娘': '角色立绘/丹娘.png',
        '裴丹杏': '角色立绘/丹娘.png',
        '丹杏': '角色立绘/丹娘.png',
        '裴掌柜': '角色立绘/丹娘.png',
        '玉娘': '角色立绘/玉娘.png',
        '裴玉青': '角色立绘/玉娘.png',
        '裴青玉': '角色立绘/玉娘.png',
        '潇潇': '角色立绘/玉娘.png',
        '白玉莲': '角色立绘/白玉莲.png',
        '白玉莲-哭泣': '角色立绘/白玉莲-哭泣.png',
        '白玉莲-哭泣1': '角色立绘/白玉莲-哭泣1.png',
        '白玉莲-惊恐': '角色立绘/白玉莲-惊恐.png',
        '白玉莲-愣住': '角色立绘/白玉莲-愣住.png',
        '白玉莲-愣住1': '角色立绘/白玉莲-愣住1.png',
        '白玉莲-性事后': '角色立绘/白玉莲-性事后.png',
        '白玉莲-性事后1': '角色立绘/白玉莲-性事后1.png',
        '白玉莲-性事后2': '角色立绘/白玉莲-性事后2.png',
        '谢云素': '角色立绘/谢云素.png',
        '谢长老': '角色立绘/谢云素.png',
        '郡主': '角色立绘/郡主.png',
        '朱仪瑄': '角色立绘/郡主.png',
        '宁安郡主': '角色立绘/郡主.png',
        '仪瑄': '角色立绘/郡主.png',
        '青萝': '角色立绘/青萝.png',
        '影雀': '角色立绘/影雀.png',

        // --- 2. 关押中立绘 (关押中立绘/) ---
        '白雪莲-关押中': '关押中立绘/白雪莲-关押中.png',
        '薛霜灵-关押中': '关押中立绘/薛霜灵-关押中.png',
        '丹娘-关押中': '关押中立绘/丹娘-关押中.png',
        '裴丹杏-关押中': '关押中立绘/丹娘-关押中.png',
        '丹杏-关押中': '关押中立绘/丹娘-关押中.png',
        '玉娘-关押中': '关押中立绘/玉娘-关押中.png',
        '裴玉青-关押中': '关押中立绘/玉娘-关押中.png',
        '裴青玉-关押中': '关押中立绘/玉娘-关押中.png',
        '潇潇-关押中': '关押中立绘/玉娘-关押中.png',
        '白玉莲-关押中': '关押中立绘/白玉莲-关押中.png',
        '谢云素-关押中': '关押中立绘/谢云素-关押中.png',
        '谢长老-关押中': '关押中立绘/谢云素-关押中.png',
        '郡主-关押中': '关押中立绘/郡主-关押中.png',
        '朱仪瑄-关押中': '关押中立绘/郡主-关押中.png',
        '宁安郡主-关押中': '关押中立绘/郡主-关押中.png',
        '仪瑄-关押中': '关押中立绘/郡主-关押中.png',
        '青萝-关押中': '关押中立绘/青萝-关押中.png'
      }
    },
    maps: {
      baseUrl: '',
      images: [
        { id: 'world', label: '大地图', file: '' },
        { id: 'prison', label: '黑狱图', file: '' }
      ]
    }
  };

  ZYXConfig.roster=[{"key": "bailian", "name": "白雪莲", "tag": "bailian_state", "aliases": [], "portraitKey": "白雪莲-关押中", "profile": "罗霄派亲传弟子、刑部捕盗司巡按女捕快。原设境界：通明。"}, {"key": "shuangling", "name": "薛霜灵", "tag": "shuangling_state", "aliases": [], "portraitKey": "薛霜灵-关押中", "profile": "白莲教左路信使。原设境界：冲脉。"}, {"key": "danniang", "name": "裴丹杏", "tag": "danniang_state", "aliases": ["丹娘"], "portraitKey": "丹娘-关押中", "profile": "杏花村客栈掌柜，白雪莲与白玉莲之母；又称丹娘。"}, {"key": "yuniang", "name": "裴青玉", "tag": "yuniang_state", "aliases": ["玉娘", "潇潇"], "portraitKey": "玉娘-关押中", "profile": "罗霄山徐家遗孀，丹娘亲妹；又称玉娘、潇潇。"}, {"key": "baiyulian", "name": "白玉莲", "tag": "baiyulian_state", "aliases": [], "portraitKey": "白玉莲-关押中", "profile": "白雪莲胞妹，凡俗闺秀。"}, {"key": "xieyunsu", "name": "谢云素", "tag": "xieyunsu_state", "aliases": [], "portraitKey": "谢云素-关押中", "profile": "罗霄派宿老。原设境界：绝顶·先天初境圆满。"}, {"key": "junzhu", "name": "朱仪瑄", "tag": "junzhu_state", "aliases": ["郡主", "宁安郡主", "宣姑娘"], "portraitKey": "郡主-关押中", "profile": "宁安郡主，又称宣姑娘。原设境界：凡骨初阶。"}, {"key": "qingluo", "name": "青萝", "tag": "qingluo_state", "aliases": ["影雀"], "portraitKey": "青萝-关押中", "profile": "郡主近卫，又称影雀。原设境界：入微·真气贯通。"}];
  root.ZYX_HUD_CONFIG = ZYXConfig;
  root.ZYX = root.ZYX || {};
  root.ZYX.Config = ZYXConfig;

  /**
   * 酒馆会把消息内所有 class 统一改写成 custom- 前缀（CSS 侧同样被改写），
   * 但运行时用 JS 新建的节点不会过这道改造，所以动态类名必须自己补前缀，否则样式失配。
   */
  root.ZYXClass = function (name) {
    let prefix = '';
    try {
      const doc = root.document;
      const hud = doc?.querySelector?.('[data-zyx-hud]');
      const tokens = (hud?.getAttribute?.('class') || '').split(/\s+/);
      if (tokens.includes('custom-zyx-hud')) prefix = 'custom-';
    } catch (_) { /* 跨源或非 DOM 环境按原样输出 */ }
    return prefix + name;
  };

  if (typeof module === 'object' && module.exports) {
    module.exports = ZYXConfig;
  }
})(typeof window !== 'undefined' ? window : globalThis);
