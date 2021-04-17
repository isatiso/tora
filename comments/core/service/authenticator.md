常见的两种注入方式：

- **单例方式**：

    同一个入口模块下只会有一个 Authenticator 实例，你可以将解析结果通过 LiteContext 进行共享。

  ```typescript
  @Tora.Module({
      providers: [
          { provide: Authenticator, useClass: CustomAuthenticator }
      ]
  })
  ```

- **普通方式**：

    每一个请求初始化时会创建一个 Authenticator 实例，此时你可以通过在 Authenticator 上记录解析结果进行数据共享。

  ```typescript
  @Tora.Module({
      providers: [
          { provide: Authenticator, useClass: CustomAuthenticator, multi: true }
      ]
  })
  ```
