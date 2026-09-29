---
slug: "binary-search-boundary"
title: "二分边界：第一个不小于目标的位置"
subject: "数据结构与算法"
description: "用半开区间维护 lower_bound 不变量，区分插入位置、首个相等位置和精确命中。"
order: 51
minutes: 19
lab: "lower-bound"
objectives: ["说清半开区间 [left,right) 的含义", "手算含重复值和未命中时的 lower_bound", "用返回下标再判断是否精确命中"]
prerequisites: ["binary-search", "complexity"]
---

# 二分边界：找到第一个不小于目标的位置

## 从一个重复值问题开始

在升序数组 `[1,3,3,3,7,9]` 中查找 `3`，普通二分查找可能先命中下标 3，但题目若要**第一个** 3，答案是下标 1。若目标是 `4`，数组里不存在 4，却仍然有一个有意义的位置：应插在下标 4，也就是 7 之前。

下界（Lower Bound）定义为**第一个满足 `a[i] >= target` 的下标**。若所有元素都比目标小，结果是数组长度 `n`；若数组为空，结果也是 0。这是“插入边界”，并不承诺该处的元素等于目标。[Python `bisect_left` 文档](https://docs.python.org/3/library/bisect.html#bisect.bisect_left)给出了同样的左侧 `< target`、右侧 `>= target` 分割语义。

本课所有数组按数值非降序排列（允许重复），下标从 0 开始。若数组无序，不能根据一次中点比较排除整段。

## 半开区间不是记号游戏

这次与上一课的闭区间精确查找不同，约定待检查元素位于半开区间（Half-Open Interval）`[left, right)`：包含 `left`，不包含 `right`。初始 `left = 0`、`right = n`，所以最后一个元素下标 `n-1` 在区间内，而 `n` 是可能的返回位置，不是可读取的数组元素。

始终保持以下循环不变量（Loop Invariant）：

1. 下标小于 `left` 的元素都 `< target`，已经确认太小。
2. 下标大于或等于 `right` 且仍在数组内的元素都 `>= target`，已经确认合格。
3. `[left, right)` 是还未排除的元素区域；真正的下界下标在闭范围 `[left, right]` 内，可能等于末端 `right`。

第三点容易混淆：`right` 不是待读取元素，却仍可能就是答案。比如 `[1,3]` 中找 9，最后返回 `2`，绝不能访问 `a[2]` 来做中点比较。

## 为什么相等时不能返回

令 `mid = left + floor((right-left)/2)`。由于循环条件是 `left < right`，可保证 `mid` 在 `[left,right)` 内。

| 比较结果 | 可排除的元素 | 更新 |
| --- | --- | --- |
| `a[mid] < target` | 下标 `0..mid` 都太小 | `left = mid + 1` |
| `a[mid] >= target` | 由有序性知 `mid` 及其右侧都合格，首个合格位置不在 `mid` 右侧 | `right = mid` |

遇到相等时不直接返回，因为左边可能还有相等元素。更新 `right = mid` 保留 `mid` 作为可能答案；当 `left === right`，未分类区域为空，边界位置就是 `left`。

## 手算含重复值的目标 3

| 轮次 | 比较前 `[left,right)` | mid 与元素 | 更新后区间 | 解释 |
| --- | --- | --- | --- | --- |
| 初始 | `[0,6)` | — | `[0,6)` | 6 个元素待判断 |
| 1 | `[0,6)` | `mid=3, a[3]=3` | `[0,3)` | 3 合格，但左边可能还有 3 |
| 2 | `[0,3)` | `mid=1, a[1]=3` | `[0,1)` | 下标 1 也合格，继续找更早的 |
| 3 | `[0,1)` | `mid=0, a[0]=1` | `[1,1)` | 1 太小；终止，返回 1 |

注意第三轮的 `right=1` 本身就是答案：下标 1 的元素是 3。重复值的左边界被找到了，普通“找到一个就返回”的二分查找无法保证这一点。

## 没找到，也要给出边界

仍用 `[1,3,3,3,7,9]`，目标换成 4：

| 比较前区间 | 中点 | 判断 | 更新后区间 |
| --- | --- | --- | --- |
| `[0,6)` | `mid=3, a[3]=3` | 3 < 4 | `[4,6)` |
| `[4,6)` | `mid=5, a[5]=9` | 9 >= 4 | `[4,5)` |
| `[4,5)` | `mid=4, a[4]=7` | 7 >= 4 | `[4,4)` |

返回下标 4，表示将 4 插入此处仍保持有序；但 `a[4]` 是 7，故**精确查找失败**。若目标大于所有元素，返回 `n`，此时必须先检查 `index < n`，才能读取 `a[index]`。

## 面试回答

`lower_bound` 在非降序数组里找第一个 `>= target` 的位置；它返回插入下标，不等于“找到了目标”。采用 `[left,right)`，维护左侧都 `< target`、右侧都 `>= target`；若中点较小就令 `left=mid+1`，否则令 `right=mid`，直到两者相等。重复值时得到第一个相等位置；要判断精确命中，还须检查 `index < n && a[index] === target`。随机访问数组上的查找时间为 `O(log n)`，迭代变量额外空间 `O(1)`；真正向数组插入元素仍可能搬移 `O(n)` 个元素。

## 把不变量写成程序

不依赖具体语言，核心循环只有两种更新。输入是已经排好序的数组；为保持二分查找的时间成本，这里不在每次调用前重新排序或扫描验证有序性。

```text
left = 0，right = 数组长度
当 left < right：
    mid = left + floor((right - left) / 2)
    如果 a[mid] < target：left = mid + 1
    否则：right = mid
返回 left
```

下界返回后，再用 `index < n && a[index] == target` 判断精确命中。先判断范围是必要的短路条件，尤其当结果为 `n` 时。数值相等的具体语法和精度约定由语言、数据类型决定；下面七段示例统一使用小整数。

## 多语言示例

七种语言都对 `[1,3,3,3,7,9]` 依次查询 `3`、`4`、`10`，最后在空数组里查询 `3`。每行依次输出“下界下标”和“该下标是否精确等于目标”，共同的结果是 `1 yes`、`4 no`、`6 no`、`0 no`。所有实现都手写相同的半开区间循环，便于核对边界；`yes/no` 仅是演示文本，不是各语言标准库的返回约定。

### C

```c
#include <stddef.h>
#include <stdio.h>

size_t lower_bound_index(const int values[], size_t length, int target) {
    size_t left = 0, right = length;
    while (left < right) {
        size_t mid = left + (right - left) / 2;
        if (values[mid] < target) left = mid + 1;
        else right = mid;
    }
    return left;
}

void show(const int values[], size_t length, int target) {
    size_t index = lower_bound_index(values, length, target);
    int found = index < length && values[index] == target;
    printf("%zu %s\n", index, found ? "yes" : "no");
}

int main(void) {
    const int values[] = {1, 3, 3, 3, 7, 9};
    size_t length = sizeof values / sizeof values[0];
    const int targets[] = {3, 4, 10};
    for (size_t i = 0; i < 3; ++i) show(values, length, targets[i]);
    show(NULL, 0, 3);
    return 0;
}
```

C 数组形参退化为指针，因此长度必须单独传入。最后一行传入空数组的空指针，循环不会读取它；`index < length` 也保证后续比较不会解引用。

### C++

```cpp
#include <cstddef>
#include <initializer_list>
#include <iostream>
#include <vector>

std::size_t lowerBound(const std::vector<int>& values, int target) {
    std::size_t left = 0, right = values.size();
    while (left < right) {
        const std::size_t mid = left + (right - left) / 2;
        if (values[mid] < target) left = mid + 1;
        else right = mid;
    }
    return left;
}

void show(const std::vector<int>& values, int target) {
    const std::size_t index = lowerBound(values, target);
    const bool found = index < values.size() && values[index] == target;
    std::cout << index << ' ' << (found ? "yes" : "no") << '\n';
}

int main() {
    const std::vector<int> values{1, 3, 3, 3, 7, 9};
    for (int target : {3, 4, 10}) show(values, target);
    show({}, 3);
}
```

`const std::vector<int>&` 避免复制输入，`std::size_t` 与容器长度类型一致。标准库也提供 `std::lower_bound`，但手写循环更容易看清本课不变量。

### Python 3

```python
def lower_bound(values, target):
    left, right = 0, len(values)
    while left < right:
        mid = left + (right - left) // 2
        if values[mid] < target:
            left = mid + 1
        else:
            right = mid
    return left


def show(values, target):
    index = lower_bound(values, target)
    found = index < len(values) and values[index] == target
    print(index, "yes" if found else "no")


values = [1, 3, 3, 3, 7, 9]
for target in (3, 4, 10):
    show(values, target)
show([], 3)
```

Python 的 `//` 在此对非负区间长度向下取整。`bisect.bisect_left` 是提供相同位置语义的标准库函数；这里仍保留完整手写过程。

### Rust

```rust
fn lower_bound(values: &[i32], target: i32) -> usize {
    let (mut left, mut right) = (0, values.len());
    while left < right {
        let mid = left + (right - left) / 2;
        if values[mid] < target { left = mid + 1; }
        else { right = mid; }
    }
    left
}

fn show(values: &[i32], target: i32) {
    let index = lower_bound(values, target);
    let found = index < values.len() && values[index] == target;
    println!("{} {}", index, if found { "yes" } else { "no" });
}

fn main() {
    let values = [1, 3, 3, 3, 7, 9];
    for target in [3, 4, 10] { show(&values, target); }
    show(&[], 3);
}
```

Rust 的 `&[i32]` 是只读切片。`&&` 短路，空切片和返回长度时不会访问 `values[index]`。

### Zig

```zig
const std = @import("std");

fn lowerBound(values: []const i32, target: i32) usize {
    var left: usize = 0;
    var right: usize = values.len;
    while (left < right) {
        const mid = left + (right - left) / 2;
        if (values[mid] < target) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }
    return left;
}

fn show(values: []const i32, target: i32) void {
    const index = lowerBound(values, target);
    const found = index < values.len and values[index] == target;
    const label: []const u8 = if (found) "yes" else "no";
    std.debug.print("{d} {s}\n", .{ index, label });
}

pub fn main() void {
    const values = [_]i32{ 1, 3, 3, 3, 7, 9 };
    for ([_]i32{ 3, 4, 10 }) |target| show(&values, target);
    show(&[_]i32{}, 3);
}
```

Zig 的 `[]const i32` 是只读切片，`and` 会短路。`std.debug.print` 写诊断输出；示例用它观察结果，不等同于标准输出流。[Zig 0.15.2 语言文档](https://ziglang.org/documentation/0.15.2/)

### Java

```java
public class Main {
    static int lowerBound(int[] values, int target) {
        int left = 0, right = values.length;
        while (left < right) {
            int mid = left + (right - left) / 2;
            if (values[mid] < target) left = mid + 1;
            else right = mid;
        }
        return left;
    }

    static void show(int[] values, int target) {
        int index = lowerBound(values, target);
        boolean found = index < values.length && values[index] == target;
        System.out.println(index + " " + (found ? "yes" : "no"));
    }

    public static void main(String[] args) {
        int[] values = {1, 3, 3, 3, 7, 9};
        for (int target : new int[]{3, 4, 10}) show(values, target);
        show(new int[0], 3);
    }
}
```

Java 数组有 `length` 属性；判断 `index < values.length` 先于取值。`Arrays.binarySearch` 是另一种接口，重复值时不能把它当作“必返第一个相等下标”。

### Kotlin

```kotlin
fun lowerBound(values: IntArray, target: Int): Int {
    var left = 0
    var right = values.size
    while (left < right) {
        val mid = left + (right - left) / 2
        if (values[mid] < target) left = mid + 1
        else right = mid
    }
    return left
}

fun show(values: IntArray, target: Int) {
    val index = lowerBound(values, target)
    val found = index < values.size && values[index] == target
    println("$index ${if (found) "yes" else "no"}")
}

fun main() {
    val values = intArrayOf(1, 3, 3, 3, 7, 9)
    for (target in intArrayOf(3, 4, 10)) show(values, target)
    show(intArrayOf(), 3)
}
```

Kotlin 使用 `IntArray` 与 `.size`；这里写出循环，是为了与其他语言逐行对应，不把不同语言的库函数约定混为一谈。

## 为什么会停，为什么不会漏

当 `a[mid] < target` 时，`mid` 和它左侧都不能作为下界，故 `left` 跨过 `mid`；否则 `mid` 合格，缩小 `right` 但不跨过它。两种情况都维护了左右两侧的已知性质，也都让待检查区间变短。区间长度是非负整数，所以循环必定结束；结束时 `left === right`，左边全不合格、右边全合格，这个交界处就是第一个合格位置。

每轮把待检查元素数量大致减半，数组按下标访问与比较均为常数时间时为 `O(log n)`。没有额外复制数组，核心查找只需几个整数变量。若用链表逐次找中点，不能把随机访问数组的时间结论原封不动套用。[Python `bisect` 文档的性能说明](https://docs.python.org/3/library/bisect.html#performance-notes)也区分了二分查找与线性时间的列表插入。

## 和其他边界问题别混为一谈

- **精确查找一个命中位置：** 可以在 `a[mid] === target` 时立即返回；重复元素中不保证是哪一个。
- **第一个等于目标的位置：** 先求本课下界，再检查该位置是否在数组内且等于目标；否则返回未命中。
- **第一个大于目标的位置：** 条件变成 `a[mid] <= target` 时向右，得到的是上界（Upper Bound）。不能只改题目文字、却保留本课的比较条件。
- **有序插入：** 下界给出重复值之前的插入位置；实际把新元素放进普通连续数组仍可能移动后续元素。

## 常见误区

- **“遇到等于目标就返回。”** 对 `[1,3,3,3,7,9]` 中的 3，第一次中点是下标 3，不是最左位置 1。
- **“`right=n` 会访问越界。”** `right` 是半开区间外的边界；只在 `left<right` 时访问 `mid<right<=n`，不会访问 `a[n]`。
- **“下界位置就是命中位置。”** 目标 4 的下界是 4，但该位置的值是 7；目标 10 的下界甚至是数组长度 6。
- **“空数组要特判返回 -1。”** 下界返回插入位置 0，精确查找才返回 -1；两个接口的返回含义不同。
- **“把 `right=mid` 改成 `right=mid-1` 也能找左界。”** 这样会把可能恰好是答案的 `mid` 排掉，与半开区间不变量不一致。

## 选择题

对 `[1,3,3,3,7,9]` 求目标 4 的下界，得到的位置和精确命中结果是什么？

- A. 下界 3，精确命中 3
- B. 下界 4，精确命中 4
- C. 下界 4，精确查找未命中
- D. 下界 6，精确查找未命中

**答案：C。** 下标 0..3 的值都小于 4，首个 `>=4` 的元素 7 位于下标 4；它不等于 4。A 把最后一个较小元素当成答案；B 把插入位置误当精确命中；D 则越过了已合格的下标 4。

## 面试追问

**目标比所有元素大时，为什么返回 n 而不是 n-1？**

因为没有任何现存元素满足 `>= target`；插在最后一个元素之后的边界位置正是 n。若要转成“查找结果”，再检查 `index<n`，未命中可转为 -1。返回 n 是边界算法的正常答案，不是越界错误。

## 参考资料

- [Python 官方文档：bisect_left 的插入位置语义](https://docs.python.org/3/library/bisect.html#bisect.bisect_left)
- [Python 官方文档：bisect 的性能说明](https://docs.python.org/3/library/bisect.html#performance-notes)
- [Princeton Algorithms：二分查找的基本区间方法](https://algs4.cs.princeton.edu/11model/BinarySearch.java.html)
