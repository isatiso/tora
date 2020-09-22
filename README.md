# Tora
node.js 的依赖注入框架，typescript 实现。

## Installation

```
$ npm install tora
```

## Hello Tora

```
@Router('test', {
    children: []
})
export class IndexRouter {

    constructor(
        private env: Environment,
        private gen: GeneratorService,
        private jwt: JwtService,
        private oss: OssService,
    ) {
    }

    @Post('normal')
    async normal(
        cs: SessionContext,
        params: ApiParams<{
            a: number
            b: string
        }>) {

        const a = params.ensure('a', 'number')
        const b = params.ensure('b', 'nonEmptyString')

        return { a, b }
    }

}

@ToraModule({
    providers: [
    ],
    router_gate: IndexRouter
})
class TestModule {
}

new Platform()
    .bootstrap(TestModule)
    .start(3000)
```
