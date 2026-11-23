# G1 ACQ

Google One（iOS）原始 SKU 采集与商品编号改写工具，支持 Quantumult X、Loon 和 Shadowrocket，并提供本机 HTML 报告、最近 10 次响应诊断及 JSON 导出。

来源：[crhywun/g1-acq](https://github.com/crhywun/g1-acq)，引入版本：[v7.5.0](https://github.com/crhywun/g1-acq/tree/v7.5.0)。保留上游的采集与商品映射逻辑，新增 Quantumult X 存储接口和本地报告响应格式适配；Loon、Shadowrocket 使用原生 `$persistentStore` 和请求阶段本地响应。本地存储键沿用上游，已有同应用记录可继续读取；三个应用的存储相互独立。

## 文件

| 文件 | 用途 |
| --- | --- |
| [icon.png](./icon.png) | Google 单字母 G 图标，来自 Koolson/Qure（[原始地址](https://github.com/Koolson/Qure/blob/master/IconSet/Color/Google_Search.png)），供三平台订阅引用 |
| [g1-acq.js](./g1-acq.js) | 从原始响应采集 SKU，执行三档映射并记录诊断 |
| [g1-sku-report.js](./g1-sku-report.js) | 在请求阶段生成本机报告，支持 JSON 导出和手动清空记录 |
| [tests/compatibility.test.cjs](./tests/compatibility.test.cjs) | 三个平台的模拟宿主测试及订阅路径验证 |

平台目录仅保存各插件的订阅配置及平台 README，插件脚本与测试均放在本目录。

## 订阅链接

| 平台 | 独立订阅配置 | 导入说明 |
| --- | --- | --- |
| Quantumult X | [g1-acq.conf](https://cdn.jsdelivr.net/gh/fansys/scripts@main/QuantumultX/g1-acq.conf) | [远程重写资源](../../QuantumultX/README.md) |
| Loon | [g1-acq.plugin](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Loon/g1-acq.plugin) | [插件](../../Loon/README.md)，需 3.5.1（983）或更新版本 |
| Shadowrocket | [g1-acq.sgmodule](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Shadowrocket/g1-acq.sgmodule) | [模块](../../Shadowrocket/README.md) |

链接对应 `fansys/scripts` 的 `main` 分支。配置及脚本全部推送且公开可访问后才能远程安装。订阅引用本仓库脚本，不依赖上游仓库的脚本地址。

## 行为与映射

- 采集范围：`https://one.google.com/` 下的文字响应，跳过本地报告。先采集原始编号，再执行改写；保留最多 300 个去重 SKU，并累计重复出现次数。
- 改写范围：仅 `https://one.google.com/ai?`，按完整商品编号匹配。
- 诊断记录：保留最近 10 次响应的时间、路径分类及计数；不保存查询参数或完整正文。

| 原始 SKU | 默认目标 | 备用目标 |
| --- | --- | --- |
| `g1.ios.2tb.` 前缀的完整 SKU | `g1.2tb.ai.12months_ip_90p` | 无 |
| `g1.ios.20tb.m.v2` | `g1.20tb.3months_ip_90p.acq` | `g1.20tb.3months_ip_75p.acq` |
| `g1.ios.30tb.ai.pro.m` | `g1.ai.ultra.3months_ip_90p.acq` | `g1.ai.ultra.3months_ip_75p.acq` |

20TB / 30TB 各自判断原始响应：默认目标缺失、备用目标存在时改用备用目标；默认目标存在或两个目标都缺失时使用默认目标。

商品编号改写不代表商品可购买；商品名称、权益、实际金额与扣款周期需以 App Store 购买面板和 Google One 账户为准。采集只读取实际收到的响应，不主动查询完整商品目录。

## 使用

1. 选择正在使用的平台导入对应配置，开启脚本或重写功能及 HTTPS 解密，安装并信任证书，核对解密域名 `one.google.com`。
2. 停用同类旧版采集器或改写副本，更新脚本并重新连接。
3. 打开 Google App 的 Google One 管理页面，浏览实际提供的 2TB / Pro、20TB 或 30TB 方案。
4. 在 Safari 打开 [本机报告](https://one.google.com/g1-sku-report)，核对“本机脚本已接管”、响应计数、时间及改写记录。
5. 点击“导出 JSON”，或直接打开 [JSON 导出](https://one.google.com/g1-sku-report?format=json)。

报告地址由当前应用在本机拦截生成，需保持对应平台运行。`?clear=1` 会手动清空本工具的 `g1.sku.scan.v1` 和 `g1.pro.annual.test.v1` 两个存储键。

本仓库订阅仅声明脚本与解密域名，未自动引入上游的全局 UDP 443 拦截规则。若连接使用 HTTP/3 导致未命中脚本，按对应平台 README 处理 QUIC 并重新连接。

报告显示 Google 页面或 404 时，检查插件开关、证书信任、解密域名及 VPN 连接；计数没有增长时检查缓存、QUIC 及日志中的 `saved=no`。重复 SKU 只增加次数，不会增加清单条数。

## 验证

在仓库根目录使用 Node.js 18 或更新版本执行：

```sh
node --test Scripts/g1-acq/tests/compatibility.test.cjs
```

测试覆盖三档改写与独立回退、采集去重与容量、响应历史、URL 范围、存储异常、旧记录兼容、三平台报告格式、JSON 导出、清空记录及订阅脚本引用。离线模拟不包含 iOS 客户端实机和 App Store 购买验证。
