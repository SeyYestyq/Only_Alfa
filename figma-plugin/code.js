// Only_Alfa — Master Figma Generator (Screens 1, 2, 3 + Design System + BRD Profiles)
// Compatible with Figma Desktop and Web Plugin API

(async function() {
  try {
    figma.notify("⏳ Генерация актуального дизайна Only_Alfa...");

    // Fonts loading
    try {
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      await figma.loadFontAsync({ family: "Inter", style: "Medium" });
      await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
      await figma.loadFontAsync({ family: "Inter", style: "Bold" });
    } catch (e) {
      console.log("Font load note:", e);
    }

    // Color Palette Tokens
    const C_ALFA_RED       = { r: 0.937, g: 0.192, b: 0.141 }; // #EF3124
    const C_ALFA_DARK      = { r: 0.788, g: 0.141, b: 0.102 }; // #C9241A
    const C_ANTHRACITE     = { r: 0.102, g: 0.114, b: 0.141 }; // #1A1D24
    const C_ANTHRACITE_SOFT= { r: 0.149, g: 0.169, b: 0.204 }; // #262B34
    const C_INK            = { r: 0.086, g: 0.102, b: 0.129 }; // #161A21
    const C_INK_MUTED      = { r: 0.373, g: 0.408, b: 0.459 }; // #5F6875
    const C_INK_FAINT      = { r: 0.545, g: 0.584, b: 0.639 }; // #8B95A3
    const C_BG             = { r: 0.973, g: 0.980, b: 0.988 }; // #F8FAFC
    const C_BG_ALT         = { r: 0.933, g: 0.949, b: 0.969 }; // #EEF2F7
    const C_SURFACE        = { r: 1.000, g: 1.000, b: 1.000 }; // #FFFFFF
    const C_BORDER         = { r: 0.890, g: 0.910, b: 0.937 }; // #E3E8EF
    const C_BORDER_STRONG  = { r: 0.812, g: 0.843, b: 0.890 }; // #CFD7E3
    const C_GREEN          = { r: 0.082, g: 0.580, b: 0.373 }; // #15945F
    const C_AMBER          = { r: 0.769, g: 0.478, b: 0.020 }; // #C47A05
    const C_BLUE           = { r: 0.145, g: 0.388, b: 0.659 }; // #2563A8
    const C_WHITE          = { r: 1.000, g: 1.000, b: 1.000 };

    function hexFill(c, op) {
      return [{ type: 'SOLID', color: c, opacity: (op !== undefined) ? op : 1 }];
    }

    function createSolidRect(parent, name, x, y, w, h, radius, fill, stroke, strokeW) {
      const rect = figma.createRectangle();
      rect.name = name;
      rect.x = x;
      rect.y = y;
      rect.resize(Math.max(1, w), Math.max(1, h));
      if (radius) rect.cornerRadius = radius;
      if (fill) rect.fills = fill;
      if (stroke) {
        rect.strokes = stroke;
        rect.strokeWeight = (strokeW !== undefined) ? strokeW : 1;
      }
      parent.appendChild(rect);
      return rect;
    }

    function createText(parent, name, x, y, textStr, size, weight, color, maxW, align) {
      const text = figma.createText();
      text.name = name;
      text.x = x;
      text.y = y;
      try {
        text.fontName = { family: "Inter", style: weight || "Regular" };
      } catch (e) {
        text.fontName = { family: "Inter", style: "Regular" };
      }
      text.characters = String(textStr || "");
      text.fontSize = size || 14;
      text.fills = hexFill(color || C_INK);
      if (maxW) {
        text.textAutoResize = "HEIGHT";
        text.resize(maxW, text.height);
      }
      if (align === "RIGHT") text.textAlignHorizontal = "RIGHT";
      if (align === "CENTER") text.textAlignHorizontal = "CENTER";
      parent.appendChild(text);
      return text;
    }

    function createBadge(parent, text, x, y, type) {
      const container = figma.createFrame();
      container.name = "Badge_" + text;
      container.x = x;
      container.y = y;
      container.layoutMode = "HORIZONTAL";
      container.primaryAxisSizingMode = "AUTO";
      container.counterAxisSizingMode = "AUTO";
      container.paddingLeft = 10;
      container.paddingRight = 10;
      container.paddingTop = 4;
      container.paddingBottom = 4;
      container.cornerRadius = 6;

      let bg = C_BG_ALT;
      let textColor = C_INK_MUTED;
      let stroke = null;

      if (type === "pill-risk") {
        bg = C_ALFA_RED;
        textColor = C_WHITE;
      } else if (type === "pill-good") {
        bg = C_GREEN;
        textColor = C_WHITE;
      } else if (type === "pill-warn") {
        bg = C_AMBER;
        textColor = C_WHITE;
      } else if (type === "pill-neutral") {
        bg = C_ANTHRACITE;
        textColor = C_WHITE;
      } else if (type === "pill-outline") {
        bg = C_WHITE;
        textColor = C_INK;
        stroke = hexFill(C_BORDER_STRONG);
      } else if (type === "pill-soft-good") {
        bg = { r: 0.90, g: 0.97, b: 0.93 };
        textColor = C_GREEN;
      } else if (type === "pill-soft-risk") {
        bg = { r: 0.99, g: 0.92, b: 0.91 };
        textColor = C_ALFA_RED;
      } else if (type === "pill-soft-warn") {
        bg = { r: 0.99, g: 0.96, b: 0.90 };
        textColor = C_AMBER;
      }

      container.fills = hexFill(bg);
      if (stroke) {
        container.strokes = stroke;
        container.strokeWeight = 1;
      }

      parent.appendChild(container);
      createText(container, "BadgeLabel", 0, 0, text, 11, "Semi Bold", textColor);
      return container;
    }

    function createButton(parent, label, x, y, w, h, variant) {
      const btn = figma.createFrame();
      btn.name = "Btn_" + label;
      btn.x = x;
      btn.y = y;
      btn.resize(w, h);
      btn.cornerRadius = 10;
      btn.layoutMode = "HORIZONTAL";
      btn.primaryAxisAlignItems = "CENTER";
      btn.counterAxisAlignItems = "CENTER";

      let bg = C_ALFA_RED;
      let textColor = C_WHITE;
      let stroke = null;

      if (variant === "secondary") {
        bg = C_ANTHRACITE;
        textColor = C_WHITE;
      } else if (variant === "outline") {
        bg = C_WHITE;
        textColor = C_INK;
        stroke = hexFill(C_BORDER_STRONG);
      } else if (variant === "ghost") {
        bg = C_BG_ALT;
        textColor = C_INK;
      }

      btn.fills = hexFill(bg);
      if (stroke) {
        btn.strokes = stroke;
        btn.strokeWeight = 1;
      }

      parent.appendChild(btn);
      createText(btn, "BtnLabel", 0, 0, label, 13, "Bold", textColor);
      return btn;
    }

    function createCard(parent, title, subtitle, x, y, w, h, badgeText, badgeType) {
      const card = figma.createFrame();
      card.name = "Card_" + title;
      card.x = x;
      card.y = y;
      card.resize(w, h);
      card.cornerRadius = 14;
      card.fills = hexFill(C_SURFACE);
      card.strokes = hexFill(C_BORDER);
      card.strokeWeight = 1;
      card.effects = [{
        type: "DROP_SHADOW",
        color: { r: 0.08, g: 0.10, b: 0.13, a: 0.05 },
        offset: { x: 0, y: 4 },
        radius: 12,
        visible: true,
        blendMode: "NORMAL"
      }];
      parent.appendChild(card);

      // Card Header
      if (title) {
        createText(card, "CardTitle", 24, 20, title, 16, "Bold", C_INK);
        if (subtitle) {
          createText(card, "CardSubtitle", 24, 44, subtitle, 12, "Regular", C_INK_MUTED, w - 160);
        }
        if (badgeText) {
          createBadge(card, badgeText, w - 130, 20, badgeType || "pill-outline");
        }
        createSolidRect(card, "CardDivider", 24, 72, w - 48, 1, 0, hexFill(C_BORDER));
      }
      return card;
    }

    // ==========================================
    // FRAME 0: DESIGN SYSTEM & TOKENS
    // ==========================================
    const frame0 = figma.createFrame();
    frame0.name = "🎨 00 — Design System & UI Kit Tokens";
    frame0.x = 0;
    frame0.y = 0;
    frame0.resize(1440, 960);
    frame0.fills = hexFill(C_BG);
    figma.currentPage.appendChild(frame0);

    // Header Frame 0
    createSolidRect(frame0, "F0_HeaderBG", 0, 0, 1440, 110, 0, hexFill(C_ANTHRACITE));
    createText(frame0, "F0_Super", 40, 24, "ONLY_ALFA DESIGN SYSTEM · TOKENS V3.0", 11, "Bold", C_ALFA_RED);
    createText(frame0, "F0_Title", 40, 46, "Библиотека компонентов и дизайн-токенов Альфа-Банка", 22, "Bold", C_WHITE);
    createText(frame0, "F0_Sub", 40, 78, "Спецификация для умного кредитного кабинета предпринимателя · Хакатон «Альфа-Будущее»", 13, "Regular", C_INK_FAINT);

    // Colors Palette Section
    createText(frame0, "F0_Sec1", 40, 140, "1. Фирменная цветовая палитра (Color Palette)", 16, "Bold", C_INK);
    const swatches = [
      { name: "Alfa Red", hex: "#EF3124", color: C_ALFA_RED, desc: "Primary Brand / Акцент" },
      { name: "Alfa Dark", hex: "#C9241A", color: C_ALFA_DARK, desc: "Hover / Active Red" },
      { name: "Anthracite", hex: "#1A1D24", color: C_ANTHRACITE, desc: "TopBar / Dark Headers" },
      { name: "Deep Ink", hex: "#161A21", color: C_INK, desc: "Заголовки / Основной текст" },
      { name: "Ink Muted", hex: "#5F6875", color: C_INK_MUTED, desc: "Вторичный текст / Подписи" },
      { name: "Green Good", hex: "#15945F", color: C_GREEN, desc: "Зеленый коридор / Одобрено" },
      { name: "Amber Warn", hex: "#C47A05", color: C_AMBER, desc: "Желтый коридор / Оффер" },
      { name: "Blue Info", hex: "#2563A8", color: C_BLUE, desc: "Инфо / Мультибанк / ЦБ" },
    ];

    swatches.forEach((sw, idx) => {
      const sx = 40 + (idx % 4) * 345;
      const sy = 175 + Math.floor(idx / 4) * 110;
      const card = createSolidRect(frame0, "Swatch_" + sw.name, sx, sy, 325, 95, 10, hexFill(C_SURFACE), hexFill(C_BORDER), 1);
      createSolidRect(frame0, "ColorBlob", sx + 14, sy + 14, 68, 68, 8, hexFill(sw.color));
      createText(frame0, "SwName", sx + 96, sy + 18, sw.name, 14, "Bold", C_INK);
      createText(frame0, "SwHex", sx + 96, sy + 40, sw.hex, 12, "Medium", C_INK_MUTED);
      createText(frame0, "SwDesc", sx + 96, sy + 62, sw.desc, 11, "Regular", C_INK_FAINT);
    });

    // 5 Risk Corridors Section
    createText(frame0, "F0_Sec2", 40, 420, "2. Коридоры скоринга и принятия решений (BRD v3.0)", 16, "Bold", C_INK);
    const corridors = [
      { name: "Зеленый коридор", score: "RiskScore 750 – 1000", tag: "АВТО-ОДОБРЕНИЕ", color: C_GREEN, desc: "Выдача без участия человека за 10 секунд. Оборотный кредит / возобновляемая линия." },
      { name: "Желтый коридор", score: "RiskScore 600 – 749", tag: "КОНТР-ОФФЕР", color: C_AMBER, desc: "Авто-коррекция суммы, срока или предложение дисконтирования инвойсов / факторинга." },
      { name: "Серый коридор", score: "RiskScore 450 – 599", tag: "ЗАЛОГ / АНДЕРРАЙТЕР", color: C_BLUE, desc: "Предложение обеспечения (залог оборудования) либо переход на ручной рентген андеррайтера." },
      { name: "Красный / Черный", score: "RiskScore < 450 / Hard Stop", tag: "ОТКАЗ С ЧЕК-ЛИСТОМ", color: C_ALFA_RED, desc: "Прозрачный список причин (судебные иски, налоговый долг) с понятной инструкцией исправления." },
    ];

    corridors.forEach((corr, idx) => {
      const cx = 40 + idx * 345;
      const cy = 455;
      const cFrame = createSolidRect(frame0, "Corr_" + corr.name, cx, cy, 325, 175, 12, hexFill(C_SURFACE), hexFill(C_BORDER), 1);
      createSolidRect(frame0, "CorrTopStrip", cx, cy, 325, 6, 0, hexFill(corr.color));
      createText(frame0, "CorrTitle", cx + 18, cy + 20, corr.name, 15, "Bold", C_INK);
      createBadge(frame0, corr.tag, cx + 18, cy + 46, corr.color === C_GREEN ? "pill-good" : (corr.color === C_AMBER ? "pill-warn" : (corr.color === C_ALFA_RED ? "pill-risk" : "pill-outline")));
      createText(frame0, "CorrScore", cx + 18, cy + 82, corr.score, 13, "Bold", corr.color);
      createText(frame0, "CorrDesc", cx + 18, cy + 108, corr.desc, 11, "Regular", C_INK_MUTED, 290);
    });

    // UI Atoms / Buttons / Badges / Metric Chips
    createText(frame0, "F0_Sec3", 40, 660, "3. Базовые компоненты UI Kit (Buttons, Badges, Metrics)", 16, "Bold", C_INK);
    createButton(frame0, "Получить решение", 40, 700, 180, 44, "primary");
    createButton(frame0, "Рентген инспектора", 235, 700, 180, 44, "secondary");
    createButton(frame0, "Обновить данные", 430, 700, 160, 44, "outline");
    createButton(frame0, "Подробнее", 605, 700, 130, 44, "ghost");

    // Badges Row
    createBadge(frame0, "ОДОБРЕНО", 760, 706, "pill-good");
    createBadge(frame0, "ВСТРЕЧНЫЙ ОФФЕР", 855, 706, "pill-warn");
    createBadge(frame0, "HARD STOP", 995, 706, "pill-risk");
    createBadge(frame0, "ООО", 1090, 706, "pill-neutral");
    createBadge(frame0, "ИНН 7701234567", 1145, 706, "pill-outline");

    // Metric Chips Example
    const mc1 = createSolidRect(frame0, "MC1", 40, 770, 325, 80, 10, hexFill(C_SURFACE), hexFill(C_BORDER), 1);
    createText(frame0, "MCLabel1", 56, 782, "Динамика выручки", 11, "Regular", C_INK_MUTED);
    createText(frame0, "MCVal1", 56, 804, "+18.4%", 22, "Bold", C_GREEN);
    createText(frame0, "MCSub1", 56, 832, "за последние 3 месяца", 11, "Regular", C_INK_FAINT);

    const mc2 = createSolidRect(frame0, "MC2", 385, 770, 325, 80, 10, hexFill(C_SURFACE), hexFill(C_BORDER), 1);
    createText(frame0, "MCLabel2", 401, 782, "RiskScore скоринг", 11, "Regular", C_INK_MUTED);
    createText(frame0, "MCVal2", 401, 804, "815 / 1000", 22, "Bold", C_GREEN);
    createText(frame0, "MCSub2", 401, 832, "Зеленый коридор надежности", 11, "Regular", C_GREEN);

    const mc3 = createSolidRect(frame0, "MC3", 730, 770, 325, 80, 10, hexFill(C_SURFACE), hexFill(C_BORDER), 1);
    createText(frame0, "MCLabel3", 746, 782, "Кассовый прогноз", 11, "Regular", C_INK_MUTED);
    createText(frame0, "MCVal3", 746, 804, "-850 000 ₽", 22, "Bold", C_ALFA_RED);
    createText(frame0, "MCSub3", 746, 832, "Разрыв на 42-й день (14 ноя)", 11, "Regular", C_ALFA_RED);

    const mc4 = createSolidRect(frame0, "MC4", 1075, 770, 325, 80, 10, hexFill(C_SURFACE), hexFill(C_BORDER), 1);
    createText(frame0, "MCLabel4", 1091, 782, "Мультибанк лимит", 11, "Regular", C_INK_MUTED);
    createText(frame0, "MCVal4", 1091, 804, "+2.5 млн ₽", 22, "Bold", C_BLUE);
    createText(frame0, "MCSub4", 1091, 832, "Сбербанк + Т-Банк подтверждены", 11, "Regular", C_BLUE);

    // ==========================================
    // FRAME 1: SCREEN 1 — ДАШБОРД ЗАЕМЩИКА (360°)
    // ==========================================
    const frame1 = figma.createFrame();
    frame1.name = "🖥️ 01 — Дашборд заемщика (360° портрет)";
    frame1.x = 1540;
    frame1.y = 0;
    frame1.resize(1440, 1420);
    frame1.fills = hexFill(C_BG);
    figma.currentPage.appendChild(frame1);

    // TopBar Demo Control
    createSolidRect(frame1, "F1_TopBar", 0, 0, 1440, 70, 0, hexFill(C_ANTHRACITE));
    createSolidRect(frame1, "F1_AlfaLogo", 28, 14, 42, 42, 10, hexFill(C_ALFA_RED));
    createText(frame1, "F1_LogoA", 42, 23, "А", 20, "Bold", C_WHITE);
    createText(frame1, "F1_BrandTitle", 82, 18, "Only_Alfa", 15, "Bold", C_WHITE);
    createText(frame1, "F1_BrandSub", 82, 38, "УМНЫЙ КРЕДИТНЫЙ КАБИНЕТ", 10, "Medium", C_INK_FAINT);

    // Screen Tabs in Topbar
    const tab1 = createSolidRect(frame1, "Tab1", 340, 17, 140, 36, 8, hexFill(C_ALFA_RED));
    createText(frame1, "Tab1_T", 356, 26, "1. 360° Кабинет", 12, "Bold", C_WHITE);
    const tab2 = createSolidRect(frame1, "Tab2", 490, 17, 140, 36, 8, hexFill({ r: 0.16, g: 0.18, b: 0.22 }));
    createText(frame1, "Tab2_T", 506, 26, "2. Заявка и оффер", 12, "Medium", C_INK_FAINT);
    const tab3 = createSolidRect(frame1, "Tab3", 640, 17, 160, 36, 8, hexFill({ r: 0.16, g: 0.18, b: 0.22 }));
    createText(frame1, "Tab3_T", 654, 26, "3. Рентген инспектора", 12, "Medium", C_INK_FAINT);

    // Profile Dropdown Pill in Topbar
    const profDrop = createSolidRect(frame1, "ProfDrop", 1100, 17, 200, 36, 8, hexFill({ r: 0.16, g: 0.18, b: 0.22 }));
    createText(frame1, "ProfDropT", 1115, 26, "ООО «Вектор» (815) ▼", 12, "Bold", C_WHITE);
    createBadge(frame1, "БИЗНЕС", 1320, 20, "pill-good");

    // Page Header Block
    const ph = createSolidRect(frame1, "F1_PageHeader", 0, 70, 1440, 130, 0, hexFill(C_SURFACE), hexFill(C_BORDER), 1);
    createBadge(frame1, "ООО", 40, 92, "pill-neutral");
    createBadge(frame1, "ИНН 7701234567", 95, 92, "pill-outline");
    createBadge(frame1, "ОКВЭД 62.01 (ИТ)", 215, 92, "pill-outline");
    createBadge(frame1, "Демо-профиль", 345, 92, "pill-risk");

    createText(frame1, "F1_CompName", 40, 122, "ООО «Вектор»", 24, "Bold", C_INK);
    createText(frame1, "F1_CompMeta", 40, 156, "Генеральный директор Иванов А.В. · Москва, Пресненская наб. 12 · Выручка в Альфе 18 400 000 ₽/мес · Остаток 3 240 000 ₽", 13, "Regular", C_INK_MUTED);

    // Dynamic revenue badge on right
    const revBadge = createSolidRect(frame1, "RevBadge", 1180, 92, 220, 85, 10, hexFill(C_BG), hexFill(C_BORDER), 1);
    createText(frame1, "RevB_L", 1198, 104, "Динамика выручки", 11, "Medium", C_INK_MUTED);
    createText(frame1, "RevB_V", 1198, 124, "+18.4%", 22, "Bold", C_GREEN);
    createText(frame1, "RevB_S", 1198, 152, "за 3 месяца в Альфа-Банке", 10, "Regular", C_INK_FAINT);

    // Left Column (width: 880) & Right Column (width: 460)
    // CARD 1: DNA Panel
    const cardDna = createCard(frame1, "🧬 ДНК бизнеса — 360° финансовый портрет", "Автоматический скоринг на основе транзакций и открытых реестров", 40, 225, 880, 200, "RiskScore 815", "pill-good");
    const dnaMetrics = [
      { label: "Выручка в Альфе", val: "18.4 млн ₽", sub: "+18% к прошлому кварталу", color: C_GREEN },
      { label: "Чистая маржинальность", val: "24.2%", sub: "Выше средней по ОКВЭД 62.01", color: C_GREEN },
      { label: "Устойчивость контрагентов", val: "94%", sub: "12 крупных заказчиков, 0 судов", color: C_GREEN },
      { label: "Индекс сезонности", val: "1.08x", sub: "Стабильный круглогодичный cashflow", color: C_BLUE }
    ];
    dnaMetrics.forEach((m, idx) => {
      const bx = 64 + idx * 205;
      const by = 320;
      createSolidRect(frame1, "DnaBox_" + idx, bx, by, 190, 85, 8, hexFill(C_BG), hexFill(C_BORDER), 1);
      createText(frame1, "DnaL_" + idx, bx + 12, by + 10, m.label, 11, "Medium", C_INK_MUTED);
      createText(frame1, "DnaV_" + idx, bx + 12, by + 30, m.val, 18, "Bold", m.color);
      createText(frame1, "DnaS_" + idx, bx + 12, by + 58, m.sub, 9, "Regular", C_INK_FAINT);
    });

    // CARD 2: Cash Forecast Chart (60 days)
    const cardCash = createCard(frame1, "📈 Прогноз кассы на 60 дней (Cash Forecast)", "Ежедневный остаток с учетом аренды, ФОТ и налогов · Красная зона — кассовый разрыв", 40, 445, 880, 280, "Зона разрыва на 42-й день", "pill-risk");
    // Draw visual chart axis & baseline
    createSolidRect(frame1, "ChartBase", 64, 630, 832, 1, 0, hexFill(C_BORDER_STRONG));
    createText(frame1, "Axis0", 64, 636, "Сегодня: 3.2M ₽", 10, "Medium", C_INK_MUTED);
    createText(frame1, "Axis30", 440, 636, "День 30: 1.1M ₽", 10, "Medium", C_INK_MUTED);
    createText(frame1, "Axis42", 590, 636, "День 42: -850 000 ₽ (Разрыв!)", 10, "Bold", C_ALFA_RED);
    createText(frame1, "Axis60", 800, 636, "День 60: +1.8M ₽", 10, "Medium", C_INK_MUTED);

    // Visual Chart Bars simulating cash flow
    const barsData = [
      { x: 70, h: 65, c: C_GREEN }, { x: 120, h: 58, c: C_GREEN }, { x: 170, h: 52, c: C_GREEN },
      { x: 220, h: 48, c: C_GREEN }, { x: 270, h: 42, c: C_GREEN }, { x: 320, h: 36, c: C_GREEN },
      { x: 370, h: 30, c: C_GREEN }, { x: 420, h: 22, c: C_GREEN }, { x: 470, h: 14, c: C_GREEN },
      { x: 520, h: 8,  c: C_AMBER }, { x: 570, h: 25, c: C_ALFA_RED, gap: true }, { x: 620, h: 35, c: C_ALFA_RED, gap: true },
      { x: 670, h: 18, c: C_GREEN }, { x: 720, h: 32, c: C_GREEN }, { x: 770, h: 45, c: C_GREEN },
      { x: 820, h: 55, c: C_GREEN }
    ];
    barsData.forEach((b) => {
      const barY = b.gap ? 631 : (630 - b.h);
      createSolidRect(frame1, "Bar", b.x, barY, 32, b.h, 4, hexFill(b.c));
    });

    // Alert inside Cash Card
    const cashAlert = createSolidRect(frame1, "CashAlert", 64, 530, 832, 44, 8, hexFill({ r: 0.99, g: 0.92, b: 0.91 }), hexFill(C_ALFA_RED), 1);
    createText(frame1, "CashAlertT", 78, 544, "⚠️ Обнаружен прогнозируемый кассовый разрыв 14 ноября (-850 000 ₽). Рекомендуем предодобренный оборотный кредит 1.5 млн ₽ под 19.5%.", 12, "Bold", C_ALFA_RED);

    // CARD 3: Smart Invoices & Factoring
    const cardInv = createCard(frame1, "📄 Умный факторинг и распознавание PDF-счетов", "Драг-н-дроп загрузка счетов · Мгновенный OCR-парсинг и антифрод проверка контрагента", 40, 745, 880, 290, "PDF распознан", "pill-good");
    const invDrop = createSolidRect(frame1, "InvDrop", 64, 830, 832, 90, 8, hexFill(C_BG), hexFill(C_BORDER), 1);
    createText(frame1, "InvDropT1", 80, 846, "📄 Счёт № 184 от 19 октября · Поставщик ООО «СерверТех» (ИНН 7720987654)", 13, "Bold", C_INK);
    createText(frame1, "InvDropT2", 80, 870, "Сумма счёта: 2 400 000 ₽ (в т.ч. НДС 400 000 ₽) · Назначение: Оплата серверного оборудования Supermicro", 12, "Regular", C_INK_MUTED);
    createBadge(frame1, "ЕГРЮЛ: НАДЕЖНЫЙ", 730, 844, "pill-good");
    createBadge(frame1, "НДС ПОДТВЕРЖДЕН", 730, 872, "pill-good");

    // Financing options for this invoice
    const invOpt = createSolidRect(frame1, "InvOpt", 64, 935, 832, 80, 8, hexFill(C_SURFACE), hexFill(C_BORDER_STRONG), 1);
    createText(frame1, "InvOptT", 80, 948, "Доступно финансирование под данный счёт за 10 секунд:", 12, "Medium", C_INK_MUTED);
    createText(frame1, "InvOptVal", 80, 970, "Одобрено 2 040 000 ₽ (85% от инвойса) под 1.4% в месяц", 15, "Bold", C_INK);
    createButton(frame1, "Оплатить за счёт Альфы", 670, 950, 210, 40, "primary");

    // CARD 4: Transactions Table
    const cardTx = createCard(frame1, "💳 Последние операции по расчетному счету", "Прямая выписка из АБС Альфа-Банка в режиме реального времени", 40, 1055, 880, 320);
    const txHeaders = ["ДАТА / ВРЕМЯ", "КОНТРАГЕНТ / НАЗНАЧЕНИЕ", "КАТЕГОРИЯ", "СУММА (₽)", "СТАТУС"];
    const txX = [64, 180, 520, 680, 800];
    txHeaders.forEach((th, idx) => {
      createText(frame1, "TH_" + idx, txX[idx], 1140, th, 10, "Bold", C_INK_FAINT);
    });
    createSolidRect(frame1, "TxDiv0", 64, 1160, 832, 1, 0, hexFill(C_BORDER));

    const txRows = [
      { dt: "21.10 14:22", name: "ПАО «Газпром Нефть» (Оплата услуг ПО)", cat: "Поступление", sum: "+3 840 000 ₽", st: "Зачислено", c: C_GREEN },
      { dt: "20.10 11:05", name: "МИФНС №45 по г. Москве (НДС за 3 кв.)", cat: "Налоги", sum: "-620 000 ₽", st: "Исполнено", c: C_INK },
      { dt: "19.10 16:40", name: "ООО «Метрополис Плаза» (Аренда офиса)", cat: "Аренда", sum: "-450 000 ₽", st: "Исполнено", c: C_INK },
      { dt: "18.10 09:12", name: "Зарплатный проект (ФОТ за 1-ю половину)", cat: "Зарплата", sum: "-1 120 000 ₽", st: "Исполнено", c: C_INK }
    ];
    txRows.forEach((r, idx) => {
      const ry = 1175 + idx * 45;
      createText(frame1, "TxD_" + idx, txX[0], ry, r.dt, 11, "Regular", C_INK_MUTED);
      createText(frame1, "TxN_" + idx, txX[1], ry, r.name, 12, "Bold", C_INK);
      createText(frame1, "TxC_" + idx, txX[2], ry, r.cat, 11, "Medium", C_INK_MUTED);
      createText(frame1, "TxS_" + idx, txX[3], ry, r.sum, 13, "Bold", r.c);
      createBadge(frame1, r.st, txX[4], ry - 2, "pill-good");
      createSolidRect(frame1, "TxDiv_" + idx, 64, ry + 32, 832, 1, 0, hexFill(C_BORDER));
    });

    // ==========================================
    // RIGHT COLUMN: SMART SEARCH, APP FORM, RADAR
    // ==========================================
    // CARD 5: Smart Search
    const cardSearch = createCard(frame1, "🔍 Умный AI-поиск по потребностям", "Естественный язык и анализ кассового разрыва", 940, 225, 460, 220);
    const searchInput = createSolidRect(frame1, "SearchInput", 964, 310, 412, 46, 10, hexFill(C_BG), hexFill(C_BORDER_STRONG), 1);
    createText(frame1, "SearchText", 980, 324, "💬 Нужны деньги на закупку серверов…", 13, "Medium", C_INK);

    // Search Intent Chips
    createText(frame1, "ChipsLabel", 964, 370, "Популярные сценарии финансирования:", 11, "Medium", C_INK_FAINT);
    createBadge(frame1, "Закрыть кассовый разрыв", 964, 395, "pill-outline");
    createBadge(frame1, "Пополнить оборотку", 1145, 395, "pill-outline");
    createBadge(frame1, "Факторинг под инвойс", 964, 425, "pill-outline");
    createBadge(frame1, "Инвест-кредит", 1125, 425, "pill-outline");

    // CARD 6: One-Click Application Form
    const cardApp = createCard(frame1, "⚡ Экспресс-заявка за 10 секунд", "Авто-расчет платежа и ставки онлайн", 940, 465, 460, 440, "Ставка 19.5%", "pill-good");
    // Amount Slider
    createText(frame1, "AppL1", 964, 550, "Сумма кредита", 11, "Medium", C_INK_MUTED);
    createText(frame1, "AppV1", 1230, 546, "3 000 000 ₽", 16, "Bold", C_ALFA_RED);
    createSolidRect(frame1, "SliderTrack1", 964, 575, 412, 6, 3, hexFill(C_BORDER));
    createSolidRect(frame1, "SliderFill1", 964, 575, 250, 6, 3, hexFill(C_ALFA_RED));
    createSolidRect(frame1, "SliderThumb1", 1210, 570, 16, 16, 8, hexFill(C_ALFA_RED));

    // Term Slider
    createText(frame1, "AppL2", 964, 610, "Срок финансирования", 11, "Medium", C_INK_MUTED);
    createText(frame1, "AppV2", 1270, 606, "12 мес.", 16, "Bold", C_INK);
    createSolidRect(frame1, "SliderTrack2", 964, 635, 412, 6, 3, hexFill(C_BORDER));
    createSolidRect(frame1, "SliderFill2", 964, 635, 180, 6, 3, hexFill(C_ANTHRACITE));
    createSolidRect(frame1, "SliderThumb2", 1140, 630, 16, 16, 8, hexFill(C_ANTHRACITE));

    // Product Select
    createText(frame1, "AppL3", 964, 670, "Кредитный продукт", 11, "Medium", C_INK_MUTED);
    const prodBox = createSolidRect(frame1, "ProdBox", 964, 695, 412, 44, 8, hexFill(C_BG), hexFill(C_BORDER), 1);
    createText(frame1, "ProdBoxT", 980, 708, "💼 Оборотный кредит (без залога) · 19.5%", 13, "Bold", C_INK);

    // Monthly payment calculation box
    const calcBox = createSolidRect(frame1, "CalcBox", 964, 760, 412, 70, 10, hexFill({ r: 0.95, g: 0.97, b: 1.0 }), hexFill(C_BLUE), 1);
    createText(frame1, "CalcL", 980, 772, "ЕЖЕМЕСЯЧНЫЙ ПЛАТЕЖ", 10, "Bold", C_BLUE);
    createText(frame1, "CalcV", 980, 792, "277 150 ₽ / мес.", 20, "Bold", C_INK);
    createText(frame1, "CalcSub", 1220, 796, "КС ЦБ 21.0%", 12, "Medium", C_BLUE);

    createButton(frame1, "Получить мгновенное решение →", 964, 850, 412, 46, "primary");

    // CARD 7: Risk Radar
    const cardRadar = createCard(frame1, "📡 Радар финансовых рисков", "Предупреждение критических ситуаций бизнеса", 940, 925, 460, 230);
    const r1 = createSolidRect(frame1, "R1", 964, 1010, 412, 60, 8, hexFill({ r: 0.99, g: 0.96, b: 0.90 }), hexFill(C_AMBER), 1);
    createText(frame1, "R1_T", 978, 1020, "⚠️ Налоговый платеж (НДС) через 12 дней", 12, "Bold", C_AMBER);
    createText(frame1, "R1_S", 978, 1042, "Ожидаемая сумма списания 940 000 ₽. Резерв на счете достаточен.", 11, "Regular", C_INK_MUTED);

    const r2 = createSolidRect(frame1, "R2", 964, 1080, 412, 60, 8, hexFill({ r: 0.90, g: 0.97, b: 0.93 }), hexFill(C_GREEN), 1);
    createText(frame1, "R2_T", 978, 1090, "✅ Кредитная нагрузка (DTI) в норме: 22%", 12, "Bold", C_GREEN);
    createText(frame1, "R2_S", 978, 1112, "Максимальный допустимый порог для ИТ-сектора: 45%.", 11, "Regular", C_INK_MUTED);

    // CARD 8: News / Updates
    const cardNews = createCard(frame1, "📰 События и регуляторные обновления", "Интеграции и возможности", 940, 1175, 460, 200);
    createText(frame1, "News1_T", 964, 1260, "• Доступно увеличение кредитного лимита до 5.5 млн ₽", 12, "Bold", C_INK);
    createText(frame1, "News1_S", 976, 1280, "Подключите передачу данных по счетам из других банков через Open Banking API.", 11, "Regular", C_INK_MUTED, 390);
    createText(frame1, "News2_T", 964, 1315, "• Ключевая ставка ЦБ РФ сохранена на уровне 21.0%", 12, "Bold", C_INK);
    createText(frame1, "News2_S", 976, 1335, "Ставки по льготным программам для МСП субсидируются банком.", 11, "Regular", C_INK_MUTED, 390);

    // ==========================================
    // FRAME 2: SCREEN 2 — ЭКСПРЕСС-ЗАЯВКА И ОФФЕР
    // ==========================================
    const frame2 = figma.createFrame();
    frame2.name = "📝 02 — Экспресс-заявка и онлайн-решение";
    frame2.x = 3080;
    frame2.y = 0;
    frame2.resize(1440, 1420);
    frame2.fills = hexFill(C_BG);
    figma.currentPage.appendChild(frame2);

    // TopBar
    createSolidRect(frame2, "F2_TopBar", 0, 0, 1440, 70, 0, hexFill(C_ANTHRACITE));
    createSolidRect(frame2, "F2_AlfaLogo", 28, 14, 42, 42, 10, hexFill(C_ALFA_RED));
    createText(frame2, "F2_LogoA", 42, 23, "А", 20, "Bold", C_WHITE);
    createText(frame2, "F2_BrandTitle", 82, 18, "Only_Alfa", 15, "Bold", C_WHITE);
    createText(frame2, "F2_BrandSub", 82, 38, "УМНЫЙ КРЕДИТНЫЙ КАБИНЕТ", 10, "Medium", C_INK_FAINT);

    // Tabs
    const f2tab1 = createSolidRect(frame2, "F2_Tab1", 340, 17, 140, 36, 8, hexFill({ r: 0.16, g: 0.18, b: 0.22 }));
    createText(frame2, "F2_Tab1_T", 356, 26, "1. 360° Кабинет", 12, "Medium", C_INK_FAINT);
    const f2tab2 = createSolidRect(frame2, "F2_Tab2", 490, 17, 140, 36, 8, hexFill(C_ALFA_RED));
    createText(frame2, "F2_Tab2_T", 506, 26, "2. Заявка и оффер", 12, "Bold", C_WHITE);
    const f2tab3 = createSolidRect(frame2, "F2_Tab3", 640, 17, 160, 36, 8, hexFill({ r: 0.16, g: 0.18, b: 0.22 }));
    createText(frame2, "F2_Tab3_T", 654, 26, "3. Рентген инспектора", 12, "Medium", C_INK_FAINT);

    // Page Header Block
    createSolidRect(frame2, "F2_PageHeader", 0, 70, 1440, 130, 0, hexFill(C_SURFACE), hexFill(C_BORDER), 1);
    createBadge(frame2, "ОДОБРЕНО", 40, 92, "pill-good");
    createBadge(frame2, "Оборотный кредит", 135, 92, "pill-outline");
    createBadge(frame2, "ID #ALFA-8841-B", 275, 92, "pill-outline");

    createText(frame2, "F2_Title", 40, 122, "Заявка на финансирование · 3 000 000 ₽", 24, "Bold", C_INK);
    createText(frame2, "F2_Meta", 40, 156, "ООО «Вектор» · ИНН 7701234567 · Заявка сформирована 21 октября 2026, 14:32:05 (авто-скоринг 8 сек)", 13, "Regular", C_INK_MUTED);

    createButton(frame2, "Рентген инспектора →", 1070, 110, 170, 42, "secondary");
    createButton(frame2, "В кабинет", 1260, 110, 140, 42, "outline");

    // SECTION 1: Passport Panel (Checks)
    const cardPass = createCard(frame2, "🛡️ Паспорт заемщика — Результаты 5 скоринг-проверок", "Автоматическая валидация по государственным базам данных без участия андеррайтера", 40, 225, 1360, 210, "RiskScore 815 / 1000", "pill-good");
    const checks = [
      { name: "1. ЕГРЮЛ / ЕГРИП", val: "CLEAR", desc: "Действующее, возраст 4.8 лет, учредители без дисквалификаций", color: C_GREEN },
      { name: "2. ФССП (Приставы)", val: "PASS", desc: "0 исполнительных производств, задолженности отсутствуют", color: C_GREEN },
      { name: "3. Картотека №2", val: "CLEAR", desc: "0 неоплаченных требований к счету за последние 12 месяцев", color: C_GREEN },
      { name: "4. ФНС (Налоги)", val: "CLEAR", desc: "Задолженностей по налогам и сборам нет, отчетность сдана", color: C_GREEN },
      { name: "5. БКИ (Кредитная история)", val: "815 БАЛЛОВ", desc: "Безупречная платежная дисциплина, закрыто 4 кредита без просрочек", color: C_GREEN }
    ];
    checks.forEach((ch, idx) => {
      const bx = 64 + idx * 262;
      const by = 320;
      createSolidRect(frame2, "CheckB_" + idx, bx, by, 250, 95, 8, hexFill(C_BG), hexFill(C_BORDER), 1);
      createText(frame2, "CheckT_" + idx, bx + 12, by + 12, ch.name, 12, "Bold", C_INK);
      createBadge(frame2, ch.val, bx + 12, by + 34, "pill-soft-good");
      createText(frame2, "CheckD_" + idx, bx + 12, by + 64, ch.desc, 10, "Regular", C_INK_MUTED, 226);
    });

    // SECTION 2: Multibank Integration
    const cardMulti = createCard(frame2, "🏦 Мультибанк (Open Banking Integration)", "Расширение кредитного лимита за счет агрегации оборотов из сторонних банков", 40, 455, 1360, 160, "+2.5 млн ₽ к лимиту", "pill-outline");
    const mBank1 = createSolidRect(frame2, "MB1", 64, 535, 630, 60, 8, hexFill({ r: 0.94, g: 0.98, b: 0.95 }), hexFill(C_GREEN), 1);
    createText(frame2, "MB1_T", 80, 546, "🟢 Сбербанк: Оборот 4 200 000 ₽ / мес.", 13, "Bold", C_INK);
    createText(frame2, "MB1_S", 80, 568, "Выписка подтверждена по Open Banking API · Добавлен дополнительный лимит +1 500 000 ₽", 11, "Regular", C_INK_MUTED);

    const mBank2 = createSolidRect(frame2, "MB2", 710, 535, 630, 60, 8, hexFill({ r: 0.94, g: 0.98, b: 0.95 }), hexFill(C_GREEN), 1);
    createText(frame2, "MB2_T", 726, 546, "🟡 Т-Банк: Оборот 2 800 000 ₽ / мес.", 13, "Bold", C_INK);
    createText(frame2, "MB2_S", 726, 568, "Выписка подтверждена по Open Banking API · Добавлен дополнительный лимит +1 000 000 ₽", 11, "Regular", C_INK_MUTED);

    // SECTION 3: Counter-Offers Panel
    const cardOffers = createCard(frame2, "🤝 Доступные кредитные предложения (Встречные офферы)", "Выберите подходящую конфигурацию условий финансирования", 40, 635, 1360, 310);
    const offers = [
      {
        title: "Оффер 1 (Рекомендованный)",
        tag: "ВЫБРАН КЛИЕНТОМ",
        sum: "3 000 000 ₽",
        rate: "19.5% годовых",
        term: "12 месяцев",
        pay: "277 150 ₽ / мес.",
        sec: "Без залога и поручительства",
        color: C_ALFA_RED,
        selected: true
      },
      {
        title: "Оффер 2 (Расширенный лимит)",
        tag: "С МУЛЬТИБАНКОМ",
        sum: "5 500 000 ₽",
        rate: "18.0% годовых",
        term: "24 месяца",
        pay: "274 300 ₽ / мес.",
        sec: "Поручительство генерального директора",
        color: C_GREEN,
        selected: false
      },
      {
        title: "Оффер 3 (Кредитная линия)",
        tag: "ОВЕРДРАФТ",
        sum: "1 500 000 ₽",
        rate: "20.5% годовых",
        term: "Возобновляемый 6 мес.",
        pay: "Проценты только за факт долга",
        sec: "Привязка к расчетному счету в Альфе",
        color: C_BLUE,
        selected: false
      }
    ];

    offers.forEach((o, idx) => {
      const ox = 64 + idx * 440;
      const oy = 720;
      const oCard = createSolidRect(frame2, "Offer_" + idx, ox, oy, 420, 205, 12, hexFill(C_SURFACE), hexFill(o.selected ? C_ALFA_RED : C_BORDER_STRONG), o.selected ? 2 : 1);
      if (o.selected) {
        createSolidRect(frame2, "SelStrip", ox, oy, 420, 6, 0, hexFill(C_ALFA_RED));
      }
      createText(frame2, "OTitle_" + idx, ox + 18, oy + 18, o.title, 14, "Bold", C_INK);
      createBadge(frame2, o.tag, ox + 280, oy + 14, o.selected ? "pill-risk" : "pill-outline");

      createText(frame2, "OSum_" + idx, ox + 18, oy + 46, o.sum, 24, "Bold", C_INK);
      createText(frame2, "ORate_" + idx, ox + 18, oy + 82, "Ставка: " + o.rate + " · Срок: " + o.term, 12, "Medium", C_INK_MUTED);
      createText(frame2, "OPay_" + idx, ox + 18, oy + 104, "Платеж: " + o.pay, 13, "Bold", o.color);
      createText(frame2, "OSec_" + idx, ox + 18, oy + 128, "Обеспечение: " + o.sec, 11, "Regular", C_INK_FAINT);

      createButton(frame2, o.selected ? "Выбрано ✓" : "Выбрать этот вариант", ox + 18, oy + 155, 384, 38, o.selected ? "primary" : "outline");
    });

    // SECTION 4: Signing & OTP Panel
    const cardSign = createCard(frame2, "✍️ Подписание договора и зачисление средств", "Без визита в банк · Простая электронная подпись (КЭП / SMS-код)", 40, 965, 1360, 420);
    const signBox = createSolidRect(frame2, "SignBox", 64, 1050, 1312, 310, 12, hexFill(C_BG), hexFill(C_BORDER), 1);

    createText(frame2, "SignStep1", 90, 1075, "1. Индивидуальные условия договора № KRED-8841-B сформированы", 15, "Bold", C_INK);
    createText(frame2, "SignDoc1", 90, 1102, "📄 Договор кредитной линии на сумму 3 000 000 ₽ (PDF, 4 страницы) · График платежей", 12, "Medium", C_BLUE);

    createText(frame2, "SignStep2", 90, 1140, "2. Введите СМС-код для подписания", 15, "Bold", C_INK);
    createText(frame2, "SignOtpSub", 90, 1165, "Одноразовый проверочный код отправлен на номер директора: +7 (999) ***-**-12", 12, "Regular", C_INK_MUTED);

    // 4 OTP Boxes
    [0, 1, 2, 3].forEach((pos) => {
      const digit = ["4", "8", "2", "9"][pos];
      createSolidRect(frame2, "Otp_" + pos, 90 + pos * 65, 1195, 52, 56, 8, hexFill(C_SURFACE), hexFill(C_ALFA_RED), 2);
      createText(frame2, "OtpD_" + pos, 108 + pos * 65, 1208, digit, 24, "Bold", C_INK);
    });

    createText(frame2, "SignAgree", 90, 1270, "☑️ С условиями договора ознакомлен и согласен. Подтверждаю целевое назначение средств.", 12, "Medium", C_INK);

    createButton(frame2, "Подписать договор и получить 3 000 000 ₽ на счёт →", 90, 1300, 480, 46, "primary");
    createBadge(frame2, "ЗАЧИСЛЕНИЕ ЗА 30 СЕКУНД", 590, 1310, "pill-good");

    // ==========================================
    // FRAME 3: SCREEN 3 — РЕНТГЕН ИНСПЕКТОРА
    // ==========================================
    const frame3 = figma.createFrame();
    frame3.name = "🔬 03 — Рентген андеррайтера (Экран банка)";
    frame3.x = 4620;
    frame3.y = 0;
    frame3.resize(1440, 1420);
    frame3.fills = hexFill(C_BG);
    figma.currentPage.appendChild(frame3);

    // TopBar
    createSolidRect(frame3, "F3_TopBar", 0, 0, 1440, 70, 0, hexFill(C_ANTHRACITE));
    createSolidRect(frame3, "F3_AlfaLogo", 28, 14, 42, 42, 10, hexFill(C_ALFA_RED));
    createText(frame3, "F3_LogoA", 42, 23, "А", 20, "Bold", C_WHITE);
    createText(frame3, "F3_BrandTitle", 82, 18, "Only_Alfa", 15, "Bold", C_WHITE);
    createText(frame3, "F3_BrandSub", 82, 38, "УМНЫЙ КРЕДИТНЫЙ КАБИНЕТ", 10, "Medium", C_INK_FAINT);

    // Tabs
    const f3tab1 = createSolidRect(frame3, "F3_Tab1", 340, 17, 140, 36, 8, hexFill({ r: 0.16, g: 0.18, b: 0.22 }));
    createText(frame3, "F3_Tab1_T", 356, 26, "1. 360° Кабинет", 12, "Medium", C_INK_FAINT);
    const f3tab2 = createSolidRect(frame3, "F3_Tab2", 490, 17, 140, 36, 8, hexFill({ r: 0.16, g: 0.18, b: 0.22 }));
    createText(frame3, "F3_Tab2_T", 506, 26, "2. Заявка и оффер", 12, "Medium", C_INK_FAINT);
    const f3tab3 = createSolidRect(frame3, "F3_Tab3", 640, 17, 160, 36, 8, hexFill(C_ALFA_RED));
    createText(frame3, "F3_Tab3_T", 654, 26, "3. Рентген инспектора", 12, "Bold", C_WHITE);

    createBadge(frame3, "РЕЖИМ БАНКА", 1300, 20, "pill-risk");

    // Page Header Block
    createSolidRect(frame3, "F3_PageHeader", 0, 70, 1440, 130, 0, hexFill(C_SURFACE), hexFill(C_BORDER), 1);
    createBadge(frame3, "Экран 3 · Банк", 40, 92, "pill-risk");
    createBadge(frame3, "Оборотный кредит", 150, 92, "pill-outline");
    createBadge(frame3, "ID #ALFA-8841-B", 290, 92, "pill-outline");

    createText(frame3, "F3_Title", 40, 122, "Рентген заявки: ООО «Вектор» (ИНН 7701234567)", 24, "Bold", C_INK);
    createText(frame3, "F3_Meta", 40, 156, "RiskScore 815 · Статус: АВТО-ОДОБРЕНО · Ставка 19.5% · КС ЦБ 21.0% (субсидированная ставка)", 13, "Regular", C_INK_MUTED);

    createButton(frame3, "К заявке клиента", 1260, 110, 140, 42, "outline");

    // SECTION 1: Underwriter Action Bar
    const cardActions = createCard(frame3, "⚖️ Панель управления андеррайтера (Underwriter Override)", "Возможность ручного переопределения решения алгоритма с записью в неизменяемый аудит-лог", 40, 225, 1360, 140);
    createButton(frame3, "✓ Подтвердить одобрение", 64, 300, 220, 44, "primary");
    createButton(frame3, "Корректировать лимит", 298, 300, 200, 44, "secondary");
    createButton(frame3, "Запросить доп. документы", 512, 300, 220, 44, "outline");
    createButton(frame3, "Отклонить заявку", 746, 300, 170, 44, "ghost");

    const commInput = createSolidRect(frame3, "CommInput", 930, 300, 446, 44, 8, hexFill(C_BG), hexFill(C_BORDER), 1);
    createText(frame3, "CommT", 946, 314, "Комментарий андеррайтера для аудита…", 12, "Medium", C_INK_MUTED);

    // SECTION 2: Waterfall Scoring (5 Factors)
    const cardWater = createCard(frame3, "📊 Waterfall скоринга (Scoring Waterfall Chart)", "Базовый скор 500 + пять детерминированных факторов (BRD v3.0) · Без диапазонов и скрытых весов", 40, 385, 880, 320, "815 / 1000", "pill-good");
    const factors = [
      { name: "Базовый скор", val: "500", h: 100, c: C_ANTHRACITE, sub: "Стартовая база" },
      { name: "Выручка (+18%)", val: "+120", h: 70, c: C_GREEN, sub: "Динамика и объем" },
      { name: "БКИ история", val: "+95", h: 60, c: C_GREEN, sub: "0 просрочек" },
      { name: "Альфа-обороты", val: "+70", h: 50, c: C_GREEN, sub: "Лояльность банку" },
      { name: "Контрагенты", val: "+30", h: 30, c: C_GREEN, sub: "Диверсификация" },
      { name: "Итоговый скор", val: "815", h: 130, c: C_GREEN, sub: "Зеленый коридор" }
    ];
    factors.forEach((f, idx) => {
      const fx = 64 + idx * 135;
      const barY = 630 - f.h;
      createSolidRect(frame3, "WBar_" + idx, fx, barY, 100, f.h, 6, hexFill(f.c));
      createText(frame3, "WVal_" + idx, fx + 10, barY - 22, f.val, 14, "Bold", f.c);
      createText(frame3, "WName_" + idx, fx, 640, f.name, 11, "Bold", C_INK);
      createText(frame3, "WSub_" + idx, fx, 658, f.sub, 9, "Regular", C_INK_MUTED);
    });

    // SECTION 3: Bank P&L Economics
    const cardPnl = createCard(frame3, "💰 P&L сделки глазами банка (Deal Economics)", "Расчет маржинальности и стоимости риска по кредиту 3.0M ₽ на 12 мес.", 940, 385, 460, 320, "RAROC 28.4%", "pill-good");
    const pnlRows = [
      { name: "Процентный доход банка (19.5%)", val: "+412 000 ₽", c: C_GREEN },
      { name: "Стоимость фондирования (FTP 16.5%)", val: "-280 000 ₽", c: C_INK },
      { name: "Стоимость риска (EL / Резервы)", val: "-35 000 ₽", c: C_INK },
      { name: "Операционные расходы банка", val: "-12 000 ₽", c: C_INK },
      { name: "Чистый финансовый результат", val: "+85 000 ₽", c: C_GREEN, bold: true }
    ];
    pnlRows.forEach((r, idx) => {
      const ry = 475 + idx * 42;
      createText(frame3, "PnlN_" + idx, 964, ry, r.name, 12, r.bold ? "Bold" : "Regular", C_INK);
      createText(frame3, "PnlV_" + idx, 1310, ry, r.val, 13, "Bold", r.c, 80, "RIGHT");
      createSolidRect(frame3, "PnlDiv_" + idx, 964, ry + 28, 412, 1, 0, hexFill(C_BORDER));
    });

    // SECTION 4: Geo Analytics Panel
    const cardGeo = createCard(frame3, "🗺️ Гео-аналитика и пешеходный трафик (Geo Risk Engine)", "Оценка надежности локации бизнеса: Москва, Пресненская наб. 12", 40, 725, 660, 340);
    const geoMetrics = [
      { l: "Индекс проходимости", v: "8.8 / 10", s: "Высокий пешеходный трафик (420 чел/час)", c: C_GREEN },
      { l: "Конкурентная среда", v: "Низкий риск", s: "Отсутствует прямая каннибализация спроса", c: C_GREEN },
      { l: "Устойчивость локации", v: "A+", s: "Стабильный бизнес-район (Москва-Сити)", c: C_BLUE }
    ];
    geoMetrics.forEach((g, idx) => {
      const gy = 815 + idx * 75;
      const gBox = createSolidRect(frame3, "GeoB_" + idx, 64, gy, 612, 62, 8, hexFill(C_BG), hexFill(C_BORDER), 1);
      createText(frame3, "GeoL_" + idx, 80, gy + 12, g.l, 11, "Medium", C_INK_MUTED);
      createText(frame3, "GeoV_" + idx, 80, gy + 32, g.v, 16, "Bold", g.c);
      createText(frame3, "GeoS_" + idx, 260, gy + 34, g.s, 11, "Regular", C_INK);
    });

    // SECTION 5: Audit Trail Event Log
    const cardLog = createCard(frame3, "📜 Audit Trail — Неизменяемый журнал событий скоринга", "Полная трассировка решений Decision Engine и проверок систем в миллисекундах", 720, 725, 680, 340);
    const logs = [
      { time: "14:32:01.102", ev: "Инициация экспресс-заявки клиентом из Дашборда (Сумма: 3.0M ₽)", ms: "0.00s" },
      { time: "14:32:01.215", ev: "Запрос в ЕГРЮЛ: ЮЛ действующее, директор Иванов А.В. подтвержден", ms: "0.11s" },
      { time: "14:32:01.440", ev: "Запрос в БКИ: RiskScore 815, просрочек нет, нагрузка 22%", ms: "0.22s" },
      { time: "14:32:01.590", ev: "Decision Engine: Зеленый коридор (>750). Авто-одобрение без залога", ms: "0.15s" },
      { time: "14:32:01.625", ev: "Сформированы 3 встречных оффера и проект договора в PDF", ms: "0.03s" }
    ];
    logs.forEach((lg, idx) => {
      const ly = 815 + idx * 52;
      createText(frame3, "LogTime_" + idx, 744, ly, lg.time, 11, "Medium", C_INK_FAINT);
      createText(frame3, "LogEv_" + idx, 840, ly, lg.ev, 11, "Bold", C_INK, 480);
      createBadge(frame3, lg.ms, 1340, ly - 4, "pill-outline");
      createSolidRect(frame3, "LogDiv_" + idx, 744, ly + 36, 632, 1, 0, hexFill(C_BORDER));
    });

    // SECTION 6: Anomaly Detector
    const cardAnom = createCard(frame3, "🛡️ Валидатор аномалий и антифрод", "Проверка на накрутку оборотов и фиктивные транзакции", 40, 1085, 1360, 200, "Аномалий не обнаружено", "pill-good");
    const anomItems = [
      { t: "Круговые транзакции", s: "Проверка графа расчетов: замкнутых петель и дробления оборотов не выявлено.", ok: true },
      { t: "Всплески оборота", s: "Рост выручки +18% подтвержден реальными договорами с ПАО «Газпром Нефть».", ok: true },
      { t: "Судебная активность", s: "В картотеке арбитражных дел и ФССП исков за последние 3 года нет.", ok: true }
    ];
    anomItems.forEach((ai, idx) => {
      const ax = 64 + idx * 440;
      const ab = createSolidRect(frame3, "AnomB_" + idx, ax, 1175, 420, 85, 8, hexFill({ r: 0.94, g: 0.98, b: 0.95 }), hexFill(C_GREEN), 1);
      createText(frame3, "AnomT_" + idx, ax + 14, 1188, "✅ " + ai.t, 13, "Bold", C_INK);
      createText(frame3, "AnomS_" + idx, ax + 14, 1214, ai.s, 11, "Regular", C_INK_MUTED, 390);
    });

    // ==========================================
    // FRAME 4: 5 ДЕМО-ПРОФИЛЕЙ BRD & МАТРИЦА
    // ==========================================
    const frame4 = figma.createFrame();
    frame4.name = "👥 04 — 5 Демо-профилей BRD (Матрица решений)";
    frame4.x = 1540;
    frame4.y = 1470;
    frame4.resize(1440, 720);
    frame4.fills = hexFill(C_BG);
    figma.currentPage.appendChild(frame4);

    createSolidRect(frame4, "F4_HeaderBG", 0, 0, 1440, 90, 0, hexFill(C_ANTHRACITE));
    createText(frame4, "F4_Super", 40, 20, "ЭТАЛОННЫЕ СЦЕНАРИИ ТЕСТИРОВАНИЯ И СКОРИНГА (BRD V3.0)", 11, "Bold", C_ALFA_RED);
    createText(frame4, "F4_Title", 40, 42, "Матрица 5 контрольных профилей заемщиков", 20, "Bold", C_WHITE);

    const demoProfiles = [
      {
        name: "1. ООО «Вектор»",
        inn: "ИНН 7701234567",
        score: "RiskScore 815",
        corr: "ЗЕЛЕНЫЙ КОРИДОР",
        decision: "АВТО-ОДОБРЕНИЕ 3 000 000 ₽",
        rate: "Ставка: 19.5% · 12 мес.",
        desc: "ИТ-разработка, выручка 18.4 млн/мес, рост +18%, безупречная БКИ, низкая нагрузка DTI 22%. Мгновенная выдача без залога.",
        c: C_GREEN,
        badgeType: "pill-good"
      },
      {
        name: "2. ИП Иванов А.С.",
        inn: "ИНН 500198765432",
        score: "RiskScore 610",
        corr: "ЖЕЛТЫЙ КОРИДОР",
        decision: "КОНТР-ОФФЕР 1 200 000 ₽",
        rate: "Ставка: 22.0% · 6 мес.",
        desc: "Розничная торговля, запрос 2.0M ₽. Алгоритм снизил лимит до 1.2M ₽ для сохранения платежеспособности без риска дефолта.",
        c: C_AMBER,
        badgeType: "pill-warn"
      },
      {
        name: "3. ООО «Ромашка»",
        inn: "ИНН 7725112233",
        score: "RiskScore 760",
        corr: "ЗЕЛЕНЫЙ КОРИДОР",
        decision: "ОВЕРДРАФТ 1 500 000 ₽",
        rate: "Ставка: 20.0% · 12 мес.",
        desc: "Сезонный оптовый бизнес. Успешный скоринг, подключен факторинг под дебиторку и предодобренный лимит овердрафта.",
        c: C_GREEN,
        badgeType: "pill-good"
      },
      {
        name: "4. ООО «Технопром»",
        inn: "ИНН 7805445566",
        score: "RiskScore 495",
        corr: "СЕРЫЙ КОРИДОР",
        decision: "ЗАЛОГ / АНДЕРРАЙТЕР",
        rate: "Ставка: 23.5% · 18 мес.",
        desc: "Производство. Нагрузка DTI 42%, выручка колеблется. Одобрение доступно при условии залога оборудования или поручительства.",
        c: C_BLUE,
        badgeType: "pill-outline"
      },
      {
        name: "5. ООО «Однодневка»",
        inn: "ИНН 7709998877",
        score: "RiskScore 210",
        corr: "ЧЕРНЫЙ / HARD STOP",
        decision: "ОТКАЗ С ЧЕК-ЛИСТОМ",
        rate: "Отказ системы за 0.12 сек",
        desc: "Массовый директор, судебные иски ФССП на 4.2 млн ₽, задолженность перед ФНС. Мгновенный отказ с прозрачным чек-листом причин.",
        c: C_ALFA_RED,
        badgeType: "pill-risk"
      }
    ];

    demoProfiles.forEach((p, idx) => {
      const px = 40 + idx * 275;
      const py = 120;
      const pCard = createSolidRect(frame4, "DP_" + idx, px, py, 260, 560, 12, hexFill(C_SURFACE), hexFill(C_BORDER), 1);
      createSolidRect(frame4, "DPTop_" + idx, px, py, 260, 6, 0, hexFill(p.c));

      createText(frame4, "DPName_" + idx, px + 16, py + 20, p.name, 14, "Bold", C_INK);
      createText(frame4, "DPInn_" + idx, px + 16, py + 42, p.inn, 11, "Medium", C_INK_FAINT);

      createBadge(frame4, p.corr, px + 16, py + 72, p.badgeType);
      createText(frame4, "DPScore_" + idx, px + 16, py + 115, p.score, 18, "Bold", p.c);

      const dBox = createSolidRect(frame4, "DBox_" + idx, px + 16, py + 155, 228, 70, 8, hexFill(C_BG), hexFill(C_BORDER), 1);
      createText(frame4, "DPTag_" + idx, px + 24, py + 166, "РЕШЕНИЕ СИСТЕМЫ:", 9, "Bold", C_INK_FAINT);
      createText(frame4, "DPDec_" + idx, px + 24, py + 184, p.decision, 11, "Bold", p.c, 210);
      createText(frame4, "DPRate_" + idx, px + 24, py + 204, p.rate, 10, "Medium", C_INK_MUTED);

      createText(frame4, "DPDesc_" + idx, px + 16, py + 245, p.desc, 12, "Regular", C_INK, 228);
    });

    // Viewport zoom
    figma.viewport.scrollAndZoomIntoView([frame0, frame1, frame2, frame3, frame4]);

    figma.notify("✨ Актуальный дизайн «Only_Alfa: Умный кредитный кабинет» успешно отрисован в Фигме!");
  } catch (err) {
    figma.notify("❌ Ошибка отрисовки: " + err.message, { error: true });
    console.error(err);
  } finally {
    figma.closePlugin();
  }
})();
