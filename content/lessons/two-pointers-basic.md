---
slug: "two-pointers-basic"
title: "有序数组的双指针"
subject: "数据结构与算法"
description: "从一个有序数组里寻找两个数的目标和，理解为什么每次只移动一端也不会漏解。"
order: 65
minutes: 18
lab: "two-pointers"
objectives: ["解释左右指针的初始位置和移动依据", "手算一组有解与无解的输入", "说清排序前提及复杂度"]
prerequisites: ["linear-search-first", "sorting-stability"]
---

# 有序数组的双指针

## 从枚举所有配对开始

题目：给出按非降序排列的数组 `a=[1,2,4,6,8,11]` 和目标 `10`，找两个**不同下标**，使对应数之和为 `10`。直接枚举 `i<j` 的每一对是可行的，但最多要比较 `n(n-1)/2` 对，时间 `O(n²)`。

双指针（Two Pointers）在这里不是任何两个指针都可以移动，而是利用**已经有序**这一前提：左指针 `L=0` 指向最小候选，右指针 `R=n-1` 指向最大候选。每轮比较 `a[L]+a[R]` 与目标；在 `L<R` 时才是两个不同元素。

## 为什么只能移动这一端

| 两端之和 | 安全操作 | 被排除的候选为什么不可能是答案 |
| --- | --- | --- |
| 小于目标 | `L` 右移 | 固定 `a[L]`，任何 `j≤R` 的 `a[j]` 都不大于 `a[R]`，和只会更小或相等 |
| 大于目标 | `R` 左移 | 固定 `a[R]`，任何 `i≥L` 的 `a[i]` 都不小于 `a[L]`，和只会更大或相等 |
| 等于目标 | 返回 `(L,R)` | 两个下标不同，和恰好达标 |

这就是每次移动一个指针仍不漏解的理由。循环不变量可以说成：如果还有解，它一定在尚未排除的下标区间 `[L,R]` 中。若最后 `L≥R`，剩下不足两个不同下标，故无解。

## 按比较结果手算

| 轮次 | L 对应值 | R 对应值 | 和 | 决定 |
| --- | --- | --- | --- | --- |
| 1 | 1 | 11 | 12 | 太大，`R` 从 5 到 4 |
| 2 | 1 | 8 | 9 | 太小，`L` 从 0 到 1 |
| 3 | 2 | 8 | 10 | 命中下标 `(1,4)` |

如果目标改成 `20`，最大两数 `8+11=19` 也不够，左端会持续右移直至相遇，结果是无解。含负数也没问题，只要数组有序，例如 `[-4,-1,1,2,5,7]`、目标 `6`，第一轮 `-4+7=3`，第二轮 `-1+7=6`。判断依据是**顺序**，不是“值必须为正”。

## 面试回答

有序数组找两数之和时，把左右指针放在两端；和小于目标就右移左指针，和大于目标就左移右指针，等于则返回两个下标。排序保证每次可以安全排除一整组配对，每轮至少收缩一个下标，所以已排序输入时间 `O(n)`、额外空间 `O(1)`。若输入无序，不能直接套此规则；先排序通常要 `O(n log n)`，且要额外保存原下标才能返回原数组位置，也可考虑哈希表的一次扫描解法。

## 可复述的伪代码

```text
L=0, R=n-1
while L<R:
    s=a[L]+a[R]
    if s==target: return (L,R)
    if s<target: L=L+1
    else: R=R-1
return 无解
```

若面试官问“有重复值呢”，例如 `[3,3]`、目标 `6`，`L=0,R=1` 会命中两个不同下标；只有一个 `[3]` 时初始 `L=R`，不能拿同一个元素用两次。本算法返回**一组**解，不保证列出所有重复组合。固定宽度整数语言还需考虑两数相加溢出；可以使用足够宽的类型。

## 多语言示例

三段程序均使用已排序输入 `[1,2,4,6,8,11]`、目标 `10`，预期输出下标 `1 4`；结果是这一组输入的下标，不是数值。代码只承诺输入已排序，未排序输入不属于该接口。

### C++

```cpp
#include <iostream>
#include <optional>
#include <utility>
#include <vector>

std::optional<std::pair<int, int>> twoSum(const std::vector<int>& a, long long target) {
    int l = 0, r = static_cast<int>(a.size()) - 1;
    while (l < r) {
        long long sum = static_cast<long long>(a[l]) + a[r];
        if (sum == target) return std::pair{l, r};
        if (sum < target) ++l;
        else --r;
    }
    return std::nullopt;
}

int main() {
    auto answer = twoSum({1, 2, 4, 6, 8, 11}, 10);
    if (answer) std::cout << answer->first << ' ' << answer->second << '\n';
    else std::cout << "not found\n";
}
```

### Python 3

```python
def two_sum(a, target):
    left, right = 0, len(a) - 1
    while left < right:
        total = a[left] + a[right]
        if total == target:
            return left, right
        if total < target:
            left += 1
        else:
            right -= 1
    return None

print(two_sum([1, 2, 4, 6, 8, 11], 10))  # (1, 4)
```

### Rust

```rust
fn two_sum(a: &[i64], target: i64) -> Option<(usize, usize)> {
    let (mut left, mut right) = (0, a.len());
    while left < right {
        let j = right - 1;
        if left >= j { break; }
        let sum = i128::from(a[left]) + i128::from(a[j]);
        if sum == i128::from(target) { return Some((left, j)); }
        if sum < i128::from(target) { left += 1; } else { right -= 1; }
    }
    None
}

fn main() { println!("{:?}", two_sum(&[1, 2, 4, 6, 8, 11], 10)); }
```

Rust 版的 `right` 是不包含的右边界，避免空切片时计算 `len-1`；比较用更宽的 `i128`，避免两个 `i64` 相加溢出。

## 容易说错的地方

- “双指针适用于所有两数之和”：无序数组按大小移动没有单调性，可能漏解。
- “和太小就移动右端”：这只会让右端值更小，无法弥补不足。
- “`L==R` 也可以检查”：这把同一元素使用了两次，违背题意。
- “排序后仍能直接返回原下标”：排序可能改变位置，应保存 `(值, 原下标)`。

## 选择题

对已排序数组 `[1,2,4,6,8,11]`、目标 `10`，初始 `1+11=12`。下一步为什么应该左移右指针？

- A. 因为右指针每轮都必须移动
- B. 因为固定 `11` 时，其他可选左值都不小于 `1`，和不会降到 `10`
- C. 因为左移右指针一定立即找到答案
- D. 因为负数不能参与双指针

**答案：B。** A 没有算法依据；C 不保证下一轮命中；D 与排序前提无关。若保持 `11` 而右移左指针，和只会更大，故应排除当前右端。

## 参考资料

- [MIT 6.890：3SUM 中的排序后双指针扫描](https://ocw.mit.edu/courses/6-890-algorithmic-lower-bounds-fun-with-hardness-proofs-fall-2014/0f54b0ee1f3f47108c3bafaec54fd553_MIT6_890F14_Lec21.pdf)
