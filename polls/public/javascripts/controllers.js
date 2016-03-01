// Controller for the poll list
function PollListCtrl($scope, Poll) {
	$scope.polls = Poll.query();
	
	$scope.headers = [
		"ステータス",
		"タイトル",
		"投票数",
		"開始日時",
		"終了日時"
//		"終了日時",
//		"投票/未投票"
	];
	
	$scope.calcPollTotalVotes = function(poll) {
		// count totalVotes and find userVote
		var totalVotes = 0;
		for(c in poll.choices) {
			var choice = poll.choices[c];
			if(choice.votes == null) {
				continue;
			}
			totalVotes += choice.votes.length;
		}
		return totalVotes;
	};
	
	const STATUS = {
		wait : {
			text: "投票開始待ち"
		}, 
		open : {
			text: "投票受付中"
		},
		close : {
			text: "投票終了"
		}
	};

	$scope.buildPollStatusStr = function(poll) {
		// build status string
		var status = STATUS.open;
		var now = new Date(Date.now());
		var openDateStr = poll.openDateTime;
		console.log(status);
		console.log(now);
		console.log(openDateStr);
		if(openDateStr != null && openDateStr.length > 0) {
			var openDate = new Date(openDateStr);
			if(now < openDate) {
				status = STATUS.wait;
			} else {
				status = STATUS.open;
			}
		}
		var closeDateStr = poll.closeDateTime;
		console.log(closeDateStr);
		if(closeDateStr != null && closeDateStr.length > 0) {
			var closeDate = new Date(closeDateStr);
			if(now < closeDate) {
				status = STATUS.open;
			} else {
				status = STATUS.close;
			}
		}
		return status.text;
	};
	
	$scope.isUserVoted = function(poll) {
		var choices = poll.choices;
		if(choices == null) {
			// err
			return false;
		}
		// TODO
		return false;
	};
}

// Controller for an individual poll
function PollItemCtrl($scope, $routeParams, socket, Poll) {	
	$scope.poll = Poll.get({pollId: $routeParams.pollId});
	
	socket.on('myvote', function(data) {
		console.dir(data);
		if(data._id === $routeParams.pollId) {
			$scope.poll = data;
		}
	});
	
	socket.on('vote', function(data) {
		console.dir(data);
		if(data._id === $routeParams.pollId) {
			$scope.poll.choices = data.choices;
			$scope.poll.totalVotes = data.totalVotes;
			$scope.poll.maxVoteLength = data.maxVoteLength;
			
			console.log("", data);
		}
	});
	
	$scope.vote = function() {
		var pollId = $scope.poll._id,
				choiceId = $scope.poll.userVote;
		
		if(choiceId) {
			var voteObj = { poll_id: pollId, choice: choiceId };
			socket.emit('send:vote', voteObj);
		} else {
			alert('You must select an option to vote for');
		}
	};
	
	// to use Math class
	$scope.Math = Math;
	
	
	$scope.isOpen = function(poll) {
		if(poll == null) {
			console.log("isOpen : poll must not be null!");
			return false;
		}
		var isOpen = true;
		var now = new Date(Date.now());
		var openDateStr = poll.openDateTime;
		var closeDateStr = poll.closeDateTime;
		console.log(now);
		console.log(openDateStr);
		console.log(closeDateStr);
		if(openDateStr != null && openDateStr.length > 0) {
			var openDate = new Date(openDateStr);
			isOpen = now >= openDate;
		}
		if(closeDateStr != null && closeDateStr.length > 0) {
			var closeDate = new Date(closeDateStr);
			isOpen = (now <= closeDate) && isOpen;
		}
		return isOpen;
	};
	
	
	$scope.isLeft = function(imgSide) {
		console.log(imgSide + " isLeft " + (imgSide === 'left'));
		return imgSide === 'left';
	};
	
	$scope.hasImg = function(imgUri) {
		// console.log(imgUri + " hasImg " + (imgUri.length > 0));
		return imgUri != null && imgUri.length > 0;
	};
	
	$scope.showpoll = function(poll) {
		console.log('showpoll ', poll);
		return true;
	};
}

// Controller for creating a new poll
function PollNewCtrl($scope, $location, Poll) {
	// Define an empty poll model object
	$scope.poll = {
		title: '',
		question: '',
		questionImg: '',
		questionImgSide: 'left',
		openDateTime: '',
		closeDateTime: '',
		choices: [ 
			{ text: '', img:'', imgSide:'left', votes: [] }, 
			{ text: '', img:'', imgSide:'left', votes: [] }
		]
	};
	
	// Method to add an additional choice option
	$scope.addChoice = function() {
		$scope.poll.choices.push({ text: '', img:'', imgSide:'left', votes: [] });
	};
	
	// Validate and save the new poll to the database
	$scope.createPoll = function() {
		var poll = $scope.poll;
		
		// やっつけvalidation (^^;)
		if(poll.title.length <= 0) {
			alert("タイトルを入力してください");
			return;
		}
		var questionImgFile = document.getElementById('pollQuestionImgFile');
		if(poll.question.length <= 0 && questionImgFile.files.length < 1) {
			alert("質問の文章を入力するか、画像ファイルを選択してください");
			return;
		}

		var openDate = document.getElementById('pollOpenDate');
		var openTime = document.getElementById('pollOpenTime');
		if(openDate.value.length > 0) {
			if(openTime.value.length > 0) {
				poll.openDateTime = openDate.value + " " + openTime.value + ":00";
			} else {
				poll.openDateTime = openDate.value + " 00:00:00";
			}
		}
		var closeDate = document.getElementById('pollCloseDate');
		var closeTime = document.getElementById('pollCloseTime');
		if(closeDate.value.length > 0) {
			if(closeTime.value.length > 0) {
				poll.closeDateTime = closeDate.value + " " + closeTime.value + ":00";
			} else {
				poll.closeDateTime = closeDate.value + " 00:00:00";
			}
		}
		
		var choiceCount = 0;
		
		// Loop through the choices, make sure at least two provided
		for(var i = 0, ln = poll.choices.length; i < ln; i++) {
			var choice = poll.choices[i];
			
			if(choice.text.length > 0 || choice.img.length > 0) {
				choiceCount++
			}
		}
		if(choiceCount > 1) {
			// Create a new poll from the model
			var newPoll = new Poll(poll);
			
			// Call API to save poll to the database
			newPoll.$save(function(p, resp) {
				if(!p.error) {
					// If there is no error, redirect to the main view
					$location.path('polls');
				} else {
					alert('Could not create poll');
				}
			});
		} else {
			alert('You must enter at least two choices');
		}
		console.log(JSON.stringify(poll));
	};
	
	/*
	$scope.uploadme = {};
	$scope.uploadme.src = "";
	*/

}
