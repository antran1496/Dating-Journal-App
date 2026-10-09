'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Heart, Edit3, Calendar, Users, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Modal } from '@/components/ui/modal';
import { NicknameForm } from '@/components/features/nickname-form';
import { useCouple } from '@/hooks/use-couple';
import { useSessionUser } from '@/components/providers/session-provider';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';

export default function CoupleSettingsPage() {
  const { user } = useSessionUser();
  const { couple, isLoading, refetch } = useCouple();
  const { toast } = useToast();
  const supabase = createClient();

  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [relationshipStatus, setRelationshipStatus] = useState<string>('dating');
  const [anniversaryDate, setAnniversaryDate] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (couple) {
      setRelationshipStatus(couple.relationship_status || 'dating');
      if (couple.anniversary_date) {
        setAnniversaryDate(couple.anniversary_date);
      }
    }
  }, [couple]);

  const handleUpdateCoupleInfo = async () => {
    if (!couple?.id) return;
    setIsUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('couples')
        .update({
          relationship_status: relationshipStatus,
          anniversary_date: anniversaryDate || null,
        })
        .eq('id', couple.id);

      if (error) throw error;
      toast({ type: 'success', title: 'Đã cập nhật thông tin couple thành công! 💑' });
      refetch();
    } catch {
      toast({ type: 'error', title: 'Không thể cập nhật thông tin' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const copyInviteCode = () => {
    if (!couple?.invite_code) return;
    navigator.clipboard.writeText(couple.invite_code);
    setCopied(true);
    toast({ type: 'success', title: 'Đã sao chép mã mời' });
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const partnerMember = couple?.couple_members?.find((m) => m.profile_id !== user?.id);
  const myMember = couple?.couple_members?.find((m) => m.profile_id === user?.id);
  const partner = partnerMember?.profile;

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="p-2 -ml-2 text-text-muted hover:text-text rounded-full hover:bg-surface-hover transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-text flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary" />
            Couple & biệt danh
          </h1>
          <p className="text-text-muted text-xs sm:text-sm mt-0.5">
            Quản lý thông tin mối quan hệ và biệt danh hai bạn
          </p>
        </div>
      </div>

      {couple ? (
        <div className="space-y-6">
          {/* Partner & Nickname Card */}
          <Card className="p-5 sm:p-6 space-y-4 border border-border bg-surface shadow-sm">
            <div className="flex items-start justify-between">
              <h2 className="font-semibold text-text flex items-center gap-2">
                <Users size={18} className="text-primary" /> Thông tin người ấy
              </h2>
              {partner && (
                <Button variant="ghost" size="sm" onClick={() => setShowNicknameModal(true)}>
                  <Edit3 size={15} className="mr-1" /> Đặt biệt danh
                </Button>
              )}
            </div>

            {partner ? (
              <div className="flex items-center gap-4">
                <Avatar
                  src={partner.avatar_url ?? undefined}
                  name={partner.display_name ?? '?'}
                  size="xl"
                />
                <div className="space-y-1">
                  <p className="font-heading font-bold text-lg text-text">
                    {partner.display_name ?? 'Chưa đặt tên'}
                  </p>
                  {partnerMember?.nickname ? (
                    <p className="text-primary text-sm font-medium">
                      Biệt danh: <span className="font-semibold">{partnerMember.nickname}</span>
                    </p>
                  ) : (
                    <p className="text-text-muted text-xs">Chưa đặt biệt danh cho người ấy</p>
                  )}
                  {myMember?.nickname && (
                    <p className="text-text-muted text-xs">
                      Người ấy gọi bạn là: <strong className="text-text font-medium">{myMember.nickname}</strong>
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-surface-hover text-center space-y-2">
                <p className="text-sm text-text font-medium">Người yêu của bạn chưa tham gia</p>
                <p className="text-xs text-text-muted">Chia sẻ mã mời để kết nối cùng người ấy:</p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border mt-1">
                  <span className="font-mono font-bold tracking-widest text-primary text-sm">
                    {couple.invite_code}
                  </span>
                  <button
                    type="button"
                    onClick={copyInviteCode}
                    className="p-1 text-text-muted hover:text-text rounded"
                  >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}
          </Card>

          {/* Relationship Info Card */}
          <Card className="p-5 sm:p-6 space-y-5 border border-border bg-surface shadow-sm">
            <h2 className="font-semibold text-text flex items-center gap-2">
              <Calendar size={18} className="text-primary" /> Cột mốc & Trạng thái
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text uppercase tracking-wider block mb-1.5">
                  Ngày bắt đầu yêu
                </label>
                <input
                  type="date"
                  value={anniversaryDate}
                  onChange={(e) => setAnniversaryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-sm text-text focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text uppercase tracking-wider block mb-1.5">
                  Tình trạng mối quan hệ
                </label>
                <select
                  value={relationshipStatus}
                  onChange={(e) => setRelationshipStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-sm text-text focus:outline-none focus:border-primary"
                >
                  <option value="talking">Đang tìm hiểu (Talking stage) 💬</option>
                  <option value="dating">Đang hẹn hò (Dating) ☕</option>
                  <option value="official">Chính thức yêu nhau (In a relationship) 💕</option>
                  <option value="engaged">Đã đính hôn (Engaged) 💍</option>
                  <option value="married">Đã kết hôn (Married) 👰🤵</option>
                </select>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  onClick={handleUpdateCoupleInfo}
                  disabled={isUpdatingStatus}
                  className="w-full sm:w-auto"
                >
                  {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu thay đổi'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-8 text-center space-y-3">
          <p className="text-text-muted text-sm">Bạn chưa tham gia couple nào.</p>
          <Link href="/onboarding">
            <Button variant="primary">Tạo hoặc tham gia couple</Button>
          </Link>
        </Card>
      )}

      {/* Modal: Set Nickname */}
      {partner && couple && (
        <Modal isOpen={showNicknameModal} onClose={() => setShowNicknameModal(false)}>
          <div className="p-6">
            <h2 className="font-heading font-bold text-lg text-text mb-4">
              Đặt biệt danh cho {partner.display_name || 'người ấy'}
            </h2>
            <NicknameForm
              partner={partner}
              currentNickname={partnerMember?.nickname}
              coupleId={couple.id}
              onSuccess={() => {
                setShowNicknameModal(false);
                refetch();
              }}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
