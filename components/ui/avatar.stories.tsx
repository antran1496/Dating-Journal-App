import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Avatar } from './avatar';

const meta = {
  title: 'UI/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Avatar component với fallback initials, 4 sizes và status indicator (online/offline).',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
    status: { control: 'select', options: [undefined, 'online', 'offline'] },
    src: { control: 'text' },
    name: { control: 'text' },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=32',
    name: 'Nguyen Van A',
    size: 'md',
  },
};

export const WithInitials: Story = {
  args: { name: 'Nguyen Van A', size: 'md' },
};

export const SingleName: Story = {
  args: { name: 'An', size: 'md' },
};

export const Online: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=47',
    name: 'Tran Thi B',
    size: 'lg',
    status: 'online',
  },
};

export const Offline: Story = {
  args: { name: 'Tran Thi B', size: 'lg', status: 'offline' },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Avatar name="An" size="sm" />
      <Avatar name="An" size="md" />
      <Avatar name="An" size="lg" />
      <Avatar name="An" size="xl" />
    </div>
  ),
};

export const CoupleAvatars: Story = {
  render: () => (
    <div className="flex items-center gap-3 p-4 bg-surface rounded-[var(--radius-lg)] border border-border">
      <div className="flex -space-x-3">
        <Avatar src="https://i.pravatar.cc/150?img=32" name="An" size="lg" status="online" />
        <Avatar src="https://i.pravatar.cc/150?img=47" name="Binh" size="lg" status="online" />
      </div>
      <div>
        <p className="font-semibold text-text text-sm">An & Bình</p>
        <p className="text-text-muted text-xs">Đang trực tuyến</p>
      </div>
    </div>
  ),
};
