import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import './Newsbar.css';

function Newsbar() {
  const [data, setData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [oneLine, setOneLine] = useState(0);
  const [isMobile, setIsMobile] = useState(false); // To track if the view is mobile
  const newsItemRef = useRef(null);
  const newsbarContainerRef = useRef(null);

  // Step 1: Fetch Excel file and extract data from the 'News' sheet
  useEffect(() => {
    fetch('/excel/database.xlsx')
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = 'News';
        const sheet = workbook.Sheets[sheetName];

        if (!sheet) {
          console.error("Sheet 'News' not found");
          return;
        }

        // Include the header and rows
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '\u00A0' });
        const filteredData = jsonData.flat().filter(item => item.trim() !== '' && item.trim() !== '\u00A0');
        setData(filteredData);
      })
      .catch(err => console.error("Error fetching or reading the Excel file:", err));
  }, []);

  // Step 2: Detect mobile view (screen width less than 768px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsMobile(true); // Mobile view
      } else {
        setIsMobile(false); // Desktop view
      }
    };

    // Initial check
    handleResize();

    // Add event listener for window resize
    window.addEventListener('resize', handleResize);

    return () => {
      // Cleanup event listener
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Step 3: Handle the animation logic
  useEffect(() => {
    if (data.length === 0) return;

    const newsItemElement = newsItemRef.current;
    const containerElement = newsbarContainerRef.current;

    if (!newsItemElement || !containerElement) return;

    // Get the width of the text and the container
    const textWidth = newsItemElement.offsetWidth;
    const containerWidth = containerElement.offsetWidth;

    // Total distance to travel: from fully off-screen left (-textWidth) to fully off-screen right (+containerWidth)
    const totalDistance = containerWidth + textWidth;

    // Set scrolling speed based on mobile or desktop view
    const speed = isMobile ? 100 : 200; // 100px/s for mobile, 200px/s for desktop

    // Calculate the duration based on speed and distance
    const duration = totalDistance / speed; // Time for the scroll

    // Reset the text position to the left (off-screen) before starting the scroll
    newsItemElement.style.transform = `translateX(-${textWidth}px)`;
    newsItemElement.style.transition = 'none'; // Remove any existing transition

    // Start scrolling after a slight delay to ensure the transform reset is applied
    setTimeout(() => {
      newsItemElement.style.transition = `transform ${duration}s linear`;
      newsItemElement.style.transform = `translateX(${containerWidth}px)`;
    }, 50); // Small delay to ensure the browser renders the reset position first

    // When the animation finishes, move to the next line
    const handleTransitionEnd = () => {
      setCurrentIndex(prevIndex => {
        if (data.length === 1) {
          // If there's only one row, repeat the same row by resetting the currentIndex to 0
          setOneLine(oneLine === 0 ? 1 : 0);
          return 0;
        }
        let nextIndex = (prevIndex + 1) % data.length; // Loop back to the first row when we reach the end
        // Skip any empty rows
        while (data[nextIndex].trim() === '' || data[nextIndex].trim() === '\u00A0') {
          nextIndex = (nextIndex + 1) % data.length;
        }
        return nextIndex;
      });
    };

    // Attach event listener to handle the end of the scroll
    newsItemElement.addEventListener('transitionend', handleTransitionEnd);

    return () => {
      // Cleanup the event listener
      newsItemElement.removeEventListener('transitionend', handleTransitionEnd);
    };
  }, [currentIndex, data, oneLine, isMobile]); // Added isMobile as a dependency

  // Step 4: Render nothing if there is no data in the sheet
  if (data.length === 0) {
    return null; // Return null to hide everything if the 'News' sheet is empty
  }

  return (
    <div className="newsbar-container" ref={newsbarContainerRef}>
      <div className="newsbar-content">
        {data.length > 0 && (
          <span ref={newsItemRef} className="news-item">
            {data[currentIndex]}
          </span>
        )}
      </div>
    </div>
  );
}

export default Newsbar;
