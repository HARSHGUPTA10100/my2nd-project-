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

    document.getElementById('exam-btn').addEventListener('click', function() {
        removeActiveClass();
        this.classList.add('active');
        showContent('exam-content');
    });

    // Event listener for Manage Users button
    document.getElementById('Live-monitor-btn').addEventListener('click', function() {
        removeActiveClass();
        this.classList.add('active');
        showContent('live-content');
    });

    document.getElementById('Moderate-btn').addEventListener('click', function() {
        removeActiveClass();
        this.classList.add('active');
        showContent('moderate-content');
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

const addExam = document.getElementById("add-exam");
const internal = document.getElementById('Internal');
const externalexam = document.getElementById('External');

addExam.addEventListener('click', function(){
    addExam.style.display='none';
    internal.style.display='inline';
    externalexam.style.display='inline';
});


// view and pdf fetch from directroy and directly shwoing in teacher
// Modify the toggleTable function
function toggleTable(tableToShowId, apiEndpoint, tableToHideId) {
    const tableToShow = document.getElementById(tableToShowId);
    const tableToHide = document.getElementById(tableToHideId);
    const tableBodyId = `pdfTableBody${tableToShowId === 'pdfTable1' ? 1 : 2}`;
    const tableBody = document.getElementById(tableBodyId);

    // Show the selected table and hide the other table
    if (tableToShow.style.display === 'none') {
        tableToShow.style.display = 'table'; // Show the selected table
        tableToHide.style.display = 'none';  // Hide the other table
        fetchPDFs(apiEndpoint, tableBody, tableToShowId);   // Fetch PDFs for the visible table
    } else {
        tableToShow.style.display = 'none';  // If already shown, hide it
    }
}

// Fetch PDFs for the specified endpoint and table body
async function fetchPDFs(apiEndpoint, tableBody, tableToShowId) {
    const response = await fetch(apiEndpoint);
    const pdfFiles = await response.json();

    tableBody.innerHTML = ''; // Clear existing rows

    pdfFiles.forEach(file => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${file}</td>
            <td>
                <button class="viewInternal" onclick="viewPDF('${file}', 'Internal-answer')">View</button>
                <button class="viewExternal" onclick="viewPDF('${file}', 'External-answer')">View</button>
                <button onclick="deletePDF('${file}', '${apiEndpoint}')">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Hide the appropriate buttons based on the table being shown
    if (tableToShowId === 'pdfTable1') {
        document.querySelectorAll('.viewExternal').forEach(btn => btn.style.display = 'none');
    } else {
        document.querySelectorAll('.viewInternal').forEach(btn => btn.style.display = 'none');
    }
}


// Delete PDF from the specified directory
async function deletePDF(filename, apiEndpoint) {
    const response = await fetch(`${apiEndpoint}/${filename}`, {
        method: 'DELETE',
    });

    if (response.ok) {
        alert('PDF deleted successfully');
        fetchPDFs(apiEndpoint); // Refresh the list
    } else {
        alert('Error deleting PDF');
    }
}


// Function to handle PDF view
function viewPDF(filename, directory) {
    const modal = document.getElementById('pdfModal');
    const pdfFileName = document.getElementById('pdfFileName');
    const downloadButton = document.getElementById('downloadButton');
    
    // Set PDF name in modal
    pdfFileName.textContent = `File: ${filename}`;
    
    // Set the download link for the button based on the directory
    downloadButton.onclick = () => {
        window.open(`${directory}/${filename}`, '_blank');
        // Open the PDF in a new tab or initiate download
    };
    
    // Show the modal
    modal.style.display = 'block';
}

// Close the modal
const modal = document.getElementById('pdfModal');
const closeModal = document.getElementsByClassName('close')[0];

closeModal.onclick = function() {
    modal.style.display = 'none';
};

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
};



async function fetchVideos() {
    const response = await fetch('http://localhost:4000/get-videos');
    const videos = await response.json();

    const tbody = document.getElementById('videos-tbody');
    tbody.innerHTML = ''; // Clear existing rows

    videos.forEach(video => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${video.name}</td>
            <td>
                <button onclick="viewVideo('${video.url}')">View</button>
                <button onclick="deleteVideo('${video.name}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Function to view video
function viewVideo(url) {
    window.open(url, '_blank'); // Open the video in a new tab
}

// Function to delete video
async function deleteVideo(videoName) {
    const response = await fetch(`http://localhost:4000/delete-video/${videoName}`, {
        method: 'DELETE',
    });

    if (response.ok) {
        fetchVideos(); // Refresh the video list
    }
}

// Show the video table when the button is clicked
document.getElementById('show-videos-btn').addEventListener('click', async () => {
    const videosTable = document.getElementById('videos-table');
    videosTable.style.display = 'table'; // Show the table
    await fetchVideos(); // Fetch and display videos
});

// Fetch videos when the page loads
document.addEventListener('DOMContentLoaded', fetchVideos);