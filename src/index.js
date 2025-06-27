// Base URL for the JSON Server API
const BASE_URL = 'https://json-server-blog-app-1.onrender.com/posts';

// Global variable to store the ID of the currently selected post
let currentPostId = null;

// DOM Elements
const postListDiv = document.getElementById('post-list');
const postDetailDiv = document.getElementById('post-detail');
const newPostForm = document.getElementById('new-post-form');
const editPostForm = document.getElementById('edit-post-form');
const cancelEditButton = document.getElementById('cancel-edit');

/**
 * Helper function to handle image loading errors.
 * Replaces the image source with a "Broken Image" placeholder.
 */
function handleImageError(event) {
    
    event.target.src = 'https://placehold.co/80x80/cccccc/333333?text=Broken+Img'; // For list items
    event.target.alt = 'Image failed to load';
    // For larger images in detail view, use a different placeholder size
    if (event.target.classList.contains('max-h-80')) { // Check for a class unique to detail image
        event.target.src = 'https://placehold.co/600x400/cccccc/333333?text=Broken+Image';
    }
}


//Helper function to render messages (loading, empty, error) in a given element.
function renderMessage(element, message, isError = false) {
    element.innerHTML = `<p class="${isError ? 'text-red-500' : 'text-gray-500'} italic text-center">${message}</p>`;
}


//Updates the 'selected' class on post items in the list.
function updateSelectedPostUI(newPostId) {

    // Remove 'selected' class from previously selected item
    if (currentPostId) {
        const prevSelected = document.querySelector(`.post-item[data-id="${currentPostId}"]`);
        if (prevSelected) {
            prevSelected.classList.remove('selected', 'bg-blue-100', 'border-l-4', 'border-blue-500');
        }
    }

    // Add 'selected' class to the newly selected item
    if (newPostId) {
        const selectedItem = document.querySelector(`.post-item[data-id="${newPostId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected', 'bg-blue-100', 'border-l-4', 'border-blue-500');
            selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    currentPostId = newPostId; // Update global state
}


//Clears the content of the post detail div and hides the edit form.
function clearPostDetail() {
    renderMessage(postDetailDiv, 'No post selected. Click on a post title to view details, or add a new one!');
    editPostForm.classList.add('hidden'); // Ensure edit form is hidden
}


//Fetches data from a given URL, handles HTTP errors, and parses JSON.
function fetchJson(url, options = {}) {
    return fetch(url, options)
        .then(response => {
            if (!response.ok) {
                return response.json()
                    .catch(() => ({ message: response.statusText })) // Try to parse error, fallback to statusText
                    .then(errorData => {
                        throw new Error(`HTTP error! Status: ${response.status} - ${errorData.message || 'Unknown error'}`);
                    });
            }
            return response.json();
        });
}


//Fetches all blog posts from the API and displays them in the #post-list div.
//Also handles displaying the first post's details on page load (Advanced Deliverable).
function displayPosts(searchTerm = '') {
    renderMessage(postListDiv, 'Loading posts...');

    let url = `${BASE_URL}`;

    return fetchJson(url) // Ensure fetchJson is returned here
        .then(posts => {
            postListDiv.innerHTML = ''; // Clear loading message

            let filteredPosts = posts;
            if (searchTerm) {
                const lowerCaseSearchTerm = searchTerm.toLowerCase();
                filteredPosts = posts.filter(post =>
                    post.title.toLowerCase().includes(lowerCaseSearchTerm) ||
                    post.author.toLowerCase().includes(lowerCaseSearchTerm)
                );
            }

            if (filteredPosts.length === 0) {
                renderMessage(postListDiv, 'No posts found matching your search criteria. Try a different term!');
                clearPostDetail();
                return Promise.resolve(); // Always return a Promise
            }

            filteredPosts.forEach(post => {
                const postItem = document.createElement('div');
                postItem.classList.add(
                    'post-item', 'bg-white', 'p-4', 'rounded-lg', 'shadow-sm',
                    'hover:bg-blue-50', 'hover:shadow-md', 'transition', 'duration-200',
                    'ease-in-out', 'cursor-pointer', 'flex', 'items-center', 'space-x-4',
                    'border', 'border-gray-200'
                );
                postItem.dataset.id = post.id;

                const postImage = document.createElement('img');
                postImage.src = post.image || 'https://placehold.co/80x80/cccccc/333333?text=No+Img';
                postImage.alt = `Image for ${post.title}`;
                postImage.classList.add('w-20', 'h-20', 'rounded-md', 'object-cover', 'flex-shrink-0', 'shadow-sm');
                postImage.onerror = handleImageError;

                const textContentDiv = document.createElement('div');
                textContentDiv.classList.add('flex-grow');

                const postTitle = document.createElement('h3');
                postTitle.classList.add('text-lg', 'font-semibold', 'text-gray-800', 'leading-tight');
                postTitle.textContent = post.title;

                textContentDiv.appendChild(postTitle);
                postItem.appendChild(postImage);
                postItem.appendChild(textContentDiv);

                postItem.addEventListener('click', () => handlePostClick(post.id));
                postListDiv.appendChild(postItem);
            });

            // Display the first post's details.           
            if (filteredPosts.length > 0) {
                return handlePostClick(filteredPosts[0].id); // Ensure handlePostClick returns a Promise
            } else {
                clearPostDetail(); // No results after filtering
                return Promise.resolve(); // Always return a Promise
            }
        })
        .catch(error => {
            console.error('Error fetching posts:', error);
            renderMessage(postListDiv, 'Failed to load posts. Please ensure JSON Server is running.', true);
            clearPostDetail();
            return Promise.reject(error); // Re-throw error as a rejected Promise
        });
}


//Fetches and displays the details of a specific blog post in the #post-detail div.
//Highlights the selected post in the list.
function handlePostClick(postId) {
    updateSelectedPostUI(postId); // Update selection UI

    renderMessage(postDetailDiv, 'Loading post details...');
    editPostForm.classList.add('hidden'); // Ensure edit form is hidden

    return fetchJson(`${BASE_URL}/${postId}`) // Ensure fetchJson is returned here
        .then(post => {
            postDetailDiv.innerHTML = `
                <h3 class="text-4xl font-extrabold text-blue-800 mb-4">${post.title}</h3>
                <p class="text-lg text-gray-600 mb-4"><strong>Author:</strong> ${post.author}</p>
                <img src="${post.image || 'https://placehold.co/600x400/cccccc/333333?text=No+Image'}" alt="${post.title}"
                     class="w-full h-auto rounded-lg shadow-md mb-6 object-cover max-h-80">
                <p class="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">${post.content}</p>
                <div class="mt-8 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                    <button id="edit-post-btn"
                        class="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 active:scale-95">
                        Edit Post
                    </button>
                    <button id="delete-post-btn"
                        class="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 active:scale-95">
                        Delete Post
                    </button>
                </div>
            `;

            // Add onerror to handle broken image links in detail view
            const detailImage = postDetailDiv.querySelector('img');
            if (detailImage) {
                detailImage.onerror = handleImageError;
            }

            document.getElementById('edit-post-btn').addEventListener('click', () => showEditForm(post));
            document.getElementById('delete-post-btn').addEventListener('click', () => deletePost(post.id));
            return Promise.resolve(); // Always return a Promise
        })
        .catch(error => {
            console.error(`Error fetching post ${postId}:`, error);
            renderMessage(postDetailDiv, 'Failed to load post details. Please try again.', true);
            updateSelectedPostUI(null); // Clear selection if load fails
            return Promise.reject(error); // Re-throw error as a rejected Promise
        });
}

//Handles the submission of the new post form.
function addNewPostListener() {
    newPostForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const title = document.getElementById('new-title').value;
        const content = document.getElementById('new-content').value;
        const author = document.getElementById('new-author').value;
        const image = document.getElementById('new-image').value;

        const newPost = {
            title: title,
            content: content,
            author: author,
            image: image || 'https://placehold.co/400x300/cccccc/333333?text=No+Image'
        };

        fetchJson(`${BASE_URL}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPost)
        })
        .then(addedPost => {
            console.log('New post added:', addedPost);
            newPostForm.reset(); // Clear the form

            // Use promises to ensure order: displayPosts then handlePostClick
            return displayPosts().then(() => handlePostClick(addedPost.id));
        })
        .catch(error => {
            console.error('Error creating new post:', error);
            alert('Oops! Something went wrong while adding your post: ' + error.message);
        });
    });
}

//Populates and displays the edit form with the current post's data.
function showEditForm(post) {
    postDetailDiv.classList.add('hidden'); // Hide post details
    editPostForm.classList.remove('hidden'); // Show edit form

    document.getElementById('edit-title').value = post.title;
    document.getElementById('edit-content').value = post.content;
    editPostForm.dataset.id = post.id; // Store ID for submission

    editPostForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


//Handles the submission of the edit post form.
function handleEditSubmit() {
    editPostForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const postId = editPostForm.dataset.id;
        const updatedTitle = document.getElementById('edit-title').value;
        const updatedContent = document.getElementById('edit-content').value;

        const updatedPostData = {
            title: updatedTitle,
            content: updatedContent
        };

        fetchJson(`${BASE_URL}/${postId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedPostData)
        })
        .then(fetchedUpdatedPost => {
            console.log('Post updated:', fetchedUpdatedPost);

            editPostForm.classList.add('hidden'); // Hide edit form
            postDetailDiv.classList.remove('hidden'); // Show post details

            // Use promises to ensure order: displayPosts then handlePostClick
            return displayPosts().then(() => handlePostClick(fetchedUpdatedPost.id));
        })
        .catch(error => {
            console.error(`Error updating post ${postId}:`, error);
        });
    });
}


//Handles the cancellation of the edit form.
function handleCancelEdit() {
    cancelEditButton.addEventListener('click', () => {
        editPostForm.classList.add('hidden'); // Hide edit form
        postDetailDiv.classList.remove('hidden'); // Show post details
        editPostForm.reset(); // Clear form fields
        // Re-select the previously selected post to ensure detail view is shown
        if (currentPostId) {
            handlePostClick(currentPostId);
        } else {
            clearPostDetail();
        }
    });
}


// Deletes a post.
function deletePost(postId) {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
        return; // User cancelled
    }

    fetchJson(`${BASE_URL}/${postId}`, { method: 'DELETE' })
        .then(() => {
            console.log('Post deleted:', postId);

            // Update the UI
            const deletedPostItem = document.querySelector(`.post-item[data-id="${postId}"]`);
            if (deletedPostItem) {
                deletedPostItem.remove(); // Remove the element from the DOM
            }
            clearPostDetail(); // Clear detail view

            // After deletion, re-evaluate what to display: the first remaining post or an empty message
            return fetchJson(`${BASE_URL}`);
        })
        .then(remainingPosts => {
            if (remainingPosts.length > 0) {
                handlePostClick(remainingPosts[0].id); // Display the first remaining post
            } else {
                renderMessage(postListDiv, 'No posts available. Be the first to create one!');
            }
        })
        .catch(error => {
            console.error(`Error deleting post ${postId}:`, error);
            alert('Oops! Something went wrong while deleting your post: ' + error.message);
        });
}


//Main function to initialize the application logic.
function main() {
    displayPosts(); // Load and display all posts, and the first post's details
    addNewPostListener(); // Set up event listener for the new post form
    handleEditSubmit(); // Set up event listener for the edit post form submission
    handleCancelEdit(); // Set up event listener for the edit form cancellation button
    handleSearch(); // Set up event listeners for the search functionality
}

// Ensure the DOM is fully loaded before running the main function
document.addEventListener('DOMContentLoaded', main);
