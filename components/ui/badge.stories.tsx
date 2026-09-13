import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Badge } from './badge';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Badge component với 5 variants màu sắc ngữ nghĩa và tùy chọn dot indicator.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'error', 'info'],
    },
    dot: { control: 'boolean' },
    children: { control: 'text' },
  },
  args: { children: 'Badge' },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { variant: 'default' } };
export const Success: Story = { args: { variant: 'success', children: 'Tuyệt vời' } };
export const Warning: Story = { args: { variant: 'warning', children: 'Cần cải thiện' } };
export const Error: Story = { args: { variant: 'error', children: 'Lỗi' } };
export const Info: Story = { args: { variant: 'info', children: 'Thông tin' } };

export const WithDot: Story = {
  args: { variant: 'success', dot: true, children: 'Đang yêu' },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Mặc định</Badge>
      <Badge variant="success" dot>Tuyệt vời ❤️</Badge>
      <Badge variant="warning" dot>Bình thường</Badge>
      <Badge variant="error">Không ổn</Badge>
      <Badge variant="info">Mới</Badge>
    </div>
  ),
};

export const RelationshipStatus: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="info" dot>Đang tìm hiểu</Badge>
      <Badge variant="warning" dot>Hẹn hò</Badge>
      <Badge variant="success" dot>Chính thức</Badge>
      <Badge variant="default" dot>Đã đính hôn 💍</Badge>
    </div>
  ),
};
