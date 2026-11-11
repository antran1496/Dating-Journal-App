import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import { Switch } from './switch';
import { useState } from 'react';

const meta = {
  title: 'UI/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
  },
  args: {
    checked: false,
    onChange: fn(),
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    checked: false,
    onChange: fn(),
    label: 'Thông báo đẩy',
    description: 'Nhận thông báo khi người ấy thả tim hoặc bình luận',
  },
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <div className="w-80">
        <Switch
          checked={checked}
          onChange={setChecked}
          label="Thông báo đẩy"
          description="Nhận thông báo khi người ấy thả tim hoặc bình luận"
        />
      </div>
    );
  },
};

export const Checked: Story = {
  args: {
    checked: true,
    onChange: fn(),
    label: 'Khoá ứng dụng',
    description: 'Yêu cầu mã PIN khi mở lại app',
  },
  render: () => {
    const [checked, setChecked] = useState(true);
    return (
      <div className="w-80">
        <Switch
          checked={checked}
          onChange={setChecked}
          label="Khoá ứng dụng"
          description="Yêu cầu mã PIN khi mở lại app"
        />
      </div>
    );
  },
};
