---
slug: "array-bounds-slices"
title: "数组边界与切片区间"
description: "在 Python 3 的半开区间里逐个取值，并对照 C、Java、Rust 的越界处理差异。"
subject: "编程基础与面向对象"
order: 8
minutes: 18
lab: "walkthrough"
objectives: ["计算半开切片区间", "区分单元素越界与切片边界裁剪", "说明不同语言的越界语义"]
prerequisites: ["function-arguments"]
---

# 下标和切片：终点取不取

## 先固定 Python 3 语义

给定 `a = [10, 20, 30, 40, 50]`，长度为 5，合法的非负**单元素下标**是 `0..4`。切片 `a[start:stop]` 在步长为正的常见情形下取半开区间（Half-Open Interval）`[start, stop)`：包含 `start`，不包含 `stop`。下标访问和切片的越界处理并不完全一样；本课先按 Python 3 演算，再明确其他语言差异。[Python 官方文档：序列切片](https://docs.python.org/3/library/stdtypes.html#common-sequence-operations)

## 逐步推演

### 第一步：给每个元素标下标

| 下标 | 0 | 1 | 2 | 3 | 4 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 值 | 10 | 20 | 30 | 40 | 50 |

`a[0]` 是 10，`a[4]` 是 50；`a[5]` 不是第六个元素，而是越过末尾，Python 抛 `IndexError`。负下标可从末尾数，`a[-1]` 是 50；这是 Python 序列规则，不可直接套用到 C 原生数组。

### 第二步：算普通半开切片

`a[1:4]` 选下标 1、2、3，不选 4，所以得到 `[20, 30, 40]`，长度是 `4-1=3`。空区间 `a[2:2]` 得到 `[]`，因为没有任何下标同时满足 `2 <= i < 2`。

```text
原数组下标：0  1  2  3  4
选中范围：     [1  2  3) 4
结果：           20 30 40
```

### 第三步：加入步长和超出末尾的 stop

`a[1:5:2]` 从下标 1 开始每次加 2，取下标 1、3，得到 `[20, 40]`。`a[3:99]` 的右边界在本例被裁剪到序列末尾，结果 `[40, 50]`；但 `a[99]` 作为**单元素访问**仍抛 `IndexError`。不能把切片裁剪规则误用到直接索引。

### 第四步：换语言前先换规则

| 语言与操作 | `5` 越过五元素数组末尾时 |
| --- | --- |
| Python 3 `a[5]` | 抛 `IndexError`；`a[3:99]` 可裁剪 |
| Java `array[5]` | 抛数组下标越界异常 |
| Rust `slice[5]` | 在正常安全索引语义下发生 panic；可用 `get(5)` 得到 `None` |
| C `a[5]` | 对五元素数组越界访问，不能依赖固定结果 |

“切片”也不是所有语言都复制数据：Python 列表切片构造新列表；Rust `&slice[start..end]` 是借用原数据的一段视图，且范围检查规则与 Python 不同。[Rust 标准库：slice `get`](https://doc.rust-lang.org/std/primitive.slice.html#method.get)、[Java 语言规范：数组访问](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.10.4)

## 面试回答

先说明语言与索引起点。Python 3 列表从 0 开始，`a[start:stop]` 常见正步长切片是左闭右开，`a[1:4]` 对五元素示例取下标 1、2、3；单元素 `a[5]` 抛错，而切片 `a[3:99]` 可裁剪到末尾。C 原生数组越界不能当成返回空值，Java 会抛越界异常，Rust 安全索引会 panic、`get` 可用 `Option` 表示缺失。回答“切片会不会复制”也要先明确语言和容器类型。

## 常见错误

- **“切片终点 4 也会取进来。”** 本课 Python 切片终点不包含。
- **“`a[5]` 和 `a[3:99]` 都会自动裁剪。”** Python 只对这里的切片边界做裁剪，直接索引会抛错。
- **“C 越界读取一定得到 0 或报错。”** 不能给未定义的越界访问指定固定表现。
- **“所有语言切片都会复制数组元素。”** Rust 借用切片通常是视图，Python 列表切片创建新外层列表。

## 选择题

Python 3 中 `a=[10,20,30,40,50]`，`a[1:5:2]` 得到什么？

- A. `[20, 30, 40, 50]`
- B. `[20, 40]`
- C. `[10, 30, 50]`
- D. 抛 `IndexError`，因为 stop 是 5

**答案：B。** 从下标 1 开始、未到 5、每次加 2，取下标 1 和 3。A 忽略步长，C 从 0 开始，D 把合法切片终点误当单元素访问。

## 参考资料

- [Python 官方文档：序列操作与切片](https://docs.python.org/3/library/stdtypes.html#common-sequence-operations)
- [Rust 标准库：slice 的安全访问与 `get`](https://doc.rust-lang.org/std/primitive.slice.html#method.get)
- [Java 语言规范：数组下标访问](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.10.4)
- [ISO C N1570：数组与指针边界](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)
