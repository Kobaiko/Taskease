import React, { useState, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Slight delay before showing the banner
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    } else if (consent === 'accepted') {
      window.gtag?.('consent', 'update', {
        'analytics_storage': 'granted'
      });
    }
  }, []);

  const handleInteraction = (accepted: boolean) => {
    setIsExiting(true);
    localStorage.setItem('cookieConsent', accepted ? 'accepted' : 'declined');

    if (accepted) {
      window.gtag?.('consent', 'update', {
        'analytics_storage': 'granted'
      });
    }

    setTimeout(() => {
      setIsVisible(false);
      setShowDetails(false);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Full screen overlay only when showing details */}
      {showDetails && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          onClick={() => setShowDetails(false)}
        />
      )}

      {/* Cookie banner */}
      <div
        className={`fixed z-50 transition-all duration-300 ${
          showDetails 
            ? 'inset-0 flex items-center justify-center p-4' 
            : 'left-4 bottom-4 max-w-sm'
        } ${isExiting ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
      >
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full ${
          !showDetails && 'max-w-sm'
        }`}>
          <div className="p-4">
            {!showDetails ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl" role="img" aria-label="cookie">🍪</span>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Cookie Settings</h3>
                  </div>
                  <button
                    onClick={() => handleInteraction(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={16} />
                  </button>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                  We use cookies to enhance your experience and improve our services.
                </p>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleInteraction(true)}
                      className="flex-1 py-1.5 px-3 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Accept All
                    </button>
                    <button
                      onClick={() => handleInteraction(false)}
                      className="flex-1 py-1.5 px-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                  <button
                    onClick={() => setShowDetails(true)}
                    className="w-full flex items-center justify-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Learn More
                    <ChevronRight size={12} />
                  </button>
                </div>
              </>
            ) : (
              <div className="max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cookie Policy</h3>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="prose dark:prose-invert max-w-none text-sm">
                  {/* Policy content remains the same */}
                  <p className="text-gray-600 dark:text-gray-300">
                    We value your privacy and want to be transparent about how we use cookies and similar technologies on our website. This policy explains what cookies are, how we use them, and what choices you have regarding their use.
                  </p>

                  <h4 className="font-semibold text-gray-900 dark:text-white mt-4 mb-2">What Are Cookies?</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by:
                  </p>
                  <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300">
                    <li>Remembering your preferences and settings</li>
                    <li>Understanding how you use our website</li>
                    <li>Ensuring the security of your browsing session</li>
                    <li>Enabling essential website functions</li>
                  </ul>

                  <h4 className="font-semibold text-gray-900 dark:text-white mt-4 mb-2">Types of Cookies We Use</h4>
                  
                  <h5 className="font-medium text-gray-900 dark:text-white mt-3 mb-2">1. Essential Cookies</h5>
                  <p className="text-gray-600 dark:text-gray-300">
                    These cookies are necessary for the website to function properly. They enable core features such as:
                  </p>
                  <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300">
                    <li>User authentication</li>
                    <li>Shopping cart functionality</li>
                    <li>Security measures</li>
                    <li>Basic site navigation</li>
                  </ul>

                  <h5 className="font-medium text-gray-900 dark:text-white mt-3 mb-2">2. Analytics Cookies</h5>
                  <p className="text-gray-600 dark:text-gray-300">
                    These cookies help us understand how visitors interact with our website by:
                  </p>
                  <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300">
                    <li>Collecting anonymous statistical data</li>
                    <li>Analyzing user behavior patterns</li>
                    <li>Measuring website performance</li>
                    <li>Identifying areas for improvement</li>
                  </ul>

                  <h4 className="font-semibold text-gray-900 dark:text-white mt-4 mb-2">Contact Us</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    If you have questions about our Cookie Policy or your privacy rights, please contact our Data Protection Officer at:
                  </p>
                  <ul className="list-none pl-5 text-gray-600 dark:text-gray-300">
                    <li>Email: hello@gettaskease.com</li>
                    <li>Phone: +972544430825</li>
                    <li>Address: 7 Amsterdam st., Tel Aviv, Israel</li>
                  </ul>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                    Last updated: November 5, 2024
                  </p>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleInteraction(true)}
                    className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Accept All
                  </button>
                  <button
                    onClick={() => handleInteraction(false)}
                    className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}