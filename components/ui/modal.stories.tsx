import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import { useState } from 'react';
import { Modal } from './modal';
import { Button } from './button';

const meta = {
  title: 'UI/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Modal component voi backdrop blur, slide-up animation, dong bang Escape hoac click ngoai.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: { control: 'boolean' },
    title: { control: 'text' },
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
  },
  args: { onClose: fn(), isOpen: false, children: null },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive story with real open/close state
function ModalDemo({ title, size, content }: { title?: string; size?: 'sm'|'md'|'lg'|'xl'; content?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Mo Modal</Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={title} size={size}>
        {content || (
          <p className="text-text-muted">Day la noi dung cua modal. Bam X hoac nhan Escape de dong.</p>
        )}
      </Modal>
    </>
  );
}

export const Default: Story = {
  args: { isOpen: false, children: null },
  render: () => <ModalDemo title="Tieu de Modal" />,
};

export const Small: Story = {
  args: { isOpen: false, children: null },
  render: () => <ModalDemo title="Modal nho" size="sm" />,
};

export const Large: Story = {
  args: { isOpen: false, children: null },
  render: () => <ModalDemo title="Modal lon" size="lg" />,
};

export const WithoutTitle: Story = {
  args: { isOpen: false, children: null },
  render: () => (
    <ModalDemo
      content={
        <div className="text-center py-4">
          <p className="text-4xl mb-3">❤️</p>
          <h2 className="font-heading text-xl font-bold text-text mb-2">Chuc mung!</h2>
          <p className="text-text-muted">Ban da hoan thanh 365 ngay ben nhau!</p>
        </div>
      }
    />
  ),
};

export const AddDateModal: Story = {
  args: { isOpen: false, children: null },
  render: () => (
    <ModalDemo
      title="Them buoi hen ho"
      size="md"
      content={
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text">Dia diem</label>
            <input className="mt-1 w-full px-3 py-2 rounded-[var(--radius-md)] border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Cafe, nha hang..." />
          </div>
          <div>
            <label className="text-sm font-medium text-text">Cam nhan</label>
            <textarea className="mt-1 w-full px-3 py-2 rounded-[var(--radius-md)] border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" rows={3} placeholder="Buoi hom nay that..." />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="primary" className="flex-1">Luu lai</Button>
            <Button variant="ghost">Huy</Button>
          </div>
        </div>
      }
    />
  ),
};
