import type { Bilingual } from './i18n';

export interface AgeTrack {
  id: string;
  slug: string;
  ageRange: string;
  name: Bilingual;
  focus: Bilingual;
  description: Bilingual;
  skills: Bilingual[];
  outcomes: Bilingual[];
  color: string;
  icon: string;
}

export const tracks: AgeTrack[] = [
  {
    id: 'creative-explorer',
    slug: 'creative-explorer',
    ageRange: '8–10',
    name: { vi: 'Creative Explorer', en: 'Creative Explorer' },
    focus: {
      vi: 'Tư duy logic, kể chuyện, hoạt hình, Scratch, ngôn ngữ căn bản',
      en: 'Logical thinking, storytelling, animation, Scratch, basic language',
    },
    description: {
      vi: 'Lộ trình dành cho trẻ 8–10 tuổi, khơi dậy sự tò mò và tư duy sáng tạo thông qua kể chuyện tương tác, hoạt hình và lập trình khối Scratch. Trẻ học tiếng Anh cơ bản qua các từ vựng công nghệ và làm quen với tư duy máy tính.',
      en: 'A track for ages 8–10 that sparks curiosity and creative thinking through interactive storytelling, animation, and block-based Scratch programming. Children learn basic English through tech vocabulary and computational thinking.',
    },
    skills: [
      { vi: 'Tư duy logic cơ bản', en: 'Basic logical thinking' },
      { vi: 'Lập trình Scratch', en: 'Scratch programming' },
      { vi: 'Kể chuyện số', en: 'Digital storytelling' },
      { vi: 'Hoạt hình đơn giản', en: 'Simple animation' },
      { vi: 'Từ vựng tiếng Anh công nghệ', en: 'Tech English vocabulary' },
    ],
    outcomes: [
      { vi: 'Một câu chuyện tương tác trên Scratch', en: 'An interactive Scratch story' },
      { vi: 'Một nhân vật hoạt hình chuyển động', en: 'An animated character' },
      { vi: 'Một mini-game đơn giản', en: 'A simple mini-game' },
    ],
    color: '#FFC857',
    icon: '✦',
  },
  {
    id: 'junior-builder',
    slug: 'junior-builder',
    ageRange: '11–13',
    name: { vi: 'Junior Builder', en: 'Junior Builder' },
    focus: {
      vi: 'Game, HTML/CSS, JavaScript trực quan, an toàn số',
      en: 'Games, HTML/CSS, visual JavaScript, digital safety',
    },
    description: {
      vi: 'Lộ trình cho trẻ 11–13 tuổi, bắt đầu xây dựng website đầu tiên với HTML và CSS, làm game với JavaScript trực quan, và học cách an toàn trên không gian mạng. Tiếng Anh được lồng ghép vào tên lệnh và mô tả bài toán.',
      en: 'A track for ages 11–13: build a first website with HTML and CSS, create games with visual JavaScript, and learn digital safety. English is integrated into command names and problem descriptions.',
    },
    skills: [
      { vi: 'HTML & CSS cơ bản', en: 'Basic HTML & CSS' },
      { vi: 'JavaScript trực quan', en: 'Visual JavaScript' },
      { vi: 'Phát triển game 2D', en: '2D game development' },
      { vi: 'An toàn số', en: 'Digital safety' },
      { vi: 'Đọc hướng dẫn tiếng Anh', en: 'Reading English instructions' },
    ],
    outcomes: [
      { vi: 'Một trang web cá nhân', en: 'A personal web page' },
      { vi: 'Một game 2D chơi được', en: 'A playable 2D game' },
      { vi: 'Một bài thuyết trình kỹ thuật', en: 'A tech presentation' },
    ],
    color: '#00A8CC',
    icon: '⚡',
  },
  {
    id: 'young-creator',
    slug: 'young-creator',
    ageRange: '14–17',
    name: { vi: 'Young Creator', en: 'Young Creator' },
    focus: {
      vi: 'Python, web, game 2D, Git, AI literacy, portfolio',
      en: 'Python, web, 2D games, Git, AI literacy, portfolio',
    },
    description: {
      vi: 'Lộ trình cho học sinh 14–17 tuổi, đi sâu vào Python, phát triển web động, game 2D, quản lý phiên bản với Git, và hiểu biết về AI. Người học bắt đầu xây portfolio có bằng chứng năng lực.',
      en: 'A track for ages 14–17: dive into Python, dynamic web development, 2D games, version control with Git, and AI literacy. Learners begin building an evidence-based portfolio.',
    },
    skills: [
      { vi: 'Python cơ bản đến trung cấp', en: 'Python basic to intermediate' },
      { vi: 'Web động (HTML/CSS/JS)', en: 'Dynamic web (HTML/CSS/JS)' },
      { vi: 'Git & quản lý phiên bản', en: 'Git & version control' },
      { vi: 'AI literacy', en: 'AI literacy' },
      { vi: 'Xây dựng portfolio', en: 'Portfolio building' },
    ],
    outcomes: [
      { vi: 'Một ứng dụng Python hoàn chỉnh', en: 'A complete Python app' },
      { vi: 'Một website động có database', en: 'A dynamic website with database' },
      { vi: 'Một portfolio kỹ thuật', en: 'A technical portfolio' },
    ],
    color: '#20A779',
    icon: '◆',
  },
  {
    id: 'product-developer',
    slug: 'product-developer',
    ageRange: '18–20',
    name: { vi: 'Product Developer', en: 'Product Developer' },
    focus: {
      vi: 'Full-stack, API, database, AI Agent, triển khai',
      en: 'Full-stack, API, database, AI Agent, deployment',
    },
    description: {
      vi: 'Lộ trình cho sinh viên 18–20 tuổi, phát triển kỹ năng full-stack, thiết kế API, quản lý database, tích hợp AI Agent và triển khai sản phẩm lên môi trường thực. Người học tạo ra sản phẩm có thể sử dụng thật.',
      en: 'A track for ages 18–20: develop full-stack skills, API design, database management, AI Agent integration, and product deployment. Learners build real, usable products.',
    },
    skills: [
      { vi: 'Full-stack development', en: 'Full-stack development' },
      { vi: 'API design & REST', en: 'API design & REST' },
      { vi: 'Database (SQL & NoSQL)', en: 'Database (SQL & NoSQL)' },
      { vi: 'AI Agent integration', en: 'AI Agent integration' },
      { vi: 'Deployment & DevOps cơ bản', en: 'Basic deployment & DevOps' },
    ],
    outcomes: [
      { vi: 'Một ứng dụng full-stack', en: 'A full-stack application' },
      { vi: 'Một AI mini-app', en: 'An AI mini-app' },
      { vi: 'Một sản phẩm đã triển khai', en: 'A deployed product' },
    ],
    color: '#102A43',
    icon: '⬡',
  },
  {
    id: 'builder-entrepreneur',
    slug: 'builder-entrepreneur',
    ageRange: '21–24',
    name: { vi: 'Builder & Entrepreneur', en: 'Builder & Entrepreneur' },
    focus: {
      vi: 'SaaS, cloud, bảo mật, sản phẩm, marketplace, startup',
      en: 'SaaS, cloud, security, product, marketplace, startup',
    },
    description: {
      vi: 'Lộ trình cho người 21–24 tuổi, tập trung vào xây dựng sản phẩm SaaS, điện toán đám mây, bảo mật, thương mại hóa sản phẩm số và khởi nghiệp. Người học có thể đưa sản phẩm lên marketplace.',
      en: 'A track for ages 21–24: focus on building SaaS products, cloud computing, security, product commercialization, and startup. Learners can list products on the marketplace.',
    },
    skills: [
      { vi: 'SaaS architecture', en: 'SaaS architecture' },
      { vi: 'Cloud (AWS/Cloudflare)', en: 'Cloud (AWS/Cloudflare)' },
      { vi: 'Bảo mật ứng dụng', en: 'Application security' },
      { vi: 'Product & startup', en: 'Product & startup' },
      { vi: 'Marketplace & thương mại hóa', en: 'Marketplace & commercialization' },
    ],
    outcomes: [
      { vi: 'Một sản phẩm SaaS nhỏ', en: 'A small SaaS product' },
      { vi: 'Một workflow AI', en: 'An AI workflow' },
      { vi: 'Một sản phẩm trên marketplace', en: 'A product on the marketplace' },
    ],
    color: '#081826',
    icon: '◈',
  },
];
