/**
 * 众筹项目相关类型定义
 */

// 项目状态枚举
export enum ProjectStatus {
  CROWDFUNDING = '众筹中',
  SUCCESS = '成功',
  FAILED = '失败',
  PREPARING = '准备中',
}

// 回报档位信息
export interface RewardInfo {
  id: number;
  pro_id: number;
  title: string;
  money: string;
  rew_logo: string[];
  content: string;
  num: number;
  reward_day: string;
  if_address: string;
  if_show: number;
  back_count: number;
  if_note: number;
  if_early_bird: number;
  online_type: number;
  online_time: string;
  end_type: number;
  limit_per_user: number;
  app_money: string;
  vip_discount_money: number;
  vip_discount_num: number;
  charge_type: number;
  is_customized: number;
  online_unpack_type: number;
  is_related_reward: number;
  draw_card_id: number;
  is_favor_idea_reward: number;
  reward_pack_desc: any[];
  related_reward_desc: string;
  idea_favor_discount: string;
  status: number;
  max_total: number;
  online_remaining_time: string;
  name: string;
  reward_way: number;
  order_count?: number;
}

// 用户信息
export interface UserInfo {
  id: number;
  back_count: number;
  issue_count: string;
  auth_status: number;
  auth_cate: number;
}

// 原始项目数据（从API获取的完整数据）
export interface RawProjectData {
  id: number;
  pro_class: string;
  flag: string;
  slide: string;
  pro_type: number;
  user_id: number;
  name: string;
  short_title: string;
  top_title: string;
  list_num: number;
  top_sort: number;
  type_id: string;
  app_equip: string;
  first_figure: string;
  html_buttom: string;
  pro_tag: string;
  logo: string;
  logo2: string;
  vedio: string;
  all_time: string;
  used_time: string;
  province: string;
  city: string;
  town: string;
  if_installments: number;
  installments_level: number;
  install_money: string;
  star: number;
  des: string;
  logs: number;
  if_has_publisher: number;
  if_finance: number;
  if_show: number;
  category: string;
  content: string;
  risk: string;
  thanks_content: string;
  duration: number;
  goal: string;
  gift_words: string;
  failed_email: number;
  success_email: number;
  financing_type: number;
  moxi_post_id: number;
  order_post_id: number;
  process_status: number;
  back_count: number;
  backer_money: string;
  backer_count: number;
  update_count: number;
  comment_count: number;
  advert: string;
  source: string;
  report_warning: number;
  state: number;
  post_status: number;
  if_batch_refund: number;
  if_abnormal: number;
  display_status: number;
  wb_logo_1: string;
  wb_logo_2: string;
  comment_status: number;
  appeal_status: number;
  video_duration: number;
  if_hide_backer_info: number;
  teamfund_count: number;
  total_teamfund_count: number;
  cp_add_fans: number;
  related_subject: string;
  is_forbidden: number;
  ctime: string;
  examine_time: string;
  examine_time_idea: string;
  examine_modify_time: string;
  examine_modify_time_idea: string;
  start_time: string;
  end_time: string;
  online_time: string;
  upgrade_time: string;
  product_tags: string;
  if_communicate: number;
  communicater: string;
  is_archived: number;
  support_user_count: number;
  support_user_list: any;
  wb_logos: string[];
  urgent_notices_type: string;
  certificate_ccc_id: number;
  gratis_reward: any;
  reward_list: RewardInfo[];
  delay_online_rewards: string;
  backer_money_rew: string;
  mobile: string;
  status: string;
  user_info: UserInfo;
  rate: number;
  top_comment_count: number;
  recent_update_time: string;
  back_btn_name: string;
  fav: number;
  if_favor: number;
  if_subscribe: number;
  if_bullish: number;
  favor_count: number;
  bull_count: number;
  subscribe_count: number;
  login_user_id: number;
  user_backer_money: string;
  pro_status_card_html: string;
  status_desc: string;
}

// 清洗后的回报档位信息
export interface CleanRewardTier {
  id: number;
  title: string;
  price: number; // 价格（数字格式）
  original_price_str: string; // 原始价格字符串
  content: string;
  backer_count: number; // 支持人数
  max_total: number; // 最大支持数量，0表示无限制
  remaining_count: number; // 剩余数量
  is_limited: boolean; // 是否限量
  status: number; // 档位状态
  reward_day: string; // 发货时间
  if_show: number; // 是否显示
}

// 清洗后的项目核心数据
export interface CleanProjectData {
  // 基本信息
  id: number;
  name: string;
  short_title: string;
  category: string;
  user_id: number;

  // 时间信息
  create_time: string;
  start_time: string;
  end_time: string;
  online_time: string;

  // 众筹信息
  goal_amount: number;
  raised_amount: number;
  backer_count: number;
  completion_rate: number;
  status: ProjectStatus;

  // 互动数据
  comment_count: number;
  favor_count: number;
  subscribe_count: number;

  // 回报档位信息
  reward_tiers_count: number;
  reward_tiers: CleanRewardTier[]; // 详细的回报档位信息

  // 项目描述（简化）
  description: string;

  // 媒体资源
  logo: string;
  video: string;

  // 地理位置
  location: {
    province: string;
    city: string;
  };
}

// 项目版本记录
export interface ProjectVersion {
  project_id: number;
  version: number;
  crawl_time: string;
  data: CleanProjectData;
  raw_data?: RawProjectData; // 可选保存原始数据
}

// 项目索引信息
export interface ProjectIndex {
  project_id: number;
  name: string;
  category: string;
  status: ProjectStatus;
  first_crawl_time: string;
  last_crawl_time: string;
  version_count: number;
  file_path: string;
}

// 爬取任务配置
export interface CrawlTask {
  id: string;
  start_id?: number;
  end_id?: number;
  target_ids?: number[];
  delay: number;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
}

// 系统状态
export interface SystemStatus {
  is_running: boolean;
  current_task?: CrawlTask;
  total_projects: number;
  total_versions: number;
  last_crawl_time?: string;
  storage_info: {
    data_dir: string;
    total_size: number;
    file_count: number;
  };
}
