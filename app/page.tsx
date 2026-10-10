import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import {
  LandingNav,
  LandingHero,
  LandingFeatures,
  LandingPrivacy,
  LandingSteps,
  LandingFooter,
} from '@/components/landing';

export const metadata: Metadata = {
  title: 'Dating Journal — Không gian riêng của hai đứa',
  description: 'Ghi lại buổi hẹn trong 10 giây. Riêng tư tuyệt đối, đủ đáng yêu để muốn khoe. Cho cặp đôi 16–25 tuổi.',
  openGraph: {
    title: 'Dating Journal — Không gian riêng của hai đứa',
    description: 'Ghi lại buổi hẹn trong 10 giây. Riêng tư tuyệt đối, đủ đáng yêu để muốn khoe.',
    type: 'website',
    locale: 'vi_VN',
  },
};

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col font-body antialiased selection:bg-primary/20 selection:text-primary">
      <LandingNav isAuthed={false} />
      <main className="flex-1">
        <LandingHero isAuthed={false} />
        <LandingFeatures />
        <LandingPrivacy />
        <LandingSteps />
      </main>
      <LandingFooter />
    </div>
  );
}
