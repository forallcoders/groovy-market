import '../globals.css';
import LandingLayout from './components/landing-layout';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LandingLayout>{children}</LandingLayout>
  );
}
