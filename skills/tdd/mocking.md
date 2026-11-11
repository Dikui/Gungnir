# 何时 mock

只在**系统边界** mock：

- 外部 API（支付、邮件等）。
- 数据库（有时可以；优先用测试数据库）。
- 时间和随机数。
- 文件系统（有时）。

不要 mock：

- 自己的类和模块。
- 内部协作者。
- 任何自己能控制的东西。

## 让接口容易 mock

在系统边界处，把接口设计成容易 mock 的形式。

**1. 使用依赖注入**

外部依赖从参数传入，不在内部创建：

```typescript
// Easy to mock
function processPayment(order, paymentClient) {
  return paymentClient.charge(order.total);
}

// Hard to mock
function processPayment(order) {
  const client = new StripeClient(process.env.STRIPE_KEY);
  return client.charge(order.total);
}
```

**2. 用 SDK 式接口，不用通用的请求函数**

每个外部操作一个具体函数，不用一个带条件分支的通用函数：

```typescript
// GOOD: Each function is independently mockable
const api = {
  getUser: (id) => fetch(`/users/${id}`),
  getOrders: (userId) => fetch(`/users/${userId}/orders`),
  createOrder: (data) => fetch('/orders', { method: 'POST', body: data }),
};

// BAD: Mocking requires conditional logic inside the mock
const api = {
  fetch: (endpoint, options) => fetch(endpoint, options),
};
```

SDK 式接口的好处：

- 每个 mock 返回一种确定的结构。
- 测试准备中不需要条件分支。
- 容易看出测试触发了哪些接口。
- 每个接口都有类型检查。
