# 插件仓库

本仓库将插件脚本与平台订阅配置分开管理。插件相关文件统一放在 `Scripts` 中，平台订阅文件引用对应插件的 JavaScript 文件。

## 插件与订阅

| 插件 | 功能 | Quantumult X | Loon | Shadowrocket |
| --- | --- | --- | --- | --- |
| [G1 ACQ](./Scripts/g1-acq/README.md) | Google One SKU 采集、本机 SKU 映射管理、预制模板与 JSON 导出 | [订阅](https://cdn.jsdelivr.net/gh/fansys/scripts@main/QuantumultX/g1-acq.conf) | [订阅](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Loon/g1-acq.plugin) | [订阅](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Shadowrocket/g1-acq.sgmodule) |
| [lingoDuo](./Scripts/lingoDuo/README.md) | Duolingo 会员字段改写及可选增强功能 | [订阅](https://cdn.jsdelivr.net/gh/fansys/scripts@main/QuantumultX/lingoDuo.conf) | [订阅](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Loon/lingoDuo.plugin) | [订阅](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Shadowrocket/lingoDuo.sgmodule) |
| [Emby](./Scripts/emby/README.md) | 五个注册相关接口的本地 JSON 响应 | [订阅](https://cdn.jsdelivr.net/gh/fansys/scripts@main/QuantumultX/emby.conf) | [订阅](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Loon/emby.plugin) | [订阅](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Shadowrocket/emby.sgmodule) |
| [Rewrite_lhie1](./Scripts/Rewrite_lhie1/README.md) | 451 条历史重写规则：重定向、请求头改写及广告请求拒绝 | [订阅](https://cdn.jsdelivr.net/gh/fansys/scripts@main/QuantumultX/Rewrite_lhie1.conf) | [订阅](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Loon/Rewrite_lhie1.plugin) | [订阅](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Shadowrocket/Rewrite_lhie1.sgmodule) |
| [hongguo](./Scripts/hongguo/README.md) | 红果短剧广告及上报拦截，广告接口返回空 JSON | [订阅](https://cdn.jsdelivr.net/gh/fansys/scripts@main/QuantumultX/hongguo.conf) | [订阅](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Loon/hongguo.plugin) | [订阅](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Shadowrocket/hongguo.sgmodule) |

## 红果短剧去广告

[hongguo](./Scripts/hongguo/README.md) 拦截穿山甲广告、广告素材及埋点上报，对指定广告接口返回空 JSON，并拒绝下列广告 API 主机的 HTTP(S) 请求：

| 主机匹配（正则） | 处理 |
| --- | --- |
| `^ads[0-9]+-normal\.zijieapi\.com$` | REJECT |
| `^ads[0-9]+-normal-lq\.zijieapi\.com$` | REJECT |

三个平台均保留一个或多个数字的匹配限制，HTTPS 拒绝依赖 MITM。订阅入口见上表，解密范围和安装方式见 [插件说明](./Scripts/hongguo/README.md#平台适配)。

## 目录约定

- [`Scripts`](./Scripts/README.md) 是公共脚本目录，每个插件使用独立子目录，插件相关文件全部放在对应目录中。
- [`QuantumultX`](./QuantumultX/README.md)、[`Loon`](./Loon/README.md)、[`Shadowrocket`](./Shadowrocket/README.md) 是平台订阅目录。每个插件在每个平台各维护一个独立订阅配置，引用 `Scripts` 下的插件 JavaScript 文件。
- 根目录、`Scripts`、每个插件目录和每个平台订阅目录均维护各自的 `README.md`。
- 订阅、脚本及图标通过 jsDelivr 的 `@main` 地址提供。
- 插件目录的 README 说明插件用途、文件作用、配置方式及使用方法；平台目录的 README 说明对应订阅文件的用途和导入方式。

## 缓存清理

使用 [jsDelivr 缓存清理工具](./Scripts/jsdelivr-purge/README.md) 批量刷新订阅、脚本及图标缓存，支持按插件或路径筛选。

```sh
node Scripts/jsdelivr-purge/purge.cjs --dry-run
node Scripts/jsdelivr-purge/purge.cjs
```

## 验证

使用 Node.js 18 或更新版本，在仓库根目录执行：

```sh
node --test Scripts/*/tests/*.test.cjs
```
