### 比特球aria2脚本

此脚本用于将比特球云盘相关内容导出至aria2.

功能：
- 导出对应文件到aria2
- 批量导出目录到aria2

按以下流程进行操作:
1. 下载[油猴插件](https://www.tampermonkey.net/index.php?version=4.16.1&ext=dhdg&show=dhdg)
2. 在浏览器中导入油猴插件
3. 在油猴中导入些脚本内容
4. have fun~


脚本中需要修改的配置:
```
// @connect     nas.alexezio.org  
// 将自身的服务器地址加到开头，以防出现connect异常

var RPC_URL = "http://127.0.0.1:6800/jsonrpc"; // 改成自己的Aria2 RPC 的地址，一般只需修改 IP/域名 部分
    var RPC_TOKEN = ""; // 改成 Aria2 RPC 的密钥
    var DOWNLOAD_URL = "/downloads";  // 下载本地路径,即下载的文件会存放在aria2服务器的哪个目录上
```


实际效果图:
![4f520558d1da977412b15e3bd6893754.png](evernotecid://D89C84DB-0700-4A47-95F5-BBD92FACA5FC/appyinxiangcom/17400156/ENResource/p333)
