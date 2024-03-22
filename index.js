const express = require('express');
const mongoose = require('mongoose');
require ('dotenv').config ()
const cors = require('cors');
const usersModel = require('./models/users.model');
const Product = require('./models/pizza.models');
const NewOrders = require('./models/orders.model')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Razorpay = require('razorpay')
const { body, validationResult } = require('express-validator');
const  inventoryItems  = require('./models/Inventory.model');
const pizzaRoute = require('./route/pizzaRoute');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');




const app = express();


app.use(cors());
app.use(express.json());




mongoose
  .connect(process.env.MONGO_URI,{useNewUrlParser: true,
  useUnifiedTopology: true,})
  .then(() => {
    console.log('Connected successfully');
  })
  .catch((err) => {
    console.log('Error connecting to the database:', err);
  });


api_key=process.env.RAZORPAY_API_KEY;
api_secret=process.env.RAZORPAY_SECRET;


var instance = new Razorpay({
  key_id: api_key,
  key_secret: api_secret,
});



let otpArray = [];

const generateRandomOTP = () => {
  let otp;
  do {
    otp = Math.floor(100000 + Math.random() * 900000).toString();
  } while (otpArray.includes(otp));

  otpArray.push(otp);

  return otp;
};

let generatedOTP;

async function sendVerificationEmail(email, verificationCode) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.NODEMAILER_EMAIL, // Add your email username
      pass: process.env.NODEMAILER_PASSWORD // Add your email password
    }
  });

  const mailOptions = {
    from: process.env.NODEMAILER_EMAIL,
    to: email,
    subject: 'Email Verification',
    html: `<p>Thank you for registering. Your verification code is: ${verificationCode}</p>`
  };

  await transporter.sendMail(mailOptions);
}


app.post('/api/sendotp', async(req, res) => {
  try{
    const email = req.body.useremail;
    generatedOTP= generateRandomOTP();
    const userRecord = await User.findOne({ email });
    userRecord.otp= generatedOTP;
    await userRecord.save();
    const emailcontent=`Your OTP is: ${generatedOTP}`;
    sendEmailNotificationForotp("OTP to verify Email", emailcontent, email);


    res.status(200).json({message: "Email sent"});
  }
  catch{
    res.status(400).json({ error: `server error` });
  }

});

app.post('/api/verifyotp/:userotp', async(req, res) => {
  try{
    const otp= req.params.userotp;
    console.log(otp);
    if(otp===generatedOTP){
      
      const userRecord = await usersModel.findOne({otp});
      const userId= userRecord._id;
      const Role= userRecord.role;
      const data = {
        user: {
          id: userId
        }}
  
      const authtoken = jwt.sign(data, jwtSecret);

      res.status(200).json({message: "OTP verified", userId: userId, authtoken: authtoken, Role: Role});
    }
    else{
      res.status(200).json({message: "OTP declined"});
    }
  }
  catch{
    res.status(400).json({ error: `server error` });
  }

});



app.get('/api/getUserEmail/:userId', (req, res) => {
  const userId = req.params.userId;
  const user = usersModel.findById(userId);
  const email = user.email;
  res.status(200).json({success:true,email:email});
})


app.post('/api/forgotPassword', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await usersModel.findOne({ email });

    if (!user) return res.status(404).json({ msg: "User not found!" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "10m" });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "Reset Password",
      html: `<h1>Reset Your Password</h1>
      <p>Click on the following link to reset your password:</p>
      <a href="http://localhost:3000/reset-password/${token}">http://localhost:3000/reset-password/${token}</a>
      <p>The link will expire in 10 minutes.</p>
      <p>If you didn't request a password reset, please ignore this email.</p>`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        return res.status(500).send({ message: err.message });
      }
      res.status(200).send({ message: "Email sent" });
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

app.post('/api/resetpassword/:token', async (req, res) => {
  const token = req.params.token;
  const { newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.userId) {
      return res.status(400).json({ message: "Invalid token" });
    }

    const user = await usersModel.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});



// app.post('/api/forgotPassword', async (req, res) => {
// const {email} = req.body;

//   try {
//     const user = await usersModel.findOne({email});

//     if(!user) return res.status(404).json({msg: "User Not Found!"});

//     const resetToken = user.resetPasswordToken();

//     await user.save();

//     const resetUrl = `http://localhost:3000/passwordreset/${resetToken}`;

//     // TODO: Send reset url to user email

//     res.json({msg: "Reset password link sent to your email!"})

//   } catch (err) {
//     console.log(err);
//     res.status(500).json({msg: "Server Error"});
//   }

// });







app.post('/register', async (req, res) => {
  try {
    // Generate a unique verification code and OTP
    const verificationCode = uuidv4();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Create a new user object with the provided data and generated codes
    const newUser = new usersModel({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      verificationCode: verificationCode,
      otp: otp,
      verified: false // Initially set to false until the user verifies their email
    });

    // Save the new user to the database
    await newUser.save();

    // Send verification email to the user
    await sendVerificationEmail(newUser.email, verificationCode);

    // Return a success message
    res.status(200).json({ message: 'User registered successfully. Please check your email for verification.' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.post('/api/verify/:verificationCode', async(req, res) => {
  try {
    const verificationCode = req.params.verificationCode;
    const user = await usersModel.findOne({ verificationCode });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Mark user as verified
    user.isVerified = true;
    await user.save();

    // Generate auth token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.status(200).json({
      message: 'User verified successfully',
      token
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


app.post('/login', async (req, res) => {
     const {email,password} = req.body;
     const user = await usersModel.findOne({email})
     if(user){
        if(user.password === password){
             res.send(user)
         }else{
             res.status(400).send('Wrong Password')
         }
     }else{
         res.status(400).send('Wrong Email')
     }
    
  });

  // POST endpoint to initiate payment and get the Razorpay key
app.get('/api/checkout/key', async (req, res) => {
  try {
    res.status(200).json({ key: api_key });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST endpoint to handle payment verification and store orders
app.post('/api/checkout/paymentVerification/:userId', async (req, res) => {
  try {
    const { amount, currency } = req.body;

    const instance = new RazorPay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: amount * 100,
      currency,
      receipt: new mongoose.Types.ObjectId().toString(),
      payment_capture: 1,
    };

    const order = await instance.orders.create(options);

    if (order) {
      res.status(200).json(order);
    } else {
      res.status(500);
      throw new Error('Order Creation Failed!');
    }
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error(error);
  }
});


  
app.get('/api/inventory', async (req, res) => {
  try {
    console.log('Received a GET request to /api/inventory');
    const bases = await inventoryItems.find({ item: 'Base' });
    const cheeses = await inventoryItems.find({ item: 'Cheese' });
    const sauces = await inventoryItems.find({ item: 'Sauce' });
    const veggies = await inventoryItems.find({ item: 'Veggie' });

    const inventory = { bases, cheeses, sauces, veggies };
    console.log(inventory);
    res.json(inventory);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
});



app.post('/api/AdminData', (req, res) => {
  try {
    console.log('Received a POST request to /api/AdminData');
    res.json([global.admin_items]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
});


app.post('/api/admin/add-product', async (req, res) => {
  try {
    console.log('Received a POST request to /api/admin/add-product');
    const { name, description, base, sauces, cheeses, veggies, price, size, imageUrl } = req.body;

    // Create a new instance of the Product model
    const newProduct = new Product({
      name,
      description,
      base,
      sauces,
      cheeses,
      veggies,
      price,
      size,
      imageUrl,
    });

    // Save the new product to the database
    await newProduct.save();

    res.status(200).json({ message: 'Product added successfully', product: newProduct });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
});



app.post(`/api/add-to-cart/:userId`, async (req, res) => {

  if (req.params.userId=="null") {
    return res.status(400).json({ error: 'User not found' });
  }

  const userId = req.params.userId;
  console.log(userId);

  const { id, name,description, price, base, sauces,veggies, cheeses, size, img } = req.body;

  try {

    const newItem = { id, name,description, price, base, sauces,veggies, cheeses, size, img};

    const user = await usersModel.findById(userId);

    const existingItem = user.cartItem.find(item => item.id === id && item.size === size && item.qty === qty);

    if (existingItem) {

      return res.status(400).json({ error: 'Item already in cart' });
    }

    const itemWithSameSize = user.cartItem.find(item => item.id === id && item.size === size);

    if (itemWithSameSize) {
      return res.status(400).json({ error: 'Item already in cart. Please select different size option' });
    }

    res.status(200).json({ message: 'Item added to cart' });
    user.cartItem.push(newItem);


    await user.save();
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }


});


app.get('/api/getCartItems/:userId', async (req, res) => {
  const userId = req.params.userId;
  let pizzas =[]

  if(userId === "null") {
    return res.status(400).json({error: 'User not found'});
  }

  try {
    const user = await usersModel.findById(userId);
    const cartItems = user.cartItem;
    for(let item of cartItems){
      const product = await Product.findById(item.id);
      pizzas.push(product);
    }
    res.status(200).json(pizzas);

  } catch (error) {
    res.status(500).json({error: 'Internal Server Error'});
  }

});

app.get('/api/getPizzas', async (req, res) => {
  try {
    console.log('Received a GET request to /api/getPizzas');
    const pizzas = await Product.find({});
    res.json(pizzas);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.use('/api',pizzaRoute);

app.post('/api/stock/:productId', async (req, res) => {
  try{
    const productId = req.params.productId;
    const product = await InventoryItem.findById(productId);
    product.quantity += 10
    await product.save();

    res.status(200).json({message: "Stock Updated"});
  }
  catch{
    res.status(500).json({ message: 'Internal Server Error' });

  }
})


app.get('/api/neworders', async(req, res) => {
  try{
  res.status(200).json([global.neworders]);

  }
  catch(error){
    console.log('error:' ,error);
    res.status(400).json({success: false});
  }
});


app.get('/api/custompizza', async(req, res) => {
  try{
    console.log(global.CustomPizza_data)
  res.status(200).json(global.CustomPizza_data);

  }
  catch(error){
    console.log('error:' ,error);
    res.status(400).json({success: false});
  }
});


app.post('/api/update-order-status', async (req, res) => {
  try {
    const { customerId, status } = req.body;
    const user = await usersModel.findById(customerId);

    for (const outerArray of user.PlacedOrders) {
      for (const order of outerArray) {
        if (order.Status === 'ordered') {
          order.Status = status;
        }
      }
    }

    await user.save();
    console.log('Updated status for all orders');
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false });
  }
});


app.delete('/api/cart/remove/:userId/:itemId', async (req, res) => {
  try {
    const { userId} = req.params;
    const { itemId } = req.params;
    console.log(userId, itemId);
    const user = await usersModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const cartItemIndex = user.cartItem.findIndex(item => item._id === itemId);


    if (cartItemIndex !== -1) {
      user.cartItem.splice(cartItemIndex, 1);
      await user.save();

      res.json({ message: 'Item removed successfully' });
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
  





app.post('/api/foodItems', async (req, res) => {
  try{
    console.log('Received a POST request to /api/foodData');
    res.json([global.food_items]);

  }
  catch{
    console.error(error.message);
    res.status(500).json({error: 'Server error'});

  }
})


app.delete('/api/cart/remove/:userId/:itemId', async (req, res) => {
  try {
    const { userId, itemId } = req.params;

    const user = await usersModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const cartItemIndex = user.cartItem.findIndex(item => item.id === itemId);

    if (cartItemIndex !== -1) {
      user.cartItem.splice(cartItemIndex, 1);
      await user.save();

      res.json({ message: 'Item removed successfully' });
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/getCartItemsCount/:userId', async (req, res) => {
  const userId = req.params.userId;
  const user = await usersModel.findById(userId);
  const cartItemsCount = user.cartItem.length;
  res.status(200).json({cartItemsCount: cartItemsCount});
})


app.get('/api/checkuser/:userId', async(req, res) => {
  const userId= req.params.userId;

  if (userId==="null") {
    return res.status(400).json({ error: 'User not found' });
  }
  else{
    return res.status(200).json({sucess: true});
  }
});

app.get('/api/getuser/:userId', async(req, res) => {
  const userId= req.params.userId;
  const user = await usersModel.findById(userId);
  res.status(200).json(user);
})





app.listen(3001, () => {
  console.log('Server is running on port 3001');
});
