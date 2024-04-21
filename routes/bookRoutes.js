const express = require('express');
const router = express.Router();
const Book = require('../models/book.model.js'); // Adjust the path if needed

const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/login');
  };

// Route to get all books
router.get('/books', ensureAuthenticated, async (req, res) => {
  try {
    const userBooks = await Book.find({ createdBy: req.user._id });
    res.render('books', { books: userBooks });
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).send('Error fetching books');
  }
});

// Route to render a form to edit a book
router.get('/books/:id/edit', ensureAuthenticated, async (req, res) => {
    const bookId = req.params.id;
    const book = await Book.findById(bookId);
    res.render('edit-book', { book }); // Make sure you have this view
  });
  
  router.post('/books/:id/edit', ensureAuthenticated, async (req, res) => {
    const bookId = req.params.id;
    const { title, author, date_read, comment } = req.body;
    await Book.findByIdAndUpdate(bookId, { title, author, date_read, comment });
    res.redirect('/books'); // Redirect back to the book list
  });
  
// Route to delete a book
router.post('/books/:id/delete', ensureAuthenticated, async (req, res) => {
    try {
        await Book.findByIdAndDelete(req.params.id);
        res.redirect('/books');
      } catch (err) {
        console.error('Error deleting the book:', err);
        res.status(500).send('Error deleting the book');
      }
});

module.exports = router; // Export the router
