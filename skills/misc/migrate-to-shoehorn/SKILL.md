---
name: migrate-to-shoehorn
description: 用 @total-typescript/shoehorn 替换测试中的 as 类型断言，构造部分数据或故意错误的数据。
disable-model-invocation: true
---

# 迁移到 Shoehorn

## 用途与范围

`shoehorn` 用类型安全的方式替换 `as` 断言，让测试可以只传入所需的部分数据。

**只修改测试代码。生产代码不得使用 shoehorn。**

测试中的 `as` 容易绕过类型检查，还需要手动指定目标类型。构造故意错误的数据时，通常要写成 `as unknown as Type`。

## 安装

```bash
npm i @total-typescript/shoehorn
```

## 替换方式

### 大对象只需要少量属性

修改前：

```ts
type Request = {
  body: { id: string };
  headers: Record<string, string>;
  cookies: Record<string, string>;
  // ...20 more properties
};

it("gets user by id", () => {
  // Only care about body.id but must fake entire Request
  getUser({
    body: { id: "123" },
    headers: {},
    cookies: {},
    // ...fake all 20 properties
  });
});
```

修改后：

```ts
import { fromPartial } from "@total-typescript/shoehorn";

it("gets user by id", () => {
  getUser(
    fromPartial({
      body: { id: "123" },
    }),
  );
});
```

### `as Type` → `fromPartial()`

修改前：

```ts
getUser({ body: { id: "123" } } as Request);
```

修改后：

```ts
import { fromPartial } from "@total-typescript/shoehorn";

getUser(fromPartial({ body: { id: "123" } }));
```

### `as unknown as Type` → `fromAny()`

修改前：

```ts
getUser({ body: { id: 123 } } as unknown as Request); // wrong type on purpose
```

修改后：

```ts
import { fromAny } from "@total-typescript/shoehorn";

getUser(fromAny({ body: { id: 123 } }));
```

## 函数选择

| 函数            | 用途                                               |
| --------------- | -------------------------------------------------- |
| `fromPartial()` | 传入部分数据，同时检查已提供属性的类型               |
| `fromAny()`     | 传入故意错误的数据，保留自动补全                     |
| `fromExact()`   | 要求完整对象，之后可换成 `fromPartial()`             |

## 步骤

1. **确定需求**：询问哪些测试文件中的 `as` 需要替换，是否只需要对象的部分属性，以及是否需要错误数据来测试失败路径。

2. **安装并迁移**：
   - [ ] 安装：`npm i @total-typescript/shoehorn`
   - [ ] 查找测试中的 `as` 断言：`grep -r " as [A-Z]" --include="*.test.ts" --include="*.spec.ts"`
   - [ ] 用 `fromPartial()` 替换 `as Type`
   - [ ] 用 `fromAny()` 替换 `as unknown as Type`
   - [ ] 从 `@total-typescript/shoehorn` 导入所需函数
   - [ ] 运行类型检查
