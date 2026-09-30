---
slug: "function-arguments"
title: "函数参数到底传了什么"
description: "跟踪局部名字和调用方数据，分清值传递、引用、指针与可变对象。"
subject: "编程基础与面向对象"
order: 4
minutes: 22
lab: "workbench"
objectives: ["区分形参与实参", "判断重绑定局部变量和修改共享数据的效果", "解释七种语言示例的传参差异与前提"]
prerequisites: ["program-compile-run"]
---

# 函数参数：为什么函数里改了值，外面有时不变

## 先建立一个可追踪的例子

函数（Function）把一段操作封装成可调用单元。定义里的名字叫**形参（Formal Parameter）**，调用时送入的表达式叫**实参（Actual Argument）**。在 `change(a, b)` 中，`a` 和 `b` 是调用方的实参；定义 `change(copy, target)` 中的 `copy` 与 `target` 是形参。调用时各语言按自己的规则，把实参的值、引用、指针或所有权关系建立到形参上。

本课只跟踪两件事：调用方整数 `a = 1`，以及另一个可修改目标 `b = 2`。函数内部尝试让局部整数变为 `99`，并通过明确的引用、指针或可变对象把目标改为 `7`。回答“调用后外面是什么”时，不能只背“值传递/引用传递”四个字；要画出**哪个名字绑定哪个值、哪个操作真正修改了共享位置**。

## 逐步推演

### 第一步：固定调用前的两个位置

调用前有 `a = 1`、`b = 2`。在 C/C++/Rust/Zig 的示例中，`b` 是可寻址或可借用的整数变量；在 Python/Java/Kotlin 的示例中，`b` 放在一个可变容器的第 0 格。

| 调用方位置 | 初始内容 | 要观察的问题 |
| --- | --- | --- |
| `a` | 1 | 局部参数变化会不会改它？ |
| `b` 或 `b[0]` | 2 | 通过引用、指针或容器修改会不会改它？ |

这两类目标不是同一种传参机制；我们只比较最终可观察效果，并在语言示例里说明各自原因。

### 第二步：建立函数局部参数

整数 `1` 进入形参 `copy` 或 `number`；另外一个形参能定位调用方允许修改的目标。对 C，`target` 是**指针值的副本**，内含 `b` 的地址；对 C++，`int& target` 是 `b` 的引用；对 Rust，`&mut b` 是受借用规则约束的可变引用。对 Python、Java、Kotlin，形参拿到指向同一可变容器的绑定或引用值。

这一步没有把 `a` 与函数内局部名字“焊成同一个变量”。语言怎样传递参数要按各自规范判断，尤其不能把 Python 或 Java 的对象引用值误说成“复制了整个对象”。

### 第三步：改变局部整数不等于改调用方的 a

在允许局部重新赋值的示例里执行 `copy = 99` 或 `number = 99`，改的是函数内的形参绑定或局部变量，不是调用方 `a`。Zig 和 Kotlin 的形参不能直接重新赋值，示例只读取形参或创建局部值，结论仍是 `a = 1`。

Rust 示例选用实现 `Copy` 的 `i32`，传入后还能继续使用原变量；不能把这个结论泛化到所有 Rust 类型。例如 `String` 按值传入通常转移所有权，需要借用或显式克隆才能继续使用原值。[Rust 官方教材：所有权](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html)

### 第四步：通过共享目标写入 7

C 的 `*target = 7`、C++ 的 `target = 7`、Rust 的 `*target = 7`、Zig 的 `target.* = 7`，都写到了调用方授权访问的整数位置。Python 的 `values[0] = 7`、Java/Kotlin 的 `array[0] = 7`，修改了两侧都能访问的可变对象内容。

此时最终状态是 `a = 1`、`b = 7`，或容器的 `b[0] = 7`。若只把 Python/Java 的局部形参改绑到另一个新对象，原对象不会因此自动改写；**修改对象内容**和**改绑局部名字/引用**是两件事。

## 面试回答

形参是函数定义中的局部名字，实参是调用时提供的表达式。判断能否改到调用方，先看传入的是值、引用、指针还是指向可变对象的引用值，再看函数里做的是“重新赋给局部形参”还是“经由它修改原对象/原位置”。C 的普通参数按值传，指针本身也按值传但可解引用修改目标；C++ 可显式使用引用形参；Rust 可用 `&mut` 借用；Python 按对象引用绑定，Java/Kotlin 传递对象引用的值。不能简单说“对象类型一律按引用传参”，更不能认为函数内给形参重新赋值就必然改动调用方变量。

## 多语言示例

以下每段都是**独立程序**，共同观察 `a` 保持 1、另一个目标变为 7。代码展示的是语言机制，不表示这七种语言的参数模型完全相同。

### C

```c
#include <stdio.h>

void change(int copy, int *target) {
  copy = 99;
  *target = 7;
  (void)copy;
}

int main(void) {
  int a = 1, b = 2;
  change(a, &b);
  printf("%d %d\n", a, b);
  return 0;
}
```

`copy` 收到整数值的副本；`target` 收到地址值的副本。`*target` 才访问 `b`。C 没有 C++ 式引用形参。[ISO C 工作草案 N1570：函数调用](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)

### C++

```cpp
#include <iostream>

void change(int copy, int& target) {
  copy = 99;
  target = 7;
  (void)copy;
}

int main() {
  int a = 1, b = 2;
  change(a, b);
  std::cout << a << " " << b << "\n";
}
```

`copy` 按值建立独立参数；`int& target` 是绑定到 `b` 的引用形参，不需要写 `&b` 作为调用实参。[C++ 标准草案：引用](https://eel.is/c++draft/dcl.ref)

### Python 3

```python
def change(number, values):
    number = 99
    values[0] = 7

a = 1
b = [2]
change(a, b)
print(a, b[0])
```

函数内 `number = 99` 让局部名字指向另一个整数对象；`values[0] = 7` 修改两侧引用的同一个列表。Python 官方教程把它描述为传入对象引用值；不是复制整张列表。[Python 官方教程：函数定义与参数](https://docs.python.org/3/tutorial/controlflow.html#defining-functions)

### Rust

```rust
fn change(copy: i32, target: &mut i32) {
    let _local = copy + 98;
    *target = 7;
}

fn main() {
    let a = 1;
    let mut b = 2;
    change(a, &mut b);
    println!("{a} {b}");
}
```

本例 `i32` 可复制；`&mut b` 是临时可变借用，调用者的 `b` 才会改变。编译器还检查可变借用与其他活跃引用是否冲突。[Rust 官方教材：引用与借用](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html)

### Zig

```zig
const std = @import("std");

fn change(copy: i32, target: *i32) void {
    target.* = copy + 6;
}

pub fn main() void {
    const a: i32 = 1;
    var b: i32 = 2;
    change(a, &b);
    std.debug.print("{d} {d}\n", .{ a, b });
}
```

本例整数 `copy` 按值传入；`*i32` 是指向可修改整数的指针，`target.*` 修改 `b`。Zig 形参不可重新赋值，不能把这个具体整数例子扩大成“所有大型聚合参数在机器层面都一定复制”；语言允许优化参数表示。`std.debug.print` 默认向标准错误输出写信息。[Zig 官方语言参考：按值参数](https://ziglang.org/documentation/master/#Pass-by-value-Parameters)

### Java

```java
public class Main {
  static void change(int copy, int[] target) {
    copy = 99;
    target[0] = 7;
  }

  public static void main(String[] args) {
    int a = 1;
    int[] b = {2};
    change(a, b);
    System.out.println(a + " " + b[0]);
  }
}
```

每次调用都会创建新的形参变量，分别接收 `int` 值与**数组对象引用的值**。改 `copy` 不影响 `a`，通过复制来的引用修改数组会让调用方看见；把 `target` 本身改绑为新数组则不会改掉调用方变量 `b`。[Java 语言规范：方法形参](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.12.3)

### Kotlin

```kotlin
fun change(copy: Int, target: IntArray) {
    target[0] = copy + 6
}

fun main() {
    val a = 1
    val b = intArrayOf(2)
    change(a, b)
    println("$a ${b[0]}")
}
```

Kotlin 形参是只读的，不能在函数里写 `copy = 99`；传入的是数组对象引用的副本，但通过它仍可修改可变数组元素。`val b` 限制的是变量 `b` 重新绑定，不等于数组内容不可变。[Kotlin 官方文档：函数参数](https://kotlinlang.org/docs/functions.html#parameters)

这七段代码**按各自语义推导**，调用方最终可见 `a = 1`、`b = 7`（或 `b[0] = 7`）。其中 C++ 引用形参不是“先复制被引用整数再写回”；Python、Java、Kotlin 的可变容器例子也不是“按引用传入整个变量”。

## 常见错误

- **“C 把 `&b` 传进去，所以指针不是按值传。”** 传入的地址值会用于初始化指针形参；指针形参本身仍是独立变量，解引用才改到 `b`。
- **“Python 给 `values` 重新赋一个列表，调用方的列表就被替换。”** 重新绑定局部名字不修改原列表；`values[0] = 7` 才修改共享对象内容。
- **“Java 数组按引用传参，所以形参其实就是调用方变量。”** Java 传的是引用值，新形参变量与调用方变量是两个变量，只是起初指向同一数组。
- **“Rust 把任何值传入后原变量都能继续用。”** `i32` 实现 `Copy`，而像 `String` 这样的非 `Copy` 值按值传入可能转移所有权。
- **“Kotlin 的 `val` 使 `IntArray` 内容不可变。”** `val` 限制绑定；数组元素是否可变取决于对象类型与操作。

## 选择题

在 Python 3 中，执行下列代码后 `items[0]` 是多少？

```python
def replace(items):
    items = [7]

data = [2]
replace(data)
print(data[0])
```

- A. `2`
- B. `7`
- C. 抛出参数类型错误
- D. 一定取决于内存地址

**答案：A。** `items = [7]` 只把函数内名字重新绑定到新列表，没有修改 `data` 指向的原列表 `[2]`。B 混淆重绑定与原地修改；C 没有类型不匹配；D 结果由语言语义决定，不依赖某个具体地址。

## 面试追问

**怎样明确让函数返回一个新值，而不是修改共享状态？** 把结果作为返回值交给调用方重新赋值，例如 Python 的 `a = f(a)`、C 的 `a = f(a)`。这通常更容易看出数据流；需要原地更新时，再使用语言允许的指针、引用、可变借用或可变对象，并明确谁负责其生命周期与访问权限。

## 参考资料

- [ISO C 工作草案 N1570：函数调用与参数](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)
- [C++ 标准工作草案：引用形参](https://eel.is/c++draft/dcl.ref)
- [Python 官方教程：函数形参与对象引用](https://docs.python.org/3/tutorial/controlflow.html#defining-functions)
- [Rust 官方教材：所有权与可变借用](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html)
- [Zig 官方语言参考：参数与指针](https://ziglang.org/documentation/master/#Pass-by-value-Parameters)
- [Java 语言规范：方法形参变量](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.12.3)
- [Kotlin 官方文档：函数参数](https://kotlinlang.org/docs/functions.html#parameters)
