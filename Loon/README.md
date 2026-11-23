# Loon 订阅

此目录维护 Loon 平台的插件订阅，每个插件一个 `.plugin` 文件。

## 维护约定

- 每个插件使用独立订阅配置，不合并为 `Plugins` 文件。
- 订阅文件引用 [`Scripts`](../Scripts/README.md) 下的插件 JavaScript 文件。
- 插件相关文件统一保存在对应的 `Scripts/<插件名称>/` 目录中。
- 添加订阅文件时，在本 README 中补充文件说明、订阅地址和导入方式。

## G1 ACQ

配置：[g1-acq.plugin](./g1-acq.plugin)。功能与使用流程见 [插件说明](../Scripts/g1-acq/README.md)。

订阅地址：

```text
https://raw.githubusercontent.com/fansys/scripts/main/Loon/g1-acq.plugin
```

1. 使用 Loon 3.5.1（983）或更新版本，在插件管理中添加以上地址并启用。
2. 开启脚本与 MitM，安装并信任证书，确认解密域名包含 `one.google.com`。
3. 更新插件及脚本，重新连接，再从 Google App 打开 Google One 方案页。
4. 在 Safari 打开 `https://one.google.com/g1-sku-report` 查看本机报告。

配置采用 [Loon 官方新版 Script 语法](https://nsloon.app/docs/Script/script_v2/)。若请求使用 HTTP/3 而未进入脚本，需在当前配置中关闭或拦截 QUIC 后重新连接；插件只配置脚本与解密域名。

地址按 `main` 分支生成，推送并公开文件后可用。
