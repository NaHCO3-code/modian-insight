/**
 * 认证服务 - 处理API的签名认证
 * 基于example中的authedFetch.js改写为TypeScript
 */

import { URL } from 'url';
import { hex_md5 } from '../utils/crypto';
import config from '../config';

export interface AuthInfo {
  sign: string;
  mt: number;
  requestUrl: string;
  data?: any;
}

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

/**
 * 生成API签名
 */
export function getSign(url: string, type: string = 'GET', data: Record<string, any> = {}): AuthInfo {
  const requestUrl = url.startsWith('http') ? url : `${config.modian.apiBaseUrl}${url}`;
  const parsedUrl = new URL(requestUrl);
  const hostAll = parsedUrl.origin + parsedUrl.pathname;
  const hosts = hostAll.replace('http://', '').replace('https://', '');
  
  let query = parsedUrl.search.slice(1);
  let props = '';
  
  // 处理POST或GET数据
  const paras: string[] = [];
  Object.keys(data).forEach(function(key) {
    if (url.indexOf('/search/all') !== -1) {
      paras.push(key + '=' + encodeURIComponent(data[key]));
    } else {
      paras.push(key + '=' + data[key]);
    }
  });
  paras.sort();
  props = paras.length ? paras.join('&') : '';

  // 合并查询参数
  if (type === 'GET' && props) {
    if (query) {
      query += "&";
    }
    query += props;
  }

  if (query) {
    query = query.split('&').sort().join('&');
  }

  if (type === 'GET') {
    props = '';
  }

  const apimData = Math.floor(Date.now() / 1000);
  const appkey = config.modian.appkey;
  
  // 计算签名
  const goodSign = hex_md5(
    hosts + 
    appkey + 
    apimData + 
    decodeURIComponent(query || '') + 
    hex_md5(decodeURIComponent(props || ''))
  );

  return {
    sign: goodSign,
    mt: apimData,
    requestUrl: query ? `${hostAll}?${query}` : hostAll,
    data: type === 'GET' ? undefined : data
  };
}

/**
 * 发起认证请求
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestOptions = {},
  token?: string,
  userId?: string
): Promise<Response> {
  const { 
    method = 'GET',
    headers = {},
    body,
    timeout = config.crawler.timeout,
    ...otherOptions
  } = options;

  // 准备认证信息
  const data = method === 'GET' ? {} : (body ? JSON.parse(body) : {});
  const authInfo = getSign(url, method, data);

  // 构建请求头
  const finalHeaders: Record<string, string> = {
    ...config.modian.defaultHeaders,
    'build': '15000',
    'client': '11',
    'mt': authInfo.mt.toString(),
    'sign': authInfo.sign,
    ...headers
  };

  // 添加认证信息（如果提供）
  if (token) {
    finalHeaders['token'] = token;
  }
  if (userId) {
    finalHeaders['user_id'] = userId;
    finalHeaders['userid'] = userId;
  }

  // 创建AbortController用于超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // 发起请求
    const response = await fetch(authInfo.requestUrl, {
      method,
      headers: finalHeaders,
      body: authInfo.data ? JSON.stringify(authInfo.data) : undefined,
      signal: controller.signal,
      ...otherOptions
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * 发起普通HTTP请求（不需要认证）
 */
export async function simpleFetch(
  url: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { 
    timeout = config.crawler.timeout,
    headers = {},
    ...otherOptions
  } = options;

  // 构建请求头
  const finalHeaders: Record<string, string> = {
    ...config.modian.defaultHeaders,
    ...headers
  };

  // 创建AbortController用于超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      headers: finalHeaders,
      signal: controller.signal,
      ...otherOptions
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
