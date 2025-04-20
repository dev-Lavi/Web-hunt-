import express from 'express';
import AnswerKey from '../models/answerKey.js';
import Team from '../models/team.js';

const router = express.Router();

// Function to normalize answers (removes special characters, trims, and makes lowercase)
const normalize = (str) =>
  str?.replace(/[^\w\s]/gi, '').trim().toLowerCase();

/**
 * POST /api/quiz/register-team
 * Registers a team name before submission
 */
router.post('/register-team', async (req, res) => {
  const { teamName } = req.body;

  if (!teamName || typeof teamName !== 'string') {
    return res.status(400).json({ message: 'Team name is required' });
  }

  try {
    const existing = await Team.findOne({ teamName });
    if (existing) {
      return res.status(400).json({ message: 'Team already registered' });
    }

    const newTeam = new Team({ teamName });
    await newTeam.save();

    res.status(201).json({ message: 'Team registered successfully' });
  } catch (err) {
    console.error('Error registering team:', err);
    res.status(500).send('Server error');
  }
});

/**
 * POST /api/quiz/submit-answers
 * Accepts submitted answers and evaluates them
 */
router.post('/submit-answers', async (req, res) => {
  const { teamName, answers } = req.body;

  if (!teamName || !answers || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ message: 'Invalid input: teamName and answers are required' });
  }

  try {
    const team = await Team.findOne({ teamName });

    if (!team) {
      return res.status(404).json({ message: 'Team not found. Please register first.' });
    }

    if (team.answers && team.answers.length > 0) {
      return res.status(400).json({ message: 'Answers already submitted for this team.' });
    }

    // Get all answer keys
    const answerKeyDocs = await AnswerKey.find({});
    const answerKeyMap = {};
    answerKeyDocs.forEach(doc => {
      answerKeyMap[doc.questionId] = doc.correctAnswer;
    });

    let totalReward = 0;
    const evaluatedAnswers = [];

    for (let ans of answers) {
      const { questionId, givenAnswer } = ans;

      if (
        typeof questionId !== 'number' ||
        typeof givenAnswer !== 'string' ||
        !givenAnswer.trim()
      ) {
        return res.status(400).json({ message: 'Invalid answer format' });
      }

      const correct = answerKeyMap[questionId];

      const isCorrect =
        correct &&
        normalize(givenAnswer) === normalize(correct);

      if (isCorrect) totalReward += 10000;

      evaluatedAnswers.push({
        questionId,
        givenAnswer,
        isCorrect: !!isCorrect,
      });
    }

    // Update team with answers and reward
    team.answers = evaluatedAnswers;
    team.totalReward = totalReward;
    await team.save();

    res.json({
      teamName,
      totalCorrect: evaluatedAnswers.filter(ans => ans.isCorrect).length,
      totalReward,
      message: 'Answers submitted and evaluated successfully!',
    });

  } catch (err) {
    console.error('Error submitting answers:', err);
    res.status(500).send('Server error');
  }
});

export default router;
