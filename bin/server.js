#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const shell = require('shelljs');
const opener = require('opener');
const { execSync } = require('child_process');
const chalk = require('chalk');
const log = content => console.log(`${chalk.bgGreen('DONE')} ${chalk.green(content)}`);

const os = require('os');
const ifaces = os.networkInterfaces();

process.title = 'http-server-hot';

const WebSocketServer = require('ws').Server;
let wss = new WebSocketServer({ port: 4726 });

let argv = require('minimist')(process.argv.slice(2), {
  alias: {
    tls: 'ssl'
  }
});

let onMsgUrl = ''; // 监听文件目录匹配

if (argv.h || argv.help) {
  console.log([
    'usage: http-server-hot [path] [options]',
    '',
    'options:',
    '  -o [path]    Open browser window after starting the server.',
    '               Optionally provide a URL path to open the browser window to.',
    '  -h --help          Print this list and exit.',
    '  -v --version       Print the version and exit.'
  ].join('\n'));
  process.exit();
}

let tls = argv.S || argv.tls,
    host = argv.a || '0.0.0.0',
    version = argv.v || argv.version, 
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

if (version) {
  logger.info('v' + require('../package.json').version);
  process.exit();
}

let options = {
  root: argv._[0],
}

// httpServer流程
const proStrem = () => {
  var server = http.createServer(options, (request, response)=> {

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
    } catch (e) { data = null }
  
  });
  
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

if (tls) {
  logger.info(chalk.red('Error: 暂不支持https请求，请等待后续迭代'));
  process.exit(1);
}

function deepFind() {
  let fileStr = execSync('find . -maxdepth 10 -name "*.html" -o -name "*.css" -o -name "*.js"').toString();
  let fileArr = fileStr.split('\n');
  !!fileArr.length && fileArr.pop();
  if (onMsgUrl) {
    fileArr = fileArr.filter(item => item.includes(onMsgUrl));
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