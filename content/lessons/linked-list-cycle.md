---
slug: "linked-list-cycle"
title: "快慢指针判环与找入口"
subject: "数据结构与算法"
description: "观察一快一慢两根指针的相遇，并推导为什么重置一根指针后能找到入环节点。"
order: 70
minutes: 22
lab: "floyd-cycle"
objectives: ["用节点身份判断链表是否成环", "逐轮手算快慢指针的位置", "解释相遇点不一定等于入环点"]
prerequisites: ["array-linked-list", "two-pointers-basic"]
---

# 快慢指针判环与找入口

## 链表里的环是什么

若沿 `next` 不断走，最终又回到已经经过的**同一个节点对象**，链表就有环（Cycle）。本课用 `A→B→C→D→E→C`：从头 A 走两步到 C，之后沿 `C→D→E→C` 循环。即使两个节点的值相同，也不能仅凭“值相等”说它们是同一个节点；应比较节点身份或指针地址。

Floyd 快慢指针算法（Floyd's Cycle-Finding Algorithm）让慢指针每轮走 1 条边，快指针每轮走 2 条边。两者都从头开始，但**初始指向相同并不代表检测到了环**，要先移动再检查。若快指针或它的下一节点为 `null`，无法再走两步，说明从头到尾没有环。

## 三轮相遇，再两轮找入口

| 阶段 | 慢指针 | 快指针 | 解释 |
| --- | --- | --- | --- |
| 初始 | A | A | 尚未移动，不算相遇 |
| 检测第 1 轮 | B | C | 快走 A→B→C |
| 检测第 2 轮 | C | E | 快走 C→D→E |
| 检测第 3 轮 | D | D | 两指针相遇，**D 不是入口** |
| 重置一根到 A | A | D | 另一根留在相遇点 |
| 同速第 1 轮 | B | E | 两根都只走一步 |
| 同速第 2 轮 | C | C | 在入口 C 相遇 |

无环预设 `A→B→C→D→E→null` 中，检测两轮后慢指针在 C、快指针在 E；下一轮开始前发现 E 的后继为 null，算法停止并返回“无环”。一节点自环 `A.next=A` 则第一轮移动后相遇于 A，入口就是 A。

## 为什么必然追上，又能回到入口

两根指针进入环后，快指针相对慢指针每轮多走 1 条边。设环长为 `λ`，相对距离按模 `λ` 每轮加 1，最多绕 `λ` 种余数，必会出现相同节点。

找入口的理由可以用距离算清：设从头到入口需 `μ` 步，入口到首次相遇点沿环需 `b` 步。慢指针到相遇点总走了 `t=μ+b+kλ` 步，快指针走 `2t` 步；两者在环同一点意味着相差的 `t` 是环长的整数倍，所以 `μ+b≡0 (mod λ)`。把一根指针放回头，让两边各走 `μ` 步：头侧到入口；相遇点侧从偏移 `b` 再走 `μ`，也回到入口。本例 `μ=2, λ=3, b=1`，刚好 `2+1=3`。

## 面试回答

用快慢指针判单链表是否有环：两指针从头出发，慢每轮走一步、快走两步；每轮先确认快指针可走两步，再移动并比较节点身份。快指针到 null 则无环，相遇则有环。找入口时把一根指针重置到头，另一根留在相遇点，两者同速一步步走，再次相遇处就是入口。时间 `O(μ+λ)`，也常记 `O(n)`，额外空间 `O(1)`；首次相遇点不一定是入口。

## 多语言示例

两段程序都构造 `A→B→C→D→E→C`，预期输出入口 `C`。函数返回的是节点引用，而不是节点值；若无环则返回空引用。

### C++

```cpp
#include <iostream>

struct Node { char name; Node* next = nullptr; };

Node* cycleEntry(Node* head) {
    Node* slow = head;
    Node* fast = head;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) {
            Node* seeker = head;
            while (seeker != slow) {
                seeker = seeker->next;
                slow = slow->next;
            }
            return seeker;
        }
    }
    return nullptr;
}

int main() {
    Node a{'A'}, b{'B'}, c{'C'}, d{'D'}, e{'E'};
    a.next=&b; b.next=&c; c.next=&d; d.next=&e; e.next=&c;
    Node* entry = cycleEntry(&a);
    std::cout << (entry ? entry->name : '-') << '\n';
}
```

### Python 3

```python
class Node:
    def __init__(self, name):
        self.name = name
        self.next = None

def cycle_entry(head):
    slow = fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            seeker = head
            while seeker is not slow:
                seeker = seeker.next
                slow = slow.next
            return seeker
    return None

a, b, c, d, e = (Node(name) for name in 'ABCDE')
a.next, b.next, c.next, d.next, e.next = b, c, d, e, c
entry = cycle_entry(a)
print(entry.name if entry else 'none')  # C
```

Python 用 `is` 比较身份，不用可能重载的 `==`。C++ 的 `Node*` 比较也是节点地址比较；不能只比较 `name`。

## 易错边界

- **空链表或无环尾部**：快指针无法再走两步时返回空，不能访问空引用的 `next`。
- **把初始重合算作有环**：任意非空链表的两根指针都从 head 出发，必须先移动。
- **拿相遇点直接当入口**：本例相遇于 D、入口为 C。
- **保存经过的节点值去重**：不同节点可能有相同值；按身份保存才有意义，但会额外使用 `O(n)` 空间。

## 选择题

对 `A→B→C→D→E→C`，快慢指针首次相遇在 D。要找入口，下一步应怎么做？

- A. 直接返回 D
- B. 把一根指针重置到 A，另一根留在 D，之后都每轮走一步
- C. 两根都重置到 A，再让快指针走两步
- D. 比较 C 与 D 的节点值谁更小

**答案：B。** 从 A 和 D 同速走两轮会同时到 C。A 把相遇点误作入口；C 只是重新做一遍检测；D 与链表结构无关。

## 参考资料

- [cp-algorithms：Floyd 判环与入口证明](https://cp-algorithms.com/others/tortoise_and_hare.html)
- [LeetCode 141：链表环的问题定义](https://leetcode.com/problems/linked-list-cycle/description/)
