不同类型对应的处理方式如下：

- **string**

    1. 直接写入响应流。

    1. **Content-Type** 会被默认设置为 `text/html` 或者 `text/plain` 同时携带 `charset=utf-8`。

    1. **Content-Length** 会被设置为对应数值。

    1. 响应状态码如果没有指定则会被设置为 **200**，**包括空字符串的情况**。

- **Buffer**

    1. 直接写入响应流。

    1. **Content-Type** 会被默认设置为 `application/octet-stream`。

    1. **Content-Length** 会被设置为对应数值。

    1. 响应状态码如果没有指定则会被设置为 **200**。

- **Stream**

    1. **Content-Type** 会被默认设置为 `application/octet-stream`。

    1. 当响应体被设置为 Stream 类型时，Koa 会自动添加一个 `.onerror` 监听器，用于捕获所有的 error 事件。

    1. 当请求连接断开（包括提前断开），Stream 会被销毁。

    1. 如果不需要这两个特性，则不要直接将响应体设置为 Stream 类型。

    1. 响应状态码如果没有指定则会被设置为 **200**。

- **Object 或者 Array**

    1. 通过 JSON.stringify 进行序列化后写入响应流。

    1. **Content-Type** 会被默认设置为 `application/json; charset=utf-8`。

    1. **Content-Length** 会被设置为对应数值。

    1. 响应状态码如果没有指定则会被设置为 **200**。

- **null**

    1. 响应体无内容。

    1. 响应状态码如果没有指定则会被设置为 **204**。
