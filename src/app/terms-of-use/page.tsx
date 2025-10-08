import Link from 'next/link';

export default function TermsOfUse() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      {/* Simplified Header */}
      <header className="flex items-center justify-between p-4 bg-gray-800">
        <Link href="/" className="text-xl font-bold hover:text-green-400">Adapt2Life</Link>
        <div className="text-gray-400">Terms of Use</div>
      </header>

      <main className="flex-grow p-8 bg-gray-900 text-gray-200">
        <div className="max-w-4xl mx-auto bg-gray-800 p-8 rounded-lg shadow-lg">

          <header className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-white">Terms of Use</h1>
            <p className="text-sm mt-2">Last Updated: 25 sptember 2025</p>
          </header>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="mb-2">
              By accessing or using the Adapt2Life application (&quot;the Service&quot;), you agree to be bound by these Terms of Use (&quot;Terms&quot;). If you disagree with any part of the terms, then you may not access the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">2. User Accounts</h2>
            <p className="mb-2">
              When you create an account, you must provide accurate and complete information. You are responsible for safeguarding your password and for any activities or actions under your password.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">3. Intellectual Property</h2>
            <p className="mb-2">
              The Service and its original content, features, and functionality are and will remain the exclusive property of Adapt2Life Inc and its licensors.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">4. User Content</h2>
            <p className="mb-2">
              You are responsible for any content you post to the Service. You grant Adapt2Life a non-exclusive, worldwide, royalty-free license to use, modify, and distribute any content you provide through the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">5. Links to Other Websites</h2>
            <p className="mb-2">
              The Service may contain links to third-party websites or services that are not owned or controlled by Adapt2Life. We have no control over and assume no responsibility for the content or privacy policies of any third-party websites.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">6. Disclaimer of Warranties</h2>
            <p className="mb-2">
              The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis. Adapt2Life makes no warranties, expressed or implied, regarding the Service. We do not warrant that the Service will be uninterrupted, secure, or error-free.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">7. Limitation of Liability</h2>
            <p className="mb-2">
              In no event shall Adapt2Life, nor its directors, employees, or partners, be liable for any indirect, incidental, special, or consequential damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">8. Governing Law</h2>
            <p className="mb-2">
              These Terms shall be governed and construed in accordance with the laws of Quebec, Canada, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">9. Changes to Terms</h2>
            <p className="mb-2">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
            </p>
          </section>

        </div>
      </main>

      {/* Simplified Footer */}
      <footer className="mt-8 p-8 text-center text-gray-500 text-sm">
        <p>&copy; 2025 Adapt2Life. All rights reserved.</p>
        <Link href="/" className="text-blue-400 hover:underline mt-1 block">Back to Home</Link>
      </footer>
    </div>
  );
}