import React from 'react';
import './PromoBanners.css';

const PromoBanners = () => {
  return (
    <section className="section promo-banners container">
      <div className="banners-grid">
        <div className="left-column">
          {/* Yellow Banner */}
          <div className="banner banner-yellow floating" style={{animationDelay: '0s'}}>
             <div className="banner-bg">
               <img src="/assets/meal_banner.png" alt="Meals" />
             </div>
             <div className="banner-content">
               <p className="subtitle">Irresistibly Tasty Meals</p>
               <h2>MADE FRESH +<br/>SERVED HOT</h2>
               <div className="discount-badge circle-badge">
                  <span>Up to</span>
                  <strong>40%</strong>
               </div>
               <button className="btn btn-outline banner-btn">Order Now 🔥</button>
             </div>
          </div>
          
          {/* Green Banner */}
          <div className="banner banner-green floating" style={{animationDelay: '1s'}}>
             <div className="banner-bg align-right">
               <img src="/assets/pizza_banner.png" alt="Pizza" />
             </div>
             <div className="banner-content text-white">
               <h2>SUPER<br/>DELICIOUS<br/>PIZZA</h2>
               <div className="discount-badge circle-badge yellow-circle">
                  <span>Up to</span>
                  <strong>50%</strong>
               </div>
               <button className="btn btn-outline banner-btn">Order Now 🔥</button>
             </div>
          </div>
        </div>
        
        <div className="right-column">
          {/* Tall Red Banner */}
          <div className="banner banner-red tall-banner floating" style={{animationDelay: '2s'}}>
            <div className="banner-bg align-center">
               <img src="/assets/burger_banner.png" alt="Burgers" />
            </div>
            <div className="banner-content text-white text-center">
              <h2>LOADED BEEF<br/>BURGERS</h2>
            </div>
            <div className="banner-bottom-content">
               <div className="discount-badge circle-badge white-circle">
                  <span>Up to</span>
                  <strong style={{color: '#ff3d00'}}>30%</strong>
               </div>
               <div className="ribbon">LIMITED TIME OFFER</div>
               <div className="ribbon-red">SPECIAL DISCOUNT</div>
               <br />
               <button className="btn btn-outline banner-btn">Order Now 🔥</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoBanners;
