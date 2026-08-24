import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import axiosInstance from '#shared/api';
import CustomToast from '#shared/toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/components/dialog';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: (key: string) => string;
}

/* ─── 건의함 모달 ─── */
const FeedbackDialog: React.FC<FeedbackDialogProps> = ({ open, onOpenChange, t }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setContent('');
      setSubmitted(false);
    }
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      await axiosInstance.post('/feedback', { content: content.trim() });
      setSubmitted(true);
      setContent('');
      CustomToast.success(t('소중한 의견 감사합니다!'));
    } catch {
      CustomToast.error(t('전송에 실패했습니다. 다시 시도해주세요.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="size-4 text-primary" />
            {t('건의사항 / 피드백')}
          </DialogTitle>
          <DialogDescription>
            {t('불편한 점이나 개선 아이디어를 자유롭게 남겨주세요.')}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <p className="text-sm text-muted-foreground">{t('소중한 의견 감사합니다!')}</p>
        ) : (
          <>
            <textarea
              value={content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
              placeholder={t('불편한 점이나 개선 아이디어를 자유롭게 남겨주세요.')}
              rows={4}
              className="w-full resize-none rounded-sm border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />

            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || isSubmitting}
                className="cursor-pointer rounded-xl border-none bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? t('전송 중...') : t('전송')}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;
