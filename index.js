const express=require("express")
const app=express()
var jwt = require('jsonwebtoken');
require('dotenv').config()
const cors=require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { query } = require('express')
app.use(cors())
const port = process.env.PORT || 5500;
app.use(express.json());
function verifyJWT (req,res,next){
    const authHeader=req.headers.authorization
    if(!authHeader){
        return res.status(401).send({message:"Unauthorized access"})
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        
        req.decoded = decoded;
        next();
    })
    
}
app.get('/',(req,res)=>{
    res.send("Hello Free Doctors portal  sever")
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7auxx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        console.log("database connected");
        const Dportalpblm=client.db("DoctorPortal").collection("patientProblem")
        const DportalSer=client.db("DoctorPortal").collection("serial")
        const Dsolution=client.db("DoctorPortal").collection("solution")
        const userCollection=client.db("DoctorPortal").collection("user")
        const doctorCollection=client.db("DoctorPortal").collection("doctor")
    //verifyAdmin
    const verifyAdmin=async(req,res,next)=>{
        const requester=req.decoded.email
const requesterAccount=await userCollection.findOne({email:requester})
if(requesterAccount.role=="admin"){
    next()

}
    }
    const stripe = require('stripe')(process.env.STRIPE_KEY);
        //api
       app.get('/serial',async(req,res)=>{
        const query={}
        const result=DportalSer.find(query)
        const problem=await result.toArray()
        res.send(problem)
       })
       //payment api create
       app.post('/create-payment-intent', async(req, res) =>{
        const myappoinment = req.body;
        const price = myappoinment.price;
        const amount = price*100;
        const paymentIntent = await stripe.paymentIntents.create({
          amount : amount,
          currency: 'usd',
          payment_method_types:['card']
        });
        res.send({clientSecret: paymentIntent.client_secret})
      });
       app.get('/serial',async(req,res)=>{
        const query={}
        const result=DportalSer.find(query).project({name:1})
        const problem=await result.toArray()
        res.send(problem)
       })
//add new item
app.post('/patients',async(req,res)=>{
    const doc =req.body;
    const query={Name:doc.name,Email:doc.email,Slot:doc.slot}
    const exsist=await Dportalpblm.findOne(query)
    if(exsist){
        return res.send({success:false,doc:exsist})
    }
    const result=await Dportalpblm.insertOne(doc)
    res.send(result)
    
})
app.get('/patients',async(req,res)=>{
    const query={}
    const result=Dportalpblm.find(query)
    const item=await result.toArray()
    res.send(item)
   })
app.get('/myappopinment',verifyJWT,async(req,res)=>{
    const email=req.query.email
    const decodedEmail=req.decoded.email;
    if(email===decodedEmail){
        const query={email:email}
    const result=Dportalpblm.find(query)
    const item=await result.toArray()
    res.send(item)

    }
    else{
        res.status(403).send({message:"Forbidden Access"})
    }
   })
   
//get pbm details api
app.get('/myappopinment/:id',async(req,res)=>{
    const id=req.params.id
    const query={_id:ObjectId(id)}
    const result=Dportalpblm.find(query)
    const item=await result.toArray()
    res.send(item)
   })
  
   //put method for add user
   app.put('/user/:email',async(req,res)=>{
    const email=req.params.email
    const user=req.body
    const filter = { email: email };
    const options = { upsert: true };
    const updateDoc = {
        $set: user
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '1y' })
      res.send({ result, token });
   })
   //admin api
   app.get('/admin/:email',async(req,res)=>{
    const email=req.params.email 
    const user=await userCollection.findOne({email:email})
    const isAdmin=user.role==="admin"
    res.send({admin:isAdmin})
   })
   //put method for add admin
   app.put('/user/admin/:email',verifyJWT,verifyAdmin,async(req,res)=>{
    const email=req.params.email

    const filter = { email: email };
    
    const updateDoc = {
        $set: {role:"admin"}
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      
      res.send({ result });

   })
   //get
app.get('/user',verifyJWT,async(req,res)=>{
    const query={}
        const result=userCollection.find(query)
        const user=await result.toArray()
        res.send(user)
})
//add new item
app.post('/solution',async(req,res)=>{
    const doc =req.body;
    const result=await Dsolution.insertOne(doc)
    res.send(result)
    
})
//add doctor
app.post('/doctor',verifyJWT,verifyAdmin,async(req,res)=>{
    const doctor =req.body;
    const result=await doctorCollection.insertOne(doctor)
    res.send(result)
    
})
//api get doctor
app.get('/doctor',async(req,res)=>{
    const query={}
    const result=doctorCollection.find(query)
    const item=await result.toArray()
    res.send(item)
   })
   //deleted doctor
app.delete('/doctor/:email',async(req,res)=>{
    const email=req.params.email 
    const filter={email:email}
    const result=doctorCollection.deleteOne(filter)
  
    res.send(result)
   })
app.get('/solution',async(req,res)=>{
    const query={}
    const result=Dsolution.find(query)
    const item=await result.toArray()
    res.send(item)
   })
    }
    finally{

    }

}
run().catch(console.dir)
app.listen(port,()=>{
    console.log(`Running server ${port}`);
})