---
name: whiteboard
description: 由用户显式调用，让本地或服务器上的 Codex 与人工共同编辑 Excalidraw 白板，并保存、恢复画板文件。界面在浏览器中使用。
disable-model-invocation: true
---

# 白板

通过本技能的 `scripts/cli.mjs` 启动 `mcp-excalidraw-server@2.1.2`，操作画板。启动器修复服务端对浏览器原生箭头绑定的识别，使 CLI 移动节点时自动重算并广播关联连线。用户拖动、改字后，读取最新状态，再按元素 ID 局部修改。只在本技能被显式调用时使用；不要求安装 ZCode、配置 MCP 或安装上游的另一份技能。

## 确定运行位置和连接方式

CLI 和文件操作发生在 **Codex 执行 shell 的机器上**。本地 Codex 默认启动本地服务；服务器上的 Codex 默认启动服务器服务。浏览器始终在用户自己的电脑上打开。

先确定本次是启动本机画板，还是连接用户指定的已有画板。后者包括本地 Codex 通过 SSH 转发连接服务器。不能把服务器和用户电脑的 `127.0.0.1` 当成同一地址。

- 默认服务地址为 `http://127.0.0.1:3000`。已有服务先读取摘要，不能清空或接管不明用途的画板；需要独立画板时使用另一端口。
- 连接已有画板时，所有 CLI 调用都使用本技能启动器和显式 `--url`。启动器固定设置 `EXCALIDRAW_NO_AUTOSTART=1`。连接失败就报告地址与错误，不执行 `start`，也不回退到默认地址。
- 启动自己的服务后，后续读写同样禁用自动启动，避免服务退出后误操作一块新空白画板。不能假定上一次 shell 调用的 `export` 会在下一次调用中保留。
- 本版本按人和一个 Codex 轮流编辑使用。浏览器修改不会自动发起 Codex 对话，选区也不会自动注入终端会话。

## 启动与访问

检查 Node.js 版本，要求 20 或更高。缺少 Node 时说明需要用户准备的环境，不自动修改系统或全局 Node 安装。以下示例适用于 macOS、Linux 和 WSL 的 shell。

下面的 `/absolute/path/to/whiteboard` 必须替换成本技能的实际安装目录。每次调用使用绝对路径，不依赖跨 shell 保留的变量。`npx` 只下载锁定的 `2.1.2`；启动器在 npm 缓存中为该版本修复连线重算函数，再调用原有 CLI，不安装额外依赖。遇到未知版本或代码结构时直接报错，不盲目打补丁。

先检查服务；`status` 不启动服务。所有命令都经由启动器，不直接调用原版包：

```bash
npx -y --package=mcp-excalidraw-server@2.1.2 -- node /absolute/path/to/whiteboard/scripts/cli.mjs --url http://127.0.0.1:3000 status
```

只有用户要求在当前机器启动画板，且该地址没有已运行的服务时，才执行：

```bash
npx -y --package=mcp-excalidraw-server@2.1.2 -- node /absolute/path/to/whiteboard/scripts/cli.mjs --url http://127.0.0.1:3000 start
```

`start` 会覆盖禁用自动启动的设置，因此连接模式中不能调用它。返回 `spawned: false` 表示复用了已运行服务，不能称为新建画板。端口被其他服务占用时，不停止该服务，改用用户认可的空闲端口并同步更新后续地址。

修复在服务启动时加载。已有原版服务需先导出最新画板，再停止、通过本启动器重启并导入文件；遵守服务所有者的重启授权。连接服务器画板时，必须在服务器使用本启动器启动服务，只修复本地客户端不能改变远程服务。不要把复用旧进程称为修复已生效。

本地 Codex：给出浏览器链接 `http://127.0.0.1:3000`。服务器 Codex：给出下面的转发命令，让用户在 **本地电脑** 执行，并把 `user@server` 换成实际 SSH 目标：

```bash
ssh -N -o ExitOnForwardFailure=yes -L 3300:127.0.0.1:3000 user@server
```

用户保持 SSH 连接，在本地浏览器打开 `http://127.0.0.1:3300`。也可通过 VS Code 的 Ports 面板转发服务器的 3000 端口。服务使用回环地址，不要求开放公网端口；不要在服务器执行打开浏览器命令后声称用户已经看到页面。

| 调用方 | CLI 的 `--url` |
| --- | --- |
| 服务器上的 Codex | `http://127.0.0.1:3000` |
| 本地 Codex 连接上述服务器画板 | `http://127.0.0.1:3300`，保持本地 SSH 转发 |

首次 `npx` 会下载运行组件；不运行 `install-skill`，不额外注册后台自启动或修改 Codex 的 MCP 配置。服务启动后复查 `status`，再执行绘图。

## 读取与局部修改

以下命令中的地址要替换为本次确定的 CLI 地址。调用之间保持同一地址，尤其不要把浏览器的转发端口用于服务器上的 Codex。

```bash
npx -y --package=mcp-excalidraw-server@2.1.2 -- node /absolute/path/to/whiteboard/scripts/cli.mjs --url http://127.0.0.1:3000 describe
```

根据 `describe` 返回的元素 ID、文字和位置确定修改对象。人工调整后必须重新读取，保留与请求无关的布局。文字标签不唯一时结合上下文定位，不能凭旧坐标猜测对象。

用 CLI 移动已有节点前，先用 `get` 读取节点及其绑定的文字和箭头。修复后的服务会在 `update`、`apply` 等几何更新中保留绑定关系，并同步端点与尺寸。两点直线沿用上游重算规则；已有多点折线保留中间拐点的画布绝对坐标，只移动与该节点绑定的端点，另一端保持原位。缩放节点时也只重算相连端点。不要用起点到终点的直线替换人工折线路径。移动或还原后仍需核对文字与连线。

| 操作 | CLI 子命令与参数 |
| --- | --- |
| 批量创建 | `add <元素数组的 JSON 文件>` |
| 更新指定元素 | `update <id> --set '{"x":240,"text":"缓存"}'` |
| 批量局部修改 | `apply <操作 JSON 文件>` |
| 查看单个元素 | `get <id>` |
| 检查结果 | `screenshot --out <绝对路径.png>` |

这些子命令也必须使用相同的锁定版本、显式地址和禁用自动启动设置。参数细节不确定时先读该版本的 `--help`，不要改用未锁定版本试错。

创建元素时为需要后续编辑的对象指定稳定 ID。形状文字使用 `text`；连线用 `startElementId` 和 `endElementId` 绑定节点。例如 `add` 的输入：

```json
[
  {"id":"api","type":"rectangle","x":100,"y":100,"width":180,"height":80,"text":"API"},
  {"id":"cache","type":"rectangle","x":400,"y":100,"width":180,"height":80,"text":"缓存"},
  {"id":"api-cache","type":"arrow","x":0,"y":0,"startElementId":"api","endElementId":"cache"}
]
```

修改后生成并查看截图，检查文字、重叠和连线。服务器无需桌面环境即可生成截图；中文缺字时说明运行机器需要相应字体，保留画板数据。Mermaid 转换使用 `mermaid <文件>`，需要用户先打开画板页面；浏览器不可用时直接创建元素。

## 保存与恢复

**已发布的 `2.1.2` 把画板与命名快照放在服务内存中，重启会丢失。** 不使用主分支才出现的 `EXCALIDRAW_DATA_DIR`，不把浏览器同步或 `snapshot save` 称为持久保存。

完成一轮修改后，将画板导出到用户指定的项目 `.excalidraw` 文件；未给出路径时，在当前项目中选择清晰的文件名并告知用户。人工随后又修改时，需要再次导出或在浏览器中保存。

```bash
npx -y --package=mcp-excalidraw-server@2.1.2 -- node /absolute/path/to/whiteboard/scripts/cli.mjs --url http://127.0.0.1:3000 export --out /absolute/project/architecture.excalidraw
```

导出成功时报告文件绝对路径。文件写在 CLI 所在机器上：服务器 Codex 导出到服务器；本地 Codex 即使连接服务器画板，也导出到本地。覆盖已有文件须符合用户的覆盖授权。

恢复时先读取目标画板。确认是空画板后，导入已经保存的文件，再用 `describe` 与截图核对：

```bash
npx -y --package=mcp-excalidraw-server@2.1.2 -- node /absolute/path/to/whiteboard/scripts/cli.mjs --url http://127.0.0.1:3000 import /absolute/project/architecture.excalidraw
```

默认导入为合并，重复导入可能叠加元素；目标不空时不能把合并称为恢复。清空、删除、`import --replace` 和其他覆盖操作遵守用户及项目的确认规则。停止自己启动的服务前，先导出最新内容；连接已有服务时不替用户停止它。

## 交付

给出当前画板地址、CLI 所在机器和导出文件路径。区分已实测结果与待验证环境；端口转发模拟不等于真实服务器验收。按用户要求继续编辑同一画板，不自动上传或创建分享链接。

工具来源：[yctimlin/mcp_excalidraw](https://github.com/yctimlin/mcp_excalidraw)。参数以锁定的 npm 发布包为准，主分支文档可能包含尚未发布的能力。
