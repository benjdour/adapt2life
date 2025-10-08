import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      {/* Header (Simplified) */}
      <header className="flex items-center justify-between p-4 bg-gray-800">
        <Link href="/" className="text-xl font-bold hover:text-green-400">Adapt2Life</Link>
        <div className="text-gray-400">Privacy Policy</div>
      </header>

      <main className="flex-grow p-8 bg-gray-900 text-gray-200">
        <div className="max-w-4xl mx-auto bg-gray-800 p-8 rounded-lg shadow-lg">
          
          <header className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-white">Adapt2Life Privacy Policy</h1>
            <p className="text-sm mt-2">Last Updated: 25 september 2025</p>
          </header>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
            <p className="mb-4">
              Welcome to Adapt2Life. We are committed to the most transparency regarding the protection of your personal information. This privacy policy explains in detail the nature, purpose, and legal basis for the processing of your personal data when you use our website and application (the &quot;Service&quot;), no matter where you are located. By accessing or using our Service, you acknowledge that you have read and agreed to the terms of this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">2. Personal Information We Collect</h2>
            <h3 className="text-xl font-semibold text-white mt-4 mb-2">2.1 Information You Provide Directly:</h3>
            <ul className="list-disc pl-5">
              <li className="mb-1">
                <span className="font-semibold">Account Data:</span> When you create an account or contact us, we collect your email address and name.
              </li>
              <li className="mb-1">
                <span className="font-semibold">Communication Data:</span> If you contact us for support or with questions, we collect the content of your communication.
              </li>
            </ul>
            <h3 className="text-xl font-semibold text-white mt-4 mb-2">2.2 Garmin Data Collected via the API:</h3>
            <p className="mb-2">When you connect your Garmin account, you authorize us to access specific categories of health and activity data to provide you with a customized workout.</p>
            <ul className="list-disc pl-5">
              <li className="mb-1">
                <span className="font-semibold">Activity Data:</span> Activity type (running, cycling, walking, etc.), start/end date and time, duration, distance, pace, calories burned, heart rate, GPS data, and altitude.
              </li>
              <li className="mb-1">
                <span className="font-semibold">Health and Wellness Data:</span> Sleep data (duration, sleep stages), stress score, heart rate variability (HRV), &quot;Body Battery&quot; score, and menstrual cycle tracking data if you have it enabled in your Garmin account.
              </li>
            </ul>
            <h3 className="text-xl font-semibold text-white mt-4 mb-2">2.3 Automatically Collected Data:</h3>
            <ul className="list-disc pl-5">
              <li className="mb-1">
                <span className="font-semibold">Technical Information:</span> Your IP address, unique device identifiers, operating system, and browser type.
              </li>
              <li className="mb-1">
                <span className="font-semibold">Usage Information:</span> The pages you visit, the frequency of your use, and the features you click on.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">3. Use of Your Personal Information</h2>
            <p className="mb-2">We use the information we collect for the following purposes:</p>
            <ul className="list-disc pl-5">
              <li className="mb-1">
                <span className="font-semibold">To Provide the Service:</span> To allow you to log in and to generate personalized workouts.
              </li>
              <li className="mb-1">
                <span className="font-semibold">For Personalization:</span> To analyze your Garmin data and create a workout plan that adapts to your fitness level.
              </li>
              <li className="mb-1">
                <span className="font-semibold">For Security:</span> To protect our Service from fraudulent activity.
              </li>
              <li className="mb-1">
                <span className="font-semibold">For Service Improvement:</span> We use anonymized data to improve the app&apos;s features.
              </li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">4. Sharing and Disclosure of Information</h2>
            <p className="mb-2">We do not sell or rent your personal information. We share it only in the following cases:</p>
            <ul className="list-disc pl-5">
              <li className="mb-1">
                <span className="font-semibold">With Garmin:</span> We only share the generated workouts so they can be synced with your Garmin Connect account.
              </li>
              <li className="mb-1">
                <span className="font-semibold">With AI Providers (via OpenRouter):</span> To generate a workout, we send <span className="font-semibold">anonymized data</span> to the AI models.
              </li>
              <li className="mb-1">
                <span className="font-semibold">With Third-Party Providers:</span> We use hosting services (Vercel, AWS) and other cloud services to maintain the Service online.
              </li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">5. International Data Transfers</h2>
            <p className="mb-2">Your data may be transferred to and stored on servers outside of your jurisdiction. We put in place adequate safeguards to protect your data.</p>
            <p className="mb-2">
              <span className="font-semibold">For users in Quebec:</span> We conduct a Privacy Impact Assessment (PIA) to ensure transfers outside the province comply with the law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">6. Your Privacy Rights</h2>
            <p className="mb-2">Your rights depend on your location.</p>
            <h3 className="text-xl font-semibold text-white mt-4 mb-2">6.1 Rights for all users:</h3>
            <ul className="list-disc pl-5">
              <li className="mb-1">
                <span className="font-semibold">Right to rectification:</span> You can ask for your inaccurate information to be corrected.
              </li>
            </ul>
            <h3 className="text-xl font-semibold text-white mt-4 mb-2">6.2 Specific Rights for EEA/UK Residents (GDPR):</h3>
            <ul className="list-disc pl-5">
              <li className="mb-1">
                <span className="font-semibold">Right to access and portability:</span> You can request a copy of your data.
              </li>
              <li className="mb-1">
                <span className="font-semibold">Right to erasure:</span> You can request the deletion of your personal data.
              </li>
              <li className="mb-1">
                <span className="font-semibold">Right to object to processing:</span> You can object to the processing of your data.
              </li>
            </ul>
            <h3 className="text-xl font-semibold text-white mt-4 mb-2">6.3 Specific Rights for Quebec Residents (Bill 64) and Canada (PIPEDA):</h3>
            <ul className="list-disc pl-5">
              <li className="mb-1">
                <span className="font-semibold">Right to data portability:</span> You can request a copy of your computerized personal information.
              </li>
              <li className="mb-1">
                <span className="font-semibold">Right to withdraw consent:</span> You can withdraw your consent at any time.
              </li>
            </ul>
            <h3 className="text-xl font-semibold text-white mt-4 mb-2">6.4 Specific Rights for California Residents (CCPA/CPRA):</h3>
            <ul className="list-disc pl-5">
              <li className="mb-1">
                <span className="font-semibold">Right to know:</span> You can request to know the categories of information we collect.
              </li>
              <li className="mb-1">
                <span className="font-semibold">Right to delete:</span> You can request the deletion of your personal information.
              </li>
              <li className="mb-1">
                <span className="font-semibold">Right to opt-out of sale:</span> You have the right to opt-out of any future sale of your data.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">7. Data Retention</h2>
            <p className="mb-2">We will retain your personal information as long as your account is active. If you delete your account, we will delete your data.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">8. Cookies and Tracking Technologies</h2>
            <p className="mb-2">We use cookies to maintain the site&apos;s proper functioning and to analyze usage anonymously. You can configure your browser to refuse cookies.</p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">9. Privacy of Minors</h2>
            <p className="mb-2">Our Service is for individuals 16 and over, and we do not knowingly collect data from individuals under 16.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">10. Contact Us</h2>
            <ul className="list-disc pl-5">
              <li className="mb-1">
                <span className="font-semibold">Responsible for data protection:</span> Benjamin Dour.
              </li>
              <li className="mb-1">
                <span className="font-semibold">Contact:</span> For questions or to exercise your rights, please contact us at: <span className="font-semibold">contact@adapt2life.app</span>.
              </li>
            </ul>
          </section>

        </div>
      </main>

      {/* Footer (Simplified for Privacy Policy page) */}
      <footer className="mt-8 p-8 text-center text-gray-500 text-sm">
        <p>&copy; 2025 Adapt2Life. All rights reserved.</p>
        <Link href="/" className="text-blue-400 hover:underline mt-1 block">Back to Home</Link>
      </footer>
    </div>
  );
}