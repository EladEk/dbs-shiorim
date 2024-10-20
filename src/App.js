import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './App.css'; // Assuming styles will be added here
import Classes from './Classes'; // Import the Classes component
import Banner from './Banner';
import Newsbar from './Newsbar';

function App() {
  const [data, setData] = useState([]);
  const [highlightColumns, setHighlightColumns] = useState([]);
  const [currentClass, setCurrentClass] = useState([]); // Active classes to pass to Classes component
  const [currentTime, setCurrentTime] = useState('');
  const [currentDay, setCurrentDay] = useState('');  
  const [firstActiveClassC, setFirstActiveClassC] = useState(''); // Store the first non-empty column C value
  const [lastModified, setLastModified] = useState(null); // Track the Last-Modified timestamp for the file
  const deBug = 0;
  const deBugDay = "חמישי";
  const deBugTime = "08:40";  

  useEffect(() => {
    // Fetch initial data from the Excel file
    fetchNewData();
  }, []);

  // Function to update the current time
  const updateCurrentTime = () => {
    const now = new Date();
    const formattedTime = now.toTimeString().slice(0, 5); // e.g., '12:34'
    const todayDayInHebrew = getTodayDayNameInHebrew();
    setCurrentTime(formattedTime);
    setCurrentDay(todayDayInHebrew);
  };

  // Function to fetch the new data from the Excel file
  const fetchNewData = () => {
    fetch(`/excel/database.xlsx?_=${new Date().getTime()}`)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheet = workbook.Sheets['Main']; // Assuming you're using the 'Main' sheet
        if (!sheet) return; // Avoid null pointer if sheet is missing
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '\u00A0' });
        setData(jsonData);
        checkHighlightColumns(jsonData); // Update the highlighted columns
      })
      .catch(err => console.error('Error fetching Excel data:', err));
  };

  // Function to check if the Excel file has been modified
  const checkFileChange = () => {
    fetch(`/excel/database.xlsx?_=${new Date().getTime()}`, { method: 'HEAD' })
      .then(response => {
        const newLastModified = response.headers.get('Last-Modified');
        
        // If it's the first run or the file has changed, fetch the new data
        if (lastModified === null || newLastModified !== lastModified) {
          fetchNewData(); // Fetch updated Excel data
          setLastModified(newLastModified); // Update the last modified timestamp
        }
      })
      .catch(err => console.error('Error checking file changes:', err));
  };

  // Function to check the highlighted columns
  const checkHighlightColumns = (data) => {
    if (!data || data.length === 0) return; // Check if data is valid
    const columnsToHighlight = [];
    const todayDateInHebrew = getTodayDayNameInHebrew();
    data[0]?.forEach((header, colIndex) => {
      if (header && header.trim() === todayDateInHebrew) {
        columnsToHighlight.push(colIndex);
      }
    });
    setHighlightColumns(columnsToHighlight);
  };

  // Function to get today's day name in Hebrew
  const getTodayDayNameInHebrew = () => {
    const today = new Date();
    const options = { weekday: 'long' };
    if (deBug === 0) {
      return new Intl.DateTimeFormat('he-IL', options).format(today).replace('יום ', '');
    } else {
      return deBugDay; 
    }
  };

  // Function to check if the current time is in range
  const isTimeInRange = (startTime, endTime) => {
    const timeToCheck = currentTime;
    if (!startTime || !endTime) return false; // Safeguard against null values
    if (deBug === 0) {
      return timeToCheck >= startTime && timeToCheck <= endTime;
    } else {
      return deBugTime >= startTime && deBugTime <= endTime;
    }
  };

  // Convert Excel time (numeric) to HH:MM format
  const convertExcelTimeToHHMM = (excelTime) => {
    if (typeof excelTime !== 'number') return ''; // Check if excelTime is a valid number
    const totalMinutes = Math.round(excelTime * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // This runs every 10 seconds to update the current time and check for file changes
    const interval = setInterval(() => {
      updateCurrentTime();  // Update the time every 10 seconds
      checkFileChange();    // Check if the Excel file has changed
    }, 10000);

    return () => clearInterval(interval); // Cleanup the interval on component unmount
  }, [lastModified]); // Make sure this only re-runs when lastModified changes

  useEffect(() => {
    if (!data || data.length === 0) return; // Check if data is valid before processing
    const filteredRows = [];
    let foundFirstActiveClassC = false;

    data.slice(1).forEach((row) => {
      const startTime = row[0] ? convertExcelTimeToHHMM(row[0]) : '';
      const endTime = row[1] ? convertExcelTimeToHHMM(row[1]) : '';
      const isCurrentTimeInRange = isTimeInRange(startTime, endTime);

      highlightColumns.forEach((colIndex) => {
        if (row[colIndex] && isCurrentTimeInRange) {
          filteredRows.push({
            className: row[colIndex]?.trim(),
            startTime: startTime,
            endTime: endTime
          });
        }
      });

      if (isCurrentTimeInRange && !foundFirstActiveClassC && row[2] && row[2].trim() !== '\u00A0') {
        setFirstActiveClassC(row[2]?.trim());
        foundFirstActiveClassC = true;
      }
    });

    setCurrentClass(filteredRows.length > 0 ? filteredRows : []);
  }, [data, highlightColumns, currentTime]);

  return (
    <div className='app-font'>
      <Banner />
      <Newsbar />
      <div className="app-container">
        <div className="content">
          <table className="to-the-right">
            <thead>
              <tr>
                <th className="time-column-header">זמנים</th>
                {data.length > 0 &&
                  data[0]?.slice(3).map((header, colIndex) => (
                    <th key={colIndex + 3} className={highlightColumns.includes(colIndex + 3) ? 'highlightHeader' : ''}>
                      {header}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(1).map((row, rowIndex) => {
                const startTime = row[0] ? convertExcelTimeToHHMM(row[0]) : ''; 
                const endTime = row[1] ? convertExcelTimeToHHMM(row[1]) : ''; 
                return (
                  <tr key={rowIndex}>
                    <td className="time-column">
                      {row[2]}
                    </td>
                    {row.slice(3).map((value, colIndex) => {
                      const isHighlighted = highlightColumns.includes(colIndex + 3);
                      const isCurrentTimeInRange = isTimeInRange(startTime, endTime);
                      const cellClass = `${isHighlighted ? 'highlight' : ''} ${isHighlighted && isCurrentTimeInRange ? 'active' : ''}`;

                      return (
                        <td key={colIndex + 3} className={cellClass}>
                          {typeof value === 'undefined' || value === null || value === '' ? '\u00A0' : value.trim()}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="sidebar">
          <div className="sidebar-day-and-time">
            <div className="day-display">
              <h1>יום {currentDay}</h1>
            </div>
              <div className="time-display">            
                {currentTime.slice(0, 2)}
                <span className="blinking-colon">:</span>
                {currentTime.slice(3, 5)}
              </div>
            </div>
          {/* Corrected to use if statement instead of && */}
          {currentClass && Array.isArray(currentClass) && currentClass.length > 0 ? (
            <Classes currentClass={currentClass.map(item => item.className)} firstActiveClassC={firstActiveClassC} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default App;
