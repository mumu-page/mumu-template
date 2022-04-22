import { isEdit } from '../utils/utils';

export const getEnv = () => {
  let env = 'mock';
  const host = window.location.host;
  if (isEdit || process.env.VUE_APP_ENV === 'mock') {
    env = 'mock';
  } else if (/\.dev\.|\d+\.\d+\.|localhost/.test(host)) {
    env = 'development';
  } else if (/\.qa\./.test(host)) {
    env = 'test';
  } else if (/\.pre\./.test(host)) {
    env = 'preview';
  } else {
    env = 'production';
  }

  return env;
};

export const env = getEnv();

