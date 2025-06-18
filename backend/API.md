# Modian Insight API 文档

## 概述

Modian Insight 提供了一套完整的 RESTful API，用于管理和查询众筹项目数据。系统支持批量爬取、数据存储、版本控制和灵活查询。

**基础信息:**
- 基础URL: `http://localhost:3000`
- API版本: v1.0.0
- 数据格式: JSON
- 字符编码: UTF-8

## 通用响应格式

所有API响应都遵循统一的格式：

```json
{
  "success": true,
  "message": "操作成功",
  "data": {},
  "timestamp": "2025-06-18T12:00:00.000Z"
}
```

错误响应格式：
```json
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误信息",
  "timestamp": "2025-06-18T12:00:00.000Z"
}
```

## 系统管理 API

### 1. 获取系统状态

**接口:** `GET /api/system/status`

**描述:** 获取系统当前运行状态和统计信息

**响应示例:**
```json
{
  "success": true,
  "message": "获取系统状态成功",
  "data": {
    "is_running": false,
    "current_task": null,
    "total_projects": 1250,
    "total_versions": 3420,
    "last_crawl_time": "2025-06-18T10:30:00.000Z",
    "storage_info": {
      "data_dir": "./data",
      "total_size": 52428800,
      "file_count": 1250
    }
  },
  "timestamp": "2025-06-18T12:00:00.000Z"
}
```

### 2. 健康检查

**接口:** `GET /api/system/health`

**描述:** 检查系统健康状态

**响应示例:**
```json
{
  "success": true,
  "message": "系统健康",
  "data": {
    "status": "healthy",
    "timestamp": "2025-06-18T12:00:00.000Z",
    "uptime": 3600.5,
    "memory": {
      "rss": 45678592,
      "heapTotal": 20971520,
      "heapUsed": 15728640,
      "external": 1048576
    },
    "storage": {
      "totalProjects": 1250,
      "totalVersions": 3420,
      "totalSize": 52428800,
      "fileCount": 1250
    }
  },
  "timestamp": "2025-06-18T12:00:00.000Z"
}
```

### 3. 获取统计信息

**接口:** `GET /api/system/stats`

**描述:** 获取详细的系统统计信息

**响应示例:**
```json
{
  "success": true,
  "message": "获取统计信息成功",
  "data": {
    "total_projects": 1250,
    "by_status": {
      "众筹中": 320,
      "成功": 680,
      "失败": 200,
      "准备中": 50
    },
    "by_category": {
      "科技": 450,
      "设计": 320,
      "游戏": 280,
      "出版": 200
    },
    "most_popular_categories": [
      {"category": "科技", "count": 450},
      {"category": "设计", "count": 320}
    ],
    "recent_activity": [
      {
        "date": "2025-06-18",
        "new_projects": 15,
        "completed_projects": 8
      }
    ]
  },
  "timestamp": "2025-06-18T12:00:00.000Z"
}
```

### 4. 清理过期数据

**接口:** `POST /api/system/cleanup`

**描述:** 清理指定天数前的过期数据

**请求参数:**
```json
{
  "retention_days": 30
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "成功清理 30 天前的数据",
  "timestamp": "2025-06-18T12:00:00.000Z"
}
```

## 爬虫控制 API

### 1. 控制爬虫

**接口:** `POST /api/crawler/control`

**描述:** 控制爬虫的启动、停止、暂停和恢复

**请求参数:**

启动爬虫：
```json
{
  "action": "start",
  "config": {
    "start_id": 100000,
    "end_id": 100100,
    "delay": 1000
  }
}
```

或者指定具体ID列表：
```json
{
  "action": "start",
  "config": {
    "target_ids": [114514, 123456, 789012],
    "delay": 1500
  }
}
```

停止爬虫：
```json
{
  "action": "stop"
}
```

暂停爬虫：
```json
{
  "action": "pause"
}
```

恢复爬虫：
```json
{
  "action": "resume"
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "爬虫start操作成功",
  "data": {
    "task_id": "task_1718712000000_abc123def"
  },
  "timestamp": "2025-06-18T12:00:00.000Z"
}
```

### 2. 获取当前任务状态

**接口:** `GET /api/crawler/task`

**描述:** 获取当前爬取任务的详细状态

**响应示例:**
```json
{
  "success": true,
  "message": "获取当前任务成功",
  "data": {
    "id": "task_1718712000000_abc123def",
    "start_id": 100000,
    "end_id": 100100,
    "delay": 1000,
    "status": "running",
    "created_at": "2025-06-18T12:00:00.000Z",
    "started_at": "2025-06-18T12:00:05.000Z",
    "progress": {
      "total": 101,
      "completed": 45,
      "failed": 3
    }
  },
  "timestamp": "2025-06-18T12:00:00.000Z"
}
```

### 3. 获取爬虫配置

**接口:** `GET /api/crawler/config`

**描述:** 获取爬虫的配置参数

**响应示例:**
```json
{
  "success": true,
  "message": "获取爬虫配置成功",
  "data": {
    "default_delay": 1000,
    "min_delay": 500,
    "max_delay": 5000,
    "concurrency": 1,
    "max_retries": 3,
    "timeout": 30000
  },
  "timestamp": "2025-06-18T12:00:00.000Z"
}
```

### 4. 测试爬取单个项目

**接口:** `GET /api/crawler/test/:project_id`

**描述:** 测试爬取指定的单个项目

**路径参数:**
- `project_id`: 项目ID (数字)

**查询参数:**
- `save`: 是否保存测试数据 (true/false，默认false)

**示例:** `GET /api/crawler/test/114514?save=true`

**响应示例:**
```json
{
  "success": true,
  "message": "测试爬取成功",
  "data": {
    "id": 114514,
    "name": "测试项目",
    "category": "科技",
    "status": "众筹中",
    "goal_amount": 100000,
    "raised_amount": 75000,
    "backer_count": 150,
    "completion_rate": 75.0,
    "comment_count": 25,
    "favor_count": 89,
    "subscribe_count": 45
  },
  "timestamp": "2025-06-18T12:00:00.000Z"
}
```

## 项目数据 API

### 1. 获取项目列表

**接口:** `GET /api/projects`

**描述:** 获取项目列表，支持分页和过滤

**查询参数:**
- `page`: 页码 (默认1)
- `limit`: 每页数量 (默认20，最大100)
- `category`: 项目分类
- `status`: 项目状态
- `start_date`: 开始日期 (YYYY-MM-DD)
- `end_date`: 结束日期 (YYYY-MM-DD)
- `sort_by`: 排序字段 (name/category/status/first_crawl_time/last_crawl_time)
- `sort_order`: 排序方向 (asc/desc，默认desc)
- `keyword`: 搜索关键词

**示例:** `GET /api/projects?page=1&limit=10&category=科技&status=众筹中&sort_by=last_crawl_time`

**响应示例:**
```json
{
  "success": true,
  "message": "获取项目列表成功",
  "data": {
    "items": [
      {
        "project_id": 114514,
        "name": "智能手表项目",
        "category": "科技",
        "status": "众筹中",
        "first_crawl_time": "2025-06-15T10:00:00.000Z",
        "last_crawl_time": "2025-06-18T12:00:00.000Z",
        "version_count": 5,
        "file_path": "./data/projects/11/45/14/114514.json"
      }
    ],
    "total": 1250,
    "page": 1,
    "limit": 10,
    "total_pages": 125
  },
  "timestamp": "2025-06-18T12:00:00.000Z"
}
```

### 2. 获取项目详情

**接口:** `GET /api/projects/:project_id`

**描述:** 获取指定项目的最新版本详细信息

**路径参数:**
- `project_id`: 项目ID

**响应示例:**
```json
{
  "success": true,
  "message": "获取项目详情成功",
  "data": {
    "project_id": 114514,
    "version": 5,
    "crawl_time": "2025-06-18T12:00:00.000Z",
    "data": {
      "id": 114514,
      "name": "智能手表项目",
      "short_title": "革命性智能手表",
      "category": "科技",
      "user_id": 12345,
      "create_time": "2025-06-01T00:00:00.000Z",
      "start_time": "2025-06-01T00:00:00.000Z",
      "end_time": "2025-07-01T00:00:00.000Z",
      "online_time": "2025-06-01T00:00:00.000Z",
      "goal_amount": 100000,
      "raised_amount": 75000,
      "backer_count": 150,
      "completion_rate": 75.0,
      "status": "众筹中",
      "comment_count": 25,
      "favor_count": 89,
      "subscribe_count": 45,
      "reward_tiers_count": 5,
      "description": "这是一款革命性的智能手表...",
      "logo": "https://example.com/logo.jpg",
      "video": "https://example.com/video.mp4",
      "location": {
        "province": "广东省",
        "city": "深圳市"
      }
    }
  },
  "timestamp": "2025-06-18T12:00:00.000Z"
}
```

### 3. 获取项目版本历史

**接口:** `GET /api/projects/:project_id/versions`

**描述:** 获取指定项目的所有版本历史

**路径参数:**
- `project_id`: 项目ID

**查询参数:**
- `page`: 页码 (默认1)
- `limit`: 每页数量 (默认20)
- `start_date`: 开始日期
- `end_date`: 结束日期

**响应示例:**
```json
{
  "success": true,
  "message": "获取项目版本历史成功",
  "data": {
    "items": [
      {
        "project_id": 114514,
        "version": 5,
        "crawl_time": "2025-06-18T12:00:00.000Z",
        "data": {
          "raised_amount": 75000,
          "backer_count": 150,
          "completion_rate": 75.0
        }
      },
      {
        "project_id": 114514,
        "version": 4,
        "crawl_time": "2025-06-17T12:00:00.000Z",
        "data": {
          "raised_amount": 68000,
          "backer_count": 142,
          "completion_rate": 68.0
        }
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 20,
    "total_pages": 1
  },
  "timestamp": "2025-06-18T12:00:00.000Z"
}
```

### 4. 获取项目分类列表

**接口:** `GET /api/projects/categories`

**描述:** 获取所有项目分类列表

**响应示例:**
```json
{
  "success": true,
  "message": "获取分类列表成功",
  "data": [
    "科技",
    "设计",
    "游戏",
    "出版",
    "艺术",
    "音乐"
  ],
  "timestamp": "2025-06-18T12:00:00.000Z"
}
```

### 5. 搜索项目

**接口:** `GET /api/projects/search`

**描述:** 根据关键词搜索项目

**查询参数:**
- `keyword`: 搜索关键词 (必需)
- `category`: 项目分类 (可选)
- `status`: 项目状态 (可选)

**示例:** `GET /api/projects/search?keyword=智能&category=科技`

**响应示例:**
```json
{
  "success": true,
  "message": "搜索项目成功",
  "data": [
    {
      "project_id": 114514,
      "name": "智能手表项目",
      "category": "科技",
      "status": "众筹中"
    }
  ],
  "timestamp": "2025-06-18T12:00:00.000Z"
}
```

## 错误码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 使用示例

### 启动爬虫任务

```bash
curl -X POST http://localhost:3000/api/crawler/control \
  -H "Content-Type: application/json" \
  -d '{
    "action": "start",
    "config": {
      "start_id": 100000,
      "end_id": 100010,
      "delay": 1000
    }
  }'
```

### 查询项目列表

```bash
curl "http://localhost:3000/api/projects?page=1&limit=5&category=科技"
```

### 获取项目详情

```bash
curl "http://localhost:3000/api/projects/114514"
```

## 注意事项

1. **请求频率限制**: 建议爬取间隔不少于500毫秒
2. **数据存储**: 系统会自动去重，只有数据发生显著变化时才会保存新版本
3. **文件存储**: 数据按项目ID分层存储，避免单目录文件过多
4. **版本控制**: 每个项目的历史版本都会保留，支持数据对比和趋势分析
