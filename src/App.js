import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './App.css'; 
import Classes from './Classes'; 
import Banner from './Banner';
import Newsbar from './Newsbar';

function App() {
  const [data, setData] = useState([]);
  const [highlightColumns, setHighlightColumns] = useState([]);
  const [currentClass, setCurrentClass] = useState([]); 
  const [currentTime, setCurrentTime] = useState(""); 
  const [currentDay, setCurrentDay] = useState("");  
  const [firstActiveClassC, setFirstActiveClassC] = useState(""); 
  const [lastModified, setLastModified] = useState(null); 
  const [error, setError] = useState(null); 

  const deBug = 0;
  const deBugDay = "ראשון";
  const deBugTime = "08:40";  

  // Combined interval to handle time updates and file checks
  useEffect(() => {
    const combinedInterval = setInterval(() => {
      updateCurrentTime();
      checkFileChange();
    }, 60000); // Set this to 60 seconds (or more) to reduce frequent checks

    return () => clearInterval(combinedInterval); // Cleanup on unmount
  }, [lastModified]);

  // Refresh the page every 4 hours
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      window.location.reload();
    }, 4 * 60 * 60 * 1000); // 4 hours in milliseconds

    return () => clearInterval(refreshInterval); // Cleanup on unmount
  }, []);

  const fetchNewData = () => {
    fetch('/excel/database.xlsx?_=' + new Date().getTime())
      .then(response => {
        const newLastModified = response.headers.get('Last-Modified');
        if (lastModified === null || newLastModified !== lastModified) {
          setLastModified(newLastModified);
          return response.arrayBuffer();
        } else {
          throw new Error("No update needed");
        }
      })
      .then(arrayBuffer => {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheet = workbook.Sheets['Main'];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '\u00A0' });
        setData(jsonData);
        checkHighlightColumns(jsonData);
      })
      .catch(err => {
        if (err.message !== "No update needed") {
          console.error("Error fetching Excel file:", err);
          setError("Failed to fetch the Excel file.");
        }
      });
  };

  const checkFileChange = () => {
    fetch('/excel/database.xlsx', { method: 'HEAD' })
      .then(response => {
        const newLastModified = response.headers.get('Last-Modified');
        if (lastModified && newLastModified !== lastModified) {
          fetchNewData(); // Fetch the new data if the file has changed
        }
      })
      .catch(err => console.error("Error checking file changes:", err));
  };

  // Update the current time and day
  const updateCurrentTime = () => {
    const now = new Date();
    const formattedTime = now.toTimeString().slice(0, 5); 
    const todayDayInHebrew = getTodayDayNameInHebrew();
    setCurrentTime(formattedTime);
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
    return deBug === 0 
      ? new Intl.DateTimeFormat('he-IL', options).format(today).replace('יום ', '')
      : deBugDay; 
  };

  const isTimeInRange = (startTime, endTime) => {
    const timeToCheck = currentTime; 
    return deBug === 0 
      ? timeToCheck >= startTime && timeToCheck <= endTime
      : deBugTime >= startTime && deBugTime <= endTime;
  };

  const convertExcelTimeToHHMM = (excelTime) => {
    const totalMinutes = Math.round(excelTime * 24 * 60); 
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`; 
  };

  useEffect(() => {
    const filteredRows = [];
    let foundFirstActiveClassC = false;

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

      if (isCurrentTimeInRange && !foundFirstActiveClassC && row[2] && row[2].trim() !== '\u00A0') {
        setFirstActiveClassC(row[2].trim());
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
                  data[0].slice(3).map((header, colIndex) => (
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
