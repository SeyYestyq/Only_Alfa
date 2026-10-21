// Only_Alfa — Master Figma Generator with Vector Icons (Iconimate Style)
// Full 5 Frames with native SVG icons, Alfa design system, and BRD v3.0 specs

(async function() {
  try {
    figma.notify("⏳ Генерация актуального дизайна с иконками Iconimate...");

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

    function colorToHex(c) {
      const r = Math.round(c.r * 255).toString(16).padStart(2, '0');
      const g = Math.round(c.g * 255).toString(16).padStart(2, '0');
      const b = Math.round(c.b * 255).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }

    // Iconimate Vector SVG Dictionary
    const ICONS = {
      activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      trendingUp: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="16 7 22 7 22 13" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      trendingDown: '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="16 17 22 17 22 11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      fileText: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="14 2 14 8 20 8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="16" y1="13" x2="8" y2="13" stroke-width="2" stroke-linecap="round"/><line x1="16" y1="17" x2="8" y2="17" stroke-width="2" stroke-linecap="round"/>',
      creditCard: '<rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="1" y1="10" x2="23" y2="10" stroke-width="2"/>',
      search: '<circle cx="11" cy="11" r="8" stroke-width="2"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke-width="2" stroke-linecap="round"/>',
      zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      radar: '<path d="M12 2a10 10 0 1 0 10 10" stroke-width="2" stroke-linecap="round"/><path d="M12 6a6 6 0 1 0 6 6" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="2" fill="currentColor"/>',
      shieldCheck: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="9 12 11 14 15 10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      landmark: '<line x1="3" y1="22" x2="21" y2="22" stroke-width="2"/><line x1="6" y1="18" x2="6" y2="11" stroke-width="2"/><line x1="10" y1="18" x2="10" y2="11" stroke-width="2"/><line x1="14" y1="18" x2="14" y2="11" stroke-width="2"/><line x1="18" y1="18" x2="18" y2="11" stroke-width="2"/><polygon points="12 2 20 7 4 7" stroke-width="2" stroke-linejoin="round"/>',
      handshake: '<path d="m11 17 2 2a1 1 0 0 0 1.4 0l4.3-4.3a1 1 0 0 0 0-1.4l-2.6-2.6a1 1 0 0 0-1.4 0l-1.7 1.7" stroke-width="2" stroke-linecap="round"/><path d="m3 11 2-2a1 1 0 0 1 1.4 0l4.3 4.3a1 1 0 0 1 0 1.4l-2.6 2.6a1 1 0 0 1-1.4 0L5 15" stroke-width="2" stroke-linecap="round"/>',
      signature: '<path d="M20 19v-4a2 2 0 0 0-2-2h-3" stroke-width="2" stroke-linecap="round"/><path d="M4 19c2-1 4-1 6 0s4 1 6 0" stroke-width="2" stroke-linecap="round"/><path d="M7 11V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4" stroke-width="2" stroke-linecap="round"/>',
      barChart: '<line x1="12" y1="20" x2="12" y2="10" stroke-width="2" stroke-linecap="round"/><line x1="18" y1="20" x2="18" y2="4" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="20" x2="6" y2="16" stroke-width="2" stroke-linecap="round"/>',
      scale: '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" stroke-width="2"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" stroke-width="2"/><path d="M7 21h10" stroke-width="2"/><path d="M12 3v18" stroke-width="2"/>',
      coins: '<circle cx="8" cy="8" r="6" stroke-width="2"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18" stroke-width="2"/><path d="M7 6h4" stroke-width="2"/><path d="M7 10h4" stroke-width="2"/>',
      mapPin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke-width="2"/><circle cx="12" cy="10" r="3" stroke-width="2"/>',
      clock: '<circle cx="12" cy="12" r="10" stroke-width="2"/><polyline points="12 6 12 12 16 14" stroke-width="2" stroke-linecap="round"/>',
      bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke-width="2"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke-width="2"/>',
      users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke-width="2"/><circle cx="9" cy="7" r="4" stroke-width="2"/><path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke-width="2"/><path d="M16 3.13a4 4 0 0 1 0 7.75" stroke-width="2"/>',
      checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke-width="2" stroke-linecap="round"/><polyline points="22 4 12 14.01 9 11.01" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      alertTriangle: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke-width="2" stroke-linecap="round"/>'
    };

    function createVectorIcon(parent, iconName, x, y, size = 20, color = C_INK, bgContainer = null) {
      const hex = colorToHex(color);
      const innerSvg = ICONS[iconName] || ICONS.activity;
      const svgString = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${hex}">${innerSvg}</svg>`;

      let targetParent = parent;
      let offsetX = x;
      let offsetY = y;

      if (bgContainer) {
        const badge = figma.createFrame();
        badge.name = "IconBadge_" + iconName;
        badge.x = x;
        badge.y = y;
        badge.resize(bgContainer.size || 34, bgContainer.size || 34);
        badge.cornerRadius = bgContainer.radius || 8;
        badge.fills = hexFill(bgContainer.bg || C_BG_ALT);
        if (bgContainer.border) {
          badge.strokes = hexFill(bgContainer.border);
          badge.strokeWeight = 1;
        }
        parent.appendChild(badge);
        targetParent = badge;
        offsetX = Math.round(((bgContainer.size || 34) - size) / 2);
        offsetY = Math.round(((bgContainer.size || 34) - size) / 2);
      }

      try {
        const node = figma.createNodeFromSvg(svgString);
        node.name = "Icon_" + iconName;
        node.x = offsetX;
        node.y = offsetY;
        targetParent.appendChild(node);
        return node;
      } catch (err) {
        console.log("SVG parse error:", err);
        return null;
      }
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

    function createButton(parent, label, x, y, w, h, variant, iconName = null) {
      const btn = figma.createFrame();
      btn.name = "Btn_" + label;
      btn.x = x;
      btn.y = y;
      btn.resize(w, h);
      btn.cornerRadius = 10;
      btn.layoutMode = "HORIZONTAL";
      btn.primaryAxisAlignItems = "CENTER";
      btn.counterAxisAlignItems = "CENTER";
      btn.itemSpacing = 8;

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

      if (iconName) {
        createVectorIcon(btn, iconName, 0, 0, 16, textColor);
      }
      createText(btn, "BtnLabel", 0, 0, label, 13, "Bold", textColor);
      return btn;
    }

    function createCard(parent, title, subtitle, x, y, w, h, badgeText, badgeType, iconName, iconColor) {
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

      let textStartX = 24;
      if (iconName) {
        createVectorIcon(card, iconName, 24, 20, 20, iconColor || C_ALFA_RED, {
          size: 38,
          radius: 10,
          bg: { r: (iconColor || C_ALFA_RED).r, g: (iconColor || C_ALFA_RED).g, b: (iconColor || C_ALFA_RED).b },
          border: null
        });
        textStartX = 74;
      }

      // Card Header
      if (title) {
        createText(card, "CardTitle", textStartX, 20, title, 16, "Bold", C_INK);
        if (subtitle) {
          createText(card, "CardSubtitle", textStartX, 44, subtitle, 12, "Regular", C_INK_MUTED, w - textStartX - 140);
        }
        if (badgeText) {
          createBadge(card, badgeText, w - 140, 20, badgeType || "pill-outline");
        }
        createSolidRect(card, "CardDivider", 24, 72, w - 48, 1, 0, hexFill(C_BORDER));
      }
      return card;
    }

    // ==========================================
    // FRAME 0: DESIGN SYSTEM & ICONIMATE ICONS
    // ==========================================
    const frame0 = figma.createFrame();
    frame0.name = "🎨 00 — Design System & Iconimate Icon Library";
    frame0.x = 0;
    frame0.y = 0;
    frame0.resize(1440, 1080);
    frame0.fills = hexFill(C_BG);
    figma.currentPage.appendChild(frame0);

    createSolidRect(frame0, "F0_HeaderBG", 0, 0, 1440, 110, 0, hexFill(C_ANTHRACITE));
    createVectorIcon(frame0, "activity", 40, 36, 32, C_ALFA_RED);
    createText(frame0, "F0_Super", 84, 24, "ONLY_ALFA DESIGN SYSTEM · ICONIMATE SVG ICONS", 11, "Bold", C_ALFA_RED);
    createText(frame0, "F0_Title", 84, 46, "Библиотека компонентов и анимированных иконок Iconimate", 22, "Bold", C_WHITE);
    createText(frame0, "F0_Sub", 84, 78, "Чистая геометрия, векторные контуры 24×24 и фирменная палитра Альфа-Банка", 13, "Regular", C_INK_FAINT);

    // Color Swatches Section
    createText(frame0, "F0_Sec1", 40, 135, "1. Фирменная палитра Альфа-Банка", 16, "Bold", C_INK);
    const swatches = [
      { name: "Alfa Red", hex: "#EF3124", color: C_ALFA_RED, desc: "Primary / Акцент бренда" },
      { name: "Anthracite", hex: "#1A1D24", color: C_ANTHRACITE, desc: "TopBar / Тёмные хедеры" },
      { name: "Deep Ink", hex: "#161A21", color: C_INK, desc: "Заголовки и текст" },
      { name: "Green Good", hex: "#15945F", color: C_GREEN, desc: "Зеленый коридор / Одобрено" },
      { name: "Amber Warn", hex: "#C47A05", color: C_AMBER, desc: "Желтый коридор / Оффер" },
      { name: "Blue Info", hex: "#2563A8", color: C_BLUE, desc: "Инфо / Мультибанк / ЦБ" },
    ];
    swatches.forEach((sw, idx) => {
      const sx = 40 + idx * 230;
      const sy = 165;
      createSolidRect(frame0, "Sw_" + idx, sx, sy, 215, 80, 10, hexFill(C_SURFACE), hexFill(C_BORDER), 1);
      createSolidRect(frame0, "Blob_" + idx, sx + 12, sy + 14, 52, 52, 8, hexFill(sw.color));
      createText(frame0, "SwN_" + idx, sx + 74, sy + 18, sw.name, 13, "Bold", C_INK);
      createText(frame0, "SwH_" + idx, sx + 74, sy + 38, sw.hex, 11, "Medium", C_INK_MUTED);
      createText(frame0, "SwD_" + idx, sx + 74, sy + 54, sw.desc, 9, "Regular", C_INK_FAINT);
    });

    // ICONIMATE GALLERY SECTION
    createText(frame0, "F0_SecIcons", 40, 275, "2. Векторные иконки Iconimate (24×24 Geometric SVG)", 16, "Bold", C_INK);
    createText(frame0, "F0_SecIconsSub", 40, 298, "Перенесены из библиотеки https://iconimate.app/ — нативные векторные контуры без эмодзи", 12, "Regular", C_INK_MUTED);

    const iconGallery = [
      { id: "activity", title: "Activity", cat: "ДНК бизнеса", color: C_ALFA_RED },
      { id: "trendingUp", title: "TrendingUp", cat: "Рост выручки", color: C_GREEN },
      { id: "trendingDown", title: "TrendingDown", cat: "Кассовый разрыв", color: C_ALFA_RED },
      { id: "fileText", title: "FileText", cat: "PDF-инвойсы", color: C_BLUE },
      { id: "creditCard", title: "CreditCard", cat: "Транзакции", color: C_INK },
      { id: "search", title: "Search", cat: "Умный AI-поиск", color: C_BLUE },
      { id: "zap", title: "Zap", cat: "Экспресс 10с", color: C_AMBER },
      { id: "radar", title: "Radar", cat: "Радар рисков", color: C_ALFA_RED },
      { id: "shieldCheck", title: "ShieldCheck", cat: "Паспорт заемщика", color: C_GREEN },
      { id: "landmark", title: "Landmark", cat: "Мультибанк", color: C_BLUE },
      { id: "handshake", title: "Handshake", cat: "Встречные офферы", color: C_AMBER },
      { id: "signature", title: "Signature", cat: "Подписание КЭП", color: C_GREEN },
      { id: "barChart", title: "BarChart", cat: "Waterfall скоринга", color: C_BLUE },
      { id: "scale", title: "Scale", cat: "Андеррайтер", color: C_ANTHRACITE },
      { id: "coins", title: "Coins", cat: "P&L банка", color: C_GREEN },
      { id: "mapPin", title: "MapPin", cat: "Гео-аналитика", color: C_BLUE },
      { id: "clock", title: "Clock", cat: "Audit Trail лог", color: C_INK_MUTED },
      { id: "bell", title: "Bell", cat: "Уведомления", color: C_AMBER },
      { id: "users", title: "Users", cat: "5 демо-профилей", color: C_INK },
      { id: "checkCircle", title: "CheckCircle", cat: "Статус PASS", color: C_GREEN },
      { id: "alertTriangle", title: "AlertTriangle", cat: "Предупреждение", color: C_AMBER }
    ];

    iconGallery.forEach((ic, idx) => {
      const col = idx % 7;
      const row = Math.floor(idx / 7);
      const ix = 40 + col * 195;
      const iy = 330 + row * 95;

      const iCard = createSolidRect(frame0, "IC_" + ic.id, ix, iy, 185, 82, 10, hexFill(C_SURFACE), hexFill(C_BORDER), 1);
      createVectorIcon(frame0, ic.id, ix + 14, iy + 14, 24, ic.color, {
        size: 40,
        radius: 8,
        bg: { r: ic.color.r, g: ic.color.g, b: ic.color.b },
        border: null
      });
      createText(frame0, "IT_" + ic.id, ix + 66, iy + 22, ic.title, 13, "Bold", C_INK);
      createText(frame0, "ICat_" + ic.id, ix + 66, iy + 42, ic.cat, 11, "Medium", C_INK_MUTED);
    });

    // Risk Corridors Section
    createText(frame0, "F0_Sec2", 40, 650, "3. Коридоры скоринга и принятия решений (BRD v3.0)", 16, "Bold", C_INK);
    const corridors = [
      { name: "Зеленый коридор", score: "RiskScore 750 – 1000", tag: "АВТО-ОДОБРЕНИЕ", color: C_GREEN, icon: "checkCircle", desc: "Выдача без участия человека за 10 секунд. Оборотный кредит / возобновляемая линия." },
      { name: "Желтый коридор", score: "RiskScore 600 – 749", tag: "КОНТР-ОФФЕР", color: C_AMBER, icon: "handshake", desc: "Авто-коррекция суммы, срока или предложение дисконтирования инвойсов / факторинга." },
      { name: "Серый коридор", score: "RiskScore 450 – 599", tag: "ЗАЛОГ / АНДЕРРАЙТЕР", color: C_BLUE, icon: "scale", desc: "Предложение обеспечения (залог оборудования) либо переход на ручной рентген андеррайтера." },
      { name: "Красный / Черный", score: "RiskScore < 450 / Hard Stop", tag: "ОТКАЗ С ЧЕК-ЛИСТОМ", color: C_ALFA_RED, icon: "alertTriangle", desc: "Прозрачный список причин (судебные иски, налоговый долг) с понятной инструкцией исправления." },
    ];
    corridors.forEach((corr, idx) => {
      const cx = 40 + idx * 345;
      const cy = 685;
      createSolidRect(frame0, "Corr_" + corr.name, cx, cy, 325, 175, 12, hexFill(C_SURFACE), hexFill(C_BORDER), 1);
      createSolidRect(frame0, "CorrTopStrip", cx, cy, 325, 6, 0, hexFill(corr.color));
      createVectorIcon(frame0, corr.icon, cx + 18, cy + 20, 20, corr.color);
      createText(frame0, "CorrTitle", cx + 46, cy + 20, corr.name, 15, "Bold", C_INK);
      createBadge(frame0, corr.tag, cx + 18, cy + 50, corr.color === C_GREEN ? "pill-good" : (corr.color === C_AMBER ? "pill-warn" : (corr.color === C_ALFA_RED ? "pill-risk" : "pill-outline")));
      createText(frame0, "CorrScore", cx + 18, cy + 86, corr.score, 13, "Bold", corr.color);
      createText(frame0, "CorrDesc", cx + 18, cy + 112, corr.desc, 11, "Regular", C_INK_MUTED, 290);
    });

    // Buttons with Vector Icons
    createText(frame0, "F0_Sec3", 40, 890, "4. Компоненты UI Kit с нативными векторными иконками", 16, "Bold", C_INK);
    createButton(frame0, "Получить решение", 40, 925, 200, 44, "primary", "zap");
    createButton(frame0, "Рентген инспектора", 255, 925, 200, 44, "secondary", "scale");
    createButton(frame0, "Загрузить инвойс", 470, 925, 190, 44, "outline", "fileText");
    createButton(frame0, "Подписать КЭП", 675, 925, 180, 44, "ghost", "signature");

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

    // TopBar
    createSolidRect(frame1, "F1_TopBar", 0, 0, 1440, 70, 0, hexFill(C_ANTHRACITE));
    createSolidRect(frame1, "F1_AlfaLogo", 28, 14, 42, 42, 10, hexFill(C_ALFA_RED));
    createText(frame1, "F1_LogoA", 42, 23, "А", 20, "Bold", C_WHITE);
    createText(frame1, "F1_BrandTitle", 82, 18, "Only_Alfa", 15, "Bold", C_WHITE);
    createText(frame1, "F1_BrandSub", 82, 38, "УМНЫЙ КРЕДИТНЫЙ КАБИНЕТ", 10, "Medium", C_INK_FAINT);

    // Screen Tabs in Topbar
    createSolidRect(frame1, "Tab1", 340, 17, 140, 36, 8, hexFill(C_ALFA_RED));
    createVectorIcon(frame1, "activity", 352, 25, 18, C_WHITE);
    createText(frame1, "Tab1_T", 376, 26, "1. 360° Кабинет", 12, "Bold", C_WHITE);

    createSolidRect(frame1, "Tab2", 490, 17, 140, 36, 8, hexFill({ r: 0.16, g: 0.18, b: 0.22 }));
    createVectorIcon(frame1, "zap", 502, 25, 18, C_INK_FAINT);
    createText(frame1, "Tab2_T", 526, 26, "2. Заявка и оффер", 12, "Medium", C_INK_FAINT);

    createSolidRect(frame1, "Tab3", 640, 17, 160, 36, 8, hexFill({ r: 0.16, g: 0.18, b: 0.22 }));
    createVectorIcon(frame1, "scale", 652, 25, 18, C_INK_FAINT);
    createText(frame1, "Tab3_T", 676, 26, "3. Рентген инспектора", 12, "Medium", C_INK_FAINT);

    createSolidRect(frame1, "ProfDrop", 1100, 17, 200, 36, 8, hexFill({ r: 0.16, g: 0.18, b: 0.22 }));
    createText(frame1, "ProfDropT", 1115, 26, "ООО «Вектор» (815) ▼", 12, "Bold", C_WHITE);
    createBadge(frame1, "БИЗНЕС", 1320, 20, "pill-good");

    // Page Header Block
    createSolidRect(frame1, "F1_PageHeader", 0, 70, 1440, 130, 0, hexFill(C_SURFACE), hexFill(C_BORDER), 1);
    createBadge(frame1, "ООО", 40, 92, "pill-neutral");
    createBadge(frame1, "ИНН 7701234567", 95, 92, "pill-outline");
    createBadge(frame1, "ОКВЭД 62.01 (ИТ)", 215, 92, "pill-outline");
    createBadge(frame1, "Демо-профиль", 345, 92, "pill-risk");

    createText(frame1, "F1_CompName", 40, 122, "ООО «Вектор»", 24, "Bold", C_INK);
    createText(frame1, "F1_CompMeta", 40, 156, "Генеральный директор Иванов А.В. · Москва, Пресненская наб. 12 · Выручка в Альфе 18 400 000 ₽/мес · Остаток 3 240 000 ₽", 13, "Regular", C_INK_MUTED);

    const revBadge = createSolidRect(frame1, "RevBadge", 1180, 92, 220, 85, 10, hexFill(C_BG), hexFill(C_BORDER), 1);
    createVectorIcon(frame1, "trendingUp", 1198, 104, 20, C_GREEN);
    createText(frame1, "RevB_L", 1226, 104, "Динамика выручки", 11, "Medium", C_INK_MUTED);
    createText(frame1, "RevB_V", 1198, 126, "+18.4%", 22, "Bold", C_GREEN);
    createText(frame1, "RevB_S", 1198, 152, "за 3 месяца в Альфа-Банке", 10, "Regular", C_INK_FAINT);

    // Left Column (880px)
    // CARD 1: DNA Panel with Activity Icon
    createCard(frame1, "ДНК бизнеса — 360° финансовый портрет", "Автоматический скоринг на основе транзакций и открытых реестров", 40, 225, 880, 200, "RiskScore 815", "pill-good", "activity", C_ALFA_RED);
    const dnaMetrics = [
      { label: "Выручка в Альфе", val: "18.4 млн ₽", sub: "+18% к прошлому кварталу", color: C_GREEN, icon: "trendingUp" },
      { label: "Чистая маржинальность", val: "24.2%", sub: "Выше средней по ОКВЭД 62.01", color: C_GREEN, icon: "coins" },
      { label: "Устойчивость контрагентов", val: "94%", sub: "12 крупных заказчиков, 0 судов", color: C_GREEN, icon: "shieldCheck" },
      { label: "Индекс сезонности", val: "1.08x", sub: "Стабильный круглогодичный cashflow", color: C_BLUE, icon: "barChart" }
    ];
    dnaMetrics.forEach((m, idx) => {
      const bx = 64 + idx * 205;
      const by = 320;
      createSolidRect(frame1, "DnaBox_" + idx, bx, by, 190, 85, 8, hexFill(C_BG), hexFill(C_BORDER), 1);
      createVectorIcon(frame1, m.icon, bx + 12, by + 10, 16, m.color);
      createText(frame1, "DnaL_" + idx, bx + 34, by + 10, m.label, 11, "Medium", C_INK_MUTED);
      createText(frame1, "DnaV_" + idx, bx + 12, by + 32, m.val, 18, "Bold", m.color);
      createText(frame1, "DnaS_" + idx, bx + 12, by + 60, m.sub, 9, "Regular", C_INK_FAINT);
    });

    // CARD 2: Cash Forecast with TrendingDown Icon
    createCard(frame1, "Прогноз кассы на 60 дней (Cash Forecast)", "Ежедневный остаток с учетом аренды, ФОТ и налогов · Красная зона — кассовый разрыв", 40, 445, 880, 280, "Разрыв на 42-й день", "pill-risk", "trendingDown", C_ALFA_RED);
    createSolidRect(frame1, "ChartBase", 64, 630, 832, 1, 0, hexFill(C_BORDER_STRONG));
    createText(frame1, "Axis0", 64, 636, "Сегодня: 3.2M ₽", 10, "Medium", C_INK_MUTED);
    createText(frame1, "Axis30", 440, 636, "День 30: 1.1M ₽", 10, "Medium", C_INK_MUTED);
    createText(frame1, "Axis42", 590, 636, "День 42: -850 000 ₽ (Разрыв!)", 10, "Bold", C_ALFA_RED);
    createText(frame1, "Axis60", 800, 636, "День 60: +1.8M ₽", 10, "Medium", C_INK_MUTED);

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

    createSolidRect(frame1, "CashAlert", 64, 530, 832, 44, 8, hexFill({ r: 0.99, g: 0.92, b: 0.91 }), hexFill(C_ALFA_RED), 1);
    createVectorIcon(frame1, "alertTriangle", 78, 542, 20, C_ALFA_RED);
    createText(frame1, "CashAlertT", 106, 544, "Обнаружен прогнозируемый кассовый разрыв 14 ноября (-850 000 ₽). Рекомендуем предодобренный оборотный кредит 1.5 млн ₽ под 19.5%.", 12, "Bold", C_ALFA_RED);

    // CARD 3: Smart Invoices with FileText Icon
    createCard(frame1, "Умный факторинг и распознавание PDF-счетов", "Драг-н-дроп загрузка счетов · Мгновенный OCR-парсинг и антифрод проверка контрагента", 40, 745, 880, 290, "PDF распознан", "pill-good", "fileText", C_BLUE);
    createSolidRect(frame1, "InvDrop", 64, 830, 832, 90, 8, hexFill(C_BG), hexFill(C_BORDER), 1);
    createVectorIcon(frame1, "fileText", 80, 846, 24, C_BLUE);
    createText(frame1, "InvDropT1", 112, 846, "Счёт № 184 от 19 октября · Поставщик ООО «СерверТех» (ИНН 7720987654)", 13, "Bold", C_INK);
    createText(frame1, "InvDropT2", 112, 870, "Сумма счёта: 2 400 000 ₽ (в т.ч. НДС 400 000 ₽) · Назначение: Оплата серверного оборудования Supermicro", 12, "Regular", C_INK_MUTED);
    createBadge(frame1, "ЕГРЮЛ: НАДЕЖНЫЙ", 730, 844, "pill-good");
    createBadge(frame1, "НДС ПОДТВЕРЖДЕН", 730, 872, "pill-good");

    createSolidRect(frame1, "InvOpt", 64, 935, 832, 80, 8, hexFill(C_SURFACE), hexFill(C_BORDER_STRONG), 1);
    createText(frame1, "InvOptT", 80, 948, "Доступно финансирование под данный счёт за 10 секунд:", 12, "Medium", C_INK_MUTED);
    createText(frame1, "InvOptVal", 80, 970, "Одобрено 2 040 000 ₽ (85% от инвойса) под 1.4% в месяц", 15, "Bold", C_INK);
    createButton(frame1, "Оплатить за счёт Альфы", 650, 950, 230, 40, "primary", "zap");

    // CARD 4: Transactions Table with CreditCard Icon
    createCard(frame1, "Последние операции по расчетному счету", "Прямая выписка из АБС Альфа-Банка в режиме реального времени", 40, 1055, 880, 320, null, null, "creditCard", C_INK);
    const txHeaders = ["ДАТА / ВРЕМЯ", "КОНТРАГЕНТ / НАЗНАЧЕНИЕ", "КАТЕГОРИЯ", "СУММА (₽)", "СТАТУС"];
    const txX = [64, 180, 520, 680, 800];
    txHeaders.forEach((th, idx) => {
      createText(frame1, "TH_" + idx, txX[idx], 1140, th, 10, "Bold", C_INK_FAINT);
    });
    createSolidRect(frame1, "TxDiv0", 64, 1160, 832, 1, 0, hexFill(C_BORDER));

    const txRows = [
      { dt: "21.10 14:22", name: "ПАО «Газпром Нефть» (Оплата услуг ПО)", cat: "Поступление", sum: "+3 840 000 ₽", st: "Зачислено", c: C_GREEN, icon: "trendingUp" },
      { dt: "20.10 11:05", name: "МИФНС №45 по г. Москве (НДС за 3 кв.)", cat: "Налоги", sum: "-620 000 ₽", st: "Исполнено", c: C_INK, icon: "creditCard" },
      { dt: "19.10 16:40", name: "ООО «Метрополис Плаза» (Аренда офиса)", cat: "Аренда", sum: "-450 000 ₽", st: "Исполнено", c: C_INK, icon: "landmark" },
      { dt: "18.10 09:12", name: "Зарплатный проект (ФОТ за 1-ю половину)", cat: "Зарплата", sum: "-1 120 000 ₽", st: "Исполнено", c: C_INK, icon: "users" }
    ];
    txRows.forEach((r, idx) => {
      const ry = 1175 + idx * 45;
      createText(frame1, "TxD_" + idx, txX[0], ry, r.dt, 11, "Regular", C_INK_MUTED);
      createVectorIcon(frame1, r.icon, txX[1], ry + 2, 14, r.c);
      createText(frame1, "TxN_" + idx, txX[1] + 20, ry, r.name, 12, "Bold", C_INK);
      createText(frame1, "TxC_" + idx, txX[2], ry, r.cat, 11, "Medium", C_INK_MUTED);
      createText(frame1, "TxS_" + idx, txX[3], ry, r.sum, 13, "Bold", r.c);
      createBadge(frame1, r.st, txX[4], ry - 2, "pill-good");
      createSolidRect(frame1, "TxDiv_" + idx, 64, ry + 32, 832, 1, 0, hexFill(C_BORDER));
    });

    // RIGHT COLUMN (460px)
    // CARD 5: Smart Search with Search Icon
    createCard(frame1, "Умный AI-поиск по потребностям", "Естественный язык и анализ кассового разрыва", 940, 225, 460, 220, null, null, "search", C_BLUE);
    createSolidRect(frame1, "SearchInput", 964, 310, 412, 46, 10, hexFill(C_BG), hexFill(C_BORDER_STRONG), 1);
    createVectorIcon(frame1, "search", 980, 324, 18, C_INK_MUTED);
    createText(frame1, "SearchText", 1006, 324, "Нужны деньги на закупку серверов…", 13, "Medium", C_INK);

    createText(frame1, "ChipsLabel", 964, 370, "Популярные сценарии финансирования:", 11, "Medium", C_INK_FAINT);
    createBadge(frame1, "Закрыть кассовый разрыв", 964, 395, "pill-outline");
    createBadge(frame1, "Пополнить оборотку", 1145, 395, "pill-outline");
    createBadge(frame1, "Факторинг под инвойс", 964, 425, "pill-outline");
    createBadge(frame1, "Инвест-кредит", 1125, 425, "pill-outline");

    // CARD 6: One-Click Application with Zap Icon
    createCard(frame1, "Экспресс-заявка за 10 секунд", "Авто-расчет платежа и ставки онлайн", 940, 465, 460, 440, "Ставка 19.5%", "pill-good", "zap", C_AMBER);
    createText(frame1, "AppL1", 964, 550, "Сумма кредита", 11, "Medium", C_INK_MUTED);
    createText(frame1, "AppV1", 1230, 546, "3 000 000 ₽", 16, "Bold", C_ALFA_RED);
    createSolidRect(frame1, "SliderTrack1", 964, 575, 412, 6, 3, hexFill(C_BORDER));
    createSolidRect(frame1, "SliderFill1", 964, 575, 250, 6, 3, hexFill(C_ALFA_RED));
    createSolidRect(frame1, "SliderThumb1", 1210, 570, 16, 16, 8, hexFill(C_ALFA_RED));

    createText(frame1, "AppL2", 964, 610, "Срок финансирования", 11, "Medium", C_INK_MUTED);
    createText(frame1, "AppV2", 1270, 606, "12 мес.", 16, "Bold", C_INK);
    createSolidRect(frame1, "SliderTrack2", 964, 635, 412, 6, 3, hexFill(C_BORDER));
    createSolidRect(frame1, "SliderFill2", 964, 635, 180, 6, 3, hexFill(C_ANTHRACITE));
    createSolidRect(frame1, "SliderThumb2", 1140, 630, 16, 16, 8, hexFill(C_ANTHRACITE));

    createText(frame1, "AppL3", 964, 670, "Кредитный продукт", 11, "Medium", C_INK_MUTED);
    createSolidRect(frame1, "ProdBox", 964, 695, 412, 44, 8, hexFill(C_BG), hexFill(C_BORDER), 1);
    createVectorIcon(frame1, "landmark", 980, 707, 18, C_INK);
    createText(frame1, "ProdBoxT", 1006, 708, "Оборотный кредит (без залога) · 19.5%", 13, "Bold", C_INK);

    createSolidRect(frame1, "CalcBox", 964, 760, 412, 70, 10, hexFill({ r: 0.95, g: 0.97, b: 1.0 }), hexFill(C_BLUE), 1);
    createText(frame1, "CalcL", 980, 772, "ЕЖЕМЕСЯЧНЫЙ ПЛАТЕЖ", 10, "Bold", C_BLUE);
    createText(frame1, "CalcV", 980, 792, "277 150 ₽ / мес.", 20, "Bold", C_INK);
    createText(frame1, "CalcSub", 1220, 796, "КС ЦБ 21.0%", 12, "Medium", C_BLUE);

    createButton(frame1, "Получить мгновенное решение →", 964, 850, 412, 46, "primary", "zap");

    // CARD 7: Risk Radar with Radar Icon
    createCard(frame1, "Радар финансовых рисков", "Предупреждение критических ситуаций бизнеса", 940, 925, 460, 230, null, null, "radar", C_ALFA_RED);
    createSolidRect(frame1, "R1", 964, 1010, 412, 60, 8, hexFill({ r: 0.99, g: 0.96, b: 0.90 }), hexFill(C_AMBER), 1);
    createVectorIcon(frame1, "alertTriangle", 978, 1020, 18, C_AMBER);
    createText(frame1, "R1_T", 1004, 1020, "Налоговый платеж (НДС) через 12 дней", 12, "Bold", C_AMBER);
    createText(frame1, "R1_S", 1004, 1042, "Ожидаемая сумма списания 940 000 ₽. Резерв на счете достаточен.", 11, "Regular", C_INK_MUTED);

    createSolidRect(frame1, "R2", 964, 1080, 412, 60, 8, hexFill({ r: 0.90, g: 0.97, b: 0.93 }), hexFill(C_GREEN), 1);
    createVectorIcon(frame1, "checkCircle", 978, 1090, 18, C_GREEN);
    createText(frame1, "R2_T", 1004, 1090, "Кредитная нагрузка (DTI) в норме: 22%", 12, "Bold", C_GREEN);
    createText(frame1, "R2_S", 1004, 1112, "Максимальный допустимый порог для ИТ-сектора: 45%.", 11, "Regular", C_INK_MUTED);

    // CARD 8: News with Bell Icon
    createCard(frame1, "События и регуляторные обновления", "Интеграции и возможности", 940, 1175, 460, 200, null, null, "bell", C_AMBER);
    createVectorIcon(frame1, "landmark", 964, 1260, 16, C_BLUE);
    createText(frame1, "News1_T", 988, 1260, "Доступно увеличение кредитного лимита до 5.5 млн ₽", 12, "Bold", C_INK);
    createText(frame1, "News1_S", 988, 1280, "Подключите передачу данных по счетам из других банков через Open Banking API.", 11, "Regular", C_INK_MUTED, 380);

    createVectorIcon(frame1, "trendingUp", 964, 1315, 16, C_GREEN);
    createText(frame1, "News2_T", 988, 1315, "Ключевая ставка ЦБ РФ сохранена на уровне 21.0%", 12, "Bold", C_INK);
    createText(frame1, "News2_S", 988, 1335, "Ставки по льготным программам для МСП субсидируются банком.", 11, "Regular", C_INK_MUTED, 380);

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

    createSolidRect(frame2, "F2_Tab1", 340, 17, 140, 36, 8, hexFill({ r: 0.16, g: 0.18, b: 0.22 }));
    createVectorIcon(frame2, "activity", 352, 25, 18, C_INK_FAINT);
    createText(frame2, "F2_Tab1_T", 376, 26, "1. 360° Кабинет", 12, "Medium", C_INK_FAINT);

    createSolidRect(frame2, "F2_Tab2", 490, 17, 140, 36, 8, hexFill(C_ALFA_RED));
    createVectorIcon(frame2, "zap", 502, 25, 18, C_WHITE);
    createText(frame2, "F2_Tab2_T", 526, 26, "2. Заявка и оффер", 12, "Bold", C_WHITE);

    createSolidRect(frame2, "F2_Tab3", 640, 17, 160, 36, 8, hexFill({ r: 0.16, g: 0.18, b: 0.22 }));
    createVectorIcon(frame2, "scale", 652, 25, 18, C_INK_FAINT);
    createText(frame2, "F2_Tab3_T", 676, 26, "3. Рентген инспектора", 12, "Medium", C_INK_FAINT);

    // Page Header Block
    createSolidRect(frame2, "F2_PageHeader", 0, 70, 1440, 130, 0, hexFill(C_SURFACE), hexFill(C_BORDER), 1);
    createBadge(frame2, "ОДОБРЕНО", 40, 92, "pill-good");
    createBadge(frame2, "Оборотный кредит", 135, 92, "pill-outline");
    createBadge(frame2, "ID #ALFA-8841-B", 275, 92, "pill-outline");

    createText(frame2, "F2_Title", 40, 122, "Заявка на финансирование · 3 000 000 ₽", 24, "Bold", C_INK);
    createText(frame2, "F2_Meta", 40, 156, "ООО «Вектор» · ИНН 7701234567 · Заявка сформирована 21 октября 2026, 14:32:05 (авто-скоринг 8 сек)", 13, "Regular", C_INK_MUTED);

    createButton(frame2, "Рентген инспектора →", 1050, 110, 190, 42, "secondary", "scale");
    createButton(frame2, "В кабинет", 1260, 110, 140, 42, "outline");

    // SECTION 1: Passport Panel with ShieldCheck Icon
    createCard(frame2, "Паспорт заемщика — Результаты 5 скоринг-проверок", "Автоматическая валидация по государственным базам данных без участия андеррайтера", 40, 225, 1360, 210, "RiskScore 815 / 1000", "pill-good", "shieldCheck", C_GREEN);
    const checks = [
      { name: "1. ЕГРЮЛ / ЕГРИП", val: "CLEAR", desc: "Действующее, возраст 4.8 лет, учредители без дисквалификаций", color: C_GREEN, icon: "checkCircle" },
      { name: "2. ФССП (Приставы)", val: "PASS", desc: "0 исполнительных производств, задолженности отсутствуют", color: C_GREEN, icon: "shieldCheck" },
      { name: "3. Картотека №2", val: "CLEAR", desc: "0 неоплаченных требований к счету за последние 12 месяцев", color: C_GREEN, icon: "creditCard" },
      { name: "4. ФНС (Налоги)", val: "CLEAR", desc: "Задолженностей по налогам и сборам нет, отчетность сдана", color: C_GREEN, icon: "fileText" },
      { name: "5. БКИ (Кредиты)", val: "815 БАЛЛОВ", desc: "Безупречная платежная дисциплина, закрыто 4 кредита без просрочек", color: C_GREEN, icon: "trendingUp" }
    ];
    checks.forEach((ch, idx) => {
      const bx = 64 + idx * 262;
      const by = 320;
      createSolidRect(frame2, "CheckB_" + idx, bx, by, 250, 95, 8, hexFill(C_BG), hexFill(C_BORDER), 1);
      createVectorIcon(frame2, ch.icon, bx + 12, by + 12, 16, ch.color);
      createText(frame2, "CheckT_" + idx, bx + 34, by + 12, ch.name, 12, "Bold", C_INK);
      createBadge(frame2, ch.val, bx + 12, by + 34, "pill-soft-good");
      createText(frame2, "CheckD_" + idx, bx + 12, by + 64, ch.desc, 10, "Regular", C_INK_MUTED, 226);
    });

    // SECTION 2: Multibank with Landmark Icon
    createCard(frame2, "Мультибанк (Open Banking Integration)", "Расширение кредитного лимита за счет агрегации оборотов из сторонних банков", 40, 455, 1360, 160, "+2.5 млн ₽ к лимиту", "pill-outline", "landmark", C_BLUE);
    const mBank1 = createSolidRect(frame2, "MB1", 64, 535, 630, 60, 8, hexFill({ r: 0.94, g: 0.98, b: 0.95 }), hexFill(C_GREEN), 1);
    createVectorIcon(frame2, "landmark", 80, 546, 20, C_GREEN);
    createText(frame2, "MB1_T", 108, 546, "Сбербанк: Оборот 4 200 000 ₽ / мес.", 13, "Bold", C_INK);
    createText(frame2, "MB1_S", 108, 568, "Выписка подтверждена по Open Banking API · Добавлен дополнительный лимит +1 500 000 ₽", 11, "Regular", C_INK_MUTED);

    const mBank2 = createSolidRect(frame2, "MB2", 710, 535, 630, 60, 8, hexFill({ r: 0.94, g: 0.98, b: 0.95 }), hexFill(C_GREEN), 1);
    createVectorIcon(frame2, "landmark", 726, 546, 20, C_GREEN);
    createText(frame2, "MB2_T", 754, 546, "Т-Банк: Оборот 2 800 000 ₽ / мес.", 13, "Bold", C_INK);
    createText(frame2, "MB2_S", 754, 568, "Выписка подтверждена по Open Banking API · Добавлен дополнительный лимит +1 000 000 ₽", 11, "Regular", C_INK_MUTED);

    // SECTION 3: Counter-Offers with Handshake Icon
    createCard(frame2, "Доступные кредитные предложения (Встречные офферы)", "Выберите подходящую конфигурацию условий финансирования", 40, 635, 1360, 310, null, null, "handshake", C_AMBER);
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
        icon: "zap",
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
        icon: "landmark",
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
        icon: "creditCard",
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
      createVectorIcon(frame2, o.icon, ox + 18, oy + 18, 18, o.color);
      createText(frame2, "OTitle_" + idx, ox + 42, oy + 18, o.title, 14, "Bold", C_INK);
      createBadge(frame2, o.tag, ox + 280, oy + 14, o.selected ? "pill-risk" : "pill-outline");

      createText(frame2, "OSum_" + idx, ox + 18, oy + 46, o.sum, 24, "Bold", C_INK);
      createText(frame2, "ORate_" + idx, ox + 18, oy + 82, "Ставка: " + o.rate + " · Срок: " + o.term, 12, "Medium", C_INK_MUTED);
      createText(frame2, "OPay_" + idx, ox + 18, oy + 104, "Платеж: " + o.pay, 13, "Bold", o.color);
      createText(frame2, "OSec_" + idx, ox + 18, oy + 128, "Обеспечение: " + o.sec, 11, "Regular", C_INK_FAINT);

      createButton(frame2, o.selected ? "Выбрано ✓" : "Выбрать этот вариант", ox + 18, oy + 155, 384, 38, o.selected ? "primary" : "outline");
    });

    // SECTION 4: Signing & OTP with Signature Icon
    createCard(frame2, "Подписание договора и зачисление средств", "Без визита в банк · Простая электронная подпись (КЭП / SMS-код)", 40, 965, 1360, 420, null, null, "signature", C_GREEN);
    createSolidRect(frame2, "SignBox", 64, 1050, 1312, 310, 12, hexFill(C_BG), hexFill(C_BORDER), 1);

    createVectorIcon(frame2, "fileText", 90, 1075, 20, C_BLUE);
    createText(frame2, "SignStep1", 118, 1075, "1. Индивидуальные условия договора № KRED-8841-B сформированы", 15, "Bold", C_INK);
    createText(frame2, "SignDoc1", 118, 1102, "📄 Договор кредитной линии на сумму 3 000 000 ₽ (PDF, 4 страницы) · График платежей", 12, "Medium", C_BLUE);

    createVectorIcon(frame2, "signature", 90, 1140, 20, C_GREEN);
    createText(frame2, "SignStep2", 118, 1140, "2. Введите СМС-код для подписания", 15, "Bold", C_INK);
    createText(frame2, "SignOtpSub", 118, 1165, "Одноразовый проверочный код отправлен на номер директора: +7 (999) ***-**-12", 12, "Regular", C_INK_MUTED);

    [0, 1, 2, 3].forEach((pos) => {
      const digit = ["4", "8", "2", "9"][pos];
      createSolidRect(frame2, "Otp_" + pos, 118 + pos * 65, 1195, 52, 56, 8, hexFill(C_SURFACE), hexFill(C_ALFA_RED), 2);
      createText(frame2, "OtpD_" + pos, 136 + pos * 65, 1208, digit, 24, "Bold", C_INK);
    });

    createText(frame2, "SignAgree", 118, 1270, "☑️ С условиями договора ознакомлен и согласен. Подтверждаю целевое назначение средств.", 12, "Medium", C_INK);

    createButton(frame2, "Подписать договор и получить 3 000 000 ₽ на счёт →", 118, 1300, 480, 46, "primary", "checkCircle");
    createBadge(frame2, "ЗАЧИСЛЕНИЕ ЗА 30 СЕКУНД", 620, 1310, "pill-good");

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

    createSolidRect(frame3, "F3_Tab1", 340, 17, 140, 36, 8, hexFill({ r: 0.16, g: 0.18, b: 0.22 }));
    createVectorIcon(frame3, "activity", 352, 25, 18, C_INK_FAINT);
    createText(frame3, "F3_Tab1_T", 376, 26, "1. 360° Кабинет", 12, "Medium", C_INK_FAINT);

    createSolidRect(frame3, "F3_Tab2", 490, 17, 140, 36, 8, hexFill({ r: 0.16, g: 0.18, b: 0.22 }));
    createVectorIcon(frame3, "zap", 502, 25, 18, C_INK_FAINT);
    createText(frame3, "F3_Tab2_T", 526, 26, "2. Заявка и оффер", 12, "Medium", C_INK_FAINT);

    createSolidRect(frame3, "F3_Tab3", 640, 17, 160, 36, 8, hexFill(C_ALFA_RED));
    createVectorIcon(frame3, "scale", 652, 25, 18, C_WHITE);
    createText(frame3, "F3_Tab3_T", 676, 26, "3. Рентген инспектора", 12, "Bold", C_WHITE);

    createBadge(frame3, "РЕЖИМ БАНКА", 1300, 20, "pill-risk");

    // Page Header Block
    createSolidRect(frame3, "F3_PageHeader", 0, 70, 1440, 130, 0, hexFill(C_SURFACE), hexFill(C_BORDER), 1);
    createBadge(frame3, "Экран 3 · Банк", 40, 92, "pill-risk");
    createBadge(frame3, "Оборотный кредит", 150, 92, "pill-outline");
    createBadge(frame3, "ID #ALFA-8841-B", 290, 92, "pill-outline");

    createText(frame3, "F3_Title", 40, 122, "Рентген заявки: ООО «Вектор» (ИНН 7701234567)", 24, "Bold", C_INK);
    createText(frame3, "F3_Meta", 40, 156, "RiskScore 815 · Статус: АВТО-ОДОБРЕНО · Ставка 19.5% · КС ЦБ 21.0% (субсидированная маржа)", 13, "Regular", C_INK_MUTED);

    createButton(frame3, "К заявке клиента", 1260, 110, 140, 42, "outline");

    // SECTION 1: Underwriter Action Bar with Scale Icon
    createCard(frame3, "Панель управления андеррайтера (Underwriter Override)", "Возможность ручного переопределения решения алгоритма с записью в неизменяемый аудит-лог", 40, 225, 1360, 140, null, null, "scale", C_ANTHRACITE);
    createButton(frame3, "Подтвердить одобрение", 64, 300, 220, 44, "primary", "checkCircle");
    createButton(frame3, "Корректировать лимит", 298, 300, 200, 44, "secondary", "handshake");
    createButton(frame3, "Запросить доп. документы", 512, 300, 220, 44, "outline", "fileText");
    createButton(frame3, "Отклонить заявку", 746, 300, 170, 44, "ghost", "alertTriangle");

    const commInput = createSolidRect(frame3, "CommInput", 930, 300, 446, 44, 8, hexFill(C_BG), hexFill(C_BORDER), 1);
    createText(frame3, "CommT", 946, 314, "Комментарий андеррайтера для аудита…", 12, "Medium", C_INK_MUTED);

    // SECTION 2: Waterfall Scoring with BarChart Icon
    createCard(frame3, "Waterfall скоринга (Scoring Waterfall Chart)", "Базовый скор 500 + пять детерминированных факторов (BRD v3.0) · Без диапазонов и скрытых весов", 40, 385, 880, 320, "815 / 1000", "pill-good", "barChart", C_BLUE);
    const factors = [
      { name: "Базовый скор", val: "500", h: 100, c: C_ANTHRACITE, sub: "Стартовая база", icon: "activity" },
      { name: "Выручка (+18%)", val: "+120", h: 70, c: C_GREEN, sub: "Динамика и объем", icon: "trendingUp" },
      { name: "БКИ история", val: "+95", h: 60, c: C_GREEN, sub: "0 просрочек", icon: "shieldCheck" },
      { name: "Альфа-обороты", val: "+70", h: 50, c: C_GREEN, sub: "Лояльность банку", icon: "landmark" },
      { name: "Контрагенты", val: "+30", h: 30, c: C_GREEN, sub: "Диверсификация", icon: "users" },
      { name: "Итоговый скор", val: "815", h: 130, c: C_GREEN, sub: "Зеленый коридор", icon: "checkCircle" }
    ];
    factors.forEach((f, idx) => {
      const fx = 64 + idx * 135;
      const barY = 630 - f.h;
      createSolidRect(frame3, "WBar_" + idx, fx, barY, 100, f.h, 6, hexFill(f.c));
      createVectorIcon(frame3, f.icon, fx + 10, barY - 24, 16, f.c);
      createText(frame3, "WVal_" + idx, fx + 30, barY - 22, f.val, 14, "Bold", f.c);
      createText(frame3, "WName_" + idx, fx, 640, f.name, 11, "Bold", C_INK);
      createText(frame3, "WSub_" + idx, fx, 658, f.sub, 9, "Regular", C_INK_MUTED);
    });

    // SECTION 3: Bank P&L Economics with Coins Icon
    createCard(frame3, "P&L сделки глазами банка (Deal Economics)", "Расчет маржинальности и стоимости риска по кредиту 3.0M ₽ на 12 мес.", 940, 385, 460, 320, "RAROC 28.4%", "pill-good", "coins", C_GREEN);
    const pnlRows = [
      { name: "Процентный доход банка (19.5%)", val: "+412 000 ₽", c: C_GREEN, icon: "trendingUp" },
      { name: "Стоимость фондирования (FTP 16.5%)", val: "-280 000 ₽", c: C_INK, icon: "landmark" },
      { name: "Стоимость риска (EL / Резервы)", val: "-35 000 ₽", c: C_INK, icon: "shieldCheck" },
      { name: "Операционные расходы банка", val: "-12 000 ₽", c: C_INK, icon: "fileText" },
      { name: "Чистый финансовый результат", val: "+85 000 ₽", c: C_GREEN, bold: true, icon: "coins" }
    ];
    pnlRows.forEach((r, idx) => {
      const ry = 475 + idx * 42;
      createVectorIcon(frame3, r.icon, 964, ry + 2, 14, r.c);
      createText(frame3, "PnlN_" + idx, 986, ry, r.name, 12, r.bold ? "Bold" : "Regular", C_INK);
      createText(frame3, "PnlV_" + idx, 1310, ry, r.val, 13, "Bold", r.c, 80, "RIGHT");
      createSolidRect(frame3, "PnlDiv_" + idx, 964, ry + 28, 412, 1, 0, hexFill(C_BORDER));
    });

    // SECTION 4: Geo Analytics with MapPin Icon
    createCard(frame3, "Гео-аналитика и пешеходный трафик (Geo Risk Engine)", "Оценка надежности локации бизнеса: Москва, Пресненская наб. 12", 40, 725, 660, 340, null, null, "mapPin", C_BLUE);
    const geoMetrics = [
      { l: "Индекс проходимости", v: "8.8 / 10", s: "Высокий пешеходный трафик (420 чел/час)", c: C_GREEN, icon: "trendingUp" },
      { l: "Конкурентная среда", v: "Низкий риск", s: "Отсутствует прямая каннибализация спроса", c: C_GREEN, icon: "shieldCheck" },
      { l: "Устойчивость локации", v: "A+", s: "Стабильный бизнес-район (Москва-Сити)", c: C_BLUE, icon: "landmark" }
    ];
    geoMetrics.forEach((g, idx) => {
      const gy = 815 + idx * 75;
      createSolidRect(frame3, "GeoB_" + idx, 64, gy, 612, 62, 8, hexFill(C_BG), hexFill(C_BORDER), 1);
      createVectorIcon(frame3, g.icon, 80, gy + 12, 18, g.c);
      createText(frame3, "GeoL_" + idx, 104, gy + 12, g.l, 11, "Medium", C_INK_MUTED);
      createText(frame3, "GeoV_" + idx, 80, gy + 34, g.v, 16, "Bold", g.c);
      createText(frame3, "GeoS_" + idx, 260, gy + 34, g.s, 11, "Regular", C_INK);
    });

    // SECTION 5: Audit Trail with Clock Icon
    createCard(frame3, "Audit Trail — Неизменяемый журнал событий скоринга", "Полная трассировка решений Decision Engine и проверок систем в миллисекундах", 720, 725, 680, 340, null, null, "clock", C_INK_MUTED);
    const logs = [
      { time: "14:32:01.102", ev: "Инициация экспресс-заявки клиентом из Дашборда (Сумма: 3.0M ₽)", ms: "0.00s", icon: "zap" },
      { time: "14:32:01.215", ev: "Запрос в ЕГРЮЛ: ЮЛ действующее, директор Иванов А.В. подтвержден", ms: "0.11s", icon: "checkCircle" },
      { time: "14:32:01.440", ev: "Запрос в БКИ: RiskScore 815, просрочек нет, нагрузка 22%", ms: "0.22s", icon: "shieldCheck" },
      { time: "14:32:01.590", ev: "Decision Engine: Зеленый коридор (>750). Авто-одобрение без залога", ms: "0.15s", icon: "scale" },
      { time: "14:32:01.625", ev: "Сформированы 3 встречных оффера и проект договора в PDF", ms: "0.03s", icon: "fileText" }
    ];
    logs.forEach((lg, idx) => {
      const ly = 815 + idx * 52;
      createVectorIcon(frame3, lg.icon, 744, ly, 16, C_INK_MUTED);
      createText(frame3, "LogTime_" + idx, 768, ly, lg.time, 11, "Medium", C_INK_FAINT);
      createText(frame3, "LogEv_" + idx, 856, ly, lg.ev, 11, "Bold", C_INK, 460);
      createBadge(frame3, lg.ms, 1340, ly - 4, "pill-outline");
      createSolidRect(frame3, "LogDiv_" + idx, 744, ly + 36, 632, 1, 0, hexFill(C_BORDER));
    });

    // SECTION 6: Anomaly Detector with ShieldCheck Icon
    createCard(frame3, "Валидатор аномалий и антифрод", "Проверка на накрутку оборотов и фиктивные транзакции", 40, 1085, 1360, 200, "Аномалий не обнаружено", "pill-good", "shieldCheck", C_GREEN);
    const anomItems = [
      { t: "Круговые транзакции", s: "Проверка графа расчетов: замкнутых петель и дробления оборотов не выявлено.", ok: true },
      { t: "Всплески оборота", s: "Рост выручки +18% подтвержден реальными договорами с ПАО «Газпром Нефть».", ok: true },
      { t: "Судебная активность", s: "В картотеке арбитражных дел и ФССП исков за последние 3 года нет.", ok: true }
    ];
    anomItems.forEach((ai, idx) => {
      const ax = 64 + idx * 440;
      createSolidRect(frame3, "AnomB_" + idx, ax, 1175, 420, 85, 8, hexFill({ r: 0.94, g: 0.98, b: 0.95 }), hexFill(C_GREEN), 1);
      createVectorIcon(frame3, "checkCircle", ax + 14, 1188, 18, C_GREEN);
      createText(frame3, "AnomT_" + idx, ax + 38, 1188, ai.t, 13, "Bold", C_INK);
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
    createVectorIcon(frame4, "users", 40, 30, 30, C_ALFA_RED);
    createText(frame4, "F4_Super", 84, 20, "ЭТАЛОННЫЕ СЦЕНАРИИ ТЕСТИРОВАНИЯ И СКОРИНГА (BRD V3.0)", 11, "Bold", C_ALFA_RED);
    createText(frame4, "F4_Title", 84, 42, "Матрица 5 контрольных профилей заемщиков", 20, "Bold", C_WHITE);

    const demoProfiles = [
      {
        name: "1. ООО «Вектор»",
        inn: "ИНН 7701234567",
        score: "RiskScore 815",
        corr: "ЗЕЛЕНЫЙ КОРИДОР",
        decision: "АВТО-ОДОБРЕНИЕ 3.0M ₽",
        rate: "Ставка: 19.5% · 12 мес.",
        desc: "ИТ-разработка, выручка 18.4 млн/мес, рост +18%, безупречная БКИ, низкая нагрузка DTI 22%. Мгновенная выдача без залога.",
        c: C_GREEN,
        icon: "checkCircle",
        badgeType: "pill-good"
      },
      {
        name: "2. ИП Иванов А.С.",
        inn: "ИНН 500198765432",
        score: "RiskScore 610",
        corr: "ЖЕЛТЫЙ КОРИДОР",
        decision: "КОНТР-ОФФЕР 1.2M ₽",
        rate: "Ставка: 22.0% · 6 мес.",
        desc: "Розничная торговля, запрос 2.0M ₽. Алгоритм снизил лимит до 1.2M ₽ для сохранения платежеспособности без риска дефолта.",
        c: C_AMBER,
        icon: "handshake",
        badgeType: "pill-warn"
      },
      {
        name: "3. ООО «Ромашка»",
        inn: "ИНН 7725112233",
        score: "RiskScore 760",
        corr: "ЗЕЛЕНЫЙ КОРИДОР",
        decision: "ОВЕРДРАФТ 1.5M ₽",
        rate: "Ставка: 20.0% · 12 мес.",
        desc: "Сезонный оптовый бизнес. Успешный скоринг, подключен факторинг под дебиторку и предодобренный лимит овердрафта.",
        c: C_GREEN,
        icon: "landmark",
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
        icon: "scale",
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
        icon: "alertTriangle",
        badgeType: "pill-risk"
      }
    ];

    demoProfiles.forEach((p, idx) => {
      const px = 40 + idx * 275;
      const py = 120;
      const pCard = createSolidRect(frame4, "DP_" + idx, px, py, 260, 560, 12, hexFill(C_SURFACE), hexFill(C_BORDER), 1);
      createSolidRect(frame4, "DPTop_" + idx, px, py, 260, 6, 0, hexFill(p.c));

      createVectorIcon(frame4, p.icon, px + 16, py + 20, 20, p.c);
      createText(frame4, "DPName_" + idx, px + 44, py + 20, p.name, 14, "Bold", C_INK);
      createText(frame4, "DPInn_" + idx, px + 16, py + 48, p.inn, 11, "Medium", C_INK_FAINT);

      createBadge(frame4, p.corr, px + 16, py + 76, p.badgeType);
      createText(frame4, "DPScore_" + idx, px + 16, py + 118, p.score, 18, "Bold", p.c);

      createSolidRect(frame4, "DBox_" + idx, px + 16, py + 155, 228, 70, 8, hexFill(C_BG), hexFill(C_BORDER), 1);
      createText(frame4, "DPTag_" + idx, px + 24, py + 166, "РЕШЕНИЕ СИСТЕМЫ:", 9, "Bold", C_INK_FAINT);
      createText(frame4, "DPDec_" + idx, px + 24, py + 184, p.decision, 11, "Bold", p.c, 210);
      createText(frame4, "DPRate_" + idx, px + 24, py + 204, p.rate, 10, "Medium", C_INK_MUTED);

      createText(frame4, "DPDesc_" + idx, px + 16, py + 245, p.desc, 12, "Regular", C_INK, 228);
    });

    // Viewport zoom
    figma.viewport.scrollAndZoomIntoView([frame0, frame1, frame2, frame3, frame4]);

    figma.notify("✨ Актуальный дизайн с векторными иконками Iconimate успешно отрисован в Фигме!");
  } catch (err) {
    figma.notify("❌ Ошибка отрисовки: " + err.message, { error: true });
    console.error(err);
  } finally {
    figma.closePlugin();
  }
})();
