import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Heart } from "lucide-react";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from "./card";

const meta = {
  title: "UI/Card",
  component: Card,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Card component với header, body, footer slots. Hỗ trợ glassmorphism và hover animation.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: "380px", padding: "1rem" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    glass: { control: "boolean", description: "Glassmorphism effect" },
    hoverable: { control: "boolean", description: "Hover lift animation" },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card {...args}>
      <CardBody>Đây là nội dung của card.</CardBody>
    </Card>
  ),
};

export const WithHeader: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Buổi hẹn hò ❤️</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="text-text-muted text-sm">
          Nhà hàng Trung Nguyên — Thứ 6, 12/09/2025
        </p>
      </CardBody>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Kỷ niệm 1 năm</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="text-text-muted text-sm">
          Một năm trôi qua thật nhanh và đẹp.
        </p>
      </CardBody>
      <CardFooter className="gap-2">
        <Button size="sm" variant="primary">
          Xem chi tiết
        </Button>
        <Button size="sm" variant="ghost">
          Chỉnh sửa
        </Button>
      </CardFooter>
    </Card>
  ),
};

export const Hoverable: Story = {
  args: { hoverable: true },
  render: (args) => (
    <Card {...args}>
      <CardBody>Hover vào card để thấy hiệu ứng nổi lên.</CardBody>
    </Card>
  ),
};

export const Glass: Story = {
  args: { glass: true },
  render: (args) => (
    <div
      style={{
        background: "linear-gradient(135deg, #ff6b81 0%, #c084fc 100%)",
        padding: "2rem",
        borderRadius: "16px",
      }}
    >
      <Card {...args}>
        <CardBody>
          <p className="text-text font-medium">Glassmorphism Card</p>
          <p className="text-text-muted text-sm">Trong suốt, hiện đại.</p>
        </CardBody>
      </Card>
    </div>
  ),
};

export const DateCard: Story = {
  render: () => (
    <Card hoverable>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Cafe Oasis</CardTitle>
          <Badge variant="success" dot>
            Tuyệt vời
          </Badge>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-text-muted text-sm mb-3">
          Thứ 6, 12/09/2025 · 19:00
        </p>
        <p className="text-text text-sm">
          Buổi tối lãng mạn tại quán cafe trên tầng thượng, nhìn ra toàn cảnh
          thành phố.
        </p>
        <div className="flex items-center gap-1 mt-3 text-primary">
          {[1, 2, 3, 4, 5].map((i) => (
            <Heart key={i} size={14} className="fill-primary" />
          ))}
        </div>
      </CardBody>
      <CardFooter>
        <Button size="sm" variant="ghost">
          Xem thêm →
        </Button>
      </CardFooter>
    </Card>
  ),
};
