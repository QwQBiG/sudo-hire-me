---
slug: "struct-enum-modeling"
title: "结构体和枚举分别解决什么问题"
description: "用位置与移动方向的 C 小程序，理解把相关字段合成记录、把有限状态命名，并识别非法取值。"
subject: "编程基础与面向对象"
order: 10
minutes: 16
lab: "walkthrough"
objectives: ["区分结构体记录与枚举取值集合", "推导一次方向移动后的字段", "说明枚举不能自动验证外部整数"]
prerequisites: ["pointer-reference-basics"]
---

# 结构体与枚举：把数据的形状说清楚

## 两种不同的建模动作

以下以 C11 为例。结构体（Structure，`struct`）把同时描述一个事物的字段组合成记录，例如点的 `x`、`y`；枚举（Enumeration，`enum`）给一组候选状态命名，例如北、东、南、西。结构体回答“这个值由哪些部分组成”，枚举回答“这个位置在约定中代表哪一类”。它们不是类继承，也不会自动保证业务规则。[ISO C N1570：6.7.2.1 结构体、6.7.2.2 枚举](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)

## 用两个类型表达移动

```c
#include <stdio.h>

enum Direction { NORTH, EAST, SOUTH, WEST };
struct Point { int x; int y; };

static void move(struct Point *p, enum Direction direction) {
    switch (direction) {
        case NORTH: ++p->y; break;
        case EAST:  ++p->x; break;
        case SOUTH: --p->y; break;
        case WEST:  --p->x; break;
        default: break;  /* 不能把未知值当成已知方向 */
    }
}

int main(void) {
    struct Point p = {2, 3};
    move(&p, EAST);
    printf("(%d,%d)\n", p.x, p.y);
}
```

预期输出 `(3,3)`。`Point` 的两个字段共同表示一个坐标，`EAST` 只决定如何修改 `x`；`y` 保持 3。此例坐标远离整数边界，不讨论加减溢出。C 的枚举常量有整数值，枚举类型与某整数类型兼容；不能仅凭 `enum` 声明就断言来自外部的整数一定对应某个合法方向，也不能断言枚举对象总占 4 字节。[ISO C N1570：枚举表示](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)

## 逐步推演

### 建立一条记录

`p={2,3}` 令 `p.x=2`、`p.y=3`。字段名使两个整数的含义不再依赖调用者记忆参数顺序。

### 选择候选状态

调用 `move(&p,EAST)`；`switch` 命中 `EAST`，只执行 `++p->x`。

### 计算新值

`x:2→3`，`y:3→3`，所以打印 `(3,3)`。`move` 通过指针修改调用者的原记录。

### 检查未知输入

若外部输入整数转成 `Direction` 却不对应四个命名状态，`default` 不做移动；真实 API 更应明确返回错误，而不是默默接受未知方向。

## 面试回答

结构体把同一实体的相关字段组织成一个记录；枚举为有限候选状态命名，使分支意图比裸整数清楚。两者解决的问题不同，可以组合使用。C 的 `enum` 不等于运行时自动校验，外部数据仍应检查；结构体的大小可能有填充，枚举表示也受实现约束，不能把它们的内存布局当跨平台协议。

## 选择题

示例里 `p={2,3}`，调用 `move(&p,EAST)` 后 `p` 是什么？

- A. `(2,4)`
- B. `(3,3)`
- C. `(2,3)`
- D. `(3,4)`

**答案：B。** `EAST` 只增加 `x`；A 当成北，C 忽略指针修改，D 同时错误修改两个字段。

## 参考资料

- [ISO C N1570：结构体与枚举类型](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)
