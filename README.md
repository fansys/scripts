# 插件仓库

本仓库将插件脚本与平台订阅配置分开管理。插件相关文件统一放在 `Scripts` 中，平台订阅文件引用对应插件的 JavaScript 文件。

## 目录结构

```text
.
├── README.md
├── Scripts/
│   ├── README.md
│   ├── Rewrite_lhie1/
│   │   ├── README.md
│   │   ├── upstream.conf
│   │   ├── request-header.js
│   │   ├── request-header.js.in
│   │   ├── build.cjs
│   │   ├── LICENSE
│   │   └── tests/
│   ├── emby/
│   │   ├── README.md
│   │   ├── emby.js
│   │   └── tests/
│   ├── g1-acq/
│   │   ├── README.md
│   │   ├── g1-acq.js
│   │   ├── g1-sku-report.js
│   │   └── tests/
│   └── lingoDuo/
│       ├── README.md
│       ├── lingoDuo.js
│       └── tests/
├── QuantumultX/
│   ├── README.md
│   ├── Rewrite_lhie1.conf
│   ├── emby.conf
│   ├── g1-acq.conf
│   └── lingoDuo.conf
├── Loon/
│   ├── README.md
│   ├── Rewrite_lhie1.plugin
│   ├── emby.plugin
│   ├── g1-acq.plugin
│   └── lingoDuo.plugin
└── Shadowrocket/
    ├── README.md
    ├── Rewrite_lhie1.sgmodule
    ├── emby.sgmodule
    ├── g1-acq.sgmodule
    └── lingoDuo.sgmodule
```

## 插件与订阅

| 插件 | 功能 | Quantumult X | Loon | Shadowrocket |
| --- | --- | --- | --- | --- |
| [G1 ACQ](./Scripts/g1-acq/README.md) | Google One SKU 采集、三档商品编号改写、本机报告与 JSON 导出 | [订阅](https://cdn.jsdelivr.net/gh/fansys/scripts@main/QuantumultX/g1-acq.conf) | [订阅](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Loon/g1-acq.plugin) | [订阅](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Shadowrocket/g1-acq.sgmodule) |
| [lingoDuo](./Scripts/lingoDuo/README.md) | Duolingo 会员字段改写及可选增强功能 | [订阅](https://cdn.jsdelivr.net/gh/fansys/scripts@main/QuantumultX/lingoDuo.conf) | [订阅](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Loon/lingoDuo.plugin) | [订阅](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Shadowrocket/lingoDuo.sgmodule) |
| [Emby](./Scripts/emby/README.md) | 五个注册相关接口的本地 JSON 响应 | [订阅](https://cdn.jsdelivr.net/gh/fansys/scripts@main/QuantumultX/emby.conf) | [订阅](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Loon/emby.plugin) | [订阅](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Shadowrocket/emby.sgmodule) |
| [Rewrite_lhie1](./Scripts/Rewrite_lhie1/README.md) | 451 条历史重写规则：重定向、请求头改写及广告请求拒绝 | [订阅](https://cdn.jsdelivr.net/gh/fansys/scripts@main/QuantumultX/Rewrite_lhie1.conf) | [订阅](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Loon/Rewrite_lhie1.plugin) | [订阅](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Shadowrocket/Rewrite_lhie1.sgmodule) |

链接按 `fansys/scripts` 的 `main` 分支生成；文件推送到该分支且仓库公开可访问后生效。每个平台的导入方法见下方目录说明。

## 维护约定

- [`Scripts`](./Scripts/README.md) 是公共脚本目录，每个插件使用独立子目录，插件相关文件全部放在对应目录中。
- [`QuantumultX`](./QuantumultX/README.md)、[`Loon`](./Loon/README.md)、[`Shadowrocket`](./Shadowrocket/README.md) 是平台订阅目录。每个插件在每个平台各维护一个独立订阅配置，引用 `Scripts` 下的插件 JavaScript 文件；不使用合并所有插件的 `Plugins` 配置。
- 根目录、`Scripts`、每个插件目录和每个平台订阅目录均维护各自的 `README.md`。
- 本仓库订阅及脚本下载地址统一使用 `https://cdn.jsdelivr.net/gh/fansys/scripts@main/`。
- 插件目录的 README 说明插件用途、文件作用、配置方式及使用方法；平台目录的 README 说明对应订阅文件的用途和导入方式。

## 验证

使用 Node.js 18 或更新版本，在仓库根目录执行：

```sh
node --test Scripts/*/tests/*.test.cjs
```
