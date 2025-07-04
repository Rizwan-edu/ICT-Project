import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  website: { type: String },
  location: { type: String, required: true },
  industry: { type: String, required: true },
  size: { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '500+'], required: true },
  logo: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export default mongoose.model('Company', companySchema);