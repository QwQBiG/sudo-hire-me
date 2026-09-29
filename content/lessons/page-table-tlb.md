---
slug: "page-table-tlb"
title: "页表和 TLB 各负责什么"
description: "用两项 TLB 的连续访问手算命中、未命中、页表查询和物理地址。"
subject: "操作系统"
order: 93
minutes: 22
lab: "tlb"
objectives: ["将虚拟地址拆成页号和偏移", "区分 TLB 未命中、缺页与非法地址", "追踪两项 TLB 的 LRU 替换"]
prerequisites: ["virtual-memory", "cache-locality"]
---

# 页表和 TLB 各负责什么

## 页表给答案，TLB 缓存最近用过的答案

虚拟地址由虚拟页号（Virtual Page Number，VPN）与页内偏移组成。页表（Page Table）记录当前地址空间中虚拟页到物理页框（Physical Frame Number，PFN）的映射及权限等信息；转译后偏移不变。地址转换后备缓冲器（Translation Lookaside Buffer，TLB）是地址转换的高速缓存，保存一部分最近使用的 VPN→PFN 结果。TLB 命中可快速得到页框；TLB 未命中要依据页表或其他系统机制取得映射，但**不自动表示目标页不在内存**。[OSTEP：Paging: Faster Translations](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-tlbs.pdf)

本课用页大小 `256 B`、两项全相联 TLB 和最近最少使用（Least Recently Used，LRU）替换；这只是手算模型，真实硬件的容量、替换策略、页表遍历方式与地址空间标识均可能不同。

## 一串访问怎样追踪

设页表里 `页0→框5`、`页1→框2`、`页2→框7`，三页都在内存。地址 `12` 拆为 `VPN=0, offset=12`，TLB 初始为空：未命中，查页表得框5，物理地址 `5×256+12=1292`，缓存页0映射。地址 `268` 是 `VPN=1, offset=12`，再次未命中，缓存页1映射。再访问地址 `15`，VPN仍为0，**TLB 命中**，物理地址 `5×256+15=1295`。[OSTEP：TLB Basic Algorithm](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-tlbs.pdf)

此时按 LRU 从旧到新是 `[页1, 页0]`。访问地址 `524`，VPN为2，TLB未命中；查页表得到框7，替换最久没用的页1，顺序变为 `[页0, 页2]`。再访问 `12` 会命中页0。实验允许按这些地址逐次访问，显示每次缓存顺序和命中记录。

## 未命中、缺页、越界是三个判断

如果访问另一个**合法但未驻留**的页3，TLB当然查不到，页表还会发现该页尚未在内存，产生需要操作系统处理的缺页（Page Fault）；如果页4根本不属于这个地址空间，则是非法访问。反过来，页0首次 TLB 未命中，却已经在物理内存中，不发生缺页。有效性和权限检查仍不能因“缓存命中”而省略；具体硬件如何执行检查依体系结构。[OSTEP：TLB Miss Versus Page Fault](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-tlbs.pdf)

## 面试回答

页表是地址空间映射与权限信息的依据；TLB 缓存部分地址转换结果，加速从虚拟页号找到物理页框。访问先查 TLB，命中时取得页框并保留页内偏移；未命中再查询页表或触发相应处理。TLB 未命中不等于缺页：页已驻留而映射不在 TLB 也会未命中。缺页说明合法页当前不在内存，非法地址又是另一种情况。

## 常见误区

- **“TLB 没有记录就得去磁盘。”** 页表可能直接指出页已驻留。
- **“TLB 缓存整页内容。”** 它主要缓存地址转换，而非文件或用户数据本身。
- **“替换 TLB 项就是把物理页换出内存。”** 只丢失一条缓存映射，不等于页面置换。

## 选择题

页0已驻留在物理框5，但 TLB 初始为空。第一次访问页0的地址时，最准确的结果是？

- A. TLB 未命中，查询映射后可访问，不必因此发生缺页。
- B. TLB 未命中必然触发从磁盘载入页0。
- C. TLB 命中，因为页已在物理内存。
- D. 地址一定非法。

**答案：A。** TLB 是映射缓存；页已驻留时，缓存未命中仍可由页表获得映射。B、C 把 TLB 状态与驻留状态混为一谈。

## 参考资料

- [OSTEP：Paging: Faster Translations (TLBs)](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-tlbs.pdf)
- [OSTEP：Paging: Introduction](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf)
