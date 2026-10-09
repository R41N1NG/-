/* gpt：在用户指定的隔离完整项目中安装、打包、测试、stage及两道入口门禁；非零即停，不部署。 */
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
function runSteps(steps,run){for(const step of steps)run(step);}
function main(){
 const targetArg=process.argv[2];if(!targetArg)throw Error('用法：node 隔离接入.cjs 隔离项目根目录 [--apply]');
 const target=path.resolve(targetArg),here=__dirname,apply=process.argv.includes('--apply');
 const stage=path.join(target,'_staging_correction_gpt_v12');
 const required=['tools/pipeline/_pack_panel_script.mjs','_build_card.js','tools/checks/_chk_status_missing.mjs','tools/checks/_chk_stage_drive.mjs'];
 for(const name of required)if(!fs.existsSync(path.join(target,name)))throw Error('不是完整项目，缺少：'+name);
 const steps=[[path.join(here,'应用候选.cjs'),target]];
 if(apply)steps.push([path.join(here,'应用候选.cjs'),target,'--apply'],['tools/pipeline/_pack_panel_script.mjs'],
  ['--test',...['transactions','runtime-integration','contract'].map(n=>path.join(here,'tests',n+'.test.cjs'))],
  ['_build_card.js','--stage',stage],['tools/checks/_chk_status_missing.mjs','--card',path.join(stage,'仙姝堕.json')],
  ['tools/checks/_chk_stage_drive.mjs','--card',path.join(stage,'仙姝堕.json')]);
 runSteps(steps,args=>{console.log('执行：'+JSON.stringify(args));execFileSync(process.execPath,args,{cwd:target,stdio:'inherit'});});
 console.log(apply?'隔离接入及两道入口门禁通过；其余门禁、资源/载荷和真机检查仍须完成，未发布/部署。':'预检通过，未安装/构建。');
}
module.exports={runSteps};
if(require.main===module){try{main();}catch(e){console.error('已停止，禁止继续后续构建或部署：'+e.message);process.exitCode=1;}}
