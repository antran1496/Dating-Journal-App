
interface MagicLinkEmailProps {
  url: string;
}

export function renderMagicLinkHtml({ url }: MagicLinkEmailProps): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Đăng nhập Dating Journal</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fdf6f0; margin: 0; padding: 24px; color: #2d1b30; }
    .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 36px 32px; border: 1px solid #f0dde8; box-shadow: 0 4px 16px rgba(45, 27, 48, 0.05); }
    .brand { font-size: 20px; font-weight: 700; color: #ff6b81; margin-bottom: 24px; text-align: center; }
    h1 { font-size: 24px; font-weight: 700; color: #2d1b30; margin-top: 0; margin-bottom: 12px; text-align: center; }
    p { font-size: 15px; line-height: 1.6; color: #8b7088; margin-bottom: 24px; }
    .btn-wrap { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background-color: #ff6b81; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 14px; box-shadow: 0 4px 12px rgba(255, 107, 129, 0.3); }
    .footer { font-size: 13px; color: #a08a9d; margin-top: 32px; border-top: 1px solid #f0dde8; padding-top: 20px; text-align: center; line-height: 1.5; }
    .alt-link { word-break: break-all; font-size: 12px; color: #ff6b81; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">Dating Journal 💗</div>
    <h1>Chào bạn quay lại!</h1>
    <p>Nhấn vào nút bên dưới để đăng nhập vào Dating Journal. Link này có hiệu lực trong <strong>15 phút</strong> và chỉ sử dụng được <strong>một lần duy nhất</strong>.</p>
    <div class="btn-wrap">
      <a href="${url}" class="btn" target="_blank">Đăng nhập vào Dating Journal</a>
    </div>
    <p style="font-size: 13px; color: #8b7088;">Nếu nút bấm trên không hoạt động, bạn hãy sao chép đường dẫn này vào trình duyệt:</p>
    <p class="alt-link">${url}</p>
    <div class="footer">
      Nếu bạn không yêu cầu đăng nhập, bạn có thể an tâm bỏ qua email này.<br>
      © Dating Journal — Không gian riêng của hai đứa.
    </div>
  </div>
</body>
</html>
`;
}
