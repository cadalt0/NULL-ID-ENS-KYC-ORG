# Self Protocol Website - Create Your Null ID

A Next.js-based website for Self Protocol identity verification with a beautiful, modern UI.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd website
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The website will be available at `http://localhost:3000`

## 🎯 Features

- **Privacy-First Identity Verification** using Self Protocol
- **QR Code Integration** for mobile app scanning
- **Modern React UI** with TypeScript
- **Responsive Design** for all devices
- **Zero-Knowledge Proofs** for privacy protection

## 🔧 What It Does

1. **Displays QR Code** for identity verification
2. **Guides Users** through the verification process
3. **Verifies Identity** using passport/ID card
4. **Shows Success** when verification is complete
5. **Maintains Privacy** with selective disclosure

## 📱 Verification Process

1. User visits the website
2. QR code is displayed for scanning
3. User opens Self app on their phone
4. User scans QR code with Self app
5. User scans their passport/ID with phone's NFC
6. Identity is verified while preserving privacy
7. User gets access to verified content

## 🛠️ Technical Stack

- **Next.js 14** with App Router
- **React 18** with TypeScript
- **Self Protocol SDK** for identity verification
- **Modern CSS** with gradients and animations
- **Responsive Design** for mobile and desktop

## 📋 Verification Attributes

The website verifies:
- ✅ **Age** (18+ required)
- ✅ **Nationality** (country of citizenship)
- ✅ **Gender** (as stated in document)
- ✅ **Name** (full name from document)
- ✅ **Date of Birth** (birthdate verification)
- ✅ **OFAC Check** (sanctions list verification)
- ✅ **Country Exclusion** (blocks restricted countries)

## 🔒 Privacy Features

- **Zero-Knowledge Proofs** - No personal data stored
- **Selective Disclosure** - Only share what's needed
- **Privacy-First** - User controls their data
- **Secure Verification** - Real government documents

## 🎨 UI Features

- **Modern Design** with gradients and shadows
- **Responsive Layout** for all screen sizes
- **Step-by-Step Instructions** for users
- **Error Handling** with user-friendly messages
- **Loading States** for better UX
- **Success Animation** when verified

## 📱 Mobile App Integration

The website integrates with the Self mobile app:
- **Android**: Google Play Store
- **iOS**: App Store (via download page)
- **NFC Support**: For passport/ID scanning
- **Real-time Verification**: Instant results

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🔧 Configuration

The verification is configured in `src/app/page.tsx`:

```typescript
const app = new SelfAppBuilder({
  version: 2,
  appName: "Create Your Null ID",
  scope: "null-id-verification",
  endpoint: "https://playground.self.xyz/api/verify",
  endpointType: "staging_https",
  disclosures: {
    minimumAge: 18,
    nationality: true,
    gender: true,
    name: true,
    date_of_birth: true,
    ofac: true,
    excludedCountries: ["IRN", "PRK", "RUS", "SYR"]
  }
}).build();
```

## 📚 Documentation

- [Self Protocol Docs](https://docs.self.xyz/)
- [QRCode SDK Guide](https://docs.self.xyz/frontend-integration/qrcode-sdk)
- [API Reference](https://docs.self.xyz/frontend-integration/qrcode-sdk-api-reference)

## 🎯 Use Cases

Perfect for:
- **Age Verification** websites
- **KYC/AML Compliance** systems
- **Identity Verification** services
- **Privacy-First** applications
- **Web3** identity solutions

## 🔗 Links

- **Self Protocol**: https://self.xyz/
- **Documentation**: https://docs.self.xyz/
- **Mobile App**: https://theselfapp.com/download/
