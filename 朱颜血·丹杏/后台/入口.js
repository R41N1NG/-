'use strict';
const {start}=require('./宿主适配.js');
const runtime=start({config:require('./规则.json')});
window.DanxingBackend=runtime;
window.addEventListener('pagehide',()=>runtime.dispose(),{once:true});
