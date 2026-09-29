---
slug: "hash-collisions-resizing"
title: "哈希冲突、负载因子与扩容"
subject: "数据结构与算法"
description: "用四个整数亲手看链式哈希表的冲突和重新散列，区分期望常数与最坏线性。"
order: 49
minutes: 20
lab: "walkthrough"
objectives: ["解释冲突不等于键相等", "手算扩容前后的桶位置", "带着哈希分布前提表述查找复杂度"]
prerequisites: ["hash-table", "amortized-dynamic-array"]
---

# 哈希冲突、负载因子与扩容

## 一个桶里能有几个不同键

哈希表（Hash Table）先用哈希函数（Hash Function）把键映射到桶。为便于手算，本课用非负整数键、`bucket(key)=key mod M`，初始桶数 `M=4`。插入键 2、6、10 时，三者都落在桶 2，但它们不是相同的键。这叫哈希冲突（Hash Collision），不是插入失败。

本课采用**拉链法**（Separate Chaining）：每个桶保留一条键列表，查找时先算桶号，再在该桶里用相等比较找具体键。若查找 6，只看到桶里有 2 并不能返回“命中”或“未命中”，必须继续比较到 6。真实散列函数通常比简单取模更讲究分布；本课的函数只用于展示机制。

负载因子（Load Factor）定义为 `α=N/M`，N 为已存的**不同键**数、M 为桶数。拉链法的 α 是平均每桶键数，可以超过 1；开放寻址法的 α 意义和约束不同，不能直接套用同一阈值。

## 逐步推演

### 初始四个空桶

`M=4,N=0,α=0`；桶 0、1、2、3 都为空。约定如果**下一次插入后** `N/M>0.75`，先把桶数翻倍，再插入该键。`0.75` 是本示例的实现策略，不是哈希表定义的一部分。

### 插入 2 和 6

`2 mod 4=2`，桶 2 变 `[2]`；`6 mod 4=2`，桶 2 变 `[2,6]`。此时 `N=2,α=0.5`，发生冲突但两键都完整保留。

### 插入 10

`10 mod 4=2`，桶 2 变 `[2,6,10]`；`N=3,α=0.75`，等于阈值，按本课的“超过才扩”约定仍不扩容。查找 10 在最坏的这个桶里要逐个比较三项。

### 插入 14 前先扩到八桶

若直接插入，`(N+1)/M=4/4=1>0.75`，先令 `M=8` 并**重新散列已有键**：2 和 10 去桶 2，6 去桶 6。不能只把原桶数组后面补四个空位，否则 6 还留在旧桶 2，而新计算的 `6 mod 8=6` 会找错位置。

### 再插入 14

`14 mod 8=6`，桶 6 变 `[6,14]`；桶 2 是 `[2,10]`。最终 `N=4,M=8,α=0.5`。扩容只是重排桶，不会改变键集合；两个桶里仍各有一次冲突。

## 面试回答

不同键可能落到同一桶，称为哈希冲突；拉链法把桶内键继续存放并用相等比较区分。负载因子 `α=N/M` 描述平均桶长，扩容后必须按新桶数重新计算全部键的位置。若哈希值分布接近均匀、负载受控，查找和插入的期望成本可近似 `O(1+α)`；单个桶被大量键击中时最坏仍为 `O(N)`。一次扩容要重散列 `O(N)` 个键；若桶数按常数倍率增长、只讨论连续插入，重散列总成本可摊到每次插入的常数级，但这不消除碰撞导致的最坏查找成本。

## 多语言示例

两段程序都按本课的 `M=4`、阈值 `0.75`、翻倍策略插入 `2,6,10,14`。它们把键当作集合元素，重复键不增加 N；只接受非负整数。预期最终桶 2 为 `2 10`、桶 6 为 `6 14`，且查找 10 命中。

### C++

```cpp
#include <iostream>
#include <utility>
#include <vector>

class HashSet {
    std::vector<std::vector<int>> buckets;
    int count = 0;
    void grow() {
        std::vector<std::vector<int>> next(buckets.size() * 2);
        for (const auto& chain : buckets)
            for (int key : chain) next[key % next.size()].push_back(key);
        buckets = std::move(next);
    }
public:
    HashSet() : buckets(4) {}
    bool contains(int key) const {
        for (int stored : buckets[key % buckets.size()])
            if (stored == key) return true;
        return false;
    }
    void insert(int key) {
        if (contains(key)) return;
        if (4 * (count + 1) > 3 * static_cast<int>(buckets.size())) grow();
        buckets[key % buckets.size()].push_back(key);
        ++count;
    }
    void print() const {
        for (std::size_t i = 0; i < buckets.size(); ++i) if (!buckets[i].empty()) {
            std::cout << "bucket " << i << ':';
            for (int key : buckets[i]) std::cout << ' ' << key;
            std::cout << '\n';
        }
    }
};
int main() {
    HashSet table;
    for (int key : {2, 6, 10, 14}) table.insert(key);
    table.print();
    std::cout << std::boolalpha << table.contains(10) << '\n';
}
```

### Python 3

```python
class HashSet:
    def __init__(self):
        self.buckets = [[] for _ in range(4)]
        self.count = 0

    def contains(self, key):
        return key in self.buckets[key % len(self.buckets)]

    def insert(self, key):
        if self.contains(key):
            return
        if 4 * (self.count + 1) > 3 * len(self.buckets):
            old = self.buckets
            self.buckets = [[] for _ in range(len(old) * 2)]
            for chain in old:
                for stored in chain:
                    self.buckets[stored % len(self.buckets)].append(stored)
        self.buckets[key % len(self.buckets)].append(key)
        self.count += 1

table = HashSet()
for key in (2, 6, 10, 14):
    table.insert(key)
for index, chain in enumerate(table.buckets):
    if chain:
        print('bucket', index, ':', *chain)
print(table.contains(10))  # True
```

本例键固定为非负且数量小，避免示例阈值乘法的整数溢出问题。工程实现还需定义负键映射、容量上限与异常处理。Python 的列表成员检查是桶内线性搜索。

## 容易混淆

- **冲突不是键相等**：2 与 6 同桶，但 `2 != 6`。
- **扩容不是原封不动搬桶**：6 从桶 2 移到桶 6，必须重新算索引。
- **平均/期望 O(1) 不是最坏 O(1)**：若键都进同一桶，桶内查找线性增长。
- **拉链法和开放寻址法不是同一套规则**：本课只实现拉链法，后者需要探测空槽并处理删除标记等问题。

## 选择题

四桶表里键 6 在桶 2。扩容到八桶后，不重新散列而直接查找 6，会有什么风险？

- A. 没有风险，`6 mod 8` 仍是 2
- B. 查找会去桶 6，而旧键还留在桶 2，产生错误的未命中
- C. 6 会自动变成键 2
- D. 扩容必然删除所有冲突键

**答案：B。** 新桶索引是 `6 mod 8=6`，所以必须把已有键按新容量重排。A 算错取模；C、D 不属于扩容行为。

## 参考资料

- [Princeton Algorithms：Hash Tables、拉链法与负载因子](https://algs4.cs.princeton.edu/34hash/)
