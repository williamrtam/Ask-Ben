var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var session = require('express-session');
var app = express('./app');

var passport = require('passport');
var passportSetup = require('../config/passport-setup');

var mysql = require('mysql');
var connection = mysql.createConnection({
  host     : 'cis350.c5rvqqjl9c91.us-east-1.rds.amazonaws.com',
  user     : 'cis350team46',
  password : 'cis350askben',
  database : 'cis350'
});

var db = require('../public/js/db_api');
var SHA3 = require('crypto-js/sha3');

var nodemailer = require('nodemailer');

var hash = "";
var tagFilter = "";
var loadAll = false;
var filter = "";


// ssh into eniac by entering in the terminal ssh pennkey@eniac.seas.upenn.edu
// input ur password
// to login to database input the following
// mysql -h cis350.c5rvqqjl9c91.us-east-1.rds.amazonaws.com -P 3306 -u cis350team46 -p
// when you are prompted put the password below
// cis350askben
//once in the databse type the below line and press enter
// use cis350
// to see all the tables: show tables;
// to see the info in a specific table, users for example: select * from users;
// to see the description of the columns and their types of a specific table, posts for example: describe posts;

var NUM_MILLIS = 48 * 3600 * 1000;

function getMostRecentTags(num_tags) {
	db.getAllTags(connection, function(err, data) {
		if (err) {
			console.log(err);
		} else if (data == null) {
			console.log('data is null');
		} else {
			var curr_time = Date.now();
			var ret_2d_arr;
			for (var i = 0; i < data.length; i++) {
				var count = 0;
				var tag = data[i].tag;
				var post_id_arr = data[i].post_ids.split(",");
				for (var j = 0; j < post_id_arr.length-1; j++) {
					var post_time = db.getPostTime(post_id_arr[j], connection);
					if (curr_time - post_time <= NUM_MILLIS) {
						count++;
					}
				}
				ret_2d_arr.push([count, tag]);
			}

			ret_2d_arr.sort(function(a, b) {
			    if (a[0] === b[0]) {
			        return 0;
			    } else {
			        return (a[0] > b[0]) ? -1 : 1;
			    }
			});

			return ret_2d_arr.slice(0, 10);
		}
	});
}


function convertToArray(arrayOfObjects) {
	var array = [];
	for (i = 0; i < arrayOfObjects.length; i++) {
		array.push(arrayOfObjects[i].comment_id);
	}

	return array;
}

function loadPage(res, req, page, filter_option) {
	if (page == 'home') {
		console.log("Checking for the filter: " + filter);
		filter = "";
		console.log("Filter cleared " + filter);

		var email = req.session.email;
		console.log('home again');
		var max_id = 0;
		var trending = [];
		var userDrafts = [];
		var notifications = [];

		db.getNotifications(connection, req.session.email, function(err, data) {
			if (err) {
				console.log(err);
			} else {
				console.log('Got the notificationsss ------------------------------');
            	console.log(data[0]);  
				notifications = data;
			}
		});

		db.getTrendingTags(connection, function(err, data) {
			if (err) {
				console.log(err);
			} else {
				trending = data;
			}
		});

		db.getUserDrafts(connection, req.session.email, function(err, data) {
			if (err) {
				console.log(err);
			} else {
				userDrafts = data;
				console.log(userDrafts);
			}
		});

		db.getAllPostIDs(connection, filter_option, function(err, data) {
 			if (err) {
 				console.log(err);
 			} else if (data == 0) {
 				console.log('no posts in db');
 				res.render('home', {username: req.session.username, user: email, postIDs: [], posts: [], comments: [], commentsInfo: [], upvotes: [], downvotes: [], tags: [], trending: [], userDrafts: [], notifications: [], hash: "", load: loadAll});
 			} else {
 				var post_list = [data];

 				var posts_content = [];
 				var all_tags = [];
 				var comment_arr = [];
 				var email_info = new Array(data.length).fill([]);
 				var comments_info = new Array(data.length).fill([]);
 				var all_upvotes = [];
 				var all_downvotes = []; 

 				console.log(data.length + '------------------------------' + comments_info.length);

 				db.getLargestCommentPostID(connection, function(err, largest) { 
					if (err) {
						console.log(err);
					} else if (largest == null) {
						max_id = data.length;
						console.log('Null case:' +  max_id);
					} else {
						console.log('Else case:' +  largest.post_id);
						max_id = largest.post_id;
					}		 								
				});

 				for (i = 0; i < data.length; i++) {
 					console.log('Iter Outside: ' + i);
 					db.getPostInfo(data[i].post_id, connection, function(err, content) {
			 			if (err) {
			 				console.log(err);
			 			} else if (content == null) {
			 				console.log('content is null');
			 				posts_content.push([]);
			 				comment_arr.push([]);
			 			} else {

			 				// Get tags for current post
			 				console.log('Extracted hashtags: ' + content.tags);
			 				var tag_array = [];
			 				if (content.tags != 'null') {
			 					tag_array = content.tags.split(',');
			 				}
			 				console.log(tag_array);

			 				all_tags.push(tag_array);

			 				// Get post voter info for current post
			 				db.getPostVoters(content.post_id, connection, function(err, users) {
			 					if (err) {
			 						console.log(err);
			 					} else {
			 						console.log('Users: ' + users);
			 						var upvotes = [];
			 						var downvotes = [];

			 						for (i = 0; i < users.length; i++) {
			 							if (users[i].type == 1) {
			 								upvotes.push(users[i]);
			 							} else if (users[i].type == 0) {
			 								downvotes.push(users[i]);
			 							}
			 						}

			 						all_upvotes.push(upvotes);
			 						all_downvotes.push(downvotes);
			 					}
			 				});


			 				db.getAllCommentIDs(content.post_id, connection, function(err, comments) {
			 					if (err) {
			 						console.log(err);
			 					} else if (comments == null) {
			 						console.log('Null Exception: getting comments for ' + content.post_id);
			 					} else {
			 						posts_content.push(content);
			 						comment_arr.push(comments);

				 					var comment_info_arr = [];
				 					var email_info_arr = [];
				 					console.log('Post id ' + content.post_id);
				 					console.log(comments);		

				 					if (comments.length == 0 && content.post_id == max_id) {
								 		res.render('home', {username: req.session.username, user: email, postIDs: post_list, posts: posts_content, comments: comment_arr, commentsInfo: comments_info, email_info: email_info, upvotes: all_upvotes, downvotes: all_downvotes, tags: all_tags, trending: trending, userDrafts: userDrafts, notifications: notifications, hash: hash, load: loadAll});
				 					} else {
				 						for (j = comments.length-1; j >= 0; j--) {
											console.log('Getting comment information');
						 					db.getCommentInfo(comments[j].comment_id, connection, function(err, info) {
						 						console.log('Info: ' + JSON.stringify(info));
						 						if (err) {
						 							console.log(err);
						 						} else if (info == null) {
						 							console.log('Null Exception: trying to get info for ' + info.comment_id);
					 							} else {
					 								comment_info_arr.push(info.content);
					 								email_info_arr.push(info.email);

						 							// Add set of comment info to the current post index
						 							if (convertToArray(comments).indexOf(info.comment_id)+1 == 1) {
						 								console.log('End of comments');
														comments_info[info.post_id-1] = comment_info_arr;
														email_info[info.post_id-1] = email_info_arr;
					 								}

						 							console.log(info.post_id);
						 							console.log(content.post_id);
						 							console.log(data.length);
						 							console.log(convertToArray(comments).indexOf(info.comment_id));

									 				if (info.post_id == max_id && convertToArray(comments).indexOf(info.comment_id)+1 == 1) {
									 					res.render('home', {username: req.session.username, user: email, postIDs: post_list, posts: posts_content, comments: comment_arr, commentsInfo: comments_info, email_info: email_info, upvotes: all_upvotes, downvotes: all_downvotes, tags: all_tags, trending: trending, userDrafts: userDrafts, notifications: notifications, hash: hash, load: loadAll});
														console.log(comment_arr);
														console.log('DONE');
													}
					 							}
					 						});
				 						}
				 					}
			 					}
			 				});
			 			}
			 		});			 		
 				}
 			}
 		});

	}

	else if (page == 'profile') {
		var data = {};
		var query = 'SELECT * from users where email = "' + req.session.email + '";';
    	connection.query(query, function(err, rows, fields) {
	        if (err) {
	            console.log(err);
	            console.log('could not get user info');
	        } else {
	            console.log('got user info');
	            var rep = rows[0].comment_ids;
	            if (rep == null) {
	            	rep = 0;
	            } else {
	            	rep = rep.length;
	            	console.log("REP1: " + rep)
	            }
	            var email = rows[0].email;
	            var username = rows[0].username;
	            var major = rows[0].major;
	            var year = rows[0].year;
	            var city = rows[0].city; 
	            var description = rows[0].description;
	     		var friends = rows[0].friends
	            var upvote_ctr = 0;
	            var downvote_ctr = 0;

	            db.getUserPosts(req.session.email, connection, function(err, rows) {
			 		if (err) {
			 			console.log(err);
			 		} else if (rows == null) {
			 			console.log('data is null');
			 		} else {
			 			var cutoff = 0;
			 			console.log('Rows of posts');
			 			console.log(rows);
			 			for (i = 0; i < rows.length; i++) {
			 				if (rows[i].post_id > cutoff) {
			 					cutoff = rows[i].post_id;
			 				}
			 			}
			 			console.log('Cutoff:');
			 			console.log(cutoff);
			 			for (i = 0; i < rows.length; i++) {		
			 				var post_id = rows[i].post_id;
			 				db.getPostInfo(post_id, connection, function(err, data) {
			 					console.log(data.upvote_count);
			 					var up =data.upvote_count;
			 					upvote_ctr = upvote_ctr + up;
			 					console.log("UP: " + up);
			 					var down =data.downvote_count;
			 					downvote_ctr = upvote_ctr + down;
			 					console.log("DOWN: " + down)
			 					var incRep = up-down;
			 					console.log("INCREP: " + incRep);
			 					rep = rep + incRep;
			 					console.log("REP2: " + rep);
			 					console.log("post_id: " + post_id);
			 					console.log("cutoff: " + cutoff);
			 					if (data.post_id==cutoff) {
			 						console.log('got user posts info');
						            var posts = rows;
						            var answersQuery = 'SELECT * from comments where email = "' + req.session.email + '";';
						            connection.query(answersQuery, function(err, rows, fields) {
						            	console.log('Postsss:');
						            	console.log(posts);
								        if (err) {
								            console.log(err);
								            console.log('could not get user info');
								        } else {
								      		var comments = rows;
								      		var query = 'SELECT * from users where email = "' + req.session.email + '";';
									    	connection.query(query, function(err, rows, fields) {
										        if (err) {
										            console.log(err);
										            console.log('could not get user info');
										        } else {

										            //res.render('profile', {email: email, username: username, major: major, year: year, city: city, description: description, reputation: rep, answers: comments, posts: posts, upvotes: upvote_ctr, downvotes: downvote_ctr, friends: "", currUserEmail: ""});

										        	db.getPostsPerDay(connection, function(err, data) {
										        		if (err) {
												 			console.log(err);
												 		} else if (rows == null) {
												 			console.log('data is null');
												 		} else {
												 			console.log("DATA BABY!: " + data);
												 			var dayArr = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
												 			var x = new Date();
												 			var d = x.getDate();
												 			var m = x.getMonth();
												 			for (i = 0; i < data.length; i++) {
												 				var count = data[i][0];
												 				var day = data[i][1];
												 				console.log("COUNT BABY!: " + count);
												 				console.log("DAY BABY!: " + day);
												 				if (day <= d) {
												 					var diff = d-day;
												 					dayArr[dayArr.length - 1 - diff] =  count;
												 				} else {
												 					if (m==1 || m==3 || m==5 || m==7 || m==8 || m==10 || m==12) {
												 						var diff = d + (31-day);
												 					} else if (m==2) {
												 						var diff = d + (29-day);
												 					} else {
												 						var diff = d + (30-day);
												 					}
												 					dayArr[20-diff] =  count;
												 				}
												 				console.log("ARRAY BABY!: " + dayArr);
												 			}
												 			res.render('profile', {email: email, username: username, major: major, year: year, city: city, description: description, reputation: rep, answers: comments, posts: posts, upvotes: upvote_ctr, downvotes: downvote_ctr, dayArr: dayArr, friends: friends, currUserEmail: req.session.email});
												 		}
										        	}); 
										        }
										    });
								        }
								    });
			 					}
			 				});
			 			}
			 			
			 		}
			 	});
	     
	        }
   		}); 		
	}

	else if (page == 'settings') {
		var data = {};
		var query = 'SELECT * from users where email = "' + req.session.email + '";';
    	connection.query(query, function(err, rows, fields) {
	        if (err) {
	            console.log(err);
	            console.log('could not get user info');
	        } else {
	            console.log('got user info');
	            console.log(rows[0]);
	            res.render('settings', {email: rows[0].email, password: req.session.password});
	        }
   		}); 
	}

	else if (page == 'trending') {
		var data = {};
		var query = 'SELECT * from users where email = "' + req.session.email + '";';
    	connection.query(query, function(err, rows, fields) {
	        if (err) {
	            console.log(err);
	            console.log('could not get user info');
	        } else {
	            console.log('got user info');
	            console.log(rows[0]);
	            res.render('trending', {email: rows[0].email, password: rows[0].password});
	        }
	    });
	}

	else if (page == 'viewProfile') {
		console.log('Viewing someones profile..........');
		console.log(req.params);
		console.log(req.params.email);
		var data = {};
		var postsQuery = 'SELECT * from posts where email = "' + req.params.email + '";';
		connection.query(postsQuery, function(err, rows, fields) {
	        if (err) {
	            console.log(err);
	            console.log('could not get user posts info');
	        } else {
	            console.log('got user posts info');
	            var posts = rows;
	            var answersQuery = 'SELECT * from comments where email = "' + req.params.email + '";';
	            connection.query(answersQuery, function(err, rows, fields) {
	            	console.log('Postsss:');
	            	console.log(posts);
			        if (err) {
			            console.log(err);
			            console.log('could not get user info');
			        } else {
			      		var comments = rows;
			      		var query = 'SELECT * from users where email = "' + req.params.email + '";';



						connection.query(query, function(err, rows, fields) {
				        if (err) {
				            console.log(err);
				            console.log('could not get user info');
				        } else {
				            console.log('got user info');
				            var rep = rows[0].comment_ids;
				            if (rep == null) {
				            	rep = 0;
				            } else {
				            	rep = rep.length;
				            	console.log("REP1: " + rep)
				            }
				            var email = rows[0].email;
				            var username = rows[0].username;
				            var major = rows[0].major;
				            var year = rows[0].year;
				            var city = rows[0].city; 
				            var description = rows[0].description;
				            var upvote_ctr = 0;
	            			var downvote_ctr = 0;
	            			var friends = rows[0].friends
				            db.getUserPosts(req.params.email, connection, function(err, rows) {
						 		if (err) {
						 			console.log(err);
						 		} else if (rows == null) {
						 			console.log('data is null');
						 		} else {
						 			var cutoff = 0;
						 			console.log('Rows of posts');
						 			console.log(rows);
						 			for (i = 0; i < rows.length; i++) {
						 				if (rows[i].post_id > cutoff) {
						 					cutoff = rows[i].post_id;
						 				}
						 			}
						 			console.log('Cutoff:');
						 			console.log(cutoff);
						 			for (i = 0; i < rows.length; i++) {		
						 				var post_id = rows[i].post_id;
						 				db.getPostInfo(post_id, connection, function(err, data) {
						 					console.log(data.upvote_count);
						 					var up =data.upvote_count;
						 					upvote_ctr = upvote_ctr + up;
						 					console.log("UP: " + up);
						 					var down =data.downvote_count;
						 					downvote_ctr = downvote_ctr + down;
						 					console.log("DOWN: " + down)
						 					var incRep = up-down;
						 					console.log("INCREP: " + incRep);
						 					rep = rep + incRep;
						 					console.log("REP2: " + rep);
						 					console.log("post_id: " + post_id);
						 					console.log("cutoff: " + cutoff);
						 					if (data.post_id==cutoff) {
						 						console.log('got user posts info');
									            var posts = rows;
									            var answersQuery = 'SELECT * from comments where email = "' + req.session.email + '";';
									            connection.query(answersQuery, function(err, rows, fields) {
									            	console.log('Postsss:');
									            	console.log(posts);
											        if (err) {
											            console.log(err);
											            console.log('could not get user info');
											        } else {
											      		var comments = rows;
											      		var query = 'SELECT * from users where email = "' + req.session.email + '";';
												    	connection.query(query, function(err, rows, fields) {
												    		console.log('Commentsss:');
									            			console.log(comments);
													        if (err) {
													            console.log(err);
													            console.log('could not get user info');
													        } else {

													            //res.render('profile', {email: email, username: username, major: major, year: year, city: city, description: description, reputation: rep, answers: comments, posts: posts, upvotes: upvote_ctr, downvotes: downvote_ctr, friends: friends, currUserEmail: req.session.email});

													            db.getPostsPerDay(connection, function(err, data) {
													        		if (err) {
															 			console.log(err);
															 		} else if (rows == null) {
															 			console.log('data is null');
															 		} else {
															 			console.log("DATA BABY!: " + data);
															 			var dayArr = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
															 			var x = new Date();
															 			var d = x.getDate();
															 			for (i = 0; i < data.length; i++) {
															 				var count = data[i][0];
															 				var day = data[i][1];
															 				console.log("COUNT BABY!: " + count);
															 				console.log("DAY BABY!: " + day);
															 				if (day <= d) {
															 					var diff = d-day;
															 					dayArr[dayArr.length - 1 - diff] =  count;
															 				} else {
															 					var diff = day - d;
															 					dayArr[diff - 1] =  count;
															 				}
															 				console.log("ARRAY BABY!: " + dayArr);
															 			}
															 			res.render('profile', {email: email, username: username, major: major, year: year, city: city, description: description, reputation: rep, answers: comments, posts: posts, upvotes: upvote_ctr, downvotes: downvote_ctr, dayArr: dayArr, friends: friends, currUserEmail: req.session.email});
															 		}
													        	}); 

													        }
													    });
											        }
											    });
						 					}
						 				});
						 			}
						 			
						 		}
						 	});
				     
				        }
			   		}); 

			        }
			    });
	        }
	    });
	}

	else if (page == 'tags') {
		var email = req.session.email;
		console.log('tags again');
		var max_id = 0;
		var trending = [];
		var notifications = [];

		db.getNotifications(connection, req.session.email, function(err, data) {
			if (err) {
				console.log(err);
			} else {
				console.log('Got the notificationsss ------------------------------');
            	console.log(data[0]);  
				notifications = data;
			}
		});

		db.getTrendingTags(connection, function(err, data) {
			if (err) {
				console.log(err);
			} else {
				trending = data;
			}
		});
		db.getPostsWithTag(connection, tagFilter, function(err, data) { 
			if (err) {
 				console.log(err);
 			} else if (data == 0) {
 				console.log('no posts in db');
 				res.render('tags', {username: req.session.username, user: email, postIDs: [], posts: [], comments: [], commentsInfo: [], upvotes: [], downvotes: [], tags: [], trending: [], notifications: [], hash: "", load: loadAll});
 			} else {
 				var post_list = [data];
 				var posts_content = [];
 				var all_tags = [];
 				var comment_arr = [];
 				var comments_info = new Array(data.length).fill([]);
 				var email_info = new Array(data.length).fill([]);
 				var all_upvotes = [];
 				var all_downvotes = []; 

 				console.log(data.length + '------------------------------' + comments_info.length);

 				for (i = 0; i < data.length; i++) {
 					if (data[i].post_id > max_id) {
 						max_id = data[i].post_id;
 					}
 				}

 				for (i = 0; i < data.length; i++) {
 					console.log('Iter Outside: ' + i);
 					db.getPostInfo(data[i].post_id, connection, function(err, content) {
			 			if (err) {
			 				console.log(err);
			 			} else if (content == null) {
			 				console.log('content is null');
			 				posts_content.push([]);
			 				comment_arr.push([]);
			 			} else {

			 				// Get tags for current post
			 				console.log('Extracted hashtags: ' + content.tags);
			 				var tag_array = [];
			 				if (content.tags != 'null') {
			 					tag_array = content.tags.split(',');
			 				}
			 				console.log(tag_array);

			 				all_tags.push(tag_array);

			 				// Get post voter info for current post
			 				db.getPostVoters(content.post_id, connection, function(err, users) {
			 					if (err) {
			 						console.log(err);
			 					} else {
			 						console.log('Users: ' + users);
			 						var upvotes = [];
			 						var downvotes = [];

			 						for (i = 0; i < users.length; i++) {
			 							if (users[i].type == 1) {
			 								upvotes.push(users[i]);
			 							} else if (users[i].type == 0) {
			 								downvotes.push(users[i]);
			 							}
			 						}

			 						all_upvotes.push(upvotes);
			 						all_downvotes.push(downvotes);
			 					}
			 				});


			 				db.getAllCommentIDs(content.post_id, connection, function(err, comments) {
			 					if (err) {
			 						console.log(err);
			 					} else if (comments == null) {
			 						console.log('Null Exception: getting comments for ' + content.post_id);
			 					} else {
			 						posts_content.push(content);
			 						comment_arr.push(comments);

				 					var comment_info_arr = [];
				 					var email_info_arr = [];
				 					console.log('Post id ' + content.post_id);
				 					console.log(comments);		

				 					if (comments.length == 0 && content.post_id == max_id) {
								 		res.render('tags', {username: req.session.username, user: email, postIDs: post_list, posts: posts_content, comments: comment_arr, commentsInfo: comments_info, email_info: email_info, upvotes: all_upvotes, downvotes: all_downvotes, tags: all_tags, trending: trending, notifications: notifications, hash: hash, load: loadAll});
				 					} else {
				 						for (j = comments.length-1; j >= 0; j--) {
											console.log('Getting comment information');
						 					db.getCommentInfo(comments[j].comment_id, connection, function(err, info) {
						 						console.log('Info: ' + JSON.stringify(info));
						 						if (err) {
						 							console.log(err);
						 						} else if (info == null) {
						 							console.log('Null Exception: trying to get info for ' + info.comment_id);
					 							} else {
					 								comment_info_arr.push(info.content);
					 								email_info_arr.push(info.email);

						 							// Add set of comment info to the current post index
						 							if (convertToArray(comments).indexOf(info.comment_id)+1 == 1) {
						 								console.log('End of comments');
														comments_info[info.post_id-1] = comment_info_arr;
														email_info[info.post_id-1] = email_info_arr;
					 								}

					 								//console.log(max_id);
						 							console.log(info.post_id);
						 							console.log(content.post_id);
						 							console.log(data.length);
						 							console.log(convertToArray(comments).indexOf(info.comment_id));
									 				if (info.post_id == max_id && convertToArray(comments).indexOf(info.comment_id)+1 == 1) {
									 					res.render('tags', {username: req.session.username, user: email, postIDs: post_list, posts: posts_content, comments: comment_arr, commentsInfo: comments_info, email_info: email_info, upvotes: all_upvotes, downvotes: all_downvotes, tags: all_tags, trending: trending, notifications: notifications, hash: hash, load: loadAll});
														console.log('DONE');
													}
					 							}
					 						});
				 						}
				 					}
			 					}
			 				});
			 			}
			 		});			 		
 				}
 			}

		});
		
	}

  else if (page == 'viewSearch') {
    console.log('rendering viewSearch');
    res.render('viewSearch', {username: req.session.username, user: req.session.email,
      query: req.params.query});
  }

  else if (page == 'viewPost') {
    console.log('rendering viewPost');
    db.getPostInfo(req.params.id, connection, function (err, post) {
      if (err) {
        console.log(err);
      } else if (post == null) {
        console.log('Null Exception: getting post from' + req.params.id);
      } else {
        res.render('viewPost', {
          username: req.session.username,
          user: req.session.email,
          post: post
        });
      }
    });

  }
}

function checkSession(req, res, page) {
	if (req.session.email) {
		console.log('Still logged in');
		loadPage(res, req, page, filter);
	} else {
		console.log(page);
		console.log('Logged Out');
		res.redirect('/');
	}
}

// GET routes

router.get('/', function(req, res, next) {
	res.render('welcome');
});

router.get('/signup',function(req,res) {
  res.render('signup', {userExists: false});
});

router.get('/forgotPass',function(req,res) {
  res.render('forgotPass', {userExists: true});
});

router.get('/reset',function(req,res) {
  res.render('reset', {validReset: true});
});

router.get('/resetDone',function(req,res) {
  res.render('resetDone');
});

router.get('/login',function(req,res) {
	res.render('login', {userExists: false, wrongPassword: false});
});

router.get('/nodemailerTest',function(req,res) {
	res.render('nodemailerTest');
});

router.get('/settings',function(req,res) {
	checkSession(req, res, 'settings');
});

router.get('/profile',function(req,res) {
	checkSession(req, res, 'profile');
});

router.get('/home',function(req,res) {
	checkSession(req, res, 'home');
});

router.get('/trending',function(req,res) {
	checkSession(req, res, 'trending');
});

router.get('/auth/home/:email', function(req, res) {
	req.session.email = req.params.email;
	res.redirect('/home');
});

router.get('/facebook', passport.authenticate('facebook'));

router.get('/auth/facebook', passport.authenticate('facebook'), function(req, res, next) {
	console.log(req.user);
	req.session.email = req.user.email;
	req.session.username = req.user.username;
	console.log('Got fb username: ' + req.session.username + '-------------------------------------------');
	var email = req.user.email.toLowerCase();
	var username = req.user.username;
	var query = 'SELECT email from users where email = "' + email + '";';
	connection.query(query, function(err, rows, fields) {
	    if (err) console.log(err);
	    else {
	    	if (rows[0] == null) {
	    		console.log("creating new account");
	    		req.session.email = email;
	    		var query2 = 'insert into users (email, password, username, major, year, city, description, post_ids, comment_ids, friends)' + 
	    		'values ("' + email + '", null, "' + username + '", null, null, null, null, null, null, "");';
	    		console.log(query2);
	    		connection.query(query2, function(err, rows, fields) {
	   	 		if (err) console.log(err);
	    		else {
	    			res.redirect('/home');
	    		}
	    	})}
	    	else {
	    		console.log("email already in use");
	    		res.redirect('/home');
	    	}
	    }
    });
});

router.get('/viewProfile/:email',function(req,res) {
	checkSession(req, res, 'viewProfile');
});

router.get('/home/:link',function(req,res) {
	//checkSession(req, res, 'home');
	console.log('Hash--->');
	console.log(req.params.link);
	hash = req.params.link;
	if (hash.includes('post')) {
		loadAll = true;
	} else {
		loadAll = false;
	}
	
	res.redirect('/home');
});

router.get('/tags/:tag',function(req,res) {
	console.log('<-------------------------------------------------> Tags');
	console.log(req.params.tag);
	tagFilter = req.params.tag;
	checkSession(req, res, 'tags');
});

router.get('/viewSearch/:query', function (req, res) {
  console.log("search page loading...");
  checkSession(req, res, 'viewSearch');
});

router.get('/viewPost/:id', function (req, res) {
  console.log("post page loading...");
  checkSession(req, res, 'viewPost');
});

// POST requests

router.post('/saveDraft', function(req, res, next) {
	console.log(req.session.email, ' saved following draft header: ', req.body.header);
	console.log(req.session.email, ' content of draft was: ', req.body.content);
	db.saveDraft(req.session.email, req.body.header, req.body.content, connection);
});

router.post('/forgotPass', function(req, res) {
	console.log('Someone forgot pass');
	// Force lowercase on user email
	var email = req.body.email.toLowerCase();
	var query = 'SELECT email from users where email = "' + email + '";';
    connection.query(query, function(err, rows, fields) {
	    if (err) console.log(err);
	    else {
	    	if (rows[0] != null) {
	    		console.log("resending password");
	    		req.session.email = email;
	    		// Get old password and salted word
				db.getPassword(email, connection, function(err, data) {
				    if (err) console.log(err);
				    else {
				    	if (data != null) {
				    		var saltedWord = email + data;
				    		var genCode = SHA3(saltedWord).toString().substring(0, 8);
				    		// TODO: Send email to email with genCode

				    		var output = "<p> Hi below is your confirmation code :<p> <p> " + genCode + "<p>"
							// Generate test SMTP service account from ethereal.email
							// Only needed if you don't have a real mail account for testing
							nodemailer.createTestAccount((err, account) => {
							    // create reusable transporter object using the default SMTP transport
							    let transporter = nodemailer.createTransport({
							        host: 'smtp.gmail.com',
								    port: 587,
								    secure: false,
								    requireTLS: true,
							        auth: {
							            user: 'askbencis350@gmail.com', // generated ethereal user
							            pass: 'cis350askben' // generated ethereal password
							        }
							    });

							    // setup email data with unicode symbols
							    let mailOptions = {
							        from: '"Ben Franklin" <benfrank@gmail.com>', // sender address
							        to: email, // list of receivers
							        subject: 'Forgot email & password', // Subject line
							        text: 'Providing your confirmation code', // plain text body
							        html: output // html body
							    };

							    // send mail with defined transport object
							    transporter.sendMail(mailOptions, (error, info) => {
							        if (error) {
							        	console.log("Wasn't able to send email");
							            return console.log(error);
							        } else {
										console.log("Was able to send email successfully");
							        }
							        console.log('Message sent: %s', info.messageId);
							        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
							        res.redirect('/reset');
							    });
							});

				    		
				    	} else {
				    		console.log("error in reset");
				    	}
				    }
				});
	    	} else {
	    		console.log("no user with provided email exists");
	    		res.render('forgotPass', {userExists: false});
	    	}
	    }
    });
});

router.post('/reset', function(req, res) {
	console.log('Someone reset pass');
	// Force lowercase on user email
	var email = req.body.email.toLowerCase();
	var code = req.body.code;
	var new_password = SHA3(req.body.password).toString();
	db.getPassword(email, connection, function(err, data) {
	    if (err) console.log(err);
	    else {
	    	if (data != null) {
	    		console.log("data", data);
	    		console.log("Email is", email);
	    		var saltedWord = email + data;
	    		var genCode = SHA3(saltedWord).toString().substring(0, 8);
	    		console.log("entered code", code);
	    		console.log("gen'd code", genCode);
	    		if (genCode != code) {
	    			console.log("failed confirmation");
	    			res.render('reset', {validReset: false});
	    		} else {
		    		console.log("retrieved old password, resetting password");
		    		db.updateUserInfo(email, new_password, "password", connection);
			    	res.redirect('/resetDone');
			    }
	    	} else {
	    		console.log("error in reset");
	    	}
	    }
	});
});

router.post('/signup', function(req, res) {
	console.log('Someone signed up');
	// Force lowercase on user email
	var email = req.body.email.toLowerCase();
	var username = req.body.username;
	var password = SHA3(req.body.password).toString();
	var query = 'SELECT email from users where email = "' + email + '";';
    connection.query(query, function(err, rows, fields) {
	    if (err) console.log(err);
	    else {
	    	if (rows[0] == null) {
	    		console.log("creating new account");
	    		req.session.email = email;
	    		req.session.username = username;
	    		req.session.password = req.body.password;
	    		var query2 = 'insert into users (email, password, username, major, year, city, description, post_ids, comment_ids, upvote_post_ids, downvote_post_ids, friends)' + 
	    		'values ("' + email + '", "' + password + '", "'+ username + '", null, null, null, null, null, null, null, null, "");';
	    		console.log(query2);
	    		connection.query(query2, function(err, rows, fields) {
	   	 		if (err) console.log(err);
	    		else {
	    			res.redirect('/home');
	    		}
	    	})}
	    	else {
	    		console.log("email already in use");
	    		res.render('signup', {userExists: true});
	    	}
	    }
    });
});

router.post('/login',function(req,res) {

	loadAll = false;

	console.log('Someone logged in');
	var email = req.body.email.toLowerCase();
	console.log('Password befor & after');
	console.log(req.body.password);
	var password = SHA3(req.body.password).toString();
	console.log(password);
	var query = 'SELECT email, password, username from users where email = "' + email + '";';
    connection.query(query, function(err, rows, fields) {
	    if (err) console.log(err);
	    else {
	    	if (rows[0] == null) {
	    		console.log("log in failed. no user with that email");
	    	    res.render('login', {userExists: true, wrongPassword: false});
	    	}
	    	else if (rows[0].email == email && rows[0].password == password) {
	    		console.log("log in successful");
	    		req.session.email = email;
	    		req.session.username = rows[0].username;
	    		req.session.password = req.body.password;
	    		console.log(req.session.username);
				res.redirect('/home');
	    	} else {
	    	    console.log("log in failed. wrong password");
	    	    res.render('login', {userExists: false, wrongPassword: true});
	    	}
	    }
    });
});

router.post('/logout',function(req,res) {
	req.session.destroy(function(err) {
		if (err) {
			res.negotiate(err);
		}
		console.log('Logging out');
		res.redirect('/');
	});
});

router.post('/postQuestion', function(req, res, next) {
	// Updates the database with the question and details about the post
	db.getNextPostID(connection, function(err, data) {
 		if (err) {
 			console.log(err);
 		} else if (data == null) {
 			console.log('data is null');
 		} else {
 			var post_id = data;
 			console.log("i hope this works: " + data);
 			var time = Date.now();
 			var date = new Date();
 			var month = date.getMonth();
 			var day = date.getDate();
 			var hour = date.getHours();

 			// parses the posted question for tags, and submits them, comma-separated, as a string
	        var tags = [];
	        var re = new RegExp("#[a-z]+", "g");
	        var details = req.body.question.toLowerCase() + req.body.details.toLowerCase();
	        tags = details.match(re);
	        console.log('Tags: ' + tags);

	        if (tags !== null) {
		        console.log("matches found\n" + tags);
		        var uniques = [];
		        
		        for (var i = 0; i < tags.length; i++) {
		          var temp = tags[i].slice(1);
		          if (!uniques.includes(temp)) {
		            uniques.push(temp);
		          }
		        }

		        tags = uniques;
	         	console.log('Separated tags: ' + uniques);

	         	if (tags.length > 0) {
	 				// update tags
	 				for (i = 0; i < tags.length; i++) {
	 					db.updateTags(tags[i], connection);
	 				}
 				}
	        }
			
			db.postQuestion(post_id, req.body.details, tags, req.body.question, time, req.session.email, null, 0, month, day, hour, connection);			

 			setTimeout(function() {
 				res.redirect('/home');
 			}, 1000);
 		}
 	});
});

router.post('/postAnswer', function(req, res, next) {
	// Updates the database with the question and details about the post
	db.getNextCommentID(connection, function(err, data) {
 		if (err) {
 			console.log(err);
 		} else if (data == null) {
 			console.log('data is null');
 		} else {
 			var comment_id = data;
 			var time = Date.now();
 			var date = new Date();
 			var month = date.getMonth();
 			var day = date.getDate();
 			var hour = date.getHours();
 			post_id = req.body.post_id;
 			content = req.body.ans_content;
 			email = req.session.email;
 			db.notify(connection, post_id, email, req.session.username, 2);
 			db.comment(comment_id, post_id, content, time, email, month, day, hour, connection);
 			setTimeout(function() {
 				res.redirect('/home');
 			}, 1000);
 		}
 	});
});
		// For users page: 
		// db.getUserPosts(req.session.email, connection, function(err, info) {
		// 	console.log(info);
		// });

router.post('/postVote', function(req, res, next) {
	// Should add to user post_id list to make sure loading up posts will allow users to upvote or downvote again. 
	console.log(req.body);
	console.log(req.body.vote == 'true');
	if (req.body.vote == 'true') {
		console.log('upvote ' + req.body.vote);
		db.addVote(req.body.post_id, req.session.email, 1, connection);
		db.updatePostRating(req.body.post_id, req.body.change, connection);
		db.notify(connection, req.body.post_id, req.session.email, req.session.username, 1);
	} else {
		console.log('downvote ' + req.body.vote);
		db.addVote(req.body.post_id, req.session.email, 0 , connection);
		db.updatePostRating(req.body.post_id, req.body.change, connection);
		db.notify(connection, req.body.post_id, req.session.email, req.session.username, 0);
	}	
	
});

router.post('/search', function (req, res) {
  console.log(req.body);
  var users;
  var posts;
  var content = req.body.content;
  var max_results = req.body.num_results;
  var hasFoundPosts = false;
  var hasFoundUsers = false;
  var usersLeft = max_results;
  var postsLeft = Math.floor(max_results*2/3);
  if (!req.body.new_page) usersLeft = 3;

  db.searchForPosts(content, postsLeft, connection, function (err, info) {
    if (err) {
      console.log(err);
      console.log("Could not use predictive search for posts")
    } else {
      console.log("Using predictive search for posts");
      posts = info.slice(0);

      db.searchForUsers(req.body.content, usersLeft, connection, function (err, info) {
        if (err) {
          console.log(err);
          console.log("Could not use predictive search for users")
        } else {
          console.log("Using predictive search for users");
          length = info.length;

          users = info.slice(0);
          console.log("Found " + users + " users");
          console.log("Found " + posts + " posts");

          // may need to use checkSession ???
          // loadPage(res, req, 'search', {foundUsers: users, foundPosts: posts});
          res.send({foundUsers: users, foundPosts: posts});
        }

      });
    }
  });

});

router.post('/upload', function(req, res, next) {
	if (req.body.profilePicture) {
		console.log(req.body.picture);
	}
});

router.post('/updateInfo', function(req, res, next) {
	// Updates the database with the question and details about the post
	console.log("YAY");
	console.log(req.body);
	var update = req.body.update;
	console.log("is password: " + req.body.ispassword);
	if (req.body.ispassword === 'yes') {
		console.log
		req.session.password = update;
		update = SHA3(update).toString();
		console.log("hashed password");
		loadPage(res,req,'settings', filter);
	}
	console.log("this is the updated entry: " + update);
	db.updateUserInfo(req.body.email, update, req.body.field, connection);
});

router.post('/deleteNotification', function(req, res, next) {
	console.log(req.body);
	db.deleteNotification(connection, req.body.notification_id);
});

router.post('/filter', function(req, res, next) {
	filter = req.body.filter;
});

router.post('/passID', function(req, res, next) {
	edit_id = req.body.id;
});

router.post('/addFriend', function(req, res, next) {
	acceptor = req.body.acceptor;
	db.addFriend(connection, req.session.email, acceptor, req.session.username, 3);
	loadPage(res,req,'profile', filter);
	
});

router.post('/acceptFriend', function(req, res, next) {
	console.log('requestor: ' + req.body.requestor);
	console.log('acceptor: ' + req.session.email);
	db.acceptFriend(connection, req.body.requestor, req.session.email)
	console.log("accepting the friendship");
	loadPage(res,req,'home', filter);
});

router.post('/editQuestion', function(req, res, next) {
	// Updates the database with the question and details about the post
 			var post_id = edit_id;
 			var time = Date.now();

 			// parses the posted question for tags, and submits them, comma-separated, as a string
	        var tags = [];
	        var re = new RegExp("#[a-z]+", "g");
	        var details = req.body.question.toLowerCase() + req.body.details.toLowerCase();
	        tags = details.match(re);
	        console.log('Tags: ' + tags);

	        if (tags !== null) {
		        console.log("matches found\n" + tags);
		        var uniques = [];
		        
		        for (var i = 0; i < tags.length; i++) {
		          var temp = tags[i].slice(1);
		          if (!uniques.includes(temp)) {
		            uniques.push(temp);
		          }
		        }

		        tags = uniques;
	         	console.log('Separated tags: ' + uniques);

	         	if (tags.length > 0) {
	 				// update tags
	 				for (i = 0; i < tags.length; i++) {
	 					db.updateTags(tags[i], connection);
	 				}
 				}
	        }
			
			db.editPost(post_id, req.body.details, tags, req.body.question, time, null, connection);			

 			setTimeout(function() {
 				res.redirect('/home');
 			}, 1000);
 		
});

module.exports = router;
