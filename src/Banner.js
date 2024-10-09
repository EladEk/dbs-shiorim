import React, { useEffect, useState } from 'react';
import './Banner.css'; // Assuming styles will be added here
import * as XLSX from 'xlsx';

const Banner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [birthdaysThisWeek, setBirthdaysThisWeek] = useState([]);

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


  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/excel/database.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheet = workbook.Sheets['Birthday'];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Get current week's Sunday and Saturday
        const now = new Date();
        const sunday = new Date(now.setDate(now.getDate() - now.getDay()));
        const saturday = new Date(sunday);
        saturday.setDate(sunday.getDate() + 6);

        // Filter students whose birthdays fall within this week (ignoring the year)
        const birthdays = data.filter(row => {
          const name = row[0]; // Name is in the first column (A)
          const dateString = row[1]; // Date is in the second column (B)

          if (!dateString) return false;

          const [day, month] = dateString.split('.').map(Number);
          const birthdayDate = new Date(now.getFullYear(), month - 1, day);

          // Check if the birthday falls within this week's range (ignoring the year)
          console.log("Sunday:", sunday,"birthdayDate:", birthdayDate, "saturday:", saturday)
          return birthdayDate >= sunday && birthdayDate <= saturday;
        });

        setBirthdaysThisWeek(birthdays);
      } catch (error) {
        console.error('Error fetching or processing data', error);
      }
    };

    fetchData();
  }, []);

  if (birthdaysThisWeek.length === 0) {
    return (
      <div className={`banner ${showBanner ? 'visible' : 'hidden'}`}>
          <div dir="rtl">
            <h1>בית הספר הדמוקרטי באר שבע</h1>
        </div>
      </div>
    );} else {
  return (
    <div className={`banner ${showBanner ? 'visible' : 'hidden'}`}>
      <div dir="rtl">
        <h1>בית הספר הדמוקרטי באר שבע</h1>
        <label className='birthday-title'>ימי הולדת השבוע:</label>
        <br />
          <ul>
            {birthdaysThisWeek.map((row, index) => (
              <label className='birthday-line' key={index}>
                {row[0]} - {row[1]}
              </label>
            ))}
          </ul>
      </div>
    </div>
  );}
};

export default Banner;
