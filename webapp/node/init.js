// SELECT * FROM users の結果セットをRedisかなんかにstringifyして保存。keyはidとlogin（wildcard検索可能？）
var _ = require('underscore');
var async = require('async');
var mysql = require('mysql');
var client = require('redis').createClient();

var mysqlPool = mysql.createPool({
	host: process.env.ISU4_DB_HOST || 'localhost',
	user: process.env.ISU4_DB_USER || 'root',
	password: process.env.ISU4_DB_PASSWORD || '',
	database: process.env.ISU4_DB_NAME || 'isu4_qualifier'
});


var saveUsersData = function() {
	async.waterfall([
		function(cb) {
			mysqlPool.query('SELECT * FROM users', function(err, rows) {
				cb(null, rows);
			});
		},
		function(rows, cb) {
			_.each(rows, function(row) {
				// idをkeyにして保存
				var key = 'id:' + row.id;
				client.set(key, JSON.stringify(row));
				// loginをkeyにして保存
				var key = 'login:' + row.login;
				client.set(key, JSON.stringify(row));
			});
			cb();
		}
	], function(err, result) {
		// nodeプロセスの終了
		console.log('save on redis finished!!!');
		process.exit();
	});
};
saveUsersData();

// keysコマンドの使い方
// var keys = function() {
// 	client.keys('*isucon*', function(err, res) {
// 		console.log('arg1', err);
// 		console.log('arg2', res); // ['key1', 'key2'....]
// 	});
// };
// keys();

// flushallコマンドの使い方
// var flushall = function() {
// 	client.flushall(function(err, res) {
// 		console.log('arg1', err);
// 		console.log('arg2', res); // OK
// 	});
// };
// flushall();