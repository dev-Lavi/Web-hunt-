import express from 'express';
import AnswerKey from '../models/answerKey.js';
import Team from '../models/team.js';

const router = express.Router();


const normalize = (str) =>
  str?.replace(/[^\w\s]/gi, '').trim().toLowerCase();


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

    const newTeam = new Team({
      teamName,
      totalReward: 100,
    });

    await newTeam.save();

    res.status(201).json({
      message: 'Team registered successfully and awarded 100 points!',
      team: {
        teamName: newTeam.teamName,
        totalReward: newTeam.totalReward,
      },
    });
  } catch (err) {
    console.error('Error registering team:', err);
    res.status(500).send('Server error');
  }
});


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

    let rewardEarnedThisSubmission = 0;
    const evaluatedAnswers = [];

    for (let ans of answers) {
      const { questionId, givenAnswer } = ans;

if (typeof questionId !== 'number' || typeof givenAnswer !== 'string') {
  return res.status(400).json({ message: 'Invalid answer format' });
}

      const correct = answerKeyMap[questionId];

      const isCorrect =
        correct &&
        normalize(givenAnswer) === normalize(correct);

      if (isCorrect) rewardEarnedThisSubmission += 15;

      evaluatedAnswers.push({
        questionId,
        givenAnswer,
        isCorrect: !!isCorrect,
      });
    }

    team.answers = evaluatedAnswers;
    team.totalReward += rewardEarnedThisSubmission; 
    await team.save();

    res.json({
      teamName,
      totalCorrect: evaluatedAnswers.filter(ans => ans.isCorrect).length,
      rewardEarnedThisSubmission,
      totalReward: team.totalReward,
      message: 'Answers submitted and evaluated successfully!',
    });

  } catch (err) {
    console.error('Error submitting answers:', err);
    res.status(500).send('Server error');
  }
});


router.get('/scoreboard', async (req, res) => {
  try {
    const teams = await Team.find({}, { teamName: 1, totalReward: 1, _id: 0 })
      .sort({ totalReward: -1 });

    res.json({
      message: 'Scoreboard fetched successfully!',
      scoreboard: teams,
    });
  } catch (err) {
    console.error('Error fetching scoreboard:', err);
    res.status(500).send('Server error');
  }
});

export default router;
