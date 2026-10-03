---
slug: "memory-mapped-files"
title: "mmap 共享映射与私有映射写到哪里"
description: "区分虚拟地址映射、页缓存、写时复制与同步写回，说明可见性和持久性并不是同一件事。"
subject: "操作系统"
order: 228
minutes: 20
lab: "workbench"
objectives: ["比较 MAP_SHARED 和 MAP_PRIVATE", "解释按需缺页与写时复制", "区分共享可见性和写回持久性"]
prerequisites: ["copy-on-write", "file-io-buffering"]
---

# 可以像数组访问文件，不代表文件已经全部进内存

## 面试回答

内存映射（Memory Mapping）把文件区域或匿名存储映射到进程虚拟地址空间，访问时按需要建立页映射。Linux 文件 MAP_SHARED 修改可通过共享页向其他相应映射可见，并可写回文件；MAP_PRIVATE 使用写时复制（Copy-on-Write，COW），修改形成私有页，不把这次写入提交到原文件。mmap 成功不保证所有页已驻留，munmap 解除映射也不是保证落盘。共享数据仍需同步协议；写回、文件系统与崩溃持久性需按具体系统调用和存储语义判断。

## 用初始值 10 对照

共享映射写成 11：本进程看到 11，相应共享文件页缓存也被修改；磁盘写回可能稍后发生。私有映射写成 11：本进程私有副本看到 11，原文件内容没有因这次私有修改而变为 11。MAP_PRIVATE 不应理解为创建时完整复制整个文件，也不保证映射后外部文件修改的可见结果是稳定快照。

| 阶段 | 共享映射 | 私有映射 |
| --- | --- | --- |
| 初次读取 | 按需从文件页建立映射 | 同样可能按需 |
| 本进程写入 | 修改共享文件页 | 修改私有 COW 页 |
| 请求写回 | 可用 msync 管理映射写回 | 不把私有改动写入原文件 |
| munmap | 地址映射解除 | 私有修改随映射生命周期结束 |

## 实验代码

```c
#include <sys/mman.h>
#include <stddef.h>
int write_first_byte(int fd, size_t length) {
    if(length==0) return -1;
    unsigned char *p=mmap(NULL,length,PROT_READ|PROT_WRITE,MAP_SHARED,fd,0);
    if(p==MAP_FAILED) return -1;
    p[0]=42;
    int sync_result=msync(p,length,MS_SYNC);
    int unmap_result=munmap(p,length);
    return sync_result==0 && unmap_result==0 ? 0 : -1;
}
```

这是 POSIX/Linux 函数片段，fd 必须可读写，文件区域至少覆盖有效访问范围，不能在访问期间被不协调地截断。调用者仍管理 fd、文件长度和错误诊断；它不是通用持久化库。网页没有真的创建系统 mmap，只展示页状态。

## 面试追问

为什么会 SIGBUS？访问超出实际文件可供映射的区域、文件被截断等可能导致故障，即使虚拟映射地址看起来位于长度范围内。为什么 mmap 不必然更快？它改变数据访问和缺页路径，但仍有页错误、TLB、同步和工作集成本；与 read/write 的比较依赖访问模式与测量。“零拷贝”也必须说明省的是哪一段用户/内核复制，不是数据无需任何传输。

## 选择题

MAP_PRIVATE 中写入后，哪项正确？

A. 修改必定立即写入原文件

B. 修改可形成进程私有 COW 页，不将这次写入提交给原文件

C. 创建映射时必定复制整份文件

D. munmap 保证私有修改写回

**答案：B。** A/D 把共享写回规则误套私有映射，C 忽略按需分页。并发与崩溃持久性仍须单独设计。

## 参考

- [Linux mmap(2)](https://man7.org/linux/man-pages/man2/mmap.2.html)
- [Linux msync(2)](https://man7.org/linux/man-pages/man2/msync.2.html)
