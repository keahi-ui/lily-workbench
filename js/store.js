/* ============================================
   数据层 - Store.js
   12个数据库 schema + CRUD 操作
   使用 localStorage 持久化
   ============================================ */

const Store = {
  // 存储前缀
  prefix: 'wb_',

  // ---------- 数据库 Schema 定义 ----------
  schemas: {
    // 数据库 1：每日打卡库
    daily_checkin: {
      label: '每日打卡库',
      titleField: 'date',
      fields: [
        { name: 'date', label: '日期', type: 'title', inputType: 'date', note: '格式 YYYY-MM-DD' },
        { name: 'hearing_done', label: '✅ 每日听力', type: 'checkbox' },
        { name: 'hearing_note', label: '🎧 听力备注', type: 'text' },
        { name: 'reading_done', label: '✅ 每日阅读', type: 'checkbox' },
        { name: 'reading_note', label: '📖 阅读备注', type: 'text' },
        { name: 'speaking_done', label: '✅ 口语练习', type: 'checkbox' },
        { name: 'speaking_note', label: '🗣️ 口语备注', type: 'text' },
        { name: 'exercise_done', label: '✅ 运动', type: 'checkbox', note: '任意运动完成即勾' },
        { name: 'morning_meds', label: '💊 上午吃药', type: 'checkbox' },
        { name: 'afternoon_meds', label: '💊 下午吃药', type: 'checkbox' },
        { name: 'water_1', label: '☀️ 起床空腹 250ml', type: 'checkbox', note: '温白开水，唤醒肠胃' },
        { name: 'water_2', label: '🕙 上午 10:00 250ml', type: 'checkbox' },
        { name: 'water_3', label: '🍚 午饭前 200ml', type: 'checkbox', note: '增加饱腹感' },
        { name: 'water_4', label: '🍵 午饭后 1h 200ml', type: 'checkbox' },
        { name: 'water_5', label: '😴 下午 15:30 250ml', type: 'checkbox', note: '缓解犯困' },
        { name: 'water_6', label: '🍜 晚饭前 200ml', type: 'checkbox' },
        { name: 'water_7', label: '🛀 晚饭后 1h 200ml', type: 'checkbox' },
        { name: 'water_8', label: '🌙 睡前 1.5h 150ml', type: 'checkbox' },
        { name: 'xiaomi_signin', label: '🎵 小米视频签到', type: 'checkbox', note: '薅羊毛' },
        { name: 'netease_signin', label: '☁️ 网易云云贝签到', type: 'checkbox' },
        { name: 'browser_signin', label: '🌐 小米浏览器签到', type: 'checkbox' },
        { name: 'wallet_signin', label: '💰 小米钱包签到', type: 'checkbox' },
        { name: 'skincare_morning', label: '☀️ 晨间护肤', type: 'checkbox' },
        { name: 'skincare_evening', label: '🌙 晚间护肤', type: 'checkbox' },
        { name: 'blackhead_done', label: '🖤 去黑头护理', type: 'checkbox' },
        { name: 'praise', label: '🌸 今日夸夸', type: 'longtext', note: '每天写一句肯定自己的话' },
        { name: 'mood', label: '😊 今日心情', type: 'select', options: ['🌟超棒', '😌平静', '😴疲惫', '😢难过', '😰焦虑'] },
        { name: 'notes', label: '📝 备注', type: 'text', note: '其他想记录的任何内容' },
      ]
    },

    // 数据库 2：英语学习素材库
    english_learning: {
      label: '英语学习素材库',
      titleField: 'title',
      fields: [
        { name: 'date', label: '日期', type: 'date' },
        { name: 'type', label: '类型', type: 'select', options: ['口语', '听力', '阅读'] },
        { name: 'title', label: '标题', type: 'title' },
        { name: 'link', label: '素材链接', type: 'url' },
        { name: 'notes', label: '笔记', type: 'longtext' },
      ]
    },

    // 数据库 3：运动视频库
    exercise_videos: {
      label: '运动视频库',
      titleField: 'title',
      fields: [
        { name: 'title', label: '视频标题', type: 'title' },
        { name: 'platform', label: '平台', type: 'select', options: ['抖音', '哔哩哔哩'] },
        { name: 'link', label: '链接', type: 'url' },
        { name: 'duration', label: '时长', type: 'text', note: '例如 10min' },
        { name: 'category', label: '训练分类', type: 'multiselect', options: ['减脂塑型', '背部', '腰部', '护肤', '其他'] },
      ]
    },

    // 数据库 4：影视音清单库
    media_list: {
      label: '影视音清单库',
      titleField: 'name',
      fields: [
        { name: 'name', label: '名称', type: 'title' },
        { name: 'category', label: '类别', type: 'select', options: ['电影', '剧集', '音乐专辑', '阅读'] },
        { name: 'status', label: '状态', type: 'select', options: ['想看', '在听', '在读', '已看', '已听', '已读'] },
        { name: 'rating', label: '评分', type: 'number', note: '可输入小数如 4.5' },
        { name: 'watched_date', label: '观看/阅读日期', type: 'date' },
        { name: 'note', label: '一句话笔记', type: 'text' },
        { name: 'related_note', label: '关联笔记', type: 'relation', relationDb: 'reading_notes', note: '仅当类别为"阅读"时使用' },
      ]
    },

    // 数据库 5：阅读笔记库
    reading_notes: {
      label: '阅读笔记库',
      titleField: 'note_title',
      fields: [
        { name: 'book_name', label: '书名', type: 'relation', relationDb: 'media_list' },
        { name: 'note_title', label: '笔记标题', type: 'title' },
        { name: 'excerpt', label: '摘抄/思考', type: 'longtext' },
        { name: 'page_chapter', label: '页码/章节', type: 'text' },
        { name: 'created_date', label: '创建日期', type: 'date' },
      ]
    },

    // 数据库 6：TodoList 库
    todo_list: {
      label: 'TodoList 库',
      titleField: 'task_name',
      fields: [
        { name: 'task_name', label: '任务名称', type: 'title' },
        { name: 'domain', label: '所属类别', type: 'select', options: ['英语学习', '观影', '阅读', '灵感执行', '生活', '追星', '身体护理', '购物', '工作', '学习'] },
        { name: 'deadline', label: '截止日期', type: 'date' },
        { name: 'priority', label: '优先级', type: 'select', options: ['高', '中', '低'] },
        { name: 'completed', label: '已完成', type: 'checkbox' },
        { name: 'notes', label: '备注', type: 'text', note: '补充说明、链接、细节等' },
        { name: 'related_inspiration', label: '关联灵感', type: 'relation', relationDb: 'inspiration' },
      ]
    },

    // 数据库 7：灵感记录库
    inspiration: {
      label: '灵感记录库',
      titleField: 'title',
      fields: [
        { name: 'title', label: '灵感标题', type: 'title' },
        { name: 'category', label: '分类', type: 'select', options: ['特效制作灵感', '剪辑灵感'] },
        { name: 'description', label: '详细描述', type: 'longtext' },
        { name: 'reference', label: '参考素材', type: 'text', note: '可附上参考图或视频链接' },
        { name: 'converted', label: '是否已转化', type: 'checkbox', note: '若已生成 Todo 任务则打勾' },
      ]
    },

    // 数据库 8：身体记录库
    body_records: {
      label: '身体记录库',
      titleField: 'date',
      fields: [
        { name: 'date', label: '日期', type: 'title', inputType: 'date' },
        { name: 'weight', label: '体重(kg)', type: 'number' },
        { name: 'period_status', label: '经期状态', type: 'select', options: ['来了', '经期中', '排卵期', '黄体期', '结束了', '无'] },
        { name: 'period_flow', label: '经血量', type: 'select', options: ['少', '中', '多'] },
        { name: 'period_color', label: '经血颜色', type: 'select', options: ['鲜红', '暗红', '褐色', '粉色'] },
        { name: 'period_pain', label: '痛经程度', type: 'select', options: ['无', '轻度', '中度', '严重'] },
        { name: 'period_symptoms', label: '伴随症状', type: 'multiselect', options: ['腰酸', '头痛', '腹胀', '恶心', '疲劳', '情绪波动', '胸胀', '无'] },
        { name: 'temperature', label: '体温(°C)', type: 'number', note: '基础体温，精确到0.1' },
        { name: 'pain_location', label: '疼痛部位', type: 'text', note: '如"肩颈"、"腰部"' },
        { name: 'pain_level', label: '疼痛程度', type: 'number', note: '1-5 分，1为轻微，5为严重' },
        { name: 'sex', label: '性生活', type: 'select', options: ['有', '无'] },
        { name: 'medication', label: '用药情况', type: 'text', note: '如"布洛芬"' },
        { name: 'notes', label: '备注', type: 'longtext', note: '可记录睡眠、情绪等' },
      ]
    },

    // 数据库 9：记账库
    accounting: {
      label: '记账库',
      titleField: 'item',
      fields: [
        { name: 'date', label: '日期', type: 'date' },
        { name: 'item', label: '项目', type: 'title' },
        { name: 'amount', label: '金额', type: 'number' },
        { name: 'type', label: '收支类型', type: 'select', options: ['支出', '收入'] },
        { name: 'category', label: '分类', type: 'select', options: ['餐饮', '购物', '交通', '娱乐', '还款', '其他'] },
        { name: 'account', label: '账户', type: 'select', options: ['花呗', '抖音月付', '银行卡', '微信', '支付宝', '现金'] },
        { name: 'debt_status', label: '欠款状态', type: 'select', options: ['未还', '已还'], note: '仅用于花呗、抖音月付等超前消费账户' },
        { name: 'notes', label: '备注', type: 'text' },
      ]
    },

    // 数据库 10：追星演出追踪库
    star_tracking: {
      label: '追星演出追踪库',
      titleField: 'show_name',
      fields: [
        { name: 'artist', label: '艺人', type: 'select', options: ['安溥', '毛不易'] },
        { name: 'show_name', label: '演出名称', type: 'title' },
        { name: 'show_type', label: '演出类型', type: 'select', options: ['专场', '音乐节', '拼盘'] },
        { name: 'show_date', label: '演出日期', type: 'date' },
        { name: 'city', label: '演出城市', type: 'text' },
        { name: 'venue', label: '场馆', type: 'text' },
        { name: 'status', label: '状态', type: 'select', options: ['想看', '已购票', '去过', '已过期'] },
        { name: 'ticket_date', label: '抢票日期', type: 'date', note: '需要设置提醒的关键字段' },
        { name: 'ticket_platform', label: '抢票平台', type: 'text', note: '如大麦、秀动' },
        { name: 'ticket_price', label: '票档价格', type: 'text' },
        { name: 'source', label: '信息来源', type: 'text', note: '自动抓取来源' },
        { name: 'notes', label: '备注', type: 'text' },
      ]
    },

    // 数据库 11：愿望清单库
    wishlist: {
      label: '愿望清单库',
      titleField: 'item_name',
      fields: [
        { name: 'item_name', label: '物品名称', type: 'title' },
        { name: 'category', label: '分类', type: 'select', options: ['数码', '美妆', '服饰', '书籍', '家居', '食品', '其他'] },
        { name: 'price', label: '价格', type: 'number' },
        { name: 'link', label: '链接', type: 'url' },
        { name: 'priority', label: '优先级', type: 'select', options: ['很想要', '一般', '不急'] },
        { name: 'purchased', label: '是否已购买', type: 'checkbox' },
        { name: 'notes', label: '备注', type: 'text', note: '颜色、型号、心动理由' },
      ]
    },

    // 数据库 12：周复盘库
    weekly_review: {
      label: '周复盘库',
      titleField: 'week',
      fields: [
        { name: 'week', label: '周次', type: 'title', note: '如 2026年第31周' },
        { name: 'completed', label: '✅ 完成了什么', type: 'longtext' },
        { name: 'problems', label: '⚠️ 问题与阻碍', type: 'longtext' },
        { name: 'improvements', label: '💡 下周改进', type: 'longtext' },
        { name: 'highlights', label: '🌟 高光时刻', type: 'longtext' },
        { name: 'notes', label: '备注', type: 'text' },
      ]
    },

    // 数据库 13：英语学习网站库
    english_sites: {
      label: '英语学习网站',
      titleField: 'name',
      fields: [
        { name: 'name', label: '网站名称', type: 'title' },
        { name: 'url', label: '网址', type: 'url' },
        { name: 'desc', label: '功能说明', type: 'text' },
        { name: 'icon', label: '图标', type: 'text', note: 'Emoji 图标，如 📖' },
      ]
    },

    // 数据库 14：日记库
    diary: {
      label: '日记库',
      titleField: 'date',
      fields: [
        { name: 'date', label: '日期', type: 'title', inputType: 'date' },
        { name: 'title', label: '标题', type: 'text', note: '今天的主题' },
        { name: 'content', label: '日记内容', type: 'longtext' },
        { name: 'mood', label: '心情', type: 'select', options: ['🌟超棒', '😌平静', '😴疲惫', '😢难过', '😰焦虑', '🤩兴奋', '😤生气'] },
        { name: 'tags', label: '标签', type: 'text', note: '如：工作,生活,学习' },
      ]
    },

    // 数据库 16：夸夸收集（独立表，与日记平级）
    praise: {
      label: '夸夸收集',
      titleField: 'content',
      fields: [
        { name: 'date', label: '日期', type: 'date' },
        { name: 'content', label: '夸夸内容', type: 'longtext' },
        { name: 'mood', label: '心情', type: 'select', options: ['🌟超棒', '😌平静', '😴疲惫', '😢难过', '😰焦虑', '🤩兴奋', '😤生气'] },
        { name: 'from_who', label: '来自谁/场景', type: 'text' },
      ]
    },

    // 数据库 15：资产库
    assets: {
      label: '资产库',
      titleField: 'name',
      fields: [
        { name: 'name', label: '账户名称', type: 'title', note: '如：工商银行卡' },
        { name: 'type', label: '账户类型', type: 'select', options: ['银行卡', '微信', '支付宝', '现金', '花呗', '抖音月付', '其他'] },
        { name: 'balance', label: '余额/额度', type: 'number', note: '现金账户填余额，信贷填额度' },
        { name: 'account_num', label: '卡号/账号', type: 'text', note: '后4位即可' },
        { name: 'is_credit', label: '是否信贷', type: 'checkbox', note: '花呗/月付等勾选' },
        { name: 'notes', label: '备注', type: 'text' },
      ]
    },

    // 数据库 13：每日语录库
    daily_quote: {
      label: '每日语录库',
      titleField: 'content',
      fields: [
        { name: 'artist', label: '艺人', type: 'select', options: ['安溥', '毛不易'] },
        { name: 'content', label: '语录内容', type: 'longtext' },
        { name: 'source', label: '出处', type: 'text' },
        { name: 'index', label: '序号', type: 'number' },
        { name: 'last_shown', label: '上次展示日期', type: 'text' },
      ]
    },

    // 数据库 14：手工项目库
    handcraft: {
      label: '手工项目库',
      titleField: 'title',
      fields: [
        { name: 'title', label: '项目名称', type: 'title' },
        { name: 'type', label: '分类', type: 'select', options: ['钩织', '缝纫'] },
        { name: 'status', label: '状态', type: 'select', options: ['想做', '进行中', '已完成'] },
        { name: 'link', label: '小红书/B站链接', type: 'url' },
        { name: 'for_who', label: '为谁而作', type: 'text' },
        { name: 'notes', label: '备注', type: 'text' },
        { name: 'is_reference', label: '是参考/科普帖', type: 'checkbox', note: '勾选表示是教程科普类帖子' },
      ]
    },

    // 数据库 15：宝藏网站库
    treasure_sites: {
      label: '宝藏网站库',
      titleField: 'name',
      fields: [
        { name: 'name', label: '网站名称', type: 'title' },
        { name: 'url', label: '网址', type: 'url' },
        { name: 'category', label: '分类', type: 'select', options: ['设计', '素材', '实用工具'] },
        { name: 'description', label: '简介', type: 'text' },
      ]
    },

    // 数据库 16：薅羊毛心得库
    money_tips: {
      label: '薅羊毛心得库',
      titleField: 'title',
      fields: [
        { name: 'title', label: '标题', type: 'title' },
        { name: 'category', label: '分类', type: 'select', options: ['签到', '优惠券', '返利', '技巧', '避坑', '其他'] },
        { name: 'content', label: '心得内容', type: 'longtext' },
        { name: 'date', label: '日期', type: 'date' },
        { name: 'link', label: '相关链接', type: 'url', note: '活动链接或商品链接' },
        { name: 'source', label: '来源平台', type: 'select', options: ['小米', '网易云', '浏览器', '抖音', '淘宝', '京东', '拼多多', '其他'] },
      ]
    },

    // 数据库 18：戒烟记录
    quit_smoking: {
      label: '戒烟记录',
      titleField: 'date',
      fields: [
        { name: 'date', label: '日期', type: 'title', inputType: 'date' },
        { name: 'smoked', label: '今天抽了吗', type: 'select', options: ['没抽', '抽了'] },
        { name: 'count', label: '抽了几根', type: 'number', note: '今天抽烟数量' },
        { name: 'trigger', label: '触发原因', type: 'text', note: '什么情况下想抽的？' },
        { name: 'mood', label: '当时心情', type: 'select', options: ['平静', '烦躁', '压力大', '社交场合', '习惯性', '其他'] },
        { name: 'notes', label: '备注', type: 'longtext', note: '今天的感受、应对方法等' },
      ]
    },
  },

  // ---------- 导航结构 ----------
  nav: [
    { id: 'dashboard', label: '今日仪表盘', icon: '🌟' },
    { id: 'english', label: '英语学习', icon: '📚', children: [
      { id: 'english-listening', label: '每日听力', icon: '🎧' },
      { id: 'english-reading', label: '每日阅读', icon: '📖' },
      { id: 'english-speaking', label: '口语练习', icon: '🗣️' },
      { id: 'english-sites', label: '学习网站汇总', icon: '🌐' },
    ]},
    { id: 'media', label: '影视音清单', icon: '🎬', children: [
      { id: 'media-movie', label: '电影清单', icon: '🎥' },
      { id: 'media-tv', label: '剧清单', icon: '📺' },
      { id: 'media-music', label: '音乐专辑清单', icon: '🎵' },
      { id: 'media-book', label: '阅读清单', icon: '📚' },
    ]},
    { id: 'reading-notes', label: '阅读笔记', icon: '📝' },
    { id: 'todo', label: 'TodoList', icon: '✅' },
    { id: 'inspiration', label: '灵感记录', icon: '💡', children: [
      { id: 'inspiration-vfx', label: '特效制作灵感', icon: '✨' },
      { id: 'inspiration-edit', label: '剪辑灵感', icon: '✂️' },
    ]},
    { id: 'body', label: '身体记录', icon: '🧘', children: [
      { id: 'body-weight', label: '体重', icon: '⚖️' },
      { id: 'body-period', label: '经期', icon: '🌙' },
      { id: 'body-pain', label: '疼痛', icon: '🩹' },
      { id: 'quit-smoking', label: '戒烟记录', icon: '🚭' },
    ]},
    { id: 'exercise', label: '运动与护理', icon: '🏃', children: [
      { id: 'exercise-fat', label: '减脂塑型', icon: '🔥' },
      { id: 'exercise-back', label: '背部训练', icon: '🔙' },
      { id: 'exercise-waist', label: '腰部训练', icon: '🧘' },
      { id: 'exercise-skincare', label: '护肤日常', icon: '🧴' },
      { id: 'exercise-blackhead', label: '去黑头·周三专护', icon: '🖤' },
    ]},
    { id: 'star', label: '追星演出追踪', icon: '🎤', children: [
      { id: 'star-anpu', label: '安溥', icon: '🎸' },
      { id: 'star-mao', label: '毛不易', icon: '🎙️' },
      { id: 'star-other', label: '其他艺人', icon: '🎵' },
    ]},
    { id: 'wishlist', label: '愿望清单', icon: '🛒' },
    { id: 'accounting', label: '每日记账', icon: '💰', children: [
      { id: 'accounting-today', label: '今日支出', icon: '💸' },
      { id: 'accounting-month', label: '月度账单', icon: '📊' },
      { id: 'accounting-debt', label: '欠款追踪', icon: '🚨' },
      { id: 'accounting-assets', label: '总资产', icon: '🏦' },
    ]},
    { id: 'daily-checkin', label: '每日打卡', icon: '🎯' },
    { id: 'weekly-review', label: '周复盘', icon: '📅' },
    { id: 'diary', label: '日记', icon: '📔' },
    { id: 'praise', label: '夸夸收集', icon: '🌸' },
    { id: 'handcraft', label: '手工', icon: '🧶', children: [
      { id: 'handcraft-crochet', label: '钩织', icon: '🧵' },
      { id: 'handcraft-sewing', label: '缝纫', icon: '🪡' },
    ]},
    { id: 'treasure-sites', label: '宝藏网站', icon: '💎' },
    { id: 'money-tips', label: '薅羊毛心得', icon: '🐑' },
    { id: 'settings', label: '设置与备份', icon: '⚙️' },
  ],

  // ---------- CRUD 操作 ----------
  getAll(dbName) {
    try {
      return JSON.parse(localStorage.getItem(this.prefix + dbName) || '[]');
    } catch (e) {
      console.error('Store.getAll error:', dbName, e);
      return [];
    }
  },

  getById(dbName, id) {
    return this.getAll(dbName).find(r => r.id === id);
  },

  // ---------- 夸夸收集 ----------
  getPraiseByDate(date) {
    return this.getAll('praise').filter(r => r.date === date).sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  },
  getAllPraise() {
    return this.getAll('praise').sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || ''));
  },
  saveDayPraise(date, lines, mood, fromWho) {
    this.getAll('praise').filter(r => r.date === date).forEach(r => this.delete('praise', r.id));
    (lines || []).forEach(content => {
      this.add('praise', { date, content, mood: mood || '', from_who: fromWho || '', createdAt: new Date().toISOString() });
    });
  },
  deleteDayPraise(date) {
    this.getAll('praise').filter(r => r.date === date).forEach(r => this.delete('praise', r.id));
  },

  add(dbName, record) {
    const data = this.getAll(dbName);
    record.id = this.genId();
    record.createdAt = new Date().toISOString();
    record.updatedAt = record.createdAt;
    data.push(record);
    this._save(dbName, data, record.id);
    return record;
  },

  update(dbName, id, updates) {
    const data = this.getAll(dbName);
    const idx = data.findIndex(r => r.id === id);
    if (idx === -1) return null;
    data[idx] = { ...data[idx], ...updates, updatedAt: new Date().toISOString() };
    this._save(dbName, data, id);
    return data[idx];
  },

  delete(dbName, id) {
    const data = this.getAll(dbName);
    const target = data.find(r => r.id === id);
    const date = target ? target.date : undefined;
    const filtered = data.filter(r => r.id !== id);
    this._save(dbName, filtered, id, 'delete', date);
    return filtered.length < data.length;
  },

  query(dbName, filterFn) {
    return this.getAll(dbName).filter(filterFn);
  },

  _save(dbName, data, changedId, op, date) {
    localStorage.setItem(this.prefix + dbName, JSON.stringify(data));
    this._schedulePush(dbName, changedId, op, date);
  },

  // ---------- Supabase 云同步 ----------
  _cloudReady() {
    return typeof supabaseClient !== 'undefined' && supabaseClient !== null;
  },

  // 判断一张表是否以 date 作为天然唯一键（每天最多一条记录）
  _isDateKeyed(dbName) {
    const schema = this.schemas[dbName];
    if (!schema) return false;
    const titleField = schema.fields.find(f => f.name === schema.titleField);
    return titleField && titleField.name === 'date' && (titleField.inputType === 'date' || titleField.type === 'title');
  },

  // 判断一条 date-keyed 记录是否有用户实际填写的数据（非空白种子）
  _hasUserData(dbName, record) {
    if (!record) return false;
    const schema = this.schemas[dbName];
    if (!schema) return true; // 未知表，保守认为有数据

    for (const field of schema.fields) {
      if (field.name === 'date' || field.name === 'id' || field.name === 'createdAt' || field.name === 'updatedAt') continue;
      const val = record[field.name];
      if (field.type === 'checkbox') {
        if (val === true) return true;
      } else if (field.type === 'number') {
        if (val !== null && val !== undefined && val !== 0 && val !== '') return true;
      } else {
        if (val && val !== '' && val !== '无') return true;
      }
    }
    return false;
  },

  // 字段级合并：多条记录合成一条。布尔值取「或」（任一处勾过即保留），
  // 其余字段取 updatedAt 较新者（平局时取非空），避免任一台设备的数据被整体覆盖。
  _mergeRecordsData(records) {
    const arr = (records || []).filter(Boolean);
    if (arr.length === 0) return null;
    let base = { ...arr[0] };
    for (let i = 1; i < arr.length; i++) {
      const r = arr[i];
      const keys = new Set([...Object.keys(base), ...Object.keys(r)]);
      for (const k of keys) {
        if (k === 'id' || k === 'createdAt' || k === 'updatedAt' || k === 'date') continue;
        const bv = base[k], rv = r[k];
        if (typeof bv === 'boolean' || typeof rv === 'boolean') {
          base[k] = Boolean(bv) || Boolean(rv);
        } else if (new Date(r.updatedAt || 0) > new Date(base.updatedAt || 0)) {
          if (rv !== undefined && rv !== null && rv !== '') base[k] = rv;
        } else if ((bv === undefined || bv === null || bv === '') &&
                   (rv !== undefined && rv !== null && rv !== '')) {
          base[k] = rv;
        }
      }
      if (new Date(r.updatedAt || 0) > new Date(base.updatedAt || 0)) base.updatedAt = r.updatedAt;
    }
    return base;
  },

  // 把本地 + 云端记录按 date 分组，组内做字段级合并，返回去重后的数组
  _mergeDateKeyed(localRecords, cloudRecords) {
    const groups = {};
    for (const r of [...(localRecords || []), ...(cloudRecords || [])]) {
      if (!r || !r.date) continue;
      (groups[r.date] = groups[r.date] || []).push(r);
    }
    const out = [];
    for (const d of Object.keys(groups)) {
      const m = this._mergeRecordsData(groups[d]);
      if (m) out.push(m);
    }
    return out;
  },

  // 从云端拉取数据并合并到本地（云端最新版本优先）
  // 返回结构化结果：{ ok, pulled, error }，便于上层判断同步是否真的成功
  async _syncPullAll() {
    if (!this._cloudReady()) return { ok: false, pulled: 0, error: 'cloud_not_ready' };
    try {
      const { data: rows, error } = await supabaseClient
        .from('records')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error || !rows) return { ok: false, pulled: 0, error: error ? error.message : 'no_rows' };
      if (rows.length === 0) return { ok: true, pulled: 0 };

      // 按表名分组
      const grouped = {};
      for (const r of rows) {
        if (!grouped[r.table_name]) grouped[r.table_name] = [];
        grouped[r.table_name].push(r.data);
      }

      // 逐表合并
      for (const dbName of Object.keys(grouped)) {
        if (!this.schemas[dbName]) continue; // 跳过未知表
        const dateKeyed = this._isDateKeyed(dbName);
        const localMap = {};

        if (dateKeyed) {
          // date 为键的表：本地 + 云端按日期分组，组内做字段级合并
          // （布尔值取「或」，文本取较新非空），避免任一台设备数据被整体覆盖
          const merged = this._mergeDateKeyed(this.getAll(dbName), grouped[dbName]);
          localStorage.setItem(this.prefix + dbName, JSON.stringify(merged));
          continue;
        } else {
          // 普通表：按 id 合并
          for (const r of this.getAll(dbName)) localMap[r.id] = r;
          for (const r of grouped[dbName]) {
            if (!localMap[r.id] || new Date(r.updatedAt) > new Date(localMap[r.id].updatedAt)) {
              localMap[r.id] = r;
            }
          }
        }
        localStorage.setItem(this.prefix + dbName, JSON.stringify(Object.values(localMap)));
      }

      // 同步设置项
      const { data: settings, error: sErr } = await supabaseClient
        .from('settings')
        .select('*');
      if (!sErr && settings) {
        for (const s of settings) {
          localStorage.setItem(s.key, JSON.stringify(s.value));
        }
      }

      return { ok: true, pulled: rows.length };
    } catch (e) {
      console.log('Cloud pull skipped:', e.message);
      return { ok: false, pulled: 0, error: e.message };
    }
  },

  // 推送一张表到云端（批量 upsert，避免逐条请求造成的多次网络往返）
  async _syncPushTable(dbName) {
    if (!this._cloudReady()) return;
    try {
      let data = this.getAll(dbName);
      // date 为键的表：按 date 去重，只保留 updatedAt 最新的那条
      if (this._isDateKeyed(dbName)) {
        const deduped = {};
        for (const r of data) {
          if (!r.date) continue;
          if (!deduped[r.date] || new Date(r.updatedAt) > new Date(deduped[r.date].updatedAt)) {
            deduped[r.date] = r;
          }
        }
        data = Object.values(deduped);
      }
      if (data.length === 0) return;
      // 批量提交：一张表一次性 upsert（分批避免单次负载过大），大幅减少网络往返
      const CHUNK = 200;
      const isDate = this._isDateKeyed(dbName);
      for (let i = 0; i < data.length; i += CHUNK) {
        const batch = data.slice(i, i + CHUNK).map(r => ({
          table_name: dbName,
          record_id: isDate ? (r.date || r.id) : r.id,
          data: r,
          updated_at: r.updatedAt || new Date().toISOString()
        }));
        await supabaseClient.from('records').upsert(batch, { onConflict: 'table_name,record_id' });
      }
    } catch (e) {
      console.log('Cloud push failed:', e.message);
    }
  },

  // 推送单条记录（按 table_name + record_id upsert，主键冲突即更新）
  // 关键：日期表（daily_checkin 等）用 date 作为 record_id，保证同一天只对应一条云端记录，
  // 否则两端各自生成随机 id 会让同一天分裂成多条记录、合并时互相覆盖。
  async _syncPushRecord(dbName, record) {
    if (!this._cloudReady() || !record) return;
    const isDate = this._isDateKeyed(dbName);
    const rid = isDate ? (record.date || record.id) : record.id;
    if (!rid) return;
    try {
      await supabaseClient.from('records').upsert({
        table_name: dbName,
        record_id: rid,
        data: record,
        updated_at: record.updatedAt || new Date().toISOString()
      }, { onConflict: 'table_name,record_id' });
    } catch (e) {
      console.log('Cloud push record failed:', e.message);
    }
  },

  // 删除云端单条记录（本地删除后同步）
  // 日期表按 date 定位（云端主键是日期），普通表按 record.id
  async _syncDeleteRecord(dbName, recordId, date) {
    if (!this._cloudReady() || (!recordId && !date)) return;
    try {
      const rid = this._isDateKeyed(dbName) ? (date || recordId) : recordId;
      await supabaseClient.from('records').delete().eq('table_name', dbName).eq('record_id', rid);
    } catch (e) {
      console.log('Cloud delete record failed:', e.message);
    }
  },

  // 推送设置到云端
  async _syncPushSetting(key, value) {
    if (!this._cloudReady()) return;
    try {
      await supabaseClient.from('settings').upsert({
        key: key,
        value: value,
        updated_at: new Date().toISOString()
      });
    } catch (e) {}
  },

  // 防抖推送：写操作后 2 秒自动同步（只推变化的那条，互不覆盖）
  _schedulePush(dbName, recordId, op, date) {
    if (!this._pushTimers) this._pushTimers = {};
    const key = dbName + '::' + (recordId || '*');
    clearTimeout(this._pushTimers[key]);
    this._pushTimers[key] = setTimeout(async () => {
      if (op === 'delete' && recordId) {
        await this._syncDeleteRecord(dbName, recordId, date);
      } else if (recordId) {
        const rec = this.getById(dbName, recordId);
        if (rec) await this._syncPushRecord(dbName, rec);
      } else {
        await this._syncPushTable(dbName);
      }
    }, 2000);
  },

  // 页面关闭/切后台时立即同步（推送待处理的表，逐条 upsert）
  _syncAllTablesNow() {
    if (!this._cloudReady()) return;
    const pending = Object.keys(this._pushTimers || {});
    for (const key of pending) {
      clearTimeout(this._pushTimers[key]);
    }
    // 推送所有表（逐条 upsert，不会清空他人数据）
    for (const dbName of Object.keys(this.schemas)) {
      this._syncPushTable(dbName);
    }
  },

  // 全量推送（首次初始化后调用），返回本次推送的记录条数
  async _pushAll() {
    if (!this._cloudReady()) return 0;
    let count = 0;
    for (const dbName of Object.keys(this.schemas)) {
      const data = this.getAll(dbName);
      let toPush = data;
      // date 为键的表：按 date 去重，只保留 updatedAt 最新的那条
      if (this._isDateKeyed(dbName)) {
        const deduped = {};
        for (const r of data) {
          if (!r.date) continue;
          if (!deduped[r.date] || new Date(r.updatedAt) > new Date(deduped[r.date].updatedAt)) {
            deduped[r.date] = r;
          }
        }
        toPush = Object.values(deduped);
      }
      count += toPush.length;
      await this._syncPushTable(dbName);
    }
    // 同步自定义设置
    const extra = [this._exerciseCustomKey, this._todoCustomKey, this._starArtistsKey, 'wb_password_hash'];
    for (const key of extra) {
      const v = localStorage.getItem(key);
      if (v) { await this._syncPushSetting(key, JSON.parse(v)); count++; }
    }
    return count;
  },

  // 记录上次同步结果（供侧边栏状态条显示）
  _setLastSync(result) {
    try {
      const data = {
        ts: new Date().toISOString(),
        ok: !!result.ok,
        pulled: result.pulled || 0,
        pushed: result.pushed || 0,
        error: result.error || null,
      };
      localStorage.setItem('wb_last_sync', JSON.stringify(data));
    } catch (e) {}
  },

  // 清理云端 date-keyed 表中历史遗留的重复行（旧版本用随机 id 推同一天会产生多行）。
  // 折叠为「按日期唯一」的一行：组内字段级合并后 upsert(record_id=date)，再删除其余重复行。
  async _cleanupDateKeyedCloud() {
    if (!this._cloudReady()) return;
    const dateKeyed = Object.keys(this.schemas).filter(db => this._isDateKeyed(db));
    for (const dbName of dateKeyed) {
      try {
        const { data: rows, error } = await supabaseClient
          .from('records')
          .select('*')
          .eq('table_name', dbName);
        if (error || !rows || rows.length === 0) continue;
        const byDate = {};
        for (const row of rows) {
          const d = row.data && row.data.date;
          if (!d) continue;
          (byDate[d] = byDate[d] || []).push(row);
        }
        for (const d of Object.keys(byDate)) {
          const group = byDate[d];
          if (group.length < 2 && group[0] && group[0].record_id === d) continue; // 已规范，无需处理
          const canonical = this._mergeRecordsData(group.map(r => r.data));
          if (!canonical) continue;
          canonical.date = d;
          await supabaseClient.from('records').upsert({
            table_name: dbName,
            record_id: d,
            data: canonical,
            updated_at: canonical.updatedAt || new Date().toISOString()
          }, { onConflict: 'table_name,record_id' });
          for (const r of group) {
            if (r.record_id !== d) {
              await supabaseClient.from('records').delete().eq('table_name', dbName).eq('record_id', r.record_id);
            }
          }
        }
      } catch (e) {
        console.log('Cloud cleanup skipped for', dbName, e.message);
      }
    }
  },

  // 为 promise 增加超时保护，避免云端无响应时界面无限「正在同步」
  _withTimeout(promise, ms, label) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('timeout:' + label)), ms);
      Promise.resolve(promise).then(
        v => { clearTimeout(t); resolve(v); },
        e => { clearTimeout(t); reject(e); }
      );
    });
  },

  // 同步：先拉取云端（云端优先，避免用本地旧版本覆盖云端新版本），再推送本地独有记录
  // opts.silent=true 时用于「后台自动同步」：不弹气泡、不强制重渲染（除非确有新数据且不干扰输入）、只静默更新状态条
  // 返回值（结构化，便于 UI 给出"成功/失败"标识）：
  //   { ok: boolean, pulled: number, pushed: number, message: string, error?: string }
  async syncNow(opts = {}) {
    const silent = opts.silent === true;
    const showToast = (m) => {
      if (silent) return;
      if (typeof UI !== 'undefined' && UI.syncToast) UI.syncToast(m);
      else if (typeof UI !== 'undefined') UI.toast(m);
    };

    // 诊断：Supabase 脚本是否加载成功（被网络拦截会导致 supabaseClient 为 null）
    if (typeof supabaseClient === 'undefined' || supabaseClient === null) {
      const reason = (typeof window !== 'undefined' && typeof window.supabase === 'undefined')
        ? 'Supabase 脚本未加载（可能网络拦截了 cdn.jsdelivr.net）'
        : '云端客户端未初始化';
      const fail = { ok: false, pulled: 0, pushed: 0, message: '⚠️ ' + reason, error: 'cloud_not_ready' };
      // 后台模式：云端压根没就绪时静默跳过，不污染状态条（手动点才提示）
      if (!silent) { showToast(fail.message); this._setLastSync(fail); this._refreshSyncBar(); }
      return fail;
    }

    if (!silent) showToast('🔄 正在同步…');

    // 1) 先拉取云端最新并合并到本地（字段级合并，任一台勾过都保留）
    let pull;
    try {
      pull = await this._withTimeout(this._syncPullAll(), 20000, 'pull');
    } catch (e) {
      pull = { ok: false, pulled: 0, error: '请求超时：云端无响应（请检查网络/防火墙是否能访问 supabase.co）' };
    }
    if (!pull.ok) {
      const msg = '❌ 拉取云端失败：' + (pull.error || '未知错误');
      const fail = { ok: false, pulled: 0, pushed: 0, message: msg, error: pull.error };
      // 后台模式：静默跳过，不覆盖之前的好状态（手动点才提示失败）
      if (!silent) { showToast(msg); this._setLastSync(fail); this._refreshSyncBar(); }
      return fail;
    }

    // 2) 清理云端历史重复行（同一天多行），折叠为按日期唯一
    try {
      await this._withTimeout(this._cleanupDateKeyedCloud(), 20000, 'cleanup');
    } catch (e) {
      console.log('Cloud cleanup skipped:', e.message);
    }

    // 3) 再把合并后的结果（含本地独有记录）推送到云端，保证两端一致
    let pushed = 0;
    try {
      pushed = await this._withTimeout(this._pushAll(), 30000, 'push');
    } catch (e) {
      console.log('Cloud push skipped:', e.message);
    }

    // 4) 成功：写入上次同步状态 + 静默刷新状态条
    const ok = { ok: true, pulled: pull.pulled, pushed, message: `✅ 同步成功（拉取 ${pull.pulled} 条 · 推送 ${pushed} 条）` };
    this._setLastSync(ok);
    this._refreshSyncBar();

    // 5) 决定是否重渲染界面
    if (silent) {
      // 后台模式：仅当确有云端新数据、且用户没在输入框里打字、且没开着弹窗时，才刷新界面，避免打断操作
      const ae = document.activeElement;
      const focused = ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable);
      const modalOpen = document.querySelector('.modal-overlay') || document.querySelector('.modal');
      if (pull.pulled > 0 && !focused && !modalOpen && typeof App !== 'undefined' && typeof App.rerender === 'function') {
        App.rerender();
      }
      // 后台静默成功不弹 toast
    } else {
      showToast(ok.message);
      if (typeof App !== 'undefined' && typeof App.rerender === 'function') App.rerender();
    }

    return ok;
  },

  // 仅更新侧边栏状态条（不重建整个页面），供后台静默同步使用
  _refreshSyncBar() {
    try {
      const el = document.querySelector('.sync-status');
      if (el && typeof App !== 'undefined' && typeof App._syncStatusHTML === 'function') {
        el.outerHTML = App._syncStatusHTML();
      }
    } catch (e) {}
  },

  // ---------- 工具方法 ----------
  genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  },

  todayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  // ========== 经期周期算法 ==========

  // 经期设置存取
  getPeriodSetting(key, defaultVal) {
    const v = localStorage.getItem(this.prefix + 'period_' + key);
    return v !== null ? parseInt(v) : defaultVal;
  },
  setPeriodSetting(key, value) {
    const fullKey = this.prefix + 'period_' + key;
    localStorage.setItem(fullKey, value);
    this._syncPushSetting(fullKey, value);
  },

  // 获取所有"来了"日期（按时间正序）
  getPeriodStartDates() {
    return Store.query('body_records', r => r.period_status === '来了')
      .map(r => r.date)
      .sort();
  },

  // 计算周期统计：平均周期长度、平均经期天数
  calcPeriodStats() {
    const startDates = this.getPeriodStartDates();
    const cycleLengths = [];
    const periodDurations = [];

    for (let i = 1; i < startDates.length; i++) {
      const s = new Date(startDates[i - 1]);
      const e = new Date(startDates[i]);
      const len = Math.round((e - s) / 86400000);
      cycleLengths.push(len);
    }

    // 计算每个周期的经期持续天数
    startDates.forEach((sd, i) => {
      const endAfter = i < startDates.length - 1 ? startDates[i + 1] : null;
      const days = this.getPeriodDurationDays(sd, endAfter);
      if (days > 0) periodDurations.push(days);
    });

    const autoLearn = startDates.length >= 3; // 至少2个完整周期（3个"来了"标记）
    let avgCycle;
    if (autoLearn && cycleLengths.length > 0) {
      avgCycle = Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length);
    } else {
      avgCycle = this.getPeriodSetting('cycle_length', 28);
    }
    let avgDuration;
    if (autoLearn && periodDurations.length > 0) {
      avgDuration = Math.round(periodDurations.reduce((a, b) => a + b, 0) / periodDurations.length);
    } else {
      avgDuration = this.getPeriodSetting('period_duration', 5);
    }

    return { cycleLengths, periodDurations, avgCycle, avgDuration, startDates, autoLearn };
  },

  // 获取某次经期的持续天数
  getPeriodDurationDays(startDate, endBefore) {
    const records = Store.getAll('body_records');
    const periodStatuses = ['来了', '经期中'];
    const start = new Date(startDate);
    let count = 0;
    for (let d = 0; d < 14; d++) {
      const ds = this.dateAdd(startDate, d);
      if (endBefore && ds >= endBefore) break;
      if (ds > this.todayStr()) break;
      const r = records.find(rr => rr.date === ds && periodStatuses.includes(rr.period_status));
      if (r) count++;
      else if (d > 0) break; // 连续中断
    }
    return count;
  },

  // 日期加减天数
  dateAdd(dateStr, days) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  },

  // 获取当前周期信息
  getCurrentCycleInfo() {
    const stats = this.calcPeriodStats();
    const today = this.todayStr();
    const lastStart = stats.startDates.length > 0 ? stats.startDates[stats.startDates.length - 1] : null;

    if (!lastStart) {
      return { cycleDay: 0, nextPeriod: null, ovulation: null, fertileStart: null, fertileEnd: null, isPeriod: false, isOvulation: false, isFertile: false };
    }

    const dayDiff = Math.floor((new Date(today) - new Date(lastStart)) / 86400000) + 1;
    const nextPeriod = this.dateAdd(lastStart, stats.avgCycle);
    const ovulation = this.dateAdd(nextPeriod, -14);

    return {
      cycleDay: dayDiff,
      lastStart,
      nextPeriod,
      ovulation,
      fertileStart: this.dateAdd(ovulation, -5),
      fertileEnd: ovulation,
      avgCycle: stats.avgCycle,
      avgDuration: stats.avgDuration,
      autoLearn: stats.autoLearn,
      isPeriod: dayDiff <= stats.avgDuration,
      isOvulation: dayDiff >= Math.floor((new Date(this.dateAdd(lastStart, stats.avgCycle - 14)) - new Date(lastStart)) / 86400000) + 1 - 1
        && dayDiff <= Math.floor((new Date(this.dateAdd(lastStart, stats.avgCycle - 14)) - new Date(lastStart)) / 86400000) + 1 + 1,
      isFertile: false,
    };
  },

  // 预测未来经期日期数组（用于日历标记）
  getPredictedPeriodDates() {
    const stats = this.calcPeriodStats();
    const today = this.todayStr();
    const lastStart = stats.startDates.length > 0 ? stats.startDates[stats.startDates.length - 1] : null;
    if (!lastStart) return [];

    const predicted = [];
    let next = this.dateAdd(lastStart, stats.avgCycle);
    // 预测接下来3个周期
    for (let c = 0; c < 3; c++) {
      for (let d = 0; d < stats.avgDuration; d++) {
        const ds = this.dateAdd(next, d);
        if (ds > today) predicted.push(ds);
      }
      next = this.dateAdd(next, stats.avgCycle);
    }
    return predicted;
  },

  // ========== 自定义运动类别 ==========
  _exerciseCustomKey: 'lily_exercise_custom_cats',

  _loadCustomExerciseCats() {
    try {
      return JSON.parse(localStorage.getItem(this._exerciseCustomKey) || '[]');
    } catch (e) { return []; }
  },

  _saveCustomExerciseCats(cats) {
    localStorage.setItem(this._exerciseCustomKey, JSON.stringify(cats));
    this._syncPushSetting(this._exerciseCustomKey, cats);
  },

  // 获取所有自定义运动类别
  getCustomExerciseCategories() {
    return this._loadCustomExerciseCats();
  },

  // 添加自定义类别，返回新类别对象
  addCustomExerciseCategory(label, icon) {
    const cats = this._loadCustomExerciseCats();
    const id = 'exercise-custom-' + Date.now();
    const cat = { id, label, icon: icon || '💪' };
    cats.push(cat);
    this._saveCustomExerciseCats(cats);
    return cat;
  },

  // 删除自定义类别
  removeCustomExerciseCategory(catId) {
    const cats = this._loadCustomExerciseCats();
    const filtered = cats.filter(c => c.id !== catId);
    this._saveCustomExerciseCats(filtered);
    return filtered;
  },

  // 获取所有运动类别（固定 + 自定义）
  getAllExerciseCategoryLabels() {
    const fixed = ['减脂塑型', '背部', '腰部', '护肤', '其他'];
    const custom = this._loadCustomExerciseCats().map(c => c.label);
    return [...fixed, ...custom];
  },

  // ========== 自定义追星艺人 ==========
  _starArtistsKey: 'lily_star_artists',

  _loadStarArtists() {
    try {
      return JSON.parse(localStorage.getItem(this._starArtistsKey) || '[]');
    } catch (e) { return []; }
  },

  _saveStarArtists(artists) {
    localStorage.setItem(this._starArtistsKey, JSON.stringify(artists));
    this._syncPushSetting(this._starArtistsKey, artists);
  },

  // 获取预设 + 自定义的所有艺人列表
  getAllStarArtists() {
    const builtin = ['安溥', '毛不易'];
    const custom = this._loadStarArtists().map(a => a.name);
    return [...builtin, ...custom];
  },

  getCustomStarArtists() {
    return this._loadStarArtists();
  },

  addCustomStarArtist(name) {
    const artists = this._loadStarArtists();
    if (artists.find(a => a.name === name)) return null;
    const artist = { id: 'star-custom-' + Date.now(), name, addedAt: new Date().toISOString() };
    artists.push(artist);
    this._saveStarArtists(artists);
    return artist;
  },

  removeCustomStarArtist(artistId) {
    const artists = this._loadStarArtists();
    const target = artists.find(a => a.id === artistId);
    const filtered = artists.filter(a => a.id !== artistId);
    this._saveStarArtists(filtered);
    // 同时删除该艺人的所有演出记录
    if (target) {
      const all = this.getAll('star_tracking');
      const remaining = all.filter(r => r.artist !== target.name);
      this._save('star_tracking', remaining);
    }
    return target;
  },

  // 获取运动导航子项（固定 + 自定义）
  getExerciseNavChildren() {
    const fixed = [
      { id: 'exercise-fat', label: '减脂塑型', icon: '🔥' },
      { id: 'exercise-back', label: '背部训练', icon: '🔙' },
      { id: 'exercise-waist', label: '腰部训练', icon: '🧘' },
      { id: 'exercise-skincare', label: '护肤日常', icon: '🧴' },
      { id: 'exercise-blackhead', label: '去黑头·周三专护', icon: '🖤' },
    ];
    const custom = this._loadCustomExerciseCats().map(c => ({
      id: c.id, label: c.label, icon: c.icon || '💪'
    }));
    return [...fixed, ...custom];
  },

  // ========== 自定义 Todo 类别 ==========
  _todoCustomKey: 'lily_todo_custom_cats',

  _loadTodoCategories() {
    try {
      return JSON.parse(localStorage.getItem(this._todoCustomKey) || '[]');
    } catch (e) { return []; }
  },

  _saveTodoCategories(cats) {
    localStorage.setItem(this._todoCustomKey, JSON.stringify(cats));
    this._syncPushSetting(this._todoCustomKey, cats);
  },

  // 获取所有自定义 Todo 类别（不含固定类别）
  getCustomTodoCategories() {
    return this._loadTodoCategories();
  },

  // 添加自定义 Todo 类别，返回新对象
  addCustomTodoCategory(label, icon) {
    const cats = this._loadTodoCategories();
    const clean = (label || '').trim();
    if (!clean) return null;
    if (cats.find(c => c.label === clean)) return null;
    // 不允许与固定类别重名
    const fixed = this.schemas.todo_list.fields.find(f => f.name === 'domain').options;
    if (fixed.includes(clean)) return null;
    const cat = { id: 'todo-custom-' + Date.now(), label: clean, icon: icon || '📌' };
    cats.push(cat);
    this._saveTodoCategories(cats);
    return cat;
  },

  // 删除自定义 Todo 类别（不删除该类别下的任务，仅让其归属为「其他」）
  removeCustomTodoCategory(catId) {
    const cats = this._loadTodoCategories();
    const filtered = cats.filter(c => c.id !== catId);
    this._saveTodoCategories(filtered);
    return filtered;
  },

  // 获取所有 Todo 类别（固定 + 自定义）
  getAllTodoCategoryLabels() {
    const fixed = this.schemas.todo_list.fields.find(f => f.name === 'domain').options;
    const custom = this._loadTodoCategories().map(c => c.label);
    return [...fixed, ...custom];
  },

  // ========== 吃药颗数累计 ==========
  // 统计所有打卡记录中「上午吃药」「下午吃药」的勾选总数
  // 因为每天每条记录各自代表一次打卡（=1颗），勾选即+1、取消即-1，天然同步
  getTotalMedPills() {
    const all = this.getAll('daily_checkin');
    let total = 0;
    all.forEach(r => {
      if (r.morning_meds) total++;
      if (r.afternoon_meds) total++;
    });
    return total;
  },

  // ========== 清除示例（死）数据 ==========
  // 移除早期初始化时写入的示例条目（Todo / 愿望清单 / 示例运动视频）
  // 仅匹配应用内置示例的特征，不会误删用户真实数据
  removeSampleData() {
    let removed = 0;

    const todoSamples = ['📝 词语积累10个', '🔄 今日复盘', '🖤 去黑头日'];
    const todos = this.getAll('todo_list');
    const keptTodos = todos.filter(t => !todoSamples.includes(t.task_name));
    if (keptTodos.length !== todos.length) {
      removed += todos.length - keptTodos.length;
      this._save('todo_list', keptTodos);
    }

    const wishSamples = ['AirPods Pro 2', 'Kindle Paperwhite'];
    const wishes = this.getAll('wishlist');
    const keptWishes = wishes.filter(w => !wishSamples.includes(w.item_name));
    if (keptWishes.length !== wishes.length) {
      removed += wishes.length - keptWishes.length;
      this._save('wishlist', keptWishes);
    }

    const videoSamples = [
      '帕梅拉10分钟全身燃脂', '韩小四8分钟背部训练', '周六野腰部塑形',
      '改善圆肩驼背5分钟', '睡前拉伸放松全身'
    ];
    const videos = this.getAll('exercise_videos');
    const keptVideos = videos.filter(v => !videoSamples.includes(v.title));
    if (keptVideos.length !== videos.length) {
      removed += videos.length - keptVideos.length;
      this._save('exercise_videos', keptVideos);
    }

    return removed;
  },

  // 获取记录的标题值
  getTitle(dbName, record) {
    const schema = this.schemas[dbName];
    if (!schema || !record) return '';
    const titleField = schema.titleField;
    const field = schema.fields.find(f => f.name === titleField);
    if (!field) return '';
    if (field.type === 'title' && field.inputType === 'date') {
      return record[titleField] || '';
    }
    return record[titleField] || '(未命名)';
  },

  // 获取关联记录的显示文本
  getRelationLabel(dbName, id) {
    const rec = this.getById(dbName, id);
    if (!rec) return '';
    return this.getTitle(dbName, rec);
  },

  // 获取本周一到周日的日期范围
  getWeekRange(date) {
    const d = new Date(date);
    const day = d.getDay() || 7; // 周日=7
    const monday = new Date(d);
    monday.setDate(d.getDate() - day + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: monday, end: sunday };
  },

  // 获取周次标题
  getWeekTitle(date) {
    const d = new Date(date);
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((d - yearStart) / 86400000 + yearStart.getDay() + 1) / 7);
    return `${d.getFullYear()}年第${weekNum}周`;
  },

  // ---------- 初始化预设数据 ----------
  init() {
    // 语录数据强制播种（即使先前版本已初始化过）
    const quotes = this.getAll('daily_quote');
    if (quotes.length === 0) {
      this.seedQuotes();
    }

    // 自定义艺人强制播种（预置 keshi/旅行团/小狗的骨头/悲伤玩具）
    const existingArtists = this._loadStarArtists();
    const defaultCustomArtists = ['keshi', '旅行团乐队', '小狗的骨头乐队', '悲伤玩具乐队'];
    defaultCustomArtists.forEach(name => {
      if (!existingArtists.find(a => a.name === name)) {
        this.addCustomStarArtist(name);
      }
    });

    // 演出种子数据自动播种（逐条去重，避免重复插入）
    const starRecords = this.getAll('star_tracking');
    const seedAdd = (entry) => {
      const dup = starRecords.find(r =>
        r.artist === entry.artist &&
        r.show_name === entry.show_name &&
        r.show_date === entry.show_date
      );
      if (!dup) this.add('star_tracking', entry);
    };

    const concertSeed = [
      // ===== 安溥（含音乐节）=====
      { artist: '安溥', show_name: '葫芦果音乐节·合肥站', show_type: '音乐节', show_date: '2026-05-03', city: '合肥', venue: '骆岗公园梦想大草坪', status: '已过期', source: 'auto-seed', notes: '70分钟特别场，同台痛仰/二手玫瑰/梁博/旅行团等' },
      { artist: '安溥', show_name: '连岛音乐节', show_type: '音乐节', show_date: '2026-07-04', city: '连云港', venue: '连岛景区', status: '已过期', source: 'auto-seed', notes: '同台郑钧/谭维维/五条人/声音碎片等' },
      // ===== 毛不易（含音乐节）=====
      { artist: '毛不易', show_name: '呼和浩特草莓音乐节', show_type: '音乐节', show_date: '2026-07-05', city: '呼和浩特', venue: '敕勒川草原', status: '已过期', source: 'auto-seed', notes: '草莓舞台压轴，同台徐佳莹/宝石Gem/马頔等' },
      { artist: '毛不易', show_name: '唐山青春超燃巨星演唱会', show_type: '拼盘', show_date: '2026-07-11', city: '唐山', venue: '唐山新体育中心体育场', status: '已过期', source: 'auto-seed', notes: '同台林志炫/徐怀钰/徐子尧等，央视舞美团队打造' },
      { artist: '毛不易', show_name: '广州珠江啤酒音乐节', show_type: '音乐节', show_date: '2026-07-19', city: '广州', venue: '待定', status: '已过期', source: 'auto-seed', notes: '啤酒冠名户外音乐节' },
      { artist: '毛不易', show_name: '贵阳gapday音乐节', show_type: '音乐节', show_date: '2026-07-26', city: '贵阳', venue: '观山湖公园民族大联欢广场', status: '已过期', source: 'auto-seed', notes: '主题"软托邦"，乐堡啤酒主办' },
      // ===== 旅行团乐队 =====
      { artist: '旅行团乐队', show_name: '葫芦果音乐节·合肥站', show_type: '音乐节', show_date: '2026-05-03', city: '合肥', venue: '骆岗公园梦想大草坪', status: '已过期', source: 'auto-seed', notes: '同台安溥/痛仰/二手玫瑰/梁博等' },
      { artist: '旅行团乐队', show_name: '上虞氧气吉象音乐节', show_type: '音乐节', show_date: '2026-05-04', city: '上虞', venue: '曹娥江畔大草坪', status: '已过期', source: 'auto-seed', notes: 'DAY2出演' },
      { artist: '旅行团乐队', show_name: '「夏日运动会」演唱会', show_type: '专场', show_date: '2026-07-11', city: '北京', venue: '水立方', status: '已过期', source: 'auto-seed', notes: '成立近20年，经典曲目+全新曲目首唱' },
      // ===== 悲伤玩具乐队 =====
      { artist: '悲伤玩具乐队', show_name: '「谁要来打扰我的乌托邦」重庆站', show_type: '专场', show_date: '2026-07-24', city: '重庆', venue: '坚果NUTS', status: '已过期', source: 'auto-seed', notes: '预售¥100起' },
      { artist: '悲伤玩具乐队', show_name: '「谁要来打扰我的乌托邦」成都站', show_type: '专场', show_date: '2026-07-25', city: '成都', venue: '不歪LIVE(Pro厅)', status: '已过期', source: 'auto-seed', notes: '预售¥100起' },
      { artist: '悲伤玩具乐队', show_name: '海韵天籁音乐节', show_type: '音乐节', show_date: '2026-07-26', city: '烟台莱州', venue: '滨海旅游度假区黄金海岸', status: '已过期', source: 'auto-seed', notes: '同台孙楠/吴莫愁/隔壁老樊等' },
      { artist: '悲伤玩具乐队', show_name: '「谁要来打扰我的乌托邦」西安站', show_type: '专场', show_date: '2026-07-31', city: '西安', venue: '西演SPACE·光圈CLUB', status: '想看', source: 'auto-seed', notes: '预售¥100起' },
      { artist: '悲伤玩具乐队', show_name: '「谁要来打扰我的乌托邦」银川站', show_type: '专场', show_date: '2026-08-01', city: '银川', venue: '慈厂CiChang', status: '想看', source: 'auto-seed', notes: '预售¥100起' },
      { artist: '悲伤玩具乐队', show_name: '莫干山奇幻音乐节', show_type: '音乐节', show_date: '2026-08-21', city: '湖州', venue: '上渚山奇幻谷', status: '想看', source: 'auto-seed', notes: '单日¥38/双日¥58，同台魏如萱/厨子和戏子等' },
      // ===== 小狗的骨头乐队 =====
      { artist: '小狗的骨头乐队', show_name: '「New Old Body」广州站', show_type: '专场', show_date: '2026-04-25', city: '广州', venue: 'SDlivehouse', status: '已过期', source: 'auto-seed', notes: '首次全国巡演' },
      { artist: '小狗的骨头乐队', show_name: '「New Old Body」上海站', show_type: '专场', show_date: '2026-04-17', city: '上海', venue: '万代南梦宫·未来剧场', status: '已过期', source: 'auto-seed', notes: '彩胶《Angel Love Forever》首发签售' },
      { artist: '小狗的骨头乐队', show_name: '「New Old Body」郑州站', show_type: '专场', show_date: '2026-06-26', city: '郑州', venue: '7LIVEHOUSE', status: '已过期', source: 'auto-seed', notes: '预售¥120 / 全价¥150' },
      { artist: '小狗的骨头乐队', show_name: '「New Old Body」北京站', show_type: '专场', show_date: '2026-06-27', city: '北京', venue: '福浪LIVEHOUSE', status: '已过期', source: 'auto-seed', notes: '预售¥120 / 全价¥150' },
      { artist: '小狗的骨头乐队', show_name: '「New Old Body」天津站', show_type: '专场', show_date: '2026-06-28', city: '天津', venue: '待定', status: '已过期', source: 'auto-seed', notes: '后增城市站次' },
      { artist: '小狗的骨头乐队', show_name: '「New Old Body」上海加场', show_type: '专场', show_date: '2026-07-12', city: '上海', venue: '待定', status: '已过期', source: 'auto-seed', notes: '首次售罄后加场' },
      { artist: '小狗的骨头乐队', show_name: '莫干山奇幻音乐节', show_type: '音乐节', show_date: '2026-08-23', city: '湖州', venue: '上渚山奇幻谷', status: '想看', source: 'auto-seed', notes: '单日¥38/双日¥58' },
    ];
    concertSeed.forEach(c => seedAdd(c));

    // 判断是否首次初始化
    const isFirstInit = !localStorage.getItem(this.prefix + '_initialized');

    // 首次初始化：填充种子数据
    if (isFirstInit) {

    const today = this.todayStr();

    // 计算最近的周三
    const now = new Date();
    const dayOfWeek = now.getDay() || 7;
    const wednesday = new Date(now);
    wednesday.setDate(now.getDate() - dayOfWeek + 3);
    if (wednesday < now) {
      wednesday.setDate(wednesday.getDate() + 7);
    }
    const wedStr = wednesday.toISOString().slice(0, 10);

    // 每日打卡 - 今天的记录由仪表盘按需创建（避免与云端数据产生重复）
    // 不在此处预建种子记录，否则跨设备同步时会因 updatedAt 时间戳
    // 冲突导致云端已勾选数据被空白种子覆盖
    // 注意：Todo / 愿望清单 / 运动视频 / 记账 / 影视音 / 灵感 / 网站 / 资产 / 手工
    // 等示例数据均已移除，工作台已投入使用，不再自动写入假数据。

    // 安溥个人专场（非 auto-seed，用户可自由编辑）
    const anpuConcert = this.getAll('star_tracking').find(r => r.artist === '安溥' && r.show_name.includes('时寐'));
    if (!anpuConcert) {
      this.add('star_tracking', {
        artist: '安溥', show_name: '安溥·时寐 巡演上海站', show_type: '专场',
        show_date: '2026-09-20', city: '上海', venue: '梅赛德斯-奔驰文化中心',
        ticket_date: '2026-08-15', ticket_platform: '大麦',
        ticket_price: '480/680/980/1280', status: '想看', source: '', notes: '记得定闹钟抢票'
      });
    }

    // 迁移旧数据：将 got_ticket 转为 status
    const allStar = this.getAll('star_tracking');
    let migrated = false;
    allStar.forEach(r => {
      if (r.got_ticket !== undefined && !r.status) {
        r.status = r.got_ticket ? '已购票' : '想看';
        delete r.got_ticket;
        migrated = true;
      }
      if (!r.status) r.status = '想看';
    });
    if (migrated) this._save('star_tracking', allStar);

    // 种子语录数据
    this.seedQuotes();

    localStorage.setItem(this.prefix + '_initialized', '1');

    // 夸夸数据迁移：旧版本把夸夸存在 daily_checkin.praise，迁移到独立 praise 表（仅一次）
    if (!localStorage.getItem(this.prefix + 'praise_migrated')) {
      if (this.getAll('praise').length === 0) {
        const linesByDate = {};
        const checkins = this.getAll('daily_checkin');
        checkins.forEach(c => {
          if (c.praise && c.praise.trim()) {
            linesByDate[c.date] = (linesByDate[c.date] || []).concat(
              c.praise.split('\n').map(s => s.trim()).filter(Boolean)
            );
            c.praise = '';
          }
        });
        Object.keys(linesByDate).forEach(d => this.saveDayPraise(d, linesByDate[d]));
        if (checkins.some(c => !c.praise)) {
          this._save('daily_checkin', checkins);
          if (this._schedulePush) this._schedulePush('daily_checkin');
        }
      }
      localStorage.setItem(this.prefix + 'praise_migrated', '1');
    }

    } // end if (isFirstInit) — 种子数据仅首次填充

    // 云端同步：每次打开都从云端拉取最新数据
    if (this._cloudReady()) {
      setTimeout(async () => {
        let pulled;
        try {
          pulled = await this._withTimeout(this._syncPullAll(), 20000, 'init-pull');
        } catch (e) {
          console.log('Cloud init pull skipped:', e.message);
          pulled = false;
        }
        if (!pulled && isFirstInit) {
          // 首次且云端无数据，把种子数据推上去
          try { await this._withTimeout(this._pushAll(), 30000, 'init-push'); } catch (e) { console.log('init push skipped', e.message); }
        } else if (pulled) {
          // 拉取成功后，清理云端历史重复行（同一天多行），并上传本地独有记录
          const todayKey = this.todayStr();
          if (localStorage.getItem(this.prefix + 'cloud_cleanup_date') !== todayKey) {
            try { await this._withTimeout(this._cleanupDateKeyedCloud(), 20000, 'init-cleanup'); } catch (e) { console.log('init cleanup skipped', e.message); }
            localStorage.setItem(this.prefix + 'cloud_cleanup_date', todayKey);
          }
          try { await this._withTimeout(this._pushAll(), 30000, 'init-push'); } catch (e) { console.log('init push skipped', e.message); }
        }
        // 同步完成后刷新界面，确保仪表盘显示的是云端合并结果
        // （防止渲染时用空白记录，之后才等到云端数据）
        if (typeof App !== 'undefined' && typeof App.rerender === 'function') {
          App.rerender();
        }
      }, isFirstInit ? 500 : 100);
    }

    // 清理本地可能已存在的同日重复记录（修复旧版本跨设备同步 bug 遗留）
    this._dedupeDateKeyedTables();
  },

  // 清理以 date 为键的表中，同一天存在的重复记录
  _dedupeDateKeyedTables() {
    const dateKeyedTables = Object.keys(this.schemas).filter(db => this._isDateKeyed(db));
    let changed = false;
    for (const dbName of dateKeyedTables) {
      const all = this.getAll(dbName);
      const byDate = {};
      for (const r of all) {
        if (!r.date) { byDate[r.id || ('_' + Math.random())] = r; continue; }
        (byDate[r.date] = byDate[r.date] || []).push(r);
      }
      const merged = [];
      let dup = 0;
      for (const d of Object.keys(byDate)) {
        const group = byDate[d];
        if (group.length > 1) dup++;
        const m = this._mergeRecordsData(group);
        if (m) merged.push(m);
      }
      if (dup > 0) {
        localStorage.setItem(this.prefix + dbName, JSON.stringify(merged));
        changed = true;
      }
    }
    return changed;
  },

  // ---------- 语录种子数据 ----------
  seedQuotes() {
    const anpu = [
      { content: '诗人放过夜里的笔，眼睛放下相机，一杯热茶留在客厅，放走蒸汽。我们除了和彼此相伴活在当下，不肯再做别的事情。吾爱，人心不需印证，如同世界上唯一的，我们。像是想家的根不用泥土，它自己生长。活着，我深爱你，这就是我的生命。', source: '' },
      { content: '人一辈子最幸运的事情，其实是曾经那麽荣幸地参与别人的生命，不论用什么样的方式，是好的，或坏的，有时候是眼前看起来悲伤，最后却圆满了我们的人生。所以我希望这首歌（《关于我爱你》）可以陪年轻人去看自己下一个低潮，或高潮，不要害怕。', source: '《关于我爱你》' },
      { content: '音乐不是我的梦想，而是我唯一谋生的方式。除此之外，我一无是处，人生路上一塌糊涂。走上音乐这条路，没有大家想得这么可爱。当年对我来说，是非常绝望的事，因为我只能把这条路走好，只能用这条路照顾自己。', source: '' },
      { content: '人生很多事情如人饮水，我只能鼓励年轻人试着喝水，尝试自己去喝各样的水，而不是只会彷徨问人。我怎么喝水、为什么咬冰块，对你一点帮助都没有。与其问我，不如你自己咬咬看。人生很多经验，是只有你自己可以体验、别人夺不走的资产。', source: '' },
      { content: '这几年的旅行不太有计画，有段时间裡，我都用掷骰子来决定我的一天，去欧洲旅行的五个星期，也随身带著它。那时我的人生有点像太极的漩涡，有黑有白，内心低潮时其实也是高潮。我很珍惜那段时光，每天发生的事情不见得是新的，但体会或感受却是。', source: '' },
      { content: '一个人旅行就是，既然决定要这样做，就要抱著平常心，想办法面对、解决，学会自处，感受活著的当下，生而为人的感觉。抽到不喜欢的选项，还是可以骂髒话，承认旅行中的不顺利，往往都来自于自己。', source: '《小日子》专访' },
      { content: '我们在回应别人问题的时候，仿佛就觉得自己被赋予一个"我要回答出什麽"的角色，所以我们才会有所谓说服对方的动机、觉得有说服对方的必要。我们活在这个世界上，不可能永远都回答得出什么。', source: '' },
      { content: '一个好问题也许会让你想要好好活完一辈子，因为这个问题问不完，可是它能让你终其一生看见无数个事情。', source: '' },
      { content: '我喜欢凡事幽默以对但看得懂事物核心的人，这样的人体会不同的声音时拥有包容。但不需失去犀利，他们展现自己的价值观可以非常坚定，以至于不必整个世界非得成全。', source: '' },
      { content: '保留你的骄傲，遗憾然后微笑。', source: '《并不》' },
      { content: '我的朋友曾告诉我，认识一个人最好的方法，就是不抱希望地去爱他。后来我说，认识自己最好的方法，就是不抱任何希望地去爱一个人。包括你自己。', source: '' },
      { content: '如果你有真正地活着，你就会去捍卫另一个独立的生命，不论你认不认识他，不论你聊不了解他，不管他是有什么样的背景，他会有什么样的未来。', source: '' },
      { content: '人生中，我曾亲眼见过的温柔，是在每种喜悦变成张狂，在每种自卑变成怪物，在每种对错变成信念，在每种痛楚变成感想以前，中间，往后，那些时刻曾突然不能自已地停下来去听当时时空中的杂音的样子。', source: '2019.2.13 电子信' },
      { content: '人生岁月不论发生很好或很不好的东西，你可以感觉得到一个东西的极限，比如说极痛苦、极悲伤，或者是莫大的喜悦，这就是生而为人的福分。', source: '' },
      { content: '谁都不会真的很懂快乐这件事。但这是没有关系的，不懂快乐的来由不是我们不快乐的原因，我们常常就是遇见，撞上，于是有那么一些片刻依偎着快乐，像一见钟情一样。其他时间，我们为了曾经有过了便从此知道的那种心动，愿意不再多问地活着。', source: '' },
      { content: '我是那么感谢，我还有机会可以一路成为40岁的我自己，但这是15岁的我再怎么尝试去想象，其实也都不知道要怎么变成我想变成的人。中间还是只能够去面对每一个发生的事情。每一天遇到的每一件事情，不管它当下看起来像是倒霉，或像是不幸运，它都不是现在看起来的这个样子。', source: '' },
      { content: '万事求缺。这句话陪伴著我走到现在，是我心裡最安宁的一处，这几年没什么能奉献给别人的，希望能送给需要的人在这裡歇歇。', source: '' },
      { content: '当我说"你是流动的，别停下来"的时候，我不是说给群众听，是说给一个又一个需要这句话的人听的。你现在眼前的一切，预言的不是你的未来，而是专心成为自己能成为的人。不要停下来，不要停止继续为自己活。', source: '' },
      { content: '我们的一生中，每个能不求他人打分数就能肯定自己的时刻，就是真实的也最了不起的成功。', source: '' },
      { content: '量子理論告訴我，「無尺」是很好的。當沒有找任何人來觀看，也沒有賦予觀看的人任何意義的時候，你才有可能在這個世界上找到任何一件真正想做的事情，能往它的深處走。那個深處既不能拿來穿，也不能拿來吃，但可以讓我活得很厚實，生命有更多面向。', source: '《大誌》118期專訪' },
      { content: '承伤而不舍开口，但因此才是唯一追得上变化和成为变化的人。', source: '' },
      { content: '真正的环保是你知道自己要或不要什么，不要的东西就不要贪小便宜，觉得拿了没差；你需要的东西，你好好地物尽其用，发挥到它的极限。人跟人之间的相处，跟人与地球的相处，应该要是这样才对。', source: '' },
      { content: '美丽的丑陋的其实是来自我们自己的眼光，只有自己能困住自己的爱恨，而爱早已经在这里生存至如今。请你们让自己自由，那么你曾在意的我就一定会留在你的心里不再摇晃，因为你自己。', source: '' },
      { content: '每一个的灵魂都来自不一样的地方，每一个人的生命在这个旅程里面其实也要去很多不同的地方，毕竟没有一种活着的方式能够满足所有来自不同各地的灵魂，所以这个世界这么复杂是必然的。', source: '' },
      { content: '万种活过才是一次活着。', source: '2018.3.21 电子信' },
      { content: '我一直觉得自己是一个nothing to lose的人，它跟勇敢或智慧没关，而是来自对一无所有的感受。因为曾经体验过一无所有的感觉，那别人如果还觉得我身上有什么，我都愿意同他们分享，因为那是我唯一能给予的了。', source: '' },
      { content: '珍惜活着的每一刻，真的，通常我们活得越好，到告别的那一刻越不需要理由。', source: '' },
      { content: '同样一个东西，不同的人用不同的心态去使用，带来的结果都会很不一样。没有什么事情是绝对的对或错，例如道德，例如自由，例如诚实和谎言，战争与和平。我们有没有耐心去了解一件事的各种层面，有没有勇气去分辨自己的观点来自哪里去到何处，才是对自己最重要的事。', source: '' },
      { content: '入世和媚俗看似是同一种形式，但绝不是一种态度。', source: '' },
      { content: '如果你要做打根基的事情，就得放弃那个最后的虚荣，你得让它没有结果才是最好的结果。它一旦有结果了，成为你个人的收获和胜利，对别人来说依然什么都不是。', source: '' },
      { content: '在我们这个时代，要不然就是不看不听变得很虚无，要不然就是因为想看想听所以知道多一点事情，你就在大家深夜入睡时，一个人觉得焦虑，觉得痛苦。我希望有人跟我一样，有时候半夜是这样过的，这代表I\'m not alone, you are not alone, either。', source: '' },
      { content: '我觉得海明威很会讲故事，然后我最喜欢的印度女作家阿兰达蒂.洛伊，她写过一本书叫做《微物之神》，我觉得那本书影响我非常大。你可以不求用白话的形式讲，但你可以用洗练的方式讲，你不一定要为了让别人懂而把一个很美丽的东西讲穿、解剖。那些世间微小的东西、声响，哪怕是一个破碎的汽水瓶，其实都有我们深深的哀伤，都投射着我们活着的喜悦跟愤怒。', source: '' },
      { content: '安溥提起她"私底下"最喜欢的作家：来自印度、关怀人权与政治的阿兰达蒂．洛依，以及身在欧陆、学术浓度极高的安伯托．艾可。每个人生命中其实不需要老师，或甚至偶尔也不需要同伴，但是你需要可敬的对手。当一个好读者是你对一个创作者最好的回应，而不是当他的簇拥者。', source: '' },
      { content: '一瞬间才明白，你说要睡得心满意足的枕头。', source: '《我想你要走了》' },
      { content: '不要牵挂，我们都真诚地活在当下的时候，就已经是一种相见。', source: '' },
      { content: '总有一天，我们相见会是因为你已只是充满故事的你。在我身边旁若无人地坐下。旁若无人地依偎，我们于是一句沒一句地说起话，男孩，无人察觉我们，我俩总是忘了回家，相伴在永远的街上。', source: '写给青峰（2015.06.02）' },
    ];

    const maobuyi = [
      { content: '不要害怕，黑暗战胜不了光。', source: '' },
      { content: '你要笑看以前的那些挫折。不幸福的时候坚持一下，过两天就幸福了。', source: '' },
      { content: '我觉得注意力放在那些批评或者诋毁上，还不如看一看那些用很多字来夸你来鼓励你的人。反倒是那些诋毁你的人得到你的重视，对那些鼓励你的人不公平。', source: '' },
      { content: '我不会因为外界的声音而动摇，写我的歌，唱我心里的声音，那才是我。不易，代表我的坚定不移。', source: '' },
      { content: '尽量不把自己放在事情的对立面，尽量跟我们不太正面的处境或者情绪共处，好好相处。', source: '' },
      { content: '成长就是学会去接受不得不接受的。', source: '' },
      { content: '内向不是性格的缺陷，它就是性格的一种。所以，其实没有必要硬要去强迫自己。', source: '' },
      { content: '希望大家都坦然的接纳自己，拥抱自己的性格。', source: '' },
      { content: '有时候我们会以为自己已经足够强大，强大到可以把在意握在手中，把生活握在手中，把永远握在手中，而当我们发现一切都无法改变或终将改变的时候，我们才重新回到这个原本就是这样的世界。原来，有时候，我们需要面对的，其实不是世界。', source: '' },
      { content: '我觉得真实的自己就已经足够精彩了，没有必要为了迎合谁而做一个人设。', source: '' },
      { content: '考虑别人的感受不是错。', source: '' },
      { content: '无论你过去曾是谁，现在是谁，未来会是谁，爱你的，喜欢你所有的样子，只愿你平安，只愿你快乐。', source: '' },
      { content: '愿你我仍然在平凡的世界里还是那个不被人理解和不循规蹈矩的创造者。', source: '' },
      { content: '你总要允许一些人，有安静的青春。', source: '' },
      { content: '好的音乐是指引，是慰藉，是通往美好的力量，是歌者对听众最真挚的托付。愿我们都能在音乐中片刻抽离眼前混乱的生活，听到在内心深处，我们始终坚强而美好。', source: '' },
      { content: '生活偶尔还是需要逃避的，要不然太苦了。', source: '' },
      { content: '摆脱梦想绑架最好的方式就是不忘初心。', source: '' },
      { content: '坚持梦想和好好生活是不冲突的，有的人甚至不知道自己的梦想是什么，也可以过得很幸福。', source: '' },
      { content: '如果它真的是你的梦想的话，你不会觉得你在坚持，这会是你离不开的一件事。', source: '' },
      { content: '总有一种感情想让你不求回报的给予对方一切。它可能不够轰轰烈烈，也未必会天荒地老。但只要你某天想起它时，心头会浮起一丝暖意，这便是它的全部意义。', source: '' },
      { content: '人都是这样的。任何阶段的人都是这样的。烦恼是人生永恒的主题。', source: '' },
      { content: '我们不是为了比赛作这首歌，这首歌最本真的样子是我们想跟大家表达的，作品留下来是最重要的。', source: '' },
      { content: '在遥远的故乡，在背影的深处，曾有一双为你日夜操劳的手，有一个眼含热泪的人。她一言一行的督促，一荤一素的关怀，她在你的生活存在的理所当然，甚至让你忘了她的脆弱，还有，她有一天也会离开。', source: '' },
      { content: '因为有遗憾，才显出那些不遗憾的好。', source: '' },
      { content: '不要怕犯错误，要原谅自己的错误，在一次一次试错的过程中找到自己热爱的生活或者事业，然后进行下去，要勇敢。', source: '' },
      { content: '其实真正可以称作「艰难险阻」的事情不是很多，最可怕的是开始质疑自己的初衷。', source: '' },
      { content: '工作和生活，不要混在一起。', source: '' },
      { content: '大家追求美就不对了吗？', source: '' },
      { content: '要喜欢自己，哪怕是几个小时之后矫情而文艺的那个。除了生活本身，我们需要文艺。而或粗砺或文艺，都是生活。', source: '' },
      { content: '接受自己有什么不对呢。', source: '' },
      { content: '既然喜欢，那就去做。', source: '' },
      { content: '平凡是我们每个人都逃脱不了的既定事实。', source: '' },
      { content: '所谓的大众和自己之间如果出现了分歧，那我觉得第一选择还是以自己喜欢为主。', source: '' },
      { content: '如果确定了，不管能不能实现，去享受这个过程就好，不能太在意结果。', source: '' },
      { content: '时间就是洪水猛兽，你能做的就那么多，帮不到所有人，但是不做就永远没有人。', source: '' },
      { content: '在做任何决定之前，首先要确定它是不是你想要的。', source: '' },
      { content: '其实，寻求真我的过程固然珍贵，但极端个性并非人皆有之，也许，不把这稀有个性看做缺失，而是兼具，也许就更容易自洽。', source: '' },
      { content: '人生不是非黑即白的东西。', source: '' },
      { content: '如果世界啊，不再眷顾我，拾掇拾掇吧，洗把脸就好。', source: '' },
      { content: '见过世界却依然歌颂世界，流过眼泪却依然相信眼泪。', source: '' },
      { content: '其实我们的生活中有很多美好的东西，不要等到失去了再来歌颂。', source: '' },
      { content: '生活上可以懒惰，但工作上还是不能那么自私。', source: '' },
      { content: '各个行业都有名利上的博弈，如果你本身不追求的话，可能会有别的更重要更有意义的东西去占据你的注意力。', source: '' },
      { content: '不要把艺人啊，美丑啊脱离人民群众。', source: '' },
      { content: '比赛的结果，在这里是一时的，但是作品放在那里，只要有人听，有人懂，那就是有意义。', source: '' },
      { content: '诚实是沟通的根本。', source: '' },
      { content: '人有时候是需要独处的。志趣相投自然就会成为朋友。', source: '' },
      { content: '每个人身上都有闪光点。生活里需要一些仪式感来提醒自己。', source: '' },
      { content: '对自己是很难撒谎的。', source: '' },
      { content: '在我看来，我所见经历的一切，都是无数次选择的结果。', source: '' },
      { content: '即使人生短短，不要停下脚步。不要把自己逼得太紧，顺其自然。', source: '' },
      { content: '第一天去，看到有人去世，会觉得很悲伤。但如果看过一千个人去世，可能就不悲伤了，那这件事就不值得悲伤了吗？不是。所以我希望还是能保留最开始的那个状态。', source: '' },
      { content: '物质一定程度上能够体现你的价值，因为很多时候我们的成就、成就感，除了来自别人的肯定，有时候是来自物质水平的提升。', source: '' },
      { content: '面对选择的时候迷茫都很正常，但其实如果没有特别确定自己有一个明确的选择的话，其实走哪条路对现阶段影响都不大，因为我们后来的人生都不是通过一个决定就能决定的。', source: '' },
      { content: '年轻的时候可能有很多不一样的冲动，或者是很执着于某件事，但是以后可能不会。你现在想想学生时代，你会执着的东西很多在现在看来没那么重要的事。', source: '' },
      { content: '借天地万物，不求终将到达某处，只求路上少些阻碍，让他们通往平凡。', source: '' },
      { content: '下次我带伞的时候，如果发现没带伞的人，我也一定会帮她打伞。', source: '' },
      { content: '请照顾好现在已经长大的自己，也保护好我们心中那个幼小的自己。', source: '' },
      { content: '含蓄可以含蓄，但是含蓄和直白都是表达方式，但你本身要表达啥，自己弄明白，往往细节打动人。', source: '' },
      { content: '总会有你想都想不到的事情出现，这才是人生。', source: '' },
      { content: '真实的自己就已经足够精彩了，没有必要为了迎合谁去做一个人设。', source: '' },
      { content: '跟真正喜欢你的人分享一些无伤大雅的缺点其实是一种互相信任的表现。', source: '' },
      { content: '他给你带来的快乐要大于痛苦，如果他带给你的痛苦更多，我觉得也是可以放下的。', source: '' },
      { content: '追求物质就是有虚荣心吗？盲目追求自己得不到的东西，"别人有，我也要有"的心理，才是虚荣。', source: '' },
      { content: '做真实的自己是最不累的。', source: '' },
      { content: '我人生中没有攀比，没有嫉妒心；见贤思齐是有的，但是这也很少出现，人家挣钱多和我有什么关系，大多数情况下，我没什么大起大落的情绪。', source: '' },
      { content: '"房和车"不是作为三十而立的勋章，而是说30岁的人往往更需要房子，更需要车吧，那个时候有它会活得更好而已。', source: '' },
      { content: '我是反对弄虚作假，如果你本来就是这样的人，然后找找身上好卖的点放大卖一卖我觉得是可以的，但如果你没有硬要说有，硬造个人设去卖，那就是一锤子买卖，很难长期卖。', source: '' },
      { content: '追求物质和追求精神不能作为人与人之间的区分，因为追求物质并不比追求精神肤浅。', source: '' },
      { content: '人的本质不是喜欢钱，而是钱予人的自由。如果这个世界上所有的东西都是我来支配的话，我根本不需要钱。', source: '' },
      { content: '要做善良的人。岁月其实有自重。晴天总比雨天多。', source: '' },
      { content: '风雪背后，那是春天的消息。', source: '' },
      { content: '每个人，他一定对某些人来说是最重要的。', source: '' },
      { content: '如果你以后，想真正通过创造这条路去做你自己的作品的话，你肯定要有一个深层的、属于你自己的价值观，去在你的作品中，做一个从头到尾的支撑。每次表达自己作品的机会其实是非常宝贵的。', source: '2020.05.03创造营' },
      { content: '我觉得还有一个方面就是要敢突破，我们不管是在舞台上还是生活当中，有很多是我们从来没有尝试过的事情，只有不断地尽可能多的去尝试，才能让自己的人生变得丰富，才能够有可能遇见一个更优秀的自己。', source: '2020.4.21 创造营发布会' },
      { content: '有的技能，它就是需要时间去培养的。', source: '创造营2020' },
      { content: '如果大家能在人群中看见你，不管是以什么方式，这个是比较重要的天赋。', source: '创造营2020' },
      { content: '每个人的成长是一个孤单的旅程，但总有一些眼睛在默默的注视你，你的喜怒哀乐牵动着他们的心，他们始终为你守候。', source: '毛不易2020.08.03发博' },
      { content: '每个人都是在孤单中渐渐长大。但只要"你"在身旁，陪伴就是治愈孤单最好的方式。', source: '毛不易2020.08.17发博' },
      { content: '创作本身就不是为了受到别人的喜欢，当然应该坚持。', source: '2020东方新云榜获奖采访' },
      { content: '希望大家在刚刚进入社会的时候，拿出自己的勇气，勇敢的做每一个决定，因为每个决定其实，以后回过头来看都是正确的决定。', source: '2020东方新云榜获奖采访' },
      { content: '银河之下，人类皆为凡尘，但即便一切湮没，一切也可以再重来。', source: '2020.07.20发博' },
      { content: '跃入人海，各有风雨灿烂。', source: '' },
      { content: '2020，我要继续快乐，做更好的自己。', source: '向往的生活' },
      { content: '惊喜不是别人送给你的，而是自己通过努力后才得到、发现的。', source: '2020.07.04发博' },
      { content: '飞去吧，不会错的。', source: '2020.06.29发博' },
      { content: '把兴趣变成工作未见得是件好事，把自己擅长的东西变成工作这个是比较重要的。', source: '' },
      { content: '一个习惯的培养肯定是从刻意开始的，肯定要最开始强迫自己。不管是看电子书还是纸质的书，尽可能要随身携带它。当你看完一两本之后你形成了这个阅读的习惯，你后来就会一直非常主动的去看书。', source: '' },
      { content: '先爱自己啊。', source: '2020.06.14发博' },
      { content: '其实真正美好的经历不需要任何形式的记录，因为我们的心比任何高科技的纪录都要美好很多很多。', source: '2020.06.08发博' },
      { content: '其实做艺人有很多需要和自己对抗的时候。不过因为到头来，还是有让自己觉得很骄傲的作品，我不后悔。', source: '' },
      { content: '希望大家能够在忙碌的生活中也好好吃饭，吃热的饭。', source: '' },
      { content: '吐槽是很奇妙的体验，能让一些不动听的话，产生真实的愉悦。', source: '创造营第六期' },
      { content: '输赢不重要，希望大家珍惜这份回忆。', source: '创造营第三期' },
      { content: '放弃也没有错，但是不放弃，才是我们需要努力做到的。', source: '创造营第三期' },
      { content: '不要在意结果，把作品留在舞台上。', source: '创造营第三期' },
      { content: '四年过去，我成为了一名歌手，依然在寻找着关于生活和梦想的答案。很久之后我们忽然想起，那个时候自己度过了一段很好很好的时光。', source: '' },
      { content: '我心目中的英雄，他是无论身居什么岗位，都能无私忘我、为人民的利益奋斗不息、守护公平正义的每一个平凡人。', source: '2021.02.08工作室微博' },
      { content: '希望大家平安健康，在平安健康的前提下，可以让自己成长，或者是积累财富，或者是提升自己，希望大家有收获。', source: '2021.02.05快手二次元采访' },
      { content: '最强厂牌除了各种优秀之外，一定还有一个最闪耀的地方：独立的人格。', source: '' },
      { content: '请大家好好照顾自己，也请保护好我们心中那个幼小的自己。', source: '' },
    ];

    let idx = 1;
    anpu.forEach(q => { this.add('daily_quote', { artist: '安溥', content: q.content, source: q.source, index: idx, last_shown: '' }); idx++; });
    idx = 1;
    maobuyi.forEach(q => { this.add('daily_quote', { artist: '毛不易', content: q.content, source: q.source, index: idx, last_shown: '' }); idx++; });
  },

  // ---------- 每日语录获取 ----------
  // 安溥（奇数日） / 毛不易（偶数日）交替
  getTodayQuote() {
    const today = this.todayStr();
    const dayNum = new Date(today).getDate();
    const artist = dayNum % 2 === 1 ? '安溥' : '毛不易';
    const allQuotes = this.query('daily_quote', r => r.artist === artist);

    if (allQuotes.length === 0) return null;

    // 找最近没展示过的，优先找从未展示的
    const neverShown = allQuotes.filter(q => !q.last_shown);
    let quote;
    if (neverShown.length > 0) {
      quote = neverShown[0];
    } else {
      // 全部展示过了，找最早展示的
      allQuotes.sort((a, b) => (a.last_shown || '').localeCompare(b.last_shown || ''));
      quote = allQuotes[0];
    }

    // 标记已展示
    if (quote && quote.last_shown !== today) {
      this.update('daily_quote', quote.id, { last_shown: today });
    }

    return quote;
  },
};
