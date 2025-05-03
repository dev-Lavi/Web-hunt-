import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  answers: [
    {
      questionId: {
        type: Number,
        required: true,
      },
      givenAnswer: {
        type: String,
        required: false, 
      },
      isCorrect: {
        type: Boolean,
        required: false, 
      },
    },
  ],
  totalReward: {
    type: Number,
    default: 0,
  },
});

const Team = mongoose.model('Team', teamSchema);
export default Team;
