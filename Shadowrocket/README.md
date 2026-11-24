# Shadowrocket 订阅

此目录维护 Shadowrocket 平台的模块订阅，每个插件一个 `.sgmodule` 文件。

## 目录约定

- 每个插件使用一个独立订阅配置。
- 订阅文件引用 [`Scripts`](../Scripts/README.md) 下的插件 JavaScript 文件。
- 插件相关文件统一保存在对应的 `Scripts/<插件名称>/` 目录中。

## G1 ACQ

配置：[g1-acq.sgmodule](./g1-acq.sgmodule)。功能与使用流程见 [插件说明](../Scripts/g1-acq/README.md)。

订阅地址：

```text
https://cdn.jsdelivr.net/gh/fansys/scripts@main/Shadowrocket/g1-acq.sgmodule
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

## lingoDuo

配置：[lingoDuo.sgmodule](./lingoDuo.sgmodule)。功能、解密域名及可选参数见 [插件说明](../Scripts/lingoDuo/README.md)。

```text
https://cdn.jsdelivr.net/gh/fansys/scripts@main/Shadowrocket/lingoDuo.sgmodule
```

在模块管理中添加地址并启用，开启当前配置的 HTTPS 解密，安装、信任证书。模块通过 `%APPEND%` 追加 Duolingo 解密域名。更新后重新连接并重启 Duolingo。每个插件独立订阅，可与 G1 ACQ 分别启停。

默认仅改写会员字段；增强功能在本地模块副本的 `argument=` 中配置，避免远程更新覆盖。

## Emby

配置：[emby.sgmodule](./emby.sgmodule)。原始地址、接口范围及使用方法见 [插件说明](../Scripts/emby/README.md)。

```text
https://cdn.jsdelivr.net/gh/fansys/scripts@main/Shadowrocket/emby.sgmodule
```

在模块管理中独立添加并启用，开启当前配置的 HTTPS 解密，安装、信任证书。模块通过 `%APPEND%` 追加 `mb3admin.com`。更新脚本并重新连接后重启 Emby。配置在请求阶段生成本地响应。

## Rewrite_lhie1

配置：[Rewrite_lhie1.sgmodule](./Rewrite_lhie1.sgmodule)。原始地址、451 条规则的分类及维护方法见 [规则集说明](../Scripts/Rewrite_lhie1/README.md)。

```text
https://cdn.jsdelivr.net/gh/fansys/scripts@main/Shadowrocket/Rewrite_lhie1.sgmodule
```

在模块管理中独立添加，启用 HTTPS 解密并安装、信任证书。441 条规则转换为 URL Rewrite，10 条请求头规则引用公共脚本；MITM 域名通过 `%APPEND%` 追加。此合集上游标注更新日期为 2021-08-26，需结合当前应用核对效果。

## hongguo

配置：[hongguo.sgmodule](./hongguo.sgmodule)。来源、规则范围及三平台差异见 [插件说明](../Scripts/hongguo/README.md)。

```text
https://cdn.jsdelivr.net/gh/fansys/scripts@main/Shadowrocket/hongguo.sgmodule
```

在模块管理中添加并启用，开启 HTTPS 解密并安装、信任证书。模块包含 13 条原生域名规则和 2 条广告 API 数字域名的 URL Rewrite；2 条广告接口引用公共脚本返回空 JSON。穿山甲子域、`*.snssdk.com` 和 `ads*-normal.zijieapi.com`、`ads*-normal-lq.zijieapi.com` 通过 `%APPEND%` 追加到 MITM。
