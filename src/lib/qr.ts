import QRCode from "qrcode";

export const generatePropQRCode = async (propId: string): Promise<string> => {
  const url = `${window.location.origin}/props/${propId}`;
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: "H",
      margin: 1,
      color: {
        dark: "#FF7A00", // BTTF orange
        light: "#00000000", // transparent
      },
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
};
