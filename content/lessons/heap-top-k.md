---
slug: "heap-top-k"
title: "用小顶堆找最大的 K 个数"
subject: "数据结构与算法"
description: "流式读入六个数，维护容量为 K 的小顶堆，理解堆顶为何是当前第 K 大。"
order: 59
minutes: 19
lab: "walkthrough"
objectives: ["区分小顶堆的堆顶与整个堆的顺序", "逐项更新容量为 K 的候选集合", "解释 O(n log K) 及 K 的边界"]
prerequisites: ["heap-priority-queue", "sorting-stability"]
---

# 用小顶堆找最大的 K 个数

## 为什么用小顶堆保存“大数”

给出数据流 `[7,1,9,4,8,2]`，找最大的 `K=3` 个数。若每读一个数就把全部已读数据重新排序，会做很多无用工作。只保留当前最大的 3 个候选即可；候选中**最小**的那个是门槛，新值不超过它就无需进入候选。

小顶堆（Min-Heap）恰好能在堆顶快速读到候选里的最小值。堆只保证“每个父节点不大于孩子”，**不保证整个内部数组升序**。下面表把保留的候选按升序展示，便于核对集合；这不是承诺堆的物理数组总长这样排。

## 逐步推演

### 读 7、1、9

容量还没满，依次入堆。读 7 后候选 `{7}`；读 1 后 `{1,7}`；读 9 后 `{1,7,9}`。此时堆大小 3，堆顶（当前候选最小）是 1。

### 读 4

`4>堆顶1`，说明 4 比当前第三大的候选更好。弹出 1、放入 4，候选变 `{4,7,9}`，堆顶为 4。若新值恰好等于堆顶，按本课规则可跳过：最大 K 个**数值**的多重集合仍有一个同样的值。

### 读 8

`8>堆顶4`，替换后候选 `{7,8,9}`，堆顶为 7。这里 7 是当前第 3 大；它不是整个输入中的最小值。

### 读 2

`2≤堆顶7`，跳过，候选仍是 `{7,8,9}`。读完后最终候选集合是 `7,8,9`，第 3 大是堆顶 7。若要求按升序展示三个结果，还需对候选做排序或逐个弹堆。

## 面试回答

求数据流中最大的 K 个数，可用容量为 K 的**小顶堆**。未满先入堆；满后只有新值大于堆顶时才替换堆顶，因为堆顶是当前 K 个候选里最弱的一个。扫描 `n` 个数总时间 `O(n log K)`（把 `K=1` 时的对数写成 `log(K+1)` 更严谨）、额外空间 `O(K)`；读完后堆顶是第 K 大数，堆内并非整体有序。若要求输出所有 K 个数并排序，另有 `O(K log K)` 的输出排序成本。

## 边界和比较

本课要求 `1≤K≤n`；`K=0` 若定义成“取空集”也可，但此时“第 K 大”没有意义，应由接口明确处理。`K>n` 也要约定是报错还是返回全部，本课代码报错。重复值按**元素出现次数**计，例如 `[5,5,1]` 的最大 2 个是 `[5,5]`，不是“两个不同数值”。

若只需一次找第 K 大，快速选择（Quickselect）有适合的平均时间方案；但对逐项到来的数据流、随时需要当前 Top K，固定大小堆更直接。不能从“堆顶是第 K 大”误推“堆的其余位置就是第 1、第 2 大的有序顺序”。

## 多语言示例

两段程序读取同一输入 `[7,1,9,4,8,2]`、`K=3`，返回升序展示的候选 `[7,8,9]`；同时堆顶对应第 3 大 `7`。排序展示是最后一步，不是堆的内部排列。

### C++

```cpp
#include <functional>
#include <iostream>
#include <queue>
#include <stdexcept>
#include <vector>

std::vector<int> topK(const std::vector<int>& values, int k) {
    if (k < 1 || k > static_cast<int>(values.size()))
        throw std::invalid_argument("k outside input size");
    std::priority_queue<int, std::vector<int>, std::greater<int>> heap;
    for (int value : values) {
        if (static_cast<int>(heap.size()) < k) heap.push(value);
        else if (value > heap.top()) { heap.pop(); heap.push(value); }
    }
    std::vector<int> result;
    while (!heap.empty()) { result.push_back(heap.top()); heap.pop(); }
    return result;
}

int main() {
    for (int value : topK({7, 1, 9, 4, 8, 2}, 3)) std::cout << value << ' ';
    std::cout << '\n';
}
```

### Python 3

```python
import heapq

def top_k(values, k):
    if not 1 <= k <= len(values):
        raise ValueError('k outside input size')
    heap = []
    for value in values:
        if len(heap) < k:
            heapq.heappush(heap, value)
        elif value > heap[0]:
            heapq.heapreplace(heap, value)
    return sorted(heap)

print(top_k([7, 1, 9, 4, 8, 2], 3))  # [7, 8, 9]
```

## 选择题

在处理前五个数后，堆保存 `{7,8,9}`，堆顶为 7。下一项是 2，应该怎样做？

- A. 用 2 替换 7，因为 2 比堆顶小
- B. 跳过 2，因为它不可能进入当前最大的 3 个
- C. 把堆扩容到 4，再决定
- D. 直接返回 9 作为第 3 大

**答案：B。** 小顶堆的堆顶 7 是 Top 3 的门槛，2 不够大。A 方向相反；C 破坏固定容量；D 把最大值和第 3 大混淆。

## 参考资料

- [Princeton Algorithms：Priority Queues 与二叉堆操作](https://algs4.cs.princeton.edu/24pq/)
