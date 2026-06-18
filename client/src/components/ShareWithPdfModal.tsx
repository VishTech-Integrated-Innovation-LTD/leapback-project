// ============================================================
// Reusable share modal used by both InvoiceDetailPage
// and QuoteDetailPage.
//
// PDF attachment strategy:
//  1. "Share with PDF" button  → Web Share API (files:[])
//     Works on iOS Safari 15+, Chrome Android, Chrome/Edge desktop
//     Opens the native OS share sheet with the PDF attached.
//     User can pick WhatsApp, Mail, etc. from the OS sheet.
//
//  2. Individual channel buttons (WhatsApp / Email / X / Facebook)
//     → Fetches PDF blob → triggers browser download
//     → Opens the channel URL after a short delay
//     → Shows a mini note: "PDF downloaded — attach it manually"
//     This is the universal fallback for any browser.
// ============================================================

import { useState } from 'react';
import {
    XIcon,
    EnvelopeIcon,
    DownloadSimpleIcon,
    ShareNetworkIcon,
    SpinnerGapIcon,
} from '@phosphor-icons/react';

// ── helpers ──────────────────────────────────────────────────

const triggerBlobDownload = (blob: Blob, filename: string) => {
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href  = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};

// ── types ─────────────────────────────────────────────────────

export interface ShareModalProps {
    /** Title shown in the modal header, e.g. "Invoice #INV-001" */
    title:      string;
    /** Short ref used as the PDF filename, e.g. "INV-001" */
    ref:        string;
    /** Human-readable description for the share text */
    // description: string;
    /** Pre-filled WhatsApp / X / Facebook message */
    shareText:  string;
    /** Pre-filled email subject */
    emailSubject: string;
    /** Pre-filled email body */
    emailBody:  string;
    /** Recipient email address (pre-fills mailto: To field) */
    recipientEmail?: string;
    /** Async function that fetches and returns the PDF as a Blob */
    fetchPdfBlob: () => Promise<Blob>;
    /** Called when Send Email via system button is clicked (optional) */
    onResendSystemEmail?: () => void;
    resendPending?: boolean;
    resendSuccess?: boolean;
    onClose: () => void;
}

// ── component ────────────────────────────────────────────────

export const ShareWithPdfModal = ({
    title,
    ref: docRef,
    shareText,
    emailSubject,
    emailBody,
    recipientEmail,
    fetchPdfBlob,
    onResendSystemEmail,
    resendPending,
    resendSuccess,
    onClose,
}: ShareModalProps) => {

    const [loadingChannel, setLoadingChannel] = useState<string | null>(null);
    const [downloadNote,   setDownloadNote]   = useState<string>('');

    // ── native share with attached PDF ──────────────────────
    const handleNativeShare = async () => {
        setLoadingChannel('native');
        setDownloadNote('');
        try {
            const blob = await fetchPdfBlob();
            const file = new File([blob], `${docRef}.pdf`, { type: 'application/pdf' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title,
                    text: shareText,
                });
                onClose();
                return;
            }

            // Can share but not files (or canShare not available) — fallback to download
            triggerBlobDownload(blob, `${docRef}.pdf`);
            setDownloadNote('PDF downloaded - attach it using your device\'s share options.');
        } catch (err) {
             // Type guard to check if it's an Error object with name property
    const isErrorWithName = (error: unknown): error is { name: string } => {
        return typeof error === 'object' && error !== null && 'name' in error;
    };
    
    if (isErrorWithName(err) && err.name !== 'AbortError') {
        setDownloadNote('Could not open share sheet. PDF downloaded instead.');
    }
        } finally {
            setLoadingChannel(null);
        }
    };

    // ── per-channel share: download PDF then open channel URL ─
    const handleChannelShare = async (channel: string, channelUrl: string) => {
        setLoadingChannel(channel);
        setDownloadNote('');
        try {
            const blob = await fetchPdfBlob();
            triggerBlobDownload(blob, `${docRef}.pdf`);
            // Small delay so download starts before new tab opens
            await new Promise(r => setTimeout(r, 400));
            window.open(channelUrl, '_blank', 'noopener,noreferrer');
            setDownloadNote(`PDF downloaded - attach it in ${channel} manually.`);
        } catch {
            setDownloadNote('Could not fetch PDF. Try the Download button instead.');
        } finally {
            setLoadingChannel(null);
        }
    };

    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    const mailUrl = `mailto:${recipientEmail ?? ''}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;

    const isLoading = (ch: string) => loadingChannel === ch;
    const spinner = <SpinnerGapIcon size={15} className="animate-spin" />;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
            <div className="bg-[#0D1526] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold">Share {title}</h3>
                    <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
                        <XIcon size={18} />
                    </button>
                </div>

                {/* PDF note */}
                <p className="text-white/40 text-xs mb-5 leading-relaxed">
                    The PDF will be fetched from the server when you pick a channel.
                    On mobile, choosing <span className="text-white/60">Share with PDF</span> attaches it directly.
                    On desktop, it is downloaded first -- then attach it manually.
                </p>

                {/* Native Share (recommended on mobile) */}
                <button
                    onClick={handleNativeShare}
                    disabled={!!loadingChannel}
                    className="w-full flex items-center justify-center gap-2.5 bg-[#E8A120]/10 text-[#E8A120] border border-[#E8A120]/30 hover:border-[#E8A120]/60 px-4 py-3 rounded-xl text-sm font-semibold transition-colors mb-4 disabled:opacity-50"
                >
                    {isLoading('native') ? spinner : <ShareNetworkIcon size={16} weight="bold" />}
                    {isLoading('native') ? 'Preparing PDF...' : 'Share with PDF (Recommended)'}
                </button>

                <p className="text-white/20 text-xs text-center mb-3">-- or download PDF then share via --</p>

                {/* Channel grid */}
                <div className="grid grid-cols-2 gap-2.5">

                    {/* WhatsApp */}
                    <button
                        onClick={() => handleChannelShare('WhatsApp', waUrl)}
                        disabled={!!loadingChannel}
                        className="flex items-center gap-2.5 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 hover:border-[#25D366]/50 px-3 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {isLoading('WhatsApp') ? spinner : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                        )}
                        WhatsApp
                    </button>

                    {/* Email */}
                    <button
                        onClick={() => handleChannelShare('Email', mailUrl)}
                        disabled={!!loadingChannel}
                        className="flex items-center gap-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:border-blue-500/50 px-3 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {isLoading('Email') ? spinner : <EnvelopeIcon size={16} />}
                        Email
                    </button>

                    {/* X (Twitter) */}
                    <button
                        onClick={() => handleChannelShare('X', xUrl)}
                        disabled={!!loadingChannel}
                        className="flex items-center gap-2.5 bg-white/5 text-white/70 border border-white/10 hover:border-white/30 px-3 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {isLoading('X') ? spinner : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                        )}
                        X (Twitter)
                    </button>

                    {/* Facebook */}
                    <button
                        onClick={() => handleChannelShare('Facebook', fbUrl)}
                        disabled={!!loadingChannel}
                        className="flex items-center gap-2.5 bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/20 hover:border-[#1877F2]/50 px-3 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {isLoading('Facebook') ? spinner : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                        )}
                        Facebook
                    </button>

                </div>

                {/* Download note / feedback */}
                {downloadNote && (
                    <div className="mt-3 flex items-start gap-2 bg-[#E8A120]/8 border border-[#E8A120]/20 rounded-lg px-3 py-2.5">
                        <DownloadSimpleIcon size={14} className="text-[#E8A120] shrink-0 mt-0.5" />
                        <p className="text-xs text-[#E8A120]/80 leading-relaxed">{downloadNote}</p>
                    </div>
                )}

                {/* System email resend */}
                {onResendSystemEmail && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <button
                            onClick={() => { onResendSystemEmail(); onClose(); }}
                            disabled={resendPending}
                            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm transition-colors disabled:opacity-50
                                ${resendSuccess
                                    ? 'border-green-500/30 text-green-400'
                                    : 'border-white/10 text-white/50 hover:text-white hover:border-white/20'
                                }`}
                        >
                            <EnvelopeIcon size={15} />
                            {resendSuccess ? 'Sent!' : resendPending ? 'Sending...' : 'Send via system email (to client on file)'}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};
