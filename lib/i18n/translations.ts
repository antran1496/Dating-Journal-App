export type Locale = 'vi' | 'en';

const translations: Record<Locale, Record<string, string>> = {
  vi: {
    // Navigation
    'nav.dashboard': 'Tổng quan',
    'nav.dates': 'Hẹn hò',
    'nav.insights': 'Khám phá',
    'nav.chat': 'Chat AI',
    'nav.settings': 'Cài đặt',

    // Dashboard
    'dashboard.title': 'Tổng quan 💕',
    'dashboard.subtitle': 'Câu chuyện tình yêu của bạn hôm nay',
    'dashboard.new_date': 'Ghi buổi hẹn mới',
    'dashboard.new_date_desc': 'Lưu lại kỷ niệm hôm nay',
    'dashboard.view_all': 'Xem tất cả buổi hẹn',
    'dashboard.view_all_desc': 'Nhìn lại hành trình yêu',
    'dashboard.recent': 'Kỷ niệm gần đây',
    'dashboard.view_all_link': 'Xem tất cả →',
    'dashboard.empty_title': 'Chưa có kỷ niệm nào',
    'dashboard.empty_desc': 'Hãy ghi lại buổi hẹn đầu tiên của bạn!',
    'dashboard.add_date': 'Thêm buổi hẹn',

    // Dates
    'dates.title': 'Buổi hẹn hò 📅',
    'dates.count': '{count} kỷ niệm đã ghi lại',
    'dates.add_new': 'Thêm mới',
    'dates.empty_title': 'Chưa có buổi hẹn nào',
    'dates.empty_desc': 'Hãy bắt đầu ghi lại những buổi hẹn hò để tạo nên câu chuyện tình yêu của riêng bạn!',
    'dates.first_date': 'Ghi buổi hẹn đầu tiên',
    'dates.no_location': 'Không có địa điểm',
    'dates.no_date': 'Chưa ghi nhận',

    // Settings
    'settings.title': 'Cài đặt ⚙️',
    'settings.subtitle': 'Quản lý tài khoản và tùy chỉnh ứng dụng',
    'settings.profile': 'Hồ sơ',
    'settings.theme': 'Giao diện',
    'settings.logout': 'Đăng xuất',
    'settings.logging_out': 'Đang đăng xuất...',

    // Theme settings
    'theme.display_mode': 'Chế độ hiển thị',
    'theme.light': 'Sáng',
    'theme.dark': 'Tối',
    'theme.auto': 'Tự động',
    'theme.primary_color': 'Màu chủ đạo',
    'theme.font': 'Font chữ',
    'theme.language': 'Ngôn ngữ',
    'theme.auto_save': '✨ Mọi thay đổi được lưu tự động',

    // Insights
    'insights.title': 'Khám phá tình yêu',
    'insights.subtitle': 'Dùng AI để hiểu rõ hơn về mối quan hệ của hai bạn',
    'insights.numerology': 'Thần số học',
    'insights.zodiac': 'Cung hoàng đạo',
    'insights.tarot': 'Tarot',
    'insights.palm': 'Chỉ tay',
    'insights.history': 'Lịch sử luận giải {type}',

    // Common
    'common.save': 'Lưu',
    'common.cancel': 'Hủy',
    'common.delete': 'Xóa',
    'common.edit': 'Chỉnh sửa',
    'common.loading': 'Đang tải...',
    'common.retry': 'Thử lại',
    'common.error_load': 'Không thể tải trang',
    'common.error_desc': 'Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại.',

    // Toast
    'toast.dateCreated': 'Đã tạo buổi hẹn thành công',
    'toast.dateUpdated': 'Đã cập nhật buổi hẹn thành công',
    'toast.dateDeleted': 'Đã xoá buổi hẹn thành công',
    'toast.profileSaved': 'Đã lưu hồ sơ thành công',
    'toast.nicknameSaved': 'Đã lưu biệt danh thành công',
    'toast.error': 'Đã xảy ra lỗi. Vui lòng thử lại.',
    'toast.deleteConfirmTitle': 'Xác nhận xoá',
    'toast.deleteConfirmDesc': 'Bạn có chắc chắn muốn xoá? Hành động này không thể hoàn tác.',
    'toast.cancel': 'Huỷ',
    'toast.delete': 'Xoá',

    // Empty States
    'empty.noDates': 'Chưa có buổi hẹn nào',
    'empty.noDatesDesc': 'Hãy bắt đầu ghi lại những buổi hẹn hò để tạo nên câu chuyện tình yêu của riêng bạn!',
    'empty.firstDate': 'Ghi buổi hẹn đầu tiên',
    'empty.noRecentDates': 'Chưa có kỷ niệm nào',
    'empty.noRecentDatesDesc': 'Hãy ghi lại buổi hẹn đầu tiên của bạn!',
    'empty.addDate': 'Thêm buổi hẹn',
    'empty.noChatHistory': 'Chưa có lịch sử trò chuyện',
    'empty.noChatHistoryDesc': 'Bắt đầu trò chuyện với Cupid AI để nhận gợi ý hẹn hò!',
    'empty.noCalendarEvents': 'Không có sự kiện trong tháng này',
    'empty.noCalendarEventsDesc': 'Hãy ghi thêm buổi hẹn mới để xem chúng trên lịch!',

    // Auth
    'auth.not_logged_in': 'Chưa đăng nhập',
    'auth.login_title': 'Đăng nhập',
    'auth.login_button': 'Đăng nhập',
    'auth.logging_in': 'Đang đăng nhập...',
    'auth.email_label': 'Email',
    'auth.password_label': 'Mật khẩu',
    'auth.no_account': 'Chưa có tài khoản?',
    'auth.signup_link': 'Đăng ký ngay',
    'auth.signup_title': 'Đăng ký tài khoản',
    'auth.signup_button': 'Đăng ký',
    'auth.signing_up': 'Đang tạo tài khoản...',
    'auth.name_label': 'Tên của bạn',
    'auth.confirm_password_label': 'Xác nhận mật khẩu',
    'auth.has_account': 'Đã có tài khoản?',
    'auth.signin_link': 'Đăng nhập',
    'auth.subtitle': 'Nhật ký tình yêu riêng tư của hai bạn.',

    // Milestones
    'milestone.congratulations': '🎉 Chúc mừng!',
    'milestone.todayMessage': 'Hôm nay là mốc {label} bên nhau!',
    'milestone.close': 'Đóng',
    'milestone.celebrate': 'Cùng ăn mừng nào! 🎊',
    'milestone.upcoming': '🎉 Chỉ còn {days} ngày nữa là mốc {label}!',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.dates': 'Dates',
    'nav.insights': 'Explore',
    'nav.chat': 'AI Chat',
    'nav.settings': 'Settings',

    // Dashboard
    'dashboard.title': 'Dashboard 💕',
    'dashboard.subtitle': 'Your love story today',
    'dashboard.new_date': 'Record new date',
    'dashboard.new_date_desc': 'Save today\'s memory',
    'dashboard.view_all': 'View all dates',
    'dashboard.view_all_desc': 'Look back on your journey',
    'dashboard.recent': 'Recent memories',
    'dashboard.view_all_link': 'View all →',
    'dashboard.empty_title': 'No memories yet',
    'dashboard.empty_desc': 'Record your first date!',
    'dashboard.add_date': 'Add date',

    // Dates
    'dates.title': 'Dates 📅',
    'dates.count': '{count} memories recorded',
    'dates.add_new': 'Add new',
    'dates.empty_title': 'No dates yet',
    'dates.empty_desc': 'Start recording your dates to create your own love story!',
    'dates.first_date': 'Record first date',
    'dates.no_location': 'No location',
    'dates.no_date': 'Not recorded',

    // Settings
    'settings.title': 'Settings ⚙️',
    'settings.subtitle': 'Manage your account and customize the app',
    'settings.profile': 'Profile',
    'settings.theme': 'Appearance',
    'settings.logout': 'Log out',
    'settings.logging_out': 'Logging out...',

    // Theme settings
    'theme.display_mode': 'Display mode',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.auto': 'Auto',
    'theme.primary_color': 'Primary color',
    'theme.font': 'Font',
    'theme.language': 'Language',
    'theme.auto_save': '✨ All changes are saved automatically',

    // Insights
    'insights.title': 'Explore love',
    'insights.subtitle': 'Use AI to understand your relationship better',
    'insights.numerology': 'Numerology',
    'insights.zodiac': 'Zodiac',
    'insights.tarot': 'Tarot',
    'insights.palm': 'Palm reading',
    'insights.history': '{type} history',

    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.loading': 'Loading...',
    'common.retry': 'Retry',
    'common.error_load': 'Page could not be loaded',
    'common.error_desc': 'An error occurred while loading data. Please try again.',

    // Toast
    'toast.dateCreated': 'Date created successfully',
    'toast.dateUpdated': 'Date updated successfully',
    'toast.dateDeleted': 'Date deleted successfully',
    'toast.profileSaved': 'Profile saved successfully',
    'toast.nicknameSaved': 'Nickname saved successfully',
    'toast.error': 'An error occurred. Please try again.',
    'toast.deleteConfirmTitle': 'Confirm deletion',
    'toast.deleteConfirmDesc': 'Are you sure you want to delete? This action cannot be undone.',
    'toast.cancel': 'Cancel',
    'toast.delete': 'Delete',

    // Empty States
    'empty.noDates': 'No dates yet',
    'empty.noDatesDesc': 'Start recording your dates to create your own love story!',
    'empty.firstDate': 'Record first date',
    'empty.noRecentDates': 'No memories yet',
    'empty.noRecentDatesDesc': 'Record your first date!',
    'empty.addDate': 'Add date',
    'empty.noChatHistory': 'No chat history',
    'empty.noChatHistoryDesc': 'Start chatting with Cupid AI for date suggestions!',
    'empty.noCalendarEvents': 'No events this month',
    'empty.noCalendarEventsDesc': 'Record more dates to see them on the calendar!',

    // Auth
    'auth.not_logged_in': 'Not logged in',
    'auth.login_title': 'Sign In',
    'auth.login_button': 'Sign In',
    'auth.logging_in': 'Signing in...',
    'auth.email_label': 'Email',
    'auth.password_label': 'Password',
    'auth.no_account': "Don't have an account?",
    'auth.signup_link': 'Sign up',
    'auth.signup_title': 'Create Account',
    'auth.signup_button': 'Create Account',
    'auth.signing_up': 'Creating account...',
    'auth.name_label': 'Display Name',
    'auth.confirm_password_label': 'Confirm Password',
    'auth.has_account': 'Already have an account?',
    'auth.signin_link': 'Sign in',
    'auth.subtitle': 'Your private love story, beautifully documented.',

    // Milestones
    'milestone.congratulations': '🎉 Congratulations!',
    'milestone.todayMessage': 'Today marks {label} together!',
    'milestone.close': 'Close',
    'milestone.celebrate': 'Let\'s celebrate! 🎊',
    'milestone.upcoming': '🎉 Only {days} days until {label}!',
  },
};

let currentLocale: Locale = 'vi';

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: string, params?: Record<string, string | number>): string {
  let text = translations[currentLocale]?.[key] ?? translations['vi']?.[key] ?? key;

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }

  return text;
}

export default translations;
