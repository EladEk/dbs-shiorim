import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import './Classes.css';


const Classes = ({ currentClass, firstActiveClassC }) => {
  const [sheetData, setSheetData] = useState({});
  const [error, setError] = useState(null);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0); // Track the current sheet being displayed
  const [isFading, setIsFading] = useState(false); // Track the transition state

  useEffect(() => {
    if (currentClass.length > 0) {
      fetch('/excel/database.xlsx') // Adjust the path to the xlsx file
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          
          const newSheetData = {};

          currentClass.forEach(className => {
            const matchedSheet = workbook.SheetNames.find(sheet => sheet.trim() === className.trim());
            
            if (matchedSheet) {
              const sheet = workbook.Sheets[matchedSheet];
              const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '\u00A0' }); // Convert the sheet to JSON-like array
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

        // Wait for the fade-out to finish before changing sheet
        setTimeout(() => {
          setCurrentSheetIndex(prevIndex => (prevIndex + 1) % Object.keys(sheetData).length);
          setIsFading(false); // Trigger fade-in effect
        }, 500); // Adjust this to match the CSS transition duration
      }, 5000); // 5 seconds per sheet

      return () => clearInterval(interval);
    }
  }, [sheetData]);

  const sheetKeys = Object.keys(sheetData); // Get the sheet names
  const currentSheetKey = sheetKeys[currentSheetIndex]; // Get the current sheet being displayed

  return (
    <div className='sidebar-main'>

{firstActiveClassC ? (
          <h1 className="title">שיעורים פעילים {firstActiveClassC }</h1>
        ) : (
          <h1 className="title">אין שיעורים פעילים</h1>
        )}
      
      {error && <p>{error}</p>}
      {sheetKeys.length > 0 ? (
        <div
          key={currentSheetIndex}
          className={`fade ${isFading ? 'fade-out' : 'fade-in'}`} // Apply fade effect classes
        >
          <h2 className="class-title">{currentSheetKey}</h2>
          <table>
            <thead className='class-name'>
                <tr>
                {sheetData[currentSheetKey][0].map((header, colIndex) => (
                  <th key={colIndex} className='class-name'>{header}</th>
                ))}
              </tr>
              <tr>
                {sheetData[currentSheetKey][1].map((header, colIndex) => (
                  <th key={colIndex} className='teacher-name'>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sheetData[currentSheetKey].slice(2).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((value, colIndex) => (
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
