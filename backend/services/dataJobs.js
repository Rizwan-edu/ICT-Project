import Job from '../models/Job.js';

class DataJobsService {
  // Add jobs from external data source
  async addJobsFromData(jobsData, createdBy) {
    const results = { success: 0, failed: 0, errors: [] };
    
    for (const jobData of jobsData) {
      try {
        const existingJob = await Job.findOne({ 
          title: jobData.title, 
          location: jobData.location 
        });
        
        if (!existingJob) {
          const job = new Job({
            title: jobData.title,
            description: jobData.description,
            requirements: jobData.requirements,
            location: jobData.location,
            salary: jobData.salary,
            jobType: jobData.jobType,
            createdBy
          });
          
          await job.save();
          results.success++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ job: jobData.title, error: error.message });
      }
    }
    
    return results;
  }

  // Fetch jobs from external API (example implementation)
  async fetchExternalJobs(apiUrl) {
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      return data.jobs || data;
    } catch (error) {
      throw new Error(`Failed to fetch external jobs: ${error.message}`);
    }
  }
}

export default new DataJobsService();