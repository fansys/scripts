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
https://cdn.jsdelivr.net/gh/fansys/scripts@main/Loon/g1-acq.plugin
```

1. 使用 Loon 3.5.1（983）或更新版本，在插件管理中添加以上地址并启用。
2. 开启脚本与 MitM，安装并信任证书，确认解密域名包含 `one.google.com`。
3. 更新插件及脚本，重新连接，再从 Google App 打开 Google One 方案页。
4. 在 Safari 打开 `https://one.google.com/g1-sku-report` 查看本机报告。

配置采用 [Loon 官方新版 Script 语法](https://nsloon.app/docs/Script/script_v2/)。若请求使用 HTTP/3 而未进入脚本，需在当前配置中关闭或拦截 QUIC 后重新连接；插件只配置脚本与解密域名。

地址按 `main` 分支生成，推送并公开文件后可用。

## lingoDuo

配置：[lingoDuo.plugin](./lingoDuo.plugin)。功能、解密域名及可选参数见 [插件说明](../Scripts/lingoDuo/README.md)。

```text
https://cdn.jsdelivr.net/gh/fansys/scripts@main/Loon/lingoDuo.plugin
```

使用 Loon 3.5.1（983）或更新版本，在插件管理中添加地址并启用脚本与 MitM，安装、信任证书。更新后重新连接并重启 Duolingo。每个插件独立订阅，可与 G1 ACQ 分别启停。

默认仅改写会员字段；经验倍数、关卡解锁、挑战时长及直接通关在插件参数界面单独开启。地址推送到 `main` 并公开后可用。

## Emby

配置：[emby.plugin](./emby.plugin)。原始地址、接口范围及使用方法见 [插件说明](../Scripts/emby/README.md)。

```text
https://cdn.jsdelivr.net/gh/fansys/scripts@main/Loon/emby.plugin
```

使用 Loon 3.5.1（983）或更新版本，在插件管理中添加并启用脚本与 MitM，安装、信任证书，确认解密域名包含 `mb3admin.com`。更新脚本并重新连接后重启 Emby。配置在请求阶段生成本地响应，需推送到 `main` 并公开后使用。

## Rewrite_lhie1

配置：[Rewrite_lhie1.plugin](./Rewrite_lhie1.plugin)。原始地址、451 条规则的分类及维护方法见 [规则集说明](../Scripts/Rewrite_lhie1/README.md)。

```text
https://cdn.jsdelivr.net/gh/fansys/scripts@main/Loon/Rewrite_lhie1.plugin
```

使用 Loon 3.5.1（983）或更新版本，在插件管理中独立添加并启用重写、脚本和 MitM，安装、信任证书。441 条规则转换为原生 Rewrite，10 条请求头规则引用公共脚本。此合集上游标注更新日期为 2021-08-26，需结合当前应用核对效果；订阅与脚本推送并公开后可用。
