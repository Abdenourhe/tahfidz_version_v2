import {
  generateQrCodeToken,
  generateQrCodeSecret,
  generateCompactQrPayload,
  generateStudentQrUrl,
  decodeAnyQrValue,
  verifyQrHmac,
  getQrDate,
} from "../src/lib/qr-code"

const schoolSlug = "al-nour"
const appUrl = "https://tahfidz-two.vercel.app"

const token = generateQrCodeToken()
const secret = generateQrCodeSecret()

console.log("Token:", token, "(", token.length, "car)")
console.log("Secret:", secret, "(", secret.length, "car)")

const compactPayload = generateCompactQrPayload(schoolSlug, token, secret)
console.log("\nPayload compact:", compactPayload)
console.log("Longueur payload:", compactPayload.length, "caractères")

const url = generateStudentQrUrl(appUrl, schoolSlug, token, secret)
console.log("\nURL QR:", url)
console.log("Longueur URL:", url.length, "caractères")

const decoded = decodeAnyQrValue(url)
console.log("\nDécodé depuis URL:", decoded)

const decodedCompact = decodeAnyQrValue(compactPayload)
console.log("Décodé depuis payload compact:", decodedCompact)

if (decoded) {
  const valid = verifyQrHmac(secret, getQrDate(), decoded.h)
  console.log("\nHMAC valide:", valid)
}
