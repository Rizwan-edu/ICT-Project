import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  requirements: { type: String, required: true },
  location: { type: String, required: true },
  salary: { type: String, required: true },
  jobType: { type: String, required: true, enum: ['Full-time', 'Part-time', 'Contract', 'Internship'] },
  experience: { type: String, enum: ['Entry', 'Mid', 'Senior', 'Executive'], default: 'Entry' },
  skills: [{ type: String }],
  benefits: [{ type: String }],
  remote: { type: Boolean, default: false },
  urgent: { type: Boolean, default: false },
  deadline: { type: Date },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  status: { type: String, enum: ['active', 'closed', 'draft'], default: 'active' },
  views: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

export default mongoose.model('Job', jobSchema);
