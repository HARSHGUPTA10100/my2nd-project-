document.addEventListener('DOMContentLoaded', function() {
    function removeActiveClass() {
        var links = document.querySelectorAll('nav ul li a');
        links.forEach(function(link) {
            link.classList.remove('active');
        });
    }

    function hideAllContent() {
        var contents = document.querySelectorAll('.tab-content');
        contents.forEach(function(content) {
            content.style.display = 'none';
        });
    }

    function showContent(contentId) {
        hideAllContent();
        document.getElementById(contentId).style.display = 'block';
    }

    // Set default active tab and content
    removeActiveClass();
    document.getElementById('dashboard-btn').classList.add('active');
    showContent('dashboard-content');

    // Event listener for Dashboard button
    document.getElementById('dashboard-btn').addEventListener('click', function() {
        removeActiveClass();
        this.classList.add('active');
        showContent('dashboard-content');
    });

    // Event listener for Manage Users button
    document.getElementById('exam-btn').addEventListener('click', function() {
        removeActiveClass();
        this.classList.add('active');
        showContent('exam-content');
    });

    document.getElementById('Result-btn').addEventListener('click', function() {
        removeActiveClass();
        this.classList.add('active');
        showContent('result-content');
    });

    document.getElementById('Setting-btn').addEventListener('click', function() {
        removeActiveClass();
        this.classList.add('active');
        showContent('setting-content');
    });
});

/* fetch notice form mongodb*/
document.addEventListener('DOMContentLoaded', function() {
    fetch('/notices')
        .then(response => response.json())
        .then(data => {
            displayNotices(data, 'notices-container');
            /*displayNotices(data, 'student-notices');
            displayNotices(data, 'teacher-notices');*/
        })
        .catch(error => console.error('Error fetching notices:', error));
});

function displayNotices(notices, elementId) {
    const container = document.getElementById(elementId);
    container.innerHTML = '';
    notices.forEach(notice => {
        const noticeElement = document.createElement('div');
        noticeElement.className = 'notice';
        noticeElement.innerHTML = `
            <h3>${notice.title}</h3>
            <p>${notice.content}</p>
        `;
        container.appendChild(noticeElement);
    });
}
/* fetch notice form mongodb*/

/* login details */
const editIcon = document.getElementById('editIcon');
  const uploadPhoto = document.getElementById('uploadPhoto');
  const profilePic = document.getElementById('profilePic');
  
  // When the edit icon is clicked, trigger the file input
  editIcon.addEventListener('click', () => {
      uploadPhoto.click();
  });
  
  // When a new photo is uploaded, preview it
  uploadPhoto.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
              profilePic.src = e.target.result; // Update the profile image with the new one
          };
          reader.readAsDataURL(file);
      }
  });


  // get data from from mysql via api and show data in profile 
  // Fetch user data from session
  document.addEventListener('DOMContentLoaded', function () {
            fetch('/getUserData')
                .then(response => {
                    if (!response.ok) {
                        // If not authenticated, redirect to login
                        window.location.href = '/login.html';
                    }
                    return response.json();
                })
                .then(user => {
                    if (user) {
                        document.getElementById('userId').textContent = user.id;
                        document.getElementById('userEmail').textContent = user.email;
                        document.getElementById('userroll').textContent= user.roll_no;
                        document.getElementById('userNumber').textContent = user.number;
                        fetchSubjects(user.roll_no);
                    }
                })
                .catch(error => console.error('Error fetching user data:', error));
        });

        // Handle logout
        document.getElementById('logoutBtn').addEventListener('click', function () {
            fetch('/logout', { method: 'POST' })
                .then(() => {
                    // Redirect to login page after logout
                    window.location.href = '/login.html';
                })
                .catch(error => console.error('Logout error:', error));
        });


// exam content js for mcq

let currentQuestionIndex = 0;
let mcqQuestions = [];
let examTimer; 
let examTimers; 
let tabSwitched = false; 
let selectedAnswers = Array(mcqQuestions.length).fill(null); 
let examSubmitted = false;
let tabChangeWarningShown = false; 
let oneLineQuestions=[];
let oneLineAnswers = [];
let mediaRecorder;
let recordedChunks = [];


// Function to format date to dd-mm-yyyy
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// Start button click: Fetch MCQ questions for the selected subject
function startExam(subject_code, subject_name, class_name, total_marks, exam_date) {
    Promise.all([
        fetch(`http://localhost:4000/get-mcq-questions/${subject_code}`).then(response => response.json()),
        fetch(`http://localhost:4000/get-one-line-questions/${subject_code}`).then(response => response.json())
    ]).then(([mcqQuestionsFetched, oneLineQuestionsFetched]) => {
        mcqQuestions = mcqQuestionsFetched;
        oneLineQuestions = oneLineQuestionsFetched;

        // Initialize arrays for answers
        selectedAnswers = Array(mcqQuestions.length).fill(null); // For MCQ answers
        oneLineAnswers = Array(oneLineQuestions.length).fill(''); // For one-line question answers

        currentQuestionIndex = 0;

        document.getElementById('subject-list').style.display = 'none';
        document.getElementById('navmenu').style.display = 'none';
        document.getElementById('mcq-questions').style.display = 'block';

        // Set the subject name, class, total marks, and exam date at the top
        document.getElementById('subject-header').textContent = `Subject: ${subject_name}`;
        document.getElementById('code-header').textContent = `Subject_code: ${subject_code}`;
        document.getElementById('class-header').textContent = `Class: ${class_name}`;
        document.getElementById('total-marks').textContent = `Total Marks: ${total_marks}`;
        document.getElementById('exam-date').textContent = `Exam Date: ${formatDate(exam_date)}`;

        // Start the timer
        startTimer(class_name);
        displayQuestion();
        renderQuestionNavigation();
        startRecording();
    });
}

function startRecording() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);

            // Hide the video preview (you can remove the video element if not needed)
            const videoElement = document.createElement('video');
            videoElement.srcObject = stream;
            videoElement.style.display = 'none'; // Hide video preview
            document.body.appendChild(videoElement);

            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };

            mediaRecorder.start();
        })
        .catch(error => {
            console.error('Error accessing media devices.', error);
        });
}

// Function to stop recording and upload the video
function stopRecording() {
    const username = document.getElementById('userId').textContent;
    const rollno = document.getElementById('userroll').textContent;
    mediaRecorder.stop();
    mediaRecorder.onstop = () => {
        const videoBlob = new Blob(recordedChunks, { type: 'video/mp4' });
        const videoFile = new File([videoBlob], `${username}_${rollno}.mp4`, { type: 'video/mp4' });
        uploadVideo(videoFile);
    };
}

// Function to upload the video to the server
function uploadVideo(videoFile) {
    const formData = new FormData();
    formData.append('videoFile', videoFile);

    fetch('http://localhost:4000/upload-video', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        console.log('Video uploaded successfully:', result);
    })
    .catch(error => {
        console.error('Error uploading video:', error);
    });
}


// Timer function
function startTimer(class_name) {
    // Check if class ends with 'CS' or 'IT' and set the duration accordingly
    let duration = class_name.endsWith('CS') ? 50 * 60 : 60 * 60;

    examTimer = setInterval(() => {
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;

        document.getElementById('timer').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        if (duration <= 0) {
            clearInterval(examTimer);
            alert("Time's up! Submitting your answers.");
            submitExam();
        }

        duration--;  
    }, 1000);
}





// Save one-line question answers
function saveOneLineAnswer(answer) {
    const oneLineIndex = currentQuestionIndex - mcqQuestions.length; 
    oneLineAnswers[oneLineIndex] = answer; 
}

// Display the question based on the current index
function displayQuestion() {
    let question;

    // MCQ questions display
    if (currentQuestionIndex < mcqQuestions.length) {
        question = mcqQuestions[currentQuestionIndex];
        const mcqList = document.getElementById('mcq-list');
        mcqList.innerHTML = `
            <div class="mcq-question">
                <h3>Question ${currentQuestionIndex + 1}: ${question.question}</h3>
                <label><input type="radio" name="answer" value="1" onchange="saveAnswer(1)"> A) ${question.option1}</label>
                <label><input type="radio" name="answer" value="2" onchange="saveAnswer(2)"> B) ${question.option2}</label>
                <label><input type="radio" name="answer" value="3" onchange="saveAnswer(3)"> C) ${question.option3}</label>
                <label><input type="radio" name="answer" value="4" onchange="saveAnswer(4)"> D) ${question.option4}</label>
            </div>
        `;

        // Restore saved answer for MCQ questions
        if (selectedAnswers[currentQuestionIndex] !== null) {
            const savedAnswer = selectedAnswers[currentQuestionIndex];
            const radio = mcqList.querySelector(`input[value="${savedAnswer}"]`);
            if (radio) {
                radio.checked = true;
            }
        }

    } else {
        // One-line questions display
        const oneLineIndex = currentQuestionIndex - mcqQuestions.length; 
        question = oneLineQuestions[oneLineIndex];
        const mcqList = document.getElementById('mcq-list');
        mcqList.innerHTML = `
            <div class="one-line-question">
                <h3>Q ${mcqQuestions.length + oneLineIndex + 1}: ${question.question}</h3>
                <textarea id="one-line-answer" rows="3" placeholder="Your answer here..." oninput="saveOneLineAnswer(this.value)"></textarea>
            </div>
        `;

        // Restore saved answer for one-line questions
        const savedAnswer = oneLineAnswers[oneLineIndex] || '';  
        document.getElementById('one-line-answer').value = savedAnswer; 
    }

    // Show/hide navigation buttons
    document.getElementById('previous-question-btn').style.display = currentQuestionIndex > 0 ? 'inline-block' : 'none';
    document.getElementById('next-question-btn').style.display = currentQuestionIndex < mcqQuestions.length + oneLineQuestions.length - 1 ? 'inline-block' : 'none';
    document.getElementById('submit-btn').style.display = currentQuestionIndex === mcqQuestions.length + oneLineQuestions.length - 1 ? 'inline-block' : 'none';

    updateActiveQuestionNumber();
}

// Display question numbers for navigation
function renderQuestionNavigation() {
    const navContainer = document.getElementById('question-number-nav');
    navContainer.innerHTML = '';

    const totalQuestions = mcqQuestions.length + oneLineQuestions.length;

    for (let i = 0; i < totalQuestions; i++) {
        const questionButton = document.createElement('button');
        questionButton.textContent = i + 1;
        questionButton.addEventListener('click', () => {
            currentQuestionIndex = i;
            displayQuestion();
        });
        navContainer.appendChild(questionButton);
    }

    updateActiveQuestionNumber();
}

// Update the active question number button styles
function updateActiveQuestionNumber() {
    const questionButtons = document.querySelectorAll('#question-number-nav button');

    questionButtons.forEach((button, index) => {
        button.classList.toggle('active-question', index === currentQuestionIndex);

        // Check if it's an MCQ question
        if (index < mcqQuestions.length) {
            
            if (selectedAnswers[index] !== null) {
                button.style.backgroundColor = 'SpringGreen'; 
            } else {
                button.style.backgroundColor = 'red'; 
            }
        } else {
            
            const oneLineIndex = index - mcqQuestions.length; 
            if (oneLineAnswers[oneLineIndex].trim() !== '') {
                button.style.backgroundColor = 'SpringGreen'; 
            } else {
                button.style.backgroundColor = 'red'; 
            }
        }
    });
}

// Save the selected answer for the current question
function saveAnswer(answer) {
    // Clear previously selected options
    const currentLabels = document.querySelectorAll('#mcq-list label');
    currentLabels.forEach(label => {
        label.classList.remove('selected-option'); 
    });

    selectedAnswers[currentQuestionIndex] = answer; 

    // Highlight the selected option
    const selectedLabel = document.querySelector(`#mcq-list input[value="${answer}"]`).parentNode; 
    selectedLabel.classList.add('selected-option'); 

    updateActiveQuestionNumber(); 
}


// Next question
document.getElementById('next-question-btn').addEventListener('click', () => {
    if (currentQuestionIndex < mcqQuestions.length + oneLineQuestions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
});

// Previous question
document.getElementById('previous-question-btn').addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
});





function generatePDFS() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let yPosition = 10; 
    const lineHeight = 10; 
    const pageHeight = 290; 
    const gapBetweenQuestions = lineHeight * 1; 

    // Assuming these variables are defined in your existing code
    const subject_name = document.getElementById('subject-header').textContent.split(': ')[1];
    const class_name = document.getElementById('class-header').textContent.split(': ')[1];
    const total_marks = document.getElementById('total-marks').textContent.split(': ')[1];
    const username = document.getElementById('userId').textContent;
    const rollno = document.getElementById('userroll').textContent;
    const subject_code = document.getElementById('code-header').textContent.split(': ')[1];


    // Add subject name, class name, and total marks at the beginning
    doc.text(`Name : ${username}`,10,yPosition);
    yPosition += lineHeight;
    doc.text(`Roll_No: ${rollno}`,10,yPosition);
    yPosition += lineHeight;
    doc.text(`Subject: ${subject_name}`, 10, yPosition);
    yPosition += lineHeight;
    doc.text(`Subject Code: ${subject_code}`, 10, yPosition); // Add subject code
    yPosition += lineHeight;
    doc.text(`Class: ${class_name}`, 10, yPosition);
    yPosition += lineHeight;
    doc.text(`Total Marks: ${total_marks}`, 10, yPosition);
    yPosition += lineHeight * 2; 

    // Loop through one-line questions and answers
    oneLineQuestions.forEach((question, index) => {
        const oneLineIndex = mcqQuestions.length + index; 
        const questionText = `Q${oneLineIndex + 1}: ${question.question}`;
        const answer = oneLineAnswers[index] || 'No Answer';

        // Add one-line question and answer to the PDF
        doc.text(questionText, 10, yPosition);
        yPosition += lineHeight;
        const answerLines = doc.splitTextToSize(`Answer: ${answer}`, 180); 
        answerLines.forEach((line) => {
            if (yPosition > pageHeight) {
                doc.addPage(); 
                yPosition = 10;
            }
            doc.text(line, 10, yPosition);
            yPosition += lineHeight;
        });
        yPosition += gapBetweenQuestions;

        if (yPosition > pageHeight - lineHeight) {
            doc.addPage(); // Add a new page if the content exceeds the page height
            yPosition = 10;
        }
    });

    // Create and upload the PDF
    const pdfBlob = doc.output('blob');
    const timestamp = new Date().getTime();
    
    // Include user name, subject name, class name, and timestamp in the filename
    const pdfFilename = `${username}_${rollno}_${subject_name}_${class_name}_${timestamp}.pdf`;
    uploadsPDF(pdfBlob, pdfFilename);
}


// Function to upload the PDF to the teacher backend
function uploadsPDF(pdfBlob, pdfFilename) {
    const formData = new FormData();
    formData.append('pdfFile', pdfBlob, pdfFilename); 

    fetch('http://localhost:4000/uploads-pdf', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    
}



/*
// Submit the exam
function submitExam() {
    clearInterval(examTimer); 
    examSubmitted = true; 
    stopRecording();
    alert('Exam submitted!');
    window.location.reload();
}*/

function submitExam() {
    clearInterval(examTimer); 
    examSubmitted = true; 
    stopRecording();
    const answers = selectedAnswers; // This holds the answers selected by the user

    // Submit the answers to the server
    fetch('http://localhost:4000/submit-exam', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: document.getElementById('userId').textContent,
            roll_no: document.getElementById('userroll').textContent,
            class_name : document.getElementById('class-header').textContent.split(': ')[1],
            subjectname : document.getElementById('subject-header').textContent.split(': ')[1],
            subject_code: document.getElementById('code-header').textContent.split(': ')[1], // Get the subject code
            answers: answers // The selected answers array
        }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Exam submitted successfully. Score:', data.score);
    })
    .catch(error => {
        console.error('Error submitting exam:', error);
    });
    window.location.reload();
}



// Add event listener to submit button
document.getElementById('submit-btn').addEventListener('click', () => {
    submitExam(); 
    generatePDFS();
});




// exam content js for mcq   


// theory exam  js 
let currentMainQuestionIndex = 0;
let theoryQuestions = [];
let groupedQuestions = [];
let answers = [];  

        // Function to format date to dd-mm-yyyy
        function formatDate(dateString) {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        }



/*
// Fetch subjects based on user roll number
function fetchSubjects(roll_no) {
    const classPrefix = roll_no.substring(0, 4); // Get the class prefix (e.g., TYCS, TYIT)

    Promise.all([
        fetch('http://localhost:4000/get-subjects').then(response => response.json()),
        fetch('http://localhost:4000/get-subjectss').then(response => response.json())
    ])
    .then(([mcqSubjects, theorySubjects]) => {
        const subjectList = document.getElementById('subject-list');
        subjectList.innerHTML = '';

        // Combine MCQ and Theory subjects into a single list
        const allSubjects = [...mcqSubjects, ...theorySubjects];

        // Filter subjects based on user's class
        const filteredSubjects = allSubjects.filter(subject => subject.class.startsWith(classPrefix));

        filteredSubjects.forEach(subject => {
            const formattedDate = formatDate(subject.exam_date);
            const subjectBox = document.createElement('div');
            subjectBox.className = 'subject-box';
            
            // Determine which button to show based on subject code prefix
            const startButton = subject.subject_code.startsWith('INT')
                ? `<button onclick="startExam('${subject.subject_code}', '${subject.subject_name}', '${subject.class}', ${subject.total_marks}, '${subject.exam_date}')">Start</button>`
                : subject.subject_code.startsWith('EXT')
                ? `<button onclick="startTheoryExam('${subject.subject_code}', '${subject.subject_name}', '${subject.class}', ${subject.total_marks}, '${subject.exam_date}')">Start</button>`
                : '';

            subjectBox.innerHTML = `
                <h3>${subject.subject_name}</h3>
                <p><strong>Class:</strong> ${subject.class}</p>
                <p><strong>Subject Code:</strong> ${subject.subject_code}</p>
                <p><strong>Total Marks:</strong> ${subject.total_marks}</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Start Time:</strong> ${subject.start_time}</p>
                <p><strong>End Time:</strong> ${subject.end_time}</p>
                ${startButton}
            `;
            
            subjectList.appendChild(subjectBox);
            
        });

    })
    .catch(error => console.error('Error fetching subjects:', error));
}
*/

     
// Fetch subjects based on user roll number
function fetchSubjects(roll_no) {
    const classPrefix = roll_no.substring(0, 4); // Get the class prefix (e.g., TYCS, TYIT)

    Promise.all([
        fetch('http://localhost:4000/get-subjects').then(response => response.json()),
        fetch('http://localhost:4000/get-subjectss').then(response => response.json())
    ])
    .then(([mcqSubjects, theorySubjects]) => {
        const subjectList = document.getElementById('subject-list');
        subjectList.innerHTML = '';

        // Combine MCQ and Theory subjects into a single list
        const allSubjects = [...mcqSubjects, ...theorySubjects];

        // Filter subjects based on user's class
        const filteredSubjects = allSubjects.filter(subject => subject.class.startsWith(classPrefix));

        filteredSubjects.forEach(subject => {
            const formattedDate = formatDate(subject.exam_date);
            const subjectBox = document.createElement('div');
            subjectBox.className = 'subject-box';
            
            // Calculate if the exam date and time are valid
            const isStartButtonEnabled = isExamTimeValid(subject.exam_date, subject.start_time, subject.end_time);
            
            // Determine which button to show based on subject code prefix and time validation
            const startButton = subject.subject_code.startsWith('INT')
                ? `<button id="startBtn-${subject.subject_code}" ${isStartButtonEnabled ? '' : 'disabled'} onclick="startExam('${subject.subject_code}', '${subject.subject_name}', '${subject.class}', ${subject.total_marks}, '${subject.exam_date}')">Start</button>`
                : subject.subject_code.startsWith('EXT')
                ? `<button id="startBtn-${subject.subject_code}" ${isStartButtonEnabled ? '' : 'disabled'} onclick="startTheoryExam('${subject.subject_code}', '${subject.subject_name}', '${subject.class}', ${subject.total_marks}, '${subject.exam_date}')">Start</button>`
                : '';

            subjectBox.innerHTML = `
                <h3>${subject.subject_name}</h3>
                <p><strong>Class:</strong> ${subject.class}</p>
                <p><strong>Subject Code:</strong> ${subject.subject_code}</p>
                <p><strong>Total Marks:</strong> ${subject.total_marks}</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Start Time:</strong> ${subject.start_time}</p>
                <p><strong>End Time:</strong> ${subject.end_time}</p>
                ${startButton}
            `;
            
            subjectList.appendChild(subjectBox);

            // Set an interval to dynamically check the time and enable/disable the button
            setInterval(() => {
                const isNowValid = isExamTimeValid(subject.exam_date, subject.start_time, subject.end_time);
                const startBtn = document.getElementById(`startBtn-${subject.subject_code}`);
                if (startBtn) {
                    startBtn.disabled = !isNowValid;
                }
            }, 1000);  // Check every second
        });
    })
    .catch(error => console.error('Error fetching subjects:', error));
}

// Function to check if the current time and date are between the start and end times on the correct exam date
function isExamTimeValid(examDate, startTime, endTime) {
    const now = new Date();
    const examDateObj = new Date(examDate);

    // Ensure the current date matches the exam date
    if (
        now.getFullYear() !== examDateObj.getFullYear() ||
        now.getMonth() !== examDateObj.getMonth() ||
        now.getDate() !== examDateObj.getDate()
    ) {
        return false; // Current date doesn't match the exam date
    }

    // If the date matches, check the time
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const startDateTime = new Date(examDate);
    startDateTime.setHours(startHours, startMinutes, 0);

    const endDateTime = new Date(examDate);
    endDateTime.setHours(endHours, endMinutes, 0);

    // Check if the current time is within the start and end time window
    return now >= startDateTime && now <= endDateTime;
}

// Format date helper function
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
}

let tabChangeCount = 0;  // To track how many times the user changes the tab

// Detect tab visibility changes



        // Start button click: Fetch theory questions for the selected subject
function startTheoryExam(subject_code, subject_name, class_name, total_marks, exam_date) {
    fetch(`http://localhost:4000/get-theory-questions/${subject_code}`)
        .then(response => response.json())
        .then(questions => {
            theoryQuestions = questions;
            groupedQuestions = groupQuestions(questions, 6);
            currentMainQuestionIndex = 0;
            answers = new Array(theoryQuestions.length).fill('');  // Initialize empty answers array
            document.getElementById('subject-list').style.display = 'none';
            document.getElementById('theory-questions').style.display = 'block';

            // Set the subject name, class, total marks, and exam date at the top
            document.getElementById('theory-subject-header').textContent = `Subject: ${subject_name}`;
            document.getElementById('theory-class-header').textContent = `Class: ${class_name}`;
            document.getElementById('theory-total-marks').textContent = `Total Marks: ${total_marks}`;
            document.getElementById('theory-exam-date').textContent = `Exam Date: ${formatDate(exam_date)}`;

            // Initialize and start the timer
            startTimers(class_name);

            displayTheoryQuestionGroup();
            renderQuestionNavigations();
            startRecording();
        });
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'hidden') {
                tabChangeCount++;  // Increment the count each time the tab goes to background
        
                if (tabChangeCount === 1) {
                    // First time tab change - show warning
                    alert('Warning: You have switched tabs. Switching again will submit your exam.');
                } else if (tabChangeCount === 2) {
                    // Second time tab change - automatically submit the exam
                    alert('You have switched tabs again. Your exam will now be submitted.');
                    submitExams();  // Function to submit the exam
                }
            }
        });
}


        function startTimers(class_name) {
            // Determine the duration based on the class name
            let duration = class_name.endsWith('CS') ? 3 * 60 * 60 : 3 * 60 * 60; // 1 minute for CS, 3 hours for others
        
            examTimer = setInterval(() => {
                const hours = Math.floor(duration / 3600);
                const minutes = Math.floor((duration % 3600) / 60);
                const seconds = duration % 60;
        
                // Update the timer display
                if (hours > 0) {
                    document.getElementById('timers').textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                } else {
                    document.getElementById('timers').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                }
        
                // Check if the duration has reached zero
                if (duration <= 0) {
                    clearInterval(examTimer); // Clear the interval
                    alert("Time's up! Submitting your answers.");
                    submitExams(); // Call the submit function
                }
        
                duration--; // Decrement the duration
            }, 1000);
        }
        
        
        
// Group questions function
function groupQuestions(questions, groupSize) {
    const grouped = [];
    for (let i = 0; i < questions.length; i += groupSize) {
        grouped.push(questions.slice(i, i + groupSize));
    }
    return grouped;
}




        
        


// Function to display the questions with textareas shown by default
function displayTheoryQuestionGroup() {
    const questionListDiv = document.getElementById('theory-list');
    questionListDiv.innerHTML = ''; // Clear current questions

    // Add the title based on the current main question index
    let title;
    if (currentMainQuestionIndex === 0 || currentMainQuestionIndex === 1 || currentMainQuestionIndex === 2) {
        title = `Q${currentMainQuestionIndex + 1}) Attempt any four questions [Total-marks: 20]`;
    } else if (currentMainQuestionIndex === 3) {
        title = `Q${currentMainQuestionIndex + 1}) Attempt any five questions [Total-marks: 15]`;
    }

    // Create and append the title element
    const titleDiv = document.createElement('div');
    titleDiv.className = 'question-title';
    titleDiv.innerHTML = `<h2>${title}</h2>`;
    questionListDiv.appendChild(titleDiv);

    // Now add the questions for the current group
    const currentGroup = groupedQuestions[currentMainQuestionIndex];
    currentGroup.forEach((question, index) => {
        const alphabet = String.fromCharCode(65 + index);
        const questionDiv = document.createElement('div');
        questionDiv.className = 'theory-question';

        // Create the question header and textarea
        questionDiv.innerHTML = `
            <h3 id="question-${currentMainQuestionIndex}-${index}" class="question-header">${alphabet}) ${question.question}</h3>
            <div id="answer-section-${currentMainQuestionIndex}-${index}" class="answer-section">
                <textarea id="textarea-${currentMainQuestionIndex}-${index}" placeholder="Write your answer here..."></textarea>
            </div>
        `;

        // Pre-fill the textarea with the saved answer if it exists
        const textarea = questionDiv.querySelector(`#textarea-${currentMainQuestionIndex}-${index}`);
        const savedAnswer = answers[currentMainQuestionIndex * 6 + index];
        if (savedAnswer) {
            textarea.value = savedAnswer;
        }

        questionListDiv.appendChild(questionDiv);
    });

    // Handle navigation buttons visibility
    document.getElementById('previous-theory-btn').style.display = currentMainQuestionIndex === 0 ? 'none' : 'inline-block';
    document.getElementById('next-theory-btn').style.display = currentMainQuestionIndex === groupedQuestions.length - 1 ? 'none' : 'inline-block';
    document.getElementById('submit-theory-btn').style.display = currentMainQuestionIndex === groupedQuestions.length - 1 ? 'inline-block' : 'none';

    // Update the active question button style
    updateActiveQuestionButtons(currentMainQuestionIndex);
}


// Automatically save the answer for each question before moving to the next group
function autoSaveAnswer() {
    const currentGroup = groupedQuestions[currentMainQuestionIndex];
    currentGroup.forEach((_, index) => {
        const textarea = document.getElementById(`textarea-${currentMainQuestionIndex}-${index}`);
        if (textarea) {
            const answer = textarea.value;
            // Calculate the global index of the question and store the answer
            answers[currentMainQuestionIndex * 6 + index] = answer;
        }
    });
}


// generate pdf functions
function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let yPosition = 10; 
    const lineHeight = 10; 
    const pageHeight = 290; 
    const gapBetweenQuestions = lineHeight * 1; 

    // Assuming these variables are defined in your existing code
    const subject_name = document.getElementById('theory-subject-header').textContent.split(': ')[1]; 
    const class_name = document.getElementById('theory-class-header').textContent.split(': ')[1]; 
    const total_marks = document.getElementById('theory-total-marks').textContent.split(': ')[1];
    const username = document.getElementById('userId').textContent;
    const rollno = document.getElementById('userroll').textContent; 

    // Add subject name, class name, and total marks at the beginning
    doc.text(`Name : ${username}`,10,yPosition);
    yPosition += lineHeight;
    doc.text(`Roll_No: ${rollno}`,10,yPosition);
    yPosition += lineHeight;
    doc.text(`Subject: ${subject_name}`, 10, yPosition);
    yPosition += lineHeight;
    doc.text(`Class: ${class_name}`, 10, yPosition);
    yPosition += lineHeight;
    doc.text(`Total Marks: ${total_marks}`, 10, yPosition);
    yPosition += lineHeight * 2; // Add extra space after the header

    // Loop through each main question and its subquestions
    groupedQuestions.forEach((group, mainIndex) => {
        let title;
        if (mainIndex === 0 || mainIndex === 1 || mainIndex === 2) {
            title = `Q${mainIndex + 1}) Attempt any four questions [Total-marks: 20]`;
        } else if (mainIndex === 3) {
            title = `Q${mainIndex + 1}) Attempt any five questions [Total-marks: 15]`;
        }

        doc.text(title, 10, yPosition);
        yPosition += lineHeight;

        group.forEach((question, subIndex) => {
            const alphabet = String.fromCharCode(65 + subIndex);
            const questionText = `${alphabet}) ${question.question}`;
            const answer = answers[mainIndex * 6 + subIndex] || "No Answer";

            if (yPosition > pageHeight) {
                doc.addPage();
                yPosition = 10;
            }
            doc.text(questionText, 10, yPosition);
            yPosition += lineHeight;

            // Handle multi-line answers
            const answerLines = doc.splitTextToSize(`Answer: ${answer}`, 180);
            answerLines.forEach((line) => {
                if (yPosition > pageHeight) {
                    doc.addPage();
                    yPosition = 10;
                }
                doc.text(line, 10, yPosition);
                yPosition += lineHeight;
            });
            yPosition += gapBetweenQuestions;
        });
    });

    // Create and upload the PDF
    const pdfBlob = doc.output('blob');
    const timestamp = new Date().getTime();
    const pdfFilename = `${username}_${rollno}_${subject_name}_${class_name}_${timestamp}.pdf`;
    uploadPDF(pdfBlob, pdfFilename);
}
// Function to upload the PDF to the admin backend
function uploadPDF(pdfBlob, pdfFilename) {
    const formData = new FormData();
    formData.append('pdfFile', pdfBlob, pdfFilename); 

    fetch('http://localhost:4000/upload-pdf', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
}


        // Render the navigation buttons for question numbers
        function renderQuestionNavigations() {
            const navDiv = document.getElementById('theory-question-number-nav');
            navDiv.innerHTML = '';

            groupedQuestions.forEach((group, index) => {
                const button = document.createElement('button');
                button.textContent = index + 1;
                button.onclick = () => {
                    currentMainQuestionIndex = index;
                    displayTheoryQuestionGroup();
                };
                navDiv.appendChild(button);
            });
        }

        // Update the active question button
        function updateActiveQuestionButtons(activeIndex) {
            const buttons = document.querySelectorAll('#theory-question-number-nav button');
            buttons.forEach((button, index) => {
                if (index === activeIndex) {
                    button.classList.add('active-question');
                } else {
                    button.classList.remove('active-question');
                }
            });
        }

        // Next button click: Move to the next group of questions
        document.getElementById('next-theory-btn').onclick = function () {
            if (currentMainQuestionIndex < groupedQuestions.length - 1) {
                autoSaveAnswer(); // Auto-save the answers before navigating
                currentMainQuestionIndex++;
                displayTheoryQuestionGroup();
            }
        };

        // Previous button click: Move to the previous group of questions
        document.getElementById('previous-theory-btn').onclick = function () {
            if (currentMainQuestionIndex > 0) {
                autoSaveAnswer(); // Auto-save the answers before navigating
                currentMainQuestionIndex--;
                displayTheoryQuestionGroup();
            }
        };

        function submitExams() {
            clearInterval(examTimer); // Clear the timer
            isExamSubmitted = true; // Set the exam submitted flag
            alert('Exam submitted!');
            stopRecording();
        
            // Automatically reload the page after a short delay
            setTimeout(() => {
                window.location.reload(); // Reload the page
            }, 1000); // Delay of 1 second before reloading
        }

        document.getElementById('submit-theory-btn').addEventListener('click', () => {
            submitExams()
            autoSaveAnswer();  // Save answers before submission
            generatePDF();     // Generate PDF with the answers
        });

        // theory exam  js 