import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Textarea } from './textarea';

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Textarea với label, error, character count và tùy chọn auto-resize.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '380px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    label: { control: 'text' },
    error: { control: 'text' },
    maxLength: { control: 'number' },
    autoResize: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: 'Nhập nội dung...' },
};

export const WithLabel: Story = {
  args: { label: 'Cảm nhận của bạn', placeholder: 'Buổi hẹn hôm nay thật...' },
};

export const WithCharCount: Story = {
  args: {
    label: 'Điều muốn thử lần sau',
    placeholder: 'Mình muốn thử đi...',
    maxLength: 200,
  },
};

export const WithError: Story = {
  args: {
    label: 'Ghi chú',
    error: 'Trường này không được để trống',
  },
};

export const AutoResize: Story = {
  args: {
    label: 'Điểm cộng (Pros)',
    placeholder: 'Nhập và xem textarea tự mở rộng...',
    autoResize: true,
  },
};

export const DateNoteFields: Story = {
  render: () => (
    <div className="space-y-4">
      <Textarea label="✅ Điểm cộng" placeholder="Điều gì đã diễn ra tốt?" maxLength={300} />
      <Textarea label="🔧 Điểm cần cải thiện" placeholder="Điều gì có thể tốt hơn?" maxLength={300} />
      <Textarea label="💭 Mong muốn lần sau" placeholder="Lần tới mình muốn thử..." maxLength={300} />
    </div>
  ),
};
