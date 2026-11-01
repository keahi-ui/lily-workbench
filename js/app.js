/* ============================================
   主应用 - app.js
   路由、导航、事件处理、提醒、PWA 注册
   ============================================ */

const App = {
  // 默认密码哈希（lily2024）
  DEFAULT_PASSWORD_HASH: 'c3c762d8dfb89368c64898c723d338059806dc98d1538b0a9c1d812c2aa0575e',
  // 获取当前有效密码哈希（优先读取用户修改过的）
  _passwordHash: null,
  get PASSWORD_HASH() {
    if (this._passwordHash) return this._passwordHash;
    const saved = localStorage.getItem('wb_password_hash');
    if (saved) { this._passwordHash = saved; return saved; }
    return this.DEFAULT_PASSWORD_HASH;
  },
  set PASSWORD_HASH(val) {
    this._passwordHash = val;
    localStorage.setItem('wb_password_hash', val);
  },

  currentRoute: 'dashboard',
  expandedNav: new Set(),
  todoFilter: 'today',
  todoDateFilter: '',
  praiseKeyword: '',
  praiseDateFilter: '',
  mediaFilter: '全部',
  concertFilter: '全部',
  starArtistFilter: '全部',
  calendarYear: new Date().getFullYear(),
  calendarMonth: new Date().getMonth(),
  reminderShown: {},

  // ---------- 初始化 ----------
  init() {
    // ?reset 参数：清除自定义密码，恢复默认 lily2024
    if (location.search.includes('reset')) {
      localStorage.removeItem('wb_password_hash');
      this._passwordHash = null;
      sessionStorage.removeItem('wb_authenticated');
      // 去掉 ?reset 参数后重新加载
      const cleanUrl = location.pathname + location.search.replace(/[?&]reset(=[^&]*)?/g, '').replace(/^\?&/, '?');
      history.replaceState(null, '', cleanUrl || location.pathname);
    }

    // 登录门禁：未认证不加载内容
    if (!this.checkAuth()) {
      this.showLogin();
      return;
    }

    // 初始化数据
    Store.init();

    // 页面关闭/切后台时强制推送数据到云端
    window.addEventListener('beforeunload', () => Store._syncAllTablesNow());
    window.addEventListener('pagehide', () => Store._syncAllTablesNow());
    window.addEventListener('visibilitychange', () => {
      if (document.hidden) Store._syncAllTablesNow();
    });

    // 注册 Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.log('SW 注册失败:', err);
      });
    }

    // 渲染侧边栏
    this.renderSidebar();

    // 路由初始化
    const hash = location.hash.slice(1) || 'dashboard';
    this.currentRoute = hash;
    this.expandParent(hash);
    this.render();

    // 绑定事件
    this.bindEvents();

    // 自动清理过期演出
    this.cleanExpiredConcerts();

    // 检查提醒
    setTimeout(() => this.checkReminders(), 1000);
    setInterval(() => this.checkReminders(), 60000);
  },

  // ---------- 手动同步（云端互相同步） ----------
  syncNow() {
    if (typeof Store === 'undefined' || !Store._cloudReady || !Store._cloudReady()) {
      UI.toast('⚠️ 未连接云端，请检查网络或刷新页面');
      return;
    }
    // 按钮进入「同步中」状态，避免重复点击
    const btn = document.getElementById('sync-btn');
    if (btn) { btn.classList.add('syncing'); btn.disabled = true; btn.textContent = '🔄 同步中…'; }
    Store.syncNow().then(result => {
      console.log('[同步结果]', result);
      // 同步完成后 rerender 已重建侧边栏（含状态条），此处仅恢复按钮
      if (btn) { btn.classList.remove('syncing'); btn.disabled = false; btn.textContent = '🔄 同步'; }
    }).catch(err => {
      if (btn) { btn.classList.remove('syncing'); btn.disabled = false; btn.textContent = '🔄 同步'; }
      UI.toast('❌ 同步异常：' + (err && err.message ? err.message : err));
    });
  },

  // 渲染侧边栏「上次同步」状态条
  _syncStatusHTML() {
    try {
      const raw = localStorage.getItem('wb_last_sync');
      if (!raw) return '<div class="sync-status muted">上次同步：尚未同步</div>';
      const s = JSON.parse(raw);
      const t = new Date(s.ts);
      const hh = String(t.getHours()).padStart(2, '0');
      const mm = String(t.getMinutes()).padStart(2, '0');
      const detail = `拉取 ${s.pulled} 条 · 推送 ${s.pushed} 条`;
      if (s.ok) {
        return `<div class="sync-status ok" title="${UI && UI.esc ? UI.esc(detail) : detail}">✅ ${hh}:${mm} 已同步</div>`;
      }
      const errText = s.error === 'cloud_not_ready' ? '未连接云端' : '失败';
      const errDetail = s.error ? (UI && UI.esc ? UI.esc(String(s.error)) : String(s.error)) : '';
      return `<div class="sync-status fail" title="${errDetail}">⚠️ ${hh}:${mm} 同步${errText}</div>`;
    } catch (e) {
      return '<div class="sync-status muted">上次同步：—</div>';
    }
  },

  // ---------- 渲染侧边栏 ----------
  renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    let html = `<div class="sidebar-header">
      <h1>🌟 lilyの工作台</h1>
      <div class="subtitle">Personal Dashboard</div>
      <button class="sync-btn" id="sync-btn" onclick="App.syncNow()" title="立即同步到云端 / 从云端拉取">🔄 同步</button>
      ${this._syncStatusHTML()}
    </div>`;

    // 构建动态导航（运动与护理节点合并自定义类别）
    const dynNav = Store.nav.map(item => {
      if (item.id === 'exercise') {
        return { ...item, children: Store.getExerciseNavChildren() };
      }
      return item;
    });

    dynNav.forEach(item => {
      const hasChildren = !!item.children;
      const isExpanded = this.expandedNav.has(item.id);
      const isActive = this.currentRoute === item.id;

      // 检查是否有子项激活
      let childActive = false;
      if (hasChildren) {
        childActive = item.children.some(c => c.id === this.currentRoute);
      }

      html += `<div class="nav-item ${isActive || childActive ? 'active' : ''} ${isExpanded ? 'expanded' : ''}">
        <span class="nav-label" onclick="App.navClick('${item.id}')">
          <span class="icon">${item.icon}</span>
          <span>${item.label}</span>
        </span>
        ${hasChildren ? `<span class="arrow" onclick="event.stopPropagation();App.toggleNavExpand('${item.id}')">▶</span>` : ''}
      </div>`;

      if (hasChildren) {
        html += `<div class="nav-sub ${isExpanded ? 'open' : ''}">`;
        item.children.forEach(child => {
          const childActive = this.currentRoute === child.id;
          html += `<div class="nav-sub-item ${childActive ? 'active' : ''}" 
            onclick="App.navigate('${child.id}')">
            <span class="icon">${child.icon}</span>
            <span>${child.label}</span>
          </div>`;
        });
        html += '</div>';
      }
    });

    sidebar.innerHTML = html;
  },

  // ---------- 导航点击（仅导航，不 toggle 展开） ----------
  navClick(routeId) {
    const navItem = Store.nav.find(n => n.id === routeId);
    if (navItem && navItem.children) {
      // 有子项：先确保展开，再导航到概览页
      this.expandedNav.add(routeId);
      this.currentRoute = routeId;
      location.hash = routeId;
      this.renderSidebar();
      this.render();
      document.getElementById('content').scrollTop = 0;
    } else {
      // 无子项：直接导航
      this.navigate(routeId);
    }
  },

  // ---------- 仅切换展开/折叠（不导航，不关闭侧边栏） ----------
  toggleNavExpand(routeId) {
    if (this.expandedNav.has(routeId)) {
      this.expandedNav.delete(routeId);
    } else {
      this.expandedNav.add(routeId);
    }
    this.renderSidebar();
    // 不导航、不关闭移动端侧边栏
  },

  // ---------- 展开父级 ----------
  expandParent(routeId) {
    for (const item of Store.nav) {
      if (item.children) {
        if (item.children.some(c => c.id === routeId) || item.id === routeId) {
          this.expandedNav.add(item.id);
        }
      }
    }
  },

  // ---------- 导航 ----------
  navigate(route) {
    this.currentRoute = route;
    this.expandParent(route);
    location.hash = route;
    this.renderSidebar();
    this.render();
    // 关闭移动端侧边栏
    this.closeSidebar();
    // 滚动到顶部
    document.getElementById('content').scrollTop = 0;
  },

  // ---------- 重新渲染当前页 ----------
  rerender() {
    this.render();
    this.renderSidebar();
  },

  // ---------- 登录门禁 ----------
  checkAuth() {
    return sessionStorage.getItem('wb_authenticated') === 'true';
  },

  async hashPassword(pwd) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  showLogin() {
    document.getElementById('app').style.display = 'none';
    const overlay = document.getElementById('login-overlay');
    overlay.style.display = 'flex';

    const doLogin = async () => {
      const pwd = document.getElementById('login-pwd').value.trim();
      const errEl = document.getElementById('login-error');
      if (!pwd) { errEl.textContent = '请输入密码'; return; }

      const hash = await this.hashPassword(pwd);
      if (hash === this.PASSWORD_HASH) {
        sessionStorage.setItem('wb_authenticated', 'true');
        overlay.style.display = 'none';
        document.getElementById('app').style.display = '';
        this.init();
        return;
      }
      errEl.textContent = '密码错误，请重试';
      document.getElementById('login-pwd').value = '';
      document.getElementById('login-pwd').focus();
    };

    document.getElementById('login-btn').onclick = doLogin;
    document.getElementById('login-pwd').onkeydown = (e) => {
      if (e.key === 'Enter') doLogin();
    };

    // 自动聚焦
    setTimeout(() => document.getElementById('login-pwd').focus(), 200);

    // 重置密码链接
    document.getElementById('login-reset').onclick = () => {
      if (confirm('确定重置为默认密码 "lily2024" 吗？')) {
        localStorage.removeItem('wb_password_hash');
        this._passwordHash = null;
        document.getElementById('login-error').textContent = '已重置，请输入 lily2024';
        document.getElementById('login-pwd').value = '';
        document.getElementById('login-pwd').focus();
      }
    };
  },

  logout() {
    sessionStorage.removeItem('wb_authenticated');
    location.reload();
  },

  // ---------- 数据导出 ----------
  exportData() {
    const backup = { _exportTime: new Date().toISOString(), _version: '1.0' };
    for (const dbName of Object.keys(Store.schemas)) {
      backup[dbName] = Store.getAll(dbName);
    }
    // 额外保存 localStorage 中的设置项（非数据库键）
    const dbKeys = new Set(Object.keys(Store.schemas).map(db => 'wb_' + db));
    const settings = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('wb_') && !dbKeys.has(key) && key !== 'wb__initialized') {
        settings[key] = localStorage.getItem(key);
      }
    }
    backup._settings = settings;

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `lily-backup-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);

    localStorage.setItem('wb_last_backup', new Date().toLocaleString('zh-CN'));
    UI.toast('✅ 备份已导出');
  },

  // ---------- 数据导入 ----------
  async importData(file) {
    if (!file) return;
    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      let restored = 0;
      for (const dbName of Object.keys(Store.schemas)) {
        if (Array.isArray(backup[dbName])) {
          // 合并导入：只添加本地不存在的记录（按 id 去重）
          const existing = Store.getAll(dbName);
          const existingIds = new Set(existing.map(r => r.id));
          let added = 0;
          for (const record of backup[dbName]) {
            if (record.id && !existingIds.has(record.id)) {
              existing.push(record);
              added++;
            }
          }
          if (added > 0) {
            Store._save(dbName, existing);
            restored += added;
          }
        }
      }

      // 恢复设置项
      if (backup._settings) {
        for (const [key, value] of Object.entries(backup._settings)) {
          if (!localStorage.getItem(key)) {
            localStorage.setItem(key, value);
          }
        }
      }

      UI.toast(`✅ 导入完成，恢复 ${restored} 条记录`);
      this.rerender();
    } catch (e) {
      UI.toast('❌ 导入失败：' + e.message);
    }
  },

  // ---------- 清空并重置 ----------
  resetAllData() {
    // 清空所有 wb_ 前缀的数据
    const keys = [];
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('wb_')) {
        keys.push(key);
      }
    }
    keys.forEach(k => localStorage.removeItem(k));
    localStorage.removeItem('wb__initialized');
    Store.init();
    UI.toast('✅ 数据已清空并重置');
    this.rerender();
  },

  // ---------- 修改密码 ----------
  async changePassword() {
    const newPwd = document.getElementById('pwd-new').value.trim();
    const repeat = document.getElementById('pwd-repeat').value.trim();
    const msgEl = document.getElementById('pwd-msg');

    if (!newPwd || newPwd.length < 4) {
      msgEl.style.color = 'var(--danger)';
      msgEl.textContent = '密码至少 4 位';
      return;
    }
    if (newPwd !== repeat) {
      msgEl.style.color = 'var(--danger)';
      msgEl.textContent = '两次输入的密码不一致';
      return;
    }

    const hash = await this.hashPassword(newPwd);
    this.PASSWORD_HASH = hash;
    msgEl.style.color = 'var(--info)';
    msgEl.textContent = '密码已更新，下次访问时生效';

    document.getElementById('pwd-new').value = '';
    document.getElementById('pwd-repeat').value = '';
  },

  // ---------- 渲染内容区 ----------
  render() {
    const content = document.getElementById('content');
    try {
      content.innerHTML = Pages.render(this.currentRoute);
    } catch (e) {
      console.error('渲染错误:', e);
      content.innerHTML = `<div class="empty-state"><div class="emoji">😵</div><p>页面加载出错：${e.message}</p></div>`;
    }
  },

  // ---------- 绑定全局事件 ----------
  bindEvents() {
    // 汉堡菜单
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (menuToggle) {
      menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('show');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => this.closeSidebar());
    }

    // 监听 hashchange
    window.addEventListener('hashchange', () => {
      const hash = location.hash.slice(1) || 'dashboard';
      if (hash !== this.currentRoute) {
        this.currentRoute = hash;
        this.expandParent(hash);
        this.renderSidebar();
        this.render();
      }
    });

    // ESC 关闭弹窗
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') UI.closeModal();
    });
  },

  // ---------- 关闭移动端侧边栏 ----------
  closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('show');
  },

  // ==========================================
  // 事件处理函数
  // ==========================================

  // ---------- 打卡勾选切换 ----------
  toggleCheckin(recordId, fieldName) {
    const record = Store.getById('daily_checkin', recordId);
    if (!record) return;
    const newValue = !record[fieldName];
    Store.update('daily_checkin', recordId, { [fieldName]: newValue });

    // 更新视觉
    try {
      const evt = window.event;
      if (evt && evt.target) {
        const cbx = evt.target.classList.contains('cbx') ? evt.target : evt.target.closest('.cbx');
        if (cbx) cbx.classList.toggle('checked', newValue);
      }
    } catch(e) {}
  },

  // ---------- 保存打卡字段 ----------
  saveCheckinField(recordId, fieldName, value) {
    Store.update('daily_checkin', recordId, { [fieldName]: value });
  },

  // ---------- 日历总览中直接勾选打卡 ----------
  // 与今日仪表盘共享同一条 daily_checkin 记录，勾选即同步
  toggleCalendarCheckin(dateStr, fieldName, el) {
    const record = Store.query('daily_checkin', r => r.date === dateStr)[0];
    if (!record) {
      UI.toast('⚠️ 该日期暂无打卡记录');
      return;
    }
    const newVal = !record[fieldName];
    Store.update('daily_checkin', record.id, { [fieldName]: newVal });
    if (el) el.classList.toggle('checked', newVal);
    // 同步刷新底层页面（仪表盘 / 7天概览在弹窗关闭后可见）
    this.rerender();
  },

  // ---------- Todo 切换完成 ----------
  toggleTodo(todoId) {
    const todo = Store.getById('todo_list', todoId);
    if (!todo) return;
    const newValue = !todo.completed;
    Store.update('todo_list', todoId, { completed: newValue });
    this.rerender();
  },

  // ---------- 删除 Todo ----------
  deleteTodo(todoId) {
    UI.confirmDelete('todo_list', todoId);
  },

  // ---------- 设置 Todo 筛选 ----------
  setTodoFilter(filter) {
    this.todoFilter = filter;
    this.rerender();
  },

  // ---------- 按日期筛选 Todo ----------
  setTodoDate(dateStr) {
    this.todoDateFilter = dateStr || '';
    this.todoFilter = dateStr ? 'date' : 'all';
    this.rerender();
  },

  // ---------- 夸夸收集筛选 ----------
  setPraiseKeyword(kw) {
    this.praiseKeyword = kw || '';
    this.rerender();
  },
  setPraiseDate(dateStr) {
    this.praiseDateFilter = dateStr || '';
    this.rerender();
  },

  // ---------- 保存今日夸夸（写入独立 praise 表）----------
  saveDayPraise(value) {
    const today = Store.todayStr();
    const lines = (value || '').split('\n').map(s => s.trim()).filter(Boolean);
    Store.saveDayPraise(today, lines);
    UI.toast('🌸 夸夸已保存');
  },

  // ---------- 设置影视音筛选 ----------
  setMediaFilter(filter) {
    this.mediaFilter = filter;
    this.rerender();
  },

  // ---------- 日历月份切换 ----------
  changeCalendarMonth(delta) {
    this.calendarMonth += delta;
    if (this.calendarMonth > 11) {
      this.calendarMonth = 0;
      this.calendarYear++;
    } else if (this.calendarMonth < 0) {
      this.calendarMonth = 11;
      this.calendarYear--;
    }
    this.rerender();
  },

  // ---------- 经期日历日期点击 ----------
  onPeriodDayClick(dateStr) {
    const existing = Store.query('body_records', r => r.date === dateStr)[0];
    const record = existing || {
      date: dateStr, period_status: '', period_flow: '', period_color: '',
      period_pain: '', period_symptoms: [], temperature: null,
      pain_level: 0, pain_location: '', sex: '', medication: '', notes: ''
    };
    const isToday = dateStr === Store.todayStr();

    let html = `<p style="margin-bottom:12px;font-size:15px;font-weight:600;">📅 ${dateStr} ${isToday ? '<span class="tag tag-mint">今天</span>' : ''}</p>`;

    // 经期状态选择
    html += '<div class="form-group"><label>🌙 经期状态</label>';
    html += '<div class="flex gap-2 flex-wrap">';
    ['来了', '经期中', '排卵期', '黄体期', '结束了', '无'].forEach(s => {
      const active = record.period_status === s ? 'active' : '';
      html += `<span class="filter-chip chip-sm ${active}" data-ps="${UI.esc(s)}" onclick="App._chipToggle(this)">${s}</span>`;
    });
    html += '</div></div>';

    // 经血量
    html += '<div class="form-group"><label>🩸 经血量</label>';
    html += '<div class="flex gap-2 flex-wrap">';
    ['少', '中', '多'].forEach(s => {
      const active = record.period_flow === s ? 'active' : '';
      html += `<span class="filter-chip chip-sm ${active}" data-pf="${UI.esc(s)}" onclick="App._chipToggle(this)">${s}</span>`;
    });
    html += '</div></div>';

    // 经血颜色
    html += '<div class="form-group"><label>🎨 颜色</label>';
    html += '<div class="flex gap-2 flex-wrap">';
    ['鲜红', '暗红', '褐色', '粉色'].forEach(s => {
      const active = record.period_color === s ? 'active' : '';
      html += `<span class="filter-chip chip-sm ${active}" data-pc="${UI.esc(s)}" onclick="App._chipToggle(this)">${s}</span>`;
    });
    html += '</div></div>';

    // 痛经程度
    html += '<div class="form-group"><label>😣 痛经程度</label>';
    html += '<div class="flex gap-2 flex-wrap">';
    ['无', '轻度', '中度', '严重'].forEach(s => {
      const active = record.period_pain === s ? 'active' : '';
      html += `<span class="filter-chip chip-sm ${active}" data-pp="${UI.esc(s)}" onclick="App._chipToggle(this)">${s}</span>`;
    });
    html += '</div></div>';

    // 伴随症状（多选）
    const symptoms = ['腰酸', '头痛', '腹胀', '恶心', '疲劳', '情绪波动', '胸胀', '无'];
    html += '<div class="form-group"><label>🤒 伴随症状（多选）</label>';
    html += '<div class="flex gap-2 flex-wrap">';
    symptoms.forEach(s => {
      const selected = Array.isArray(record.period_symptoms) && record.period_symptoms.includes(s);
      html += `<span class="filter-chip chip-sm ${selected ? 'active' : ''}" data-symp="${UI.esc(s)}" onclick="App._chipToggleMulti(this)">${s}</span>`;
    });
    html += '</div></div>';

    // 体温
    html += `<div class="form-group"><label>🌡️ 体温(°C)</label>
      <input type="number" class="form-input" id="pd-temp" value="${record.temperature || ''}" placeholder="如 36.5" step="0.1">
    </div>`;

    // 性生活
    html += '<div class="form-group"><label>💕 性生活</label>';
    html += '<div class="flex gap-2 flex-wrap">';
    ['有', '无'].forEach(s => {
      const active = record.sex === s ? 'active' : '';
      html += `<span class="filter-chip chip-sm ${active}" data-sx="${UI.esc(s)}" onclick="App._chipToggle(this)">${s}</span>`;
    });
    html += '</div></div>';

    // 用药
    html += `<div class="form-group"><label>💊 用药</label>
      <input type="text" class="form-input" id="pd-med" value="${UI.esc(record.medication || '')}" placeholder="如布洛芬">
    </div>`;

    // 备注
    html += `<div class="form-group"><label>📝 备注</label>
      <textarea class="form-textarea" id="pd-notes" rows="3" placeholder="记录今天的感受...">${UI.esc(record.notes === '(自动推算)' ? '' : (record.notes || ''))}</textarea>
    </div>`;

    UI.openModal(`${dateStr} · 经期记录`, html, (modalEl) => {
      const footer = modalEl.querySelector('.modal-footer');
      if (footer) {
        footer.innerHTML = `
          <button class="btn btn-outline" onclick="UI.closeModal()">取消</button>
          <button class="btn btn-danger btn-sm" id="pd-delete" style="${existing ? '' : 'display:none'}">删除</button>
          <button class="btn btn-primary" id="pd-save">💾 保存</button>
        `;
      }

      // 保存
      modalEl.querySelector('#pd-save')?.addEventListener('click', () => {
        const data = {
          period_status: modalEl.dataset.ps || '',
          period_flow: modalEl.dataset.pf || '',
          period_color: modalEl.dataset.pc || '',
          period_pain: modalEl.dataset.pp || '',
          period_symptoms: App._collectChips(modalEl, 'symp'),
          temperature: modalEl.querySelector('#pd-temp')?.value ? parseFloat(modalEl.querySelector('#pd-temp').value) : null,
          sex: modalEl.dataset.sx || '',
          medication: modalEl.querySelector('#pd-med')?.value || '',
          notes: modalEl.querySelector('#pd-notes')?.value || '',
        };
        if (existing) {
          Store.update('body_records', existing.id, data);
        } else {
          Store.add('body_records', { ...data, date: dateStr, pain_level: 0, pain_location: '', weight: null });
        }
        UI.toast('✅ 已保存');
        if (data.period_status === '来了') {
          App.autoCalcPeriodPhases(dateStr);
          UI.toast('🔮 已自动推算后续阶段');
        }
        UI.closeModal();
        App.rerender();
      });

      // 删除
      modalEl.querySelector('#pd-delete')?.addEventListener('click', () => {
        Store.delete('body_records', existing.id);
        UI.toast('🗑️ 已删除');
        UI.closeModal();
        App.rerender();
      });
    }, true);
  },

  // chip 单选切换
  _chipToggle(el) {
    const modal = el.closest('.modal');
    if (!modal) return;
    const group = el.dataset.ps !== undefined ? 'ps' :
                  el.dataset.pf !== undefined ? 'pf' :
                  el.dataset.pc !== undefined ? 'pc' :
                  el.dataset.pp !== undefined ? 'pp' :
                  el.dataset.sx !== undefined ? 'sx' : null;
    if (!group) return;
    const prev = modal.querySelector(`[data-${group}].active`);
    if (prev && prev !== el) prev.classList.remove('active');
    if (el.classList.contains('active')) {
      el.classList.remove('active');
      delete modal.dataset[group];
    } else {
      el.classList.add('active');
      modal.dataset[group] = el.dataset[group] === 'ps' ? el.dataset.ps :
                             group === 'pf' ? el.dataset.pf :
                             group === 'pc' ? el.dataset.pc :
                             group === 'pp' ? el.dataset.pp :
                             group === 'sx' ? el.dataset.sx : el.dataset[group];
    }
  },

  // chip 多选切换
  _chipToggleMulti(el) {
    el.classList.toggle('active');
  },

  // 收集多选 chip 值
  _collectChips(modalEl, group) {
    return Array.from(modalEl.querySelectorAll(`[data-${group}].active`)).map(e => e.dataset[group]);
  },

  // ---------- 表单 chip 切换（经期今日记录用）----------
  _toggleFormChip(el, group) {
    if (group === 'symp') {
      // 多选：直接切换
      el.classList.toggle('active');
    } else {
      // 单选：取消同组其他，切换自己
      const siblings = document.querySelectorAll(`[data-f-${group}]`);
      siblings.forEach(s => { if (s !== el) s.classList.remove('active'); });
      el.classList.toggle('active');
    }
  },

  // ---------- 双击日历标记经期开始 ----------
  _markPeriodStart(dateStr) {
    if (!confirm(`确定将 ${dateStr} 标记为经期开始日吗？这将重新计算周期。`)) return;
    // 清除该日期之后的自动推算
    const existing = Store.query('body_records', r => r.date === dateStr)[0];
    if (existing) {
      Store.update('body_records', existing.id, { period_status: '来了' });
    } else {
      Store.add('body_records', { date: dateStr, period_status: '来了', pain_level: 0, pain_location: '', weight: null, notes: '' });
    }
    this.autoCalcPeriodPhases(dateStr);
    UI.toast('🔮 已重新标记并推算');
    this.rerender();
  },

  // ---------- 保存今日经期快速记录 ----------
  savePeriodToday() {
    const today = Store.todayStr();
    const existing = Store.query('body_records', r => r.date === today)[0];

    function getChip(prefix) {
      const el = document.querySelector(`[data-f-${prefix}].active`);
      return el ? el.getAttribute(`data-f-${prefix}`) : '';
    }
    function getChips(prefix) {
      return Array.from(document.querySelectorAll(`[data-f-${prefix}].active`))
        .map(e => e.getAttribute(`data-f-${prefix}`));
    }

    const data = {
      period_status: getChip('ps'),
      period_flow: getChip('pf'),
      period_color: getChip('pc'),
      period_pain: getChip('pp'),
      period_symptoms: getChips('symp'),
      temperature: document.getElementById('f-temp')?.value ? parseFloat(document.getElementById('f-temp').value) : null,
      weight: document.getElementById('f-weight')?.value ? parseFloat(document.getElementById('f-weight').value) : null,
      sex: getChip('sx'),
      medication: document.getElementById('f-med')?.value || '',
      notes: document.getElementById('f-notes')?.value || '',
    };

    if (existing) {
      Store.update('body_records', existing.id, data);
    } else {
      Store.add('body_records', { ...data, date: today, pain_level: 0, pain_location: '' });
    }

    UI.toast('✅ 今日记录已保存');
    if (data.period_status === '来了') {
      this.autoCalcPeriodPhases(today);
      UI.toast('🔮 已自动推算后续阶段');
    }

    // 痛经关怀：中度/严重时自动添加夸夸和Todo建议
    if (data.period_pain === '中度' || data.period_pain === '严重') {
      const comforts = [
        '今天辛苦啦，多喝热水，抱抱自己 ❤️',
        '经期辛苦了，允许自己今天慢一点 🌸',
        '痛经不是你的错，你已经很棒了 💪',
        '红糖水、热水袋、一部好电影 — 你值得被好好照顾 🧣',
      ];
      const msg = comforts[Math.floor(Math.random() * comforts.length)];
      Store.add('praise', { date: today, content: msg, mood: '😢难过', from_who: '身体关怀', createdAt: new Date().toISOString() });
      // 检查是否已有红糖水任务
      const existingTask = Store.query('todo_list', r => r.deadline === today && r.task_name.includes('红糖水'));
      if (existingTask.length === 0) {
        Store.add('todo_list', {
          task_name: '🫖 喝红糖水/热敷',
          domain: '身体护理',
          deadline: today,
          priority: '高',
          completed: false,
          related_inspiration: '',
        });
        UI.toast('💕 已为你添加一条关怀任务');
      }
    }

    this.rerender();
  },

  // ---------- 自动推算经期各阶段 ----------
  autoCalcPeriodPhases(startDateStr) {
    const stats = Store.calcPeriodStats();
    const periodDuration = stats.avgDuration;
    const cycleLength = stats.avgCycle;

    const startDate = new Date(startDateStr);
    const endDate = new Date(startDateStr);
    endDate.setDate(endDate.getDate() + cycleLength - 1);

    const maxDate = Store.dateAdd(Store.todayStr(), 60);
    const actualEnd = endDate.toISOString().slice(0, 10) > maxDate ? maxDate : endDate.toISOString().slice(0, 10);

    // 清除该起始日之后已有的自动推算记录
    const allRecords = Store.query('body_records', r => r.date > startDateStr && r.notes === '(自动推算)');
    allRecords.forEach(r => Store.delete('body_records', r.id));

    // 经期中：第1天到第 periodDuration 天
    for (let d = 1; d <= periodDuration; d++) {
      const ds = Store.dateAdd(startDateStr, d);
      if (ds > actualEnd) break;
      const existing = Store.query('body_records', r => r.date === ds)[0];
      if (existing) {
        if (!existing.period_status || existing.period_status === '无') {
          Store.update('body_records', existing.id, { period_status: '经期中' });
        }
      } else {
        Store.add('body_records', { date: ds, period_status: '经期中', pain_level: 0, pain_location: '', weight: null, notes: '(自动推算)' });
      }
    }

    // 排卵期：下次经期前14天 ± 1天
    const ovDay = Math.floor((cycleLength - 14));
    for (let d = ovDay - 1; d <= ovDay + 1; d++) {
      if (d <= periodDuration) continue;
      const ds = Store.dateAdd(startDateStr, d);
      if (ds > actualEnd) break;
      const existing = Store.query('body_records', r => r.date === ds)[0];
      if (existing) {
        if (!existing.period_status || existing.period_status === '无') {
          Store.update('body_records', existing.id, { period_status: '排卵期' });
        }
      } else {
        Store.add('body_records', { date: ds, period_status: '排卵期', pain_level: 0, pain_location: '', weight: null, notes: '(自动推算)' });
      }
    }

    // 黄体期：排卵期后到下次经期前
    const lutealStart = ovDay + 2;
    for (let d = lutealStart; d < cycleLength; d++) {
      const ds = Store.dateAdd(startDateStr, d);
      if (ds > actualEnd) break;
      const existing = Store.query('body_records', r => r.date === ds)[0];
      if (existing) {
        if (!existing.period_status || existing.period_status === '无') {
          Store.update('body_records', existing.id, { period_status: '黄体期' });
        }
      } else {
        Store.add('body_records', { date: ds, period_status: '黄体期', pain_level: 0, pain_location: '', weight: null, notes: '(自动推算)' });
      }
    }
  },

  // ---------- 日历日期点击（通用）----------
  onCalendarDayClick(dateStr) {
    const record = Store.query('daily_checkin', r => r.date === dateStr)[0];
    const bodyRecords = Store.query('body_records', r => r.date === dateStr);
    const dayTodos = Store.query('todo_list', r => r.deadline === dateStr);

    let html = `<p style="margin-bottom:12px;">📅 <b>${dateStr}</b></p>`;

    if (record) {
      html += '<div class="card-title" style="margin-bottom:8px;">🎯 打卡详情</div>';
      const checkboxes = Store.schemas.daily_checkin.fields.filter(f => f.type === 'checkbox');
      const doneCount = checkboxes.filter(f => record[f.name]).length;
      html += `<p class="text-sm text-muted mb-2">完成 ${doneCount}/${checkboxes.length} 项</p>`;

      // 分组显示（黑头护理仅周三出现）
      const isWednesday = new Date(dateStr).getDay() === 3;
      const groups = [
        { title: '📚 英语', fields: ['hearing_done', 'reading_done', 'speaking_done'] },
        { title: '🏃 运动', fields: ['exercise_done', 'morning_meds', 'afternoon_meds'] },
        { title: '💧 喝水', fields: ['water_1', 'water_2', 'water_3', 'water_4', 'water_5', 'water_6', 'water_7', 'water_8'] },
        { title: '🐑 签到', fields: ['xiaomi_signin', 'netease_signin', 'browser_signin', 'wallet_signin'] },
        { title: '🧴 护肤', fields: isWednesday ? ['skincare_morning', 'skincare_evening', 'blackhead_done'] : ['skincare_morning', 'skincare_evening'] },
      ];
      groups.forEach(g => {
        html += `<div style="margin-bottom:8px;"><span class="text-sm font-bold">${g.title}</span>`;
        g.fields.forEach(fn => {
          const field = Store.schemas.daily_checkin.fields.find(f => f.name === fn);
          const isChecked = record[fn];
          html += `<div class="checkbox-row" style="padding:3px 0;cursor:pointer;">
            <span class="cbx ${isChecked ? 'checked' : ''}" style="width:16px;height:16px;" onclick="App.toggleCalendarCheckin('${dateStr}', '${fn}', this)"></span>
            <span class="text-sm ${isChecked ? '' : 'text-muted'}">${field ? field.label : fn}</span>
          </div>`;
        });
        html += '</div>';
      });

      html += `<p class="text-sm text-muted" style="margin-top:4px;">👆 点击上方项目可直接勾选/取消，已自动同步到今日仪表盘</p>`;

      const dayPraise = Store.getPraiseByDate(dateStr);
      if (dayPraise.length > 0) {
        html += `<div class="mt-3"><span class="text-sm font-bold">🌸 今日夸夸</span>`;
        dayPraise.forEach(p => {
          html += `<p class="text-sm" style="padding:6px 8px;background:var(--mint-lightest);border-radius:8px;margin-top:4px;">${p.mood ? UI.esc(p.mood) + ' ' : ''}${UI.esc(p.content)}</p>`;
        });
        html += '</div>';
      }
      if (record.mood) {
        html += `<div class="mt-2"><span class="text-sm font-bold">😊 今日心情</span><p class="text-sm">${record.mood}</p></div>`;
      }
      if (record.notes) {
        html += `<div class="mt-2"><span class="text-sm font-bold">📝 备注</span><p class="text-sm">${UI.esc(record.notes)}</p></div>`;
      }
    } else {
      html += '<p class="text-muted">该日期暂无打卡记录</p>';
    }

    // 当天待办完成情况
    if (dayTodos.length > 0) {
      html += '<div class="card-title" style="margin:12px 0 8px;">✅ 当日待办</div>';
      const completed = dayTodos.filter(t => t.completed);
      const active = dayTodos.filter(t => !t.completed);
      if (completed.length > 0) {
        html += `<p class="text-sm text-mint mb-2">✓ 完成 ${completed.length} 项:</p>`;
        completed.forEach(t => {
          html += `<div class="text-sm" style="text-decoration:line-through;opacity:0.6;margin-left:12px;">✓ ${UI.esc(t.task_name)}</div>`;
        });
      }
      if (active.length > 0) {
        html += `<p class="text-sm text-muted mb-2">待完成 ${active.length} 项:</p>`;
        active.forEach(t => {
          html += `<div class="text-sm" style="margin-left:12px;">○ ${UI.esc(t.task_name)}</div>`;
        });
      }
    }

    // 日记
    const diaryEntry = Store.query('diary', r => r.date === dateStr)[0];
    if (diaryEntry) {
      html += '<div class="card-title" style="margin:12px 0 8px;">📔 当日日记</div>';
      if (diaryEntry.title) html += `<p class="text-sm font-bold">${UI.esc(diaryEntry.title)}</p>`;
      if (diaryEntry.content) html += `<p class="text-sm">${UI.esc(diaryEntry.content.slice(0, 200))}</p>`;
      if (diaryEntry.mood) html += `<p class="text-sm">心情：${diaryEntry.mood}</p>`;
    }

    if (bodyRecords.length > 0) {
      html += '<div class="card-title" style="margin:12px 0 8px;">🧘 身体记录</div>';
      bodyRecords.forEach(r => {
        html += '<div class="text-sm" style="margin-bottom:4px;">';
        if (r.weight) html += `体重: ${r.weight}kg `;
        if (r.period_status) html += `经期: ${r.period_status} `;
        if (r.pain_location) html += `疼痛: ${r.pain_location}(${r.pain_level}/5)`;
        html += '</div>';
      });
    }

    UI.openModal(`${dateStr} 详情`, html);
  },

  // ---------- 保存周复盘字段 ----------
  saveWeeklyReview(recordId, fieldName, value) {
    Store.update('weekly_review', recordId, { [fieldName]: value });
  },

  // ---------- 标记演出已购票 ----------
  markTicketGot(recordId) {
    Store.update('star_tracking', recordId, { status: '已购票' });
    UI.toast('🎉 恭喜抢到票！');
    this.rerender();
  },

  // ---------- 标记演出已看过 ----------
  markConcertAttended(recordId) {
    Store.update('star_tracking', recordId, { status: '去过' });
    UI.toast('🎉 演出打卡成功！');
    this.rerender();
  },

  // ---------- 设置演出筛选 ----------
  setConcertFilter(filter) {
    this.concertFilter = filter;
    this.rerender();
  },

  // ---------- 设置艺人筛选 ----------
  setStarArtistFilter(filter) {
    this.starArtistFilter = filter;
    this.rerender();
  },

  // ---------- 演出过期自动清理 ----------
  cleanExpiredConcerts() {
    const today = Store.todayStr();
    const all = Store.getAll('star_tracking');
    let cleaned = 0;
    all.forEach(r => {
      if (r.show_date && r.show_date < today && r.status !== '去过') {
        // 自动标记为已过期
        Store.update('star_tracking', r.id, { status: '已过期' });
        cleaned++;
      }
    });
    if (cleaned > 0) {
      console.log(`🧹 自动标记 ${cleaned} 条过期演出`);
    }
  },

  // ---------- 抓取艺人演出资讯 ----------
  // 由 Pages 调用，传入艺人名字，完成后 rerender
  async fetchArtistConcerts(artistName) {
    // 先清理该艺人的自动抓取记录（source 包含 'auto' 的）
    const existing = Store.query('star_tracking', r => r.artist === artistName && r.source && r.source.includes('auto'));
    if (existing.length > 0) {
      const all = Store.getAll('star_tracking');
      const toKeep = all.filter(r => !existing.find(e => e.id === r.id));
      Store._save('star_tracking', toKeep);
    }

    const today = Store.todayStr();
    const query = `${artistName} 演唱会 巡演 2026 演出 时间 地点`;
    
    try {
      // 使用 WebSearch（如果可用）
      // 注意：实际执行时由 Pages 调用此方法
      const results = await this._searchConcerts(artistName);
      
      results.forEach(concert => {
        if (concert.date && concert.date >= today) {
          Store.add('star_tracking', {
            artist: artistName,
            show_name: concert.name || `${artistName}演出`,
            show_date: concert.date,
            city: concert.city || '',
            venue: concert.venue || '',
            status: '想看',
            ticket_date: '',
            ticket_platform: '',
            ticket_price: '',
            source: 'auto-web',
            notes: concert.notes || '',
          });
        }
      });
      
      return results.length;
    } catch (e) {
      console.error('抓取演出资讯失败:', artistName, e);
      return 0;
    }
  },

  // 内部搜索方法 — 由 WebSearch tool 提供结果
  async _searchConcerts(artistName) {
    // 此方法为占位，实际由外部 WebSearch 调用并注入结果
    // Pages.fetchConcertsForArtist 负责实际的搜索调用
    return [];
  },

  // ---------- 标记欠款已还 ----------
  markDebtPaid(recordId) {
    Store.update('accounting', recordId, { debt_status: '已还' });
    UI.toast('✅ 已标记为已还');
    this.rerender();
  },

  // ---------- 新增欠款渠道（打开资产表单，预填信贷） ----------
  addDebtChannel() {
    UI.openFormModal('assets', { type: '花呗', is_credit: true });
  },

  // ---------- 新增一笔欠款记录 ----------
  addDebtRecord() {
    UI.openFormModal('accounting', { type: '支出', debt_status: '未还' });
  },

  // ---------- 灵感转化为任务 ----------
  convertInspiration(inspirationId) {
    const ins = Store.getById('inspiration', inspirationId);
    if (!ins) return;
    Store.add('todo_list', {
      task_name: `💡 ${ins.title}`,
      domain: '灵感执行',
      deadline: Store.todayStr(),
      priority: '中',
      completed: false,
      related_inspiration: inspirationId,
    });
    Store.update('inspiration', inspirationId, { converted: true });
    UI.toast('✅ 已转化为待办任务');
    this.rerender();
  },

  // ---------- 创建去黑头任务 ----------
  createBlackheadTask() {
    const now = new Date();
    const dayOfWeek = now.getDay() || 7;
    const wednesday = new Date(now);
    wednesday.setDate(now.getDate() - dayOfWeek + 3);
    if (wednesday <= now) {
      wednesday.setDate(wednesday.getDate() + 7);
    }
    const wedStr = wednesday.toISOString().slice(0, 10);

    Store.add('todo_list', {
      task_name: '🖤 去黑头日',
      domain: '身体护理',
      deadline: wedStr,
      priority: '中',
      completed: false,
      related_inspiration: '',
    });
    UI.toast('✅ 已创建去黑头任务');
    this.rerender();
  },

  // ---------- 新增自定义 Todo 类别 ----------
  addTodoCategory() {
    const name = prompt('请输入新的 Todo 类别名称（例如：副业、健身、旅行…）');
    if (!name) return;
    const cat = Store.addCustomTodoCategory(name.trim());
    if (!cat) {
      UI.toast('⚠️ 该类别已存在或与固定类别重名');
      return;
    }
    UI.toast(`✅ 已添加类别「${cat.label}」`);
    this.rerender();
  },

  // ---------- 管理自定义 Todo 类别 ----------
  manageTodoCategories() {
    const cats = Store.getCustomTodoCategories();
    let html = '<p class="text-sm text-muted mb-3">删除类别不会删除该类别下的任务，相关任务将归入「其他」。</p>';
    if (cats.length === 0) {
      html += '<p class="text-sm text-muted">暂无自定义类别。固定类别：' +
        Store.schemas.todo_list.fields.find(f => f.name === 'domain').options.join('、') + '</p>';
    } else {
      html += '<div class="flex flex-wrap gap-2">';
      cats.forEach(c => {
        html += `<span class="tag" style="cursor:default;font-size:14px;padding:6px 10px;">
          ${c.icon || '📌'} ${UI.esc(c.label)}
          <button class="btn btn-danger btn-sm" style="margin-left:8px;padding:0 8px;font-size:11px;" onclick="event.stopPropagation();App.removeTodoCategory('${c.id}')">✕ 删除</button>
        </span>`;
      });
      html += '</div>';
    }
    UI.openModal('管理 Todo 类别', html, null, true);
  },

  removeTodoCategory(catId) {
    if (!confirm('确定删除该自定义类别吗？')) return;
    Store.removeCustomTodoCategory(catId);
    UI.toast('🗑️ 已删除类别');
    if (typeof UI.closeModal === 'function') UI.closeModal();
    this.rerender();
  },

  // ---------- 演出资讯去重 ----------
  // 按「艺人 + 演出名称 + 演出日期」判定重复，保留信息更全（updatedAt 较新）的一条
  dedupeConcerts() {
    const all = Store.getAll('star_tracking');
    const map = {};
    let removed = 0;
    // 排序：信息更完整 / 更新更晚的优先保留
    const scored = all.map(r => {
      let score = 0;
      ['city', 'venue', 'ticket_date', 'ticket_platform', 'ticket_price', 'notes'].forEach(k => {
        if (r[k] && r[k] !== '') score += 1;
      });
      if (r.source && r.source.includes('auto')) score -= 0.5; // 自动抓取略低优先
      return { r, score, ts: new Date(r.updatedAt || 0).getTime() };
    }).sort((a, b) => (b.score - a.score) || (b.ts - a.ts));

    const kept = [];
    for (const { r } of scored) {
      const key = `${r.artist}__${r.show_name}__${r.show_date}`;
      if (map[key]) { Store.delete('star_tracking', r.id); removed++; }
      else { map[key] = true; kept.push(r); }
    }
    UI.toast(removed > 0 ? `✅ 已删除 ${removed} 条重复演出` : '✅ 没有发现重复演出');
    this.rerender();
    return removed;
  },

  // ---------- 清除示例（死）数据 ----------
  clearSampleData() {
    const removed = Store.removeSampleData();
    // 强制把受影响的表推送到云端，避免云端陈旧示例数据在下次拉取时又被加回来
    ['todo_list', 'wishlist', 'exercise_videos'].forEach(db => {
      if (typeof Store._syncPushTable === 'function') Store._syncPushTable(db);
    });
    UI.toast(removed > 0 ? `🧹 已清除 ${removed} 条示例数据，并同步云端` : '✅ 未发现示例数据');
    this.rerender();
  },

  // ---------- 本地设置存储 ----------
  saveLocalSetting(key, value) {
    localStorage.setItem('wb_setting_' + key, value);
  },

  getLocalSetting(key) {
    return localStorage.getItem('wb_setting_' + key) || '';
  },

  // ---------- 提醒检查 ----------
  checkReminders() {
    const now = new Date();
    const today = Store.todayStr();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    const hour = now.getHours();
    const minute = now.getMinutes();
    const timeKey = `${today}_${hour}`;

    // 演出抢票提醒
    const starRecords = Store.getAll('star_tracking');
    starRecords.forEach(r => {
      if (r.status === '已购票' || r.status === '已过期' || r.status === '去过') return;

      // 抢票日提醒
      if (r.ticket_date === today && !this.reminderShown[`ticket_today_${r.id}`]) {
        this.reminderShown[`ticket_today_${r.id}`] = true;
        this.showReminder(`🎫 今天抢票！`, `${r.artist} - ${r.show_name}，抢票平台：${r.ticket_platform || '未知'}`);
      }

      // 抢票前一天提醒
      if (r.ticket_date === tomorrowStr && !this.reminderShown[`ticket_tomorrow_${r.id}`]) {
        this.reminderShown[`ticket_tomorrow_${r.id}`] = true;
        this.showReminder(`🎫 明天抢票`, `${r.artist} - ${r.show_name}，明天(${r.ticket_date})抢票！`);
      }

      // 演出日提醒
      if (r.show_date === today && !this.reminderShown[`show_today_${r.id}`]) {
        this.reminderShown[`show_today_${r.id}`] = true;
        this.showReminder(`🎤 今天演出！`, `${r.artist} - ${r.show_name}，场馆：${r.venue || '未知'}`);
      }
    });

    // 吃药提醒（9:00 和 14:00）
    if (hour === 9 && minute < 5 && !this.reminderShown[`meds_morning_${today}`]) {
      this.reminderShown[`meds_morning_${today}`] = true;
      this.showReminder('💊 该吃药啦', '上午记得吃药');
    }
    if (hour === 14 && minute < 5 && !this.reminderShown[`meds_afternoon_${today}`]) {
      this.reminderShown[`meds_afternoon_${today}`] = true;
      this.showReminder('💊 该吃药啦', '下午记得吃药');
    }

    // 去黑头日提醒（周三）
    const dayOfWeek = now.getDay() || 7;
    if (dayOfWeek === 3 && hour === 9 && minute < 5 && !this.reminderShown[`blackhead_${today}`]) {
      this.reminderShown[`blackhead_${today}`] = true;
      this.showReminder('🖤 去黑头日', '今天是周三，记得做去黑头护理');
    }

    // ===== 经期智能提醒 =====
    const cycleInfo = Store.getCurrentCycleInfo();

    // 经期预测提醒：预计下次经期前2天，上午9:00
    if (cycleInfo.nextPeriod && hour === 9 && minute < 5) {
      const daysUntil = Math.floor((new Date(cycleInfo.nextPeriod) - new Date(today)) / 86400000);
      if (daysUntil === 2 && !this.reminderShown[`period_soon_${today}`]) {
        this.reminderShown[`period_soon_${today}`] = true;
        this.showReminder('🩸 经期提醒', '预计2天后经期到来，记得备好卫生巾哦～');
      }
    }

    // 排卵期提醒：预计排卵日前1天
    if (cycleInfo.ovulation && hour === 9 && minute < 5) {
      const daysUntilOv = Math.floor((new Date(cycleInfo.ovulation) - new Date(today)) / 86400000);
      if (daysUntilOv === 1 && !this.reminderShown[`ovulation_${today}`]) {
        this.reminderShown[`ovulation_${today}`] = true;
        this.showReminder('✨ 排卵期提醒', '明天可能进入排卵期，分泌物可能会增加，注意身体变化。');
      }
    }

    // 周期异常提醒
    if (cycleInfo.avgCycle && cycleInfo.startDates && cycleInfo.startDates.length >= 2 && !this.reminderShown[`cycle_anomaly_${today}`]) {
      const lastTwo = cycleInfo.startDates.slice(-2);
      const lastCycle = Math.round((new Date(lastTwo[1]) - new Date(lastTwo[0])) / 86400000);
      if (Math.abs(lastCycle - cycleInfo.avgCycle) > 7) {
        this.reminderShown[`cycle_anomaly_${today}`] = true;
        this.showReminder('⚠️ 周期异常', '本次周期与以往差异较大，可以留意一下身体状况');
      }
    }
  },

  // ---------- 显示提醒 ----------
  showReminder(title, body) {
    // Toast 提醒
    UI.toast(`🔔 ${title} - ${body}`);

    // 系统通知
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: 'icon.svg',
        tag: title + Date.now(),
      });
    }
  },

  // ---------- 请求通知权限 ----------
  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  },
};

// ---------- 启动应用 ----------
document.addEventListener('DOMContentLoaded', () => {
  App.init();
  // 延迟请求通知权限
  setTimeout(() => App.requestNotificationPermission(), 3000);
});
