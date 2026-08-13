/* ============================================
   UI 组件库 - ui.js
   可复用组件：表格、看板、表单、日历、图表等
   ============================================ */

const UI = {

  // ---------- HTML 转义 ----------
  esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // ---------- 字段值渲染（展示用） ----------
  fieldValue(dbName, field, value) {
    if (value === null || value === undefined || value === '') return '<span class="text-muted">—</span>';

    switch (field.type) {
      case 'title':
      case 'text':
        return `<span>${this.esc(value)}</span>`;

      case 'longtext':
        const truncated = String(value).length > 50 ? String(value).slice(0, 50) + '...' : value;
        return `<span title="${this.esc(value)}">${this.esc(truncated)}</span>`;

      case 'number':
        if (field.name === 'rating') return `<span class="stars">${'★'.repeat(Math.min(5, value))}${'☆'.repeat(Math.max(0, 5 - value))}</span>`;
        return `<span>${this.esc(value)}</span>`;

      case 'date':
        return `<span>${this.esc(value)}</span>`;

      case 'checkbox':
        return value
          ? `<span class="tag tag-mint">✓</span>`
          : `<span class="tag tag-gray">✗</span>`;

      case 'select':
        return `<span class="tag tag-mint">${this.esc(value)}</span>`;

      case 'multiselect':
        if (Array.isArray(value) && value.length > 0) {
          return value.map(v => `<span class="tag tag-info">${this.esc(v)}</span>`).join(' ');
        }
        return '<span class="text-muted">—</span>';

      case 'url':
        return `<a href="${this.esc(value)}" target="_blank" rel="noopener" class="tag tag-mint">🔗 打开</a>`;

      case 'relation':
        if (!value) return '<span class="text-muted">—</span>';
        const label = Store.getRelationLabel(field.relationDb, value);
        return `<span class="tag tag-purple">${this.esc(label)}</span>`;

      default:
        return `<span>${this.esc(value)}</span>`;
    }
  },

  // ---------- 表单输入渲染 ----------
  fieldInput(field, value, dbName) {
    const name = field.name;
    const v = value !== undefined ? value : '';

    switch (field.type) {
      case 'title':
        if (field.inputType === 'date') {
          return `<input type="date" class="form-input" data-field="${name}" value="${this.esc(v)}">`;
        }
        return `<input type="text" class="form-input" data-field="${name}" value="${this.esc(v)}" placeholder="请输入${field.label}">`;

      case 'text':
        return `<input type="text" class="form-input" data-field="${name}" value="${this.esc(v)}" placeholder="请输入${field.label}">`;

      case 'longtext':
        return `<textarea class="form-textarea" data-field="${name}" placeholder="请输入${field.label}">${this.esc(v)}</textarea>`;

      case 'number':
        return `<input type="number" class="form-input" data-field="${name}" value="${this.esc(v)}" placeholder="请输入数字">`;

      case 'date':
        return `<input type="date" class="form-input" data-field="${name}" value="${this.esc(v)}">`;

      case 'checkbox':
        return `<label class="checkbox-row"><span class="cbx ${v ? 'checked' : ''}" data-field="${name}" data-type="checkbox"></span><span class="cbx-label">${field.label}</span></label>`;

      case 'select':
        // 特殊处理：记账账户从资产库动态获取
        let selectOpts = field.options || [];
        if (dbName === 'accounting' && field.name === 'account') {
          const assets = Store.getAll('assets');
          const assetNames = assets.map(a => a.name);
          selectOpts = [...new Set([...assetNames, '银行卡', '微信', '支付宝', '现金', '花呗', '抖音月付', '其他'])];
        }
        let opts = selectOpts.map(o =>
          `<option value="${this.esc(o)}" ${v === o ? 'selected' : ''}>${this.esc(o)}</option>`
        ).join('');
        // Todo 的「所属类别」下拉：追加「➕ 新增类别...」入口，选中即弹出新增
        let extraAttr = '';
        if (dbName === 'todo_list' && field.name === 'domain') {
          opts += `<option value="__add_todo_cat__">➕ 新增类别...</option>`;
          extraAttr = ' onchange="UI.onTodoDomainSelect(this)"';
        }
        return `<select class="form-select" data-field="${name}"${extraAttr}><option value="">请选择</option>${opts}</select>`;

      case 'multiselect':
        const selected = Array.isArray(v) ? v : [];
        const cbs = (field.options || []).map(o =>
          `<label class="checkbox-row"><span class="cbx ${selected.includes(o) ? 'checked' : ''}" data-field="${name}" data-value="${this.esc(o)}" data-type="multiselect"></span><span class="cbx-label">${this.esc(o)}</span></label>`
        ).join('');
        return `<div class="flex flex-wrap gap-2">${cbs}</div>`;

      case 'url':
        return `<input type="url" class="form-input" data-field="${name}" value="${this.esc(v)}" placeholder="https://...">`;

      case 'relation':
        const relRecords = Store.getAll(field.relationDb);
        const relOpts = relRecords.map(r =>
          `<option value="${r.id}" ${v === r.id ? 'selected' : ''}>${this.esc(Store.getTitle(field.relationDb, r))}</option>`
        ).join('');
        return `<select class="form-select" data-field="${name}"><option value="">请选择</option>${relOpts}</select>`;

      default:
        return `<input type="text" class="form-input" data-field="${name}" value="${this.esc(v)}">`;
    }
  },

  // ---------- Todo 所属类别：下拉内新增类别 ----------
  // 在下拉框末尾提供「➕ 新增类别...」选项，选中后用浏览器输入框取得新类别名，
  // 即时写入 Store 并刷新当前下拉（不关闭待办表单弹窗）。
  onTodoDomainSelect(selectEl) {
    const val = selectEl.value;
    if (val !== '__add_todo_cat__') {
      // 正常选择，记录上一次有效值以便取消时回退
      selectEl.dataset.prev = val;
      return;
    }
    const name = window.prompt('输入新的 Todo 类别名称（例如：副业、健身、旅行…）');
    if (!name || !name.trim()) {
      selectEl.value = selectEl.dataset.prev || '';
      return;
    }
    const cat = Store.addCustomTodoCategory(name.trim());
    if (!cat) {
      this.toast('⚠️ 该类别已存在或与固定类别重名');
      selectEl.value = selectEl.dataset.prev || '';
      return;
    }
    // 刷新下拉选项，并把新类别设为选中
    const labels = Store.getAllTodoCategoryLabels();
    let html = '<option value="">请选择</option>' +
      labels.map(o => `<option value="${this.esc(o)}" ${o === cat.label ? 'selected' : ''}>${this.esc(o)}</option>`).join('');
    html += '<option value="__add_todo_cat__">➕ 新增类别...</option>';
    selectEl.innerHTML = html;
    this.toast(`✅ 已添加类别「${cat.label}」`);
  },

  // ---------- 收集表单数据 ----------
  collectForm(modalEl) {
    const data = {};
    // 普通输入
    modalEl.querySelectorAll('[data-field]').forEach(el => {
      const fieldName = el.dataset.field;
      const type = el.dataset.type;

      if (type === 'checkbox') {
        data[fieldName] = el.classList.contains('checked');
      } else if (type === 'multiselect') {
        if (!data[fieldName]) data[fieldName] = [];
        if (el.classList.contains('checked')) {
          data[fieldName].push(el.dataset.value);
        }
        // Need to re-collect all multiselect for this field
      } else if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
        if (el.type === 'number') {
          data[fieldName] = el.value ? parseFloat(el.value) : null;
        } else {
          data[fieldName] = el.value;
        }
      }
    });

    // 修正 multiselect：重新收集
    const multiselectFields = new Set();
    modalEl.querySelectorAll('[data-type="multiselect"]').forEach(el => {
      multiselectFields.add(el.dataset.field);
    });
    multiselectFields.forEach(fieldName => {
      const selected = [];
      modalEl.querySelectorAll(`[data-field="${fieldName}"][data-type="multiselect"]`).forEach(el => {
        if (el.classList.contains('checked')) {
          selected.push(el.dataset.value);
        }
      });
      data[fieldName] = selected;
    });

    return data;
  },

  // ---------- 表格视图 ----------
  table(opts) {
    const { dbName, records, columns, actions, addLabel, sortBy, sortDesc } = opts;
    const schema = Store.schemas[dbName];
    if (!schema) return '<p>数据库不存在</p>';

    // 排序
    let data = [...records];
    if (sortBy) {
      data.sort((a, b) => {
        let av = a[sortBy] || '', bv = b[sortBy] || '';
        if (typeof av === 'number') return sortDesc ? bv - av : av - bv;
        return sortDesc ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
      });
    }

    // 自动生成列
    let cols = columns;
    if (!cols) {
      cols = schema.fields.filter(f => f.type !== 'longtext').map(f => ({
        field: f.name,
        label: f.label,
        schemaField: f,
      }));
    }

    let html = '';

    // 添加按钮
    if (addLabel) {
      const onAddStr = typeof onAdd === 'function' ? '' : (opts.onAdd ? opts.onAdd : '');
      html += `<div class="mb-3"><button class="btn btn-primary btn-sm" onclick="UI.openFormModal('${dbName}', null)">+ ${this.esc(addLabel)}</button></div>`;
    }

    if (data.length === 0) {
      html += this.emptyState('📭', '暂无数据，点击上方按钮添加');
      return html;
    }

    html += '<div style="overflow-x:auto;"><table class="data-table"><thead><tr>';
    cols.forEach(c => {
      html += `<th>${this.esc(c.label)}</th>`;
    });
    if (actions) {
      html += '<th>操作</th>';
    }
    html += '</tr></thead><tbody>';

    data.forEach(record => {
      html += '<tr>';
      cols.forEach(c => {
        const field = c.schemaField || schema.fields.find(f => f.name === c.field);
        html += `<td>${this.fieldValue(dbName, field, record[c.field])}</td>`;
      });
      if (actions) {
        html += '<td class="row-actions">';
        if (actions.edit !== false) {
          html += `<button class="btn btn-outline btn-sm" onclick="UI.openFormModalById('${dbName}', '${record.id}')">✏️</button>`;
        }
        if (actions.delete !== false) {
          html += `<button class="btn btn-danger btn-sm" onclick="UI.confirmDelete('${dbName}', '${record.id}')">🗑️</button>`;
        }
        html += '</td>';
      }
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    return html;
  },

  // ---------- 看板视图 ----------
  kanban(opts) {
    const { dbName, records, groupField, groupValues, cardRenderer, onAdd } = opts;
    const schema = Store.schemas[dbName];
    const groupSchemaField = schema.fields.find(f => f.name === groupField);

    let html = '<div class="kanban">';
    const values = groupValues || (groupSchemaField ? groupSchemaField.options : []);

    values.forEach(gv => {
      const items = records.filter(r => r[groupField] === gv);
      html += `<div class="kanban-col">`;
      html += `<h4>${this.esc(gv)} <span class="count">${items.length}</span></h4>`;
      items.forEach(record => {
        if (cardRenderer) {
          html += cardRenderer(record);
        } else {
          html += this.defaultKanbanCard(dbName, record);
        }
      });
      if (onAdd) {
        html += `<button class="btn-add" onclick="UI.openFormModal('${dbName}', null)">+ 添加</button>`;
      }
      html += `</div>`;
    });

    html += '</div>';
    return html;
  },

  defaultKanbanCard(dbName, record) {
    const schema = Store.schemas[dbName];
    const title = Store.getTitle(dbName, record);
    const titleField = schema.titleField;
    let meta = [];
    schema.fields.forEach(f => {
      if (f.name !== titleField && record[f.name] && f.type !== 'longtext') {
        meta.push(this.fieldValue(dbName, f, record[f.name]));
      }
    });
    return `<div class="kanban-card" onclick="UI.openFormModalById('${dbName}', '${record.id}')">
      <div class="kc-title">${this.esc(title)}</div>
      <div class="kc-meta">${meta.slice(0, 3).join(' ')}</div>
    </div>`;
  },

  // ---------- 卡片网格 ----------
  cardGrid(opts) {
    const { dbName, records, cardRenderer, addLabel, onAdd } = opts;
    let html = '<div class="card-grid card-grid-3">';
    records.forEach(record => {
      html += cardRenderer ? cardRenderer(record) : this.defaultCard(dbName, record);
    });
    html += '</div>';
    if (addLabel) {
      html += `<button class="btn-add mt-3" onclick="${onAdd || `UI.openFormModal('${dbName}', null)`}">+ ${this.esc(addLabel)}</button>`;
    }
    return html;
  },

  defaultCard(dbName, record) {
    const schema = Store.schemas[dbName];
    const title = Store.getTitle(dbName, record);
    return `<div class="kanban-card" onclick="UI.openFormModalById('${dbName}', '${record.id}')">
      <div class="kc-title">${this.esc(title)}</div>
    </div>`;
  },

  // ---------- 通过ID打开表单弹窗 ----------
  openFormModalById(dbName, id) {
    const record = Store.getById(dbName, id);
    this.openFormModal(dbName, record);
  },

  // ---------- 表单弹窗 ----------
  openFormModal(dbName, record, opts) {
    // opts 可以是一个对象 { visibleFields: [...], onAdd: fn } 或者是旧的 onAdd 函数
    let visibleFields = null;
    let onAdd = null;

    if (typeof opts === 'function') {
      onAdd = opts;
    } else if (opts && typeof opts === 'object') {
      visibleFields = opts.visibleFields;
      onAdd = opts.onAdd;
    }

    const schema = Store.schemas[dbName];
    if (!schema) return;

    const isEdit = !!(record && record.id);
    const data = record ? { ...record } : {};
    const today = Store.todayStr();

    // 为 title-date 字段设置默认值
    schema.fields.forEach(f => {
      if (f.type === 'title' && f.inputType === 'date' && !data[f.name]) {
        data[f.name] = today;
      }
      if (f.type === 'date' && !data[f.name] && f.name === 'date') {
        data[f.name] = today;
      }
      if (f.type === 'date' && !data[f.name] && f.name === 'created_date') {
        data[f.name] = today;
      }
    });

    let fieldsToShow = schema.fields;
    if (visibleFields && Array.isArray(visibleFields)) {
      fieldsToShow = schema.fields.filter(f => visibleFields.includes(f.name));
    }

    // 动态更新 exercise_videos 的类别选项（包含自定义类别）
    if (dbName === 'exercise_videos') {
      const catField = fieldsToShow.find(f => f.name === 'category');
      if (catField) {
        catField.options = Store.getAllExerciseCategoryLabels();
      }
    }
    // 动态更新 star_tracking 的艺人选项（包含自定义艺人）
    if (dbName === 'star_tracking') {
      const artistField = fieldsToShow.find(f => f.name === 'artist');
      if (artistField) {
        artistField.options = Store.getAllStarArtists();
      }
    }
    // 动态更新 todo_list 的类别选项（包含自定义类别）
    if (dbName === 'todo_list') {
      const domainField = fieldsToShow.find(f => f.name === 'domain');
      if (domainField) {
        domainField.options = Store.getAllTodoCategoryLabels();
      }
    }

    let formHtml = '';

    // 愿望清单新增时：粘贴链接快速识别
    if (dbName === 'wishlist' && !isEdit) {
      formHtml += `
        <div class="wishlist-url-section" style="background:var(--mint-lightest);border-radius:10px;padding:12px;margin-bottom:14px;border:1px dashed var(--mint);">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <span style="font-size:16px;">🔗</span>
            <span class="text-sm font-bold">粘贴商品链接，自动识别信息</span>
          </div>
          <div style="display:flex;gap:8px;">
            <input type="url" id="wishlist-url-input" class="form-input" placeholder="粘贴淘宝/京东/拼多多商品链接..." style="flex:1;font-size:13px;">
            <button class="btn btn-primary btn-sm" id="wishlist-url-detect" style="white-space:nowrap;">🔍 识别</button>
          </div>
          <div id="wishlist-url-status" class="text-sm" style="margin-top:6px;display:none;"></div>
        </div>
      `;
    }

    fieldsToShow.forEach(f => {
      formHtml += `<div class="form-group">`;
      formHtml += `<label>${f.label}${f.note ? ` <span class="text-muted text-sm">(${this.esc(f.note)})</span>` : ''}</label>`;
      formHtml += this.fieldInput(f, data[f.name], dbName);
      formHtml += `</div>`;
    });

    const title = isEdit ? `编辑 - ${schema.label}` : `新增 - ${schema.label}`;

    this.openModal(title, formHtml, (modalEl) => {
      // ⚠️ 先把 footer 按钮插入 DOM（必须在查询 #form-submit 之前）
      const footer = modalEl.querySelector('.modal-footer');
      if (footer) {
        footer.innerHTML = `
          <button class="btn btn-outline" onclick="UI.closeModal()">取消</button>
          <button class="btn btn-primary" id="form-submit">${isEdit ? '保存' : '添加'}</button>
        `;
      }

      // 绑定 checkbox 点击
      modalEl.querySelectorAll('.cbx').forEach(cbx => {
        cbx.addEventListener('click', (e) => {
          e.stopPropagation();
          cbx.classList.toggle('checked');
        });
      });

      // 愿望清单：粘贴链接识别
      if (dbName === 'wishlist' && !isEdit) {
        const detectBtn = modalEl.querySelector('#wishlist-url-detect');
        const urlInput = modalEl.querySelector('#wishlist-url-input');
        const statusEl = modalEl.querySelector('#wishlist-url-status');
        const self = this;

        detectBtn.addEventListener('click', async () => {
          const url = urlInput.value.trim();
          if (!url) { self.toast('请先粘贴商品链接'); return; }

          statusEl.style.display = 'block';
          statusEl.innerHTML = '⏳ 正在识别商品信息...';
          statusEl.style.color = 'var(--text-muted)';
          detectBtn.disabled = true;
          detectBtn.textContent = '⏳';

          try {
            const info = await self.fetchAndParseProduct(url);
            if (info.item_name || info.price) {
              self.populateWishlistForm(modalEl, info);
              statusEl.innerHTML = '✅ 识别成功！请核对信息后保存';
              statusEl.style.color = 'var(--mint-dark)';
            } else {
              throw new Error('no_data');
            }
          } catch (e) {
            // 尝试 URL 解析兜底
            const info = self.parseProductUrl(url);
            if (info.item_name || info.price || info.category) {
              self.populateWishlistForm(modalEl, info);
              statusEl.innerHTML = '⚠️ 已从链接提取部分信息，请核对补充';
              statusEl.style.color = 'var(--warn)';
            } else {
              statusEl.innerHTML = '❌ 无法识别该链接，请手动填写';
              statusEl.style.color = 'var(--danger)';
            }
          } finally {
            detectBtn.disabled = false;
            detectBtn.textContent = '🔍 识别';
          }
        });

        // 回车也能触发识别
        urlInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            detectBtn.click();
          }
        });
      }

      // 提交按钮（现在 #form-submit 已经存在于 DOM 中）
      const submitBtn = modalEl.querySelector('#form-submit');
      if (submitBtn) {
        submitBtn.addEventListener('click', () => {
          const formData = this.collectForm(modalEl);

          // 为 title-date 设置默认值
          schema.fields.forEach(f => {
            if (f.type === 'title' && f.inputType === 'date' && !formData[f.name]) {
              formData[f.name] = today;
            }
          });

          if (isEdit) {
            Store.update(dbName, record.id, formData);
            this.toast('✅ 已更新');
          } else {
            Store.add(dbName, formData);
            this.toast('✅ 已添加');
          }
          this.closeModal();
          App.rerender();
        });
      }
    }, true); // isForm=true for submit button
  },

  // ---------- 愿望清单：从链接抓取商品信息 ----------
  async fetchAndParseProduct(url) {
    // 用多个 CORS 代理依次尝试
    const proxyUrls = [
      url,                                                          // 直连
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,  // allorigins
      `https://corsproxy.io/?${encodeURIComponent(url)}`,           // corsproxy.io
    ];

    let html = '';
    for (const proxyUrl of proxyUrls) {
      try {
        const resp = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
        if (resp.ok) {
          html = await resp.text();
          if (html.length > 500) break; // 有效内容
        }
      } catch (e) { /* 尝试下一个 */ }
    }

    if (!html) throw new Error('fetch_failed');

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const info = { _url: url };

    // ── JSON-LD 结构化数据（最权威）──
    try {
      const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
      for (const s of scripts) {
        const ld = JSON.parse(s.textContent);
        const product = ld['@type'] === 'Product' ? ld : (ld['@graph'] || []).find(g => g['@type'] === 'Product');
        if (product) {
          if (product.name && !info.item_name) info.item_name = product.name;
          if (product.description && !info.notes) info.notes = product.description.substring(0, 200);
          if (product.offers) {
            const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
            const p = parseFloat(offer.price);
            if (!isNaN(p) && !info.price) info.price = p;
          }
          if (product.brand && product.brand.name && !info.item_name) {
            info.item_name = product.brand.name + ' ' + (info.item_name || '');
          }
        }
      }
    } catch (e) { /* ignore parse errors */ }

    // ── OG / Meta 标签 ──
    const ogTitle = doc.querySelector('meta[property="og:title"]');
    if (!info.item_name && ogTitle && ogTitle.content) {
      let t = ogTitle.content.trim();
      t = t.replace(/[-–|—]\s*(?:京东|淘宝|天猫|拼多多|JD|Taobao|Tmall).*$/i, '').trim();
      if (t.length > 3) info.item_name = t;
    }

    if (!info.notes) {
      const ogDesc = doc.querySelector('meta[property="og:description"]');
      if (ogDesc && ogDesc.content) info.notes = ogDesc.content.trim().substring(0, 200);
    }

    if (!info.price) {
      const priceMeta = doc.querySelector('meta[property="product:price:amount"]');
      if (priceMeta && priceMeta.content) info.price = parseFloat(priceMeta.content);
    }

    // ── 页面 title ──
    if (!info.item_name) {
      const titleEl = doc.querySelector('title');
      if (titleEl) {
        let t = titleEl.textContent.trim();
        t = t.replace(/[-–|—]\s*(?:京东|淘宝|天猫|拼多多|旗舰店|官方|JD|Taobao|Tmall).*$/i, '').trim();
        if (t.length > 4) info.item_name = t;
      }
    }

    // ── h1 ──
    if (!info.item_name) {
      const h1 = doc.querySelector('h1');
      if (h1) info.item_name = h1.textContent.trim().substring(0, 100);
    }

    // ── 价格：尝试常见 class/id ──
    if (!info.price) {
      const priceSelectors = [
        '[class*="price"]', '[id*="price"]', '.J-p-', '.tb-rmb-num',
        '[class*="Price"]', '[class*="current-price"]', '[class*="sale-price"]',
        '.price-box', '.item-price', '.product-price',
      ];
      for (const sel of priceSelectors) {
        try {
          const els = doc.querySelectorAll(sel);
          for (const el of els) {
            const m = el.textContent.match(/[¥￥]\s*([\d,.]+)/);
            if (m) { info.price = parseFloat(m[1].replace(/,/g, '')); break; }
          }
        } catch (e) { /* skip invalid selectors */ }
        if (info.price) break;
      }
    }

    return info;
  },

  // ---------- 愿望清单：URL 兜底解析（不依赖网络请求）----------
  parseProductUrl(url) {
    const info = { _url: url };
    try {
      const u = new URL(url);
      const host = u.hostname;

      // 平台识别 → 默认分类
      if (host.includes('jd.com')) info.category = '数码';
      else if (host.includes('taobao.com')) info.category = '服饰';
      else if (host.includes('tmall.com')) info.category = '服饰';
      else if (host.includes('pinduoduo.com') || host.includes('yangkeduo.com')) info.category = '家居';
      else if (host.includes('suning.com')) info.category = '数码';
      else if (host.includes('vip.com')) info.category = '服饰';
      else if (host.includes('1688.com')) info.category = '家居';
      else if (host.includes('xiaohongshu.com')) info.category = '美妆';
      else if (host.includes('douyin.com')) info.category = '其他';
      else info.category = '其他';

      // 京东：item.jd.com/123456.html
      const jdMatch = host.match(/item\.jd\.com/);
      if (jdMatch) {
        const sku = u.pathname.replace(/\.html?$/i, '').replace(/\//g, '');
        if (/^\d+$/.test(sku)) info._sku = sku;
      }

      // 淘宝/天猫：id=xxx 参数
      const tbId = u.searchParams.get('id');
      if (tbId && /^\d+$/.test(tbId)) info._sku = tbId;

      // 拼多多：goods_id 或路径中的 ID
      const pddId = u.searchParams.get('goods_id') || u.searchParams.get('goodsId');
      if (pddId && /^\d+$/.test(pddId)) info._sku = pddId;

      // 有 SKU 但不代表有商品名，不做假数据
      // 只有平台信息是可靠的
    } catch (e) { /* ignore */ }
    return info;
  },

  // ---------- 愿望清单：将识别结果回填到表单 ----------
  populateWishlistForm(modalEl, info) {
    if (info.item_name) {
      const el = modalEl.querySelector('[data-field="item_name"]');
      if (el) el.value = info.item_name;
    }
    if (info.price) {
      const el = modalEl.querySelector('[data-field="price"]');
      if (el) el.value = info.price;
    }
    if (info.category) {
      const el = modalEl.querySelector('[data-field="category"]');
      if (el) {
        // 检查选项是否存在
        const hasOption = Array.from(el.options).some(o => o.value === info.category);
        if (hasOption) el.value = info.category;
      }
    }
    if (info.notes) {
      const el = modalEl.querySelector('[data-field="notes"]');
      if (el) el.value = info.notes;
    }
    // 自动填入链接
    if (info._url) {
      const el = modalEl.querySelector('[data-field="link"]');
      if (el && !el.value) el.value = info._url;
    }
  },

  // ---------- 通用弹窗 ----------
  openModal(title, contentHtml, onMount, isForm) {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay" onclick="UI.closeModal()"></div>
      <div class="modal">
        <div class="modal-header">
          <h3>${this.esc(title)}</h3>
          <button class="modal-close" onclick="UI.closeModal()">✕</button>
        </div>
        <div class="modal-body">${contentHtml}</div>
        ${isForm ? '<div class="modal-footer"></div>' : ''}
      </div>
    `;
    container.classList.add('show');
    document.body.style.overflow = 'hidden';

    if (onMount) {
      const modalEl = container.querySelector('.modal');
      onMount(modalEl);
    }
  },

  closeModal() {
    const container = document.getElementById('modal-container');
    container.classList.remove('show');
    container.innerHTML = '';
    document.body.style.overflow = '';
  },

  // ---------- 确认删除 ----------
  confirmDelete(dbName, id, onDelete) {
    this.openModal('确认删除', `<p>确定要删除这条记录吗？此操作不可撤销。</p>`);

    const modal = document.querySelector('#modal-container .modal');
    if (modal) {
      let footer = modal.querySelector('.modal-footer');
      if (!footer) {
        footer = document.createElement('div');
        footer.className = 'modal-footer';
        modal.appendChild(footer);
      }
      footer.innerHTML = `
        <button class="btn btn-outline" onclick="UI.closeModal()">取消</button>
        <button class="btn btn-danger" id="delete-confirm">确认删除</button>
      `;
      const btn = footer.querySelector('#delete-confirm');
      if (btn) {
        btn.addEventListener('click', () => {
          Store.delete(dbName, id);
          if (onDelete && typeof onDelete === 'function') onDelete();
          this.closeModal();
          this.toast('🗑️ 已删除');
          App.rerender();
        });
      }
    }
  },

  // ---------- Toast 提示 ----------
  toast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  },

  // ---------- 空状态 ----------
  emptyState(emoji, message) {
    return `<div class="empty-state"><div class="emoji">${emoji}</div><p>${this.esc(message)}</p></div>`;
  },

  // ---------- 筛选标签栏 ----------
  filterChips(chips, activeId, onChangeFnName) {
    let html = '<div class="filter-bar">';
    chips.forEach(chip => {
      const active = chip.id === activeId ? 'active' : '';
      html += `<span class="filter-chip ${active}" onclick="${onChangeFnName}('${chip.id}')">${this.esc(chip.label)}</span>`;
    });
    html += '</div>';
    return html;
  },

  // ---------- 日历视图 ----------
  calendar(opts) {
    const { dbName, dateField, markerFn, year, month, onDayClick, numberColorFn } = opts;
    const y = year || new Date().getFullYear();
    const m = month !== undefined ? month : new Date().getMonth();

    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    const startWeekday = firstDay.getDay() === 0 ? 7 : firstDay.getDay(); // 周日=7
    const daysInMonth = lastDay.getDate();
    const prevMonthDays = new Date(y, m, 0).getDate();

    const todayStr = Store.todayStr();
    const allRecords = Store.getAll(dbName);

    let html = '<div class="calendar">';
    html += '<div class="calendar-header">';
    html += `<button class="btn btn-outline btn-sm" onclick="App.changeCalendarMonth(-1)">‹</button>`;
    html += `<h4>${y}年${m + 1}月</h4>`;
    html += `<button class="btn btn-outline btn-sm" onclick="App.changeCalendarMonth(1)">›</button>`;
    html += '</div>';

    html += '<div class="calendar-grid">';
    ['一', '二', '三', '四', '五', '六', '日'].forEach(wd => {
      html += `<div class="calendar-weekday">${wd}</div>`;
    });

    // 上月填充
    for (let i = startWeekday - 1; i > 0; i--) {
      html += `<div class="calendar-day other-month">${prevMonthDays - i + 1}</div>`;
    }

    // 本月日期
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const dayRecords = allRecords.filter(r => r[dateField] === dateStr);

      let classes = 'calendar-day';
      if (isToday) classes += ' today';
      if (dayRecords.length > 0) classes += ' has-data';

      let markers = '';
      if (markerFn && dayRecords.length > 0) {
        markers = markerFn(dayRecords);
      } else if (dayRecords.length > 0) {
        markers = `<div class="dot-marker"><span style="background:var(--mint-primary)"></span></div>`;
      }

      let numStyle = '';
      let cellExtra = '';
      if (numberColorFn && dayRecords.length > 0) {
        const nc = numberColorFn(dayRecords);
        if (nc) {
          cellExtra += ` data-numcolor="${nc.color}"`;
          numStyle = `color:${nc.color};font-weight:bold;`;
          if (nc.bg) cellExtra += ` style="background:${nc.bg};border-radius:8px;"`;
        }
      }

      html += `<div class="${classes}" onclick="${onDayClick || 'App.onCalendarDayClick'}('${dateStr}')"${cellExtra}><span style="${numStyle}">${d}</span>${markers}</div>`;
    }

    // 下月填充
    const totalCells = startWeekday - 1 + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      html += `<div class="calendar-day other-month">${i}</div>`;
    }

    html += '</div></div>';
    return html;
  },

  // ---------- 柱状图 ----------
  barChart(data, opts = {}) {
    // data: [{ label, value, color? }]
    const max = Math.max(...data.map(d => d.value), 1);
    const heightUnit = 160 / max;

    let html = '<div class="bar-chart">';
    data.forEach(d => {
      const h = Math.max(4, d.value * heightUnit);
      const color = d.color || 'var(--mint-primary)';
      html += `<div class="bar-col">
        <span class="bar-value">${d.value}</span>
        <div class="bar" style="height:${h}px; background: linear-gradient(to top, ${color}, var(--mint-light));"></div>
        <span class="bar-label">${this.esc(d.label)}</span>
      </div>`;
    });
    html += '</div>';
    return html;
  },

  // ---------- 饼图 ----------
  pieChart(data, opts = {}) {
    // data: [{ label, value, color }]
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return '<div class="empty-state"><div class="emoji">📊</div><p>暂无数据</p></div>';

    const colors = ['#7bc99e', '#a8e6cf', '#ffb74d', '#ff8a65', '#90caf9', '#ce93d8', '#a5d6a7', '#fff176'];
    let cumAngle = 0;
    let paths = '';
    let legend = '<div class="flex flex-wrap gap-2 mt-3">';

    data.forEach((d, i) => {
      const pct = (d.value / total) * 100;
      const angle = (d.value / total) * 360;
      const startAngle = cumAngle;
      const endAngle = cumAngle + angle;
      cumAngle = endAngle;

      const color = d.color || colors[i % colors.length];

      if (angle >= 359.99) {
        paths = `<circle cx="100" cy="100" r="80" fill="${color}"/>`;
      } else {
        const sRad = (startAngle - 90) * Math.PI / 180;
        const eRad = (endAngle - 90) * Math.PI / 180;
        const x1 = 100 + 80 * Math.cos(sRad);
        const y1 = 100 + 80 * Math.sin(sRad);
        const x2 = 100 + 80 * Math.cos(eRad);
        const y2 = 100 + 80 * Math.sin(eRad);
        const largeArc = angle > 180 ? 1 : 0;
        paths += `<path d="M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${color}" stroke="white" stroke-width="2"/>`;
      }

      legend += `<span class="tag" style="background:${color}33; color:${color}">${this.esc(d.label)} ${d.value} (${pct.toFixed(1)}%)</span>`;
    });
    legend += '</div>';

    return `<div class="text-center">
      <svg width="200" height="200" viewBox="0 0 200 200">${paths}
        <circle cx="100" cy="100" r="45" fill="white"/>
        <text x="100" y="95" text-anchor="middle" font-size="22" font-weight="bold" fill="var(--text)">${total}</text>
        <text x="100" y="112" text-anchor="middle" font-size="11" fill="var(--text-muted)">总计</text>
      </svg>
      ${legend}
    </div>`;
  },

  // ---------- 进度环 ----------
  progressRing(percent, label) {
    const r = 36;
    const c = 2 * Math.PI * r;
    const offset = c - (percent / 100) * c;
    return `<div class="progress-ring">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle class="bg-ring" cx="45" cy="45" r="${r}"/>
        <circle class="fg-ring" cx="45" cy="45" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${offset}"/>
      </svg>
      <div class="flex flex-col items-center">
        <span class="font-bold" style="font-size:18px;">${percent}%</span>
        ${label ? `<span class="text-sm text-muted">${this.esc(label)}</span>` : ''}
      </div>
    </div>`;
  },

  // ---------- 星级选择器（表单用） ----------
  starInput(name, value) {
    let html = '<div class="flex gap-2" style="font-size:22px;">';
    for (let i = 1; i <= 5; i++) {
      html += `<span class="star-pick ${i <= (value || 0) ? 'active' : ''}" data-val="${i}" data-field="${name}" style="cursor:pointer;color:${i <= (value || 0) ? '#ffc107' : '#ddd'};">★</span>`;
    }
    html += '</div>';
    return html;
  },
};
