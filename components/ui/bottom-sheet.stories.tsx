import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import { BottomSheet } from './bottom-sheet';
import { Button } from './button';
import { useState } from 'react';

const meta = {
  title: 'UI/BottomSheet',
  component: BottomSheet,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    isOpen: false,
    onClose: fn(),
    children: null,
  },
} satisfies Meta<typeof BottomSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
    children: null,
  },
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="p-8">
        <Button onClick={() => setOpen(true)}>Mở Bottom Sheet</Button>
        <BottomSheet
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Kỷ niệm ngày 14/02/2026"
        >
          <div className="space-y-4">
            <p className="text-text">
              Buổi tối lãng mạn tại phố đi bộ Nguyễn Huệ, cùng nhau uống trà sữa và ngắm hoàng hôn.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Đóng
              </Button>
            </div>
          </div>
        </BottomSheet>
      </div>
    );
  },
};
