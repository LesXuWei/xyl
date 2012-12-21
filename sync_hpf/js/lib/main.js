$(function(){
	window.MySlider = (function(containerID, portalId){
		var config_cache = {
			current_page_index : 0, // swipeview当前index
			initialized_page : {} // 记录已经执行过init方法的index
		}

		// check config文件是否正确
		if (!checkConfig()) {
			return null;
		}
		
		// 加载主页面
		if (sv_config.portal) {
			loadPage($("#" + portalId), {url:sv_config.portal});
		}
		else {
			$("#" + containerID).show();
			$("#" + portalId).hide();
		}
		
		// swipview load
		var i, gallery;
		initSlider();
		
		gallery.onFlip(function(){
			var upcoming, j, fn, isInit = false;
			for (j = 0; j < 3; j++) {
				upcoming = gallery.masterPages[j].dataset.upcomingPageIndex;
				if (upcoming != gallery.masterPages[j].dataset.pageIndex) {
					fn = null;
					if (upcoming == gallery.pageIndex) {
						isInit = true;
						fn = function(){
							execInit(gallery.pageIndex);
							if (MySlider.gobalFlipFn) {
								MySlider.gobalFlipFn();
								MySlider.gobalFlipFn = false;
							}
						};
					}
					config_cache.initialized_page[upcoming] = false;
					loadPage(gallery.masterPages[j], sv_config.config_pages[upcoming], fn);
					if (!gallery.options.loop && gallery.isGoto){
						gallery.masterPages[j].style.visibility = "visible";
						if (gallery.pageIndex == 0) {
							var pageFlip = gallery.currentMasterPage - 1 < 0 ? 2 : gallery.currentMasterPage - 1;
							gallery.masterPages[pageFlip].style.visibility = "hidden";
						}
						else if (gallery.pageIndex == gallery.options.numberOfPages - 1) {
							var pageFlip = gallery.currentMasterPage + 1 > 2 ? 0 : gallery.currentMasterPage + 1;
							gallery.masterPages[pageFlip].style.visibility = "hidden";
						}
					}
				}
				else {
					MySlider.removeShade(gallery.masterPages[j]);
				}
			}
			
			if (config_cache.current_page_index != gallery.pageIndex) {
				triggerOverwrite(sv_config.config_pages[config_cache.current_page_index].name, "onHidden"); // 消失的页面
				config_cache.current_page_index = gallery.pageIndex;
				if (!isInit) {
					execInit(gallery.pageIndex);
				}
			}
			if (!isInit && MySlider.gobalFlipFn) {
				MySlider.gobalFlipFn();
				MySlider.gobalFlipFn = false;
			}
		});
		
		gallery.onMove(function(){
			var pageName = sv_config.config_pages[gallery.pageIndex].name;
			triggerOverwrite(pageName, "onMove");
		});
		
		gallery.onMoveStart(function(){
			var pageName = sv_config.config_pages[gallery.pageIndex].name;
			triggerOverwrite(pageName, "onMoveStart");
		});
		
		gallery.onMoveEnd(function(){
			var pageName = sv_config.config_pages[gallery.pageIndex].name;
			triggerOverwrite(pageName, "onMoveEnd");
		});
		
		gallery.onTouchStart(function(){
			var pageName = sv_config.config_pages[gallery.pageIndex].name;
			triggerOverwrite(pageName, "onTouchStart");
		});
		
		gallery.getShade = function(index){
			if (sv_config.config_pages[index] && "background" in sv_config.config_pages[index]) {
				return "<div class='swipeview_shade' style='width:1024px;height:748px;background-image:url("+sv_config.config_pages[index].background+")'></div>";
			}
			
			return null;
		};
		
		// 执行初始化方法
		function execInit(pageIndex) {
			var pageName = sv_config.config_pages[pageIndex].name;
			if (!config_cache.initialized_page[pageIndex]) {
				triggerOverwrite(pageName, "initOnce");
				config_cache.initialized_page[pageIndex] = true;
			}
			
			triggerOverwrite(pageName, "initAlways");
		}
		
		function initSlider(){
			gallery = new SwipeView('#' + containerID, { numberOfPages: sv_config.config_pages.length, loop:false, hastyPageFlip:true });
			for (i = 0; i < 3; i++) {
				var page = i == 0 ? sv_config.config_pages.length - 1 : i - 1;
				if (i == 1 && !sv_config.portal) {
					loadPage(gallery.masterPages[i], sv_config.config_pages[page], function(){
						//触发第一个页面的init方法
						execInit(0);
					});
				}
				else {
					loadPage(gallery.masterPages[i], sv_config.config_pages[page]);
				}
			}
		}

		// check config文件是否正确
		function checkConfig(){
			if (!isArray(sv_config.config_pages) || sv_config.config_pages.length == 0)
			{
				return false;
			}
			
			return true;
		}

		// 触发事件
		// fnName : 事件名称
		function triggerEvent(fn){
			if (fn) {
				fn();
				return true;
			}
			
			return false;
		}
		
		// 轮询触发事件，直至触发成功或者10次之后
		// fnName : 事件名称
		function triggerEventPolling(fn, times) {
			times++;
			if (times >= 9) {
				return;
			}
			if (fn) {
				fn();
			}
			else {
				setTimeout(function(){
					triggerEventPolling(fn, times);
				}, 100);
			}
		}
		
		// 触发overwrite事件
		// pageName : 页面名称
		// fnName : 函数名称
		function triggerOverwrite(pageName, fnName) {
			var ov = MySlider.overwrite[pageName];
			if (fnName in ov) {
				ov[fnName]();
				return true;
			}
			
			return false;
		}
		
		// 异步加载页面和页面相关的js
		// masterPage : masterPage
		// page : page对象
		// fn : 回调
		function loadPage(masterPage, page, fn) {
			var mp = $(masterPage);
			$.ajax({
				url : page.url,
				success : function(data) {
					mp.html(data);
					setTimeout(function(){
						if (page.resource && isArray(page.resource.js)) {
							if (fn) {
								require(page.resource.js, fn);
							}
							else {
								require(page.resource.js);
							}
						}
						else {
							if (fn) {
								fn();
							}
						}
					}, 0);
				}
			});
		}
		
		function isArray(obj) {
			return Object.prototype.toString.call(obj) == "[object Array]";
		}
		var isFirstShow;
		var mys = {
			enabled : function(bl) {
				gallery.enabled = bl;
			},
			goToPage : function(p){
				if (!isFirstShow) {
					$("#" + containerID).show();
					$("#" + portalId).hide();
					isFirstShow = true;
				}
				
				gallery.isGoto = true;
				gallery.goToPage(p);
				gallery.isGoto = false;
				MySlider.enabled(true);
			},
			toPortal:function(){
				$("#" + containerID).hide();
				$("#" + portalId).show();
				isFirstShow = false;
			},
			log : function(msg) {
				$("#info").append("<div>" + msg + "</div>");
			},
			removeShade : function(mp) {
				$(mp).find(".swipeview_shade").remove();
			},
			pageIndex : function(){
				return gallery.pageIndex;
			},
			prev : function(){
				return gallery.prev();
			},
			next : function(){
				return gallery.next();
			},
			gobalFlipFn : false,
			iScroll : {
				showScroll : function(model, count, speed){
					if (!MySlider.iScroll.scrollSet[model]) {
						MySlider.iScroll.scrollSet[model] = {};
						MySlider.iScroll.scrollSet[model].flag = [];
						
						// scroll
						var startPoint, endPoint;
						MySlider.iScroll.scrollSet[model].scroll = new iScroll(model+"_content", {
							snap:true,bounceLock:true,bounce:true,useTransform:false,
							onScrollEnd:function(){
								var index=MySlider.iScroll.scrollSet[model].scroll.currPageX;
								window[model+"_tgscrollend"](index);
							},
							onScrollStart : function(that, e) {
								// if (!event) return;
								// if (event.touches) {
									// startPoint = event.touches[0].pageX;
								// }
								// else {
									// startPoint = event.pageX;
								// }
							},
							onBeforeScrollEnd : function(that) {
								// if (!count) count = $("#"+model+"_slider > div").length;
								// if (MySlider.iScroll.scrollSet[model].scroll.currPageX != count - 1) {
									// return;
								// }
								
								// if (event.changedTouches) {
									// endPoint = event.changedTouches[0].pageX;
								// }
								// else {
									// endPoint = event.pageX;
								// }
								
								// if (endPoint < startPoint - 100) {
									// MySlider.iScroll.hideScroll(model);
								// }
							}
						});
					}
					
					MySlider.enabled(false);
					MySlider.iScroll.curScrollModel = model;
					var scroll_content = $("#"+model+"_content");
					scroll_content.css({
						visibility : "visible",
						zIndex : 1
					});
					speed = speed == undefined ? 350 : speed;
					scroll_content.animate({left:0}, speed, null, function(){
						window[model+"_tgscrollend"](0);
					});
				},
				hideScroll : function(model, callback, speed){
					var content = $("#"+model+"_content");
					speed = speed == undefined ? 350 : speed;
					content.animate({left:"-1024px"}, speed, null, function(){
						MySlider.iScroll.scrollSet[model].scroll.destroy();
						setTimeout(function(){
							content.css({
								left : "1024px",
								visibility : "hidden",
								zIndex : -1
							});
							content.find("div").eq(0).empty();
							MySlider.iScroll.scrollSet[model].scroll = null;
							MySlider.iScroll.scrollSet[model] = false;
							MySlider.iScroll.curScrollModel = false;
							
							MySlider.enabled(MySlider.afteriScroll);
							if (!MySlider.afteriScroll) {
								MySlider.afteriScroll = true;
							}
							
							if (callback) {
								callback();
							}
						}, 0);
					});
				},
				scrollSet : {},
				curScrollModel : false,
				setEnabled : function(isEnabled) {
					if (MySlider.iScroll.curScrollModel in MySlider.iScroll.scrollSet) {
						MySlider.iScroll.scrollSet[MySlider.iScroll.curScrollModel].scroll.enabled = isEnabled;
					}
				}
			},
			overwrite : {},
			loadImage : function(src, callback) {
				var img = new Image();
				img.src = src;
				img.onload = callback;
			},
			goback : false,
			gohome : false,
			afteriScroll : true
		};
		for (i = 0; i < sv_config.config_pages.length; i++) {
			mys.overwrite[sv_config.config_pages[i].name] = {};
		}
		
		return mys;
	})("sv_wrapper", "sv_main");
	
	// music();
});

//播放音乐
// var preMusicClass = true;
// function music(){
	// if(preMusicClass){
		// location.href='invoke://sound?action=play&file=/mp3/music.mp3';
		// preMusicClass = false;
	// }else{
		// location.href='invoke://sound?action=pause&file=/mp3/music.mp3';
		// preMusicClass = true;
	// }
// }