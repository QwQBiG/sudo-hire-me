---
slug: "c-static-extern"
title: "static 和 extern 为什么要分别看存储期与链接"
description: "对照函数内计数器与两个源文件的符号引用，理解存在多久与能否跨文件引用不是一个问题。"
subject: "C 语言机制"
order: 212
minutes: 18
lab: "workbench"
objectives: ["区分作用域存储期与链接属性", "解释局部 static 跨调用保留", "避免把 extern 声明当成普通重复定义"]
prerequisites: ["variable-scope-lifetime", "module-compile-link"]
---

# 不要把 static 背成一句“静态变量”

## 面试回答

在 C11 中，要分别讨论作用域（Scope）、存储期（Storage Duration）和链接（Linkage）。块作用域 `static int n` 有静态存储期，值跨函数调用保留，但名字仍只有局部作用域且无链接；文件作用域 `static int total` 通常使名字具有内部链接，仅该翻译单元使用。`extern int total;` 通常声明另处定义的具有外部链接的对象，不在每个使用文件重新定义它。extern 的效果还取决于是否有先前声明，不能把它当成“强制导出”指令。

## 计数器手算

每次函数调用都执行 `++n`，连续调用三次：

| 局部声明 | 第一次 | 第二次 | 第三次 |
| --- | ---: | ---: | ---: |
| `int n=0;` | 1 | 1 | 1 |
| `static int n=0;` | 1 | 2 | 3 |

自动局部对象每次进入重新创建并初始化。静态对象在整个程序执行期存在；C 中初始化必须符合静态初始化规则，不要照搬 C++ 局部静态动态初始化与线程安全规则。

## 实验代码

```c
#include <stdio.h>
static int next(void) { static int n=0; return ++n; }
int main(void) { printf("%d\n", next()); printf("%d\n", next()); printf("%d\n", next()); }
```

预期逐行输出 1、2、3。故意分三个语句调用，避免把函数实参求值次序误当固定顺序。这里函数 next 的 static 是内部链接，函数内 n 的 static 是静态存储期。

## 跨文件的最小契约

a.c 定义 `int total=1;`，头文件声明 `extern int total;`，b.c 包含头文件后引用 total。链接器找到定义才能完成链接。若 a.c 改成 `static int total=1;`，它不再提供给 b.c 的外部符号。若在头文件写普通定义并被多个源文件包含，可能导致重复定义；`extern int total=1;` 带初始化器，本身就是定义，不能凭 extern 判断“不分配”。

## 选择题

函数内 static 局部对象的名字能从其他源文件直接通过 extern 访问吗？

A. 能，因为静态存储期等于外部链接

B. 能，只要名字相同

C. 不能，它的局部作用域与无链接不会因为存在很久而改变

D. 不能，因为它每次调用都重新创建

**答案：C。** A/B 混淆寿命和名字链接，D 描述自动局部对象。想让外部访问应提供函数接口，而不是猜内部变量名称。

## 参考

- [C11 N1570：6.2.1、6.2.2、6.2.4](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)
