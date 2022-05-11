const express=require("express")
const app=express()

require('dotenv').config()
const cors=require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { query } = require('express')
app.use(cors())
const port = process.env.PORT || 5000;
app.use(express.json());
app.get('/',(req,res)=>{
    res.send("Hello Free Doctors portal  sever")
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7auxx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const Dportalpblm=client.db("DoctorPortal").collection("patientProblem")
        const DportalSer=client.db("DoctorPortal").collection("serial")
       app.get('/serial',async(req,res)=>{
        const query={}
        const result=DportalSer.find(query)
        const problem=await result.toArray()
        res.send(problem)
       })

    }
    finally{

    }

}
run().catch(console.dir)
app.listen(port,()=>{
    console.log(`Running server ${port}`);
})