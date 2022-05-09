## http-server-hot

**http-server-hot开启一个http服务的同时，可以对引用的资源（css、js）进行热更新，使开发变得更加高效**
**http-server-hot可以快速配置要代理的域名，解决API跨域问题带来的烦恼**
___


Installation
============

```
npm install http-server-hot [-d]
```

Usage
=====

```
http-server-hot [path] [options]
```
_Now you can visit http://localhost:4725/your-page to view your server_

Start Proxy
=====
```
http-server-hot -p [domin] -t [agent]
```

**Tip:**
**domin: 要进行解析的域名**
**agent: 代理值**

eg: http-server-hot -p http://192.168.0.90 -t api

License
====

MIT