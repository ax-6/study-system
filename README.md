# AI 学习助手

基于 AI Agent 的智能学习助手系统，帮助学生管理课程、作业、日程和成绩。

## 功能特性

- 📚 **课程表管理** - 查看和管理每周课程安排
- 📝 **作业管理** - 跟踪作业状态、截止日期和优先级
- 📅 **日程管理** - 管理待办事项和日程安排
- 📊 **成绩管理** - 查看和分析学习成绩
- 🤖 **AI 学习助手** - 与 AI 对话，获取学习帮助
- ⚙️ **个人设置** - 管理个人资料和应用设置

## 技术栈

- **前端框架**: Next.js 16 (App Router)
- **UI 组件**: shadcn/ui + Tailwind CSS
- **数据库**: Supabase (PostgreSQL)
- **AI 集成**: Vercel AI SDK + OpenAI
- **状态管理**: React Query
- **类型安全**: TypeScript

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd study-system
```

### 2. 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 3. 配置环境变量

复制 `.env.local.example` 文件为 `.env.local`，并填入你的配置：

```bash
cp .env.local.example .env.local
```

编辑 `.env.local` 文件，填入以下变量：

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI API Key (for AI chat)
OPENAI_API_KEY=your_openai_api_key
```

### 4. 运行开发服务器

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # AI 聊天 API
│   ├── dashboard/
│   │   ├── assignments/
│   │   │   └── page.tsx          # 作业管理页面
│   │   ├── chat/
│   │   │   └── page.tsx          # AI 聊天页面
│   │   ├── courses/
│   │   │   └── page.tsx          # 课程表页面
│   │   ├── grades/
│   │   │   └── page.tsx          # 成绩管理页面
│   │   ├── settings/
│   │   │   └── page.tsx          # 设置页面
│   │   ├── todos/
│   │   │   └── page.tsx          # 日程管理页面
│   │   ├── layout.tsx            # 仪表板布局
│   │   └── page.tsx              # 仪表板首页
│   ├── globals.css               # 全局样式
│   ├── layout.tsx                # 根布局
│   └── page.tsx                  # 首页（重定向到仪表板）
├── components/
│   ├── chat/
│   │   ├── action-card.tsx       # 操作卡片组件
│   │   ├── chat-input.tsx        # 聊天输入组件
│   │   └── chat-message.tsx      # 聊天消息组件
│   ├── providers/
│   │   └── query-provider.tsx    # React Query 提供者
│   ├── sidebar/
│   │   └── sidebar.tsx           # 侧边栏组件
│   └── ui/                       # UI 基础组件
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Supabase 客户端
│   │   └── server.ts             # Supabase 服务端
│   └── utils.ts                  # 工具函数
└── types/
    └── database.ts               # 数据库类型定义
```

## 数据库设置

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com/) 并创建一个新项目
2. 获取项目 URL 和 API 密钥

### 2. 创建数据库表

在 Supabase SQL 编辑器中运行以下 SQL：

```sql
-- 创建用户资料表
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  grade TEXT,
  major TEXT,
  learning_goals TEXT,
  schedule_preferences JSONB,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (id)
);

-- 创建课程表
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  instructor TEXT,
  location TEXT,
  day_of_week INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  color TEXT DEFAULT 'bg-blue-500',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 创建作业表
CREATE TABLE assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 创建待办事项表
CREATE TABLE todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT FALSE,
  source_type TEXT CHECK (source_type IN ('manual', 'assignment', 'course')) DEFAULT 'manual',
  source_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 创建成绩表
CREATE TABLE grades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  assignment_name TEXT,
  score NUMERIC NOT NULL,
  max_score NUMERIC NOT NULL,
  weight NUMERIC DEFAULT 100,
  type TEXT CHECK (type IN ('midterm', 'final', 'assignment', 'quiz', 'other')) DEFAULT 'other',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 创建 RLS 策略
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own courses" ON courses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own courses" ON courses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own courses" ON courses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own courses" ON courses
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own assignments" ON assignments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assignments" ON assignments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assignments" ON assignments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assignments" ON assignments
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own todos" ON todos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own todos" ON todos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own todos" ON todos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own todos" ON todos
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own grades" ON grades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own grades" ON grades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own grades" ON grades
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own grades" ON grades
  FOR DELETE USING (auth.uid() = user_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_updated_at
  BEFORE UPDATE ON grades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 部署

### 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com/) 中导入项目
3. 配置环境变量
4. 部署

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT
