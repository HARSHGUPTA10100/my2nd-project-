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
    document.getElementById('Manage-User-btn').addEventListener('click', function() {
        removeActiveClass();
        this.classList.add('active');
        showContent('user-content');
    });


    // Event listener for Delete button
    document.getElementById('Live-monitor-btn').addEventListener('click', function() {
        removeActiveClass();
        this.classList.add('active');
        showContent('live-content');
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

const viewButton = document.getElementById("view-btn");
const options = document.getElementById("options");

viewButton.addEventListener("click", () => {
    if (options.style.display === "none") {
        options.style.display = "flex";
    } else {
        options.style.display = "none";
    }
});

const addButton = document.getElementById("add-btn");
const reg = document.getElementById("reg");

addButton.addEventListener("click", () => {
    if (reg.style.display === "none") {
        reg.style.display = "flex";
        viewButton.style.display = 'none';
        options.style.display= 'none'
    } else {
        reg.style.display = "none";
    }
});









/*
function addExam() {
    const examTable = document.getElementById('examTable');
    const row = examTable.insertRow();
    row.innerHTML = `
        <td>1</td>
        <td>Math Exam</td>
        <td>Mathematics</td>
        <td>2024-08-23</td>
        <td>
            <button onclick="editExam(this)">Edit</button>
            <button onclick="deleteExam(this)">Delete</button>
        </td>
    `;
}

    
function editUser(button) {
    // Edit user functionality here
    alert('Edit user functionality to be implemented.');
}

function deleteUser(button) {
    // Delete user functionality here
    const row = button.parentElement.parentElement;
    row.remove();
}

function editExam(button) {
    // Edit exam functionality here
    alert('Edit exam functionality to be implemented.');
}

function deleteExam(button) {
    // Delete exam functionality here
    const row = button.parentElement.parentElement;
    row.remove();
}

*/


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
            <h3>${notice.title}</h3> <p>${notice.content}</p>
            <button class="delete-notice" onclick="deleteNotice('${notice._id}')">Delete</button>
        `;
        container.appendChild(noticeElement);
    });
}
async function deleteNotice(noticeId) {
    const response = await fetch(`/notices/${noticeId}`, { method: 'DELETE' });
    const result = await response.json();
    
    if (response.ok) {
        alert("Notice deleted successfully!");

      // Remove the deleted notice from the DOM instantly
      let noticeElement = document.getElementById(`notice-${noticeId}`);
      noticeElement.remove();
    } else {
        alert(result.error || "An error occurred while deleting the notice.");
    }
  }
/* fetch notice form mongodb*/

function removeStudent(roll_no, department) {
    if (confirm(`Are you sure you want to remove the student with roll number ${roll_no}?`)) {
        fetch(`/remove-student/${department}/${roll_no}`, { method: 'DELETE' })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to remove student');
                }
                // Refresh the student list after successful deletion
                getStudents(department); // Assuming you have a function to fetch and display students
            })
            .catch(error => console.error('Error removing student:', error));
    }
}

