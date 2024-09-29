import React, { useEffect, useState } from 'react';
import './Banner.css'; // Assuming styles will be added here

const Banner = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Function to show the banner for 30 seconds every 5 minutes
    const showBannerInterval = setInterval(() => {
      setShowBanner(true);
      // Hide the banner after 30 seconds
      setTimeout(() => {
        setShowBanner(false);
      }, 30000);
    }, 300000); // 5 minutes interval

    return () => clearInterval(showBannerInterval); // Clean up interval on component unmount
  }, []);

  return (
    <div className={`banner ${showBanner ? 'visible' : 'hidden'}`}>
      <h1>בית הספר הדמוקרטי באר שבע</h1>
    </div>
  );
};

export default Banner;