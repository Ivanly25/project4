/* eslint-disable no-unused-vars */
const mongoose = require('mongoose')
// const User = require('./user')

const projectSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    required: true
  },
  toolsUsed: {
    type: String,
    required: true
  },
  laborTime: {
    type: String,
    required: true
  },
  done: {
    type: Boolean,
    required: false
  },
  payer: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }

}, {
  timestamps: true
})

module.exports = mongoose.model('Project', projectSchema)
