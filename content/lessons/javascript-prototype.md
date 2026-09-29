---
slug: "javascript-prototype"
title: "原型链与属性查找"
subject: "Web 与程序执行"
description: "对象本身没有方法时，沿原型链去哪里找；同名属性又怎样遮蔽。"
order: 40
minutes: 17
lab: "javascript"
objectives: ["区分自有属性与继承属性", "手工追踪一次原型链查找", "解释同名自有属性的遮蔽"]
prerequisites: ["javascript-values", "javascript-this"]
---

# 原型链与属性查找

## 面试回答

JavaScript 对象可以通过内部原型链接到另一个对象。读取属性时，先查对象自身；若没有，再沿原型链（Prototype Chain）向上查，直到找到属性或到达链末端。给子对象添加同名自有属性会遮蔽原型上的属性，而不会自动改写原型对象。`Object.hasOwn` 可判断属性是否属于对象自身；`Object.getPrototypeOf` 可查看直接原型。[MDN：Inheritance and the Prototype Chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain)

## 画出一条最短的链

```text
child  --[[Prototype]]-->  base  --[[Prototype]]-->  Object.prototype
  label='child'              describe(){...}, kind='shared'
```

调用 `child.describe()` 时，`child` 自身没有 `describe`，沿链在 `base` 找到函数；但调用表达式的接收者仍是 `child`，因此函数内的 `this.label` 读到 `child` 的标签。**方法在哪里找到**与**调用时 this 是谁**是两个不同问题。

读取 `child.kind` 时若 child 自身没有，结果来自 base 的 `shared`；给 child 设置 `kind='local'` 后，读取 child 会先命中自己的属性，base 的 `kind` 仍是 `shared`。这叫遮蔽（Shadowing），不是复制整条原型链。[MDN：Object.create](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create)

## 实验代码

```javascript
const base = {
  describe() { return this.label; },
  kind: 'shared',
};
const child = Object.create(base);
child.label = 'child';
console.log(Object.hasOwn(child, 'describe'));
console.log(Object.getPrototypeOf(child) === base);
console.log(child.describe());
console.log(child.kind);
child.kind = 'local';
console.log(child.kind, base.kind);
```

预期依次观察到 `false`、`true`、`child`、`shared`、`local shared`。可以注释掉 `child.kind = 'local'`，验证属性查找会重新落到原型。也可以给 `child.describe` 赋一个新函数，观察自有方法遮蔽原型方法；不要修改内置 `Object.prototype` 来做这个实验，以免影响其他对象。

## class 与原型链的关系

`class` 语法提供更清晰的构造和方法声明方式，但普通实例方法通常仍通过其原型被共享查找。不要把类语法理解成“每个实例复制一份所有方法”。同时不要混淆函数的 `.prototype` 属性与对象的内部 `[[Prototype]]`：前者在构造实例时参与设置后者，两者不是同一个属性名或同一个概念。[MDN：Inheritance and the Prototype Chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain)

## 常见误区

- **“`child.describe()` 能调用，说明 describe 是 child 的自有属性。”** 它可能在原型上，`Object.hasOwn` 才能判断自有性。
- **“改了 child.kind，base.kind 一起变。”** 添加同名自有属性通常只是遮蔽 base 的值。
- **“继承来的方法中 this 一定指向 base。”** `child.describe()` 的接收者是 child。
- **“没有找到属性一定报错。”** 普通读取在链末仍没找到时通常得到 `undefined`；继续读取其子属性才可能抛错。

## 选择题

`const base={x:1}; const child=Object.create(base); child.x=2;`，哪项正确？

- A. `child.x` 为 1，`base.x` 为 2
- B. `child.x` 为 2，`base.x` 为 1
- C. 两者都为 2
- D. `Object.hasOwn(child,'x')` 为 false

**答案：B。** `child.x=2` 在 child 上创建自有属性，遮蔽但不修改 base 的 `x=1`。因此 D 也不成立。

## 参考资料

- [MDN：Inheritance and the Prototype Chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain)
- [MDN：Object.hasOwn](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwn)
