/**
 * 基础功能测试
 */

import { transformRawToClean, validateProjectData } from '../utils/dataTransform';
import { md5 } from '../utils/crypto';
import { getSign } from '../services/authService';

// 模拟原始项目数据
const mockRawData = {
  id: 114514,
  name: '测试项目',
  short_title: '测试项目简介',
  category: '科技',
  user_id: 12345,
  ctime: '2025-06-01 00:00:00',
  start_time: '2025-06-01 00:00:00',
  end_time: '2025-07-01 00:00:00',
  online_time: '2025-06-01 00:00:00',
  goal: '100000',
  backer_money: '75000',
  backer_count: 150,
  status: '众筹中',
  comment_count: 25,
  favor_count: 89,
  subscribe_count: 45,
  reward_list: [
    { id: 1, title: '早鸟价', money: '99' },
    { id: 2, title: '标准价', money: '199' }
  ],
  des: '<p>这是一个测试项目的描述</p>',
  logo: 'https://example.com/logo.jpg',
  logo2: 'https://example.com/logo2.jpg',
  vedio: 'https://example.com/video.mp4',
  province: '广东省',
  city: '深圳市',
  town: '',
  // 其他必需字段的默认值
  pro_class: '',
  flag: '',
  slide: '',
  pro_type: 0,
  list_num: 0,
  top_sort: 0,
  type_id: '',
  app_equip: '',
  first_figure: '',
  html_buttom: '',
  pro_tag: '',
  all_time: '',
  used_time: '',
  if_installments: 0,
  installments_level: 0,
  install_money: '',
  star: 0,
  logs: 0,
  if_has_publisher: 0,
  if_finance: 0,
  if_show: 0,
  content: '',
  risk: '',
  thanks_content: '',
  duration: 0,
  gift_words: '',
  failed_email: 0,
  success_email: 0,
  financing_type: 0,
  moxi_post_id: 0,
  order_post_id: 0,
  process_status: 0,
  back_count: 0,
  update_count: 0,
  advert: '',
  source: '',
  report_warning: 0,
  state: 0,
  post_status: 0,
  if_batch_refund: 0,
  if_abnormal: 0,
  display_status: 0,
  wb_logo_1: '',
  wb_logo_2: '',
  comment_status: 0,
  appeal_status: 0,
  video_duration: 0,
  if_hide_backer_info: 0,
  teamfund_count: 0,
  total_teamfund_count: 0,
  cp_add_fans: 0,
  related_subject: '',
  is_forbidden: 0,
  examine_time: '',
  examine_time_idea: '',
  examine_modify_time: '',
  examine_modify_time_idea: '',
  upgrade_time: '',
  product_tags: '',
  if_communicate: 0,
  communicater: '',
  is_archived: 0,
  support_user_count: 0,
  support_user_list: null,
  wb_logos: [],
  urgent_notices_type: '',
  certificate_ccc_id: 0,
  gratis_reward: null,
  delay_online_rewards: '',
  backer_money_rew: '',
  mobile: '',
  user_info: {
    id: 12345,
    back_count: 0,
    issue_count: '0',
    auth_status: 0,
    auth_cate: 0
  },
  rate: 0,
  top_comment_count: 0,
  recent_update_time: '',
  back_btn_name: '',
  fav: 0,
  if_favor: 0,
  if_subscribe: 0,
  if_bullish: 0,
  bull_count: 0,
  login_user_id: 0,
  user_backer_money: '',
  pro_status_card_html: '',
  status_desc: ''
};

function runTests() {
  console.log('🧪 开始运行基础功能测试...\n');

  // 测试1: MD5加密功能
  console.log('测试1: MD5加密功能');
  const testString = 'hello world';
  const expectedMd5 = '5d41402abc4b2a76b9719d911017c592';
  const actualMd5 = md5(testString);
  
  if (actualMd5 === expectedMd5) {
    console.log('✅ MD5加密测试通过');
  } else {
    console.log('❌ MD5加密测试失败');
    console.log(`期望: ${expectedMd5}`);
    console.log(`实际: ${actualMd5}`);
  }

  // 测试2: 数据转换功能
  console.log('\n测试2: 数据转换功能');
  try {
    const cleanData = transformRawToClean(mockRawData as any);
    
    if (cleanData.id === 114514 && 
        cleanData.name === '测试项目' &&
        cleanData.goal_amount === 100000 &&
        cleanData.raised_amount === 75000 &&
        cleanData.completion_rate === 75.0) {
      console.log('✅ 数据转换测试通过');
    } else {
      console.log('❌ 数据转换测试失败');
      console.log('转换结果:', cleanData);
    }
  } catch (error) {
    console.log('❌ 数据转换测试失败:', error.message);
  }

  // 测试3: 数据验证功能
  console.log('\n测试3: 数据验证功能');
  try {
    const cleanData = transformRawToClean(mockRawData as any);
    const isValid = validateProjectData(cleanData);

    if (isValid) {
      console.log('✅ 数据验证测试通过');
    } else {
      console.log('❌ 数据验证测试失败');
    }
  } catch (error) {
    console.log('❌ 数据验证测试失败:', error.message);
  }

  // 测试4: 项目状态判断功能
  console.log('\n测试4: 项目状态判断功能');

  // 测试4.1: 已结束且成功的项目（完成率>=100%）
  const successfulProject = {
    ...mockRawData,
    status: '众筹中', // 服务器错误地返回众筹中
    end_time: '2025-06-01 00:00:00', // 已经结束
    goal: '100000',
    backer_money: '120000' // 完成率120%
  };

  try {
    const cleanData = transformRawToClean(successfulProject as any);
    if (cleanData.status === '成功') {
      console.log('✅ 已结束成功项目状态判断正确');
    } else {
      console.log(`❌ 已结束成功项目状态判断错误，期望: 成功，实际: ${cleanData.status}`);
    }
  } catch (error) {
    console.log('❌ 已结束成功项目状态判断测试失败:', error.message);
  }

  // 测试4.2: 已结束但失败的项目（完成率<100%）
  const failedProject = {
    ...mockRawData,
    status: '众筹中', // 服务器错误地返回众筹中
    end_time: '2025-06-01 00:00:00', // 已经结束
    goal: '100000',
    backer_money: '50000' // 完成率50%
  };

  try {
    const cleanData = transformRawToClean(failedProject as any);
    if (cleanData.status === '失败') {
      console.log('✅ 已结束失败项目状态判断正确');
    } else {
      console.log(`❌ 已结束失败项目状态判断错误，期望: 失败，实际: ${cleanData.status}`);
    }
  } catch (error) {
    console.log('❌ 已结束失败项目状态判断测试失败:', error.message);
  }

  // 测试4.3: 仍在进行中的项目
  const ongoingProject = {
    ...mockRawData,
    status: '众筹中',
    end_time: '2025-12-31 23:59:59', // 未来时间
    goal: '100000',
    backer_money: '75000'
  };

  try {
    const cleanData = transformRawToClean(ongoingProject as any);
    if (cleanData.status === '众筹中') {
      console.log('✅ 进行中项目状态判断正确');
    } else {
      console.log(`❌ 进行中项目状态判断错误，期望: 众筹中，实际: ${cleanData.status}`);
    }
  } catch (error) {
    console.log('❌ 进行中项目状态判断测试失败:', error.message);
  }

  // 测试4.4: 服务器明确返回成功状态
  const serverSuccessProject = {
    ...mockRawData,
    status: '成功',
    end_time: '2025-06-01 00:00:00',
    goal: '100000',
    backer_money: '120000'
  };

  try {
    const cleanData = transformRawToClean(serverSuccessProject as any);
    if (cleanData.status === '成功') {
      console.log('✅ 服务器明确成功状态判断正确');
    } else {
      console.log(`❌ 服务器明确成功状态判断错误，期望: 成功，实际: ${cleanData.status}`);
    }
  } catch (error) {
    console.log('❌ 服务器明确成功状态判断测试失败:', error.message);
  }

  // 测试4: API签名功能
  console.log('\n测试4: API签名功能');
  try {
    const url = '/api/test';
    const authInfo = getSign(url, 'GET', {});
    
    if (authInfo.sign && authInfo.mt && authInfo.requestUrl) {
      console.log('✅ API签名测试通过');
      console.log(`签名长度: ${authInfo.sign.length}`);
      console.log(`时间戳: ${authInfo.mt}`);
    } else {
      console.log('❌ API签名测试失败');
      console.log('签名信息:', authInfo);
    }
  } catch (error) {
    console.log('❌ API签名测试失败:', error.message);
  }

  console.log('\n🎉 基础功能测试完成！');
}

// 运行测试
runTests();
