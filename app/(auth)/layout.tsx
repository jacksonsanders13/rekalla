import Image from "next/image";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-4">
        <Image
          src="/logo.svg"
          alt=""
          width={88}
          height={88}
          priority
          className="rounded-[24%]"
        />
        <p className="text-2xl font-semibold tracking-tight text-label">
          Rekalla
        </p>
      </div>
      <main className="w-full max-w-md animate-fade-up">{children}</main>
      <p className="mt-8 max-w-sm text-center text-sm text-label-4">
        Rekalla is not a medical device and does not provide medical advice.
      </p>
    </div>
  );
}
