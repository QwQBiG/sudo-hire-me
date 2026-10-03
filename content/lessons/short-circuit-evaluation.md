---
slug: "short-circuit-evaluation"
title: "逻辑短路为什么能避免不必要的调用"
description: "通过空指针保护与带副作用的右表达式，区分逻辑短路、位运算和语言返回值差异。"
subject: "编程基础与面向对象"
order: 207
minutes: 14
lab: "workbench"
objectives: ["判断右表达式是否执行", "用短路保护有前置条件的操作", "区分布尔结果与操作数返回"]
prerequisites: ["function-arguments"]
---

# 逻辑短路：先决定是否还需要右边

## 面试回答

短路求值（Short-Circuit Evaluation）意味着左侧已经决定逻辑结果时，右侧不执行。内建 `&&` 在左侧为假时短路，`||` 在左侧为真时短路。因此 `p != NULL && p->value > 0` 先检查指针，再访问对象，但前提是非空指针确实指向有效对象。短路不是位运算，也不能把有副作用的右表达式当成必执行代码。Python 的 `and/or` 返回操作数；C++ 重载 `&&/||` 不保留内建运算符的短路特性。

## 从一个危险访问理解

逻辑与要求“两边都满足”。如果左侧已经是假，就不必知道右侧真假。逻辑或要求“至少一边满足”，左侧为真已经足够。

| 左侧 | 运算 | 执行右侧 | 最终结果 |
| --- | --- | --- | --- |
| false | && | 否 | false |
| true | && | 是 | 取决于右侧 |
| true | \|\| | 否 | true |
| false | \|\| | 是 | 取决于右侧 |

把 `p->value > 0` 放前面就失去保护：访问发生在判断空指针之前。`p != NULL` 也不能检测已释放指针或越界指针，这不是全面的内存安全检查。

## 副作用必须单独考虑

若 `ready` 为假，`ready && send()` 根本不调用 `send()`。需要无条件发送时应显式调用，再判断结果。C/C++ 的 `&` 是位与，两侧都要求求值，不能用来保护空指针。不要将这里的左到右规则推广到任意语言的所有运算符。

## 多语言示例

下列独立程序都用假左操作数检查右函数调用次数，预期显示 0；不是网页内的编译结果。

### C

```c
#include <stdio.h>
static int calls;
static int right(void) { ++calls; return 1; }
int main(void) { int result = 0 && right(); printf("%d %d\n", result, calls); }
```

C 内建逻辑运算返回 int 类型的 0 或 1，输出 `0 0`。

### C++

```cpp
#include <iostream>
int main() { int calls = 0; bool r = false && (++calls > 0); std::cout << r << ' ' << calls << '\n'; }
```

这里操作数是 bool，未重载运算符；输出 `0 0`。

### Python 3

```python
calls = 0
def right():
    global calls
    calls += 1
    return True
print(False and right(), calls)
print("" or "fallback")
```

输出 `False 0` 与 `fallback`；`or` 返回后者这个字符串，不强制转 bool。

### Rust

```rust
fn main() { let mut calls = 0; let r = false && { calls += 1; true }; println!("{r} {calls}"); }
```

Rust 的 `&&` 操作数必须是 bool，输出 `false 0`。

### Zig

```zig
const std = @import("std");
pub fn main() void {
    var calls: usize = 0;
    const left: bool = false;
    const r = left and blk: { calls += 1; break :blk true; };
    std.debug.print("{} {d}\n", .{ r, calls });
}
```

Zig 0.15.2 使用 `and/or` 表示布尔短路，输出 `false 0`。

### Java

```java
class Main { public static void main(String[] args) { int calls = 0; boolean r = false && (++calls > 0); System.out.println(r + " " + calls); } }
```

输出 `false 0`。Java 的布尔 `&` 不短路，和 `&&` 不同。

### Kotlin

```kotlin
fun main() { var calls = 0; val r = false && (++calls > 0); println("$r $calls") }
```

输出 `false 0`，`&&` 的操作数要求 Boolean。

## 选择题

当 `p` 是空指针时，哪个 C 表达式能避免访问 `p->value`？

A. `p->value > 0 && p != NULL`

B. `p != NULL & (p->value > 0)`

C. `p != NULL && p->value > 0`

D. `p != NULL || p->value > 0`

**答案：C。** A 先访问；B 位与不短路；D 左侧为假必须计算右侧。C 左侧为假直接结束。非空指针有效性仍是另外的前提。

## 参考

- [C11 草案 N1570：6.5.13、6.5.14](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)
- [Python：布尔运算](https://docs.python.org/3/library/stdtypes.html#boolean-operations-and-or-not)
