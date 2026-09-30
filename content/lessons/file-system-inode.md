---
slug: "file-system-inode"
title: "文件名、inode 与硬链接是什么关系"
description: "用两个路径指向同一 inode 的删除过程，解释名字、元数据、打开句柄和数据寿命。"
subject: "操作系统"
order: 96
minutes: 20
lab: "workbench"
objectives: ["说明目录项和 inode 的不同职责", "跟踪硬链接计数与 unlink 后的文件可见性", "解释无名字但仍被打开的文件为何可继续访问"]
prerequisites: ["file-descriptor"]
---

# 文件名、inode 与硬链接是什么关系

## 路径是查找入口，inode 是文件身份

在典型 Unix/Linux 文件系统里，目录保存“名称 → inode 编号”的关联；inode（Index Node）保存文件类型、权限、所有者、大小、时间戳以及定位数据所需的信息。**文件名不在普通文件的 inode 本身里**。同一个 inode 可被同一文件系统内多个硬链接（Hard Link）名称引用；两个不同文件系统里的 inode 编号即使同为 42，也不表示同一文件。[Linux manual：inode(7)](https://man7.org/linux/man-pages/man7/inode.7.html) · [Linux manual：link(2)](https://man7.org/linux/man-pages/man2/link.2.html)

路径查找还要逐级访问目录，权限和符号链接也会影响结果。本课只用一个目录项映射模型，方便看清“删名字”与“删正在使用的数据”的区别。

## 逐步推演

### 一个名字先指向 inode 42

假设 `/docs/plan.txt → inode 42`，文件内容是 `ABC`，硬链接计数为 1。进程用该路径 `open`，得到 `fd=3`；随后读取依靠已打开的文件对象，而不需要每次都重新按路径查找名称。[Linux manual：open(2)](https://man7.org/linux/man-pages/man2/open.2.html)

### 创建第二个硬链接

在同一文件系统里执行 `link("/docs/plan.txt", "/backup/plan.txt")`。现在两个目录项都指向 inode 42，链接计数为 2；从任一名字读到的都是同一文件内容。改动数据不是复制两份文件。硬链接不同于符号链接：符号链接保存另一个路径作为目标，原路径删除后可能悬空。

### 依次 unlink，观察名字与数据寿命

先对 `/docs/plan.txt` 执行 `unlink`，链接计数变 1；旧路径找不到，但 `/backup/plan.txt` 仍能找到 inode 42。再 unlink 备份路径，链接计数变 0，两条路径都找不到。由于原进程的 `fd=3` 仍打开，它通常还能读取原文件；等最后一个引用它的打开文件对象也关闭，文件系统才可回收数据。这里描述 Unix/Linux 常见语义，不把回收的精确时机推广到所有文件系统实现。[Linux manual：unlink(2)](https://man7.org/linux/man-pages/man2/unlink.2.html)

## inode 不是“文件名 ID”

目录项负责把**名字**连到 inode；硬链接是给同一 inode 多加一个名字；文件描述符是进程打开后的索引，不是 inode 编号。`fd=3` 与 `inode=42` 数字不同毫不奇怪。inode 编号的比较还要结合所在文件系统，不能跨文件系统只比数字。[Linux manual：stat(2)](https://man7.org/linux/man-pages/man2/stat.2.html)

## 面试回答

在 Unix/Linux 典型文件系统中，目录项把名称映射到 inode，inode 保存文件元数据和数据定位信息；一个 inode 可以有多个硬链接名称。`unlink` 删除一个目录项并减少链接计数，不等于立即让所有已打开描述符失效；当不再有名字且不再有打开引用时，空间才可被回收。描述符、路径和 inode 是三种不同层次的对象，不能互相当编号使用。

## 常见误区

- **“硬链接会复制文件内容。”** 它通常增加同一 inode 的名字和链接计数。
- **“unlink 后打开的 fd 立刻失效。”** 已打开引用可继续使用。
- **“inode 编号在整台机器全局唯一。”** 应结合文件系统标识理解。

## 选择题

`/a` 与 `/b` 是同一文件的两个硬链接，进程还持有它的打开 fd。删除 `/a` 后，哪项正确？

- A. `/b` 也立刻消失。
- B. inode 对应数据必立即回收。
- C. `/b` 仍可访问该文件，原 fd 也可继续使用。
- D. `/b` 自动变成符号链接。

**答案：C。** 删除一个目录项不删除另一个硬链接；已有打开引用也不会只因 `/a` 被删就失效。

## 参考资料

- [Linux manual：inode(7)](https://man7.org/linux/man-pages/man7/inode.7.html)
- [Linux manual：link(2)](https://man7.org/linux/man-pages/man2/link.2.html)
- [Linux manual：unlink(2)](https://man7.org/linux/man-pages/man2/unlink.2.html)
