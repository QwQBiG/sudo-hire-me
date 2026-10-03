---
slug: "lru-cache"
title: "LRU 缓存为什么要更新命中顺序"
description: "对比访问序列 A B C A D 的 LRU 与 FIFO，理解哈希索引、双向链表和淘汰边界。"
subject: "数据结构与算法"
order: 209
minutes: 20
lab: "workbench"
objectives: ["手算最近最少使用淘汰", "解释 O(1) 实现的两个结构", "区分 LRU 与先进先出"]
prerequisites: ["array-linked-list"]
---

# 命中也会改变 LRU 的状态

## 面试回答

最近最少使用（Least Recently Used，LRU）缓存在容量不足时淘汰最长时间没有被访问的项。标准实现用哈希表定位节点，用双向链表维护访问顺序：读命中或更新已有键都把节点移动到最近使用端；插入新键超容量时删除另一端。哈希表平均 O(1)，已知节点的链表摘除与插入 O(1)，因此 get/put 平均 O(1)，空间 O(capacity)。先进先出（First In, First Out，FIFO）只看进入顺序，命中不会刷新。

## 用同一个序列区别两种策略

容量 3，下面队列从左到右表示“最早淘汰 → 最新”。

| 访问 | LRU | FIFO |
| --- | --- | --- |
| A | A | A |
| B | A B | A B |
| C | A B C | A B C |
| A（命中） | B C A | A B C |
| D | C A D，淘汰 B | B C D，淘汰 A |

不移动命中项，写出来的就不是 LRU。链表保存顺序，哈希表存 key→节点；如果只有链表，每次找节点 O(n)。如果只有普通哈希表，没有额外顺序记录就不知道该淘汰谁。

## put 的边界比 get 更容易漏

更新已存在键应替换值并刷新顺序，不能增加缓存大小。删除节点后也必须删除哈希表中的索引，避免指向无效节点。容量为 0 时可约定永不保存，或构造时拒绝；接口必须明确。LRU 只是局部性启发式，顺序扫描大量新键仍可能把热点全冲掉；不等于“保证命中率最高”。多线程还需保护哈希表与链表的一致性，不能仅给其中一个结构加锁。

## 多语言示例

以下展示**命中时刷新到尾端**的核心操作，不是完整缓存。以 `[A,B,C]` 命中 A 为输入，均应变为 `[B,C,A]`。数组/列表版移动是 O(n)，用于理解顺序，不冒充 O(1) 实现。

### C

```c
void hit(char *q, int n, int i) {
    char key=q[i];
    for (int j=i; j+1<n; ++j) q[j]=q[j+1];
    q[n-1]=key;
}
```

前提 n>0 且 0<=i<n，q 指向有效数组；生产 O(1) 版应摘除已定位的双向链表节点。

### C++

```cpp
#include <list>
void hit(std::list<char>& q, std::list<char>::iterator node) { q.splice(q.end(), q, node); }
```

node 必须是 q 的有效元素迭代器；单节点 splice 为常数时间，哈希表可保存该迭代器。

### Python 3

```python
from collections import OrderedDict
q = OrderedDict.fromkeys("ABC")
q.move_to_end("A")
assert list(q) == list("BCA")
```

OrderedDict 提供移到末端与 popitem(last=False)，适合组合完整 LRU。

### Rust

```rust
fn hit(q: &mut Vec<char>, i: usize) { let key=q.remove(i); q.push(key); }
```

i 必须有效，remove 搬移后续元素，因此是 O(n) 教学版。

### Zig

```zig
fn hit(q: []u8, i: usize) void {
    const key = q[i]; var j = i;
    while (j + 1 < q.len) : (j += 1) q[j] = q[j + 1];
    q[q.len - 1] = key;
}
```

Zig 0.15.2，slice 非空且 i 有效；这里只维护既有键顺序，不分配资源。

### Java

```java
import java.util.*;
class Demo { static void hit(List<Character> q, int i) { Character key=q.remove(i); q.add(key); } }
```

ArrayList 版本 O(n)；完整实现可研究访问顺序模式的 LinkedHashMap，而非只凭集合名称判断复杂度。

### Kotlin

```kotlin
fun hit(q: MutableList<Char>, i: Int) { val key=q.removeAt(i); q.add(key) }
```

通常列表版移动 O(n)，语言不同并不改变算法结构。

## 选择题

容量 3，访问 A、B、C、A、D 后 LRU 淘汰谁？

A. A

B. B

C. C

D. D

**答案：B。** 第二次访问 A 已刷新它；B 成为最久未用。A 是此序列 FIFO 的淘汰结果；C 比 B 新；D 是刚插入的键。

## 参考

- [Python OrderedDict 与 LRU 相关操作](https://docs.python.org/3/library/collections.html#ordereddict-objects)
