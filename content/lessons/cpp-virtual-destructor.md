---
slug: "cpp-virtual-destructor"
title: "C++ 多态基类为什么需要虚析构"
description: "沿 Base 指针删除 Derived 对象，推导两个析构函数的顺序与缺少 virtual 的风险。"
subject: "C++ 语言机制"
order: 185
minutes: 16
lab: "workbench"
objectives: ["判断经基类指针 delete 时的前提", "推导派生类与基类析构顺序", "解释没有虚析构时不能猜测输出"]
prerequisites: ["oop-polymorphism", "cpp-raii"]
---

# C++ 虚析构：删除的到底是哪种对象

## 指针类型与真实对象不同

虚析构函数（Virtual Destructor）让通过基类指针销毁派生类对象时，析构调用沿真实对象类型正确派发。以 C++11 及以后、普通 `delete` 表达式为范围：若 `Base *` 实际指向 `new Derived` 创建的对象，基类与派生类类型不同，通常要求基类有虚析构；否则该 `delete` 是未定义行为（C++20 起存在特定 destroying `operator delete` 例外，本课不使用）。不能把“常看到只打印 Base”当成语言保证。[C++ working draft：delete 表达式](https://eel.is/c++draft/expr.delete)

## 一段合法代码的输出

```cpp
#include <iostream>

struct Base {
    virtual ~Base() { std::cout << "Base destroyed\n"; }
};

struct Derived : Base {
    ~Derived() override { std::cout << "Derived destroyed\n"; }
};

int main() {
    Base *p = new Derived;
    delete p;
}
```

预期输出两行：先 `Derived destroyed`，再 `Base destroyed`。删除表达式识别最派生对象，先执行 `Derived` 的析构体，再按对象构造层次的逆序完成基类子对象的析构。`override` 帮助检查 `Derived` 的析构是否重写了虚析构。[C++ working draft：析构顺序](https://eel.is/c++draft/class.dtor)

## 逐步推演

### 创建真实对象

`new Derived` 创建一个完整 `Derived` 对象，其中包含 `Base` 基类子对象；`p` 的**静态类型**是 `Base *`，但所指对象的**动态类型**是 `Derived`。

### 通过基类指针删除

`delete p` 需要销毁动态类型对象。由于 `Base::~Base()` 是虚函数，析构调用找到最派生类版本。

### 按层次逆序收尾

先运行 `Derived::~Derived()` 的输出，再运行 `Base::~Base()` 的输出；最后释放与该 `new` 匹配的存储。

### 对照缺少 virtual

若仅删去基类析构前的 `virtual`，却仍通过 `Base *` 对 `Derived` 调用普通 `delete`，就不能再合法推导“只会执行哪个析构”。它属于未定义行为；本课不执行该错误版本。

## 面试回答

当类会被当作多态基类、对象可能通过基类指针删除时，基类应有虚析构。这样普通 `delete Base*` 可按实际派生对象先运行派生类析构，再运行基类析构。若静态基类类型与实际派生类型不同而缺少满足规则的虚析构，不能预测固定结果；现代代码也可用合适的智能指针和明确的所有权设计减少裸 `delete`，但它们不替代对删除契约的理解。

## 选择题

以上代码执行 `delete p` 时，哪项是预期输出顺序？

- A. 只输出 `Base destroyed`
- B. 先 `Base destroyed` 再 `Derived destroyed`
- C. 先 `Derived destroyed` 再 `Base destroyed`
- D. 两者顺序由编译器随机决定

**答案：C。** 虚析构从完整派生对象开始，随后析构基类子对象。A 忽略派生析构，B 颠倒析构层次，D 把有规则的合法代码误说成随机。

## 参考资料

- [C++ working draft：delete 表达式与动态类型](https://eel.is/c++draft/expr.delete)
- [C++ working draft：析构函数与子对象顺序](https://eel.is/c++draft/class.dtor)
