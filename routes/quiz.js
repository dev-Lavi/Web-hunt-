import express from 'express';
import AnswerKey from '../models/answerKey.js';
import Team from '../models/team.js';

const router = express.Router();

// Function to normalize answers (removes special characters, trims, and makes lowercase)
const normalize = (str) =>
  str?.replace(/[^\w\s]/gi, '').trim().toLowerCase();

// POST /submit
router.post('/submit', async (req, res) => {
  console.log("POST /api/quiz/submit hit");

  const { teamName, answers } = req.body;

  if (!teamName || !answers || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ message: 'Invalid request: teamName and answers are required' });
  }

  try {
    // Check if the team already submitted
    const existingTeam = await Team.findOne({ teamName });
    if (existingTeam) {
      return res.status(400).json({ message: 'This team has already submitted answers!' });
    }

    let totalReward = 0;
    const responseAnswers = [];

    for (let ans of answers) {
      const correct = await AnswerKey.findOne({ questionId: ans.questionId });

      const isCorrect =
        correct &&
        normalize(ans.givenAnswer) === normalize(correct.correctAnswer);

      if (isCorrect) totalReward += 10000;

      responseAnswers.push({
        questionId: ans.questionId,
        givenAnswer: ans.givenAnswer,
        isCorrect,
      });
    }

    // Save result
    const team = new Team({
      teamName,
      answers: responseAnswers,
      totalReward,
    });

    await team.save();

    res.json({
      teamName,
      totalCorrect: responseAnswers.filter((ans) => ans.isCorrect).length,
      totalReward,
      message: 'Answers evaluated successfully!',
    });
  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).send('Server Error');
  }
});

export default router;
