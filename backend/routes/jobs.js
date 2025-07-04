import express from 'express';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import { auth, adminAuth } from '../middleware/auth.js';
import dataJobsService from '../services/dataJobs.js';

const router = express.Router();

// Get all jobs with advanced filtering
router.get('/', async (req, res) => {
  try {
    const { location, jobType, experience, remote, search, page = 1, limit = 10 } = req.query;
    const filter = {};
    
    if (location) filter.location = new RegExp(location, 'i');
    if (jobType) filter.jobType = jobType;
    if (experience) filter.experience = experience;
    if (remote === 'true') filter.remote = true;
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const jobs = await Job.find(filter)
      .populate('company', 'name logo')
      .sort({ urgent: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    const total = await Job.countDocuments(filter);
    
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single job with view increment
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('company');
    
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create job (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const job = new Job({ ...req.body, createdBy: req.user.userId });
    const savedJob = await job.save();
    res.status(201).json(savedJob);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update job (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete job (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    await Application.deleteMany({ jobId: req.params.id });
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Import jobs from data source (admin only)
router.post('/import', adminAuth, async (req, res) => {
  try {
    const { jobsData, apiUrl } = req.body;
    let jobs = jobsData;
    
    if (apiUrl && !jobsData) {
      jobs = await dataJobsService.fetchExternalJobs(apiUrl);
    }
    
    const results = await dataJobsService.addJobsFromData(jobs, req.user.userId);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Apply for job
router.post('/:id/apply', auth, async (req, res) => {
  try {
    const existingApplication = await Application.findOne({
      jobId: req.params.id,
      userId: req.user.userId
    });
    
    if (existingApplication) {
      return res.status(400).json({ success: false, message: 'Already applied for this job' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const application = new Application({
      jobId: req.params.id,
      userId: req.user.userId,
      userEmail: req.user.email || 'user@example.com'
    });
    
    await application.save();
    res.status(201).json({ success: true, message: 'Application submitted successfully' });
  } catch (error) {
    console.error('Apply error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
