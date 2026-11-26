# QuantumultX 订阅

此目录维护 Quantumult X 平台的远程重写订阅，每个插件一个 `.conf` 文件。

## 目录约定

- 每个插件使用一个独立订阅配置。
- 订阅文件引用 [`Scripts`](../Scripts/README.md) 下的插件 JavaScript 文件。
- 插件相关文件统一保存在对应的 `Scripts/<插件名称>/` 目录中。

## G1 ACQ

配置：[g1-acq.conf](./g1-acq.conf)。功能与使用流程见 [插件说明](../Scripts/g1-acq/README.md)。

订阅地址：

```text
https://cdn.jsdelivr.net/gh/fansys/scripts@main/QuantumultX/g1-acq.conf
```

1. 将地址添加到 Quantumult X 的远程重写资源，启用资源及重写功能。此地址是重写订阅，不是节点订阅或完整主配置。
2. 开启 HTTPS 解密，安装并信任证书，确认解密域名包含 `one.google.com`。
3. 更新资源及脚本，重新连接，再从 Google App 打开 Google One 方案页。
4. 在 Safari 打开 `https://one.google.com/g1-sku-report` 查看本机报告。

也可在现有配置的 `[rewrite_remote]` 中添加：

```ini
https://cdn.jsdelivr.net/gh/fansys/scripts@main/QuantumultX/g1-acq.conf, tag=G1 ACQ, enabled=true
```

在主配置的 `[general]` 中将 `443` 加入 `udp_drop_list`，保留原有条目。若已设置 `udp_whitelist`，其范围需包含 `443`，让该端口能由 `udp_drop_list` 处理。此设置适用于全部 UDP 443 流量。参见 [Quantumult X 官方配置示例](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf)。

## lingoDuo

配置：[lingoDuo.conf](./lingoDuo.conf)。功能、解密域名及可选参数见 [插件说明](../Scripts/lingoDuo/README.md)。

```text
https://cdn.jsdelivr.net/gh/fansys/scripts@main/QuantumultX/lingoDuo.conf
```

将地址添加到远程重写资源，启用重写及 HTTPS 解密，并安装、信任证书。更新后重新连接并重启 Duolingo。每个插件独立订阅，可与 G1 ACQ 分别启停。

默认仅改写会员字段。可选功能通过脚本 URL 的 `#` 参数设置；自定义时复制为本地规则，并停用对应远程规则，避免更新覆盖。

## Emby

配置：[emby.conf](./emby.conf)。原始地址、接口范围及使用方法见 [插件说明](../Scripts/emby/README.md)。

```text
https://cdn.jsdelivr.net/gh/fansys/scripts@main/QuantumultX/emby.conf
```

作为独立远程重写资源添加，启用重写及 HTTPS 解密，安装、信任证书，确认解密域名包含 `mb3admin.com`。更新脚本并重新连接后重启 Emby。配置在请求阶段生成本地响应。

## Rewrite_lhie1

配置：[Rewrite_lhie1.conf](./Rewrite_lhie1.conf)。原始地址、451 条规则的分类及维护方法见 [规则集说明](../Scripts/Rewrite_lhie1/README.md)。

```text
https://cdn.jsdelivr.net/gh/fansys/scripts@main/QuantumultX/Rewrite_lhie1.conf
```

作为独立远程重写资源添加，启用重写及 HTTPS 解密并信任证书。10 条请求头规则引用本仓库公共脚本，其余规则使用原生语法。此合集上游标注更新日期为 2021-08-26，需结合当前应用核对效果。

## hongguo

配置：[hongguo.conf](./hongguo.conf)。来源、规则范围及三平台差异见 [插件说明](../Scripts/hongguo/README.md)。

```text
https://cdn.jsdelivr.net/gh/fansys/scripts@main/QuantumultX/hongguo.conf
```

作为独立远程重写资源添加，启用重写及 HTTPS 解密并信任证书。15 条广告及上报域名规则转换为 URL 拒绝规则，2 条广告接口通过公共脚本返回空 JSON。该订阅适用于 HTTP(S) 流量，HTTPS 拦截依赖 MITM；解密范围包含广告及上报域名和 `*.snssdk.com`。
