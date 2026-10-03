'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Hash, Star, Hand } from 'lucide-react';
import { TarotDraw } from '@/components/features/tarot-draw';
import { ReadingCard } from '@/components/features/reading-card';
import { createClient } from '@/lib/supabase/client';
import { calculateLifePathNumber } from '@/lib/ai/prompts/numerology';
import { getZodiacSign } from '@/lib/ai/prompts/zodiac';
import { MAJOR_ARCANA } from '@/lib/ai/prompts/tarot';
import type { AiReading, Profile } from '@/types';
import { useToast } from '@/components/ui/toast';
import { useSessionUser } from '@/components/providers/session-provider';

function resizeImage(file: File, maxWidth = 1024, maxHeight = 1024, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState<'numerology' | 'zodiac' | 'tarot' | 'palm'>('numerology');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);
  const [readings, setReadings] = useState<AiReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [manualPartnerName, setManualPartnerName] = useState('');
  const [manualPartnerDate, setManualPartnerDate] = useState('');
  const [palmImage, setPalmImage] = useState<string | null>(null);

  const supabase = createClient();
  const { toast } = useToast();
  const { user } = useSessionUser();

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      if (!user) return;

      // 1. Get current user's profile
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(p as Profile);

      // 2. Get couple_id
      const { data: myMember } = await supabase
        .from('couple_members')
        .select('couple_id')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (myMember?.couple_id) {
        // 3. Find partner in the same couple
        const { data: partnerMember } = await supabase
          .from('couple_members')
          .select('profile_id')
          .eq('couple_id', myMember.couple_id)
          .neq('profile_id', user.id)
          .maybeSingle();

        if (partnerMember?.profile_id) {
          const { data: pProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', partnerMember.profile_id)
            .maybeSingle();

          if (pProfile) {
            setPartnerProfile(pProfile as Profile);
          }
        }
      }

      // 4. Get all readings
      const { data: rData } = await supabase
        .from('ai_readings')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });

      if (rData) setReadings(rData as AiReading[]);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const generateReading = async (type: string, inputData: Record<string, unknown>) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, input_data: inputData }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Không thể tạo luận giải');
      }

      const { data } = await res.json();
      if (data) {
        // Prepend to top
        setReadings((prev) => {
          // Remove old cache if it's the exact same id
          const filtered = prev.filter((r) => r.id !== data.id);
          return [data, ...filtered];
        });
        toast({ type: 'success', title: 'Đã tạo luận giải thành công! ✨' });
      }
    } catch (e: any) {
      console.error(e);
      toast({ type: 'error', title: e?.message || 'Không thể tạo luận giải. Vui lòng thử lại!' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNumerology = () => {
    if (!profile?.birth_date) return alert('Vui lòng cập nhật ngày sinh trong phần Hồ sơ');
    generateReading('numerology', { 
      birth_date: profile.birth_date,
      display_name: profile.display_name 
    });
  };

  const handleZodiac = () => {
    const partnerDate = partnerProfile?.birth_date || manualPartnerDate;
    const partnerName = partnerProfile?.display_name || manualPartnerName || 'Người ấy';

    if (!profile?.birth_date || !partnerDate) {
      return alert('Cả 2 người cần nhập ngày sinh.');
    }
    generateReading('zodiac', {
      birth_date_1: profile.birth_date,
      name_1: profile.display_name,
      birth_date_2: partnerDate,
      name_2: partnerName,
    });
  };

  const handleTarotComplete = (cardIds: number[]) => {
    generateReading('tarot', { card_ids: cardIds });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const resized = await resizeImage(file);
        setPalmImage(resized);
      } catch (err) {
        console.error('Lỗi xử lý ảnh:', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPalmImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Calculate info for display
  const myLifePath = profile?.birth_date ? calculateLifePathNumber(profile.birth_date) : null;
  const myZodiac = profile?.birth_date ? getZodiacSign(profile.birth_date) : null;
  const partnerDateToUse = partnerProfile?.birth_date || manualPartnerDate;
  const partnerZodiac = partnerDateToUse ? getZodiacSign(partnerDateToUse) : null;

  return (
    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-primary" />
          Khám phá tình yêu
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Dùng AI để hiểu rõ hơn về mối quan hệ của hai bạn
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-hover p-1 rounded-[var(--radius-md)] border border-border">
        <button
          onClick={() => setActiveTab('numerology')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-[var(--radius-sm)] transition-colors ${
            activeTab === 'numerology' ? 'bg-surface shadow-sm text-primary' : 'text-text-muted hover:text-text'
          }`}
        >
          <Hash className="w-4 h-4" /> <span className="hidden sm:inline">Thần số học</span>
        </button>
        <button
          onClick={() => setActiveTab('zodiac')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-[var(--radius-sm)] transition-colors ${
            activeTab === 'zodiac' ? 'bg-surface shadow-sm text-accent' : 'text-text-muted hover:text-text'
          }`}
        >
          <Star className="w-4 h-4" /> <span className="hidden sm:inline">Cung hoàng đạo</span>
        </button>
        <button
          onClick={() => setActiveTab('tarot')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-[var(--radius-sm)] transition-colors ${
            activeTab === 'tarot' ? 'bg-surface shadow-sm text-purple-500' : 'text-text-muted hover:text-text'
          }`}
        >
          <Sparkles className="w-4 h-4" /> <span className="hidden sm:inline">Tarot</span>
        </button>
        <button
          onClick={() => setActiveTab('palm')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-[var(--radius-sm)] transition-colors ${
            activeTab === 'palm' ? 'bg-surface shadow-sm text-green-500' : 'text-text-muted hover:text-text'
          }`}
        >
          <Hand className="w-4 h-4" /> <span className="hidden sm:inline">Chỉ tay</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="min-h-[300px]">
        {activeTab === 'numerology' && (
          <Card>
            <CardHeader className="text-center pb-2">
              <CardTitle>Con số chủ đạo của bạn</CardTitle>
            </CardHeader>
            <CardBody className="flex flex-col items-center gap-6">
              {myLifePath ? (
                <>
                  <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center shadow-glow">
                    <span className="text-4xl font-heading font-bold text-primary">{myLifePath}</span>
                  </div>
                  <Button onClick={handleNumerology} isLoading={isGenerating} variant="primary">
                    Xem luận giải chi tiết
                  </Button>
                </>
              ) : (
                <div className="text-center space-y-3">
                  <p className="text-text-muted text-sm">Chưa có thông tin ngày sinh.</p>
                  <Button variant="secondary" onClick={() => window.location.href = '/settings'}>Cập nhật Hồ sơ</Button>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {activeTab === 'zodiac' && (
          <Card>
            <CardHeader className="text-center pb-2">
              <CardTitle>Độ tương hợp Cung hoàng đạo</CardTitle>
            </CardHeader>
            <CardBody className="flex flex-col items-center gap-6">
              {myZodiac && partnerZodiac ? (
                <>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-4xl mb-2">{myZodiac.emoji}</div>
                      <p className="font-bold text-text">{myZodiac.name}</p>
                      <p className="text-xs text-text-muted">{profile?.display_name}</p>
                    </div>
                    <div className="text-2xl text-text-muted">💖</div>
                    <div className="text-center">
                      <div className="text-4xl mb-2">{partnerZodiac.emoji}</div>
                      <p className="font-bold text-text">{partnerZodiac.name}</p>
                      <p className="text-xs text-text-muted">{partnerProfile?.display_name || manualPartnerName || 'Người ấy'}</p>
                    </div>
                  </div>
                  <Button onClick={handleZodiac} isLoading={isGenerating} variant="primary" className="!bg-accent hover:!bg-accent-hover text-white border-none">
                    Phân tích tương hợp
                  </Button>
                </>
              ) : !myZodiac ? (
                <div className="text-center space-y-3">
                  <p className="text-text-muted text-sm">Bạn cần cập nhật ngày sinh của mình trước.</p>
                  <Button variant="secondary" onClick={() => window.location.href = '/settings'}>Cập nhật Hồ sơ</Button>
                </div>
              ) : partnerProfile && !partnerProfile.birth_date ? (
                <div className="w-full max-w-sm space-y-4">
                  <div className="text-center mb-2">
                    <p className="text-text font-medium text-sm">
                      Người yêu của bạn ({partnerProfile.display_name || 'Người ấy'}) chưa cập nhật ngày sinh trong hồ sơ.
                    </p>
                    <p className="text-text-muted text-xs mt-1">
                      Nhập ngày sinh của người ấy bên dưới để xem độ tương hợp:
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text">Ngày sinh của {partnerProfile.display_name || 'người ấy'}</label>
                    <input 
                      type="date" 
                      value={manualPartnerDate}
                      onChange={(e) => setManualPartnerDate(e.target.value)}
                      className="w-full h-10 px-3 bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-sm space-y-4">
                  <div className="text-center mb-2">
                    <p className="text-text-muted text-sm">Người yêu của bạn chưa tham gia? Nhập nhanh thông tin của họ để xem độ tương hợp nhé.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text">Tên (tùy chọn)</label>
                    <input 
                      type="text" 
                      value={manualPartnerName}
                      onChange={(e) => setManualPartnerName(e.target.value)}
                      placeholder="Nhập tên người ấy"
                      className="w-full h-10 px-3 bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text">Ngày sinh</label>
                    <input 
                      type="date" 
                      value={manualPartnerDate}
                      onChange={(e) => setManualPartnerDate(e.target.value)}
                      className="w-full h-10 px-3 bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {activeTab === 'tarot' && (
          <Card>
            <CardHeader className="text-center pb-2">
              <CardTitle>Trải bài 3 lá: Tình yêu</CardTitle>
            </CardHeader>
            <CardBody>
              {isGenerating ? (
                <div className="py-12 flex flex-col items-center gap-4">
                  <Sparkles className="w-8 h-8 text-purple-500 animate-spin" />
                  <p className="text-text-muted font-medium animate-pulse">Vũ trụ đang gửi thông điệp...</p>
                </div>
              ) : (
                <TarotDraw cards={MAJOR_ARCANA} onComplete={handleTarotComplete} />
              )}
            </CardBody>
          </Card>
        )}

        {activeTab === 'palm' && (
          <Card>
            <CardHeader className="text-center pb-2">
              <CardTitle>Xem bói chỉ tay 🖐️</CardTitle>
            </CardHeader>
            <CardBody className="flex flex-col items-center gap-6">
              <p className="text-text-muted text-sm text-center max-w-sm">
                Tải lên ảnh chụp rõ nét lòng bàn tay của bạn để AI phân tích chi tiết các đường chỉ tay.
              </p>
              
              {!palmImage ? (
                <div className="flex flex-col items-center gap-3">
                  <Button
                    type="button"
                    onClick={() => document.getElementById('palm-image-input')?.click()}
                    variant="primary"
                    className="gap-2"
                  >
                    ✋ Tải ảnh lòng bàn tay
                  </Button>
                  <input
                    id="palm-image-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <p className="text-xs text-text-muted text-center max-w-xs">
                    Có thể chụp ảnh trực tiếp bằng camera hoặc chọn ảnh từ thư viện
                  </p>
                </div>
              ) : isGenerating ? (
                <div className="py-8 flex flex-col items-center gap-4">
                  <div className="w-48 h-48 relative rounded-[var(--radius-md)] overflow-hidden border-2 border-primary/50 animate-pulse">
                    <img src={palmImage} alt="Palm" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-primary/20 flex flex-col items-center justify-center gap-2">
                      <Sparkles className="w-8 h-8 text-primary animate-spin" />
                    </div>
                  </div>
                  <p className="text-text font-medium text-sm animate-pulse">AI đang phân tích các đường chỉ tay...</p>
                  <p className="text-text-muted text-xs">Quá trình này mất khoảng vài giây</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-48 h-48 relative rounded-[var(--radius-md)] overflow-hidden border border-border">
                    <img src={palmImage} alt="Palm" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setPalmImage(null)}
                      className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors cursor-pointer"
                      title="Chọn ảnh khác"
                    >
                      ×
                    </button>
                  </div>
                  <Button 
                    onClick={() => generateReading('palm', { image_base64: palmImage, image: palmImage, mime_type: 'image/jpeg' })} 
                    isLoading={isGenerating} 
                    variant="primary"
                  >
                    Xem kết quả luận giải ✨
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </div>

      {/* History Area */}
      {readings.filter(r => r.type === activeTab).length > 0 && (
        <div className="pt-8 space-y-4">
          <h2 className="font-heading text-xl font-bold text-text border-b border-border pb-2">
            Lịch sử luận giải {activeTab === 'numerology' ? 'Thần số học' : activeTab === 'zodiac' ? 'Cung hoàng đạo' : activeTab === 'tarot' ? 'Tarot' : 'Chỉ tay'}
          </h2>
          <div className="grid grid-cols-1 gap-6">
            {readings.filter(r => r.type === activeTab).map((reading) => (
              <ReadingCard key={reading.id} reading={reading} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
