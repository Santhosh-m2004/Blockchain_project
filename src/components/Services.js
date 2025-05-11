//Services.js
import React from 'react';
import NavBar from './NavBar';
import '../CSS/Services.css';

const Services = () => {
  return (
    <>
      <NavBar />
      <section className="services" id="services">
        <h1 className="heading">
          OUR <span>SERVICES</span>
        </h1>

        <div className="box-container">
          <div className="box">
            <h3>Free Checkups</h3>
            <p>
              Comprehensive medical checkups including blood tests, urinalysis, 
              and physical exams to monitor your health status.
            </p>
            <a href="#" className="btn">Learn More</a>
          </div>

          <div className="box">
            <h3>24/7 Ambulance</h3>
            <p>
              Emergency medical services available round the clock with rapid 
              response teams and fully equipped ambulances.
            </p>
            <a href="#" className="btn">Learn More</a>
          </div>

          <div className="box">
            <h3>Expert Doctors</h3>
            <p>
              Our team of 12 specialized physicians provides top-quality care 
              tailored to your individual health needs.
            </p>
            <a href="#" className="btn">Learn More</a>
          </div>

          <div className="box">
            <h3>Medicine Supply</h3>
            <p>
              Partnership with 30 pharmaceutical companies ensures availability 
              of all essential medications on-site.
            </p>
            <a href="#" className="btn">Learn More</a>
          </div>

          <div className="box">
            <h3>Diagnostic Services</h3>
            <p>
              State-of-the-art diagnostic facilities including MRI, CT scans, 
              ultrasound, and laboratory testing for accurate diagnosis.
            </p>
            <a href="#" className="btn">Learn More</a>
          </div>
        </div>
      </section>
    </>
  );
};

export default Services;