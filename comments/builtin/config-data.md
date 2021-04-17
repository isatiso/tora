```typescript
// 你可以通过如下方式修改 <ToraConfigSchema>：

import { ConfigData } from './config-data'

declare global {
    interface ToraConfigSchema {
        sample: {
            sample_property1: 255
            sample_property2: 'sample'
        }
    }
}

// 修改之后的 <ToraConfigSchema> 大概长成下面这样：

interface ToraConfigSchema {
    sample: {
        sample_property1: 255
        sample_property2: 'sample'
    }
    tora?: {
        port?: number
    }
}

// 此时使用如下方式查找配置内容，typescript 会检查配置文件路径是否合法，IDE（如：Idea）也会给出相应的配置路径提示：

@ToraComponent()
export class SampleToraComponent {

    constructor(
        private _config: ConfigData
    ) {
    }

    get_sample_property1(): number {
        return this._config.get('sample.sample_property1')
    }

    get_sample_property2(): string {
        return this._config.get('sample.sample_property2')
    }
}
```
