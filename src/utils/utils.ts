import { parse } from 'qs';

function getComponent() {
  const componentConfig: any[] = [];
  const requireConfig = require.context(
    '../components',
    // 是否查询其子目录
    true,
    /package.json$/
  );
  requireConfig.keys().forEach(fileName => {
    const config = requireConfig(fileName);
    componentConfig.push(config);
  });

  return componentConfig;
}

function getPageConfig() {
  let pageConfig = {};
  const requireConfig = require.context(
    '../',
    // 是否查询其子目录
    false,
    /package.json$/
  );
  requireConfig.keys().forEach(fileName => {
    const config = requireConfig(fileName);
    pageConfig = config;
  });

  return pageConfig;
}

export const config = {
  componentConfig: getComponent(),
  pageConfig: getPageConfig()
};

const query = parse(window.location.href.split('?')[1]) || {};

export const isEdit = query.isEdit === 'true';

export const isPreview = query.isPreview === 'true';
const env = query.env as string;

export const pageId = query.pageId

export const baseUrl = {
  development: 'http://127.0.0.1:7001',
  production: 'https://mumu-page-server.resonance.fun'
}[env]

export function postMsgToParent(message: any) {
  window.parent.postMessage(
    message,
    '*'
  );
}

export function getDefaultProps(schema: { [x: string]: { type: any; defaultValue: any; values: any; }; }) {
  const props = {} as any;
  Object.keys(schema).forEach(key => {
    const { type, defaultValue, values } = schema[key];
    if (type === 'object') {
      props[key] = getDefaultProps(values);
    } else if (type === 'array') {
      props[key] = [getDefaultProps(values[0])];
    } else {
      props[key] = defaultValue;
    }
  });
  return props;
}

export function xhrGet(url: string | URL, callback: (arg0: any) => void) {
  const request = new XMLHttpRequest();
  request.open("GET", url);
  request.withCredentials = true
  request.responseType = 'json'
  request.onreadystatechange = function () {
    if (request.readyState !== 4) return;
    if (request.status === 200) {
      callback(request.response);
    }
  }
  request.send(null)
}

export const uuid = () => {
  // 1590753224242oqgomgkv7tp
  return new Date().getTime() + Math.random().toString(36).substring(2);
}