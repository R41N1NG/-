# 地图标注字体

`map-ink.woff` 是基于 Noto Serif CJK SC 的固定地图标注字符子集，字体家族重命名为 OKH Map Ink；未调整字形轮廓。用于地名、房门姓名和固定地图小标题，动态叙事正文仍使用原字体与回退。

来源：https://github.com/notofonts/noto-cjk

原字形版权：© 2017–2024 Adobe。以 SIL Open Font License 1.1 分发，完整授权见 [OFL.txt](OFL.txt)，也保存在字体元数据内。

构建脚本会把字体内嵌进运行库，无需外部字体网络请求。当前子集覆盖固定标注，新增地名时应更新子集，或让未收录字符使用系统衬线字体回退。
