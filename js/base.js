"use strict";
var service = "http://wx.zkjan.com/kstk-api/";
	// service = "http://192.168.3.15/kstk-api/";
var base = angular.module('baseApp', []);
base.config(function($httpProvider) {
	$httpProvider.defaults.headers.post["Content-Type"] = 'application/x-www-form-urlencoded;charset=UTF-8';
});
base.value('QType', [{
	type: "ChaptersAndSections",
	get: "QuestionBySidFront",
	update: "qerrdb",
	name: "章节练习"
}, {
	type: "AllReal",
	get: "RealQuestion",
	update: "realdb",
	info: "RealOne",
	name: "历年真题"
}, {
	type: "AllSimul",
	get: "SimulQuestion",
	update: "simuldb",
	info: "SimulOne",
	name: "模拟考试"
}]).value('CType', [{
	name: "视频课程",
	type: 1
}, {
	name: "面授课程",
	type: 2
}]);
base.filter("slice", function() {
	return function(s, l) {
		return (s && s.length > l) ? s.slice(0, l - 1) + "..." : s;
	}
}).filter("abcd", function() {
	return function(s, l) {
		return ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"][s];
	}
}).filter("xyz", function() {
	return function(s, l) {
		return ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"][s];
	}
}).filter("justDay", function() {
	return function(s) {
		return s && s.split(" ")[0];
	}
}).filter("money", function() {
	return function(s) {
		return (!s || isNaN(s)) ? "0.00" : (Math.ceil(Math.floor(parseFloat(s) * 1000) / 10) / 100).toFixed(2)
	}
})
base.service("user", function($http) {
	var s = this,
		es = new Array();
	s.bind = function(e) {
		es.push(e);
	};
	s.fire = function() {
		for (var i = es.length; i--; ) {
			es[i]();
		}
	}
	$http.post(service + "wxuser/checkUserinfo")
		.then(function(r) {
			// if (r.data.code == 200) {
			// 	s.info = r.data.list[0];
			// 	s.fire();
			// } else
			// 	location.href = '<!--#echo var="wc1"-->bind.html?href=' + encodeURIComponent(location.href);
			s.fire();
		});
	s.selectC = function() {
		s.sc = true;
		s.sm = false;
		$http.post(service + "frontIndex/getAllFrontCourseByMid?major_id=" + s.info.mid)
			.then(function(r) {
				if (r.data.code == 200)
					s.clist = r.data.list;
			});
	}
	s.selectM = function() {
		s.sc = true;
		s.sm = true;
		$http.post(service + "frontIndex/getAllFrontMajor")
			.then(function(r) {
				if (r.data.code == 200)
					s.mlist = r.data.list;
			});
	}
	s.chooseC = function(id, name) {
		s.sc = false;
		s.sm = false;
		s.info.course = name;
		s.info.cid = id;
		s.fire();
		$http.post(service + "wxuser/upMajor?mid=" + s.info.mid + "&cid=" + s.info.cid);
	}
	s.chooseM = function(id, name) {
		s.info.major = name;
		s.info.mid = id;
		s.selectC();
	}
}).service("hash", function() {
	var t = this,
		str = location.search.substr(1).split("&"),
		l = str.length,
		s;
	for (; l--;) {
		if (str[l].indexOf("=") > 0) {
			s = str[l].split("=");
			t[s[0]] = decodeURIComponent(s[1]);
		}
	}
	t.init = function(o) {
		for (var v in o) {
			if (!t[v])
				t[v] = o[v]
		}
		return t;
	}
	t.serialize = function(f) {
		var h = new Array();
		if (f.length)
			for (var v in t) {
				if (typeof(t[v]) != "function")
					for (var i = f.length; i--;) {
						if (v == f[i])
							h.push(v + "=" + t[v]);
					}
			}
		else
			for (var v in t) {
				if (typeof(t[v]) != "function")
					h.push(v + "=" + t[v]);
			}
		return h.join("&")
	}
})
base.factory("fac", function() {
	return {
		serialize: function(obj) {
			var a = new Array()
			angular.forEach(obj.$$controls, function(v) {
				a.push(v.$name + "=" + v.$modelValue)
			})
			return a.join("&")
		},
		page: function(i, r, t) {
			var p = new Object();
			p.index = i;
			p.length = Math.ceil(t / r);
			if (t / r > 1) {
				p.first = (i != 1);
				p.last = (i != p.length);
				p.list = new Array();
				for (i = i - 2; i <= p.length && i < p.index + 3; i++) {
					if (i > 0)
						p.list.push(i);
				}
			}
			return p;
		},
		grade: function(list) {
			var i = list.length,
				l = 0,
				gid = [],
				gname = [];
			for (; i--;) {
				if (list[i].gids) {
					gid = list[i].gids.split(",");
					gname = list[i].gnames.split(",");
					list[i].grade = new Array();
					for (l = gid.length; l--;) {
						list[i].grade.push({
							gid: gid[l],
							gname: gname[l]
						})
					}
				}
			}
			return list;
		},
		vote: function(c, id, type) {
			if (type == 1)
				return c == id;
			else if (c) {
				var a = c.split("-");
				for (var i = a.length; i--;) {
					if (id == a[i])
						return true;
				}
			}
			return false;
		},
		pen: function(a, b) {
			return (b > 0 ? Math.ceil(a / b * 100) : 0) + '%';
		}
	};
})
base.directive('vphone', function() {
	return {
		require: 'ngModel',
		link: function(scope, elm, attrs, ctrl) {
			ctrl.$parsers.unshift(function(viewValue) {
				if (/^1(3[0-9]|5[0-35-9]|7[03678]|8[0-9]|47)[0-9]{8}$/.test(viewValue)) {
					ctrl.$setValidity('phone', true);
					return viewValue;
				} else {
					ctrl.$setValidity('phone', false);
					return undefined;
				}
			});
		}
	};
}).directive('vconfirm', function() {
	return {
		require: 'ngModel',
		link: function(scope, elm, attrs, ctrl) {
			ctrl.$parsers.unshift(function(viewValue) {
				if (scope[attrs.vconfirm] == viewValue) {
					ctrl.$setValidity('confirm', true);
					return viewValue;
				} else {
					ctrl.$setValidity('confirm', false);
					return undefined;
				}
			});
		}
	};
});

base.controller('header', function($scope, user, hash) {
	$scope.user = user;
	$scope.back = function() {
		window.history.back()
	}
})

base.controller('banner', function($scope, $http, user) {
	user.bind(function(){
		$scope.get();
	})
	$scope.get = function(){
		$http.post(service + "wxuser/getWxImg?mid=" + user.info.mid)
			.then(function(r) {
				if (r.data.code == 200) {
					$scope.list = r.data.list;
					setTimeout(function(){
						var $swi = $("#swipe i"),
							$s = $("#swipe");
						$s.find("a").slice($swi.length).remove();
						$swi.eq(0).addClass("on");
						$s.Swipe({
							startSlide: 0,
							auto: 4000,
							transitionEnd: function(i) {
								$swi.removeClass("on").eq(i).addClass("on");
							}
						})
					},999)
				}
			});
	};
})

base.controller('qlist', function($scope, $http, fac, user, hash, QType) {
	$scope.nlist = QType;
	user.bind(function() {
		$scope.get(1, true);
	})
	$scope.user = user;
	$scope.rt = hash.init({
		type: $scope.nlist[0].type
	});
	$scope.rows = 20;
	$scope.page = {};
	$scope.loading = true;

	$scope.setType = function(type) {
		if (type && $scope.rt.type != type) {
			$scope.rt.type = type;
			$scope.get(1, true);
		}
	};
	$scope.get = function(i, b) {
		if (b || i != $scope.page.index) {
			$scope.list = [];
			$scope.loading = true;
			$scope.page.index = i;
			$http.post(service + "exam/get" + $scope.rt.type + "?page=" + $scope.page.index + "&rows=" + $scope.rows + "&mid=" + user.info.mid + "&cid=" + user.info.cid)
				.then(function(r) {
					$scope.loading = false;
					if (r.data.code == 200) {
						$scope.list = r.data.list;
						$scope.page = fac.page($scope.page.index, $scope.rows, r.data.total)
					}
				});
		}
	}
})

base.controller('clist', function($scope, $http, fac, user, hash, CType) {
	$scope.nlist = CType;
	$scope.nlist.push({
		name: "我的课程",
		href: '<!--#echo var="wc1"-->user/class.html',
		type: 0
	});
	user.bind(function() {
		$scope.get(1, true);
	})
	$scope.rt = hash.init({
		type: $scope.nlist[0].type
	});
	$scope.rows = 20;
	$scope.page = {};
	$scope.loading = true;

	$scope.setType = function(type) {
		if (type && $scope.rt.type != type) {
			$scope.rt.type = type;
			$scope.get(1, true);
		}
	};
	$scope.get = function(i, b) {
		if (b || i != $scope.page.index) {
			$scope.list = [];
			$scope.loading = true;
			$scope.page.index = i;
			$http.post(service + "gradeFront/getGradeByCid?page=" + $scope.page.index + "&rows=" + $scope.rows + "&mid=" + user.info.mid + "&cid=" + user.info.cid)
				.then(function(r) {
					$scope.loading = false;
					if (r.data.code == 200) {
						$scope.list = r.data.list;
						$scope.page = fac.page($scope.page.index, $scope.rows, r.data.total)
					}
				});
		}
	}
})

base.controller('myclass', function($scope, $http, fac, user, hash, CType) {
	$scope.nlist = CType;
	user.title = "我的课程";
	$scope.rt = hash.init({
		type: $scope.nlist[0].type
	});
	$scope.rows = 20;
	$scope.page = {};
	$scope.loading = false;
	$scope.list = [];

	$scope.setType = function(type) {
		if (type && $scope.rt.type != type) {
			$scope.rt.type = type;
			$scope.get(1, true);
		}
	};
	$scope.get = function(i, b) {
		if (b || i != $scope.page.index) {
			$scope.list = [];
			$scope.loading = true;
			$scope.page.index = i;
		}
	}
})

base.controller('test', function($scope, $http, $interval, $timeout, $sce, fac, user, hash, QType) {
	$scope.rt = hash;
	$scope.ti = $scope.si = 0;
	$scope.QType = QType;
	user.title = $scope.rt.name;

	$scope.html = function(s) {
		return $sce.trustAsHtml(s);
	}
	$scope.start = function(bl) {
		$scope.showBtn = !bl;
		$scope.started = true;
		if ($scope.geted && bl)
			$scope.timePlay();
	}
	$scope.next = function() {
		if ($scope.si + 1 < $scope.t.question.length)
			$scope.s = $scope.t.question[++$scope.si];
		else if ($scope.ti + 1 < $scope.list.length) {
			$scope.t = $scope.list[++$scope.ti];
			$scope.s = $scope.t.question[$scope.si = 0];
		}
	}
	$scope.prev = function() {
		if ($scope.si)
			$scope.s = $scope.t.question[--$scope.si];
		else if ($scope.ti) {
			$scope.t = $scope.list[--$scope.ti];
			$scope.s = $scope.t.question[$scope.si = $scope.t.question.length - 1];
		}
	}

	var time_s = 0,
		time_m = 0;
	$scope.time = "0:00";
	$scope.timePlay = function() {
		$scope.time_stoped = false;
		$scope.time_t = $interval(function() {
			if (time_s == 59) {
				time_m++;
				time_s = 0;
			} else
				time_s++;
			$scope.time = time_m + ":" + (time_s < 10 ? "0" + time_s : time_s);
			if (time_m == $scope.info.times)
				$scope.time_end = $scope.timeStop() || true;
		}, 1000);
	}
	$scope.timeStop = function() {
		$scope.time_stoped = true;
		$interval.cancel($scope.time_t);
	}
	$scope.changeTime = function() {
		$scope.time_stoped ? $scope.timePlay() : $scope.timeStop();
	}

	angular.forEach(QType, function(v, i) {
		if ($scope.rt.type == v.type) {
			$scope.rt.get = v.get;
			$scope.rt.update = v.update;
			if (i)
				$http.get(service + "exam/get" + v.info + "ById?sid=" + $scope.rt.sid)
				.then(function(r) {
					if (r.data.code == 200) {
						$scope.info = r.data.list[0];
					}
				});
			else
				$scope.showBtn = $scope.started = true;
		}
	})
	$http.post(service + "exam/get" + $scope.rt.get + "?" + ($scope.rt.sid ? "sid=" + $scope.rt.sid : "cid=" + $scope.rt.cid))
		.then(function(r) {
			if (r.data.code == 200) {
				$scope.list = r.data.list;
				$scope.t = $scope.list[$scope.ti];
				$scope.s = $scope.t.question[$scope.si];
				$scope.geted = true;
				if ($scope.started && !$scope.showBtn)
					$scope.timePlay();
			}
		});

	var split = function(s, str) {
			var a = str.split("-"),
				b = new Array(),
				c = true;
			for (var i = a.length; i--;) {
				if (s == a[i])
					c = false;
				else
					b.push(a[i]);
			}
			if (c)
				b.push(s)
			return b.sort().join("-")
		},
		getResult = function(s) {
			if (!s.result) {
				s.result = new Array();
				for (var i = s.options.length; i--;) {
					if (s.options[i].is_real)
						s.result.push(s.options[i].id);
				}
				s.result = s.result.sort().join("-");
			}
			return s.yesno = s.result == s.checked ? "yes" : "no";
		}
	$scope.vote = fac.vote;
	$scope.pen = fac.pen;
	$scope.goVote = function(s, aid) {
		s.checked = (s.question_type_id == 1 || !s.checked) ? "" + aid : split(aid, s.checked);
		getResult(s);
		if (s.question_type_id == 1)
			$timeout($scope.next, 99);
		$http.get(service + "exam/update" + $scope.rt.update + "byqid?id=" + s.qid + "&answers=" + s.checked)
	}

	$scope.score = 0;
	$scope.go = function(ti, si) {
		$scope.t = $scope.list[$scope.ti = ti];
		$scope.s = $scope.t.question[$scope.si = si];
		$scope.viewCard();
	}
	$scope.viewCard = function() {
		$scope.submited ? ($scope.time_stoped = !$scope.time_stoped) : $scope.changeTime();
		$scope.card_show = !$scope.card_show;
	}
	$scope.submit = function() {
		for (var i = $scope.list.length; i--;) {
			for (var q = $scope.list[i].question.length; q--;) {
				if ($scope.list[i].question[q].yesno == "yes")
					$scope.score++;
			}
		}
		$scope.submited = $scope.card_show = true;
		$scope.changeTime = function() {};
	}
	$scope.changeFav = function(s) {
		if (s.colled = !s.colled)
			$http.get(service + "exam/addStudy?qid=" + s.qid + (s.checked ? "&answers=" + s.checked : ""));
		else
			$http.get(service + "exam/removeStudy?qid=" + s.qid);
	}
})

base.controller('wrong', function($scope, $http, $sce, fac, user, hash) {
	user.bind(function() {
		$scope.get(1, true);
	})
	$scope.nlist = [{
		type: "1",
		name: "章节练习"
	}, {
		type: "3",
		name: "历年真题"
	}, {
		type: "2",
		name: "模拟考试"
	}];
	$scope.rt = hash.init({
		type: $scope.nlist[0].type
	});
	$scope.vote = fac.vote;
	$scope.pen = fac.pen;
	$scope.rows = 20;
	$scope.page = {};
	$scope.loading = false;
	var typeStr = "&type=" + $scope.rt.type;

	$scope.html = function(s) {
		return $sce.trustAsHtml(s);
	}
	$scope.setType = function(type) {
		if (type && $scope.rt.type != type) {
			$scope.rt.type = type;
			typeStr = "&type=" + type;
			$scope.get(1, true);
		}
	};
	$scope.get = function(i, b) {
		if (b || i != $scope.page.index) {
			$scope.list = [];
			$scope.loading = true;
			$scope.page.index = i;
			$http.post(service + "exam/getErrQuestions?page=" + $scope.page.index + "&rows=" + $scope.rows + "&mid=" + user.info.mid + "&cid=" + user.info.cid + typeStr)
				.then(function(r) {
					$scope.loading = false;
					if (r.data.code == 200) {
						$scope.list = r.data.list;
						$scope.page = fac.page($scope.page.index, $scope.rows, r.data.total)
					}
				});
		}
	}

	$scope.show = function(s) {
		$scope.s = s.question;
		$scope.card = true;
	}
	$scope.delStudy = function(qid) {
		$http.get(service + "exam/removerrStudy?qid=" + qid)
			.then(function() {
				$scope.get($scope.page.index, true);
			});
	}
	$scope.addStar = function(s) {
		s.colled = true;
		$http.get(service + "exam/addStudy?qid=" + s.id + (s.checked ? "&answers=" + s.checked : ""));
	}
	$scope.delStar = function(s) {
		s.colled = false;
		$http.get(service + "exam/removeStudy?qid=" + s.id);
	}
})

base.controller('fav', function($scope, $http, $sce, fac, user, hash) {
	user.bind(function() {
		$scope.get(1, true);
	})
	$scope.vote = fac.vote;
	$scope.pen = fac.pen;
	$scope.rows = 20;
	$scope.page = {};
	$scope.loading = false;

	$scope.html = function(s) {
		return $sce.trustAsHtml(s);
	}
	$scope.get = function(i, b) {
		if (b || i != $scope.page.index) {
			$scope.list = [];
			$scope.loading = true;
			$scope.page.index = i;
			$http.post(service + "exam/getMyStudyCollQuestion?page=" + $scope.page.index + "&rows=" + $scope.rows + "&mid=" + user.info.mid + "&cid=" + user.info.cid)
				.then(function(r) {
					$scope.loading = false;
					if (r.data.code == 200) {
						$scope.list = r.data.list;
						$scope.page = fac.page($scope.page.index, $scope.rows, r.data.total)
					}
				});
		}
	}

	$scope.show = function(s) {
		$scope.s = s.question;
		$scope.card = true;
	}
	$scope.delStar = function(s) {
		s.colled = false;
		$http.get(service + "exam/removeStudy?qid=" + s.id)
			.then(function() {
				$scope.get($scope.page.index, true);
			});
	}
})

base.controller('item', function($scope, $http, $timeout, fac, user, hash) {
	$scope.user = user;
	$scope.random = Math.floor(Math.random()*9)%3+1
	$scope.rt = hash.init({
		type: 1
	});
	$scope.nlist = [{
		type: "1",
		name: "课程介绍"
	}, {
		type: "2",
		name: "目录"
	}, {
		type: "3",
		name: "评论"
	}]

	$scope.setType = function(type) {
		$scope.rt.type = type
	}

	$http.post(service + "gradeFront/getVideoBygid?gid=" + $scope.rt.gid)
		.then(function(r) {
			if (r.data.code == 200) {
				$scope.info = r.data.list;
				document.title = user.title = $scope.info.name;
				if (!$scope.rt.vid)
					$scope.getVideo($scope.info.flist[0].id)
				$http.post(service + "gradeFront/getVideoBygid?gid=" + $scope.info.parent_id)
					.then(function(r) {
						if (r.data.code == 200) {
							$scope.pinfo = r.data.list;
						}
					});
			}
		});
	$scope.getVideo = function(id, b) {
		if (b || id != $scope.rt.vid) {
			$http.post(service + "gradeFront/getByVId?gid=" + $scope.rt.gid + "&vid=" + id)
				.then(function(r) {
					if (r.data.code == 200) {
						$scope.rt.vid = id;
						$scope.video = r.data.url;
					}else
						alert(r.data.msg)
				});
		}
	}

	$http.post(service + "gradeFront/findTBygid?gid=" + $scope.rt.gid)
		.then(function(r) {
			if (r.data.code == 200) {
				var tname = new Array(),
					i = r.data.list.length;
				for (; i--;) {
					tname.push(r.data.list[i].name)
				}
				$scope.techers = tname.join("，");
			}
		});

	$scope.star = 0;
	$scope.stars = [1, 2, 3, 4, 5];
	$scope.sub = function() {
		$scope.errMsg = "正在请求，请稍候…";
		$http.post(service + "gradeFront/addComment", "gid=" + $scope.rt.gid + "&content=" + $scope.comment + "&star=" + $scope.star)
			.then(function(r) {
				$scope.errMsg = r.data.msg;
				$timeout(function() {
					$scope.errMsg = "";
					if (r.data.code == 200){
						$scope.getComment();
						$scope.post = false;
					}
				}, 999)
			});
	}
	$scope.getComment = function() {
		$http.post(service + "gradeFront/getComment", "gid=" + $scope.rt.gid)
			.then(function(r) {
				$scope.clist = r.data.list;
			});
	}
	$scope.getComment();
})

base.controller('info', function($scope, $http, $timeout, user, fac) {
	user.title = "个人资料";
	$http.post(service + "webuser/getPros")
		.then(function(r) {
			if (r.data.code == 200) {
				r.data.list.unshift({
					id: 0,
					province_name: "请选择所在地区"
				})
				$scope.plist = r.data.list;
			}
		});
	$scope.pid = 0;
	$http.post(service + "webuser/getUser")
		.then(function(r) {
			if (r.data.code == 200) {
				$scope.avatar = r.data.list[0].avatar;
				$scope.phone = r.data.list[0].phone;
				$scope.nickname = r.data.list[0].nickname;
				$scope.name = r.data.list[0].name;
				$scope.mid = r.data.list[0].major_id;
				$scope.pid = r.data.list[0].province_id;
			}
		});

	$scope.sub = function() {
		$scope.errMsg = "正在请求，请稍候…"
		$http.post(service + "webuser/updateAppUser", fac.serialize($scope.user))
			.then(function(r) {
				if (r.data.code == 200)
					$scope.errMsg = "修改成功"
				else
					$scope.errMsg = r.data.msg;
				$timeout(function() {
					$scope.errMsg = "";
				}, 3000)
			});
	}
})

base.controller('bind', function($scope, $http, $interval, hash, fac) {
	$scope.mid = "";
	$scope.mlist = [{
		id: "",
		major_name: "请选择报考专业"
	}];
	$scope.cid = "";
	$scope.clist = [{
		id: "",
		course_name: "请选择报考科目"
	}];

	$http.post(service + "frontIndex/getAllFrontMajor")
		.then(function(r) {
			if (r.data.code == 200) {
				r.data.list.unshift($scope.mlist[0])
				$scope.mlist = r.data.list;
			}
		});

	$scope.setMid = function(id) {
		$scope.cid = "";
		if (id)
			$http.post(service + "frontIndex/getAllFrontCourseByMid?major_id=" + id)
			.then(function(r) {
				if (r.data.code == 200) {
					r.data.list.unshift({
						id: "",
						course_name: "请选择报考科目"
					})
					$scope.clist = r.data.list;
				}
			});
	};

	$scope.send = function(ph) {
		if ($scope.user.phone.$valid && !$scope.sended) {
			$http.get(service + "wxuser/getCode?ph=" + ph)
				.then(function(r) {
					if (r.data.code == 200) {
						$scope.s = 60;
						$scope.sended = true;
						var stop = $interval(function() {
							if ($scope.s)
								$scope.s--;
							else {
								$scope.sended = false;
								$interval.cancel(stop);
							}
						}, 999)
					} else {
						$scope.errMsg = r.data.msg;
					}
				})
		}
	}

	$scope.sub = function() {
		$scope.errMsg = "正在请求，请稍候…"
		$http.post(service + "wxuser/bdPhone", fac.serialize($scope.user))
			.then(function(r) {
				$scope.errMsg = r.data.msg;
				if (r.data.code == 200)
					location.href = hash.href;
			});
	}
})