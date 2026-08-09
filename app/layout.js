import './globals.css';

export const metadata = {
  title: '설교찬양 영상 생성기',
  description: 'MP3를 업로드하면 설교찬양 YouTube 영상을 자동 생성합니다.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
