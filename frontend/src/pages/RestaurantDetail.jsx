import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RestaurantDetail.css';

const RestaurantDetail = () => {
  const navigate = useNavigate();
  const [selectedSize, setSelectedSize] = useState('medium');
  const [ingredients, setIngredients] = useState({
    chicken: true,
    mushroom: false
  });
  const [quantity, setQuantity] = useState(1);

  const basePrice = { small: 8.99, medium: 10.99, large: 12.99 };
  const addOnPrice = { chicken: 2.50, mushroom: 0.50 };

  const calculateTotal = () => {
    let total = basePrice[selectedSize];
    if (ingredients.chicken) total += addOnPrice.chicken;
    if (ingredients.mushroom) total += addOnPrice.mushroom;
    return (total * quantity).toFixed(2);
  };

  return (
    <div className="detail-page">
      {/* Header Actions */}
      <div className="header-actions">
        <button className="icon-btn" onClick={() => navigate(-1)}>
          <span className="icon">←</span>
        </button>
        <div className="right-actions">
          <button className="icon-btn"><span className="icon">♡</span></button>
          <button className="icon-btn"><span className="icon">➦</span></button>
        </div>
      </div>

      {/* Hero Image */}
      <div className="product-hero">
        <img src="/assets/pizza_banner.png" alt="Melting Cheese Pizza" className="product-image" />
      </div>

      {/* Product Information */}
      <div className="product-info-container">
        <h1 className="product-title">Melting Cheese Pizza</h1>
        <div className="product-meta">
          <span className="restaurant-name">🍕 Pizza Italiano</span>
          <span className="product-rating">★ 4.8 (2.2k) {'>'}</span>
        </div>

        {/* Size Selector */}
        <div className="variants-section">
          <div 
            className={`variant-option ${selectedSize === 'small' ? 'active' : ''}`}
            onClick={() => setSelectedSize('small')}
          >
            <span className="variant-name">8" - Small</span>
            <strong className="variant-price">${basePrice.small}</strong>
          </div>
          <div 
            className={`variant-option ${selectedSize === 'medium' ? 'active' : ''}`}
            onClick={() => setSelectedSize('medium')}
          >
            <span className="variant-name">11" - Medium</span>
            <strong className="variant-price">${basePrice.medium}</strong>
          </div>
          <div 
            className={`variant-option ${selectedSize === 'large' ? 'active' : ''}`}
            onClick={() => setSelectedSize('large')}
          >
            <span className="variant-name">13" - Large</span>
            <strong className="variant-price">${basePrice.large}</strong>
          </div>
        </div>

        {/* Add Ingredients */}
        <div className="ingredients-section">
          <h3 className="section-title">Add Ingredients</h3>
          
          <label className="ingredient-row">
            <div className="ingredient-info">
               <span className="ingredient-icon">🍗</span>
               <div className="ingredient-text">
                  <span className="ingredient-name">Chicken</span>
                  <span className="ingredient-price">+${addOnPrice.chicken.toFixed(2)}</span>
               </div>
            </div>
            <input 
              type="checkbox" 
              className="custom-checkbox"
              checked={ingredients.chicken} 
              onChange={() => setIngredients(prev => ({...prev, chicken: !prev.chicken}))}
            />
          </label>
          
          <label className="ingredient-row">
            <div className="ingredient-info">
               <span className="ingredient-icon">🍄</span>
               <div className="ingredient-text">
                  <span className="ingredient-name">Mushroom</span>
                  <span className="ingredient-price">+${addOnPrice.mushroom.toFixed(2)}</span>
               </div>
            </div>
            <input 
              type="checkbox" 
              className="custom-checkbox"
              checked={ingredients.mushroom} 
              onChange={() => setIngredients(prev => ({...prev, mushroom: !prev.mushroom}))}
            />
          </label>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="bottom-bar">
        <div className="qty-selector">
          <button className="qty-action" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
          <span className="qty-value">{quantity}</span>
          <button className="qty-action" onClick={() => setQuantity(quantity + 1)}>+</button>
        </div>
        
        <button className="add-to-cart-btn" onClick={() => navigate('/tracking/123')}>
          Add to Cart - ${calculateTotal()}
        </button>
      </div>
    </div>
  );
};

export default RestaurantDetail;
