import React from 'react';
import Hero from '../components/Hero';
import PromoBanners from '../components/PromoBanners';
import Categories from '../components/Categories';
import FlashDeals from '../components/FlashDeals';

const Home = () => {
  return (
    <>
      <Hero />
      <PromoBanners />
      <Categories />
      <FlashDeals />
    </>
  );
};

export default Home;
