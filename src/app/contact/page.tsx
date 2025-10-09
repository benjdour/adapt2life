'use client'; // Important pour utiliser useState

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react'; // Import de useState

export default function ContactPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // État pour gérer l'ouverture du menu mobile

  // Gérer la soumission du formulaire (pour l'instant, juste une alerte)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Your message has been sent! We will get back to you shortly.');
    // Ici, vous intégreriez la logique d'envoi du formulaire à un backend ou à un service tiers (ex: Formspree, Resend, etc.)
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      {/* Header (avec gestion du menu mobile) */}
      <header className="flex items-center justify-between p-4 bg-gray-800">
        <div className="flex items-center">
          <Image src="/logo.png" alt="Adapt2Life Logo" width={40} height={40} className="mr-2" />
          <span className="text-xl font-bold">Adapt2Life</span>
        </div>
        
        {/* Bouton Hamburger pour mobile */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-white focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
          </svg>
        </button>

        {/* Menu de navigation pour desktop */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="hover:text-green-400">Home</Link>
          <Link href="/features" className="hover:text-green-400">Features</Link>
          <Link href="/how-it-works" className="hover:text-green-400">How It Works</Link>
          <Link href="/contact" className="hover:text-green-400">Contact</Link>
          <Link href="/signup" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-md hover:from-blue-600 hover:to-green-600">
            Sign Up
          </Link>
        </nav>
      </header>
      
      {/* Menu mobile qui apparaît quand le bouton est cliqué */}
      {isMenuOpen && (
        <nav className="md:hidden flex flex-col items-center w-full p-4 bg-gray-800 space-y-4">
          <Link href="/" className="hover:text-green-400">Home</Link>
          <Link href="/features" className="hover:text-green-400">Features</Link>
          <Link href="/how-it-works" className="hover:text-green-400">How It Works</Link>
          <Link href="/contact" className="hover:text-green-400">Contact</Link>
          <Link href="/signup" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-md hover:from-blue-600 hover:to-green-600">
            Sign Up
          </Link>
        </nav>
      )}

      {/* Hero Section for Contact */}
      <section className="bg-gradient-to-br from-blue-700 to-green-700 py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-5xl font-extrabold mb-4">Contact Us</h1>
          <p className="text-xl text-gray-200">
            Have questions or need support? We&apos;re here to help you get the most out of Adapt2Life.
          </p>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-8 text-center text-green-400">Send us a message</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-lg font-medium text-gray-200 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-lg font-medium text-gray-200 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />
            </div>
            <div>
              <label htmlFor="subject" className="block text-lg font-medium text-gray-200 mb-2">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-lg font-medium text-gray-200 mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full px-8 py-4 bg-orange-500 text-white font-semibold rounded-md hover:bg-orange-600 transition duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* Other Contact Info (Optional) */}
      <section className="py-16 px-4 bg-gray-800 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-8 text-blue-400">Other Ways to Connect</h2>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 text-lg">
            <div className="flex items-center space-x-3">
              <i className="fas fa-envelope text-orange-400 text-2xl"></i>
              <a href="mailto:support@adapt2life.com" className="text-gray-200 hover:text-green-400">
                support@adapt2life.com
              </a>
            </div>
            {/* Si vous avez un numéro de téléphone */}
            {/* <div className="flex items-center space-x-3">
              <i className="fas fa-phone text-orange-400 text-2xl"></i>
              <a href="tel:+1234567890" className="text-gray-200 hover:text-green-400">
                +1 (234) 567-890
              </a>
            </div> */}
            <div className="flex items-center space-x-3">
              <i className="fas fa-map-marker-alt text-orange-400 text-2xl"></i>
              <span className="text-gray-200">115 rue Jean Lefevre, La Malbaie, QC, G5A 1V3, Canada</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer (Matches Homepage Footer) */}
      <footer className="bg-gray-800 p-8 text-gray-400 flex flex-col md:flex-row justify-between items-center md:items-start">
        <div className="mb-6 md:mb-0 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start mb-2">
            <Image src="/logo.png" alt="Adapt2Life Logo" width={30} height={30} className="mr-2" />
            <span className="text-lg font-bold text-white">Adapt2Life</span>
          </div>
          <p className="text-sm">Your AI trainer for a balanced life.</p>
        </div>

        <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-12 text-center md:text-left">
          <div>
            <h3 className="font-semibold text-white mb-2">Navigation</h3>
            <ul>
              <li><Link href="/" className="hover:text-green-400">Home</Link></li>
              <li><Link href="/features" className="hover:text-green-400">Features</Link></li>
              <li><Link href="/contact" className="hover:text-green-400">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">Legal Info</h3>
            <ul>
              <li><Link href="/legal-notice" className="hover:text-green-400">Legal Notice</Link></li>
              <li><Link href="/terms-of-use" className="hover:text-green-400">Terms of Use</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-green-400">Privacy Policy</Link></li>
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h3 className="font-semibold text-white mb-2">Follow Us</h3>
            <div className="flex space-x-4 justify-center md:justify-start">
              <Link href="#" className="hover:text-green-400"><i className="fab fa-instagram"></i></Link>
              <Link href="#" className="hover:text-green-400"><i className="fab fa-twitter"></i></Link>
              <Link href="#" className="hover:text-green-400"><i className="fab fa-linkedin"></i></Link>
            </div>
          </div>
        </div>

        <div className="mt-8 md:mt-0 text-center md:text-right w-full md:w-auto">
          <p className="text-sm">&copy; 2025 Adapt2Life. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}