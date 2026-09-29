---
slug: "linked-list-reversal"
title: "单链表反转的三根指针"
subject: "数据结构与算法"
description: "亲手把 next 链接逐个改向，理解为何必须先保存后继以及新头在哪里。"
order: 69
minutes: 18
lab: "linked-reversal"
objectives: ["说明 prev、curr、next 的职责", "逐轮重连四节点链表", "处理空链表与单节点边界"]
prerequisites: ["array-linked-list", "pointer-reference-basics"]
---

# 单链表反转的三根指针

## 要反转的是链接，不是值

单链表（Singly Linked List）`head → A → B → C → D → null` 要变成 `head → D → C → B → A → null`。可以把节点值抄到数组再倒着写回，但那改变的是值，并没有反转节点之间的 `next` 关系；如果外部还持有节点引用，语义可能不同。本课要求**原地重连节点**，不新建节点。

准备三根指针：`prev` 指向已反转部分的头，`curr` 指向当前节点，`saved` 暂存当前节点原来的后继。起初 `prev=null`、`curr=A`。每轮必须按顺序做三件事：

1. `saved = curr.next`：保存还未处理的链。
2. `curr.next = prev`：把当前节点接到已反转部分前端。
3. `prev = curr; curr = saved`：推进到下一个原节点。

若先执行第 2 步，再去找原来的 `curr.next`，后继已经被覆盖，B、C、D 可能再也找不到。尾节点 D 的 `saved` 是 `null`，第三步后 `curr=null`，循环结束；此时 `prev=D` 才是**新头**，旧 `head=A` 已成为尾部。

## 四轮状态核对

| 处理节点 | 改写后的链接 | 处理完的 prev | 下一个 curr | 已反转部分 |
| --- | --- | --- | --- | --- |
| A | `A.next=null` | A | B | `A→null` |
| B | `B.next=A` | B | C | `B→A→null` |
| C | `C.next=B` | C | D | `C→B→A→null` |
| D | `D.next=C` | D | null | `D→C→B→A→null` |

循环不变量是：`prev` 是已反转前缀的头，`curr` 是尚未处理后缀的首节点；两部分的所有原节点都还在，且不重复。`saved` 在改写 `next` 的瞬间保住后缀入口。实验把“保存、重连、推进”拆成三个按钮，可观察每次的实际链接变化。

## 面试回答

反转无环单链表时，维护 `prev=null` 与 `curr=head`；每轮先保存 `curr.next`，再令 `curr.next=prev`，最后同时推进 `prev` 和 `curr`。当 `curr` 到 `null`，`prev` 就是新头。每个节点处理一次，时间 `O(n)`、额外空间 `O(1)`。空链表返回 `null`，单节点反转后仍是自身；若输入可能有环，应先处理环，否则普通循环不会正常结束。

## 多语言示例

两段程序都创建四个独立节点 A、B、C、D，反转后预期输出 `D C B A`。它们修改原节点的 `next`，不把节点值复制到另一组节点。

### C++

```cpp
#include <iostream>

struct Node { char value; Node* next = nullptr; };

Node* reverse(Node* head) {
    Node* prev = nullptr;
    Node* curr = head;
    while (curr != nullptr) {
        Node* saved = curr->next;
        curr->next = prev;
        prev = curr;
        curr = saved;
    }
    return prev;
}

int main() {
    Node a{'A'}, b{'B'}, c{'C'}, d{'D'};
    a.next = &b; b.next = &c; c.next = &d;
    for (Node* p = reverse(&a); p != nullptr; p = p->next)
        std::cout << p->value << ' ';
    std::cout << '\n';
}
```

### Python 3

```python
class Node:
    def __init__(self, value, next_node=None):
        self.value = value
        self.next = next_node

def reverse(head):
    prev, curr = None, head
    while curr is not None:
        saved = curr.next
        curr.next = prev
        prev, curr = curr, saved
    return prev

head = Node('A', Node('B', Node('C', Node('D'))))
head = reverse(head)
while head is not None:
    print(head.value, end=' ')
    head = head.next
print()
```

Python 的 `prev, curr = curr, saved` 是一次并行赋值；必须先把原后继放进 `saved`。C++ 版用栈上节点只是简短示例，函数本身同样适用于生命周期有效的动态分配节点。

## 边界与错误反例

- **空链表**：`curr` 一开始就是 `null`，循环不执行，返回 `null`。
- **单节点**：先存 `null`，再让它的 `next` 指向 `null`，返回同一节点。
- **忘记改 head**：原 A 仍被当作入口时只会看到 `A→null`；调用方必须接收函数返回的新头。
- **先重连后保存**：覆盖了原后继，剩余节点失联。这个错误通常不会在编译期报错。

## 选择题

处理 A 时，若先令 `A.next=prev`，然后才想执行 `saved=A.next`，会发生什么？

- A. saved 得到 B，仍能继续处理
- B. saved 得到 null，原来的 B 入口被覆盖
- C. A 会自动变成新头 D
- D. 链表会立即被排序

**答案：B。** 初始 `prev=null`，先改写会使 `A.next=null`；再读取只能得到 null，后续 B、C、D 无法从当前指针继续访问。

## 参考资料

- [LeetCode 206：Reverse Linked List 的原地反转问题](https://leetcode.com/problems/reverse-linked-list/description/)
