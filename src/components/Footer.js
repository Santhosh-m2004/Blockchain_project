//Footer.js
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";

import {
  faInstagram,
  faFacebookF,
  faLinkedinIn,
} from "@fortawesome/free-brands-svg-icons";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-tr from-gray-900 to-black text-white px-8 py-12 shadow-inner mt-20 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Contact Info */}
        <div>
          <h3 className="text-xl font-bold mb-4 text-cyan-400">Contact Us</h3>
          <p className="mb-2">
            <span className="font-semibold">Address:</span><br />
             AECS Layout,<br /> Bangalore - 560037
          </p>
          <p className="mb-2">
            <span className="font-semibold">Phone:</span> +91 123456789
          </p>
          <p>
            <span className="font-semibold">Email:</span> info@cmrit.ac.in
          </p>
        </div>

        {/* Useful Links */}
        <div>
          <h3 className="text-xl font-bold mb-4 text-cyan-400">Useful Links</h3>
          <ul className="space-y-2 text-gray-300">
            <li><a href="#" className="hover:text-cyan-400">About Us</a></li>
            <li><Link to="/services" className="hover:text-cyan-400">Services</Link></li>
            <li><a href="#" className="hover:text-cyan-400">FAQs</a></li>
            <li><a href="#" className="hover:text-cyan-400">Privacy Policy</a></li>
          </ul>
        </div>

        {/* Other Links */}
        <div>
          <h3 className="text-xl font-bold mb-4 text-cyan-400">Other Links</h3>
          <ul className="space-y-2 text-gray-300">
            <li><a href="#" className="hover:text-cyan-400">Security Partners</a></li>
            <li><a href="#" className="hover:text-cyan-400">Medical Donors</a></li>
            <li><a href="#" className="hover:text-cyan-400">Sponsors</a></li>
            <li><a href="#" className="hover:text-cyan-400">Careers</a></li>
            <li><a href="#" className="hover:text-cyan-400">Board Members</a></li>
          </ul>
        </div>

        {/* Social Icons */}
        <div className="flex md:justify-end items-start space-x-6 mt-6 md:mt-0">
          <a href="#" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-white transition">
            <FontAwesomeIcon icon={faInstagram} size="2x" />
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-white transition">
            <FontAwesomeIcon icon={faFacebookF} size="2x" />
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-white transition">
            <FontAwesomeIcon icon={faLinkedinIn} size="2x" />
          </a>
        </div>
      </div>

      <div className="text-center text-gray-500 mt-10 text-sm border-t border-gray-700 pt-4">
        &copy; 2025 HealthChain Protocol. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
