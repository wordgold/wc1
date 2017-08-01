"use strict";
var service = "http://wx.zkjan.com/kstk-api/";
// service = "http://192.168.3.15/kstk-api/";
var base = angular.module('baseApp', []);
base.config(function($httpProvider) {
	$httpProvider.defaults.headers.post["Content-Type"] = 'application/x-www-form-urlencoded;charset=UTF-8';
});
base.value('QType', [{
	type: "ChaptersAndSections",
	get: "QuestionBySidFrontWx",
	one: "ChapterQoneWx",
	update: "qerrdb",
	name: "章节练习"
}, {
	type: "AllReal",
	get: "RealQuestionWx",
	one: "RealQoneWx",
	update: "realdb",
	info: "RealOne",
	name: "历年真题"
}, {
	type: "AllSimul",
	get: "SimulQuestionWx",
	one: "SimulQoneWx",
	update: "simuldb",
	info: "SimulOne",
	name: "模拟考试"
}]);
base.filter("slice", function() {
	return function(s, l) {
		return (s && s.length > l) ? s.slice(0, l - 1) + "..." : s;
	}
}).filter("abcd", function() {
	return function(s) {
		return ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"][s];
	}
}).filter("xyz", function() {
	return function(s) {
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
	$http.post(service + "webuser/getNews")
		.then(function(r) {
			if (r.data.code == 200) {
				s.news = r.data.list;
				s.unread = 0;
				for (var i = s.news.length; i--;) {
					if (!s.news[i].is_read)
						s.unread++;
				}
			}
		});
	s.need = true;
	s.info = {
		mid: 11
	};
	s.bind = function(e) {
		es.push(e);
	};
	s.fire = function() {
		for (var i = es.length; i--;) {
			es[i]();
		}
	}
	$http.post(service + "wxuser/checkUserinfo")
		.then(function(r) {
			if (r.data.code == 200) {
				$http.post(service + "wxuser/checkUserPw")
					.then(function(r) {
						if (r.data.code == -1)
							location.href = '<!--#echo var="wc1"-->password.html?href=' + encodeURIComponent(location.href);
					});
				s.info = r.data.list[0];
				if (!s.info.mid)
					s.selectM()
				else if (!s.info.cid)
					s.selectC()
				else
					s.fire();
			} else if (s.need)
				location.href = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx727973ddd3d1c2fb&redirect_uri=http%3A%2F%2Fwx.zkjan.com%2Fkstk-api%2Fwxuser%2FgetToken?&response_type=code&scope=snsapi_userinfo&state=h_' + encodeURIComponent(location.pathname + location.search) + '#wechat_redirect'
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
	s.buy = function(id) {
		if (!s.info.added)
			$http.get(service + "gradeFront/addShopcar?gids=" + id)
			.then(function(r) {
				if (r.data.code == 200) {
					s.info.carcount = r.data.count;
					s.info.added = true;
				}
				alert(r.data.msg);
			})
	}
	s.pay = function(data) {
		WeixinJSBridge.invoke('getBrandWCPayRequest', {
				"appId": data.appId,
				"timeStamp": data.timeStamp + "",
				"nonceStr": data.nonceStr + "",
				"package": data.package,
				"signType": "MD5",
				"paySign": data.sign
			},
			function(res) {
				location.href = '<!--#echo var="wc1"-->user/order.html?type=' + (res.err_msg == "get_brand_wcpay_request:ok" ? '1' : '0') + '&r=' + Math.random()
			}
		);
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
base.factory("fac", function($http) {
	return {
		serialize: function(obj) {
			var a = new Array()
			angular.forEach(obj.$$controls, function(v) {
				a.push(v.$name + "=" + encodeURIComponent(v.$modelValue))
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
		},
		nav: function() {
			var url = location.href.split("/");
			return url[url.length - 2];
		},
		share: function(t, d, i, l) {
			var opt = {
				link: l || location.href,
				title: t || document.title,
				desc: d || "中科建安（北京）教育科技有限公司，简称中科建安教育。中国执业资格考试培训领导品牌，是目前国内规模最大、最强师资阵容的注册安全工程师教育培训机构。",
				imgUrl: i || 'http://www.zkjan.com/images/fav.png'
			};
			$http.post(service + "wxuser/getExamTicket?url=" + encodeURIComponent(location.href))
				.then(function(r) {
					if (r.data.code == 200) {
						wx.config({
							debug: false,
							appId: 'wx727973ddd3d1c2fb',
							timestamp: r.data.timestamp,
							nonceStr: r.data.noncestr,
							signature: r.data.signature,
							jsApiList: ['onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ', 'onMenuShareWeibo', 'onMenuShareQZone'] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
						});
						wx.ready(function() {
							wx.onMenuShareTimeline(opt);
							wx.onMenuShareAppMessage(opt);
							wx.onMenuShareQQ(opt);
							wx.onMenuShareWeibo(opt);
							wx.onMenuShareQZone(opt);
						});
					}
				});
		}
	};
})
base.directive('vphone', function() {
	return {
		require: 'ngModel',
		link: function(scope, elm, attrs, ctrl) {
			ctrl.$parsers.unshift(function(viewValue) {
				if (/^1(3[0-9]|5[0-35-9]|7[035678]|8[0-9]|47)[0-9]{8}$/.test(viewValue)) {
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
		if (/micromessenger/.test(navigator.userAgent.toLowerCase())) {
			if (typeof document.referrer === '')
				location.href = '<!--#echo var="wc1"-->study/index.html';
			else
				history.back();
		} else
			location.href = 'http://www.zkjan.com/';
	}
})

base.controller('banner', function($scope, $http, user) {
	$http.post(service + "wxuser/getWxImg?mid=" + user.info.mid)
		.then(function(r) {
			if (r.data.code == 200) {
				$scope.list = r.data.list;
				setTimeout(function() {
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
				}, 999)
			}
		});
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

	$scope.getS = function(c) {
		c.showL = !c.showL;
		if (c.showL && !c.sublist) {
			$http.post(service + "exam/getSections?sid=" + c.id)
				.then(function(r) {
					if (r.data.code == 200) {
						c.sublist = r.data.list;
					}
				});
		}
	}
})

base.controller('myclass', function($scope, $http, fac, user, hash) {
	user.title = "我的课程";
	$scope.user = user;
	$scope.rows = 20;
	$scope.page = {};
	$scope.loading = true;

	$scope.get = function(i, b) {
		$scope.list = [];
		$scope.loading = true;
		$scope.page.index = i;
		$http.post(service + "webuser/getMyGrade?page=" + $scope.page.index + "&rows=" + $scope.rows)
			.then(function(r) {
				$scope.loading = false;
				if (r.data.code == 200) {
					$scope.list = r.data.list;
					$scope.page = fac.page($scope.page.index, $scope.rows, r.data.total)
				}
			});
	}
	$scope.get(1);
})

base.controller('newslist', function($scope, $http, user, fac) {
	user.need = false;
	fac.share();
	$http.post(service + "exam/getExamserviceDays?mid=" + user.info.mid)
		.then(function(r) {
			if (r.data.code == 200) {
				$scope.date = r.data.list[0].days.toString().split("");
			}
		});
	$scope.page = 1;
	$scope.next = true;
	$scope.list = new Array();
	$scope.get = function() {
		$http.post(service + "frontIndex/getHomeInfomation?type=1&rows=20&page=" + $scope.page)
			.then(function(r) {
				if (r.data.code == 200) {
					$scope.list = $scope.list.concat(r.data.list);
					$scope.page++;
					if($scope.list.length == r.data.total)
						$scope.next = false;
				}
			});
	}
	$scope.get();
})

base.controller('newsitem', function($scope, $http, $sce, user, fac, hash) {
	$scope.user = user;
	user.need = false;
	user.title = "最新资讯";
	$scope.rt = hash;
	$scope.html = function(s) {
		return $sce.trustAsHtml(s);
	}
	$http.post(service + "infomation/getInfomationContent?zid=" + $scope.rt.id)
		.then(function(r) {
			if (r.data.code == 200) {
				$scope.info = r.data.list[0];
				fac.share($scope.info.title);
			}
		});
})

base.controller('history', function($scope, $http, fac, user, hash) {
	$scope.nlist = [{
		name: "观看视频",
		type: 1
	}, {
		name: "练习试题",
		type: 2
	}];
	user.bind(function() {
		$scope.get();
	})
	$scope.rt = hash.init({
		type: $scope.nlist[0].type
	});
	$scope.loading = true;

	$scope.setType = function(type) {
		if ($scope.rt.type != type) {
			$scope.rt.type = type;
			$scope.get();
		}
	};

	$scope.show = function(q,gid) {
		q.showList = !q.showList;
		if(q.showList && !q.list){
			$http.post(service + "webuser/getMy" + (hash.type ? "GradeExamOrder" : "PlanGradeOrder") + "?gid=" + gid + "&order_id=" + q.order_id).success(function(response) {
				if (response.code == 200) {
					q.list = response.list;
				}
			});
		}
	}

	$scope.get = function(i, b) {
		$scope.list = [];
		$scope.loading = true;
		$http.post(service + "webuser/getMy" + (hash.type == 2 ? "GradeExam" : "PlanGrade") + "?rows=99&mid=" + user.info.mid + "&cid=" + user.info.cid)
			.then(function(r) {
				$scope.loading = false;
				if (r.data.code == 200) {
					$scope.list = r.data.list;
					for (var i = $scope.list.length; i--;) {
						if (!$scope.list[i].jdlist.length)
							$scope.list.splice(i, 1)
					}
				}
			});
	}
})

base.controller('order', function($scope, $http, fac, user, hash) {
	$scope.nlist = [{
		name: "已完成订单",
		type: 1
	}, {
		name: "未完成订单",
		type: 0
	}];
	user.title = "我的订单";
	$scope.rows = 20;
	$scope.rt = hash.init({
		type: $scope.nlist[0].type
	});

	$scope.list = new Array(new Array(), new Array(), new Array());
	$http.post(service + "webuser/getMyOrder?rows=9999")
		.then(function(r) {
			if (r.data.code == 200) {
				angular.forEach(r.data.list, function(v, i) {
					$scope.list[v.status].push(v);
				})
				$scope.get(1)
			}
		});

	$scope.setType = function(type) {
		if ($scope.rt.type != type) {
			$scope.rt.type = type;
			$scope.get(1);
		}
	};
	$scope.get = function(i) {
		$scope.page = fac.page(i, $scope.rows, $scope.list[$scope.rt.type].length)
		$scope.list[2] = $scope.list[$scope.rt.type].slice(($scope.page.index - 1) * $scope.rows, $scope.page.index * $scope.rows);
	}
	$scope.del = function(id, i) {
		$http.post(service + "webuser/removeMyOrder?ids=" + id);
		$scope.list[$scope.rt.type].splice(($scope.page.index - 1) * $scope.rows + i, 1)
		$scope.get(1);
	}
	$scope.pay = function(id) {
		$http.post(service + "wxuser/wxReplaypay?id=" + id)
			.then(function(r) {
				if (r.data.code == 200) {
					user.pay(r.data);
				} else {
					$scope.paying = "";
					alert(r.data.msg);
				}
			});
	}
})

base.controller('car', function($scope, $http, fac, user) {
	user.title = "购物车";
	$scope.loading = true;

	$http.post(service + "gradeFront/getShopcar")
		.then(function(r) {
			$scope.loading = false;
			if (r.data.code == 200)
				$scope.list = r.data.list;
		});

	$scope.checklength = $scope.price = 0;
	$scope.del = function(g, i) {
		$http.post(service + "gradeFront/removeShopcar?ids=" + g.sid);
		$scope.list.splice(i, 1);
		user.carcount = $scope.list.length;
	}
	$scope.check = function(g) {
		if (g.check = !g.check) {
			$scope.checklength++;
			$scope.price += g.cmoney - 0;
		} else {
			$scope.checklength--
				$scope.price -= g.cmoney - 0;
		}
	}
	$scope.checkAll = function() {
		var i = $scope.list.length;
		$scope.price = 0;
		if ($scope.checklength == i) {
			for (; i--;) {
				$scope.list[i].check = false;
			}
			$scope.checklength = 0;
		} else {
			for (; i--;) {
				$scope.list[i].check = true;
				$scope.price += $scope.list[i].cmoney - 0;
			}
			$scope.checklength = $scope.list.length;
		}
	}
	$scope.pay = function(id) {
		if ($scope.checklength && !$scope.paying) {
			$scope.paying = "中";
			var l = $scope.list.length,
				s = new Array();
			for (; l--;) {
				if ($scope.list[l].check) {
					s.push($scope.list[l].sid);
				}
			}
			$http.post(service + "wxuser/wxPay?ids=" + s.join())
				.then(function(r) {
					if (r.data.code == 200) {
						user.pay(r.data);
					} else {
						$scope.paying = "";
						alert(r.data.msg);
					}
				});
		}
	}
})

base.controller('pay', function($scope, $http, fac, user, hash) {
	user.title = "支付订单";
	$scope.loading = true;

	$scope.rt = hash;

	$http.post(service + "gradeFront/findOrderbyid?id=" + $scope.rt.id)
		.then(function(r) {
			if (r.data.code == 200) {
				$scope.money = r.data.list[0].money;
				$scope.no = r.data.list[0].out_trade_no;
				$scope.status = r.data.list[0].status;
			}
		});
})

base.controller('test', function($scope, $http, $interval, $timeout, $sce, fac, user, hash, QType) {
	$scope.rt = hash;
	$scope.ti = $scope.si = 0;
	$scope.QType = QType;
	user.need = false;
	user.title = $scope.rt.name;
	fac.share("在线做题-" + user.title);

	$scope.html = function(s) {
		return $sce.trustAsHtml(s);
	}
	$scope.getOne = function(ti, si) {
		$scope.t = $scope.list[ti];
		$scope.s = $scope.t.question[si];
		if (!$scope.s.question)
			$http.get(service + "exam/get" + $scope.rt.one + "?qid=" + $scope.s.qid)
			.then(function(r) {
				if (r.data.code == 200) {
					$scope.s = $scope.list[ti].question[si] = r.data.list;
				}
			}, function() {
				alert("请求失败，请检查网络连接是否断开")
			});
	}
	$scope.start = function(bl) {
		$scope.showBtn = !bl;
		$scope.started = true;
		if ($scope.geted && bl)
			$scope.timePlay();
	}
	$scope.next = function() {
		if ($scope.si + 1 < $scope.t.question.length)
			++$scope.si;
		else if ($scope.ti + 1 < $scope.list.length) {
			++$scope.ti;
			$scope.si = 0;
		} else if (!$scope.hideNext) {
			$scope.viewCard();
			$scope.submit_show = $scope.hideNext = true;
		}
		$scope.getOne($scope.ti, $scope.si);
	}
	$scope.prev = function() {
		if ($scope.si)
			--$scope.si;
		else if ($scope.ti) {
			$scope.si = $scope.list[--$scope.ti].question.length - 1;
		}
		$scope.getOne($scope.ti, $scope.si);
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

	if ($scope.rt.type == "grade") {
		$scope.rt.get = "GradeQuestionWx";
		$scope.rt.one = "GradeQoneWx";
		$scope.rt.update = "gradedb";
		$scope.showBtn = $scope.started = true;
	} else
		angular.forEach(QType, function(v, i) {
			if ($scope.rt.type == v.type) {
				$scope.rt.get = v.get;
				$scope.rt.update = v.update;
				$scope.rt.one = v.one;
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
				$scope.getOne($scope.ti, $scope.si);
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
		if (s.question_type_id == 1) {
			if ($scope.time == "0:00")
				s.showA = true;
			else
				$timeout($scope.next, 99);
		}
		$http.get(service + "exam/update" + $scope.rt.update + "byqid?id=" + s.id + "&answers=" + s.checked)
	}

	$scope.score = 0;
	$scope.go = function(ti, si) {
		$scope.ti = ti;
		$scope.si = si;
		$scope.getOne(ti, si);
		$scope.viewCard();
	}
	$scope.viewCard = function() {
		($scope.submited || $scope.showBtn) ? ($scope.time_stoped = !$scope.time_stoped) : $scope.changeTime();
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

base.controller('shareTest', function($scope, $http, $timeout, $sce, fac, hash, QType) {
	$scope.rt = hash.init({
		type: "模拟考试"
	});
	$scope.QType = QType;
	$scope.ti = $scope.si = 0;
	$scope.showBtn = true;
	fac.share();

	$scope.html = function(s) {
		return $sce.trustAsHtml(s);
	}
	$scope.getOne = function(ti, si) {
		$scope.t = $scope.list[ti];
		$scope.s = $scope.t.question[si];
		if (!$scope.s.question)
			$http.get(service + "exam/get" + $scope.rt.one + "?qid=" + $scope.s.qid)
			.then(function(r) {
				if (r.data.code == 200) {
					$scope.s = $scope.list[ti].question[si] = r.data.list;
				}
			}, function() {
				alert("请求失败，请检查网络连接是否断开")
			});
	}
	$scope.start = function(bl) {
		$scope.showBtn = !bl;
		$scope.started = true;
		if ($scope.geted && bl)
			$scope.timePlay();
	}
	$scope.next = function() {
		if ($scope.si + 1 < $scope.t.question.length)
			++$scope.si;
		else if ($scope.ti + 1 < $scope.list.length) {
			++$scope.ti;
			$scope.si = 0;
		} else
			$scope.showAd = true;
		$scope.getOne($scope.ti, $scope.si);
	}
	$scope.prev = function() {
		if ($scope.si)
			--$scope.si;
		else if ($scope.ti) {
			$scope.si = $scope.list[--$scope.ti].question.length - 1;
		}
		$scope.getOne($scope.ti, $scope.si);
	}

	angular.forEach(QType, function(v, i) {
		if ($scope.rt.type == v.name) {
			$scope.rt.get = v.get;
			$scope.rt.one = v.one;
			$http.get(service + "exam/get" + v.info + "ById?sid=" + $scope.rt.sid)
				.then(function(r) {
					if (r.data.code == 200) {
						$scope.info = r.data.list[0];
						document.title = $scope.info.title;
						fac.share($scope.info.title, $scope.info.info);
					}
				});
		}
	})
	$http.post(service + "exam/get" + $scope.rt.get + "?sid=" + $scope.rt.sid)
		.then(function(r) {
			if (r.data.code == 200) {
				$scope.list = r.data.list;
				$scope.list = r.data.list;
				$scope.getOne($scope.ti, $scope.si);
				$scope.geted = true;
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
	}, {
		type: "4",
		name: "学习计划"
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
		$scope.s = s;
		$scope.card = true;
	}
	$scope.delStudy = function(qid) {
		$http.get(service + "exam/removerrStudy?type=" + $scope.rt.type + "&qid=" + qid)
			.then(function() {
				$scope.get($scope.page.index, true);
			});
	}
	$scope.addStar = function(s) {
		s.colled = true;
		$http.get(service + "exam/addStudy?qid=" + s.qid + (s.checked ? "&answers=" + s.checked : ""));
	}
	$scope.delStar = function(s) {
		s.colled = false;
		$http.get(service + "exam/removeStudy?qid=" + s.qid);
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
		$scope.s = s;
		$scope.card = true;
	}
	$scope.delStar = function(s) {
		s.colled = false;
		$http.get(service + "exam/removeStudy?qid=" + s.qid)
			.then(function() {
				$scope.get($scope.page.index, true);
			});
	}
})

base.controller('item', function($scope, $http, $timeout, $sce, fac, user, hash) {
	$scope.user = user;
	$scope.random = Math.floor(Math.random() * 9) % 3 + 1;
	$scope.loading = true;
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

	$scope.html = function(s) {
		return $sce.trustAsHtml(s);
	}
	$scope.setType = function(type) {
		$scope.rt.type = type
	}

	var getParent = function(list) {
		$scope.pinfo = list;
		var money = 0,
			i = $scope.pinfo.glist.length;
		for (; i--;) {
			var p = $scope.pinfo.glist[i];
			money += p.cmoney - 0;
			if ($scope.rt.gid == p.id) {
				p.check = true;
				$scope.buyid.push(p.id);
				$scope.price = p.cmoney;
			}
		}
		$scope.pinfo.ymoney = money - $scope.pinfo.cmoney;
	}
	$http.post(service + "gradeFront/getVideoBygid?gid=" + $scope.rt.gid)
		.then(function(r) {
			$scope.loading = false;
			if (r.data.code == 200) {
				$scope.info = r.data.list;
				$scope.info.index = 0;
				document.title = user.title = $scope.info.name;
				fac.share(user.title, "授课教师：" + $scope.techers, $scope.info.imgurl)
				if ($scope.info.glist) {
					$scope.vlist = $scope.info.glist;
					getParent(r.data.list)
				} else {
					$scope.vlist = [$scope.info];
					$http.post(service + "gradeFront/getVideoBygid?gid=" + $scope.info.parent_id)
						.then(function(r) {
							if (r.data.code == 200) {
								getParent(r.data.list)
							}
						});
				}
				if ($scope.rt.vid) {
					for (var i = $scope.vlist[0].flist.length; i--;) {
						if ($scope.vlist[0].flist[i].id == $scope.rt.vid)
							$scope.getVideo($scope.vlist[0].flist[i], true)
					}
				} else
					$scope.getVideo($scope.vlist[0].flist[0])
			}
		});
	var adde = true,
		n = 0;
	$scope.getVideo = function(v, b) {
		if (b || v.id != $scope.rt.vid) {
			document.title = user.title = v.name;
			$http.post(service + "gradeFront/getByVId?gid=" + $scope.vlist[$scope.info.index].id + "&vid=" + v.id)
				.then(function(r) {
					if (r.data.code == 200) {
						$scope.rt.vid = v.id;
						$scope.video = r.data.url;
						document.body.scrollTop = 0;
						if (adde) {
							var $video = document.getElementById('vo');
							// $video.addEventListener("error", function(err) {
							// 	alert(JSON.stringify(err) + $video.error.code + "-" + $video.error.message);
							// });
							$video.addEventListener("timeupdate", function() {
								n++;
								if (n % 99 == 0) {
									$http.post(service + "gradeFront/upVideoPro?vid=" + $scope.rt.vid + "&current_time=" + $video.currentTime + "&total_time=" + $video.duration)
								}
							})
							$video.addEventListener("pause", function() {
								$http.post(service + "gradeFront/upVideoPro?vid=" + $scope.rt.vid + "&current_time=" + $video.currentTime + "&total_time=" + $video.duration)
							})
							adde = false;
						}
					} else
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
	$scope.comment = "";
	$scope.sub = function() {
		$scope.errMsg = "正在请求，请稍候…";
		$http.post(service + "gradeFront/addComment", "gid=" + $scope.rt.gid + "&content=" + $scope.comment + "&star=" + $scope.star)
			.then(function(r) {
				$scope.errMsg = r.data.msg;
				$timeout(function() {
					$scope.errMsg = "";
					if (r.data.code == 200) {
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

	$scope.showBuy = false;
	$scope.buyid = new Array();
	$scope.check = function(p, b) {
		$scope.buyid.length = $scope.price = 0;
		p.check = !p.check;
		if (b) {
			if (p.check) {
				$scope.buyid.push(p.id);
				$scope.price = p.cmoney;
			}
			for (var i = $scope.pinfo.glist.length; i--;) {
				$scope.pinfo.glist[i].check = p.check;
			}
		} else {
			for (var i = $scope.pinfo.glist.length; i--;) {
				if ($scope.pinfo.glist[i].check) {
					$scope.buyid.push($scope.pinfo.glist[i].id)
					$scope.price += $scope.pinfo.glist[i].cmoney - 0;
				}
			}
			if ($scope.buyid.length == $scope.pinfo.glist.length) {
				$scope.pinfo.check = true;
				$scope.buyid.length = 0;
				$scope.buyid.push($scope.pinfo.id);
				$scope.price = $scope.pinfo.cmoney;
			} else
				$scope.pinfo.check = false;
		}
	}
	$scope.pay = function(s) {
		$http.post(service + "wxuser/addBalance?gids=" + s.join())
			.then(function(r) {
				if (r.data.code == 200) {
					user.pay(r.data);
				} else {
					$scope.paying = "";
					alert(r.data.msg);
				}
			});
	}
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

base.controller('issues', function($scope, $http, $timeout, user, fac) {
	user.title = "意见反馈";
	$scope.aid = -1;

	$scope.sub = function() {
		$scope.errMsg = "正在请求，请稍候…"
		$http.post(service + "appuser/addFeedback", fac.serialize($scope.user))
			.then(function(r) {
				$scope.errMsg = r.data.msg;
				$timeout(function() {
					$scope.errMsg = "";
				}, 3000)
			});
	}
})

base.controller('bind', function($scope, $http, $interval, $timeout, hash, fac) {
	$scope.r = 0;
	$scope.ran = function() {
		$scope.r++;
	}

	$scope.send = function(ph) {
		if ($scope.user.phone.$valid && !$scope.sended) {
			$scope.errMsg = "";
			$http.get(service + "wxuser/getCode?ph=" + ph + "&vcode=" + $scope.imgcode)
				.then(function(r) {
					$scope.r++;
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
						$timeout(function() {
							$scope.errMsg = "";
						}, 3000)
					}
				})
		}
	}

	$scope.sub = function() {
		$scope.errMsg = "正在请求，请稍候…"
		$http.post(service + "wxuser/bdPhone", fac.serialize($scope.user))
			.then(function(r) {
				$scope.errMsg = r.data.msg;
				if (r.data.code == 200) {
					$http.post(service + "wxuser/checkUserPw")
						.then(function(r) {
							if (r.data.code == 200)
								location.href = hash.href ? (location.origin + hash.href) : '<!--#echo var="wc1"-->study/index.html';
							else
								location.href = '<!--#echo var="wc1"-->password.html?href=' + hash.href;
						});
				}
			});
	}
})

base.controller('password', function($scope, $http, hash, fac) {
	$scope.sub = function() {
		$scope.errMsg = "正在请求，请稍候…"
		$http.post(service + "wxuser/upUserPw", fac.serialize($scope.user))
			.then(function(r) {
				$scope.errMsg = r.data.msg;
				if (r.data.code == 200)
					location.href = hash.href ? (location.origin + hash.href) : '<!--#echo var="wc1"-->study/index.html';
			});
	}
})

base.controller('news', function($scope, $http, $sce, user, hash, fac) {
	user.title = "消息";
	$scope.user = user;
	$scope.rt = hash;
	$scope.html = function(s) {
		return $sce.trustAsHtml(s);
	}
	if ($scope.rt.id)
		$http.get(service + "webuser/getNewsByid?nid=" + $scope.rt.id)
		.then(function(r) {
			if (r.data.code == 200) {
				$scope.info = r.data.list[0];
			} else {
				alert(r.data.msg)
				location.href = '<!--#echo var="wc1"-->user/news.html'
			}
		})
})

base.controller('footer', function($scope, fac) {
	$scope.nav = fac.nav();
	if (!/micromessenger/.test(navigator.userAgent.toLowerCase()))
		$scope.href = 'http://www.zkjan.com/';
})

base.controller('center', function($scope, user) {
	$scope.user = user;
})

base.controller('home', function($scope, $http, user, fac) {
	user.need = false;
	fac.share();
	$http.post(service + "frontIndex/getAllFrontTeacher?page=1&rows=20&mid=" + user.info.mid)
		.then(function(r) {
			if (r.data.code == 200) {
				$scope.ht_list = r.data.list;
				setTimeout(function() {
					$("#swipe_h1").Swipe({
						startSlide: 0,
						auto: 4000
					})
				}, 999)
			}
		});
	$http.post(service + "infomation/getHomeInfomation?cp=1&type=2&mid=" + user.info.mid)
		.then(function(r) {
			if (r.data.code == 200)
				$scope.news = r.data.list[0];
		});
	$http.post(service + "gradeFront/getGradeByCid?page=1&rows=20&mid=" + user.info.mid)
		.then(function(r) {
			if (r.data.code == 200)
				$scope.list = r.data.list;
		});
	$http.post(service + "gradeFront/getSmallgrade?mid=" + user.info.mid)
		.then(function(r) {
			if (r.data.code == 200)
				$scope.clist = r.data.list;
		});
	$scope.pay = function(s) {
		$http.post(service + "wxuser/addBalance?gids=" + s)
			.then(function(r) {
				if (r.data.code == 200)
					user.pay(r.data);
				else {
					alert(r.data.msg);
					if (r.data.code == -2)
						location.href = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx727973ddd3d1c2fb&redirect_uri=http%3A%2F%2Fwx.zkjan.com%2Fkstk-api%2Fwxuser%2FgetToken?&response_type=code&scope=snsapi_userinfo&state=h_' + encodeURIComponent(location.href) + '#wechat_redirect'
				}
			});
	}
})