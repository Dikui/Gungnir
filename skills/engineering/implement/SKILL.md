---
name: implement
description: "按需求文档或任务单实现功能。"
disable-model-invocation: true
---

实现用户在需求文档或任务单中描述的工作。

尽可能在预先约定的测试接口（seam）上使用 `/tdd`。

定期运行类型检查和单个测试文件，最后运行完整测试套件。

完成后，使用 `/code-review` 审查这次工作。

把工作提交到当前分支。文中其他技能仅在用户明确指定后调用。
