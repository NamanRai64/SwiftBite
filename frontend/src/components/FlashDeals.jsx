import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FlashDeals.css';

// Mock data reflecting backend MenuItem structure from implementation.md
const mockMenuItems = [
  {
    id: '1',
    name: 'Signature Chicken Burger',
    category: 'Burgers',
    price: 19.99,
    originalPrice: 24.99,
    rating: 4.8,
    reviews: 120,
    imageUrl: '/assets/flash_item.png',
    discount: '20% OFF'
  },
  {
    id: '2',
    name: 'Spicy Chicken BBQ Pizza',
    category: 'Pizza',
    price: 17.99,
    originalPrice: 22.99,
    rating: 4.9,
    reviews: 85,
    imageUrl: '/assets/pizza_banner.png',
    discount: '15% OFF'
  },
  {
    id: '3',
    name: 'Fresh Garden Salad',
    category: 'Healthy',
    price: 12.50,
    originalPrice: 15.00,
    rating: 4.5,
    reviews: 62,
    imageUrl: '/assets/meal_banner.png',
    discount: '10% OFF'
  },
  {
    id: '4',
    name: 'Creamy Mushroom Pasta',
    category: 'Pasta',
    price: 14.25,
    originalPrice: 18.00,
    rating: 4.7,
    reviews: 94,
    imageUrl: '/assets/meal_banner.png',
    discount: '15% OFF'
  }
];

const FlashDeals = () => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);

  useEffect(() => {
    // TODO: Replace with actual backend fetch when Spring Boot API is ready
    // fetch('http://localhost:8080/api/v1/restaurants/deals')
    //   .then(res => res.json())
    //   .then(data => setDeals(data));
    
    // Using mock data for static UI
    setDeals(mockMenuItems);
  }, []);

  return (
    <section className="section flash-deals container" id="offers">
      <div className="deals-header">
        <h2 className="text-center">Flash Deals: Ending Soon!</h2>
      </div>

      <div className="deals-grid">
        {deals.map((item) => (
          <div key={item.id} className="deal-card" onClick={() => navigate(`/restaurant/${item.id}`)} style={{cursor: 'pointer'}}>
            <div className="discount-tag">{item.discount}</div>
            <div className="card-img-container">
               <img src={item.imageUrl} alt={item.name} className="card-img" />
            </div>
            
            <div className="card-content">
               <span className="category-label">{item.category}</span>
               <h3 className="item-name">{item.name}</h3>
               
               <div className="rating">
                 <span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span>
                 <span className="score">{item.rating}</span>
               </div>
               
               <div className="price-row">
                  <div>
                    <span className="current-price">${item.price.toFixed(2)}</span>
                    <span className="original-price">${item.originalPrice.toFixed(2)}</span>
                  </div>
                  <div className="quantity-control">
                     <button className="qty-btn">-</button>
                     <span className="qty-num">1</span>
                     <button className="qty-btn">+</button>
                  </div>
               </div>
               
               <button className="btn btn-dark w-100 mt-3">ADD TO CART</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FlashDeals;
