import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'

import listEndpoints from 'express-list-endpoints'

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/happyThoughts"
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.Promise = Promise

// Defines the port the app will run on. Defaults to 8080, but can be 
// overridden when starting the server. For example:
//
//   PORT=9000 npm start
const port = process.env.PORT || 8080
const app = express()

const ThoughtSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 140,
  }, 
  hearts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: () => Date.now()
  },
})

const Thought = mongoose.model('Thought', ThoughtSchema)

// Add middlewares to enable cors and json body parsing
app.use(cors())
app.use(express.json())

// Start defining your routes here

app.get('/', (req, res) => {
  res.send(listEndpoints(app))
})

// ### `GET /thoughts`
// This endpoint should return a maximum of 20 thoughts, sorted by `createdAt`
// to show the most recent thoughts first.

app.get('/thoughts', async (req, res) => {
  const thoughts = await Thought.find().sort({createdAt: 'desc'}).limit(20).exec()
  res.json(thoughts)
})

// ### `POST /thoughts`
// This endpoint expects a JSON body with the thought `message`, like this:
// `{ "message": "Express is great!" }`.
// If the input is valid (more on that below), the thought should be saved,
// and the response should include the saved thought object, including its `_id`.

app.post('/thoughts', async (req, res) => {
  const { message } = req.body

  try {
    const thought = await new Thought({ message }).save()
    res.status(201).json({ response: thought, success: true })
  } catch (error) {
    res.status(400).json({ response: error, success: false })
  }
})

// ### `POST thoughts/:thoughtId/like`
// This endpoint doesn't require a JSON body. Given a valid thought id in the URL,
// the API should find that thought, and update its `hearts` property to add one heart.

app.post('/thoughts/:thoughtId/like', async (req, res) => {
  const { thoughtId } = req.params

  try {
    const updatedThought = await Thought.findByIdAndUpdate(
      {
        _id: thoughtId,
      },
      {
        $inc: {
          hearts: 1,
        },
      },
      {
        new: true,
      })
      res.status(200).json({ response: updatedThought, success: true})
    } catch (error) {
      res.status(400).json({ response: error, success: false })
    }
})

// Start the server
app.listen(port, () => {
  // eslint-disable-next-line
  console.log(`Server running on http://localhost:${port}`)
})
