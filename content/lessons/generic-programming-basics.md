---
slug: "generic-programming-basics"
title: "泛型与类型约束"
description: "让同一个 first 函数服务整数和字符串数组，理解类型参数、约束与不同语言的实现差异。"
subject: "编程基础与面向对象"
order: 29
minutes: 18
lab: "workbench"
objectives: ["说清类型参数与具体类型", "通过例子判断泛型函数需要什么能力", "区分泛型、模板、trait 与运行时多态"]
prerequisites: ["function-arguments", "oop-polymorphism"]
---

# 泛型：把变化的是类型这件事写清楚

## 从重复函数开始

假设要取数组的第一个元素：整数数组 `[2, 3]` 得到 `2`，字符串数组 `["a", "b"]` 得到 `"a"`。如果只因为元素类型不同就复制两套几乎相同的算法，后续修改会重复。泛型编程（Generic Programming）把可变化的**类型**作为参数，让算法或数据结构在保持类型约束的同时复用。类型参数（Type Parameter）是定义中的占位类型；实际调用时对应具体类型（Concrete Type）。[Rust 官方教材：泛型数据类型](https://doc.rust-lang.org/book/ch10-01-syntax.html)

“复用”不等于“任意类型都能做任何操作”。取第一个元素只要求容器可被安全读取；若要求比较大小，则需要某种比较能力，如何声明能力取决于语言。

## 逐步推演

### 第一步：先说明空数组怎么办

函数 `first` 的契约是：非空切片返回第一个元素的引用；空切片返回“没有值”。若直接使用索引 `[0]`，空输入会失败。Rust 用 `Option<T>` 表达“有值/无值”，此处返回 `Option<&T>`，不会把空数组的结果伪装成一个真实元素。

### 第二步：写一个完整的 Rust 示例

```rust
fn first<T>(items: &[T]) -> Option<&T> {
    items.first()
}

fn main() {
    let numbers = [2, 3];
    let words = ["a", "b"];
    let empty: [i32; 0] = [];
    println!("{:?}", first(&numbers));
    println!("{:?}", first(&words));
    println!("{:?}", first(&empty));
}
```

按代码语义，三行预期为 `Some(2)`、`Some("a")`、`None`。`T` 在前两次调用中分别对应 `i32` 和 `&str`；函数本身没有要求 `T` 可比较、可复制或可打印，因此不用无关的 trait 约束。返回引用的有效性还受输入切片借用的生命周期约束。

当 `T = &str` 时，`Option<&T>` 实际是 `Option<&&str>`：借用的是数组中保存的字符串引用。调试打印能显示字符串内容，但不能凭打印形式就断言返回类型变成了拥有字符串的值。

### 第三步：需要比较时再添加约束

若函数要比较两个值并选较大者，就不能继续声称适用任意 `T`。Rust 可以用 `T: Ord` 表示可全序比较；若还要按值返回输入值，可能涉及 `Copy`、`Clone` 或所有权转移，不能只加 `Ord` 就忽略返回语义。C++ 模板通常由模板实参替换及表达式有效性来检查所用操作，现代 C++ 还可用 concept 显式写约束；Java 可用 `T extends Comparable<T>` 表达比较接口。[Rust 官方教材：trait 约束](https://doc.rust-lang.org/book/ch10-02-traits.html)

### 第四步：不要把实现方式混同

| 语言机制 | 此处最该记住的区别 |
| --- | --- |
| C++ 模板 | 以类型参数生成和检查实例化代码；可用 concept 约束所需操作 |
| Java 泛型 | 主要提供编译期类型检查，常见类型参数经类型擦除处理；不能把 `List<int>` 当作合法普通泛型实参 |
| Rust 泛型与 trait | `T` 表示类型参数，trait 约束所需能力；常见泛型代码通过单态化处理 |
| Zig `comptime` | 可把类型等值作为编译期参数，但不是 Java 泛型或 Rust trait 的同一套规则 |

上述机制都能支持复用，但**语法、编译策略和运行时表示不同**。不要从“都写了一个 T”推导性能、对象布局或二进制兼容性相同。[Java 官方教程：类型擦除](https://docs.oracle.com/javase/tutorial/java/generics/erasure.html)、[Zig 官方语言参考：`comptime`](https://ziglang.org/documentation/master/#comptime)

## 取首项与求最大值的约束不同

给一个坐标类型 `Point`，即使没有定义大小关系，`first(&points)` 也能返回首项引用。只有算法真的需要比较时，才要求顺序能力。下面让 `max_ref` 同样返回引用，避免引入复制或所有权转移：

```rust
#[derive(Debug, PartialEq, Eq, PartialOrd, Ord)]
struct Point { x: i32, y: i32 }

fn first<T>(items: &[T]) -> Option<&T> { items.first() }
fn max_ref<T: Ord>(items: &[T]) -> Option<&T> { items.iter().max() }

fn main() {
    let points = [Point { x: 2, y: 3 }, Point { x: 1, y: 9 }];
    println!("first={:?}", first(&points));
    println!("max={:?}", max_ref(&points));
    let empty: [Point; 0] = [];
    println!("empty={:?}", max_ref(&empty));
}
```

预期依次打印 `first=Some(Point { x: 2, y: 3 })`、`max=Some(Point { x: 2, y: 3 })`、`empty=None`。这里派生（Derive）的 `Ord` 按字段声明顺序形成字典序（Lexicographic Order）：先比 `x`，只有 `x` 相同才比 `y`。因此 `(2,3)` 大于 `(1,9)`，不是比较到原点的距离。[Rust 标准库：Ord 的派生规则](https://doc.rust-lang.org/std/cmp/trait.Ord.html#derivable)

去掉 `PartialEq, Eq, PartialOrd, Ord`，只保留 `Debug` 时，`first` 仍可调用，`max_ref` 则不满足约束。**即使传空数组也一样**：类型检查不因运行时没有元素就取消 `T: Ord`。`Debug` 只用于此处打印，既不是 `first` 的约束，也不是求最大值的必要条件。

实验选择整数、字符串或 `Point` 后，每个元素都必须符合相同类型；输入 `[1,"a"]` 不是“让 T 自动适应每个元素”。同一泛型函数的不同调用可以各自使用不同的 `T`，这不等于同一次切片调用能任意混用元素类型。

实验最多接受 8 项；整数和 `Point` 分量限定 -99 到 99，字符串限定 8 个 UTF-16 代码单元且必须能表示有效 Unicode 文本。这些是展示范围，不是 Rust `i32` 或字符串的真实上限。空数组的元素类型由当前所选类型确定，不能因为没有元素就认为“没有类型”。

## 把比较过程算出来

对于整数 `[2,3,3]`，`first` 直接选索引 0，不做比较。`max_ref` 以索引 0 为当前候选，再比较后面的元素：

| 当前项 | 与已有候选比较 | 更新后的候选 |
| --- | --- | --- |
| `items[1] = 3` | `3 > 2` | 索引 1 |
| `items[2] = 3` | `3 == 3` | 索引 2 |

本例调用 `Iterator::max`，并列最大时返回最后一个元素；实验保留元素索引，便于区别“数值相同”和“引用指向同一项”。空迭代器返回 `None`。[Rust 标准库：Iterator::max](https://doc.rust-lang.org/std/iter/trait.Iterator.html#method.max)

Rust 字符串按 8 位 Unicode 转换格式（8-bit Unicode Transformation Format，UTF-8）字节的字典序比较，不按长度，也不自动使用某种自然语言的排序习惯。例如 `"aa" < "b"`；不能把“字符串更长”当成“字符串更大”。[Rust 标准库：str 的 Ord](https://doc.rust-lang.org/std/primitive.str.html#impl-Ord-for-str)

## 面试回答

泛型把类型作为参数，让同一个函数或容器在不同具体类型上复用，同时在需要时声明类型必须具备的操作。`first<T>` 只读出第一个元素，不需要比较约束；若实现 `max<T>`，就必须保证 `T` 可以比较。C++ 模板、Java 泛型、Rust 泛型及 trait、Zig 编译期参数都能服务某些类似目标，但检查时机、运行时表示和约束表达不同；泛型也不自动等同于面向对象的运行时动态派发。

## 常见错误

- **“泛型参数 T 可以做任何操作。”** 代码能否比较、打印或复制，要看语言允许的约束与具体类型能力。
- **“返回第一个元素时空数组一定有一个默认元素。”** 本例明确返回 `None`。
- **“Java `List<int>` 与 `List<Integer>` 等价。”** Java 泛型类型实参不能直接使用原始类型 `int`。
- **“Rust trait 约束就是 Java 类继承。”** 它们的对象模型和实现规则不相同。

## 选择题

本课 Rust 的 `first<T>(items: &[T]) -> Option<&T>` 对空切片返回什么？

- A. `Some(0)`
- B. `None`
- C. 一个指向数组末尾的可解引用引用
- D. 只有传入整数类型时才允许调用

**答案：B。** 没有第一个元素，`Option` 用 `None` 表示缺失。A 擅自选择了类型不通用的默认值；C 会造成无效访问；D 与类型参数 `T` 的用途相反。

## 参考资料

- [Rust 官方教材：泛型类型与单态化](https://doc.rust-lang.org/book/ch10-01-syntax.html)
- [Rust 官方教材：trait 约束](https://doc.rust-lang.org/book/ch10-02-traits.html)
- [Java 官方教程：泛型类型擦除](https://docs.oracle.com/javase/tutorial/java/generics/erasure.html)
- [Zig 官方语言参考：`comptime`](https://ziglang.org/documentation/master/#comptime)
