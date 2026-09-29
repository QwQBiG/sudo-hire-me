---
slug: "merge-sort"
title: "归并排序：分开再有序合并"
subject: "数据结构与算法"
description: "让两个相同键带着原编号参与归并，观察稳定性来自相等时先取左边。"
order: 54
minutes: 20
lab: "walkthrough"
objectives: ["手算拆分和两路合并", "解释相等键时的稳定性条件", "说明 O(n log n) 时间与 O(n) 辅助空间"]
prerequisites: ["sorting-stability", "recursion"]
---

# 归并排序：分开再有序合并

## 把大问题拆成两个已排序半边

归并排序（Merge Sort）的递归思路是：把数组分成左右两半，分别排好序，再把**两个有序序列**合并成一个有序序列。本课用记录 `4a,2,4b,1`：数字是比较键，a、b 是原始身份标签，不参与大小比较。最终应为 `1,2,4a,4b`，两个键为 4 的记录保持原相对顺序。

合并时只比较两个半边当前最前面的元素。较小者进入输出；若键相等，**先取左半边**。因为最初左半边记录在右半边记录之前，这条相等时的规则保住跨半边的原有先后。若各半边的递归排序也稳定，整个归并排序才稳定。

## 逐步推演

### 一分为二

`[4a,2,4b,1]` 拆成左 `[4a,2]`、右 `[4b,1]`；各自再拆成单元素 `[4a] [2] [4b] [1]`。单元素天然有序，递归在长度不超过 1 时停止。

### 合并左半边

比较 `[4a]` 与 `[2]` 的首项，键 `2<4`，先取 2；再取剩余的 4a，得到左有序段 `[2,4a]`。

### 合并右半边

比较 `[4b]` 与 `[1]`，先取 1，再取 4b，得到右有序段 `[1,4b]`。此时两个长度为 2 的半边都已排序，才能做最后归并。

### 最后归并前两次比较

比较左首 2 与右首 1，取 1；再比较左首 2 与右首 4b，取 2。输出前缀 `[1,2]`，剩余左 `[4a]`、右 `[4b]`。

### 相等键先取左侧

比较 4a 与 4b，键都为 4；按 `左键≤右键就取左`，先放 4a，再放 4b。结果 `[1,2,4a,4b]`。若相等时总先取右侧，会变成 `[1,2,4b,4a]`，仍按键有序，却**不稳定**。

## 时间、空间和边界

每层归并总共处理 `n` 个元素，拆分深度约为 `log₂n`，所以时间 `O(n log n)`，最好与最坏在这个基本实现里都是这个量级。用一块与输入等长的辅助数组存合并结果，额外数组空间 `O(n)`；递归调用栈 `O(log n)`，被前者涵盖。单独两个有序段的合并是 `O(n)`，不能误把整个归并排序说成 `O(n)`。

空数组和单元素数组无需合并。这里是**数组上的典型自顶向下实现**；链表归并可以采用不同链接策略，不能把本课的数组辅助空间无条件推广到一切归并排序实现。

## 面试回答

归并排序递归拆分数组至长度为 0 或 1，再按顺序把两个已排序半边线性合并。数组版每层工作 `O(n)`、深度 `O(log n)`，时间 `O(n log n)`，通常需要 `O(n)` 辅助数组。相同键在合并时先取左半边、且子问题处理也稳定，整个排序稳定；若相等时先取右边，则结果虽有序但可能改变相等键的原相对次序。

## 多语言示例

两段程序按记录的数字键比较，身份标签只用于输出；同一输入 `4a,2,4b,1`，预期输出 `1 2 4a 4b`。它们预先分配一块等长辅助数组，不在每层反复创建切片。

### C++

```cpp
#include <iostream>
#include <vector>

struct Item { int key; char tag; };

void mergeSort(std::vector<Item>& a, std::vector<Item>& aux, int lo, int hi) {
    if (hi - lo <= 1) return;
    int mid = lo + (hi - lo) / 2;
    mergeSort(a, aux, lo, mid);
    mergeSort(a, aux, mid, hi);
    int left = lo, right = mid;
    for (int k = lo; k < hi; ++k) {
        if (left == mid) aux[k] = a[right++];
        else if (right == hi) aux[k] = a[left++];
        else if (a[left].key <= a[right].key) aux[k] = a[left++];
        else aux[k] = a[right++];
    }
    for (int k = lo; k < hi; ++k) a[k] = aux[k];
}

int main() {
    std::vector<Item> a{{4,'a'},{2,' '},{4,'b'},{1,' '}};
    std::vector<Item> aux(a.size());
    mergeSort(a, aux, 0, static_cast<int>(a.size()));
    for (const Item& item : a) {
        std::cout << item.key;
        if (item.tag != ' ') std::cout << item.tag;
        std::cout << ' ';
    }
    std::cout << '\n';
}
```

### Python 3

```python
items = [(4, 'a'), (2, ''), (4, 'b'), (1, '')]
aux = [None] * len(items)

def merge_sort(lo, hi):
    if hi - lo <= 1:
        return
    mid = lo + (hi - lo) // 2
    merge_sort(lo, mid)
    merge_sort(mid, hi)
    left, right = lo, mid
    for k in range(lo, hi):
        if left == mid:
            aux[k] = items[right]; right += 1
        elif right == hi:
            aux[k] = items[left]; left += 1
        elif items[left][0] <= items[right][0]:
            aux[k] = items[left]; left += 1
        else:
            aux[k] = items[right]; right += 1
    items[lo:hi] = aux[lo:hi]

merge_sort(0, len(items))
print(' '.join(str(key) + tag for key, tag in items))  # 1 2 4a 4b
```

Python 最后一行切片赋值在语言层面会创建临时切片；它不改变本例总体 `O(n)` 级别的辅助空间结论，但若严格要求只使用单块固定缓冲区，可用逐位置赋值替代。

## 选择题

最后合并 `[2,4a]` 与 `[1,4b]` 时，若两个 4 相等却先取右边，会怎样？

- A. 结果不再按键升序
- B. 结果仍按键升序，但 4b 会跑到 4a 前，失去稳定性
- C. 时间复杂度自动变成 `O(n²)`
- D. 递归无法终止

**答案：B。** 只按数字键比较，两个 4 的先后不影响有序性，却影响原本的记录顺序。其他选项与取相等元素的方向无关。

## 参考资料

- [Princeton Algorithms：Mergesort 的归并与稳定性](https://algs4.cs.princeton.edu/22mergesort/)
