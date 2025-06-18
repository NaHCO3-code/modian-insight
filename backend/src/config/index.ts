/**
 * 应用配置文件
 */

export const config = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
  },

  // 爬虫配置
  crawler: {
    // 默认请求间隔（毫秒）
    defaultDelay: 1000,
    // 最小请求间隔（毫秒）
    minDelay: 500,
    // 最大请求间隔（毫秒）
    maxDelay: 5000,
    // 并发数
    concurrency: 1,
    // 重试次数
    maxRetries: 3,
    // 超时时间（毫秒）
    timeout: 30000,
  },

  // 数据存储配置
  storage: {
    // 数据根目录
    dataDir: process.env.DATA_DIR || './data',
    // 每个目录最大文件数
    maxFilesPerDir: 1000,
    // 备份保留天数
    backupRetentionDays: 30,
  },

  //API配置
  modian: {
    baseUrl: 'https://zhongchou.modian.com',
    apiBaseUrl: 'https://apim.modian.com',
    appkey: 'MzgxOTg3ZDMZTgxO',
    // 默认请求头
    defaultHeaders: {
      'accept': 'application/json, text/javascript, */*; q=0.01',
      'accept-language': 'zh-CN,zh;q=0.9',
      'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Linux"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'x-requested-with': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    },
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
  },
};

export default config;
