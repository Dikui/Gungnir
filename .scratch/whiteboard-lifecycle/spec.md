# Whiteboard Close、保存与恢复

来源：本会话中用户确认的存档和恢复需求，以及后续“撤回自动退出，在白板上提供 Close 按钮”的调整。

## 需求

1. 点击白板页面的 Close 按钮，主动退出服务。
2. Close 退出前保存最新画板，包含本轮人工编辑。
3. 管理当前白板服务，不区分本次启动还是此前已运行。
4. 关闭全部标签页、刷新或断开连接时保持服务运行，不再设置自动退出倒计时。
5. Close 期间禁用按钮；所有打开页面显示保存及关闭结果。按钮支持键盘，窄屏下保持可用。
6. 沿用当前图对应的 `.excalidraw` 文件。未指定文件时，使用服务所在机器上当前项目的 `whiteboard.excalidraw`。
7. 保存失败也退出；保留上一次成功保存的存档。本轮未保存的修改可能丢失。新内容先写临时文件，成功后替换原文件。
8. 下次指定同一张图时，自动恢复存档，后续修改继续保存回同一个文件，用于多轮迭代。

## 验收

- 多标签页共用当前服务，关闭部分页面时服务继续运行。
- 关闭全部标签页后超过原有的 10 秒期限，服务仍在运行。
- 修改后立即点击 Close，保存最后一次编辑；服务退出后释放端口。
- 其他打开页面显示关闭结果，不继续尝试重连。
- 重启后恢复同一份存档，继续编辑并更新该文件，不叠加导入。
- 保存失败仍退出，旧存档内容不变且仍能恢复。

## 范围

修改 whiteboard 的启动器、运行时补丁、技能说明及必要测试。不增加历史版本、项目依赖或第二套白板服务。

## 界面约定

这是对锁定的上游单页工具增加一个按钮。复用其英文标题栏、`btn-secondary` 按钮和 `scene-load-status` 反馈区域；不修改字体、颜色和画布布局，不引入设计系统。Close 的提示说明其保存并停止所有页面共用的服务。保存失败沿用“保留旧存档但仍退出”的已确认规则。

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
