'use strict';

/**
 * right domin
 */
const isDomin = function (domin) {
  const regUrl = /^(?=^.{3,255}$)(http(s)?:\/\/)?(www\.)?[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+(:\d+)*(\/\w+\.\w+)*$/;
  return regUrl.test(domin);
}


exports.changeProxy = function (proxy) {
  if (!proxy) return '';
  if (!isDomin(proxy)) {
    console.log(`\n\u001b[31mError: 要代理的域名【${proxy}】有误，请仔细检查\u001b[39m\n`);
    return false;
  }
  if (!proxy.includes('https') && !proxy.includes('http')) return `http://${proxy}`;
  return proxy;
}


exports.unique = function (arr) {
  for(let i = 0; i < arr.length; i++) {
    for(let j = i + 1; j < arr.length; j++) {
      if (arr[i].proxyKey === arr[j].proxyKey && arr[i].proxyVal === arr[j].proxyVal) {
        arr.splice(j, 1);
        j--;
      }
    }
  }
  return arr;
}


exports.configMap = function () {
  return new Map([
    /**95环境 */
    [95, 'http://95.kky.dzods.cn'],
    ['95', 'http://95.kky.dzods.cn'],
    /**96环境 */
    [96, 'http://96.kky.dzods.cn'],
    ['96', 'http://96.kky.dzods.cn'],
    /**yfb */
    ['yfb', 'http://yfb.kky.dzods.cn'],
  ]);
}