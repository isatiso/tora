通常缓存的记录需要生成一个 key 来标记一份缓存内容。

这里 key 分为两个部分：
- `cache_prefix`
  相当于标记不同请求接口的 namespace，如果不传默认使用请求路径。
- `cache_key`
  用于标记同一接口下不同请求参数对应的缓存。
  需要在请求处理函数中进行计算，并由 [[SessionContext.return_if_cache]] 传入。

可以使用 `cache_prefix` 区分不同的缓存空间，比如不同的 redis database，甚至是不同的 redis。
也可以通过 `cache_prefix` 拼接 `cache_key`，在同一缓存空间下唯一标记一份缓存。
