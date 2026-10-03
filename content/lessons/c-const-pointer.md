---
slug: "c-const-pointer"
title: "const 修饰的是指针还是指向的对象"
description: "把 const int * 与 int * const 的权限分别画出来，解释只读访问、重绑定和去掉 const 的风险。"
subject: "C 语言机制"
order: 211
minutes: 16
lab: "workbench"
objectives: ["读懂三种 const 指针声明", "区别访问路径与对象本身的只读属性", "判断去掉 const 后修改是否合法"]
prerequisites: ["pointer-reference-basics"]
---

# 两个能不能：能改指针吗，能改对象吗

## 面试回答

C 的类型限定符（Type Qualifier）const 可以限制指针本身，也可以限制经指针访问的对象。`const int *p` 可改变 p 的指向，但不能通过 p 修改 int；`int * const p` 的 p 不能重赋值，但可修改 *p；`const int * const p` 两者都受限。只读指针不一定指向本来就定义为 const 的对象；如果对象本来是 const，去掉限定再修改会产生未定义行为（Undefined Behavior，UB）。

## 从声明对应到操作

令 a=10、b=20，p 最初指向 a。

| 声明 | `p = &b` | `*p = 11` |
| --- | --- | --- |
| `const int *p` | 允许 | 编译约束不允许 |
| `int * const p` | 不允许 | 允许 |
| `const int * const p` | 不允许 | 不允许 |

先从 p 往外读：p 是指针，再看 `*` 哪侧的 const 限制哪一层。`int const *p` 与 `const int *p` 等价。多级指针不能随意照搬单级转换：`int **` 不能隐式转换为 `const int **`，否则可间接把 const 对象交给可写指针。

## 实验代码

```c
#include <stdio.h>
int main(void) {
    int a=10, b=20;
    const int *reader=&a;
    a=11;                         /* 原对象仍可修改 */
    reader=&b;                    /* 指针可重绑定 */
    int * const fixed=&a;
    *fixed=12;                    /* 通过固定指针修改对象 */
    printf("%d %d\n", *reader, a);
}
```

预期 `20 12`。`reader` 不提供写权限，但 a 并不是不可变对象，所以别的合法路径能改 a。网页是权限模型，不执行违反约束或 UB 的代码。

## 面试追问：const 是线程安全保证吗

不是。它限制这条访问路径的写操作，不提供同步，也不能阻止其他别名修改原对象。想保护共享数据，还需讨论数据本身是否可变、访问者是否同步。函数参数写成 `const int *a` 表达“不通过此指针修改元素”的契约，不会自动检查 a 有效或元素数量足够。

## 选择题

`int a=1; const int *p=&a; a=2;` 后 `*p` 是什么？

A. 1，因为 const 缓存最初值

B. 2，因为原对象不是 const

C. 编译失败，任何人都不能改 a

D. 一定产生 UB

**答案：B。** const 不是值快照，A 错；限定施加在指针所允许的访问上，C 错；a 是普通可修改对象，D 错。把真正 const 对象强制转成可写指针并修改才是另一个危险场景。

## 参考

- [C11 N1570：6.7.3 类型限定符、6.5.16.1 指针赋值](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)
