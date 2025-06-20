export default function LandingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen w-full relative">
      <div className="fixed opacity-90 inset-0 bg-cover bg-center bg-no-repeat w-full h-full bg-[url('/images/new-landing-background.webp')] bg-right" />
      <div className="relative min-h-screen h-full z-10 flex flex-col items-center justify-center">
        <main className="flex flex-col w-full">{children}</main>
      </div>
    </div>
  );
}
