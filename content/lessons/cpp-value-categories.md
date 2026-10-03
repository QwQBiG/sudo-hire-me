---
slug: "cpp-value-categories"
title: "左值右值与 std::move 的常见误判"
description: "按表达式判断 lvalue、prvalue、xvalue，说明具名右值引用为什么是左值以及 move 何时才真正搬资源。"
subject: "C++ 语言机制"
order: 215
minutes: 20
lab: "workbench"
objectives: ["按表达式而不是变量类型判断类别", "解释 std::move 只是转换", "判断三个普通引用的绑定条件"]
prerequisites: ["cpp-move-semantics"]
---

# 右值引用变量的名字，仍然是左值表达式

## 面试回答

以 C++17 为例，值类别（Value Category）是表达式的属性：左值（lvalue）标识对象或函数；纯右值（prvalue）用于计算值或初始化对象；亡值（xvalue）也标识对象，但允许资源被复用。`std::move(x)` 将表达式转为右值类别，自己不移动资源，真正动作取决于随后调用的构造或赋值函数。具名 `T&& r` 在表达式中写 r 是 lvalue；因此“类型是右值引用，所以所有使用都是右值”不成立。

## 用同一 int 对照

令 `int x=3; int&& r=4;`，不涉及模板转发或 const 限制。

| 表达式 | 类别 | 可绑定 int& | 可绑定 const int& | 可绑定 int&& |
| --- | --- | --- | --- | --- |
| x | lvalue | 是 | 是 | 否 |
| 42 | prvalue | 否 | 是 | 是 |
| std::move(x) | xvalue | 否 | 是 | 是 |
| r | lvalue | 是 | 是 | 否 |

不要用“能不能出现在等号左边”定义左值：const int 对象的名字也是左值，但不可赋值。标量赋值可以处理右值，却不意味着它有堆资源可搬。

## 实验代码

```cpp
#include <iostream>
#include <string>
#include <utility>
int main() {
    std::string a="hello";
    auto&& reference=std::move(a);
    std::cout << a << '\n';
    std::string b=std::move(reference);
    std::cout << b << '\n';
}
```

预期两行都是 hello。绑定 reference 不调用 string 的移动构造；初始化 b 才调用。移动后 a 处于有效但值未指定的状态（Valid but Unspecified State），不要断言所有实现中必为空，也不要未经前置条件检查就调用需要特定状态的操作。

## 面试追问

`std::move(const_string)` 会移动吗？转换后仍保留 const，常见 string 的移动构造接收非 const 右值引用，因此可能匹配复制构造。`T&&` 一定只是右值引用吗？类型推导场景可能是转发引用（Forwarding Reference），需要结合推导规则判断；本实验固定 int，不把普通绑定规则误套模板。过度对返回局部对象写 move 可能阻碍命名返回值优化，应先理解返回语义而不是到处加 move。

## 选择题

`int&& r=5;` 后表达式 r 的类别是什么？

A. lvalue

B. prvalue

C. xvalue

D. 由编译器随机选择

**答案：A。** 具名对象通过名字使用是左值；`std::move(r)` 才产生这里的 xvalue。B/C 混淆声明类型与表达式，D 不符合语言规则。

## 参考

- [C++ 标准草案：值类别](https://eel.is/c++draft/basic.lval)
