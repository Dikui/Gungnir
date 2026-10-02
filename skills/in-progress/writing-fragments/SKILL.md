---
name: writing-fragments
description: 通过访谈收集写作素材，持续保存片段，暂不安排提纲或文章结构。
disable-model-invocation: true
---

<what-to-do>

围绕用户想写的主题持续访谈，拓宽可写的内容。本阶段只收集素材，不安排阶段、提纲或文章结构。

从用户的第一条消息开始收集双方产生的素材片段，追加到同一 Markdown 文件。用户未提供路径时，只询问一次，并在本次会话中沿用。

首次写入时，顶部只放一个暂定标题的 H1，之后可以修改。除此之外直接写素材，不添加元数据、目录或日期。

</what-to-do>

<supporting-info>

## 什么是素材片段

片段是任何可能进入最终文章的文字。作者能理解即可，不必解释全部术语，也不必构成完整论证。判断标准是它是否有写作价值。

片段可以是：

- 一句暂时不知道放在哪里的好句子。
- 一个观点及其理由。
- 一段经历、代码示例、场景或类比。
- 尚未想清楚、留待展开的想法。
- 引文、对话或偶然听到的话。
- 一组相关观察、抱怨、自白或点睛之语。
- 为反复出现的想法命名的核心词或比喻（leading word）。

尤其注意最后一类：一个准确的名称能影响后续结构、转场和标题。对话反复涉及同一想法时，推动用户为它命名。

像写小说家的观察日记一样积累素材，暂不要求片段彼此连贯。

## 文件格式

```markdown
# Working title

A first fragment lives here.

It can be multiple paragraphs. It can include lists, code, quotes — whatever
shape the fragment naturally takes.

---

A second fragment.

---

> A quoted line that the user wants to keep around.

A reaction to it.

---

- A cluster of related observations
- That hang together by feel
- And want to be near each other
```

用水平线（`\n---\n`）分隔片段。正文不加标题或标签，只按加入顺序排列。

## 写入节奏

直接追加，不为每个片段重复请求许可。可以顺带说明添加了什么，但不打断访谈。

每次写入前先从磁盘重读文件。保留用户对片段的修改、重排和删除，默认只追加，不覆盖文件。用户明确要求时，原位修改指定片段。

用户可以随时要求删除、重写或合并片段；按这些要求处理。

</supporting-info>
