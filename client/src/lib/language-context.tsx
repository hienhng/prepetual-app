import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AppLanguage = "en" | "vi";

type DictionaryValue = string | Record<string, DictionaryValue>;

const dictionaries: Record<AppLanguage, Record<string, DictionaryValue>> = {
  en: {
    common: {
      language: "Language",
      english: "English",
      vietnamese: "Tiếng Việt",
      user: "User",
      save: "Save",
      cancel: "Cancel",
      settings: "Settings",
      contactUs: "Contact Us",
      helpCenter: "Help Center",
      signOut: "Sign out",
      rename: "Rename",
      renaming: "Renaming...",
      verified: "Verified",
      notVerified: "Not Verified",
      loading: "Loading...",
    },
    publicHeader: {
      login: "Log in",
      signup: "Sign up",
    },
    footer: {
      about: "About",
      blog: "Blog",
      faq: "FAQ",
      contact: "Contact",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      rights: "All rights reserved.",
      madeBy: "Made with love by Gia Hien",
    },
    routeTitles: {
      home: "Home",
      create: "Create Quiz",
      feed: "Community Feed",
      dashboard: "Dashboard",
      history: "Archive",
      generate: "Generate Quiz",
      quiz: "Quiz",
      results: "Results History",
      quizResults: "Quiz Complete",
      study: "Study Mode",
      editQuiz: "Edit Quiz",
      progress: "Progress",
      inProgress: "In Progress",
      about: "About",
      contact: "Contact",
      terms: "Terms of Service",
      privacy: "Privacy Policy",
      default: "Prepetual",
    },
    sidebar: {
      menu: "Menu",
      analysis: "Analysis",
      folders: "Folders",
      dashboard: "Dashboard",
      create: "Create",
      yourQuizzes: "Your Quizzes",
      discover: "Discover",
      progress: "Progress",
      results: "Results",
      noFolders: "No folders created",
      settings: "Settings",
      helpCenter: "Help Center",
      contactUs: "Contact Us",
      signOut: "Sign out",
      renameFolder: "Rename Folder",
      renameFolderDescription: "Enter a new name for this folder.",
      folderName: "Folder name",
      folderRenamed: "Folder renamed",
      failedRenameFolder: "Failed to rename folder",
      failedTogglePin: "Failed to toggle pin",
      pinToTop: "Pin to Top",
      unpinFromTop: "Unpin from Top",
    },
    settings: {
      title: "Settings",
      subtitle: "Manage your account preferences",
      profile: "Profile",
      username: "Username",
      usernamePlaceholder: "Enter your username",
      appearance: "Appearance",
      language: "Language",
      languageDescription: "Choose how the interface is displayed.",
      light: "Light",
      dark: "Dark",
      system: "System",
      quizExperience: "Quiz Experience",
      consecutiveConfetti: "Consecutive correct confetti",
      consecutiveConfettiDescription: "Confetti after 3+ correct answers in a row",
      skipRevision: "Skip revision questions",
      skipRevisionDescription: "Go straight to results",
      privacy: "Privacy",
      autoDelete: "Auto-delete uploaded files",
      autoDeleteDescription: "Delete source files after quiz generation",
      autoDeleteWarning: "Your uploads enhance your experience by making it more personalized.",
      unsavedChanges: "Unsaved changes",
      saveSuccess: "Settings saved",
      saveSuccessDescription: "Your preferences have been updated.",
      saveError: "Failed to save settings. Please try again.",
      imageUploaded: "Image uploaded",
      imageUploadedDescription: "Your profile picture has been updated.",
      uploadFailed: "Upload failed",
      uploadFailedDescription: "Failed to upload image. Please try again.",
      invalidFileType: "Invalid file type",
      invalidFileTypeDescription: "Please upload an image file.",
      fileTooLarge: "File too large",
      fileTooLargeDescription: "Please upload an image smaller than 10MB.",
    },
    progress: {
      title: "Your Progress",
      noAttempts: "Take some quizzes to start tracking your progress.",
      reviewQuizzes: "Review quizzes",
      createQuiz: "Create a quiz",
      attempts: "attempts",
      attempt: "attempt",
      noResults: "No results yet",
      noResultsDescription: "Start with one quiz and this page will track accuracy, trends, and subject-level progress.",
      createFirstQuiz: "Create Your First Quiz",
      accuracy: "ACCURACY",
      quizzesTaken: "QUIZZES TAKEN",
      trend: "TREND",
      performanceDetails: "Performance details",
      performanceDetailsDescription: "Break down your recent scores and subject coverage.",
      overview: "Overview",
      subjects: "Subjects",
      accuracyOverTime: "Accuracy Over Time",
      accuracyOverTimeDescription: "Performance by subject across your recent quizzes.",
      scoreDistribution: "Score Distribution",
      scoreDistributionDescription: "See where most of your quiz scores are landing.",
      noSubjectData: "No subject data yet.",
      quizzesTakenCount: "quizzes taken",
      quizTakenCount: "quiz taken",
      active: "Active",
      average: "Average",
      bestScore: "Best Score",
      lastSessions: "Last {count} sessions",
    },
  },
  vi: {
    common: {
      language: "Ngôn ngữ",
      english: "English",
      vietnamese: "Tiếng Việt",
      user: "Người dùng",
      save: "Lưu",
      cancel: "Hủy",
      settings: "Cài đặt",
      contactUs: "Liên hệ",
      helpCenter: "Trung tâm trợ giúp",
      signOut: "Đăng xuất",
      rename: "Đổi tên",
      renaming: "Đang đổi tên...",
      verified: "Đã xác minh",
      notVerified: "Chưa xác minh",
      loading: "Đang tải...",
    },
    publicHeader: {
      login: "Đăng nhập",
      signup: "Đăng ký",
    },
    footer: {
      about: "Giới thiệu",
      blog: "Blog",
      faq: "Câu hỏi thường gặp",
      contact: "Liên hệ",
      privacy: "Chính sách riêng tư",
      terms: "Điều khoản dịch vụ",
      rights: "Đã đăng ký bản quyền.",
      madeBy: "Được tạo bởi Gia Hien",
    },
    routeTitles: {
      home: "Trang chủ",
      create: "Tạo quiz",
      feed: "Cộng đồng",
      dashboard: "Bảng điều khiển",
      history: "Thư viện",
      generate: "Tạo quiz",
      quiz: "Quiz",
      results: "Lịch sử kết quả",
      quizResults: "Hoàn thành quiz",
      study: "Chế độ học",
      editQuiz: "Chỉnh sửa quiz",
      progress: "Tiến độ",
      inProgress: "Đang làm",
      about: "Giới thiệu",
      contact: "Liên hệ",
      terms: "Điều khoản dịch vụ",
      privacy: "Chính sách riêng tư",
      default: "Prepetual",
    },
    sidebar: {
      menu: "Menu",
      analysis: "Phân tích",
      folders: "Thư mục",
      dashboard: "Bảng điều khiển",
      create: "Tạo mới",
      yourQuizzes: "Quiz của bạn",
      discover: "Khám phá",
      progress: "Tiến độ",
      results: "Kết quả",
      noFolders: "Chưa có thư mục nào",
      settings: "Cài đặt",
      helpCenter: "Trung tâm trợ giúp",
      contactUs: "Liên hệ",
      signOut: "Đăng xuất",
      renameFolder: "Đổi tên thư mục",
      renameFolderDescription: "Nhập tên mới cho thư mục này.",
      folderName: "Tên thư mục",
      folderRenamed: "Đã đổi tên thư mục",
      failedRenameFolder: "Không thể đổi tên thư mục",
      failedTogglePin: "Không thể ghim hoặc bỏ ghim",
      pinToTop: "Ghim lên đầu",
      unpinFromTop: "Bỏ ghim khỏi đầu",
    },
    settings: {
      title: "Cài đặt",
      subtitle: "Quản lý tùy chọn tài khoản của bạn",
      profile: "Hồ sơ",
      username: "Tên người dùng",
      usernamePlaceholder: "Nhập tên người dùng",
      appearance: "Giao diện",
      language: "Ngôn ngữ",
      languageDescription: "Chọn ngôn ngữ hiển thị cho giao diện.",
      light: "Sáng",
      dark: "Tối",
      system: "Theo hệ thống",
      quizExperience: "Trải nghiệm làm quiz",
      consecutiveConfetti: "Pháo giấy khi trả lời đúng liên tiếp",
      consecutiveConfettiDescription: "Hiển thị pháo giấy sau 3 câu đúng liên tiếp",
      skipRevision: "Bỏ qua câu ôn tập",
      skipRevisionDescription: "Đi thẳng đến kết quả",
      privacy: "Quyền riêng tư",
      autoDelete: "Tự động xóa tệp đã tải lên",
      autoDeleteDescription: "Xóa tệp nguồn sau khi tạo quiz",
      autoDeleteWarning: "Các tệp tải lên giúp trải nghiệm học tập của bạn được cá nhân hóa hơn.",
      unsavedChanges: "Có thay đổi chưa lưu",
      saveSuccess: "Đã lưu cài đặt",
      saveSuccessDescription: "Tùy chọn của bạn đã được cập nhật.",
      saveError: "Không thể lưu cài đặt. Vui lòng thử lại.",
      imageUploaded: "Đã tải ảnh lên",
      imageUploadedDescription: "Ảnh đại diện của bạn đã được cập nhật.",
      uploadFailed: "Tải ảnh thất bại",
      uploadFailedDescription: "Không thể tải ảnh lên. Vui lòng thử lại.",
      invalidFileType: "Loại tệp không hợp lệ",
      invalidFileTypeDescription: "Vui lòng tải lên tệp hình ảnh.",
      fileTooLarge: "Tệp quá lớn",
      fileTooLargeDescription: "Vui lòng tải lên ảnh nhỏ hơn 10MB.",
    },
    progress: {
      title: "Tiến độ của bạn",
      noAttempts: "Hãy làm vài bài quiz để bắt đầu theo dõi tiến độ.",
      reviewQuizzes: "Xem lại quiz",
      createQuiz: "Tạo quiz",
      attempts: "lượt làm",
      attempt: "lượt làm",
      noResults: "Chưa có kết quả",
      noResultsDescription: "Bắt đầu với một bài quiz và trang này sẽ theo dõi độ chính xác, xu hướng và tiến độ theo môn học.",
      createFirstQuiz: "Tạo quiz đầu tiên",
      accuracy: "ĐỘ CHÍNH XÁC",
      quizzesTaken: "SỐ QUIZ ĐÃ LÀM",
      trend: "XU HƯỚNG",
      performanceDetails: "Chi tiết hiệu suất",
      performanceDetailsDescription: "Xem điểm số gần đây và mức độ bao phủ theo môn học.",
      overview: "Tổng quan",
      subjects: "Môn học",
      accuracyOverTime: "Độ chính xác theo thời gian",
      accuracyOverTimeDescription: "Hiệu suất theo môn học trong các bài quiz gần đây.",
      scoreDistribution: "Phân bố điểm số",
      scoreDistributionDescription: "Xem phần lớn điểm số của bạn đang nằm ở khoảng nào.",
      noSubjectData: "Chưa có dữ liệu môn học.",
      quizzesTakenCount: "bài quiz đã làm",
      quizTakenCount: "bài quiz đã làm",
      active: "Đang hoạt động",
      average: "Trung bình",
      bestScore: "Điểm cao nhất",
      lastSessions: "{count} lượt gần nhất",
    },
  },
};

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getNestedValue(source: Record<string, DictionaryValue>, path: string): string | undefined {
  const parts = path.split(".");
  let current: DictionaryValue | undefined = source;

  for (const part of parts) {
    if (!current || typeof current === "string") return undefined;
    current = current[part];
  }

  return typeof current === "string" ? current : undefined;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    if (typeof window === "undefined") return "en";
    const stored = window.localStorage.getItem("app-language");
    return stored === "vi" ? "vi" : "en";
  });

  useEffect(() => {
    window.localStorage.setItem("app-language", language);
    document.documentElement.lang = language === "vi" ? "vi" : "en";
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => {
    const t = (key: string, params?: Record<string, string | number>) => {
      const translated = getNestedValue(dictionaries[language], key) ?? getNestedValue(dictionaries.en, key) ?? key;

      if (!params) return translated;

      return Object.entries(params).reduce(
        (result, [paramKey, paramValue]) => result.replaceAll(`{${paramKey}}`, String(paramValue)),
        translated,
      );
    };

    return {
      language,
      setLanguage: setLanguageState,
      t,
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
}
