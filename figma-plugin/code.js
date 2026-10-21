// Only_Alfa — Master Figma Generator V4 (Complete Plan Implementation from aaaю.md)
// Full 5 Frames matching BRD v3.0, ТЗ-00...ТЗ-05, and Checkpoints 1 & 2

(async function() {
  try {
    figma.notify("⏳ Генерация полного макета по плану aaaю.md...");

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
        bg = { r: 1.0, g: 0.94, b: 0.94 };
        textColor = C_ALFA_RED;
        stroke = hexFill({ r: 0.98, g: 0.78, b: 0.77 });
      } else if (variant === "dark") {
        bg = C_ANTHRACITE;
        textColor = C_WHITE;
      } else if (variant === "outline") {
        bg = C_WHITE;
        textColor = C_INK;
        stroke = hexFill(C_BORDER_STRONG);
      } else if (variant === "ghost") {
        bg = C_BG_ALT;
        textColor = C_INK;
      } else if (variant === "success") {
        bg = { r: 0.91, g: 0.97, b: 0.94 };
        textColor = C_GREEN;
        stroke = hexFill({ r: 0.72, g: 0.92, b: 0.83 });
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

      if (title) {
        createText(card, "CardTitle", textStartX, 20, title, 16, "Bold", C_INK);
        if (subtitle) {
          createText(card, "CardSubtitle", textStartX, 44, subtitle, 12, "Regular", C_INK_MUTED, w - textStartX - 140);
        }
        if (badgeText) {
          createBadge(card, badgeText, w - 160, 20, badgeType || "pill-outline");
        }
        createSolidRect(card, "CardDivider", 24, 72, w - 48, 1, 0, hexFill(C_BORDER));
      }
      return card;
    }

    // HELPER: Persistent Global Header (Section 0 of plan)
    function createGlobalPersistentHeader(frame, activeCompany, activeRole, activeScreenTab, activeViewMode, chips) {
      const topBarH = 100;
      createSolidRect(frame, "TopBar_BG", 0, 0, 1440, topBarH, 0, hexFill(C_ANTHRACITE));

      // Brand Logo
      createSolidRect(frame, "AlfaMark", 28, 14, 42, 42, 10, hexFill(C_ALFA_RED));
      createText(frame, "LogoA", 42, 23, "А", 20, "Bold", C_WHITE);
      createText(frame, "BrandT", 80, 18, "Only_Alfa", 15, "Bold", C_WHITE);
      createText(frame, "BrandS", 80, 38, "КРЕДИТНЫЙ КАБИНЕТ · ХАКАТОН «АЛЬФА-БУДУЩЕЕ»", 9, "Bold", C_INK_FAINT);

      // 1. Selector of 5 pre-loaded demo companies
      const compPill = createSolidRect(frame, "CompPill", 340, 16, 260, 38, 8, hexFill({ r: 0.16, g: 0.18, b: 0.22 }), hexFill(C_BORDER_STRONG), 1);
      createVectorIcon(frame, "building", 350, 26, 18, C_WHITE);
      createText(frame, "CompPillT", 374, 27, activeCompany.name + " (" + activeCompany.score + ") ▼", 12, "Bold", C_WHITE);

      // 2. Live INN Lookup Input
      const innInput = createSolidRect(frame, "InnInput", 615, 16, 210, 38, 8, hexFill({ r: 0.14, g: 0.16, b: 0.20 }), hexFill({ r: 0.25, g: 0.28, b: 0.35 }), 1);
      createVectorIcon(frame, "search", 625, 27, 16, C_INK_FAINT);
      createText(frame, "InnT", 648, 28, "Проверить ИНН (Live)", 11, "Medium", C_INK_FAINT);

      // 3. Maker-Checker Corporate Role Toggle (Employee vs CEO_OWNER)
      const roleToggle = createSolidRect(frame, "RoleToggle", 840, 16, 280, 38, 8, hexFill({ r: 0.14, g: 0.16, b: 0.20 }));
      const isCEO = activeRole === "CEO_OWNER";
      createSolidRect(frame, "RoleActive", isCEO ? 985 : 842, 18, 132, 34, 6, hexFill(isCEO ? C_ALFA_RED : { r: 0.22, g: 0.25, b: 0.32 }));
      createText(frame, "Role1", 855, 28, "Снабженец/Бухг.", 10, isCEO ? "Regular" : "Bold", isCEO ? C_INK_FAINT : C_WHITE);
      createText(frame, "Role2", 1000, 28, "Гендиректор (ПЭП)", 10, isCEO ? "Bold" : "Regular", C_WHITE);

      // 4. View Mode: Business vs Bank Inspector
      const isBank = activeViewMode === "bank";
      const viewToggle = createSolidRect(frame, "ViewToggle", 1135, 16, 275, 38, 8, hexFill({ r: 0.14, g: 0.16, b: 0.20 }));
      createSolidRect(frame, "ViewActive", isBank ? 1275 : 1137, 18, 132, 34, 6, hexFill(isBank ? C_ALFA_RED : C_GREEN));
      createText(frame, "ViewBiz", 1150, 28, "Глазами бизнеса", 10, isBank ? "Regular" : "Bold", isBank ? C_INK_FAINT : C_WHITE);
      createText(frame, "ViewBank", 1285, 28, "Рентген банка", 10, isBank ? "Bold" : "Regular", C_WHITE);

      // Lower Sub-bar: Navigation Tabs + Smart Search Bar with Industry Chips
      createSolidRect(frame, "SubNav_BG", 0, 60, 1440, 40, 0, hexFill(C_ANTHRACITE_SOFT));
      const tabs = [
        { id: 1, label: "1. 360° Кабинет", icon: "activity" },
        { id: 2, label: "2. Заявка и оффер", icon: "zap" },
        { id: 3, label: "3. Рентген инспектора", icon: "scale" }
      ];
      tabs.forEach((tb, idx) => {
        const isActive = activeScreenTab === tb.id;
        const tx = 28 + idx * 170;
        if (isActive) {
          createSolidRect(frame, "SubTabAct_" + idx, tx, 64, 155, 32, 6, hexFill(C_ALFA_RED));
        }
        createVectorIcon(frame, tb.icon, tx + 12, 72, 16, isActive ? C_WHITE : C_INK_FAINT);
        createText(frame, "SubTabT_" + idx, tx + 34, 72, tb.label, 11, isActive ? "Bold" : "Medium", isActive ? C_WHITE : C_INK_FAINT);
      });

      // Industry Chips for Search-to-Credit
      createText(frame, "ChipsIntro", 550, 73, "Отрасль " + activeCompany.okved_cluster + ":", 10, "Bold", C_INK_FAINT);
      chips.forEach((ch, idx) => {
        const cx = 660 + idx * 190;
        if (cx + 180 <= 1420) {
          createSolidRect(frame, "Chip_" + idx, cx, 66, 180, 28, 6, hexFill({ r: 0.12, g: 0.14, b: 0.18 }), hexFill({ r: 0.22, g: 0.25, b: 0.32 }), 1);
          createVectorIcon(frame, "search", cx + 8, 73, 13, C_ALFA_RED);
          createText(frame, "ChipT_" + idx, cx + 26, 73, ch, 10, "Medium", C_WHITE);
        }
      });
    }

    // ==========================================
    // FRAME 0: DESIGN SYSTEM & ICON GALLERY
    // ==========================================
    const frame0 = figma.createFrame();
    frame0.name = "🎨 00 — Design System & UI Kit Tokens";
    frame0.x = 0;
    frame0.y = 0;
    frame0.resize(1440, 1100);
    frame0.fills = hexFill(C_BG);
    figma.currentPage.appendChild(frame0);

    createSolidRect(frame0, "F0_HeaderBG", 0, 0, 1440, 110, 0, hexFill(C_ANTHRACITE));
    createVectorIcon(frame0, "activity", 40, 36, 32, C_ALFA_RED);
    createText(frame0, "F0_Super", 84, 24, "ONLY_ALFA DESIGN SYSTEM · BRD V3.0 SPECIFICATION", 11, "Bold", C_ALFA_RED);
    createText(frame0, "F0_Title", 84, 46, "Библиотека компонентов, токенов и векторных иконок Iconimate", 22, "Bold", C_WHITE);
    createText(frame0, "F0_Sub", 84, 78, "Стандарт хакатона «Альфа-Будущее»: чистый интерфейс, фирменный стиль Альфа-Банка, 5 коридоров решений", 13, "Regular", C_INK_FAINT);

    // Color Swatches
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
      { id: "activity", title: "Activity", cat: "360° ДНК бизнеса", color: C_ALFA_RED },
      { id: "trendingUp", title: "TrendingUp", cat: "Динамика выручки", color: C_GREEN },
      { id: "trendingDown", title: "TrendingDown", cat: "Кассовый разрыв", color: C_ALFA_RED },
      { id: "fileText", title: "FileText", cat: "PDF-инвойсы", color: C_BLUE },
      { id: "creditCard", title: "CreditCard", cat: "B2B-рассрочка", color: C_INK },
      { id: "search", title: "Search", cat: "Умный AI-поиск", color: C_BLUE },
      { id: "zap", title: "Zap", cat: "Экспресс 10 сек", color: C_AMBER },
      { id: "radar", title: "Radar", cat: "Радар рисков", color: C_ALFA_RED },
      { id: "shieldCheck", title: "ShieldCheck", cat: "Паспорт готовности", color: C_GREEN },
      { id: "landmark", title: "Landmark", cat: "Мультибанк API", color: C_BLUE },
      { id: "handshake", title: "Handshake", cat: "Контр-офферы (4 шт)", color: C_AMBER },
      { id: "signature", title: "Signature", cat: "Подписание ПЭП", color: C_GREEN },
      { id: "barChart", title: "BarChart", cat: "Waterfall 5 факторов", color: C_BLUE },
      { id: "scale", title: "Scale", cat: "Инспектор X-Ray", color: C_ANTHRACITE },
      { id: "coins", title: "Coins", cat: "P&L банка", color: C_GREEN },
      { id: "mapPin", title: "MapPin", cat: "OpenStreetMap Geo", color: C_BLUE },
      { id: "clock", title: "Clock", cat: "Audit Trail лог", color: C_INK_MUTED },
      { id: "bell", title: "Bell", cat: "News-to-Action", color: C_AMBER },
      { id: "users", title: "Users", cat: "5 демо-компаний", color: C_INK },
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

    // 4 Decision Corridors Section from plan
    createText(frame0, "F0_Sec2", 40, 650, "3. Коридоры принятия кредитных решений (Decision Engine)", 16, "Bold", C_INK);
    const corridors = [
      { name: "Зеленый коридор", score: "RiskScore 750 – 1000", tag: "APPROVED (АВТО)", color: C_GREEN, icon: "checkCircle", desc: "Авто-одобрение за 5-10 сек. Ставка от КС ЦБ (14.5%/15.5%), опции «Подписка на кредит» и «Защита бизнеса»." },
      { name: "Желтый коридор", score: "RiskScore 600 – 749", tag: "COUNTER_OFFER (4 ШТ)", color: C_AMBER, icon: "handshake", desc: "4 умных оффера: MaxPayment, 9% от эквайринга без фикс. платежа в несезон, лестница лимитов, оплата инвойса." },
      { name: "Оранжевый коридор", score: "RiskScore 450 – 599", tag: "MANUAL_REVIEW / ДОЗАПРОС", color: C_BLUE, icon: "scale", desc: "Ручной разбор инспектором: кнопка NEED_MORE_INFO (дозапрос договора аренды в 1 клик) на Экране 2." },
      { name: "Красный / Hard Stop", score: "RiskScore < 450 / Стоп", tag: "REJECTED (ОТКАЗ)", color: C_ALFA_RED, icon: "alertTriangle", desc: "Тактичный мотивированный отказ без раскрытия секретных формул + персональный план оздоровления на 90 дней." },
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

    // Buttons Specimen
    createText(frame0, "F0_Sec3", 40, 890, "4. Компоненты UI Kit и элементы управления", 16, "Bold", C_INK);
    createButton(frame0, "Подать заявку за 10 сек", 40, 925, 230, 44, "primary", "zap");
    createButton(frame0, "Подписать договор ПЭП", 285, 925, 220, 44, "primary", "signature");
    createButton(frame0, "Рентген инспектора X-Ray", 520, 925, 220, 44, "secondary", "scale");
    createButton(frame0, "Парсинг PDF-счета", 755, 925, 190, 44, "outline", "fileText");
    createButton(frame0, "B2B-рассрочка", 960, 925, 170, 44, "ghost", "creditCard");

    // ==========================================
    // FRAME 1: SCREEN 1 — ДАШБОРД 360° ДНК И ФИНАНСОВЫЙ РАДАР
    // ==========================================
    const frame1 = figma.createFrame();
    frame1.name = "🖥️ 01 — Дашборд заемщика (360°-ДНК, Радар, Search-to-Credit)";
    frame1.x = 1540;
    frame1.y = 0;
    frame1.resize(1440, 1600);
    frame1.fills = hexFill(C_BG);
    figma.currentPage.appendChild(frame1);

    // 0. Persistent Header
    createGlobalPersistentHeader(
      frame1,
      { name: "ООО «Ростерс Кафе»", score: "610", okved_cluster: "HORECA" },
      "CEO_OWNER",
      1,
      "business",
      ["Купить кофемашину", "Зерно оптом 500кг", "Закрыть разрыв кассы", "Эквайринг 1%"]
    );

    // Company Header Banner (Client Contour)
    createSolidRect(frame1, "F1_PH", 0, 100, 1440, 110, 0, hexFill(C_SURFACE), hexFill(C_BORDER), 1);
    createBadge(frame1, "ООО", 40, 116, "pill-neutral");
    createBadge(frame1, "ИНН 7725112233", 95, 116, "pill-outline");
    createBadge(frame1, "ОКВЭД 56.10 (HORECA / Кафе)", 220, 116, "pill-outline");
    createBadge(frame1, "Кластер: Общепит", 415, 116, "pill-soft-good");
    createBadge(frame1, "Лимит FCF: 145 000 ₽/мес", 550, 116, "pill-soft-warn");

    createText(frame1, "CompTitle", 40, 144, "ООО «Ростерс Кафе»", 24, "Bold", C_INK);
    createText(frame1, "CompSub", 40, 176, "Генеральный директор Смирнов А.В. · Москва, ул. Мясницкая 18 · Выручка 8 400 000 ₽/мес · Остаток на счете: 1 240 000 ₽", 12, "Regular", C_INK_MUTED);

    // Revenue Growth Badge on right
    createSolidRect(frame1, "RevBadge", 1180, 112, 220, 85, 10, hexFill(C_BG), hexFill(C_BORDER), 1);
    createVectorIcon(frame1, "trendingUp", 1198, 122, 20, C_GREEN);
    createText(frame1, "RevB_L", 1226, 122, "Динамика выручки", 11, "Medium", C_INK_MUTED);
    createText(frame1, "RevB_V", 1198, 144, "+14.2%", 22, "Bold", C_GREEN);
    createText(frame1, "RevB_S", 1198, 170, "стабильный рост эквайринга", 10, "Regular", C_INK_FAINT);

    // ==========================================
    // HERO 1: 360° Business DNA (Full width: 1360px, 5 Balanced Blocks)
    // ==========================================
    createCard(frame1, "360°-портрет компании (Business DNA) — 5 ключевых блоков профиля", "Автоматический цифровой портрет без ручного заполнения 40 полей банковской анкеты", 40, 225, 1360, 215, "RiskScore 610", "pill-warn", "activity", C_ALFA_RED);
    const dnaBlocks = [
      { t: "1. Жизненный цикл", v: "Зрелый (4.8 года)", s: "ОПФ: ООО · 1 учредитель · ЕГРЮЛ ОК", i: "building", c: C_INK },
      { t: "2. Граф контрагентов", v: "14 поставщиков", s: "Якорный: «КофеОпт» (24% оборота)", i: "users", c: C_BLUE },
      { t: "3. Финансовый ритм", v: "FCF: 420 000 ₽/мес", s: "Безопасный MaxPayment: 145 000 ₽", i: "coins", c: C_GREEN },
      { t: "4. Внешняя среда", v: "GeoScore: 8.9 / 10", s: "Трафик 520 чел/час · Метро 180м", i: "mapPin", c: C_GREEN },
      { t: "5. Вектор интереса", v: "CAPEX (Оборудование)", s: "Целевой запрос: эспрессо-машина", i: "zap", c: C_AMBER }
    ];
    dnaBlocks.forEach((db, idx) => {
      const bx = 64 + idx * 265;
      const by = 305;
      createSolidRect(frame1, "DnaB_" + idx, bx, by, 250, 118, 8, hexFill(C_BG), hexFill(C_BORDER), 1);
      createVectorIcon(frame1, db.i, bx + 14, by + 12, 18, db.c);
      createText(frame1, "DnaBT_" + idx, bx + 14, by + 34, db.t, 11, "Bold", C_INK_MUTED);
      createText(frame1, "DnaBV_" + idx, bx + 14, by + 56, db.v, 14, "Bold", db.c, 220);
      createText(frame1, "DnaBS_" + idx, bx + 14, by + 86, db.s, 11, "Regular", C_INK_FAINT, 220);
    });

    // ==========================================
    // HERO 2: Financial Radar 60 Days (Full width: 1360px + Fair Price + Silence Mode)
    // ==========================================
    createCard(frame1, "Финансовый радар: прогноз кассы на 60 дней и честная цена кредита", "Ежедневный прогноз остатка по obligations_calendar (ЕНП 28-го, аренда, ФОТ) · Красная зона кассового разрыва", 40, 455, 1360, 315, "TRG_CASH_GAP", "pill-risk", "trendingDown", C_ALFA_RED);
    
    // Fair Price Comparison Banner (Obligatory requirement from BRD v3.0)
    createSolidRect(frame1, "FairPrice", 64, 535, 1312, 65, 8, hexFill({ r: 0.99, g: 0.94, b: 0.93 }), hexFill(C_ALFA_RED), 1);
    createVectorIcon(frame1, "alertTriangle", 80, 547, 22, C_ALFA_RED);
    createText(frame1, "FPT_1", 112, 545, "Обнаружен прогнозируемый кассовый разрыв 28 ноября (-380 000 ₽ на уплату налогов ЕНП)", 13, "Bold", C_ALFA_RED);
    createText(frame1, "FPT_2", 112, 567, "Честное сравнение переплаты банка: «Умный овердрафт на 7 дней» = переплата всего 1 260 ₽ (или 449 ₽ с Подпиской под 13%) против 14 800 ₽ по ошибочному годовому кредиту. Банк бережет деньги бизнеса: экономия 13 540 ₽!", 11, "Medium", C_INK, 1240);

    // Silence Mode Sub-banner
    createSolidRect(frame1, "SilenceBanner", 64, 610, 1312, 32, 6, hexFill({ r: 0.92, g: 0.97, b: 0.94 }), hexFill(C_GREEN), 1);
    createVectorIcon(frame1, "checkCircle", 76, 618, 16, C_GREEN);
    createText(frame1, "SilT", 100, 618, "Режим тишины (TRG_ANTI_SPAM): при отсутствии разрыва банк не навязывает кредит, а предлагает овернайт 16% годовых.", 11, "Medium", C_INK);

    // Visual Chart Axis & 22 Timeline Bars across 1312px
    createSolidRect(frame1, "F1_ChartBase", 64, 715, 1312, 1, 0, hexFill(C_BORDER_STRONG));
    createText(frame1, "F1_Axis0", 64, 722, "← Факт: 30 дней", 10, "Medium", C_INK_MUTED);
    createText(frame1, "F1_AxisMid", 640, 722, "28 ноя (ЕНП): -380 000 ₽ (Кассовый разрыв 7 дней)", 11, "Bold", C_ALFA_RED);
    createText(frame1, "F1_Axis60", 1260, 722, "Прогноз: +890k ₽ →", 10, "Medium", C_INK_MUTED);

    const f1Bars = [
      { x: 80, h: 45, c: C_GREEN }, { x: 135, h: 42, c: C_GREEN }, { x: 190, h: 38, c: C_GREEN },
      { x: 245, h: 35, c: C_GREEN }, { x: 300, h: 32, c: C_GREEN }, { x: 355, h: 28, c: C_GREEN },
      { x: 410, h: 24, c: C_GREEN }, { x: 465, h: 18, c: C_AMBER }, { x: 520, h: 12, c: C_AMBER },
      { x: 575, h: 8, c: C_AMBER }, { x: 630, h: 28, c: C_ALFA_RED, gap: true }, { x: 685, h: 34, c: C_ALFA_RED, gap: true },
      { x: 740, h: 14, c: C_GREEN }, { x: 795, h: 22, c: C_GREEN }, { x: 850, h: 28, c: C_GREEN },
      { x: 905, h: 34, c: C_GREEN }, { x: 960, h: 40, c: C_GREEN }, { x: 1015, h: 44, c: C_GREEN },
      { x: 1070, h: 48, c: C_GREEN }, { x: 1125, h: 52, c: C_GREEN }, { x: 1180, h: 56, c: C_GREEN },
      { x: 1235, h: 60, c: C_GREEN }
    ];
    f1Bars.forEach((b) => {
      const barY = b.gap ? 716 : (715 - b.h);
      createSolidRect(frame1, "BarF1", b.x, barY, 40, b.h, 4, hexFill(b.c));
    });

    // ==========================================
    // TWO BALANCED COLUMNS (Width: 668px each, Gap: 24px)
    // Left: 40..708 | Right: 732..1400
    // ==========================================

    // LEFT COLUMN — CARD 3: Transactions & B2B Installment
    createCard(frame1, "Выписка по счету и B2B-рассрочка (POST /installment)", "Кнопка «Вернуть в оборот» напротив крупных целевых расходов (>100k ₽)", 40, 785, 668, 380, "Рассрочка 3-6 мес", "pill-outline", "creditCard", C_INK);
    const txHeaders = ["ДАТА", "КОНТРАГЕНТ / НАЗНАЧЕНИЕ", "СУММА (₽)", "ЦЕЛЕВОЕ ДЕЙСТВИЕ"];
    const txX = [64, 130, 410, 520];
    txHeaders.forEach((th, idx) => {
      createText(frame1, "F1_TH_" + idx, txX[idx], 860, th, 10, "Bold", C_INK_FAINT);
    });
    createSolidRect(frame1, "F1_TxDiv0", 64, 878, 620, 1, 0, hexFill(C_BORDER));

    const txRows = [
      { dt: "21.10", name: "ООО «Зернотрейд» (Арабика 400кг)", sum: "-240 000 ₽", inst: true },
      { dt: "20.10", name: "АО «МосЭнергоСбыт» (Электричество)", sum: "-85 000 ₽", inst: false },
      { dt: "19.10", name: "ИП Сидоров (Сервис кофемашины)", sum: "-120 000 ₽", inst: true },
      { dt: "18.10", name: "Торговый эквайринг (Выручка кафе)", sum: "+390 000 ₽", inst: false }
    ];
    txRows.forEach((r, idx) => {
      const ry = 890 + idx * 62;
      createText(frame1, "F1_TxD_" + idx, txX[0], ry, r.dt, 11, "Regular", C_INK_MUTED);
      createText(frame1, "F1_TxN_" + idx, txX[1], ry, r.name, 11, "Bold", C_INK, 260);
      createText(frame1, "F1_TxS_" + idx, txX[2], ry, r.sum, 12, "Bold", r.sum.startsWith("+") ? C_GREEN : C_INK);

      if (r.inst) {
        createButton(frame1, "Вернуть в оборот", txX[3], ry - 6, 155, 32, "secondary", "creditCard");
      } else {
        createBadge(frame1, "Исполнено ✓", txX[3], ry, "pill-good");
      }
      createSolidRect(frame1, "F1_TxDiv_" + idx, 64, ry + 42, 620, 1, 0, hexFill(C_BORDER));
    });

    // LEFT COLUMN — CARD 4: Adaptive News-to-Action Feed
    createCard(frame1, "Адаптивная лента News-to-Action", "Гео-, сырьевые и отраслевые инсайты под ОКВЭД 56.10 с действием в 1 клик", 40, 1180, 668, 380, "HORECA Пульс", "pill-outline", "bell", C_AMBER);
    const newsItems = [
      {
        t: "📍 Открытие БЦ «Аквамарин» в 200м от кофейни",
        s: "Прогноз +350 гостей в утренние часы. Рекомендуем расширить зал.",
        act: "Рассчитать лимит расширения"
      },
      {
        t: "☕ Прогноз роста оптовых цен на зерно арабики +8%",
        s: "Зафиксируйте оптовые цены у поставщика «КофеОпт» через факторинг Альфы.",
        act: "Зафиксировать цены факторингом"
      },
      {
        t: "🏛️ Льготная программа кредитования общепита Москвы",
        s: "Субсидия ставки до 11.5% годовых при сохранении штата бариста.",
        act: "Подать заявку на субсидию"
      }
    ];
    newsItems.forEach((nw, idx) => {
      const ny = 1255 + idx * 98;
      createSolidRect(frame1, "NewsB_" + idx, 64, ny, 620, 88, 8, hexFill(C_BG), hexFill(C_BORDER), 1);
      createText(frame1, "NwT_" + idx, 76, ny + 8, nw.t, 12, "Bold", C_INK, 420);
      createText(frame1, "NwS_" + idx, 76, ny + 28, nw.s, 11, "Regular", C_INK_MUTED, 420);
      createButton(frame1, nw.act + " →", 475, ny + 24, 195, 36, "outline");
    });

    // RIGHT COLUMN — CARD 5: Smart Search Output Panel (Search-to-Credit)
    createCard(frame1, "Умный поиск (Search-to-Credit)", "Классификация CAPEX / Вилка цен / 3 поставщика / Ставка от КС ЦБ", 732, 785, 668, 380, "CAPEX Оборудование", "pill-good", "search", C_BLUE);
    createSolidRect(frame1, "SrchQBox", 756, 855, 620, 38, 8, hexFill(C_BG), hexFill(C_BORDER_STRONG), 1);
    createVectorIcon(frame1, "search", 768, 866, 16, C_ALFA_RED);
    createText(frame1, "SrchQT", 794, 866, "Купить кофемашину La Marzocco Linea PB…", 12, "Bold", C_INK);

    createText(frame1, "IntLbl", 756, 902, "Классифицированное намерение: CAPEX · Рыночная вилка: 1 450 000 ₽ – 1 950 000 ₽", 11, "Medium", C_INK_MUTED);

    // 3 Verified Suppliers
    const supps = [
      { n: "1. ООО «КофеМастер»", inn: "ИНН 7704889911", p: "1 850 000 ₽" },
      { n: "2. АО «Бариста Про»", inn: "ИНН 7701445566", p: "1 790 000 ₽" },
      { n: "3. ООО «Эспрессо Хаб»", inn: "ИНН 7802112233", p: "1 820 000 ₽" }
    ];
    supps.forEach((sp, idx) => {
      const sy = 925 + idx * 42;
      createSolidRect(frame1, "SuppB_" + idx, 756, sy, 620, 36, 6, hexFill(C_BG), hexFill(C_BORDER), 1);
      createText(frame1, "SpN_" + idx, 768, sy + 10, sp.n, 11, "Bold", C_INK);
      createText(frame1, "SpInn_" + idx, 940, sy + 10, sp.inn, 10, "Regular", C_INK_MUTED);
      createBadge(frame1, "ФССП 0 ₽", 1080, sy + 6, "pill-good");
      createText(frame1, "SpP_" + idx, 1280, sy + 10, sp.p, 11, "Bold", C_INK);
    });

    // Pre-validated credit banner & Primary CTA
    createSolidRect(frame1, "CredBan", 756, 1060, 620, 85, 8, hexFill({ r: 0.95, g: 0.97, b: 1.0 }), hexFill(C_BLUE), 1);
    createVectorIcon(frame1, "zap", 768, 1072, 18, C_BLUE);
    createText(frame1, "CredBanT", 794, 1070, "Предодобрен лизинг/кредит: ставка от 14.5% годовых", 12, "Bold", C_BLUE);
    createText(frame1, "CredBanS", 794, 1090, "КС ЦБ 14.0% + спред 0.5% с «Подпиской» и «Защитой бизнеса». Одобрение за 5 сек.", 11, "Regular", C_INK, 350);
    createButton(frame1, "Подать заявку на кофемашину в 1 клик →", 1070, 1075, 290, 46, "primary", "zap");

    // RIGHT COLUMN — CARD 6: Invoice-to-Credit (PDF Drag-and-Drop + OCR)
    createCard(frame1, "Invoice-to-Credit — Парсинг PDF-счета поставщика", "Drag-and-Drop загрузка + 3 быстрых демо-шаблона счетов для жюри", 732, 1180, 668, 380, "pdfplumber OCR", "pill-good", "fileText", C_BLUE);
    createText(frame1, "DemoBtnLabel", 756, 1255, "Демо-шаблоны счетов для жюри:", 11, "Bold", C_INK_MUTED);
    createButton(frame1, "1. LA_MARZOCCO", 756, 1275, 195, 34, "outline", "fileText");
    createButton(frame1, "2. ROSTERS_EQUIP", 965, 1275, 195, 34, "outline", "fileText");
    createButton(frame1, "3. CABLE_VVG", 1175, 1275, 195, 34, "outline", "fileText");

    // Recognized Invoice Box
    createSolidRect(frame1, "RecBox", 756, 1320, 620, 150, 8, hexFill(C_BG), hexFill(C_BORDER), 1);
    createVectorIcon(frame1, "fileText", 768, 1332, 22, C_BLUE);
    createText(frame1, "InvTitle", 800, 1330, "Счёт № 204 от 20.10.2026 · Поставщик: ООО «КофеМастер» (ИНН 7704889911)", 12, "Bold", C_INK);
    createText(frame1, "InvDetails", 800, 1352, "Сумма: 1 850 000 ₽ (в т.ч. НДС 308 333 ₽) · Назначение: Эспрессо-машина La Marzocco Linea PB", 11, "Regular", C_INK_MUTED, 400);

    createBadge(frame1, "ЕГРЮЛ: ДЕЙСТВУЕТ", 1180, 1330, "pill-good");
    createBadge(frame1, "ФССП: 0 ₽", 1300, 1330, "pill-good");

    createText(frame1, "InvFinT", 768, 1400, "Целевое финансирование: 1 572 500 ₽ (85% счета) под 14.5% годовых", 12, "Bold", C_GREEN);
    createButton(frame1, "Создать предзаполненную заявку в 1 клик →", 768, 1425, 596, 42, "primary", "zap");

    // ==========================================
    // FRAME 2: SCREEN 2 — ПАСПОРТ, МУЛЬТИБАНК, 4 КОНТР-ОФФЕРА И ПЭП
    // ==========================================
    const frame2 = figma.createFrame();
    frame2.name = "📝 02 — Экран 2: Паспорт, Мультибанк, 4 Контр-оффера, ПЭП";
    frame2.x = 3080;
    frame2.y = 0;
    frame2.resize(1440, 1600);
    frame2.fills = hexFill(C_BG);
    figma.currentPage.appendChild(frame2);

    // 0. Persistent Header
    createGlobalPersistentHeader(
      frame2,
      { name: "ООО «Ростерс Кафе»", score: "610", okved_cluster: "HORECA" },
      "CEO_OWNER",
      2,
      "business",
      ["Купить кофемашину", "Зерно оптом 500кг", "Закрыть разрыв кассы", "Эквайринг 1%"]
    );

    // Application Header
    createSolidRect(frame2, "F2_PH", 0, 100, 1440, 110, 0, hexFill(C_SURFACE), hexFill(C_BORDER), 1);
    createBadge(frame2, "ВСТРЕЧНЫЙ ОФФЕР (COUNTER_OFFER)", 40, 116, "pill-warn");
    createBadge(frame2, "Оборотный кредит / Эквайринг", 290, 116, "pill-outline");
    createBadge(frame2, "ID #ALFA-7725-ROST", 500, 116, "pill-outline");

    createText(frame2, "F2_Title", 40, 144, "Заявка на финансирование · Запрос 2 000 000 ₽", 24, "Bold", C_INK);
    createText(frame2, "F2_Meta", 40, 176, "ООО «Ростерс Кафе» · ИНН 7725112233 · Заявка проверена Decision Engine (RiskScore 610, Желтый коридор)", 12, "Regular", C_INK_MUTED);

    createButton(frame2, "Рентген инспектора (X-Ray) →", 1020, 132, 230, 42, "secondary", "scale");
    createButton(frame2, "В кабинет", 1260, 132, 140, 42, "outline");

    // ==========================================
    // WIDGET 1: Паспорт готовности заявки (4 карточки + геймификация)
    // ==========================================
    createCard(frame2, "Паспорт готовности заявки — 4 карточки проверок и динамический лимит", "Авто-валидация реестров ФНС, ГИР БО, БКИ и гео-локации · Геймификация роста лимита", 40, 225, 1360, 230, "Лимит +25% готов", "pill-good", "shieldCheck", C_GREEN);
    
    const passChecks = [
      {
        t: "1. Юр. профиль ФНС и ОПФ",
        st: "PASS (ЕГРЮЛ + ГИР БО)",
        d: "ООО «Ростерс Кафе», возраст 4.8 года. Баланс сдан в ГИР БО, массовых адресов нет, 1 учредитель.",
        c: C_GREEN,
        ic: "checkCircle"
      },
      {
        t: "2. Финансы и касса",
        st: "WARN (Кассовый разрыв)",
        d: "Оборот 8.4 млн ₽/мес. Обнаружен кассовый разрыв 28-го числа (-380k ₽). Выручка подтверждена.",
        c: C_AMBER,
        ic: "alertTriangle"
      },
      {
        t: "3. Гео-аналитика и локация",
        st: "PASS (GeoScore 8.9)",
        d: "Москва, Мясницкая 18. Трафик 520 чел/час, пешеходная зона, 2 станции метро в шаговой доступности.",
        c: C_GREEN,
        ic: "mapPin"
      },
      {
        t: "4. Документы и антифрод",
        st: "PASS (Инвойс проверен)",
        d: "Поставщик ООО «КофеМастер» (ИНН 7704889911) проверен: ФССП 0 ₽, действителен, НДС подтвержден.",
        c: C_GREEN,
        ic: "fileText"
      }
    ];

    passChecks.forEach((pc, idx) => {
      const bx = 64 + idx * 328;
      const by = 305;
      createSolidRect(frame2, "PassB_" + idx, bx, by, 316, 92, 8, hexFill(C_BG), hexFill(C_BORDER), 1);
      createVectorIcon(frame2, pc.ic, bx + 12, by + 12, 16, pc.c);
      createText(frame2, "PcbT_" + idx, bx + 34, by + 12, pc.t, 12, "Bold", C_INK);
      createBadge(frame2, pc.st, bx + 12, by + 34, pc.c === C_GREEN ? "pill-soft-good" : "pill-soft-warn");
      createText(frame2, "PcbD_" + idx, bx + 12, by + 60, pc.d, 10, "Regular", C_INK_MUTED, 292);
    });

    // Gamification limit progress bar
    createSolidRect(frame2, "LimProgBG", 64, 410, 1312, 30, 6, hexFill({ r: 0.94, g: 0.97, b: 0.95 }), hexFill(C_GREEN), 1);
    createVectorIcon(frame2, "trendingUp", 76, 417, 16, C_GREEN);
    createText(frame2, "LimProgT", 98, 418, "Геймификация лимита: Паспорт подтвержден на 90% · Доступный лимит увеличен с 1 200 000 ₽ до 1 500 000 ₽ (+25%)!", 11, "Bold", C_GREEN);

    // ==========================================
    // WIDGET 2: Валидатор аномалий и Мультибанк (Open Banking API — До ↔ После)
    // ==========================================
    createCard(frame2, "Валидатор аномалий и Мультибанк (Open Banking API — Снятие ограничений)", "Раскрывается при ANOMALY_VERIFICATION: бесшовное подтверждение оборотов сторонних банков через Open Banking", 40, 470, 1360, 180, "Open Banking API", "pill-outline", "landmark", C_BLUE);
    
    // Left: Before Open Banking
    createSolidRect(frame2, "AnomBefore", 64, 545, 380, 90, 8, hexFill({ r: 0.99, g: 0.96, b: 0.90 }), hexFill(C_AMBER), 1);
    createVectorIcon(frame2, "alertTriangle", 76, 557, 18, C_AMBER);
    createText(frame2, "AnomBT1", 100, 556, "1. До Open Banking (Дефицит выручки)", 11, "Bold", C_AMBER);
    createText(frame2, "AnomBT2", 76, 580, "Выручка в ФНС (14.8M ₽) > оборота в Альфе на 50%. Лимит заморожен на 1.2M ₽ (Оранжевый коридор).", 10, "Regular", C_INK_MUTED, 350);

    // Center Action Button & Arrow
    createSolidRect(frame2, "AnomMid", 460, 545, 440, 90, 8, hexFill({ r: 0.96, g: 0.97, b: 1.0 }), hexFill(C_BLUE), 1);
    createVectorIcon(frame2, "landmark", 476, 558, 22, C_BLUE);
    createText(frame2, "AnomMT1", 508, 556, "Подтянуть выписки Open Banking API", 12, "Bold", C_BLUE);
    createText(frame2, "AnomMT2", 508, 576, "Сбербанк (+2.4M ₽) · Т-Банк (+1.8M ₽) · ВТБ", 11, "Regular", C_INK_MUTED);
    createButton(frame2, "Стянуть выписки сторонних банков →", 476, 598, 408, 30, "secondary", "landmark");

    // Right: After Open Banking
    createSolidRect(frame2, "AnomAfter", 916, 545, 460, 90, 8, hexFill({ r: 0.93, g: 0.98, b: 0.94 }), hexFill(C_GREEN), 1);
    createVectorIcon(frame2, "checkCircle", 928, 557, 18, C_GREEN);
    createText(frame2, "AnomAT1", 952, 556, "2. После Open Banking (Аномалия снята)", 11, "Bold", C_GREEN);
    createText(frame2, "AnomAT2", 928, 580, "Оборот подтвержден: +4.2 млн ₽/мес · Начислено +90 баллов скоринга · Лимит разблокирован до 2.8M ₽ (+25%)!", 10, "Regular", C_INK, 430);

    // ==========================================
    // WIDGET 3: Витрина кредитного решения — 4 умных контр-оффера (Желтый коридор)
    // ==========================================
    createCard(frame2, "Витрина кредитных решений — 4 умных контр-оффера (Желтый коридор Decision Engine)", "Кейс ООО «Ростерс Кафе»: альтернативы финансирования с сохранением безопасного MaxPayment", 40, 665, 1360, 370, "Коридор COUNTER_OFFER", "pill-warn", "handshake", C_AMBER);
    const fourOffers = [
      {
        t: "1. Снижение суммы под MaxPayment",
        tag: "БЕЗОПАСНЫЙ СРОК",
        sum: "1 200 000 ₽",
        rate: "18.0% годовых · 24 мес.",
        pay: "Платеж: 59 900 ₽ / мес. (в лимите FCF)",
        d: "Снижение суммы под безопасный MaxPayment без риска дефолта.",
        c: C_GREEN,
        sel: false
      },
      {
        t: "2. Выплата 9% от эквайринга",
        tag: "РЕКОМЕНДОВАН КАФЕ",
        sum: "1 500 000 ₽",
        rate: "9% с дневного эквайринга",
        pay: "0 ₽ в несезонные дни",
        d: "Авто-списание % с выручки терминалов. Нет фиксированного платежа при простое.",
        c: C_ALFA_RED,
        sel: true
      },
      {
        t: "3. «Лестница лимитов»",
        tag: "ДИНАМИЧЕСКИЙ РОСТ",
        sum: "300 000 ₽ → 750 000 ₽",
        rate: "19.0% годовых · 12 мес.",
        pay: "Платеж: 27 600 ₽ / мес.",
        d: "300k ₽ сейчас + авто-увеличение до 750k ₽ после 3 платежей без просрочек.",
        c: C_BLUE,
        sel: false
      },
      {
        t: "4. Целевая оплата поставщику",
        tag: "ПО СЧЕТУ ИНВОЙСА",
        sum: "1 850 000 ₽ (100% счета)",
        rate: "14.5% годовых · 18 мес.",
        pay: "Платеж: 114 800 ₽ / мес.",
        d: "Прямая безналичная оплата за кофемашину La Marzocco проверенному поставщику.",
        c: C_ANTHRACITE,
        sel: false
      }
    ];

    fourOffers.forEach((o, idx) => {
      const ox = 64 + idx * 328;
      const oy = 745;
      createSolidRect(frame2, "OffCard_" + idx, ox, oy, 316, 265, 12, hexFill(C_SURFACE), hexFill(o.sel ? C_ALFA_RED : C_BORDER_STRONG), o.sel ? 2 : 1);
      if (o.sel) {
        createSolidRect(frame2, "OffStrip_" + idx, ox, oy, 316, 6, 0, hexFill(C_ALFA_RED));
      }
      createVectorIcon(frame2, "handshake", ox + 14, oy + 16, 16, o.c);
      createText(frame2, "OffT_" + idx, ox + 36, oy + 16, o.t, 11, "Bold", C_INK, 180);
      createBadge(frame2, o.tag, ox + 190, oy + 14, o.sel ? "pill-risk" : "pill-outline");

      createText(frame2, "OffSum_" + idx, ox + 14, oy + 54, o.sum, 18, "Bold", C_INK);
      createText(frame2, "OffRate_" + idx, ox + 14, oy + 82, o.rate, 11, "Medium", C_INK_MUTED);
      createText(frame2, "OffPay_" + idx, ox + 14, oy + 104, o.pay, 12, "Bold", o.c, 288);
      createText(frame2, "OffD_" + idx, ox + 14, oy + 134, o.d, 10, "Regular", C_INK_FAINT, 288);

      createButton(frame2, o.sel ? "Выбрано заемщиком ✓" : "Выбрать оффер", ox + 14, oy + 215, 288, 36, o.sel ? "primary" : "outline");
    });

    // ==========================================
    // WIDGET 4: Подписание договора ПЭП и Maker-Checker
    // ==========================================
    createCard(frame2, "Подписание договора ПЭП и зачисление средств (AWAITING_CEO_APPROVAL → FUNDED)", "Разграничение прав ролей: Бухгалтер (403 Forbidden) vs Генеральный директор (право подписи ПЭП)", 40, 1055, 1360, 480, "Maker-Checker", "pill-neutral", "signature", C_GREEN);
    createSolidRect(frame2, "SignBoxF2", 64, 1135, 1312, 380, 12, hexFill(C_BG), hexFill(C_BORDER), 1);

    // Maker-checker explanation alert
    createSolidRect(frame2, "RoleRule", 90, 1155, 1260, 44, 8, hexFill({ r: 0.95, g: 0.97, b: 1.0 }), hexFill(C_BLUE), 1);
    createVectorIcon(frame2, "shieldCheck", 104, 1167, 20, C_BLUE);
    createText(frame2, "RoleRuleT", 132, 1167, "Контроль полномочий ЕИО (Maker-Checker): Бухгалтер может подготовить заявку (Maker), но кнопка подписи доступна только Генеральному директору (Checker). Для ИП доступно подписание в одно лицо.", 11, "Medium", C_INK);

    // Contract terms
    createVectorIcon(frame2, "fileText", 90, 1215, 22, C_BLUE);
    createText(frame2, "SignDocT", 120, 1215, "1. Сформирован договор финансирования № ALFA-7725-ROST (PDF, 4 стр.)", 15, "Bold", C_INK);
    createText(frame2, "SignDocS", 120, 1238, "Индивидуальные условия: 1 500 000 ₽ с погашением 9% от эквайринга · График гибких списаний · Без залога", 12, "Medium", C_INK_MUTED);

    // OTP Code box
    createVectorIcon(frame2, "signature", 90, 1275, 22, C_GREEN);
    createText(frame2, "SignOtpT", 120, 1275, "2. Подтверждение простой электронной подписью (ПЭП / SMS-код)", 15, "Bold", C_INK);
    createText(frame2, "SignOtpS", 120, 1298, "Код отправлен на подтвержденный номер Генерального директора: +7 (999) 772-51-12", 12, "Regular", C_INK_MUTED);

    [0, 1, 2, 3].forEach((pos) => {
      const digit = ["4", "8", "2", "9"][pos];
      createSolidRect(frame2, "F2_Otp_" + pos, 120 + pos * 65, 1330, 52, 56, 8, hexFill(C_SURFACE), hexFill(C_ALFA_RED), 2);
      createText(frame2, "F2_OtpD_" + pos, 138 + pos * 65, 1342, digit, 24, "Bold", C_INK);
    });

    createText(frame2, "F2_SignAgree", 120, 1405, "☑️ С индивидуальными условиями договора ознакомлен и согласен. Подтверждаю целевой характер использования средств.", 12, "Medium", C_INK);

    createButton(frame2, "Подписать договор ПЭП и получить средства на расчетный счет →", 120, 1440, 540, 48, "primary", "checkCircle");
    createBadge(frame2, "МГНОВЕННОЕ ЗАЧИСЛЕНИЕ FUNDED", 680, 1450, "pill-good");

    // ==========================================
    // FRAME 3: SCREEN 3 — РЕНТГЕН ИНСПЕКТОРА (КОНТУР БАНКА)
    // ==========================================
    const frame3 = figma.createFrame();
    frame3.name = "🔬 03 — Экран 3: Рентген инспектора (X-Ray, Waterfall, P&L, Audit)";
    frame3.x = 4620;
    frame3.y = 0;
    frame3.resize(1440, 1620);
    frame3.fills = hexFill(C_BG);
    figma.currentPage.appendChild(frame3);

    // 0. Persistent Header (Active role: Bank Inspector)
    createGlobalPersistentHeader(
      frame3,
      { name: "ООО «Ростерс Кафе»", score: "610", okved_cluster: "HORECA" },
      "CEO_OWNER",
      3,
      "bank",
      ["Купить кофемашину", "Зерно оптом 500кг", "Закрыть разрыв кассы", "Эквайринг 1%"]
    );

    // Bank X-Ray Header Banner
    createSolidRect(frame3, "F3_PH", 0, 100, 1440, 110, 0, hexFill(C_SURFACE), hexFill(C_BORDER), 1);
    createBadge(frame3, "ЭКРАН 3 · КОНТУР БАНКА", 40, 116, "pill-risk");
    createBadge(frame3, "Decision Engine: Желтый коридор", 220, 116, "pill-warn");
    createBadge(frame3, "ID #ALFA-7725-ROST", 475, 116, "pill-outline");

    createText(frame3, "F3_Title", 40, 144, "Рабочее место инспектора: Рентген заявки ООО «Ростерс Кафе»", 24, "Bold", C_INK);
    createText(frame3, "F3_Meta", 40, 176, "RiskScore 610 · Статус: COUNTER_OFFER · Ставка 18.0% (КС ЦБ 14.0% + спред 4.0%) · Время обработки: 4.8 сек", 12, "Regular", C_INK_MUTED);

    createButton(frame3, "Перейти в контур клиента", 1210, 132, 190, 42, "outline");

    // ==========================================
    // TOP PANEL: P&L Эффект для Альфа-Банка (4 карточки бизнес-показателей)
    // ==========================================
    const pnlCards = [
      { t: "Time-to-Yes (Решение)", v: "5 сек", s: "вместо 3 рабочих дней", c: C_GREEN, i: "zap" },
      { t: "Снижение оттока (Drop-off)", v: "-38%", s: "за счет отказа от 40 полей анкеты", c: C_GREEN, i: "trendingDown" },
      { t: "Доля спасенных заявок", v: "+24%", s: "конверсия через 4 умных контр-оффера", c: C_GREEN, i: "handshake" },
      { t: "Снижение дефолта (NPL)", v: "-42%", s: "защита от First Payment Default", c: C_BLUE, i: "shieldCheck" }
    ];
    pnlCards.forEach((pc, idx) => {
      const px = 40 + idx * 345;
      createSolidRect(frame3, "PnlTopB_" + idx, px, 225, 325, 92, 10, hexFill(C_SURFACE), hexFill(C_BORDER), 1);
      createVectorIcon(frame3, pc.i, px + 16, 240, 20, pc.c);
      createText(frame3, "PnlTopT_" + idx, px + 44, 240, pc.t, 11, "Medium", C_INK_MUTED);
      createText(frame3, "PnlTopV_" + idx, px + 16, 265, pc.v, 24, "Bold", pc.c);
      createText(frame3, "PnlTopS_" + idx, px + 16, 295, pc.s, 10, "Regular", C_INK_FAINT);
    });

    // Special Legal OPF Badge Banner (IP vs OOO distinction from plan)
    createSolidRect(frame3, "OpfBanner", 40, 332, 1360, 44, 8, hexFill({ r: 0.95, g: 0.97, b: 1.0 }), hexFill(C_BLUE), 1);
    createVectorIcon(frame3, "building", 56, 344, 18, C_BLUE);
    createText(frame3, "OpfBannerT", 84, 345, "Специальный юридический бейдж ОПФ: ООО • Корпоративный контроль полномочий ЕИО (Maker-Checker) • Баланс верифицирован по ГИР БО ФНС РФ (Активы: 14.2M ₽, Обязательства: 3.1M ₽). Для ИП применяется полная имущественная ответственность физлица.", 11, "Bold", C_INK);

    // ==========================================
    // SECTION 1: Waterfall скоринга (5 факторов) & Калькуляция лимита
    // ==========================================
    createCard(frame3, "Рентген скоринга (Waterfall-диаграмма) и калькуляция ставки от КС ЦБ РФ", "Base = 500 + точный дискретный вклад 5 факторов (БКИ, Поток, ПДН, ФНС, GeoScore) = ровно 610 баллов", 40, 390, 850, 360, "Waterfall 5 факторов", "pill-warn", "barChart", C_BLUE);

    // Formula & Rate Breakdown
    createSolidRect(frame3, "RateFormBox", 64, 475, 802, 58, 8, hexFill(C_BG), hexFill(C_BORDER), 1);
    createVectorIcon(frame3, "coins", 76, 486, 18, C_BLUE);
    createText(frame3, "RateFormT", 102, 484, "Формула кредитной ставки: КС ЦБ РФ (14.0%) + ProductSpread (2.5%) + RiskAdjustment (1.5%) = 18.0% годовых", 12, "Bold", C_INK);
    createText(frame3, "RateFormS", 102, 508, "Рассчитанные лимиты бизнеса: Чистый поток FCF = 420 000 ₽/мес · Безопасный аннуитет MaxPayment = 145 000 ₽/мес.", 11, "Medium", C_GREEN);

    // Waterfall Bars
    const wfFactors = [
      { name: "База", val: "500", h: 90, c: C_ANTHRACITE, sub: "Стартовый уровень" },
      { name: "G1 БКИ", val: "+80", h: 55, c: C_GREEN, sub: "0 просрочек" },
      { name: "G2 Поток", val: "+65", h: 48, c: C_GREEN, sub: "Альфа-эквайринг" },
      { name: "G3 ПДН", val: "+35", h: 32, c: C_GREEN, sub: "DSCR 1.8x" },
      { name: "G4 ФНС", val: "+30", h: 28, c: C_GREEN, sub: "Отчетность ГИР БО" },
      { name: "G5 Geo", val: "-100", h: 65, c: C_ALFA_RED, sub: "Риск разрыва 28-го", gap: true },
      { name: "Итог", val: "610", h: 110, c: C_AMBER, sub: "Желтый коридор" }
    ];
    wfFactors.forEach((wf, idx) => {
      const wx = 64 + idx * 114;
      const barY = 680 - wf.h;
      createSolidRect(frame3, "WfBar_" + idx, wx, barY, 82, wf.h, 6, hexFill(wf.c));
      createVectorIcon(frame3, wf.gap ? "trendingDown" : "trendingUp", wx + 8, barY - 22, 14, wf.c);
      createText(frame3, "WfVal_" + idx, wx + 26, barY - 20, wf.val, 13, "Bold", wf.c);
      createText(frame3, "WfName_" + idx, wx, 690, wf.name, 11, "Bold", C_INK);
      createText(frame3, "WfSub_" + idx, wx, 706, wf.sub, 9, "Regular", C_INK_MUTED);
    });

    // ==========================================
    // SECTION 2: Банковская ценность парсинга PDF и кассы (Ответ для Ольги Урсул)
    // ==========================================
    createCard(frame3, "Банковская ценность парсинга PDF и прогноза кассы (Ответ для Ольги Урсул)", "Обоснование защиты банка от вывода средств и снижения раннего дефолта NPL", 905, 390, 495, 360, "Защита от NPL", "pill-good", "shieldCheck", C_GREEN);
    
    createSolidRect(frame3, "UrsulB1", 929, 475, 447, 110, 8, hexFill({ r: 0.94, g: 0.98, b: 0.95 }), hexFill(C_GREEN), 1);
    createVectorIcon(frame3, "shieldCheck", 943, 487, 20, C_GREEN);
    createText(frame3, "UrsulT1", 969, 487, "1. Защита от вывода средств на однодневки", 12, "Bold", C_GREEN);
    createText(frame3, "UrsulS1", 943, 511, "Парсинг ИНН поставщика из PDF-счета гарантирует целевое расходование: деньги перечисляются напрямую проверенному поставщику оборудования (ООО «КофеМастер»), исключая обналичивание кредитных средств.", 10, "Regular", C_INK, 420);

    createSolidRect(frame3, "UrsulB2", 929, 600, 447, 125, 8, hexFill({ r: 0.95, g: 0.97, b: 1.0 }), hexFill(C_BLUE), 1);
    createVectorIcon(frame3, "trendingUp", 943, 612, 20, C_BLUE);
    createText(frame3, "UrsulT2", 969, 612, "2. Снижение раннего дефолта (First Payment Default)", 12, "Bold", C_BLUE);
    createText(frame3, "UrsulS2", 943, 636, "60-дневный прогноз кассы спасает рентабельный бизнес от панического дорогого годового кредита. Овердрафт на 7 дней полностью закрывает разрыв под ЕНП без перегрузки долговой нагрузки (DTI < 25%).", 10, "Regular", C_INK, 420);

    // ==========================================
    // SECTION 3: OpenStreetMap GeoScore (Реалистичная карта центра Москвы)
    // ==========================================
    createCard(frame3, "Гео-аналитика OpenStreetMap (GeoScore) — Локация точки общепита", "Радиус 400 м: точки притяжения трафика (метро, БЦ, вузы) и маркеры конкурентов (amenity=cafe)", 40, 765, 668, 395, "GeoScore: 8.9 / 10", "pill-good", "mapPin", C_BLUE);

    // Realistic Vector Map Container (w: 620, h: 220)
    const mapBox = createSolidRect(frame3, "RealMapBox", 64, 850, 620, 215, 8, hexFill({ r: 0.92, g: 0.94, b: 0.96 }), hexFill(C_BORDER_STRONG), 1);

    // Street Grid Vector Lines
    createSolidRect(frame3, "St_Myasn", 110, 865, 520, 16, 2, hexFill(C_WHITE)); // Мясницкая
    createText(frame3, "StLbl1", 140, 867, "ул. Мясницкая (пешеходная)", 10, "Bold", C_INK_MUTED);

    createSolidRect(frame3, "St_Maros", 90, 940, 550, 14, 2, hexFill(C_WHITE)); // Маросейка
    createText(frame3, "StLbl2", 400, 942, "ул. Маросейка", 9, "Bold", C_INK_MUTED);

    createSolidRect(frame3, "St_Luby", 220, 855, 14, 200, 2, hexFill(C_WHITE)); // Лубянский проезд
    createText(frame3, "StLbl3", 225, 990, "Лубянский пр.", 8, "Bold", C_INK_MUTED);

    // Building Blocks
    createSolidRect(frame3, "Bld1", 130, 890, 75, 42, 4, hexFill({ r: 0.82, g: 0.86, b: 0.90 }));
    createSolidRect(frame3, "Bld2", 245, 890, 90, 42, 4, hexFill({ r: 0.82, g: 0.86, b: 0.90 }));
    createSolidRect(frame3, "Bld3", 350, 890, 110, 42, 4, hexFill({ r: 0.82, g: 0.86, b: 0.90 }));
    createSolidRect(frame3, "Bld4", 475, 890, 80, 42, 4, hexFill({ r: 0.82, g: 0.86, b: 0.90 }));

    // Isochrone 400m Radius Circle Overlay
    const radiusCircle = figma.createEllipse();
    radiusCircle.name = "Isochrone_400m";
    radiusCircle.x = 230;
    radiusCircle.y = 860;
    radiusCircle.resize(190, 190);
    radiusCircle.fills = hexFill({ r: 0.15, g: 0.39, b: 0.92, a: 0.10 });
    radiusCircle.strokes = hexFill(C_BLUE);
    radiusCircle.strokeWeight = 1.5;
    radiusCircle.dashPattern = [4, 4];
    frame3.appendChild(radiusCircle);

    // Target Client Pin (Alfa Red)
    createVectorIcon(frame3, "mapPin", 315, 900, 24, C_ALFA_RED);
    createBadge(frame3, "ООО «Ростерс Кафе»", 345, 902, "pill-risk");

    // Metro Pins (Green)
    createVectorIcon(frame3, "users", 135, 960, 18, C_GREEN);
    createBadge(frame3, "М. Лубянка (220м)", 160, 958, "pill-soft-good");

    createVectorIcon(frame3, "users", 520, 860, 18, C_GREEN);
    createBadge(frame3, "М. Чистые пруды (180м)", 470, 882, "pill-soft-good");

    // Competitor Pins (Amber)
    createVectorIcon(frame3, "alertTriangle", 270, 965, 14, C_AMBER);
    createVectorIcon(frame3, "alertTriangle", 450, 920, 14, C_AMBER);

    // Map Metrics Footer
    createSolidRect(frame3, "GeoFootBox", 64, 1075, 620, 70, 8, hexFill(C_BG), hexFill(C_BORDER), 1);
    createText(frame3, "GfL1", 76, 1085, "Пешеходный трафик:", 11, "Medium", C_INK_MUTED);
    createText(frame3, "GfV1", 76, 1103, "520 чел / час (Высокий)", 15, "Bold", C_GREEN);

    createText(frame3, "GfL2", 340, 1085, "Индекс локации & Конкуренция:", 11, "Medium", C_INK_MUTED);
    createText(frame3, "GfV2", 340, 1103, "Класс А+ · 3 кафе в 400м (Сбалансировано)", 14, "Bold", C_BLUE);

    // ==========================================
    // SECTION 4: Панель действий инспектора (POST /underwriter-action)
    // ==========================================
    createCard(frame3, "Панель действий кредитного инспектора (POST /underwriter-action)", "4 кнопки управления заявкой: Одобрить / Контр-оффер / Дозапрос / Отказ", 732, 765, 668, 395, "Ручной разбор", "pill-neutral", "scale", C_ANTHRACITE);
    
    // 4 Action Buttons with clear CTA hierarchy
    createButton(frame3, "1. Одобрить (APPROVE)", 756, 850, 298, 44, "primary", "checkCircle");
    createButton(frame3, "2. Контр-оффер (Лестница лимитов)", 1078, 850, 298, 44, "secondary", "handshake");
    createButton(frame3, "3. Запросить документ (NEED_MORE_INFO)", 756, 905, 298, 44, "outline", "fileText");
    createButton(frame3, "4. Отказать (REJECT)", 1078, 905, 298, 44, "ghost", "alertTriangle");

    // Underwriter comment box (ACID logging)
    createSolidRect(frame3, "UndCommBox", 756, 965, 620, 180, 8, hexFill(C_BG), hexFill(C_BORDER), 1);
    createText(frame3, "UndCommL", 772, 978, "Служебный комментарий андеррайтера (запись в ACID-аудит лог):", 11, "Bold", C_INK_FAINT);
    createText(frame3, "UndCommT", 772, 1002, "«Клиент рентабелен, выручка подтверждена эквайрингом Альфы. Одобрено встречное предложение №2 (9% с эквайринга) для исключения кассового разрыва 28-го числа. Дополнительный залог не требуется. Документы поставщика верифицированы по ЕГРЮЛ.»", 12, "Regular", C_INK, 580);
    createBadge(frame3, "СТАТУС: СОГЛАСОВАНО ИНСПЕКТОРОМ ✓", 772, 1095, "pill-good");

    // ==========================================
    // SECTION 5: Таблица неизменяемого журнала аудита (Audit Trail / application_events)
    // ==========================================
    createCard(frame3, "Неизменяемый журнал аудита (Audit Trail / application_events)", "Посекундный лог смены статусов State Machine (from_status → to_status, actor_role, timestamp) в одной ACID-транзакции", 40, 1180, 1360, 420, "ACID Audit Trail", "pill-outline", "clock", C_INK_MUTED);
    const auditHeaders = ["ВРЕМЯ", "СОБЫТИЕ", "FROM STATUS → TO STATUS", "РОЛЬ / АКТОР", "ПРАВИЛО / RULE_CODE", "ЗАДЕРЖКА"];
    const aX = [64, 170, 520, 840, 1080, 1290];
    auditHeaders.forEach((ah, idx) => {
      createText(frame3, "AH_" + idx, aX[idx], 1260, ah, 10, "Bold", C_INK_FAINT);
    });
    createSolidRect(frame3, "ADiv0", 64, 1280, 1312, 1, 0, hexFill(C_BORDER));

    const auditRows = [
      { t: "14:32:01.102", ev: "Создание заявки из Умного поиска", st: "DRAFT → SCORING_QUEUED", role: "EMPLOYEE_BUYER", rule: "RULE_START_APP", ms: "0.00s", ic: "search" },
      { t: "14:32:01.215", ev: "Запрос в ЕГРЮЛ и ГИР БО ФНС", st: "SCORING_QUEUED → REGISTRY_VERIFIED", role: "SYSTEM_WORKER", rule: "RULE_EGRUL_PASS", ms: "0.11s", ic: "checkCircle" },
      { t: "14:32:01.440", ev: "Скоринг БКИ и FCF поток", st: "REGISTRY_VERIFIED → CALCULATED", role: "DECISION_ENGINE", rule: "RULE_SCORE_610", ms: "0.22s", ic: "barChart" },
      { t: "14:32:01.590", ev: "Decision: Желтый коридор", st: "CALCULATED → COUNTER_OFFER", role: "DECISION_ENGINE", rule: "RULE_OFFERS_GEN", ms: "0.15s", ic: "handshake" },
      { t: "14:32:05.812", ev: "Выбор оффера 9% эквайринг", st: "COUNTER_OFFER → AWAITING_CEO_APPROVAL", role: "EMPLOYEE_BUYER", rule: "RULE_SELECT_OFFER", ms: "0.04s", ic: "zap" },
      { t: "14:32:18.420", ev: "Подписание договора ПЭП", st: "CONTRACT_SIGNING → FUNDED", role: "CEO_OWNER", rule: "RULE_PEP_SIGN_OK", ms: "0.08s", ic: "signature" }
    ];
    auditRows.forEach((ar, idx) => {
      const ary = 1298 + idx * 46;
      createText(frame3, "AT_" + idx, aX[0], ary, ar.t, 11, "Medium", C_INK_MUTED);
      createVectorIcon(frame3, ar.ic, aX[1], ary, 14, C_INK);
      createText(frame3, "AE_" + idx, aX[1] + 20, ary, ar.ev, 11, "Bold", C_INK);
      createText(frame3, "AS_" + idx, aX[2], ary, ar.st, 11, "Medium", C_BLUE);
      createText(frame3, "AR_" + idx, aX[3], ary, ar.role, 11, "Bold", ar.role.startsWith("CEO") ? C_ALFA_RED : C_INK_MUTED);
      createText(frame3, "ARC_" + idx, aX[4], ary, ar.rule, 10, "Medium", C_INK_FAINT);
      createBadge(frame3, ar.ms, aX[5], ary - 4, "pill-outline");
      createSolidRect(frame3, "ADiv_" + idx, 64, ary + 32, 1312, 1, 0, hexFill(C_BORDER));
    });

    // ==========================================
    // FRAME 4: 5 ЭТАЛОННЫХ КОМПАНИЙ BRD V3.0
    // ==========================================
    const frame4 = figma.createFrame();
    frame4.name = "👥 04 — Матрица 5 эталонных компаний (BRD v3.0)";
    frame4.x = 1540;
    frame4.y = 1730;
    frame4.resize(1440, 800);
    frame4.fills = hexFill(C_BG);
    figma.currentPage.appendChild(frame4);

    createSolidRect(frame4, "F4_HeaderBG", 0, 0, 1440, 95, 0, hexFill(C_ANTHRACITE));
    createVectorIcon(frame4, "users", 40, 32, 32, C_ALFA_RED);
    createText(frame4, "F4_Super", 84, 22, "МАТРИЦА 5 ЭТАЛОННЫХ КОМПАНИЙ ХАКАТОНА (BRD V3.0 / ТЗ-00...ТЗ-05)", 11, "Bold", C_ALFA_RED);
    createText(frame4, "F4_Title", 84, 44, "Сквозные сценарии проверки скоринга, ролей и коридоров решений", 20, "Bold", C_WHITE);
    createText(frame4, "F4_Sub", 84, 70, "Позволяет жюри за 3 минуты протестировать всю бизнес-логику платформы без ручного ввода", 12, "Regular", C_INK_FAINT);

    const fiveCompanies = [
      {
        name: "1. ИП Смирнов А.В.",
        opf: "ИП · Физлицо",
        okved: "RETAIL / Магазин",
        score: "RiskScore 815",
        corr: "ЗЕЛЕНЫЙ КОРИДОР",
        decision: "APPROVED (АВТО-ОДОБРЕНИЕ)",
        rate: "Ставка: 14.5% · 12 мес.",
        desc: "Розничный магазин. Безупречная кредитная история БКИ, FCF 420k ₽/мес. Доступно подписание ПЭП сразу «в одно лицо» без корпоративного согласования.",
        c: C_GREEN,
        ic: "checkCircle",
        badgeType: "pill-good"
      },
      {
        name: "2. ООО «Ростерс Кафе»",
        opf: "ООО · Maker-Checker",
        okved: "HORECA / Кофейня",
        score: "RiskScore 610",
        corr: "ЖЕЛТЫЙ КОРИДОР",
        decision: "4 УМНЫХ КОНТР-ОФФЕРА",
        rate: "Ставка: 9% с эквайринга",
        desc: "Кофейня. Разрыв кассы 28-го числа. Витрина 4 офферов (списание 9% с эквайринга, лестница лимитов). Бухгалтер = 403 Forbidden, подписывает только CEO.",
        c: C_AMBER,
        ic: "handshake",
        badgeType: "pill-warn"
      },
      {
        name: "3. ООО «ТехноСтрой»",
        opf: "ООО · Мультибанк",
        okved: "CONSTRUCTION / Стройка",
        score: "295 → 760 (СКОР +90)",
        corr: "ЗЕЛЕНЫЙ (ПОСЛЕ МУЛЬТИБАНКА)",
        decision: "АНУЛИРОВАНИЕ АНОМАЛИИ",
        rate: "Ставка: 15.5% · Лимит +25%",
        desc: "Подрядчик. Аномалия выручки >50% -> раскрытие Мультибанка -> подтяжка Сбер/Т-Банк/ВТБ (+4.2 млн) -> снятие аномалии, рост балла 295->760 и авто-одобрение.",
        c: C_BLUE,
        ic: "landmark",
        badgeType: "pill-outline"
      },
      {
        name: "4. ИП Ковалев Д.С.",
        opf: "ИП · Ручной разбор",
        okved: "LOGISTICS / Грузоперевозки",
        score: "RiskScore 495",
        corr: "ОРАНЖЕВЫЙ (MANUAL_REVIEW)",
        decision: "NEED_MORE_INFO (ДОЗАПРОС)",
        rate: "Запрос договора аренды",
        desc: "Логистика. Пограничный скор. Инспектор на Экране 3 нажимает «Запросить документ в 1 клик» -> у клиента на Экране 2 появляется карточка дозагрузки аренды.",
        c: C_AMBER,
        ic: "scale",
        badgeType: "pill-warn"
      },
      {
        name: "5. ООО «Бодрость Плюс»",
        opf: "ООО · Стоп-фактор",
        okved: "HORECA / Фитнес-кафе",
        score: "RiskScore 0 (HARD STOP)",
        corr: "КРАСНЫЙ КОРИДОР",
        decision: "REJECTED (ОТКАЗ)",
        rate: "Мгновенный отказ (0.12с)",
        desc: "Судебные иски ФССП >4 млн ₽, массовый учредитель, долг перед ФНС. Тактичный отказ без раскрытия секретных формул + чек-лист оздоровления на 90 дней.",
        c: C_ALFA_RED,
        ic: "alertTriangle",
        badgeType: "pill-risk"
      }
    ];

    fiveCompanies.forEach((comp, idx) => {
      const cx = 40 + idx * 275;
      const cy = 125;
      const cCard = createSolidRect(frame4, "CompCard_" + idx, cx, cy, 260, 630, 12, hexFill(C_SURFACE), hexFill(C_BORDER), 1);
      createSolidRect(frame4, "CompStrip_" + idx, cx, cy, 260, 6, 0, hexFill(comp.c));

      createVectorIcon(frame4, comp.ic, cx + 16, cy + 20, 20, comp.c);
      createText(frame4, "CName_" + idx, cx + 44, cy + 20, comp.name, 14, "Bold", C_INK);
      createText(frame4, "COpf_" + idx, cx + 16, cy + 48, comp.opf, 11, "Medium", C_INK_FAINT);
      createText(frame4, "COkved_" + idx, cx + 16, cy + 66, comp.okved, 10, "Bold", C_BLUE);

      createBadge(frame4, comp.corr, cx + 16, cy + 92, comp.badgeType);
      createText(frame4, "CScore_" + idx, cx + 16, cy + 130, comp.score, 16, "Bold", comp.c);

      const decBox = createSolidRect(frame4, "CDecBox_" + idx, cx + 16, cy + 165, 228, 75, 8, hexFill(C_BG), hexFill(C_BORDER), 1);
      createText(frame4, "CDecLbl_" + idx, cx + 24, cy + 175, "РЕШЕНИЕ КОНВЕЙЕРА:", 9, "Bold", C_INK_FAINT);
      createText(frame4, "CDecVal_" + idx, cx + 24, cy + 192, comp.decision, 11, "Bold", comp.c, 210);
      createText(frame4, "CDecRate_" + idx, cx + 24, cy + 214, comp.rate, 10, "Medium", C_INK_MUTED);

      createText(frame4, "CDesc_" + idx, cx + 16, cy + 258, comp.desc, 12, "Regular", C_INK, 228);
    });

    // Viewport zoom and notify
    figma.viewport.scrollAndZoomIntoView([frame0, frame1, frame2, frame3, frame4]);

    figma.notify("✨ Полный дизайн Only_Alfa по плану aaaю.md успешно отрисован на холсте Figma!");
  } catch (err) {
    figma.notify("❌ Ошибка генерации: " + err.message, { error: true });
    console.error(err);
  } finally {
    figma.closePlugin();
  }
})();
