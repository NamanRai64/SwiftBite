import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Tracking.css';

const Tracking = () => {
  const navigate = useNavigate();

  return (
    <div className="tracking-page">
      {/* Header */}
      <div className="tracking-header">
        <button className="icon-btn-small" onClick={() => navigate(-1)}>
          <span>←</span>
        </button>
        <h2 className="tracking-title">Tracking</h2>
        <button className="icon-btn-small delete-btn">
          <span>🗑</span>
        </button>
      </div>

      {/* Map Area */}
      <div className="map-container">
        <img src="/assets/map_placeholder.png" alt="Map View" className="mock-map-bg" />
        
        {/* Floating Delivery Banner */}
        <div className="delivery-banner">
          <div className="time-badge">
            <span className="time-val">20</span>
            <span className="time-unit">min</span>
          </div>
          <div className="delivery-text">
            <h3>Delivery</h3>
            <p>The courier is on the way</p>
          </div>
          <div className="delivery-illustration">
             <span className="scooter-icon">🛵</span>
          </div>
        </div>
      </div>

      {/* Driver Info */}
      <div className="driver-card">
        <div className="driver-profile">
          <img src="/assets/driver_avatar.png" alt="Driver" className="driver-avatar" />
          <div className="driver-details">
            <h4 className="driver-name">John Smith</h4>
            <div className="driver-meta">
              <span>Driver</span>
              <span className="divider">•</span>
              <span className="driver-rating">★ 4.8</span>
            </div>
          </div>
        </div>
        <div className="driver-actions">
          <button className="action-btn icon-chat">💬</button>
          <button className="action-btn icon-call">📞</button>
        </div>
      </div>

      {/* Order Timeline */}
      <div className="timeline-container">
        <div className="timeline-item active">
          <div className="timeline-marker">
             <div className="inner-dot"></div>
          </div>
          <div className="timeline-content">
            <span className="timeline-label">Order Accepted</span>
            <span className="timeline-time">06:20 PM</span>
          </div>
        </div>
        
        <div className="timeline-item active">
          <div className="timeline-marker">
             <div className="inner-dot"></div>
          </div>
          <div className="timeline-content">
            <span className="timeline-label">Cooking Food</span>
            <span className="timeline-time">06:25 PM</span>
          </div>
        </div>
        
        <div className="timeline-item pending">
          <div className="timeline-marker"></div>
          <div className="timeline-content">
            <span className="timeline-label">Food's on the Way</span>
            <span className="timeline-time">06:40 PM</span>
          </div>
        </div>
        
        <div className="timeline-item pending last">
          <div className="timeline-marker"></div>
          <div className="timeline-content">
            <span className="timeline-label">Delivered to you</span>
            <span className="timeline-time">06:50 PM</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tracking;
