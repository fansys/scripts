# lingoDuo

Duolingo iOS 响应改写插件，支持 Quantumult X、Loon 和 Shadowrocket。基于 [TAKAGIVEGETA/MyScripts 的 lingoDuo](https://github.com/TAKAGIVEGETA/MyScripts/tree/main/lingoDuo) 增强版整合，默认改写会员字段，可选经验倍数、关卡解锁、限时挑战时长和部分关卡直接通关。

## 来源与适配

本次基于 2026-11-23 查看的上游 `main/lingoDuo` 脚本：

- [`lingoDuo-xaM-enhanced.js`](https://github.com/TAKAGIVEGETA/MyScripts/blob/main/lingoDuo/lingoDuo-xaM-enhanced.js)：会员字段、经验倍数及课程关卡状态。
- [`lingoDuo-time-modifier.js`](https://github.com/TAKAGIVEGETA/MyScripts/blob/main/lingoDuo/lingoDuo-time-modifier.js)：限时挑战时长。
- [`lingoDuo-clear.js`](https://github.com/TAKAGIVEGETA/MyScripts/blob/main/lingoDuo/lingoDuo-clear.js)：部分练习与故事的挑战列表。

作者为 TAKAGIVEGETA，本仓库将三份逻辑整合到一个独立脚本，并统一三平台参数解析；增强选项默认关闭。补充单条 batch 响应、多个用户子响应、大小写不同的 ETag 和异常响应处理，重复执行不会重复添加会员及经验道具。

本插件修改客户端收到的 JSON，不会创建真实付费订阅。服务端控制的权益（例如视频通话）、经验及进度是否生效取决于 Duolingo 的实际校验，离线测试不能证明这些权益可用。

## 文件

| 文件 | 用途 |
| --- | --- |
| [lingoDuo.js](./lingoDuo.js) | 三平台通用响应脚本，包含默认会员字段改写与可选增强功能 |
| [tests/compatibility.test.cjs](./tests/compatibility.test.cjs) | 三平台参数、响应改写、异常处理和订阅规则测试 |

平台订阅配置仅引用本目录脚本，不依赖上游脚本下载地址。

## 订阅链接

| 平台 | 独立订阅 | 导入位置 |
| --- | --- | --- |
| Quantumult X | [lingoDuo.conf](https://cdn.jsdelivr.net/gh/fansys/scripts@main/QuantumultX/lingoDuo.conf) | 远程重写资源 |
| Loon | [lingoDuo.plugin](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Loon/lingoDuo.plugin) | 插件管理；需 3.5.1（983）或更新版本 |
| Shadowrocket | [lingoDuo.sgmodule](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Shadowrocket/lingoDuo.sgmodule) | 模块管理 |

地址对应 `fansys/scripts` 的 `main` 分支，需将配置和脚本推送并公开后使用。不要将这些地址作为节点订阅或完整主配置导入。

## 安装与使用

1. 选择当前使用的平台，添加对应独立订阅并启用脚本或重写。
2. 开启 HTTPS 解密，安装并信任当前平台的证书；核对订阅声明的 `ios-api-*.duolingo.com`、`ios-api-*.duolingo.cn`、`api*.duolingo.com`、`api*.duolingo.cn`、`stories.duolingo.com`、`stories.duolingo.cn`。
3. 停用重复的 Duolingo 改写脚本，更新订阅及脚本后重新连接，完全关闭并重新打开 Duolingo。
4. 默认仅启用会员字段改写；需要增强功能时按下方参数配置。

匹配范围限 HTTPS：API 主机的 `/2023-05-23/batch`、`/2023-05-23/users/<用户 ID>`，以及对应的 `live-ops-challenges`、`sessions` 和 `api2/stories` 端点。非 JSON、未知结构及未启用的增强功能均原样放行，带 ETag 的 batch 用户子响应沿用上游逻辑跳过。

## 可选参数

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `xp_boost` | `false` | 启用经验道具字段改写 |
| `multiplier` | `2` | 经验倍数，可选 `2` 或 `3`，其他值使用 `2` |
| `unlock_all` | `false` | 将课程中的 `locked` 关卡改为 `active`，保留已完成状态 |
| `timer_switch` | `false` | 启用限时挑战时长改写 |
| `timer_mins` | `60` | 挑战时长（分钟），须为有限正数且换算为整数秒；无效值跳过修改 |
| `instant_clear` | `false` | 清空部分练习挑战或故事元素，沿用上游对两类练习挑战的排除逻辑 |

- **Loon**：在插件设置中修改参数，布尔开关及数字作为对象传给脚本。
- **Quantumult X**：复制重写规则为本地规则，停用同一插件的远程规则，在脚本 URL 的 `#` 后修改参数。脚本兼容 `$environment.variables` 和旧版 `$environment.sourcePath`。例如启用三倍经验：`#xp_boost=true&multiplier=3&unlock_all=false&timer_switch=false&timer_mins=60&instant_clear=false`。
- **Shadowrocket**：使用本地模块副本，在脚本行的 `argument=` 后修改同名参数，例如 `argument=xp_boost=true&multiplier=3&unlock_all=false&timer_switch=false&timer_mins=60&instant_clear=false`。远程订阅更新可能覆盖直接编辑的内容。

布尔参数可使用 `true` / `false`。所有增强项相互独立，例如只设置 `timer_mins` 不会开启时长修改，还需设置 `timer_switch=true`。

## 验证与排查

在仓库根目录使用 Node.js 18 或更新版本执行：

```sh
node --test Scripts/lingoDuo/tests/compatibility.test.cjs
```

测试模拟三个平台的参数输入和响应执行，覆盖会员字段、batch 字符串与对象子响应、ETag、重复执行、可选功能、异常输入及三份独立订阅。不包含 iOS 客户端实机验证。

若没有改写，先确认实际请求主机及路径命中订阅、HTTPS 解密有效且没有重复脚本；客户端更新或接口变化可能导致字段不再匹配。异常日志使用 `[lingoDuo]` 前缀，不输出完整用户响应。
