---
slug: "type-conversion-casting"
title: "类型转换为什么可能丢掉信息"
description: "用 Java 的扩大与缩小数值转换算出实际值，区分允许转换、显式强转和结果仍安全。"
subject: "编程基础与面向对象"
order: 7
minutes: 17
lab: "walkthrough"
objectives: ["区分隐式与显式转换", "手算 double 到 int 及 int 到 byte 的结果", "指出显式强转不等于范围检查"]
prerequisites: ["memory-units", "binary-representation"]
---

# 类型转换：写了强转，值就安全了吗

## 先看目标类型能装什么

类型转换（Type Conversion）让一个表达式按目标类型使用。以 Java 21 原始数值类型为例，`int→long` 可隐式扩大且整数值保持精确；`double→int`、`int→byte` 是缩小转换（Narrowing Conversion），通常需要显式强制转换（Cast），因为信息可能丢失。**显式写出 `(byte)` 只是允许这个操作，不会自动检查数值是否在 byte 的 -128..127 范围内。**[Java 语言规范：转换与上下文](https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html)

## 两种丢信息的方式

```java
public class Main {
    public static void main(String[] args) {
        long exact = 130;          // int 常量可转换为 long
        int truncated = (int) 3.9; // 朝零截断
        int source = 130;
        byte narrowed = (byte) source;
        System.out.println(exact);
        System.out.println(truncated);
        System.out.println(narrowed);
    }
}
```

预期输出依次为 `130`、`3`、`-126`。Java `byte` 是有符号 8 位整数；`130` 的低 8 位是二进制 `10000010`，作为 8 位补码解释是 `-126`。`3.9→int` 丢掉小数部分，不是四舍五入。[Java 语言规范：5.1.3 缩小原始类型转换](https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.1.3)

注意“扩大”也不必然“完全无损”：Java `int→float` 虽可隐式转换，但大整数可能因浮点精度有限而舍入；上面只说 `int→long` 精确保留。C 等语言对超范围有符号整数转换有不同规则，不可套用 Java 的 `byte` 固定结果。[Java 语言规范：5.1.2 扩大转换](https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.1.2)

## 逐步推演

### int 到 long

`130` 位于两种整数类型的可表示范围内，赋给 `long exact` 后仍为 130。

### double 到 int

`3.9` 向零截断为 3；没有小数四舍五入。负数 `-3.9` 同理向零，得到 -3。

### int 到 byte

保留 130 的低 8 位：`10000010`。最高位按有符号位解释，对应 `130-256=-126`。

### 需要安全输入时先检查

若业务要求保留原数值，应该在转换前检查 `source >= Byte.MIN_VALUE && source <= Byte.MAX_VALUE`，或选择足够大的目标类型；不能把强转当作校验。

## 面试回答

类型转换分隐式和显式，规则由语言、源类型、目标类型和上下文共同决定。Java 的 `int→long` 精确保留整数；`double→int` 可能丢小数，`int→byte` 只保留低 8 位并可能改符号。强转表示程序员要求转换，不保证值没变；涉及输入边界时要单独做范围检查，也不要把 Java 的结果生搬到 C。

## 选择题

在 Java 21 中，`int n=130; byte b=(byte)n;`，`b` 是多少？

- A. 130
- B. 127
- C. -126
- D. 编译器自动抛出越界异常

**答案：C。** 低 8 位为 `10000010`，按有符号 byte 解释为 -126。A 超出 byte 范围，B 是饱和截断而 Java 强转不这样做，D 没有自动异常。

## 参考资料

- [Java 21 语言规范：Conversions and Contexts](https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html)
