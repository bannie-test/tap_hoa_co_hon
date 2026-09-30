"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(
        "Đăng nhập không thành công. Vui lòng kiểm tra email và mật khẩu.",
      );
      return;
    }

    router.push(params.get("redirect") ?? "/admin");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative flex min-h-64 items-center overflow-hidden border-b-4 border-black bg-[#1040C0] p-6 text-white sm:p-10 lg:min-h-screen lg:border-b-0 lg:border-r-4 lg:p-14">
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-10 -top-10 size-48 rounded-full border-4 border-black bg-[#F0C020] sm:size-64" />
          <div className="absolute bottom-8 right-20 size-28 rotate-12 border-4 border-black bg-[#D02020] sm:bottom-20 sm:right-32 sm:size-40" />
          <div className="absolute right-12 top-24 size-20 border-4 border-black bg-white sm:right-24 sm:top-40 sm:size-28" />
          <div className="absolute bottom-10 left-8 size-4 rotate-45 bg-[#F0C020] sm:bottom-16 sm:left-14 sm:size-6" />
        </div>
        <div className="relative z-10 max-w-lg">
          <div aria-hidden="true" className="mb-8 flex items-center gap-2">
            <span className="size-4 rounded-full border-2 border-black bg-[#F0C020]" />
            <span className="size-4 border-2 border-black bg-[#D02020]" />
            <span className="size-4 border-2 border-black bg-white [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
          </div>
          <h1 className="max-w-[10ch] text-4xl font-black uppercase sm:text-6xl leading-[normal]">
            Tạp hóa Cô Hồng
          </h1>
          <div className="mt-6 h-2 w-20 bg-[#F0C020]" />
        </div>
      </section>
      <section className="flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <form
          onSubmit={onSubmit}
          className="bauhaus-panel bauhaus-shadow w-full max-w-md space-y-5 border-4 p-6 sm:p-9"
        >
          <div>
            <p className="text-xs font-bold uppercase text-[#1040C0]">
              Tạp hóa Cô Hồng
            </p>
            <h2 className="mt-2 text-3xl font-black uppercase">Đăng nhập</h2>
          </div>

          {error && (
            <p
              role="alert"
              className="border-l-4 border-[#D02020] bg-[#F0F0F0] p-3 text-sm font-bold text-[#D02020]"
            >
              {error}
            </p>
          )}

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-bold uppercase"
            >
              Địa chỉ email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bauhaus-field"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-bold uppercase"
            >
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bauhaus-field"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bauhaus-button bauhaus-button-red w-full"
          >
            {loading ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginForm />
    </Suspense>
  );
}
