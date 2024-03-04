const dotenv = require('dotenv')
dotenv.config()
const express = require('express')
const {v4:uuidv4} = require('uuid')
const colors = require('colors')
const body_parser = require('body-parser')
const {MongoClient, ObjectId} = require('mongodb')
const client = new MongoClient(process.env.MONGODB_URI)

const app = express()

//middleware
app.use(express.json())
//app.use(body_parser.json())
app.use(express.urlencoded({extended:true}))


//specify the database name
const db_name = 'tempdb'
//the collections we will have are the countries
const country_names = ['Kenya','France','India','US']

//connect to mongodb through URI
const connectToDb = async () =>{
    try {
        await client.connect();
        console.log(`Connected to mongodb successfully.`.bgGreen)
    } catch (err) {
        console.log(`Error: ${err}`)
    }
}



//create example temp data
let temp_data = {
    device_location:{"long":"36.821945","lat":"-1.292066"},
    country:'KE',
    last_update: new Date()
}

//GET Request
app.get('/api/v1.0/get_temp', async (req,res) => {
    try {
        //connect to the database
        connectToDb()
        //fetch all temperatures from the database
        let results = await client.db(db_name).collection(country_names[0]).find()
        //append them in an array
        let temps=[]
        await results.forEach((temp)=>{
            temps.push(temp)
        })
        //return response
       if (temps.length>0)  res.status(200).json({status:'OK',readings:temps})
       else  res.status(404).json({status:'NOT FOUND',response:'No temperature readings are available.'})
    } catch (error) {
        console.log(error)
    } finally{
        await client.close()
    }
})

//POST Request
app.post('/api/v1.0/post_temp', async (req,res) =>{
    try {
        //connect to the database
        connectToDb()
        let result = await client.db(db_name).collection(country_names[0]).insertOne(temp_data)
        if(result) res.status(201).json({status:'Created',response:`Added ${result.insertedId} to db - ${country_names[0]}`})
    } catch (err) {
        console.log(err)
    }finally{
        //close the connection
        await client.close()
    }

})

app.put('/api/v1.0/update_temp/:id', async (req,res) =>{
    try {
        //connect to the database
        connectToDb()
        //get the device id
        let device_id = req.params.id
        let  country = req.body.country
        let  long = req.body.long
        let  lat = req.body.lat

        
        //query the db
        await client.db(db_name).collection(country_names[0]).updateOne({_id:new ObjectId(device_id)},{$set:{"device_location.long":`${long}`}})
        res.status(201).json({response:`Device ${device_id} updated`})

    } catch (err) {
        console.log(err)
    }finally{
        client.close()
    }
})

const PORT = process.env.PORT || 5001

app.listen(PORT, ()=> console.log(`App listening on port: ${PORT}`))
