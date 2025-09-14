import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import {
  faInstagram,
  faFacebookF,
  faLinkedinIn,
  faTwitter
} from "@fortawesome/free-brands-svg-icons";
import {
  faMapMarkerAlt,
  faPhone,
  faEnvelope,
  faShieldAlt,
  faFileMedical,
  faUserMd,
  faHandshake
} from "@fortawesome/free-solid-svg-icons";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Company Info & Logo */}
          <div>
            <div className="flex items-center mb-3">
              <span className="text-xl font-bold text-blue-400">HealthChain</span>
            </div>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Secure, decentralized healthcare management powered by blockchain technology.
            </p>
            <div className="flex space-x-3">
              <a href="#" target="_blank" rel="noopener noreferrer" className="bg-gray-800 w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">
                <FontAwesomeIcon icon={faFacebookF} size="xs" />
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="bg-gray-800 w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">
                <FontAwesomeIcon icon={faInstagram} size="xs" />
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="bg-gray-800 w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">
                <FontAwesomeIcon icon={faLinkedinIn} size="xs" />
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="bg-gray-800 w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">
                <FontAwesomeIcon icon={faTwitter} size="xs" />
              </a>
            </div>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="text-md font-semibold mb-3 text-white flex items-center">
              <FontAwesomeIcon icon={faFileMedical} className="mr-2 text-blue-400" />
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-xs text-gray-400 hover:text-blue-400 transition-colors">About Us</a></li>
              <li><Link to="/services" className="text-xs text-gray-400 hover:text-blue-400 transition-colors">Services</Link></li>
              <li><a href="#" className="text-xs text-gray-400 hover:text-blue-400 transition-colors">FAQs</a></li>
              <li><a href="#" className="text-xs text-gray-400 hover:text-blue-400 transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-md font-semibold mb-3 text-white flex items-center">
              <FontAwesomeIcon icon={faShieldAlt} className="mr-2 text-blue-400" />
              Support
            </h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-xs text-gray-400 hover:text-blue-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-xs text-gray-400 hover:text-blue-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-xs text-gray-400 hover:text-blue-400 transition-colors">Security</a></li>
              <li><a href="#" className="text-xs text-gray-400 hover:text-blue-400 transition-colors">Partners</a></li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="text-md font-semibold mb-3 text-white flex items-center">
              <FontAwesomeIcon icon={faUserMd} className="mr-2 text-blue-400" />
              Get in Touch
            </h3>
            <div className="space-y-2">
              <p className="text-xs text-gray-400 flex items-center">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-blue-400" />
                <span>AECS Layout, Bangalore</span>
              </p>
              <p className="text-xs text-gray-400 flex items-center">
                <FontAwesomeIcon icon={faPhone} className="mr-2 text-blue-400" />
                <span>+91 123456789</span>
              </p>
              <p className="text-xs text-gray-400 flex items-center">
                <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-blue-400" />
                <span>info@healthchain.com</span>
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-6 pt-4 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} HealthChain Protocol. All rights reserved.
          </p>
          <div className="flex items-center mt-2 md:mt-0">
            <FontAwesomeIcon icon={faHandshake} className="text-blue-400 mr-1 text-xs" />
            <span className="text-xs text-gray-400">Building trust in healthcare</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;