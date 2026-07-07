import { Logo } from "@/components/ui/logo";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Logo className="mb-8" />
      <main className="w-full max-w-md animate-fade-up">{children}</main>
      <p className="mt-8 max-w-sm text-center text-sm text-sand-500">
        Rekalla is not a medical device and does not provide medical advice.
      </p>
    </div>
  );
}
