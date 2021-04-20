# Tora

基于 typescript reflect 实现的依赖注入服务框架。

[文档](https://isatiso.github.io/tora)

[Github](https://github.com/isatiso/tora)

## 安装

需要 typescript 4.2 以上。

```
$ npm install tora
```

## Hello Tora

```typescript
import { ApiParams, Platform, Post, ToraRouter } from 'tora'

@ToraRouter('/hello')
export class TestRouter {

    @Post()
    async test(
            params: ApiParams<{
                hello: string
            }>) {

        return { hello: params.get('hello') }
    }

}

new Platform()
        .load_config({ tora: { port: 3000 } })
        .route(TestRouter)
        .start()

// $ curl --request POST --url http://localhost:3000/hello/test --header 'Content-Type: application/json' --data '{ "hello": "world" }'
// $ {"hello":"world"}
```

## Tora 组件

Tora 中的核心组件有四种：

- [[ToraService]] 用来实现可以注入的服务。
- [[ToraModule]] 用于提供 ToraService，加载其他 ToraModule，是连接服务的中枢。
- [[ToraRoot]] 特殊 ToraModule，可以携带 routers 和 tasks，作为 Platform 的启动入口。
- [[ToraRouter]] 特殊 ToraModule，用于实现 API，提供服务，加载模块。
- [[ToraTrigger]] 特殊 ToraModule，用于实现定时任务。

### ToraService

先实现一个最基础的 Service，以一定格式把两个字符串拼起来。

```typescript
import { ToraService } from 'tora'

@ToraService()
export class AssembleStringService {

    assemble(front: string, rear: string) {
        return `${front}^_^${rear}`
    }
}
```

接下来我们来使用这个服务。 我们先构建一个可以请求的接口，这样可以直接看到运行结果。

```typescript
@ToraRouter('/test', {
    providers: [
        AssembleStringService, // 需要有一个可以提供这个服务的模块在，
    ]
})
export class SampleRouter {

    constructor(
            // 这样就获得了这个服务。
            private assemble_string: AssembleStringService
    ) {
    }

    @Get()
    async sample() {
        return {
            // 使用服务生成字符串并返回。
            res: this.assemble_string.assemble('@@@', '$$$')
        }
    }
}

// $ curl -X GET --url http://localhost:3000/test/sample
// $ { "res": "@@@^_^$$$" }
```

下面展示如何使用 ToraModule 进行模块连接。先创建一个 ToraModule。

```typescript
@ToraModule({
    providers: [
        AssembleStringService, // 这次由 SampleModule 进行服务提供。，
    ]
})
export class SampleModule {

}
```

将 ToraRouter 元数据做如下修改。

```typescript
@ToraRouter('/test', {
    // providers: [
    //     AssembleStringService,
    // ]
    imports: [
        SampleModule, // 这次将模块加在这里。
    ]
})
export class SampleRouter {

    constructor(
            // 同样的方式使用这个服务。
            private assemble_string: AssembleStringService
    ) {
    }
}
```






