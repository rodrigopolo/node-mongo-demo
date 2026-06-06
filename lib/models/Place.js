'use strict';
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name:        { type: String, index: true },
  imgext:      String,
  description: String,
  location: {
    type: {
      type:     String,
      enum:     ['Point', 'LineString', 'Polygon'],
      required: true,
      default:  'Point'
    },
    coordinates: { type: Array }
  },
  author:      { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  last_edit_by:{ type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  created:     { type: Date, default: Date.now },
  edited:      { type: Date, default: Date.now }
});

schema.index({ location: '2dsphere' });

module.exports = mongoose.model('places', schema);
