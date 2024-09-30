import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './App.css'; // Assuming styles will be added here
import Classes from './Classes'; // Import the Classes component
import Banner from './Banner';

function App() {
  const [data, setData] = useState([]);
  const [highlightColumns, setHighlightColumns] = useState([]);
  const [currentClass, setCurrentClass] = useState([]);
  const [currentTime, setCurrentTime] = useState(""); // State for current time
  const [currentDay, setCurrentDay] = useState("");  // State for current day in Hebrew


  useEffect(() => {
    fetch('/excel/database.xlsx')
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = 'Main'; // The specific sheet you are working with
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '\u00A0' }); // Use non-breaking space for empty cells
        setData(jsonData);
        checkHighlightColumns(jsonData); // Existing logic to check highlight columns
      })
      .catch(err => console.error("Error fetching or reading Excel file:", err));
  }, []);

  useEffect(() => {
    // Set the initial time and day
    updateCurrentTime();

    // Set up an interval to update the current time every minute (60000 ms)
    const interval = setInterval(() => {
      updateCurrentTime();
    }, 10000);

    // Clear the interval when the component unmounts
    return () => clearInterval(interval);
  }, []);

  const updateCurrentTime = () => {
    const now = new Date();
    const currentFormattedTime = now.toTimeString().slice(0, 5); // Get HH:mm format
    const todayDayInHebrew = getTodayDayNameInHebrew(); // Get today's day in Hebrew
    setCurrentTime(currentFormattedTime); // Update the current time state
    setCurrentDay(todayDayInHebrew); // Update the current day state
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
    return new Intl.DateTimeFormat('he-IL', options).format(today).replace('יום ', '');
  };

  const isTimeInRange = (startTime, endTime) => {
    const timeToCheck = currentTime; // Use the updated current time or the debug time
    return timeToCheck >= startTime && timeToCheck <= endTime;
  };

  const convertExcelTimeToHHMM = (excelTime) => {
    const totalMinutes = Math.round(excelTime * 24 * 60); // Convert Excel time to total minutes
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`; // Format as HH:mm
  };

  useEffect(() => {
    const filteredRows = [];

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
    });

    if (filteredRows.length > 0) {
      setCurrentClass(filteredRows);
    } else {
      setCurrentClass([]);
    }
  }, [data, highlightColumns, currentTime]);

  return (
    <div>
      <Banner />
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
                      <th key={colIndex + 3} className={highlightColumns.includes(colIndex + 3) ? 'highlight' : ''}>
                        {header}
                      </th>
                    ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(1).map((row, rowIndex) => {
                const startTime = row[0] ? convertExcelTimeToHHMM(row[0]) : ''; // Convert Excel start time
                const endTime = row[1] ? convertExcelTimeToHHMM(row[1]) : ''; // Convert Excel end time
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
          <div className="time-day-display">
            <h1>{currentTime} - יום {currentDay}</h1>
          </div>
          {Array.isArray(currentClass) && <Classes currentClass={currentClass.map(item => item.className)} />}
        </div>
      </div>
    </div>
  );
}

export default App;
