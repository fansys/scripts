# Rewrite_lhie1

来自 NobyDa/Script 的 lhie1 历史重写规则合集，支持 Quantumult X、Loon 和 Shadowrocket。上游文件标注更新日期为 **2021-08-26**，本仓库于 2026-11-23 引入快照。

## 原始地址

- 原始配置：[NobyDa/Script/QuantumultX/Rewrite_lhie1.conf](https://github.com/NobyDa/Script/blob/master/QuantumultX/Rewrite_lhie1.conf)。
- 原始内容快照：[upstream.conf](./upstream.conf)。
- 上游仓库：[NobyDa/Script](https://github.com/NobyDa/Script)。作者署名保留 `lhie1, NobyDa`。
- 许可证：上游采用 GPLv3，本目录包含 [LICENSE](./LICENSE)。本目录的派生代码和生成配置标注 `GPL-3.0-only`，其他插件的许可按各自来源确定。

## 内容与适配

| 规则类型 | 条数 | 行为 |
| --- | --- | --- |
| `302` | 15 | 重定向 |
| `request-header` | 10 | 修改请求路径与 Host，或删除 `If-None-Match` |
| `reject` | 6 | 拒绝匹配请求 |
| `reject-img` | 417 | 返回空白图片 |
| `reject-dict` | 3 | 返回空 JSON 对象 |
| 合计 | 451 | 保留上游规则及其顺序 |

这是一个独立规则集。三份订阅分别保存平台原生的重定向和拒绝规则，10 条请求头规则引用本目录的公共脚本。Quantumult X 使用 `script-request-header`；Loon / Shadowrocket 在请求阶段修改 URL 和 Header。上游相同正则的重复规则保留原顺序，请求头脚本使用首条匹配规则。

上游正则、重定向目标及 MITM 域名列表沿用快照，没有根据当前网站重新整理。部分规则将请求转向其他域名；完整目标可在原始快照中查看。此文件包含较早的接口与第三方域名，离线转换验证不代表这些接口或目标目前仍可用。

## 文件

| 文件 | 用途 |
| --- | --- |
| [icon.png](./icon.png) | 广告过滤图标，来自 Koolson/Qure（[原始地址](https://github.com/Koolson/Qure/blob/master/IconSet/Color/Advertising.png)），供三平台订阅引用 |
| [upstream.conf](./upstream.conf) | 保存引入时的上游配置 |
| [request-header.js](./request-header.js) | 生成的三平台通用请求头脚本 |
| [request-header.js.in](./request-header.js.in) | 请求头脚本模板 |
| [build.cjs](./build.cjs) | 从原始快照生成公共脚本及三个独立订阅 |
| [tests/compatibility.test.cjs](./tests/compatibility.test.cjs) | 检查全量规则、顺序、脚本、域名及生成结果 |
| [LICENSE](./LICENSE) | GNU GPL v3 许可证正文 |

## 订阅链接

| 平台 | 独立订阅 | 导入位置 |
| --- | --- | --- |
| Quantumult X | [Rewrite_lhie1.conf](https://cdn.jsdelivr.net/gh/fansys/scripts@main/QuantumultX/Rewrite_lhie1.conf) | 远程重写资源 |
| Loon | [Rewrite_lhie1.plugin](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Loon/Rewrite_lhie1.plugin) | 插件管理；需 3.5.1（983）或更新版本 |
| Shadowrocket | [Rewrite_lhie1.sgmodule](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Shadowrocket/Rewrite_lhie1.sgmodule) | 模块管理 |

本仓库订阅与脚本下载均使用 jsDelivr，引用 `fansys/scripts` 的 `main` 分支。配置及脚本推送并公开后可用，更新还受 CDN 缓存影响。

## 使用

1. 在当前平台导入对应的独立订阅，启用重写或脚本功能。
2. 开启 HTTPS 解密，安装并信任该平台的证书。域名范围取自快照中的 `hostname` 列表；Shadowrocket 使用 `%APPEND%` 追加域名。
3. 避免同时启用重复的 lhie1 规则集，更新资源和脚本后重新连接。
4. 按实际应用逐项核对效果。遇到误拦截时，可停用此规则集或复制成本地配置后调整对应规则。

此订阅包含原生重写与脚本，不能作为节点订阅或完整主配置导入。规则对 HTTPS 路径生效还取决于请求是否进入解密范围。

## 维护与验证

使用 Node.js 18 或更新版本，在仓库根目录执行：

```sh
node Scripts/Rewrite_lhie1/build.cjs
node --test Scripts/Rewrite_lhie1/tests/compatibility.test.cjs
```

修改 `upstream.conf` 或脚本模板后重新生成；不要直接编辑三个生成的订阅或 `request-header.js`。生成器遇到未知规则类型会报错，避免静默丢失规则。

测试核对全部 451 条规则的类型与顺序、MITM 列表、脚本引用、生成结果可复现性，以及请求头改写与原始替换表达式的一致性。不包含 iOS 客户端实机或网站在线效果验证。
