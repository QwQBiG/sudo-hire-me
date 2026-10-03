---
slug: "c-sizeof-strlen"
title: "sizeof 与 strlen 到底在数什么"
description: "用带内嵌 NUL 的字符数组比较对象大小、字符串长度和指针大小，识别越界扫描风险。"
subject: "C 语言机制"
order: 213
minutes: 15
lab: "workbench"
objectives: ["区分数组容量与字符串长度", "解释内嵌 NUL 的影响", "说明 strlen 的有效内存前提"]
prerequisites: ["c-array-pointer-decay"]
---

# 一个数组可以比其中的字符串长

## 面试回答

sizeof 是运算符，给出类型或对象的大小，单位是 C 字节；strlen 是库函数，读取字符串直到第一个空字符（Null Character，NUL），不把终止字符算入长度。`char a[]="abc"` 的 sizeof a 是 4，strlen(a) 是 3。数组传参调整为指针后，sizeof 形参得到指针大小而不是数组容量。strlen 要求存在可访问的 NUL 结尾；未终止数组可能越界读取，产生未定义行为（Undefined Behavior，UB）。

## 四个字节逐个看

`char a[]={'a','\0','b','\0'};` 占 4 个 char，即 sizeof a=4。strlen(a) 从索引 0 读取 a，再在索引 1 见到 NUL，返回 1；索引 2 的 b 仍存在于数组里，只是不属于从 a 开始的第一个 C 字符串。`strlen(a+2)` 返回 1，`strlen(a+1)` 返回 0。NUL 的数值是 0，不是字符 `'0'`，也不是文本中的两个字符反斜杠和数字零。

## 实验代码

```c
#include <stdio.h>
#include <string.h>
int main(void) {
    char a[]={'a','\0','b','\0'};
    char *p=a;
    printf("%zu %zu %zu\n", sizeof a, strlen(a), strlen(a+2));
    printf("pointer bytes: %zu\n", sizeof p);
}
```

第一行预期 `4 1 1`；第二行依平台，不能写成所有平台固定 8。两个运算结果都是 size_t，因此使用 `%zu`。此例 char 占一个 C 字节，但 C 不保证一个字节恰好 8 位，位数由 CHAR_BIT 描述。

## 常见追问

sizeof 一定完全不执行表达式吗？非变长数组的一般操作数不求值，例如 sizeof(i++) 通常不增加 i；涉及变长数组（Variable Length Array，VLA）类型时存在求值规则，不能背成“永远编译期常量”。strlen 的时间通常 O(n)，循环里反复计算可能增加工作量；但优化器可能消除重复扫描，不应凭源码断言最终性能。二进制数据允许任意 0 字节，应单独携带长度，而不是调用 strlen。

## 选择题

`char a[4]={'a','\0','b','\0'};` 的 sizeof a 与 strlen(a) 是？

A. 4 和 4

B. 4 和 1

C. 3 和 1

D. 指针大小和 3

**答案：B。** sizeof 包括整个数组的所有 char；strlen 到第一个 NUL 停止且不计 NUL。A 混淆容量，C 漏算数组字节，D 把数组对象误当指针。

## 参考

- [C11 N1570：6.5.3.4、7.24.6.3](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)
