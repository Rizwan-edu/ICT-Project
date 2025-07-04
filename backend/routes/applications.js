import express from 'express';
import Application from '../models/Application.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Get user's applications
router.get('/my', auth, async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user.userId })
      .populate('jobId', 'title location salary jobType')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all applications (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const applications = await Application.find()
      .populate('jobId', 'title location salary jobType')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update application status (admin only)
router.patch('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!application) return res.status(404).json({ message: 'Application not found' });
    res.json(application);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete application (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);
    if (!application) return res.status(404).json({ message: 'Application not found' });
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;