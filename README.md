# 插件仓库

本仓库将插件脚本与平台订阅配置分开管理。插件相关文件统一放在 `Scripts` 中，平台订阅文件引用对应插件的 JavaScript 文件。

## 目录结构

```text
.
├── README.md
├── Scripts/
│   ├── README.md
│   └── g1-acq/
│       ├── README.md
│       ├── g1-acq.js
│       ├── g1-sku-report.js
│       └── tests/
├── QuantumultX/
│   ├── README.md
│   └── g1-acq.conf
├── Loon/
│   ├── README.md
│   └── g1-acq.plugin
└── Shadowrocket/
    ├── README.md
    └── g1-acq.sgmodule
```

## 插件与订阅

| 插件 | 功能 | Quantumult X | Loon | Shadowrocket |
| --- | --- | --- | --- | --- |
| [G1 ACQ](./Scripts/g1-acq/README.md) | Google One SKU 采集、三档商品编号改写、本机报告与 JSON 导出 | [订阅](https://raw.githubusercontent.com/fansys/scripts/main/QuantumultX/g1-acq.conf) | [订阅](https://raw.githubusercontent.com/fansys/scripts/main/Loon/g1-acq.plugin) | [订阅](https://raw.githubusercontent.com/fansys/scripts/main/Shadowrocket/g1-acq.sgmodule) |

链接按 `fansys/scripts` 的 `main` 分支生成；文件推送到该分支且仓库公开可访问后生效。每个平台的导入方法见下方目录说明。

## 维护约定

- [`Scripts`](./Scripts/README.md) 是公共脚本目录，每个插件使用独立子目录，插件相关文件全部放在对应目录中。
- [`QuantumultX`](./QuantumultX/README.md)、[`Loon`](./Loon/README.md)、[`Shadowrocket`](./Shadowrocket/README.md) 是平台订阅目录。每个插件在每个平台各维护一个独立订阅配置，引用 `Scripts` 下的插件 JavaScript 文件；不使用合并所有插件的 `Plugins` 配置。
- 根目录、`Scripts`、每个插件目录和每个平台订阅目录均维护各自的 `README.md`。
- 插件目录的 README 说明插件用途、文件作用、配置方式及使用方法；平台目录的 README 说明对应订阅文件的用途和导入方式。

## 验证

使用 Node.js 18 或更新版本，在仓库根目录执行：

```sh
node --test Scripts/g1-acq/tests/compatibility.test.cjs
```
