/**
 * 测试爬虫功能
 */

import { authenticatedFetch, simpleFetch } from './services/authService';

async function testCrawler() {
  try {
    console.log('开始测试爬虫功能...\n');

    // 测试项目ID - 从命令行参数获取，默认为100000
    const projectId = process.argv[2] ? parseInt(process.argv[2]) : 100000;
    
    console.log(`测试爬取项目 ${projectId}...`);

    // 获取项目限制状态
    const limitStatusUrl = `https://zhongchou.modian.com/p/get_project_limit_status?pro_id=${projectId}`;
    console.log('获取项目限制状态...');
    
    try {
      const limitResponse = await simpleFetch(limitStatusUrl);
      console.log('限制状态响应状态:', limitResponse.status);
    } catch (error) {
      console.log('获取限制状态失败:', error.message);
    }

    // 获取项目详细信息
    const timestamp = Date.now();
    const detailUrl = `https://zhongchou.modian.com/realtime/get_simple_product?jsonpcallback=jQuery${timestamp}&ids=${projectId}&if_all=1&_=${timestamp + 1}`;
    console.log('获取项目详情...');
    
    try {
      const detailResponse = await simpleFetch(detailUrl);
      console.log('详情响应状态:', detailResponse.status);
      
      if (detailResponse.ok) {
        const detailText = await detailResponse.text();
        console.log('响应长度:', detailText.length);
        
        // 解析JSONP响应
        // 支持两种格式：
        // 1. jQuery123456(data);
        // 2. window[decodeURIComponent('jQuery123456')]([data]);
        let jsonpMatch = detailText.match(/jQuery\d+\((.+)\);?$/);
        if (!jsonpMatch) {
          // 尝试匹配 window[decodeURIComponent('jQuery123456')]([data]); 格式
          jsonpMatch = detailText.match(/window\[decodeURIComponent\('jQuery\d+'\)\]\((.+)\);?$/);
        }
        if (jsonpMatch) {
          const projectsData = JSON.parse(jsonpMatch[1]);
          console.log('解析成功，项目数量:', projectsData.length);
          
          if (projectsData.length > 0) {
            const project = projectsData[0];
            console.log('项目信息:');
            console.log('- ID:', project.id);
            console.log('- 名称:', project.name);
            console.log('- 状态:', project.status);
            console.log('- 目标金额:', project.goal);
            console.log('- 已筹金额:', project.backer_money);
            console.log('- 支持人数:', project.backer_count);
          }
        } else {
          console.log('无法解析JSONP响应');
        }
      }
    } catch (error) {
      console.log('获取项目详情失败:', error.message);
    }

    console.log('\n测试完成！');
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 运行测试
testCrawler();
