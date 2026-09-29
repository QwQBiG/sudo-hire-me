---
slug: "shallow-deep-copy"
title: "浅拷贝与深拷贝"
description: "用嵌套列表的对象图判断哪些容器是新的、哪些子对象仍共享，避免把赋值误当复制。"
subject: "编程基础与面向对象"
order: 27
minutes: 17
lab: "walkthrough"
objectives: ["区分别名、浅拷贝和深拷贝", "沿对象图预测一次嵌套修改的影响", "说明深拷贝的边界与成本"]
prerequisites: ["pointer-reference-basics", "oop-classes-objects"]
---

# 复制了外层，里面还是原来的吗

## 先画对象图，再说“复制”

考虑 Python 3 的 `source = [[1], [2]]`。外层列表持有两个内层列表的引用。赋值 `alias = source` 只是增加一个指向**同一外层对象**的名字，没有复制；浅拷贝（Shallow Copy）建立新外层容器，但内层引用通常仍指向原子对象；深拷贝（Deep Copy）递归复制所包含的对象，且需要处理循环和共享关系。[Python 官方文档：`copy`](https://docs.python.org/3/library/copy.html)

这些概念描述的是**对象图的关系**，不是“浅拷贝只复制地址 8 字节，深拷贝复制所有内存”。不同类型可定制复制行为，不是每一种对象都能或都应该深拷贝。

## 逐步推演

### 第一步：创建三种关系

```python
import copy

source = [[1], [2]]
alias = source
shallow = copy.copy(source)
deep = copy.deepcopy(source)
```

最初四个名字读到的内容都是 `[[1], [2]]`，但身份关系不同：`alias is source` 为真；`shallow is source` 和 `deep is source` 均为假。浅拷贝的 `shallow[0] is source[0]` 为真；本例深拷贝的 `deep[0] is source[0]` 为假。

```text
source ──┐              ┌─→ 内层 A [1]
alias  ──┴→ 外层 S ─────┼─→ 内层 B [2]
shallow ───→ 外层 Q ────┘   （Q 复用 A、B）
deep    ───→ 外层 D ───────→ 新的内层 A' [1]、B' [2]
```

### 第二步：修改原来的内层对象

执行 `source[0][0] = 9`，修改的是内层 A 自身。`alias` 与 `shallow` 都能沿引用到达 A，所以二者看到 `[[9], [2]]`；`deep` 的内层 A' 仍为 `[1]`，看到 `[[1], [2]]`。

| 名字 | 观察到的内容 | 原因 |
| --- | --- | --- |
| `source`、`alias` | `[[9], [2]]` | 同一外层对象 |
| `shallow` | `[[9], [2]]` | 外层不同，但共享内层 A |
| `deep` | `[[1], [2]]` | 本例内层也复制了 |

### 第三步：再修改外层结构

执行 `source.append([3])`，只修改外层 S。`alias` 与 `source` 现在都是 `[[9], [2], [3]]`；`shallow` 仍是两个槽位 `[[9], [2]]`，`deep` 仍是 `[[1], [2]]`。因此“浅拷贝之后修改会不会互相影响”必须问：**改的是外层容器，还是共同引用的内层对象？**

### 第四步：考虑复制成本与共享的意图

深拷贝可能比浅拷贝复制更多对象、占用更多时间和空间；对于文件句柄、锁、数据库连接或本来就应共享的缓存，盲目递归复制甚至没有合适语义。Python `deepcopy` 用 memo 表处理循环对象图并保留一次复制过程中已经复制过的共享关系，也允许类型自定义复制。[Python 官方文档：深拷贝问题与 memo](https://docs.python.org/3/library/copy.html)

## 面试回答

先区别赋值建立别名与实际复制。浅拷贝通常新建外层对象，内部仍保留原子对象的引用；深拷贝尝试递归复制所包含对象。对 `[[1],[2]]` 的 Python 例子，改 `source[0][0]` 会影响浅拷贝但不影响深拷贝；给 `source` 外层追加元素则只影响与它同一外层对象的别名。具体边界由语言、类型与复制接口决定；深拷贝不是“万物安全隔离”的保证，还要考虑资源和成本。

## 语言边界

Java 的 `a = b` 对对象引用也只复制引用值；Java 数组的 `clone()` 创建新数组，但若元素是对象引用，元素引用仍指向原对象。C 结构体赋值按语言规则复制成员值，若成员包含指针，指针值会被复制，却不会自动复制指针指向的动态对象。Rust 的 `Copy`、`Clone` 有明确类型约束和实现，不能把 `clone()` 一律视为 Python 风格的深拷贝。[Java `Object.clone` API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html#clone())、[Rust `Clone` 文档](https://doc.rust-lang.org/std/clone/trait.Clone.html)

## 常见错误

- **“`alias = source` 是浅拷贝。”** 在本例 Python 中只是多一个名字指向同一对象。
- **“浅拷贝后两个列表完全独立。”** 外层独立，内层可能共享。
- **“深拷贝必须把所有对象都复制一份。”** 复制策略可定制，有些对象不能按普通值对象递归复制。
- **“内层值是整数，所以改动共享的是整数对象本身。”** `source[0][0] = 9` 改的是共享内层列表的第 0 个引用槽位；整数 1 并未原地变成 9。

## 选择题

Python 3 中 `source=[[1]]; shallow=copy.copy(source); source[0][0]=9`。此时 `shallow` 是什么？

- A. `[[1]]`
- B. `[[9]]`
- C. `[]`
- D. `copy.copy` 必定抛异常

**答案：B。** 新外层列表仍引用同一个内层列表，改内层槽位后双方都看到 9。A 误以为内层也已复制；C、D 与本例操作不符。

## 参考资料

- [Python 官方文档：浅拷贝、深拷贝与 memo](https://docs.python.org/3/library/copy.html)
- [Java `Object.clone` 官方 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html#clone())
- [Rust 标准库：`Clone` trait](https://doc.rust-lang.org/std/clone/trait.Clone.html)
