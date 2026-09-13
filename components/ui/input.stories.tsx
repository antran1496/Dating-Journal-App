import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Mail, Search, User } from 'lucide-react';
import { Input } from './input';

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Input component với label, error state, helper text và icon support.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '360px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    error: { control: 'text' },
    helperText: { control: 'text' },
    disabled: { control: 'boolean' },
    iconPosition: { control: 'select', options: ['left', 'right'] },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: 'Nhập nội dung...' },
};

export const WithLabel: Story = {
  args: { label: 'Email', placeholder: 'you@example.com', type: 'email' },
};

export const WithHelperText: Story = {
  args: {
    label: 'Mật khẩu',
    type: 'password',
    placeholder: '••••••••',
    helperText: 'Ít nhất 6 ký tự',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    error: 'Email không hợp lệ',
    defaultValue: 'invalid-email',
  },
};

export const WithLeftIcon: Story = {
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    icon: <Mail size={16} />,
    iconPosition: 'left',
  },
};

export const WithRightIcon: Story = {
  args: {
    placeholder: 'Tìm kiếm...',
    icon: <Search size={16} />,
    iconPosition: 'right',
  },
};

export const Disabled: Story = {
  args: { label: 'Tên hiển thị', defaultValue: 'Nguyen Van A', disabled: true },
};
