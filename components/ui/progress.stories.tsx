import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from './progress';

const meta = {
  title: 'UI/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 65,
    max: 100,
    showLabel: true,
    label: 'Ngân sách chi tiêu tháng này',
  },
  render: (args) => (
    <div className="w-80">
      <Progress {...args} />
    </div>
  ),
};

export const Exceeded: Story = {
  args: {
    value: 120,
    max: 100,
    variant: 'warning',
    showLabel: true,
    label: 'Đã vượt ngân sách',
  },
  render: (args) => (
    <div className="w-80">
      <Progress {...args} />
    </div>
  ),
};
