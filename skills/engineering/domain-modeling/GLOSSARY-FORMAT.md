# GLOSSARY.md 格式

## 结构

```md
# {Context Name}

{One or two sentence description of what this context is and why it exists.}

## Language

**Order**:
{A one or two sentence description of the term}
_Avoid_: Purchase, transaction

**Invoice**:
A request for payment sent to a customer after delivery.
_Avoid_: Bill, payment request

**Customer**:
A person or organization that places orders.
_Avoid_: Client, buyer, account
```

## 规则

- **只留一个词。** 多个词指同一概念时，选出最合适的一个，其余列在 `_Avoid_` 下。
- **定义要短。** 最多一两句话。定义它是什么，不写它做什么。
- **只收本项目上下文特有的术语。** 通用编程概念（超时、错误类型、工具类写法）不收，即使项目大量使用。添加前先问：这是该上下文独有的概念，还是通用编程概念？只收前者。
- **术语自然成组时，按小标题分组。** 所有术语同属一个领域时，平铺列表即可。

## 单上下文与多上下文

**单上下文（多数仓库）：** 根目录一个 `GLOSSARY.md`。

**多上下文：** 根目录一个 `GLOSSARY-MAP.md`，列出各上下文、它们的位置和相互关系：

```md
# Context Map

## Contexts

- [Ordering](./src/ordering/GLOSSARY.md) - receives and tracks customer orders
- [Billing](./src/billing/GLOSSARY.md) - generates invoices and processes payments
- [Fulfillment](./src/fulfillment/GLOSSARY.md) - manages warehouse picking and shipping

## Relationships

- **Ordering -> Fulfillment**: Ordering emits `OrderPlaced` events; Fulfillment consumes them to start picking
- **Fulfillment -> Billing**: Fulfillment emits `ShipmentDispatched` events; Billing consumes them to generate invoices
- **Ordering -> Billing**: Shared types for `CustomerId` and `Money`
```

按以下规则判断使用哪种结构：

- 存在 `GLOSSARY-MAP.md` 时，读取它找到各上下文。
- 只有根目录的 `GLOSSARY.md` 时，按单上下文处理。
- 两者都没有时，在第一个术语确定时创建根目录的 `GLOSSARY.md`。

有多个上下文时，判断当前话题属于哪一个；判断不了就询问。
