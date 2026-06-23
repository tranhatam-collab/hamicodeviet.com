import type { Bilingual } from './i18n';

export interface Product {
  id: string;
  name: string;
  tagline: Bilingual;
  description: Bilingual;
  features: Bilingual[];
  status: 'live' | 'coming-soon' | 'pilot';
  icon: string;
  color: string;
}

export const products: Product[] = [
  {
    id: 'hami-learn',
    name: 'HaMi Learn',
    tagline: {
      vi: 'Học miễn phí — Cửa ngõ cộng đồng',
      en: 'Learn free — The community gateway',
    },
    description: {
      vi: 'Bài học nhập môn, video ngắn, từ vựng song ngữ, code mẫu, bài tập tương tác và thử thách hằng tuần. Mục tiêu: hoàn thành kết quả đầu tiên trong 15–30 phút.',
      en: 'Intro lessons, short videos, bilingual vocabulary, sample code, interactive exercises, and weekly challenges. Goal: complete a first result in 15–30 minutes.',
    },
    features: [
      { vi: 'Bài học nhập môn', en: 'Intro lessons' },
      { vi: 'Từ vựng song ngữ', en: 'Bilingual vocabulary' },
      { vi: 'Code mẫu & bài tập', en: 'Sample code & exercises' },
      { vi: 'Thử thách hằng tuần', en: 'Weekly challenges' },
      { vi: 'Hướng dẫn cho phụ huynh', en: 'Parent guides' },
      { vi: 'An toàn số & AI literacy', en: 'Digital safety & AI literacy' },
    ],
    status: 'live',
    icon: '📚',
    color: '#00A8CC',
  },
  {
    id: 'hami-academy',
    name: 'HaMi Academy',
    tagline: {
      vi: 'Học viện trả phí — Đào tạo chuyên sâu',
      en: 'Paid academy — In-depth training',
    },
    description: {
      vi: 'Khóa tự học, khóa theo lộ trình, cohort có lịch học, lớp trực tuyến và offline, mentoring, code review và project review. Tạo giá trị khác biệt so với lớp miễn phí.',
      en: 'Self-paced courses, track-based courses, scheduled cohorts, online and offline classes, mentoring, code review and project review. Creates value beyond free lessons.',
    },
    features: [
      { vi: 'Lộ trình cá nhân hóa', en: 'Personalized tracks' },
      { vi: 'Người hướng dẫn & mentoring', en: 'Mentors & mentoring' },
      { vi: 'Code review chuyên môn', en: 'Professional code review' },
      { vi: 'Demo Day', en: 'Demo Day' },
      { vi: 'CodeLab nâng cao', en: 'Advanced CodeLab' },
      { vi: 'Cơ hội marketplace', en: 'Marketplace opportunity' },
    ],
    status: 'coming-soon',
    icon: '🎓',
    color: '#102A43',
  },
  {
    id: 'hami-codelab',
    name: 'HaMi CodeLab',
    tagline: {
      vi: 'Phòng thực hành — Viết và chạy code',
      en: 'Code lab — Write and run code',
    },
    description: {
      vi: 'Viết và chạy HTML, CSS, JavaScript, Python với preview trực tiếp, lưu phiên bản, so sánh phiên bản, chấm test tự động, phát hiện lỗi và giải thích code song ngữ. Code chạy trong sandbox cô lập.',
      en: 'Write and run HTML, CSS, JavaScript, Python with live preview, version history, version comparison, auto-grading, error detection, and bilingual code explanation. Code runs in an isolated sandbox.',
    },
    features: [
      { vi: 'HTML/CSS/JS & Python', en: 'HTML/CSS/JS & Python' },
      { vi: 'Preview trực tiếp', en: 'Live preview' },
      { vi: 'Lưu & so sánh phiên bản', en: 'Save & compare versions' },
      { vi: 'Chấm test tự động', en: 'Auto-grading' },
      { vi: 'Phát hiện lỗi song ngữ', en: 'Bilingual error detection' },
      { vi: 'Sandbox cô lập an toàn', en: 'Isolated safe sandbox' },
    ],
    status: 'coming-soon',
    icon: '⌨️',
    color: '#20A779',
  },
  {
    id: 'hami-project-library',
    name: 'HaMi Project Library',
    tagline: {
      vi: 'Thư viện dự án — Học qua sản phẩm',
      en: 'Project library — Learn through products',
    },
    description: {
      vi: '20–50 learning path, 100–300 khóa học chuẩn, hàng nghìn bài tập và biến thể dự án. Mỗi project template có mục tiêu, độ tuổi, cấp độ, công nghệ, hướng dẫn song ngữ, code đã test và rubric đánh giá.',
      en: '20–50 learning paths, 100–300 standard courses, thousands of exercises and project variants. Each project template has goals, age, level, tech, bilingual guides, tested code, and assessment rubrics.',
    },
    features: [
      { vi: 'Project template đa cấp', en: 'Multi-level project templates' },
      { vi: 'Hướng dẫn song ngữ', en: 'Bilingual guides' },
      { vi: 'Code đã test', en: 'Tested code' },
      { vi: 'Rubric đánh giá', en: 'Assessment rubrics' },
      { vi: 'Biến thể nâng cao', en: 'Advanced variants' },
      { vi: 'Hướng dẫn cho giáo viên', en: 'Teacher guides' },
    ],
    status: 'pilot',
    icon: '🗂️',
    color: '#FFC857',
  },
  {
    id: 'hami-studio',
    name: 'HaMi Studio',
    tagline: {
      vi: 'Xưởng sáng tạo — Biến ý tưởng thành sản phẩm',
      en: 'Creative studio — Turn ideas into products',
    },
    description: {
      vi: 'Game Studio, Web Studio, Art & Animation Studio, AI Studio, Language Studio và School Project Studio. Chọn ý tưởng → Nhận cấu trúc → Tạo sản phẩm → Kiểm thử → Nhận phản hồi → Hoàn thiện → Trình diễn.',
      en: 'Game Studio, Web Studio, Art & Animation Studio, AI Studio, Language Studio, and School Project Studio. Choose idea → Get structure → Create product → Test → Get feedback → Refine → Showcase.',
    },
    features: [
      { vi: 'Game Studio', en: 'Game Studio' },
      { vi: 'Web Studio', en: 'Web Studio' },
      { vi: 'Art & Animation Studio', en: 'Art & Animation Studio' },
      { vi: 'AI Studio', en: 'AI Studio' },
      { vi: 'Language Studio', en: 'Language Studio' },
      { vi: 'School Project Studio', en: 'School Project Studio' },
    ],
    status: 'coming-soon',
    icon: '🎨',
    color: '#00A8CC',
  },
  {
    id: 'hami-market',
    name: 'HaMi Market',
    tagline: {
      vi: 'Chợ sản phẩm số — Thương mại hóa có kiểm soát',
      en: 'Digital marketplace — Controlled commercialization',
    },
    description: {
      vi: 'Marketplace cho sản phẩm số: template, mã nguồn, game, asset, hình ảnh, animation, worksheet, plugin, AI workflow, SaaS nhỏ. Mỗi sản phẩm được kiểm duyệt: danh tính, bản quyền, quét mã độc, test, giấy phép.',
      en: 'Marketplace for digital products: templates, source code, games, assets, images, animations, worksheets, plugins, AI workflows, small SaaS. Each product is reviewed: identity, copyright, malware scan, tests, licensing.',
    },
    features: [
      { vi: 'Kiểm duyệt danh tính', en: 'Identity verification' },
      { vi: 'Quét mã độc & test', en: 'Malware scan & testing' },
      { vi: 'Khai báo thành phần AI', en: 'AI content disclosure' },
      { vi: 'Giấy phép sử dụng', en: 'Usage licensing' },
      { vi: 'Cơ chế báo cáo vi phạm', en: 'Violation reporting' },
      { vi: 'Chính sách hoàn tiền', en: 'Refund policy' },
    ],
    status: 'coming-soon',
    icon: '🛒',
    color: '#20A779',
  },
  {
    id: 'hami-schools',
    name: 'HaMi Schools',
    tagline: {
      vi: 'Giải pháp trường học — Giáo dục công nghệ có kiểm soát',
      en: 'School solutions — Controlled tech education',
    },
    description: {
      vi: 'Teacher dashboard, quản lý lớp, giao bài, chấm bài, theo dõi tiến độ, kho học liệu, báo cáo phụ huynh, chế độ không quảng cáo, kiểm soát AI, xuất báo cáo, tích hợp LMS và school license.',
      en: 'Teacher dashboard, class management, assignments, grading, progress tracking, content library, parent reports, ad-free mode, AI control, report export, LMS integration, and school license.',
    },
    features: [
      { vi: 'Teacher dashboard', en: 'Teacher dashboard' },
      { vi: 'Quản lý lớp & giao bài', en: 'Class management & assignments' },
      { vi: 'Kho học liệu', en: 'Content library' },
      { vi: 'Chế độ không quảng cáo', en: 'Ad-free mode' },
      { vi: 'Kiểm soát AI', en: 'AI control' },
      { vi: 'Tích hợp LMS', en: 'LMS integration' },
    ],
    status: 'coming-soon',
    icon: '🏫',
    color: '#102A43',
  },
  {
    id: 'hami-verify',
    name: 'HaMi Verify',
    tagline: {
      vi: 'Hồ sơ & xác minh năng lực — Bằng chứng có thể kiểm chứng',
      en: 'Profile & skill verification — Verifiable evidence',
    },
    description: {
      vi: 'Hồ sơ năng lực, dự án, test, rubric, chứng nhận nội bộ, QR xác minh, lịch sử phiên bản, người đánh giá, mức độ sử dụng AI, quyền công khai hoặc riêng tư. Chứng nhận dựa trên bằng chứng, không phải thời gian xem video.',
      en: 'Skill profile, projects, tests, rubrics, internal certification, QR verification, version history, reviewers, AI usage level, public/private control. Certification based on evidence, not video watch time.',
    },
    features: [
      { vi: 'Hồ sơ năng lực', en: 'Skill profile' },
      { vi: 'QR xác minh', en: 'QR verification' },
      { vi: 'Lịch sử phiên bản', en: 'Version history' },
      { vi: 'Chứng nhận nội bộ', en: 'Internal certification' },
      { vi: 'Mức độ sử dụng AI', en: 'AI usage level' },
      { vi: 'Quyền riêng tư', en: 'Privacy controls' },
    ],
    status: 'pilot',
    icon: '✓',
    color: '#FFC857',
  },
];
