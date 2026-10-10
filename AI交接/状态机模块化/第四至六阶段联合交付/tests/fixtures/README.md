本目录由 gpt 下级独立复核代理保存测试依赖。

`correction-runtime.js` 原样取自 `card-project@538532f99e44aebdacc4342f7486f5f5188a7681:src/correction-runtime.js`，SHA-256 为 `1d07f7aab5f5b90b3744adc9b5d4a84cbd2e6d8e4a58231cb1b0a471b525b245`。测试调用其真实的双层队列、写入、回读与补偿，不另造持久化实现，也不发布为角色卡源文件。

宿主变量层和事件源由测试夹具模拟；这些测试不等于实际 SillyTavern 部署验收。
