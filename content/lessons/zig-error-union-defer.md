---
slug: "zig-error-union-defer"
title: "Zig 的 !、try、defer 怎样串起来"
description: "分别沿成功与错误路径推导错误联合类型、try 传播和两种延迟清理的执行顺序。"
subject: "Zig 语言机制"
order: 189
minutes: 19
lab: "workbench"
objectives: ["读懂 error{Negative}!i32 的两种结果", "解释 try 的成功和错误分支", "区分 defer 与 errdefer 的触发条件"]
prerequisites: ["error-handling-models"]
---

# Zig 错误传播：离开作用域时做什么

## 先读返回类型

以 Zig 0.14.0 官方语言文档为范围，错误联合类型（Error Union Type）`error{Negative}!i32` 表示函数返回一个 `i32`，**或者**错误 `Negative`，而不是同时返回两个值。`try expression` 在成功时取出值，在错误时把错误从当前函数返回；因此使用 `try` 的函数本身要能返回兼容错误。`defer` 在离开当前作用域时执行，`errdefer` 只在错误退出路径执行；同一作用域里待执行的延迟语句按逆序运行。[Zig 0.14.0：Errors、defer、errdefer](https://ziglang.org/documentation/0.14.0/#Errors)

## 一份代码跑两条路径

```zig
const std = @import("std");

fn nonNegative(n: i32) error{Negative}!i32 {
    if (n < 0) return error.Negative;
    return n;
}

fn step(n: i32) error{Negative}!i32 {
    defer std.debug.print("defer\n", .{});
    errdefer std.debug.print("errdefer\n", .{});
    const value = try nonNegative(n);
    std.debug.print("value={d}\n", .{value});
    return value;
}

pub fn main() void {
    _ = step(7) catch return;
    _ = step(-1) catch |err| {
        std.debug.print("caught={s}\n", .{@errorName(err)});
        return;
    };
}
```

`std.debug.print` 写标准错误；按 0.14.0 语义，预期输出依次为 `value=7`、`defer`、`errdefer`、`defer`、`caught=Negative`，每项一行。`step(7)` 成功，`errdefer` 不运行；`step(-1)` 的 `try` 传播 `Negative`，先运行后注册的 `errdefer`，再运行先注册的普通 `defer`，最后调用方 `catch` 打印错误名。示例不依赖错误整数编码。[Zig 0.14.0：try 与延迟语句](https://ziglang.org/documentation/0.14.0/#Errors)

## 逐步推演

### 成功值 7

`nonNegative(7)` 返回值 7，`try` 解包为 `value=7`；先打印 `value=7`，离开 `step` 时仅运行 `defer`。

### 错误值 -1

`nonNegative(-1)` 返回 `error.Negative`；`try` 直接从 `step` 返回错误，不会执行后面的 `value={d}` 打印。

### 清理按逆序

错误离开 `step` 时，两个延迟语句都适用。后注册的 `errdefer` 先打印，再由普通 `defer` 打印；这不是“defer 只管成功”。

### 调用方接住错误

`main` 的 `catch |err|` 接住 `Negative`，最后打印 `caught=Negative` 并结束。若没有 `catch` 或传播安排，不能把错误联合值当普通整数直接使用。

## 面试回答

Zig 的 `E!T` 是“错误 E 或成功值 T”的错误联合；`try` 成功时解包，出错时把错误从当前函数传播。`defer` 对正常和错误离开当前作用域都执行，`errdefer` 只对错误退出执行，多个延迟操作按逆注册顺序执行。清理逻辑应按真实作用域和错误路径推导，不能把 `errdefer` 说成任何退出都会运行。

## 选择题

示例中 `step(-1)` 内，调用方打印 `caught=Negative` **之前**的两行顺序是什么？

- A. `defer`、`errdefer`
- B. `errdefer`、`defer`
- C. 只有 `defer`
- D. 两个都不执行

**答案：B。** 两者均适用于错误退出，且后注册的 `errdefer` 先执行。A 颠倒顺序，C 忽略错误专用清理，D 忽略作用域退出。

## 参考资料

- [Zig 0.14.0 官方语言文档：Errors、defer 与 errdefer](https://ziglang.org/documentation/0.14.0/#Errors)
