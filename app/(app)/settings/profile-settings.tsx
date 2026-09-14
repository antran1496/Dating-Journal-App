'use client';

import React, { useState } from 'react';
import { User, Heart, Edit3 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ProfileForm } from '@/components/features/profile-form';
import { NicknameForm } from '@/components/features/nickname-form';
import type { Profile, CoupleWithMembers } from '@/types';

interface ProfileClientProps {
  profile: Profile;
  couple: CoupleWithMembers | null;
  userId: string;
}

export function ProfileClient({ profile, couple, userId }: ProfileClientProps) {
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showNickname, setShowNickname] = useState(false);

  const partner = couple?.couple_members?.find((m) => m.profile_id !== userId)?.profile ?? null;
  const partnerMember = couple?.couple_members?.find((m) => m.profile_id !== userId);
  const myMember = couple?.couple_members?.find((m) => m.profile_id === userId);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text">Hồ sơ của tôi</h1>
        <p className="text-text-muted text-sm mt-1">Quản lý thông tin cá nhân của bạn</p>
      </div>

      {/* My Profile Card */}
      <div className="bg-surface border border-border rounded-[var(--radius-lg)] p-5">
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-semibold text-text flex items-center gap-2"><User size={18} /> Thông tin của tôi</h2>
          <Button variant="ghost" size="sm" onClick={() => setShowEditProfile(true)}>
            <Edit3 size={16} className="mr-1" /> Chỉnh sửa
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Avatar src={profile.avatar_url ?? undefined} name={profile.display_name ?? 'U'} size="xl" />
          <div>
            <p className="font-heading font-bold text-xl text-text">{profile.display_name ?? 'Chưa đặt tên'}</p>
            {myMember?.nickname && (
              <p className="text-primary text-sm">Biệt danh: <span className="font-medium">{myMember.nickname}</span></p>
            )}
            {profile.birth_date && (
              <p className="text-text-muted text-sm mt-1">
                🎂 {new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(profile.birth_date))}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Partner Card */}
      {partner && couple && (
        <div className="bg-surface border border-border rounded-[var(--radius-lg)] p-5">
          <div className="flex items-start justify-between mb-4">
            <h2 className="font-semibold text-text flex items-center gap-2"><Heart size={18} className="text-primary" /> Người ấy</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowNickname(true)}>
              <Edit3 size={16} className="mr-1" /> Đặt biệt danh
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Avatar src={partner.avatar_url ?? undefined} name={partner.display_name ?? '?'} size="xl" />
            <div>
              <p className="font-heading font-bold text-xl text-text">{partner.display_name ?? 'Chưa đặt tên'}</p>
              {partnerMember?.nickname && (
                <p className="text-primary text-sm">Biệt danh: <span className="font-medium">{partnerMember.nickname}</span></p>
              )}
              {partner.birth_date && (
                <p className="text-text-muted text-sm mt-1">
                  🎂 {new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(partner.birth_date))}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Couple Info */}
      {couple && (
        <div className="bg-surface border border-border rounded-[var(--radius-lg)] p-5 space-y-3">
          <h2 className="font-semibold text-text">💑 Thông tin couple</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-text-muted">Mã mời</p>
              <p className="font-mono font-bold text-primary tracking-widest">{couple.invite_code}</p>
            </div>
            {couple.anniversary_date && (
              <div>
                <p className="text-text-muted">Ngày bắt đầu</p>
                <p className="font-medium text-text">
                  {new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(couple.anniversary_date))}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <Modal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} title="Chỉnh sửa hồ sơ" size="md">
        <ProfileForm
          profile={profile}
          onSuccess={() => setShowEditProfile(false)}
        />
      </Modal>

      {/* Nickname Modal */}
      {partner && couple && (
        <Modal isOpen={showNickname} onClose={() => setShowNickname(false)} title="Đặt biệt danh" size="sm">
          <NicknameForm
            partner={partner}
            currentNickname={partnerMember?.nickname}
            coupleId={couple.id}
            onSuccess={() => setShowNickname(false)}
          />
        </Modal>
      )}
    </div>
  );
}
