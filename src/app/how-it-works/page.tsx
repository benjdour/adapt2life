'use client'; // Important pour utiliser useState

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react'; // Import de useState

export default function HowItWorksPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // État pour gérer l'ouverture du menu mobile

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

      {/* Hero Section for How It Works */}
      <section className="bg-gradient-to-br from-blue-700 to-green-700 py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-5xl font-extrabold mb-4">How Adapt2Life Works</h1>
          <p className="text-xl text-gray-200">
            Achieve your fitness goals with a personalized AI coach that understands your body and adapts to your life.
          </p>
        </div>
      </section>

      {/* Step-by-Step Guide */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          {/* Step 1 */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
            <div className="md:w-1/2">
              <span className="text-sm font-semibold text-green-400 uppercase">Step 1</span>
              <h2 className="text-4xl font-bold mb-4">Connect Your Garmin</h2>
              <p className="text-lg text-gray-300 mb-4">
                Seamlessly link your Garmin account to Adapt2Life. This secure connection allows our AI to access your vital data: heart rate, sleep patterns, stress levels, Body Battery, and past activities.
              </p>
              <ul className="list-disc list-inside text-gray-400 space-y-2">
                <li>Secure and private data synchronization.</li>
                <li>Comprehensive overview of your physiological metrics.</li>
                <li>Foundation for intelligent training recommendations.</li>
              </ul>
            </div>
            <div className="md:w-1/2 flex justify-center">
              {/* Image Placeholder */}
              <Image src="/how-it-works-1.jpeg" alt="Connect Garmin" width={500} height={300} className="rounded-lg shadow-lg" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-8 mb-16">
            <div className="md:w-1/2">
              <span className="text-sm font-semibold text-blue-400 uppercase">Step 2</span>
              <h2 className="text-4xl font-bold mb-4">AI Analysis & Personalization</h2>
              <p className="text-lg text-gray-300 mb-4">
                Our advanced AI engine processes your Garmin data, learning your unique physiological responses, recovery needs, and performance trends. It&apos;s like having a sports scientist dedicated to you.
              </p>
              <ul className="list-disc list-inside text-gray-400 space-y-2">
                <li>Real-time assessment of your readiness to train.</li>
                <li>Identification of strengths and areas for improvement.</li>
                <li>Personalized training zones and intensity recommendations.</li>
              </ul>
            </div>
            <div className="md:w-1/2 flex justify-center">
              {/* Image Placeholder */}
              <Image src="/how-it-works-2.jpeg" alt="AI Analysis" width={500} height={300} className="rounded-lg shadow-lg" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
            <div className="md:w-1/2">
              <span className="text-sm font-semibold text-orange-400 uppercase">Step 3</span>
              <h2 className="text-4xl font-bold mb-4">Receive Your Adaptive Plan</h2>
              <p className="text-lg text-gray-300 mb-4">
                Based on the AI&apos;s insights, you receive a dynamic training plan. This plan isn&apos;t static; it adapts daily, even hourly, to your recovery, energy levels, and any new inputs from your Garmin device.
              </p>
              <ul className="list-disc list-inside text-gray-400 space-y-2">
                <li>Daily workout suggestions perfectly tailored to your current state.</li>
                <li>Adjustments for unexpected changes in your day.</li>
                <li>Guidance to prevent injury and optimize performance.</li>
              </ul>
            </div>
            <div className="md:w-1/2 flex justify-center">
              {/* Image Placeholder */}
              <Image src="/how-it-works-3.jpeg" alt="Adaptive Plan" width={500} height={300} className="rounded-lg shadow-lg" />
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-8">
            <div className="md:w-1/2">
              <span className="text-sm font-semibold text-green-400 uppercase">Step 4</span>
              <h2 className="text-4xl font-bold mb-4">Chat with Your AI Coach</h2>
              <p className="text-lg text-gray-300 mb-4">
                Have direct conversations with your AI coach. Ask questions, provide feedback on your workouts, or discuss your goals. The coach learns from every interaction, becoming even more effective over time.
              </p>
              <ul className="list-disc list-inside text-gray-400 space-y-2">
                <li>Interactive Q&A for all your training queries.</li>
                <li>Feedback loop to continuously refine your plan.</li>
                <li>Motivation and support tailored to your needs.</li>
              </ul>
            </div>
            <div className="md:w-1/2 flex justify-center">
              {/* Image Placeholder */}
              <Image src="/how-it-works-4.jpeg" alt="Chat with AI Coach" width={500} height={300} className="rounded-lg shadow-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="bg-gradient-to-br from-blue-600 to-green-600 py-16 text-center">
        <h2 className="text-4xl font-bold mb-4">Experience Smarter Training</h2>
        <p className="text-xl text-gray-200 mb-8">
          Adapt2Life is your partner in achieving peak physical condition with intelligence and flexibility.
        </p>
        <Link href="/signup" className="px-8 py-4 bg-orange-500 text-white font-semibold rounded-md hover:bg-orange-600 transition duration-300">
          Start Your Journey
        </Link>
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