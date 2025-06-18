import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';
import { useProducts } from '../hooks/useProducts';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

function Home() {
  const { products, loading, error } = useProducts();
  const [activeCategory, setActiveCategory] = useState('all');

  const heroSlides = [
    {
      image: "https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg",
      title: "Handcrafted Excellence",
      subtitle: "New Collection 2025",
      description: "Discover unique pieces that tell a story",
      link: "/products/new"
    },
    {
      image: "https://images.pexels.com/photos/2079438/pexels-photo-2079438.jpeg",
      title: "Artisan Crafted",
      subtitle: "Limited Edition",
      description: "Each piece is uniquely handmade",
      link: "/products/featured"
    },
    {
      image: "https://images.pexels.com/photos/1099816/pexels-photo-1099816.jpeg",
      title: "Traditional Art",
      subtitle: "Heritage Collection",
      description: "Preserving cultural heritage through art",
      link: "/products/traditional"
    }
  ];

  const categories = [
    { id: 'all', name: 'All Products', icon: '🎨' },
    { id: 'new', name: 'New Arrivals', icon: '✨' },
    { id: 'featured', name: 'Featured', icon: '⭐' },
    { id: 'sale', name: 'On Sale', icon: '🏷️' }
  ];

  const features = [
    {
      icon: "https://images.pexels.com/photos/6231990/pexels-photo-6231990.jpeg",
      title: "Handmade Quality",
      description: "Each piece crafted with care"
    },
    {
      icon: "https://images.pexels.com/photos/6231991/pexels-photo-6231991.jpeg",
      title: "Authentic Design",
      description: "Traditional patterns & motifs"
    },
    {
      icon: "https://images.pexels.com/photos/6231992/pexels-photo-6231992.jpeg",
      title: "Sustainable Art",
      description: "Eco-friendly materials"
    }
  ];

  const filteredProducts = products.filter(product => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'sale') return product.oldPrice;
    if (activeCategory === 'new') return product.isNew;
    if (activeCategory === 'featured') return product.isFeatured;
    return product.categoryId === activeCategory;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[...Array(8)].map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-red-600 bg-red-100 p-4 rounded-lg">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative">
        <Swiper
          modules={[Autoplay, Pagination, Navigation, EffectFade]}
          effect="fade"
          autoplay={{ delay: 5000 }}
          pagination={{ clickable: true }}
          navigation
          className="h-[70vh] md:h-[90vh]"
        >
          {heroSlides.map((slide, index) => (
            <SwiperSlide key={index}>
              <div className="relative h-full">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center">
                  <div className="max-w-7xl mx-auto px-4 w-full">
                    <div className="max-w-xl text-white">
                      <span className="block text-xl mb-3 font-light animate-fadeIn">
                        {slide.subtitle}
                      </span>
                      <h2 className="text-5xl md:text-7xl font-bold mb-4 animate-slideUp">
                        {slide.title}
                      </h2>
                      <p className="text-xl mb-8 animate-slideUp delay-100">
                        {slide.description}
                      </p>
                      <Link
                        to={slide.link}
                        className="inline-block bg-white text-gray-900 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors animate-slideUp delay-200"
                      >
                        Explore Collection
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden">
                  <img
                    src={feature.icon}
                    alt={feature.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Grid Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col items-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Our Collection</h2>
          <p className="text-gray-600 mb-8 text-center max-w-2xl">
            Discover our handpicked selection of authentic Madhubani art pieces
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all
                  ${activeCategory === category.id
                    ? 'bg-gray-900 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
                  }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No products found in this category.</p>
          </div>
        )}
      </section>

      {/* Newsletter Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/6231993/pexels-photo-6231993.jpeg"
            alt="Newsletter background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
            <p className="text-lg mb-8 text-gray-200">
              Subscribe to receive updates about new collections, special offers, and artisan stories
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-full text-gray-900 border-2 border-transparent focus:border-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition-colors shadow-lg"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;