import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import './Classes.css';

const Classes = ({ currentClass, firstActiveClassC }) => {
  const [activeClasses, setActiveClasses] = useState([]);
  const [subjects, setSubjects] = useState([]); // Array to store subjects from header
  const [matchedStudents, setMatchedStudents] = useState([]);
  const [error, setError] = useState(null);
  const [currentClassIndex, setCurrentClassIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  // Fetch subjects from the "Level" sheet header
  useEffect(() => {
    fetch('/excel/database.xlsx')
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const levelSheet = workbook.Sheets['Level'];

        if (!levelSheet) {
          setError('Sheet "Level" not found.');
          return;
        }

        const jsonData = XLSX.utils.sheet_to_json(levelSheet, { header: 1, defval: '\u00A0' });
        const headerRow = jsonData[0]; // Assuming the first row is the header
        setSubjects(headerRow.filter(header => header)); // Filter out any empty headers
      })
      .catch(err => setError(`Error fetching Excel file: ${err.message}`));
  }, []);

  useEffect(() => {
    if (currentClass.length > 0) {
      fetch('/excel/database.xlsx')
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const classesSheet = workbook.Sheets['Classes'];
          
          if (!classesSheet) {
            setError('Sheet "Classes" not found.');
            return;
          }

          const jsonData = XLSX.utils.sheet_to_json(classesSheet, { header: 1, defval: '\u00A0' });

          const newActiveClasses = jsonData.slice(1)
            .filter(row => currentClass.includes(row[0]))
            .map(row => ({
              ClassName: row[0],
              Teacher: row[1],
              ClassLocation: row[2],
            }));

          setActiveClasses(newActiveClasses);
        })
        .catch(err => setError(`Error fetching Excel file: ${err.message}`));
    }
  }, [currentClass]);

  useEffect(() => {
    if (activeClasses.length > 0) {
      const interval = setInterval(() => {
        setIsFading(true);
        setTimeout(() => {
          setCurrentClassIndex(prevIndex => (prevIndex + 1) % activeClasses.length);
          setIsFading(false); 
        }, 500); 
      }, 5000); 

      return () => clearInterval(interval);
    }
  }, [activeClasses]);

  useEffect(() => {
    const currentClassData = activeClasses[currentClassIndex];
    setMatchedStudents([]);
    if (currentClassData && subjects.length > 0) {
      // Determine if the class name contains any of the subjects
      let subject = null;
      let level = 1; // Default level

      for (const header of subjects) {
        if (currentClassData.ClassName.includes(header)) {
          subject = header;
          break;
        }
      }

      // If a subject is found, check for a number after it
      if (subject) {
        const numberMatch = currentClassData.ClassName.match(/\d+/); // Find any number in the string
        if (numberMatch) {
          level = parseInt(numberMatch[0], 10); // Use the number found
        }
        console.log ("level",level,"subject",subject)
        // Fetch students who match the subject and level from the "Level" sheet
        fetch('/excel/database.xlsx')
          .then(response => response.arrayBuffer())
          .then(arrayBuffer => {
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const levelSheet = workbook.Sheets['Level'];

            if (!levelSheet) {
              setError('Sheet "Level" not found.');
              return;
            }

            const jsonData = XLSX.utils.sheet_to_json(levelSheet, { header: 1, defval: '\u00A0' });
            const subjectIndex = jsonData[0].indexOf(subject); // Find the index of the subject column
            if (subjectIndex === -1) return;

            const matched = jsonData.slice(1) // Skip the header row
              .filter(row => row[subjectIndex] === level) // Check if the subject column matches the level
              .map(row => row[0]); // Get the student's name from column "ילד"

            setMatchedStudents(matched);
          })
          .catch(err => setError(`Error fetching Excel file: ${err.message}`));
      }
    }
  }, [activeClasses, currentClassIndex, subjects]);

  const currentClassData = activeClasses[currentClassIndex];

  return (
    <div className='sidebar-main'>
      {firstActiveClassC ? (
        <div className="top-section">
          <label className="title-active-class">שיעורים</label>
          <br />
          <label className="title-active-class"> פעילים</label>
          <br />
          <label className="title-time-frame">{firstActiveClassC}</label>
        </div>
      ) : (
        <h1 className="title">אין שיעורים פעילים</h1>
      )}

      {error && <p>{error}</p>}
      {currentClassData ? (
        <div className={`fade ${isFading ? 'fade-out' : 'fade-in'} class-after-class`}>
          <h1 className="class-header">{currentClassData.ClassName}</h1>
          <div>
            <div className="class-teacher">
              <label className="class-teacher-label">מורה:</label>
              <label className="class-teacher-text"> {currentClassData.Teacher}</label>
            </div>
            <div className="class-location">
              <label className="class-location-label">כיתה:</label>
              <label className="class-location-text"> {currentClassData.ClassLocation}</label>
            </div>
          </div>
          {matchedStudents.length > 0 && (
            <div className="matched-students-border">
              <div className="matched-students">
                <label className="matched-students-label">תלמידים:</label>
              </div>
              <div className="matched-students-text">
                {matchedStudents.map((student, index) => (
                  <li key={index}>{student}</li>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p>לא נמצאו שיעורים פעילים</p>
      )}
    </div>
  );
};

export default Classes;
