---
slug: "cpp-move-semantics"
title: "C++ std::move 到底移动了什么"
description: "跟踪 unique_ptr 的单一所有权转移，区分 std::move 表达式与真正的移动构造。"
subject: "C++ 语言机制"
order: 184
minutes: 18
lab: "move-ownership"
objectives: ["说明 std::move 本身只是类型转换", "推导 unique_ptr 移动前后两个变量的状态", "避免把所有类型的已移动对象都说成空值"]
prerequisites: ["cpp-raii", "function-arguments"]
---

# C++ 移动语义：谁接管了资源

## 先分清“准备移动”与“发生移动”

以 C++14 及以后为例，`std::move(x)` 返回可绑定到右值引用（Rvalue Reference）的表达式，本质是一个类型转换；**单独求值它并不会搬走对象**。之后是否调用移动构造或移动赋值，取决于接收表达式的上下文与类型提供的操作。移动语义（Move Semantics）的意义是允许新对象接管旧对象管理的资源，而不必按复制语义另造一份。[C++ working draft：`std::move`](https://eel.is/c++draft/forward)

## 一份资源，两位可能的所有者

```cpp
#include <iostream>
#include <memory>
#include <utility>

int main() {
    auto p = std::make_unique<int>(7);
    auto&& candidate = std::move(p); // 仅绑定引用，p 仍持有对象
    std::cout << (p != nullptr) << '\n';
    auto q = std::move(p);           // unique_ptr 移动构造，q 接管
    std::cout << (p == nullptr) << ' ' << *q << '\n';
    (void)candidate;                 // 不在转移后通过它访问对象
}
```

预期两行输出为 `1` 与 `1 7`。第一次打印前，`candidate` 只是绑定到 `p` 的引用，`p` 未变；`q` 构造后，`unique_ptr` 的标准后置条件保证原 `p.get()==nullptr`。这里**只保证 `unique_ptr` 的状态**；不能推广成所有已移动对象都变空、所有移动都一定快，也不能在 `p` 为空后解引用它。[C++ working draft：`unique_ptr` 移动构造](https://eel.is/c++draft/unique.ptr.single.ctor)

## 在实验里对照两次点击

先点“仅求值 `std::move(p)`”，所有者应仍是 `p`。再点“`q=std::move(p)`”，对象 7 转交 `q`，原 `p` 为空。实验还允许反向移动，模拟两个 `unique_ptr` 之间的移动赋值；它只跟踪一个 `int` 及其所有者，不模拟一般类型的移动后状态、内存分配次数或真实地址。

## 错误反例

- **“调用 `std::move(p)` 就清空 p。”** 没有接收者参与移动操作时，`p` 不会因为这个转换自动变化。
- **“可以同时复制 unique_ptr 到 p 和 q。”** `unique_ptr` 的复制构造与复制赋值被禁用，独占语义不允许两份所有者。
- **“移动后的任意对象都必定是空对象。”** `unique_ptr` 源对象为空有明确标准保证；其他类型可能只保证仍有效但状态需依类型而定。

## 面试回答

`std::move` 只把表达式转成可被移动操作接收的形式，本身不搬数据；真正转移发生在移动构造或移动赋值里。对 `std::unique_ptr`，移动后目的指针接管资源、源指针保证变为 `nullptr`；因此不能再解引用源指针。对于别的类型，不能套用 `unique_ptr` 的“必定为空”结论，要看该类型的移动契约。

## 选择题

执行 `auto p=std::make_unique<int>(7); auto&& r=std::move(p);` 后，尚未创建别的对象，此时哪项正确？

- A. `p` 立刻变成 `nullptr`
- B. `r` 与 `p` 可各自独立拥有一份 7
- C. `p` 仍持有对象，`r` 只是绑定到 `p` 的引用
- D. 该表达式一定调用 `unique_ptr` 移动构造

**答案：C。** `std::move` 的转换加引用绑定没有创建新的 `unique_ptr`。A、D 把转换误当移动构造；B 违反独占所有权。

## 参考资料

- [C++ working draft：`std::move`](https://eel.is/c++draft/forward)
- [C++ working draft：`unique_ptr` 移动构造后置条件](https://eel.is/c++draft/unique.ptr.single.ctor)
