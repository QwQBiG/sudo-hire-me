---
slug: "javascript-values"
title: "变量、值与对象共享"
description: "跟踪两次赋值和一次对象修改，理解为什么有时另一个变量也看到了变化。"
subject: "JavaScript 选修"
order: 200
minutes: 20
lab: "javascript"
objectives: ["区分原始值与对象", "分别追踪对象修改与变量重绑定", "解释 const 和浅拷贝的边界"]
prerequisites: []
---

# JavaScript：改了 b，为什么 a 也变了？

## 从零理解

变量绑定（variable binding）把名字与一个值关联起来。`let score = 80` 创建名字 score，并把当前值设为 80。
赋值可以让绑定关联另一个值；对象修改则改变某个已有对象的内容。这是两种不同操作。
原始值（primitive value）包括数字、字符串、布尔值、`null`、`undefined`、BigInt 和 Symbol。
原始值不可原地修改；`let n = 1; n = 2` 改变的是 n 当前关联的值，没有把数字 1 变成数字 2。

对象（object）可以具有属性，例如 `{ score: 80 }` 有一个名为 score 的属性。
多个变量可以关联同一个对象；通过其中一个变量修改对象，其他变量也能访问到修改后的内容。
常说的“复制对象引用（object reference）”是描述这种共享效果，不要求程序能读到真实内存地址。
JavaScript 按值传参；当值关联对象时，调用方和形参可以共享该对象，不能简单说成“所有参数都是传引用”。

## 实验代码

```javascript
let count = 1;
let copiedCount = count;
copiedCount = 2;
console.log(count, copiedCount);

let original = { score: 80 };
const shared = original;
shared.score = 90;
original = { score: 70 };
console.log(original.score, shared.score);

const shallow = { ...shared };
shallow.score = 95;
console.log(shared.score, shallow.score);
```

对象字面量 `{ score: 80 }` 创建一个新对象。点号 `shared.score` 访问该对象的属性。
展开语法 `...shared` 把这个普通对象的自有可枚举属性复制到新对象中，属于浅拷贝（shallow copy）。

## 逐步推演

### 第一步：复制原始值

`copiedCount = count` 后，两者的值都是 1；再给 copiedCount 赋 2，不会给 count 重新赋值。
此时 `count = 1`、`copiedCount = 2`，第一行输出为 `1 2`。

### 第二步：两个名字关联同一对象

把新建对象记为 O1，这只是推演名称，不是程序中的变量或真实地址。
`const shared = original` 后，`original → O1`，`shared → O1`，O1 的 score 为 80。
没有创建第二个对象，所以不能把这一步画成两份独立的成绩。

### 第三步：修改对象，再给一个变量重绑定

`shared.score = 90` 修改 O1；此时通过 original 读取 score，也会得到 90。
`original = { score: 70 }` 创建新对象 O2，只让 original 改为关联 O2。

| 名字 | 当前对象 | score |
| --- | --- | --- |
| original | O2 | 70 |
| shared | O1 | 90 |

shared 没有“跟随变量名 original”；它仍关联此前的对象 O1。

### 第四步：浅拷贝简单对象

`{ ...shared }` 创建 O3，其 score 属性取得数值 90。
修改 O3 的 score 为 95，不会修改 O1，所以最后输出 `90 95`。
本例属性是原始数值，因此没有更深层对象共享；这个结论不能直接推广到嵌套对象。

## 预期输出

```text
1 2
70 90
90 95
```

只打印具体属性能看清执行时的值，不必依赖某个控制台何时展开对象的显示方式。

## 为什么浅拷贝仍可能共享内容

```javascript
const a = { detail: { score: 80 } };
const b = { ...a };
b.detail.score = 99;
console.log(a.detail.score);
console.log(a === b, a.detail === b.detail);
```

预期输出为 `99` 和 `false true`。a、b 是不同外层对象，但 detail 属性仍关联同一个内层对象。
严格相等运算符 `===` 用在两个对象上比较身份；两个内容相同的新对象也不会因此相等。
需要独立的嵌套数据时，应根据数据类型选择适当复制方式，不能只加一层展开语法。

## const 限制了什么

`const` 禁止给绑定重新赋值，但不会递归冻结对象内容；`const shared` 不妨碍修改 `shared.score`。
下面试图给同一个 const 绑定换对象，会出现类型错误（TypeError）；错误文本随执行环境而异。

```javascript
const score = { value: 80 };
score = { value: 90 };
```

修改属性与更换绑定是两个检查点。把 const 一律解释成“值绝对不可变”，会误判前面的实验。

## 常见错误

- **赋值一个对象就得到独立副本。** 普通赋值共享对象，不会自动复制内部内容。
- **重新绑定 a 后，b 也跟着指向新对象。** b 保存的是自己的值，不是持续追踪 a 的名字。
- **函数内改参数一定不影响外面。** 参数重绑定不改变调用方绑定，但修改共享对象可能被观察到。
- **浅拷贝能隔离所有嵌套内容。** 它只复制一层属性值，内部对象仍可能共享。

## 面试回答

JavaScript 的原始值不可变，对象则可能通过多个绑定共享。普通对象赋值不会自动产生独立对象。
修改共享对象能从其他绑定观察到；给某个绑定重新赋值只改变该绑定。
const 约束重新赋值，浅拷贝只复制一层，都不能直接推出整个对象图不可变或完全独立。

## 选择题

执行 `const a = { n: 1 }; const b = a; b.n = 2;` 后，哪个判断正确？

- A. 会因 b 是 const 而报错。
- B. a.n 为 1，b.n 为 2，因为赋值复制了对象。
- C. a.n 和 b.n 都为 2，因为两者共享同一对象。
- D. a 被重新绑定成一个新对象。

**答案：C。** 修改的是共同对象的属性。A 混淆属性修改和绑定重赋值；B 假设了不存在的拷贝；D 中没有任何给 a 重新赋值的语句。

## 面试追问

“`function f(x) { x = {}; }` 会替换调用方对象吗？”不会，改变的是形参绑定；`x.n = 3` 则会尝试修改传入对象。
“两个 `{ n: 1 }` 用 `===` 比较为什么是 false？”它们是两次创建的不同对象，相同内容不等于相同身份。

## 官方参考

- [MDN：Data types and data structures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Data_structures)，原始值与对象。
- [MDN：Shallow copy](https://developer.mozilla.org/en-US/docs/Glossary/Shallow_copy)，外层复制与内层共享。
