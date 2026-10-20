# Whiteboard 自动保存、退出与恢复

来源：本会话中用户逐项确认的 8 项需求。

## 需求

1. 最后一个白板页面关闭后，触发自动退出。
2. 自动退出前保存最新画板，包含本轮人工编辑。
3. 管理当前白板服务，不区分本次启动还是此前已运行。
4. 最后一个页面关闭后等待 10 秒；期间有页面重连就取消退出。
5. 服务启动后从未打开过页面时，保持运行。
6. 沿用当前图对应的 `.excalidraw` 文件。未指定文件时，使用服务所在机器上当前项目的 `whiteboard.excalidraw`。
7. 保存失败也退出；保留上一次成功保存的存档。本轮未保存的修改可能丢失。新内容先写临时文件，成功后替换原文件。
8. 下次指定同一张图时，自动恢复存档，后续修改继续保存回同一个文件，用于多轮迭代。

## 验收

- 多标签页共用当前服务，关闭部分页面时服务继续运行。
- 刷新或在 10 秒内重连后继续编辑，不退出服务。
- 修改后立即关页，退出前保存最后一次编辑；服务退出后释放端口。
- 重启后恢复同一份存档，继续编辑并更新该文件，不叠加导入。
- 保存失败仍退出，旧存档内容不变且仍能恢复。

## 范围

修改 whiteboard 的启动器、运行时补丁、技能说明及必要测试。不增加历史版本、网页按钮、项目依赖或第二套白板服务。

## 验证命令

`<runtime>` 为锁定的 `mcp-excalidraw-server@2.1.2` 包目录。浏览器测试使用已安装的 Playwright 和 Chromium，不增加项目依赖。

```bash
node skills/productivity/whiteboard/scripts/cli.test.mjs <runtime>
node skills/productivity/whiteboard/scripts/lifecycle.test.mjs <runtime> <playwright/index.mjs>
node scripts/check-repo.mjs
npm --prefix dsh-plugin run build
npm --prefix dsh-plugin test
npm --prefix dsh-plugin run verify
bash scripts/test-safe-push-scan.sh
```
