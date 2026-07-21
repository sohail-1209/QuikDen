import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usersAPI, uploadAPI } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/compressImage';
import { Button, Input, Textarea, Avatar, Modal } from '../components/ui';

const SettingsPage = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', bio: user?.bio || '' });
  const [passForm, setPassForm] = useState({ newPassword: '' });
  const [showPassConfirm, setShowPassConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [uploading, setUploading] = useState(false);

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: () => usersAPI.updateProfile(form),
    onSuccess: ({ data }) => {
      updateUser(data.data);
      toast.success(t('profileUpdated') || 'Profile updated successfully');
    },
    onError: () => toast.error(t('failedToUpdateProfile') || 'Failed to update profile'),
  });

  const { mutate: updatePassword, isPending: isPassPending } = useMutation({
    mutationFn: () => usersAPI.changePassword(passForm),
    onSuccess: () => {
      setPassForm({ newPassword: '' });
      toast.success(t('passwordUpdated') || 'Password updated successfully');
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || t('somethingWrong') || 'Something went wrong';
      toast.error(msg);
    },
  });

  const handlePassUpdateClick = () => {
    if (!passForm.newPassword) return;
    setConfirmText('');
    setShowPassConfirm(true);
  };

  const handlePhotoUpload = async (e) => {
    const original = e.target.files?.[0];
    if (!original) return;
    setUploading(true);
    try {
      const { file } = await compressImage(original, { maxWidth: 500, maxHeight: 500, quality: 0.8 });
      const fd = new FormData();
      fd.append('photo', file);
      const { data } = await uploadAPI.profilePhoto(fd);
      updateUser({ profileImage: data.data.url });
      toast.success(t('photoUpdated') || 'Photo updated');
    } catch { 
      toast.error(t('uploadFailed') || 'Upload failed'); 
    } finally { 
      setUploading(false); 
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 sm:space-y-6">
      <h1 className="section-title">{t('settings') || 'Settings'}</h1>

      {/* Photo Upload Section */}
      <div className="card p-4 sm:p-6 flex items-center gap-4 sm:gap-5">
        <div className="relative flex-shrink-0">
          <Avatar src={user?.profileImage} name={user?.name} size="xl" />
          <label className="absolute bottom-0 right-0 bg-primary-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-primary-700 transition-colors">
            {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera size={14} />}
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </label>
        </div>
        <div>
          <h2 className="font-semibold text-surface-900">{t('profilePhoto') || 'Profile Photo'}</h2>
          <p className="text-surface-500 text-sm">{t('updateProfilePhoto') || 'Update your profile picture here.'}</p>
        </div>
      </div>

      {/* Edit Information Form */}
      <div className="card p-4 sm:p-6 space-y-4">
        <h3 className="font-semibold text-surface-900">{t('editInformation') || 'Edit Information'}</h3>
        <Input label={t('fullName') || 'Full Name'} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label={t('phone') || 'Phone'} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} type="tel" />
        <Textarea label={t('bio') || 'Bio'} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder={t('tellAbout') || 'Tell us about yourself'} rows={3} />
        <Button variant="primary" size="md" loading={isPending} onClick={() => updateProfile()}>{t('saveChanges') || 'Save Changes'}</Button>
      </div>

      {/* Change Password Form */}
      <div className="card p-4 sm:p-6 space-y-4">
        <h3 className="font-semibold text-surface-900">{t('changePassword') || 'Change Password'}</h3>
        <Input label={t('newPassword') || 'New Password'} value={passForm.newPassword} onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })} type="password" />
        <Button variant="primary" size="md" onClick={handlePassUpdateClick} disabled={!passForm.newPassword}>{t('updatePassword') || 'Update Password'}</Button>
      </div>

      {/* Password Confirmation Modal */}
      <Modal isOpen={showPassConfirm} onClose={() => setShowPassConfirm(false)} title={t('confirmPasswordChange') || 'Confirm Password Change'}>
        <p className="text-sm text-surface-600 mb-4">{t('typeChangeToConfirm') || 'Please type'} <strong>CHANGE</strong> {t('toConfirm') || 'to confirm.'}</p>
        <Input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="CHANGE" />
        <Button 
          variant="primary" 
          className="w-full mt-4" 
          disabled={confirmText !== 'CHANGE'}
          loading={isPassPending}
          onClick={() => {
            updatePassword();
            setShowPassConfirm(false);
          }}
        >
          {t('confirm') || 'Confirm'}
        </Button>
      </Modal>
    </div>
  );
};

export default SettingsPage;
