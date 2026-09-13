import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import { ToastProvider, useToast } from './toast';
import { Button } from './button';

const meta = {
  title: 'UI/Toast',
  // Toast requires a Provider, so we render the wrapper directly
  component: ToastProvider,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Toast notification system. Su dung `<ToastProvider>` o root layout va `useToast()` hook de trigger thong bao. Ho tro success, error, info, warning voi progress bar tu dong.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
} satisfies Meta<typeof ToastProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

function ToastDemo({ type, title, message }: { type: 'success' | 'error' | 'info' | 'warning'; title: string; message?: string }) {
  const { toast } = useToast();
  return (
    <Button onClick={() => toast({ type, title, message, duration: 5000 })}>
      Hien Toast {type}
    </Button>
  );
}

export const Success: Story = {
  args: { children: null },
  render: () => (
    <ToastDemo type="success" title="Luu thanh cong!" message="Buoi hen da duoc luu vao nhat ky." />
  ),
};

export const Error: Story = {
  args: { children: null },
  render: () => (
    <ToastDemo type="error" title="Co loi xay ra" message="Vui long thu lai sau." />
  ),
};

export const Info: Story = {
  args: { children: null },
  render: () => (
    <ToastDemo type="info" title="Meo nho" message="Ban co the keo anh vao de upload nhanh hon." />
  ),
};

export const Warning: Story = {
  args: { children: null },
  render: () => (
    <ToastDemo type="warning" title="Chu y" message="Phien dang nhap sap het han." />
  ),
};

export const AllTypes: Story = {
  args: { children: null },
  render: () => {
    function AllToasts() {
      const { toast } = useToast();
      return (
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => toast({ type: 'success', title: 'Thanh cong!', message: 'Du lieu da duoc luu.' })}>
            Success
          </Button>
          <Button variant="danger" onClick={() => toast({ type: 'error', title: 'Loi!', message: 'Khong the ket noi.' })}>
            Error
          </Button>
          <Button variant="secondary" onClick={() => toast({ type: 'info', title: 'Thong tin', message: 'Co cap nhat moi.' })}>
            Info
          </Button>
          <Button variant="ghost" onClick={() => toast({ type: 'warning', title: 'Canh bao', message: 'Dung luong sap day.' })}>
            Warning
          </Button>
        </div>
      );
    }
    return <AllToasts />;
  },
};
