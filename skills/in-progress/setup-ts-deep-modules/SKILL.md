---
name: setup-ts-deep-modules
description: 为 TypeScript 仓库配置 dependency-cruiser，限制包只能通过入口文件访问，并验证违规导入会被拦截。
disable-model-invocation: true
---

# 配置 TypeScript 深模块

用小接口隐藏包内实现。包根目录的文件是公开入口，子目录中的内容都是内部实现。

安装 [dependency-cruiser](https://github.com/sverweij/dependency-cruiser)，配置导入限制，并实际验证它能拦截违规。deep module、interface、seam、depth 等术语沿用 `/codebase-design`，需要时通过 Skill 工具加载它。

## 目录与规则

```
src/packages/
  <name>/
    index.ts        ← an entry point (public). Import this from outside.
    client.ts       ← another entry point. Packages may expose SEVERAL.
    lib/            ← implementation: hidden from outside, free to import each other.
    tests/          ← co-located tests + fixtures (a subfolder, so private).
```

公开入口包括根目录的所有文件，不限于 `index.ts`。约定用 `lib/` 放实现、`tests/` 放测试。限制依据路径层级，对任何子目录都生效，不为新增目录单独加规则。

以下四条规则的级别均为 `error`：

1. **外部只访问入口**：应用代码和其他包只能导入本包根目录文件，不能导入子目录内容。
2. **包内自由导入**：包内文件可以相互导入，测试遵守下一条专门限制。
3. **测试通过入口访问**：`<pkg>/tests/` 可导入任意包的入口，以及自己的 `tests/` 测试夹具。不得导入任何包的内部实现，包括本包。允许跨包集成测试，不允许深层导入。
4. **禁止循环依赖**。

可提供 `index.ts`、`client.ts`、`server.ts` 等多个小入口。不鼓励用汇总整个子目录导出的 barrel 文件，或将全部内容塞入一个巨大的 `index.ts`。

包之间允许哪些依赖属于分层规则。在配置中保留注释占位，交由当前仓库定义。

## 步骤

### 1. 确定环境

- 包管理器：`pnpm-lock.yaml` 对应 pnpm，`yarn.lock` 对应 yarn，`bun.lockb` 对应 bun，否则用 npm。后续命令使用对应的 `pnpm`/`yarn`/`npm run`/`bunx`。
- 包目录：有 `src/` 时用 `src/packages`，否则用 `packages`。若项目已有明显不同的约定，先与用户确认。
- 已有配置：检查 `.dependency-cruiser.*`。已有文件时合并四条规则和选项，不覆盖，并说明新增内容。

完成条件：包管理器、包目录和已有配置情况均已明确。

### 2. 安装依赖

使用项目包管理器，将 `dependency-cruiser` 安装为开发依赖。

完成条件：`devDependencies` 中包含 `dependency-cruiser`。

### 3. 配置规则

将 [dependency-cruiser.config.cjs](./dependency-cruiser.config.cjs) 作为仓库根目录 `.dependency-cruiser.cjs` 的起点；已有配置按步骤 1 合并。将 `PACKAGES_ROOT` 设为步骤 1 确定的包目录。规则依据路径层级，不依赖扩展名，无需其他调整。

完成条件：`.dependency-cruiser.cjs` 存在，`PACKAGES_ROOT` 正确，包含四条禁止规则。

### 4. 接入项目检查

添加 `lint:boundaries` 脚本：`depcruise <packages-root>`，或 `depcruise src`。将它加入现有类型检查所在的统一命令，如 `check`、`ci`、`validate`。不修改 `tsconfig`，不新增路径别名。

没有统一检查命令时，只添加 `lint:boundaries`，并告诉用户将其加入 CI。

完成条件：脚本存在；有统一检查命令时，它与类型检查一起运行。

### 5. 创建示例包

创建并提交 `<packages-root>/example/`，作为可复制或删除的初始模板：

- `index.ts`：公开函数，将工作交给内部文件，体现小接口隐藏实现。
- `lib/impl.ts`：由 `index.ts` 导入的内部实现，外部无法访问。
- `tests/example.test.ts`：只导入 `../index`，对公开函数断言。

完成条件：示例包通过根目录入口提供行为，内部实现保留在子目录中。

### 6. 验证拦截

1. 运行 `lint:boundaries`，正常示例必须通过。
2. 临时在 `tests/example.test.ts` 加入深层导入，如 `import { thing } from "../lib/impl"`。再次运行，必须因 `tests-through-entrypoints` 失败。
3. 撤销深层导入，再运行一次，必须通过。

完成条件：实际观察到“通过 → 违规失败 → 恢复后通过”。若第二步没有失败，先修正检查接入，不能宣布完成。

### 7. 记录约定

在 `<packages-root>/README.md` 说明 `src/packages/<name>/` 的布局、根目录入口、`lib/`、`tests/` 和 `lint:boundaries` 的运行方式。明确只通过包入口导入，推荐多个小入口，不鼓励用一个 index 重新导出整个子目录。只需保留可复制示例和四条规则各一段说明。

从仓库规则文件添加一行链接：优先 `CLAUDE.md`，其次 `AGENTS.md`，两者都没有时创建 `AGENTS.md`。例如：`Packages are deep modules — see [src/packages/README.md](./src/packages/README.md) before adding or importing one.`

完成条件：包目录说明存在，写明不鼓励 barrel 文件，并有仓库规则文件链接到它。

## 配置注意事项

- 保留配置中的 `$1` 反向引用。它用于允许包内访问、阻止外部访问，不展开成每个包一条规则。
- 公开与私有由路径深度决定。新增子目录不改配置，新增入口只需增加根目录文件。
- 包目录下只有一层包；包不能嵌套包，包内实现可以任意深。
- 使用 `.cjs`，使配置中的 `module.exports` 在 `"type": "module"` 仓库中仍然可用。
