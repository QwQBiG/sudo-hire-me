---
slug: "binary-search"
title: "二分查找"
subject: "数据结构与算法"
description: "每一步都排除一半，靠的是什么？从区间到代码，走完一次查找。"
order: 50
minutes: 15
lab: "binary-search"
objectives: ["确定闭区间的边界","解释每次排除的理由","处理找到和找不到两种结果"]
prerequisites: ["array-linked-list", "complexity"]
---

# 二分查找：每一步为什么能排除一半

## 面试回答

二分查找（Binary Search）利用有序性，每次比较目标与当前区间的中间元素，排除不可能包含目标的一半。我会先约定区间边界，例如闭区间（Closed Interval）`[left, right]`，再确保每次更新都严格缩小区间。在可常数时间访问元素的有序数组上，最坏时间复杂度为 `O(log n)`，迭代实现的额外空间为 `O(1)`。遇到重复值时，查找任意位置和查找第一个位置需要不同处理。

## 从零理解：为什么能排除一整段

数组是 `[2, 5, 8, 12, 16, 23, 38]`，目标是 `16`。数组下标从 `0` 开始，因此找到后应该返回 `4`。

顺序查找从 `2` 开始逐个检查，需要看五个元素。二分先看中间的 `12`。因为数组有序，`12` 左边的值都不大于 `12`，不可能等于 `16`，可以一起排除。

关键不是“猜中间”，而是**用有序性证明整段位置不可能包含答案**。本课要求数组按升序排列，允许重复；比较规则在查找期间保持一致。

## 先把区间约定说清楚

闭区间 `[left, right]` 表示两个端点仍是候选位置。初始化为 `left = 0`、`right = 数组长度 - 1`。

中间位置使用 `mid = left + floor((right - left) / 2)`，其中 `floor` 表示向下取整。

例如 `[4, 5]` 的中点为 `4 + floor(1 / 2) = 4`。向下取整让结果保持整数下标；本课始终使用这一约定，不在更新边界时混入其他区间写法。

| 比较结果 | 得到的结论 | 下一步 |
| --- | --- | --- |
| `a[mid] < target` | `mid` 及其左侧都太小 | `left = mid + 1` |
| `a[mid] > target` | `mid` 及其右侧都太大 | `right = mid - 1` |
| `a[mid] === target` | 当前下标就是一个答案 | 返回 `mid` |

只要 `left <= right`，区间里就还有候选位置。`left > right` 表示区间已经空了，目标不存在。

## 一步一步找 16

| 轮次 | left | right | mid | a[mid] | 判断与操作 |
| --- | --- | --- | --- | --- | --- |
| 1 | 0 | 6 | 3 | 12 | `12 < 16`，令 `left = 4` |
| 2 | 4 | 6 | 5 | 23 | `23 > 16`，令 `right = 4` |
| 3 | 4 | 4 | 4 | 16 | 命中，返回下标 `4` |

第二轮结束后只剩下一个元素，但仍然需要检查。若循环条件误写为 `left < right`，这个位置就可能被遗漏。

再找不存在的 `15`：先排除下标 `0..3`，再排除 `5..6`，最后发现 `16 > 15`，令 `right = 3`。此时 `left = 4 > right = 3`，返回 `-1`。

## 为什么不会漏掉答案

每轮开始都保持一个约定：**如果目标存在且还没返回，那么至少一个目标位置仍在当前区间中**。这叫循环不变量（Loop Invariant）。

初始区间覆盖整个数组，约定成立。每次根据有序性排除不可能的那一侧，约定继续成立。当区间为空时，原数组中也就不存在目标。

同时，每轮未命中都会排除 `mid`，候选元素数量严格减少。因此这个过程不会永远停在同一个区间。

## 实验代码

下面的 JavaScript 函数接收按升序排列的有限数值数组和有限数值目标，返回一个命中下标，未命中返回 `-1`。代码不在每次调用中重新验证有序性，因为完整检查本身需要 `O(n)` 时间。

```javascript
function binarySearch(values, target) {
  let left = 0;
  let right = values.length - 1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    if (values[mid] === target) return mid;
    if (values[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

console.log(binarySearch([2, 5, 8, 12, 16, 23, 38], 16));
console.log(binarySearch([2, 5, 8, 12, 16, 23, 38], 15));
console.log(binarySearch([], 16));
```

```text
4
-1
-1
```

空数组的初始状态是 `left = 0`、`right = -1`，循环一次也不进入，不会访问越界位置。

## 复杂度是怎样得到的

每次未命中后，候选数量至多缩小到原来的一半。大致经历 `n → n/2 → n/4 → ... → 1`，轮次数量与 `log₂ n` 同阶。每轮只做常数次访问和比较，因此最坏时间为 `O(log n)`。

这个结论要求按下标访问和单次比较都为 `O(1)`。普通链表无法直接跳到中间节点，不能把数组上的时间结论原样套过去。迭代版只保留几个变量，额外空间为 `O(1)`；递归版还要计算调用栈空间。

如果输入尚未排序，准备有序数组也有成本。仅做一次查找时，先排序再二分未必划算；对同一份稳定数据反复查找时，排序成本才可能被多次查询分摊。

## 常见误区

- **“有一处逆序也差不多能用。”** 一次逆序就可能破坏排除依据，算法可能丢掉真正的目标。
- **“把 `left = mid + 1` 改成 `left = mid` 没关系。”** 在闭区间写法中，区间可能不再缩小，例如两个候选位置时。
- **“找到重复值就一定找到第一个。”** 这份代码只承诺返回一个命中位置。Java 的 `Arrays.binarySearch` 也不保证命中哪个重复值。[接口说明](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html#binarySearch(int%5B%5D,int))
- **“二分插入也是 `O(log n)`。”** 找插入位置可以是 `O(log n)`，数组中移动元素仍可能需要 `O(n)`。[Python bisect 文档](https://docs.python.org/3/library/bisect.html#performance-notes)

## 选择题

使用本课的闭区间算法，在 `[2, 5, 8, 12, 16, 23, 38]` 中找 `16`。完成第一轮比较后，正确状态是什么？

- A. `left = 3, right = 6`，保留已经排除的 `12`
- B. `left = 4, right = 6`，保留下标 `4..6`
- C. `left = 0, right = 2`，继续在较小的一侧查找
- D. 直接返回 `4`，因为目标一定紧挨着中点

**答案：B。** 中点为下标 `3`，值为 `12`。目标更大，所以排除下标 `0..3`。A 没有按闭区间规则排除中点；C 方向相反；D 没有检查 `a[4]`，不能提前断言命中。

## 面试追问

**如果有重复值，怎样找第一个等于目标的位置？**

遇到相等时先记录这个下标，再令 `right = mid - 1`，继续向左寻找更早的答案；循环结束返回记录值。另一种方法是先找第一个 `>= target` 的位置，再检查是否确实等于目标。解释时要补充“为什么相等后还需要继续”，不能只背修改后的代码。

## 参考资料

- [Princeton Algorithms：BinarySearch 示例](https://algs4.cs.princeton.edu/11model/BinarySearch.java.html)
- [Python：bisect 的插入位置语义与复杂度](https://docs.python.org/3/library/bisect.html)
- [Java：Arrays.binarySearch 的输入与重复值约定](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html)
