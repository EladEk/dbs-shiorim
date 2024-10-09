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
  const [currentTime, setCurrentTime] = useState(""); 
  const [currentDay, setCurrentDay] = useState("");  
  const [firstActiveClassC, setFirstActiveClassC] = useState(""); // Store the first non-empty column C value
  const deBug =0;
  const deBugDay = "חמישי";
  const deBugTime = "08:40";  

  useEffect(() => {
    // Refresh the page every 4 hours
    const refreshInterval = setInterval(() => {
      window.location.reload();
    }, 4 * 60 * 60 * 1000); // 4 hours in milliseconds
    return () => clearInterval(refreshInterval); // Cleanup on unmount
  }, []);

  useEffect(() => {
    fetch('/excel/database.xlsx')
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = 'Main'; 
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '\u00A0' });
        setData(jsonData);
        checkHighlightColumns(jsonData); 
      })
      .catch(err => console.error("Error fetching or reading Excel file:", err));
  }, []);

  useEffect(() => {
    updateCurrentTime();
    const interval = setInterval(() => {
      updateCurrentTime();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateCurrentTime = () => {
    const now = new Date();
    const currentFormattedTime = now.toTimeString().slice(0, 5); 
    const todayDayInHebrew = getTodayDayNameInHebrew(); 
    setCurrentTime(currentFormattedTime); 
    setCurrentDay(todayDayInHebrew); 
  };

  const checkHighlightColumns = (data) => {
    const columnsToHighlight = [];
    const todayDateInHebrew = getTodayDayNameInHebrew();
    data[0].forEach((header, colIndex) => {
      if (header && header.trim() === todayDateInHebrew) {
        columnsToHighlight.push(colIndex);
      }
    });
    setHighlightColumns(columnsToHighlight);
  };

  const getTodayDayNameInHebrew = () => {
    const today = new Date();
    const options = { weekday: 'long' };
    if (deBug === 0) {
      return new Intl.DateTimeFormat('he-IL', options).format(today).replace('יום ', '');
    } else {
      return deBugDay; 
    }
  };

  const isTimeInRange = (startTime, endTime) => {
    const timeToCheck = currentTime; 
    if (deBug === 0) {
      return timeToCheck >= startTime && timeToCheck <= endTime;
    } else {
      return deBugTime >= startTime && deBugTime <= endTime;
    }
  };

  const convertExcelTimeToHHMM = (excelTime) => {
    const totalMinutes = Math.round(excelTime * 24 * 60); 
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`; 
  };

  useEffect(() => {
    const filteredRows = [];
    let foundFirstActiveClassC = false; // Track if the first active column C has been found

    data.slice(1).forEach((row) => {
      const startTime = row[0] ? convertExcelTimeToHHMM(row[0]) : '';
      const endTime = row[1] ? convertExcelTimeToHHMM(row[1]) : '';
      const isCurrentTimeInRange = isTimeInRange(startTime, endTime);

      highlightColumns.forEach((colIndex) => {
        if (row[colIndex] && isCurrentTimeInRange) {
          filteredRows.push({
            className: row[colIndex].trim(),
            startTime: startTime,
            endTime: endTime
          });
        }
      });

      // If the time is in range, column C (index 2) is not empty or '\u00A0', and we haven't found a match yet
      if (isCurrentTimeInRange && !foundFirstActiveClassC && row[2] && row[2].trim() !== '\u00A0') {
        setFirstActiveClassC(row[2].trim()); // Save the first non-empty value from column C
        foundFirstActiveClassC = true; // Mark that we've found the first value
      }
    });

    if (filteredRows.length > 0) {
      setCurrentClass(filteredRows);
    } else {
      setCurrentClass([]);
    }
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
                  data[0]
                    .slice(3)
                    .map((header, colIndex) => (
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
          {Array.isArray(currentClass) && <Classes currentClass={currentClass.map(item => item.className)} firstActiveClassC={firstActiveClassC}/>}
        </div>
      </div>
    </div>
  );
}

export default App;
