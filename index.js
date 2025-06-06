class BookstoreApp {
    constructor() {
        this.books = [];
        this.currentPage = 0;
        this.isLoading = false;
        this.isTableView = true;
        this.expandedRows = new Set();
        this.totalBooksAvailable = -1; // -1 means unknown, will be set by the first API call

        this.initializeElements();
        this.bindEvents();
        this.loadBooks(true);
    }

    initializeElements() {
        this.languageSelect = document.getElementById('languageSelect');
        this.seedInput = document.getElementById('seedInput');
        this.randomSeedBtn = document.getElementById('randomSeedBtn');
        this.likesRange = document.getElementById('likesRange');
        this.likesValue = document.getElementById('likesValue');
        this.reviewsInput = document.getElementById('reviewsInput');
        this.tableContainer = document.getElementById('tableContainer');
        this.galleryContainer = document.getElementById('galleryContainer');
        this.booksTableBody = document.getElementById('booksTableBody');
        this.booksGallery = document.getElementById('booksGallery');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.exportCsvBtn = document.getElementById('exportCsvBtn');
        this.tableViewBtn = document.getElementById('tableView');
        this.galleryViewBtn = document.getElementById('galleryView');
    }

    bindEvents() {
        // Parameter changes
        this.languageSelect.addEventListener('change', () => this.onParameterChange());
        this.seedInput.addEventListener('input', () => this.onParameterChange());
        this.likesRange.addEventListener('input', () => {
            this.likesValue.textContent = parseFloat(this.likesRange.value).toFixed(1);
            this.onParameterChange();
        });
        this.reviewsInput.addEventListener('input', () => this.onParameterChange());

        // Random seed button
        this.randomSeedBtn.addEventListener('click', () => {
            this.seedInput.value = Math.floor(Math.random() * 1000000);
            this.onParameterChange();
        });

        // View mode toggle
        this.tableViewBtn.addEventListener('change', () => this.toggleView(true));
        this.galleryViewBtn.addEventListener('change', () => this.toggleView(false));

        // Export CSV
        this.exportCsvBtn.addEventListener('click', () => this.exportToCsv());

        // Infinite scrolling
        window.addEventListener('scroll', () => this.handleScroll());
    }

    onParameterChange() {
        this.books = [];
        this.currentPage = 0;
        this.totalBooksAvailable = -1;
        this.expandedRows.clear();
        this.loadBooks(true);
    }

    async loadBooks(reset = false) {
        console.log(`Loading books - isLoading: ${this.isLoading}, totalBooks: ${this.totalBooksAvailable}, currentBooks: ${this.books.length}`);

        if (this.isLoading || (this.totalBooksAvailable !== -1 && this.books.length >= this.totalBooksAvailable && this.totalBooksAvailable < 20)) {
            return;
        }

        this.isLoading = true;
        this.loadingSpinner.style.display = 'block';

        try {
            const count = this.currentPage === 0 ? 20 : 10;
            const startIndex = this.currentPage === 0 ? 0 : 20 + (this.currentPage - 1) * 10;

            const langParts = this.languageSelect.value.split('-');
            const language = langParts[0];
            const region = langParts[1];

            const requestBody = {
                language: language,
                region: region,
                seed: parseInt(this.seedInput.value) || 0,
                averageLikes: parseFloat(this.likesRange.value),
                averageReviews: parseFloat(this.reviewsInput.value) || 0,
                startIndex: startIndex,
                count: count
            };

            console.log('Request body:', requestBody);

            const response = await fetch('https://bookstoretestingpro.runasp.net/api/Books/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            const data = await response.json();
            const newBooks = data.books || [];
            
            if (this.totalBooksAvailable === -1) {
                this.totalBooksAvailable = data.totalGenerated;
            }

            // Augment books with UI-specific properties
            newBooks.forEach(book => {
                book.authors = book.authors.join(', '); // Convert authors array to string
                book.coverColor = this.generateCoverColor(book.index); // Generate color for cover
            });


            if (reset) {
                this.books = newBooks;
                this.renderBooks();
            } else {
                this.books.push(...newBooks);
                this.appendBooks(newBooks);
            }

            this.currentPage++;
        } catch (error) {
            console.error('Error loading books:', error);
            // Optionally display an error message to the user
        } finally {
            this.isLoading = false;
            this.loadingSpinner.style.display = 'none';
        }
    }

    generateCoverColor(seed) {
        const rng = this.seededRandom(seed + 6);
        const colors = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            'linear-gradient(135deg, #ff8a80 0%, #ea6100 100%)'
        ];
        return colors[Math.floor(rng() * colors.length)];
    }

    // Simple seeded random number generator, needed for generating consistent cover colors
    seededRandom(seed) {
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }

    renderBooks() {
        if (this.isTableView) {
            this.booksTableBody.innerHTML = '';
            this.books.forEach(book => this.appendBookToTable(book));
        } else {
            this.booksGallery.innerHTML = '';
            this.books.forEach(book => this.appendBookToGallery(book));
        }
    }

    appendBooks(books) {
        if (this.isTableView) {
            books.forEach(book => this.appendBookToTable(book));
        } else {
            books.forEach(book => this.appendBookToGallery(book));
        }
    }

    appendBookToTable(book) {
        const row = document.createElement('tr');
        row.className = 'expandable-row';
        row.dataset.bookIndex = book.index;

        row.innerHTML = `
            <td>${book.index}</td>
            <td>${book.isbn}</td>
            <td>${book.title}</td>
            <td>${book.authors}</td>
            <td>${book.publisher}</td>
            <td><span class="likes-badge"><i class="fas fa-heart"></i> ${book.likes}</span></td>
        `;

        row.addEventListener('click', () => this.toggleRowExpansion(book, row));
        this.booksTableBody.appendChild(row);
    }

    appendBookToGallery(book) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 mb-4';

        col.innerHTML = `
            <div class="gallery-item h-100">
                <div class="row">
                    <div class="col-4">
                        <div class="book-cover" style="background: ${book.coverColor}">
                            <h6>${book.title}</h6>
                            <p>by ${book.authors}</p>
                        </div>
                    </div>
                    <div class="col-8">
                        <h6>${book.title}</h6>
                        <p class="text-muted mb-1">${book.authors}</p>
                        <p class="text-muted mb-2"><small>${book.publisher}</small></p>
                        <p class="mb-2"><strong>ISBN:</strong> ${book.isbn}</p>
                        <div class="d-flex justify-content-between">
                            <span class="likes-badge"><i class="fas fa-heart"></i> ${book.likes}</span>
                            <small class="text-muted">${book.reviews.length} reviews</small>
                        </div>
                    </div>
                </div>
                ${book.reviews.length > 0 ? `
                    <div class="mt-3">
                        <h6>Reviews:</h6>
                        ${book.reviews.map(review => `
                            <div class="review-item">
                                <p class="mb-1">"${review.text}"</p>
                                <small class="text-muted">— ${review.author}</small>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        this.booksGallery.appendChild(col);
    }

    toggleRowExpansion(book, row) {
        const bookIndex = book.index;
        const isExpanded = this.expandedRows.has(bookIndex);

        if (isExpanded) {
            // Collapse
            this.expandedRows.delete(bookIndex);
            row.classList.remove('expanded');
            const detailsRow = row.nextElementSibling;
            if (detailsRow && detailsRow.classList.contains('book-details-row')) {
                detailsRow.remove();
            }
        } else {
            // Expand
            this.expandedRows.add(bookIndex);
            row.classList.add('expanded');

            const detailsRow = document.createElement('tr');
            detailsRow.className = 'book-details-row';
            detailsRow.innerHTML = `
                <td colspan="6">
                    <div class="book-details">
                        <div class="row">
                            <div class="col-md-3">
                                <div class="book-cover mx-auto" style="background: ${book.coverColor}">
                                    <h6>${book.title}</h6>
                                    <p>by ${book.authors}</p>
                                </div>
                                <div class="text-center mt-2">
                                    <span class="likes-badge"><i class="fas fa-heart"></i> ${book.likes}</span>
                                </div>
                            </div>
                            <div class="col-md-9">
                                <h5>${book.title} <small class="text-muted">Paperback</small></h5>
                                <p class="text-muted mb-2">by <em>${book.authors}</em></p>
                                <p class="mb-3"><strong>Publisher:</strong> ${book.publisher}</p>
                                <p class="mb-3"><strong>ISBN:</strong> ${book.isbn}</p>
                                
                                ${book.reviews.length > 0 ? `
                                    <h6>Reviews</h6>
                                    <div class="reviews-container">
                                        ${book.reviews.map(review => `
                                            <div class="review-item">
                                                <p class="mb-1">"${review.text}"</p>
                                                <small class="text-muted">— ${review.author}</small>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : '<p class="text-muted">No reviews yet.</p>'}
                            </div>
                        </div>
                    </div>
                </td>
            `;

            row.parentNode.insertBefore(detailsRow, row.nextSibling);
        }
    }

    toggleView(isTable) {
        this.isTableView = isTable;

        if (isTable) {
            this.tableContainer.style.display = 'block';
            this.galleryContainer.style.display = 'none';
        } else {
            this.tableContainer.style.display = 'none';
            this.galleryContainer.style.display = 'block';
        }

        this.renderBooks();
    }

    handleScroll() {
        console.log('Scroll event triggered');
        if (this.isLoading) {
            console.log('Already loading, skipping');
            return;
        }

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // Load more when user is near the bottom (e.g., within 400px)
        if (scrollTop + windowHeight >= documentHeight - 20) {
            this.loadBooks(false);
        }
    }

    exportToCsv() {
        if (this.books.length === 0) {
            alert("No data to export.");
            return;
        }

        // Create CSV headers
        const headers = ['Index', 'ISBN', 'Title', 'Authors', 'Publisher', 'Likes', 'Reviews Count', 'Review Texts'];

        // Create CSV rows
        const rows = this.books.map(book => {
            const reviewsText = book.reviews.map(r => `"${r.text.replace(/"/g, '""')}" (${r.author})`).join('; ');
            return [
                book.index,
                `"${book.isbn}"`,
                `"${book.title.replace(/"/g, '""')}"`,
                `"${book.authors.replace(/"/g, '""')}"`,
                `"${book.publisher.replace(/"/g, '""')}"`,
                book.likes,
                book.reviews.length,
                `"${reviewsText}"`
            ].join(',');
        });

        // Combine headers and rows
        const csvContent = [headers.join(','), ...rows].join('\n');

        // Create and download file
        const blob = new Blob([`\uFEFF${csvContent}`], { // \uFEFF for UTF-8 BOM
            type: 'text/csv;charset=utf-8;'
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `bookstore_data_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BookstoreApp();
});