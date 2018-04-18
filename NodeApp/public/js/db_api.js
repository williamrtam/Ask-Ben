function getAllTags(connection, callback) {
  var query = 'select tag, post_ids from tags;';
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      console.log('could not get next post id');
      return callback(err, null);
    } else {
      return callback(null, rows);
    }
  });
}

function getNextPostID(connection, callback) {
  var query = 'select count(post_id) as count from posts;';
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      console.log('could not get next post id');
      return callback(err, null);
    } else {
      var nextPostID = rows[0].count + 1;
      return callback(null, nextPostID);
    }
  });
}

function getNextCommentID(connection, callback) {
  var query = 'select count(comment_id) as count from comments;';
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      console.log('could not get next comment id');
      return callback(err, null);
    } else {
      var nextCommentID = rows[0].count + 1;
      return callback(null, nextCommentID);
    }
  });
}

function getUsername(email, connection, callback) {
  var query = 'select username from users where email = "' + email + '";';
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      console.log('could not get username');
      return callback(err, null);
    } else {
      var username = rows[0].username;
      return callback(null, username);
    }
  });
}

function getPassword(email, connection, callback) {
  var query = 'select password from users where email = "' + email + '";';
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      console.log('could not get password');
      return callback(err, null);
    } else {
      var password = rows[0].password;
      return callback(null, password);
    }
  });
}

function updateUpvotePostIDs(new_post_ids, email) {
  var query2 = 'update users set upvote_post_ids = ' + new_post_ids + ' where email = "' + email + '";';
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
    } else {
      console.log('updated upvote post ids');
      return true;
    }
  });
}

function updateDownvotePostIDs(new_post_ids, email) {
  var query2 = 'update users set downvote_post_ids = ' + new_post_ids + ' where email = "' + email + '";';
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
    } else {
      console.log('updated downvote post ids');
      return true;
    }
  });
}

function updatePostRating(post_id, change, connection) {
  var query = 'select * from posts where post_id = ' + post_id + ';';
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      console.log('did not upvote post');
      return false;
    } else {
      console.log("Before: " + rows[0]);
      var upvote = rows[0].upvote_count;
      var downvote = rows[0].downvote_count;

      console.log("After: " + rows[0]);
      console.log("Change: ----------- " + change);
      if (change == 1) {
        console.log('Up one')
        upvote = upvote + 1;
      } else if (change == -1) {
        console.log('Down one')
        downvote = downvote + 1;
      } else {
        if (change == 2) {
          console.log('Up two')
          downvote = downvote - 1;
          upvote = upvote + 1;
        } else if (change == -2) {
          console.log('Down two')
          upvote = upvote - 1;
          downvote = downvote + 1;
        }
      }

      var newRating = upvote - downvote;

      var query2 = 'update posts set rating = ' + newRating + ', upvote_count = ' + upvote + ', downvote_count = ' + downvote + ' where post_id = ' + post_id + ';';

      connection.query(query2, function (err, rows, fields) {
        if (err) {
          console.log(err);
          console.log('did not upvote post');
          return false;
        } else {
          console.log('successfully updated ratings');
          return true;
        }
      });

      return true;
    }
  });
}

//"insert into votes (post_id, email, type) "  + "values ('" + post_id +  "', '" + email + "', '"  + type + "') "
function addVote(post_id, email, type, connection) {
  console.log(type);
  console.log(query);
  var vote_key = email + post_id;
  console.log(vote_key);
  var query = "insert into votes (post_id, email, type, vote_key) " + "values ('" + post_id + "', '" + email + "', '" + type + "', '" + vote_key + "') " +
    "on duplicate key update " +
    "type = values(type);";

  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      return false;
    } else {
      console.log('successfully posted vote');
      console.log(rows);
      return true;
    }
  });
}

function saveDraft(email, header, content, connection) {
  var query = "insert into drafts (draft_id, email, header, content) " + 'values ("' + Math.floor(15000*Math.random()) + '", "' + email + '", "' + header + '", "' + content + '");';
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      return false;
    } else {
      console.log('successfully saved draft');
      console.log(rows);
      return true;
    }
  });
}

function getUserDrafts(connection, email, callback) {
  var query = "select header, content from drafts where email = '" + email + "';";
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      return callback(err, null);
    } else {
      console.log('successfully got all drafts');
      console.log(rows);
      return callback(null, rows);
    }
  });
}


function getPostVoters(post_id, connection, callback) {
  var query = "select * from votes where post_id='" + post_id + "';";

  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      return callback(err, null);
    } else {
      console.log(rows);
      return callback(null, rows);
    }
  });
}


function upVotePost(post_id, email, connection) {
  var index_skip = -1;
  var upvote_ids = "";
  var downvote_ids = "";
  var query = 'select upvote_post_ids from users where email = "' + email + '";';
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      console.log('did not get upvote post ids ');
      return false;
    } else {
      upvote_ids = rows[0].upvote_post_ids;
      var post_ids = rows[0].upvote_post_ids.split(',');
      for (var i = 0; i < post_ids.length - 1; i++) {
        if (post_ids[i] == post_id) {
          index_skip = i;
          break;
        }
      }
      if (index_skip != -1) {
        var new_post_ids = "";
        for (var i = 0; i < post_ids.length - 1; i++) {
          if (i == index_skip) {
            continue;
          }
          new_post_ids = concat(new_post_ids[i], ',');
        }
        updateUpvotePostIDs(new_post_ids, email);
        updatePostRating(post_id, -1);
        return true;
      } else {
        var query2 = 'select downvote_post_ids from users where email = "' + email + '";';
        connection.query(query, function (err, rows, fields) {
          if (err) {
            console.log(err);
            console.log('did not get downvote post ids ');
            return false;
          } else {
            downvote_ids = rows[0].downvote_post_ids;
            var post_ids2 = rows[0].downvote_post_ids.split(',');
            index_skip = -1;
            for (var i = 0; i < post_ids2.length - 1; i++) {
              if (post_ids2[i] == post_id) {
                index_skip = i;
                break;
              }
            }
            if (index_skip != -1) {
              var new_post_ids2 = "";
              for (var i = 0; i < post_ids2.length - 1; i++) {
                if (i == index_skip) {
                  continue;
                }
                new_post_ids2 = concat(new_post_ids2[i], ',');
              }
              updateDownvotePostIDs(new_post_ids2, email);
              upvote_ids = concat(upvote_ids, post_id + ',');
              updateUpvotePostIDs(upvote_ids, email);
              updatePostRating(post_id, 2);
              return true;
            } else {
              upvote_ids = concat(upvote_ids, post_id + ',');
              updateUpvotePostIDs(upvote_ids, email);
              updatePostRating(post_id, 1);
              return true;
            }
          }
        });
      }
    }
  });
}

function downVotePost(post_id, email, connection) {
  var index_skip = -1;
  var upvote_ids = "";
  var downvote_ids = "";
  var query = 'select downvote_post_ids from users where email = "' + email + '";';
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      console.log('did not get downvote post ids ');
      return false;
    } else {
      downvote_ids = rows[0].downvote_post_ids;
      var post_ids = rows[0].downvote_post_ids.split(',');
      for (var i = 0; i < post_ids.length - 1; i++) {
        if (post_ids[i] == post_id) {
          index_skip = i;
          break;
        }
      }
      if (index_skip != -1) {
        var new_post_ids = "";
        for (var i = 0; i < post_ids.length - 1; i++) {
          if (i == index_skip) {
            continue;
          }
          new_post_ids = concat(new_post_ids[i], ',');
        }
        updateDownvotePostIDs(new_post_ids, email);
        updatePostRating(post_id, 1);
        return true;
      } else {
        var query2 = 'select upvote_post_ids from users where email = "' + email + '";';
        connection.query(query, function (err, rows, fields) {
          if (err) {
            console.log(err);
            console.log('did not get upvote post ids ');
            return false;
          } else {
            upvote_ids = rows[0].upvote_post_ids;
            var post_ids2 = rows[0].upvote_post_ids.split(',');
            index_skip = -1;
            for (var i = 0; i < post_ids2.length - 1; i++) {
              if (post_ids2[i] == post_id) {
                index_skip = i;
                break;
              }
            }
            if (index_skip != -1) {
              var new_post_ids2 = "";
              for (var i = 0; i < post_ids2.length - 1; i++) {
                if (i == index_skip) {
                  continue;
                }
                new_post_ids2 = concat(new_post_ids2[i], ',');
              }
              updateUpvotePostIDs(new_post_ids2, email);
              downvote_ids = concat(downvote_ids, post_id + ',');
              updateDownvotePostIDs(downvote_ids, email);
              updatePostRating(post_id, -2);
              return true;
            } else {
              downvote_ids = concat(downvote_ids, post_id + ',');
              updateDownvotePostIDs(downvote_ids, email);
              updatePostRating(post_id, -1);
              return true;
            }
          }
        });
      }
    }
  });
}

function upVoteComment(comment_id, connection) {
  var query = 'select upvotes from comments where comment_id = ' + comment_id + ';';
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      console.log('did not upvote comment');
      return false;
    } else {
      var newVal = rows[0].upvotes + 1;
      var query2 = 'update comments set upvotes = ' + newVal + ' where comment_id = ' + comment_id + ';';
      console.log('upvoted comment');
    }
  });
}

function downVoteComment(comment_id, connection) {
  var query = 'select downvotes from comments where comment_id = ' + comment_id + ';';
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      consol.log('did not downvote comment');
      return false;
    } else {
      var newVal = rows[0].comments + 1;
      var query2 = 'update comments set downvotes = ' + newVal + ' where comment_id = ' + comment_id + ';';
      console.log('downvoted comment');
    }
  });
}

function getPostIDsFromTag(tag, connection) {
  var query = 'select post_ids from tags where tag = ' + tag + ';';
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      console.log('did not get post ids from tag');
      return null;
    } else {
      var post_ids = row[0].post_ids.split(',');
      console.log('got posts ids from tag');
      return post_ids;
    }
  });
}

function comment(comment_id, post_id, content, time, email, month, day, hour, connection) {
  var query = 'insert into comments (comment_id, post_id, content, upvotes, downvotes, time, email, month, day, hour)' +
    'values (' + comment_id + ', ' + post_id + ', "' + content + '", 0, 0, ' + time + ', "' + email + '", ' + month + ', ' + day + ', ' + hour + ');';
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      console.log('comment was not stored succesffully');
      return false;
    } else {
      console.log('comment was stored successfully');
      var query2 = 'update users set comment_ids = concat(comment_ids,"' + comment_id + ',");';
      connection.query(query2, function (err, rows, fields) {
        if (err) {
          console.log(err);
          console.log('comment id not updated');
          return false;
        } else {
          console.log('comment id updated');
          return true;
        }
      });
    }
  });
}

function postQuestion(post_id, content, tags, header, time, email, anonymous, rating, month, day, hour, connection) {
  var query = 'insert into posts (post_id, content, tags, header, time, email, anonymous, rating, month, day, hour) ' +
    'values (' + post_id + ', "' + content + '", "' + tags + '", "' + header + '", ' +
    time + ', "' + email + '", ' + anonymous + ', ' + rating + ', ' + month + ', ' + day + ', ' + hour + ');';

  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      console.log('post was not stored succesfully');
      return false;
    } else {
      console.log('post was stored successfully');
      var query2 = 'update users set post_ids = concat(post_ids,"' + post_id + ',");';
      connection.query(query2, function (err, rows, fields) {
        if (err) {
          console.log(err);
          console.log('post id not updated');
          return false;
        } else {
          console.log('post id updated');
          console.log(rows);
          return true;
        }
      });
      return true;
    }
  });

  return true;
}

function getPostTime(post_id, connection) {
  var query = 'select time from posts where post_id = ' + post_id + ';';
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      console.log('could not get post time');
      return null;
    } else {
      console.log('got post time');
      return row[0].time;
    }
  });
}

function getCommentTime(comment_id, connection) {
  var query = 'select time from comments where comment_id = ' + comment_id + ';';
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      console.log('could not get comment time');
      return null;
    } else {
      console.log('got comment time');
      return row[0].time;
    }
  });
}

// to get specific info do row[0].content where content is a column in the database. could be row[0].time etc
function getPostInfo(post_id, connection, callback) {
  var query = 'select * from posts where post_id = ' + post_id + ';';
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      console.log('could not get post info');
      return callback(err, null);
    } else {
      console.log('got post info');
      return callback(null, rows[0]);
    }
  });
}

function searchForPosts(content, limit, connection, callback) {
  var query = "SELECT * FROM posts WHERE content LIKE '%" + content + "%';";
  console.log(query);
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      console.log('could not get posts');
      return callback(err, null);
    } else {
      console.log('got posts');

      // returns up to <limit> posts
      if (rows.length > limit) {
        var limitedRows = [];
        for (var i = 0; i < limit; i++) {
          limitedRows.push(rows[i]);
        }
        return callback(null, limitedRows);

      } else {
        return callback(null, rows);
      }

    }
  });
}

function searchForUsers(username, limit, connection, callback) {
  var query = "SELECT * FROM users WHERE username LIKE '%" + username + "%';";
  console.log(query);
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      console.log('could not get users');
      return callback(err, null);
    } else {
      console.log('got users');

      // returns up to <limit> users
      if (rows.length > limit) {
        var limitedRows = [];
        for (var i = 0; i < limit; i++) {
          limitedRows.push(rows[i]);
        }
        return callback(null, limitedRows);

      } else {
        return callback(null, rows);
      }

    }
  });
}

function getUserPosts(email, connection, callback) {
  var query = "SELECT * FROM posts WHERE email ='" + email + "'";
  console.log(query);
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      console.log('could not get user post info');
      return callback(err, null);
    } else {
      console.log('got user post info');
      return callback(null, rows);
    }
  });
}

// to get specific info do row[0].upvotes where upvotes is a column in the database and 0 is the post_id
function getCommentInfo(comment_id, connection, callback) {
  var query = "select * from comments where comment_id = '" + comment_id + "';";
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      console.log('could not get comment info');
      return callback(err, null);
    } else {
      console.log('got comment info');
      return callback(err, rows[0]);
    }
  });
}

function getLargestCommentPostID(connection, callback) {
  var query = 'select * from comments order by post_id desc limit 1';
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      console.log('could not get comment count');
      return callback(err, null);
    } else {
      console.log('got comment count');
      console.log(rows);
      return callback(err, rows[0]);
    }
  });
}

// to get specific info do row[0].post_id where 0 is the post_id
function getAllPostIDs(connection, filter, callback) {
  var query = 'select post_id from posts';
  console.log("trying to match filter: " + filter);
  if (filter == 'Earliest') {
    query += ' order by time asc;';
  } else if (filter == 'Oldest') {
      query += ' order by time desc;';
  } else if (filter == 'Highest Rated') {
      query += ' order by rating asc;';
  } else if (filter == 'Lowest Rated') {
      query += ' order by rating desc;';
  } else {
      query += ';';
  }
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      console.log('could not get all post IDs');
      return callback(err, null);
    } else {
      console.log('got all post IDs');
      return callback(null, rows);
      ;
    }
  });
}

// to get specific info do row[0].post_id where 0 is the post_id
function getAllCommentIDs(post_id, connection, callback) {
  var query = 'select comment_id from comments where post_id = ' + post_id + ';';
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      console.log('could not get all comment IDs');
      return callback(err, null);
    } else {
      console.log('got all comment IDs');
      return callback(null, rows);
      ;
    }
  });
}


function updateUserInfo(email, value, field, connection) {
  var query = 'UPDATE users SET ' + field + '=' + '"' + value + '" ' + 'WHERE email =' + '"' + email + '";';
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      console.log('could not access user info');
      return false;
    } else {
      console.log('accessed user info');
      console.log(rows);
    }
  });
}


function updateTags(tag, connection) {
  console.log(tag);
  var query = "select * from tags where tag = '#" + tag + "';";
  console.log(query);
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
    } else if (rows.length == 0) {
      console.log('First time --------------------------------');
      var earliestTime = Date.now();
      var latestTime = earliestTime;
      var count = 1;
      var averageTime = earliestTime;
      var velocity = 0;

      var secondaryQuery = "insert into tags (tag, first_in_hour, last_in_hour, count, average_time, velocity) " + "values ('#" + tag + "', '" + earliestTime + "', '" + latestTime + "', '" + count + "', '" + averageTime + "', '" + velocity + "') " +
        "on duplicate key update " +
        "tag = values(tag), first_in_hour = values(first_in_hour), last_in_hour = values(last_in_hour), count = values(count), average_time = values(average_time), velocity = values(velocity);";
      connection.query(secondaryQuery, function (err, rows, fields) {
        if (err) {
          console.log(err);
        } else {
          console.log('successfully updated tags');
        }
      });
    } else {
      console.log('Existing tag ---------------------------------------')

      var earliestTime = rows[0].first_in_hour;
      var latestTime = rows[0].last_in_hour;
      var count = rows[0].count;
      var averageTime = rows[0].average_time;
      var velocity = rows[0].velocity;

      // currently checking trending per week
      if ((Date.now() - earliestTime) < (7 * 24 * 60 * 60 * 1000)) {
        console.log('Within the hour-----------------------------------');
        latestTime = Date.now();

        var currentTotal = averageTime * count;
        currentTotal = currentTotal + latestTime;
        averageTime = currentTotal / count;

        count = count + 1;

        velocity = (count * 10000000000) / (7 * 24 * 60 * 60 * 1000);
      } else {
        console.log('New hour----------------------------------------');

        earliestTime = Date.now();
        latestTime = earliestTime;
        count = 1;
        averageTime = earliestTime;
        velocity = 0;
      }

      var secondaryQuery = "insert into tags (tag, first_in_hour, last_in_hour, count, average_time, velocity) " + "values ('#" + tag + "', '" + earliestTime + "', '" + latestTime + "', '" + count + "', '" + averageTime + "', '" + velocity + "') " +
        "on duplicate key update " +
        "tag = values(tag), first_in_hour = values(first_in_hour), last_in_hour = values(last_in_hour), count = values(count), average_time = values(average_time), velocity = values(velocity);";
      connection.query(secondaryQuery, function (err, rows, fields) {
        if (err) {
          console.log(err);
        } else {
          console.log('successfully updated tags');
        }
      });
    }
  });
}


function getMostRecentTags(connection, callback) {
  var currentTime = Date.now()
  var lasthour = currentTime - (7 * 24 * 60 * 60 * 1000); // currently checking trending per week
  var initialQuery = "select * from tags where first_in_hour between " + lasthour + " and " + currentTime + " or " + "last_in_hour " + "between " + lasthour + " and " + currentTime +
    " order by average_time desc" +
    " limit 10;";

  connection.query(initialQuery, function (err, rows, fields) {
    if (err) {
      console.log(err);
      return callback(err, null);
    } else {
      console.log(rows);
      return callback(null, rows);
    }
  });
}


function editComment(comment_id, content, time, connection) {
  var query = 'update comments set content = "' + content + '", set time = ' + time + ' where comment_id = ' + comment_id + ';';
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      console.log('comment was not updated succesffully');
      return false;
    } else {
      console.log('comment was updated succesffully');
      return true;
    }
  });
}

function editPost(post_id, content, header, time, tags, anonymous, connection) {
  var query = 'update posts set content = "' + content + '", set header = "' + header + '", set time = ' + time + ', set tags = "' + tags + '", set anonymous = ' + anonymous + ';';
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      console.log('post was not updated succesfully');
      return false;
    } else {
      console.log('post was updated successfully');
      return true;
    }
  });
}

function filterPosts(connection, filter, callback) {
  var query = 'select post_id from posts order by ' + filter + ' desc;';
  connection.query(query, function (err, rows) {
    if (err) {
      console.log(err);
      return callback(err, null);
    } else {
      console.log('getting post ids filtered by ' + filter);
      return callback(null, rows);
    }
  })

}

function getTrendingTags(connection, callback) {
  var currentTime = Date.now()
  var lasthour = currentTime - (7 * 24 * 60 * 60 * 1000); // currently checking trending per week
  var initialQuery = " select * from tags where first_in_hour between " + lasthour + " and " + currentTime + " or " + "last_in_hour " + "between " + lasthour + " and " + currentTime +
    " order by velocity desc" +
    " limit 10;";

  connection.query(initialQuery, function (err, rows, fields) {
    if (err) {
      console.log(err);
      return callback(err, null);
    } else {
      console.log('Trending Topics: ------------------------------')
      console.log(rows);
      return callback(null, rows);
    }
  });
}


function notify(connection, post_id, email, name, type) {
  var outsideQuery = "select email from posts where post_id = " + post_id + ";";
  connection.query(outsideQuery, function (err, rows, fields) {
    if (err) {
      console.log(err);
    } else {
      console.log('Email of user to be notified: ------------------------------')
      console.log(rows);
      console.log(rows[0]);
      console.log(rows[0].email);
      console.log('Name: ' + name);
      var insideQuery = "insert into notifications (email, notifier, post_id, notifier_name, type) values ('" + rows[0].email + "', '" + email + "', " + post_id + ", '" + name + "', " + type + ");";
      connection.query(insideQuery, function (err, rows, fields) {
        if (err) {
          console.log(err);
          console.log('user was not notified succesfully');
          return false;
        } else {
          console.log('user was notified successfully');
          return true;
        }
      });
    }
  });

}


function getNotifications(connection, email, callback) {
  var query = "select * from notifications where email = '" + email + "';";

  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      return callback(err, null);
    } else {
      return callback(null, rows);
    }
  });
}

function deleteNotification(connection, notification_id) {
  var query = "delete from notifications where notification_id = " + notification_id + ";";

  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log('failed to delete notification');
      console.log(err);
      return false;
    } else {
      console.log('deleted notification successfully');
      return true;
    }
  });
}

function getPostsWithTag(connection, tag, callback) {
    var query = "select * from posts";

    connection.query(query, function (err, rows, fields) {
        if (err) {
            console.log(err);
            return callback(err, null);
        } else {
            var rowsWithTag = [];
            for (i = 0; i < rows.length; i++) {
                if (rows[i] != null) {
                    if(rows[i].tags.includes(tag)) {
                        rowsWithTag.push(rows[i]);
                    }
                }
            }
            console.log('RowsWithTag');
            console.log(rowsWithTag);
            return callback(null, rowsWithTag);
        }
    });
}


function addFriend(connection, requestor, acceptor, requestor_username, type) {
  var query = "insert into notifications (email, notifier, post_id, notifier_name, type) values ('" + acceptor + "', '" + requestor + "', -1 , '" + requestor_username + "', " + type + ");";
  connection.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
    } else {
      console.log("notifications updated");
      }
  });

}

function acceptFriend(connection, requestor, acceptor) {
    var query = 'update users set friends = concat(friends,"' + acceptor + ',") where email = "' + requestor + '";';
    var query2 = 'update users set friends = concat(friends,"' + requestor + ',") where email = "' + acceptor + '";';

    connection.query(query, function (err, rows, fields) {
        if (err) {
            console.log(err);
            return callback(err, null);
        } else {
          connection.query(query2, function (err, rows, fields) {
          if (err) {
              console.log(err);
              return callback(err, null);
          } else {
            console.log("users are now friends with each other");
          }
        });
        }
            
    });
}

function getPostsPerDay(connection, callback) {
    var x = new Date();
    var m = x.getMonth();
    var d = x.getDate();

    var input = m;
    var input2 = d; 
    var input3;
    if (m == 0) {
      input3 = 11;
    } else {
      input3 = m-1;
    }

    var query = "select count(post_id) as count, day from posts where month = " + input + " and day <= " + input2 + " group by day";
    var query2 = "select count(post_id) as count, day from posts where month = " + input3 + " and day > " + input2 + " group by day";
    connection.query(query, function (err, rows, fields) {
        if (err) {
            console.log(err);
            return callback(err, null);
        } else {
            var resarr = [];
            for (i = 0; i < rows.length; i++) {
                if (rows[i] != null) {
                  var temp = [rows[i].count, rows[i].day];
                    resarr.push(temp);
                }
            }
            connection.query(query, function (err, rows2, fields) {
                if (rows2[i] == null) {
                  return callback(null, resarr);
                } else if (err) {
                    console.log(err);
                    return callback(err, null);
                } else {
                    var resarr2 = [];
                    for (i = 0; i < rows2.length; i++) {
                        if (rows2[i] != null) {
                            var temp = [rows2[i].count, rows2[i].day];
                            resarr.push(temp);
                        }
                    }
                    var finalarr = resarr2.concat(resarr);
                    console.log("FINALARR: " + finalarr);
                    return callback(null, finalarr)
                }
            });
        }
    });
}



module.exports = {
  upVotePost,
  downVotePost,
  upVoteComment,
  downVoteComment,
  getPostIDsFromTag,
  comment,
  postQuestion,
  getPostTime,
  getCommentTime,
  getPostInfo,
  getCommentInfo,
  getAllPostIDs,
  updateUserInfo,
  getNextPostID,
  getNextCommentID,
  getUsername,
  getPassword,
  getAllTags,
  updateUpvotePostIDs,
  updatePostRating,
  updateDownvotePostIDs,
  getAllCommentIDs,
  getLargestCommentPostID,
  searchForPosts,
  searchForUsers,
  getUserPosts,
  addVote,
  saveDraft,
  getUserDrafts,
  getPostVoters,
  updateTags,
  getTrendingTags,
  editPost,
  editComment,
  filterPosts,
  notify,
  getNotifications,
  deleteNotification,
  getPostsWithTag, 
  addFriend,
  acceptFriend,
  getPostsWithTag,
  getPostsPerDay
};
