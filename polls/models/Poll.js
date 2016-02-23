var mongoose = require('mongoose');

// Subdocument schema for votes
var voteSchema = new mongoose.Schema({ ip: 'String' });

// Subdocument schema for poll choices
var choiceSchema = new mongoose.Schema({ 
	text: String,
	img: String,
	imgSide: String,
	votes: [voteSchema]
});

// Document schema for polls
exports.PollSchema = new mongoose.Schema({
	title: { type: String, required: true },
	question: String,
	questionImg: String,
	questionSide: String,
	openDateTime: String,
	closeDateTime: String,
	choices: [choiceSchema]
});