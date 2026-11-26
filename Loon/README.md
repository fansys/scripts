# Loon 订阅

此目录维护 Loon 平台的插件订阅，每个插件一个 `.plugin` 文件。

## 目录约定

- 每个插件使用一个独立订阅配置。
- 订阅文件引用 [`Scripts`](../Scripts/README.md) 下的插件 JavaScript 文件。
- 插件相关文件统一保存在对应的 `Scripts/<插件名称>/` 目录中。

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

报告页显示“本机脚本已接管”和 `v7.12.0` 时，说明报告脚本已加载。重新打开 Google One 方案页后，可从报告中的最近执行记录核对响应脚本是否为 `g1-acq-v7.12-mappings`。查看报告使用请求头规则，保存映射使用读取 POST 正文的规则。两份脚本固定使用同一提交，更新插件时会一并切换到该提交的脚本。

配置采用 [Loon 官方新版 Script 语法](https://nsloon.app/docs/Script/script_v2/)。插件的 `[Rule]` 使用 Loon 的 `REJECT` 拒绝所有目标端口为 443 的 UDP 流量，使支持回退的请求改走 TCP。

## lingoDuo

配置：[lingoDuo.plugin](./lingoDuo.plugin)。功能、解密域名及可选参数见 [插件说明](../Scripts/lingoDuo/README.md)。

```text
https://cdn.jsdelivr.net/gh/fansys/scripts@main/Loon/lingoDuo.plugin
```

使用 Loon 3.5.1（983）或更新版本，在插件管理中添加地址并启用脚本与 MitM，安装、信任证书。更新后重新连接并重启 Duolingo。每个插件独立订阅，可与 G1 ACQ 分别启停。

默认仅改写会员字段；经验倍数、关卡解锁、挑战时长及直接通关在插件参数界面单独开启。

## Emby

配置：[emby.plugin](./emby.plugin)。原始地址、接口范围及使用方法见 [插件说明](../Scripts/emby/README.md)。

```text
https://cdn.jsdelivr.net/gh/fansys/scripts@main/Loon/emby.plugin
```

使用 Loon 3.5.1（983）或更新版本，在插件管理中添加并启用脚本与 MitM，安装、信任证书，确认解密域名包含 `mb3admin.com`。更新脚本并重新连接后重启 Emby。配置在请求阶段生成本地响应。

## Rewrite_lhie1

配置：[Rewrite_lhie1.plugin](./Rewrite_lhie1.plugin)。原始地址、451 条规则的分类及维护方法见 [规则集说明](../Scripts/Rewrite_lhie1/README.md)。

```text
https://cdn.jsdelivr.net/gh/fansys/scripts@main/Loon/Rewrite_lhie1.plugin
```

使用 Loon 3.5.1（983）或更新版本，在插件管理中独立添加并启用重写、脚本和 MitM，安装、信任证书。441 条规则转换为原生 Rewrite，10 条请求头规则引用公共脚本。此合集上游标注更新日期为 2021-08-26，需结合当前应用核对效果。

## hongguo

配置：[hongguo.plugin](./hongguo.plugin)。来源、规则范围及三平台差异见 [插件说明](../Scripts/hongguo/README.md)。

```text
https://cdn.jsdelivr.net/gh/fansys/scripts@main/Loon/hongguo.plugin
```

使用 Loon 3.5.1（983）或更新版本，在插件管理中添加并启用重写、脚本及 MitM，安装并信任证书。插件包含 13 条原生域名规则和 2 条广告 API 数字域名的请求重写；2 条广告接口引用公共脚本返回空 JSON。解密范围包含穿山甲子域、`*.snssdk.com` 和 `ads*-normal.zijieapi.com`、`ads*-normal-lq.zijieapi.com`。
