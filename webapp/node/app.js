var _ = require('underscore');
var async = require('async');
var bodyParser = require('body-parser');
// var crypto = require('crypto');
var ect = require('ect');
var express = require('express');
// var logger = require('morgan');
var mysql = require('mysql');
var path = require('path');
var session = require('express-session');
var strftime = require('strftime');

var numCPUs = require('os').cpus().length;
var cluster = require('cluster');
var RedisStore = require('connect-redis')(session);
var client = require('redis').createClient();

if (cluster.isMaster) {
    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
} else {
        var app = express();

        //global object
        // global = {};

        var globalConfig = {
          userLockThreshold: process.env.ISU4_USER_LOCK_THRESHOLD || 3,
          ipBanThreshold: process.env.ISU4_IP_BAN_THRESHOLD || 10
        };

        var mysqlPool = mysql.createPool({
          host: process.env.ISU4_DB_HOST || 'localhost',
          user: process.env.ISU4_DB_USER || 'root',
          password: process.env.ISU4_DB_PASSWORD || '',
          database: process.env.ISU4_DB_NAME || 'isu4_qualifier'
        });

        var helpers = {
          // calculatePasswordHash: function(password, salt) {
          //       var c = crypto.createHash('sha256');
          //       c.update(password + ':' + salt);
          //       return c.digest('hex');
          // },

          isUserLocked: function(user, callback) {
                if(!user) {
                  return callback(false);
                }

                mysqlPool.query(
                  // 'SELECT COUNT(1) AS failures FROM login_log WHERE ' +
                  // 'user_id = ? AND id > IFNULL((select id from login_log where ' +
                  // 'user_id = ? AND succeeded = 1 ORDER BY id DESC LIMIT 1), 0);',
                  // [user.id, user.id],
                  'SELECT id,succeeded FROM login_log WHERE user_id = ? ORDER BY id desc',  // order byを使わないと順序保証不可能
                  [user.id],
                  function(err, rows) {
                        if(err) {
                          return callback(false);
                        }
                        var cnt = 0, i, length = rows.length;
                        for (i = 0; i < length; i++) {
                                if (rows[i].succeeded === 0) {
                                        cnt++;
                                } else {
                                        break;
                                }
                        }
                        callback(globalConfig.userLockThreshold <= cnt);

                        // callback(globalConfig.userLockThreshold <= rows[0].failures);
                  }
                );
          },

          isIPBanned: function(ip, callback) {
                mysqlPool.query(
                  // 'SELECT COUNT(1) AS failures FROM login_log WHERE ' +
                  // 'ip = ? AND id > IFNULL((select id from login_log where ip = ? AND ' +
                  // 'succeeded = 1 ORDER BY id DESC LIMIT 1), 0);',
                  // [ip, ip],
                  'SELECT id,succeeded FROM login_log WHERE ip = ? ORDER BY id desc',  // order byを使わないと順序保証不可能
                  [ip],
                  function(err, rows) {
                        if(err) {
                          return callback(false);
                        }
                        var cnt = 0, i, length = rows.length;
                        for (i = 0; i < length; i++) {
                                if (rows[i].succeeded === 0) {
                                        cnt++;
                                } else {
                                        break;
                                }
                        }
                        callback(globalConfig.ipBanThreshold <= cnt);

                        // callback(globalConfig.ipBanThreshold <= rows[0].failures);
                  }
                );
          },

          attemptLogin: function(req, callback) {
                var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                var login = req.body.login;
                var password = req.body.password;

                async.waterfall([
                  function(cb) {
                        // if (!global['login_' + login]) {
                        //         mysqlPool.query('SELECT * FROM users WHERE login = ?', [login], function(err, rows) {
                        //           // cache data
                        //           global['login_' + login] = rows[0];
                        //           cb(null, rows[0]);
                        //         });
                        // } else {
                        //         cb(null, global['login_' + login]);
                        // }
                        client.get('login:' + login, function(err, res) {
                          var user = JSON.parse(res);
                          cb(null, user);
                        });
                  },
                  function(user, cb) {
                        helpers.isIPBanned(ip, function(banned) {
                          if(banned) {
                                cb('banned', user);
                          } else {
                                cb(null, user);
                          }
                        });
                  },
                  function(user, cb) {
                        helpers.isUserLocked(user, function(locked) {
                          if(locked) {
                                cb('locked', user);
                          } else {
                                cb(null, user);
                          }
                        });
                  },
                  function(user, cb) {
                        // if(user && helpers.calculatePasswordHash(password, user.salt) == user.password_hash) {
                        if(user && password == user.password_hash) {
                          cb(null, user);
                        } else if(user) {
                          cb('wrong_password', user);
                        } else {
                          cb('wrong_login', user);
                        }
                  }
                ], function(err, user) {
                        var succeeded = !err;

                        // TODO redis
                        // client.get(ip, function(err, reply) {
                                // var max_succeeded, count;
                                // if (reply === null) {
                                        // console.log('reply off');
                                        // max_succeeded = succeeded;
                                        // count = 1;
                                // } else {
                                        // console.log('reply on');
                                        // var data = JSON.parse(reply);
                                        // max_succeeded = (data.max_succeeded) ? Math.max(succeeded, data.max_succeeded) : succeeded;
                                        // count = parseInt(data.count, 10) + 1;
                                // }
                                // if (succeeded == 1) {
                                        // var obj = { max_succeeded: max_succeeded, last_login: new Date(), count: ''+count };
                                        // client.set(ip, JSON.stringify(obj), function() {
                                                // console.log('succeeded posted result', obj);
                                        // });
                                // } else {
                                        // var obj = { max_succeeded: data.max_succeeded, last_login: new Date(), count: ''+(data.count+1) };
                                        // client.set(ip, JSON.stringify(obj), function() {
                                                // console.log('failded posted result', obj);
                                        // });
                                // }
                        // });

                        mysqlPool.query(
                                'INSERT INTO login_log' +
                                ' (`created_at`, `user_id`, `login`, `ip`, `succeeded`)' +
                                ' VALUES (?,?,?,?,?)',
                                [new Date(), (user || {})['id'], login, ip, succeeded],
                                function(e, rows) {
                                        callback(err, user);
                                }
                        );
                });
          },

          getCurrentUser: function(user_id, callback) {
                // if (!global['uid_' + user_id]) {
                //         mysqlPool.query('SELECT * FROM users WHERE id = ?', [user_id], function(err, rows) {
                //           if(err) {
                //                 return callback(null);
                //           }
                //           // cache data
                //           global['uid_' + user_id] = rows[0];

                //           callback(rows[0]);
                //         });
                // } else {
                //         callback(global['uid_' + user_id]);
                // }
                client.get('id:' + user_id, function(err, res) {
                  var user = JSON.parse(res);
                  callback(user);
                });
          },

          getBannedIPs: function(callback) {
                mysqlPool.query(
                  'SELECT ip FROM (SELECT ip, MAX(succeeded) as max_succeeded, COUNT(1) as cnt FROM '+
                  'login_log GROUP BY ip) AS t0 WHERE t0.max_succeeded = 0 AND t0.cnt >= ?',
                  [globalConfig.ipBanThreshold],
                  function(err, rows) {
                        var bannedIps = _.map(rows, function(row) { return row.ip; });

                        mysqlPool.query(
                          'SELECT ip, MAX(id) AS last_login_id FROM login_log WHERE succeeded = 1 GROUP by ip',
                          function(err, rows) {
                                async.parallel(
                                  _.map(rows, function(row) {
                                        return function(cb) {
                                          mysqlPool.query(
                                                'SELECT COUNT(1) AS cnt FROM login_log WHERE ip = ? AND ? < id',
                                                [row.ip, row.last_login_id],
                                                function(err, rows) {
                                                  if(globalConfig.ipBanThreshold <= (rows[0] || {})['cnt']) {
                                                        bannedIps.push(row['ip']);
                                                  }
                                                  cb(null);
                                                }
                                          );
                                        };
                                  }),
                                  function(err) {
                                        callback(bannedIps);
                                  }
                                );
                          }
                        );
                  }
                );
          },

          getLockedUsers: function(callback) {
                mysqlPool.query(
                  'SELECT user_id, login FROM ' +
                  '(SELECT user_id, login, MAX(succeeded) as max_succeeded, COUNT(1) as cnt FROM ' +
                  'login_log GROUP BY user_id) AS t0 WHERE t0.user_id IS NOT NULL AND ' +
                  't0.max_succeeded = 0 AND t0.cnt >= ?',
                  [globalConfig.userLockThreshold],
                  function(err, rows) {
                        var lockedUsers = _.map(rows, function(row) { return row['login']; });

                        mysqlPool.query(
                          'SELECT user_id, login, MAX(id) AS last_login_id FROM login_log WHERE ' +
                          'user_id IS NOT NULL AND succeeded = 1 GROUP BY user_id',
                          function(err, rows) {
                                async.parallel(
                                  _.map(rows, function(row) {
                                        return function(cb) {
                                          mysqlPool.query(
                                                'SELECT COUNT(1) AS cnt FROM login_log WHERE user_id = ? AND ? < id',
                                                [row['user_id'], row['last_login_id']],
                                                function(err, rows) {
                                                  if(globalConfig.userLockThreshold <= (rows[0] || {})['cnt']) {
                                                        lockedUsers.push(row['login']);
                                                  }
                                                  cb(null);
                                                }
                                          );
                                        };
                                  }),
                                  function(err) {
                                        callback(lockedUsers);
                                  }
                                );
                          }
                        );
                  }
                );
          }
        };

        // app.use(logger('dev'));
        app.enable('trust proxy');
        app.engine('ect', ect({ watch: true, root: __dirname + '/views', ext: '.ect' }).render);
        app.set('view engine', 'ect');
        app.use(bodyParser.urlencoded({ extended: false }));
        var options = {host: 'localhost', port: 6379, db: 2};
        app.use(session({ store: new RedisStore(options), 'secret': 'isucon4-node-qualifier', resave: true, saveUninitialized: true }));
        app.use(express.static(path.join(__dirname, '../public')));

        app.locals.strftime = function(format, date) {
          return strftime(format, date);
        };

        // app.get('/', function(req, res) {
          // var notice = req.session.notice;
          // req.session.notice = null;

          // res.render('index', { 'notice': notice });
        // });

        app.post('/login', function(req, res) {
          helpers.attemptLogin(req, function(err, user) {
                if(err) {
				          var query = '';
                  switch(err) {
                      case 'locked':
                        // req.session.notice = 'This account is locked.';
                        query = 'lock';
                        break;
                      case 'banned':
                        // req.session.notice = "You're banned.";
                        query = 'ban';
                        break;
                      default:
                        // req.session.notice = 'Wrong username or password';
                        query = 'wrong';
                        break;
                  }
                  return res.redirect('/?status=' + query);
                }

                req.session.userId = user.id;
                res.redirect('/mypage');
          });
        });

        app.get('/mypage', function(req, res) {
          helpers.getCurrentUser(req.session.userId, function(user) {
                if(!user) {
				  var query = 'must';
                  // req.session.notice = "You must be logged in";
                  return res.redirect('/?status=' + query);
                }

                mysqlPool.query(
                  'SELECT * FROM login_log WHERE user_id = ? AND succeeded = 1 ORDER BY id DESC LIMIT 2',
                  [user.id],
                  function(err, rows) {
                        var lastLogin = rows[rows.length-1];
                        res.render('comp_mypage', { 'last_login': lastLogin });
                  }
                );
          });
        });

        app.get('/report', function(req, res) {
          async.parallel({
                banned_ips: function(cb) {
                  helpers.getBannedIPs(function(ips) {
                        cb(null, ips);
                  });
                },
                locked_users: function(cb) {
                  helpers.getLockedUsers(function(users) {
                        cb(null, users);
                  });
                }
          }, function(err, result) {
                res.json(result);
          });
        });

        app.use(function (err, req, res, next) {
          res.status(500).send('Error: ' + err.message);
        });

        var server = app.listen(process.env.PORT || 8080, function() {
          console.log('Listening on port %d', server.address().port);
        });

        // http.createServerを使わなくてもサーバー建てられるぽい
        // var server = http.createServer(app).listen(process.env.PORT || 8080, function() {
        //   console.log('Listening on port %d', server.address().port);
        // });
}
