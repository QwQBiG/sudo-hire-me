---
slug: "cpp-vector-invalidation"
title: "vector 修改后哪些迭代器不能再用"
description: "区别扩容、未扩容追加与中间删除，解释 reserve 为什么不等于 iterator 永不失效。"
subject: "C++ 语言机制"
order: 216
minutes: 18
lab: "workbench"
objectives: ["区分 size 与 capacity", "判断不同修改的失效范围", "避免使用旧 end 或悬空引用"]
prerequisites: ["amortized-dynamic-array"]
---

# reserve 不能保证所有旧位置都有效

## 面试回答

std::vector 连续存储元素，size 是有效元素数，capacity 是无须重新分配就能容纳的元素数。追加导致重新分配时，指向原元素的引用、指针与迭代器以及旧 end 都失效；未重新分配的尾部追加保留原元素位置，但旧 end 仍失效。erase 使删除位置及其后的迭代器和引用失效。reserve 预留容量，不创建新元素，也不是一劳永逸的迭代器安全保证。

## 三种修改分开推导

初始 `[10,20,30]`，保存指向 20 的迭代器以及旧 end。

| 操作和前提 | 指向 20 | 指向 10 | 旧 end |
| --- | --- | --- | --- |
| push_back(40)，容量已满 | 失效 | 失效 | 失效 |
| push_back(40)，容量至少 4 | 有效 | 有效 | 失效 |
| erase 第二个元素 | 失效 | 有效 | 失效 |

旧 end 不指向元素，本来就不可解引用；追加后即使它的数值地址恰好等于新元素地址，也不能据此继续使用已失效迭代器。erase 之后原来的 30 搬到第二个位置，位置还存在不等于旧迭代器合法。

### 存储区、元素与句柄分开观察

设原存储区叫 A，第二个元素位于示意位置 A:1。容量已满时追加，需要另一块足够大的存储区 B；元素被移动或复制过去，原存储区被释放。保存的旧迭代器不会自动改为指向 B:1。具体地址、增长倍率、移动还是复制取决于实现和元素类型，图中容量 3 增为 5 只是一种示意。

未重新分配的追加仍在 A 中，10、20、30 的位置保留，因此指向它们的旧迭代器可以继续用；但旧尾后位置 A:3 已失效，即使现在那里恰好存放 40。需要重新调用 `end()`，不能拿旧 end 当成新元素的迭代器。

删除第二个元素时，新序列是 `[10,30]`：A:1 由 20 变成 30。旧的 `begin()+1` 已失效，不能用“地址还在”证明它有效。使用 `erase` 返回的后继迭代器，才是正确的继续访问方式。原来指向 10 的迭代器仍有效。

`capacity` 表示可容纳的元素数量，不表示已经构造了多少元素。size 为 3、capacity 为 5 时，`v[3]`、`v[4]` 都不能作为现有元素读取；访问是否合法先看 size，而不是空位够不够。

## 实验代码

```cpp
#include <iostream>
#include <vector>
int main() {
    std::vector<int> v{10,20,30};
    v.reserve(5);
    auto first=v.begin();
    v.push_back(40);
    std::cout << *first << '\n';
    auto next=v.erase(v.begin()+1);
    std::cout << *next << '\n';
}
```

预期 10、30。reserve 后重新获取 first，再追加；删除时使用 erase 返回的有效后继，不引用旧的被删位置。没有执行 UB 的“失效指针测试”。

## 面试追问

reserve(5) 保证 capacity 恰好 5 吗？只保证不小于请求值；增长倍率也不是标准保证。reserve 不改变 size，之后 `v[4]` 是否合法要看 size>4，而非 capacity>4。遍历时删除应根据 erase 返回值继续，不能一边用旧迭代器递增一边忽略容器修改。容器操作还涉及异常保证，不能凭“连续内存”推出所有操作都不抛异常。

## 选择题

有足够 capacity，push_back 不重新分配，哪项正确？

A. 全部旧迭代器失效

B. 旧 end 不变且仍能安全用作新 end

C. 原元素迭代器保留，旧 end 失效

D. reserve 自动把 size 增加到 capacity

**答案：C。** A 把扩容情况套到未扩容；B 漏掉尾后位置变化；D 混淆容量与元素数。读取旧 end 更不是合法元素访问。

## 参考

- [C++ 标准草案：vector 修改与失效](https://eel.is/c++draft/vector.modifiers)
