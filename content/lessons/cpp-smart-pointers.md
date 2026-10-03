---
slug: "cpp-smart-pointers"
title: "unique_ptr shared_ptr weak_ptr 分别拥有谁"
description: "通过最后一个强引用的释放与弱引用锁定，区分资源拥有、共享计数、循环引用和线程安全。"
subject: "C++ 语言机制"
order: 214
minutes: 20
lab: "workbench"
objectives: ["按所有权选择智能指针", "解释弱引用如何打破环", "区分控制块安全与载荷安全"]
prerequisites: ["cpp-raii"]
---

# 智能指针管理资源，不代替所有设计判断

## 面试回答

智能指针（Smart Pointer）把资源释放绑定到对象生命周期，体现资源获取即初始化（Resource Acquisition Is Initialization，RAII）。unique_ptr 表达独占所有权，不可复制、可以移动；shared_ptr 共享所有权，最后一个强拥有者释放时销毁对象；weak_ptr 是不延长对象生命的观察者，lock() 尝试取得 shared_ptr，对象已销毁时得到空指针。优先使用满足需求的最简单所有权模型；共享所有权有计数成本和强引用环风险，也不保证载荷的线程安全。

## 把三个寿命分开

先有 shared_ptr a，复制为 b，再由 a 创建 weak_ptr w：强引用 2、显式弱句柄 1。释放 a 后强引用 1，对象仍活；释放 b 后强引用 0，对象析构，w 仍可存在但不能升级。管理计数等元数据的控制块（Control Block）还可能因 w 存在而保留；对象析构不等于每一块关联内存立刻归还，make_shared 合并分配时更要区分。

## 实验代码

```cpp
#include <iostream>
#include <memory>
struct Item { ~Item() { std::cout << "destroy\n"; } };
int main() {
    auto a=std::make_shared<Item>();
    auto b=a;
    std::weak_ptr<Item> w=a;
    a.reset();
    std::cout << b.use_count() << '\n';
    b.reset();
    std::cout << (w.lock() ? "alive" : "expired") << '\n';
}
```

C++17 预期依次输出 `1`、`destroy`、`expired`。临时 lock 成功时自身也产生强引用；不能把 use_count 当作并发下的稳定业务判断。

## 追问：为什么会泄漏，为什么还需要锁

若 A 强持有 B，B 又强持有 A，外部句柄释放后两者计数仍不为零；引用计数看不出“这一环已经无人可达”。把非拥有方向改为 weak_ptr 可以打断环，前提是关系本来就不应拥有对方。不同 shared_ptr 句柄共享控制块时计数操作支持相应并发语义，但同时无同步修改同一个 shared_ptr 对象、或修改其指向的 Item，仍需另行同步；“计数安全”不等于“整个对象安全”。

## 选择题

weak_ptr 单独存在时，可以让已经析构的对象重新活过来吗？

A. 可以，lock 自动重新构造

B. 可以，控制块还在就代表对象还在

C. 不可以，lock 返回空 shared_ptr

D. 不可以，因为 weak_ptr 本身也必须立刻销毁

**答案：C。** A/B 混淆元数据与对象，D 错在弱观察者可以比对象活得更久。weak_ptr 不保存对象的可恢复快照。

## 参考

- [C++ 标准草案：智能指针](https://eel.is/c++draft/smartptr)
