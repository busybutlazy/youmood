// 行銷頁面用的靜態內容（非 API 資料）。文案沿用既有前台。

// 首頁 Hero 輪播
export const heroSlides = [
  {
    id: 1,
    subtitle: "溫潤質感，自然生活",
    title: "手作木器",
    description: "每一件木製品都承載著時間的痕跡與匠人的溫度",
    image:
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1600&q=80",
    cta: { label: "探索更多", to: "/products" },
  },
  {
    id: 2,
    subtitle: "布料與針線的藝術",
    title: "拼布創作",
    description: "一針一線編織生活的色彩與溫暖",
    image:
      "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=1600&q=80",
    cta: { label: "探索更多", to: "/products" },
  },
  {
    id: 3,
    subtitle: "獨立手作品牌",
    title: "以自然為靈感",
    description: "為生活注入手作的溫度",
    image:
      "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=1600&q=80",
    cta: { label: "探索更多", to: "/products" },
  },
];

// 首頁特色三項
export const features = [
  {
    icon: "leaf",
    title: "自然材料",
    description: "嚴選天然木材與優質布料",
  },
  {
    icon: "hand",
    title: "手工製作",
    description: "每件作品皆由手工完成",
  },
  {
    icon: "sparkles",
    title: "獨特設計",
    description: "原創設計，獨一無二",
  },
];

// 首頁品牌介紹區塊
export const brandIntro = {
  eyebrow: "森日工作室",
  title: "關於游木工坊",
  paragraphs: [
    "一直以來喜歡木頭的紋路、溫度和香氣，將自然界最真實的禮物，融入生活是游木的理念。",
    "希望您在使用或欣賞作品時，能感受到自然的陪伴，讓木藝不只是裝飾，而是生活的一部分。",
  ],
  cta: { label: "了解更多", to: "/about" },
  image:
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
};

// 關於頁面內容
export const aboutContent = {
  hero: {
    title: "以自然為靈感，用雙手創造溫暖",
    image:
      "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?auto=format&fit=crop&w=1600&q=80",
  },
  story: {
    title: "我們的故事",
    paragraphs: [
      "森日工作室誕生於一個對手作充滿熱情的午後。創辦人在山林間漫步時，被陽光穿透樹葉的景象深深觸動——那是自然最純粹的美。",
      "一直以來喜歡木頭的紋路、溫度和香氣，將自然界最真實的禮物，融入生活是游木的理念。希望您在使用或欣賞作品時，能感受到自然的陪伴。",
    ],
    image:
      "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=80",
  },
  values: {
    title: "我們的理念",
    items: [
      {
        title: "自然至上",
        description:
          "我們選用天然、永續的材料，尊重自然，與環境和諧共處。每一塊木材都來自負責任的來源，每一塊布料都經過嚴格挑選。",
      },
      {
        title: "匠心獨運",
        description:
          "每件作品都是手工製作，傾注時間與心血。我們相信，手作的溫度是機器無法複製的，每一道紋理都是獨一無二的藝術。",
      },
      {
        title: "美學追求",
        description:
          "簡約不簡單，我們追求在功能與美感之間找到完美平衡。每件作品都是生活中的藝術品，為日常增添優雅。",
      },
      {
        title: "溫暖連結",
        description:
          "我們希望透過作品，與每一位使用者建立溫暖的連結。讓手作的溫度，從我們的工作室傳遞到您的生活中。",
      },
    ],
  },
  process: {
    title: "製作過程",
    steps: [
      { step: "01", title: "材料挑選", description: "嚴選優質天然材料，確保每件作品的品質" },
      { step: "02", title: "設計構思", description: "結合美學與實用，設計出獨特的作品樣式" },
      { step: "03", title: "手作製程", description: "一針一線、一刀一鑿，用心完成每個細節" },
      { step: "04", title: "品質檢驗", description: "嚴格把關，確保每件作品都達到最高標準" },
    ],
  },
};

// 聯絡資訊
export const contactInfo = {
  email: "youmood.workshop@gmail.com",
  instagram: "@youmood123",
  hours: "週一至週五 10:00 - 18:00",
  location: "桃園市桃園區",
};
