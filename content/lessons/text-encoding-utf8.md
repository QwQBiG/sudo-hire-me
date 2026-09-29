---
slug: "text-encoding-utf8"
title: "字符、码点与 UTF-8"
description: "把 A中🙂 拆成码点和字节，理解为何字符数、码点数与存储字节数不必相等。"
subject: "计算机基础"
order: 36
minutes: 17
lab: "walkthrough"
objectives: ["区分字符、码点、码元与字节", "计算给定码点的 UTF-8 字节序列", "解释字符串长度为何依赖计数单位"]
prerequisites: ["binary-representation", "memory-units"]
---

# 文本怎样变成字节

## 四个层次不能混成一个“字符”

人眼看到的字形或用户感知的字符，不总与单个数字一一对应。Unicode 为抽象字符等对象分配**码点（Code Point）**，写作 `U+` 加十六进制数，例如 `中` 对应 `U+4E2D`。Unicode 标量值（Unicode Scalar Value）是排除代理码点 `U+D800..U+DFFF` 后可用于 UTF-8 编码的码点。编码形式（Encoding Form）再把码点变成码元（Code Unit）序列；UTF-8（Unicode Transformation Format, 8-bit）的一个码元是 8 位字节。[Unicode 标准第 3 章：编码形式](https://www.unicode.org/versions/latest/core-spec/chapter-3/)

“字符串长度”可能指用户感知字符数、Unicode 码点数、UTF-16 码元数或 UTF-8 字节数。问长度时先问**按哪个单位**，否则即使每个人计算都正确，答案也可能不同。

## 逐步推演

### 第一步：列出三个码点

设文本是 `A中🙂`，码点序列是 `U+0041`、`U+4E2D`、`U+1F642`。这里恰好三个可见符号对应三个码点，但这只是本例的特性，不能推广到所有文本。

| 可见符号 | 码点 | UTF-8 所需字节数 |
| --- | --- | --- |
| `A` | `U+0041` | 1 |
| `中` | `U+4E2D` | 3 |
| `🙂` | `U+1F642` | 4 |

### 第二步：按范围选择 UTF-8 形状

UTF-8 对 `U+0000..U+007F` 用 `0xxxxxxx`，对 `U+0080..U+07FF` 用 `110xxxxx 10xxxxxx`，对 `U+0800..U+FFFF` 的合法标量值用三个字节，对 `U+10000..U+10FFFF` 用四个字节。后续字节都以 `10` 开头，但**不是任意拼接的 `10xxxxxx` 都合法**；还须排除过长编码、代理码点和超出范围的序列。[Unicode 标准：UTF-8 合法字节序列](https://www.unicode.org/versions/latest/core-spec/chapter-3/)

`U+4E2D` 写成二进制 `0100 1110 0010 1101`，按 `1110xxxx 10xxxxxx 10xxxxxx` 放入有效位，得到 `11100100 10111000 10101101`，即 `E4 B8 AD`。`U+1F642` 同理得到 `F0 9F 99 82`。`A` 是 ASCII 范围，直接得到 `41`。

### 第三步：连接字节而不是连接十六进制字符

最终字节流为：

```text
A        中              🙂
41       E4 B8 AD        F0 9F 99 82
1 字节   3 字节          4 字节
```

所以这是 **3 个码点、8 个 UTF-8 字节**。十六进制的 `E4` 是一个字节的文本写法，不是两个存储字节 `E` 和 `4`。接收方要按相同编码解码，才会把这些字节还原为原码点序列。

### 第四步：观察同一文本的长度差异

Python 3 的 `len("A中🙂")` 在本例为 3，而 `len("A中🙂".encode("utf-8"))` 为 8。Java 的 `String.length()` 统计 UTF-16 码元：`A` 和 `中` 各占一个，`🙂` 占代理对两个，因此本例为 4。[Java `String.length` 官方 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html#length())

这些计数都可以正确，关键是说出单位。不能拿字节偏移直接当“第几个字符”的索引；从多字节 UTF-8 序列的中间切开还可能产生无效文本。

## 面试回答

Unicode 码点是给字符等对象分配的编号，UTF-8 是把 Unicode 标量值编码成 1 到 4 个字节的规则。`A中🙂` 有三个码点，UTF-8 字节依次是 `41 E4 B8 AD F0 9F 99 82`，共八字节。码点、码元、字节和用户看到的字符不是同一个计数单位；涉及“长度”或“截取”时必须说明使用哪一层，不能默认一字符一字节。

## 更容易误判的反例

字母 `e` 后跟组合重音 `U+0301`，可显示成一个带重音的视觉单元，但它是两个码点，UTF-8 字节为 `65 CC 81`。预组字符 `é`（`U+00E9`）看起来相近，却是一个码点、字节 `C3 A9`。如果要按用户感知字符处理编辑光标或截取，还需要考虑字素簇（Grapheme Cluster）和规范化，而不是仅按码点切片。[Unicode UAX #29：文本分段](https://www.unicode.org/reports/tr29/)

## 常见错误

- **“UTF-8 是每个字符固定 8 位。”** 名称里的 8 指码元宽度；一个码点可占 1 到 4 个字节。
- **“看到三个字符就一定占三个字节。”** 本例占 8 字节，组合序列还会使可见字符与码点数不同。
- **“截取前 4 个字节一定是前两个字符。”** 本例前 4 字节是 `A中`，但换一段文本就可能截在多字节序列中间。
- **“所有 `10xxxxxx` 字节都能单独解码。”** 它们是 UTF-8 续字节，不能独立代表码点。

## 选择题

文本 `A中🙂` 按 UTF-8 编码后，本课给出的码点数与字节数分别是多少？

- A. 3 和 3
- B. 3 和 8
- C. 4 和 8
- D. 8 和 3

**答案：B。** 三个码点分别占 1、3、4 字节。A 假设一字符一字节；C 把 Java UTF-16 码元数当成码点数；D 颠倒了单位。

## 参考资料

- [Unicode 标准第 3 章：码点、码元与 UTF-8](https://www.unicode.org/versions/latest/core-spec/chapter-3/)
- [Unicode UAX #29：字素簇与文本边界](https://www.unicode.org/reports/tr29/)
- [Java `String.length`：UTF-16 码元数](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html#length())
