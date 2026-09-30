---
slug: "mutex-vs-semaphore"
title: "互斥锁和信号量分别解决什么问题"
description: "以单个临界区和三个数据库连接名额为例，辨别所有权、许可计数及等待条件。"
subject: "操作系统"
order: 89
minutes: 18
lab: "workbench"
objectives: ["说出互斥锁与计数信号量各自维护的状态", "用三个资源名额推演 wait/post", "识别二值信号量不等同于互斥锁的边界"]
prerequisites: ["synchronization"]
---

# 互斥锁和信号量分别解决什么问题

## 先问“限制多少人”，再问“谁来释放”

并发写一个共享计数器时，需要同一时刻最多一个执行者进入临界区，可以用**互斥锁**（Mutual Exclusion Lock，Mutex）：线程取得锁、操作共享数据、由持有者解锁。以 POSIX 线程（Portable Operating System Interface Threads，Pthreads）为例，对普通互斥锁由非持有线程解锁不属于正确用法；具体错误处理随锁类型而变。[POSIX：pthread_mutex_lock](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html)

如果数据库连接池只有 3 个可用连接，目标是“同时最多 3 个使用者”，不是“只能 1 人进入”。**计数信号量**（Counting Semaphore）以计数 3 开始；成功的 `sem_wait` 取得一个许可并使计数减 1，`sem_post` 归还许可并使计数加 1。计数为 0 时新的获取者等待；这不是记录哪个线程持有某个具体连接的对象。资源与许可的一一对应、异常路径归还都仍需程序维护。[Linux manual：sem_wait(3)](https://man7.org/linux/man-pages/man3/sem_wait.3.html)

## 逐步推演

### 三个连接名额先全部空闲

信号量初值 `S=3`。线程 A、B、C 依次成功执行 `sem_wait(S)` 后，计数按 `3→2→1→0` 变化；三人可同时使用各自从连接池取得的连接。这里的数字是**剩余许可数**，不是已完成请求数。

### 第四位使用者到来

线程 D 执行 `sem_wait(S)` 时计数为 0，因此等待。D 等的不是“前面三个人全部结束”，而是有任意一个许可可用。若本例误用单个互斥锁来守住整个连接使用过程，最多只能一个人用连接，白白浪费另外两个名额。

### B 归还许可，D 才能取得

B 先归还其连接，再执行 `sem_post(S)`，一个许可可使等待中的 D 继续；若无等待者，计数可从 0 变 1。实际调度并不保证 D 在 B 之后立即获得 CPU，也不保证多个等待者严格先来先服务。若 B 忘记 `post`，许可泄漏会使可用容量逐渐减少。

## 二值信号量是不是互斥锁

初值为 1 的二值信号量（Binary Semaphore）也能把同时进入者限制为 1，但**容量效果相似不等于语义相同**。互斥锁通常强调“持有者负责释放”；信号量的 `post` 与 `wait` 没有同样的持有者绑定，常用于资源计数或线程间事件通知。若不同线程替别人 `post`，可能把许可数增到预期上限之外；采用什么机制取决于所需语义，不能仅凭“都是 0/1”替换。[POSIX：sem_post](https://man7.org/linux/man-pages/man3/sem_post.3.html)

这课的许可例子**不是**让计数信号量代替保护连接池内部链表的锁：管理连接对象的共享结构仍可能需要单独同步。

## 面试回答

互斥锁用于保护需要排他访问的临界区，取得锁的执行者在完成操作后释放；计数信号量维护可用许可数，适合限制同时使用 N 个资源，`wait` 获取、`post` 归还，计数为 0 时等待。初值为 1 的信号量可以产生互斥效果，但它不天然具备互斥锁的所有权语义；选型要同时看容量和释放责任。

## 常见误区

- **“信号量值为 0 就表示死锁。”** 可能只是 3 个资源都在使用，稍后会归还。
- **“有信号量就不用维护资源本身。”** 许可计数不能自动选出、关闭或回收某个数据库连接。
- **“`post` 一执行等待线程就已经运行。”** 唤醒后仍需调度。

## 选择题

一个连接池最多允许 3 个请求同时持有连接，哪种初始化最符合容量限制？

- A. 单个互斥锁，使用连接的全过程都持有它。
- B. 初值为 3 的计数信号量，取得连接前 `wait`，归还后 `post`。
- C. 初值为 0 的计数信号量，取得连接前 `wait`。
- D. 让每个请求各自创建一个互斥锁。

**答案：B。** 三个许可对应三个并发名额；A 只允许一个，C 初始没有许可，D 的锁彼此独立，限制不了总量。

## 参考资料

- [POSIX：pthread_mutex_lock](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html)
- [Linux manual：sem_wait(3)](https://man7.org/linux/man-pages/man3/sem_wait.3.html)
- [Linux manual：sem_post(3)](https://man7.org/linux/man-pages/man3/sem_post.3.html)
