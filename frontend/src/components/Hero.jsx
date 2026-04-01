import React from 'react';
import './Hero.css';
import Navbar from './Navbar';

const Hero = () => {
  return (
    <section className="hero">
      <Navbar />
      <div className="container hero-container">
        <div className="hero-content">
          <h1>Delicious<br />food at your<br />doorstep</h1>
          <p>
            Our mission is to connect food lovers with their favorite cuisines.<br />
            Whether you're craving a quick bite or culinary adventures, we're<br />
            here to inspire your next meal.
          </p>
          <a href="#menu" className="btn btn-primary mt-4">Get Started</a>
        </div>
        <div className="hero-image-wrapper">
          {/* Top floating badge */}
          <div className="floating-badge top-badge floating">
             <div className="stars">
                <span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span>
             </div>
             <p>"The best Burger I've had in ages! Super Fast Delivery Too."</p>
          </div>
          
          <img src="/assets/burger_hero.png" alt="Delicious Burger" className="hero-img" />
          
          {/* Bottom floating customer card */}
          <div className="customer-card floating" style={{ animationDelay: '2s' }}>
             <div className="avatars">
                <div className="avatar bg-1"></div>
                <div className="avatar bg-2"></div>
                <div className="avatar bg-3"></div>
                <div className="avatar bg-add">+</div>
             </div>
             <p className="customer-count">1,000+ Happy Customers</p>
             <div className="rating">
                <span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span>
                <span className="score">4.9</span>
             </div>
          </div>
        </div>
      </div>
      {/* Decorative leaf/shape elements */}
      <span className="deco deco-1">✨</span>
      <span className="deco deco-2">✨</span>
    </section>
  );
};

export default Hero;
