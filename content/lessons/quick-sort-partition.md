---
slug: "quick-sort-partition"
title: "快速排序的原地分区"
subject: "数据结构与算法"
description: "用末元素作 pivot 手算 Lomuto 分区，分清 pivot 已就位与整个数组已排序。"
order: 55
minutes: 21
lab: "quick-partition"
objectives: ["维持小于区、不小于区与待检查区的不变量", "手算交换和 pivot 最终位置", "解释固定末元素 pivot 的最坏情况"]
prerequisites: ["sorting-stability", "merge-sort"]
---

# 快速排序的原地分区

## 先解决一个更小的目标

快速排序（Quicksort）的关键不是一次就把全数组排好，而是先选一个基准值（Pivot），做分区（Partition）：让它左侧都**小于**它，右侧都**不小于**它，并把 pivot 放到最终下标。然后只需递归排序左右两个子区间。

本课固定使用 **Lomuto 分区的一种严格小于变体**：选当前子数组的末元素作 pivot。对 `[8,3,6,2,5]`，pivot 是 5；扫描前四项后得到 `[3,2,6,8,5]`，最后把 5 与位置 2 的 6 交换，得到 `[3,2,5,8,6]`。5 已在最终位置，但左右两段 `[3,2]`、`[8,6]` 仍没排好。这与“分区后整数组已排序”截然不同。

## 三段边界不变量

令 `i` 为“小于区”的下一个位置，`j` 为当前待检查位置；在扫描过程中始终保持：

```text
[0,i)       均 < pivot
[i,j)       均 >= pivot
[j,last)    尚未检查
[last]      pivot 本身
```

若 `a[j]<pivot`，交换 `a[i]` 与 `a[j]`，再让 `i++`；否则只让 `j++`。因此一次操作后上面的三段性质仍成立。扫描完，`i` 就是 pivot 应放的位置；交换 `a[i]` 与末元素。处理子数组 `[lo,hi]` 时，把区间起点 0 改成 `lo` 即可。

## 一轮手算

| 检查 | 动作 | 数组 | i 的新值 |
| --- | --- | --- | --- |
| 8 | `8≥5`，不交换 | `[8,3,6,2,5]` | 0 |
| 3 | `3<5`，交换下标 0、1 | `[3,8,6,2,5]` | 1 |
| 6 | `6≥5`，不交换 | `[3,8,6,2,5]` | 1 |
| 2 | `2<5`，交换下标 1、3 | `[3,2,6,8,5]` | 2 |
| 扫描结束 | 交换下标 2 与末位 | `[3,2,5,8,6]` | pivot 下标 2 |

实验让你先判断当前值应归“小于”还是“不小于”，选择错误时不推进；重复值预设里，与 pivot 相等的值留在右侧。下次递归分别处理 `[3,2]` 和 `[8,6]`，**不再包含**下标 2 的 pivot。

## 面试回答

Lomuto 分区可选末元素作 pivot，扫描其他元素，用 `i` 划出 `<pivot` 的区域，用 `j` 逐个检查：小于则与 `i` 交换并扩大左区，不小于则留在右区；最后把 pivot 换到 `i`。一次分区 `O(n)` 时间、`O(1)` 额外空间，只保证 pivot 位置正确，不保证两侧各自有序。快速排序递归处理 pivot 两侧；分区近似均衡时 `O(n log n)`，固定末元素遇到已排序或大量相等元素时可退化为 `O(n²)`，递归栈最坏 `O(n)`。这种原地交换版本通常不稳定。

## 与归并排序的关键区别

归并先把两个半边排好，再用辅助空间合并；快排先在原数组里分区，再分别处理两边。典型数组归并排序稳定、时间最坏 `O(n log n)`、需 `O(n)` 辅助数组；本课的快排分区原地、但整体最坏可能 `O(n²)` 且通常不稳定。换成随机 pivot 可改善对固定输入的**期望**表现，但不消灭所有随机结果下的最坏情况；重复键很多时可考虑三路分区，把等于 pivot 的区域单独处理。

## 多语言示例

两段程序都先对 `[8,3,6,2,5]` 做一次分区，输出 `pivot index 2` 与数组 `[3,2,5,8,6]`；随后递归排序 pivot 两侧，得到 `[2,3,5,6,8]`。示例输入是非空数组，代码的区间参数为闭区间 `[lo,hi]`。

### C++

```cpp
#include <iostream>
#include <utility>
#include <vector>

int partitionLomuto(std::vector<int>& a, int lo, int hi) {
    int pivot = a[hi], i = lo;
    for (int j = lo; j < hi; ++j) {
        if (a[j] < pivot) std::swap(a[i++], a[j]);
    }
    std::swap(a[i], a[hi]);
    return i;
}
void quickSort(std::vector<int>& a, int lo, int hi) {
    if (lo >= hi) return;
    int p = partitionLomuto(a, lo, hi);
    quickSort(a, lo, p - 1);
    quickSort(a, p + 1, hi);
}
void print(const std::vector<int>& a) {
    for (int value : a) std::cout << value << ' ';
    std::cout << '\n';
}
int main() {
    std::vector<int> a{8, 3, 6, 2, 5};
    int p = partitionLomuto(a, 0, static_cast<int>(a.size()) - 1);
    std::cout << "pivot index " << p << '\n';
    print(a);
    quickSort(a, 0, p - 1);
    quickSort(a, p + 1, static_cast<int>(a.size()) - 1);
    print(a);
}
```

### Python 3

```python
def partition(a, lo, hi):
    pivot = a[hi]
    i = lo
    for j in range(lo, hi):
        if a[j] < pivot:
            a[i], a[j] = a[j], a[i]
            i += 1
    a[i], a[hi] = a[hi], a[i]
    return i

def quick_sort(a, lo, hi):
    if lo >= hi:
        return
    p = partition(a, lo, hi)
    quick_sort(a, lo, p - 1)
    quick_sort(a, p + 1, hi)

a = [8, 3, 6, 2, 5]
p = partition(a, 0, len(a) - 1)
print('pivot index', p)  # pivot index 2
print(a)                 # [3, 2, 5, 8, 6]
quick_sort(a, 0, p - 1)
quick_sort(a, p + 1, len(a) - 1)
print(a)                 # [2, 3, 5, 6, 8]
```

## 错误反例

- “分区返回后数组已经排序”：本例 `[3,2,5,8,6]` 明显没有。
- 递归区间继续包含 pivot：可能重复处理已就位元素，边界写错时甚至无法缩小问题。
- 把 `a[j]==pivot` 当成“小于”：那是另一种 `<=` 约定，左右区间不变量必须一起改写，不能只改一处代码。
- 固定末元素处理已排序 `[1,2,3,4,5]`：每次 pivot 都落在一端，递归大小是 `n-1` 与 0，出现平方级工作。

## 选择题

对 `[8,3,6,2,5]` 完成一次本课分区后，数组是 `[3,2,5,8,6]`。哪一项可确定？

- A. 整数组已经升序
- B. 下标 2 的 5 已在最终排序位置，左边都小于它、右边都不小于它
- C. 左段 `[3,2]` 必然已排序
- D. 快排在任意输入上都只需 `O(n log n)`

**答案：B。** 分区只确定 pivot 和两侧的大小关系。A、C 被当前数组直接反驳；D 忽略固定 pivot 的退化情况。

## 参考资料

- [Clemson University：Lomuto 分区的末元素 pivot 与严格小于变体](https://malloy.people.clemson.edu/courses/3120-2025fall/slidesVids/oct17/paper.pdf)
- [Princeton Algorithms：Quicksort 的分区与最坏情况](https://algs4.cs.princeton.edu/23quicksort/)
