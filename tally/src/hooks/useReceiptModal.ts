export function useReceiptModal() {
  const handleOpenReceipt = async (receiptUrl: string | null) => {
    if (!receiptUrl) return;
    try {
      const res = await fetch(
        `/api/reimbursements/signed-url?url=${encodeURIComponent(receiptUrl)}`
      );
      const json = await res.json();
      if (json.signedUrl) window.open(json.signedUrl, "_blank");
    } catch (e) {
      console.error("Failed to load receipt", e);
    }
  };
  return { handleOpenReceipt };
}