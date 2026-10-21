"use strict";
const fs = require("node:fs"), path = require("node:path");
const root = __dirname;
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "availability.js"), "utf8").replace(/<\/script/gi, "<\\/script");
if (!html.includes('<script src="availability.js"></script>')) throw new Error("缺少原型脚本入口");
fs.writeFileSync(path.join(root, "demo.html"), html.replace('<script src="availability.js"></script>', () => '<script>\n' + script + '\n</script>'), "utf8");
console.log("demo.html 已生成，可单文件离线打开。");
