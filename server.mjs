// server.js
import express from 'express'; 
import cors from 'cors'; 
import studentsRoutes from './routes/students.js'; 
import reportOutcomesRoutes from './routes/reportOutcomes.js'; 
import learningOutcomesRoutes from './routes/learningOutcomes.js';
import assessmentCriteriasRoutes from './routes/assessmentCriterias.js';
import acScoresRoutes from './routes/acScores.js';
import loAcMappingRoutes from './routes/loAcMapping.js';
import roLoMappingRoutes from './routes/roLoMapping.js';
import loScoresRoutes from './routes/loScores.js';
import roScoresRoutes from './routes/roScores.js';

const app = express();
const PORT = process.env.PORT || 8000; 

app.use(express.json()); 
app.use(cors()); 

// routes
app.use('/api/students', studentsRoutes); 
app.use('/api/report_outcomes', reportOutcomesRoutes); 
app.use('/api/learning_outcomes', learningOutcomesRoutes);
app.use('/api/assessment_criterias', assessmentCriteriasRoutes);
app.use('/api/ac_scores', acScoresRoutes); 
app.use('/api/lo_ac_mapping', loAcMappingRoutes); 
app.use('/api/ro_lo_mapping', roLoMappingRoutes);
app.use('/api/lo_scores', loScoresRoutes);
app.use('/api/ro_scores', roScoresRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});