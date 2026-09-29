---
slug: "javascript-this"
title: "this 由调用方式决定"
subject: "Web 与程序执行"
description: "同一个函数被两个对象调用、显式指定接收者、再被单独取出时，会读到谁。"
order: 39
minutes: 17
lab: "javascript"
objectives: ["按调用表达式判断 this", "解释方法被取出后的差异", "区分普通函数与箭头函数的 this 规则"]
prerequisites: ["javascript-values", "javascript-closures"]
---

# this 由调用方式决定

## 面试回答

对普通函数，JavaScript 的 `this` 通常由**调用方式**决定：`obj.method()` 中接收者是 `obj`，`method.call(other)` 显式指定 `other`；在严格模式下，脱离对象直接调用的普通函数，其 `this` 是 `undefined`。把一个方法赋给另一个对象不会让它永远绑定原对象。箭头函数没有自己的 `this` 绑定，会从定义处的词法环境取得，不适合直接套用普通方法调用规则。[MDN：this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)

## 同一个函数，四种调用

下例中的 `read` 只定义一次，随后被不同对象调用。先不要猜“函数写在谁的花括号里”，而要看调用处点号左边是谁：

```text
one.read()                → one
two.read()                → two
one.read.call(another)    → another
const detached=one.read;
detached()                → 严格模式下 this 为 undefined
```

`two.read = one.read` 复制的是同一个函数值，不会在复制时绑定 `one`。`detached()` 与 `one.read()` 表面上都执行这个函数，但调用表达式不同。[MDN：Function.prototype.call](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call)

## 实验代码

```javascript
'use strict';
const one = { name: 'one', read() { return this.name; } };
const two = { name: 'two', read: one.read };
console.log(one.read());
console.log(two.read());
console.log(one.read.call({ name: 'another' }));
const detached = one.read;
try {
  console.log(detached());
} catch (error) {
  console.log(error.name);
}
```

按规则推导，前面三行分别是 `one`、`two`、`another`。最后脱离对象调用时，严格模式中的 `this` 是 `undefined`，读取其 `name` 会产生 `TypeError`，被 `catch` 捕获并输出错误名。把 `two.read()` 改成 `const f=two.read; f()` 再运行，结论同理。代码运行器在 Worker 中执行，不要把浏览器全局对象的非严格模式特例直接套进这个严格模式例子。

## 箭头函数为什么是另一回事

箭头函数（Arrow Function）从创建它的外围词法环境读取 `this`，不会因为以后写成 `obj.arrow()` 就改绑为 `obj`。它适合保留外层回调的接收者，但若对象字面量的方法需要通过调用者访问对象，一般使用普通方法。`bind` 可以为普通函数创建绑定接收者的新函数；“箭头函数和 bind 完全一样”也不准确，因为参数、构造行为等规则不同。[MDN：Arrow Functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)

## 常见误区

- **“this 永远指向定义函数的对象。”** 普通函数看调用处；同一函数可由不同对象调用。
- **“只要属性名还叫 read，取出来调用也保留原 this。”** 脱离对象的调用不再有那个接收者。
- **“箭头函数里的 this 等于调用它的对象。”** 箭头函数没有自己的 this，按定义处的词法环境取值。
- **“严格模式下独立调用直接输出 undefined.name。”** 实际读取 `undefined` 的属性会抛出 TypeError。

## 选择题

严格模式下，`const a={x:1,get(){return this.x}}; const b={x:2,get:a.get};`，执行 `b.get()` 返回什么？

- A. 1
- B. 2
- C. undefined
- D. TypeError

**答案：B。** `b.get()` 的调用接收者是 `b`，读取 `b.x` 得到 2。函数原先写在 `a` 中，不会固定 this；也没有脱离对象调用，所以 C、D 不成立。

## 参考资料

- [MDN：this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)
- [MDN：Arrow Functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
