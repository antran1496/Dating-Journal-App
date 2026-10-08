import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PageHeader } from './page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const meta = {
  title: 'Layouts/PageHeader',
  component: PageHeader,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Buổi hẹn hò 📅',
    description: '12 kỷ niệm đã ghi lại cùng nhau',
  },
};

export const WithAction: Story = {
  args: {
    title: 'Cùng nhau ✨',
    description: 'Danh sách những điều muốn thử cùng người ấy',
    action: (
      <Button size="sm">
        <Plus className="w-4 h-4 mr-1" />
        Thêm mới
      </Button>
    ),
  },
};

export const WithBackButton: Story = {
  args: {
    title: 'Chi tiết kỷ niệm',
    description: 'Cà phê chiều Chủ nhật tại Quận 1',
    showBack: true,
  },
};
