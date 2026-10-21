import { spawn } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..", "..");
const CHROME = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9445;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const src = readFileSync(join(ROOT, "状态栏.html"), "utf8");
const probe = `<style>dialog.wx-dialog:not([open]){display:none!important} *{animation:none!important;transition:none!important}</style>
<script>
setInterval(()=>{const c=document.getElementById('wx-create-dialog'); if(c&&c.open){try{c.close()}catch(e){}} const z=document.getElementById('zeroChip'); if(z){z.hidden=true;z.style.display='none';}},200);
setTimeout(()=>{ document.getElementById('heartPillBtn')?.click(); }, 2400);
setTimeout(()=>{
  const box=(id)=>{const e=document.getElementById(id); if(!e)return null; const r=e.getBoundingClientRect(); const cs=getComputedStyle(e); return {x:Math.round(r.x),w:Math.round(r.width),display:cs.display,w_css:cs.width};};
  const card=document.getElementById('heartPopoverCard');
  const out={viewport:innerWidth, card:card?{x:Math.round(card.getBoundingClientRect().x),w:Math.round(card.getBoundingClientRect().width),h:Math.round(card.getBoundingClientRect().height)}:null,
    content:box('heartPopoverCard'), dial:document.querySelector('.heart-dial')?{w:Math.round(document.querySelector('.heart-dial').getBoundingClientRect().width)}:null,
    stamina:(()=>{const e=document.getElementById('fullStaminaBox'); return e?{w:Math.round(e.getBoundingClientRect().width)}:null})(),
    spark:(()=>{const e=document.querySelector('.spark'); return e?{w:Math.round(e.getBoundingClientRect().width)}:null})(),
    audio:(()=>{const e=document.querySelector('.audio-btn'); return e?{w:Math.round(e.getBoundingClientRect().width)}:null})()};
  const pre=document.createElement('pre'); pre.id='probe'; pre.textContent=JSON.stringify(out); document.body.appendChild(pre);
}, 3200);
</` + `script>`;
const file = join(here, "probe_heart.html");
writeFileSync(file, src.replace("</html>", probe + "\n</html>"), "utf8");
const proc = spawn(CHROME, ["--headless=new","--no-sandbox","--disable-gpu","--disable-breakpad","--hide-scrollbars","--allow-file-access-from-files",`--user-data-dir=${join(here,"ud-shot2")}`,`--remote-debugging-port=${PORT}`,"--window-size=390,844","about:blank"], { stdio: "ignore" });
let list=null; for(let i=0;i<100;i++){try{const r=await fetch(`http://127.0.0.1:${PORT}/json/list`); if(r.ok){list=await r.json();break;}}catch(e){} await sleep(150);}
const page=list.find(t=>t.type==="page");
const ws=new WebSocket(page.webSocketDebuggerUrl); let id=0; const waiters=new Map();
ws.addEventListener("message",ev=>{const m=JSON.parse(ev.data); if(m.id&&waiters.has(m.id)){waiters.get(m.id)(m); waiters.delete(m.id);}});
await new Promise((res,rej)=>{ws.addEventListener("open",res);ws.addEventListener("error",rej);});
const send=(method,params={})=>{const i=++id; ws.send(JSON.stringify({id:i,method,params})); return new Promise(r=>waiters.set(i,r));};
await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:false});
await send("Page.navigate",{url:"file:///"+file.replace(/\\/g,"/").replace(/ /g,"%20")});
await sleep(4200);
const r=await send("Runtime.evaluate",{expression:"document.getElementById('probe')?.textContent||'none'",returnByValue:true});
console.log(r.result.result.value);
const shot=await send("Page.captureScreenshot",{format:"png"});
if(shot.result&&shot.result.data){writeFileSync(join(here,"shot_heart390.png"),Buffer.from(shot.result.data,"base64")); console.log("shot ok");}
proc.kill();
