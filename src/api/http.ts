import axios from 'axios';
import { env } from '../config';

const instance = axios.create({
  baseURL: process.env.BASE_API_URL,
  timeout: 30000,
  withCredentials: true
});

const http = (opt: { url: any; method: any; params: any; config?: any; }) => {
  const { url, method, params, config = {} } = opt;
  // mock环境
  if (env === 'mock') {
    const fileName = url.replace(/\//g, '^');
    const mock = require(`../mock/${fileName}${method}.json`);
    return Promise.resolve(mock);
  }
  return (instance as any)[method.toLocaleLowerCase() as any](url, params, config);
};

export default http;
