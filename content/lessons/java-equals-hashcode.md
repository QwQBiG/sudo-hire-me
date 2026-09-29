---
slug: "java-equals-hashcode"
title: "Java equals 与 hashCode 为什么必须配套"
description: "用两个独立的同值键走一遍 HashSet 查找，解释相等契约、散列桶与可变键问题。"
subject: "Java 语言机制"
order: 190
minutes: 18
lab: "walkthrough"
objectives: ["区分对象身份与 equals 语义", "说明相等对象哈希值必须相同", "解释只覆写 equals 或修改键字段的风险"]
prerequisites: ["object-identity-equality"]
---

# Java 对象相等：从 equals 走到 HashSet

## 两份对象可以表示同一个值

以 Java 21 为例，`==` 比较两个引用是否指向同一对象；`equals(Object)` 可由类定义“内容相等”。`Object.equals` 默认只认同一对象，但用户类可以覆写。`equals` 应满足自反、对称、传递、一致，以及与 `null` 不相等；`hashCode` 的关键契约是：**如果两个对象 `equals` 为真，它们的哈希值必须相同**。反向不成立，不同对象允许哈希碰撞。[Java SE 21：Object API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html)

## 一份最小值对象

```java
import java.util.HashSet;

public class Main {
    static final class Key {
        private final int id;
        Key(int id) { this.id = id; }

        @Override public boolean equals(Object other) {
            return other instanceof Key key && id == key.id;
        }
        @Override public int hashCode() {
            return Integer.hashCode(id);
        }
    }

    public static void main(String[] args) {
        Key a = new Key(7);
        Key b = new Key(7);
        HashSet<Key> keys = new HashSet<>();
        keys.add(a);
        System.out.println(a == b);
        System.out.println(a.equals(b));
        System.out.println(keys.contains(b));
    }
}
```

预期输出依次为 `false`、`true`、`true`。`a` 与 `b` 是两次 `new`，所以身份不同；二者 `id` 都是 7，`equals` 为真，`hashCode` 均基于 7。`HashSet` 先利用哈希定位候选位置，再在需要时比较键相等，因此用 `b` 能找到已加入的 `a`。[Java SE 21：HashSet API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashSet.html)

## 逐步推演

### 创建两个身份

`new Key(7)` 执行两次得到 `a`、`b` 两个对象。`a == b` 为 `false`。

### 定义同值关系

`a.equals(b)` 比较两个 `id`，得到 `7 == 7`，结果为 `true`；这与身份比较并不矛盾。

### 计算一致哈希

两次 `hashCode()` 都由整数 7 得出一致结果。相等对象满足同哈希契约；不能把“同哈希”倒推成“必相等”。

### 在集合中查找

`keys.add(a)` 后查询 `keys.contains(b)`，`b` 作为同值键被识别。这里 `id` 是 `final`，避免加入集合后键的相等与哈希依据发生变化。

## 典型错误边界

若只覆写 `equals` 不覆写 `hashCode`，可能出现两个按新规则相等、却被放入不同哈希位置的对象；**不能声称每次查找一定失败**，因为哈希仍可能偶然相同。若把会变的字段用于哈希并在入集合后修改它，后续查找也可能找不到原元素。设计用作键的值对象时，应保持相等与哈希所依赖的数据稳定。[Java SE 21：Object API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html)

## 面试回答

Java 的 `==` 比较引用身份，`equals` 定义对象的逻辑相等。覆写 `equals` 时通常必须配套覆写 `hashCode`，保持“相等对象哈希相同”；不同对象哈希相同则只是碰撞，仍要用 `equals` 分辨。`HashSet`、`HashMap` 依赖这组契约，用作键的字段最好不可变。

## 选择题

对 Java 的 `equals` 与 `hashCode`，哪项是必须满足的契约？

- A. 哈希相同的两个对象一定相等
- B. 相等的两个对象必须有相同哈希值
- C. 不同对象的哈希值必须不同
- D. 覆写 `equals` 后 `==` 自动改成内容比较

**答案：B。** 这是 `Object` 的哈希契约。A、C 忽略合法碰撞，D 混淆引用身份与方法定义的逻辑相等。

## 参考资料

- [Java SE 21：Object.equals 与 Object.hashCode](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html)
- [Java SE 21：HashSet](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashSet.html)
