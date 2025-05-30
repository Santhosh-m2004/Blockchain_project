//LandingPage_1.js
import React, { useState } from "react";
import NavBar from "./NavBar";
import "../CSS/LandingPage.css";
import lp_11 from "./lp_11.png";
import lp_10 from "./lp_10.png";
import lp_12 from "./lp_12.png";

function LandingPage() {
  const [isHovered, setIsHovered] = useState(false);
  
  function onEnter() {
    setIsHovered(true);
  }
  
  function onLeave() {
    setIsHovered(false);
  }

  return (
    <div className="landing-page">
      <NavBar />
      <div className="page-container">
        <div 
          className="content-wrapper"
          onMouseEnter={() => setTimeout(onEnter, 500)}
          onMouseLeave={() => setTimeout(onLeave, 600)}
        >
          {/* Image Gallery */}
          <div className="image-gallery">
            <img
              className={`main-image ${!isHovered ? "active" : "inactive"}`}
              src={lp_10}
              alt="Healthcare technology"
            />
            <img
              className={`main-image ${isHovered ? "active" : "inactive"}`}
              src={lp_12}
              alt="Blockchain security"
            />
            <img
              className={`main-image ${!isHovered ? "active" : "inactive"}`}
              src={lp_11}
              alt="Medical records"
            />
          </div>

          {/* Text Content */}
          <div className="text-content">
            <div className="description-box">
              <p className="description-text">
              Our Secure Electronic Health Records (EHR) application is transforming the way healthcare data is managed by incorporating blockchain technology. It utilizes blockchain to ensure secure and transparent data storage, along with tools like Ganache for faster development, Metamask for smooth interaction with the blockchain, and IPFS for decentralized file storage. This system prioritizes security, accessibility, and trust, while enabling seamless data interoperability. By adopting this innovative solution, we aim to revolutionize healthcare data management, ultimately leading to improved patient care and more efficient healthcare services.              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;