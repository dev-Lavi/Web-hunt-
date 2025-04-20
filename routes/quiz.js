import express from 'express';
import AnswerKey from '../models/answerKey.js';
import Team from '../models/team.js';

const router = express.Router();

// POST /submit
router.post('/submit', async (req, res) => {
console.log("POST /api/quiz/submit hit");
  const { teamName, answers } = req.body;

  try {
    let totalReward = 0;
    const responseAnswers = [];

    for (let ans of answers) {
      const correct = await AnswerKey.findOne({ questionId: ans.questionId });

      const isCorrect =
        correct &&
        ans.givenAnswer.trim().toLowerCase() ===
          correct.correctAnswer.trim().toLowerCase();

      if (isCorrect) totalReward += 10000;

      responseAnswers.push({
        questionId: ans.questionId,
        givenAnswer: ans.givenAnswer,
        isCorrect,
      });
    }

    // Save result
    const team = await Team.findOneAndUpdate(
      { teamName },
      { teamName, answers: responseAnswers, totalReward },
      { upsert: true, new: true }
    );

    res.json({
      teamName,
      totalCorrect: responseAnswers.filter((ans) => ans.isCorrect).length,
      totalReward,
      message: 'Answers evaluated successfully!',
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

export default router; 
