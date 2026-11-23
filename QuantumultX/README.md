# QuantumultX 订阅

此目录维护 Quantumult X 平台的远程重写订阅，每个插件一个 `.conf` 文件。

## 维护约定

- 每个插件使用独立订阅配置，不合并为 `Plugins` 文件。
- 订阅文件引用 [`Scripts`](../Scripts/README.md) 下的插件 JavaScript 文件。
- 插件相关文件统一保存在对应的 `Scripts/<插件名称>/` 目录中。
- 添加订阅文件时，在本 README 中补充文件说明、订阅地址和导入方式。

## G1 ACQ

配置：[g1-acq.conf](./g1-acq.conf)。功能与使用流程见 [插件说明](../Scripts/g1-acq/README.md)。

订阅地址：

```text
https://raw.githubusercontent.com/fansys/scripts/main/QuantumultX/g1-acq.conf
```

1. 将地址添加到 Quantumult X 的远程重写资源，启用资源及重写功能。此地址是重写订阅，不是节点订阅或完整主配置。
2. 开启 HTTPS 解密，安装并信任证书，确认解密域名包含 `one.google.com`。
3. 更新资源及脚本，重新连接，再从 Google App 打开 Google One 方案页。
4. 在 Safari 打开 `https://one.google.com/g1-sku-report` 查看本机报告。

也可在现有配置的 `[rewrite_remote]` 中添加：

```ini
https://raw.githubusercontent.com/fansys/scripts/main/QuantumultX/g1-acq.conf, tag=G1 ACQ, enabled=true
```

若请求使用 QUIC 而未进入重写，可在现有 `[general]` 的 `udp_drop_list` 中追加 `QUIC`，保留已有值。该设置影响全部 QUIC 流量，订阅不会自动修改它。参见 [Quantumult X 官方配置示例](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf)。

地址按 `main` 分支生成，推送并公开文件后可用。
