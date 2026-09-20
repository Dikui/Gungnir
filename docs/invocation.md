# 仅手动调用

Gungnir 中的所有技能都为 **User-invoked**，包括 `skills/` 中的正式技能、开发中技能，以及 `.skills/` 中的内部翻译技能。只有用户明确指定技能时才调用，不根据任务描述自动选择。

每个技能同时设置两项配置：

- Claude Code：`SKILL.md` frontmatter 中的 `disable-model-invocation: true`。
- Codex：相邻 `agents/openai.yaml` 中的 `policy.allow_implicit_invocation: false`。

两项配置必须保持一致。保留原有技能名称、描述、UI metadata 和工具依赖，用户仍可在技能选择器中找到它们。

## 手动调用

- Codex：`$research 调研这个问题`。
- Claude Code：`/research 调研这个问题`。

技能正文中的 `/其他技能` 引用表示流程依赖，不构成自动调用授权。需要这些能力时，由用户明确指定相应技能；例如需要完整实现、测试和审查流程时，同时指定 `implement`、`tdd` 和 `code-review`。

只是通过文件路径读取普通参考文档，不属于调用另一个技能。

顶层和各 bucket 的 `README.md` 将本版本技能统一列在 **User-invoked** 分组；开发中技能仍遵循原有发布范围。
