const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
    date_read: {
        type: Date,
        required: true,
    },
    comment: {
        type: String,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User'}
});

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
