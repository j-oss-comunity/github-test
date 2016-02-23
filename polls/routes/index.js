// Connect to MongoDB using Mongoose
var mongoose = require('mongoose');
var db;
if (process.env.VCAP_SERVICES) {
   var env = JSON.parse(process.env.VCAP_SERVICES);
   db = mongoose.createConnection(env['mongodb-2.2'][0].credentials.url);
} else {
   db = mongoose.createConnection('localhost', 'pollsapp');
//   db = mongoose.createConnection('192.168.99.100', 'pollsapp');
}

// Get Poll schema and model
var PollSchema = require('../models/Poll.js').PollSchema;
var Poll = db.model('polls', PollSchema);

// Main application view
exports.index = function(req, res) {
	console.log('index!');
	res.render('index');
};

// JSON API for list of polls
exports.list = function(req, res) {
	// Query Mongo for polls, just get back the question text
//	Poll.find({}, 'question', function(error, polls) {
	Poll.find({}, null, function(error, polls) {
		console.log('list!');
		res.json(polls);
	});
};

// JSON API for getting a single poll
exports.poll = function(req, res) {
	// Poll ID comes in the URL
	var pollId = req.params.id;
	
	// Find the poll by its ID, use lean as we won't be changing it
	Poll.findById(pollId, '', { lean: true }, function(err, poll) {
		if(poll) {
			var userVoted = false,
					userChoice,
					totalVotes = 0,
					maxVoteLength = 0;

			// Loop through poll choices to determine if user has voted
			// on this poll, and if so, what they selected
			for(c in poll.choices) {
				var choice = poll.choices[c]; 

				if(choice.votes != null && choice.votes.length > maxVoteLength) {
					maxVoteLength = choice.votes.length;
				}

				for(v in choice.votes) {
					var vote = choice.votes[v];
					totalVotes++;

					if(vote.ip === (req.header('x-forwarded-for') || req.ip)) {
						userVoted = true;
						userChoice = { _id: choice._id, text: choice.text };
					}
				}
			}

			// Attach info about user's past voting on this poll
			poll.userVoted = userVoted;
			poll.userChoice = userChoice;

			poll.totalVotes = totalVotes;
			
			poll.maxVoteLength = maxVoteLength;
			
			console.log(maxVoteLength);
			
			console.log('poll!');
			res.json(poll);
		} else {
			res.json({error:true});
		}
	});
};

// JSON API for creating a new poll
exports.create = function(req, res) {
	var reqBody = req.body,
			// Filter out choices with empty text
			choices = reqBody.choices.filter(function(v) { return (v.text != '' || v.img != ''); }),
			// Build up poll object to save
			pollObj = {
				title: reqBody.title,
				question: reqBody.question,
				questionImg: reqBody.questionImg,
				questionImgSide: reqBody.questionImgSide,
				openDateTime: reqBody.openDateTime,
				closeDateTime: reqBody.closeDateTime,
				choices: choices
			};
				
	// Create poll model from built up poll object
	var poll = new Poll(pollObj);
	
	// Save poll to DB
	poll.save(function(err, doc) {
		if(err || !doc) {
			throw 'Error';
		} else {
			console.log('create!');
			res.json(doc);
		}		
	});
};

exports.vote = function(socket) {
	console.log('vote!');
	socket.on('send:vote', function(data) {
		var ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address;
		
		Poll.findById(data.poll_id, function(err, poll) {
			var choice = poll.choices.id(data.choice);
			choice.votes.push({ ip: ip });
			
			poll.save(function(err, doc) {
				var theDoc = { 
					title: doc.title, question: doc.question, _id: doc._id, choices: doc.choices, 
					userVoted: false, totalVotes: 0, maxVoteLength: 0
				};

				// Loop through poll choices to determine if user has voted
				// on this poll, and if so, what they selected
				for(var i = 0, ln = doc.choices.length; i < ln; i++) {
					var choice = doc.choices[i]; 

					if(choice.votes != null && choice.votes.length > theDoc.maxVoteLength) {
						theDoc.maxVoteLength = choice.votes.length;
					}

					for(var j = 0, jLn = choice.votes.length; j < jLn; j++) {
						var vote = choice.votes[j];
						theDoc.totalVotes++;
						theDoc.ip = ip;

						if(vote.ip === ip) {
							theDoc.userVoted = true;
							theDoc.userChoice = { _id: choice._id, text: choice.text };
						}
					}
				}
				
				socket.emit('myvote', theDoc);
				socket.broadcast.emit('vote', theDoc);
			});			
		});
	});
};