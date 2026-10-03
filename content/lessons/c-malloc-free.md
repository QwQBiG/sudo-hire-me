---
slug: "c-malloc-free"
title: "C 的 malloc 与 free 怎么配对"
description: "亲手追踪一次动态数组分配、初始化、使用和释放，识别失败分支与重复释放。"
subject: "C 语言机制"
order: 181
minutes: 17
lab: "workbench"
objectives: ["写出 malloc 成功和失败两条路径", "解释未初始化存储不能直接当成有效值读取", "指出 free 后指针与对象的不同状态"]
prerequisites: ["stack-vs-heap", "memory-leak-use-after-free"]
---

# C 动态存储：申请、使用、释放

## 为什么要检查返回值

C 标准库的 `malloc`（Memory Allocation）接收**字节数**，成功时返回一块满足一般对象对齐要求的存储的指针，失败时返回空指针 `NULL`。新分配区域的内容**未初始化**；不能把它想成自动清零的 `int` 数组。用 `free` 释放由合适分配函数返回且尚未释放的块；`free(NULL)` 可以安全地什么都不做。[ISO C N1570：7.22.3 内存管理函数](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)

这一课只讨论 C11 中一块普通动态存储的生命周期，不把所有运行时实现都描述成某个具体“堆区”布局。

## 一段完整的成功路径

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    size_t count = 3;
    int *a = malloc(count * sizeof *a);
    if (a == NULL) {
        fputs("allocation failed\n", stderr);
        return 1;
    }
    for (size_t i = 0; i < count; ++i) a[i] = (int)i + 1;
    printf("sum=%d\n", a[0] + a[1] + a[2]);
    free(a);
    a = NULL;
    return 0;
}
```

分配成功时预期标准输出是 `sum=6`。失败时只写标准错误 `allocation failed` 并返回 1；不会解引用 `NULL`。`sizeof *a` 随 `a` 所指的元素类型变化，避免误写成 `sizeof a`（后者测指针对象）。真正处理外部给出的 `count` 时，还要先防 `count * sizeof *a` 溢出 `size_t`：可检查 `count > SIZE_MAX / sizeof *a`，再相乘。这里固定 `count=3`，不触及该边界。

## 逐步推演

### 申请三项容量

`count=3`，请求 `3 * sizeof(int)` 字节。成功分支里 `a` 指向所获存储，三个 `int` 槽位**尚未得到本例需要的 1、2、3**。

### 初始化后再读取

循环依次写 `a[0]=1`、`a[1]=2`、`a[2]=3`。此时求和 `1+2+3=6`，所以成功路径打印 `sum=6`。

### 释放并终止使用

`free(a)` 结束该动态对象的生命周期。随后把本地变量 `a` 设为 `NULL`，可避免这个变量继续保留悬空值；**其他可能的别名不会被自动清空**。再次 `free` 原已释放的非空指针，或读取原对象，都不是安全操作。

### 失败分支不进入循环

如果 `malloc` 返回 `NULL`，`if` 分支直接报错并返回；不初始化、不求和、也无需为这次失败调用 `free`。

## 面试回答

`malloc` 按字节数申请动态存储，可能返回 `NULL`，且成功所得字节没有自动初始化；应检查失败、写入有效值后再读取。`free` 释放一次，释放后不能再通过旧指针访问对象，也不能重复释放；`free(NULL)` 合法。常用 `malloc(n * sizeof *p)` 按元素类型算容量，`n` 来自外部时还须检查乘法溢出。

## 追问：realloc 失败后原块怎么办

非零新大小的 `realloc(p, new_size)` 失败会返回 NULL，但原块仍保持有效；应先用临时指针接收，成功后再更新拥有者变量。直接写 `p = realloc(p, new_size)` 失败时可能丢失唯一的原块指针并泄漏。成功后即使返回地址数值看起来没变，也应以返回的新指针访问资源，不继续使用旧别名。

扩大的新增区域未自动初始化，缩小后超出新大小的访问无效；乘法溢出仍要在调用之前检查。零大小的行为有标准版本差异，应明确避免用它表达释放，直接 free 更清楚。本课主例固定非零大小，不伪造所有分配失败都已被实际触发。

## 不安全写法

- `int *p=malloc(3*sizeof *p); printf("%d",p[0]);` 缺少失败检查和初始化，不能推断输出是 0。
- `free(p); free(p);` 在第一次成功释放后再次释放同一非空指针，不能当作“多释放一次更保险”。
- `free(p); p=NULL;` 只清空 `p` 这个变量，不会同步改写另一个保存旧地址的变量。

## 选择题

在 C 中，成功调用 `int *p=malloc(3*sizeof *p);` 后，哪项可以直接保证？

- A. `p[0]` 是 0
- B. 已获得至少能存放三个 `int` 的存储，但读取前仍需初始化
- C. `free(p)` 后 `p` 自动变为 `NULL`
- D. 后续 `malloc` 不可能失败

**答案：B。** 请求的字节数按三个元素计算，成功仅保证可用存储，不保证其值已初始化。A 混淆 `malloc` 与清零，C 把对象释放误认为变量赋值，D 无依据。

## 参考资料

- [ISO C N1570：`malloc`、`free` 和动态存储](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)
