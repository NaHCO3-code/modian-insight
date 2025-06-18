/**
 * 数据转换工具
 */

import { RawProjectData, CleanProjectData, ProjectStatus, CleanRewardTier, RewardInfo } from '../types/modian';

/**
 * 转换回报档位数据
 */
function transformRewardTiers(rewardList: RewardInfo[]): CleanRewardTier[] {
  if (!rewardList || !Array.isArray(rewardList)) {
    return [];
  }

  return rewardList.map(reward => {
    // 解析价格
    const parsePrice = (priceStr: string): number => {
      if (!priceStr) return 0;
      const cleaned = priceStr.replace(/[^\d.]/g, '');
      return parseFloat(cleaned) || 0;
    };

    const price = parsePrice(reward.money || reward.app_money || '0');
    const maxTotal = reward.max_total || 0;
    const backerCount = reward.back_count || 0;
    const remainingCount = maxTotal > 0 ? Math.max(0, maxTotal - backerCount) : 0;

    return {
      id: reward.id,
      title: reward.title || reward.name || '',
      price: price,
      original_price_str: reward.money || reward.app_money || '0',
      content: reward.content || '',
      backer_count: backerCount,
      max_total: maxTotal,
      remaining_count: remainingCount,
      is_limited: maxTotal > 0,
      status: reward.status || 0,
      reward_day: reward.reward_day || '',
      if_show: reward.if_show || 0,
    };
  }).filter(tier => tier.if_show === 1); // 只保留显示的档位
}

/**
 * 将原始项目数据转换为清洗后的数据
 */
export function transformRawToClean(raw: RawProjectData): CleanProjectData {
  // 解析金额字符串为数字
  const parseAmount = (amountStr: string): number => {
    if (!amountStr) return 0;
    // 移除逗号和其他非数字字符，保留小数点
    const cleaned = amountStr.replace(/[^\d.]/g, '');
    return parseFloat(cleaned) || 0;
  };

  // 确定项目状态（综合考虑原始状态、时间和完成率）
  const determineStatus = (statusStr: string, endTime: string, completionRate: number): ProjectStatus => {
    // 如果服务器明确返回成功或失败状态，优先使用
    if (statusStr === '成功') {
      return ProjectStatus.SUCCESS;
    }
    if (statusStr === '失败') {
      return ProjectStatus.FAILED;
    }
    if (statusStr === '准备中') {
      return ProjectStatus.PREPARING;
    }

    // 对于"众筹中"状态，需要根据结束时间和完成率进行二次判断
    // 因为服务端返回的状态可能不准确，已结束的项目仍可能显示为"众筹中"
    if (statusStr === '众筹中' || !statusStr) {
      // 检查项目是否已经结束
      if (endTime) {
        const endDate = parseEndTime(endTime);
        const now = new Date();

        if (endDate && endDate < now) {
          // 项目已结束，根据完成率判断最终状态
          const finalStatus = completionRate >= 100 ? ProjectStatus.SUCCESS : ProjectStatus.FAILED;
          console.log(`项目 ${raw.id} 已结束，服务器状态: ${statusStr}, 实际状态: ${finalStatus}, 完成率: ${completionRate.toFixed(2)}%`);
          return finalStatus;
        }
      }

      // 项目还在进行中
      return ProjectStatus.CROWDFUNDING;
    }

    // 对于其他未知状态，默认为众筹中
    console.warn(`未知的项目状态: ${statusStr}，默认为众筹中`);
    return ProjectStatus.CROWDFUNDING;
  };

  // 解析结束时间的辅助函数
  const parseEndTime = (endTimeStr: string): Date | null => {
    if (!endTimeStr) return null;

    try {
      // 处理多种可能的时间格式
      let timeStr = endTimeStr.trim();

      // 如果时间格式是 "YYYY-MM-DD HH:mm:ss"，转换为 ISO 格式
      if (timeStr.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
        timeStr = timeStr.replace(' ', 'T');
      }

      // 如果没有时区信息，添加本地时区（中国时区）
      if (!timeStr.includes('T')) {
        timeStr = timeStr + 'T00:00:00';
      }
      if (!timeStr.includes('+') && !timeStr.includes('Z')) {
        timeStr = timeStr + '+08:00';
      }

      const date = new Date(timeStr);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      console.warn(`解析结束时间失败: ${endTimeStr}`, error);
      return null;
    }
  };

  // 计算完成率
  const goalAmount = parseAmount(raw.goal);
  const raisedAmount = parseAmount(raw.backer_money);
  const completionRate = goalAmount > 0 ? (raisedAmount / goalAmount) * 100 : 0;

  // 清理HTML内容，提取纯文本描述
  const cleanDescription = (htmlContent: string): string => {
    if (!htmlContent) return '';
    // 简单的HTML标签移除，实际项目中可能需要更复杂的处理
    return htmlContent
      .replace(/<[^>]*>/g, '') // 移除HTML标签
      .replace(/\s+/g, ' ') // 合并多个空白字符
      .trim()
      .substring(0, 500); // 限制长度
  };

  // 处理回报档位数据
  const rewardTiers = transformRewardTiers(raw.reward_list || []);

  return {
    id: raw.id,
    name: raw.name || '',
    short_title: raw.short_title || '',
    category: raw.category || '',
    user_id: raw.user_id,

    create_time: raw.ctime || '',
    start_time: raw.start_time || '',
    end_time: raw.end_time || '',
    online_time: raw.online_time || '',

    goal_amount: goalAmount,
    raised_amount: raisedAmount,
    backer_count: raw.backer_count || 0,
    completion_rate: Math.round(completionRate * 100) / 100, // 保留两位小数
    status: determineStatus(raw.status, raw.end_time || '', completionRate),

    comment_count: raw.comment_count || 0,
    favor_count: raw.favor_count || 0,
    subscribe_count: raw.subscribe_count || 0,

    reward_tiers_count: rewardTiers.length,
    reward_tiers: rewardTiers,

    description: cleanDescription(raw.des || raw.content || ''),

    logo: raw.logo2 || raw.logo || '',
    video: raw.vedio || '',

    location: {
      province: raw.province || '',
      city: raw.city || '',
    },
  };
}

/**
 * 验证项目数据的完整性
 */
export function validateProjectData(data: CleanProjectData): boolean {
  // 基本字段验证
  if (!data.id || !data.name) {
    return false;
  }

  // 数值字段验证
  if (data.goal_amount < 0 || data.raised_amount < 0 || data.backer_count < 0) {
    return false;
  }

  // 时间字段验证（简单检查格式）
  const timeFields = [data.create_time, data.start_time, data.end_time, data.online_time];
  for (const timeField of timeFields) {
    if (timeField && !isValidTimeString(timeField)) {
      return false;
    }
  }

  return true;
}

/**
 * 检查时间字符串是否有效
 */
function isValidTimeString(timeStr: string): boolean {
  if (!timeStr) return true; // 空字符串被认为是有效的
  
  // 检查是否符合 YYYY-MM-DD HH:mm:ss 格式
  const timeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  if (!timeRegex.test(timeStr)) {
    return false;
  }

  // 检查是否是有效日期
  const date = new Date(timeStr);
  return !isNaN(date.getTime());
}

/**
 * 比较两个项目数据，返回变化的字段
 */
export function compareProjectData(
  oldData: CleanProjectData,
  newData: CleanProjectData
): Partial<CleanProjectData> {
  const changes: any = {};

  // 比较所有字段
  const keys = Object.keys(newData) as Array<keyof CleanProjectData>;

  for (const key of keys) {
    const oldValue = oldData[key];
    const newValue = newData[key];

    // 深度比较对象
    if (typeof oldValue === 'object' && typeof newValue === 'object') {
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[key] = newValue;
      }
    } else if (oldValue !== newValue) {
      changes[key] = newValue;
    }
  }

  return changes;
}

/**
 * 检查项目数据是否有显著变化（用于决定是否需要保存新版本）
 */
export function hasSignificantChanges(changes: Partial<CleanProjectData>): boolean {
  // 定义显著变化的字段
  const significantFields: Array<keyof CleanProjectData> = [
    'raised_amount',
    'backer_count',
    'completion_rate',
    'status',
    'comment_count',
    'favor_count',
    'subscribe_count',
    'reward_tiers_count',
    'reward_tiers',
  ];

  return significantFields.some(field => field in changes);
}
