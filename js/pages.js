/* ============================================
   页面渲染器 - pages.js
   全部 13 个导航模块的页面渲染逻辑
   ============================================ */

const Pages = {

  // ---------- 页面头部 ----------
  header(title, desc) {
    return `<div class="page-header"><h2>${UI.esc(title)}</h2>${desc ? `<div class="desc">${UI.esc(desc)}</div>` : ''}</div>`;
  },

  // ---------- 添加按钮 ----------
  addButton(dbName, label) {
    return `<div class="mb-3"><button class="btn btn-primary btn-sm" onclick="UI.openFormModal('${dbName}', null)">+ ${UI.esc(label)}</button></div>`;
  },

  // ==========================================
  // 1. 今日仪表盘
  // ==========================================
  dashboard() {
    const today = Store.todayStr();
    let html = this.header('🌟 今日仪表盘', `${today} · 保持节奏，闪闪发光 ✨`);

    // 获取或创建今日打卡记录
    let checkin = Store.query('daily_checkin', r => r.date === today)[0];
    if (!checkin) {
      checkin = Store.add('daily_checkin', {
        date: today,
        hearing_done: false, hearing_note: '', reading_done: false, reading_note: '',
        speaking_done: false, speaking_note: '', exercise_done: false,
        morning_meds: false, afternoon_meds: false,
        water_1: false, water_2: false, water_3: false, water_4: false,
        water_5: false, water_6: false, water_7: false, water_8: false,
        xiaomi_signin: false, netease_signin: false, browser_signin: false, wallet_signin: false,
        skincare_morning: false, skincare_evening: false, blackhead_done: false,
        praise: '', mood: '', notes: '',
      });
    }

    html += '<div class="dashboard-grid">';

    // 每日语录卡片 — 全宽，放在中间位
    html += this.dashboardQuote();

    html += '<div class="dashboard-left">';

    // 卡片1：英语学习
    html += `<div class="checkin-group">
      <h4>📚 英语学习</h4>
      ${this.checkinRow(checkin.id, 'hearing_done', 'hearing_note', '🎧 每日听力', checkin.hearing_done, checkin.hearing_note)}
      ${this.checkinRow(checkin.id, 'reading_done', 'reading_note', '📖 每日阅读', checkin.reading_done, checkin.reading_note)}
      ${this.checkinRow(checkin.id, 'speaking_done', 'speaking_note', '🗣️ 口语练习', checkin.speaking_done, checkin.speaking_note)}
    </div>`;

    // 卡片2：运动与吃药
    const totalMeds = Store.getTotalMedPills();
    html += `<div class="checkin-group">
      <h4>🏃 运动与吃药</h4>
      ${this.checkinItem(checkin.id, 'exercise_done', '✅ 运动', checkin.exercise_done)}
      ${this.checkinItem(checkin.id, 'morning_meds', '💊 上午吃药', checkin.morning_meds)}
      ${this.checkinItem(checkin.id, 'afternoon_meds', '💊 下午吃药', checkin.afternoon_meds)}
      <div class="med-total" style="margin-top:8px;padding:6px 10px;background:var(--mint-lightest);border-radius:8px;font-size:13px;">
        💊 累计已吃 <b style="color:var(--mint-dark);">${totalMeds}</b> 颗
        <span class="text-sm text-muted">（勾选即+1，取消即-1，自动统计历史）</span>
      </div>
    </div>`;

    // 卡片3：喝水打卡
    html += this.waterCard(checkin);

    // 卡片4：薅羊毛
    html += `<div class="checkin-group">
      <h4>🐑 薅羊毛</h4>
      ${this.checkinItem(checkin.id, 'xiaomi_signin', '🎵 小米视频签到', checkin.xiaomi_signin)}
      ${this.checkinItem(checkin.id, 'netease_signin', '☁️ 网易云云贝签到', checkin.netease_signin)}
      ${this.checkinItem(checkin.id, 'browser_signin', '🌐 小米浏览器签到', checkin.browser_signin)}
      ${this.checkinItem(checkin.id, 'wallet_signin', '💰 小米钱包签到', checkin.wallet_signin)}
    </div>`;

    // 卡片5：护肤（周三加去黑头）
    const isWednesday = new Date().getDay() === 3;
    html += `<div class="checkin-group">
      <h4>🧴 护肤${isWednesday ? '与去黑头' : ''}</h4>
      ${this.checkinItem(checkin.id, 'skincare_morning', '☀️ 晨间护肤', checkin.skincare_morning)}
      ${this.checkinItem(checkin.id, 'skincare_evening', '🌙 晚间护肤', checkin.skincare_evening)}
      ${isWednesday ? this.checkinItem(checkin.id, 'blackhead_done', '🖤 去黑头护理', checkin.blackhead_done) : ''}
    </div>`;

    // 卡片5：今日夸夸
    const todayPraise = Store.getPraiseByDate(Store.todayStr()).map(p => p.content).join('\n');
    html += `<div class="checkin-group">
      <h4>🌸 今日夸夸</h4>
      <textarea class="form-textarea" placeholder="今天也要好好夸夸自己呀～（每行一句）" onblur="App.saveDayPraise(this.value)">${UI.esc(todayPraise)}</textarea>
    </div>`;

    // 卡片6：今日心情
    const moods = ['🌟超棒', '😌平静', '😴疲惫', '😢难过', '😰焦虑'];
    html += `<div class="checkin-group">
      <h4>😊 今日心情</h4>
      <div class="flex gap-2 flex-wrap">
        ${moods.map(m => `<span class="filter-chip ${checkin.mood === m ? 'active' : ''}" onclick="App.saveCheckinField('${checkin.id}', 'mood', '${m}'); App.rerender()">${m}</span>`).join('')}
      </div>
    </div>`;

    // TodoList 区域
    html += this.dashboardTodo();

    html += '</div>'; // end dashboard-left

    // 右栏
    html += '<div class="dashboard-right">';
    html += this.dashboardWishlist();
    html += this.dashboardExercise();
    html += this.dashboardExpense();
    html += this.dashboardDebt();
    html += this.dashboardAssets();
    html += this.dashboardStarAlert();
    html += this.dashboardQuitSmoking();
    html += this.dashboardMood(checkin);
    html += '</div>';

    html += '</div>'; // end dashboard-grid
    return html;
  },

  // 打卡行（勾选框+备注）
  checkinRow(recordId, cbField, noteField, label, checked, note) {
    return `<div class="checkbox-row">
      <span class="cbx ${checked ? 'checked' : ''}" onclick="App.toggleCheckin('${recordId}', '${cbField}')"></span>
      <span class="cbx-label">${label}</span>
      <input type="text" class="form-input note-input" placeholder="备注..." value="${UI.esc(note || '')}" onblur="App.saveCheckinField('${recordId}', '${noteField}', this.value)">
    </div>`;
  },

  // 单个打卡项
  checkinItem(recordId, field, label, checked) {
    return `<div class="checkbox-row">
      <span class="cbx ${checked ? 'checked' : ''}" onclick="App.toggleCheckin('${recordId}', '${field}')"></span>
      <span class="cbx-label">${label}</span>
    </div>`;
  },

  // 喝水卡片
  waterCard(checkin) {
    const waters = [
      { field: 'water_1', label: '☀️ 起床空腹', amount: 250, time: '07:00', hint: '唤醒肠胃' },
      { field: 'water_2', label: '🕙 上午', amount: 250, time: '10:00', hint: '' },
      { field: 'water_3', label: '🍚 午饭前', amount: 200, time: '12:00', hint: '增加饱腹感' },
      { field: 'water_4', label: '🍵 午饭后1h', amount: 200, time: '13:00', hint: '' },
      { field: 'water_5', label: '😴 下午', amount: 250, time: '15:30', hint: '缓解犯困' },
      { field: 'water_6', label: '🍜 晚饭前', amount: 200, time: '18:00', hint: '' },
      { field: 'water_7', label: '🛀 晚饭后1h', amount: 200, time: '19:00', hint: '' },
      { field: 'water_8', label: '🌙 睡前1.5h', amount: 150, time: '22:00', hint: '' },
    ];
    const done = waters.filter(w => checkin[w.field]).length;
    const totalMl = waters.filter(w => checkin[w.field]).reduce((s, w) => s + w.amount, 0);
    const pct = Math.round((done / waters.length) * 100);

    let html = `<div class="checkin-group">
      <h4>💧 喝水打卡 <span class="target">${totalMl} / 1700ml · ${done}/${waters.length} 次</span></h4>`;
    html += `<div style="background:var(--mint-lightest);border-radius:8px;height:6px;margin-bottom:10px;overflow:hidden;">
      <div style="background:var(--mint-primary);height:100%;width:${pct}%;border-radius:8px;transition:width 0.3s;"></div>
    </div>`;
    waters.forEach(w => {
      html += `<div class="checkbox-row">
        <span class="cbx ${checkin[w.field] ? 'checked' : ''}" onclick="App.toggleCheckin('${checkin.id}', '${w.field}'); App.rerender()"></span>
        <span class="cbx-label">${w.label} ${w.amount}ml</span>
        <span class="time-hint">${w.time} ${w.hint ? '· ' + w.hint : ''}</span>
      </div>`;
    });
    html += '</div>';
    return html;
  },

  // 仪表盘 TodoList
  dashboardTodo() {
    const today = Store.todayStr();
    let todos = Store.query('todo_list', r => r.deadline <= today);
    // 按优先级排序，完成的排后面
    const order = { '高': 0, '中': 1, '低': 2 };
    todos.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (order[a.priority] || 3) - (order[b.priority] || 3);
    });

    const undone = todos.filter(t => !t.completed).length;
    let html = `<div class="card card-dot-border">
      <div class="card-title">✅ 今日待办 <span class="badge">${undone} 项未完成</span></div>`;
    if (todos.length === 0) {
      html += `<div class="empty-state"><div class="emoji">🎉</div><p>今天还没有任务，点击下方按钮添加～</p></div>`;
    } else {
      todos.forEach(t => {
        const lineThrough = t.completed ? 'text-decoration:line-through;opacity:0.5;' : '';
        html += `<div class="checkbox-row" style="${lineThrough}">
          <span class="cbx ${t.completed ? 'checked' : ''}" onclick="App.toggleTodo('${t.id}')"></span>
          <span class="cbx-label">${UI.esc(t.task_name)}</span>
          ${t.priority === '高' ? '<span class="tag tag-danger">高</span>' : t.priority === '中' ? '<span class="tag tag-warn">中</span>' : '<span class="tag tag-gray">低</span>'}
          <button class="btn btn-danger btn-sm btn-icon" onclick="App.deleteTodo('${t.id}')" style="margin-left:auto;">🗑️</button>
        </div>`;
      });
    }
    html += `<button class="btn-add mt-3" onclick="UI.openFormModal('todo_list', null)">+ 添加任务</button>`;
    html += '</div>';
    return html;
  },

  // ==== 每日语录卡片（仪表盘中间全宽）====
  dashboardQuote() {
    const quote = Store.getTodayQuote();
    if (!quote) return '';
    const artist = quote.artist;
    const emoji = artist === '安溥' ? '🎸' : '🎤';
    const title = `${emoji} 听${artist}说`;

    // 每日颜色：根据日期在预设色板中轮换
    const dayOfMonth = new Date().getDate();
    const palette = [
      '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
      '#009688', '#4caf50', '#8bc34a', '#ff9800', '#ff5722',
      '#795548', '#607d8b', '#f44336', '#00bcd4', '#cddc39',
      '#ff6f00', '#1a237e', '#004d40', '#b71c1c', '#880e4f',
      '#2e7d32', '#1565c0', '#6a1b9a', '#bf360c', '#827717',
      '#00695c', '#c51162', '#2962ff', '#00bfa5', '#d50000',
      '#6200ea',
    ];
    const textColor = palette[dayOfMonth % palette.length];

    // 根据内容长度自适应字号
    const len = (quote.content || '').length;
    let fontSize, lineHeight;
    if (len > 400)       { fontSize = '11.5px'; lineHeight = '1.45'; }
    else if (len > 300)  { fontSize = '12px';   lineHeight = '1.5'; }
    else if (len > 200)  { fontSize = '12.5px'; lineHeight = '1.55'; }
    else if (len > 100)  { fontSize = '13px';   lineHeight = '1.6'; }
    else if (len > 40)   { fontSize = '14px';   lineHeight = '1.65'; }
    else                 { fontSize = '15px';   lineHeight = '1.7'; }

    return `<div class="card quote-card" style="grid-column:1 / -1; border-left:3px solid ${textColor}; margin-bottom:14px;">
      <div style="font-size:13px;font-weight:600;margin-bottom:8px;color:${textColor};">${title}</div>
      <div class="quote-handwriting" style="font-size:${fontSize};line-height:${lineHeight};color:${textColor};">
        「${UI.esc(quote.content)}」
      </div>
      ${quote.source ? `<div style="margin-top:6px;font-size:11px;text-align:right;opacity:0.6;color:${textColor};">—— ${UI.esc(quote.source)}</div>` : ''}
    </div>`;
  },

  // 右栏卡片
  dashboardWishlist() {
    const items = Store.query('wishlist', r => r.priority === '很想要' && !r.purchased);
    let html = `<div class="card"><div class="card-title">🛒 最近想买 <span class="badge">${items.length}</span></div>`;
    if (items.length === 0) {
      html += '<p class="text-muted text-sm">暂无想要的物品</p>';
    } else {
      items.forEach(w => {
        html += `<div class="flex items-center gap-2 mb-2" style="justify-content:space-between;">
          <div class="flex items-center gap-2">
            <span>${UI.esc(w.item_name)}</span>
            <span class="tag tag-warn">¥${w.price || 0}</span>
            ${w.link ? `<a href="${UI.esc(w.link)}" target="_blank" class="text-sm">🔗</a>` : ''}
          </div>
          <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();UI.confirmDelete('wishlist','${w.id}')" style="flex-shrink:0;padding:2px 6px;font-size:11px;">🗑️</button>
        </div>`;
      });
    }
    html += '</div>';
    return html;
  },

  dashboardExercise() {
    const videos = Store.getAll('exercise_videos');
    // 随机取4个
    const shuffled = [...videos].sort(() => Math.random() - 0.5).slice(0, 4);
    let html = `<div class="card"><div class="card-title">🏃‍♀️ 快速运动 <span class="badge">${videos.length} 个</span></div>`;
    if (shuffled.length === 0) {
      html += '<p class="text-muted text-sm">暂无运动视频</p>';
    } else {
      shuffled.forEach(v => {
        const platformIcon = v.platform === '抖音' ? '🎵' : '📺';
        html += `<div class="kanban-card" style="position:relative;">
          <div class="flex items-center justify-between">
            <div class="kc-title" style="flex:1;cursor:pointer;" onclick="window.open('${UI.esc(v.link || '#')}', '_blank')">${UI.esc(v.title)}</div>
            <button class="btn btn-danger btn-sm" style="flex-shrink:0;margin-left:6px;padding:2px 6px;font-size:11px;" onclick="event.stopPropagation();UI.confirmDelete('exercise_videos','${v.id}')">🗑️</button>
          </div>
          <div class="kc-meta">${platformIcon} ${UI.esc(v.platform || '')} ${v.duration ? '· ⏱️ ' + UI.esc(v.duration) : ''}</div>
        </div>`;
      });
    }
    html += '</div>';
    return html;
  },

  dashboardExpense() {
    const today = Store.todayStr();
    const expenses = Store.query('accounting', r => r.date === today && r.type === '支出');
    const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    let html = `<div class="card"><div class="card-title">💸 今日支出 <span class="badge">¥${total}</span></div>`;
    if (expenses.length === 0) {
      html += '<p class="text-muted text-sm">今天还没有支出记录</p>';
    } else {
      expenses.slice(-5).forEach(e => {
        html += `<div class="flex items-center justify-between mb-2">
          <span class="text-sm">${UI.esc(e.item || '—')}</span>
          <span class="text-danger font-bold">¥${e.amount || 0}</span>
        </div>`;
      });
    }
    html += '</div>';
    return html;
  },

  dashboardDebt() {
    const debts = Store.query('accounting', r => r.debt_status === '未还');
    const byAccount = {};
    debts.forEach(d => {
      if (!byAccount[d.account]) byAccount[d.account] = 0;
      byAccount[d.account] += d.amount || 0;
    });
    const accounts = Object.keys(byAccount);
    let html = `<div class="card"><div class="card-title">🚨 欠款追踪 <span class="badge">${accounts.length > 0 ? '需关注' : '无欠款'}</span></div>`;
    if (accounts.length === 0) {
      html += '<p class="text-muted text-sm">🎉 暂无欠款</p>';
    } else {
      accounts.forEach(acc => {
        html += `<div class="flex items-center justify-between mb-2">
          <span class="tag tag-danger">${UI.esc(acc)}</span>
          <span class="text-danger font-bold">¥${byAccount[acc]}</span>
        </div>`;
      });
    }
    html += '</div>';
    return html;
  },

  dashboardAssets() {
    const assets = Store.getAll('assets');
    const cashTotal = assets.filter(a => !a.is_credit).reduce((s, a) => s + (a.balance || 0), 0);
    const creditTotal = assets.filter(a => a.is_credit).reduce((s, a) => s + (a.balance || 0), 0);
    const netWorth = cashTotal - creditTotal;
    let html = `<div class="card"><div class="card-title">🏦 总资产 <span class="badge ${netWorth >= 0 ? '' : 'tag-danger'}">¥${netWorth}</span></div>`;
    if (assets.length === 0) {
      html += '<p class="text-muted text-sm">暂无资产记录</p>';
    } else {
      // 显示前几个账户
      assets.slice(0, 5).forEach(a => {
        const isCred = a.is_credit;
        html += `<div class="flex items-center justify-between mb-2">
          <span class="text-sm">${isCred ? '💳' : a.type === '微信' ? '💬' : a.type === '支付宝' ? '🔵' : a.type === '现金' ? '💵' : '💰'} ${UI.esc(a.name)}</span>
          <span class="font-bold ${isCred ? 'text-danger' : 'text-mint'}">¥${a.balance || 0}</span>
        </div>`;
      });
      if (assets.length > 5) {
        html += `<p class="text-sm text-muted">还有 ${assets.length - 5} 个账户...</p>`;
      }
    }
    html += '</div>';
    return html;
  },

  dashboardStarAlert() {
    const today = Store.todayStr();
    const alerts = Store.query('star_tracking', r => r.ticket_date === today || r.show_date === today);
    let html = `<div class="card"><div class="card-title">🎤 追星提醒 ${alerts.length > 0 ? '<span class="badge tag-danger">⚠️ 今天有安排</span>' : ''}</div>`;
    if (alerts.length === 0) {
      // 显示即将到来的演出
      const upcoming = Store.getAll('star_tracking')
        .filter(r => r.show_date && r.show_date >= today)
        .sort((a, b) => (a.show_date || '').localeCompare(b.show_date || ''))
        .slice(0, 2);
      if (upcoming.length === 0) {
        html += '<p class="text-muted text-sm">暂无演出安排</p>';
      } else {
        upcoming.forEach(s => {
          html += `<div class="text-sm mb-2">
            <span>${s.artist === '安溥' ? '🎸' : '🎤'} ${UI.esc(s.show_name)}</span><br>
            <span class="text-muted">📅 ${UI.esc(s.show_date)} · ${UI.esc(s.city || '')}</span>
          </div>`;
        });
      }
    } else {
      alerts.forEach(s => {
        const isTicket = s.ticket_date === today;
        html += `<div style="background:var(--danger-bg);border-radius:8px;padding:10px;margin-bottom:8px;">
          <div class="font-bold">${isTicket ? '🎫 今天抢票！' : '🎤 今天演出！'}</div>
          <div class="text-sm">${UI.esc(s.artist)} - ${UI.esc(s.show_name)}</div>
          ${s.ticket_platform ? `<div class="text-sm text-muted">平台：${UI.esc(s.ticket_platform)}</div>` : ''}
          ${s.venue ? `<div class="text-sm text-muted">场馆：${UI.esc(s.venue)}</div>` : ''}
        </div>`;
      });
    }
    html += '</div>';
    return html;
  },

  dashboardQuitSmoking() {
    const today = Store.todayStr();
    const todayRecord = Store.query('quit_smoking', r => r.date === today)[0];
    const allRecords = Store.getAll('quit_smoking');
    let streak = 0;
    const dateSorted = [...allRecords].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    for (const r of dateSorted) {
      if (r.smoked === '没抽') streak++;
      else break;
    }
    let html = '<div class="card"><div class="card-title">🚭 戒烟追踪</div>';
    if (todayRecord) {
      const smokeTag = todayRecord.smoked === '没抽'
        ? '<span class="tag tag-mint">✅ 今天没抽</span>'
        : '<span class="tag tag-danger">⚠️ 抽了 ' + (todayRecord.count || 0) + ' 根</span>';
      html += '<div class="text-sm mb-2">' + smokeTag + '</div>';
    } else {
      html += '<div class="mb-2"><button class="btn btn-primary btn-sm" onclick="App.navigate(\'quit-smoking\')">📝 记录今天</button></div>';
    }
    if (streak > 0) {
      html += '<div class="text-sm" style="color:#2e7d32;font-weight:600;">🔥 已连续 ' + streak + ' 天无烟！</div>';
    } else if (todayRecord && todayRecord.smoked === '抽了') {
      html += '<div class="text-sm" style="color:#e65100;">💪 没关系，继续加油！</div>';
    }
    html += '</div>';
    return html;
  },

  dashboardMood(checkin) {
    let html = `<div class="card"><div class="card-title">😊 今日心情</div>`;
    if (checkin.mood) {
      html += `<div class="text-center" style="font-size:36px;">${checkin.mood}</div>`;
    } else {
      html += '<p class="text-muted text-sm text-center">还没有记录今天的心情</p>';
    }
    html += '</div>';
    return html;
  },

  // ==========================================
  // 2. 英语学习
  // ==========================================
  englishTable(type) {
    const titles = { '听力': '🎧 每日听力', '阅读': '📖 每日阅读', '口语': '🗣️ 口语练习' };
    let html = this.header(titles[type] || '英语学习', `英语${type}学习素材管理`);
    const records = Store.query('english_learning', r => r.type === type).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const schema = Store.schemas.english_learning;
    html += `<div class="mb-3"><button class="btn btn-primary btn-sm" onclick="UI.openFormModal('english_learning', {type: '${type}'})">+ 新增素材</button></div>`;
    if (records.length === 0) {
      html += UI.emptyState('📚', '暂无素材，点击上方按钮添加');
    } else {
      html += '<div style="overflow-x:auto;"><table class="data-table"><thead><tr>';
      html += '<th>日期</th><th>标题</th><th>链接</th><th>笔记</th><th>操作</th></tr></thead><tbody>';
      records.forEach(r => {
        html += `<tr>
          <td>${UI.esc(r.date || '—')}</td>
          <td>${UI.esc(r.title || '—')}</td>
          <td>${r.link ? `<a href="${UI.esc(r.link)}" target="_blank" class="tag tag-mint">🔗 打开</a>` : '—'}</td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;">${UI.esc((r.notes || '').slice(0, 50))}${(r.notes || '').length > 50 ? '...' : ''}</td>
          <td class="row-actions">
            <button class="btn btn-outline btn-sm" onclick="UI.openFormModalById('english_learning', '${r.id}')">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="UI.confirmDelete('english_learning', '${r.id}')">🗑️</button>
          </td>
        </tr>`;
      });
      html += '</tbody></table></div>';
    }
    return html;
  },

  englishSites() {
    let html = this.header('🌐 学习网站汇总', '精选英语学习资源 · 可增删改');
    const sites = Store.getAll('english_sites');
    html += this.addButton('english_sites', '添加网站');

    if (sites.length === 0) {
      html += UI.emptyState('🌐', '暂无学习网站，点击上方按钮添加');
    } else {
      sites.forEach((s, i) => {
        html += `<div class="site-card">
          <div class="site-icon">${UI.esc(s.icon || '🌐')}</div>
          <div class="site-info">
            <h4>${UI.esc(s.name)}</h4>
            <p>${UI.esc(s.desc || '')}</p>
          </div>
          <div class="flex items-center gap-2" style="flex-shrink:0;">
            <a href="${UI.esc(s.url)}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">前往 →</a>
            <button class="btn btn-outline btn-sm" onclick="UI.openFormModalById('english_sites', '${s.id}')">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="UI.confirmDelete('english_sites', '${s.id}')">🗑️</button>
          </div>
        </div>`;
      });
    }
    return html;
  },

  // ==========================================
  // 3. 影视音清单
  // ==========================================
  mediaKanban() {
    let html = this.header('🎬 影视音清单', '看板视图 · 按类别分组');
    const records = Store.getAll('media_list');
    html += this.addButton('media_list', '新增条目');
    html += UI.kanban({
      dbName: 'media_list',
      records,
      groupField: 'category',
      groupValues: ['电影', '剧集', '音乐专辑', '阅读'],
      cardRenderer: (r) => {
        const statusTag = r.status ? `<span class="tag ${r.status === '已看' || r.status === '已听' || r.status === '已读' ? 'tag-mint' : 'tag-warn'}">${UI.esc(r.status)}</span>` : '';
        const rating = r.rating ? `<span class="stars">${'★'.repeat(Math.min(5, r.rating))}</span>` : '';
        return `<div class="kanban-card" onclick="UI.openFormModalById('media_list', '${r.id}')">
          <div class="kc-title">${UI.esc(r.name)}</div>
          <div class="kc-meta">${statusTag} ${rating}</div>
        </div>`;
      },
      onAdd: true,
    });
    return html;
  },

  mediaTable(category) {
    const titles = { '电影': '🎥 电影清单', '剧集': '📺 剧清单', '音乐专辑': '🎵 音乐专辑清单', '阅读': '📚 阅读清单' };
    let html = this.header(titles[category], `${category}列表`);

    // 状态颜色映射
    const statusColors = {
      '想看': '#2196f3', '在听': '#ff9800', '在读': '#ff9800',
      '已看': '#4caf50', '已听': '#4caf50', '已读': '#4caf50',
    };
    const statusBg = {
      '想看': '#e3f2fd', '在听': '#fff3e0', '在读': '#fff3e0',
      '已看': '#e8f5e9', '已听': '#e8f5e9', '已读': '#e8f5e9',
    };

    // 筛选
    const allStatuses = ['想看', '在听', '在读', '已看', '已听', '已读'];
    const activeFilter = App.mediaFilter || '全部';
    let records = Store.query('media_list', r => r.category === category);
    if (activeFilter !== '全部') {
      records = records.filter(r => r.status === activeFilter);
    }

    // 筛选标签栏
    const filterChips = [{ id: '全部', label: '全部' }];
    allStatuses.forEach(s => filterChips.push({ id: s, label: s }));
    html += UI.filterChips(filterChips, activeFilter, 'App.setMediaFilter');

    html += `<div class="mb-3"><button class="btn btn-primary btn-sm" onclick="UI.openFormModal('media_list', {category: '${category}'})">+ 新增${category}</button></div>`;
    if (records.length === 0) {
      html += UI.emptyState('🎬', `暂无${category}记录`);
    } else {
      html += '<div style="overflow-x:auto;"><table class="data-table"><thead><tr>';
      html += '<th>名称</th><th>状态</th><th>评分</th><th>观看日期</th><th>笔记</th><th>操作</th></tr></thead><tbody>';
      records.forEach(r => {
        const color = statusColors[r.status] || '#757575';
        const bg = statusBg[r.status] || '#f5f5f5';
        // 评分：星星 + 数字
        let ratingHtml = '—';
        if (r.rating) {
          const full = Math.floor(r.rating);
          const half = r.rating - full >= 0.25 && r.rating - full < 0.75;
          const empty = 5 - full - (half ? 1 : 0);
          ratingHtml = `<span style="color:#ffc107;font-size:14px;">${'★'.repeat(full)}${half ? '½' : ''}${'☆'.repeat(empty)}</span> <span style="font-size:12px;color:var(--text-muted);">${Number(r.rating).toFixed(1)}</span>`;
        }
        html += `<tr>
          <td style="font-weight:500;">${UI.esc(r.name || '—')}</td>
          <td><span class="tag" style="background:${bg};color:${color};font-weight:600;">${UI.esc(r.status || '—')}</span></td>
          <td>${ratingHtml}</td>
          <td>${UI.esc(r.watched_date || '—')}</td>
          <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;">${UI.esc(r.note || '—')}</td>
          <td class="row-actions">
            <button class="btn btn-outline btn-sm" onclick="UI.openFormModalById('media_list', '${r.id}')">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="UI.confirmDelete('media_list', '${r.id}')">🗑️</button>
          </td>
        </tr>`;
      });
      html += '</tbody></table></div>';
    }
    return html;
  },

  // ==========================================
  // 4. 阅读笔记
  // ==========================================
  readingNotes() {
    let html = this.header('📝 阅读笔记', '按书名分组管理阅读笔记');
    const records = Store.getAll('reading_notes').sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''));
    html += this.addButton('reading_notes', '新增笔记');

    if (records.length === 0) {
      html += UI.emptyState('📚', '暂无阅读笔记，去影视音清单添加一本书吧');
      return html;
    }

    // 按书名分组
    const groups = {};
    records.forEach(r => {
      const bookLabel = r.book_name ? Store.getRelationLabel('media_list', r.book_name) : '未关联书籍';
      if (!groups[bookLabel]) groups[bookLabel] = [];
      groups[bookLabel].push(r);
    });

    Object.keys(groups).forEach(bookName => {
      html += `<div class="card">
        <div class="card-title">📖 ${UI.esc(bookName)} <span class="badge">${groups[bookName].length} 条</span></div>`;
      groups[bookName].forEach(note => {
        html += `<div class="kanban-card" onclick="UI.openFormModalById('reading_notes', '${note.id}')">
          <div class="kc-title">${UI.esc(note.note_title || '未命名笔记')}</div>
          <div class="kc-meta">${note.page_chapter ? `📍 ${UI.esc(note.page_chapter)}` : ''} ${note.created_date ? `· 📅 ${UI.esc(note.created_date)}` : ''}</div>
          ${note.excerpt ? `<div class="text-sm text-muted mt-2" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${UI.esc(note.excerpt.slice(0, 60))}...</div>` : ''}
        </div>`;
      });
      html += '</div>';
    });
    return html;
  },

  // ==========================================
  // 5. TodoList
  // ==========================================
  todo() {
    let html = this.header('✅ TodoList', '管理所有待办任务');
    const today = Store.todayStr();
    const allTodos = Store.getAll('todo_list');
    const activeFilter = App.todoFilter || 'today';
    const dateFilter = App.todoDateFilter || '';

    let filtered = allTodos;
    if (activeFilter === 'today') {
      filtered = allTodos.filter(r => !r.completed && r.deadline <= today);
    } else if (activeFilter === 'tomorrow') {
      const tmr = new Date();
      tmr.setDate(tmr.getDate() + 1);
      const tmrStr = tmr.toISOString().slice(0, 10);
      filtered = allTodos.filter(r => !r.completed && r.deadline === tmrStr);
    } else if (activeFilter === 'week') {
      const { start, end } = Store.getWeekRange(new Date());
      const startStr = start.toISOString().slice(0, 10);
      const endStr = end.toISOString().slice(0, 10);
      filtered = allTodos.filter(r => r.deadline >= startStr && r.deadline <= endStr);
    } else if (activeFilter === 'date') {
      filtered = dateFilter ? allTodos.filter(r => r.deadline === dateFilter) : allTodos;
    } else if (activeFilter === 'done') {
      filtered = allTodos.filter(r => r.completed);
    } else {
      filtered = allTodos;
    }

    // 按类别分组（固定 + 自定义 + 实际出现的）
    const order = { '高': 0, '中': 1, '低': 2 };
    filtered.sort((a, b) => (order[a.priority] || 3) - (order[b.priority] || 3));

    const knownLabels = Store.getAllTodoCategoryLabels();
    const present = new Set(filtered.map(t => t.domain || '生活'));
    const allLabels = [...new Set([...knownLabels, ...present])];
    const groups = {};
    allLabels.forEach(d => groups[d] = []);
    filtered.forEach(t => {
      const d = t.domain || '生活';
      if (!groups[d]) groups[d] = [];
      groups[d].push(t);
    });

    html += `<div class="filter-bar">
      <span class="filter-chip ${activeFilter === 'today' ? 'active' : ''}" onclick="App.setTodoFilter('today')">今日</span>
      <span class="filter-chip ${activeFilter === 'tomorrow' ? 'active' : ''}" onclick="App.setTodoFilter('tomorrow')">明天</span>
      <span class="filter-chip ${activeFilter === 'week' ? 'active' : ''}" onclick="App.setTodoFilter('week')">本周</span>
      <span class="filter-chip ${activeFilter === 'date' ? 'active' : ''}" onclick="App.setTodoFilter('date')">📅 按日期</span>
      <span class="filter-chip ${activeFilter === 'all' ? 'active' : ''}" onclick="App.setTodoFilter('all')">全部</span>
      <span class="filter-chip ${activeFilter === 'done' ? 'active' : ''}" onclick="App.setTodoFilter('done')">已完成</span>
      <input type="date" class="form-input" style="width:auto;display:inline-block;padding:2px 8px;font-size:13px;" value="${UI.esc(dateFilter)}" onchange="App.setTodoDate(this.value)" title="选择日期查看当天待办">
      <button class="btn btn-outline btn-sm" style="margin-left:auto;" onclick="App.addTodoCategory()">+ 类别</button>
      <button class="btn btn-outline btn-sm" onclick="App.manageTodoCategories()">⚙️ 管理</button>
    </div>`;

    html += this.addButton('todo_list', '新增任务');

    let hasContent = false;
    allLabels.forEach(d => {
      if (groups[d] && groups[d].length > 0) {
        hasContent = true;
        html += `<div class="card">
          <div class="card-title">${this.domainIcon(d)} ${UI.esc(d)} <span class="badge">${groups[d].length}</span></div>`;
        groups[d].forEach(t => {
          html += `<div class="checkbox-row">
            <span class="cbx ${t.completed ? 'checked' : ''}" onclick="App.toggleTodo('${t.id}')"></span>
            <span class="cbx-label ${t.completed ? 'text-muted' : ''}" style="${t.completed ? 'text-decoration:line-through;' : ''}">${UI.esc(t.task_name)}</span>
            ${t.deadline ? `<span class="text-sm text-muted">${UI.esc(t.deadline)}</span>` : ''}
            ${t.priority === '高' ? '<span class="tag tag-danger">高</span>' : t.priority === '中' ? '<span class="tag tag-warn">中</span>' : '<span class="tag tag-gray">低</span>'}
            ${t.notes ? `<span class="text-sm text-muted" title="${UI.esc(t.notes)}">📝</span>` : ''}
            <button class="btn btn-outline btn-sm btn-icon" onclick="UI.openFormModalById('todo_list', '${t.id}')" style="margin-left:auto;">✏️</button>
            <button class="btn btn-danger btn-sm btn-icon" onclick="App.deleteTodo('${t.id}')">🗑️</button>
          </div>`;
          if (t.notes) {
            html += `<div class="text-sm text-muted" style="margin:0 0 8px 28px;">📝 ${UI.esc(t.notes)}</div>`;
          }
        });
        html += '</div>';
      }
    });

    if (!hasContent) {
      html += UI.emptyState('🎉', '暂无待办任务');
    }
    return html;
  },

  domainIcon(d) {
    const icons = { '英语学习': '📚', '观影': '🎬', '阅读': '📖', '灵感执行': '💡', '生活': '🏠', '追星': '🎤', '身体护理': '🧘', '购物': '🛒', '工作': '💼', '学习': '📝' };
    return icons[d] || '📌';
  },

  // ==========================================
  // 6. 灵感记录
  // ==========================================
  inspirationKanban() {
    let html = this.header('💡 灵感记录', '看板视图 · 特效与剪辑灵感');
    html += this.referenceCards();
    const records = Store.getAll('inspiration');
    html += this.addButton('inspiration', '记录灵感');
    html += UI.kanban({
      dbName: 'inspiration',
      records,
      groupField: 'category',
      groupValues: ['特效制作灵感', '剪辑灵感'],
      cardRenderer: (r) => {
        return `<div class="kanban-card" onclick="UI.openFormModalById('inspiration', '${r.id}')">
          <div class="kc-title">${UI.esc(r.title)}</div>
          <div class="kc-meta">${r.converted ? '<span class="tag tag-mint">已转化</span>' : '<span class="tag tag-gray">待转化</span>'}</div>
          ${r.description ? `<div class="text-sm text-muted mt-2" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${UI.esc(r.description.slice(0, 50))}</div>` : ''}
        </div>`;
      },
      onAdd: true,
    });
    return html;
  },

  inspirationTable(category) {
    const titles = { '特效制作灵感': '✨ 特效制作灵感', '剪辑灵感': '✂️ 剪辑灵感' };
    let html = this.header(titles[category], `${category}列表`);
    html += this.referenceCards();
    const records = Store.query('inspiration', r => r.category === category);
    html += `<div class="mb-3"><button class="btn btn-primary btn-sm" onclick="UI.openFormModal('inspiration', {category: '${category}'})">+ 新增灵感</button></div>`;
    if (records.length === 0) {
      html += UI.emptyState('💡', '暂无灵感，灵感来了就记下来');
    } else {
      records.forEach(r => {
        html += `<div class="card card-dot-border">
          <div class="flex items-center justify-between">
            <div class="kc-title font-bold">${UI.esc(r.title)}</div>
            ${r.converted ? '<span class="tag tag-mint">✓ 已转化</span>' : '<span class="tag tag-gray">待转化</span>'}
          </div>
          ${r.description ? `<p class="text-sm mt-2">${UI.esc(r.description)}</p>` : ''}
          ${r.reference ? `<a href="${UI.esc(r.reference)}" target="_blank" class="text-sm mt-2 inline-block">📎 参考素材</a>` : ''}
          <div class="flex gap-2 mt-3">
            <button class="btn btn-outline btn-sm" onclick="UI.openFormModalById('inspiration', '${r.id}')">✏️ 编辑</button>
            <button class="btn btn-danger btn-sm" onclick="UI.confirmDelete('inspiration', '${r.id}')">🗑️ 删除</button>
            ${!r.converted ? `<button class="btn btn-primary btn-sm" onclick="App.convertInspiration('${r.id}')">→ 转为任务</button>` : ''}
          </div>
        </div>`;
      });
    }
    return html;
  },

  referenceCards() {
    return `<div class="card-grid card-grid-2 mb-3">
      <a href="https://www.bilibili.com" target="_blank" rel="noopener" style="text-decoration:none;">
        <div class="site-card" style="margin-bottom:0;">
          <div class="site-icon">🎬</div>
          <div class="site-info"><h4>B站 / Pinterest</h4><p>特效制作参考</p></div>
        </div>
      </a>
      <a href="https://www.youtube.com" target="_blank" rel="noopener" style="text-decoration:none;">
        <div class="site-card" style="margin-bottom:0;">
          <div class="site-icon">✂️</div>
          <div class="site-info"><h4>新片场 / YouTube</h4><p>剪辑灵感参考</p></div>
        </div>
      </a>
    </div>`;
  },

  // ==========================================
  // 7. 身体记录
  // ==========================================
  bodyWeight() {
    let html = this.header('⚖️ 体重记录', '体重变化趋势');
    const records = Store.query('body_records', r => r.weight).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const today = Store.todayStr();
    html += `<div class="mb-3"><button class="btn btn-primary btn-sm" onclick="UI.openFormModal('body_records', {date: '${today}'}, {visibleFields: ['date', 'weight', 'notes']})">+ 记录体重</button></div>`;

    if (records.length > 0) {
      const latest = records[records.length - 1];
      html += `<div class="card text-center">
        <div class="text-muted text-sm">最新体重</div>
        <div class="font-bold" style="font-size:32px;color:var(--mint-primary);">${latest.weight} <span class="text-sm">kg</span></div>
        <div class="text-sm text-muted">${UI.esc(latest.date)}</div>
      </div>`;
      html += `<div class="chart-container mt-3">${this.weightLineChart(records)}</div>`;
    }

    html += '<div class="mt-3">';
    html += UI.table({
      dbName: 'body_records',
      records: Store.getAll('body_records').filter(r => r.weight).sort((a, b) => (b.date || '').localeCompare(a.date || '')),
      columns: [
        { field: 'date', label: '日期' },
        { field: 'weight', label: '体重(kg)' },
        { field: 'notes', label: '备注' },
      ],
      actions: {},
    });
    html += '</div>';
    return html;
  },

  weightLineChart(records) {
    const data = records.filter(r => r.weight);
    if (data.length < 2) return '<p class="text-muted text-center text-sm">至少需要两条记录才能显示趋势图</p>';

    const weights = data.map(r => r.weight);
    const minW = Math.min(...weights) - 0.5;
    const maxW = Math.max(...weights) + 0.5;
    const range = maxW - minW || 1;
    const w = 500, h = 180, pad = 35;
    const step = (w - pad * 2) / Math.max(data.length - 1, 1);

    let points = '';
    let dots = '';
    let labels = '';
    data.forEach((r, i) => {
      const x = pad + i * step;
      const y = h - pad - ((r.weight - minW) / range) * (h - pad * 2);
      points += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
      dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="var(--mint-primary)" stroke="white" stroke-width="2"/>`;
      dots += `<text x="${x.toFixed(1)}" y="${(y - 10).toFixed(1)}" text-anchor="middle" font-size="10" fill="var(--text)">${r.weight}</text>`;
      if (i % Math.ceil(data.length / 6) === 0 || i === data.length - 1) {
        labels += `<text x="${x.toFixed(1)}" y="${h - pad + 16}" text-anchor="middle" font-size="9" fill="var(--text-muted)">${r.date.slice(5)}</text>`;
      }
    });

    // 网格线
    let grid = '';
    for (let i = 0; i <= 4; i++) {
      const y = pad + (i * (h - pad * 2)) / 4;
      const val = (maxW - (i * range) / 4).toFixed(1);
      grid += `<line x1="${pad}" y1="${y}" x2="${w - pad}" y2="${y}" stroke="var(--border-light)" stroke-dasharray="3,3"/>`;
      grid += `<text x="${pad - 5}" y="${y + 3}" text-anchor="end" font-size="9" fill="var(--text-muted)">${val}</text>`;
    }

    return `<svg width="100%" viewBox="0 0 ${w} ${h}" style="max-width:500px;">
      ${grid}
      <path d="${points}" fill="none" stroke="var(--mint-primary)" stroke-width="2.5" stroke-linejoin="round"/>
      ${dots}
      ${labels}
    </svg>`;
  },

  bodyPeriod() {
    let html = this.header('🌙 经期记录', '智能周期追踪 · 点击日历查看/编辑');
    const today = Store.todayStr();
    const cycleInfo = Store.getCurrentCycleInfo();
    const predictedDates = Store.getPredictedPeriodDates();

    // ========== 1. 周期概览卡片 ==========
    html += '<div class="card period-overview">';
    if (cycleInfo.cycleDay > 0) {
      const phaseLabel = cycleInfo.isPeriod ? '🩸 经期中' :
        (cycleInfo.cycleDay >= cycleInfo.avgCycle - 14 - 1 && cycleInfo.cycleDay <= cycleInfo.avgCycle - 14 + 1) ? '✨ 排卵期' :
        (cycleInfo.cycleDay > cycleInfo.avgCycle - 14 + 1) ? '🌸 黄体期' : '🌱 卵泡期';
      html += `<div class="period-day-badge">当前周期第 <strong>${cycleInfo.cycleDay}</strong> 天 · ${phaseLabel}</div>`;
    } else {
      html += '<div class="period-day-badge">📋 暂无周期记录，请先标记一次「来了」</div>';
    }

    html += '<div class="period-info-grid">';
    if (cycleInfo.nextPeriod) {
      const daysUntil = Math.floor((new Date(cycleInfo.nextPeriod) - new Date(today)) / 86400000);
      html += `<div class="period-info-item">
        <span class="period-info-label">📅 预计下次经期</span>
        <span class="period-info-val">${cycleInfo.nextPeriod} <span class="text-sm text-muted">(${daysUntil}天后)</span></span>
      </div>`;
    }
    if (cycleInfo.ovulation) {
      html += `<div class="period-info-item">
        <span class="period-info-label">🥚 预计排卵日</span>
        <span class="period-info-val">${cycleInfo.ovulation}</span>
      </div>`;
    }
    if (cycleInfo.fertileStart && cycleInfo.fertileEnd) {
      html += `<div class="period-info-item fertile-window">
        <span class="period-info-label">💕 生育窗口期</span>
        <span class="period-info-val">${cycleInfo.fertileStart} ~ ${cycleInfo.fertileEnd}</span>
      </div>`;
    }
    html += `<div class="period-info-item">
      <span class="period-info-label">🔄 周期/经期</span>
      <span class="period-info-val">${cycleInfo.avgCycle}天 / ${cycleInfo.avgDuration}天 ${cycleInfo.autoLearn ? '<span class="tag tag-mint">AI学习</span>' : '<span class="tag tag-gray">默认</span>'}</span>
    </div>`;
    html += '</div>';

    html += `<button class="btn btn-primary btn-sm mt-2" onclick="document.getElementById('period-today-form').scrollIntoView({behavior:'smooth'});">➕ 记录今天状态</button>`;
    html += '</div>';

    // ========== 2. 经期日历 ==========
    const periodColors = {
      '来了': '#e91e63', '经期中': '#f06292',
      '排卵期': '#ffd600', '黄体期': '#ce93d8', '结束了': '#bdbdbd', '无': '#e0e0e0'
    };
    const periodBgColors = {
      '来了': '#fce4ec', '经期中': '#fce4ec',
      '排卵期': '#fff9c4', '黄体期': '#f3e5f5', '结束了': '#f5f5f5'
    };

    html += `<div class="card mt-3">`;
    html += `<div class="card-title">📅 ${App.calendarYear}年${App.calendarMonth + 1}月</div>`;

    // 手写日历（支持自定义圆点样式）
    const y = App.calendarYear, m = App.calendarMonth;
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    const startWeekday = firstDay.getDay() === 0 ? 7 : firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const prevMonthDays = new Date(y, m, 0).getDate();
    const allRecords = Store.getAll('body_records');

    // 构建记录映射 { date -> record }
    const recordMap = {};
    allRecords.forEach(r => { if (r.date && r.period_status) recordMap[r.date] = r; });

    html += `<div class="calendar-header">
      <button class="btn btn-outline btn-sm" onclick="App.changeCalendarMonth(-1)">‹</button>
      <h4>${y}年${m + 1}月</h4>
      <button class="btn btn-outline btn-sm" onclick="App.changeCalendarMonth(1)">›</button>
    </div>`;
    html += '<div class="calendar-grid">';
    ['一', '二', '三', '四', '五', '六', '日'].forEach(wd => {
      html += `<div class="calendar-weekday">${wd}</div>`;
    });

    // 上月填充
    for (let i = startWeekday - 1; i > 0; i--) {
      html += `<div class="calendar-day other-month">${prevMonthDays - i + 1}</div>`;
    }

    // 本月日期
    const priority = ['来了', '经期中', '排卵期', '黄体期', '结束了'];
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = ds === today;
      const rec = recordMap[ds];
      const isPredicted = predictedDates.includes(ds);

      let classes = 'calendar-day period-cal-day';
      if (isToday) classes += ' today';

      let numStyle = '';
      let cellBg = '';
      let dotHtml = '';

      if (rec && rec.period_status) {
        const color = periodColors[rec.period_status] || '#e0e0e0';
        const bg = periodBgColors[rec.period_status] || '';
        numStyle = `color:${color};font-weight:bold;`;
        if (bg) cellBg = bg;

        // 圆点
        let dotClass = '';
        if (rec.period_status === '来了' || rec.period_status === '经期中') dotClass = 'dot-period';
        else if (rec.period_status === '排卵期') dotClass = 'dot-ovulation';
        else if (rec.period_status === '黄体期') dotClass = 'dot-luteal';
        else if (rec.period_status === '结束了') dotClass = 'dot-ended';
        if (dotClass) dotHtml = `<span class="period-dot ${dotClass}"></span>`;
      } else if (isPredicted) {
        // 预测经期
        numStyle = 'color:#e91e63;';
        dotHtml = '<span class="period-dot dot-predicted"></span>';
      }

      html += `<div class="${classes}" style="${cellBg ? 'background:' + cellBg + ';border-radius:8px;' : ''}" onclick="App.onPeriodDayClick('${ds}')" ondblclick="App._markPeriodStart('${ds}')">
        <span class="period-day-num" style="${numStyle}">${d}</span>${dotHtml}
      </div>`;
    }

    // 下月填充
    const totalCells = startWeekday - 1 + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      html += `<div class="calendar-day other-month">${i}</div>`;
    }

    html += '</div>';

    // 图例
    html += `<div class="period-legend">
      <span class="legend-item"><span class="period-dot dot-period"></span>经期日</span>
      <span class="legend-item"><span class="period-dot dot-period" style="opacity:0.5;"></span>经期末尾</span>
      <span class="legend-item"><span class="period-dot dot-ovulation"></span>排卵期</span>
      <span class="legend-item"><span class="period-dot dot-luteal"></span>黄体期</span>
      <span class="legend-item"><span class="period-dot dot-predicted"></span>预测经期</span>
      <span class="legend-item text-sm text-muted">💡 双击日期快速标记为「来了」并推算</span>
    </div>`;
    html += '</div>';

    // ========== 3. 周期设置 ==========
    html += '<div class="card mt-3">';
    html += '<div class="card-title" style="cursor:pointer;" onclick="this.nextElementSibling.classList.toggle(\'hidden\')">⚙️ 周期设置 ▾</div>';
    html += '<div class="period-settings">';
    html += '<div class="form-row">';
    html += `<div class="form-group"><label>周期长度（天）</label>
      <input type="number" class="form-input" id="ps-cycle" value="${Store.getPeriodSetting('cycle_length', 28)}" min="21" max="45" onchange="Store.setPeriodSetting('cycle_length',this.value);UI.toast('✅ 已更新')">
    </div>`;
    html += `<div class="form-group"><label>经期持续（天）</label>
      <input type="number" class="form-input" id="ps-duration" value="${Store.getPeriodSetting('period_duration', 5)}" min="2" max="10" onchange="Store.setPeriodSetting('period_duration',this.value);UI.toast('✅ 已更新')">
    </div>`;
    html += '</div>';
    if (cycleInfo.autoLearn) {
      html += '<p class="text-sm text-mint mt-1">🤖 已根据你的历史数据自动学习周期模式</p>';
    } else if (cycleInfo.startDates && cycleInfo.startDates.length > 0) {
      html += `<p class="text-sm text-muted mt-1">📝 还需记录 ${3 - cycleInfo.startDates.length} 次经期开始即可自动学习</p>`;
    }
    html += '</div></div>';

    // ========== 4. 今日快速记录 ==========
    const todayRecord = Store.query('body_records', r => r.date === today)[0] || {
      date: today, period_status: '', period_flow: '', period_color: '',
      period_pain: '', period_symptoms: [], temperature: null,
      pain_level: 0, pain_location: '', weight: null, sex: '', medication: '', notes: ''
    };

    html += '<div class="card mt-3" id="period-today-form">';
    html += `<div class="card-title">📝 今日记录 <span class="text-sm text-muted">${today}</span></div>`;

    // 基础状态组
    html += '<div class="form-card-group"><div class="form-card-title">🩸 基础状态</div>';
    html += '<div class="flex gap-2 flex-wrap mb-3">';
    ['来了', '经期中', '排卵期', '黄体期', '结束了', '无'].forEach(s => {
      const act = todayRecord.period_status === s ? 'active' : '';
      html += `<span class="filter-chip chip-sm ${act}" data-f-ps="${UI.esc(s)}" onclick="App._toggleFormChip(this,'ps')">${s}</span>`;
    });
    html += '</div>';

    html += '<div class="flex gap-2 flex-wrap mb-2">';
    html += '<span class="text-sm text-muted mr-2">血量：</span>';
    ['少', '中', '多'].forEach(s => {
      const act = todayRecord.period_flow === s ? 'active' : '';
      html += `<span class="filter-chip chip-sm ${act}" data-f-pf="${UI.esc(s)}" onclick="App._toggleFormChip(this,'pf')">${s}</span>`;
    });
    html += '</div>';

    html += '<div class="flex gap-2 flex-wrap mb-2">';
    html += '<span class="text-sm text-muted mr-2">颜色：</span>';
    ['鲜红', '暗红', '褐色', '粉色'].forEach(s => {
      const act = todayRecord.period_color === s ? 'active' : '';
      html += `<span class="filter-chip chip-sm ${act}" data-f-pc="${UI.esc(s)}" onclick="App._toggleFormChip(this,'pc')">${s}</span>`;
    });
    html += '</div>';

    html += '<div class="flex gap-2 flex-wrap">';
    html += '<span class="text-sm text-muted mr-2">痛经：</span>';
    ['无', '轻度', '中度', '严重'].forEach(s => {
      const act = todayRecord.period_pain === s ? 'active' : '';
      html += `<span class="filter-chip chip-sm ${act}" data-f-pp="${UI.esc(s)}" onclick="App._toggleFormChip(this,'pp')">${s}</span>`;
    });
    html += '</div></div>';

    // 情绪与症状组
    html += '<div class="form-card-group mt-2"><div class="form-card-title">🤒 情绪与症状（多选）</div>';
    html += '<div class="flex gap-2 flex-wrap">';
    ['腰酸', '头痛', '腹胀', '恶心', '疲劳', '情绪波动', '胸胀', '无'].forEach(s => {
      const sel = Array.isArray(todayRecord.period_symptoms) && todayRecord.period_symptoms.includes(s);
      html += `<span class="filter-chip chip-sm ${sel ? 'active' : ''}" data-f-symp="${UI.esc(s)}" onclick="App._toggleFormChip(this,'symp')">${s}</span>`;
    });
    html += '</div></div>';

    // 身体数据组
    html += '<div class="form-card-group mt-2"><div class="form-card-title">🌡️ 身体数据</div>';
    html += '<div class="form-row">';
    html += `<div class="form-group"><label>体温(°C)</label><input type="number" class="form-input form-input-sm" id="f-temp" value="${todayRecord.temperature || ''}" placeholder="36.5" step="0.1"></div>`;
    html += `<div class="form-group"><label>体重(kg)</label><input type="number" class="form-input form-input-sm" id="f-weight" value="${todayRecord.weight || ''}" placeholder="50" step="0.1"></div>`;
    html += '</div></div>';

    // 其他组
    html += '<div class="form-card-group mt-2"><div class="form-card-title">💊 其他</div>';
    html += '<div class="flex gap-2 flex-wrap mb-2">';
    html += '<span class="text-sm text-muted mr-2">性生活：</span>';
    ['有', '无'].forEach(s => {
      const act = todayRecord.sex === s ? 'active' : '';
      html += `<span class="filter-chip chip-sm ${act}" data-f-sx="${UI.esc(s)}" onclick="App._toggleFormChip(this,'sx')">${s}</span>`;
    });
    html += '</div>';
    html += `<div class="form-group"><label>用药</label><input type="text" class="form-input form-input-sm" id="f-med" value="${UI.esc(todayRecord.medication || '')}" placeholder="如布洛芬"></div>`;
    html += `<div class="form-group"><label>备注</label><textarea class="form-textarea" id="f-notes" rows="2" placeholder="记录今天的感受...">${UI.esc(todayRecord.notes === '(自动推算)' ? '' : (todayRecord.notes || ''))}</textarea></div>`;
    html += '</div>';

    // 保存按钮
    html += `<button class="btn btn-primary btn-sm mt-2" id="btn-period-save-today" onclick="App.savePeriodToday()">💾 保存今日记录</button>`;
    html += `<span id="period-save-status" class="text-sm ml-2"></span>`;
    html += '</div>';

    // ========== 5. 历史记录流（最近7天）==========
    const recentRecords = Store.query('body_records', r => r.date !== today && r.period_status && r.period_status !== '无')
      .sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 7);

    if (recentRecords.length > 0) {
      html += '<div class="card mt-3"><div class="card-title">📋 最近记录</div>';
      recentRecords.forEach(r => {
        const emoji = r.period_status === '来了' ? '🩸' : r.period_status === '经期中' ? '🩹' :
                      r.period_status === '排卵期' ? '✨' : r.period_status === '黄体期' ? '🌸' : '⚪';
        const moodEmoji = r.period_pain === '严重' ? '😣' : r.period_pain === '中度' ? '😟' : r.period_pain === '轻度' ? '😐' : '';
        const symptomTags = Array.isArray(r.period_symptoms) ? r.period_symptoms.filter(s => s !== '无').slice(0, 3) : [];

        html += `<div class="period-history-card" onclick="App.onPeriodDayClick('${r.date}')">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-sm font-bold">${r.date}</span>
              <span class="ml-2">${emoji} ${r.period_status}</span>
              ${moodEmoji ? `<span class="ml-2">${moodEmoji}</span>` : ''}
              ${r.period_flow ? `<span class="tag tag-gray ml-2">💧${r.period_flow}</span>` : ''}
            </div>
            <span class="text-xs text-muted">点击查看详情</span>
          </div>
          ${symptomTags.length > 0 ? `<div class="mt-1 flex gap-1 flex-wrap">${symptomTags.map(s => `<span class="tag tag-warn">${s}</span>`).join('')}</div>` : ''}
          ${r.notes && r.notes !== '(自动推算)' ? `<div class="text-sm text-muted mt-1">${UI.esc(r.notes.slice(0, 60))}</div>` : ''}
        </div>`;
      });
      html += '</div>';
    }

    // ========== 6. 统计图表 ==========
    const stats = Store.calcPeriodStats();
    if (stats.startDates.length >= 2) {
      html += '<div class="card mt-3"><div class="card-title">📊 周期统计</div>';

      // 近N个周期长度
      const recentCycles = stats.cycleLengths.slice(-6);
      if (recentCycles.length > 0) {
        html += '<div class="mb-3"><span class="text-sm font-bold">📏 周期长度（天）</span>';
        const chartLabels = recentCycles.map((_, i) => `第${stats.cycleLengths.length - recentCycles.length + i + 1}次`);
        html += UI.barChart(recentCycles.map((v, i) => ({
          label: chartLabels[i],
          value: v,
          color: v > stats.avgCycle + 3 ? '#f4845f' : v < stats.avgCycle - 3 ? '#ffa726' : '#7bc99e'
        })));
        html += `<p class="text-sm text-muted mt-1">平均周期：${stats.avgCycle} 天</p></div>`;
      }

      // 经期持续时间
      if (stats.periodDurations.length > 0) {
        html += '<div class="mb-3"><span class="text-sm font-bold">⏱️ 经期持续时间（天）</span>';
        const durLabels = stats.periodDurations.slice(-6).map((_, i) => `第${stats.periodDurations.length - Math.min(6, stats.periodDurations.length) + i + 1}次`);
        html += UI.barChart(stats.periodDurations.slice(-6).map((v, i) => ({
          label: durLabels[i],
          value: v,
          color: '#f06292'
        })));
        html += `<p class="text-sm text-muted mt-1">平均持续：${stats.avgDuration} 天</p></div>`;
      }

      // 症状频率
      const symptomCount = {};
      Store.query('body_records', r => r.period_symptoms && r.period_symptoms.length > 0).forEach(r => {
        (Array.isArray(r.period_symptoms) ? r.period_symptoms : []).forEach(s => {
          if (s !== '无') symptomCount[s] = (symptomCount[s] || 0) + 1;
        });
      });
      const topSymptoms = Object.entries(symptomCount).sort((a, b) => b[1] - a[1]).slice(0, 6);
      if (topSymptoms.length > 0) {
        const maxCount = Math.max(...topSymptoms.map(s => s[1]));
        html += '<div><span class="text-sm font-bold">🏷️ 常见症状频率</span>';
        topSymptoms.forEach(([name, count]) => {
          const pct = Math.round((count / maxCount) * 100);
          html += `<div class="symptom-bar">
            <span class="symptom-bar-label text-sm">${name}</span>
            <span class="symptom-bar-track"><span class="symptom-bar-fill" style="width:${pct}%;"></span></span>
            <span class="text-xs text-muted">${count}次</span>
          </div>`;
        });
        html += '</div>';
      }

      html += '</div>';
    }

    return html;
  },

  bodyPain() {
    let html = this.header('🩹 疼痛记录', '记录疼痛部位与程度');
    const records = Store.getAll('body_records').filter(r => r.pain_location).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const today = Store.todayStr();
    html += `<div class="mb-3"><button class="btn btn-primary btn-sm" onclick="UI.openFormModal('body_records', {date: '${today}'}, {visibleFields: ['date', 'pain_location', 'pain_level', 'notes']})">+ 记录疼痛</button></div>`;
    if (records.length === 0) {
      html += UI.emptyState('😊', '暂无疼痛记录，希望你一直不痛');
    } else {
      html += '<div style="overflow-x:auto;"><table class="data-table"><thead><tr>';
      html += '<th>日期</th><th>部位</th><th>程度</th><th>备注</th><th>操作</th></tr></thead><tbody>';
      records.forEach(r => {
        const level = r.pain_level || 0;
        const levelBar = '🟩'.repeat(level) + '⬜'.repeat(5 - level);
        html += `<tr>
          <td>${UI.esc(r.date || '—')}</td>
          <td>${UI.esc(r.pain_location || '—')}</td>
          <td>${levelBar} ${level}/5</td>
          <td>${UI.esc(r.notes || '—')}</td>
          <td class="row-actions">
            <button class="btn btn-outline btn-sm" onclick="UI.openFormModalById('body_records', '${r.id}')">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="UI.confirmDelete('body_records', '${r.id}')">🗑️</button>
          </td>
        </tr>`;
      });
      html += '</tbody></table></div>';
    }
    return html;
  },

  // 戒烟记录
  quitSmoking() {
    let html = this.header('🚭 戒烟记录', '记录每天的戒烟情况，一步步告别烟草');
    const records = Store.getAll('quit_smoking').sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const today = Store.todayStr();

    // 今日有没有记录
    const todayRecord = records.find(r => r.date === today);

    // 统计
    const totalDays = records.length;
    const smokeFreeDays = records.filter(r => r.smoked === '没抽').length;
    const smokeDays = records.filter(r => r.smoked === '抽了').length;
    const totalCigarettes = records.reduce((s, r) => s + (r.count || 0), 0);
    const smokeFreeRate = totalDays > 0 ? Math.round((smokeFreeDays / totalDays) * 100) : 0;

    // 统计卡片
    html += `<div class="card-grid card-grid-4 mb-3">
      <div class="card text-center" style="background:${smokeFreeRate >= 80 ? '#e8f5e9' : '#fff3e0'};">
        <div class="text-muted text-sm">无烟率</div>
        <div class="font-bold" style="font-size:24px;color:${smokeFreeRate >= 80 ? '#2e7d32' : '#e65100'};">${smokeFreeRate}%</div>
      </div>
      <div class="card text-center">
        <div class="text-muted text-sm">无烟天数</div>
        <div class="font-bold" style="font-size:24px;color:#2e7d32;">${smokeFreeDays}</div>
      </div>
      <div class="card text-center">
        <div class="text-muted text-sm">抽烟天数</div>
        <div class="font-bold" style="font-size:24px;color:#e65100;">${smokeDays}</div>
      </div>
      <div class="card text-center">
        <div class="text-muted text-sm">总吸烟根数</div>
        <div class="font-bold" style="font-size:24px;color:#d32f2f;">${totalCigarettes}</div>
      </div>
    </div>`;

    // 连续无烟天数
    let streak = 0;
    // 从最近一条开始往前数连续无烟天数
    const dateSorted = [...records].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    for (const r of dateSorted) {
      if (r.smoked === '没抽') streak++;
      else break;
    }
    if (streak > 0) {
      html += `<div class="card mb-3" style="background:#e8f5e9;border-left:3px solid #2e7d32;">
        <div class="flex items-center gap-2">
          <span style="font-size:20px;">🎉</span>
          <span style="font-weight:600;color:#2e7d32;">已连续 ${streak} 天没有抽烟！继续保持！</span>
        </div>
      </div>`;
    }

    // 今日记录按钮
    if (todayRecord) {
      html += `<div class="card card-dot-border mb-3">
        <div class="card-title">📋 今日记录 <span class="badge">${today}</span></div>
        <div class="flex items-center gap-3 flex-wrap">
          <span class="tag ${todayRecord.smoked === '没抽' ? 'tag-mint' : 'tag-danger'}" style="font-size:14px;padding:6px 12px;">
            ${todayRecord.smoked === '没抽' ? '✅ 今天没抽' : '⚠️ 今天抽了'}
          </span>
          ${todayRecord.smoked === '抽了' ? `<span class="text-muted">${todayRecord.count || 0} 根</span>` : ''}
          ${todayRecord.trigger ? `<span class="text-sm text-muted">触发：${UI.esc(todayRecord.trigger)}</span>` : ''}
        </div>
        <div class="flex items-center gap-2 mt-2">
          <button class="btn btn-outline btn-sm" onclick="UI.openFormModalById('quit_smoking','${todayRecord.id}')">✏️ 修改</button>
          <button class="btn btn-danger btn-sm" onclick="UI.confirmDelete('quit_smoking','${todayRecord.id}')">🗑️</button>
        </div>
      </div>`;
    } else {
      html += `<div class="mb-3"><button class="btn btn-primary" onclick="UI.openFormModal('quit_smoking', {date: '${today}'})">✍️ 记录今天</button></div>`;
    }

    // 历史记录
    if (records.length === 0) {
      html += UI.emptyState('🚭', '还没有戒烟记录，从今天开始吧！');
    } else {
      html += '<div class="card-title mt-3">📅 历史记录</div>';
      html += '<div style="overflow-x:auto;"><table class="data-table"><thead><tr>';
      html += '<th>日期</th><th>状态</th><th>数量</th><th>触发原因</th><th>心情</th><th>备注</th><th>操作</th></tr></thead><tbody>';
      records.forEach(r => {
        const smokeTag = r.smoked === '没抽'
          ? '<span class="tag tag-mint">✅ 没抽</span>'
          : '<span class="tag tag-danger">⚠️ 抽了</span>';
        html += `<tr>
          <td>${UI.esc(r.date || '—')}</td>
          <td>${smokeTag}</td>
          <td>${r.smoked === '抽了' ? (r.count || 0) : '—'}</td>
          <td>${UI.esc(r.trigger || '—')}</td>
          <td>${UI.esc(r.mood || '—')}</td>
          <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;">${UI.esc(r.notes || '—')}</td>
          <td class="row-actions">
            <button class="btn btn-outline btn-sm" onclick="UI.openFormModalById('quit_smoking', '${r.id}')">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="UI.confirmDelete('quit_smoking', '${r.id}')">🗑️</button>
          </td>
        </tr>`;
      });
      html += '</tbody></table></div>';
    }
    return html;
  },

  // ==========================================
  // 8. 运动与护理
  // ==========================================
  exerciseVideos(category, icon) {
    const titles = { '减脂塑型': '🔥 减脂塑型', '背部': '🔙 背部训练', '腰部': '🧘 腰部训练' };
    const headerTitle = titles[category] || `${icon || '💪'} ${category}`;
    let html = this.header(headerTitle, `${category}训练视频合集`);
    const videos = Store.query('exercise_videos', r => Array.isArray(r.category) && r.category.includes(category));
    html += `<div class="mb-3"><button class="btn btn-primary btn-sm" onclick="UI.openFormModal('exercise_videos', {category: ['${category}']})">+ 添加视频</button></div>`;

    if (videos.length === 0) {
      html += UI.emptyState('🏃', '暂无视频，添加你常用的运动视频吧');
    } else {
      html += '<div class="card-grid card-grid-3">';
      videos.forEach(v => {
        const platformIcon = v.platform === '抖音' ? '🎵' : '📺';
        html += `<div class="kanban-card">
          <div class="flex items-center justify-between">
            <div class="kc-title" style="flex:1;cursor:pointer;" onclick="window.open('${UI.esc(v.link || '#')}', '_blank')">${UI.esc(v.title)}</div>
            <div class="flex items-center gap-1" style="flex-shrink:0;margin-left:8px;">
              <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();UI.openFormModalById('exercise_videos','${v.id}')">✏️</button>
              <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();UI.confirmDelete('exercise_videos','${v.id}')">🗑️</button>
            </div>
          </div>
          <div class="kc-meta">${platformIcon} ${UI.esc(v.platform || '')} ${v.duration ? '· ⏱️ ' + UI.esc(v.duration) : ''}</div>
        </div>`;
      });
      html += '</div>';
    }
    return html;
  },

  exerciseSkincare() {
    let html = this.header('🧴 护肤日常', '每日护肤流程 + 打卡 + 护肤视频');
    const today = Store.todayStr();
    let checkin = Store.query('daily_checkin', r => r.date === today)[0];
    if (!checkin) {
      checkin = Store.add('daily_checkin', {
        date: today,
        hearing_done: false, hearing_note: '', reading_done: false, reading_note: '',
        speaking_done: false, speaking_note: '', exercise_done: false,
        morning_meds: false, afternoon_meds: false,
        water_1: false, water_2: false, water_3: false, water_4: false,
        water_5: false, water_6: false, water_7: false, water_8: false,
        xiaomi_signin: false, netease_signin: false, browser_signin: false, wallet_signin: false,
        skincare_morning: false, skincare_evening: false, blackhead_done: false,
        praise: '', mood: '', notes: '',
      });
    }

    // 今日打卡区
    html += `<div class="card card-dot-border">
      <div class="card-title">📋 今日护肤打卡 <span class="badge">${today}</span></div>
      ${this.checkinItem(checkin.id, 'skincare_morning', '☀️ 晨间护肤完成了吗？', checkin.skincare_morning)}
      ${this.checkinItem(checkin.id, 'skincare_evening', '🌙 晚间护肤完成了吗？', checkin.skincare_evening)}
    </div>`;

    // 护肤流程
    html += `<div class="info-block">
      <h4>🧼 晨间护肤</h4>
      <div class="flex flex-wrap gap-2 items-center">
        <span class="tag tag-mint">洁面</span> →
        <span class="tag tag-mint">水</span> →
        <span class="tag tag-mint">精华</span> →
        <span class="tag tag-mint">乳液</span> →
        <span class="tag tag-mint">防晒</span>
      </div>
    </div>`;
    html += `<div class="info-block">
      <h4>🌙 晚间护肤</h4>
      <div class="flex flex-wrap gap-2 items-center">
        <span class="tag tag-mint">卸妆</span> →
        <span class="tag tag-mint">洁面</span> →
        <span class="tag tag-mint">水</span> →
        <span class="tag tag-mint">精华</span> →
        <span class="tag tag-mint">眼霜</span> →
        <span class="tag tag-mint">面霜</span>
      </div>
    </div>`;

    // 护肤相关视频
    const videos = Store.query('exercise_videos', r => Array.isArray(r.category) && r.category.includes('护肤'));
    html += '<div class="mt-3"><div class="card-title">📹 护肤相关视频</div>';
    html += this.addButton('exercise_videos', '添加护肤视频');
    if (videos.length === 0) {
      html += UI.emptyState('🧴', '暂无护肤视频');
    } else {
      html += '<div class="card-grid card-grid-3">';
      videos.forEach(v => {
        const platformIcon = v.platform === '抖音' ? '🎵' : '📺';
        html += `<div class="kanban-card">
          <div class="flex items-center justify-between">
            <div class="kc-title" style="flex:1;cursor:pointer;" onclick="window.open('${UI.esc(v.link || '#')}', '_blank')">${UI.esc(v.title)}</div>
            <div class="flex items-center gap-1" style="flex-shrink:0;margin-left:8px;">
              <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();UI.openFormModalById('exercise_videos','${v.id}')">✏️</button>
              <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();UI.confirmDelete('exercise_videos','${v.id}')">🗑️</button>
            </div>
          </div>
          <div class="kc-meta">${platformIcon} ${UI.esc(v.platform || '')} ${v.duration ? '· ⏱️ ' + UI.esc(v.duration) : ''}</div>
        </div>`;
      });
      html += '</div>';
    }
    return html;
  },

  exerciseBlackhead() {
    let html = this.header('🖤 去黑头·周三专护', '每周三的去黑头护理流程');
    const today = Store.todayStr();
    let checkin = Store.query('daily_checkin', r => r.date === today)[0];
    if (!checkin) {
      checkin = Store.add('daily_checkin', {
        date: today,
        hearing_done: false, hearing_note: '', reading_done: false, reading_note: '',
        speaking_done: false, speaking_note: '', exercise_done: false,
        morning_meds: false, afternoon_meds: false,
        water_1: false, water_2: false, water_3: false, water_4: false,
        water_5: false, water_6: false, water_7: false, water_8: false,
        xiaomi_signin: false, netease_signin: false, browser_signin: false, wallet_signin: false,
        skincare_morning: false, skincare_evening: false, blackhead_done: false,
        praise: '', mood: '', notes: '',
      });
    }

    // 今日打卡区
    html += `<div class="card card-dot-border">
      <div class="card-title">📋 今日打卡 <span class="badge">${today}</span></div>
      ${this.checkinItem(checkin.id, 'blackhead_done', '🖤 今天完成去黑头护理了吗？', checkin.blackhead_done)}
    </div>`;

    // 步骤说明
    html += `<div class="info-block">
      <h4>🧹 去黑头完整步骤</h4>
      <div class="step"><span class="step-num">1</span><span><b>热敷打开毛孔</b> - 用热毛巾敷鼻部 3 分钟，软化角质</span></div>
      <div class="step"><span class="step-num">2</span><span><b>清洁面膜/鼻贴</b> - 敷清洁面膜或使用鼻贴 10-15 分钟</span></div>
      <div class="step"><span class="step-num">3</span><span><b>粉刺针轻刮</b> - 用粉刺针圆环端轻刮浮出的黑头</span></div>
      <div class="step"><span class="step-num">4</span><span><b>收敛水湿敷</b> - 用收敛水浸湿化妆棉敷鼻部 5 分钟，收缩毛孔</span></div>
    </div>`;

    // 常用产品记录
    html += `<div class="card card-dot-border">
      <div class="card-title">🧴 常用产品记录</div>
      <textarea class="form-textarea" placeholder="记录你常用的去黑头产品..." onblur="App.saveLocalSetting('blackhead_products', this.value)">${UI.esc(App.getLocalSetting('blackhead_products') || '')}</textarea>
    </div>`;

    // 今日去黑头任务
    const todayDate = new Date(today);
    const dayOfWeek = todayDate.getDay() || 7;
    const isWednesday = dayOfWeek === 3;

    // 查找今天的去黑头任务
    const todayTask = Store.query('todo_list', r => r.task_name === '🖤 去黑头日' && r.deadline === today)[0];

    // 查找下一次周三
    const nextWed = new Date();
    nextWed.setDate(nextWed.getDate() + ((3 - (nextWed.getDay() || 7) + 7) % 7) || 7);
    const nextWedStr = nextWed.toISOString().slice(0, 10);

    html += `<div class="card">
      <div class="card-title">📋 今日任务</div>`;
    if (isWednesday) {
      if (todayTask) {
        html += `<div class="checkbox-row">
          <span class="cbx ${todayTask.completed ? 'checked' : ''}" onclick="App.toggleTodo('${todayTask.id}')"></span>
          <span class="cbx-label ${todayTask.completed ? 'text-muted' : ''}">🖤 去黑头日</span>
        </div>`;
      } else {
        html += `<p class="text-sm">今天是周三！但还没有创建去黑头任务，<button class="btn btn-primary btn-sm" onclick="App.createBlackheadTask()">立即创建</button></p>`;
      }
    } else {
      html += `<p class="text-sm text-muted">今天不是周三，下次去黑头日是 <span class="tag tag-warn">${UI.esc(nextWedStr)}</span></p>`;
      // 查找下一次去黑头任务
      const nextTask = Store.query('todo_list', r => r.task_name === '🖤 去黑头日' && !r.completed).sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''))[0];
      if (nextTask) {
        html += `<div class="checkbox-row text-muted">
          <span>下次任务日期：${UI.esc(nextTask.deadline || '未设置')}</span>
        </div>`;
      }
    }
    html += '</div>';
    return html;
  },

  // ==========================================
  // 9. 追星演出追踪
  // ==========================================
  // ==========================================
  // 14. 追星演出追踪（重构版）
  // ==========================================
  starConcerts(artist) {
    const titles = { '安溥': '🎸 安溥', '毛不易': '🎙️ 毛不易' };
    const typeTags = { '专场': '🎤', '音乐节': '🎪', '拼盘': '🎭' };
    const typeColors = { '专场': 'tag-warn', '音乐节': 'tag-mint', '拼盘': 'tag-purple' };
    let html = this.header(titles[artist] || `🎵 ${artist}`, `${artist}的演出信息（含专场与音乐节）`);

    const today = Store.todayStr();
    const all = Store.query('star_tracking', r => r.artist === artist)
      .sort((a, b) => (b.show_date || '').localeCompare(a.show_date || ''));

    // 自动清理过期演出
    let hasExpired = false;
    all.forEach(r => {
      if (r.show_date && r.show_date < today && r.status !== '去过' && r.status !== '已过期') {
        Store.update('star_tracking', r.id, { status: '已过期' });
        hasExpired = true;
      }
    });
    if (hasExpired) { App.rerender(); return ''; }

    // 状态筛选
    const filterAll = all;
    const statuses = ['全部', '想看', '已购票', '去过', '已过期'];
    const iconMap = { '想看': '👀', '已购票': '🎫', '去过': '✅', '已过期': '⏳' };

    html += '<div class="flex gap-2 flex-wrap mb-3" id="concert-filter-bar">';
    statuses.forEach(s => {
      const activeClass = (App.concertFilter || '全部') === s ? 'active' : '';
      html += `<span class="filter-chip ${activeClass}" onclick="App.setConcertFilter('${s}')">${iconMap[s] || '📋'} ${s}</span>`;
    });
    html += `<button class="btn btn-primary btn-sm" style="margin-left:auto;" onclick="UI.openFormModal('star_tracking', {artist: '${artist}', status: '想看'})">+ 添加演出</button>`;
    html += `<button class="btn btn-outline btn-sm" onclick="App.dedupeConcerts()" title="删除重复的演出记录">🔧 去重清理</button>`;
    html += '</div>';

    const filtered = (App.concertFilter || '全部') === '全部'
      ? filterAll
      : filterAll.filter(r => r.status === App.concertFilter);

    if (filtered.length === 0) {
      html += UI.emptyState('🎤', `暂无符合条件的演出`);
    } else {
      filtered.forEach(r => {
        const isExpired = r.status === '已过期';
        const isPast = r.show_date && r.show_date < today;
        const cardStyle = isExpired || isPast ? 'opacity:0.7;' : '';

        html += `<div class="card card-dot-border" style="${cardStyle}">
          <div class="flex items-center justify-between">
            <div class="kc-title font-bold" style="font-size:15px;">
              ${UI.esc(r.show_name || '未命名演出')}
              ${r.show_type ? `<span class="tag ${typeColors[r.show_type] || 'tag-gray'} ml-2" style="font-size:11px;">${typeTags[r.show_type] || ''} ${UI.esc(r.show_type)}</span>` : ''}
            </div>
            <span class="tag ${r.status === '已购票' ? 'tag-mint' : r.status === '去过' ? 'tag-mint' : r.status === '已过期' ? 'tag-gray' : r.status === '想看' && r.show_date && r.show_date < today ? 'tag-gray' : 'tag-warn'}">${iconMap[r.status] || ''} ${r.status || '想看'}</span>
          </div>
          <div class="kc-meta mt-2" style="flex-wrap:wrap;gap:12px;">
            ${r.show_date ? `<span>📅 ${UI.esc(r.show_date)}</span>` : ''}
            ${r.city ? `<span>📍 ${UI.esc(r.city)}</span>` : ''}
            ${r.venue ? `<span>🏟️ ${UI.esc(r.venue)}</span>` : ''}
          </div>
          ${r.ticket_date ? `<div class="mt-2" style="background:var(--mint-lightest);border-radius:8px;padding:8px 12px;">
            <span class="font-bold">🎫 抢票: ${UI.esc(r.ticket_date)}</span>
            ${r.ticket_platform ? `<span class="text-sm text-muted ml-3">平台: ${UI.esc(r.ticket_platform)}</span>` : ''}
            ${r.ticket_price ? `<span class="text-sm text-muted ml-3">票档: ${UI.esc(r.ticket_price)}</span>` : ''}
          </div>` : ''}
          ${r.source ? `<div class="text-sm text-muted mt-1">🔍 来源: ${UI.esc(r.source)}</div>` : ''}
          ${r.notes ? `<p class="text-sm text-muted mt-2">📝 ${UI.esc(r.notes)}</p>` : ''}
          <div class="flex gap-2 mt-3">
            <button class="btn btn-outline btn-sm" onclick="UI.openFormModalById('star_tracking', '${r.id}')">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="UI.confirmDelete('star_tracking', '${r.id}')">🗑️</button>
            ${r.status === '想看' && r.show_date && r.show_date >= today ? `<button class="btn btn-primary btn-sm" onclick="App.markTicketGot('${r.id}')">✅ 标记已购票</button>` : ''}
            ${r.status === '已购票' ? `<button class="btn btn-outline btn-sm" onclick="App.markConcertAttended('${r.id}')">🎉 标记去过</button>` : ''}
          </div>
        </div>`;
      });
    }

    // 提醒说明
    html += `<div class="info-block mt-3">
      <h4>⏰ 提醒说明</h4>
      <p class="text-sm">演出日期已过的会自动标记为「已过期」。含抢票日期的演出将在抢票日前一天和当天上午9:00推送提醒。</p>
    </div>`;
    return html;
  },

  // ---------- 其他艺人页面 ----------
  starOther() {
    let html = this.header('🎵 其他艺人', '管理自定义艺人 + 浏览演出信息');

    const customArtists = Store.getCustomStarArtists();
    const today = Store.todayStr();

    // 艺人筛选
    html += '<div class="flex gap-2 flex-wrap mb-3">';
    html += `<span class="filter-chip ${(App.starArtistFilter || '全部') === '全部' ? 'active' : ''}" onclick="App.setStarArtistFilter('全部')">📋 全部</span>`;
    customArtists.forEach(a => {
      const active = (App.starArtistFilter || '全部') === a.name ? 'active' : '';
      html += `<span class="filter-chip ${active}" onclick="App.setStarArtistFilter('${a.name}')">${a.name}</span>`;
    });
    html += '</div>';

    // 状态筛选
    const statuses = ['全部', '想看', '已购票', '去过', '已过期'];
    const iconMap = { '想看': '👀', '已购票': '🎫', '去过': '✅', '已过期': '⏳' };
    const typeTags = { '专场': '🎤', '音乐节': '🎪', '拼盘': '🎭' };
    const typeColors = { '专场': 'tag-warn', '音乐节': 'tag-mint', '拼盘': 'tag-purple' };
    html += '<div class="flex gap-2 flex-wrap mb-3" id="concert-filter-bar">';
    statuses.forEach(s => {
      const activeClass = (App.concertFilter || '全部') === s ? 'active' : '';
      html += `<span class="filter-chip ${activeClass}" onclick="App.setConcertFilter('${s}')">${iconMap[s] || '📋'} ${s}</span>`;
    });
    html += `<button class="btn btn-primary btn-sm" style="margin-left:auto;" onclick="Pages.showAddConcertForOther()">+ 添加演出</button>`;
    html += `<button class="btn btn-outline btn-sm" onclick="App.dedupeConcerts()" title="删除重复的演出记录">🔧 去重清理</button>`;
    html += '</div>';

    // 查询演出
    const artistFilter = App.starArtistFilter || '全部';
    let records = Store.getAll('star_tracking').filter(r => {
      const isCustom = customArtists.some(a => a.name === r.artist);
      const matchArtist = artistFilter === '全部' || r.artist === artistFilter;
      return isCustom && matchArtist;
    }).sort((a, b) => (b.show_date || '').localeCompare(a.show_date || ''));

    const statusFilter = App.concertFilter || '全部';
    if (statusFilter !== '全部') {
      records = records.filter(r => r.status === statusFilter);
    }

    if (records.length === 0) {
      html += UI.emptyState('🎵', '暂无符合条件的演出');
    } else {
      records.forEach(r => {
        const isExpired = r.status === '已过期';
        html += `<div class="card card-dot-border" style="${isExpired ? 'opacity:0.7;' : ''}">
          <div class="flex items-center justify-between">
            <div class="kc-title font-bold" style="font-size:15px;">
              <span class="tag tag-gray mr-2">${UI.esc(r.artist)}</span>${UI.esc(r.show_name || '未命名演出')}
              ${r.show_type ? `<span class="tag ${typeColors[r.show_type] || 'tag-gray'} ml-2" style="font-size:11px;">${typeTags[r.show_type] || ''} ${UI.esc(r.show_type)}</span>` : ''}
            </div>
            <span class="tag ${r.status === '已购票' ? 'tag-mint' : r.status === '去过' ? 'tag-mint' : r.status === '已过期' ? 'tag-gray' : 'tag-warn'}">${iconMap[r.status] || ''} ${r.status || '想看'}</span>
          </div>
          <div class="kc-meta mt-2" style="flex-wrap:wrap;gap:12px;">
            ${r.show_date ? `<span>📅 ${UI.esc(r.show_date)}</span>` : ''}
            ${r.city ? `<span>📍 ${UI.esc(r.city)}</span>` : ''}
            ${r.venue ? `<span>🏟️ ${UI.esc(r.venue)}</span>` : ''}
          </div>
          ${r.notes ? `<p class="text-sm text-muted mt-2">📝 ${UI.esc(r.notes)}</p>` : ''}
          <div class="flex gap-2 mt-3">
            <button class="btn btn-outline btn-sm" onclick="UI.openFormModalById('star_tracking', '${r.id}')">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="UI.confirmDelete('star_tracking', '${r.id}')">🗑️</button>
            ${r.status === '想看' && r.show_date && r.show_date >= today ? `<button class="btn btn-primary btn-sm" onclick="App.markTicketGot('${r.id}')">✅ 标记已购票</button>` : ''}
            ${r.status === '已购票' ? `<button class="btn btn-outline btn-sm" onclick="App.markConcertAttended('${r.id}')">🎉 标记去过</button>` : ''}
          </div>
        </div>`;
      });
    }

    // 管理艺人
    html += `<div class="card mt-4">
      <div class="card-title">⚙️ 管理自定义艺人</div>
      <p class="text-sm text-muted mb-2">添加新艺人后，可手动搜索并录入其演出信息。删除艺人会同步删除其所有演出记录。</p>`;
    if (customArtists.length > 0) {
      html += '<div class="flex gap-2 flex-wrap mb-3">';
      customArtists.forEach(a => {
        html += `<span class="tag" style="cursor:default;">${UI.esc(a.name)}
          <button class="btn btn-danger btn-sm" style="margin-left:6px;padding:0 6px;font-size:10px;" onclick="event.stopPropagation();Pages.removeStarArtist('${a.id}')">✕</button>
        </span>`;
      });
      html += '</div>';
    }
    html += `<button class="btn btn-primary btn-sm" onclick="Pages.showAddStarArtist()">+ 添加艺人</button>`;
    html += '</div>';

    return html;
  },

  // 添加其他艺人的演出
  showAddConcertForOther() {
    const customArtists = Store.getCustomStarArtists();
    if (customArtists.length === 0) {
      UI.toast('⚠️ 请先添加艺人');
      return;
    }
    UI.openFormModal('star_tracking', { status: '想看' });
  },

  // 添加自定义追星艺人
  showAddStarArtist() {
    let html = `<div class="form-group">
      <label>艺人名称</label>
      <input class="form-input" id="new-star-name" placeholder="输入艺人名称" maxlength="20">
    </div>`;
    UI.openModal('添加自定义艺人', html, (modalEl) => {
      const footer = modalEl.querySelector('.modal-footer');
      if (footer) {
        footer.innerHTML = `<button class="btn btn-outline" onclick="UI.closeModal()">取消</button>
          <button class="btn btn-primary" id="btn-add-star">添加</button>`;
      }
      const btn = modalEl.querySelector('#btn-add-star');
      if (btn) {
        btn.addEventListener('click', () => {
          const name = (modalEl.querySelector('#new-star-name')?.value || '').trim();
          if (!name) { UI.toast('⚠️ 请输入艺人名称'); return; }
          const artist = Store.addCustomStarArtist(name);
          if (!artist) { UI.toast('⚠️ 该艺人已存在'); return; }
          UI.closeModal();
          UI.toast(`✅ 已添加「${name}」。你可以搜索并手动添加演出信息，或等下次系统自动抓取。`);
          App.rerender();
        });
      }
    }, true);
  },

  // 删除自定义艺人
  removeStarArtist(artistId) {
    const artists = Store.getCustomStarArtists();
    const target = artists.find(a => a.id === artistId);
    if (!target) return;
    const count = Store.query('star_tracking', r => r.artist === target.name).length;
    const msg = count > 0
      ? `确定删除「${target.name}」吗？将同时删除 ${count} 条演出记录，不可恢复！`
      : `确定删除「${target.name}」吗？`;
    if (!confirm(msg)) return;
    Store.removeCustomStarArtist(artistId);
    UI.toast('🗑️ 已删除');
    App.rerender();
  },

  // ==========================================
  // 10. 愿望清单
  // ==========================================
  wishlist() {
    let html = this.header('🛒 愿望清单', '想买的东西都在这里');
    const records = Store.getAll('wishlist');
    html += this.addButton('wishlist', '添加心愿');

    // 看板视图
    html += '<div class="card-title">📋 看板视图</div>';
    html += UI.kanban({
      dbName: 'wishlist',
      records,
      groupField: 'purchased',
      groupValues: [false, true],
      cardRenderer: (r) => {
        const priorityTag = r.priority === '很想要' ? 'tag-danger' : r.priority === '一般' ? 'tag-warn' : 'tag-gray';
        return `<div class="kanban-card" onclick="UI.openFormModalById('wishlist', '${r.id}')">
          <div class="flex items-center justify-between">
            <div class="kc-title" style="flex:1;">${UI.esc(r.item_name)}</div>
            <button class="btn btn-danger btn-sm" style="margin-left:8px;flex-shrink:0;" onclick="event.stopPropagation();UI.confirmDelete('wishlist','${r.id}')">🗑️</button>
          </div>
          <div class="kc-meta">
            <span class="tag tag-warn">¥${r.price || 0}</span>
            <span class="tag ${priorityTag}">${UI.esc(r.priority || '')}</span>
            ${r.category ? `<span>${UI.esc(r.category)}</span>` : ''}
          </div>
          ${r.link ? `<a href="${UI.esc(r.link)}" target="_blank" class="text-sm" onclick="event.stopPropagation()">🔗 购买链接</a>` : ''}
        </div>`;
      },
      onAdd: true,
    });

    // 看板列标题修正
    html = html.replace('kanban-col"><h4>false', 'kanban-col"><h4>🛒 未购买');
    html = html.replace('kanban-col"><h4>true', 'kanban-col"><h4>✅ 已拥有');

    // 表格视图（按优先级排序）
    html += '<div class="mt-3"><div class="card-title">📊 按优先级排序</div>';
    const priorityOrder = { '很想要': 0, '一般': 1, '不急': 2 };
    const sorted = [...records].sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3));
    html += UI.table({
      dbName: 'wishlist',
      records: sorted,
      columns: [
        { field: 'item_name', label: '物品' },
        { field: 'category', label: '分类' },
        { field: 'price', label: '价格' },
        { field: 'priority', label: '优先级' },
        { field: 'purchased', label: '已购买' },
      ],
      actions: {},
    });
    html += '</div>';
    return html;
  },

  // ==========================================
  // 11. 每日记账
  // ==========================================
  accountingToday() {
    let html = this.header('💸 今日支出', '今天的每一笔花费');
    const today = Store.todayStr();
    const records = Store.query('accounting', r => r.date === today);
    const expenses = records.filter(r => r.type === '支出');
    const income = records.filter(r => r.type === '收入');
    const totalExp = expenses.reduce((s, r) => s + (r.amount || 0), 0);
    const totalInc = income.reduce((s, r) => s + (r.amount || 0), 0);

    html += `<div class="card-grid card-grid-2 mb-3">
      <div class="card text-center">
        <div class="text-muted text-sm">今日支出</div>
        <div class="font-bold text-danger" style="font-size:24px;">¥${totalExp}</div>
      </div>
      <div class="card text-center">
        <div class="text-muted text-sm">今日收入</div>
        <div class="font-bold text-mint" style="font-size:24px;">¥${totalInc}</div>
      </div>
    </div>`;

    html += `<div class="mb-3"><button class="btn btn-primary btn-sm" onclick="UI.openFormModal('accounting', {date: '${today}', type: '支出'})">+ 记一笔</button></div>`;

    if (records.length === 0) {
      html += UI.emptyState('💰', '今天还没有记账');
    } else {
      html += '<div style="overflow-x:auto;"><table class="data-table"><thead><tr>';
      html += '<th>项目</th><th>金额</th><th>类型</th><th>分类</th><th>账户</th><th>操作</th></tr></thead><tbody>';
      records.forEach(r => {
        html += `<tr>
          <td>${UI.esc(r.item || '—')}</td>
          <td class="${r.type === '支出' ? 'text-danger' : 'text-mint'} font-bold">¥${r.amount || 0}</td>
          <td><span class="tag ${r.type === '支出' ? 'tag-danger' : 'tag-mint'}">${UI.esc(r.type)}</span></td>
          <td>${UI.esc(r.category || '—')}</td>
          <td>${UI.esc(r.account || '—')}</td>
          <td class="row-actions">
            <button class="btn btn-outline btn-sm" onclick="UI.openFormModalById('accounting', '${r.id}')">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="UI.confirmDelete('accounting', '${r.id}')">🗑️</button>
          </td>
        </tr>`;
      });
      html += '</tbody></table></div>';
    }
    return html;
  },

  accountingMonth() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const monthPrefix = `${y}-${m}`;

    let html = this.header('📊 月度账单', `${y}年${now.getMonth() + 1}月 收支分析`);
    const monthRecords = Store.query('accounting', r => r.date && r.date.startsWith(monthPrefix));
    const expenses = monthRecords.filter(r => r.type === '支出');
    const income = monthRecords.filter(r => r.type === '收入');
    const totalExp = expenses.reduce((s, r) => s + (r.amount || 0), 0);
    const totalInc = income.reduce((s, r) => s + (r.amount || 0), 0);

    // 概览卡片
    html += `<div class="card-grid card-grid-3 mb-3">
      <div class="card text-center">
        <div class="text-muted text-sm">月度支出</div>
        <div class="font-bold text-danger" style="font-size:20px;">¥${totalExp}</div>
      </div>
      <div class="card text-center">
        <div class="text-muted text-sm">月度收入</div>
        <div class="font-bold text-mint" style="font-size:20px;">¥${totalInc}</div>
      </div>
      <div class="card text-center">
        <div class="text-muted text-sm">结余</div>
        <div class="font-bold ${totalInc - totalExp >= 0 ? 'text-mint' : 'text-danger'}" style="font-size:20px;">¥${totalInc - totalExp}</div>
      </div>
    </div>`;

    // 按分类汇总 - 饼图
    const categories = Store.schemas.accounting.fields.find(f => f.name === 'category').options;
    const catData = categories.map(cat => {
      const total = expenses.filter(r => r.category === cat).reduce((s, r) => s + (r.amount || 0), 0);
      return { label: cat, value: total };
    }).filter(d => d.value > 0);

    if (catData.length > 0) {
      html += `<div class="chart-container mb-3">
        <div class="card-title">🍰 支出分类占比</div>
        ${UI.pieChart(catData)}
      </div>`;
    }

    // 按日柱状图
    const daysInMonth = new Date(y, now.getMonth() + 1, 0).getDate();
    const dailyData = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${monthPrefix}-${String(d).padStart(2, '0')}`;
      const total = expenses.filter(r => r.date === dateStr).reduce((s, r) => s + (r.amount || 0), 0);
      if (total > 0) dailyData.push({ label: String(d), value: total });
    }

    if (dailyData.length > 0) {
      html += `<div class="chart-container mb-3">
        <div class="card-title">📊 每日支出趋势</div>
        ${UI.barChart(dailyData)}
      </div>`;
    }

    // 按账户汇总（动态获取）
    const allRecords = Store.getAll('accounting');
    const accNames = [...new Set(allRecords.map(r => r.account).filter(Boolean))];
    html += '<div class="card"><div class="card-title">💳 按账户汇总</div>';
    accNames.forEach(acc => {
      const accExp = expenses.filter(r => r.account === acc).reduce((s, r) => s + (r.amount || 0), 0);
      const accInc = income.filter(r => r.account === acc).reduce((s, r) => s + (r.amount || 0), 0);
      if (accExp > 0 || accInc > 0) {
        html += `<div class="flex items-center justify-between mb-2">
          <span class="tag tag-mint">${UI.esc(acc)}</span>
          <span>支出 <span class="text-danger font-bold">¥${accExp}</span> · 收入 <span class="text-mint font-bold">¥${accInc}</span></span>
        </div>`;
      }
    });
    html += '</div>';
    return html;
  },

  accountingDebt() {
    let html = this.header('🚨 欠款追踪', '花呗、抖音月付等超前消费追踪');

    // 从资产库动态获取所有账户名（作为欠款渠道），也包含记账库中实际出现过的
    const debts = Store.query('accounting', r => r.debt_status === '未还');
    const allAssets = Store.getAll('assets');
    const assetNames = allAssets.map(a => a.name);
    debts.forEach(d => { if (d.account && !assetNames.includes(d.account)) assetNames.push(d.account); });
    const allAccounts = [...new Set(assetNames)];

    // 顶部操作区
    html += `<div class="flex items-center gap-2 mb-3" style="flex-wrap:wrap;">
      <button class="btn btn-primary btn-sm" onclick="App.addDebtRecord()">+ 记一笔欠款</button>
      <button class="btn btn-outline btn-sm" onclick="App.addDebtChannel()">+ 管理欠款渠道</button>
    </div>`;

    // 总欠款
    const totalDebt = debts.reduce((s, r) => s + (r.amount || 0), 0);
    html += `<div class="card text-center mb-3" style="background:var(--danger-bg);">
      <div class="text-danger text-sm">总欠款</div>
      <div class="font-bold text-danger" style="font-size:28px;">¥${totalDebt}</div>
    </div>`;

    // 按账户分组
    allAccounts.forEach(acc => {
      const accDebts = debts.filter(r => r.account === acc);
      if (accDebts.length === 0) return;
      const accTotal = accDebts.reduce((s, r) => s + (r.amount || 0), 0);

      html += `<div class="card" style="border-color:var(--danger);background:var(--danger-bg);">
        <div class="card-title">
          <span class="text-danger">${UI.esc(acc)}</span>
          <span class="badge tag-danger">¥${accTotal}</span>
        </div>`;
      accDebts.forEach(d => {
        html += `<div class="flex items-center justify-between mb-2" style="flex-wrap:wrap;gap:6px;">
          <div>
            <span class="text-sm">${UI.esc(d.item || '—')}</span>
            <span class="text-muted text-sm ml-2">${UI.esc(d.date || '')}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-danger font-bold">¥${d.amount || 0}</span>
            <button class="btn btn-outline btn-sm" onclick="UI.openFormModalById('accounting','${d.id}')">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="UI.confirmDelete('accounting','${d.id}')">🗑️</button>
            <button class="btn btn-primary btn-sm" onclick="App.markDebtPaid('${d.id}')">✅ 已还</button>
          </div>
        </div>`;
      });
      html += '</div>';
    });

    if (debts.length === 0) {
      html += UI.emptyState('🎉', '没有欠款，财务自由！');
    }
    return html;
  },

  // ==========================================
  // 12. 每日打卡
  // ==========================================
  dailyCheckin() {
    let html = this.header('🎯 每日打卡', '日历视图 · 点击日期查看打卡详情');
    html += UI.calendar({
      dbName: 'daily_checkin',
      dateField: 'date',
      year: App.calendarYear,
      month: App.calendarMonth,
      markerFn: (dayRecords) => {
        const r = dayRecords[0];
        if (!r) return '';
        const completed = Store.schemas.daily_checkin.fields.filter(f => f.type === 'checkbox');
        const doneCount = completed.filter(f => r[f.name]).length;
        const pct = Math.round((doneCount / completed.length) * 100);
        const color = pct >= 80 ? '#4caf50' : pct >= 50 ? '#ffc107' : '#ff9800';
        return `<div class="dot-marker"><span style="background:${color}"></span></div>`;
      }
    });

    // 最近7天打卡概览
    const today = new Date();
    let recentHtml = '<div class="card"><div class="card-title">📅 最近7天</div>';
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const record = Store.query('daily_checkin', r => r.date === dateStr)[0];
      if (record) {
        const checkboxes = Store.schemas.daily_checkin.fields.filter(f => f.type === 'checkbox');
        const done = checkboxes.filter(f => record[f.name]).length;
        const pct = Math.round((done / checkboxes.length) * 100);
        const color = pct >= 80 ? '#4caf50' : pct >= 50 ? '#ffc107' : '#ff9800';
        recentHtml += `<div class="flex items-center justify-between mb-2">
          <span class="text-sm">${UI.esc(dateStr)} ${['日','一','二','三','四','五','六'][d.getDay()]}</span>
          <span class="flex items-center gap-2">
            <div style="width:60px;height:6px;background:var(--border-light);border-radius:3px;overflow:hidden;">
              <div style="width:${pct}%;height:100%;background:${color};"></div>
            </div>
            <span class="text-sm">${done}/${checkboxes.length}</span>
          </span>
        </div>`;
      } else {
        recentHtml += `<div class="flex items-center justify-between mb-2">
          <span class="text-sm text-muted">${UI.esc(dateStr)} ${['日','一','二','三','四','五','六'][d.getDay()]}</span>
          <span class="text-muted text-sm">未打卡</span>
        </div>`;
      }
    }
    recentHtml += '</div>';
    html += recentHtml;

    // 最近夸夸（点击日历某一天也可查看当天夸夸）
    let praiseHtml = '<div class="card mt-3"><div class="card-title">🌸 最近夸夸</div>';
    const tD = new Date();
    const tsa = new Date(tD); tsa.setDate(tsa.getDate() - 30);
    const tsaStr = tsa.toISOString().slice(0, 10);
    const recentPraises = Store.getAllPraise().filter(p => p.date >= tsaStr);
    const wds = ['日', '一', '二', '三', '四', '五', '六'];
    if (recentPraises.length === 0) {
      praiseHtml += '<p class="text-sm text-muted">还没有记录过夸夸，去今日仪表盘写下第一句吧～</p>';
    } else {
      recentPraises.slice(0, 20).forEach(p => {
        const d = new Date(p.date);
        praiseHtml += `<div style="margin-bottom:10px;padding:8px 10px;background:var(--mint-lightest);border-radius:8px;">
          <div class="text-sm font-bold" style="margin-bottom:2px;">${UI.esc(p.date)} <span class="text-muted" style="font-weight:normal;">周${wds[d.getDay()]}</span></div>
          <div class="text-sm" style="white-space:pre-wrap;">${UI.esc(p.content)}</div>
        </div>`;
      });
    }
    praiseHtml += '</div>';
    html += praiseHtml;

    return html;
  },

  // ==========================================
  // 13. 周复盘
  // ==========================================
  weeklyReview() {
    let html = this.header('📅 周复盘', '每周一次，回顾与成长');
    const weekTitle = Store.getWeekTitle(new Date());

    // 获取或创建本周记录
    let thisWeek = Store.query('weekly_review', r => r.week === weekTitle)[0];
    if (!thisWeek) {
      thisWeek = Store.add('weekly_review', {
        week: weekTitle, completed: '', problems: '', improvements: '', highlights: '', notes: ''
      });
    }

    // 本周填写区
    const sections = [
      { field: 'completed', label: '✅ 完成了什么', placeholder: '本周完成了哪些事项...' },
      { field: 'problems', label: '⚠️ 问题与阻碍', placeholder: '遇到了什么问题和阻碍...' },
      { field: 'improvements', label: '💡 下周改进', placeholder: '下周打算怎么改进...' },
      { field: 'highlights', label: '🌟 高光时刻', placeholder: '本周最闪耀的瞬间...' },
    ];

    html += `<div class="card card-dot-border">
      <div class="card-title">📝 ${UI.esc(weekTitle)} <span class="badge">本周</span></div>`;
    sections.forEach(s => {
      html += `<div class="form-group">
        <label>${s.label}</label>
        <textarea class="form-textarea" placeholder="${UI.esc(s.placeholder)}" onblur="App.saveWeeklyReview('${thisWeek.id}', '${s.field}', this.value)">${UI.esc(thisWeek[s.field] || '')}</textarea>
      </div>`;
    });
    html += `<div class="form-group">
      <label>📝 备注</label>
      <input type="text" class="form-input" placeholder="其他补充..." value="${UI.esc(thisWeek.notes || '')}" onblur="App.saveWeeklyReview('${thisWeek.id}', 'notes', this.value)">
    </div>`;
    html += '</div>';

    // 历史周复盘
    const allReviews = Store.getAll('weekly_review').filter(r => r.id !== thisWeek.id).sort((a, b) => (b.week || '').localeCompare(a.week || ''));
    if (allReviews.length > 0) {
      html += '<div class="mt-3"><div class="card-title">📖 历史周复盘</div>';
      allReviews.forEach(r => {
        html += `<div class="card">
          <div class="flex items-center justify-between">
            <div class="kc-title font-bold">${UI.esc(r.week)}</div>
          </div>
          ${r.completed ? `<div class="mt-2"><span class="text-sm font-bold">✅ 完成了什么</span><p class="text-sm text-muted">${UI.esc(r.completed)}</p></div>` : ''}
          ${r.problems ? `<div class="mt-2"><span class="text-sm font-bold">⚠️ 问题与阻碍</span><p class="text-sm text-muted">${UI.esc(r.problems)}</p></div>` : ''}
          ${r.improvements ? `<div class="mt-2"><span class="text-sm font-bold">💡 下周改进</span><p class="text-sm text-muted">${UI.esc(r.improvements)}</p></div>` : ''}
          ${r.highlights ? `<div class="mt-2"><span class="text-sm font-bold">🌟 高光时刻</span><p class="text-sm text-muted">${UI.esc(r.highlights)}</p></div>` : ''}
          <div class="flex gap-2 mt-3">
            <button class="btn btn-outline btn-sm" onclick="UI.openFormModalById('weekly_review', '${r.id}')">✏️ 编辑</button>
            <button class="btn btn-danger btn-sm" onclick="UI.confirmDelete('weekly_review', '${r.id}')">🗑️ 删除</button>
          </div>
        </div>`;
      });
      html += '</div>';
    }
    return html;
  },

  // ==========================================
  // 14. 日记
  // ==========================================
  diary() {
    let html = this.header('📔 日记', '记录每一天的生活点滴');
    const today = Store.todayStr();

    // 查找或创建今天的日记
    let todayEntry = Store.query('diary', r => r.date === today)[0];

    html += `<div class="card card-dot-border">
      <div class="card-title">📝 今天的日记 ${todayEntry ? '<span class="badge">已记录</span>' : ''}</div>`;

    html += `<div class="form-group">
      <label>📅 日期</label>
      <input type="date" class="form-input" id="diary-date" value="${UI.esc(today)}">
    </div>`;

    html += `<div class="form-group">
      <label>📌 标题</label>
      <input type="text" class="form-input" id="diary-title" value="${UI.esc(todayEntry ? (todayEntry.title || '') : '')}" placeholder="今天的主题是什么？">
    </div>`;

    html += `<div class="form-group">
      <label>✍️ 日记内容</label>
      <textarea class="form-textarea" id="diary-content" style="min-height:200px;" placeholder="今天发生了什么...">${UI.esc(todayEntry ? (todayEntry.content || '') : '')}</textarea>
    </div>`;

    const moods = ['🌟超棒', '😌平静', '😴疲惫', '😢难过', '😰焦虑', '🤩兴奋', '😤生气'];
    html += `<div class="form-group">
      <label>😊 心情</label>
      <div class="flex gap-2 flex-wrap">
        ${moods.map(m => `<span class="filter-chip ${todayEntry && todayEntry.mood === m ? 'active' : ''}" data-mood="${m}" onclick="Pages.selectDiaryMood(this, '${m}')">${m}</span>`).join('')}
        <input type="hidden" id="diary-mood" value="${UI.esc(todayEntry ? (todayEntry.mood || '') : '')}">
      </div>
    </div>`;

    html += `<div class="form-group">
      <label>🏷️ 标签</label>
      <input type="text" class="form-input" id="diary-tags" value="${UI.esc(todayEntry ? (todayEntry.tags || '') : '')}" placeholder="如：工作,生活,学习">
    </div>`;

    html += `<button class="btn btn-primary w-full" onclick="Pages.saveDiary('${todayEntry ? todayEntry.id : ''}')">${todayEntry ? '💾 更新日记' : '📝 保存日记'}</button>`;
    html += '</div>';

    // 历史日记列表
    const allDiaries = Store.getAll('diary').filter(d => d.id !== (todayEntry ? todayEntry.id : '')).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (allDiaries.length > 0) {
      html += '<div class="mt-3"><div class="card-title">📖 历史日记</div>';
      allDiaries.forEach(d => {
        const moodEmoji = (d.mood || '').split('').slice(0, 1).join('') || '';
        html += `<div class="card" onclick="Pages.loadDiary('${d.id}')" style="cursor:pointer;">
          <div class="flex items-center justify-between">
            <div>
              <div class="kc-title font-bold">${UI.esc(d.date)} ${moodEmoji}</div>
              <div class="text-sm">${UI.esc(d.title || '未命名日记')}</div>
            </div>
            <div class="flex items-center gap-2" onclick="event.stopPropagation();">
            <button class="btn btn-outline btn-sm" onclick="UI.openFormModalById('diary', '${d.id}')">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="UI.confirmDelete('diary', '${d.id}')">🗑️</button>
            </div>
          </div>
          ${d.content ? `<div class="text-sm text-muted mt-2" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${UI.esc(d.content.slice(0, 80))}...</div>` : ''}
          ${d.tags ? `<div class="mt-2">${d.tags.split(',').filter(Boolean).map(t => `<span class="tag tag-mint">${UI.esc(t.trim())}</span>`).join(' ')}</div>` : ''}
        </div>`;
      });
      html += '</div>';
    }
    return html;
  },

  // ==========================================
  // 14.5 夸夸收集（与日记平级）
  // ==========================================
  praise() {
    let html = this.header('🌸 夸夸收集', '收集每一句对自我的温柔肯定');
    const all = Store.getAllPraise();
    const today = Store.todayStr();
    const days = new Set(all.map(p => p.date));
    const wds = ['日', '一', '二', '三', '四', '五', '六'];

    // 统计卡片
    html += `<div class="card card-dot-border">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm text-muted">累计收集</div>
          <div class="font-bold" style="font-size:26px;">🌸 ${all.length} 句</div>
        </div>
        <div style="text-align:right;">
          <div class="text-sm text-muted">坚持天数</div>
          <div class="font-bold" style="font-size:26px;">${days.size} 天</div>
        </div>
      </div>
      ${all.length ? `<p class="text-sm text-muted mt-2">最近一次：${UI.esc(all[0].date)}</p>` : '<p class="text-sm text-muted mt-2">还没有夸夸，去写下第一句吧～</p>'}
    </div>`;

    // 搜索 + 日期筛选
    const kw = App.praiseKeyword || '';
    const dateFilter = App.praiseDateFilter || '';
    html += `<div class="filter-bar">
      <input type="text" class="form-input" style="flex:1;min-width:110px;" placeholder="🔍 搜索内容（回车）" value="${UI.esc(kw)}" onchange="App.setPraiseKeyword(this.value)">
      <input type="date" class="form-input" style="width:auto;" value="${UI.esc(dateFilter)}" onchange="App.setPraiseDate(this.value)" title="按日期筛选">
      ${dateFilter ? `<button class="btn btn-outline btn-sm" onclick="App.setPraiseDate('')">✕</button>` : ''}
      <button class="btn btn-primary btn-sm" style="margin-left:auto;" onclick="Pages.editPraiseDay('${today}')">+ 写夸夸</button>
    </div>`;

    // 过滤
    let filtered = all;
    if (kw) filtered = filtered.filter(p => (p.content || '').includes(kw) || (p.from_who || '').includes(kw));
    if (dateFilter) filtered = filtered.filter(p => p.date === dateFilter);

    // 按日期分组倒序
    const byDate = {};
    filtered.forEach(p => { (byDate[p.date] = byDate[p.date] || []).push(p); });
    const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

    if (dates.length === 0) {
      html += UI.emptyState('🌸', kw || dateFilter ? '没有匹配的夸夸' : '还没有夸夸记录');
    } else {
      dates.forEach(date => {
        const items = byDate[date];
        const d = new Date(date);
        html += `<div class="card">
          <div class="flex items-center justify-between">
            <div class="card-title" style="margin:0;">📅 ${UI.esc(date)} <span class="text-muted" style="font-weight:normal;">周${wds[d.getDay()]}</span> <span class="badge">${items.length}</span></div>
            <div class="flex gap-2">
              <button class="btn btn-outline btn-sm" onclick="Pages.editPraiseDay('${date}')">✏️ 编辑</button>
              <button class="btn btn-danger btn-sm" onclick="Pages.deletePraiseDay('${date}')">🗑️</button>
            </div>
          </div>`;
        items.forEach(p => {
          const m = (p.mood || '').split('').slice(0, 1).join('') || '🌸';
          html += `<div style="margin-top:8px;padding:8px 12px;background:var(--mint-lightest);border-radius:12px;border-left:3px solid var(--mint);">
            <div class="flex items-center gap-2">
              <span>${m}</span>
              <span class="text-sm" style="white-space:pre-wrap;">${UI.esc(p.content)}</span>
            </div>
            ${p.from_who ? `<div class="text-xs text-muted mt-1">— ${UI.esc(p.from_who)}</div>` : ''}
          </div>`;
        });
        html += '</div>';
      });
    }

    // 日历（点击某天筛选）
    html += `<div class="mt-3"><div class="card-title">📅 点选日期查看当天夸夸</div>`;
    html += UI.calendar({
      dbName: 'praise',
      dateField: 'date',
      year: App.calendarYear,
      month: App.calendarMonth,
      onDayClick: 'Pages.praisePickDate',
      markerFn: (dayRecords) => dayRecords.length ? `<div class="dot-marker"><span style="background:var(--mint)"></span></div>` : '',
    });
    html += '</div>';

    return html;
  },

  // 日历点击：筛选某天
  praisePickDate(dateStr) {
    App.praiseDateFilter = dateStr;
    App.rerender();
  },

  // 编辑某天夸夸（含新增）
  editPraiseDay(date) {
    const items = Store.getPraiseByDate(date);
    const existing = items.map(p => p.content).join('\n');
    const curMood = items[0] ? (items[0].mood || '') : '';
    const curFrom = items[0] ? (items[0].from_who || '') : '';
    const moods = ['🌟超棒', '😌平静', '😴疲惫', '😢难过', '😰焦虑', '🤩兴奋', '😤生气'];
    let html = `<div class="form-group"><label>📅 日期</label><input type="date" class="form-input" id="praise-edit-date" value="${UI.esc(date)}"></div>`;
    html += `<div class="form-group"><label>🌸 夸夸内容（每行一句）</label>
      <textarea class="form-textarea" id="praise-edit-content" style="min-height:160px;" placeholder="今天也很棒，写下来吧～">${UI.esc(existing)}</textarea></div>`;
    html += `<div class="form-group"><label>😊 心情</label><div class="flex gap-2 flex-wrap" id="praise-edit-moods">
      ${moods.map(m => `<span class="filter-chip ${curMood === m ? 'active' : ''}" data-m="${m}" onclick="Pages._pickPraiseMood(this,'${m}')">${m}</span>`).join('')}
      <input type="hidden" id="praise-edit-mood" value="${UI.esc(curMood)}"></div></div>`;
    html += `<div class="form-group"><label>来自谁/场景（可选）</label>
      <input type="text" class="form-input" id="praise-edit-from" value="${UI.esc(curFrom)}" placeholder="如：自己 / 妈妈 / 同事"></div>`;
    html += `<div class="flex gap-2">
      <button class="btn btn-primary flex-1" onclick="Pages.savePraiseDay('${date}')">💾 保存</button>
      <button class="btn btn-outline" onclick="UI.closeModal()">取消</button></div>`;
    UI.openModal('✏️ 编辑夸夸 · ' + date, html);
  },

  _pickPraiseMood(el, m) {
    el.parentElement.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('praise-edit-mood').value = m;
  },

  savePraiseDay(oldDate) {
    const date = document.getElementById('praise-edit-date').value || oldDate;
    const content = document.getElementById('praise-edit-content').value;
    const mood = document.getElementById('praise-edit-mood').value;
    const fromWho = document.getElementById('praise-edit-from').value;
    const lines = (content || '').split('\n').map(s => s.trim()).filter(Boolean);
    Store.saveDayPraise(date, lines, mood, fromWho);
    UI.closeModal();
    UI.toast('🌸 夸夸已保存');
    App.rerender();
  },

  deletePraiseDay(date) {
    if (typeof confirm === 'function' && !confirm('确定删除 ' + date + ' 的所有夸夸吗？')) return;
    Store.deleteDayPraise(date);
    UI.toast('已删除该天夸夸');
    App.rerender();
  },

  // 日记心情选择
  selectDiaryMood(el, mood) {
    el.parentElement.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('diary-mood').value = mood;
  },

  // 保存日记
  saveDiary(existingId) {
    const date = document.getElementById('diary-date').value;
    const title = document.getElementById('diary-title').value;
    const content = document.getElementById('diary-content').value;
    const mood = document.getElementById('diary-mood').value;
    const tags = document.getElementById('diary-tags').value;

    if (!date) { UI.toast('请选择日期'); return; }

    if (existingId) {
      Store.update('diary', existingId, { date, title, content, mood, tags });
      UI.toast('✅ 日记已更新');
    } else {
      Store.add('diary', { date, title, content, mood, tags });
      UI.toast('✅ 日记已保存');
    }
    App.rerender();
  },

  // 加载日记到编辑区
  loadDiary(id) {
    const d = Store.getById('diary', id);
    if (!d) return;
    document.getElementById('diary-date').value = d.date || '';
    document.getElementById('diary-title').value = d.title || '';
    document.getElementById('diary-content').value = d.content || '';
    document.getElementById('diary-mood').value = d.mood || '';
    document.getElementById('diary-tags').value = d.tags || '';
    // 更新心情选择器
    document.querySelectorAll('[data-mood]').forEach(el => {
      el.classList.toggle('active', el.dataset.mood === d.mood);
    });
    document.getElementById('content').scrollTo({ top: 0, behavior: 'smooth' });
    UI.toast('📖 已加载日记');
  },

  // ==========================================
  // 手工模块
  // ==========================================
  handcraftKanban() {
    let html = this.header('🧶 手工项目', '钩织与缝纫 · 想做就做');
    const items = Store.getAll('handcraft');
    const kd = { '想做': [], '进行中': [], '已完成': [] };
    const statusIcons = { '想做': '📌', '进行中': '🪡', '已完成': '✅' };

    items.forEach(item => {
      const s = item.status || '想做';
      if (kd[s]) kd[s].push(item);
    });

    Object.keys(kd).forEach(status => {
      html += `<div class="card card-dot-border mb-3">
        <div class="card-title" style="flex-wrap:wrap;gap:4px;">
          <span>${statusIcons[status]} ${status} <span class="badge">${kd[status].length}</span></span>
          <span class="flex items-center gap-1" style="margin-left:auto;">
            <button class="btn btn-outline btn-sm" style="font-size:11px;padding:2px 6px;" onclick="UI.openFormModal('handcraft',{type:'钩织',status:'${status}'})">🧵 +</button>
            <button class="btn btn-outline btn-sm" style="font-size:11px;padding:2px 6px;" onclick="UI.openFormModal('handcraft',{type:'缝纫',status:'${status}'})">🪡 +</button>
          </span>
        </div>`;
      if (kd[status].length === 0) {
        html += '<p class="text-muted text-sm">暂无</p>';
      } else {
        kd[status].forEach(item => {
          const typeEmoji = item.type === '钩织' ? '🧵' : '🪡';
          html += `<div class="hc-item">
            <div class="flex items-center justify-between">
              <div>
                <span class="tag tag-gray">${typeEmoji} ${UI.esc(item.type)}</span>
                <span class="kc-title ml-2">${UI.esc(item.title)}</span>
                ${item.is_reference ? '<span class="tag tag-mint">📖 参考帖</span>' : item.for_who ? `<span class="tag tag-warn">👤 ${UI.esc(item.for_who)}</span>` : ''}
              </div>
              <div class="flex items-center gap-1">
                <button class="btn btn-outline btn-sm" onclick="UI.openFormModalById('handcraft','${item.id}')">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="UI.confirmDelete('handcraft','${item.id}')">🗑️</button>
              </div>
            </div>
            ${item.link ? `<div class="mt-1"><a href="${item.link}" target="_blank" rel="noopener" class="text-sm" style="color:var(--mint);">🔗 查看教程</a></div>` : ''}
            ${item.notes ? `<div class="text-sm text-muted mt-1">${UI.esc(item.notes)}</div>` : ''}
          </div>`;
        });
      }
      html += '</div>';
    });

    html += this.addButton('handcraft', '添加项目');
    return html;
  },

  handcraftTable(type) {
    const emoji = type === '钩织' ? '🧵' : '🪡';
    let html = this.header(`${emoji} ${type}`, type === '钩织' ? '毛线、钩针的世界' : '布料、针线的世界');
    const allItems = Store.query('handcraft', r => r.type === type);

    // 区分为项目类和参考类
    const projects = allItems.filter(r => !r.is_reference);
    const refs = allItems.filter(r => r.is_reference);

    // 参考帖区
    if (refs.length > 0) {
      html += `<div class="card card-dot-border mb-3" style="background:var(--mint-lightest);">
        <div class="card-title">📖 参考/科普帖</div>`;
      refs.forEach(r => {
        html += `<div class="hc-item">
          <div class="flex items-center justify-between">
            <div>
              <span class="kc-title">${UI.esc(r.title)}</span>
              ${r.link ? `<a href="${r.link}" target="_blank" rel="noopener" class="text-sm ml-2" style="color:var(--mint);">🔗</a>` : ''}
            </div>
            <div class="flex items-center gap-1">
              <button class="btn btn-outline btn-sm" onclick="UI.openFormModalById('handcraft','${r.id}')">✏️</button>
              <button class="btn btn-danger btn-sm" onclick="UI.confirmDelete('handcraft','${r.id}')">🗑️</button>
            </div>
          </div>
          ${r.notes ? `<div class="text-sm text-muted mt-1">${UI.esc(r.notes)}</div>` : ''}
        </div>`;
      });
      html += '<button class="btn btn-outline btn-sm mt-2" onclick="UI.openFormModal(\'handcraft\', {type:\''+type+'\', is_reference:true, status:\'已完成\'})">+ 添加参考帖</button>';
      html += '</div>';
    } else {
      html += `<div class="card card-dot-border mb-3" style="background:var(--mint-lightest);">
        <div class="card-title">📖 参考/科普帖</div>
        <p class="text-muted text-sm">暂无参考帖，添加一些教程和科普链接吧～</p>
        <button class="btn btn-outline btn-sm mt-1" onclick="UI.openFormModal('handcraft', {type:'${type}', is_reference:true, status:'已完成'})">+ 添加参考帖</button>
      </div>`;
    }

    // 作品项目区
    html += `<div class="card"><div class="card-title">🧶 作品项目</div>`;
    if (projects.length === 0) {
      html += UI.emptyState(emoji, `还没有${type}项目`);
    } else {
      projects.forEach(p => {
        const statusTag = { '想做': 'tag-gray', '进行中': 'tag-warn', '已完成': 'tag-mint' }[p.status] || 'tag-gray';
        html += `<div class="hc-item">
          <div class="flex items-center justify-between" style="flex-wrap:wrap;gap:4px;">
            <div>
              <span class="kc-title">${UI.esc(p.title)}</span>
              <span class="tag ${statusTag} ml-2">${UI.esc(p.status)}</span>
              ${p.for_who ? `<span class="tag tag-warn">👤 ${UI.esc(p.for_who)}</span>` : ''}
            </div>
            <div class="flex items-center gap-1">
              <button class="btn btn-outline btn-sm" onclick="UI.openFormModalById('handcraft','${p.id}')">✏️</button>
              <button class="btn btn-danger btn-sm" onclick="UI.confirmDelete('handcraft','${p.id}')">🗑️</button>
            </div>
          </div>
          ${p.link ? `<div class="mt-1"><a href="${p.link}" target="_blank" rel="noopener" class="text-sm" style="color:var(--mint);">🔗 查看教程</a></div>` : ''}
          ${p.notes ? `<div class="text-sm text-muted mt-1">${UI.esc(p.notes)}</div>` : ''}
        </div>`;
      });
    }
    html += `<div class="flex items-center gap-2 mt-3">
      <span class="text-sm text-muted">+ 添加</span>
      <button class="btn btn-outline btn-sm" onclick="UI.openFormModal('handcraft', {type:'${type}', status:'想做'})">📌 想做</button>
      <button class="btn btn-outline btn-sm" onclick="UI.openFormModal('handcraft', {type:'${type}', status:'进行中'})">🪡 进行中</button>
      <button class="btn btn-outline btn-sm" onclick="UI.openFormModal('handcraft', {type:'${type}', status:'已完成'})">✅ 已完成</button>
    </div>`;
    html += '</div>';
    return html;
  },

  // ==========================================
  // 宝藏网站
  // ==========================================
  treasureSites() {
    let html = this.header('💎 宝藏网站', '设计 · 素材 · 实用工具');
    const sites = Store.getAll('treasure_sites');
    const categories = ['设计', '素材', '实用工具'];
    const catIcons = { '设计': '🎨', '素材': '🖼️', '实用工具': '🔧' };

    categories.forEach(cat => {
      const catSites = sites.filter(s => s.category === cat);
      html += `<div class="card card-dot-border mb-3">
        <div class="card-title">${catIcons[cat]} ${cat} <span class="badge">${catSites.length}</span></div>`;
      if (catSites.length === 0) {
        html += `<p class="text-muted text-sm">暂无收藏 <button class="btn btn-outline btn-sm ml-2" onclick="UI.openFormModal('treasure_sites', {category:'${cat}'})">+ 添加</button></p>`;
      } else {
        catSites.forEach(s => {
          html += `<div class="site-card">
            <div class="site-info" style="flex:1;">
              <div class="flex items-center justify-between">
                <h4 style="margin:0;">${UI.esc(s.name)}</h4>
                <div class="flex items-center gap-1">
                  <button class="btn btn-outline btn-sm" onclick="UI.openFormModalById('treasure_sites','${s.id}')">✏️</button>
                  <button class="btn btn-danger btn-sm" onclick="UI.confirmDelete('treasure_sites','${s.id}')">🗑️</button>
                </div>
              </div>
              ${s.description ? `<p class="text-sm text-muted mt-1">${UI.esc(s.description)}</p>` : ''}
              ${s.url ? `<a href="${UI.esc(s.url)}" target="_blank" rel="noopener" class="btn btn-primary btn-sm site-link mt-1">前往 →</a>` : ''}
            </div>
          </div>`;
        });
      }
      html += '</div>';
    });

    html += '<div class="mt-3">' + this.addButton('treasure_sites', '添加网站') + '</div>';
    return html;
  },

  // ==========================================
  // 16. 薅羊毛心得
  // ==========================================
  moneyTips() {
    let html = this.header('🐑 薅羊毛心得', '签到 · 优惠券 · 返利 · 技巧 · 避坑');
    const tips = Store.getAll('money_tips');
    const categories = ['签到', '优惠券', '返利', '技巧', '避坑', '其他'];
    const catIcons = { '签到': '✅', '优惠券': '🎫', '返利': '💵', '技巧': '💡', '避坑': '⚠️', '其他': '📌' };
    const catColors = { '签到': '#4caf50', '优惠券': '#ff9800', '返利': '#e91e63', '技巧': '#2196f3', '避坑': '#f44336', '其他': '#607d8b' };

    // 顶部添加按钮
    html += '<div class="mb-3">' + this.addButton('money_tips', '添加心得') + '</div>';

    if (tips.length === 0) {
      html += UI.emptyState('🐑', '还没有薅羊毛心得，点击上方按钮添加第一条吧');
    }

    // 按分类分组渲染
    const grouped = {}; // 已渲染的分类集合
    categories.forEach(cat => {
      const catTips = tips.filter(t => t.category === cat);
      if (catTips.length === 0) return;
      grouped[cat] = true;

      html += `<div class="card card-dot-border mb-3">
        <div class="card-title" style="border-left:3px solid ${catColors[cat]};padding-left:8px;">
          ${catIcons[cat]} ${cat} <span class="badge">${catTips.length}</span>
        </div>`;

      catTips.forEach(t => {
        const preview = (t.content || '').length > 120
          ? UI.esc(t.content.slice(0, 120)) + '...'
          : UI.esc(t.content || '');
        const sourceTag = t.source
          ? `<span class="tag tag-mint" style="margin-left:6px;font-size:11px;">${UI.esc(t.source)}</span>`
          : '';
        const dateTag = t.date
          ? `<span class="text-sm text-muted" style="margin-left:6px;">${t.date}</span>`
          : '';

        html += `<div class="site-card">
          <div style="flex:1;">
            <div class="flex items-center justify-between">
              <div>
                <h4 style="margin:0;">${UI.esc(t.title || '未命名')}${sourceTag}${dateTag}</h4>
              </div>
              <div class="flex items-center gap-1">
                ${t.link ? `<a href="${UI.esc(t.link)}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">🔗</a>` : ''}
                <button class="btn btn-outline btn-sm" onclick="UI.openFormModalById('money_tips','${t.id}')">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="UI.confirmDelete('money_tips','${t.id}')">🗑️</button>
              </div>
            </div>
            ${preview ? `<p class="text-sm text-muted mt-1" style="white-space:pre-wrap;">${preview}</p>` : ''}
          </div>
        </div>`;
      });

      html += '</div>';
    });

    // 未分类的兜底（防止记录不可见）
    const uncategorized = tips.filter(t => !t.category || !categories.includes(t.category));
    if (uncategorized.length > 0) {
      html += `<div class="card card-dot-border mb-3">
        <div class="card-title" style="border-left:3px solid #9e9e9e;padding-left:8px;">
          ❓ 未分类 <span class="badge">${uncategorized.length}</span>
        </div>`;
      uncategorized.forEach(t => {
        const preview = (t.content || '').length > 120
          ? UI.esc(t.content.slice(0, 120)) + '...'
          : UI.esc(t.content || '');
        html += `<div class="site-card">
          <div style="flex:1;">
            <div class="flex items-center justify-between">
              <h4 style="margin:0;">${UI.esc(t.title || '未命名')}</h4>
              <div class="flex items-center gap-1">
                ${t.link ? `<a href="${UI.esc(t.link)}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">🔗</a>` : ''}
                <button class="btn btn-outline btn-sm" onclick="UI.openFormModalById('money_tips','${t.id}')">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="UI.confirmDelete('money_tips','${t.id}')">🗑️</button>
              </div>
            </div>
            ${preview ? `<p class="text-sm text-muted mt-1" style="white-space:pre-wrap;">${preview}</p>` : ''}
          </div>
        </div>`;
      });
      html += '</div>';
    }

    return html;
  },

  // ==========================================
  // 15. 总资产
  // ==========================================
  assetsPage() {
    let html = this.header('🏦 总资产', '管理银行卡、微信、支付宝等账户余额');
    const assets = Store.getAll('assets');
    html += this.addButton('assets', '添加账户');

    // 计算总净资产
    const cashTotal = assets.filter(a => !a.is_credit).reduce((s, a) => s + (a.balance || 0), 0);
    const creditTotal = assets.filter(a => a.is_credit).reduce((s, a) => s + (a.balance || 0), 0);
    const netWorth = cashTotal - creditTotal;

    // 概览卡片
    html += `<div class="card-grid card-grid-3 mb-3">
      <div class="card text-center">
        <div class="text-muted text-sm">💰 现金资产</div>
        <div class="font-bold text-mint" style="font-size:22px;">¥${cashTotal}</div>
      </div>
      <div class="card text-center">
        <div class="text-muted text-sm">💳 负债/额度</div>
        <div class="font-bold text-danger" style="font-size:22px;">¥${creditTotal}</div>
      </div>
      <div class="card text-center">
        <div class="text-muted text-sm">📊 净资产</div>
        <div class="font-bold ${netWorth >= 0 ? 'text-mint' : 'text-danger'}" style="font-size:22px;">¥${netWorth}</div>
      </div>
    </div>`;

    if (assets.length === 0) {
      html += UI.emptyState('🏦', '暂无资产记录，添加你的第一个账户');
    } else {
      // 按类型分组显示
      const types = ['银行卡', '微信', '支付宝', '现金', '花呗', '抖音月付', '其他'];
      types.forEach(type => {
        const typeAssets = assets.filter(a => a.type === type);
        if (typeAssets.length === 0) return;
        const typeTotal = typeAssets.reduce((s, a) => s + (a.balance || 0), 0);

        html += `<div class="card">
          <div class="card-title">
            <span>${type === '银行卡' ? '💳' : type === '微信' ? '💬' : type === '支付宝' ? '🔵' : type === '现金' ? '💵' : type === '花呗' ? '🌸' : type === '抖音月付' ? '🎵' : '📦'} ${UI.esc(type)}</span>
            <span class="badge">¥${typeTotal}</span>
          </div>`;
        typeAssets.forEach(a => {
          const isCred = a.is_credit;
          html += `<div class="flex items-center justify-between mb-2" style="padding:8px;background:${isCred ? 'var(--danger-bg)' : 'var(--mint-lightest)'};border-radius:8px;">
            <div>
              <span class="font-bold text-sm">${UI.esc(a.name)}</span>
              ${a.account_num ? `<span class="text-muted text-sm ml-2">${UI.esc(a.account_num)}</span>` : ''}
              ${isCred ? '<span class="tag tag-danger">信贷</span>' : ''}
            </div>
            <div class="flex items-center gap-2">
              <span class="font-bold ${isCred ? 'text-danger' : 'text-mint'}">¥${a.balance || 0}</span>
              <button class="btn btn-outline btn-sm" onclick="UI.openFormModalById('assets', '${a.id}')">✏️</button>
              <button class="btn btn-danger btn-sm" onclick="UI.confirmDelete('assets', '${a.id}')">🗑️</button>
            </div>
          </div>`;
        });
        html += '</div>';
      });
    }

    // 提示
    html += `<div class="info-block mt-3">
      <h4>💡 使用提示</h4>
      <ul class="text-sm" style="list-style:inside;">
        <li>现金类账户（银行卡、微信、支付宝、现金）：填写当前余额</li>
        <li>信贷类账户（花呗、抖音月付）：勾选"是否信贷"，填写欠款额度</li>
        <li>记账时选择账户会影响总资产计算</li>
      </ul>
    </div>`;
    return html;
  },
  // ========== 自定义运动类别管理 ==========
  showAddExerciseCat() {
    let html = `<div class="form-group">
      <label>类别名称 <span class="text-sm text-muted">(如"腿部训练")</span></label>
      <input class="form-input" id="new-cat-label" placeholder="输入类别名称" maxlength="10">
    </div>
    <div class="form-group">
      <label>图标 <span class="text-sm text-muted">(可选 emoji)</span></label>
      <input class="form-input" id="new-cat-icon" placeholder="如 🦵" maxlength="2" value="💪">
    </div>`;
    UI.openModal('添加自定义训练类别', html, (modalEl) => {
      const footer = modalEl.querySelector('.modal-footer');
      if (footer) {
        footer.innerHTML = `<button class="btn btn-outline" onclick="UI.closeModal()">取消</button>
          <button class="btn btn-primary" id="btn-add-cat">添加</button>`;
      }
      const btn = modalEl.querySelector('#btn-add-cat');
      if (btn) {
        btn.addEventListener('click', () => {
          const label = (modalEl.querySelector('#new-cat-label')?.value || '').trim();
          const icon = (modalEl.querySelector('#new-cat-icon')?.value || '💪').trim();
          if (!label) { UI.toast('⚠️ 请输入类别名称'); return; }
          Store.addCustomExerciseCategory(label, icon);
          UI.closeModal();
          UI.toast(`✅ 已添加「${label}」`);
          App.rerender();
        });
      }
    }, true);
  },

  removeExerciseCat(catId) {
    if (!confirm('确定删除该自定义类别？已有视频不会被删除。')) return;
    Store.removeCustomExerciseCategory(catId);
    UI.toast('🗑️ 已删除');
    App.rerender();
  },

  overview(navItem) {
    let html = this.header(`${navItem.icon} ${navItem.label}`, '请选择一个子模块');
    if (navItem.children) {
      html += '<div class="card-grid card-grid-2">';
      navItem.children.forEach(child => {
        html += `<div class="card card-dot-border" style="cursor:pointer;" onclick="App.navigate('${child.id}')">
          <div class="kc-title" style="font-size:15px;">${child.icon} ${UI.esc(child.label)}</div>
        </div>`;
      });
      html += '</div>';
    } else {
      html += UI.emptyState('📭', '该模块暂无内容');
    }
    return html;
  },

  // ==========================================
  // 路由分发
  // ==========================================
  render(route) {
    // 查找导航项
    const findNavItem = (id) => {
      for (const item of Store.nav) {
        if (item.id === id) return item;
        if (item.children) {
          for (const child of item.children) {
            if (child.id === id) return child;
          }
        }
      }
      return null;
    };

    // 动态路由：自定义运动类别
    if (route && route.startsWith('exercise-custom-')) {
      const customCats = Store.getCustomExerciseCategories();
      const cat = customCats.find(c => c.id === route);
      if (cat) return this.exerciseVideos(cat.label, cat.icon);
      return this.dashboard();
    }

    // 根据路由分发
    switch (route) {
      case 'dashboard': return this.dashboard();
      case 'english': return this.overview(findNavItem('english'));
      case 'english-listening': return this.englishTable('听力');
      case 'english-reading': return this.englishTable('阅读');
      case 'english-speaking': return this.englishTable('口语');
      case 'english-sites': return this.englishSites();
      case 'media': return this.mediaKanban();
      case 'media-movie': return this.mediaTable('电影');
      case 'media-tv': return this.mediaTable('剧集');
      case 'media-music': return this.mediaTable('音乐专辑');
      case 'media-book': return this.mediaTable('阅读');
      case 'reading-notes': return this.readingNotes();
      case 'todo': return this.todo();
      case 'inspiration': return this.inspirationKanban();
      case 'inspiration-vfx': return this.inspirationTable('特效制作灵感');
      case 'inspiration-edit': return this.inspirationTable('剪辑灵感');
      case 'body': return this.overview(findNavItem('body'));
      case 'body-weight': return this.bodyWeight();
      case 'body-period': return this.bodyPeriod();
      case 'body-pain': return this.bodyPain();
      case 'quit-smoking': return this.quitSmoking();
      case 'exercise': {
        // 运动概览页 — 合并自定义类别
        const exItem = findNavItem('exercise');
        const exChildren = Store.getExerciseNavChildren();
        let html = this.header(`${exItem.icon} ${exItem.label}`, '请选择一个训练类别');

        // 子模块卡片（含自定义类别）
        html += '<div class="card-grid card-grid-2">';
        exChildren.forEach(child => {
          const isCustom = child.id.startsWith('exercise-custom-');
          html += `<div class="card card-dot-border" style="cursor:pointer;position:relative;" onclick="App.navigate('${child.id}')">
            <div class="kc-title" style="font-size:15px;">${child.icon} ${UI.esc(child.label)}</div>
          </div>`;
        });
        html += '</div>';

        // 管理自定义类别
        html += `<div class="card mt-4">
          <div class="card-title">⚙️ 管理自定义类别</div>
          <p class="text-sm text-muted mb-2">添加你自己的训练类别（如腿部、肩部等），删除后已有视频不受影响。</p>`;
        const customCats = Store.getCustomExerciseCategories();
        if (customCats.length === 0) {
          html += '<p class="text-sm text-muted">暂无自定义类别</p>';
        } else {
          html += '<div class="flex gap-2 flex-wrap mb-3">';
          customCats.forEach(c => {
            html += `<span class="tag" style="cursor:default;">${c.icon || '💪'} ${UI.esc(c.label)}
              <button class="btn btn-danger btn-sm" style="margin-left:6px;padding:0 6px;font-size:10px;" onclick="event.stopPropagation();Pages.removeExerciseCat('${c.id}')">✕</button>
            </span>`;
          });
          html += '</div>';
        }
        html += `<button class="btn btn-primary btn-sm" onclick="Pages.showAddExerciseCat()">+ 添加自定义类别</button>`;
        html += '</div>';
        return html;
      }
      case 'exercise-fat': return this.exerciseVideos('减脂塑型');
      case 'exercise-back': return this.exerciseVideos('背部');
      case 'exercise-waist': return this.exerciseVideos('腰部');
      case 'exercise-skincare': return this.exerciseSkincare();
      case 'exercise-blackhead': return this.exerciseBlackhead();
      case 'star': return this.overview(findNavItem('star'));
      case 'star-anpu': return this.starConcerts('安溥');
      case 'star-mao': return this.starConcerts('毛不易');
      case 'star-other': return this.starOther();
      case 'wishlist': return this.wishlist();
      case 'accounting': return this.overview(findNavItem('accounting'));
      case 'accounting-today': return this.accountingToday();
      case 'accounting-month': return this.accountingMonth();
      case 'accounting-debt': return this.accountingDebt();
      case 'accounting-assets': return this.assetsPage();
      case 'daily-checkin': return this.dailyCheckin();
      case 'weekly-review': return this.weeklyReview();
      case 'diary': return this.diary();
      case 'praise': return this.praise();
      case 'handcraft': return this.handcraftKanban();
      case 'handcraft-crochet': return this.handcraftTable('钩织');
      case 'handcraft-sewing': return this.handcraftTable('缝纫');
      case 'treasure-sites': return this.treasureSites();
      case 'money-tips': return this.moneyTips();
      case 'settings': return this.settings();
      default: return this.dashboard();
    }
  },

  // ---------- 设置与备份页面 ----------
  settings() {
    const schemas = Store.schemas;
    const dbStats = Object.keys(schemas).map(db => {
      const count = Store.getAll(db).length;
      return { label: schemas[db].label, count };
    });
    const totalRecords = dbStats.reduce((s, d) => s + d.count, 0);
    const lastBackup = localStorage.getItem('wb_last_backup') || '从未备份';

    let html = this.header('⚙️ 设置与备份', '数据存储说明、备份与恢复');

    // ── 数据存储说明 ──
    html += `<div class="card" style="border-left:4px solid var(--warn);">
      <h4>📦 数据存储说明</h4>
      <p class="text-sm" style="line-height:1.8;margin-bottom:8px;">
        你的所有数据存储在浏览器的 <b>localStorage</b> 中，键名前缀 <code>wb_</code>。
        这意味着数据保存在本地浏览器里，<b>不会上传到任何服务器</b>。
      </p>
      <div style="background:var(--bg-secondary);border-radius:8px;padding:10px;margin:8px 0;">
        <p class="text-sm" style="margin:0;color:var(--warn);font-weight:bold;">⚠️ 为什么改代码后数据会丢失？</p>
        <p class="text-sm" style="margin:6px 0 0;line-height:1.7;">
          localStorage 绑定的是<strong>浏览器源（origin）</strong>。如果你通过本地文件预览，
          当工作目录路径发生变化时（比如每次新开会话），浏览器会认为是不同的源，
          之前的数据就找不到了。<br>
          <strong>解决方法：</strong>每次改代码前，先点「导出备份」保存数据文件；
          改完后如果数据丢了，点「导入恢复」把数据导回来。
        </p>
      </div>
    </div>`;

    // ── 修改密码 ──
    html += `<div class="card">
      <h4>🔑 修改登录密码</h4>
      <p class="text-sm text-muted mb-2">输入新密码后点击更新（密码仅做 SHA-256 哈希存储，不会明文保存）</p>
      <div class="settings-pwd-row">
        <input type="password" id="pwd-new" placeholder="输入新密码" maxlength="32" autocomplete="off">
        <input type="password" id="pwd-repeat" placeholder="再次输入" maxlength="32" autocomplete="off">
        <button id="pwd-update-btn" onclick="App.changePassword()">更新密码</button>
      </div>
      <p id="pwd-msg" class="text-sm mt-2" style="min-height:20px;"></p>
    </div>`;

    // ── 数据统计 ──
    html += `<div class="card">
      <h4>📊 数据统计</h4>
      <p class="text-sm text-muted mb-2">共 ${totalRecords} 条记录，分布在 ${dbStats.length} 个数据库中</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;">
        ${dbStats.map(d => `
          <div style="background:var(--bg-secondary);border-radius:8px;padding:8px;text-align:center;">
            <div class="text-sm font-bold">${d.count}</div>
            <div class="text-sm text-muted">${d.label}</div>
          </div>
        `).join('')}
      </div>
      <p class="text-sm text-muted mt-2">上次备份时间：${lastBackup}</p>
    </div>`;

    // ── 备份与恢复 ──
    html += `<div class="card">
      <h4>💾 备份与恢复</h4>
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin:12px 0;">
        <button class="btn btn-primary" onclick="App.exportData()">📥 导出备份</button>
        <label class="btn btn-outline" style="cursor:pointer;">
          📤 导入恢复
          <input type="file" accept=".json" style="display:none;" onchange="App.importData(this.files[0])">
        </label>
      </div>
      <p class="text-sm text-muted" style="line-height:1.7;">
        <b>导出备份</b>：将所有数据下载为一个 JSON 文件，请妥善保存。<br>
        <b>导入恢复</b>：选择之前导出的 JSON 文件，恢复所有数据。<br>
        <span style="color:var(--warn);">注意：导入会覆盖当前同名的数据，不会清除其他数据。</span>
      </p>
    </div>`;

    // ── 清理示例数据 ──
    html += `<div class="card" style="border-left:4px solid var(--warn);">
      <h4>🧹 清除示例数据</h4>
      <p class="text-sm text-muted mb-2">早期版本会自动写入一些示例 Todo / 愿望清单 / 运动视频。若你已投入使用，可一键清除这些假数据（仅移除应用内置示例，不会误删你的真实记录），并同步到云端。</p>
      <button class="btn btn-outline" style="color:var(--warn);border-color:var(--warn);" onclick="if(confirm('确定清除示例数据吗？仅移除应用内置的示例条目。')) App.clearSampleData()">🧹 清除示例数据</button>
    </div>`;

    // ── 危险操作 ──
    html += `<div class="card" style="border-left:4px solid var(--danger);">
      <h4>🗑️ 清空数据</h4>
      <p class="text-sm text-muted mb-2">清空所有数据并重新初始化（慎用！建议先导出备份）</p>
      <button class="btn btn-outline" style="color:var(--danger);border-color:var(--danger);" onclick="if(confirm('确定要清空所有数据吗？此操作不可恢复！建议先导出备份。')) App.resetAllData()">🗑️ 清空并重置</button>
    </div>`;

    return html;
  },
};
