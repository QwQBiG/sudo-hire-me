---
slug: "sorting-stability"
title: "排序、稳定性与代价"
subject: "数据结构与算法"
description: "让相同键带着原始编号排序，观察为何结果有序仍可能改变记录的先后。"
order: 9
minutes: 20
lab: "sorting"
objectives: ["用具体数据解释排序稳定性", "推导插入排序和选择排序的一轮操作", "区分时间复杂度、额外空间和稳定性"]
prerequisites: ["array-linked-list", "complexity"]
---

# 排序、稳定性与代价

## 面试回答

排序（Sorting）按键重排元素；稳定排序（Stable Sort）保留相等键的原有相对次序。只右移严格更大键的插入排序（Insertion Sort）稳定，最好时间 Θ(n)、最坏 Θ(n²)；直接交换最小值的选择排序（Selection Sort）比较次数始终为 Θ(n²)，这种实现不稳定。两者的原地版本额外空间均为 O(1)。典型数组归并排序（Merge Sort）稳定且时间为 Θ(n log n)，但需 O(n) 辅助数组；典型原地快速排序（Quicksort）平均时间 O(n log n)、最坏 O(n²)，通常不稳定。选择前要说明稳定性、数据规模与有序程度、额外空间和最坏情况要求。

## 从一个看似排好的结果开始

假设每条记录有一个用于比较的整数键，字母是它在原输入中的编号：

```text
输入：2a  2b  1  3
```

`2a` 与 `2b` 的键都为 2。只按键看，`1  2b  2a  3` 和 `1  2a  2b  3` 都已升序；若这些是“同分考生”，两种结果的同分先后却不同。稳定性讨论的是相等键记录的**相对次序**，不是排序结果有没有序。[MIT OpenCourseWare：Stable Sorting](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2008/resources/lec11/)

比较时只看整数键，字母不参与大小判断。若把字母也放进比较键，`2a` 与 `2b` 就不再是“相等键”，也无法用这组数据检验稳定性。

## 插入排序：把新元素放进已排序前缀

插入排序在第 i 轮之前，保证下标 `0..i-1` 的前缀已排序。取出下标 i 的元素，向左比较；只有左侧键**严格大于**它，才把左侧元素向右搬移一格，最后填入空位。

| 轮次 | 取出的元素 | 搬移后放入 | 整个数组 |
| --- | --- | --- | --- |
| 初始 | 无 | 第一个元素可视为已排序 | `2a  2b  1  3` |
| i=1 | `2b` | 与 `2a` 相等，不搬移 | `2a  2b  1  3` |
| i=2 | `1` | `2b`、`2a` 各右移一格 | `1  2a  2b  3` |
| i=3 | `3` | 左边的键不大于 3 | `1  2a  2b  3` |

这里 `2b` 不会越过相等的 `2a`。条件若误写成“大于或等于就搬移”，相等键也会被跨过，稳定性的结论便不再成立。可以用循环不变量（Loop Invariant）说明正确性：开始时长度为 1 的前缀有序；每轮把一个元素插到有序前缀的正确位置；最后整个数组有序。[MIT OpenCourseWare：Insertion Sort, Merge Sort](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/resources/lecture-3-insertion-sort-merge-sort/)

```javascript
function insertionSort(items) {
  const a = items.slice();
  for (let i = 1; i < a.length; i++) {
    const current = a[i];
    let j = i - 1;
    while (j >= 0 && a[j].key > current.key) {
      a[j + 1] = a[j];
      j--;
    }
    a[j + 1] = current;
  }
  return a;
}
```

代码返回新数组，因此**这段代码整体**还要为副本使用 O(n) 空间；如果允许直接修改输入数组，排序核心只需一个临时元素及下标，额外空间 O(1)。讨论“原地”时必须说清是否把复制输入的空间计入。输入基本有序时搬移少；若完全逆序，每个新元素都要越过前缀中的多个元素。

## 选择排序：找到最小值后交换

本课的选择排序在第 i 轮扫描剩余位置，找到最小键的一个位置，再与位置 i 交换。为避免额外交换，相等键时保留先发现的最小位置。

对 `2a  2b  1  3` 的第一轮，最小键 1 在下标 2，于是把 `1` 和下标 0 的 `2a` 交换：

```text
2a  2b  1  3
 ↓       ↓
1   2b  2a 3
```

后续两轮按键完成排序，但 `2b` 已排在原本更早的 `2a` 前面。选择排序的**这种直接交换实现**不稳定；不能由“选择最小值”几个字断言所有变体都必须不稳定。保持稳定的选择排序变体可以把最小元素取出，再整体移动中间记录，但移动代价不同。[MIT OpenCourseWare：Stable Sorting](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2008/resources/lec11/)

## 三种代价不要混为一谈

以下 n 为元素数，比较操作视为 O(1)；空间指不计输入与最终输出的常规辅助空间。归并、快速排序的结果与具体实现有关，表中只讨论注明的典型版本。

| 算法与实现 | 最好时间 | 平均时间 | 最坏时间 | 额外空间 | 稳定性 |
| --- | --- | --- | --- | --- | --- |
| 原地插入排序，仅在左键更大时搬移 | Θ(n) | Θ(n²) | Θ(n²) | O(1) | 稳定 |
| 原地选择排序，最小元素直接交换到前端 | Θ(n²) | Θ(n²) | Θ(n²) | O(1) | 不稳定 |
| 数组归并排序，合并时相等键先取左侧 | Θ(n log n) | Θ(n log n) | Θ(n log n) | O(n) | 稳定 |
| 常见原地划分的快速排序 | O(n log n) | O(n log n) | O(n²) | 递归栈，依划分而变 | 通常不稳定 |

选择排序不管输入是否已经有序，每轮仍扫描剩余部分，因此比较次数为 `(n−1)+(n−2)+…+1 = n(n−1)/2`。它最多进行 n−1 次“非自身”交换，但比较少与交换少是不同指标。插入排序在已排序输入中通常每轮只做一次边界比较，总体为 Θ(n)；在逆序输入中比较和搬移总数都可达 Θ(n²)。[OpenDSA：Sorting Algorithms](https://opendsa-server.cs.vt.edu/ODSA/Books/CSC3280/html/SortingEmpirical.html)

归并排序先把问题拆成较小子数组，再线性合并；“相等先取左侧”是稳定性的关键。如果合并时相等键先取右侧，可能打破原顺序。经典数组合并需要额外数组；不能把“递归深度 O(log n)”误当成总辅助空间。快速排序的划分若长期极不均衡，时间可能退化到 O(n²)；不同主元选择与实现会改变平均、最坏以及栈深分析。[MIT OpenCourseWare：Insertion Sort, Merge Sort](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/resources/lecture-3-insertion-sort-merge-sort/)

## 在实验里看什么

网站同时对同一组数据运行上述插入排序与直接交换的选择排序。每按一次“下一轮”，两边各完成一次外层循环；它不是按真实运行时间同步。先用相同键数据观察第一轮后的 `2a` 与 `2b`，再切换“已经有序”和“逆序”，比较键比较次数与数据搬移、交换次数。

计数只服务于当前四个元素的具体实现，不是性能基准测试。插入排序的“搬移次数”只计把已有元素右移；选择排序的“交换次数”计两位置交换，二者不能直接相加或拿数值大小判断谁一定更快。

## 常见误区

- **“输出升序就说明算法稳定。”** 同键元素可能被换序，必须给相等键加可识别编号。
- **“选择排序的交换少，所以时间是 O(n)。”** 寻找每轮最小值仍要做二次量级比较。
- **“插入排序始终是 O(n²)。”** 对已经有序的输入，这种实现仅需线性比较与常数额外空间。
- **“任何归并排序都自然稳定。”** 合并时相等键的取出规则也要满足稳定性。
- **“空间 O(1) 是代码无条件成立的。”** 如果先复制输入并保留副本，就要把复制占用的 O(n) 空间计入该函数。

## 选择题

对 `2a、2b、1` 只按整数键升序排序，哪种结果能证明所用实现不稳定？

- A. `1、2a、2b`
- B. `1、2b、2a`
- C. `2a、2b、1`
- D. `2b、2a、1`

**答案：B。** B 已按键升序，但两个键为 2 的记录相对次序从 `2a` 在前变为 `2b` 在前，违反稳定性。A 既有序又保持相对次序；C、D 没按键完成升序，不能拿它们证明一个“已完成排序”的稳定性结果。

## 面试追问

**如果要先按姓名、再按分数排序，稳定性有什么用？**

可以先按次要键姓名排序，再使用按分数的稳定排序。第二次排序会把不同分数放到对应位置，同时保留同分记录原有的姓名次序。顺序不能颠倒：若先按分数再按姓名，最终主要顺序通常会变成姓名。[Python Sorting HOW TO：Sort Stability](https://docs.python.org/3/howto/sorting.html#sort-stability-and-complex-sorts)

**面对大量数据可以直接回答“快速排序最好”吗？**

不能。是否要求稳定、是否允许额外空间、输入是否近乎有序、是否需要最坏情况保证，都会影响选择；特定语言标准库也可能使用混合算法。面试中先说明需求与具体实现的保证，再给出选择理由。

## 参考资料

- [MIT OpenCourseWare：Insertion Sort, Merge Sort](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/resources/lecture-3-insertion-sort-merge-sort/)
- [MIT OpenCourseWare：Stable Sorting](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2008/resources/lec11/)
- [Python 文档：Sort Stability and Complex Sorts](https://docs.python.org/3/howto/sorting.html#sort-stability-and-complex-sorts)
