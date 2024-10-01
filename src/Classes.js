import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import './Classes.css';

const Classes = ({ currentClass, firstActiveClassC }) => {
  const [sheetData, setSheetData] = useState({});
  const [error, setError] = useState(null);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0); 
  const [isFading, setIsFading] = useState(false);
  const [clockProgress, setClockProgress] = useState(0); // Track clock progress for the round clock

  useEffect(() => {
    if (currentClass.length > 0) {
      fetch('/excel/database.xlsx')
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const newSheetData = {};

          currentClass.forEach(className => {
            const matchedSheet = workbook.SheetNames.find(sheet => sheet.trim() === className.trim());
            
            if (matchedSheet) {
              const sheet = workbook.Sheets[matchedSheet];
              const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '\u00A0' });
              newSheetData[className] = jsonData;
            } else {
              console.warn(`Sheet for class ${className} not found.`);
            }
          });

          setSheetData(newSheetData);
        })
        .catch(err => setError(`Error fetching Excel file: ${err.message}`));
    }
  }, [currentClass]);

  useEffect(() => {
    if (Object.keys(sheetData).length > 0) {
      const interval = setInterval(() => {
        // Trigger fade-out effect
        setIsFading(true);
        setClockProgress(0); // Reset the clock when fading starts

        setTimeout(() => {
          setCurrentSheetIndex(prevIndex => (prevIndex + 1) % Object.keys(sheetData).length);
          setIsFading(false); 
        }, 500); 
      }, 5000); 

      // Update the clock progress every 50ms
      const clockInterval = setInterval(() => {
        setClockProgress(prev => (prev < 100 ? prev + 1 : 0));
      }, 50); // Each tick moves the clock slightly forward

      return () => {
        clearInterval(interval);
        clearInterval(clockInterval); // Clear clock interval
      };
    }
  }, [sheetData]);

  const sheetKeys = Object.keys(sheetData);
  const currentSheetKey = sheetKeys[currentSheetIndex];

  return (
    <div className='sidebar-main'>
      {firstActiveClassC ? (
        <div className="top-section">
  <label className="title-active-class">שיעורים פעילים</label>
  <br />
    <label className="title-time-frame">{firstActiveClassC}</label>
</div>
      ) : (
        <h1 className="title">אין שיעורים פעילים</h1>
      )}

      {error && <p>{error}</p>}
        {sheetKeys.length > 0 && sheetData[currentSheetKey] ? (
          <div
            key={currentSheetIndex}
            className={`fade ${isFading ? 'fade-out' : 'fade-in'}`} 
          >
            <div className="class-title-container">
              <h2 className="class-title">{currentSheetKey}</h2>
            </div>
            <table className="sidebar-main">
              <thead className="class-name">
                <tr>
                  {sheetData[currentSheetKey][0]?.map((header, colIndex) => (
                    <th key={colIndex} className="class-name">{header}</th>
                  ))}
                </tr>
                <tr>
                  {sheetData[currentSheetKey][1]?.map((header, colIndex) => (
                    <th key={colIndex} className="teacher-name">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheetData[currentSheetKey]?.slice(2).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row?.map((value, colIndex) => (
                      <td key={colIndex}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>לא נמצאו שיעורים פעילים</p>
        )}
    </div>
    
  );
};

export default Classes;
