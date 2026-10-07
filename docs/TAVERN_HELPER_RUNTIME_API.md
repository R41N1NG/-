# 酒馆助手 (TavernHelper) 运行时 API 架构与避坑手册

> **目的**：杜绝今后排查酒馆助手插件交互时重复对 1MB+ 混淆打包文件（`dist/index.js`）进行耗时逆向工程，将已探明的底层 API 签名、作用域机制与避坑规范固化为工程资产。

---

## 一、运行环境与作用域机制

### 1. 运行沙箱结构
* **卡内脚本执行环境**：运行在酒馆助手的独立 script iframe 中（`about:srcdoc`）；
* **宿主环境**：SillyTavern 主页面（`window.parent` / `window.top`）。

### 2. 词法作用域陷阱（ReferenceError 静默降级）
* **陷阱**：在 script iframe 中，TavernHelper 提供的 API 并未作为模块顶层变量直接声明在词法作用域中，而是挂载在 `window.TavernHelper` 或 `window.parent.TavernHelper` 上。
* **致命后果**：若直接书写 `() => getWorldbook`，JavaScript 引擎会抛出 `ReferenceError: getWorldbook is not defined`。若被 `try-catch` 静默吞掉，API 初始化全为 `null`，导致逻辑静默失效！
* **标准安全穿透解法**：
  ```javascript
  function getGlobalOrParent(name) {
    try { if (typeof window !== 'undefined' && typeof window[name] === 'function') return window[name]; } catch (e) {}
    try { if (typeof window !== 'undefined' && window.TavernHelper && typeof window.TavernHelper[name] === 'function') return window.TavernHelper[name]; } catch (e) {}
    try { if (typeof window !== 'undefined' && window.parent && window.parent.TavernHelper && typeof window.parent.TavernHelper[name] === 'function') return window.parent.TavernHelper[name]; } catch (e) {}
    try { if (typeof window !== 'undefined' && window.top && window.top.TavernHelper && typeof window.top.TavernHelper[name] === 'function') return window.top.TavernHelper[name]; } catch (e) {}
    try { if (typeof window !== 'undefined' && window.parent && typeof window.parent[name] === 'function') return window.parent[name]; } catch (e) {}
    try { if (typeof globalThis !== 'undefined' && typeof globalThis[name] === 'function') return globalThis[name]; } catch (e) {}
    return null;
  }
  ```

---

## 二、世界书相关 API 签名与真实返回值

### 1. `getCharWorldbookNames(name)`
* **调用方式**：`await TavernHelper.getCharWorldbookNames('current')`
* **真实返回格式**（⚠️ 易错点：**不是数组，而是对象**）：
  ```json
  {
    "primary": "仙姝堕",
    "additional": []
  }
  ```
* **正确解析范式**：
  ```javascript
  const r = await fn('current');
  if (Array.isArray(r)) {
    r.forEach(n => targets.add(n));
  } else if (r && typeof r === 'object') {
    if (r.primary) targets.add(r.primary);
    if (Array.isArray(r.additional)) r.additional.forEach(n => targets.add(n));
  }
  ```

### 2. `getWorldbook(name)`
* **调用方式**：`await TavernHelper.getWorldbook(name)`
* **返回格式**：包装后的 entries 数组 `[ { name: string, enabled: boolean, ... }, ... ]`
* **字段说明**：
  * 条目标题：`entry.name`（角色书规范下可能为 `entry.comment`，代码应双向兼容 `entry.name ?? entry.comment`）；
  * 启用状态：`entry.enabled`（布尔值，`true` 为启用，`false` 为禁用）。

### 3. `replaceWorldbook(name, entries, options)`
* **调用方式**：`await TavernHelper.replaceWorldbook(name, entries, { render: 'immediate' })`
* **底层源码逻辑**：
  ```javascript
  // TavernHelper 内部源码逻辑
  async function PH(name, entries, { render: mode = 'debounced' } = {}) {
    await saveWorldInfo(name, transformedEntries);
    switch (mode) {
      case 'debounced': gk(name); break; // 1秒防抖刷新
      case 'immediate': mk(name); break; // 立即触发 $('#world_editor_select').trigger('change')
    }
  }
  ```
* **核心避坑指南**：
  1. **必须显式传参 `{ render: 'immediate' }`**！默认的 `debounced` 延迟 1000ms，在快速切换或测试时会导致 UI 未刷新产生“未生效”的假象；
  2. **主动触发 UI 抽屉刷新**：
     ```javascript
     const $ = window.parent?.$ || window.$;
     if ($) $('#world_editor_select').trigger('change');
     ```
  3. **双轨原生兜底**：若 `replaceWorldbook` 异常，必须自动回退调用 SillyTavern 原生 `saveWorldInfo(name, rawInfo)`。

### 4. 条目属性双写规范（`enabled` 与 `disable`）
* **TavernHelper 规范**：使用 `e.enabled = true / false`；
* **SillyTavern 原生规范**：使用 `e.disable = false / true`；
* **双写铁律**：写回条目时**必须同时赋值两个字段**，确保无论通过哪种引擎加载都绝对生效：
  ```javascript
  e.enabled = want;
  e.disable = !want;
  ```

---

## 三、快速排查与诊断指引

若怀疑卡内世界书或状态机未正常工作，可直接在控制台敲击或通过脚本调用以下探针：
1. **核查环境 API 注入**：`window.TavernHelper` 或 `window.parent.TavernHelper`；
2. **核查当前条目开关**：运行 `node tools/checks/_chk_identity_sync.mjs`，0.1 秒离线判定；
3. **强制刷新酒馆内存**：在浏览器按 `Ctrl + F5`，防止酒馆旧内存状态覆盖磁盘。
