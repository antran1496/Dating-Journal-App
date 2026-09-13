import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import { Heart, Calendar, MapPin, Sparkles } from 'lucide-react';
import { EmptyState } from './empty-state';

const meta = {
  title: 'UI/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Empty state component với icon, title, description và optional action button.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '420px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    actionLabel: { control: 'text' },
  },
  args: { action: fn() },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: <Heart size={40} />,
    title: 'Chưa có dữ liệu',
    description: 'Hãy bắt đầu bằng cách thêm thông tin đầu tiên của bạn.',
    actionLabel: 'Thêm ngay',
  },
};

export const NoDates: Story = {
  args: {
    icon: <Calendar size={40} />,
    title: 'Chưa có buổi hẹn nào',
    description: 'Câu chuyện tình yêu của bạn đang chờ được ghi lại. Hãy thêm buổi hẹn đầu tiên!',
    actionLabel: '+ Thêm buổi hẹn',
  },
};

export const NoCouple: Story = {
  args: {
    icon: <Heart size={40} />,
    title: 'Chưa kết nối với người yêu',
    description: 'Mời người yêu của bạn tham gia bằng mã kết nối để cùng nhau ghi lại những kỷ niệm.',
    actionLabel: 'Tạo mã mời',
  },
};

export const NoInsights: Story = {
  args: {
    icon: <Sparkles size={40} />,
    title: 'Chưa có phân tích',
    description: 'Điền đầy đủ ngày sinh để xem luận giải thần số học và cung hoàng đạo của bạn.',
    actionLabel: 'Cập nhật hồ sơ',
  },
};

export const WithoutAction: Story = {
  args: {
    icon: <MapPin size={40} />,
    title: 'Không tìm thấy địa điểm',
    description: 'Thử tìm kiếm với từ khoá khác.',
  },
};
