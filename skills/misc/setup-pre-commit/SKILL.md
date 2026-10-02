---
name: setup-pre-commit
description: 配置 Husky 提交前钩子，用 lint-staged 和 Prettier 格式化暂存文件，并运行类型检查与测试。
disable-model-invocation: true
---

# 配置提交前钩子

## 配置内容

- **Husky**：提供提交前钩子。
- **lint-staged**：对所有暂存文件运行 Prettier。
- **Prettier**：已有配置保留，缺失时创建。
- **typecheck** 和 **test**：提交前运行仓库已有的脚本。

## 步骤

### 1. 确定包管理器

根据锁文件确定包管理器：`package-lock.json` 对应 npm，`pnpm-lock.yaml` 对应 pnpm，`yarn.lock` 对应 yarn，`bun.lockb` 对应 bun。不清楚时默认 npm。

### 2. 安装依赖

作为 devDependencies 安装：

```
husky lint-staged prettier
```

### 3. 初始化 Husky

```bash
npx husky init
```

该命令创建 `.husky/` 目录，并向 `package.json` 添加 `prepare: "husky"`。

### 4. 创建 `.husky/pre-commit`

写入这个文件（Husky v9+ 不需要 shebang）：

```
npx lint-staged
npm run typecheck
npm run test
```

将 `npm` 替换为检测到的包管理器。若 `package.json` 没有 `typecheck` 或 `test` 脚本，省略对应行并告知用户。

### 5. 创建 `.lintstagedrc`

```json
{
  "*": "prettier --ignore-unknown --write"
}
```

### 6. 补充缺失的 Prettier 配置

仅在项目没有 Prettier 配置时创建 `.prettierrc`，使用以下默认值：

```json
{
  "useTabs": false,
  "tabWidth": 2,
  "printWidth": 80,
  "singleQuote": false,
  "trailingComma": "es5",
  "semi": true,
  "arrowParens": "always"
}
```

### 7. 验证

- [ ] `.husky/pre-commit` 存在且可执行
- [ ] `.lintstagedrc` 存在
- [ ] `package.json` 中的 `prepare` 脚本是 `"husky"`
- [ ] Prettier 配置存在
- [ ] 运行 `npx lint-staged` 验证可用

### 8. 提交

暂存所有新增或修改的文件，使用提交信息：`Add pre-commit hooks (husky + lint-staged + prettier)`。

此次提交会运行新配置的钩子，用于确认它能正常执行。

## 执行顺序

先用 lint-staged 处理暂存文件，再运行完整的类型检查和测试。`prettier --ignore-unknown` 会跳过图片等无法解析的文件。Husky v9+ 的钩子文件不需要 shebang。
