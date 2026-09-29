---
slug: "c-array-pointer-decay"
title: "C 数组为什么传参后不再知道长度"
description: "用同一个 int 数组比较 sizeof、数组形参和两种加一表达式，理解数组到指针的转换边界。"
subject: "C 语言机制"
order: 180
minutes: 18
lab: "array-decay"
objectives: ["区分数组对象与指向首元素的指针", "解释数组形参调整后 sizeof 的结果", "根据所指类型推导指针加一的跨度"]
prerequisites: ["pointer-reference-basics", "array-bounds-slices"]
---

# C 数组与指针：什么时候会“退化”

## 先看同一个数组

以 C11、`sizeof(int)=4` 字节、`sizeof(int *)=8` 字节的示例平台为条件：

```c
int a[3] = {10, 20, 30};
```

`a` 是三个 `int` 构成的**数组对象**，总占 12 字节，不是一个存着地址的指针变量。数组到指针转换（Array-to-Pointer Conversion）发生在**大多数表达式**里：表达式 `a` 转为指向首元素的 `int *`，例如传给接收 `int *` 的函数或参与 `a+1`。但 `sizeof a` 和 `&a` 是这里要抓住的两个例外：前者仍看整个数组，后者得到“指向整个数组”的指针。C11 还规定了其他特定例外；不要把“大多数”背成“所有”。[ISO C N1570：6.3.2.1 数组转换](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)

## 四个表达式逐个算

| 表达式 | 看见的类型 | 本例结果或跨度 | 原因 |
| --- | --- | --- | --- |
| `sizeof a` | `int[3]` | 12 字节 | 测整个数组对象 |
| `a + 1` | `int *` | 向后跨 4 字节 | 指向下一个 `int` |
| `&a + 1` | `int (*)[3]` | 向后跨 12 字节 | 指向下一个三元素数组的位置 |
| `sizeof p`，`p` 是函数形参 `int p[3]` | `int *` | 8 字节 | 数组形参声明调整为指针形参 |

`a` 转换后的首元素指针与 `&a` 都指向这块数组的起始位置，但**类型和加一步的跨度不同**。`&a+1` 是数组对象之后的一越界位置（One-Past Pointer）；可以形成该指针，不可解引用。`int p[3]` 里的 `3` 在函数形参中不会让函数自动接收一个完整数组对象，调用方要另传长度。[ISO C N1570：6.7.6.3 函数形参调整](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)

## 实验代码

```c
#include <stdio.h>

static void inspect(int p[3]) {
    printf("parameter bytes: %zu\n", sizeof p);
}

int main(void) {
    int a[3] = {10, 20, 30};
    printf("array bytes: %zu\n", sizeof a);
    printf("element bytes: %zu\n", sizeof a[0]);
    inspect(a);
    return 0;
}
```

在上述 4/8 字节条件下，预期三行依次为 `array bytes: 12`、`element bytes: 4`、`parameter bytes: 8`。编译器可能提醒对数组形参取 `sizeof` 易误解；这正是此例要观察的陷阱。换平台时应以真实 `sizeof` 为准，不能把 8 当成 C 的统一指针大小。

## 面试回答

C 数组本身是连续元素组成的对象；在大多数表达式中，数组表达式转换为指向首元素的指针。`sizeof a` 测完整数组，`&a` 得到指向整个数组的指针；函数形参写成 `int p[3]` 也会调整为 `int *p`，所以在函数里 `sizeof p` 只是指针大小，无法找回原数组长度。`a+1` 跨一个元素，`&a+1` 跨一个数组，具体字节数取决于元素大小和数组长度。

## 容易说错的地方

- **“数组就是指针。”** 数组对象不是指针对象；只有特定表达式上下文发生转换。
- **“形参写了 `[3]`，函数就能检查调用方一定传三项。”** 普通数组形参不会自动携带此长度。
- **“两个加一结果只差 1 字节。”** 指针算术按所指类型大小移动，不按裸字节数移动。

## 选择题

在本课 4/8 字节的示例平台，`int a[3]`，下列哪项正确？

- A. `sizeof a` 为 8，因为数组总会转换为指针
- B. `a+1` 向后跨 12 字节
- C. `&a+1` 向后跨 12 字节
- D. `int p[3]` 形参让函数知道调用方数组恰有三项

**答案：C。** `&a` 指向整个三元素数组，加一跨 12 字节。A 忘了 `sizeof` 的例外，B 混淆元素与数组步长，D 把形参声明误当运行时长度信息。

## 参考资料

- [ISO C N1570：数组表达式转换、`sizeof`、函数形参调整](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)
