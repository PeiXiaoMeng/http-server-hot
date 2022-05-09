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