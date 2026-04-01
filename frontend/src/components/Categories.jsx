import React from 'react';
import './Categories.css';

const Categories = () => {
  return (
    <section className="section categories" id="menu">
      <div className="container relative z-10">
        <div className="cat-header">
           <h2>Explore Delicious Cuisine<br/>by Category</h2>
           <p className="cat-subtitle">Discover thousands of unique flavors with their favorite cuisines.<br/>Whether you're craving a quick bite or culinary adventures.</p>
        </div>
        
        <div className="cat-circle-container">
           <img src="/assets/category_bg.png" alt="Food Background" className="cat-bg-img" />
           
           <div className="cat-pills">
              <div className="cat-pill pill-1 floating">
                 <div className="pill-icon">🍔</div>
                 <div className="pill-text">
                    <strong>Burgers & Fries</strong>
                    <span>120 items</span>
                 </div>
              </div>
              
              <div className="cat-pill pill-2 floating" style={{animationDelay: '1s'}}>
                 <div className="pill-icon">🍕</div>
                 <div className="pill-text">
                    <strong>Pizza Paradise</strong>
                    <span>85 items</span>
                 </div>
              </div>
              
              <div className="cat-pill pill-3 floating" style={{animationDelay: '2s'}}>
                 <div className="pill-icon">🥪</div>
                 <div className="pill-text">
                    <strong>Sandwiches & Wraps</strong>
                    <span>65 items</span>
                 </div>
              </div>
              
              <div className="cat-pill pill-4 floating" style={{animationDelay: '0.5s'}}>
                 <div className="pill-icon">🍗</div>
                 <div className="pill-text">
                    <strong>Fried & Crispy</strong>
                    <span>170 items</span>
                 </div>
              </div>
           </div>
        </div>
        
        <div className="cat-footer">
          <button className="btn btn-dark">View All Categories</button>
        </div>
      </div>
    </section>
  );
};

export default Categories;
