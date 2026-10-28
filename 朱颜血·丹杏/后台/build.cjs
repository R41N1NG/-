'use strict';
// gpt：静态CommonJS打包，无网络依赖与运行时eval。
const fs=require('node:fs'),path=require('node:path');
function bundle(entry=path.join(__dirname,'入口.js'),overrides={}){
 const modules=[],ids=new Map();
 function visit(file){file=path.resolve(file);if(ids.has(file))return ids.get(file);const id=modules.length;ids.set(file,id);modules.push('');
 let code=Object.hasOwn(overrides,file)?overrides[file]:fs.readFileSync(file,'utf8');
 if(file.endsWith('.json'))code='module.exports='+code+';';
 else code=code.replace(/require\((['"])([^'"]+)\1\)/g,(_,q,dep)=>{if(!dep.startsWith('.'))throw Error('只允许本地静态依赖');let target=path.resolve(path.dirname(file),dep);if(!path.extname(target))target+='.js';return 'require('+visit(target)+')';});
 modules[id]='function(require,module,exports){\n'+code+'\n}';return id;}
 const id=visit(entry);return '(function(){"use strict";const modules=['+modules.join(',\n')+'];const cache={};function load(id){if(cache[id])return cache[id].exports;const module=cache[id]={exports:{}};modules[id](load,module,module.exports);return module.exports;}load('+id+');})();';
}
if(require.main===module)fs.writeFileSync(path.join(__dirname,'后台脚本.js'),bundle());
module.exports={bundle};
