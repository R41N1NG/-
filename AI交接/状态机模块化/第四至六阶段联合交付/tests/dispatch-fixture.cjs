'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const correctionFactory = require('./fixtures/correction-runtime.js');
const SOURCE = path.join(__dirname, '../候选源码/src/state-machine');
const quiet = Object.freeze({log(){}, warn(){}, error(){}, info(){}});
function readSource(relative) { return fs.readFileSync(path.join(SOURCE, relative), 'utf8'); }
function loadFactory(relative, name) {
  const context = {console:quiet, Promise, setTimeout, clearTimeout};
  vm.runInNewContext(readSource(relative)+'\nthis.result='+name+';', context, {filename:relative});
  return context.result;
}
function defer() { let resolve, reject;const promise = new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject}; }
function setup(initial = {}) {
  const host = {}, service = correctionFactory(host);
  const context = {chatId:'A', chat:[{mes:'开场',is_user:false},{mes:'正文',is_user:false,swipe_id:0}]};
  const layers = {chat:{stat_data:service.clone(initial)},message:{stat_data:service.clone(initial)}};
  const writes = [];
  let mode = null;
  const api = {
    context:()=>context,
    getContext:()=>context,
    getLastMessageId:()=>context.chat.length-1,
    getChatMessages:(n)=>[context.chat[Number(n)]],
    getVariables:o=>service.clone(layers[o.type]),
    insertOrAssignVariables:async(payload,o)=>{
      writes.push({payload:service.clone(payload),options:{...o}});
      const action = mode && await mode(payload,o);
      if(action === 'false')return false;
      if(action === 'throw')throw Error('测试故障');
      if(action !== 'omit')layers[o.type] = service.merge(layers[o.type],payload);
      return true;
    }
  };
  host.__xsdCorrection = service;
  return {host,service,context,layers,writes,api,setMode:f=>{mode=f;}};
}
module.exports = {SOURCE,quiet,readSource,loadFactory,defer,setup};
/** Load real production fragments in their recorded order without bootstrap wiring. */
function loadEnvironment(x, extraExports = [], options = {}) {
  const manifest = JSON.parse(readSource('modules.json'));
  const excluded = new Set(['main.js','bootstrap/start.js','diagnostics/console.js']);
  if(options.includeMain)excluded.delete('main.js');
  const paths = manifest.modules.map(m=>m.path).filter(p=>!excluded.has(p));
  const window = x.host;
  window.parent = options.parent || window; window.top = options.top || window;
  window.SillyTavern = {...(window.SillyTavern || {}),getContext:()=>x.context};
  const timerCallbacks = new Map(); let timerSerial = 0;
  const sandbox = {
    window,console:quiet,structuredClone,
    setTimeout:fn=>{const id=++timerSerial;timerCallbacks.set(id,fn);return id;},
    clearTimeout:id=>timerCallbacks.delete(id),
    setInterval:fn=>{const id=++timerSerial;timerCallbacks.set(id,fn);return id;},
    clearInterval:id=>timerCallbacks.delete(id),
    ...x.api,
  };
  const names = ['API','ALL_FIELDS','DISPLAY_FIELDS','CAST_FIELD','readStatData','writeStat','parseStatusBlock','createXsdStatusApplication','XSD_STATUS_APPLICATION'].concat(extraExports);
  const text = paths.map(readSource).join('\n')+'\nthis.env={'+names.join(',')+'};';
  vm.runInNewContext(text,sandbox,{filename:'state-machine-fragments.test.js',timeout:5000});
  return {sandbox,env:sandbox.env,timerCallbacks};
}
module.exports.loadEnvironment = loadEnvironment;
