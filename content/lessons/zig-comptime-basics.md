---
slug: "zig-comptime-basics"
title: "Zig comptime 与运行时参数如何配合"
description: "用泛型 twice 函数区分编译期类型选择、运行时数值和编译期求值，避免把 comptime 当宏替换。"
subject: "Zig 语言机制"
order: 222
minutes: 18
lab: "workbench"
objectives: ["区分编译期类型与运行时值", "解释泛型专门化", "判断运行时选择类型为何不成立"]
prerequisites: ["generic-programming-basics"]
---

# 类型可以在编译期确定，值仍在运行时输入

## 面试回答

Zig 的 comptime 指编译期（Compile Time）已知或执行的要求，可以用普通语言结构计算类型、生成专门化函数或验证约束。`fn twice(comptime T: type, x: T) T` 要求 T 编译期已知，但 x 可以是运行时值。传入 i32 和 f64 得到对应类型的实例，不等于每次 twice 调用都在编译时算完。const 表示绑定不可修改，不保证初始化值编译期已知；运行时信息不能直接满足 comptime 参数要求。

## 两个不同的时间

编译器看见 `twice(i32, input)`：先知道参数与返回值类型为 i32，检查加法可用；运行时再拿到 input 并做数值运算。`twice(f64, input)` 对应另一种类型。若用户运行时输入一个数字来选择 i32/f64，可以显式分支分别调用已编译实例，而不能把运行时变量当 type 值传入。

| 项目 | 何时确定 | 是否必须编译期已知 |
| --- | --- | --- |
| T=i32 | 编译期 | 是 |
| 输入 x | 可运行时 | 否 |
| 返回类型 T | 编译期 | 是 |
| x+x 的结果 | 取决于调用位置和实参 | 否 |

## 实验代码

```zig
const std = @import("std");
fn twice(comptime T: type, x: T) T { return x + x; }
test "two type specializations" {
    try std.testing.expectEqual(@as(i32, 6), twice(i32, 3));
    try std.testing.expectEqual(@as(f64, 3.0), twice(f64, 1.5));
    comptime {
        if (twice(i32, 3) != 6) @compileError("unexpected result");
    }
}
```

Zig 0.15.2，预期测试通过。comptime 块强制编译期检查；普通调用不因 T 是 comptime 就强制整个函数在编译期执行。输入范围仍应避免整数溢出，这个例子不代表任意 i32 都能安全乘二。

## 面试追问

comptime 和文本宏有什么区别？它使用类型、控制流与函数语义，不是把源文件字符串机械替换。anytype 与 comptime T 都能参与泛型写法，但是否必须编译期传入、实例如何生成要看签名，不能用“都叫泛型”忽略规则。编译期工作也有成本；巨大展开可能增加编译时间和产物体积，不应为了炫技把所有数据都搬到编译期。

## 选择题

`twice(comptime T: type, x: T)` 最准确的描述是？

A. T 与 x 一定全部编译期已知

B. T 编译期已知，x 可在运行时取得

C. T 可以由网络请求直接返回 type

D. const 与 comptime 完全同义

**答案：B。** A 过度扩大要求；C 把运行时数据当类型；D 混淆不可修改绑定与编译期可知性。具体调用可被编译期求值，但不是由签名强制 x 已知。

## 参考

- [Zig 0.15.2：comptime 与泛型函数](https://ziglang.org/documentation/0.15.2/)
