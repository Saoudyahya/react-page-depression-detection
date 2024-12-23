    import React, { useState, useRef } from 'react';
    import axios from 'axios';
    import { jsPDF } from 'jspdf';
    import { File, CheckCircle, XCircle } from 'lucide-react'; // Added icons

    import autoTable from 'jspdf-autotable';

    export const Header = (props) => {
      const [showForm, setShowForm] = useState(false);
      const [formData, setFormData] = useState({
        age: '',
        gender: '',
        happiness: '',
        days: '',
        questions: [],
      });
      const [results, setResults] = useState(null);
      const [error, setError] = useState(null);
      const resultContainerRef = useRef(null);

      const handleStartDetection = () => {
        setShowForm(true);
      };

      const handleCloseForm = () => {
        setShowForm(false);
      };

      const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
          ...prevState,
          [name]: value,
        }));
      };

      const handleExportPDF = () => {
        if (!results) return;
      
        const doc = new jsPDF();
        
        // Header with clinic info
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor("#0056b3");
        doc.text("Mental Health Assessment Report", 10, 20);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor("#666666");
        doc.text("Mental Health Clinic", 10, 30);
        doc.text("123 Healthcare Ave", 10, 35);
        doc.text("Phone: (555) 123-4567", 10, 40);
        
        // Personal Information Section at top
        doc.setDrawColor(0, 86, 179);
        doc.setLineWidth(0.5);
        doc.line(10, 45, 200, 45);
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        const personalInfo = [
          ['Patient Information', 'Assessment Details'],
          [`Age: ${results.age}`, `Date: ${new Date().toLocaleDateString()}`],
          [`Gender: ${results.gender}`, `Time: ${new Date().toLocaleTimeString()}`],
          [`Happiness Score: ${results.happiness_score}/10`, `Assessment ID: ${Math.random().toString(36).substr(2, 9)}`]
        ];
        
        autoTable(doc, {
          body: personalInfo,
          startY: 50,
          theme: 'plain',
          styles: { fontSize: 12, cellPadding: 4 },
          columnStyles: {
            0: { cellWidth: 90 },
            1: { cellWidth: 90 }
          }
        });
      
        // Questions and Responses Section
        const questions = [
          "Little interest or pleasure in doing things?",
          "Feeling down, depressed, or hopeless?",
          "Trouble falling or staying asleep, or sleeping too much?",
          "Feeling tired or having little energy?",
          "Poor appetite or overeating?",
          "Feeling bad about yourself, or that you're a failure?",
          "Trouble concentrating on things?",
          "Moving or speaking so slowly that others have noticed?",
          "Thoughts of self-harm or suicide?"
        ];
      
        const questionData = questions.map((question, index) => {
          const dayIndex = Math.floor(index / 9) + 1;
          const questionKey = `q${index + 1}_day${dayIndex}`;
          const questionValue = formData.questions
            ? formData.questions.find(q => q.day === dayIndex)?.questions[questionKey] || 0
            : 0;
      
          const reaction = {
            0: 'No impact',
            1: 'Minimal impact',
            2: 'Moderate impact',
            3: 'Severe impact'
          }[questionValue];
      
          return [question, questionValue, reaction];
        });
      
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Assessment Results", 10, doc.lastAutoTable.finalY + 20);
      
        // Results table
        autoTable(doc, {
          head: [['Question', 'Score', 'Clinical Assessment']],
          body: questionData,
          startY: doc.lastAutoTable.finalY + 25,
          styles: { fontSize: 10, cellPadding: 5 },
          headStyles: { fillColor: [0, 86, 179], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [245, 245, 245] }
        });
      
        // Summary Section
        autoTable(doc, {
          head: [['Clinical Summary']],
          body: [
            [`Total PHQ-9 Score: ${results.total_score}`],
            [`Severity Level: ${results.severity}`],
            [`Mood Trend: ${results.trend}`],
            [`Risk Assessment: ${results.risk_factor}`],
            [`Professional Recommendation: ${results.recommendation}`]
          ],
          startY: doc.lastAutoTable.finalY + 15,
          styles: { fontSize: 11, cellPadding: 5 },
          headStyles: { fillColor: [0, 86, 179], textColor: [255, 255, 255] }
        });
      
        // Footer
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor("#666666");
        doc.text("This is a confidential medical document.", 10, doc.autoTableEndPosY() + 15);
        doc.text(`Generated on ${new Date().toLocaleString()}`, 10, doc.autoTableEndPosY() + 20);
      
        doc.save("mental-health-assessment.pdf");
      };

      const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
          const submitData = new FormData();
          submitData.append('age', formData.age);
          submitData.append('gender', formData.gender);
          submitData.append('happiness', formData.happiness);
          submitData.append('days', formData.days);

          formData.questions.forEach((dayData) => {
            Object.entries(dayData.questions).forEach(([key, value]) => {
              submitData.append(key, value);
            });
          });

          const response = await axios.post('http://localhost:8000/', submitData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          setResults(response.data);
          setShowForm(false);
        } catch (err) {
          setError('Failed to submit depression detection form');
          console.error(err);
        }
      };

      const renderDepressionDetectionForm = () => {
        const questions = [
          "Little interest or pleasure in doing things?",
          "Feeling down, depressed, or hopeless?",
          "Trouble falling or staying asleep, or sleeping too much?",
          "Feeling tired or having little energy?",
          "Poor appetite or overeating?",
          "Feeling bad about yourself, or that you're a failure?",
          "Trouble concentrating on things, such as reading or watching TV?",
          "Moving or speaking so slowly that others have noticed?",
          "Thoughts that you would be better off dead or of hurting yourself in some way?"
        ];

        const handleQuestionChange = (day, question, value) => {
          setFormData((prevState) => {
            const newQuestions = [...(prevState.questions || [])];
            const questionKey = `q${question}_day${day}`;
        
            // Find if the day already exists
            const dayIndex = newQuestions.findIndex((q) => q.day === day);
            if (dayIndex === -1) {
              newQuestions.push({
                day,
                questions: { [questionKey]: value },
              });
            } else {
              newQuestions[dayIndex].questions[questionKey] = value;
            }
        
            return { ...prevState, questions: newQuestions };
          });
        };
        
        const renderQuestionInputs = () => {
          const days = parseInt(formData.days);
          
          return Array.from({ length: days }, (_, dayIndex) => (
            <div key={`day-${dayIndex + 1}`} className="mb-4">
              <h4>Day {dayIndex + 1} PHQ-9 Questionnaire</h4>
              {questions.map((question, qIndex) => {
                const questionKey = `q${qIndex + 1}_day${dayIndex + 1}`;
                const questionValue = formData.questions
                  ? formData.questions.find(q => q.day === dayIndex + 1)?.questions[questionKey] || 0
                  : 0;
                
                return (
                  <div key={`day${dayIndex + 1}-q${qIndex + 1}`} className="form-group mb-4">
                    <label>{question} (0-3)</label>
                   
                    <input
                      type="range"
                      className="w-full h-2 bg-blue-200 rounded-lg appearance-none"
                      min="0"
                      max="3"
                      value={questionValue}
                      onChange={(e) => handleQuestionChange(dayIndex + 1, qIndex + 1, e.target.value)}
                      step="1"
                      required
                    />
                   
                      <div className="text-center mb-2 font-semibold text-blue-600">
                      {questionValue}
                    </div>
                  
                  </div>
                );
              })}
            </div>
          ));
        };

        return (
          <div className="popup-overlay" tabIndex="-1">
            <div className="popup-form">
              <button className="close-btn" onClick={handleCloseForm}>
                &times;
              </button>
              <div>
                <form onSubmit={handleSubmit}>
                  <div className="form-group mb-3">
                    <label>Age</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      max="120"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      required
                    />
                    <div className="flex justify-between">
                      
                    </div>
                  </div>
                  <div className="form-group mb-3">
                    <label>Gender</label>
                    <select
                      className="form-control"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div className="form-group mb-3">
                    <label>Happiness Score (1-10)</label>
                 
                    <input
                      type="range"
                      className="w-full h-2 bg-blue-200 rounded-lg appearance-none"
                      min="1"
                      max="10"
                      name="happiness"
                      value={formData.happiness}
                      onChange={handleInputChange}
                      required
                    />
                       <div className="text-center mb-2 font-semibold text-blue-600">
         {formData.happiness || 1}
      </div>
                  </div>
                  <div className="form-group mb-3">
                    <label>Number of Days to Analyze</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      max="14"
                      name="days"
                      value={formData.days}
                      onChange={handleInputChange}
                      required
                    />
                    <div className="flex justify-between">
                    
                    </div>
                  </div>
                  {formData.days && renderQuestionInputs()}
                  <div className="flex justify-center mt-4">
  <button type="submit" className="btn btn-primary flex justify-center mt-4">
    Submit Depression Detection
  </button>
</div>
                </form>
              </div>
            </div>
          </div>
        );
      };

      const renderResults = () => {
        if (!results) return null;

        const getSeverityColor = (severity) => {
          const colorMap = {
            'none': 'text-green-600',
            'mild': 'text-yellow-600',
            'moderate': 'text-orange-600',
            'moderately_severe': 'text-red-600',
            'severe': 'text-red-800'
          };
          return colorMap[severity] || 'text-gray-600';
        };

        return (
          <div
            ref={resultContainerRef}
            className="bg-white shadow-lg rounded-lg p-6 max-w-xl mx-auto mt-6 relative"
          >
          
        
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-blue-800 mb-4">
                Mental Health Assessment Results
              </h2>
            </div>
        
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-700 mb-2">Personal Information</h3>
                <p><strong>Age:</strong> {results.age}</p>
                <p><strong>Gender:</strong> {results.gender}</p>
                <p><strong>Happiness Score:</strong> {results.happiness_score}/10</p>
              </div>
        
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-700 mb-2">Assessment Metrics</h3>
                <p><strong>Total PHQ-9 Score:</strong> {results.total_score}</p>
                <p className={`font-bold ${getSeverityColor(results.severity)}`}>
                  <strong>Severity:</strong> {results.severity}
                </p>
                <p><strong>Mood Trend:</strong> {results.trend}</p>
              </div>
            </div>
        
            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-700 mb-2">Professional Recommendation</h3>
              <p>{results.recommendation}</p>
            </div>
        
            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-700 mb-2">Risk Factor Assessment</h3>
              <p>{results.risk_factor}</p>
            </div>
        
            <div className="mt-6 text-center text-sm text-gray-600">
            <div className="flex justify-center mt-4">
            <button
  onClick={handleExportPDF}
  className="relative flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 text-white text-sm font-semibold rounded-full shadow-lg transform transition-transform duration-300 ease-out hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:outline-none active:scale-95"
  title="Export as PDF"
  style={{ minWidth: '200px' }}
>
  <div className="absolute inset-0 bg-gradient-to-r from-blue-300 via-blue-400 to-blue-500 opacity-0 transition-opacity duration-300 hover:opacity-10 rounded-full"></div>
  <span className="flex items-center gap-2 relative">
    <File size={20} />
    <span className="relative">Export PDF</span>
 
  </span>
</button>

</div>

              <p>
                * This is a screening tool. Always consult a healthcare professional
                for comprehensive mental health evaluation.
              </p>
            </div>
            
          </div>
        );
      }        

      return (
        <header id="header">
          <div className="intro">
            <div className="overlay">
              <div className="container">
                <div className="row">
                  <div className="col-md-8 col-md-offset-2 intro-text">
                    <h1>
                      {props.data ? props.data.title : 'Depression Detection'}
                      <span></span>
                    </h1>
                    <p>
                      {props.data
                        ? props.data.paragraph
                        : 'Understand your mental health with our comprehensive screening tool.'}
                    </p>
                    {!showForm && !results && (
                      <button
                        onClick={handleStartDetection}
                        className="btn btn-custom btn-lg page-scroll"
                      >
                        Start Detection
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {showForm && renderDepressionDetectionForm()}
          {renderResults()}
        </header>
      );
    };



    export default Header;