---
slug: "module-compile-link"
title: "头文件、声明与跨文件链接"
description: "给一个 C 函数写头文件并让两个源文件共享声明，理解头文件保护挡不住多处外部定义。"
subject: "编程基础与面向对象"
order: 15
minutes: 18
lab: "walkthrough"
objectives: ["区分声明和定义", "解释 #include 与翻译单元", "判断缺定义和重复定义的后果"]
prerequisites: ["program-compile-run"]
---

# 有头文件，为什么链接还是会失败

## 这节不重讲“编译→链接→运行”

前一课已区分工具链阶段。这一课只解决跨文件协作时更具体的问题：声明（Declaration）告诉编译器一个名字及其类型，定义（Definition）提供实体；`#include` 在 C 预处理阶段把头文件内容纳入当前源文件的翻译单元（Translation Unit），并**不会自动把另一个 `.c` 实现文件也包含进来**。链接器随后要找到外部函数的定义。[ISO C N1570：声明、定义与翻译单元](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)

## 逐步推演

### 第一步：只在头文件放公开声明

三个文件组成一个小程序，先看 `math_ops.h`：

```c
#ifndef MATH_OPS_H
#define MATH_OPS_H

int add(int a, int b);

#endif
```

头文件保护（Include Guard）让同一翻译单元重复 `#include "math_ops.h"` 时，声明内容只展开一次。`int add(int,int);` 是函数声明，不含函数体；它给调用处提供类型信息，却不是可执行的实现。[GCC 官方文档：头文件保护](https://gcc.gnu.org/onlinedocs/cpp/Once-Only-Headers.html)

### 第二步：在一个源文件提供定义

`math_ops.c`：

```c
#include "math_ops.h"

int add(int a, int b) {
  return a + b;
}
```

这里的函数体是外部可见 `add` 的定义。包含自己的头文件还有一项价值：编译器可以检查该定义与公开声明是否一致；若头文件写成 `int add(int);`，实现仍接收两个参数，就可能在编译阶段暴露冲突。

### 第三步：调用方只包含声明，最终构建要含实现

`main.c`：

```c
#include <stdio.h>
#include "math_ops.h"

int main(void) {
  printf("%d\n", add(2, 3));
  return 0;
}
```

构建时要把 `main.c` 和 `math_ops.c` 两个翻译单元的目标代码都交给最终链接，例如 `gcc main.c math_ops.c -o app` 是 GCC 风格示意。正确构建并运行后预期打印 5。仅把 `math_ops.h` 放在目录里，或只编译 `main.c`，不会凭空生成 `add` 的定义；缺失实现时可能出现未定义引用诊断。[GCC 官方文档：链接阶段](https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html)

### 第四步：头文件保护不能修复跨文件重复定义

若把带函数体的 `int add(...) { ... }` 放进头文件，并让 `main.c` 与 `math_ops.c` 都包含它，每个翻译单元可能各生成一个同名的外部函数定义。头文件保护只防止**同一个翻译单元内重复展开**，不把两份独立编译的源文件合成“一次 include”。在本课普通 C 外部链接情形下，这会违反需要单一定义的规则，常在链接时报重复定义；不要拿 C++ `inline` 等另有规则的机制直接套过来。[ISO C N1570：外部定义](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)

## 面试回答

头文件通常放共享声明，使多个 C 翻译单元看到同一接口；`.c` 文件提供外部函数定义，最终链接需把其目标代码纳入。`#include` 是当前翻译单元的预处理内容纳入，不等于链接另一个实现文件。头文件保护避免单个翻译单元里重复包含，却不能防止把普通外部函数定义放入头文件后在多个翻译单元各定义一次。缺定义和重复定义都可能在链接阶段暴露，但原因相反。

## 常见错误

- **“写了函数声明，就已经写了函数实现。”** 声明可检查调用类型，函数体还需定义。
- **“`#include "math_ops.h"` 自动编译 `math_ops.c`。”** 头文件不会自动带上另一个源文件的目标代码。
- **“头文件保护会让整个项目只生成一份函数定义。”** 它只约束单个翻译单元中的重复展开。
- **“所有语言的模块系统都是 C 头文件。”** Java 包、Rust 模块、Python 导入、C++ 模块等语义不同。

## 选择题

普通 C 项目里 `main.c` 与 `math_ops.c` 都包含同一带保护宏的头文件。若头文件内放了非 `static`、非特殊内联规则的 `int add(...) { ... }` 函数体，哪项最准确？

- A. 保护宏保证整个项目只定义一次 add
- B. 两个翻译单元可能各有一份外部定义，产生重复定义问题
- C. 函数体自动只保留在第一个被编译的文件
- D. `#include` 会在运行时选择其中一份

**答案：B。** 保护宏的生效范围是单个翻译单元，不是全项目。A、C 错把宏当成全局链接管理，D 把预处理误当运行时选择。

## 参考资料

- [ISO C N1570：声明、定义与翻译单元](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)
- [GCC：头文件保护的范围](https://gcc.gnu.org/onlinedocs/cpp/Once-Only-Headers.html)
- [GCC：编译和链接选项](https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html)
