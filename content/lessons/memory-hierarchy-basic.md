---
slug: "memory-hierarchy-basic"
title: "寄存器、缓存、主存与外存"
description: "跟踪一个文件字节从持久存储到 CPU 运算的路径，分清容量、速度与是否断电保留。"
subject: "计算机基础"
order: 38
minutes: 18
lab: "walkthrough"
objectives: ["说出常见存储层次各自职责", "区分 CPU 缓存缺失与磁盘 I/O", "区分易失主存和持久存储"]
prerequisites: ["cpu-execution", "cache-locality"]
---

# 一个文件字节怎样到 CPU 手里

## 层次解决的是不同权衡

存储层次（Memory Hierarchy）把容量、访问延迟、成本及持久性不同的部件组合起来。寄存器（Register）紧邻处理器运算部件、数量少；一级、二级等高速缓存（Cache）保存部分近期使用的数据；主存通常是动态随机存取存储器（Dynamic Random-Access Memory，DRAM）；固态硬盘（Solid-State Drive，SSD）等外存提供持久保存。这个顺序是理解常见系统的概念地图，不是“每次读一个变量都必定依次访问每一层”。[MIT Computation Structures：内存层次](https://computationstructures.org/lectures/caches/caches.html)

前面的“缓存与局部性”课已经算过缓存行命中率；本课改问：**同一个文件字节在磁盘、内存、CPU 缓存和寄存器之间分别扮演什么角色**，尤其不能把 L1 缺失直接说成读磁盘。

## 逐步推演

### 第一步：文件静置时在持久存储

假设文件 `note.txt` 的一个字节内容为 `A`，文件位于 SSD。SSD 在正常断电后可保留已持久化的数据；CPU 不能把 SSD 上的某个字节当成普通寄存器操作数直接做加法。软件要经过文件系统与操作系统接口取得它，具体 I/O 路径可能有缓存、设备队列和控制器等环节。

### 第二步：读文件时可能进入主存页缓存

在典型 Linux 常规文件读取路径，内核页缓存（Page Cache）可能保存文件内容。首次需要的页未在页缓存时，可能要从底层存储获取；后续读取若页仍在缓存，可能由 DRAM 满足，而不再发生同样的设备读取。`O_DIRECT` 等路径可绕过通常的页缓存，所以不能把这段话写成所有操作系统、所有 I/O 的绝对规则。[Linux 内核文档：Page Cache](https://docs.kernel.org/mm/page_cache.html)

### 第三步：CPU 使用内存中的数据

应用读取到的字节位于可访问的内存数据中，CPU 执行加载指令时，可能先由某一级 CPU 缓存命中；若观察的 L1 缺失，仍可能在 L2/L3 命中，或从 DRAM 获取。运算时指令在寄存器中使用值。这里的“缓存”有两层不同对象：**内核页缓存**是文件内容在内存里的缓存；**CPU 高速缓存**是处理器附近保存的内存数据副本，不能把它们当同一个数据结构。

```text
SSD 上的文件 →（必要时 I/O）→ DRAM 中的页缓存/应用数据
                                     ↓
                             CPU 缓存 → 寄存器 → 运算
```

箭头是本例可能的数据路径，不代表每次都发生 SSD 读取，也不说明操作系统必须额外复制一份应用数据；例如内存映射文件有不同的数据访问方式。

### 第四步：分清“写进内存”和“已经持久化”

程序更新内存里的一个值不等于 SSD 文件已更新。即使某次文件写入调用完成，具体数据何时落到稳定存储还受页缓存写回与持久化接口约束。需要断电后可靠保留时，要理解文件系统提供的刷新和同步语义，而不是认为 CPU 缓存或 DRAM 天然持久。[Linux 内核文档：页缓存与写回](https://docs.kernel.org/mm/page_cache.html)

## 面试回答

寄存器、CPU 缓存、DRAM 主存和 SSD 等外存形成速度、容量、成本与持久性的层次。寄存器直接服务运算，CPU 缓存保存部分内存数据，DRAM 保存运行期工作集，SSD 等用于持久文件。L1 缺失不等于磁盘 I/O，它可能由 L2、L3 或 DRAM 满足；文件读取也可能被操作系统页缓存满足。页缓存与 CPU 缓存处于不同层次，内存写入也不自动等于数据已持久化。

## 两个必须分开的“快”

缓存可能降低**平均**访问成本，但不能据“某个值在缓存里”断言整个程序一定快；计算、分支、锁竞争、I/O 等也可能占主要时间。SSD 相比 DRAM 的主要优势不是 CPU 直接访问延迟，而是容量与断电后保存数据；并非所有 SSD 一定比所有机械盘在每种负载下都快。讨论性能必须给具体设备、负载和测量条件。[Intel 优化手册：缓存与内存子系统](https://cdrdv2-public.intel.com/671488/248966-Software-Optimization-Manual-V1-048.pdf)

## 常见错误

- **“L1 缺失就读 SSD。”** 可能在更下一级 CPU 缓存或 DRAM 找到。
- **“Linux 页缓存就是 CPU L1 缓存。”** 前者由内核管理文件页，后者是处理器附近的硬件缓存。
- **“RAM 断电后自然保留刚写的内容。”** 普通 DRAM 是易失存储。
- **“调用 write 返回就等价于所有数据已稳定落盘。”** 持久化需要按具体系统接口契约判断。

## 选择题

某次处理器数据访问在 L1 缓存未命中。以下哪项最准确？

- A. 必然立刻访问 SSD
- B. 数据已永久丢失
- C. 可能由更下一级 CPU 缓存或 DRAM 满足
- D. 说明文件不存在

**答案：C。** L1 只是观察的第一层，缺失不等于整个层次均缺失。A 跳过其他层，B、D 把普通缓存缺失误解为数据错误。

## 参考资料

- [MIT Computation Structures：内存层次与缓存](https://computationstructures.org/lectures/caches/caches.html)
- [Linux 内核文档：Page Cache](https://docs.kernel.org/mm/page_cache.html)
- [Intel 优化手册：缓存与内存子系统](https://cdrdv2-public.intel.com/671488/248966-Software-Optimization-Manual-V1-048.pdf)
