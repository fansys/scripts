# 公共脚本

此目录保存各平台共用的插件脚本。

## 维护约定

- 每个插件使用一个独立目录。
- 插件脚本、配置、资源及其他相关文件全部放在对应插件目录中。
- 每个插件目录必须包含 `README.md`，说明插件用途、文件作用、配置方式及使用方法。
- 平台订阅文件直接引用此目录中的插件 JavaScript 文件。
- 本仓库订阅及脚本下载地址统一使用 jsDelivr，作者署名保留上游作者，并在插件列表中记录原始地址。

## 插件列表

| 插件 | 说明 | 平台 | 原始地址 |
| --- | --- | --- | --- |
| [G1 ACQ](./g1-acq/README.md) | Google One 原始 SKU 采集、2TB / 20TB / 30TB 商品编号改写、本机报告与 JSON 导出 | Quantumult X、Loon、Shadowrocket | [crhywun/g1-acq](https://github.com/crhywun/g1-acq) |
| [lingoDuo](./lingoDuo/README.md) | Duolingo iOS 会员字段改写，可选经验倍数、关卡解锁、限时挑战时长和部分关卡直接通关 | Quantumult X、Loon、Shadowrocket | [TAKAGIVEGETA/MyScripts/lingoDuo](https://github.com/TAKAGIVEGETA/MyScripts/tree/main/lingoDuo) |
| [Emby](./emby/README.md) | Emby 五个注册相关接口的本地 JSON 响应 | Quantumult X、Loon、Shadowrocket | [qiangxinglin/Emby 原始订阅](https://cdn.jsdelivr.net/gh/qiangxinglin/Emby@main/QuantumultX/emby.conf) |
| [Rewrite_lhie1](./Rewrite_lhie1/README.md) | 451 条历史重写规则，保留上游快照并适配请求头改写 | Quantumult X、Loon、Shadowrocket | [NobyDa/Script/Rewrite_lhie1.conf](https://github.com/NobyDa/Script/blob/master/QuantumultX/Rewrite_lhie1.conf) |
