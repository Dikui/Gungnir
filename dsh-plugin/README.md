# dk-gungnir dsh 插件

DSH 的推荐安装方式见[安装到 DSH skills](../README.md#安装到-dsh-skills)，使用 `/ask-dikui` 等原名调用。本页介绍独立插件包的安装与发布。

在 DSH 插件列表和技能来源中显示为 `dk-gungnir`。

## 这是什么

本插件包把 Gungnir 仓库中 `skills/engineering/` 和 `skills/productivity/` 的技能打包为 DeepSeek Harness（dsh）插件。

技能保留原名，以 `/<name>` 调用，例如 `/grill-me`。

## 30 秒安装

前提：机器上已能运行 dsh（`dsh --version` 有输出）。尚未安装时，先用 `npx @deepseek-ai/dsh web` 启动一次。

1. 把插件装进 web profile：

   ```sh
   dsh plugin --profile web add dk-gungnir
   ```

   该包尚未发布到 npm 之前，用打包出的 tarball 绝对路径代替包名：

   ```sh
   (cd dsh-plugin && npm pack)
   dsh plugin --profile web add "$PWD/dsh-plugin/dk-gungnir-4.5.12.tgz"
   ```

2. 启动 dsh：

   ```sh
   dsh web
   ```

3. 在会话中输入 `/grill-me`（或任意可由用户调用的 `/<name>`）即可调用。

确认插件已挂载：

```sh
dsh --profile web --dump-config | grep 'id: dk-gungnir'
```

## 构建

构建时将 `skills/engineering/` 和 `skills/productivity/` 下的技能目录平铺复制到插件的 `skills/`，保留名称、正文、内部引用和附带资源。

技能清单在构建时从仓库 `skills/` 目录生成。

## 维护者发布

发布前先登录 npm（账号需有权发布 `dk-gungnir`）：

```sh
npm login
npm whoami
```

然后构建并发布：

```sh
(cd dsh-plugin && npm run build)
(cd dsh-plugin && npm publish)
```

`private:false` 与 `publishConfig.access: public` 使该包可以公开发布。

发布成功后无需 tarball，直接安装：

```sh
dsh plugin --profile web add dk-gungnir
```
