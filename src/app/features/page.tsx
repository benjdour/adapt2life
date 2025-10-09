'use client'; // Important pour utiliser useState

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react'; // Import de useState

export default function FeaturesPage() {
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

      {/* Hero Section for Features */}
      <section className="bg-gradient-to-br from-blue-700 to-green-700 py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-5xl font-extrabold mb-4">Discover the Unique Features</h1>
          <p className="text-xl text-gray-200">
            Adapt2Life revolutionizes your training with Artificial Intelligence that adapts to your life, not the other way around.
          </p>
        </div>
      </section>

      {/* Section 1: Real-time Adaptive Training */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="md:w-1/2">
            <h2 className="text-4xl font-bold mb-4 text-green-400">Real-time Adaptive Training</h2>
            <p className="text-lg text-gray-300 mb-4">
              Our AI analyzes your live Garmin data (heart rate, sleep, stress, Body Battery) to adjust your training plan second by second. No more rigid plans, welcome to maximum flexibility.
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2">
              <li>Dynamic adjustments based on fatigue and recovery.</li>
              <li>Optimized training load to avoid overtraining.</li>
              <li>Suggestions for alternative exercises based on your constraints.</li>
            </ul>
          </div>
          <div className="md:w-1/2 flex justify-center">
            {/* Image Placeholder - Ensure this image is in public/ */}
            <Image src="/feature-adaptive.jpeg" alt="Adaptive Training" width={500} height={300} className="rounded-lg shadow-lg" />
          </div>
        </div>
      </section>

      {/* Section 2: Deep Integration with Garmin */}
      <section className="py-16 px-4 bg-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row-reverse items-center justify-between gap-8">
          <div className="md:w-1/2">
            <h2 className="text-4xl font-bold mb-4 text-blue-400">Deep Integration with Garmin</h2>
            <p className="text-lg text-gray-300 mb-4">
              Connect your Garmin account for precise analysis of all your health and performance metrics. Adapt2Life leverages the best of your devices.
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2">
              <li>Automatic synchronization of activities and vital data.</li>
              <li>Consideration of your VO2 Max, training status, and acute/chronic load.</li>
              <li>Visualization of your progress with clear and personalized graphs.</li>
            </ul>
          </div>
          <div className="md:w-1/2 flex justify-center">
            {/* Image Placeholder - Ensure this image is in public/ */}
            <Image src="/feature-garmin.jpeg" alt="Garmin Integration" width={500} height={300} className="rounded-lg shadow-lg" />
          </div>
        </div>
      </section>

      {/* Section 3: Conversational and Personalized Coaching */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="md:w-1/2">
            <h2 className="text-4xl font-bold mb-4 text-orange-400">Conversational and Personalized Coaching</h2>
            <p className="text-lg text-gray-300 mb-4">
              Communicate with your AI coach as you would with a human coach. Express your preferences, pains, mindset, and get relevant advice.
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2">
              <li>Intelligent and contextual answers to all your questions.</li>
              <li>Adaptation of coaching tone and style to your personality.</li>
              <li>Goal setting and tracking with continuous support.</li>
            </ul>
          </div>
          <div className="md:w-1/2 flex justify-center">
            {/* Image Placeholder - Ensure this image is in public/ */}
            <Image src="/feature-coach.jpeg" alt="Conversational Coaching" width={500} height={300} className="rounded-lg shadow-lg" />
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="bg-gradient-to-br from-blue-600 to-green-600 py-16 text-center">
        <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Training?</h2>
        <p className="text-xl text-gray-200 mb-8">
          Join Adapt2Life and discover a new way to achieve your fitness goals.
        </p>
        <Link href="/signup" className="px-8 py-4 bg-orange-500 text-white font-semibold rounded-md hover:bg-orange-600 transition duration-300">
          Get Started Now
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