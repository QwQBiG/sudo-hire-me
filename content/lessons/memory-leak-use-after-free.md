---
slug: "memory-leak-use-after-free"
title: "内存泄漏与释放后使用"
description: "沿两条指针别名追踪 malloc、free 和失去最后一个地址，区分泄漏与悬空引用。"
subject: "编程基础与面向对象"
order: 14
minutes: 19
lab: "lifetime"
objectives: ["判断何时成为不可再释放的泄漏", "识别释放后仍保留的悬空别名", "说明防护工具的能力边界"]
prerequisites: ["stack-vs-heap", "pointer-reference-basics"]
---

# 两种错误：没释放，与释放后还在用

## 一块对象和两个持有地址的变量

本课限定单线程 C 动态分配。`malloc` 成功后返回可用于该分配块的指针，`free` 释放相应分配；其后不得再通过旧指针或别名访问已结束的对象。内存泄漏（Memory Leak）是仍占据资源的分配块失去了可用于释放它的路径；释放后使用（Use After Free，UAF）是对象已经释放却仍试图通过悬空指针（Dangling Pointer）访问它。**泄漏不是 UAF，UAF 也不要求先泄漏**。[ISO C N1570：动态分配与释放](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)

## 先看释放后使用

```c
#include <stdlib.h>

void example(void) {
  int *p = malloc(sizeof *p);
  if (p == NULL) return;
  *p = 7;
  int *q = p;
  free(p);
  /* 此后不能读取 *q，也不能再次 free(q)。 */
}
```

释放前 `p` 与 `q` 都指向同一个动态对象；`free(p)` 结束那块分配，**不会扫描程序并自动把 q 改成 NULL**。`q` 即使看起来仍保存旧地址，也不是可安全使用的对象通道。把 `p = NULL` 加在 `free(p)` 后，只保护随后通过 `p` 的某些误用，不会修复 `q`。不要预测 `*q` 必然还是 7、必定打印乱码或必然崩溃；后续解引用不具备确定的合法结果。

## 再看泄漏怎样形成

另一个**不执行非法访问**的反例：

```c
void lose_address(void) {
  int *p = malloc(sizeof *p);
  if (p == NULL) return;
  p = NULL;
}
```

假设没有其他别名保存那块地址，`p = NULL` 丢掉最后的可用指针，但没有 `free`；函数返回后不能再找回该块来释放。不要误认为“把指针置空相当于释放目标”。在短命进程退出时操作系统可能回收进程资源，但这不能替代长期运行程序的所有权纪律。

## 按状态推演面试例题

| 操作后状态 | 动态对象是否仍分配 | p/q 情况 | 问题 |
| --- | --- | --- | --- |
| `p=malloc` 成功 | 是 | p 指向目标 | 正常；需规划释放 |
| `q=p` | 是 | p、q 同指目标 | 正常；两个别名 |
| `free(p)` | 否 | p、q 都不可用来访问旧目标 | q 若被解引用即 UAF |
| 另一条路径 `p=NULL` 且无 q | 是 | 失去可用地址 | 泄漏 |

表的最后一行是**另一个分支**，不是在 `free(p)` 之后又发生泄漏。面试先按时间线分清“对象是否仍分配”和“手里是否还有有效访问/释放能力”。

## 面试回答

内存泄漏是动态资源还没释放却失去可释放它的引用路径；释放后使用是 `free` 已结束对象生命周期，却仍通过旧指针或别名读写。`p`、`q` 同指一块分配时，`free(p)` 不会让 `q` 自动失效为 NULL，随后 `*q` 不可安全使用；如果不释放就把最后一个地址丢掉，则形成泄漏。两种错误的状态恰好相反：泄漏时块仍分配，UAF 时块已释放。应明确所有权、一次释放、别名和错误路径清理。

## 怎样检查而不依赖碰运气

地址消毒器（AddressSanitizer，ASan）可在支持的构建环境中检测许多释放后使用和越界访问；泄漏检测能力及启用方式随环境而异。工具能帮助发现执行过的错误路径，不是对所有输入的正确性证明。C++ RAII（Resource Acquisition Is Initialization）和 Rust 所有权等机制可减少手工管理错误，但仍需理解资源所有权与接口约定。[Clang 官方文档：ASan 检测范围](https://clang.llvm.org/docs/AddressSanitizer.html)

## 常见错误

- **“`p=NULL` 就释放了 malloc 对象。”** 只改变 p 保存的值，不释放目标。
- **“`free(p)` 后所有别名自动变 NULL。”** `q` 不被自动改写。
- **“UAF 一定先导致内存泄漏。”** 已释放的对象不是仍未释放的泄漏块。
- **“程序没崩溃说明释放后读取合法。”** 非法访问不能靠一次表现判定安全。

## 选择题

C 中 `p` 与 `q` 都指向同一块成功 `malloc` 的内存，执行 `free(p)` 后，哪项正确？

- A. `q` 自动变成 NULL，可重新分配
- B. 通过 `*q` 读取旧值没有保证，是释放后使用
- C. 这块内存仍处于已分配状态，必然构成泄漏
- D. 可以再次 `free(q)`，因为 q 是另一变量

**答案：B。** `free` 结束的是目标分配，不只“断开 p”。A 假设自动清空别名，C 混淆已释放与未释放，D 会对同一块分配重复释放。

## 参考资料

- [ISO C N1570：`malloc`、`free` 与对象生存期](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)
- [Clang 官方文档：AddressSanitizer](https://clang.llvm.org/docs/AddressSanitizer.html)
