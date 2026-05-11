import QRCode from "qrcode";

export async function generateQRCodeBuffer(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    errorCorrectionLevel: "H",
    type: "png",
    width: 512,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });
}
