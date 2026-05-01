import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { avatarFor, type Gender } from '@/lib/avatar';

interface Props {
  size?: number;
  onChange?: (url: string) => void;
}

const AvatarUploader = ({ size = 80, onChange }: Props) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  if (!user) return null;

  const displayName =
    (user.user_metadata?.display_name as string | undefined) ||
    user.email?.split('@')[0] ||
    'Invité';
  const gender = (user.user_metadata?.gender as Gender | undefined) ?? 'unspecified';
  const fallback = (user.user_metadata?.avatar_url as string | undefined) || avatarFor(displayName, gender);
  const current = preview ?? fallback;

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) return toast.error('Image trop lourde (5 Mo max)');
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const upload = await supabase.storage.from('avatars').upload(path, file, { upsert: false });
      if (upload.error) throw upload.error;
      const url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;

      // Update auth metadata + profile row
      await supabase.auth.updateUser({ data: { avatar_url: url } });
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);

      setPreview(url);
      onChange?.(url);
      toast.success('Photo de profil mise à jour');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload impossible');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <img
        src={current}
        alt={displayName}
        className="rounded-full object-cover bg-primary/10"
        style={{ width: size, height: size }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label="Changer la photo de profil"
        className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg disabled:opacity-60"
      >
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
};

export default AvatarUploader;
