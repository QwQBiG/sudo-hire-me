---
slug: "pointer-reference-basics"
title: "指针与引用从零看"
description: "用一个整数和一个数组追踪 C 指针的地址与解引用，再对照 C++ 引用的绑定语义。"
subject: "编程基础与面向对象"
order: 9
minutes: 20
lab: "workbench"
objectives: ["区分指针变量、地址值和被指对象", "解释取地址与解引用", "区分 C 指针、C++ 引用及其他语言的引用语义"]
prerequisites: ["function-arguments", "memory-units"]
---

# 指针和引用：名字到底指向谁

## C 指针先分成三件事

一个对象可以有可访问的地址。C 指针（Pointer）是可保存相应地址值的类型；`&x` 取得 `x` 的地址，`*p` 在指针 `p` 指向有效 `int` 时访问那个整数。`p` 自身是一个变量，保存指针值；`*p` 是目标对象。对 `int x = 7; int *p = &x;`，可以画成 `p ──→ x: 7`。不要把“p 是 x 的地址”和“p 就是 x 本身”混为一谈。[ISO C N1570：取地址与间接访问](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)

## 逐步推演

### 第一步：建立指向有效对象的指针

下面是完整 C 程序，输出结果按代码逻辑推导：

```c
#include <stdio.h>

int main(void) {
  int x = 7;
  int *p = &x;
  *p = 9;
  printf("%d %d\n", x, *p);
  return 0;
}
```

`p` 从 `&x` 初始化，解引用 `*p` 对应 `x`。因此赋值后 `x` 和 `*p` 都读到 9，预期打印 `9 9`。`int *p` 声明中的星号表示“p 是指向 int 的指针”，而表达式 `*p` 中表示“访问它指向的 int”；写法相似，语法角色不同。

### 第二步：改变指针值与改变目标值不同

若再有 `int y = 4;`，执行 `p = &y` 是让 `p` 改指向 `y`，`x` 仍为 9。随后 `*p = 5` 才会把 `y` 从 4 改为 5。可以重画为：

```text
重绑定前：p ──→ x:9     y:4
重绑定后：x:9     p ──→ y:4
写入后：  x:9     p ──→ y:5
```

`p = NULL` 可表示“不指向对象”；此时**不得解引用** `*p`。即使指针非空，也还要确保目标类型和生命周期有效。单独检查非空不足以证明安全。

### 第三步：数组中的指针移动有边界

对 `int a[3] = {10, 20, 30}; int *q = a;`，`q + 1` 指向 `a[1]`，因此 `*(q + 1)` 是 20。C 的指针运算以所指类型的元素为步长，`q + 1` 不是把原始地址值简单加 1 字节。形成指向同一个数组元素或末尾后一个位置的指针有对应规则；**末尾后一个位置不可解引用**，越过更远处也不能当合法数组访问。[ISO C N1570：指针加法](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)

### 第四步：C++ 引用是另一种绑定关系

```cpp
#include <iostream>

int main() {
  int x = 7;
  int y = 4;
  int& ref = x;
  ref = 9;
  ref = y;
  std::cout << x << " " << y << "\n";
}
```

`ref` 初始化时绑定 `x`；`ref = 9` 改 `x` 为 9，`ref = y` **把 y 的值 4 赋给 x**，不是让引用重新绑定 `y`。最终预期打印 `4 4`。普通 C++ 左值引用不是可随时换目标的 C 指针；但引用仍可能因目标寿命结束而悬空，不能说“引用天然安全”。[C++ 标准草案：引用](https://eel.is/c++draft/dcl.ref)

## 面试回答

C 指针是可保存地址值的对象，`&` 取地址、`*` 在目标有效时解引用。给 `p` 赋新地址改变它指向谁，给 `*p` 赋值改变目标。指针可为空，可在合法数组范围内运算，也可能因越界或目标寿命结束而失效。C++ 引用通常在初始化时绑定目标，`ref = y` 是给已绑定对象赋值，不是重绑定。Java 的对象引用值、Python 的名字绑定、Rust 的受借用检查的引用、Zig 指针都有各自规则，不能只因为中文都叫“引用”就断言机制相同。

## 语言边界

Rust 的 `&T` 和 `&mut T` 受借用与生命周期规则约束，不是能直接做任意 C 风格算术的普通指针；Java 对象引用不能执行 `p + 1` 访问相邻对象；Python 赋值建立名字绑定，不向用户提供 C 的 `&x` 和 `*p` 操作符。Zig 明确提供指针及解引用语法 `ptr.*`，但仍要遵守其类型与安全规则。[Rust 官方教材：借用](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html)、[Zig 官方语言参考：指针](https://ziglang.org/documentation/master/#Pointers)

## 常见错误

- **“`p = &y` 把 x 改为 y。”** 改的是指针保存的地址；原对象 x 不因重指向而改变。
- **“非空指针就可以解引用。”** 目标也可能已释放、已结束生命周期或类型不适合。
- **“`q + 1` 一定加一个字节。”** `int *` 前进一个 `int` 元素。
- **“C++ `ref = y` 让引用改绑 y。”** 它给原目标赋值，普通引用不按此语句重绑定。

## 选择题

C++ 中执行 `int x=7, y=4; int& ref=x; ref=y;` 后，`x` 和 `y` 是多少？

- A. `x=7, y=4`，且 ref 改绑 y
- B. `x=4, y=4`，且 ref 仍绑定 x
- C. `x=7, y=7`，且 ref 仍绑定 x
- D. 程序必然因引用为空而失败

**答案：B。** `ref=y` 读取 y 的值并赋给 ref 绑定的 x。A 错把赋值当重绑定；C 颠倒赋值方向；D 与示例中有效初始化不符。

## 参考资料

- [ISO C N1570：指针、取地址、解引用与指针运算](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)
- [C++ 标准草案：引用声明与绑定](https://eel.is/c++draft/dcl.ref)
- [Rust 官方教材：引用与借用](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html)
- [Zig 官方语言参考：指针](https://ziglang.org/documentation/master/#Pointers)
