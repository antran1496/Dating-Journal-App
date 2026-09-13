import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { LoadingSkeleton } from './loading-skeleton';

const meta = {
  title: 'UI/LoadingSkeleton',
  component: LoadingSkeleton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Skeleton loader với shimmer animation. Hỗ trợ 3 variants: text, circle, rect.',
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
    variant: { control: 'select', options: ['text', 'circle', 'rect'] },
    width: { control: 'text' },
    height: { control: 'text' },
  },
} satisfies Meta<typeof LoadingSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = { args: { variant: 'text', width: '100%' } };
export const Circle: Story = { args: { variant: 'circle', width: '48px', height: '48px' } };
export const Rect: Story = { args: { variant: 'rect', width: '100%', height: '120px' } };

export const DateCardSkeleton: Story = {
  render: () => (
    <div className="p-4 bg-surface border border-border rounded-[var(--radius-lg)] space-y-3">
      <div className="flex items-center gap-3">
        <LoadingSkeleton variant="circle" width="40px" height="40px" />
        <div className="flex-1 space-y-2">
          <LoadingSkeleton variant="text" width="60%" />
          <LoadingSkeleton variant="text" width="40%" />
        </div>
      </div>
      <LoadingSkeleton variant="rect" width="100%" height="80px" />
      <LoadingSkeleton variant="text" width="80%" />
      <LoadingSkeleton variant="text" width="50%" />
    </div>
  ),
};

export const ProfileSkeleton: Story = {
  render: () => (
    <div className="flex items-center gap-4 p-4 bg-surface border border-border rounded-[var(--radius-lg)]">
      <LoadingSkeleton variant="circle" width="64px" height="64px" />
      <div className="flex-1 space-y-2">
        <LoadingSkeleton variant="text" width="50%" />
        <LoadingSkeleton variant="text" width="70%" />
        <LoadingSkeleton variant="text" width="30%" />
      </div>
    </div>
  ),
};
