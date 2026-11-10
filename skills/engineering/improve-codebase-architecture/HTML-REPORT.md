# HTML 报告格式

架构报告是一个自包含的 HTML 文件，写入操作系统的临时目录。Tailwind 和 Mermaid 都从 CDN 加载。依赖和调用这类图状关系用 Mermaid；剖面图、体量图这类示意图用手写的 div 和内联 SVG。两者混用，不要全部依赖 Mermaid，否则报告会千篇一律。

## 骨架

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Architecture review — {{repo name}}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
      mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose" });
    </script>
    <style>
      /* small custom layer for things Tailwind doesn't cover cleanly:
         dashed seam lines, hand-drawn-feeling arrow heads, etc. */
      .seam { stroke-dasharray: 4 4; }
      .leak { stroke: #dc2626; }
      .deep { background: linear-gradient(135deg, #0f172a, #1e293b); }
    </style>
  </head>
  <body class="bg-stone-50 text-slate-900 font-sans">
    <main class="max-w-5xl mx-auto px-6 py-12 space-y-12">
      <header>...</header>
      <section id="candidates" class="space-y-10">...</section>
      <section id="top-recommendation">...</section>
    </main>
  </body>
</html>
```

## 页头

写仓库名、日期和一行图例：实线框 = module，虚线 = seam，红色箭头 = 泄漏，粗边深色框 = deep module。不写引言，直接进入候选。

## 候选卡片

主要信息由图承担。文字要少而直白，并使用 `/codebase-design` 的术语。

每个候选是一个 `<article>`：

- **标题**：简短，说出要深化什么（如 “Collapse the Order intake pipeline”）。
- **标签行**：推荐强度（`Strong` 用 emerald，`Worth exploring` 用 amber，`Speculative` 用 slate），加依赖类别（`in-process`、`local-substitutable`、`ports & adapters`、`mock`）。
- **Files**：等宽字体列表，`font-mono text-sm`。
- **Before / After 图**：核心内容，两列并排。画法见下文。
- **Problem**：一句话，说明现在哪里有问题。
- **Solution**：一句话，说明会改变什么。
- **Wins**：列表，每条很短，如 “Tests hit one interface”“Pricing logic stops leaking”“Delete 4 shallow wrappers”。
- **ADR 提示**（适用时）：amber 底色框中的一行。

不写大段解释。图需要一段话才能看懂时，重画图。

## 图的画法

按候选选择合适的画法，可以混用。不要让每张图都长得一样。

### Mermaid 图（依赖和调用流的主力）

要表达“X 调 Y 调 Z，一团乱”时，用 Mermaid 的 `flowchart` 或 `graph`。放进带 Tailwind 样式的卡片里。用 `classDef` 把泄漏的边标红，把 deep module 标成深色。时序图适合表达“之前 6 次往返，之后 1 次”。

```html
<div class="rounded-lg border border-slate-200 bg-white p-4">
  <pre class="mermaid">
    flowchart LR
      A[OrderHandler] --> B[OrderValidator]
      B --> C[OrderRepo]
      C -.leak.-> D[PricingClient]
      classDef leak stroke:#dc2626,stroke-width:2px;
      class C,D leak
  </pre>
</div>
```

### 手写的框和箭头（Mermaid 的布局妨碍表达时）

module 用带边框和标签的 `<div>`；箭头用内联 SVG 的 `<line>` 或 `<path>`，绝对定位在相对定位的容器上。想让“之后”的图呈现为一个粗边框的 deep module、内部细节置灰时，用这种画法；Mermaid 画不出这种视觉分量。

### 剖面图（适合层层转发的浅模块）

用水平色带（`h-12 border-l-4`）展示一次调用穿过的各层。之前：6 条薄带，每层几乎不做事。之后：1 条厚带，标出合并后的职责。

### 体量图（适合“interface 和 implementation 一样宽”）

每个 module 画两个矩形：一个代表 interface 的大小，一个代表 implementation。之前：interface 几乎和 implementation 一样高（shallow）。之后：interface 矮，implementation 高（deep）。

### 调用图折叠

之前：把函数调用树画成嵌套的框。之后：把同一棵树折叠成一个框，内部调用置灰显示。

## 样式

- 偏文章排版，不做成企业仪表盘。多留白。标题可用衬线体（`font-serif` 与 stone/slate 配色相配）。
- 克制用色：一个强调色（emerald 或 indigo），红色表示泄漏，amber 表示警告。
- 图高约 320px，使 before/after 并排时不必滚动。
- 图内的 module 标签用 `text-xs uppercase tracking-wider`，看起来像示意图，不像界面。
- 脚本只有 Tailwind CDN 和 Mermaid 的 ESM 导入。除此之外报告是静态的：不写应用代码，不加 Mermaid 自身渲染以外的交互。

## 首选建议一节

一张更大的卡片：候选名称、一句话理由、指向该候选卡片的锚点链接。只有这些。

## 用词

直白、简洁，但架构名词和动词必须来自 `/codebase-design`。

**只用这些词：** module、interface、implementation、depth、deep、shallow、seam、adapter、leverage、locality。

**不要换成：** component、service、unit（指 module 时）；API、signature（指 interface 时）；boundary（指 seam 时）；layer、wrapper（指 module 时）。

合适的写法：

- "Order intake module is shallow - interface nearly matches the implementation."
- "Pricing leaks across the seam."
- "Deepen: one interface, one place to test."
- "Two adapters justify the seam: HTTP in prod, in-memory in tests."

**Wins** 用上述术语说出收益：*"locality: bugs concentrate in one module"*、*"leverage: one interface, N call sites"*、*"interface shrinks; implementation absorbs the wrappers"*。不写 *"easier to maintain"* 或 *"cleaner code"* 这类说不出具体收益的话。

不写铺垫和客套。一句话能改成列表项就改；一个列表项能删就删。要用的词不在 `/codebase-design` 的术语里时，先找其中的词，不造新词。
