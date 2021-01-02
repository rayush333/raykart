const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose=require('mongoose');
const stripe = require('stripe')('sk_test_51I4pZ7IfzxP161Qek29RnZeRNZeBbRAM8p8xWHmygjJxw1l1HZPMXZvLlR3nJRFUWiswuCX2ppqOzkHMkrHOlXxm00cQlwcuIT');
const app=express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors());
mongoose.connect('mongodb://localhost:27017/raykartDB',{useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true},function(err){
    if(err)
    console.log(err);
    else
    console.log("Connected to local DB");
});
const orderSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    delivered: Boolean,
    amount: Number,
    items: [{type: String}],
    time: String
});
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: String,
    address: String,
    basket: [{type: String}],
    orders: [{type: String}]
});
const productSchema = new mongoose.Schema({
    title: String,
    rating: Number,
    image: String,
    price: Number
});
const User = mongoose.model("User",userSchema);
const Product = mongoose.model("Product",productSchema);
const Order = mongoose.model("Order",orderSchema);
app.patch("/users/:email",function(req,res){
    console.log(req.body.basket);
    let array=[];
    for(let i=0;i<req.body.basket.length;i++)
        array.push(req.body.basket[i]._id);
    User.updateOne({email: req.params.email}, {basket: array}, function(err){
        if(err)
        console.log(err);
        else
        console.log("Patch done");
    });
});
app.get("/products",function(req,res){
    Product.find({},function(err,products){
        if(err)
        console.log(err);
        else
        res.send(products);
    });
});
app.get("/products/:id",function(req,res){
    Product.findOne({_id: req.params.id}, function(err,product){
        if(err)
        console.log(err);
        else
        res.send(product);
    });
});
app.post("/products",function(req,res){
    const newproduct = new Product(req.body);
    newproduct.save(function(err){
        if(err)
        res.send(err);
        else
        res.send("Product added to DB");
    });
});
app.post("/orders",function(req,res){
    const neworder = new Order(req.body);
    neworder.save((err)=>{
        if(err)
        console.log(err);
        else
        console.log("Order registered");
    });
    const orderid = neworder._id;
    User.findOne({email: req.body.user},function(err,user){
        if(err)
        console.log(err);
        else
        {
            user.orders.push(orderid);
            user.save();
        }
    });
    res.send(orderid);
});
app.post("/register", function(req,res){
    const newuser = new User({...req.body, basket: [], orders: []});
    newuser.save(function(err){
        if(err)
        console.log(err);
        else
        {
        console.log("User saved in DB");
        res.send(newuser);
        }
    });
});
app.get("/login/:email",function(req,res){
    User.findOne({email: req.params.email},function(err,user){
        if(err)
        console.log(err);
        else 
        res.send(user);
    });
});
app.post("/payments/create",async function(req,res){
     const total = req.body.total;
     console.log("Payment request received for amount: ",total);
     const paymentIntent = await stripe.paymentIntents.create({
        amount: total,
        currency: "inr"     
    }).catch((err)=>{
        console.log(err);
    });
    res.status(201).send({
        clientSecret: paymentIntent.client_secret
    });
});
app.listen(process.env.PORT || 5000, function(){
    console.log("Server running at port 5000");
});

