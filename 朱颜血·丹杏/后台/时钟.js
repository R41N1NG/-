'use strict';
// gpt：固定30日/月的纯函数台历。按原EJS阈值，首幕实际49天；原注释“50天”差一日。
const ACTS=Object.freeze([
 {act:1,start:1,term:'暮春初夏',phase:'禁令严颁'},
 {act:2,start:50,term:'仲夏入伏',phase:'巡抚开阖'},
 {act:3,start:110,term:'盛夏大暑',phase:'塞北巡边'},
 {act:4,start:170,term:'金秋霜降',phase:'督办考课'},
 {act:5,start:230,term:'初冬岁末',phase:'案牍定谳'}
].map(Object.freeze));
const digits='零一二三四五六七八九';
function numeral(raw){
 const s=String(raw).replace(/两/g,'二').replace(/〇/g,'零');
 if(/^\d+$/.test(s)){const n=Number(s);return Number.isSafeInteger(n)?n:null;}
 if(!/^[零一二三四五六七八九十百千万]+$/.test(s))return null;
 if(!/[十百千万]/.test(s)){const n=Number([...s].map(c=>digits.indexOf(c)).join(''));return Number.isSafeInteger(n)?n:null;}
 let total=0,section=0,n=0,last=10000;
 for(const c of s){if(digits.includes(c)){if(n!==0)return null;n=digits.indexOf(c);continue;}const unit={十:10,百:100,千:1000,万:10000}[c];if(unit===10000){total+=(section+n)*unit;section=0;n=0;last=10000;}else{if(unit>=last)return null;section+=(n||1)*unit;n=0;last=unit;}}
 const result=total+section+n;return Number.isSafeInteger(result)?result:null;
}
function chinese(n){if(n<10)return digits[n];if(n<20)return '十'+(n%10?digits[n%10]:'');if(n<100)return digits[Math.floor(n/10)]+'十'+(n%10?digits[n%10]:'');if(n<10000){const unit=n>=1000?1000:100,label=unit===1000?'千':'百',rest=n%unit;return digits[Math.floor(n/unit)]+label+(rest?(rest<unit/10?'零':'')+chinese(rest):'');}return String(n);}
const dayText=n=>n<=10?'初'+chinese(n):n<20?'十'+digits[n%10]:n===20?'二十':n<30?'廿'+digits[n%10]:'三十';
function actForDay(dayIndex){if(!Number.isSafeInteger(dayIndex)||dayIndex<1)throw new RangeError('dayIndex必须为正安全整数');return ACTS.findLast(a=>dayIndex>=a.start);}
function format(time){return time.era+chinese(time.year)+'年'+chinese(time.month)+'月'+dayText(time.monthDay)+' '+String(time.hour).padStart(2,'0')+':'+String(time.minute).padStart(2,'0')+(time.second?':'+String(time.second).padStart(2,'0'):'');}
function make(dayIndex,hour,minute,second=0,precision=second?'second':'minute'){
 const absolute=3*30+dayIndex-1,year=5+Math.floor(absolute/360),month=Math.floor(absolute%360/30)+1,monthDay=absolute%30+1;
 const {act,term,phase}=actForDay(dayIndex);const state={era:'宣德',year,month,monthDay,hour,minute,second,precision,dayIndex,act,term,phase};
 return {...state,yearName:chinese(year)+'年',monthName:chinese(month)+'月',dayName:dayText(monthDay),shichen:'子丑寅卯辰巳午未申酉戌亥'[Math.floor(((hour+1)%24)/2)]+'时',dateText:'宣德'+chinese(year)+'年'+chinese(month)+'月'+dayText(monthDay),timeText:String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0')+(second?':'+String(second).padStart(2,'0'):''),formatted:format(state)};
}
function parseElapsed(value){
 if(typeof value!=='string')return null;
 const text=value.trim().replace(/\s+/g,'').replace(/个/g,'').replace(/整(?=日|天)/g,'').replace(/([\d零〇一二两三四五六七八九十百千万]+)半(分钟|刻钟|时辰|小时|日|天)/g,'$1$2半');
 if(!text)return null;
 const re=/(半|\d+(?:\.\d+)?|[零〇一二两三四五六七八九十百千万]+)(分钟|刻钟|时辰|小时|日|天)(半)?/gy;
 let end=0,total=0,match;const units=new Set();
 while((match=re.exec(text))){if(match.index!==end)return null;end=re.lastIndex;const unit={分钟:1,刻钟:15,时辰:120,小时:60,日:1440,天:1440}[match[2]];if(units.has(unit))return null;units.add(unit);let n=match[1]==='半'?0.5:/^\d/.test(match[1])?Number(match[1]):numeral(match[1]);if(n===null||!Number.isFinite(n)||n<0||match[1]==='半'&&match[3])return null;if(match[3])n+=0.5;total+=n*unit;if(!Number.isSafeInteger(total*60))return null;}
 return end===text.length?total:null;
}
function parseAnchor(value){
 if(typeof value!=='string')return null;
 const m=value.trim().match(/^宣德([\d零〇一二两三四五六七八九十百千万]+)年([\d一二两三四五六七八九十]+)月(初?[\d一二三四五六七八九十]+|廿[一二三四五六七八九]?|三十)(?:日)?(?:\s*(.*))?$/);
 if(!m)return null;const year=numeral(m[1]),month=numeral(m[2]),day=numeral(m[3].replace(/^初/,'').replace(/^廿/,'二十'));
 if(year===null||year<5||month===null||month<1||month>12||day===null||day<1||day>30)return null;
 const tail=m[4]||'',hm=tail.match(/(?:^|\s)(\d{1,2}):(\d{2})(?:$|\s)/),period=tail.match(/([子丑寅卯辰巳午未申酉戌亥])时/);
 let hour,minute;if(hm){hour=Number(hm[1]);minute=Number(hm[2]);if(hour>23||minute>59)return null;}else if(period){hour=({子:23,丑:1,寅:3,卯:5,辰:7,巳:9,午:11,未:13,申:15,酉:17,戌:19,亥:21})[period[1]];minute=0;}else return null;
 // 日期明确优先，但不接受无意义的尾部内容。
 if(tail.replace(/\d{1,2}:\d{2}/g,'').replace(/[子丑寅卯辰巳午未申酉戌亥]时/g,'').trim())return null;
 const dayIndex=(year-5)*360+(month-4)*30+day;if(!Number.isSafeInteger(dayIndex)||dayIndex<1||!Number.isSafeInteger((dayIndex-1)*86400+hour*3600+minute*60))return null;
 return make(dayIndex,hour,minute,0,hm?'minute':'shichen');
}
function advance(state,minutes){
 if(!state||!Number.isFinite(minutes)||!Number.isSafeInteger(minutes*60)||minutes<0||!Number.isSafeInteger(state.dayIndex)||state.dayIndex<1||!Number.isInteger(state.hour)||state.hour<0||state.hour>23||!Number.isInteger(state.minute)||state.minute<0||state.minute>59||!Number.isInteger(state.second??0)||(state.second??0)<0||(state.second??0)>59)throw new RangeError('时间与耗时须有效，耗时为非负分钟且总秒数为安全整数');
 const sum=(state.dayIndex-1)*86400+state.hour*3600+state.minute*60+(state.second??0)+minutes*60;
 if(!Number.isSafeInteger(sum))throw new RangeError('时间溢出');
 return make(Math.floor(sum/86400)+1,Math.floor(sum%86400/3600),Math.floor(sum%3600/60),sum%60,minutes===0?state.precision:sum%60?'second':'minute');
}
module.exports={ACTS,parseElapsed,parseAnchor,advance,actForDay,format};
