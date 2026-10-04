---
slug: "callbacks-function-pointers"
title: "回调为什么能让一段流程复用"
description: "用 C 函数指针把筛选规则交给通用遍历，追踪调用方与被调用方各负责哪一步。"
subject: "编程基础与面向对象"
order: 11
minutes: 17
lab: "workbench"
objectives: ["解释回调的调用方向", "读懂 C 函数指针形参", "计算同一遍历更换规则后的结果"]
prerequisites: ["function-arguments", "pointer-reference-basics"]
---

# 回调与函数指针：流程不变，规则可换

## 谁在什么时候调用谁

回调（Callback）是调用方把一个可调用的行为交给另一个函数或系统，后者在约定时机再调用它。C 里常用函数指针（Function Pointer）表达这个入口；其他语言可以用函数对象、闭包或接口，不能把“回调”限定为 C 指针。函数指针类型中的形参与返回值必须匹配，调用时传入符合契约的函数。[ISO C N1570：6.7.6.3 函数声明、6.5.2.2 函数调用](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)

## 同一数组换一条筛选规则

```c
#include <stddef.h>
size_t count_if(const int *a, size_t n, int (*test)(int));
```

上面是接口声明。令输入数组为 `[2,3,4,5]`，谓词（Predicate）`is_even(x)` 判断 `x % 2 == 0`，`over_three(x)` 判断 `x > 3`。完整示例的预期输出是 `even=2` 和 `over3=2`：前一次匹配 2、4，后一次匹配 4、5；虽然数量相等，筛选依据不同。

`int (*test)(int)` 表示“指向接受一个 `int`、返回 `int` 的函数”的指针。`count_if` 控制遍历时机，调用方提供判断规则。这里数组与回调都有效；若要做公开 API，需规定或检查空指针和长度的组合。[ISO C N1570：函数指针调用](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)

## 逐步推演

### 第一轮传入 is_even

`count_if` 对 2、3、4、5 依次调用 `is_even`；返回的真假序列为真、假、真、假，所以计数 2。

### 第二轮换 over_three

同一循环不变，回调换成 `over_three`；真假序列为假、假、真、真，计数仍为 2。

### 找到控制权方向

`main` 发起 `count_if`，却不是 `main` 在循环中直接调用每个谓词；`count_if` 在需要判断每个元素时“回过头”调用传入的函数。

### 明确 C 的边界

普通 C 函数指针不能自动携带调用处的局部变量。若判断规则需要额外阈值，常见设计是再传 `void *context` 并清楚约定其有效期与类型，而不是假设指针会捕获环境。

## 调用与返回要分开观察

对偶数规则，第一项是 2。进入 `is_even(2)` 时，`count_if` 的局部计数仍为 0；谓词返回 1 后，循环才把计数改成 1。下一项 3 返回 0，计数仍为 1。**回调的返回值与整个遍历的返回值不是同一层结果**：谓词返回一次判断，`count_if` 最终返回总数。

本例同步调用，不涉及任务队列、线程或网络事件。回调（调用关系）和异步（执行时序）是不同维度；同步排序比较函数同样属于回调。

## 签名错误不是换一条规则

错误示例，仅用于编译观察，不应执行：

```c
double wrong(double x) { return x; }
int main(void) {
    int (*test)(int) = wrong;  /* 不兼容的函数指针类型 */
    return test(2);
}
```

`double(double)` 不是 `int(int)`；这里应修正签名，而不是强制转换后继续调用。通过不兼容的函数类型调用，C 规则不保证行为；不能把它描述为固定返回 2。实验只显示签名违约，不伪造实际编译器输出。

## C 如何显式传递上下文

普通函数指针不携带调用处的 `limit`。一种接口设计把上下文指针作为额外参数：

```c
#include <stddef.h>
static int over_limit(int x, const void *context) {
    const int *limit = context;
    return x > *limit;
}
static size_t count_with_context(const int *a, size_t n,
    int (*test)(int, const void *), const void *context) {
    size_t count = 0;
    for (size_t i = 0; i < n; ++i) if (test(a[i], context)) ++count;
    return count;
}
int main(void) {
    const int a[] = {2, 3, 4, 5}, limit = 3;
    size_t count = count_with_context(a, 4, over_limit, &limit);
    return count == 2 ? 0 : 1;
}
```

预期计数为 2，程序正常退出。`context` 按约定指向有效的 `int`，谓词只读它；`const void *` 并不会自动记录真实类型。本例在 `main` 中同步完成，`limit` 一直有效。若保存回调用于稍后调用，就必须重新检查上下文生命周期，不能把已经离开作用域的局部变量地址交给异步执行者。

## 多语言示例

统一输入 `[2,3,4,5]`；两条规则分别判断偶数和严格大于 3，预期打印 `even=2`、`over3=2`。示例均同步执行，复用同一遍历；没有声称函数指针、闭包和接口拥有相同的表示。

### C

```c
#include <stddef.h>
#include <stdio.h>
static int is_even(int x) { return x % 2 == 0; }
static int over_three(int x) { return x > 3; }
static size_t count_if(const int *a, size_t n, int (*test)(int)) {
    size_t count = 0;
    for (size_t i = 0; i < n; ++i) if (test(a[i])) ++count;
    return count;
}
int main(void) {
    const int a[] = {2, 3, 4, 5};
    size_t n = sizeof a / sizeof a[0];
    printf("even=%zu\n", count_if(a, n, is_even));
    printf("over3=%zu\n", count_if(a, n, over_three));
}
```

C11 接口要求 `int(int)`，非零谓词返回值表示匹配；这里没有把外部对象状态捕获进函数指针。

### C++

```cpp
#include <cstddef>
#include <iostream>
#include <vector>
template<class Predicate>
std::size_t count_if(const std::vector<int>& a, Predicate test) {
    std::size_t count = 0;
    for (int x : a) if (test(x)) ++count;
    return count;
}
int main() {
    const std::vector<int> a = {2, 3, 4, 5};
    std::cout << "even=" << count_if(a, [](int x) { return x % 2 == 0; }) << '\n';
    std::cout << "over3=" << count_if(a, [](int x) { return x > 3; }) << '\n';
}
```

C++17 用模板接收可调用对象；这里的 lambda 没有捕获。标准库也提供 `std::count_if`。[C++ 标准草案：count 与 count_if](https://eel.is/c++draft/alg.count)

### Python 3

```python
def count_if(items, test):
    count = 0
    for x in items:
        if test(x):
            count += 1
    return count

items = [2, 3, 4, 5]
print(f"even={count_if(items, lambda x: x % 2 == 0)}")
print(f"over3={count_if(items, lambda x: x > 3)}")
```

Python 3.6+ 把可调用对象作为参数；这里没有静态类型注解，不代表运行时会自动保证参数和结果符合契约。[Python 官方文档：可调用类型](https://docs.python.org/3/library/typing.html#typing.Callable)

### Rust

```rust
fn count_if<F: Fn(i32) -> bool>(items: &[i32], test: F) -> usize {
    let mut count = 0;
    for &x in items { if test(x) { count += 1; } }
    count
}
fn main() {
    let items = [2, 3, 4, 5];
    println!("even={}", count_if(&items, |x| x % 2 == 0));
    println!("over3={}", count_if(&items, |x| x > 3));
}
```

Rust 的 `Fn(i32) -> bool` 是对可调用能力的约束。不同闭包可能具有不同类型，这里由泛型接收，不是声称所有闭包都是一个 C 函数指针。[Rust 官方教材：闭包](https://doc.rust-lang.org/book/ch13-01-closures.html)

### Zig

```zig
const std = @import("std");
fn isEven(x: i32) bool { return @mod(x, 2) == 0; }
fn overThree(x: i32) bool { return x > 3; }
fn countIf(items: []const i32, test: *const fn (i32) bool) usize {
    var count: usize = 0;
    for (items) |x| { if (test(x)) { count += 1; } }
    return count;
}
pub fn main() void {
    const items = [_]i32{ 2, 3, 4, 5 };
    std.debug.print("even={d}\n", .{countIf(&items, isEven)});
    std.debug.print("over3={d}\n", .{countIf(&items, overThree)});
}
```

Zig 0.15.2 使用签名明确的函数指针；`std.debug.print` 写到标准错误流。普通函数指针不自动捕获调用处环境。[Zig 官方语言参考：函数指针](https://ziglang.org/documentation/0.15.2/#Pointers)

### Java

```java
import java.util.function.IntPredicate;
public class Main {
    static int countIf(int[] items, IntPredicate test) {
        int count = 0;
        for (int x : items) if (test.test(x)) ++count;
        return count;
    }
    public static void main(String[] args) {
        int[] items = {2, 3, 4, 5};
        System.out.println("even=" + countIf(items, x -> x % 2 == 0));
        System.out.println("over3=" + countIf(items, x -> x > 3));
    }
}
```

Java 21 用函数式接口（Functional Interface）`IntPredicate` 表达 `int -> boolean`，通过 `test` 调用；不是可直接读写的 C 函数地址。[Java SE 21：IntPredicate](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/IntPredicate.html)

### Kotlin

```kotlin
fun countIf(items: IntArray, test: (Int) -> Boolean): Int {
    var count = 0
    for (x in items) if (test(x)) ++count
    return count
}
fun main() {
    val items = intArrayOf(2, 3, 4, 5)
    println("even=" + countIf(items) { it % 2 == 0 })
    println("over3=" + countIf(items) { it > 3 })
}
```

Kotlin/JVM 使用函数类型（Function Type）`(Int) -> Boolean` 与 lambda；调用方提供行为，遍历决定调用时机。[Kotlin 官方文档：高阶函数与 lambda](https://kotlinlang.org/docs/lambdas.html)

## 面试回答

回调是把行为作为参数交给别的流程，由接收者在约定时机调用。C 可用函数指针实现，例如 `count_if` 掌管遍历、传入的 `test` 决定匹配规则。它使流程和变化的策略分开；同时必须约定签名、何时调用、数据或上下文在调用时是否仍有效。C 函数指针本身不等于能捕获局部状态的闭包。

## 选择题

本例把回调换成 `over_three` 后，哪些元素被计入？

- A. 2、4
- B. 3、4、5
- C. 4、5
- D. 只有 5

**答案：C。** 严格大于 3 的是 4 和 5；A 是偶数规则，B 把 3 错算为大于 3，D 漏掉 4。

## 参考资料

- [ISO C N1570：函数指针与函数调用](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)
