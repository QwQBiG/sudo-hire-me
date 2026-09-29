---
slug: "callbacks-function-pointers"
title: "回调为什么能让一段流程复用"
description: "用 C 函数指针把筛选规则交给通用遍历，追踪调用方与被调用方各负责哪一步。"
subject: "编程基础与面向对象"
order: 11
minutes: 17
lab: "walkthrough"
objectives: ["解释回调的调用方向", "读懂 C 函数指针形参", "计算同一遍历更换规则后的结果"]
prerequisites: ["function-arguments", "pointer-reference-basics"]
---

# 回调与函数指针：流程不变，规则可换

## 谁在什么时候调用谁

回调（Callback）是调用方把一个可调用的行为交给另一个函数或系统，后者在约定时机再调用它。C 里常用函数指针（Function Pointer）表达这个入口；其他语言可以用函数对象、闭包或接口，不能把“回调”限定为 C 指针。函数指针类型中的形参与返回值必须匹配，调用时传入符合契约的函数。[ISO C N1570：6.7.6.3 函数声明、6.5.2.2 函数调用](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)

## 同一数组换一条筛选规则

```c
#include <stddef.h>
#include <stdio.h>

static int is_even(int x) { return x % 2 == 0; }
static int over_three(int x) { return x > 3; }

static size_t count_if(const int *a, size_t n, int (*test)(int)) {
    size_t count = 0;
    for (size_t i = 0; i < n; ++i) {
        if (test(a[i])) ++count;
    }
    return count;
}

int main(void) {
    int a[] = {2, 3, 4, 5};
    size_t n = sizeof a / sizeof a[0];
    printf("even=%zu\n", count_if(a, n, is_even));
    printf("over3=%zu\n", count_if(a, n, over_three));
}
```

预期输出 `even=2` 和 `over3=2`。前一次匹配 2、4，后一次匹配 4、5；虽然数量恰巧相等，筛选依据不同。`int (*test)(int)` 表示“指向接受一个 `int`、返回 `int` 的函数”的指针。`count_if` 控制遍历时机，调用方提供判断规则。这里数组与回调都非空；若要做公开 API，需规定或检查空指针和长度的组合。[ISO C N1570：函数指针调用](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)

## 逐步推演

### 第一轮传入 is_even

`count_if` 对 2、3、4、5 依次调用 `is_even`；返回的真假序列为真、假、真、假，所以计数 2。

### 第二轮换 over_three

同一循环不变，回调换成 `over_three`；真假序列为假、假、真、真，计数仍为 2。

### 找到控制权方向

`main` 发起 `count_if`，却不是 `main` 在循环中直接调用每个谓词；`count_if` 在需要判断每个元素时“回过头”调用传入的函数。

### 明确 C 的边界

普通 C 函数指针不能自动携带调用处的局部变量。若判断规则需要额外阈值，常见设计是再传 `void *context` 并清楚约定其有效期与类型，而不是假设指针会捕获环境。

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
