import Link from 'next/link';

export default function LegalNotice() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      {/* Simplified Header */}
      <header className="flex items-center justify-between p-4 bg-gray-800">
        <Link href="/" className="text-xl font-bold hover:text-green-400">Adapt2Life</Link>
        <div className="text-gray-400">Legal Notice</div>
      </header>

      <main className="flex-grow p-8 bg-gray-900 text-gray-200">
        <div className="max-w-4xl mx-auto bg-gray-800 p-8 rounded-lg shadow-lg">

          <header className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-white">Legal Notice</h1>
            <p className="text-sm mt-2">Last Updated: [Date]</p>
          </header>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Website Publisher Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="font-semibold">Company Name:</span> [Your Company Name, e.g., Adapt2Life Inc.]
              </li>
              <li>
                <span className="font-semibold">Legal Form:</span> [e.g., Corporation or your name if a sole proprietorship]
              </li>
              <li>
                <span className="font-semibold">Registered Office Address:</span> [Your address, e.g., 123 Main Street, Montreal, QC H2Y 3Y4]
              </li>
              <li>
                <span className="font-semibold">Email Address:</span> [Your contact email address]
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Publication Director</h2>
            <p className="mb-2">[Your name or the name of the person responsible.]</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Hosting Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="font-semibold">Host Name:</span> [Host name, e.g., Vercel Inc.]
              </li>
              <li>
                <span className="font-semibold">Host Address:</span> [Host's registered office address]
              </li>
              <li>
                <span className="font-semibold">Phone Number:</span> [Host's phone number, if applicable]
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Intellectual Property</h2>
            <p className="mb-2">
              All content on this website, including graphics, images, texts, videos, animations, sounds, logos, and icons, as well as their formatting, are the exclusive property of [Your Company Name], with the exception of trademarks, logos, or content belonging to other partner companies or authors.
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