document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    loadProducts();

    document.getElementById('signin-btn').addEventListener('click', () => openAuthModal('Sign In'));
    document.getElementById('signup-btn').addEventListener('click', () => openAuthModal('Sign Up'));
    document.getElementById('close-modal').addEventListener('click', closeAuthModal);
    document.getElementById('auth-form').addEventListener('submit', handleAuthSubmit);
    document.getElementById('close-profile')?.addEventListener('click', closeUserProfile);

    // Set initial theme based on local storage
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.classList.add(savedTheme);
});

let allProducts = []; // Store all products for search filtering

async function checkAuthStatus() {
    try {
        console.log('Checking auth status...');
        const response = await fetch('http://localhost:3000/api/auth/me', { credentials: 'include' });
        console.log('Auth response status:', response.status);
        if (response.ok) {
            const { user } = await response.json();
            console.log('User data:', user);
            updateAuthSection(user);
            sessionStorage.setItem('userId', user.id); // Store user ID for review editing/deleting
        } else {
            console.log('Not authenticated, status:', response.status);
            sessionStorage.removeItem('userId');
            updateAuthSection(null);
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
    }
}

function updateAuthSection(user) {
    const authSection = document.getElementById('auth-section');
    if (user) {
        authSection.innerHTML = `
            <span class="text-gray-800 dark:text-gray-200 mr-2">Welcome, ${user.username}</span>
            <button id="profile-btn" class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 mr-2">View Profile</button>
            <button id="signout-btn" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Sign Out</button>
        `;
        document.getElementById('signout-btn').addEventListener('click', async () => {
            await fetch('http://localhost:3000/api/auth/signout', { method: 'POST', credentials: 'include' });
            window.location.reload();
        });
        document.getElementById('profile-btn').addEventListener('click', () => showUserProfile(user));
    } else {
        authSection.innerHTML = `
            <button id="signin-btn" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Sign In</button>
            <button id="signup-btn" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-2">Sign Up</button>
        `;
        document.getElementById('signin-btn').addEventListener('click', () => openAuthModal('Sign In'));
        document.getElementById('signup-btn').addEventListener('click', () => openAuthModal('Sign Up'));
    }
}

function capitalizeUsername(username) {
    return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
}

function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
}

function getSentimentIndicator(rating) {
    if (rating >= 4) return '<span class="text-green-500">😊 Positive</span>';
    if (rating === 3) return '<span class="text-yellow-500">😐 Neutral</span>';
    return '<span class="text-red-500">😞 Negative</span>';
}

function calculateReviewStats(reviews) {
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 ? (reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / totalReviews).toFixed(1) : 0;
    const highestRated = reviews.reduce((max, review) => (review.rating || 0) > (max.rating || 0) ? review : max, reviews[0] || {});
    const ratingDistribution = Array(5).fill(0); // [1-star, 2-star, ..., 5-star]
    reviews.forEach(review => {
        if (review.rating) ratingDistribution[review.rating - 1]++;
    });
    return { totalReviews, avgRating, highestRated, ratingDistribution };
}

function drawRatingChart(ratingDistribution) {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');

    const barWidth = 40;
    const maxHeight = 100;
    const maxCount = Math.max(...ratingDistribution, 1); // Avoid division by 0

    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ratingDistribution.forEach((count, index) => {
        const height = (count / maxCount) * maxHeight;
        ctx.fillStyle = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'][index];
        ctx.fillRect(index * (barWidth + 10) + 20, 120 - height, barWidth, height);
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${index + 1}★`, index * (barWidth + 10) + 40, 140);
        ctx.fillText(count, index * (barWidth + 10) + 40, 110 - height);
    });

    return canvas.outerHTML;
}

function sortUserReviews(reviews, sortBy) {
    let sortedReviews = [...reviews];
    if (sortBy === 'highest') {
        sortedReviews.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'lowest') {
        sortedReviews.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    } else if (sortBy === 'newest') {
        sortedReviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'oldest') {
        sortedReviews.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }
    return sortedReviews;
}

function filterUserReviews(reviews, ratingFilter) {
    if (ratingFilter === 'all') return reviews;
    return reviews.filter(review => review.rating === parseInt(ratingFilter));
}

function speakReview(reviewText) {
    const utterance = new SpeechSynthesisUtterance(reviewText);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    speechSynthesis.speak(utterance);
}

async function showUserProfile(user) {
    try {
        // Fetch user details (email) and products with reviews
        const [userDetails, products] = await Promise.all([
            fetch('http://localhost:3000/api/auth/me', { credentials: 'include' }).then(res => res.json()),
            fetch('http://localhost:3000/api/products').then(res => res.json())
        ]);

        console.log('User details:', userDetails);
        console.log('Products:', products);
        console.log('User ID from session:', user.id, 'Type:', typeof user.id);

        if (!userDetails.user) {
            throw new Error('User details not found in response');
        }

        // Collect user reviews from the products
        const userReviews = [];
        products.forEach(product => {
            product.reviews.forEach(review => {
                console.log(`Review user_id: ${review.user_id}, Type: ${typeof review.user_id}`);
                console.log(`Session user_id: ${user.id}, Type: ${typeof user.id}`);
                const reviewUserId = Number(review.user_id);
                const sessionUserId = Number(user.id);
                console.log(`Converted - Review user_id: ${reviewUserId}, Session user_id: ${sessionUserId}`);
                if (reviewUserId === sessionUserId) {
                    userReviews.push({ ...review, productName: product.name });
                } else {
                    console.log(`No match: ${reviewUserId} !== ${sessionUserId}`);
                }
            });
        });

        console.log('User reviews found:', userReviews);

        const profileSection = document.getElementById('user-profile');
        const profileDetails = document.getElementById('profile-details');
        const userReviewsDiv = document.getElementById('user-reviews');

        const formattedUsername = capitalizeUsername(user.username);
        profileDetails.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <div>
                    <p class="mb-2"><strong>Username:</strong> ${formattedUsername}</p>
                    <p class="mb-2"><strong>Email:</strong> ${userDetails.user.email || 'Not available'}</p>
                </div>
                <button id="theme-toggle" class="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300">
                    <span class="theme-icon">🌙</span>
                </button>
            </div>
        `;

        // Calculate review statistics and draw chart
        const stats = calculateReviewStats(userReviews);
        const statsSection = `
            <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-4">
                <h3 class="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">Review Statistics</h3>
                <p class="text-gray-600 dark:text-gray-300">Total Reviews: ${stats.totalReviews}</p>
                <p class="text-gray-600 dark:text-gray-300">Average Rating: ${stats.avgRating} stars</p>
                <p class="text-gray-600 dark:text-gray-300">Highest Rated Product: ${stats.highestRated.productName || 'N/A'} (${stats.highestRated.rating || 0} stars)</p>
                <div class="mt-2 flex justify-center">${drawRatingChart(stats.ratingDistribution)}</div>
            </div>
        `;

        // Add sorting, filtering, and highlight controls
        const controlsSection = `
            <div class="flex justify-between items-center mb-4">
                <div class="flex items-center">
                    <h3 class="text-lg font-medium text-gray-700 dark:text-gray-200 mr-4">Your Reviews</h3>
                    <select id="sort-reviews" class="p-1 border rounded mr-2 dark:bg-gray-700 dark:text-gray-200">
                        <option value="newest">Sort by: Newest</option>
                        <option value="oldest">Sort by: Oldest</option>
                        <option value="highest">Sort by: Highest Rating</option>
                        <option value="lowest">Sort by: Lowest Rating</option>
                    </select>
                    <select id="filter-reviews" class="p-1 border rounded dark:bg-gray-700 dark:text-gray-200">
                        <option value="all">Filter: All Ratings</option>
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1">1 Star</option>
                    </select>
                </div>
                <button id="highlight-toggle" class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">Highlight Positive</button>
            </div>
        `;

        // Render reviews with sorting, filtering, and highlighting
        const renderReviews = (reviewsToRender, highlightPositive = false) => {
            userReviewsDiv.innerHTML = statsSection + controlsSection + (reviewsToRender.length > 0 ? reviewsToRender.map((review, index) => `
                <div class="review bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-2 opacity-0 animate-[fadeInUp_0.5s_ease-out_forwards] ${highlightPositive && review.rating >= 4 ? 'highlight-positive' : ''}" style="animation-delay: ${index * 100}ms;">
                    <p class="text-gray-800 dark:text-gray-200 mb-1"><strong>Product:</strong> ${review.productName}</p>
                    <p class="text-gray-800 dark:text-gray-200 mb-1"><strong>Rating:</strong> ${review.rating ? '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating) : 'No rating'} (${getSentimentIndicator(review.rating)})</p>
                    <p class="text-gray-600 dark:text-gray-400">${review.review_text}</p>
                    <p class="text-gray-500 dark:text-gray-500 text-sm mt-1">Posted on: ${formatDate(review.created_at)}</p>
                    <div class="mt-2 flex space-x-2">
                        <button onclick="editReview(${review.product_id}, ${review.rating}, '${review.review_text}')" class="text-blue-500 hover:underline">Edit</button>
                        <button onclick="deleteReview(${review.product_id})" class="text-red-500 hover:underline">Delete</button>
                        <button onclick="speakReview('${review.review_text}')" class="text-green-500 hover:underline">Listen</button>
                    </div>
                </div>
            `).join('') : '<p class="text-gray-600 dark:text-gray-400">No reviews yet.</p>');

            // Add event listeners for controls
            document.getElementById('sort-reviews').addEventListener('change', (e) => {
                const ratingFilter = document.getElementById('filter-reviews').value;
                let filteredReviews = filterUserReviews(userReviews, ratingFilter);
                const sortedReviews = sortUserReviews(filteredReviews, e.target.value);
                const highlightPositive = document.getElementById('highlight-toggle').classList.contains('active');
                renderReviews(sortedReviews, highlightPositive);
            });

            document.getElementById('filter-reviews').addEventListener('change', (e) => {
                const sortBy = document.getElementById('sort-reviews').value;
                let filteredReviews = filterUserReviews(userReviews, e.target.value);
                const sortedReviews = sortUserReviews(filteredReviews, sortBy);
                const highlightPositive = document.getElementById('highlight-toggle').classList.contains('active');
                renderReviews(sortedReviews, highlightPositive);
            });

            const highlightToggle = document.getElementById('highlight-toggle');
            highlightToggle.addEventListener('click', () => {
                const isActive = highlightToggle.classList.toggle('active');
                highlightToggle.textContent = isActive ? 'Clear Highlight' : 'Highlight Positive';
                highlightToggle.classList.toggle('bg-blue-500', !isActive);
                highlightToggle.classList.toggle('bg-gray-500', isActive);
                const sortBy = document.getElementById('sort-reviews').value;
                const ratingFilter = document.getElementById('filter-reviews').value;
                let filteredReviews = filterUserReviews(userReviews, ratingFilter);
                const sortedReviews = sortUserReviews(filteredReviews, sortBy);
                renderReviews(sortedReviews, isActive);
            });

            // Theme toggle
            document.getElementById('theme-toggle').addEventListener('click', () => {
                const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
                const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                document.documentElement.classList.remove(currentTheme);
                document.documentElement.classList.add(newTheme);
                localStorage.setItem('theme', newTheme);
                const themeIcon = document.querySelector('.theme-icon');
                themeIcon.textContent = newTheme === 'light' ? '🌙' : '☀️';
            });
        };

        // Initial render with default sort (newest), no filter, and no highlight
        let initialFilteredReviews = filterUserReviews(userReviews, 'all');
        const initialSortedReviews = sortUserReviews(initialFilteredReviews, 'newest');
        renderReviews(initialSortedReviews, false);

        profileSection.classList.remove('hidden');
        document.getElementById('products').classList.add('hidden');
    } catch (error) {
        console.error('Error loading user profile:', error);
        alert(`Error loading user profile: ${error.message}`);
    }
}

function closeUserProfile() {
    document.getElementById('user-profile').classList.add('hidden');
    document.getElementById('products').classList.remove('hidden');
}

function openAuthModal(type) {
    const modal = document.getElementById('auth-modal');
    const title = document.getElementById('modal-title');
    const submitBtn = document.getElementById('auth-submit');
    const usernameField = document.getElementById('username-field');
    
    title.textContent = type;
    submitBtn.textContent = type;
    usernameField.classList.toggle('hidden', type === 'Sign In');
    modal.classList.remove('hidden');
}

function closeAuthModal() {
    document.getElementById('auth-modal').classList.add('hidden');
    document.getElementById('auth-form').reset();
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    const type = document.getElementById('modal-title').textContent;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value;

    try {
        const endpoint = type === 'Sign In' ? '/signin' : '/signup';
        const body = type === 'Sign In' ? { email, password } : { username, email, password };

        const response = await fetch(`http://localhost:3000/api/auth${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            closeAuthModal();
            window.location.reload();
        } else {
            console.error(`[${type}] Backend error:`, data);
            alert(data.error || `Unexpected error during ${type}`);
        }
    } catch (error) {
        console.error(`[${type}] Network error:`, error);
        alert(`Network error during ${type}`);
    }
}

async function loadProducts(productsToDisplay = null) {
    try {
        const products = productsToDisplay || await fetch('http://localhost:3000/api/products').then(res => res.json());
        allProducts = products; // Store all products for search
        const productsContainer = document.getElementById('products');
        productsContainer.innerHTML = '';

        products.forEach(product => {
            const productDiv = document.createElement('div');
            productDiv.className = 'bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md';
            productDiv.innerHTML = `
                <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">${product.name}</h2>
                <p class="text-gray-600 dark:text-gray-400">Average Rating: ${product.avg_rating.toFixed(1)} (${product.rating_count} reviews)</p>
                <div class="review-form mt-4">
                    <div class="star-rating mb-2" data-product-id="${product.id}">
                        <i class="far fa-star" data-value="1"></i>
                        <i class="far fa-star" data-value="2"></i>
                        <i class="far fa-star" data-value="3"></i>
                        <i class="far fa-star" data-value="4"></i>
                        <i class="far fa-star" data-value="5"></i>
                    </div>
                    <textarea id="review-${product.id}" class="w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-200" placeholder="Your review"></textarea>
                    <button onclick="submitReview(${product.id})" class="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Submit Review</button>
                </div>
                <div class="mt-4 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-gray-700 dark:text-gray-200">Reviews:</h3>
                    <select onchange="sortReviews(${product.id}, this.value)" class="p-1 border rounded dark:bg-gray-700 dark:text-gray-200">
                        <option value="newest">Sort by: Newest</option>
                        <option value="oldest">Sort by: Oldest</option>
                        <option value="highest">Sort by: Highest Rating</option>
                        <option value="lowest">Sort by: Lowest Rating</option>
                    </select>
                </div>
                <div class="reviews space-y-4 mt-2" id="reviews-${product.id}">
                    ${product.reviews.map(review => `
                        <div class="review bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <p class="text-gray-800 dark:text-gray-200"><strong>${review.username}</strong>: 
                                ${review.rating ? `<span>${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>` : ''}</p>
                            <p class="text-gray-600 dark:text-gray-400">${review.review_text}</p>
                            ${review.user_id === (sessionStorage.getItem('userId') || 0) ? `
                                <button onclick="editReview(${product.id}, ${review.rating}, '${review.review_text}')" class="text-blue-500 mr-2">Edit</button>
                                <button onclick="deleteReview(${product.id})" class="text-red-500">Delete</button>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
            productsContainer.appendChild(productDiv);

            // Add star rating event listeners
            const starRating = productDiv.querySelector('.star-rating');
            starRating.addEventListener('click', (e) => {
                if (e.target.classList.contains('fa-star')) {
                    const value = parseInt(e.target.dataset.value);
                    const stars = starRating.querySelectorAll('.fa-star');
                    stars.forEach((star, index) => {
                        star.classList.toggle('fas', index < value);
                        star.classList.toggle('far', index >= value);
                    });
                }
            });
        });
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function sortReviews(productId, sortBy) {
    const product = allProducts.find(p => p.id === productId);
    const reviewsContainer = document.getElementById(`reviews-${productId}`);
    let sortedReviews = [...product.reviews];

    if (sortBy === 'newest') {
        sortedReviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'oldest') {
        sortedReviews.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortBy === 'highest') {
        sortedReviews.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'lowest') {
        sortedReviews.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    }

    reviewsContainer.innerHTML = sortedReviews.map(review => `
        <div class="review bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p class="text-gray-800 dark:text-gray-200"><strong>${review.username}</strong>: 
                ${review.rating ? `<span>${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>` : ''}</p>
            <p class="text-gray-600 dark:text-gray-400">${review.review_text}</p>
            ${review.user_id === (sessionStorage.getItem('userId') || 0) ? `
                <button onclick="editReview(${product.id}, ${review.rating}, '${review.review_text}')" class="text-blue-500 mr-2">Edit</button>
                <button onclick="deleteReview(${product.id})" class="text-red-500">Delete</button>
            ` : ''}
        </div>
    `).join('');
}

function searchProducts() {
    const searchTerm = document.getElementById('search-bar').value.toLowerCase();
    const filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm)
    );
    loadProducts(filteredProducts);
}

async function submitReview(productId) {
    const rating = document.querySelector(`.star-rating[data-product-id="${productId}"] .fas`)?.dataset.value || null;
    const reviewText = document.getElementById(`review-${productId}`).value;

    try {
        const response = await fetch(`http://localhost:3000/api/products/${productId}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating, review_text: reviewText }),
            credentials: 'include'
        });
        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            window.location.reload();
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Error submitting review');
    }
}

async function editReview(productId, currentRating, currentReviewText) {
    const newRating = prompt('Enter new rating (1-5):', currentRating);
    const newReviewText = prompt('Enter new review:', currentReviewText);
    if (newRating && (newRating < 1 || newRating > 5)) {
        alert('Rating must be between 1 and 5');
        return;
    }
    try {
        const response = await fetch(`http://localhost:3000/api/products/${productId}/review`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating: newRating || null, review_text: newReviewText || '' }),
            credentials: 'include'
        });
        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            window.location.reload();
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Error updating review');
    }
}

async function deleteReview(productId) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
        const response = await fetch(`http://localhost:3000/api/products/${productId}/review`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            window.location.reload();
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Error deleting review');
    }
}