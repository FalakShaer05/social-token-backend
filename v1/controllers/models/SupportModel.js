const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
const { Schema } = mongoose;

const SupportSchema = Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  status: { 
    type: String, 
    enum: ['open', 'in_progress', 'resolved', 'closed'], 
    default: 'open' 
  },
  category: { 
    type: String, 
    enum: ['technical', 'billing', 'general', 'bug_report', 'feature_request'], 
    default: 'general' 
  },
  user_agent: { type: String, required: false },
  ip_address: { type: String, required: false },
  attachments: { type: Array, default: [] },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});

// Update the updated field before saving
SupportSchema.pre('save', function (next) {
  this.updated = new Date();
  next();
});

// Update the updated field before updating
SupportSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updated: new Date() });
  next();
});

const SupportModel = mongoose.model('Support', SupportSchema);
module.exports = SupportModel;
