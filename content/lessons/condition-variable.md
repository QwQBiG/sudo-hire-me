---
slug: "condition-variable"
title: "条件变量为什么要配合 while 检查"
description: "用一个空队列和两个消费者，理解 wait 的释放再加锁、虚假唤醒与条件竞争。"
subject: "操作系统"
order: 90
minutes: 19
lab: "workbench"
objectives: ["解释条件变量等待的是共享谓词而非通知次数", "说明 wait 如何与互斥锁配合", "推演为何醒来后必须重新检查条件"]
prerequisites: ["synchronization", "mutex-vs-semaphore"]
---

# 条件变量为什么要配合 while 检查

## 锁保护状态，条件变量等待变化

一个生产者往队列放任务、两个消费者取任务。互斥锁（Mutex）保护队列的共享状态；**条件变量**（Condition Variable）让消费者在“队列非空”这个条件不成立时睡眠，而不是占着 CPU 循环查看。真正要等待的是谓词 `queue.empty() == false`，条件变量发出的通知只是在提醒“条件**可能**变化了”，不是发放一张确保可取任务的凭证。[POSIX：pthread_cond_wait](https://man7.org/linux/man-pages/man3/pthread_cond_wait.3p.html)

消费者的关键结构如下（伪代码）：

```text
lock(m)
while queue.empty():
    wait(cv, m)       // 原子地释放 m 并睡眠；返回前重新取得 m
item = queue.pop()
unlock(m)
process(item)
```

`wait` 的“释放锁并开始等待”必须与条件检查配合原子化，否则生产者可能恰在消费者检查为空后、真正睡眠前送来通知，造成消费者错过已经可用的数据。返回时已经重新拿到锁，才能安全复查队列。具体 API 可能有超时、取消或错误等额外返回路径；示例只讨论正常等待。[POSIX：Condition Wait Semantics](https://man7.org/linux/man-pages/man3/pthread_cond_wait.3p.html)

## 逐步推演

### C1、C2 看到队列为空

两名消费者分别在持锁时检查 `queue.empty()`，都发现为真。它们执行 `wait(cv,m)` 后释放锁并等待。此时没有消费者占着锁不放，生产者才有机会修改队列。

### 生产者加入一个任务并通知

生产者取得锁，放入任务 X，发送通知并释放锁。一个消费者可能被唤醒；通知与队列里的任务并不是一一绑定，且通知本身不保存“未消费次数”。如果生产者在消费者等待之前已放入 X，消费者后来的 `while` 会直接看到非空，无须依赖历史通知。

### 醒来后仍然先检查队列

设 C1 被唤醒后尚未重新取得锁，C2 因其他通知或调度先取得锁并取走 X。C1 后来取得锁时队列又空了；`while` 让它继续等待，而 `if` 会让它越过检查，对空队列执行 `pop`。即使只有一个消费者，POSIX 也允许**虚假唤醒**（Spurious Wakeup），所以仍需循环复查。[POSIX：Spurious Wakeups](https://man7.org/linux/man-pages/man3/pthread_cond_wait.3p.html)

## 不是把 signal 当成数据

生产者应先修改受锁保护的共享状态，再通知等待者；消费者应先检查状态，再决定是否等待。通知只是促使重新判断。若把 `signal` 当成一个可累加的任务数，就会混淆条件变量与计数信号量；若把 `wait` 写在持锁但无循环复查的位置，又可能在条件不成立时继续执行。

## 面试回答

条件变量用于等待某个共享状态满足条件，通常与互斥锁配合。线程持锁检查条件；不满足时 `wait` 原子地释放锁并等待，返回前重新持锁。醒来只表示应该重新判断，不保证条件为真，因为可能虚假唤醒，也可能被其他线程先改变状态。因此惯用 `while (!predicate) wait(...)`，而不是 `if`。

## 常见误区

- **“通知积累起来，以后 wait 可以消费。”** 条件变量不保存通知数量，必须检查共享谓词。
- **“被唤醒立即拥有任务。”** 先重新取得锁、检查条件，才可能安全取任务。
- **“持锁睡眠也没关系。”** 不释放锁会让需要修改条件的生产者难以前进。

## 选择题

消费者从 `wait(cv,m)` 返回并已重新取得锁，下一步最合适的动作是什么？

- A. 不检查队列，直接取元素。
- B. 重新检查“队列非空”，为空就继续等待。
- C. 先释放锁，然后无锁读队列长度。
- D. 假定一次通知恰好对应一个归它所有的元素。

**答案：B。** 唤醒不保证谓词仍为真；A、D 忽略竞争和虚假唤醒，C 又让队列检查脱离保护。

## 参考资料

- [POSIX：pthread_cond_wait](https://man7.org/linux/man-pages/man3/pthread_cond_wait.3p.html)
- [OSTEP：Condition Variables](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-cv.pdf)
