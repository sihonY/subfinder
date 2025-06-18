# 网络配置说明

## 代理配置

如果遇到网络超时或连接问题，可以通过配置代理来解决。

### 1. 代理配置方式

#### 方式一：在 .env 文件中配置（推荐）
```env
# 代理服务器地址
PROXY_HOST=127.0.0.1
PROXY_PORT=7890
PROXY_PROTOCOL=http
```

#### 方式二：使用环境变量（优先级更高）
```env
HTTP_PROXY=http://127.0.0.1:7890
HTTPS_PROXY=http://127.0.0.1:7890
```

### 2. 常见代理软件端口

| 代理软件 | 默认端口 | 配置示例 |
|---------|---------|---------|
| Clash | 7890 | `PROXY_PORT=7890` |
| V2Ray | 10809 | `PROXY_PORT=10809` |
| Shadowsocks | 1080 | `PROXY_PORT=1080` |
| 其他代理 | 自定义 | `PROXY_PORT=你的端口` |

### 3. 配置示例

#### Clash 配置
```env
PROXY_HOST=127.0.0.1
PROXY_PORT=7890
PROXY_PROTOCOL=http
```

#### V2Ray 配置
```env
PROXY_HOST=127.0.0.1
PROXY_PORT=10809
PROXY_PROTOCOL=http
```

#### Shadowsocks 配置
```env
PROXY_HOST=127.0.0.1
PROXY_PORT=1080
PROXY_PROTOCOL=http
```

### 4. 验证代理配置

启动应用后，查看控制台日志：
```
[INFO] 配置代理: http://127.0.0.1:7890
[INFO] OpenSubtitles配置代理: http://127.0.0.1:7890
```

### 5. 常见问题

#### 问题1：代理连接失败
```
[ERROR] TMDB连接被拒绝，请检查代理配置
```

**解决方案：**
1. 确认代理软件正在运行
2. 检查端口号是否正确
3. 确认代理软件允许本地连接

#### 问题2：网络超时
```
[ERROR] TMDB搜索超时，请检查网络连接或代理配置
```

**解决方案：**
1. 检查网络连接
2. 确认代理配置正确
3. 尝试增加超时时间

#### 问题3：API密钥错误
```
[ERROR] TMDB API密钥未配置
```

**解决方案：**
1. 检查 `.env` 文件中的API密钥
2. 确认API密钥有效
3. 重启应用

### 6. 测试网络连接

#### 测试TMDB API
```bash
curl -x http://127.0.0.1:7890 "https://api.themoviedb.org/3/movie/550?api_key=YOUR_API_KEY"
```

#### 测试OpenSubtitles API
```bash
curl -x http://127.0.0.1:7890 "https://api.opensubtitles.com/api/v1/subtitles?query=Inception"
```

### 7. 不使用代理

如果不需要代理，可以：
1. 删除 `.env` 文件中的代理配置
2. 或者注释掉代理配置行：
```env
# PROXY_HOST=127.0.0.1
# PROXY_PORT=7890
# PROXY_PROTOCOL=http
```

### 8. 调试网络问题

#### 查看详细错误信息
在代码中设置断点，查看错误对象：
```javascript
catch (error) {
  console.log('错误详情:', {
    code: error.code,
    message: error.message,
    config: error.config
  });
}
```

#### 检查网络状态
```bash
# 检查端口是否开放
netstat -an | findstr 7890

# 检查代理连接
telnet 127.0.0.1 7890
```

### 9. 性能优化

#### 超时设置
当前超时设置为30秒，可以根据网络情况调整：
```javascript
timeout: 30000, // 30秒
```

#### 重试机制
可以考虑添加重试机制：
```javascript
// 在服务中添加重试逻辑
let retries = 3;
while (retries > 0) {
  try {
    // API调用
    break;
  } catch (error) {
    retries--;
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

---

**注意**: 代理配置是可选的，只有在遇到网络连接问题时才需要配置。 