---
slug: "monotonic-stack"
title: "单调栈如何一次找到下一个更大元素"
description: "记录等待答案的索引，观察每个元素入栈和出栈各一次，处理严格更大与相等元素的区别。"
subject: "数据结构与算法"
order: 210
minutes: 20
lab: "workbench"
objectives: ["按索引追踪待解元素", "区别严格更大与大于等于", "用摊还计数解释 O(n)"]
prerequisites: ["stack-queue", "loop-invariants"]
---

# 单调栈：把还没有答案的人放在一起

## 面试回答

单调栈（Monotonic Stack）维护按值单调排列的候选，常用于最近更大/更小元素。找右侧第一个严格更大值时，从左到右扫描，栈存索引，值从栈底到栈顶非递增。当前值大于栈顶值时，弹出的索引立即得到答案；然后把当前索引压栈。每个索引最多入栈和出栈各一次，所以总时间 O(n)、额外空间 O(n)，嵌套 while 不意味着 O(n²)。

## 手算 [2,1,3,2,4]

| 当前索引和值 | 弹出的索引 | 扫描后栈中的索引 | 新答案 |
| --- | --- | --- | --- |
| 0:2 | 无 | [0] | 无 |
| 1:1 | 无 | [0,1] | 无 |
| 2:3 | 1、0 | [2] | answer[1]=3，answer[0]=3 |
| 3:2 | 无 | [2,3] | 无 |
| 4:4 | 3、2 | [4] | answer[3]=4，answer[2]=4 |

最后索引 4 没有右侧元素，答案 -1。完整结果 `[3,3,4,4,-1]`。这里输入非负，用 -1 表示不存在；通用接口可返回可选值或索引，避免与合法值冲突。

## 为什么它是“第一个”更大值

索引在遇到更大值之前一直留在栈中；此前经过的元素都没让它弹出，因此不满足条件。当前是第一次满足条件的右侧值。相等值不能让“严格更大”问题出栈：`[2,2]` 的两个答案都是不存在。若改成“更大或相等”，弹出条件应是 `<=`，问题语义和结果都会改变。

## 多语言示例

共同输入 `[2,1,3,2,4]` 得到 `[3,3,4,4,-1]`。以下是算法函数或模块片段，输入固定为非负整数；C 的教学缓冲区限定最多 12 项，其余版本使用语言容器或调用者缓冲区。

### C

```c
#include <stddef.h>
void next_greater(const int *a, size_t n, int *out) {
    size_t stack[12], top=0;
    for(size_t i=0;i<n;i++) out[i]=-1;
    for(size_t i=0;i<n;i++) {
        while(top && a[stack[top-1]]<a[i]) out[stack[--top]]=a[i];
        stack[top++]=i;
    }
}
```

前提 n<=12，a/out 各有 n 个有效元素，输出不覆盖输入；缓冲区大小必须被调用者检查，不能忽略这个边界。

### C++

```cpp
#include <cstddef>
#include <vector>
std::vector<int> next_greater(const std::vector<int>& a) {
    std::vector<int> out(a.size(),-1);
    std::vector<std::size_t> stack;
    for(std::size_t i=0;i<a.size();i++) {
        while(!stack.empty() && a[stack.back()]<a[i]) {out[stack.back()]=a[i];stack.pop_back();}
        stack.push_back(i);
    }
    return out;
}
```

vector 的 push/pop 摊还常数时间，总操作次数线性。

### Python 3

```python
def next_greater(values):
    answer = [-1] * len(values)
    stack = []
    for i, value in enumerate(values):
        while stack and values[stack[-1]] < value:
            answer[stack.pop()] = value
        stack.append(i)
    return answer
print(next_greater([2, 1, 3, 2, 4]))
```

预期输出 `[3, 3, 4, 4, -1]`。空输入返回空列表，单元素返回 `[-1]`。网页展示相同算法轨迹，不执行 Python。

### Rust

```rust
fn next_greater(a: &[i32]) -> Vec<i32> {
    let mut out=vec![-1; a.len()]; let mut stack: Vec<usize>=Vec::new();
    for i in 0..a.len() {
        while let Some(&j)=stack.last() {
            if a[j]>=a[i] { break; }
            stack.pop(); out[j]=a[i];
        }
        stack.push(i);
    }
    out
}
```

保存 usize 索引，不用负数表示索引；-1 只表示答案值不存在。

### Zig

```zig
fn nextGreater(a: []const i32, out: []i32, stack: []usize) void {
    var top: usize = 0;
    for (out[0..a.len]) |*slot| slot.* = -1;
    for (a, 0..) |value, i| {
        while (top > 0 and a[stack[top - 1]] < value) {
            top -= 1; out[stack[top]] = value;
        }
        stack[top] = i; top += 1;
    }
}
```

Zig 0.15.2，out/stack 各至少 a.len 项且不和 a 发生冲突别名；调用者提供资源，不隐式选择分配器。

### Java

```java
import java.util.Arrays;
class NextGreater {
    static int[] solve(int[] a) {
        int[] out=new int[a.length], stack=new int[a.length]; int top=0;
        Arrays.fill(out,-1);
        for(int i=0;i<a.length;i++) {
            while(top>0 && a[stack[top-1]]<a[i]) out[stack[--top]]=a[i];
            stack[top++]=i;
        }
        return out;
    }
}
```

固定数组栈避免装箱，输入不能为 null。

### Kotlin

```kotlin
fun nextGreater(a: IntArray): IntArray {
    val out=IntArray(a.size) { -1 }; val stack=IntArray(a.size); var top=0
    for (i in a.indices) {
        while (top>0 && a[stack[top-1]]<a[i]) { top--; out[stack[top]]=a[i] }
        stack[top++]=i
    }
    return out
}
```

空数组自然返回空结果，所有版本保持“严格更大”的同一条件。

## 面试追问

存值还是索引？存索引能回填每个位置的答案，也能区分相同值的多个位置。返回距离时用 `i-index`，返回位置时用 i，不要把值和位置混淆。圆环数组通常需要额外扫描一轮，但只在第一轮压入索引，防止重复候选；本课先不把线性问题的答案套到圆环上。

## 选择题

为什么总出栈次数不超过 n？

A. 每一轮 while 最多执行一次

B. 栈永远只有一个元素

C. 每个索引只压入一次，弹出后不再压回

D. 相等元素必须同时弹出

**答案：C。** 一轮可弹多个索引，因此 A 错；B 不符合递减数组；D 混淆严格条件。跨所有循环统计操作总次数才能得到 O(n)。

## 参考

- [Cornell：用不变式分析循环](https://www.cs.cornell.edu/courses/cs2110/2019su/lectures/lec15-loops.html)
