---
slug: "zig-allocator-ownership"
title: "Zig 为什么把 allocator 交给调用者"
description: "从显式分配与 defer free 理解资源归属、失败路径和 slice 不代表自动释放的对象。"
subject: "Zig 语言机制"
order: 221
minutes: 20
lab: "workbench"
objectives: ["解释 allocator 参数的意义", "将成功分配与释放成对审查", "识别返回已释放 slice 的错误"]
prerequisites: ["zig-error-union-defer"]
---

# 谁选择分配器，谁负责释放，分别说清楚

## 面试回答

Zig 常把分配器（Allocator）作为显式参数，使调用者选择资源策略，例如通用分配器、固定缓冲区或 arena。分配返回的 slice 是指针和长度视图，不具备自动所有权释放。接口必须说明内存归属、释放方式与存活期限；成功分配后可立即登记 defer 释放，失败路径用错误联合与 try 传播。defer 不是垃圾回收，更不能在释放缓冲区后把指向它的 slice 返回给调用者。本课代码固定 Zig 0.15.2。

## 四条路径逐个检查

1. 分配失败：尚无 buf，try 返回错误，不执行未登记的释放。
2. 分配成功并正常返回：在离开作用域时 defer free，资源归还。
3. 分配成功但后续失败：已登记的 defer 仍执行；若接口成功时转交所有权，通常需要 errdefer 只在错误退出时清理。
4. 返回 buf 但同一作用域 defer free(buf)：返回 slice 已指向失效存储，是接口错误，不因为 slice 还保留长度就有效。

网页可以关闭 defer，再退出函数，对比占用是否归零；它显示规则，不执行真实悬空访问。

## 实验代码

```zig
const std = @import("std");
fn makeCopy(allocator: std.mem.Allocator, text: []const u8) ![]u8 {
    const buf = try allocator.alloc(u8, text.len);
    @memcpy(buf, text);
    return buf;
}
test "caller releases returned storage" {
    const allocator = std.testing.allocator;
    const buf = try makeCopy(allocator, "hi");
    defer allocator.free(buf);
    try std.testing.expectEqualStrings("hi", buf);
}
```

makeCopy 成功时把释放责任交给调用者，不能在函数内 defer free(buf)。可用 `zig test file.zig` 检查正常路径；std.testing.allocator 能帮助检测测试中的泄漏，网页没有运行该测试。本函数分配后只有 memcpy 和返回，无后续可失败步骤，所以无需为不存在的错误路径加 errdefer。

## 面试追问

arena 什么时候适合？许多对象共同属于同一阶段，阶段结束统一释放；单个对象不必反复回收。但长期把所有请求放同一 arena 会累积内存。复制 slice 仅复制视图，不复制底层字节，也不让两份视图都应该 free。同一块资源释放两次和返回失效视图都不是 allocator 自动解决的问题。库接收 allocator 让策略可测试可替换，但不保证任意策略下性能一致。

## 选择题

函数返回新分配的 buf，并在该函数内 `defer allocator.free(buf)`，问题是什么？

A. defer 要等程序结束才执行

B. 返回后 buf 指向已释放存储

C. slice 返回自动深拷贝字节

D. allocator 一定拒绝编译

**答案：B。** defer 在当前作用域退出执行；A 错，C 混淆视图与拥有者，D 假设编译器证明所有手工资源关系。应转交有效资源并让调用者按契约释放。

## 参考

- [Zig 0.15.2：Choosing an Allocator、defer、errdefer](https://ziglang.org/documentation/0.15.2/)
