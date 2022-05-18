#!/usr/bin/env node

const inquirer = require('inquirer');
const { startHttpServerHot } = require('./server');
const { configMap, changeProxy, unique } = require('../lib/index');

let argv = require('minimist')(process.argv.slice(2), {
  alias: {
    tls: 'ssl'
  }
});

if (argv.h || argv.help) {
  console.log([
    'usage: http-server-hot [path] [options]',
    '',
    'options:',
    '  -o [path]    Open browser window after starting the server.',
    '               Optionally provide a URL path to open the browser window to.',
    '  -P --proxy       Fallback proxy if the request cannot be resolved. e.g.: http://someurl.com',
    '  -h --help          Print this list and exit.',
    '  -v --version       Print the version and exit.'
  ].join('\n'));
  process.exit();
}

let // proxy = argv.P || argv.proxy,
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


// proxy 是否启动
const questions = [{
	type: 'list',
	name: 'isProxy',
  message: '是否要开启跨域代理？（开启跨域代理后，代理的域名将可以通过代理名称来替代）',
  choices: ['否', '是'],
	filter: function(val) {
    return val.toLowerCase();
	}
}];

// proxy 选项
const questionProxy = [{
  type: 'input',
  name: 'proxy',
  message: '要代理的域名？',
  default: 'http://192.168.0.20',
  filter: function(val) {
    return val;
  }
}, {
  type: 'list',
  name: 'extraProxy',
  message: '是否要增加代理？（增加代理须配置不同的名称）',
  choices: ['否', '是'],
  default: '否',
  filter: function(val) {
    return val;
  }
}];

var num = 1;

// proxy
const qsProxy = [{
  type: 'input',
  name: 'proxy',
  message: `增加新的代理域名？`,
  default: 'http://192.168.0.20',
  filter: function(val) {
    return val;
  }
}, {
  type: 'input',
  name: 'name',
  message: `增加新的代理名称？`,
  default: 'glory',
  filter: function(val) {
    return val;
  }
}, {
  type: 'list',
  name: 'extraProxy',
  message: '是否要增加代理？（增加代理须配置不同的名称）',
  choices: ['否', '是'],
  default: '否',
  filter: function(val) {
    return val;
  }
}];

let extra = [];

function initProcess() {
  inquirer.prompt(questions).then(answers => {
    if (answers.isProxy === '否') {
      // 不开启代理
      startHttpServerHot()
      return;
    }
    inquirer.prompt(questionProxy).then(result => {
      let origin = configMap().has(result.proxy) ? configMap().get(result.proxy) : changeProxy(result.proxy);
      if (origin && result.extraProxy === '否') {
        startHttpServerHot(origin);
        return;
      }
      else if (origin) {
        // 增加代理函数
        const addProxy = (qsProxy) => {
          if (num > 5) {
            startHttpServerHot(origin, unique(extra));
            return;
          }
          inquirer.prompt(qsProxy).then(res1 => {
            extra.push({
              proxyKey: res1.name,
              proxyVal: res1.proxy,
            })
            if (res1.extraProxy === '否') {
              startHttpServerHot(origin, unique(extra));
              return;
            }
            else {
              num++;
              addProxy(qsProxy);
            }
          })
        }

        addProxy(qsProxy);

      }
    })
  });
}

initProcess();