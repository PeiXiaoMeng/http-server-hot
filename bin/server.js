#!/usr/bin/env node

/**
 * startHttpServerHot
 * @param {*} proxy 第一代理域名
 * @param {*} extra 其余代理数组
 */
const startHttpServerHot = (proxy, extra) => {

  const connect = require('connect');
  const http = require('http');
  const fs = require('fs');
  const shell = require('shelljs');
  const opener = require('opener');
  const { execSync } = require('child_process');
  const { createProxyMiddleware } = require('http-proxy-middleware');
  const httpProxy = require('http-proxy');
  const chalk = require('chalk');
  const log = content => console.log(`${chalk.bgGreen('DONE')} ${chalk.green(content)}`);
  
  const os = require('os');
  const ifaces = os.networkInterfaces();
  
  const app = connect();
  
  process.title = 'http-server-hot';
  
  const WebSocketServer = require('ws').Server;
  let wss = new WebSocketServer({ port: 4726 });
  
  let argv = require('minimist')(process.argv.slice(2), {
    alias: {
      tls: 'ssl'
    }
  });
  
  let onMsgUrl = ''; // 监听文件目录匹配
  
  let tls = argv.S || argv.tls,
      host = argv.a || '0.0.0.0',
      // proxy = argv.P || argv.proxy,
      logger;
  
  if (!argv.s && !argv.silent) {
    logger = {
      info: console.log,
    }
  }
  else if (chalk) {
    logger = {
      info: function () {},
      request: function () {}
    };
  }
  
  let options = {
    root: argv._[0],
  }
  
  // httpServer流程
  const proStrem = () => {
    var server = http.createServer(app);
    
    if (options.root) {
      server.root = options.root;
    }
  
    const port = 4725;
    server.listen(port, host, function() {
  
      var protocol = tls ? 'https://' : 'http://';
      
      logger.info([
        chalk.yellow('Starting up http-server, serving '),
        chalk.cyan(server.root || './'),
        tls ? (chalk.yellow(' through') + chalk.cyan(' https')) : ''
      ].join(''));
      logger.info(chalk.yellow('\nAvailable on:'));
  
      if (argv.a && host !== '0.0.0.0') {
        logger.info(`  ${protocol}${host}:${chalk.green(port.toString())}`);
      } else {
        Object.keys(ifaces).forEach(function(dev) {
          ifaces[dev].forEach(function(details) {
            if (details.family === 'IPv4') {
              logger.info(('  ' + protocol + details.address + ':' + chalk.green(port.toString())));
            }
          });
        });
      }
  
      logger.info('Hit CTRL-C to stop the server');
  
      if (argv.o) {
        const openHost = host === '0.0.0.0' ? '127.0.0.1' : host;
        let openUrl = `${protocol}${openHost}:${port}`;
        if (typeof argv.o === 'string') {
          openUrl += argv.o[0] === '/' ? argv.o : '/' + argv.o;
        }
        logger.info('Open: ' + openUrl);
        opener(openUrl);
      }
  
    })
  }
  
  function runProcess() {
    if (!!argv._[0]) {
      try {
        shell.cd(argv._[0]);
        proStrem();
      } catch(e) {
        logger.info(chalk.red(`Error: 启动服务的目录【${argv._[0]}】错误，请仔细检查`));
        process.exit();
      }
    } else {
      proStrem();
    }
  }
  
  if (!proxy || !extra) runProcess();

  if (extra) {
    if (extra && Array.isArray(extra) && extra.length > 0) {
      extra.forEach(item => {
        app.use('/' + item.proxyKey, createProxyMiddleware({ target: item.proxyVal, changeOrigin: true }));
        log(`域名【${item.proxyVal}】已成功代理在【/${item.proxyKey}】`);
      })
      runProcess();
    }
  }

  // 创建代理服务器
  let httpServerProxy;
  if (proxy) httpServerProxy = httpProxy.createProxyServer();
  
  app.use((request, response) => {

    // 代理
    if (proxy) {
      httpServerProxy.web(request, response, {
        target: proxy,
      })
      log(`第一域名【${proxy}】已成功代理】`);
    }
  
    let data;
    const reqUrl = request.url.includes('?') ? request.url.split('?')[0] : request.url;
    const pngReg = /\.(png|PNG)$/i;
    const jpgReg = /\.(jpg|jpeg|JPG|JPEG)$/i;
  
    try {
      data = fs.readFileSync(`.${reqUrl}`);
      if (reqUrl.includes('.html')) {
        const lastIndex = reqUrl.lastIndexOf('/');
        onMsgUrl = reqUrl.substr(0, lastIndex) ? `${reqUrl.substr(0, lastIndex)}/` :  reqUrl.substr(0, lastIndex);
        data += `
      <script>
        var wsClient = new WebSocket('ws://127.0.0.1:4726');
        wsClient.open = function (e) {}
        wsClient.onclose = function (e) {}
        wsClient.onerror = function (e) {}
        wsClient.onmessage = (msg) => {
          const { update } = JSON.parse(msg.data)
          if(update){
              location.reload()
          }
        }
      </script>
      `
        log(`正在监听文件: 【${request.url}】`);
        response.end(data);
      } else if (pngReg.test(reqUrl)) {
        response.setHeader('Content-Type','image/png');
        response.end(data);
      } else if (jpgReg.test(reqUrl)) {
        response.setHeader('Content-Type','image/jpeg');
        response.end(data);
      } else {
        response.end(data);
      }
    } catch (e) { data = null }});
  
  if (tls) {
    logger.info(chalk.red('Error: 暂不支持https请求，请等待后续迭代'));
    process.exit(1);
  }
  
  function deepFind() {
    let cmdStr;
    if (process.platform === 'win32' || process.platform === 'win64') {
      cmdStr = 'for /r ./ %i in (*.html,*.js,*.css) do @echo %i';
    } else {
      cmdStr = 'find . -maxdepth 10 -name "*.html" -o -name "*.css" -o -name "*.js"';
    }
    let fileStr = execSync(cmdStr).toString();
    let fileArr = fileStr.split((process.platform === 'win32' || process.platform === 'win64') ? '\r\n' : '\n');
    !!fileArr.length && fileArr.pop();
    if (onMsgUrl) {
      fileArr = fileArr.filter(item => item.includes(onMsgUrl));
    }
    if (process.platform === 'win32' || process.platform === 'win64') {
      fileArr = fileArr.map(item => {
        item = item.replace(/\\/g, '\/');
        return item;
      })
    }
    return fileArr;
  };
  
  wss.on('connection', (ws) => {
    let result = deepFind();
    result.forEach(item => {
      fs.watch(item, {}, ()=>{
        ws.send(JSON.stringify({
          update: true
        }))
      })
    })
  });
  
  if(process.platform === 'win32') {
    require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    }).on('SIGINT', function () {
      process.emit('SIGINT');
    });
  }
  
  process.on('SIGINT', function () {
    logger.info(chalk.red('http-server-hot stopped.'));
    process.exit();
  });
  
  process.on('SIGTERM', function () {
    logger.info(chalk.red('http-server-hot stopped.'));
    process.exit();
  });
  }
  
  module.exports = {
    startHttpServerHot,
  }
  