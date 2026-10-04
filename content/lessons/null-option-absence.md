---
slug: "null-option-absence"
title: "空值与显式的缺失"
description: "查找偶数时分清没有结果和结果恰好为零，对照 null、None 与 Option 的表达方式。"
subject: "编程基础与面向对象"
order: 30
minutes: 18
lab: "workbench"
objectives: ["区分缺失和合法零值", "理解 Rust Option 的 Some/None", "说明 null 与异常、Result 的问题维度不同"]
prerequisites: ["generic-programming-basics", "error-handling-models"]
---

# 没有值，还是值刚好为零

## 用查找结果提出问题

函数从整数数组里查找第一个偶数。输入 `[1,3,8]` 得到 8；`[1,3]` 没有结果；`[1,3,0]` 则应得到真实的 0。若约定“返回 0 表示没找到”，最后两种情况无法区分。缺失（Absence）是一个需要表达的状态，不应随意借用业务上合法的值。[Rust 标准库：`Option<T>`](https://doc.rust-lang.org/std/option/enum.Option.html)

## 逐步推演

### 第一步：列出三种输入的契约

| 输入 | 第一个偶数 | 是否找到 |
| --- | ---: | --- |
| `[1,3,8]` | 8 | 是 |
| `[1,3]` | 无 | 否 |
| `[1,3,0]` | 0 | 是 |

“0”和“无”在表里是不同状态；若返回类型只能是一枚整数，没有额外协议就无法同时清楚表达两者。

### 第二步：用 Rust Option 表达结果

```rust
fn first_even(items: &[i32]) -> Option<i32> {
    items.iter().copied().find(|value| value % 2 == 0)
}
```

依次对上述三组数组调用，预期为 `Some(8)`、`None`、`Some(0)`。`Option<i32>` 是一个可表示两种分支的类型：`Some(value)` 装真实结果，`None` 表示缺失。它不是“一个可能指向无效内存的 i32 指针”。

### 第三步：处理缺失而不丢信息

调用方可 `match` 分别处理两种分支；若业务确实允许“没找到就使用 0”，可调用 `unwrap_or(0)`，但这样得到的整数已无法再区分原本的 `None` 和 `Some(0)`。默认值是一项**业务选择**，不是类型系统自动证明二者等价。

### 第四步：区分缺失、失败与语言空值

查找不到元素是正常的“没有结果”，适合 `Option`。若输入文本不是整数、文件读取失败等，通常还需要错误信息，Rust 常用 `Result<T,E>`；不能把所有失败都压成 `None`。Java 对象引用可为 `null`，直接调用其方法可能抛 `NullPointerException`；`Optional<T>` 可显式表达某些返回值的缺失。Kotlin 用 `T?` 区分可空类型，Python 使用 `None`，Zig 使用 `?T` 可选类型，但各语言的检查和语义不同。[Kotlin 官方文档：空安全](https://kotlinlang.org/docs/null-safety.html)、[Zig 官方语言参考：Optionals](https://ziglang.org/documentation/master/#Optionals)

## 输入错误不是查找缺失

实验接受最多 10 个 -99 到 99 的整数构成的 JSON 数组。`[]` 是合法空数组，查找得到 `None`；`[1,3,0]` 得到 `Some(0)`；`[1,"x"]` 则是输入格式不符合契约。最后一种情况尚未完成合法数组上的查找，不能直接宣称“没找到偶数”。

使用 `unwrap_or(0)` 后，`Some(0)` 与 `None` 都变成整数 0，存在信息被主动丢弃；用 `match` 则可保留不同业务分支。对 `None` 调用 `unwrap()` 会 panic，不能把这个结果解释为自动获得默认值。

## 多语言示例

同一契约：返回第一个偶数，并独立表示“没有结果”。三组输入均为 `[1,3,8]`、`[1,3]`、`[1,3,0]`，为便于对照，打印格式统一为 `Some(8)`、`None`、`Some(0)`。这是各程序的预期结果，不代表七种语言都使用 Rust 的 `Option` 类型。所有示例只对整数数组查找，不处理文本解析。

### C

```c
#include <stdbool.h>
#include <stddef.h>
#include <stdio.h>

typedef struct { bool found; int value; } OptionalInt;
OptionalInt first_even(const int *items, size_t count) {
    for (size_t i = 0; i < count; ++i)
        if (items[i] % 2 == 0) return (OptionalInt){true, items[i]};
    return (OptionalInt){false, 0};
}
int main(void) {
    const int a[] = {1, 3, 8}, b[] = {1, 3}, c[] = {1, 3, 0};
    const int *cases[] = {a, b, c};
    const size_t sizes[] = {3, 2, 3};
    for (size_t i = 0; i < 3; ++i) {
        OptionalInt result = first_even(cases[i], sizes[i]);
        if (result.found) printf("Some(%d)\n", result.value);
        else puts("None");
    }
}
```

C17 用自定义结构体携带有效标志。`found == false` 时不要解读 `value`；0 只是该分支的占位初始化值，不是缺失协议本身。

### C++

```cpp
#include <iostream>
#include <optional>
#include <vector>

std::optional<int> first_even(const std::vector<int>& items) {
    for (int value : items) if (value % 2 == 0) return value;
    return std::nullopt;
}
int main() {
    const std::vector<int> cases[] = {{1, 3, 8}, {1, 3}, {1, 3, 0}};
    for (const auto& items : cases) {
        auto result = first_even(items);
        if (result.has_value()) std::cout << "Some(" << *result << ")\n";
        else std::cout << "None\n";
    }
}
```

C++17 的 `std::optional<int>` 用 `has_value()` 区分是否有值；先检查再解引用。[C++ 标准草案：optional 的观察操作](https://eel.is/c++draft/optional.observe)

### Python 3

```python
def first_even(items):
    return next((value for value in items if value % 2 == 0), None)

for items in ([1, 3, 8], [1, 3], [1, 3, 0]):
    result = first_even(items)
    print("None" if result is None else f"Some({result})")
```

Python 3.6+ 用 `None` 表达无值，`is None` 不会误判整数 0；这里不能写 `if not result`。[Python 官方文档：None](https://docs.python.org/3/library/constants.html#None)

### Rust

```rust
fn first_even(items: &[i32]) -> Option<i32> {
    items.iter().copied().find(|value| value % 2 == 0)
}
fn main() {
    println!("{:?}", first_even(&[1, 3, 8]));
    println!("{:?}", first_even(&[1, 3]));
    println!("{:?}", first_even(&[1, 3, 0]));
}
```

Rust 的返回类型明确列出 `Some(i32)` 与 `None`；`Debug` 打印直接呈现这两个分支。

### Zig

```zig
const std = @import("std");
fn firstEven(items: []const i32) ?i32 {
    for (items) |value| if (@mod(value, 2) == 0) return value;
    return null;
}
pub fn main() void {
    const cases = [_][]const i32{ &.{ 1, 3, 8 }, &.{ 1, 3 }, &.{ 1, 3, 0 } };
    for (cases) |items| {
        if (firstEven(items)) |value| {
            std.debug.print("Some({d})\n", .{value});
        } else {
            std.debug.print("None\n", .{});
        }
    }
}
```

Zig 0.15.2 的 `?i32` 保存整数或 `null`；`if` 捕获只在存在值时进入。`std.debug.print` 写到标准错误流，这里只用于观察文本。[Zig 官方语言参考：可选类型](https://ziglang.org/documentation/0.15.2/#Optionals)

### Java

```java
import java.util.OptionalInt;

public class Main {
    static OptionalInt firstEven(int[] items) {
        for (int value : items)
            if (value % 2 == 0) return OptionalInt.of(value);
        return OptionalInt.empty();
    }
    public static void main(String[] args) {
        int[][] cases = {{1, 3, 8}, {1, 3}, {1, 3, 0}};
        for (int[] items : cases) {
            OptionalInt result = firstEven(items);
            System.out.println(result.isPresent()
                ? "Some(" + result.getAsInt() + ")" : "None");
        }
    }
}
```

Java 21 的 `OptionalInt` 表示可缺失的 `int` 结果；`getAsInt()` 只在已确认存在值时调用。不要用 `OptionalInt` 引用自身为 `null` 表示缺失。[Java SE 21：OptionalInt](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/OptionalInt.html)

### Kotlin

```kotlin
fun firstEven(items: IntArray): Int? = items.firstOrNull { it % 2 == 0 }

fun main() {
    val cases = listOf(intArrayOf(1, 3, 8), intArrayOf(1, 3), intArrayOf(1, 3, 0))
    for (items in cases) {
        val result = firstEven(items)
        println(if (result == null) "None" else "Some($result)")
    }
}
```

Kotlin/JVM 的 `Int?` 允许 `null`，但 0 仍是正常整数。这里 `null` 没有错误原因；输入解析失败需要另行表达。

## 面试回答

空值或可选类型表达“值可能不存在”；不能用合法业务值如 0 随意充当缺失标记。Rust 的 `Option<T>` 用 `Some(T)` 与 `None` 明确两种情况，`Some(0)` 不等于 `None`。Java `null`、Python `None`、Kotlin `T?`、Zig `?T` 都涉及缺失，但语言规则不同；若需要说明**为什么失败**，应考虑异常或 `Result` 等错误通道，而不把所有错误隐藏成“没有值”。

## 常见错误

- **“没有找到就返回 0，不会有歧义。”** 0 本身可能是合法结果。
- **“`Option` 等于会自动抛异常的空指针。”** Rust 的 `Some`/`None` 是可匹配的分支；错误使用 `unwrap` 另当别论。
- **“`None` 与任何错误都是同义词。”** 缺失可以是正常结果，错误可能需要原因和传播。
- **“Java 只要使用 Optional 就不存在任何 null。”** 现有 API、字段和互操作仍可能出现 null，需按具体契约处理。

## 选择题

本课查找第一个偶数时，输入 `[1,3,0]`。Rust `first_even` 应返回什么？

- A. `None`
- B. `Some(0)`
- C. `Err(0)`
- D. 必定 panic

**答案：B。** 0 是数组里真实存在的偶数，应作为成功值保留。A 混淆缺失与零，C 把正常结果当错误，D 与本例安全迭代不符。

## 参考资料

- [Rust 标准库：`Option<T>`](https://doc.rust-lang.org/std/option/enum.Option.html)
- [Rust 标准库：`Result<T,E>`](https://doc.rust-lang.org/std/result/)
- [Kotlin 官方文档：可空与不可空类型](https://kotlinlang.org/docs/null-safety.html)
- [Zig 官方语言参考：可选类型](https://ziglang.org/documentation/master/#Optionals)
