# Shadowrocket 订阅

此目录维护 Shadowrocket 平台的模块订阅，每个插件一个 `.sgmodule` 文件。

## 维护约定

- 每个插件使用独立订阅配置，不合并为 `Plugins` 文件。
- 订阅文件引用 [`Scripts`](../Scripts/README.md) 下的插件 JavaScript 文件。
- 插件相关文件统一保存在对应的 `Scripts/<插件名称>/` 目录中。
- 添加订阅文件时，在本 README 中补充文件说明、订阅地址和导入方式。

## G1 ACQ

配置：[g1-acq.sgmodule](./g1-acq.sgmodule)。功能与使用流程见 [插件说明](../Scripts/g1-acq/README.md)。

订阅地址：

```text
https://raw.githubusercontent.com/fansys/scripts/main/Shadowrocket/g1-acq.sgmodule
```

1. 在 Shadowrocket 的模块管理中添加以上地址并启用。
2. 在当前配置的 HTTPS 解密设置中开启解密，安装并信任证书，确认域名列表包含 `one.google.com`。模块通过 `%APPEND%` 追加此域名。
3. 更新模块及脚本，重新连接，再从 Google App 打开 Google One 方案页。
4. 在 Safari 打开 `https://one.google.com/g1-sku-report` 查看本机报告。

若请求使用 HTTP/3 而未进入脚本，可参考上游，在当前配置的 `[Rule]` 中添加以下规则并重新连接：

```ini
AND,((PROTOCOL,UDP),(DEST-PORT,443)),REJECT-NO-DROP
```

此规则会影响全部 UDP 443 流量，本仓库模块不自动添加它。

地址按 `main` 分支生成，推送并公开文件后可用。
