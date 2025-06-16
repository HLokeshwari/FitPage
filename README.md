UserReviewHub

UserReviewHub is a web application designed to manage user reviews for products interactively. It features a user profile page where users can view, sort, filter, and manage their reviews, enhanced with modern UI/UX elements like animations, theme switching, and accessibility features such as text-to-speech.
Table of Contents

**Overview
Features
Technologies Used
Setup Instructions
Running the Application
Usage
Testing
Project Structure
Known Issues
Future Enhancements
Contributing
License**

Overview
UserReviewHub provides an interactive platform for users to manage their product reviews. It includes features like sorting and filtering reviews, visualizing review statistics, and enhancing accessibility with voice feedback. The project was developed iteratively, with the latest updates as of June 16, 2025.
Features

User Authentication: Sign up, sign in, and sign out via API endpoints.
User Profile Display: View username, email, and reviews for the logged-in user.
Review Sorting: Sort reviews by newest, oldest, highest rating, or lowest rating.
Review Editing/Deleting: Edit or delete reviews directly from the profile page.
Formatted Timestamps: Display review timestamps in a readable format (e.g., "June 16, 2025, 11:07 PM").
Sentiment Indicators: Show an emoji and label for each review (e.g., "😊 Positive" for 4-5 stars).
Animated Review Cards: Reviews fade in with a bounce effect when the profile loads.
Review Statistics: Display total reviews, average rating, and highest-rated product.
Review Filtering: Filter reviews by rating (1-5 stars or all).
Rating Distribution Chart: A canvas-based bar chart showing the distribution of ratings.
Highlight Positive Reviews: Toggle to highlight reviews with 4-5 stars with a glowing effect.
Dynamic Theme Switching: Toggle between light and dark modes, with preferences saved in localStorage.
Voice Feedback: "Listen" button to read review text aloud using text-to-speech.

Technologies Used

Frontend:
HTML: Structure of the application
CSS (with Tailwind CSS v3.4.1): Styling, animations, and responsive design
JavaScript: Core logic, DOM manipulation, and API interactions


Backend (assumed):
Node.js: For handling API requests
RESTful API: Endpoints for authentication and review management


Dependencies:
Tailwind CSS: Utility-first CSS framework
PostCSS (v8.4.31) and Autoprefixer (v10.4.15): For CSS processing
Font Awesome: For star icons in ratings



Setup Instructions
Prerequisites

Node.js (v16 or higher) and npm installed
A code editor (e.g., VS Code)
Git (optional, for cloning)
A modern web browser (e.g., Chrome, Firefox)

Steps

Clone or Download the Project

Clone the repository:  git clone <repository-url>


Or download the project files as a ZIP and extract them.


Install Dependencies

Navigate to the project directory:  cd UserReviewHub


Install dependencies:  npm install tailwindcss@3.4.1 postcss@8.4.31 autoprefixer@10.4.15




Configure Tailwind CSS

Generate tailwind.config.js:  npx tailwindcss init


Update tailwind.config.js:  /** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./*.html', './src/**/*.{html,js}'],
    theme: {
        extend: {},
    },
    plugins: [],
};


Create postcss.config.js:  module.exports = {
    plugins: {
        tailwindcss: {},
        autoprefixer: {},
    },
};




Set Up the Backend

The app uses a backend API at http://localhost:3000/api.
Ensure the backend provides endpoints like /api/auth/me, /api/products, and /api/products/{id}/review.
If the backend is unavailable, mock these endpoints or set up a Node.js server.


Prepare the Frontend Files

Ensure index.html, src/script.js, and src/styles.css are in place as per the project structure.



Running the Application

Compile the CSS

Add a build script to package.json:  "scripts": {
    "build:css": "postcss src/styles.css -o dist/styles.css"
}


Run the build:  npm run build:css




Start the Backend Server

Ensure the backend is running on http://localhost:3000.


Serve the Frontend

Use a local server:  npx live-server


Or open index.html in a browser (some features may require a server due to CORS).


Access the Application

Navigate to http://localhost:8080 (or the port provided by your server).



Usage

Sign Up/Sign In

Click "Sign Up" or "Sign In" to authenticate.
Example credentials for testing:  
Username: Hlokeshwari  
Email: hlokeshwari14@gmail.com  
Password: (set by backend)




View Profile

After signing in, click "View Profile" to see your reviews and statistics.


Interact with Reviews

Sort reviews using the "Sort by" dropdown.
Filter reviews using the "Filter" dropdown.
Edit or delete reviews using the respective buttons.
Highlight positive reviews or toggle the theme as needed.
Click "Listen" to hear a review read aloud.



Testing
Test Scenarios

Authentication
Sign up, sign in, and sign out to verify functionality.


Profile and Reviews
View the profile, sort reviews (e.g., by highest rating), and filter by rating (e.g., 4 stars).
Edit and delete a review to confirm changes.


Advanced Features
Verify sentiment indicators, review animations, and statistics.
Check the rating distribution chart and highlight toggle.
Test theme switching and voice feedback.



Debugging

Use browser Developer Tools (F12) to check Console logs and Network requests.
Ensure Tailwind CSS is compiled correctly if styles are missing.

Project Structure
UserReviewHub/
├── index.html           # Main HTML file
├── src/
│   ├── script.js        # JavaScript logic
│   ├── styles.css       # CSS with Tailwind directives
├── dist/
│   ├── styles.css       # Compiled CSS
├── tailwind.config.js   # Tailwind CSS configuration
├── postcss.config.js    # PostCSS configuration
├── package.json         # Project metadata and scripts
└── README.md            # This file

Known Issues

Backend Dependency: Requires a running backend server at http://localhost:3000.
Voice Feedback: May not work in some browsers (e.g., older Safari versions).
Linting Errors: Tailwind CSS directives may cause linting warnings in editors. Configure your editor to ignore unknown at-rules or use PostCSS language mode.
Performance: Loading many reviews may slow down the profile page.

Future Enhancements

Add profile avatar upload.
Implement review tags.
Add a shareable profile link.
Introduce pagination for reviews.
Enhance accessibility with ARIA labels and keyboard navigation.

