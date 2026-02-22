import { useState } from "react";

export function usePdfModal() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [activeReimbursement, setActiveReimbursement] = useState<any>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const handleOpenPdf = async (url: string, reimbursement: any) => {
    if (!url) return;
    setLoadingPdf(true);
    try {
      const res = await fetch(
        `/api/reimbursements/signed-url?url=${encodeURIComponent(url)}`
      );
      const json = await res.json();
      if (json.signedUrl) {
        setPdfUrl(json.signedUrl);
        setActiveReimbursement(reimbursement);
      }
    } catch (e) {
      console.error("Failed to load PDF", e);
    } finally {
      setLoadingPdf(false);
    }
  };

  const closeModal = () => {
    setPdfUrl(null);
    setActiveReimbursement(null);
  };

  return { pdfUrl, activeReimbursement, loadingPdf, handleOpenPdf, closeModal };
}