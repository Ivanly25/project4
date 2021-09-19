// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for projects
const Project = require('../models/project')
const customErrors = require('../../lib/custom_errors')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { project: { title: '', text: 'foo' } } -> { project: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
const project = require('../models/project')
// const { request } = require('chai')

// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// {
// "project": {
//       "projectName": "neww project",
//       "shortDescription": "built a fully functional tic tac toe game",
//       "toolsUsed": "html, css, javaScript, bootStrap",
//       "laborTime": "0 hours",
//       "done": true,
//       "payer": "3rd party company"
//     }
// }
// CREATE
// POST /projects
router.post('/create-project', requireToken, (req, res, next) => {
  console.log(req.user, 'The User making the request')
  // find the list we're going add the project to
  req.body.project.owner = req.user.id
  console.log(req.body.project, 'The product data')
  Project.create(req.body.project)
  // respond to successful `create` with status 201 and JSON of new "project"
    .then((project) => res.status(201).json({ project: project.toObject() }))
  // if an error occurs, pass it off to our error handler
  // the error handler needs the error message and the `res` object so that it
  // can send an error message back to the client
    .catch(next)
})

// SHOW
// GET /projects/5a7db6c74d55bc51bdf39793/e13l1420995bc51bdf39793
router.get('/projects/:id', requireToken, (req, res, next) => {
  Project.findById(req.params.id)
    .then(handle404)
    // .then((list) => list.projects.id(req.params.projectId))
    .then((project) => res.status(200).json({ project: project.toObject() }))
  // if an error occurs, pass it to the handler
    .catch(next)
})
// GET All projects
router.get('/projects', (req, res, next) => {
  Project.find()
    .then((projects) => {
      return projects.map((project) => project.toObject())
    })
    .then((projects) => res.status(200).json({ projects: projects }))
    .catch(next)
})
// UPDATE
// PATCH /projects/5a7db6c74d55bc51bdf39793
router.patch('/projects/:id', requireToken, removeBlanks, (req, res, next) => {
// if the client attempts to change the `owner` property by including a new
// owner, prevent that by deleting that key/value pair
  delete req.body.project.owner

  Project.findById(req.params.id)
    .then(handle404)
    // .then(list => list.projects.id(req.params.projectId))
    .then((list) => {
      // pass the `req` object and the Mongoose record to `requireOwnership`
      // it will throw an error if the current user isn't the owner
      // const project = project.id(req.params.projectId)

      requireOwnership(req, project)

      // project.set(req.body.project)
      // pass the result of Mongoose's `.update` to the next `.then`
      return project.updateOne(req.body.project)
    })
  // if that succeeded, return 204 and no JSON
    .then(() => res.sendStatus(204))
  // if an error occurs, pass it to the handler
    .catch(next)
}
)

// DESTROY
// DELETE /projects/5a7db6c74d55bc51bdf39793
router.delete('/projects/:id', requireToken, (req, res, next) => {
  Project.findById(req.params.id)
    .then(handle404)
    .then((project) => {
      // throw an error if current user doesn't own `list`
      requireOwnership(req, project)
      // delete the list ONLY IF the above didn't throw
      project.deleteOne()
    })
  // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
  // if an error occurs, pass it to the handler
    .catch(next)
})

module.exports = router
