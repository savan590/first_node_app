const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ejs = require('ejs')
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv')
dotenv.config()
const bcrypt = require('bcrypt')
const app = express();
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.set('view engine', 'ejs')

//public api
app.get("/", (req, res) => {
  res.json({
    status: 'success',
    message: 'welcome to the server'
  })
});

//health api
app.get('/health', (req, res) => {
  try {
    const currentTime = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    res.json({
      serverName: 'The Week List',
      time: currentTime,
      serverStatus: 'active'
    });
  }
  catch (error) {
    console.log(error)
    res.json({
      status: 'fail',
      message: 'something went wrong Please active your server'
    })
  }
});

const User = mongoose.model('User', {
  fullname: String,
  email: String,
  password: String,
  age: Number,
  gender: String,
  mobile: String,
});

//all users api

app.get('/users', async (req, res) => {
  try {
    const users = await User.find({})
    res.json({
      status: 'SUCCESS',
      data: users
    })
  } catch (error) {
    res.json({
      status: 'FAILED',
      message: 'Something went wrong'
    })
  }
})

//signup api
app.post('/signup', async (req, res) => {
  try {
    const { fullname, email, password, age, gender, mobile } = req.body
    const encryptedPassword = await bcrypt.hash(password, 10)
    await User.create({ fullname, email, password: encryptedPassword, age, gender, mobile })
    res.json({
      status: 'SUCCESS',
      message: "You've signed up successfully!"
    })
  } catch (error) {
    console.log(error)
    res.json({
      status: 'FAILED',
      message: 'Something went wrong'
    })
  }
})

//login api
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (user) {
      let hasPasswordMatched = await bcrypt.compare(password, user.password)
      if (hasPasswordMatched) {
        const jwttoken = jwt.sign(user.toJSON(), process.env.JWT_SECRET, { expiresIn: 60 * 30 })
        res.json({
          status: 'SUCCESS',
          message: "You've logged in successfully!",
          jwttoken
        })
      } else {
        res.json({
          status: 'FAILED',
          message: 'Incorrect credentials! Please try again'
        })
      }
    } else {
      res.json({
        status: 'FAILED',
        message: 'User does not exist'
      })
    }
  } catch (error) {
    console.log(error)
    res.json({
      status: 'FAILED',
      message: 'Incorrect credentials! Please try again'
    })
  }
})

// Middleware for authentication and authorization
const authenticate = (req, res, next) => {
  try {
    const { jwttoken } = req.headers;
    const decoded = jwt.verify(jwttoken, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error(error);
    res.json({ message: 'Invalid token' });
  }
};

//protected route
app.get('/profile', authenticate, async (req, res) => {
  res.send('WELCOME TO YOUR PROFILE!')
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
  mongoose
    .connect(process.env.MONGODB_URL)
    .then(() => console.log(`Server running on http://localhost:${process.env.PORT}`))
    .catch(error => console.error(error))
});


app.use((req, res) => {
  res.status(404).send("Not Found");
});
