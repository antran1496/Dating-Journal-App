'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Heart, Link2, ArrowRight, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { createCoupleSchema, joinCoupleSchema, type CreateCoupleFormValues, type JoinCoupleFormValues } from '@/types/forms';

type Step = 'choose' | 'create' | 'join' | 'created';

export default function CoupleSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('choose');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const createForm = useForm<CreateCoupleFormValues>({
    resolver: zodResolver(createCoupleSchema),
    defaultValues: { relationship_status: 'dating' },
  });

  const joinForm = useForm<JoinCoupleFormValues>({
    resolver: zodResolver(joinCoupleSchema),
  });

  const handleCreate = async (values: CreateCoupleFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/couples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Đã có lỗi xảy ra'); return; }
      setInviteCode(json.data.invite_code);
      setStep('created');
    } catch {
      setError('Không thể kết nối, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (values: JoinCoupleFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/couples/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Đã có lỗi xảy ra'); return; }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Không thể kết nối, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const RELATIONSHIP_OPTIONS = [
    { value: 'talking', label: '💬 Đang tìm hiểu' },
    { value: 'dating', label: '💕 Đang hẹn hò' },
    { value: 'official', label: '❤️ Chính thức' },
    { value: 'engaged', label: '💍 Đã đính hôn' },
    { value: 'married', label: '👑 Đã kết hôn' },
  ];

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-accent mb-4 shadow-[var(--shadow-glow)]">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-text">Dating Journal</h1>
          <p className="text-text-muted text-sm mt-1">Bắt đầu câu chuyện tình yêu của bạn</p>
        </div>

        {/* STEP: CHOOSE */}
        {step === 'choose' && (
          <Card>
            <CardHeader>
              <CardTitle>Bạn muốn làm gì?</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <button
                onClick={() => setStep('create')}
                className="w-full flex items-center gap-4 p-4 rounded-[var(--radius-md)] border border-border hover:border-primary/50 hover:bg-surface-hover transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Heart size={24} />
                </div>
                <div>
                  <p className="font-semibold text-text">Tạo couple mới</p>
                  <p className="text-text-muted text-sm">Bắt đầu và mời người yêu tham gia</p>
                </div>
                <ArrowRight size={20} className="ml-auto text-text-muted group-hover:text-primary transition-colors" />
              </button>

              <button
                onClick={() => setStep('join')}
                className="w-full flex items-center gap-4 p-4 rounded-[var(--radius-md)] border border-border hover:border-accent/50 hover:bg-surface-hover transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Link2 size={24} />
                </div>
                <div>
                  <p className="font-semibold text-text">Tham gia bằng mã mời</p>
                  <p className="text-text-muted text-sm">Đã có mã từ người yêu? Nhập vào đây</p>
                </div>
                <ArrowRight size={20} className="ml-auto text-text-muted group-hover:text-accent transition-colors" />
              </button>
            </CardBody>
          </Card>
        )}

        {/* STEP: CREATE */}
        {step === 'create' && (
          <Card>
            <CardHeader>
              <button onClick={() => { setStep('choose'); setError(null); }} className="text-text-muted text-sm hover:text-text mb-2">← Quay lại</button>
              <CardTitle>Tạo couple mới 💕</CardTitle>
            </CardHeader>
            <CardBody>
              <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-5">
                {error && <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-error)]/10 text-[var(--color-error)] text-sm">{error}</div>}

                <Input
                  {...createForm.register('anniversary_date')}
                  type="date"
                  label="Ngày bắt đầu yêu nhau ❤️"
                  error={createForm.formState.errors.anniversary_date?.message}
                />

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Trạng thái hiện tại</label>
                  <select
                    {...createForm.register('relationship_status')}
                    className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {RELATIONSHIP_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                  Tạo couple
                </Button>
              </form>
            </CardBody>
          </Card>
        )}

        {/* STEP: JOIN */}
        {step === 'join' && (
          <Card>
            <CardHeader>
              <button onClick={() => { setStep('choose'); setError(null); }} className="text-text-muted text-sm hover:text-text mb-2">← Quay lại</button>
              <CardTitle>Tham gia bằng mã mời 🔗</CardTitle>
            </CardHeader>
            <CardBody>
              <form onSubmit={joinForm.handleSubmit(handleJoin)} className="space-y-5">
                {error && <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-error)]/10 text-[var(--color-error)] text-sm">{error}</div>}

                <Input
                  {...joinForm.register('invite_code')}
                  label="Mã mời (6 ký tự)"
                  placeholder="ABC123"
                  maxLength={6}
                  className="uppercase tracking-widest text-center text-xl font-bold"
                  error={joinForm.formState.errors.invite_code?.message}
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                    joinForm.setValue('invite_code', e.target.value);
                  }}
                />

                <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                  Tham gia
                </Button>
              </form>
            </CardBody>
          </Card>
        )}

        {/* STEP: CREATED (hiện invite code) */}
        {step === 'created' && (
          <Card>
            <CardHeader>
              <CardTitle>🎉 Couple đã được tạo!</CardTitle>
            </CardHeader>
            <CardBody className="space-y-5">
              <p className="text-text-muted text-sm">
                Gửi mã mời này cho người yêu để họ tham gia:
              </p>

              <div className="relative">
                <div className="flex items-center justify-between p-4 rounded-[var(--radius-lg)] bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                  <span className="font-heading text-3xl font-bold tracking-widest text-primary">
                    {inviteCode}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] bg-primary text-primary-fg text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    {copied ? <><Check size={14} /> Đã copy!</> : <><Copy size={14} /> Copy</>}
                  </button>
                </div>
              </div>

              <p className="text-xs text-text-muted text-center">
                Mã có hiệu lực đến khi người yêu tham gia
              </p>

              <Button
                onClick={() => router.push('/dashboard')}
                variant="primary"
                className="w-full"
              >
                Vào Dashboard →
              </Button>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
