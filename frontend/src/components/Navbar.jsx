import React from 'react';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="container nav-container">
        <a href="/" className="logo">
          <span className="logo-icon">🌿</span>
          SwiftBite
        </a>
        
        <div className="nav-links">
          <a href="/" className="active">Home</a>
          <a href="#about">About Us</a>
          <a href="#menu">Menu & Flavors</a>
          <a href="#offers">Offers</a>
          <a href="#reviews">Reviews</a>
        </div>

        <div className="nav-actions">
          <button className="cart-btn" aria-label="Cart">
            <span>🛒</span> Cart (2)
          </button>
          <a href="#login" className="btn btn-outline btn-small">Login</a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
