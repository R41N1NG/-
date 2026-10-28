"use strict";
const fs = require("node:fs"),
  path = require("node:path");
// 真UI原图与DOM框选；不绘制替代界面，不修改图片。
function createLessonCapture({ b, width, out, shots }) {
  return async function capture(id, selectors, regions) {
    await b.evaluate(
      "document.fonts.ready.then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))",
    );
    await b.delay(300);
    const data = await b.evaluate(
      `(()=>{const rect=s=>{const e=document.querySelector(s);if(!e)throw Error('缺少原图元素 '+s);const r=e.getBoundingClientRect();if(r.width<4||r.height<4)throw Error('无面积 '+s);return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}};const a=${JSON.stringify(selectors)}.map(rect),x=Math.min(...a.map(r=>r.x)),y=Math.min(...a.map(r=>r.y)),clip={x,y,width:Math.max(...a.map(r=>r.x+r.width))-x,height:Math.max(...a.map(r=>r.y+r.height))-y};return{clip,boxes:${JSON.stringify(regions)}.map(([s,title,note])=>{const r=rect(s);return{title,note,left:(r.x-x)/clip.width*100,top:(r.y-y)/clip.height*100,width:r.width/clip.width*100,height:r.height/clip.height*100}})}})()`,
    );
    for (const r of data.boxes)
      if (
        r.left < -0.5 ||
        r.top < -0.5 ||
        r.left + r.width > 100.5 ||
        r.top + r.height > 100.5
      )
        throw Error("原图框选越界 " + id);
    const png = await b.send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false,
        clip: { ...data.clip, scale: 1 },
      }),
      key = id + (width === 390 ? "-mobile" : "");
    fs.writeFileSync(
      path.join(out, key + ".png"),
      Buffer.from(png.data, "base64"),
    );
    shots[key] = {
      src: "data:image/png;base64," + png.data,
      width: data.clip.width,
      height: data.clip.height,
      pixelRatio: 2,
      boxes: data.boxes,
    };
  };
}
module.exports = { createLessonCapture };
