---
slug: "amortized-dynamic-array"
title: "动态数组：为什么扩容仍能均摊 O(1)"
subject: "数据结构与算法"
description: "逐次记录容量翻倍和旧元素搬迁，用总成本解释一次慢、长期仍快。"
order: 45
minutes: 20
lab: "walkthrough"
objectives: ["手算连续追加时的扩容与搬迁次数", "区别单次最坏和均摊复杂度", "说清倍增策略的空间代价与适用前提"]
prerequisites: ["array-linked-list", "complexity"]
---

# 动态数组：为什么扩容仍能均摊 O(1)

## 一次追加可能很慢

动态数组（Dynamic Array）用一块连续存储区保留 `size` 个已用位置和 `capacity` 个已分配位置。若 `size<capacity`，追加只在末尾写一个元素；若已满，先分配更大空间，搬走旧元素，再写新元素。这里分析**从容量 1 开始、满时容量翻倍、只做连续追加**的教学模型。具体语言库的扩容系数不一定是 2，不能把这张表当成 `std::vector` 或 Python `list` 的实现承诺。

| 追加 | 追加前 size / capacity | 本次搬迁旧元素 | 追加后 size / capacity | 本次写入数（含新元素） |
| --- | --- | ---: | --- | ---: |
| A | 0 / 1 | 0 | 1 / 1 | 1 |
| B | 1 / 1 | 1 | 2 / 2 | 2 |
| C | 2 / 2 | 2 | 3 / 4 | 3 |
| D | 3 / 4 | 0 | 4 / 4 | 1 |
| E | 4 / 4 | 4 | 5 / 8 | 5 |

五次追加总共搬迁 `0+1+2+0+4=7` 个旧元素，再加 5 次新元素写入，共 12 次元素写入。追加 E 这**一次**要搬 4 个旧元素，随已有长度增长，是 `O(n)`；不能说“每次都是 O(1)”。

## 逐步推演

### A：尚有空位

初始已分配 1 格，`size=0`。把 A 写进第 0 格，不搬旧元素；结束时 `size=1, capacity=1`。

### B：首次扩容

容量已满。申请容量 2 的新数组，搬 A 一次，再把 B 写进第 1 格；本次成本按元素写入数计为 2。

### C：再翻倍

旧容量 2 再次满，申请容量 4，搬 A、B 两次，再写 C；本次成本为 3。翻倍后尚有一个空位。

### D：直接追加

把 D 写进第 3 格，不扩容。本次成本为 1，结束时 `size=capacity=4`。

### E：看到最贵的一次

申请容量 8，搬 A、B、C、D 四次，再写 E。本次成本为 5，但这次扩容留下 3 个空位，后续三次追加无需再搬旧元素。

## 总账为何是线性

对从空数组开始的连续 `n` 次追加，触发扩容时被搬的元素个数依次是 `1,2,4,8,…`，最后一次的搬迁量小于 `n`。几何级数总和小于 `2n`，另有 `n` 次新元素写入，总成本小于 `3n` 个这样的基本写入。因此这 `n` 次操作总成本 `O(n)`，**每次均摊（Amortized）`O(1)`**。均摊分析是对任意这段操作序列的成本分摊，不是说某一次操作随机地有 `O(1)` 平均耗时，也不依赖输入概率分布。

在这个模型里，只要 `size=n>0`，扩容后的容量小于 `2n`，所以数组占用 `O(n)` 个槽位，但为了少搬迁，最多会有接近一半的空槽。若每次只加 1 格容量，连续追加的搬迁量会是 `1+2+…+(n-1)=Θ(n²)`，均摊退化为 `Θ(n)`。这就是几何增长的意义。

## 面试回答

满容量时翻倍的动态数组，一次 `append` 最坏要复制已有 `n` 个元素，是 `O(n)`；但连续 `n` 次追加中，旧元素总搬迁次数形成 `1+2+4+…<2n`，加上 `n` 次新写入，总成本 `O(n)`，所以追加的均摊时间是 `O(1)`。随机访问仍是 `O(1)`，末尾追加以外的中间插入通常需搬移元素，不能套用本结论。容量按倍数增长会用 `O(n)` 空间。本结论针对指定的倍增和追加策略；不同的缩容策略、内存分配成本或异常处理需另行分析。

## 多语言示例

下面自行实现一个容量翻倍的字符数组，避免依赖标准容器未承诺的实际增长系数。输入依次是 A、B、C、D、E；每次打印追加后的 `size capacity 累计旧元素搬迁数`，最后应为 `5 8 7`。

### C++

```cpp
#include <cstddef>
#include <iostream>
#include <vector>

class DoublingArray {
    std::vector<char> storage;
    std::size_t used = 0;
    std::size_t copied = 0;
public:
    DoublingArray() : storage(1) {}
    void append(char value) {
        if (used == storage.size()) {
            std::vector<char> next(storage.size() * 2);
            for (std::size_t i = 0; i < used; ++i) {
                next[i] = storage[i];
                ++copied;
            }
            storage.swap(next);
        }
        storage[used++] = value;
    }
    void report() const {
        std::cout << used << ' ' << storage.size() << ' ' << copied << '\n';
    }
};

int main() {
    DoublingArray a;
    for (char value : {'A', 'B', 'C', 'D', 'E'}) {
        a.append(value);
        a.report();
    }
}
```

### Python 3

```python
class DoublingArray:
    def __init__(self):
        self.storage = [None]
        self.used = 0
        self.copied = 0

    def append(self, value):
        if self.used == len(self.storage):
            next_storage = [None] * (2 * len(self.storage))
            for i in range(self.used):
                next_storage[i] = self.storage[i]
                self.copied += 1
            self.storage = next_storage
        self.storage[self.used] = value
        self.used += 1

    def report(self):
        print(self.used, len(self.storage), self.copied)

array = DoublingArray()
for value in 'ABCDE':
    array.append(value)
    array.report()
# 最后一行：5 8 7
```

上述成本只数显式元素写入；真实运行时间还包含分配、初始化和语言运行时开销。Python 示例的 `[None] * capacity` 会初始化新槽位，仍是与容量同阶；总量在倍增序列下也为 `O(n)`。标准容器的容量增长策略可能不同，但只要保持合适的几何增长率，类似的均摊论证仍适用。

## 选择题

某实现满时只把容量从 `k` 增到 `k+1`。从空表连续追加 `n` 个元素，最直接的性能后果是什么？

- A. 每次追加的最坏时间变成 `O(1)`
- B. 总搬迁次数为 `Θ(n²)`，均摊追加可能是 `Θ(n)`
- C. 数组失去 `O(1)` 随机访问能力
- D. 容量在任何时候都大于 `2n`

**答案：B。** 第 k 次扩容需搬 k 个旧元素，累加 `1+2+…+(n-1)` 是二次量级；存储仍连续，随机访问没有因此消失。

## 参考资料

- [MIT 6.046J：Amortized Analysis 与 Table Doubling](https://ocw.mit.edu/courses/6-046j-design-and-analysis-of-algorithms-spring-2012/83b82d45beb3776da72b7f3e1b3f42df_MIT6_046JS12_lec11.pdf)
