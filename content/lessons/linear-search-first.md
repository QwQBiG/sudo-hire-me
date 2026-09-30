---
slug: "linear-search-first"
title: "顺序查找第一个匹配项"
description: "从数组左端逐个比较，解释为什么第一个匹配下标是 1，以及查不到时如何返回。"
subject: "数据结构与算法"
order: 46
minutes: 18
lab: "workbench"
objectives: ["按下标逐次追踪顺序查找", "解释首次匹配与未找到的返回值", "分析最好与最坏时间复杂度"]
prerequisites: ["array-linked-list", "complexity"]
---

# 怎么找到第一个等于目标的元素？

## 从零理解

顺序查找（linear search）从数组第 0 项开始，逐个检查是否等于目标值。
找到后立即返回当前下标，所以如果相同值出现多次，得到的是**第一个**匹配位置。
若检查完仍未找到，就返回一个明确的“未找到”结果。使用 `-1`、`null` 或可选值是不同接口设计，不能把它们当成有效数组下标。

先只看一组输入：`[4, 7, 7, 9]`，目标值为 `7`。数组下标从 0 开始，元素 4 的下标是 0，第一个 7 的下标是 1。
这里比较的是整数值；若查找对象或字符串，具体“相等”规则需要另行定义。

## 逐步推演

### 检查下标 0

当前元素是 4，`4 == 7` 为假。不能返回；把检查位置移到下标 1。

| 已检查下标 | 当前值 | 是否匹配 | 下一步 |
| --- | ---: | --- | --- |
| 0 | 4 | 否 | 继续检查 1 |

### 检查下标 1

当前元素是 7，`7 == 7` 为真。立即返回下标 1，不再检查后面的第二个 7 或 9。

| 已检查下标 | 当前值 | 是否匹配 | 返回 |
| --- | ---: | --- | ---: |
| 0、1 | 7 | 是 | 1 |

### 处理未找到的边界

若目标改为 8，需要依次检查下标 0、1、2、3，四次比较都不匹配，然后返回“未找到”。
空数组一次比较也不做，直接返回“未找到”。不能在循环结束后盲目返回最后一个下标。

## 算法思路

```text
对 i 从 0 到数组长度减 1：
    若数组[i] 等于目标：返回 i
返回“未找到”
```

循环到下标 i 前，所有更小的下标都已检查且不匹配。这个不变量解释了为什么第一个成功的位置就是首次匹配。
最好情况是首项命中，只需一次比较，时间为 O(1)；最坏情况在末尾命中或不存在，要检查 n 项，时间为 O(n)。
额外只记录当前位置，辅助空间为 O(1)。这些复杂度不把输入数组本身计入额外空间。

## 多语言示例

七段代码都查找 `[4, 7, 7, 9]` 中第一个 `7`，预期输出都是 `1`。C、C++、Python 3、Rust、Zig、Java、Kotlin 的语法与未找到值各有区别，但每段都按相同顺序比较并在首次命中时返回。
为便于第一次读懂，下面都手写循环，不借用语言自带的查找函数。C 和 Rust 示例把下标转换为有符号返回类型，只针对这里远小于其最大值的小数组；通用库接口应避免无条件窄化。

### C

```c
#include <stddef.h>
#include <stdio.h>

int first_index(const int values[], size_t length, int target) {
    for (size_t i = 0; i < length; ++i) {
        if (values[i] == target) return (int)i;
    }
    return -1;
}

int main(void) {
    const int values[] = {4, 7, 7, 9};
    printf("%d\n", first_index(values, 4, 7));
    return 0;
}
```

C 函数同时接收数组首元素地址和长度；形参中的 `values[]` 在这里按指针处理，不会自动知道元素个数。

### C++

```cpp
#include <iostream>
#include <vector>

int first_index(const std::vector<int>& values, int target) {
    for (std::size_t i = 0; i < values.size(); ++i) {
        if (values[i] == target) return static_cast<int>(i);
    }
    return -1;
}

int main() {
    const std::vector<int> values{4, 7, 7, 9};
    std::cout << first_index(values, 7) << '\n';
}
```

`const std::vector<int>&` 避免复制整个容器，同时禁止这个函数修改它；示例同样假设下标可放入 `int`。

### Python 3

```python
def first_index(values, target):
    for index, value in enumerate(values):
        if value == target:
            return index
    return -1


print(first_index([4, 7, 7, 9], 7))
```

`enumerate` 同时给出下标和值；Python 的 `list.index` 也能查找，但未找到时会抛异常，接口行为与这里的 `-1` 不同。

### Rust

```rust
fn first_index(values: &[i32], target: i32) -> isize {
    for (index, &value) in values.iter().enumerate() {
        if value == target {
            return index as isize;
        }
    }
    -1
}

fn main() {
    let values = [4, 7, 7, 9];
    println!("{}", first_index(&values, 7));
}
```

`&[i32]` 是只读切片借用；`enumerate` 给出 `usize` 下标。本例为便于与 `-1` 对照，将小下标转换为 `isize`；一般 Rust 接口常用 `Option<usize>` 表示是否找到。

### Zig

```zig
const std = @import("std");

fn firstIndex(values: []const i32, target: i32) ?usize {
    for (values, 0..) |value, index| {
        if (value == target) return index;
    }
    return null;
}

pub fn main() void {
    const values = [_]i32{ 4, 7, 7, 9 };
    if (firstIndex(&values, 7)) |index| {
        std.debug.print("{d}\n", .{index});
    } else {
        std.debug.print("-1\n", .{});
    }
}
```

`[]const i32` 是只读切片，`?usize` 表示“下标或 null”。Zig 的 `std.debug.print` 写诊断输出；本例用它直观看到结果，不把它等同于标准输出流。

### Java

```java
public class Main {
    static int firstIndex(int[] values, int target) {
        for (int i = 0; i < values.length; i++) {
            if (values[i] == target) return i;
        }
        return -1;
    }

    public static void main(String[] args) {
        int[] values = {4, 7, 7, 9};
        System.out.println(firstIndex(values, 7));
    }
}
```

Java 数组用 `length` 取元素个数；方法接收数组对象的引用值，因此不需要另传长度。本例只读取数组元素。

### Kotlin

```kotlin
fun firstIndex(values: IntArray, target: Int): Int {
    for (index in values.indices) {
        if (values[index] == target) return index
    }
    return -1
}

fun main() {
    val values = intArrayOf(4, 7, 7, 9)
    println(firstIndex(values, 7))
}
```

`values.indices` 生成有效下标范围；`IntArray` 是整数数组，不是 `Array<Int>` 的别名。

## 预期结果与语言差异

| 输入 | 查到的下标 | 本课的输出 |
| --- | ---: | --- |
| `[4, 7, 7, 9]`，查 7 | 1 | `1` |
| `[4, 7, 7, 9]`，查 8 | 无 | C/C++/Python/Rust/Java/Kotlin 返回 -1；Zig 返回 null，展示时打印 -1 |
| `[]`，查 7 | 无 | 不访问数组元素，直接走“未找到”分支 |

这些示例对应同一算法，不表示各语言的最惯用库 API 完全一样。面试时先讲清“首个匹配”和“未找到”的契约，再按现场所用语言选择合适的返回类型。

## 常见错误

- **从下标 1 开始检查。** 会漏掉第 0 项；空数组还可能引发越界访问。
- **找到后仍遍历并反复覆盖答案。** 最终会得到最后一个匹配，而不是第一个。
- **把 -1 当作有效下标。** 应在访问元素前判断是否找到；Python 中 `values[-1]` 甚至表示最后一项。
- **把最好情况 O(1) 当作算法总复杂度。** 面试默认问最坏时间时，本算法是 O(n)。
- **认为顺序查找必须先排序。** 它不要求有序；二分查找才依赖排序等前提。

## 面试回答

顺序查找从下标 0 起逐个比较，首次命中立即返回，走完整个数组仍未命中则返回明确的“未找到”结果。
它不要求数组有序。对 n 个元素，最好一次比较为 O(1)，最坏和平均通常为 O(n)，辅助空间 O(1)；要说清平均情况还需给出目标分布的假设。

## 选择题

对数组 `[4, 7, 7, 9]` 查找第一个 7，哪项正确？

- A. 返回下标 0，因为它是数组的第一项。
- B. 返回下标 1，并在命中后停止。
- C. 返回下标 2，因为后一个 7 会覆盖前一个结果。
- D. 必须先排序，否则不能查找。

**答案：B。** 下标 0 的值是 4，不匹配；下标 1 首次匹配。C 描述的是没有及时停止的另一种实现；D 把二分查找的有序前提套到了顺序查找。

## 面试追问

“如果返回的是元素而非下标呢？”接口可以这样设计，但必须说明未找到时如何表示，且不能由元素值反推出重复元素中的哪个下标。
“什么时候考虑二分查找？”当数据按适当比较规则有序，且查找代价值得维护有序性时；一次性的少量元素通常无需过早复杂化。

## 官方参考

- [Microsoft：Technical interviewing](https://careers.microsoft.com/v2/global/en/hiring-tips/technical-interviewing)，数组、算法和复杂度的面试准备范围。
- [Rust 标准库：Iterator::enumerate](https://doc.rust-lang.org/std/iter/trait.Iterator.html#method.enumerate)，带下标迭代。
- [Zig 语言参考：for](https://ziglang.org/documentation/master/#For)，数组与下标并行迭代。
- [Kotlin：Control flow](https://kotlinlang.org/docs/control-flow.html#for-loops)，数组下标迭代。
