// Extracted JavaScript from student_toolkit.html

// GLOBAL CONFIGURATION
let subjectCount = 0;
const MAX_SUBJECTS = 10;
const gradeMap = {
    's': 10, 'a': 9, 'b': 8, 'c': 7, 'd': 6, 'e': 5, 'f': 0
};
// *** IMPORTANT: Placeholder email for receiving feedback. Please update this with your actual Gmail address. ***
const RECIPIENT_EMAIL = "k.madangopal02@gmail.com"; 


// ====================================================================
// INITIAL SETUP & CGPA ENTER KEY LOGIC
// ====================================================================

window.onload = function() {
    // Initialize Lucide icons after DOM is ready
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Add initial 10 subject rows as requested
    for (let i = 0; i < MAX_SUBJECTS; i++) {
        addSubjectRow();
    }
    
    // Add Enter key listener for custom navigation flow in CGPA module
    document.getElementById('subjectInputs').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Stop default form submission 
            const currentInput = event.target;
            const dataType = currentInput.getAttribute('data-type');
            const currentRow = currentInput.closest('.subject-grid');
            
            if (!currentRow || !dataType) return;

            // Note the swapped logic:
            if (dataType === 'grade') {
                // User enters Grade, presses Enter: Jump to Credit in the SAME row
                const creditInput = currentRow.querySelector('[data-type="credit"]');
                if (creditInput) {
                    creditInput.focus();
                }
            } else if (dataType === 'credit') {
                // User enters Credit, presses Enter: Jump to Grade in the NEXT row
                const nextRow = currentRow.nextElementSibling;
                if (nextRow) {
                    const nextGradeInput = nextRow.querySelector('[data-type="grade"]');
                    if (nextGradeInput) {
                        nextGradeInput.focus();
                    }
                } else {
                    // If it's the last row, calculate SGPA
                    calculateSGPA();
                }
            }
        }
    });

    // Disable Add Subject button as we start at max (10)
    const addButton = document.getElementById('addSubjectBtn');
    if (addButton) {
        addButton.disabled = true;
        addButton.classList.remove('bg-gray-200', 'hover:bg-gray-300');
        addButton.classList.add('bg-gray-400', 'cursor-not-allowed');
    }
};

// ====================================================================
// CORE NAVIGATION LOGIC
// ====================================================================
function showPage(pageId) {
    document.querySelectorAll('.page-content').forEach(section => {
        section.classList.remove('block');
        section.classList.add('hidden');
    });

    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.classList.remove('hidden');
        activePage.classList.add('block');
        document.getElementById('app-container').scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        console.error(`Page ID "${pageId}" not found.`);
    }
    // Re-render icons for the newly shown page
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}


// ====================================================================
// 1. ATTENDANCE CALCULATOR LOGIC
// ====================================================================
function calculateAttendance() {
    const attendedClasses = parseInt(document.getElementById('attendedClasses').value);
    const totalClasses = parseInt(document.getElementById('totalClasses').value);
    const minPercentage = parseInt(document.getElementById('minPercentage').value) / 100;
    const resultDiv = document.getElementById('attendanceResult');
    let resultHTML = '';

    if (isNaN(attendedClasses) || isNaN(totalClasses) || totalClasses <= 0 || attendedClasses < 0 || attendedClasses > totalClasses || isNaN(minPercentage) || minPercentage < 0 || minPercentage > 1) {
        resultHTML = '<p class="text-red-600 font-semibold">Please enter valid and logical values for classes and percentage.</p>';
        resultDiv.innerHTML = resultHTML;
        resultDiv.classList.remove('hidden');
        return;
    }

    const currentPercentage = (attendedClasses / totalClasses) * 100;
    const statusColor = currentPercentage >= (minPercentage * 100) ? 'text-green-600' : 'text-red-600';
    
    resultHTML += `<p class="mb-4">Your current attendance: <span class="text-xl font-bold ${statusColor}">${currentPercentage.toFixed(2)}%</span> (Target: ${(minPercentage * 100).toFixed(0)}%)</p>`;

    // A) Classes to Bunk (Afford to Leave)
    const maxClassesToBunkRaw = (attendedClasses / minPercentage) - totalClasses;
    const maxClassesToBunk = Math.floor(Math.max(0, maxClassesToBunkRaw));

    if (maxClassesToBunk > 0) {
        resultHTML += `
            <p class="text-base text-gray-700 mt-2">
                <i data-lucide="check-circle" class="w-4 h-4 inline-block primary-color mr-1"></i>
                You can afford to **leave ${maxClassesToBunk}** classes and still maintain at least **${(minPercentage * 100).toFixed(0)}%** attendance.
            </p>`;
    } else {
        // B) Classes to Attend (to maintain / reach target)
        const requiredAttendedClassesRaw = (minPercentage * totalClasses - attendedClasses) / (1 - minPercentage);
        const classesToAttend = Math.ceil(Math.max(0, requiredAttendedClassesRaw));

        if (classesToAttend > 0) {
            resultHTML += `
                <p class="text-base text-gray-700 mt-2">
                    <i data-lucide="alert-triangle" class="w-4 h-4 inline-block text-red-500 mr-1"></i>
                    You must **attend ${classesToAttend}** classes consecutively without missing to bring your attendance up to **${(minPercentage * 100).toFixed(0)}%**.
                </p>`;
        } else {
             resultHTML += `
                <p class="text-base text-gray-700 mt-2">
                    <i data-lucide="thumbs-up" class="w-4 h-4 inline-block text-green-600 mr-1"></i>
                    Great job! You currently meet the **${(minPercentage * 100).toFixed(0)}%** attendance requirement.
                </p>`;
        }
    }

    resultDiv.innerHTML = resultHTML;
    resultDiv.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ====================================================================
// 2. CGPA/SGPA CALCULATOR LOGIC
// ====================================================================

function addSubjectRow() {
    // Note: Since we are loading MAX_SUBJECTS (10) on window.onload,
    // this function is mostly used during initial load, and the button
    // is disabled after, fulfilling the "10 columns" requirement initially.
    if (subjectCount >= MAX_SUBJECTS) {
        return;
    }
    subjectCount++;

    const container = document.getElementById('subjectInputs');
    const newRow = document.createElement('div');
    // Consistent class for 3-column grid alignment
    newRow.className = 'subject-grid items-center'; 
    newRow.id = `subject-row-${subjectCount}`;

    // Subject Number element
    const subjectNum = `<p class="text-gray-500 font-medium text-left">Subject ${subjectCount}</p>`;
    
    // Grade Input (First input after subject number, data-type="grade")
    const gradeInput = `
        <input type="text" data-type="grade" class="app-input text-center text-sm uppercase" placeholder="Grade (S-F)" maxlength="1">
    `;

    // Credit Input (Second input after subject number, data-type="credit")
    const creditInput = `
        <input type="number" data-type="credit" class="app-input text-center text-sm" placeholder="Credits (e.g., 4.5)" min="0" step="0.5">
    `;

    // Visual order: Subject # | Grade | Credit (Swapped rows as requested)
    newRow.innerHTML = subjectNum + gradeInput + creditInput; 
    container.appendChild(newRow);
}

function calculateSGPA() {
    const resultDiv = document.getElementById('sgpaResult');
    let totalWeightedPoints = 0;
    let totalCredits = 0;
    let error = false;
    let failed = false;

    // Clear previous result display if recalculating
    resultDiv.classList.add('hidden');
    resultDiv.innerHTML = '';


    const rows = document.getElementById('subjectInputs').querySelectorAll('.subject-grid');

    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        
        // Select inputs by their data-type for reliable identification
        const creditInput = row.querySelector('[data-type="credit"]');
        const gradeInput = row.querySelector('[data-type="grade"]');

        const subjectNumber = index + 1;
        
        const credit = parseFloat(creditInput.value); 
        const gradeText = gradeInput.value.toLowerCase().trim();
        const gradePoint = gradeMap[gradeText];

        // Check if the row is intended to be used (has any non-empty value)
        if ((creditInput.value.trim() !== "") || (gradeInput.value.trim() !== "")) {

            // Input Validation: Check if Credit is a valid positive number
            if (isNaN(credit) || credit <= 0) {
                 resultDiv.innerHTML = `<p class="text-red-600 font-semibold">Error in Subject ${subjectNumber}: Please enter a valid Credit value (e.g., 4 or 4.5).</p>`;
                 error = true;
                 break;
            }
            
            // Input Validation: Check if Grade is valid
            if (gradePoint === undefined) {
                resultDiv.innerHTML = `<p class="text-red-600 font-semibold">Error in Subject ${subjectNumber}: Invalid grade entered. Use S, A, B, C, D, E, or F.</p>`;
                error = true;
                break;
            }

            if (gradePoint === 0) { // 'F' Grade results in semester failure
                failed = true;
            }

            totalCredits += credit;
            totalWeightedPoints += credit * gradePoint;
        }
    } // End of loop

    if (error) {
        resultDiv.classList.remove('hidden');
        return;
    }

    if (failed) {
        resultDiv.innerHTML = `
            <p class="text-xl font-bold text-red-600 flex items-center">
                <i data-lucide="alert-triangle" class="w-6 h-6 mr-2"></i> Result: FAIL
            </p>
            <p class="text-gray-700 mt-2">An 'F' grade (0 points) was entered. This semester result is **FAIL**.</p>
        `;
    } else if (totalCredits > 0) {
        const sgpa = (totalWeightedPoints / totalCredits).toFixed(2);
        document.getElementById('sgpa1Input').value = sgpa; // Auto-populate for CGPA calculation
        resultDiv.innerHTML = `
            <p class="text-gray-700">Total Credits: <span class="font-semibold">${totalCredits.toFixed(1)}</span></p>
            <p class="text-gray-700">Total Weighted Points: <span class="font-semibold">${totalWeightedPoints.toFixed(2)}</span></p>
            <p class="text-2xl font-bold text-green-600 mt-3">SGPA: ${sgpa}</p>
        `;
    } else {
         resultDiv.innerHTML = `<p class="text-red-600 font-semibold">Please enter at least one subject's Credit and Grade to calculate SGPA.</p>`;
    }

    resultDiv.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function calculateCGPA() {
    const sgpa1 = parseFloat(document.getElementById('sgpa1Input').value);
    const sgpa2 = parseFloat(document.getElementById('sgpa2Input').value);
    const resultDiv = document.getElementById('cgpaResult');
    let resultHTML = '';

    if (isNaN(sgpa1) || isNaN(sgpa2) || sgpa1 < 0 || sgpa1 > 10 || sgpa2 < 0 || sgpa2 > 10) {
        resultHTML = '<p class="text-red-600 font-semibold">Please enter valid SGPA values (0.00 - 10.00) for both semesters.</p>';
    } else {
        const cgpa = ((sgpa1 + sgpa2) / 2).toFixed(2);
        resultHTML = `
            <p class="text-gray-700">SGPA 1: <span class="font-semibold">${sgpa1.toFixed(2)}</span>, SGPA 2: <span class="font-semibold">${sgpa2.toFixed(2)}</span></p>
            <p class="text-2xl font-bold primary-color mt-3">CGPA: ${cgpa}</p>
            <p class="text-sm text-gray-500 mt-1">This is an average of the two semester GPAs.</p>
        `;
    }

    resultDiv.innerHTML = resultHTML;
    resultDiv.classList.remove('hidden');
}


// ====================================================================
// 3. MARKS CALCULATOR LOGIC (80/20 Internal Rule)
// ====================================================================
function calculateMarks() {
    const mid1Score = parseFloat(document.getElementById('mid1Score').value);
    const resultDiv = document.getElementById('marksResult');
    let resultHTML = '';
    
    const MAX_MID_MARKS = 30;
    const REQUIRED_INTERNAL = 16;
    const PASS_TOTAL_MARKS = 40;
    const BEST_WEIGHT = 0.8;
    const WORST_WEIGHT = 0.2;

    if (isNaN(mid1Score) || mid1Score < 0 || mid1Score > MAX_MID_MARKS) {
        resultHTML = '<p class="text-red-600 font-semibold">Please enter a valid score for the First Mid Exam (0-30).</p>';
        resultDiv.innerHTML = resultHTML;
        resultDiv.classList.remove('hidden');
        return;
    }

    // A. Check for automatic 16 marks guarantee
    if (mid1Score >= 20) {
        resultHTML = `
            <p class="text-lg font-bold text-green-700 mb-3">Excellent Performance!</p>
            <p class="text-gray-700 space-y-3">
                <i data-lucide="check-circle" class="w-4 h-4 inline-block text-green-600 mr-1"></i>
                Your score of **${mid1Score} / 30** in the First Mid is high enough to automatically secure the full **${REQUIRED_INTERNAL} internal marks**.
            </p>
            <p class="mt-4 font-semibold primary-color">Required Scores to Pass (Total ${PASS_TOTAL_MARKS}):</p>
            <ul class="list-disc list-inside ml-4 space-y-1 text-gray-700">
                <li>**Second Mid:** You can treat the Second Mid as **practice** or aim for a higher score for better grades. Even 0 marks will secure your internal score.</li>
                <li>**Final Semester Exam:** You must score at least **${PASS_TOTAL_MARKS - REQUIRED_INTERNAL} marks** to achieve the minimum pass mark of ${PASS_TOTAL_MARKS}.</li>
            </ul>
        `;
    } else {
        // B. Mid 1 < 20. Calculate required score for Mid 2 to secure 16 internal marks.
        // Assuming Mid 2 becomes the BEST score (B) and Mid 1 is the WORST score (W).
        const requiredMid2ScoreRaw = (REQUIRED_INTERNAL - (WORST_WEIGHT * mid1Score)) / BEST_WEIGHT;
        const requiredMid2Score = parseFloat(requiredMid2ScoreRaw.toFixed(2));
        
        let finalResult;

        if (requiredMid2Score > MAX_MID_MARKS) {
            const achievedInternal = (BEST_WEIGHT * MAX_MID_MARKS + WORST_WEIGHT * mid1Score).toFixed(2);
            finalResult = `
                <p class="text-lg font-bold text-red-700 mb-3">Warning: Internal Marks at Risk</p>
                <p class="text-gray-700 space-y-3">
                    <i data-lucide="x-circle" class="w-4 h-4 inline-block text-red-600 mr-1"></i>
                    Based on your First Mid score of ${mid1Score}, it is **mathematically impossible** to secure the full 16 internal marks.
                </p>
                <p class="mt-4 font-semibold primary-color">Action Required:</p>
                <ul class="list-disc list-inside ml-4 space-y-1 text-gray-700">
                    <li>Score the maximum in the Second Mid (30). This will secure **${achievedInternal} internal marks**.</li>
                    <li>You must score **${PASS_TOTAL_MARKS - achievedInternal}** in the Final Semester Exam to pass (40 total).</li>
                </ul>
            `;
        } else {
            finalResult = `
                <p class="text-lg font-bold text-yellow-700 mb-3">Action Plan Required</p>
                <p class="text-gray-700 space-y-3">
                    <i data-lucide="trending-up" class="w-4 h-4 inline-block primary-color mr-1"></i>
                    To secure the maximum **${REQUIRED_INTERNAL} internal marks**, you must score at least:
                </p>
                <ul class="list-disc list-inside ml-4 space-y-1 text-gray-700">
                    <li>**Second Mid:** **${requiredMid2Score.toFixed(2)} marks** (out of 30). *This score must be higher than ${mid1Score} for this calculation to hold true.*</li>
                    <li>**Final Semester Exam:** You must score at least **${PASS_TOTAL_MARKS - REQUIRED_INTERNAL} marks** to achieve the minimum pass mark of ${PASS_TOTAL_MARKS}.</li>
                </ul>
            `;
        }
        resultHTML = finalResult;
    }

    resultDiv.innerHTML = resultHTML;
    resultDiv.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ====================================================================
// 5. FEEDBACK LOGIC (Mailto Implementation)
// ====================================================================
/**
 * Sends feedback using the mailto protocol, which launches the user's
 * default email client with pre-filled content.
 * NOTE: Direct email sending is not possible in a client-side environment.
 */
function submitFeedback() {
    const textarea = document.getElementById('feedbackTextarea');
    const feedbackMessage = document.getElementById('feedbackMessage');
    const feedback = textarea.value.trim();

    if (feedback.length < 10) {
         feedbackMessage.innerHTML = 'Please write a suggestion longer than 10 characters.';
         feedbackMessage.classList.remove('hidden', 'text-green-600');
         feedbackMessage.classList.add('text-red-600');
         return;
    }

    // Encode the feedback for the URL
    const subject = encodeURIComponent("Scholar Companion App Feedback");
    const body = encodeURIComponent(`Feedback from user:\n\n${feedback}\n\n---`);

    const mailtoLink = `mailto:${RECIPIENT_EMAIL}?subject=${subject}&body=${body}`;
    
    // Open the mail client
    window.location.href = mailtoLink;

    // Show temporary success message
    feedbackMessage.innerHTML = 'Launching your default email client with the feedback...';
    feedbackMessage.classList.remove('hidden', 'text-red-600');
    feedbackMessage.classList.add('text-green-600');
    
    // Clear the textarea after attempt
    setTimeout(() => {
        textarea.value = '';
        feedbackMessage.classList.add('hidden');
    }, 5000); 
}
