const express = require('express');
const expressSession = require('express-session');
const passport = require('passport');
const connectFlash = require('connect-flash');
const mongoose = require('mongoose');
require('./config/passport-config');
const Book = require('./models/book.model.js');
//const router = express.Router();
const User = require('./models/user.model.js');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;

// const uri = 'mongodb://localhost:27017/the-librarium';

mongoose.connect(uri)
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
// const uri = process.env.MONGODB_URI || 'fallback_value_if_needed';
// mongoose.connect(uri)
//   .then(() => {
//     console.log('MongoDB connected successfully');
//   })
//   .catch((err) => {
//     console.error('MongoDB connection error:', err);
//   });

app.use(express.urlencoded({ extended: true })); 
app.use(
    expressSession({
      secret: 'blah', // Use a strong secret key
      resave: false,
      saveUninitialized: false,
    })
  );

  // Initialize Passport and session
  app.use(connectFlash());
  app.use(passport.initialize());
  app.use(passport.session());
 
  app.use((req, res, next) => {
    res.locals.user = req.user; // Make `req.user` accessible in all views
    next(); // Continue to the next middleware/route
  });

  app.set('view engine', 'ejs');

  const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next(); // If the user is authenticated, proceed to the next middleware/route
    }
    res.redirect('/login'); // Otherwise, redirect to the login page
  };

  const addUsers = async (users) => {
    try {
      // Hash the passwords for each user
      const results = await Promise.all(
        users.map(async (user) => {
          const existingUser = await User.findOne({username: user.username});
          if (existingUser){
            console.log(`User with username "${user.username}" already exists.`);
            return  null;
          } 
          const hashedPassword = await bcrypt.hash(user.password, 10);
        const newUser = new User({
          username: user.username,
          password: hashedPassword,
        });

        await newUser.save(); // Save the user
        return newUser;
      })
    );

    console.log('Users added successfully:', results.filter(Boolean)); // Log only successfully added users
} catch (err) {
  console.error('Error adding users:', err);
}
};
  
const users = [
    { username: 'john', password: 'test' },
    { username: 'jane', password: 'test' },
    { username: 'sara', password: 'test' },
  ];
 
  addUsers(users); 


  

  app.get('/login', (req, res) => {
    res.render('login', { message: req.flash('error') }); // If you use flash messages
  });
  
  

  // Login route
  app.post('/login', (req, res, next) => {
    console.log('Received login request with:', req.body);
    next();
  }, passport.authenticate('local', {
      successRedirect: '/', // Redirect after successful login
      failureRedirect: '/login', // Redirect after failed login
      failureFlash: true, // If you use flash messages to display login errors
    })
  );
  
  // Logout route
  app.get('/logout', (req, res) => {
    req.logout((err) => { // Pass a callback to handle any errors
      if (err) {
        console.error('Error during logout:', err);
        return res.status(500).send('An error occurred during logout.');
      }
      res.redirect('/login'); // Redirect to the login page after logout
    });
  });
  

app.use(express.static('public'));
app.use(express.static('images'));
app.use(express.urlencoded({ extended: true })); // За да може формулярите да работят


app.get('/', (req, res) => {
  res.render('index');
});

const bookRoutes = require('./routes/bookRoutes'); // Double-check this import
app.use(bookRoutes);

app.get('/books', ensureAuthenticated, async (req, res) => {
    try {
      const userBooks = await Book.find({ createdBy: req.user._id});
      userBooks.forEach(book => {
        if (book.date_read) {
          book.formattedDateRead = new Date(book.date_read).toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' });
        }
      });
      // Fetch all books
      res.render('books', { books: userBooks }); // Render a page with the book list
    } catch (error) {
      console.error('Error fetching books:', error);
      res.status(500).send('An error occurred while fetching books.');
    }
  });

  app.get('/add-book', ensureAuthenticated, async (req, res) => {
    const bookId = req.query.bookId; // Get bookId from query parameters
  if (bookId) {
    const book = await Book.findById(bookId); // Fetch the book by its ID
    if (book) {
      return res.render('add-book', { book }); // Render with book data for editing
    }
  }
  res.render('add-book', { book: {} });
  });
  
  app.post('/add-book', ensureAuthenticated, async (req, res) => {
    const { title, author, date_read, comment } = req.body;
    const newBook = new Book ({
        title,
        author,
        date_read,
        comment,
        createdBy: req.user._id,
    });
    try {
        await newBook.save();
        res.redirect('/books'); // Redirect to the book list
      } catch (error) {
        console.error('Error adding book:', error);
        res.status(500).send('An error occurred while adding the book.');
      }
    });
   

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
