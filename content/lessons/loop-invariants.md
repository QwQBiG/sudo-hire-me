---
slug: "loop-invariants"
title: "循环不变式：怎样证明每一轮都正确"
description: "用数组前缀和建立初始化、保持与终止证明，解释为什么测试通过不等于算法已被证明。"
subject: "数据结构与算法"
order: 208
minutes: 18
lab: "workbench"
objectives: ["给出具体的循环不变式", "区分正确性与终止性", "发现跳过元素的错误"]
prerequisites: ["array-bounds-slices"]
---

# 循环不变式不是一句“循环结果正确”

## 面试回答

循环不变式（Loop Invariant）是在约定的循环检查位置始终成立的性质。证明通常包括初始化、保持和退出后推导结果。例如求数组和，在每轮条件检查处，`sum` 等于前 i 个元素的和，且 `0 <= i <= n`。初始化 i=0、sum=0 成立；累加 a[i] 后 i 加一仍成立；退出时 i=n 得到完整数组和。终止性还需要说明进度，例如 n-i 严格递减且有下界，不能只说不变式成立就一定结束。

## 把数学性质对应到变量

数组 `[2,4,6]`，约定 `a[0..i)` 是左闭右开区间：包含索引 0，不包含 i。空区间的和定义为 0。

| 检查循环条件时 | 已处理区间 | sum | n-i |
| --- | --- | ---: | ---: |
| i=0 | 空 | 0 | 3 |
| i=1 | [2] | 2 | 2 |
| i=2 | [2,4] | 6 | 1 |
| i=3 | [2,4,6] | 12 | 0 |

保持证明不能只检查这一个数组：假设某次进入循环时 sum 是前 i 项之和，执行 `sum += a[i]` 后恰好是前 i+1 项的和，再更新 i 即得到下一次检查点的性质。范围性质保证仅在 i<n 时访问 a[i]。

## 一个能揭穿错误的反例

如果第二次迭代跳过 a[1]，到 i=2 时 sum=2，但前缀和应该是 6；此时已经破坏不变式，不必等到最后。若跳过的是值 0，这一个输入可能仍通过测试，所以测试用于找反例，不能代替一般证明。若累加但忘记 i++，不变式/进度也无法维持，循环可能不结束。

## 多语言示例

下面均是求和函数，输入元素与累加值要求在目标整数类型范围内；不存在用整数溢出“证明正确”的前提。空数组返回 0，`[2,4,6]` 返回 12，时间 O(n)、额外空间 O(1)。

### C

```c
#include <stddef.h>
long long sum(const int *a, size_t n) {
    long long total = 0;
    for (size_t i = 0; i < n; ++i) total += a[i];
    return total;
}
```

n>0 时 a 必须指向至少 n 个有效元素，结果在 long long 范围内。

### C++

```cpp
#include <vector>
long long sum(const std::vector<int>& a) { long long s=0; for (int x : a) s+=x; return s; }
```

范围 for 隐藏索引，已处理前缀这个证明仍适用。

### Python 3

```python
def total(values):
    result = 0
    for value in values:
        result += value
    return result
```

此处限定 int 元素；Python 整数可增长，但位复杂度并非永远 O(1)。

### Rust

```rust
fn total(values: &[i32]) -> i64 { let mut s = 0i64; for &x in values { s += i64::from(x); } s }
```

先扩展类型再累加，仍要求总体和不溢出 i64。

### Zig

```zig
fn total(values: []const i32) i64 { var s: i64 = 0; for (values) |x| { s += x; } return s; }
```

Zig 0.15.2 的 slice 携带长度；整数溢出依构建模式处理，不应依赖它。

### Java

```java
class Sums { static long total(int[] a) { long s=0; for (int x:a) s+=x; return s; } }
```

非 null 数组，使用 long 累加；不会把数组越界视为合法输入。

### Kotlin

```kotlin
fun total(values: IntArray): Long { var s=0L; for (x in values) s+=x; return s }
```

Int 元素累加至 Long，返回 12L。

## 选择题

不变式成立，为什么仍要单独讨论终止性？

A. 因为不变式只适用于最后一轮

B. 因为循环可以一直保持某个性质却永远不退出

C. 因为通过测试等于数学证明

D. 因为终止性要求每次运行耗时相同

**答案：B。** A 错在检查点贯穿每一轮；C 混淆有限样例与一般证明；D 与终止性无关，严格递减的非负进度量是一种常见证明方式。

## 参考

- [Cornell CS2110：循环与不变式](https://www.cs.cornell.edu/courses/cs2110/2019su/lectures/lec15-loops.html)
