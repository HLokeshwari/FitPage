# Ratings and Review System

## Setup Instructions

1. **Prerequisites**:
   - Node.js (v14 or higher)
   - MySQL (v8 or higher)
   - Git

2. **Backend Setup**:
   ```bash
   cd backend
   npm install





Update db.js with your MySQL credentials (host, user, password).



Create the database and tables by running schema.sql in MySQL:

mysql -u root -p < database/schema.sql



Start the backend server:

npm start





Frontend Setup:





Serve the frontend directory using a simple HTTP server (e.g., http-server or Python's http.server):

cd frontend
python -m http.server 8000



Access the frontend at http://localhost:8000.



Testing:





Open the frontend in a browser.



Enter a User ID, rating (1-5), and/or review text for a product.



Submit to see the review added and average rating updated.



Try submitting multiple reviews with the same User ID to verify the unique constraint.



Features Implemented:





Users can submit ratings (1-5) and/or reviews for products.



Basic validations: User ID required, rating must be 1-5, at least one of rating/review required.



Prevents multiple reviews from the same user for a product.



Displays average rating and review count per product.



Shows all reviews for each product.



