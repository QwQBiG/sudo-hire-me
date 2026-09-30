---
slug: "cpp-raii"
title: "C++ RAII 为什么能管住资源"
description: "从异常离开作用域的执行顺序看构造与析构如何自动配对，区分 RAII 与手动写 close。"
subject: "C++ 语言机制"
order: 183
minutes: 17
lab: "workbench"
objectives: ["解释资源为何应绑定对象生命周期", "推导异常退出时析构的时机", "指出 RAII 不等于只能管理堆内存"]
prerequisites: ["constructor-initialization", "memory-leak-use-after-free"]
---

# C++ RAII：离开作用域时谁来收尾

## 把资源交给对象

资源获取即初始化（Resource Acquisition Is Initialization，RAII）是 C++ 中把资源的获取与释放绑定到对象生命周期的设计方法。构造成功后对象持有资源；析构函数（Destructor）在对象生命周期结束时释放它。资源可为文件、锁、套接字或动态内存，**不只是堆内存**。这一点依托 C++ 的对象析构与异常展开规则，而不靠程序员在每条 `return` 或 `catch` 路径上手写清理。[C++ working draft：析构](https://eel.is/c++draft/class.dtor)、[异常展开](https://eel.is/c++draft/except.ctor)

## 可预测的异常路径

下面示例按 C++11 及以后标准编写，`Guard` 仅用打印模拟一次“打开/关闭”，没有真实文件资源：

```cpp
#include <iostream>

struct Guard {
    Guard() { std::cout << "open\n"; }
    ~Guard() { std::cout << "close\n"; }
};

int main() {
    try {
        Guard resource;
        std::cout << "work\n";
        throw 1;
    } catch (int) {
        std::cout << "caught\n";
    }
}
```

预期输出顺序：`open`、`work`、`close`、`caught`，每行一个。对象在 `try` 块中完整构造；抛异常后控制流离开该块，先析构 `resource`，随后进入处理器。若构造本身没完成，对这个未完成对象不会调用它自己的析构；已完成的成员或基类子对象会按规则清理。[C++ working draft：异常展开](https://eel.is/c++draft/except.ctor)

## 逐步推演

### 构造建立持有关系

执行 `Guard resource`，打印 `open`。此后只要正常离开作用域，或经已匹配的异常处理发生栈展开，`resource` 都有析构路径。

### 工作中抛出异常

打印 `work` 后执行 `throw 1`。`try` 内后续普通语句不会继续执行；并不需要在这里手动调用 `~Guard()`。

### 展开时先析构

离开 `try` 作用域时调用 `~Guard()`，打印 `close`。若有多个已构造的局部对象，按构造完成顺序的逆序析构。

### 最后进入处理器

匹配 `catch(int)`，打印 `caught`。异常路径也完成了资源收尾。

## 实际使用边界

标准库的 `std::unique_ptr` 管动态对象，`std::lock_guard` 管锁；它们比手写临时 `open/close` 更能表达所有权。析构函数通常不应向外抛异常，尤其在已有异常展开时；`std::exit`、强制终止等并非正常离开局部作用域，不能一概声称所有局部析构都必执行。[C++ working draft：程序终止](https://eel.is/c++draft/basic.start)

## 面试回答

RAII 将资源的获取与对象成功构造绑定，将释放放进析构；当控制流正常或经异常展开离开对象作用域，析构会执行，因此多条退出路径共享同一清理规则。资源可以是锁、文件或内存；常见工具有 `lock_guard`、`unique_ptr`。它依赖正常的对象生命周期机制，不能把强制终止也说成一定执行局部析构。

## 选择题

上述 `Guard` 示例中，哪一行紧接 `work` 之后输出？

- A. `caught`
- B. `close`
- C. 再次输出 `open`
- D. 没有任何输出，因为异常跳过析构

**答案：B。** 栈展开先销毁已构造的局部 `resource`，然后进入 `catch`。A、D 忽略析构顺序，C 没有再次构造。

## 参考资料

- [C++ working draft：析构函数](https://eel.is/c++draft/class.dtor)
- [C++ working draft：异常展开](https://eel.is/c++draft/except.ctor)
