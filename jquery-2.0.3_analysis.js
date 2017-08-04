/*!
 * jQuery JavaScript Library v2.0.3
 * http://jquery.com/
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 *
 * Copyright 2005, 2013 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2013-07-03T13:30Z
 */
(function( window, undefined ) {

// Can't do this because several apps including ASP.NET trace
// the stack via arguments.caller.callee and Firefox dies if
// you try to trace through "use strict" call chains. (#13335)
// Support: Firefox 18+
//"use strict";
var
	// A central reference to the root jQuery(document)
    // 根节点jQ对象 rootjQuery = jQuery(document);
	rootjQuery,

	// The deferred used on DOM ready
	readyList,

	// Support: IE9
	// For `typeof xmlNode.method` instead of `xmlNode.method !== undefined`
	core_strundefined = typeof undefined,

	// Use the correct document accordingly with window argument (sandbox)
	location = window.location,
	document = window.document,
	docElem = document.documentElement,

	// Map over jQuery in case of overwrite
	_jQuery = window.jQuery,

	// Map over the $ in case of overwrite
	_$ = window.$,

	// [[Class]] -> type pairs
	class2type = {},

	// List of deleted data cache ids, so we can reuse them
    // 在之前的版本中，这个变量会和数据缓存id有关，
    // 这个版本中仅仅当做一个数组字面量，下面会根据这个数组取数组的方法
	core_deletedIds = [],

	core_version = "2.0.3",

	// Save a reference to some core methods
	core_concat = core_deletedIds.concat,
	core_push = core_deletedIds.push,
	core_slice = core_deletedIds.slice,
	core_indexOf = core_deletedIds.indexOf,
	core_toString = class2type.toString,
	core_hasOwn = class2type.hasOwnProperty,
    // 高级浏览器会定义了这个方法，低级浏览器返回 undefined
	core_trim = core_version.trim,

	// Define a local copy of jQuery
	jQuery = function( selector, context ) {
		// The jQuery object is actually just the init constructor 'enhanced'
		return new jQuery.fn.init( selector, context, rootjQuery );
	},

	// Used for matching numbers
    // source 方法获取正则表达式源文本，这里返回 "[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)" ，类型为 "string"
    // 匹配数组，包括正负号、科学计数法、.开头等多种情况的数字
	core_pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,


    // jQuery 中变量命名有个规律
    // 正则变量名最前面是'r'，函数名最前面是'f'

	// Used for splitting on whitespace
    // 匹配任意不是空白的字符
	core_rnotwhite = /\S+/g,

	// A simple way to check for HTML strings
	// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
	// Strict HTML recognition (#11290: must start with <)

    // 拆开两部分 
    // (?:\s*(<[\w\W]+>)[^>]* 开头，如：' <div id=top></div>'
    // #([\w-]*)) 结尾，如：'#btn'
	rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,

	// Match a standalone tag
    // \1代表第一个()捕获的内容
    // 空标签没有内容可以通过，如：
    // '<div ></div>' 得到  ["<div ></div>", "div", index: 0, input: "<div ></div>"]
    // '<div/>' 得到  ["<div/>", "div", index: 0, input: "<div/>"]
    // 带有属性或者有子节点的字符串，不会通过正则匹配，返回null
    // 如 '<div id="d"></div>'、'<div>text</div>'都匹配不成功
	rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,

	// Matches dashed string for camelizing
    // css 中属性在js中需要转驼峰，会用到这两个正则
    // 如 border-left 转成 borderLeft
    // 对于前缀 -ms- -o- -webkit 等，只有 -ms-比较特殊
    // -o-border-radius 转成 oBorderRadius
    // 但是 -ms- 转化后首字母 M 大写，MsBorderRadius
    // 另外，对于数字，css3 中 -2d 转成 2d，不要中划线（-3d -> 3d）
	rmsPrefix = /^-ms-/,
	rdashAlpha = /-([\da-z])/gi,

	// Used by jQuery.camelCase as callback to replace()
	fcamelCase = function( all, letter ) {
		return letter.toUpperCase();
	},

	// The ready event handler and self cleanup method
    // 页面加载完毕，执行 ready 函数队列，并取消加载监听
	completed = function() {
		document.removeEventListener( "DOMContentLoaded", completed, false );
		window.removeEventListener( "load", completed, false );
		jQuery.ready();
	};

jQuery.fn = jQuery.prototype = {
	// The current version of jQuery being used
	jquery: core_version,

    // 重新指向 jQuery
	constructor: jQuery,



    /*
    selector：选择器
    context：选择范围
    rootjQuery：$(document)
    参数可能为：
    $(null), $(""), $(undefined), $(false)
    $('#id'), $('div'), $('.cls'), $('div + p span > a[title="hi"]')
    $('<li>'), $('<li>1</li><li>2</li>')
    $(this), $(document),$(document.getElementsByTagName('div')[0]),$(document.getElementsByTagName('div'))
    $(function(){})
    $([]), $({})

    */
	init: function( selector, context, rootjQuery ) {
		var match, elem;

		// HANDLE: $(""), $(null), $(undefined), $(false)
		if ( !selector ) {
			return this;
		}

		// Handle HTML strings，选择符是字符串
        /*
        $('#id'), $('div'), $('.cls'), $('div + p span > a[title="hi"]')
        $('<li>'), $('<li>1</li><li>2</li>')
        */
		if ( typeof selector === "string" ) {
            // $('<li>'), $('<li>1</li><li>2</li>')
			if ( selector.charAt(0) === "<" && selector.charAt( selector.length - 1 ) === ">" && selector.length >= 3 ) {
				// Assume that strings that start and end with <> are HTML and skip the regex check
				// 如 match = [null,'<p>',null]
                match = [ null, selector, null ];
			} else {
				match = rquickExpr.exec( selector );
                // 剩下 $('#id'), $('div'), $('.cls'), $('div + p span > a[title="hi"]')
                // 能通过匹配的只有 $('#id')
                // match = ["#id", undefined, "id", index: 0, input: "#id"]
			}

            // 对于 rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/
            // (<[\w\W]+>) 对应 match[1]
            // ([\w-]*) 对应 match[2]
    
            // 如果是dom字符串match[1]会取出完整的dom标签，例如：
            // selector = ' <div id=top></div>'; 得到 match[1] === "<div id=top></div>"
            // selector = ' <div id=top></div>dffdfd'; 得到 match[1] === "<div id=top></div>"
            
            // 如果是#id字符串，会match[2]会取出id，例如：
            // selector = '#test';得到 match[2] === "test"


			// Match html or make sure no context is specified for #id
            // $('<li>'), $('<li>1</li><li>2</li>') 或 $('#id')
			if ( match && (match[1] || !context) ) {

				// HANDLE: $(html) -> $(array)
                // html 片段转成数组
                // $('<li>'), $('<li>1</li><li>2</li>')
                // 创建标签，第二个参数（context）可能是 document（可以省略不写），也可能是 contentDocument（iframe 文档）
				if ( match[1] ) {
                    // $('<a>',document),$('<a>',$(document))
                    // $(document) -> [document, context: document] -> $(document)[0] === document
					// 若 context 不是原生节点，取出其中的原生节点 
                    context = context instanceof jQuery ? context[0] : context;

					// scripts is true for back-compat
                    // 对于HTML来说，documentElement是<html>标签对应的Element对象，
                    // ownerDocument是document对象
                    // jQuery.merge(first, second) 合并第二个参数内容到第一个参数
                    // 不光可以合并数组，如果第一个参数是特殊的对象（具有length属性，并且索引是数字），也是可以的
                    // 如果第一个参数是数组，合并后就是数组；如果第一个参数是对象，合并后就是对象
					// $.merge(['a','b'],['c','d']) -> ["a", "b", "c", "d"]
                    // $.merge({0:'a',length:1},['c','d']) -> {0: "a", 1: "c", 2: "d", length: 3}

                    
                    // jQuery.parseHTML(data, context, keepScripts) 将data字符串
                    // 转换为一组 dom 元素组成的数组，可以插入文档中，例如：
                    // $.parseHTML("hello, <b>my name is</b> jQuery.") 得到 [text, b, text]
                    // $.parseHTML("<a>link</a><b>my name is</b> jQuery.") 得到 [a, b, text]
                    jQuery.merge( this, jQuery.parseHTML(
						match[1],
                        // 默认情况下 ownerDocument 就是 document，也可能是 iframe 的 contentDocument 或 xml 等等
						context && context.nodeType ? context.ownerDocument || context : document,
                        // true 表示保留脚本标签
						true
					) );

					// HANDLE: $(html, props)

                    // \1代表第一个()捕获的内容
                    // 空标签没有内容可以通过，如：
                    // '<div ></div>' 得到  ["<div ></div>", "div", index: 0, input: "<div ></div>"]
                    // '<div/>' 得到  ["<div/>", "div", index: 0, input: "<div/>"]
                    // 带有属性或者有子节点的字符串，不会通过正则匹配，返回null
                    // 如 '<div id="d"></div>'、'<div>text</div>'都匹配不成功
                    // rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/
                    
                    // 如果是单个空标签，并且第二个参数是对象，不光创建标签，还给标签添加属性
                    // 如 $('<li>',{title:'hello',html:'world'})
					if ( rsingleTag.test( match[1] ) && jQuery.isPlainObject( context ) ) {
						for ( match in context ) {
							// Properties of context are called as methods if possible
                            // 例如属性 html 就是一个函数
							if ( jQuery.isFunction( this[ match ] ) ) {
                                // this[html]('world')
								this[ match ]( context[ match ] );

							// ...and otherwise set as attributes
                            // 普通属性，就添加属性
							} else {
								this.attr( match, context[ match ] );
							}
						}
					}

					return this;

				// HANDLE: $(#id)
                // $(#id)
				} else {
					elem = document.getElementById( match[2] );

					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document #6963
                    // 黑莓 4.6 下克隆节点，会出现节点不存在却还是可能通过document.getElementById找到
                    // 双重判断可以避免这个问题
					if ( elem && elem.parentNode ) {
						// Inject the element directly into the jQuery object
						this.length = 1;
						this[0] = elem;
					}

					this.context = document;
					this.selector = selector;
					return this;
				}

			// HANDLE: $(expr, $(...))
            // $('div'), $('.cls'), $('div + p span > a[title="hi"]') 等没有 context 情况
            // 或者 context 是 jQ 对象 $('ul',$(document)) -> $(document).find('ul')
			} else if ( !context || context.jquery ) {
                // document.find( selector )
                // $(document).find( selector )
                // find 会调用 sizzle 这个超级选择器
				return ( context || rootjQuery ).find( selector );

			// HANDLE: $(expr, context)
			// (which is just equivalent to: $(context).find(expr)
            // $('ul',document) -> $(document).find('ul')
			} else {
				return this.constructor( context ).find( selector );
			}

		// HANDLE: $(DOMElement)
        // $(document) 这种，参数是原生节点
        // 节点肯定有 nodeType 属性
		} else if ( selector.nodeType ) {
			this.context = this[0] = selector;
			this.length = 1;
			return this;

		// HANDLE: $(function)
		// Shortcut for document ready
        // $(function(){}) 等同于：
        // $(document).ready(function(){})
		} else if ( jQuery.isFunction( selector ) ) {
			return rootjQuery.ready( selector );
		}

        // $({selector:'div'}) -> [Object, selector: "div", context: undefined]
        // Object 是 参数本身，后边是 this 。jQuery.makeArray( selector, this )
		if ( selector.selector !== undefined ) {
			this.selector = selector.selector;
			this.context = selector.context;
		}
        
        // jQuery.makeArray(['a','b'],{length:0})  -> {0: "a", 1: "b", length: 2}
        // jQuery.makeArray({length:0},['a','b']) -> ["a", "b"]
        // jQuery.makeArray( {selector:'div'}, $()) -> [Object]
        // 前边都各自 return 了，这里是剩下的情况
        // jQuery.makeArray 有时会返回数组，有时会返回对象，视参数而定
		return jQuery.makeArray( selector, this );
	},

	// Start with an empty selector
    // 存储选择字符串
	selector: "",

	// The default length of a jQuery object is 0
    // this 对象的长度
	length: 0,

    // 转数组，原生元素组成的数组
    // $('div') -> { 0: div, 1:div, 2:div, length:3}
    // $('div').toArray() -> [div, div, div]
	toArray: function() {
		return core_slice.call( this );
	},

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
    // 转原生集合
    // $('div').get(0).innerHTML = 'txt';
    // 没有参数，就相当于 toArray，如果有参数，就返回一个原生元素
    // 没有参数就是 undefined == null，参数 null == null
	get: function( num ) {
		return num == null ?

			// Return a 'clean' array
			this.toArray() :

			// Return just the object
			( num < 0 ? this[ this.length + num ] : this[ num ] );
	},

	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
    // JQ 对象的入栈 
    // $('div').pushStack($('span')).css('background','red') -> span背景变红
    // $('div').pushStack($('span')).css('background','red').end().css('background','green') -> span背景变红 div背景变绿
	pushStack: function( elems ) {

		// Build a new jQuery matched element set
        // jQuery.merge( $(), elems )
		var ret = jQuery.merge( this.constructor(), elems );

		// Add the old object onto the stack (as a reference)
		ret.prevObject = this;
		ret.context = this.context;

		// Return the newly-formed element set
		return ret;
	},

	// Execute a callback for every element in the matched set.
	// (You can seed the arguments with an array of args, but this is
	// only used internally.)
    // 遍历集合 
	each: function( callback, args ) {
		return jQuery.each( this, callback, args );
	},

    // DOM 加载的接口
    /*
    $(document).ready(function($){
        // 回调,参数$为jQuery引用
    });
    $(function($){
        // 这是上边那种形式的快捷方式而已
    });
    $("#id").ready(function($){
        // 这种方式跟第一种本质是一样的，
        // 并不是代表 #id 这个节点 ready 的时候触发
    })

    $(document).ready(fn)、$("#id").ready(fn) 等都调用：
    jQuery.ready.promise().done( fn );

    */
	ready: function( fn ) {
		// Add the callback
		jQuery.ready.promise().done( fn );

		return this;
	},

    // 集合的截取
    // $('div').slice(1,3).css('background','green') -> 将第2、3个div背景变绿
	slice: function() {
		return this.pushStack( core_slice.apply( this, arguments ) );
	},


    // 集合的第一项
    // $('div').first().css('background','red')
	first: function() {
		return this.eq( 0 );
	},

    // 集合中最后一项
    // $('div').last().css('background','red')
	last: function() {
		return this.eq( -1 );
	},

    // 集合的指定项
    // $('div').eq(2).css('background','red')
	eq: function( i ) {
		var len = this.length,
        // i < 0  -> j = len + i;
        // i >= 0 -> j = i;
			j = +i + ( i < 0 ? len : 0 );
		return this.pushStack( j >= 0 && j < len ? [ this[j] ] : [] );
	},

    /*
    var arr = ['a','b','c'];
    arr = $.map(arr, function(elem,i){
        return elem + i;
    })
    arr -> ['a1','b2','c3']
    */

	map: function( callback ) {
		return this.pushStack( jQuery.map(this, function( elem, i ) {
			return callback.call( elem, i, elem );
		}));
	},

    // 出栈
	end: function() {
		return this.prevObject || this.constructor(null);
	},

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
    // 这三个方法内部使用，像数组方法，而不是JQ方法
	push: core_push,
	sort: [].sort,
	splice: [].splice
};

// Give the init function the jQuery prototype for later instantiation
jQuery.fn.init.prototype = jQuery.fn;




// 扩展方法
// 当只写一个对象字面量参数的时候，是JQ中扩展插件的形式 
/*
 $.extend({
    f1:function(){},
    f2:function(){}
 })
 */

// 当写多个对象字面量参数的时候，后面的对象都是扩展到第一个对象上
/*
 var a = {};
 $.extend(a, { name : 'hello'}, { age : 30});

 a -> { name : 'hello', age : 30}
 */

// 第一个参数为 true 表示深拷贝，默认是浅拷贝
/*
 var a = {};
 var b = { name : { age : 30 }};
 $.extend(a, b);
 a.name.age = 20; 会导致 b.name.age 也变成20

 如果是深拷贝  $.extend(true, a, b); a 和 b 之间就不会再相互影响了
 */
jQuery.extend = jQuery.fn.extend = function() {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
    // 第一个参数是布尔值，表明是否是深拷贝
    // 第一个参数是布尔值，那目标自然就是第二个参数了
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}

	// Handle case when target is a string or something (possible in deep copy)
    // 如果目标不是对象也不是函数，那么，就强制改成对象 
	if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
		target = {};
	}

	// extend jQuery itself if only one argument is passed
    // 扩展插件情况 （只有一个字面量参数）
    // 如果第一个参数是布尔值，那么另外还有一个对象字面量参数
    // 如果第一个参数就是对象字面量，那么就只有这一个参数
	if ( length === i ) {
		target = this;
		--i;
	}

    // 多个字面量参数的情况，后面的参数都扩展到第一个对象字面量上
	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
        // typeof null === "object" ,所以能到这里，但是，这里还是会过滤掉
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
                // 防止循环引用
                /*
                eg: var a = {};
                    $.extend(a, {name : a});
                 */
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
                // 深拷贝，并且 copy 有值（不为null）,并且 copy 是对象或数组
				if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
                    // copy 是数组
					if ( copyIsArray ) {
						copyIsArray = false;
                        /*
                        var a = { name : { job : 'it'}};
                        var b = { name : { age : 30 }};
                        $.extend(true, a ,b);
                        a -> { name : { job : 'it', age : 30}}
                         */
                        // a 和 b 有同名属性时，不应该时覆盖，而应该是添加
                        // 所以，这里的 src 有值的情况下，不应该被重置为 []
						clone = src && jQuery.isArray(src) ? src : [];

					} else {
						clone = src && jQuery.isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
                    // 递归
					target[ name ] = jQuery.extend( deep, clone, copy );

				// Don't bring in undefined values
                // undefined 值会丢掉
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

// jQ 中用的是拷贝继承，还有类式继承，原型继承等

// 扩展工具方法
jQuery.extend({
	// Unique for each copy of jQuery on the page
    // 生成唯一的JQ字符串（内部） 
    // jQuery20334787237964723 (非数字替换为空)
	expando: "jQuery" + ( core_version + Math.random() ).replace( /\D/g, "" ),

    // 防止冲突
    /*
    ① 先加载 jq 代码，然后重定义 $ 变量
    var jQ = $.noConflict();
    var $ = 123;

    jQ(function(){
        // doSomething
    });

    ② 先定义 $ 变量，jQuery 变量，然后加载 jq 代码
    var $ = 123;
    var jQuery = 456;
    <script src="jquery-2.0.3.js"></script>

    var jQ = $.noConflict();
    jQ(function(){
        // doSomething
    });

    ③ 其实情况 ① 也可以看成是 ②，只不过把引入 jQuery 之前的 $ 和 jQuery 当做 undefined
     */
    

    // deep 为true 才会把 jQuery 变量交给之前定义的 456，否则不给
	noConflict: function( deep ) {
        // 用 script 标签加载 jquery 库后，就会把 jQuery 对象赋给了window.$
        // 所以，加载 jQuery 库后，这里就是 true
		if ( window.$ === jQuery ) {
            // 让出 $ 符，window.$ = 123
			window.$ = _$;
		}

		if ( deep && window.jQuery === jQuery ) {
			window.jQuery = _jQuery;
		}

		return jQuery;
	},

	// Is the DOM ready to be used? Set to true once it occurs.
    // DOM加载是否完成（内部） 
    /*
    ① $(function(){}); 相当于 $(document).ready(function(){});
    DOM 加载完执行这个匿名函数
    （DOM 加载完会触发 DOMContentLoaded 事件）

    $(fn); 
    相当于调用：
    $(document).ready(fn);
    相当于调用：
    $().ready(fn);
    相当于：
    jQuery.ready.promise().done(fn);


    jQuery.ready.promise() 创建了一个延迟对象

    这句会调用 $.ready()

    然后这里会调用 readyList.resolveWith(document,[jQuery]) (已完成，可以触发 fn 了)



    ② window.onload = function(){};
    页面所有资源加载完执行这个匿名函数

    比如 <img src="">
    dom 加载只是插入 img 标签，至于标签的属性不管，而 onload 要等 src 属性指向的图片等资源都加载完。
     */
    
	isReady: false,

	// A counter to track how many items to wait for before
	// the ready event fires. See #6781
    // 等待多少文件的计数器（内部） 
	readyWait: 1,

	// Hold (or release) the ready event
    // 推迟DOM触发 
    /*
    $(fn) 本来等 dom 加载完，这个 fn 函数就会执行
    但是，$.holdReady(true) 会不让 fn 执行

    举例：
    $.getScript('a.js',function(){
    
    });
    $(function(){
        alert(1)
    });

    这样很可能先执行下面的 alert(1)，而不是异步加载的 a.js

    如果我们想 a.js 先执行，那就这么写：

    $.holdReady(true) //锁住

    $.getScript('a.js',function(){
        $.holdReady(false) // 释放
    });
    $(function(){
        alert(1)
    });

    这样就能保证先执行 a.js，后执行 alert(1)

    如果多个文件，那就多次调用 $.holdReady(true) 锁住，然后多次调用$.holdReady(false) 释放
     */
	holdReady: function( hold ) {
		if ( hold ) {
			jQuery.readyWait++;
		} else {
			jQuery.ready( true );
		}
	},

	// Handle when the DOM is ready
    // 准备DOM触发 
    // 这个 ready 是工具方法，$.ready，不是实例方法 $().ready
    /*
    ready 的实参一般为空，即 undefined，
    只有 holdReady 方法中调用时为 true，jQuery.ready( true );
    */
	ready: function( wait ) {

		// Abort if there are pending holds or we're already ready
        // wait 为 true 时，若 jQuery.readyWait 不为 0，说明锁住了没有释放，不继续往下执行；
        // wait 为 false 时，若 jQuery.isReady 为真，说明 dom 已经加载完了，也不继续往下执行
        // jQuery.isReady 默认为 false
        /*
        ①  wait === true 说明，ready 方法被 holdReady 锁住了，这里仅仅解锁一次锁住，
            如果解锁后，发现还是锁住状态，就不能继续往下走了
        ②  wait !== true，一般情况下都是这样。如果 isReady 是 true，返回；
        ③  wait !== true，isReady 是 false，往下走
        */
		if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
			return;
		}

		// Remember that the DOM is ready
        //  标记 dom 已经加载完
		jQuery.isReady = true;

		// If a normal DOM Ready event fired, decrement, and wait if need be
        // ③  wait !== true，isReady 是 false，往下走，走到这发现 jQuery.readyWait 大于 0，还是得返回
        // 归根结底，一定要等到 jQuery.readyWait 为 0 才能继续往下走，触发回调方法队列
		if ( wait !== true && --jQuery.readyWait > 0 ) {
			return;
		}

		// If there are functions bound, to execute
        /* 
        这句使得待执行的回调函数的 this 指向 document，第一个实参指向 jQuery 
        例如：
        $(function(arg){
            console.log(this);  // document
            console.log(arg);   // jQuery
        });
        */
        // 触发回调队列
		readyList.resolveWith( document, [ jQuery ] );

		// Trigger any bound ready events
        /*
        针对这种写法：
        $(document).on('ready',function(){
            // code
        })

        从这也可以看出两种绑定方式的执行顺序：
        
        ① $(document).on('ready',fn2);
        ② $(document).ready(fn1);

        fn1 会比 fn2 先触发
         */
		if ( jQuery.fn.trigger ) {
			jQuery( document ).trigger("ready").off("ready");
		}
	},


    /*
    总结一下：
    jQuery 中等 dom 加载完触发函数有三种方法：
    ① $(fn);
    ② $(document).ready(fn)
    ③ $(document).on('ready',fn)
     */

	// See test/unit/core.js for details concerning isFunction.
	// Since version 1.3, DOM methods and functions like alert
	// aren't supported. They return false on IE (#2968).
    /*
    ie 下，有些函数不一定会返回 true，如 alert
    typeof alert  
    // 在 ie 下返回 'object'，而不是 'function'
     */ 
    // 是否为函数，这个方法不能判断所有的函数，比如 alert，要想准备判断所有函数，可以根据以上注释(#2968)去 jQuery 官网查找
	isFunction: function( obj ) {
		return jQuery.type(obj) === "function";
	},

    // 是否为数组，jQuery 2.0.3 支持 ie8 以上浏览器，原生有 Array.isArray 方法
    // 原生方法效率高，所以原生尽量用原生的方法
	isArray: Array.isArray,

    // 是否为 window
    /*
    这样写不是很严谨：
    举例：
    var a = {};
    a.window = a;
    console.log(a === a.window); // true

    当然了，也不能说 jQuery 这种写法不对，毕竟 jQuery 没有说这里是判断严格意义上的 window，满足日常需要就行了
     */
	isWindow: function( obj ) {
        // obj 不是 undefined ，也不是 null
		return obj != null && obj === obj.window;
	},

    // 是否为数字
	isNumeric: function( obj ) {
        // typeof 123 -> "number"
        // typeof NaN -> "number"
        // parseFloat(null) -> NaN
        // parseFloat(NaN) -> NaN
        // 不为 NaN，并且有限
        /*
        isFinite(123)  // true
        isFinite(Number.MAX_VALUE)  // true
        isFinite(Number.MAX_VALUE + Number.MAX_VALUE)  // 超出最大范围了，false
         
        Number.MAX_VALUE -> 1.7976931348623157e+308
        Number.MAX_VALUE +1 -> 1.7976931348623157e+308

        Number.MAX_VALUE + Number.MAX_VALUE -> Infinity
         */
        
		return !isNaN( parseFloat(obj) ) && isFinite( obj );
	},

    // 判断数据类型
	type: function( obj ) {
        // $.type(undefined) -> 'undefined'
        // $.type(null) -> 'null'
		if ( obj == null ) {
			return String( obj );
		}
        // core_toString = {}.toString
        // {}.toString === Object.prototype.toString
		// Support: Safari <= 5.1 (functionish RegExp)
        // Safari <= 5.1 typeof 正则变量会返回 "function"，后来都修正为 "object"
		return typeof obj === "object" || typeof obj === "function" ?
			class2type[ core_toString.call(obj) ] || "object" :
			typeof obj;

        /*
        jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
            class2type[ "[object " + name + "]" ] = name.toLowerCase();
        });

        $.type([]) -> class2type[ core_toString.call(obj) ] -> class2type['object Array'] -> 'array'
        $.type(Date) -> 'date'
         */
	},

    // 是否为对象字面量
    /*
    var obj = {};
    $.isPlainObject(obj) // true

    var obj = {name : 'hello'};
    $.isPlainObject(obj) // true

    var obj = new Object();
    $.isPlainObject(obj) // true
     */
    }
	isPlainObject: function( obj ) {
		// Not plain objects:
		// - Any object or value whose internal [[Class]] property is not "[object Object]"
		// - DOM nodes
		// - window
        // 非 "object" ,DOM 节点, window 排除
		if ( jQuery.type( obj ) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
			return false;
		}

		// Support: Firefox <20
		// The try/catch suppresses exceptions thrown when attempting to access
		// the "constructor" property of certain host objects, ie. |window.location|
		// https://bugzilla.mozilla.org/show_bug.cgi?id=814622
        /*
        core_hasOwn = {}.hasOwnProperty
         */ 
        // try catch 为了兼容 Firefox <20 的bug，会报错，返回 false
		try {
			if ( obj.constructor &&
					!core_hasOwn.call( obj.constructor.prototype, "isPrototypeOf" ) ) {
                // !{}.hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf")
                // Object.prototype 才有属性 "isPrototypeOf"
                // 其他的对象都是继承它
				return false;
			}
		} catch ( e ) {
			return false;
		}

		// If the function hasn't returned already, we're confident that
		// |obj| is a plain object, created by {} or constructed with new Object
		return true;
	},

    // 是否为空对象
    /*
    isEmptyObject({name:'hello'})  // 有可枚举属性 false

    isEmptyObject({})  // 没可枚举属性 true
    isEmptyObject([])  // 没可枚举属性 true
     */
	isEmptyObject: function( obj ) {
		var name;
        // for in 只能找到可枚举的属性(不管是自身的还是继承的)
		for ( name in obj ) {
			return false;
		}
		return true;
	},

    // 抛出异常
	error: function( msg ) {
		throw new Error( msg );
	},

	// data: string of html
	// context (optional): If specified, the fragment will be created in this context, defaults to document
	// keepScripts (optional): If true, will include scripts passed in the html string
	// data：html 字符串
    // context：可选，fragment 会在 context 里创建，如果没有指定 context，默认是 document
    // keepScripts：可选，如果为 true，就会包含 data 中的脚本
    // 解析节点
    /*
    var str = '<li></li><li></li>';
    $.parseHTML(str) -> [li, li]

    var str = '<li></li><li></li><script></script>';
    $.parseHTML(str, document, false) -> [li, li] 第三个参数为 false ,不会存 script 标签

    var str = '<li></li><li></li><script></script>';
    $.parseHTML(str, document, true) -> [li, li, script] 第三个参数为 true ,会存 script 标签
    

    如果单标签 $('<li>') 或者 $('<li></li>') -> $.parseHTML() -> context.createElement( parsed[1] )
    如果多标签 $('<li></li><li></li>') -> $.parseHTML() -> jQuery.buildFragment( [ data ], context, scripts )
     */
    parseHTML: function( data, context, keepScripts ) {
        // 不是【字符串】或者【空字符串】就返回
		if ( !data || typeof data !== "string" ) {
			return null;
		}
        // 如果第二个参数为布尔值，没有执行上下文
		if ( typeof context === "boolean" ) {
			keepScripts = context;
			context = false;
		}
		context = context || document;
        
        // rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/
        // eg：rsingleTag.exec('<div></div>')
        // 结果：["<div></div>", "div", index: 0, input: "<div></div>"]
        // rsingleTag 匹配不带任何属性且没有任何子节点的html结构
        // 单个标签
		var parsed = rsingleTag.exec( data ),
			scripts = !keepScripts && [];

		// Single tag
        // 如果匹配到了空的元素标签，比如div，则创建一个div元素，函数结束
		if ( parsed ) {
			return [ context.createElement( parsed[1] ) ];
		}

        // 没有匹配到空的元素标签（比较复杂的html片段），把传入的data转为文档碎片，存储在jQuery.fragments这个对象里
		// 通过 buildFragment 方法创建一个新的div元素，传入的data会作为这个div的innerHTML
        // 不过，这里不会完全复制data，会进行一些必要的过滤
        //（如，过滤掉 html/title/head 等标签）和闭合没有闭合的标签等操作（如 <span /> 变成 <span ></span>）
        parsed = jQuery.buildFragment( [ data ], context, scripts );

        /*
        如果 keepScripts 为 true，那 scripts 就是 false，那 scripts 就不会被删除
        如果 keepScripts 为 false，那 scripts 就是 []，scripts 会被删除
         */
		if ( scripts ) {
			jQuery( scripts ).remove();
		}

        // 转成数组
		return jQuery.merge( [], parsed.childNodes );
	},

    // 解析JSON，字符串转成真正的 json
    /*
    eg:
    var str = '{"name":"hello"}'; // 严格模式的json字符串
    var obj = $.parseJSON(str);  // 转成json结构
     */
	parseJSON: JSON.parse,  // ie8 以上版本支持

    // JSON.stringify() 把 json 转成字符串 

	// Cross-browser xml parsing
    // 解析XML 
    /*
    <p id="someElement"></p>
    <p id="anotherElement"></p>
     
    <script>
    var xml = "<rss version='2.0'><channel><title>RSS Title</title></channel></rss>",
      xmlDoc = $.parseXML( xml ),
      $xml = $( xmlDoc ),
      $title = $xml.find( "title" );
     
    // Append "RSS Title" to #someElement
    $( "#someElement" ).append( $title.text() );
     
    // Change the title to "XML Title"
    $title.text( "XML Title" );
     
    // Append "XML Title" to #anotherElement
    $( "#anotherElement" ).append( $title.text() );
    </script>
     */
	parseXML: function( data ) {
		var xml, tmp;
        // 必须是字符串，并且有内容
		if ( !data || typeof data !== "string" ) {
			return null;
		}

		// Support: IE9
		try {
			tmp = new DOMParser(); // ie8 以上支持
			xml = tmp.parseFromString( data , "text/xml" ); // 得到XML文档对象
		} catch ( e ) {
			xml = undefined;
		}
        // 如果字符串不是完整的XML，比如标签没闭合，或不是 xml 格式，ie9 下会报错（其他浏览器不报错，但是会有 parsererror 节点）

		if ( !xml || xml.getElementsByTagName( "parsererror" ).length ) {
			jQuery.error( "Invalid XML: " + data );
		}
		return xml;
	},

    // 空函数
	noop: function() {},

	// Evaluates a script in a global context
    // 全局解析js 
    /*
    function test() {
      jQuery.globalEval( "var newVar = true;" )
    }
    test();
    // newVar === true  全局变量
     */
    // 参数 code 是字符串
	globalEval: function( code ) {
		var script,
				indirect = eval;

		code = jQuery.trim( code );

		if ( code ) {
			// If the code includes a valid, prologue position
			// strict mode pragma, execute code by injecting a
			// script tag into the document.
            // 严格模式下不支持 eval
			if ( code.indexOf("use strict") === 1 ) {
				script = document.createElement("script");
				script.text = code;
				document.head.appendChild( script ).parentNode.removeChild( script );
            // 一般情况查下 eval
            /*
            ① 在函数里打印 a
            function test(){
                eval('var a = 1');
                cosnsole.log(a)
            }
            test(); // 1

            ② 在函数外打印 a
            function test(){
                eval('var a = 1');
            }
            test(); 
            cosnsole.log(a) // 报错，找不到 a
            
            ③ eval 换成 window.eval 就可以找到了
            function test(){
                window.eval('var a = 1');
            }
            test(); 
            cosnsole.log(a) // 1，找到了 a

            ④ 把 eval 赋值给一个变量，也可以找到 a
            function test(){
                var val = eval;    
                // 相当于 val = window.eval;
                val('var a = 1');
            }
            test(); 
            cosnsole.log(a) // 1，找到了 a

            为什么会这样？
            （1）eval() 在函数里执行代码就只函数里起作用，在全局执行就可以全局范围起作用；
            （2）如果这个方法由 window 对象来驱动，无论函数里还是全局环境执行，代码都在全局范围里起作用。
             */
			} else {
			// Otherwise, avoid the DOM node creation, insertion
			// and removal by using an indirect global eval
            // 这里不能直接写 eval(code)，否在 code 只会在局部起作用
				indirect( code );
			}
		}
	},

	// Convert dashed to camelCase; used by the css and data modules
	// Microsoft forgot to hump their vendor prefix (#9572)
    // 转驼峰 
    /*
    一般都是这样：
    margin-top -> marginTop
    -moz-transform -> MozTransform
    -webkit-transform -> WebkitTransform

    ie 的前缀 -ms- 是个例外(第一个字母要小写)，得单独处理：
    -ms-transform -> msTransform

    rmsPrefix = /^-ms-/,
    rdashAlpha = /-([\da-z])/gi

    // 把第一个小括号匹配的内容转化成大写，即中划线-后的第一个字母转成大写
    fcamelCase = function( all, letter ) {
        return letter.toUpperCase();
    },
     */
	camelCase: function( string ) {
		return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
	},

    /*
    $.nodeName(document.documentElement, 'html') // true
     */
    // 是否为指定节点名（内部）
	nodeName: function( elem, name ) {
		return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
	},

	
    // 遍历集合 
    /*
    var arr = ['a','b','c','d'];
    $.each(arr, function(i, value){
        // i 是索引 0，1，2 ...
        // value 是元素 'a','b','c' ...
    });

    var json = ['name','hello','age',20];
    $.each(arr, function(i, value){
        // i 是 key 'name', 'age' ...
        // value 是元素 'hello', 20 ...
    });
     */
    // args is for internal usage only 
    // 第三个参数仅供内部使用
	each: function( obj, callback, args ) {
		var value,
			i = 0,
			length = obj.length,
			isArray = isArraylike( obj ); // 是否是类数组，包括数组（jq对象也是类数组，有length，并且数组下标）

        // 内部使用
		if ( args ) {
            // 数组、类数组用 for 循环
			if ( isArray ) {
				for ( ; i < length; i++ ) {
                    // callback 里的 this 指向 obj[ i ]，参数固定为 args
					value = callback.apply( obj[ i ], args );
                    /*
                    举个例子：
                    var bd = $('body');
                    
                    console.log(bd) 
                    // [body, prevObject: init(1), context: document, selector: "body"]

                    console.log(bd.length)
                    // 1

                    所以，这里的 value = callback.apply( obj[ i ], args )
                    其实就是 value = callback.apply( body, args )

                    如果选取多个元素，比如 $('p') 就是这种：
                    var ps = $('p');

                    console.log(ps) 
                    // [p, p, prevObject: init(1), context: document, selector: "p"]
                    
                    console.log(ps.length)
                    // 2
                    
                    那就对每个 p 元素执行 callback 方法

                    */

					if ( value === false ) {
						break;
					}
				}
            // json 对象用 for in 循环
			} else {
				for ( i in obj ) {
					value = callback.apply( obj[ i ], args );

					if ( value === false ) {
						break;
					}
				}
			}

		// A special, fast, case for the most common use of each
        // 一般使用
		} else {
            // 数组，类数组用 for 循环
			if ( isArray ) {
				for ( ; i < length; i++ ) {
                    // callback 里的 this 指向 obj[ i ]，第一二个参数分别为 i, obj[ i ]
					value = callback.call( obj[ i ], i, obj[ i ] );

                    // 如果回调函数执行过程中返回了 false，就不会再往下循环了
                    /*
                    eg:
                    $.each(arr, function(i, value){
                        // i 是 key 'name', 'age' ...
                        // value 是元素 'hello', 20 ...
                        // code
                        return false;
                    });
                    因为这里返回值是 false，所以不会循环 length 那么多次，执行 1 次就终止循环了
                     */
					if ( value === false ) {
						break;
					}
				}
            // json 对象用 for in 循环
			} else {
				for ( i in obj ) {
					value = callback.call( obj[ i ], i, obj[ i ] );

					if ( value === false ) {
						break;
					}
				}
			}
		}

		return obj;
	},

    // 去掉前后空格
    /*
    var str = '  hello '
    str = $.trim(str);
    // 'hello'
     */
	trim: function( text ) {
        // undefined null -> ""
        // core_trim = core_version.trim
        // 用原生的 trim 方法
		return text == null ? "" : core_trim.call( text );
	},

	
    // 类数组转真数组 
    /*
    ① 参数为类数组
    var divs = document.getElementsByTagName('div');
    $.makeArray(divs);
    // [div, div, div]

    ② 参数为字符串、数字等基本类型也可以转
    var str = "hello";
    $.makeArray(str);
    // ["hello"]

    ③ 如果布置一个参数，就是内部使用
    var str = 123;
    $.makeArray(str, {length:0});
    // { 0:123, length:1 }
     */
    
    // results is for internal usage only
    // 第二个参数仅供内部使用，为带 length 属性的特殊对象
	makeArray: function( arr, results ) {
		var ret = results || [];

        // 不为 null，不为 undefined
		if ( arr != null ) {
            // isArraylike 参数只能是对象，如 Object(123) 转成包装对象，不是类数组，然后走到 else
            // 字符串 "hi" 具有 length 属性，Object('hi') {0: "h", 1: "i", length: 2, [[PrimitiveValue]]: "hi"}
			if ( isArraylike( Object(arr) ) ) {
				jQuery.merge( ret,
					typeof arr === "string" ?
					[ arr ] : arr
				);
            // Object(123) {[[PrimitiveValue]]: 123} 走这里
			} else {
                // core_push = [].push
				core_push.call( ret, arr );
			}
		}

		return ret;
	},

    // 数组版 indexOf
    /*
    var arr = ['a','b','c','d'];
    $.inArray('b', arr);
    // 1

    $.inArray('z', arr);
    // -1
     */
	inArray: function( elem, arr, i ) {
        // core_indexOf = [].indexOf 原生的数组方法, i 表示查找起始位置，可选
		return arr == null ? -1 : core_indexOf.call( arr, elem, i );
	},

    // 第二个类数组的元素合并进第一个类数组
	merge: function( first, second ) {
		var l = second.length,
			i = first.length,
			j = 0;

        // l 是数字时，可以根据 l 来遍历数组 second
		if ( typeof l === "number" ) {
			for ( ; j < l; j++ ) {
				first[ i++ ] = second[ j ];
			}
        // l 不是数字时，那就根据让索引 j++ 来遍历 second
		} else {
			while ( second[j] !== undefined ) {
				first[ i++ ] = second[ j++ ];
			}
		}

        // 循环结束，重置 length 属性
		first.length = i;

		return first;
	},

    // 过滤得到新数组
    /*
    ① 传 2 个参数：
    var arr = [1, 2, 3, 4];
    arr = $.grep( arr, function(value, i){
        // value 为元素
        // i 为索引或key
        return value > 2;
    });

    arr // [3, 4]

    ② 传 3 个参数：
    var arr = [1, 2, 3, 4];
    arr = $.grep( arr, function(value, i){
        // value 为元素
        // i 为索引或key
        return value > 2;
    }, true);

    arr // [1, 2] 和上面得到相反的结果
     */
	grep: function( elems, callback, inv ) {
		var retVal,
			ret = [],
			i = 0,
			length = elems.length;
        // 强制把第三个参数转成布尔值
		inv = !!inv;

		// Go through the array, only saving the items
		// that pass the validator function
		for ( ; i < length; i++ ) {
            // 函数执行结果强制转成布尔值
            // 如果 inv 为真，retVal 需要为假，才会把相应元素存进去
            // 如果 inv 为假，retVal 需要为真，才会把相应元素存进去
			retVal = !!callback( elems[ i ], i );
			if ( inv !== retVal ) {
				ret.push( elems[ i ] );
			}
		}

		return ret;
	},

    // 映射新数组
    /*
    var arr = [1,2,3,4];
    arr = $.map(arr , function(n){
        return n + 1;
    });
    arr // [2,3,4,5]
     */ 
    
    // arg is for internal usage only
    // 平时我们只用2个参数，第三个参数仅供内容使用
	map: function( elems, callback, arg ) {
		var value,
			i = 0,
			length = elems.length,
			isArray = isArraylike( elems ),
			ret = [];

		// Go through the array, translating each of the items to their
        // 类数组用 for 循环
		if ( isArray ) {
			for ( ; i < length; i++ ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret[ ret.length ] = value;
				}
			}

		// Go through every key on the object,
        // 其他用 for in 循环
		} else {
			for ( i in elems ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret[ ret.length ] = value;
				}
			}
		}

		// Flatten any nested arrays
        /*
        之所以不直接返回 ret，是为了避免多维数组的情况
        eg:
        var arr = [1,2,3,4];
        arr = $.map(arr , function(n){
            return [n + 1];
        });
        arr // 还是 [2,3,4,5]，怎么做到的

        [1].concat([[2]])
        // [1,[2]]

		[].concat.apply([],[[2]])
		// [2]

        apply 方法的第二个参数为数组，实际用的时候回拆开成单个的元素，所以就避免了二维数组的情况
         */
		return core_concat.apply( [], ret );
	},

	// A global GUID counter for objects
    // 唯一标识符（内部） 
    /*
    <input type="buttom" value="点击">
    <input type="buttom" value="取消绑定">

    function show(){
        console.log(this)
    }
    $('input:eq(0)').click(show); // 打印"点击"按钮

    // 第二个按钮点击后取消第一个按钮绑定的事件
    $('input:eq(0)').click(function(){
        $('input:eq(0)').off();
    });
     */
    }
	guid: 1,

	// Bind a function to a context, optionally partially applying any
	// arguments.
    // 改 this 指向 
    /*
    ① 函数不带参数
    function show(){
        return this;
    }

    shwo(); // window

    $.proxy(show,document)();  // document

    ② 函数带参数
    function show(n1,n2){
        console.log(n1,n2);
        return this;
    }

    $.proxy(show,document,3,4)();
    $.proxy(show,document)(3,4);
    $.proxy(show,document,3)(4);
    // 这三种方式都会打印 3，4，并返回 document
     */
	proxy: function( fn, context ) {
		var tmp, args, proxy;

        /*
        var obj = {
            show : function(){
                console.log(this);
            }
        };
        $(document).click( obj.show ); // document
        $(document).click( $.proxy(obj.show, obj) ); // obj
        $(document).click( $.proxy(obj, 'show') );   // obj
         */
        
        /*
        $.proxy(obj, 'show') 这种形式：

        context = obj;   // 即 this 对象指向第一个参数
        fn = obj['show'] // 待执行函数

        相当于： $.proxy(obj['show'], obj)
         */
		if ( typeof context === "string" ) {
			tmp = fn[ context ];
			context = fn;
			fn = tmp;
		}

		// Quick check to determine if target is callable, in the spec
		// this throws a TypeError, but we will just return undefined.
		// 确保 fn 是函数
        if ( !jQuery.isFunction( fn ) ) {
			return undefined;
		}

		// Simulated bind
        // 这种写法类似于 bind，除去前两个参数，其他的多余的参数和返回的新函数 f 的实参合并在一起，作为 f 的实参
		args = core_slice.call( arguments, 2 );
		proxy = function() {
			return fn.apply( context || this, args.concat( core_slice.call( arguments ) ) );
		};

		// Set the guid of unique handler to the same of original handler, so it can be removed
		// 如果 fn.guid 存在，那么 fn.guid 赋值给 proxy.guid；
        // 如果 fn.guid 不存在，那么 jQuery.guid++，并赋值给 fn.guid 和 proxy.guid
        proxy.guid = fn.guid = fn.guid || jQuery.guid++;

		return proxy;
	},

	// Multifunctional method to get and set values of a collection
	// The value/s can optionally be executed if it's a function
    /*
	access 方法作用：set/get 属性值，被 css、attr、text 等方法调用完成不同的具体功能

	以 attr 方法为例：
	attr: function( name, value ) {
		return jQuery.access( this, jQuery.attr, name, value, arguments.length > 1 );
	}
	① elems 指 jquery 实例对象，如 this
	② fn 指函数，如 jQuery.attr
	③ key 指属性名，如 title
	④ value 指属性值，如 'str'
	⑤ chainable 是否链式执行。
	   a. true 表示 set 属性，返回当前对象，需要链式执行
	   b. false 表示 get 属性，一般返回字符串，数字等基本类型，不能链式执行
	⑥ emptyGet, raw 等没传的参数都是 undefined
     */
    access: function( elems, fn, key, value, chainable, emptyGet, raw ) {
		var i = 0,
			length = elems.length,
			bulk = key == null;
            /*
             key 为 undefined 或 null ,bulk 为 true;
             其他情况，bulk 为 false;
            */
            

		// Sets many values
        // $('#div1').css({'background':'green',width:'300px'}) 这种
		if ( jQuery.type( key ) === "object" ) {
            // 多组值，必定是设置
			chainable = true;
            // 递归
			for ( i in key ) {
				jQuery.access( elems, fn, i, key[i], true, emptyGet, raw );
			}

		// Sets one value
        // 有 value，也是设置
		} else if ( value !== undefined ) {
            // 手动标识设置
			chainable = true;

            // value 不是函数的时候，比如字符串 'green'，raw 为 true;
			if ( !jQuery.isFunction( value ) ) {
				raw = true;
			}

            // 没有指定 key 的时候
			if ( bulk ) {
				// Bulk operations run against the entire set
				/*
				① value 不是函数的时候，raw 强制为 true
				② value 是函数的时候，如果 raw 本来就是【真】，也走这里
				*/
				if ( raw ) {
					fn.call( elems, value );
					fn = null;

				// ...except when executing function values
                // value 是函数，并且 raw 原本不为真 ，修正 fn
				} else {
					bulk = fn;
					fn = function( elem, key, value ) {
						return bulk.call( jQuery( elem ), value );
					};
				}
			}

            /*
			fn 为真，说明：
			① 指定了 key 值，fn 还是传入的 fn
			② fn 是修正后的，因为原来的 fn = null
			*/
			if ( fn ) {
				for ( ; i < length; i++ ) {
                    /*
					① raw 为【真】，并且 fn 不为【假】，说明 bulk 为【假】，也就是有 key 值
					② raw 为【假】，说明 value 一定是函数，要不然会被强制改成【真】的
					③ fn( elems[i], key, value.call( elems[i], i, fn( elems[i], key ) ) );
					   value 方法会调用 fn 方法，fn 方法又会调用 value 方法，看起来好像会死循环，其实并不会
					   a. 首先执行 fn( elems[i], key )
					      -> tmp = bulk.call( jQuery( elems[i] ), undefined )
					   b. 然后 tmp = value.call( elems[i], i, tmp )
					   c. 最后 fn( elems[i], key, tmp )
					      -> bulk.call( jQuery( elems[i] ), tmp ) 
                    */
					fn( elems[i], key, raw ? value : value.call( elems[i], i, fn( elems[i], key ) ) );
				}
			}
		}

        // chainable 为真，说明是设置，返回修改好的元素
        // 获取的时候：
        // 如果没有key值，fn.call( elems )
        // 如果有key值，并且有元素，在第一个元素上获取，否则返回 emptyGet（undefined）
		/*
		① chainable 为【真】，说明是设置，前面已经用 fn 处理过了 elems，这里直接返回 elems 就好了
		② chainable 为【假】
		   a. bulk 为【真】，说明是没有 key 值，执行 fn.call( elems )
		   b. bulk 为【假】，说明有 key 值
		      如果当前 jQuery 对象有长度，第一个元素上执行 fn( elems[0], key )
			  如果当前 jQuery 对象没有长度，返回 emptyGet
		*/
		return chainable ?
			elems :

			// Gets
			bulk ?
				fn.call( elems ) :
				length ? fn( elems[0], key ) : emptyGet;
	},

    // 当前时间
    // 1499526895632
    // +new Date() === Date.now()  // true
    // (new Date()).getTime() === Date.now()  // true
	now: Date.now,

	// A method for quickly swapping in/out CSS properties to get correct calculations.
	// Note: this method belongs to the css module but it's needed here for the support module.
	// If support gets modularized, this method should be moved back to the css module.
    // css 交换 
    /*
    <div id="div1" style="width:100px;height:100px;background:red">aaa</div>
    
    ① $('#div1').width() // 100

    还可以这样获取：
    ② $('#div1').get(0).offsetWidth  // 100

    不过，当把这个 div 隐藏（display:none）后，① 还是可以得到 100，而 ② 只能得到 0
    
    思路：
    把 display:none 改成 display:block，可是这样不就可以看见元素了，
    那就再加上 visibility:hidden，可是这样虽然看不见，但还是占据留白空间，
    那就再加上 position:absolute

    获取到值后，再把样式改回去
     */
	swap: function( elem, options, callback, args ) {
		var ret, name,
			old = {};

		// Remember the old values, and insert the new ones
		for ( name in options ) {
            // 原来的属性先存起来
			old[ name ] = elem.style[ name ];
            // 用新的属性
			elem.style[ name ] = options[ name ];
		}

        // 进行获取属性等操作
		ret = callback.apply( elem, args || [] );

		// Revert the old values
        // 恢复原来的属性
		for ( name in options ) {
			elem.style[ name ] = old[ name ];
		}

		return ret;
	}
});

jQuery.ready.promise = function( obj ) {
    // 第一次执行这个函数的时候 readyList 这个全局变量是 undefined，所以可以继续往下走
	if ( !readyList ) {

		readyList = jQuery.Deferred();

		// Catch cases where $(document).ready() is called after the browser event has already occurred.
		// we once tried to use readyState "interactive" here, but it caused issues like the one
		// discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15
        // dom 已经加载好了
		if ( document.readyState === "complete" ) {
			// Handle it asynchronously to allow scripts the opportunity to delay ready
            // 这个延迟是兼容 ie 的
			setTimeout( jQuery.ready );
        // dom 没有加载完
		} else {

			// Use the handy event callback
            /*
            completed = function() {
                document.removeEventListener( "DOMContentLoaded", completed, false );
                window.removeEventListener( "load", completed, false );
                jQuery.ready();
            };
             */
            
      
            // 下面两个事件哪一个先触发都行
            
            // 正常情况下，只要监听 DOMContentLoaded 事件就好了
			document.addEventListener( "DOMContentLoaded", completed, false );

			// A fallback to window.onload, that will always work
            // 有的浏览器会缓存事件，可能会先触发 load
			window.addEventListener( "load", completed, false );
		}
	}
	return readyList.promise( obj );
};

// Populate the class2type map
jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
});

// 数组，类数组都返回 true
function isArraylike( obj ) {
	var length = obj.length,
		type = jQuery.type( obj );

    // window 可能会影响下面的判断，所以先过滤之
	if ( jQuery.isWindow( obj ) ) {
		return false;
	}

    // 什么变量有 nodeType 属性，还有 length 属性不为空呢?
	if ( obj.nodeType === 1 && length ) {
		return true;
	}

    // 真数组返回 true
    // 带 length 属性的函数不算
	return type === "array" || type !== "function" &&
		( length === 0 ||
		typeof length === "number" && length > 0 && ( length - 1 ) in obj );

        // ( length === 0 || typeof length === "number" && length > 0 && ( length - 1 ) in obj );
        // 本来想简写为：typeof length === "number" && length >= 0 && ( length - 1 ) in obj )
        // 只不过，0 - 1，-1 in obj 不满足，所以，这里得单独把 length === 0 拿出来
}

// All jQuery objects should point back to these
rootjQuery = jQuery(document);
/*!
 * Sizzle CSS Selector Engine v1.9.4-pre
 * http://sizzlejs.com/
 *
 * Copyright 2013 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2013-06-03
 */
(function( window, undefined ) {

var i,
	support,
	cachedruns,
	Expr,
	getText,
	isXML,
	compile,
	outermostContext,
	sortInput,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsHTML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,

	// Instance-specific data
	expando = "sizzle" + -(new Date()),
	preferredDoc = window.document,
	dirruns = 0,
	done = 0,
	classCache = createCache(),
    // 词法分析需要的缓存器
    // 可以 tokenCache(key,value) 方式存储键值对
	tokenCache = createCache(),
	compilerCache = createCache(),
	hasDuplicate = false,
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}
		return 0;
	},

	// General-purpose constants
	strundefined = typeof undefined,
	MAX_NEGATIVE = 1 << 31,

	// Instance methods
	hasOwn = ({}).hasOwnProperty,
	arr = [],
	pop = arr.pop,
	push_native = arr.push,
	push = arr.push,
	slice = arr.slice,
	// Use a stripped-down indexOf if we can't use a native one
	indexOf = arr.indexOf || function( elem ) {
		var i = 0,
			len = this.length;
		for ( ; i < len; i++ ) {
			if ( this[i] === elem ) {
				return i;
			}
		}
		return -1;
	},

	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

	// Regular expressions

	// Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
	// \x20 空格 \t 制表符  \r 回车  \n 换行 \f 换页
    // 难道不应该是 "[\x20\t\r\n\f]" 吗？
    // 确实！"[\\x20\\t\\r\\n\\f]" 就是指字符串 "[\x20\t\r\n\f]"
    // 但是，如果直接写 "[\x20\t\r\n\f]"，就会以空格，回车，换行等符号显示了，这不是我们想要的
    // '\\' 显示就是 '\'
    // 以下代表“空白符”
    whitespace = "[\\x20\\t\\r\\n\\f]",
	// http://www.w3.org/TR/css3-syntax/#characters
	characterEncoding = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",

	// Loosely modeled on CSS identifier characters
	// An unquoted value should be a CSS identifier http://www.w3.org/TR/css3-selectors/#attribute-selectors
	// Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = characterEncoding.replace( "w", "w#" ),

	// Acceptable operators http://www.w3.org/TR/selectors/#attribute-selectors
	attributes = "\\[" + whitespace + "*(" + characterEncoding + ")" + whitespace +
		"*(?:([*^$|!~]?=)" + whitespace + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + identifier + ")|)|)" + whitespace + "*\\]",

	// Prefer arguments quoted,
	//   then not containing pseudos/brackets,
	//   then attribute selectors/non-parenthetical expressions,
	//   then anything else
	// These preferences are here to reduce the number of selectors
	//   needing tokenize in the PSEUDO preFilter
	pseudos = ":(" + characterEncoding + ")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|" + attributes.replace( 3, 8 ) + ")*)|.*)\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

    // /^[\x20\t\r\n\f]*,[\x20\t\r\n\f]*/
	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

	rsibling = new RegExp( whitespace + "*[+~]" ),
	rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*)" + whitespace + "*\\]", "g" ),

	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + characterEncoding + ")" ),
		"CLASS": new RegExp( "^\\.(" + characterEncoding + ")" ),
		"TAG": new RegExp( "^(" + characterEncoding.replace( "w", "w*" ) + ")" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rnative = /^[^{]+\{\s*\[native \w/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rescape = /'|\\/g,

	// CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
	funescape = function( _, escaped, escapedWhitespace ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		// Support: Firefox
		// Workaround erroneous numeric interpretation of +"0x"
		return high !== high || escapedWhitespace ?
			escaped :
			// BMP codepoint
			high < 0 ?
				String.fromCharCode( high + 0x10000 ) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	};

// Optimize for push.apply( _, NodeList )
try {
	push.apply(
		(arr = slice.call( preferredDoc.childNodes )),
		preferredDoc.childNodes
	);
	// Support: Android<4.0
	// Detect silently failing push.apply
	arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
	push = { apply: arr.length ?

		// Leverage slice if possible
		function( target, els ) {
			push_native.apply( target, slice.call(els) );
		} :

		// Support: IE<9
		// Otherwise append directly
		function( target, els ) {
			var j = target.length,
				i = 0;
			// Can't trust NodeList.length
			while ( (target[j++] = els[i++]) ) {}
			target.length = j - 1;
		}
	};
}


// sizzle 的作用是：输入一个选择器字符串，返回一个符合规则的 DOM 节点列表。
// 其实在高级浏览器里，这个接口是存在的，就是document.querySelectorAll。
// 只不过低级浏览器里没这个接口，所以才会需要 sizzle这个css 选择器引擎

//* 1、对于单一选择器，且是ID、Tag、Class三种类型之一，则直接获取并返回结果 
//* 2、对于支持querySelectorAll方法的浏览器，通过执行querySelectorAll方法获取并返回匹配的DOM元素 
//* 3、除上之外则调用select方法获取并返回匹配的DOM元素 

// context 为选择的范围
function Sizzle( selector, context, results, seed ) {
	var match, elem, m, nodeType,
		// QSA vars
		i, groups, old, nid, newContext, newSelector;

	if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
		setDocument( context );
	}

	context = context || document;
	results = results || [];

    // 如果没有传入选择器规则，或者规则不是字符串类型，则返回results
	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

    // 元素的 nodeType 是 1，文档（dom树的根节点）nodeType 是 9
    // 如 div,a,span,ul nodeType 都是 1；document 的 nodeType 是 9
    // 属性 nodeType 是 2，文本 nodeType 是 3
    // 若context既不是document（nodeType=9），也不是element(nodeType=1)，那么就返回空集合 
	if ( (nodeType = context.nodeType) !== 1 && nodeType !== 9 ) {
		return [];
	}

    // html 文档，并且没有第一匹配出来的 seed
	if ( documentIsHTML && !seed ) {

		// Shortcuts
        // 最上面有个同名的 rquickExpr 变量，不要弄混淆了
        // rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/
        // 拆开两部分 
        // #([\w-]+) 匹配 #id   match[1]
        // (\w+) 匹配 tag  match[2]
        // \.([\w-]+) 匹配 .class  match[3]
     
        // 如果是#id字符串，会match[1]会取出id，例如：
        // selector = '#test';得到 match：
        //  ["#test", "test", undefined, undefined, index: 0, input: "#test"]
		if ( (match = rquickExpr.exec( selector )) ) {
			// Speed-up: Sizzle("#ID")
            // 处理 id 类型选择器，如 #id
			if ( (m = match[1]) ) {
                // context 为 document
				if ( nodeType === 9 ) {
                    // getElementById 方法只能在 document 对象上调用，普通的元素则不行
					elem = context.getElementById( m );
					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document #6963
                    // 兼容 Blackberry 4.6 bug
					if ( elem && elem.parentNode ) {
						// Handle the case where IE, Opera, and Webkit return items
						// by name instead of ID
                        // 有的浏览器会根据 name 返回，而不是id,所以这里再确认一遍
						if ( elem.id === m ) {
							results.push( elem );
							return results;
						}
                    // 元素没取到或者没有父元素，则忽略
					} else {
						return results;
					}
                // Context 不是 document
				} else {
					// Context is not a document
                    // 元素elem必须包含于context，并且元素id确实等于m
                    // contains 方法确认 elem 是否是 contex 的子元素
					if ( context.ownerDocument && (elem = context.ownerDocument.getElementById( m )) &&
						contains( context, elem ) && elem.id === m ) {
						results.push( elem );
						return results;
					}
				}

			// Speed-up: Sizzle("TAG")
            // 处理 tag 类型选择器，如 div
			} else if ( match[2] ) {
                // 如：[].push.apply(this.cnxhData,data)
				push.apply( results, context.getElementsByTagName( selector ) );
				return results;

			// Speed-up: Sizzle(".CLASS")
            // 处理 class 类型选择器，如 .cls
            // 前提条件是支持 getElementsByClassName 方法
            // 在div1内选取class为cls的元素：div1.getElementsByClassName('cls')
			} else if ( (m = match[3]) && support.getElementsByClassName && context.getElementsByClassName ) {
				push.apply( results, context.getElementsByClassName( m ) );
				return results;
			}
		}

		// QSA path
        // qSA 是指 querySelectorAll
        // support.qsa 是指浏览器支持 querySelectorAll
        // rbuggyQSA 是指 qsa 相关的bug
        // rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
        // qsa 可用，并且不会触发bug，才执行以下if语句
        // 浏览器支持情况：IE 8+, Firefox 3.5+, Safari 3+, Chrome 4+, and Opera 10+；
        // querySelector 将返回匹配到的第一个元素，如果没有匹配的元素则返回 Null
        // querySelectorAll 返回一个包含匹配到的元素的数组，如果没有匹配的元素则返回的数组为空
		if ( support.qsa && (!rbuggyQSA || !rbuggyQSA.test( selector )) ) {
			// expando = "sizzle" + -(new Date())
            // "sizzle-1499319258080"
            nid = old = expando;
			newContext = context;
            // context 为 document，newSelector 值才为 selector，否则为 false
			newSelector = nodeType === 9 && selector;

			// qSA works strangely on Element-rooted queries
			// We can work around this by specifying an extra ID on the root
			// and working up from there (Thanks to Andrew Dupont for the technique)
			// IE 8 doesn't work on object elements
             /* 这里当前context对象的id的赋值与恢复，是用来修正querySelectorAll的一个BUG 
             * 该BUG会在某些情况下把当前节点（context）也作为结果返回回来。 
             * 具体方法是，在现有的选择器前加上一个属性选择器：[id=XXX]， 
             * XXX 为context的id，若context本身没有设置id，则给个默认值expando。 
             */
            // context 为元素，并且元素标签名不能是 object
			if ( nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
				// [{value: matched,type: type,matches: match}...]
                groups = tokenize( selector );
                
                // 如果当前 context 有 id 属性
                // 如果没有id,那么old值就是空了
				if ( (old = context.getAttribute("id")) ) {
                    // replace 第二个参数为 $& 表示插入与 regexp 匹配的串
                    // rescape = /'|\\/g
                    // 单引号或反斜杠前加上一个反斜杠
                    // nid 为修正后的 id 值
					nid = old.replace( rescape, "\\$&" );
                // 如果当前 context 没有 id 属性，
                // 那么给它加一个默认的属性 "sizzle-1499319258080"
                // 没有id，old为空，下文会把这里加上的属性给删掉的
				} else {
					context.setAttribute( "id", nid );
				}
				nid = "[id='" + nid + "'] ";

				i = groups.length;
				while ( i-- ) {
                    // 原选择器：div > p + div.aaron
                    // 变成 groups[5]: [id="id5"].aaron
                    // 变成 groups[4]: [id="id4"]div
                    // 变成 groups[3]: [id="id3"]p
                    // 大概是这样
					groups[i] = nid + toSelector( groups[i] );
				}
                // rsibling = new RegExp( whitespace + "*[+~]" )
                // rsibling用于判定选择器是否存在兄弟关系符 
                // 若包含 + ~ 符号，则取context的父节点取代当前节点 
				newContext = rsibling.test( selector ) && context.parentNode || context;
				// 大概是这种形式：
                //  [id="id0"]div,[id="id1"]p,[id="id2"]div,[id="id3"].aaron
                newSelector = groups.join(",");
			}

			if ( newSelector ) {
                 /* 
                 * 这里之所以需要用try...catch， 
                 * 是因为jquery所支持的一些选择器是querySelectorAll所不支持的， 
                 * 当使用这些选择器时，querySelectorAll会报非法选择器， 
                 * 故需要jquery自身去实现。 
                 */ 
				try {
					push.apply( results,
						newContext.querySelectorAll( newSelector )
					);
					return results;
				} catch(qsaError) {
				} finally {
                    // 本来没有id的元素加上了id，这里要删掉
					if ( !old ) {
						context.removeAttribute("id");
					}
				}
			}
		}
	}

	// All others
    // 低级浏览器，不能用原生的getElementById、querySelectorAll等方法选取元素
    // 只能 select 方法来获取结果
     // 除上述快捷方式和调用querySelectorAll方式直接获取结果外，其余都需调用select来获取结果  
    /* 
     * rtrim = new RegExp("^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" 
     *          + whitespace + "+$", "g"), 
     * whitespace = "[\\x20\\t\\r\\n\\f]"; 
     即：rtrim /^[\x20\t\r\n\f]+|((?:^|[^\\])(?:\\.)*)[\x20\t\r\n\f]+$/g
     * 上述rtrim正则表达式的作用是去掉selector两边的空白，空白字符由whitespace变量定义 
     * rtrim的效果与new RegExp("^" + whitespace + "+|" + whitespace + "+$", "g")相似 
     */  
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Create key-value caches of limited size
 * @returns {Function(string, Object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var keys = [];

	function cache( key, value ) {
		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		// push：向数组的末尾添加一个或更多元素，并返回新的长度
        // Expr.cacheLength：固定值 50
        // key += " "，将 key 强制转换为字符串 
        if ( keys.push( key += " " ) > Expr.cacheLength ) {
			// Only keep the most recent entries
            // shift：删除并返回数组的第一个元素
			delete cache[ keys.shift() ];
		}
		return (cache[ key ] = value);
	}
	return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
// 给函数添加一个属性，起到标记函数的作用
function markFunction( fn ) {
    // expando = "sizzle" + -(new Date())
    // "sizzle-1499323096360"
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created div and expects a boolean result
 */
function assert( fn ) {
	var div = document.createElement("div");

	try {
		return !!fn( div );
	} catch (e) {
		return false;
	} finally {
		// Remove from its parent by default
		if ( div.parentNode ) {
			div.parentNode.removeChild( div );
		}
		// release memory in IE
		div = null;
	}
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
function addHandle( attrs, handler ) {
	var arr = attrs.split("|"),
		i = attrs.length;

	while ( i-- ) {
		Expr.attrHandle[ arr[i] ] = handler;
	}
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
			( ~b.sourceIndex || MAX_NEGATIVE ) -
			( ~a.sourceIndex || MAX_NEGATIVE );

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Detect xml
 * @param {Element|Object} elem An element or a document
 */
isXML = Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = elem && (elem.ownerDocument || elem).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var doc = node ? node.ownerDocument || node : preferredDoc,
		parent = doc.defaultView;

	// If no document and documentElement is available, return
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Set our document
	document = doc;
	docElem = doc.documentElement;

	// Support tests
	documentIsHTML = !isXML( doc );

	// Support: IE>8
	// If iframe document is assigned to "document" variable and if iframe has been reloaded,
	// IE will throw "permission denied" error when accessing "document" variable, see jQuery #13936
	// IE6-8 do not support the defaultView property so parent will be undefined
	if ( parent && parent.attachEvent && parent !== parent.top ) {
		parent.attachEvent( "onbeforeunload", function() {
			setDocument();
		});
	}

	/* Attributes
	---------------------------------------------------------------------- */

	// Support: IE<8
	// Verify that getAttribute really returns attributes and not properties (excepting IE8 booleans)
	support.attributes = assert(function( div ) {
		div.className = "i";
		return !div.getAttribute("className");
	});

	/* getElement(s)By*
	---------------------------------------------------------------------- */

	// Check if getElementsByTagName("*") returns only elements
	support.getElementsByTagName = assert(function( div ) {
		div.appendChild( doc.createComment("") );
		return !div.getElementsByTagName("*").length;
	});

	// Check if getElementsByClassName can be trusted
	support.getElementsByClassName = assert(function( div ) {
		div.innerHTML = "<div class='a'></div><div class='a i'></div>";

		// Support: Safari<4
		// Catch class over-caching
		div.firstChild.className = "i";
		// Support: Opera<10
		// Catch gEBCN failure to find non-leading classes
		return div.getElementsByClassName("i").length === 2;
	});

	// Support: IE<10
	// Check if getElementById returns elements by name
	// The broken getElementById methods don't pick up programatically-set names,
	// so use a roundabout getElementsByName test
	support.getById = assert(function( div ) {
		docElem.appendChild( div ).id = expando;
		return !doc.getElementsByName || !doc.getElementsByName( expando ).length;
	});

	// ID find and filter
	if ( support.getById ) {
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== strundefined && documentIsHTML ) {
				var m = context.getElementById( id );
				// Check parentNode to catch when Blackberry 4.6 returns
				// nodes that are no longer in the document #6963
				return m && m.parentNode ? [m] : [];
			}
		};
		Expr.filter["ID"] = function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				return elem.getAttribute("id") === attrId;
			};
		};
	} else {
		// Support: IE6/7
		// getElementById is not reliable as a find shortcut
		delete Expr.find["ID"];

		Expr.filter["ID"] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				var node = typeof elem.getAttributeNode !== strundefined && elem.getAttributeNode("id");
				return node && node.value === attrId;
			};
		};
	}

	// Tag
	Expr.find["TAG"] = support.getElementsByTagName ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== strundefined ) {
				return context.getElementsByTagName( tag );
			}
		} :
		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {
				while ( (elem = results[i++]) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Class
	Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
		if ( typeof context.getElementsByClassName !== strundefined && documentIsHTML ) {
			return context.getElementsByClassName( className );
		}
	};

	/* QSA/matchesSelector
	---------------------------------------------------------------------- */

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21)
	// We allow this because of a bug in IE8/9 that throws an error
	// whenever `document.activeElement` is accessed on an iframe
	// So, we allow :focus to pass through QSA all the time to avoid the IE error
	// See http://bugs.jquery.com/ticket/13378
	rbuggyQSA = [];

	if ( (support.qsa = rnative.test( doc.querySelectorAll )) ) {
		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert(function( div ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explicitly
			// setting a boolean content attribute,
			// since its presence should be enough
			// http://bugs.jquery.com/ticket/12359
			div.innerHTML = "<select><option selected=''></option></select>";

			// Support: IE8
			// Boolean attributes and "value" are not treated correctly
			if ( !div.querySelectorAll("[selected]").length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":checked").length ) {
				rbuggyQSA.push(":checked");
			}
		});

		assert(function( div ) {

			// Support: Opera 10-12/IE8
			// ^= $= *= and empty values
			// Should not select anything
			// Support: Windows 8 Native Apps
			// The type attribute is restricted during .innerHTML assignment
			var input = doc.createElement("input");
			input.setAttribute( "type", "hidden" );
			div.appendChild( input ).setAttribute( "t", "" );

			if ( div.querySelectorAll("[t^='']").length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":enabled").length ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Opera 10-11 does not throw on post-comma invalid pseudos
			div.querySelectorAll("*,:x");
			rbuggyQSA.push(",.*:");
		});
	}

	if ( (support.matchesSelector = rnative.test( (matches = docElem.webkitMatchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector) )) ) {

		assert(function( div ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( div, "div" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( div, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		});
	}

	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

	/* Contains
	---------------------------------------------------------------------- */

	// Element contains another
	// Purposefully does not implement inclusive descendent
	// As in, an element does not contain itself
	contains = rnative.test( docElem.contains ) || docElem.compareDocumentPosition ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			));
		} :
		function( a, b ) {
			if ( b ) {
				while ( (b = b.parentNode) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	/* Sorting
	---------------------------------------------------------------------- */

	// Document order sorting
	sortOrder = docElem.compareDocumentPosition ?
	function( a, b ) {

		// Flag for duplicate removal
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		var compare = b.compareDocumentPosition && a.compareDocumentPosition && a.compareDocumentPosition( b );

		if ( compare ) {
			// Disconnected nodes
			if ( compare & 1 ||
				(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

				// Choose the first element that is related to our preferred document
				if ( a === doc || contains(preferredDoc, a) ) {
					return -1;
				}
				if ( b === doc || contains(preferredDoc, b) ) {
					return 1;
				}

				// Maintain original order
				return sortInput ?
					( indexOf.call( sortInput, a ) - indexOf.call( sortInput, b ) ) :
					0;
			}

			return compare & 4 ? -1 : 1;
		}

		// Not directly comparable, sort on existence of method
		return a.compareDocumentPosition ? -1 : 1;
	} :
	function( a, b ) {
		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;

		// Parentless nodes are either documents or disconnected
		} else if ( !aup || !bup ) {
			return a === doc ? -1 :
				b === doc ? 1 :
				aup ? -1 :
				bup ? 1 :
				sortInput ?
				( indexOf.call( sortInput, a ) - indexOf.call( sortInput, b ) ) :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( (cur = cur.parentNode) ) {
			ap.unshift( cur );
		}
		cur = b;
		while ( (cur = cur.parentNode) ) {
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[i] === bp[i] ) {
			i++;
		}

		return i ?
			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[i], bp[i] ) :

			// Otherwise nodes in our document sort first
			ap[i] === preferredDoc ? -1 :
			bp[i] === preferredDoc ? 1 :
			0;
	};

	return doc;
};

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	// Make sure that attribute selectors are quoted
	expr = expr.replace( rattributeQuotes, "='$1']" );

	if ( support.matchesSelector && documentIsHTML &&
		( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
		( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

		try {
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch(e) {}
	}

	return Sizzle( expr, document, null, [elem] ).length > 0;
};

Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	var fn = Expr.attrHandle[ name.toLowerCase() ],
		// Don't get fooled by Object.prototype properties (jQuery #13807)
		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
			fn( elem, name, !documentIsHTML ) :
			undefined;

	return val === undefined ?
		support.attributes || !documentIsHTML ?
			elem.getAttribute( name ) :
			(val = elem.getAttributeNode(name)) && val.specified ?
				val.value :
				null :
		val;
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	sortInput = !support.sortStable && results.slice( 0 );
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		while ( (elem = results[i++]) ) {
			if ( elem === results[ i ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		for ( ; (node = elem[i]); i++ ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (see #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	attrHandle: {},

	find: {},

    // 一个节点和另一个节点的关系无非以下几种：
    // 父亲和儿子、祖宗和后代、临近兄弟、普通兄弟
    // 分别对应的选择符是：> 空格 + ~
    // 其实还有一种关系：div.clr 表示class为clr的div节点
    // first 表示紧密程度
	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[1] = match[1].toLowerCase();

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				// nth-* requires argument
				if ( !match[3] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[5] && match[2];

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[3] && match[4] !== undefined ) {
				match[2] = match[4];

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeNameSelector ) {
			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
			return nodeNameSelector === "*" ?
				function() { return true; } :
				function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== strundefined && elem.getAttribute("class") || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, what, argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, outerCache, node, diff, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( (node = node[ dir ]) ) {
									if ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) {
										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {
							// Seek `elem` from a previously-cached index
							outerCache = parent[ expando ] || (parent[ expando ] = {});
							cache = outerCache[ type ] || [];
							nodeIndex = cache[0] === dirruns && cache[1];
							diff = cache[0] === dirruns && cache[2];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( (node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									outerCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						// Use previously-cached element index if available
						} else if ( useCache && (cache = (elem[ expando ] || (elem[ expando ] = {}))[ type ]) && cache[0] === dirruns ) {
							diff = cache[1];

						// xml :nth-child(...) or :nth-last-child(...) or :nth(-last)?-of-type(...)
						} else {
							// Use the same loop as above to seek `elem` from the start
							while ( (node = ++nodeIndex && node && node[ dir ] ||
								(diff = nodeIndex = 0) || start.pop()) ) {

								if ( ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) && ++diff ) {
									// Cache the index of each encountered element
									if ( useCache ) {
										(node[ expando ] || (node[ expando ] = {}))[ type ] = [ dirruns, diff ];
									}

									if ( node === elem ) {
										break;
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf.call( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			return function( elem ) {
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifier
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
				return false;
			};
		}),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": function( elem ) {
			return elem.disabled === false;
		},

		"disabled": function( elem ) {
			return elem.disabled === true;
		},

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is only affected by element nodes and content nodes(including text(3), cdata(4)),
			//   not comment, processing instructions, or others
			// Thanks to Diego Perini for the nodeName shortcut
			//   Greater than "@" means alpha characters (specifically not starting with "#" or "?")
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeName > "@" || elem.nodeType === 3 || elem.nodeType === 4 ) {
					return false;
				}
			}
			return true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			// IE6 and 7 will map elem.type to 'text' for new HTML5 types (search, etc)
			// use getAttribute instead to test this case
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === elem.type );
		},

		// Position-in-collection
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

// 词法分析
//假设传入进来的选择器是：div > p + .clr [type="checkbox"], #id:first-child
//这里可以分为两个规则：div > p + .clr [type="checkbox"] 以及 #id:first-child
//返回的需要是一个Token序列
//Sizzle的Token格式如下 ：{value:'匹配到的字符串', type:'对应的Token类型', matches:'正则匹配到的一个结构'}
// parseOnly 是否只是检查 selector 的合法性
function tokenize( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

    // 如果 cached 有数据，直接返回
	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
    //groups表示目前已经匹配到的规则组，在这个例子里边，groups的长度最后是2，存放的是每个规则对应的Token序列
	groups = [];
	preFilters = Expr.preFilter;

    // soFar 表示还没分析完的字符串
	while ( soFar ) {

		// Comma and first run
        // rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" )
        // rcomma = /^[\x20\t\r\n\f]*,[\x20\t\r\n\f]*/
        // 逗号或者空白符或空开头，逗号后紧跟空白符或空
        // eg：rcomma.exec(',a') 返回 [",", index: 0, input: ",a"]
        // rcomma.exec('div > p + .clr [type="checkbox"], #id:first-child') ,返回 null
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( tokens = [] );
		}

		matched = false;

		// Combinators
        // rcombinators = /^[\x20\t\r\n\f]*([>+~]|[\x20\t\r\n\f])[\x20\t\r\n\f]*/
		// > + ~ 空格 等空白符
        // eg：rcombinators.exec(' > p + ')
        // match 为 [" > ", ">", index: 0, input: " > p + "]
        // 这里处理比较简单的Token ： >, +, 空格, ~
        if ( (match = rcombinators.exec( soFar )) ) {
            // 匹配到的字符串片段 " > "
			matched = match.shift();
			tokens.push({
                // 匹配到的字符串片段 " > "
				value: matched,
				// Cast descendant combinators to space
                // 匹配到的token类型，不包括空格
                // token类型有：TAG, ID, CLASS, ATTR, CHILD, PSEUDO, NAME, >, +, 空格, ~
				// 这里是 >
                type: match[0].replace( rtrim, " " )
			});
            // 已经分析过的字符串丢掉
			soFar = soFar.slice( matched.length );
		}

		// Filters
         // 这里处理另外几种Token ： TAG, ID, CLASS, ATTR, CHILD, PSEUDO, NAME
         /*
            Expr.filter : {
                "TAG": function(){...},
                "CLASS":function(){...},
                "ATTR":function(){...},
                "CHILD":function(){...},
                "PSEUDO":function(){...},
            }

            matchExpr = {
                "ID": new RegExp( "^#(" + characterEncoding + ")" ),
                "CLASS": new RegExp( "^\\.(" + characterEncoding + ")" ),
                "TAG": new RegExp( "^(" + characterEncoding.replace( "w", "w*" ) + ")" ),
                "ATTR": new RegExp( "^" + attributes ),
                "PSEUDO": new RegExp( "^" + pseudos ),
                "CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
                    "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
                    "*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
                "bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
                // For use in libraries implementing .is()
                // We use this for POS matching in `select`
                "needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
                    whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
            }

            preFilters : {
                "ATTR": function( match ) {},
                "CHILD": function( match ) {},
                "PSEUDO": function( match ) {}
            }
         */
		for ( type in Expr.filter ) {
            // 如果通过正则匹配到了Token格式：match = matchExpr[ type ].exec( soFar )
            // 然后看看需不需要预处理：!preFilters[ type ]
            // 如果需要 ，那么通过预处理器将匹配到的处理一下 ： match = preFilters[ type ]( match )
            // ATTR、CHILD、PSEUDO 这三种 token 需要预处理一下
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {

                // 匹配到的token
				matched = match.shift();
				tokens.push({
					value: matched,  // 匹配到的字符串片段
					type: type,      // token 类型
					matches: match   // 正则匹配结果数组
				});
                // 从原字符串中丢掉已匹配部分
				soFar = soFar.slice( matched.length );
			}
		}

        // 如果没有找到片段，说明选择器写法有误，那就不再继续了
        // 异常处理
		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
    // 如果只是测试选择器的合法性，那就返回soFar剩余长度（长度不为0 ，说明选择器不合法）
    // 否则，如果soFar剩余长度不为0，抛出异常，为 0 ，则把选择器和对应的groups缓存，并返回
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
            // selector 和对应的 groups 存在 cache 里
			tokenCache( selector, groups ).slice( 0 );
}

// 将 token 中的 value 连起来，返回一个字符串
// 如 div + p > span.cls
function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		checkNonElements = base && dir === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var data, cache, outerCache,
				dirkey = dirruns + " " + doneName;

			// We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});
						if ( (cache = outerCache[ dir ]) && cache[0] === dirkey ) {
							if ( (data = cache[1]) === true || data === cachedruns ) {
								return data === true;
							}
						} else {
							cache = outerCache[ dir ] = [ dirkey ];
							cache[1] = matcher( elem, context, xml ) || cachedruns;
							if ( cache[1] === true ) {
								return true;
							}
						}
					}
				}
			}
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf.call( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf.call( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			return ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector(
						// If the preceding token was a descendant combinator, insert an implicit any-element `*`
						tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
					).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	// A counter to specify which element is currently being matched
	var matcherCachedRuns = 0,
		bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, expandContext ) {
			var elem, j, matcher,
				setMatched = [],
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				outermost = expandContext != null,
				contextBackup = outermostContext,
				// We must always have either seed elements or context
				elems = seed || byElement && Expr.find["TAG"]( "*", expandContext && context.parentNode || context ),
				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1);

			if ( outermost ) {
				outermostContext = context !== document && context;
				cachedruns = matcherCachedRuns;
			}

			// Add elements passing elementMatchers directly to results
			// Keep `i` a string if there are no elements so `matchedCount` will be "00" below
			for ( ; (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;
					while ( (matcher = elementMatchers[j++]) ) {
						if ( matcher( elem, context, xml ) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
						cachedruns = ++matcherCachedRuns;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// Apply set filters to unmatched elements
			matchedCount += i;
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, group /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !group ) {
			group = tokenize( selector );
		}
		i = group.length;
		while ( i-- ) {
			cached = matcherFromTokens( group[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );
	}
	return cached;
};

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

/* 
 * select方法是Sizzle选择器包的核心方法之一，其主要完成下列任务： 
 * 1、调用tokenize方法完成对选择器的解析 
 * 2、对于没有初始集合（即seed没有赋值）且是单一块选择器（即选择器字符串中没有逗号）， 
 *    完成下列事项： 
 *    1) 对于首选择器是ID类型且context是document的，则直接获取对象替代传入的context对象 
 *    2) 若选择器是单一选择器，且是id、class、tag类型的，则直接获取并返回匹配的DOM元素 
 *    3) 获取最后一个id、class、tag类型选择器的匹配DOM元素赋值给初始集合（即seed变量） 
 * 3、通过调用compile方法获取“预编译”代码并执行，获取并返回匹配的DOM元素 
 *  
 * @param selector 已去掉头尾空白的选择器字符串 
 * @param context 执行匹配的最初的上下文（即DOM元素集合）。若context没有赋值，则取document。 
 * @param results 已匹配出的部分最终结果。若results没有赋值，则赋予空数组。 
 * @param seed 初始集合 
 */


 /*

CSS的浏览器实现的基本接口

除去querySelector,querySelectorAll

HTML文档一共有这么四个API：

getElementById，上下文只能是HTML文档。
getElementsByName，上下文只能是HTML文档。
getElementsByTagName，上下文可以是HTML文档，XML文档及元素节点。
getElementsByClassName，上下文可以是HTML文档及元素节点。IE8还没有支持。
所以要兼容的话sizzle最终只会有三种完全靠谱的可用

Expr.find = {
      'ID'    : context.getElementById,
      'CLASS' : context.getElementsByClassName,
      'TAG'   : context.getElementsByTagName
}


selector："div > p + div.aaron input[type="checkbox"]"

解析规则：
1 按照从右到左
2 取出最后一个token  比如[type="checkbox"]
                            {
                                matches : [
                                   0: "type"
                                   1: "="
                                   2: "checkbox"
                                ],
                                type    : "ATTR",
                                value   : "[type="checkbox"]"
                            }
3 过滤类型 如果type是 > + ~ 空 四种关系选择器中的一种，则跳过，在继续过滤
4 直到匹配到为 ID,CLASS,TAG  中一种 , 因为这样才能通过浏览器的接口索取
  （从右往左匹配，但是右边第一个是"[type="checkbox"]"，Expr.find不认识这种选择器，跳过，继续向左）
5 此时seed种子合集中就有值了,这样把刷选的条件给缩的很小了
6 如果匹配的seed的合集有多个就需要进一步的过滤了,修正选择器 selector: "div > p + div.aaron [type="checkbox"]"
7 OK,跳到一下阶段的编译函数
 */
function select( selector, context, results, seed ) {
	var i, tokens, token, type, find,
        // 将 selector token 化
        // 如 [[{value: matched,type: type,matches: match}...]...]
		match = tokenize( selector );

    // 最后一个选择器不是 id、class、tag 等，没有匹配出最终的种子元素
	if ( !seed ) {
		// Try to minimize operations if there is only one group
        // 如果选择器里没有逗号，则只有一组
		if ( match.length === 1 ) {

			// Take a shortcut and set the context if the root selector is an ID
            // 为什么要这么做？直接赋值 tokens = match[0] 不行吗？？
            tokens = match[0] = match[0].slice( 0 );
            // 满足以下几个条件：
            // 1.tokens有三个以上的选择器
            // 2.第一个选择器是 id 选择器
            // 3.支持 getElementById 方法
            // 4.context 为 document
            // 5.当前文档是 html 类型
            // 6.第二个选择器的类型是（空格 + > ~）其中之一
			if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
					support.getById && context.nodeType === 9 && documentIsHTML &&
					Expr.relative[ tokens[1].type ] ) {
                
                // 在 context 中选取特定 id 的元素
                /* Expr.find["ID"] = function( id, context ) {
                    if ( typeof context.getElementById !== strundefined && documentIsHTML ) {
                        var m = context.getElementById( id );
                        // Check parentNode to catch when Blackberry 4.6 returns
                        // nodes that are no longer in the document #6963
                        return m && m.parentNode ? [m] : [];
                    }
                };
                */
                // runescape = /\\([\da-f]{1,6}[\x20\t\r\n\f]?|([\x20\t\r\n\f])|.)/gi
                // funescape 是一个函数
                // 将当前 context 指向第一个 id 选择器指定的节点
                context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
				// 对于 []，[][0] （context）值为 undefined
                if ( !context ) {
					return results;
				}
                // 从原选择器字符串中丢掉最开始的id选择器
				selector = selector.slice( tokens.shift().value.length );
			}

			// Fetch a seed set for right-to-left matching
            // (?=exp)	匹配exp前面的位置
            // matchExpr["needsContext"] = new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
            // 1. > + ~ 三种关系符
            // 2. :even、:odd、:eq、:gt、:lt、:nth、:first、:last八种伪类 
            
            // test 返回 true 或 false
            // 如果没有伪类或关系符，从最后一条规则开始，先找出seed集合
            i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
			// 从后边的规则开始
            while ( i-- ) {
                // 最后一个token
				token = tokens[i];

				// Abort if we hit a combinator
                // 遇到（空格 + > ~）跳出结束循环
                // 这样就没找到合适的seed，后续只能整个dom中去扫描了
				if ( Expr.relative[ (type = token.type) ] ) {
					break;
				}
                // Expr.find["TAG"] 通过原生的 getElementsByTagName 方法选取元素；
                // Expr.find["CLASS"] 如果支持 getElementsByClassName ，则用该方法选取元素
				// 这里的find是一个方法，根据类型返回相应的方法
                if ( (find = Expr.find[ type ]) ) {
					// Search, expanding context for leading sibling combinators
					if ( (seed = find(
						token.matches[0].replace( runescape, funescape ),
                        // rsibling = new RegExp(whitespace + "*[+~]") 
                        // 如果是兄弟节点，则 context 替换为 context.parentNode
						rsibling.test( tokens[0].type ) && context.parentNode || context
					)) ) {

                         // 如果找到了节点，赋值给 seed

						// If seed is empty or no tokens remain, we can return early
						// 删除当前token
                        // 之所以不是删除最后token，是因为最后可能是属性token等，这是会跳过的
                        tokens.splice( i, 1 );
                        // 剩余的选择符
						selector = seed.length && toSelector( tokens );
                         // 如果 seed 为空或者没有剩余选择符，不再继续了
						if ( !selector ) {
							push.apply( results, seed );
							return results;
						}
                        
                        // 只要找到了 seed，就不会再循环了
						break;
					}
				}
			}
		}
	}

	// Compile and execute a filtering function
	// Provide `match` to avoid retokenization if we modified the selector above
	// 交由compile来生成一个称为终极匹配器
    // 通过这个匹配器过滤seed，把符合条件的结果放到results里边
    /* 先执行compile(selector, match)，它会返回一个“预编译”函数， 
     * 然后调用该函数获取最后匹配结果 
     */  
    // compile()()
    // 生成编译函数：
    // var superMatcher = compile( selector, match );
    /* superMatcher(
		seed,
		context,
		!documentIsHTML,
		results,
		rsibling.test( selector )
	);
    */
    compile( selector, match )(
		seed,
		context,
		!documentIsHTML,
		results,
		rsibling.test( selector )
	);
	return results;
}

// One-time assignments

// Sort stability
support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

// Support: Chrome<14
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = hasDuplicate;

// Initialize against the default document
setDocument();

// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert(function( div1 ) {
	// Should return 1, but returns 4 (following)
	return div1.compareDocumentPosition( document.createElement("div") ) & 1;
});

// Support: IE<8
// Prevent attribute/property "interpolation"
// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !assert(function( div ) {
	div.innerHTML = "<a href='#'></a>";
	return div.firstChild.getAttribute("href") === "#" ;
}) ) {
	addHandle( "type|href|height|width", function( elem, name, isXML ) {
		if ( !isXML ) {
			return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
		}
	});
}

// Support: IE<9
// Use defaultValue in place of getAttribute("value")
if ( !support.attributes || !assert(function( div ) {
	div.innerHTML = "<input/>";
	div.firstChild.setAttribute( "value", "" );
	return div.firstChild.getAttribute( "value" ) === "";
}) ) {
	addHandle( "value", function( elem, name, isXML ) {
		if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
			return elem.defaultValue;
		}
	});
}

// Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if ( !assert(function( div ) {
	return div.getAttribute("disabled") == null;
}) ) {
	addHandle( booleans, function( elem, name, isXML ) {
		var val;
		if ( !isXML ) {
			return (val = elem.getAttributeNode( name )) && val.specified ?
				val.value :
				elem[ name ] === true ? name.toLowerCase() : null;
		}
	});
}

jQuery.find = Sizzle;
jQuery.expr = Sizzle.selectors;
jQuery.expr[":"] = jQuery.expr.pseudos;
jQuery.unique = Sizzle.uniqueSort;
jQuery.text = Sizzle.getText;
jQuery.isXMLDoc = Sizzle.isXML;
jQuery.contains = Sizzle.contains;


})( window );
// String to Object options format cache
var optionsCache = {};

// Convert String-formatted options into Object-formatted ones and store in cache
/*
// 匹配任意不是空白的字符
core_rnotwhite = /\S+/g

'once memory'.match(/\S+/g) -> ["once", "memory"]  match 的正则参数如果是全局匹配，返回的数组就像这样很简单的

$.each(arr, function(i, value){
    // i 是 key 'name', 'age' ...
    // value 是元素 'hello', 20 ...
    // code
    return false;
});
 */
function createOptions( options ) {
    // 假如 options 为 'once memory'
    // 注意这种写法：object = optionsCache[ options ] = {}
    // object 和 optionsCache[ options ] 指向同一个对象，当 object 对这个对象进行修改，也会反应在 optionsCache[ options ] 上
	var object = optionsCache[ options ] = {};
	jQuery.each( options.match( core_rnotwhite ) || [], function( _, flag ) {
        // 修改 object 相当于也修改了 optionsCache[ options ]
		object[ flag ] = true;
	});
	return object;
}

/*
 * Create a callback list using the following parameters:
 *
 *	options: an optional list of space-separated options that will change how
 *			the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *
 *	stopOnFalse:	interrupt callings when a callback returns false
 *
 */
/*
① 观察者模式：

function aaa(){
    console.log(1);
}
function bbb(){
    console.log(2);
}

var cb = $.callbacks();
cb.add(aaa);
cb.add(bbb);

cb.fire() // 依次触发 aaa，bbb 方法

跟事件绑定类似：
document.addEventListener('click',function(){console.log(1),false});
document.addEventListener('click',function(){console.log(1),false});
document.addEventListener('click',function(){console.log(1),false});

点击页面后，会依次弹出 1，2，3

② 管理不同作用域下定义的函数

var cb = $.Callbacks();

function aaa(){
    console.log(1);
}
cb.add(aaa);

(function(){
    function bbb(){
        console.log(2);
    }
    cb.add(bbb);
})();

cb.fire(); // 依次触发 aaa, bbb 函数

③ 参数选项：

a）once:  

如果没这个参数：
cb.fire();
cb.fire();
这样会依次两次触发回调函数

$.Callbacks('once') 代表 fire() 只能一次触发回调

b) memory 

如果没有这个参数：
var cb = $.Callbacks();
cb.add(aaa);
cb.fire();
cb.add(bbb);
这样只会只会触发 aaa 函数

如果加上参数，var cb = $.callbacks('memory');
这样会依次触发 aaa, bbb 函数

c) unique 保证回调函数的唯一性

如果没有这个参数：
var cb = $.Callbacks();
cb.add(aaa);
cb.add(aaa);
cb.fire();

这样会连续触发 2 次 aaa 函数

如果加上参数，var cb = $.callbacks('unique');
相同的函数只会触发一次

d) stopOnFalse

如果写上这个参数，var cb = $.Callbacks('stopOnFalse');

function aaa(){
    console.log(1);
    return false;
}

加入 aaa 函数返回 false，那么它后面的 bbb 等回调函数就不会触发

e) 组合 var cb = $.Callbacks('once memory');


④ 方法：add、remove、has、empty、disable、disabled、lock、locked、fireWith、fire、fired

⑤ 带参数触发队列：（后面代码中 stack 数组会存储这个 value 参数和 context）
var f1 = function(value){
    console.log('f1:' + value);
}

var f2 = function(value){
    console.log('f2:' + value);
}

var cb = $.Callbacks();
cb.add( f1 );
cb.add( f2 );
cb.fire('hello')

依次打印：f1:hello 、f2:hello
 */

// 管理回调函数队列
jQuery.Callbacks = function( options ) {

	// Convert options from String-formatted to Object-formatted if needed
	// (we check in cache first)
    /*
    ① 如果参数 options 不是字符串，也就是不写，即 undefined，那 options = jQuery.extend( {}, options )，即 {}

    ② 如果参数 options 是字符串，如 'once memory'

    var optionsCache = {};

    // Convert String-formatted options into Object-formatted ones and store in cache
    function createOptions( options ) {
        var object = optionsCache[ options ] = {};
        jQuery.each( options.match( core_rnotwhite ) || [], function( _, flag ) {
            object[ flag ] = true;
        });
        return object;
    }

    没执行 createOptions( options ) 时，optionsCache[ options ] 为 undefined
    执行完 createOptions( options ) 时，optionsCache[ options ] 变为 {once : true, memory : true}
    所以，第一次进来，会返回 createOptions( options )，即 {once : true, memory : true}
     */

	options = typeof options === "string" ?
		( optionsCache[ options ] || createOptions( options ) ) :
		jQuery.extend( {}, options );

	var // Last fire value (for non-forgettable lists)
        // 上次触发 fire 方法的参数（有 memory 参数才会有值）
		memory,
		// Flag to know if list was already fired
        // 回调队列至少执行过一次
		fired,
		// Flag to know if list is currently firing
        // 标志回调队列正在执行
		firing,
		// First callback to fire (used internally by add and fireWith)
        // 回调队列执行的起到位置
		firingStart,
		// End of the loop when firing
        // 正在执行的回调队列长度
		firingLength,
		// Index of currently firing callback (modified by remove if needed)
		// 正在执行的回调函数索引
        firingIndex,
		// Actual callback list
        // 回调函数列表
		list = [],
		// Stack of fire calls for repeatable lists
        // 如果配置了 once 参数，stack 为 false
        // 如果没有配置 once 参数，stack 为 []
		stack = !options.once && [],
		// Fire callbacks
        // self.fire -> self.fireWith -> fire
		fire = function( data ) {
            // 如果有 memory 参数，则记录 data
			memory = options.memory && data;
            // 标记触发过回调队列
			fired = true;
			firingIndex = firingStart || 0;
			firingStart = 0;
			firingLength = list.length;
            // 标记正在执行回调队列
			firing = true;
			for ( ; list && firingIndex < firingLength; firingIndex++ ) {
                // 如果配置了 stopOnFalse 参数，当有一个回调函数返回 false，就终止循环
				if ( list[ firingIndex ].apply( data[ 0 ], data[ 1 ] ) === false && options.stopOnFalse ) {
					// 阻止将来由 add 方法添加的回调
                    memory = false; // To prevent further calls using add
					break;
				}
			}
            // 标记回调队列已执行完毕
			firing = false;
			if ( list ) {
                // 如果没有配置 once 参数，stack 为 []
                
                // 前面的 firing 过程中，再调用 fire(value) 方法不会打断 firing，而是将 value 压栈，
                // 等firing 结束，再执行下一个 fire(value)
                
                // 回调队列执行过程中，调用 self.fire(arg) 方法，新的参数会存在 stack 中
                // 依次用 stack 中的值，作为参数来执行回调队列
                // 如 stack = [[context,arg1],[context,arg2],...]
				if ( stack ) {
					if ( stack.length ) {
						fire( stack.shift() );
					}
                // 这里 stack 为 false，说明配置了 once 参数
                // 那么，有记忆模式（memory 参数），清空队列，但是之后用 cb.add(fn) 还是可以执行 fn 的
				} else if ( memory ) {
					list = [];
                // 配置了 once 参数、但没配置 memory 参数，使队列失效，之后怎样都不会执行
				} else {
					self.disable();
				}
			}
		},
		// Actual Callbacks object
        // $.Callbacks() 返回的就是这个 self 对象
		self = {
			// Add a callback or a collection of callbacks to the list
            // 回调队列中添加一个回调或回调的集合
            /*
            cb.add(fn1,fn2)
            cb.add(fn1,[fn2,fn3])
             */
			add: function() {
				if ( list ) {
					// First, we save the current length
					var start = list.length;
					(function add( args ) {
						jQuery.each( args, function( _, arg ) {
							var type = jQuery.type( arg );
                            // 参数为 function
							if ( type === "function" ) {
                                /*
                                如果没有 options.unique 参数，直接存
                                如果有 options.unique 参数，并且没有重复存过，也存
                                */
								if ( !options.unique || !self.has( arg ) ) {
									list.push( arg );
								}
                            // 参数为类数组 cb.add([f1,f2,f3])
							} else if ( arg && arg.length && type !== "string" ) {
								// Inspect recursively
                                // 递归检查
								add( arg );
							}
						});
					})( arguments );
					// Do we need to add the callbacks to the
					// current firing batch?
					if ( firing ) {
						firingLength = list.length;
					// With memory, if we're not firing then
					// we should call right away
                    /*
                     ① memory = options.memory && data;
                     memory 为最后一次调用 callbacks.fireWith(...) 时所使用的参数 [context, arguments]
                     如果有 memory 说明 options.memory 为真，即有 memory 参数
                     ② memory 默认值是 undefined，如果有 memory 还说明执行过 fire 方法
                     ③ 有 memory，对于还没执行的函数，我们要立即执行它们

                     即便是设置了 options.once ，只要执行过 fire 方法，使得 memory 有值，就会触发 cb.add(fn) 新增的 fn 方法
                     var cb = $.Callbacks('once memory');
                     cb.add(fn1);
                     cb.fire();
                     cb.add(fn2);

                     cb.fire()

                     虽然这里 fn2 在 fire 方法后添加，但还是会执行 1 次，这就是 memory 的作用。
                     之后再 fire 就不起作用了，因为有 once

                     有一种特例，当有参数 stopOnFalse 时，如果有函数返回 false
                     则 memory = false;
                    */
					} else if ( memory ) {
                        // 从上次执行完的位置开始
						firingStart = start;
						fire( memory );
					}
				}
				return this;
			},
			// Remove a callback from the list
			remove: function() {
				if ( list ) {
					jQuery.each( arguments, function( _, arg ) {
						var index;
                        // inArray 返回元素在数组中的索引，第三个参数 index 表示查找起始位置
                        // 这样每次存下上次查找到的位置，作为下次查找的起始位置，提高效率
						while( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
							list.splice( index, 1 );
							// Handle firing indexes
                            // 如果正则执行回调队列，修正队列长度，不然取不到队列最后一个元素会报错的
							if ( firing ) {
								if ( index <= firingLength ) {
									firingLength--;
								}
								if ( index <= firingIndex ) {
									firingIndex--;
								}
							}
						}
					});
				}
				return this;
			},
			// Check if a given callback is in the list.
			// If no argument is given, return whether or not list has callbacks attached.
            // 如果有参数 fn 并且 fn 已经存在回调队列里，返回 true
            // 如果没有参数 fn，只要回调队列不为空，就返回 true
			has: function( fn ) {
				return fn ? jQuery.inArray( fn, list ) > -1 : !!( list && list.length );
			},
			// Remove all callbacks from the list
            // 清空回调队列
			empty: function() {
				list = [];
				firingLength = 0;
				return this;
			},
			// Have the list do nothing anymore
            // 禁用回调
			disable: function() {
                // 后续的所有函数都不继续执行了 list 不为真，所有的函数都启动不了
				list = stack = memory = undefined;
				return this;
			},
			// Is it disabled?
            // 如果 disable 过了，返回 true
			disabled: function() {
				return !list;
			},
			// Lock the list in its current state
			lock: function() {
                // 当执行过一次 cb.fire() -> fired，如果再把 stack 置为 undefined，那就再也不能启动 cb.fire() 方法了
				stack = undefined;
				if ( !memory ) {
					self.disable();
				}
				return this;
			},
			// Is it locked?
            // 如果 lock 过了，返回 true
			locked: function() {
				return !stack;
			},
			// Call all callbacks with the given context and arguments
			fireWith: function( context, args ) {
                // 回调队列没有被触发过，或者是 stack 为数组（如果没有配置 once 参数，stack 为 []）
                /*
                第一次调用 cb.fire('hello') -> fired = true
                要想第二次调用 cb.fire('hello') 会执行，必须 stack 为数组，也就是说没有配置 once 参数
                 */
				if ( list && ( !fired || stack ) ) {
					args = args || [];
                    // [1,2,3].slice() -> [1, 2, 3]
					args = [ context, args.slice ? args.slice() : args ];
                    /*
                    var cb = $.Callbacks();
                    function fn1(value){
                        console.log('fn1'+value);
                        cb.fire()
                    }
                    function fn2(value){
                        console.log('fn2'+value);
                    }

                    cb.add(fn1,fn2);
                    cb.fire('hello');

                    firing 过程不能阻断还是很有必要的，不然上面这段程序就会死循环，一直执行 fn1...
                     */
					if ( firing ) {
                        // 正在执行回调队列，把新增的 fire 参数加入 stack 数组
						stack.push( args );
					} else {
                        // args = [ context, args.slice ? args.slice() : args ]
						fire( args );
					}
				}
				return this;
			},
			// Call all the callbacks with the given arguments
            /*
            cb.fire(value) 回调函数队列的每一个函数都会以 value 为实参执行
             */
			fire: function() {
				self.fireWith( this, arguments );
				return this;
			},
			// To know if the callbacks have already been called at least once
            // 回调队列至少执行过一次，就返回 true
			fired: function() {
				return !!fired;
			}
		};

	return self;
};

/*
jQuery.extend({
    Deferred : function(){},
    when : function(){}
});

得到两个工具方法：

$.Deferred();
$.when();

例子1：
setTimeout(function(){
    alert(111);
},1000);

alert(222);

先弹 222，1 秒后弹 111

例子2：
var cb = $.Callbacks();

setTimeout(function(){
    alert(111);
    cb.fire();
},1000);

cb.add(function(){
    alert(222);
});

1 秒后，先弹 111，再弹 222

例子3：
var dfd = $.Deferred();

setTimeout(function(){
    alert(111);
    // 触发完成回调队列
    dfd.resolve();
},1000);

// 注册完成回调
dfd.done(function(){
    alert(222);
});

1 秒后，先弹 111，再弹 222。（和上面的运行结果一样）

例子4：
var dfd = $.Deferred();

setTimeout(function(){
    alert(111);
    // 触发失败回调队列
    dfd.reject();
},1000);

// 注册失败回调
dfd.fail(function(){
    alert(222);
});

1 秒后，先弹 111，再弹 222。（和上面的运行结果一样）

例子5：
var dfd = $.Deferred();

setTimeout(function(){
    alert(111);
    // 触发进行中回调队列
    dfd.notify();
},1000);

// 注册进行中回调
dfd.progress(function(){
    alert(222);
});

1 秒后，先弹 111，再弹 222。（和上面的运行结果一样）

例子6：
$.ajax({
    url : 'xxx.php',
    success : function(){
        alert('成功');
    },
    error : function(){
        alert('失败');
    }
});

相当于：
$.ajax('xxx.php').done(function(){alert('成功')}).fail(function(){alert('失败')});

例子7：【成功】 或 【失败】 的状态只能改变一次
var dfd = $.Deferred();

setInterval(function(){
    dfd.resolve();
},1000);

dfd.done(function(){
    alert('成功');
}).fail(function(){
    alert('失败');
});

虽然循环调用 resolve()，但只会一次弹出 ‘成功’

例子8：【进行中】可以多次触发
var dfd = $.Deferred();

setInterval(function(){
    dfd.notify();
},1000);

dfd.done(function(){
    alert('成功');
}).fail(function(){
    alert('失败');
}).progress(function(){
    alert('进行中');
});

循环调用 notify()，循环弹出 ‘进行中’

例子9：
var cb = $.Callbacks('memory');

cb.add(function(){
    alert(1);
});

cb.fire();

cb.add(function(){
    alert(2);
});

“记忆功能”，依次弹出 1，2

例子10：
var cb = $.Callbacks('memory');

cb.add(function(){
    alert(1);
});

cb.fire();

$('input').click(function(){
    cb.add(function(){
        alert(2);
    });
});

先弹出 1，点击 input 按钮时，才会弹出 2，每点一次就会弹出一次 2

例子11：
var dfd = $.Deferred();

serTimeout(function(){
    dfd.resolve();
},1000);

dfd.done(function(){
    alert('aaa');
});

$('input').click(function(){
    dfd.done(function(){
        alert('bbb');
    });
});

1 秒后弹出 aaa，后面每点击一次按钮弹出一次 bbb

例子12：
function aaa(){
    var dfd = $.Deferred();
    setTimeout(function(){
        dfd.resolve();
    },1000);
    return dfd;
}

aaa().done(function(){
    alert('成功');
}).fail(function(){
    alert('失败')
});

1 秒后弹 ’成功‘

例子13：deferred 对象可以修改状态
function aaa(){
    var dfd = $.Deferred();
    setTimeout(function(){
        dfd.resolve();
    });
    return dfd;  // 对外暴露接口 resolve|notify|reject 可以改变状态
}

var newDfd = aaa();

newDfd.done(function(){
    alert('成功');
}).fail(function(){
    alert('失败')
});

newDfd.reject();

立即弹出 ‘失败’。

这里在 aaa 函数外调用 reject 改变了延迟对象的‘状态’。

例子14：promise 对象就不可以修改状态了
function aaa(){
    var dfd = $.Deferred();
    setTimeout(function(){
        dfd.resolve();
    });
    return dfd.promise(); 
    // promise 方法没有参数，就是返回 promise 对象
    // promise 对象有 done|fail|progress 等接口，没有 resolve|notify|reject
}

var newDfd = aaa();

newDfd.done(function(){
    alert('成功');
}).fail(function(){
    alert('失败')
});

newDfd.reject();

1 秒后弹出 ’成功‘，并且下面的 reject 方法还会报错，newDfd.reject 不是一个函数（undefined）

例子15：
function read(){
  var dfd = this;
  setTimeout(function(){
    dfd.resolve('hello');
  }, 3000);
}
 
$.Deferred(read)
　　.done(function(content){ console.log(content);})
　　.fail(function(){ console.log("出错！"); } )
　　.progress(function(){ console.log("处理中！"); });

3 秒后打印 hello

其实，$.Deferred(read) 的返回值就是 read 函数里的 dfd，验证一下：

var d = null;

function read(){
  var dfd = this;
  setTimeout(function(){
    dfd.resolve('hello');
  }, 3000);
  d = dfd;
}
 
$.Deferred(read) === d  // true

 */

/*
deferred 对象 api：

* 事件订阅：done | fail | progress
* 事件发布：resolve | reject | notify

(1) $.Deferred(func)
接受一个 function 参数，function 里边可以使用 this 来调用当前的 deferred 对象

(2) deferred.done(fn)
添加【成功】时调用的回调函数

(3) deferred.fail(fn)
添加【失败】时调用的回调方法

(4) deferred.progress(fn)
添加【处理中】调用的回调方法

(5) deferred.resolve/resolveWith([context], args)
在任务处理【成功】之后使用此方法触发【成功】事件，之前加入done队列的回调会被触发

(6) deferred.reject/rejectWith([context], args)
在任务处理【失败】之后使用此方法触发【失败】事件，之前加入fail队列的回调会被触发

(7) deferred.notify/notifyWith([context], args)
在任务【处理中】可以使用此方法触发【处理中】事件，之前加入progress队列的回调会被触发

(8) deferred.promise()
简单理解就是生成一个跟deferred一样的对象，但是无法在外部用resolve等去修改当前任务状态

(9) deferred.then(fnDone, fnFail, fnProgress)
可以直接传入三个回调函数，分别对应done|fail|progress三个状态的回调

可以指定 3 种回调函数，相当于这种写法的快捷方式：
deferred.done(fnDone).fail(fnFail).progress(fnProgress)

(10) deferred.always(fn)
添加回调方法 fn，不管【成功】还是【失败】，都会触发 fn 方法
*/
jQuery.extend({
    /*
    ① 延迟对象 deferred 有 3 种状态：成功 | 失败 | 处理中
    ② 3 个 $.Callbacks 管理器，分别管理以上 3 种状态的回调队列
    */
	Deferred: function( func ) {
		var tuples = [
				// action, add listener, listener list, final state
				[ "resolve", "done", jQuery.Callbacks("once memory"), "resolved" ],
				[ "reject", "fail", jQuery.Callbacks("once memory"), "rejected" ],
				[ "notify", "progress", jQuery.Callbacks("memory") ]
			],
            // 初始状态
			state = "pending",
			promise = {
                // 返回当前状态
				state: function() {
					return state;
				},
                // 不管是 done 还是 fail 都会执行的任务
				always: function() {
					deferred.done( arguments ).fail( arguments );
					return this;
				},
                // deferred.done(fnDone).fail(fnFail).progress(fnProgress)的快捷方式
                // then 就是很单纯的一个方法，之所以写得比较复杂，是因为 pipe 方法比较复杂
                /*
                看看 pipe 方法怎么用：
                ① pipe 返回值不是 Deferred 实例，比如字符串
                var dfd = $.Deferred();

                setTimeout(function(){
                    dfd.resolve('hi');
                },3000);

                var newDfd = dfd.pipe(function(){
                    return arguments[0] + '妙味';
                });

                newDfd.done(function(){
                    alert(arguments[0])
                });

                // 3 秒后弹出 ‘hi妙味’。

                这里 pipe 和 then 一样，第一个函数参数，是【成功】的回调函数，
                另外，返回值 arguments[0] + '妙味' 作为 newDfd 【成功】的回调函数的实参。

                也就是说 【dfd.resolve('hi')】 触发 【function(){return arguments[0] + '妙味';}】
                【arguments[0] + '妙味'】 作为 【function(){alert(arguments[0])}】 的实参

                ② pipe 返回值是 Deferred 实例
                var dfd = $.Deferred();

                setTimeout(function(){
                    dfd.resolve('hi');
                },3000);

                var newDfd = dfd.pipe(function(){
                    return dfd;
                });

                newDfd.done(function(){
                    alert(arguments[0])
                });

                3 秒后弹出 ‘hi’
                */
				then: function( /* fnDone, fnFail, fnProgress */ ) {
					var fns = arguments;
                    /*
                    return jQuery.Deferred(function(newDefer){}).promise();
                    
                    $.Deferred(func) 这种形式：
                    执行函数 func，this 和实参都为 deferred，并且返回 Deferred 实例对象

                    then/pipe 最后返回的是一个 promise 对象

                    【关键】 经过调试分析，jQuery.Deferred(function(newDefer){}) 返回的就是 newDefer
                    jQuery.Deferred(function(newDefer){}).promise() 即 newDefer.newDefer

                    简化一下 jQuery.Deferred 方法：
                    jQuery.extend({
	                    Deferred: function( func ) {
                            deferred = {};
                            promise.promise( deferred ); // 继承
                            if ( func ) {
                                func.call( deferred, deferred );
                            }
                            return deferred;
                        }
                    });

                    这里看到很明显，func 的实参 deferred，就是 jQuery.Deferred 最终返回的 deferred

                    */
					return jQuery.Deferred(function( newDefer ) {
						jQuery.each( tuples, function( i, tuple ) {
                            // action = "resolve" | "reject" | "notify"
							var action = tuple[ 0 ],
                                // 参数如果是函数，就返回该函数，否则返回 false
                                // 参数是 done、fail、progress 的回调方法
								fn = jQuery.isFunction( fns[ i ] ) && fns[ i ];

							// deferred[ done | fail | progress ] for forwarding actions to newDefer
                            // 依次把函数加入回调队列
                            // 这一块之所以写的这么复杂是因为 then 方法 和 pipe 方法公用代码
                            // 以下这种写法主要是为 pipe 写的
							deferred[ tuple[1] ](function() {
                                // fn 是函数，returned 就是函数返回值（可能是 undefined，也可能是其他）
                                // fn 不是函数，就是 false
								var returned = fn && fn.apply( this, arguments );
                                // 如果回调返回的是一个Deferred实例
								if ( returned && jQuery.isFunction( returned.promise ) ) {
									// 继续绑定事件
                                    returned.promise()
										.done( newDefer.resolve )
										.fail( newDefer.reject )
										.progress( newDefer.notify );
								} else {
                                    // 如果回调返回的是不是一个Deferred实例，则被当做args由XXXWith派发出去
									newDefer[ action + "With" ]( this === promise ? newDefer.promise() : this, fn ? [ returned ] : arguments );
								}
							});
                            /*
                            以上这段代码有点复杂，如果单纯的实现 then 方法，只需要这么写：
                            deferred[ tuple[1] ](function() {
								fn.apply( this, arguments );
							});

                            下面的 if - else 是为了实现 pipe 方法的：（参见上例）
                            ① 如果 returned 是个 Deferred 实例
                            var dfd = $.Deferred();

                            var newDfd = dfd.pipe(function(){
                                return dfd;
                            });

                            newDfd === dfd  // false
                            newDfd 是一个 promise 对象，而 dfd 是一个 deferred 对象

                            如果改成 
                            var newDfd = dfd.pipe(function(){
                                return $.Deferred();
                            });

                            其他跟上面例子一样，就不会弹出 ‘hi’ 了。

                            经过试验，newDfd === newDefer.promise() // true 
                            这很关键

                            ① 如果 returned 不是 Deferred 实例，比如字符串
                               会调用 newDefer[ "xxxWith" ](context,['hi妙味'])
                               即 fire 触发回调队列
                            */

						});
                        // 退出前手工设置null避免闭包造成的内存占用
						fns = null;
					}).promise();
				},
				// Get a promise for this deferred
				// If obj is provided, the promise aspect is added to the object
                // 有参数，参数就继承 promise
                // 没有参数，就返回 promise
                // 疑问，函数里的 promise 到底是指包含这个函数的 promise 对象，还是当前的 promise 属性？？
                /*
                做个试验：
                var promise = {
                        promise : function(){
                            console.log(typeof promise);
                        }
                    };
                promise.promise()
                // object 
                也就是说，函数里的 promise 指的是外层的对象，而不是里面的 promise 属性。确实应该这样，毕竟是属性，又不是函数名。
                
                var promise = {
                        promise : function promise(){
                            console.log(typeof promise);
                        }
                    };
                promise.promise()
                // function
                这样写，函数里的 promise 就是指当前函数了。
                 */
				promise: function( obj ) {
					return obj != null ? jQuery.extend( obj, promise ) : promise;
				}
			},
			deferred = {};

        /*
        理一理，promise 对象下有这些方法：
        state、always 、then、promise、pipe、done、fail、progress

        deferred 对象下有这些方法：
        resolve、reject、notify

        promise.promise( deferred ); 
        这句使得 deferred 继承 promise，即 promise 的方法全复制给 deferred

        所以，deferred 比 promise 多 resolve、reject、notify 等三个方法
        而 resolve、reject 等方法是可以修改状态的，
        所以 promise 对象外部不可以修改状态，而 deferred 外部可以修改状态
        参考上面的【例子13】、【例子14】
         */

		// Keep pipe for back-compat
        // 两个方法共用一段代码
		promise.pipe = promise.then;

		// Add list-specific methods
		jQuery.each( tuples, function( i, tuple ) {
            // list = $.callbacks("once memory");
			var list = tuple[ 2 ],          // jQuery.Callbacks("once memory")
				stateString = tuple[ 3 ];   // "resolved" | "rejected" | undefined

			// promise[ done | fail | progress ] = list.add
            /* 
            promise[ "done" ] = $.Callbacks("once memory").add
            promise[ "fail" ] = $.Callbacks("once memory").add
            promise[ "progress" ] = $.Callbacks("memory").add
            */
			promise[ tuple[1] ] = list.add;

			// Handle state
            // i 只能为 0 或 1
            // 默认向 doneList、failList 添加 3 个回调函数
			if ( stateString ) {
				list.add(function() {
					// state = [ resolved | rejected ]
					state = stateString;

				/*
                异或 ^ : 两个二进制位不同返回 1，相同返回 0
                如： 0 ^ 3 -> (00) ^ (11) -> (00) -> 0
                     0 ^ 1 -> (00) ^ (01) -> 1
                     1 ^ 1 -> 0
                     2 ^ 1 -> (10) ^ (01) -> (11) -> 3
                */
                // [ reject_list | resolve_list ].disable; progress_list.lock
                }, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
			}

            /*
            相当于：
            doneList : [changeState, failList.disable, processList.lock]
            failList : [changeState, doneList.disable, processList.lock]

            ① changeState 改变状态的匿名函数，deferred的状态，分为三种：pending(初始状态), resolved(解决状态), rejected(拒绝状态)
            ② 不论deferred对象最终是resolve（还是reject），在首先改变对象状态之后，都会disable另一个函数列表failList(或者doneList)
            ③ 然后lock processList保持其状态，最后执行剩下的之前done（或者fail）进来的回调函数
            */

			// deferred[ resolve | reject | notify ]
            /*
            deferred[ "resolve" ] = function(){
                deferred[ "resolveWith" ](this === deferred ? promise : this, arguments );
                return this;
            }
            */
			deferred[ tuple[0] ] = function() {
				deferred[ tuple[0] + "With" ]( this === deferred ? promise : this, arguments );
				return this;
			};
			deferred[ tuple[0] + "With" ] = list.fireWith;
		});

		// Make the deferred a promise
		promise.promise( deferred );

		// Call given func if any
        /*
        $.Deferred(func) 这种形式：
        执行函数 func，this 和 参数都为 deferred

        换句话讲：$.Deferred() 接受一个 function 参数，function 里面
        可以用 this 来获取 deferred 对象
        */
		if ( func ) {
			func.call( deferred, deferred );
		}

		// All done!
		return deferred;
	},

    /*
    ① 延迟对象基本使用
    function aaa(){
        var dfd = $.Deferred();
        dfd.resolve();
        return dfd;
    }

    aaa().done(function(){
        alert('成功');
    });

    弹出 ‘成功’

    ② 两个延迟对象都完成才触发完成回调
    function aaa(){
        var dfd = $.Deferred();
        dfd.resolve();
        return dfd;
    }
    function bbb(){
        var dfd = $.Deferred();
        dfd.resolve();
        return dfd;
    }
    $.when(aaa(),bbb()).done(function(){
        alert('成功');
    });

    两个延迟对象都【成功】了，弹出 ‘成功’

    必须都成功，才会触发成功的回调函数；
    

    ③ 只要有一个失败，就会触发失败的回调
    function aaa(){
        var dfd = $.Deferred();
        dfd.resolve();
        return dfd;
    }
    function bbb(){
        var dfd = $.Deferred();
        dfd.reject();
        return dfd;
    }
    $.when(aaa(),bbb()).done(function(){
        alert('成功');
    }).fail(function(){
        alert('失败');
    });

    有一个延迟对象 bbb() 失败了,所以弹出 ’失败‘

    ④ $.when() 的参数如果不是延迟对象，那就相当于跳过该参数
    function aaa(){
        var dfd = $.Deferred();
        dfd.resolve();
        return dfd;
    }
    function bbb(){
        var dfd = $.Deferred();
        dfd.reject();
    }
    $.when(aaa(),bbb()).done(function(){
        alert('成功');
    }).fail(function(){
        alert('失败');
    });

    bbb() 没有返回延迟对象，于是只有 aaa() 延迟对象，弹出 ’成功‘
    
    ⑤ 如果参数都不是延迟对象，那都跳过
    $.when(123，456).done(function(){
        alert('成功');
    }).fail(function(){
        alert('失败');
    });

    $.when().done(function(){
        alert('成功');
    }).fail(function(){
        alert('失败');
    });

    以上都是弹出 ’成功‘

    ⑥ 如果参数不会延迟对象，会把参数传递给成功回调函数
    $.when(123,456).done(function(){
        console.log(arguments[0]);
        console.log(arguments[1]);
        alert('成功');
    }).fail(function(){
        alert('失败');
    });

    以上打印的 arguments[0]、arguments[1] 分别是 123 ，456

     */

	// Deferred helper
    // 延迟对象的辅助方法
    // $.when() 返回 deferred.promise();
	when: function( subordinate /* , ..., subordinateN */ ) {
		var i = 0,
			resolveValues = core_slice.call( arguments ),
			length = resolveValues.length,

			// the count of uncompleted subordinates
            // ① length 为 0，也就是没有参数时，remaining 为 0
            // ② length 为 1，也就是传 1 个参数，若参数是延迟对象，remaining 为 1，否则为 0
            // ③ length 大于 1，参数包括延迟对象和非延迟对象，remaining 为 length
			remaining = length !== 1 || ( subordinate && jQuery.isFunction( subordinate.promise ) ) ? length : 0,

			// the master Deferred. If resolveValues consist of only a single Deferred, just use that.
            // ① length 为 0，remaining 为 0，deferred 为 jQuery.Deferred()
            // ② length 为 1，有一个参数，若参数是延迟对象，deferred 为 subordinate，否则 deferred 为 jQuery.Deferred()
            // ③ length 大于 1，remaining 为 length 大于 1，deferred 为 jQuery.Deferred()
			deferred = remaining === 1 ? subordinate : jQuery.Deferred(),

			// Update function for both resolve and progress values
			updateFunc = function( i, contexts, values ) {
				return function( value ) {
					contexts[ i ] = this;
					values[ i ] = arguments.length > 1 ? core_slice.call( arguments ) : value;
					if( values === progressValues ) {
						deferred.notifyWith( contexts, values );
                    // remaining 为 0，即所有的延迟对象都【成功】了，触发 master Deferred 的 resolveWith
					} else if ( !( --remaining ) ) {
						deferred.resolveWith( contexts, values );
					}
				};
			},

			progressValues, progressContexts, resolveContexts;

		// add listeners to Deferred subordinates; treat others as resolved
		if ( length > 1 ) {
			progressValues = new Array( length );
			progressContexts = new Array( length );
			resolveContexts = new Array( length );
			for ( ; i < length; i++ ) {
                // 当前参数是延迟对象，【成功】或者【进行中】都调用函数 updateFunc
				if ( resolveValues[ i ] && jQuery.isFunction( resolveValues[ i ].promise ) ) {
					resolveValues[ i ].promise()
                        // done、fail、progress 等方法的参数应该是函数的定义，这里却是函数的执行
                        // 因为 updateFunc 函数返回值就是一个新的函数
						.done( updateFunc( i, resolveContexts, resolveValues ) )
						.fail( deferred.reject ) // 只要有一个延迟对象失败，master Deferred 就失败了
						.progress( updateFunc( i, progressContexts, progressValues ) );
                // 当前参数不是延迟对象，剩余延迟对象个数直接减 1
				} else {
					--remaining;
				}
			}
		}

		// if we're not waiting on anything, resolve the master
        // ① length 为 0，remaining 为 0，deferred 为 jQuery.Deferred()，触发 resolveWith，即触发 resolve
        // ② length 为 1，参数不为延迟对象，remaining 也是为 0，deferred 为 jQuery.Deferred()
        // resolveValues = core_slice.call( arguments )
		if ( !remaining ) {
			deferred.resolveWith( resolveContexts, resolveValues );
		}

		return deferred.promise();
	}
});


// 功能检测，并不修复兼容性
// 后面的 hooks 来修复兼容问题
/*
jQuery.support 值其实就是一个对象 {...}
在chrome下面用 for-in 循环把它的值打印出来
for(var attr in jQuery.support){
    console.log(attr +' : '+jQuery.support[attr]);
}
checkOn : true
optSelected : true
reliableMarginRight : true
boxSizingReliable : true
pixelPosition : true
noCloneChecked : true
optDisabled : true
radioValue : true
checkClone : true
focusinBubbles : false
clearCloneStyle : true
cors : true
ajax : true
boxSizing : true
 */
jQuery.support = (function( support ) {
	var input = document.createElement("input"),
		fragment = document.createDocumentFragment(),
		div = document.createElement("div"),
		select = document.createElement("select"),
		opt = select.appendChild( document.createElement("option") );

    /*
    appendChild 方法返回被添加的那个节点：eg:

    var select = document.createElement("select");
    var option =  document.createElement("option");
    var node = select.appendChild(option);
    option === node 
    // true
    */

	// Finish early in limited environments
    // 基本上所有浏览器 input.type 值都默认为 "text"，所以都不会在这里就返回
	if ( !input.type ) {
		return support;
	}

	input.type = "checkbox";

	// Support: Safari 5.1, iOS 5.1, Android 4.x, Android 2.3
	// Check the default checkbox/radio value ("" on old WebKit; "on" elsewhere)
    // checkbox 的值是否是 on
	support.checkOn = input.value !== "";

	// Must access the parent to make an option select properly
	// Support: IE9, IE10
    // 下拉菜单的第一个子项是否选中
	support.optSelected = opt.selected;

	// Will be defined later
    // 先写成这样，后面会改 
	support.reliableMarginRight = true;
	support.boxSizingReliable = true;
	support.pixelPosition = false;

	// Make sure checked status is properly cloned
	// Support: IE9, IE10
    // 复选框选中，克隆这个复选框，克隆节点是否也是选中
    /*
    cloneNode(deep) 方法创建节点的拷贝，并返回该副本。
    cloneNode(deep) 方法克隆所有属性以及它们的值。
    如果您需要克隆所有后代，请把 deep 参数设置 true，否则设置为 false。
    返回值是被克隆的节点
    */
	input.checked = true;
	support.noCloneChecked = input.cloneNode( true ).checked;

	// Make sure that the options inside disabled selects aren't marked as disabled
	// (WebKit marks them as disabled)
	select.disabled = true;
	support.optDisabled = !opt.disabled;

	// Check if an input maintains its value after becoming a radio
	// Support: IE9, IE10
    // input 变成 radio 后是否保持原来的 value
	input = document.createElement("input");
	input.value = "t";
	input.type = "radio";
	support.radioValue = input.value === "t";

	// #11217 - WebKit loses check when the name is after the checked attribute
	input.setAttribute( "checked", "t" );
	input.setAttribute( "name", "t" );

	fragment.appendChild( input );

	// Support: Safari 5.1, Android 4.x, Android 2.3
	// old WebKit doesn't clone checked state correctly in fragments
    // 旧的 WebKit，克隆 fragment 节点，如果该节点下有 input，那么 input 的 checkd 状态不会被复制
	support.checkClone = fragment.cloneNode( true ).cloneNode( true ).lastChild.checked;

	// Support: Firefox, Chrome, Safari
	// Beware of CSP restrictions (https://developer.mozilla.org/en/Security/CSP)
	support.focusinBubbles = "onfocusin" in window;

    /*
    background-clip: border-box|padding-box|content-box;
    background-clip 属性规定背景的绘制区域
    
    不光是这个属性，其他的背景属性，如 background-color 等都有这个问题
    eg:
    var div = document.createElement('div');
    div.style.backgroundColor = 'red';
    div.cloneNode(true).style.backgroundColor = '';
    console.log(div.style.backgroundColor);

    ie 浏览器返回空，也就是说，克隆一个节点后，给新节点背景属性赋值，源节点的背景属性也被修改了

    jquery 统一了这个问题
    eg:
    var div = $('<div>');
    div.css('backgroundColor','red');
    div.clone().css('backgroundColor','');
    console.log('div.css('backgroundColor',''));
    
    这样所有浏览器都返回 red
    */
	div.style.backgroundClip = "content-box";
	div.cloneNode( true ).style.backgroundClip = "";
	support.clearCloneStyle = div.style.backgroundClip === "content-box";

	// Run tests that need a body at doc ready
    // 剩下的检查需要在 dom 加载完成后来执行
	jQuery(function() {
		var container, marginDiv,
			// Support: Firefox, Android 2.3 (Prefixed box-sizing versions).
			divReset = "padding:0;margin:0;border:0;display:block;-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box",
			body = document.getElementsByTagName("body")[ 0 ];

		if ( !body ) {
			// Return for frameset docs that don't have a body
			return;
		}

		container = document.createElement("div");
		container.style.cssText = "border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px";
        // left 设置成 -9999px 是为了不让这个元素在可见范围里，影响页面功能
        // margin-top:1px 是 jQuery 老版本中检测其他属性用到的，这个版本用不上

		// Check box-sizing and margin behavior.
		body.appendChild( container ).appendChild( div );
		div.innerHTML = "";
		// Support: Firefox, Android 2.3 (Prefixed box-sizing versions).
        // 怪异模式
		div.style.cssText = "-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%";

		// Workaround failing boxSizing test due to offsetWidth returning wrong value
		// with some non-1 values of body zoom, ticket #13543
        // zoom是放大页面的属性，等于1的时候，不放大也不缩小
		jQuery.swap( body, body.style.zoom != null ? { zoom: 1 } : {}, function() {
			support.boxSizing = div.offsetWidth === 4;
            // offsetWidth 包括 width + padding + border，怪异模式下就是 width
            // 怪异模式下，等于4，支持boxSizing，所有浏览器都支持
		});

		// Use window.getComputedStyle because jsdom on node.js will break without it.
		if ( window.getComputedStyle ) {
            // 当元素属性是百分数时，只有 Safari 返回百分数，其他浏览器都会返回像素值
			support.pixelPosition = ( window.getComputedStyle( div, null ) || {} ).top !== "1%";
			support.boxSizingReliable = ( window.getComputedStyle( div, null ) || { width: "4px" } ).width === "4px";
            // IE下，如果是怪异模式，width不等于4px，需要减去padding，border
            // 其他浏览器，width 都是 4px

			// Support: Android 2.3
			// Check if div with explicit width and no margin-right incorrectly
			// gets computed margin-right based on width of container. (#3333)
			// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
			marginDiv = div.appendChild( document.createElement("div") );
			marginDiv.style.cssText = div.style.cssText = divReset;
			marginDiv.style.marginRight = marginDiv.style.width = "0";
			div.style.width = "1px";

			support.reliableMarginRight =
				!parseFloat( ( window.getComputedStyle( marginDiv, null ) || {} ).marginRight );
		}

		body.removeChild( container );
	});

	return support;
})( {} );

/*
① attr 不合适设置大量数据
$('#div1').attr('name','hello');
$('#div1').attr('name')  // hello

相当于：

document.getElemntById('div1').setAttribute('name','hello');
document.getElemntById('div1').getAttribute('name'); // hello

② prop 不适合设置大量数据
$('#div1').prop('name','hello');
$('#div1').prop('name')  // hello

相当于：

document.getElemntById('div1').name = 'hello';
document.getElemntById('div1').name;  // hello

③ data 可以设置大量数据
$('#div1').data('name','hello');
$('#div1').data('name')  // hello

④ 内存泄漏
不用的内存应该回收，如果不用的变量不回收，就会导致内存泄漏。

js 中导致内存泄漏：

【dom 元素】和【对象】之间互相引用，大部分浏览器会出现内存泄漏

var oDiv = document.getElemntById('div1');
var obj = {};

oDiv.name = obj;
obj.age = oDiv;

$.('#div1').attr('name',obj);
如果 obj 的某个属性又引用了 #div，就会造成内存泄漏，

【不过 data 方法会优化这一点，不会造成内存泄漏】


 */

/*
	Implementation Summary

	1. Enforce API surface and semantic compatibility with 1.9.x branch
	2. Improve the module's maintainability by reducing the storage
		paths to a single mechanism.
	3. Use the same single mechanism to support "private" and "user" data.
	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
	5. Avoid exposing implementation details on user objects (eg. expando properties)
	6. Provide a clear path for implementation upgrade to WeakMap in 2014
*/
var data_user, data_priv,
    /*
    匹配 [xxx] 或 {xxx} 结尾
    eg:
    rbrace.exec('{123}')  ->  ["{123}", index: 0, input: "{123}"]
    rbrace.exec('sas{123}') -> ["{123}", index: 3, input: "sas{123}"]
    rbrace.exec('sas[123]') -> ["[123]", index: 3, input: "sas[123]"]
    */
	rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/,
	rmultiDash = /([A-Z])/g;

/*
① 一般情况下，对象的属性是可以随意修改的
var obj = {name:'hello'};
obj.name = 'hi';

console.log(obj.name);  // hi

② Object.preventExtensions/freeze 使得对象的属性不能修改
var obj = {name:'hello'};
Object.freeze(obj);
obj.name = 'hi';

console.log(obj.name);  // hello

③ Object.defineProperty
var obj = {name: 'hello'};

Object.defineProperty( obj, 0, {
    get: function() {
        return {};
    }
});

console.log(obj[0]);  // {}
obj[0] = 123;         
console.log(obj[0]);  // {}

这样就为 obj 对象添加了属性 0，这个属性只能获取，因为没有 set 方法，所以不能修改

get 或 set 不是必须成对出现，任写其一就可以。如果不设置方法，则get和set的默认值为undefined
当使用了 get 或 set 方法，不允许使用writable和value这两个属性

 */

function Data() {
	// Support: Android < 4,
	// Old WebKit does not have Object.preventExtensions/freeze method,
	// return new empty object instead with no [[set]] accessor
    /*
    Object.defineProperty(obj, prop, descriptor) 
    直接在一个对象上定义一个新属性，或者修改一个对象的现有属性，并返回这个对象。
    其中：
    obj：要在其上定义属性的对象
    prop：要定义或修改的属性的名称
    descriptor：将被定义或修改的属性描述符


    eg：
    ① 例：
    var obj = {};
    Object.defineProperty(obj, "key", {
      enumerable: false,
      configurable: false,
      writable: false, // 不可写
      value: "static"
    });
    obj.key
    // "static"

    obj.key = 'hello';
    obj.key
    // 还是 "static"，不能修改

    ② 例：
    function Archiver() {
      var temperature = null;
      var archive = [];

      Object.defineProperty(this, 'temperature', {
        get: function() {
          console.log('get!');
          return temperature;
        },
        set: function(value) {
          temperature = value;
          archive.push({ val: temperature });
        }
      });

      this.getArchive = function() { return archive; };
    }

    var arc = new Archiver();

    arc.temperature; // 打印 'get!'，返回 null
    arc.temperature === null // true

    arc.temperature = 11;
    arc.temperature = 13;
    arc.getArchive(); // [{ val: 11 }, { val: 13 }]
    */
	Object.defineProperty( this.cache = {}, 0, {
		get: function() {
			return {};
		}
	});
    /*
    var data = new Data();
    data.cache[0] // {}   这个属性只有 get 方法，所以不能设置
    data.expando  // "jQuery2030182001339212814580.7107637158134246"
    */

    // 重复的概率很小，忽略不计，当做唯一的
	this.expando = jQuery.expando + Math.random();
}

Data.uid = 1;

Data.accepts = function( owner ) {
	// Accepts only:
	//  - Node
	//    - Node.ELEMENT_NODE 1
	//    - Node.DOCUMENT_NODE 9
	//  - Object
	//    - Any
	return owner.nodeType ?
		owner.nodeType === 1 || owner.nodeType === 9 : true;
	/*
	 ① 如果有 nodeType 属性，nodeType 是 1 或 9，就返回 true，否则返回 false；
     ② 如果没有 nodeType 属性，直接返回 true。
	*/
};

Data.prototype = {
	/*
	作用：返回 owner 节点在 cache 中对于的属性名
    ① 如果节点 node1 对应 cache 的属性 1，即 cache[1]
    ② 如果 cache[1] 已经存在，那么再次给 node1 添加数据，就不会再创建新的 cache 属性了，直接在 cache[1] 下添加即可
	*/
	key: function( owner ) {
		// We can accept data for non-element nodes in modern browsers,
		// but we should not, see #8335.
		// Always return the key for a frozen object.
        // 节点类型不是 1 也不是 9，就直接返回 0
        /*
        cache 的结构大致如下：
        cache = {
            "0": { },
            "1": { // DOM节点1缓存数据，
                "name1": value1,
                "name2": value2
            },
            "2": { // DOM节点2缓存数据，
                "name1": value1,
                "name2": value2
            }
            // ......
        };
        cache[0] 是不可以修改的，剩下的 cache[1]、cache[2]... 是可以修改的

        这里返回的 key 值 0 ,就是 cache 的索引

        也就是所有不满足 owner.nodeType === 1 || owner.nodeType === 9 的节点都共用 cache[0] 这个只读空对象
         */

		if ( !Data.accepts( owner ) ) {
			return 0;
		}

		var descriptor = {},
			// Check if the owner object already has a cache key
            // 在 owner 节点上找 owner["jQuery2030182001339212814580.7107637158134246"] 属性，看是否存在
			unlock = owner[ this.expando ];

		// If not, create one
        // 正常情况下没有这个属性
		if ( !unlock ) {
			unlock = Data.uid++;

			// Secure it in a non-enumerable, non-writable property
			try {
                // 为 owner 节点添加只读的 jQuery2030182001339212814580.7107637158134246 属性
				descriptor[ this.expando ] = { value: unlock };
				Object.defineProperties( owner, descriptor );
                /*
                
                注意这里用的是 Object.defineProperties 而不是 Object.defineProperty
                Object.defineProperties( owner, descriptors )：可以同时给几个属性添加描述
                Object.defineProperty(obj, prop, descriptor)：给一个属性添加描述

                Object.defineProperties 的第二个参数示例：
                descriptors = {
                    jQuery2030182001339212814580.7107637158134246 : {value : 1},
                    jQuery2030182001339212814580.3427632463276477 : {value : 2},
                    jQuery2030182001339212814580.5498736534657347 : {value : 3}
                };

                jQuery2030182001339212814580.7107637158134246 相当于 prop；
                {value : 1} 相当于 descriptor

                其中：
                value: 设置属性的值
                writable: 值是否可以重写。默认是 false，不可以重写
                enumerable: 目标属性是否可以被枚举。默认是 false，不可以枚举
                configurable: 目标属性是否可以被删除或是否可以再次修改特性。默认是 false，不允许配置修改

                这里只写了 value 字段，其他没写的字段默认都是 false。
                所以说这个 jQuery2030182001339212814580.7107637158134246 属性是不可以改的。

                 */

			// Support: Android < 4
			// Fallback to a less secure definition
			} catch ( e ) {
				descriptor[ this.expando ] = unlock;
				jQuery.extend( owner, descriptor );
                /*
                这种写法 jQuery2030182001339212814580.7107637158134246 属性是可以改的。
                只是某些版本浏览器不支持以上写法，所以才采取这种方法退而求其次
                 */
			}
		}

		// Ensure the cache object
        // 在 cache 中开辟一块空间给属性 unlock
		if ( !this.cache[ unlock ] ) {
			this.cache[ unlock ] = {};
		}

		return unlock;
	},
	set: function( owner, data, value ) {
		var prop,
			// There may be an unlock assigned to this node,
			// if there is no entry for this "owner", create one inline
			// and set the unlock as though an owner entry had always existed
			unlock = this.key( owner ),
			cache = this.cache[ unlock ];

		// Handle: [ owner, key, value ] args
        /*
        对应这种形式：
        $.data(document.body,'age','27');
         */
		if ( typeof data === "string" ) {
			cache[ data ] = value;

		// Handle: [ owner, { properties } ] args
        /*
        对应这种形式：
        $.data(document.body,{'age':'27','job':it});
         */
		} else {
			// Fresh assignments by object are shallow copied
			if ( jQuery.isEmptyObject( cache ) ) {
				jQuery.extend( this.cache[ unlock ], data );
			// Otherwise, copy the properties one-by-one to the cache object
			} else {
				for ( prop in data ) {
					cache[ prop ] = data[ prop ];
				}
			}
		}
		return cache;
	},
	get: function( owner, key ) {
		// Either a valid cache is found, or will be created.
		// New caches will be created and the unlock returned,
		// allowing direct access to the newly created
		// empty data object. A valid owner object must be provided.
		var cache = this.cache[ this.key( owner ) ];

		return key === undefined ?
			cache : cache[ key ];
	},
	access: function( owner, key, value ) {
		var stored;
		// In cases where either:
		//
		//   1. No key was specified
		//   2. A string key was specified, but no value provided
		//
		// Take the "read" path and allow the get method to determine
		// which value to return, respectively either:
		//
		//   1. The entire cache object
		//   2. The data stored at the key
		//
		if ( key === undefined ||
				((key && typeof key === "string") && value === undefined) ) {

			stored = this.get( owner, key );

			return stored !== undefined ?
				stored : this.get( owner, jQuery.camelCase(key) );
		}

		// [*]When the key is not a string, or both a key and value
		// are specified, set or extend (existing objects) with either:
		//
		//   1. An object of properties
		//   2. A key and value
		//
		this.set( owner, key, value );

		// Since the "set" path can have two possible entry points
		// return the expected data based on which path was taken[*]
		return value !== undefined ? value : key;
	},
	remove: function( owner, key ) {
		var i, name, camel,
			unlock = this.key( owner ),
			cache = this.cache[ unlock ];

        // 没有指定看key值，那 owner 对应的所有的数据都清空
        // // 对应这种形式： $.removeData(document.body)
		if ( key === undefined ) {
			this.cache[ unlock ] = {};

		} else {
			// Support array or space separated string of keys
            // key 是数组
            // 对应这种形式： $.removeData(document.body,['age','job'])
			if ( jQuery.isArray( key ) ) {
				// If "name" is an array of keys...
				// When data is initially created, via ("key", "val") signature,
				// keys will be converted to camelCase.
				// Since there is no way to tell _how_ a key was added, remove
				// both plain key and camelCase key. #12786
				// This will only penalize the array argument path.
				name = key.concat( key.map( jQuery.camelCase ) );
			} else {
                // 转驼峰，如 all-name -> allName
				camel = jQuery.camelCase( key );
				// Try the string as a key before any manipulation
				if ( key in cache ) {
                    // all-name、allName 这种都要删除
					name = [ key, camel ];
				} else {
					// If a key with the spaces exists, use it.
					// Otherwise, create an array by matching non-whitespace
                    // 先转驼峰，转完驼峰还找不到，再去掉空格再找
					name = camel;
					name = name in cache ?
						[ name ] : ( name.match( core_rnotwhite ) || [] );
				}
			}

			i = name.length;
			while ( i-- ) {
				delete cache[ name[ i ] ];
			}
		}
	},
	hasData: function( owner ) {
		return !jQuery.isEmptyObject(
			this.cache[ owner[ this.expando ] ] || {}
		);
	},
	discard: function( owner ) {
		if ( owner[ this.expando ] ) {
			delete this.cache[ owner[ this.expando ] ];
		}
	}
};

// These may be used throughout the jQuery core codebase
data_user = new Data();
data_priv = new Data();

/*
每个节点的 dom[expando] 的值都设为一个自增的变量 id，保持全局唯一性。 
这个 id 的值就作为 cache 的 key 用来关联 DOM 节点和数据。
也就是说 cache[id] 就取到了这个节点上的所有缓存，
即id就好比是打开一个房间( DOM 节点)的钥匙。

例如：Body元素 expando：uid

jQuery203054840829130262140.37963378243148327: 3

先在 dom 元素上找到 expando 对应值，也就 uid，然后通过这个 uid 找到数据 cache 对象中的内容

所以cache对象结构应该像下面这样:

cache = {
    "uid1": { // DOM节点1缓存数据，
        "name1": value1,
        "name2": value2
    },
    "uid2": { // DOM节点2缓存数据，
        "name1": value1,
        "name2": value2
    }
    // ......
};


（1）存储数据 $("body").data('zx',520);

 ① 为了不让数据和 dom 直接关联，所以会把数据存储在一个 cache 对象上；
 ② 产生一个 unlock = Data.uid++ 的标记号；
 ③ 把 unlock 标记号，作为属性赋给 $("body") 对应的节点；
 ④ 在 cache 对象上以 unlock 为属性开辟新的空间用于存储 'zx' 数据

（2）获取数据 $("body").data('zx');

 ① 从 $("body") 节点上获取到 unlock 属性；
 ② 通过 unlock 在 cache 中获取到对应的数据 

*/

/*
① data 作为 jQuery 实例方法
var div1 = $("#div");
var div2 = $("#div");

div1.data('a',1111);
div2.data('a',2222);

div1.data('a'); // 2222
div2.data('a'); // 2222

② data 作为 jQuery 静态方法
var div1 = $("#div");
var div2 = $("#div");

$.data(div1,'b',1111);
$.data(div2,'b',2222);

$.data(div1,'b'); // 1111
$.data(div2,'b'); // 2222

③ 为对象附加数据
var obj = {};

$.data(obj, {
    name1: 'zx',
    name2: 'zc'
});

$.data(obj);
// {name1: "zx", name2: "zc"}

④ 为 dom 节点附加数据
var bd = $('body');

bd.data('foo',52);

bd.data('foo')
// 52


*/
jQuery.extend({
	acceptData: Data.accepts,

	hasData: function( elem ) {
		return data_user.hasData( elem ) || data_priv.hasData( elem );
	},

	data: function( elem, name, data ) {
		return data_user.access( elem, name, data );
	},

	removeData: function( elem, name ) {
		data_user.remove( elem, name );
	},

	// TODO: Now that all calls to _data and _removeData have been replaced
	// with direct calls to data_priv methods, these can be deprecated.
	_data: function( elem, name, data ) {
		return data_priv.access( elem, name, data );
	},

	_removeData: function( elem, name ) {
		data_priv.remove( elem, name );
	}
});

/*
jQuery 中有个常见的原则是：

对于 $() 选择到的一组 jQuery 实例元素：
如果后面跟的方法是设置操作，会遍历这一组元素，对每一个都进行设置；
如果后面跟的方法是获取操作，只会获取第一个元素的结果

eg:
<div id="div1">aaa</div>
<div>bbb</div>
<div>ccc</div>

a) $.('div').html('hello');
// 3 个 div 的内容都变成  hello 了

b) $.('div').html();
// 只返回第一个 div 的内容 aaa
 */
jQuery.fn.extend({
	data: function( key, value ) {
		var attrs, name,
			elem = this[ 0 ], // 一组元素里的第一个元素
			i = 0,
			data = null;

		// Gets all values
        /*
        eg : 
        $('#div1').data('name','hello');
        $('#div1').data('age',30);

        console.log($('#div1').data('name');  // hello
        console.log($('#div1').data();  // {name : "hello", age : 30}
         */
		if ( key === undefined ) {
			if ( this.length ) {
				data = data_user.get( elem );  // 第一个元素对于的所有数据

                /*
                html5 新属性 data-
                eg:
                <div id="div1" data-miaov="妙味">aaa</div>
                <div id="div2" data-miaov-all="全部妙味">bbb</div>

                $('#div1').get(0).dataset.miaov     // 妙味
                $('#div2').get(0).dataset.miaovAll  // 全部妙味

                这里的属性也能被 data() 方法找到：

                $('#div1').data('name','hello');
                $('#div1').data('age',30);

                console.log($('div1').data());
                // { name:'hello', age:30, miaov:'妙味'}

                如果通过 data 方法了属性 p 那就不会再取 data-p 这个同名的 h5 属性了(以 data 属性添加的为准)：
                $('#div1').data('name','hello');
                $('#div1').data('age',30);
                $('#div1').data('miaov','cool');

                console.log($('div1').data());
                // { name:'hello', age:30, miaov:'cool'}
                 */
                
                // 最开始没属性 hasDataAttrs，进入 if 语句
				if ( elem.nodeType === 1 && !data_priv.get( elem, "hasDataAttrs" ) ) {
					attrs = elem.attributes; 
                    /*
                    返回元素的所有属性组成的带 length 属性的比较复杂的对象，简单理解成这种：
                    attrs : {0: {name:id}, 1: {name:data-miaov-all}, length: 2}

                    eg: 
                    var pg = document.getElementById('page');
                    var attrs = pg.attributes;;
                    console.table(attrs)
                    打印出 attrs 我们看到挺复杂的对象
                     */ 
                    
                    // 把 data- 属性挑出来，加入到 cache 里
					for ( ; i < attrs.length; i++ ) {
						name = attrs[ i ].name;

						if ( name.indexOf( "data-" ) === 0 ) {
                            // data-miaov-allm -> miaovAll
							name = jQuery.camelCase( name.slice(5) );
                            // 把 data- 属性加入到 cache 中
                            // data[name] 存在是有可能的，data[name] 不存在就是 undefined
							dataAttr( elem, name, data[ name ] );
						}
					}
					data_priv.set( elem, "hasDataAttrs", true );
				}
			}

			return data;
		}

		// Sets multiple values
        /*
        $('div').data({name:'hello',age:30})  这种形式
         */
		if ( typeof key === "object" ) {
            // 对 $('div') 获取到的每一个 div 都进行设置操作
			return this.each(function() {
				data_user.set( this, key );
			});
		}

		return jQuery.access( this, function( value ) {
			var data,
				camelKey = jQuery.camelCase( key );

			// The calling jQuery object (element matches) is not empty
			// (and therefore has an element appears at this[ 0 ]) and the
			// `value` parameter was not undefined. An empty jQuery object
			// will result in `undefined` for elem = this[ 0 ] which will
			// throw an exception if an attempt to read a data cache is made.
            // 获取
			if ( elem && value === undefined ) {
				// Attempt to get data from the cache
				// with the key as-is
                // 找到了直接返回
				data = data_user.get( elem, key );
				if ( data !== undefined ) {
					return data;
				}

				// Attempt to get data from the cache
				// with the key camelized
                // 转驼峰，找到了直接返回
				data = data_user.get( elem, camelKey );
				if ( data !== undefined ) {
					return data;
				}

				// Attempt to "discover" the data in
				// HTML5 custom data-* attrs
                // 找 data- 属性，找到了就返回
				data = dataAttr( elem, camelKey, undefined );
				if ( data !== undefined ) {
					return data;
				}

				// We tried really hard, but the data doesn't exist.
				return;
			}

			// Set the data...
			this.each(function() {
                /*
                $('#div1').data('name-age','hello');
                在 cache 里会存为： nameAge:'hello'
                cache = {
                    1: {
                        'nameAge':'hello'
                    }
                }

                可是如果之前有一个 nameAge 属性，就另当别论：
                $('#div1').data('nameAge','hi');
                $('#div1').data('name-age','hello');
                那就会存为：
                cache = {
                    1: {
                        'nameAge':'hello',
                        'name-age':'hello'
                    }
                }
                都存为 hello
                 */
                
				// First, attempt to store a copy or reference of any
				// data that might've been store with a camelCased key.
				var data = data_user.get( this, camelKey );

				// For HTML5 data-* attribute interop, we have to
				// store property names with dashes in a camelCase form.
				// This might not apply to all properties...*
				data_user.set( this, camelKey, value );

				// *... In the case of properties that might _actually_
				// have dashes, we need to also store a copy of that
				// unchanged property.
				if ( key.indexOf("-") !== -1 && data !== undefined ) {
					data_user.set( this, key, value );
				}
			});
		}, null, value, arguments.length > 1, null, true );
        // arguments.length > 1 设置操作
        // arguments.length <= 1 获取操作
	},

	removeData: function( key ) {
		return this.each(function() {
			data_user.remove( this, key );
		});
	}
});

function dataAttr( elem, key, data ) {
	var name;

	// If nothing was found internally, try to fetch any
	// data from the HTML5 data-* attribute
    /*
    rmultiDash = /([A-Z])/g; 找大写字母

    如：
    dataAttr( elem, 'miaovAll', undefined )

    name = "data-" + 'miaovAll'.replace( rmultiDash, "-$1" ).toLowerCase()
    // "data-miaov-all"
     */ 
	if ( data === undefined && elem.nodeType === 1 ) {
		name = "data-" + key.replace( rmultiDash, "-$1" ).toLowerCase();
		data = elem.getAttribute( name );

        // 属性里的值一般是字符串，但是 cache 里存各种类型的值
		if ( typeof data === "string" ) {
			try {
				data = data === "true" ? true :
					data === "false" ? false :
					data === "null" ? null :
					// Only convert to a number if it doesn't change the string
                    // 字符串数字 -> 数字，如 '100' -> 100
					+data + "" === data ? +data :
                    // 字符串对象，转成真正的对象
					rbrace.test( data ) ? JSON.parse( data ) :
					data;

                    /*
                    rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/
                    匹配 [xxx] 或 {xxx} 结尾
                    eg:
                    rbrace.exec('{123}')  ->  ["{123}", index: 0, input: "{123}"]
                    rbrace.exec('sas{123}') -> ["{123}", index: 3, input: "sas{123}"]
                    rbrace.exec('sas[123]') -> ["[123]", index: 3, input: "sas[123]"]
                    
                    
                     */
			} catch( e ) {}

			// Make sure we set the data so it isn't changed later
			data_user.set( elem, key, data );
		} else {
			data = undefined;
		}
	}
	return data;
}

/*
① 入队，第三个参数必须是函数名
function aaa(){
    console.log(1);
}
function bbb(){
    console.log(2);
}
$.queue(document, 'q1', aaa);
$.queue(document, 'q1', bbb);

在 document 元素上建立名为 q1 的队列，然后把 aaa,bbb 方法分别加入到队列里

queue 方法只有2个参数，表示读取队列：

console.log($.queue(document, 'q1'));
// [aaa,bbb]

② 入队，第三个参数可以为函数组成的数组
$.queue(document, 'q1', [aaa,bbb]);

③ 出队
$.queue(document, 'q1', [aaa,bbb]);
$.dequeue(document, 'q1');
// 打印 1（取出函数 aaa，并且执行 aaa()）

$.dequeue(document, 'q1');
// 打印 2（执行 bbb()）

④ 实例方法，入队 出队
$(document).queue('q1',aaa);
$(document).queue('q1',bbb);

console.log($(document).queue('q1'));
// [aaa,bbb]

// 出队
$(document).dequeue('q1');  // aaa() -> 打印 1
$(document).dequeue('q1');  // bbb() -> 打印 2

⑤ 动画
#div1 { width:100px; height:100px; background:red; position:absolute;}

$('#div1').ckick(function(){
    $(this).animate({width:300},2000);  其实是调用 setInterval
    $(this).animate({height:300},2000); 其实是调用 setInterval
    $(this).animate({left:300},2000);   其实是调用 setInterval
}); 

先花 2 秒宽度变成 300px，然后花 2 秒高度变成 300px，最后花 2 秒向右移动 300px

一般情况下我们用以上 3 个定时器，不会按照顺序依次执行，肯定会串的，
而这里的动画确实做到了前一个动画执行完，才开始后一个动画，这种顺序性就是队列机制来保证的

⑥ 入队，出队，animate
$('#div1').ckick(function(){
    $(this).animate({width:300},2000).queue('fx',function(){
        $(this).dequeue(); // dequeue 方法没写实参，默认是 'fx'
    }).animate({left:300},2000);
}); 

这个动画队列内部使用的名字就是 fx，中间的入队函数的必须要调用 dequeue 出队，否则后面的动画不会执行。

以上写法相当于：

$('#div1').ckick(function(){
    $(this).animate({width:300},2000).queue('fx',function(next){
        next();
    }).animate({left:300},2000);
}); 

 */

jQuery.extend({
    // 入队，相当于数组的 push 方法
    /*
    这个方法既是 setter 又是 getter
    第一个参数是 dom 元素；
    第二个参数是队列名称；
    第三个参数是 function 或 数组

    若是三个参数，就是入队；若是两个参数，就是获取队列
    */
	queue: function( elem, type, data ) {
		var queue;

		if ( elem ) {
            // 默认的队列名称是 fx
			type = ( type || "fx" ) + "queue";
			queue = data_priv.get( elem, type );

			// Speed up dequeue by getting out quickly if this is just a lookup
			if ( data ) {
				if ( !queue || jQuery.isArray( data ) ) {
                    /*
                    一般情况下，第一次取不到队列属性（即 !queue 为 true）,会初始化一个队列 queue
                    
                    可是，为什么 data 是数组也走这里初始化队列呢？

                    $.queue(document, 'q1', aaa);
                    $.queue(document, 'q1', [bbb]);

                    console.log($.queue(document, 'q1'))
                    // [bbb]

                    这说明，如果第三个参数是数组时，不管队列在前面存了什么，都重新初始化
                     */
					queue = data_priv.access( elem, type, jQuery.makeArray(data) );
				} else {
					queue.push( data );
                    /*
                    queue 为什么是数组呢？

                    access 方法的最后一句是：
                    return value !== undefined ? value : key;

                    我们看到，这个 access 方法最后返回的就是 value，即这里的你 jQuery.makeArray(data)，当然是数组了
                     */
				}
			}
            // 如果是写 2 个参数，就没有上面的 push 等操作了，直接返回 queue
			return queue || [];
		}
	},
    // 出队，相当于数组的 shift 方法
    // 上边的例子中，我们出队时都是调用 dequeue 方法，每次需要出队，就主动调用一次 dequeue
    // 也就是说，上边出队多少次，我们就调用了多少次 dequeue 方法
    // 如果我们想要调用一次 dequeue，然后执行多次出队操作，就得靠下面的 next 方法
    // 也就是说，第一个方法调用时，主动调用一次 next 方法，就可以触发下一次出队了
    // 如果每个方法调用时，都主动触发 next 方法，那就把整个队列串起来了，整个队列执行一次 dequeue 就可以出队所有
	dequeue: function( elem, type ) {
		type = type || "fx";

		var queue = jQuery.queue( elem, type ),
            // queue 只有 2 个参数，返回队列 queue
			startLength = queue.length,
            // 队头的函数
			fn = queue.shift(),
			hooks = jQuery._queueHooks( elem, type ),
			next = function() {
				jQuery.dequeue( elem, type );
			};

		// If the fx queue is dequeued, always remove the progress sentinel
		if ( fn === "inprogress" ) {
			fn = queue.shift();
			startLength--;
		}

		if ( fn ) {

			// Add a progress sentinel to prevent the fx queue from being
			// automatically dequeued
			if ( type === "fx" ) {
                // 如果是队列名是 fx,把 inprogress 加入到队头
				queue.unshift( "inprogress" );
			}

			// clear up the last queue stop function
			delete hooks.stop;
			fn.call( elem, next, hooks );
            /*
            例：
            var body = $('body');
            function cb1(next,hoost) {
                console.log(11111)
                next()  
            }

            function cb2() {
                console.log(22222)
            }

            //set
            $.queue(body, 'aa', cb1); // 第三个参数为function
            $.queue(body, 'aa', cb2);

            $.dequeue(body, 'aa');
            // 依次打印 11111、22222
            */
		}

		if ( !startLength && hooks ) {
			hooks.empty.fire();
            // 清理缓存数据
		}
	},

	// not intended for public consumption - generates a queueHooks object, or returns the current one
    // 出队结束后，清除队列缓存数据
	_queueHooks: function( elem, type ) {
		var key = type + "queueHooks";
		return data_priv.get( elem, key ) || data_priv.access( elem, key, {
			empty: jQuery.Callbacks("once memory").add(function() {
				data_priv.remove( elem, [ type + "queue", key ] );
			})
		});
        /*
        access 方法进行设置的时候，返回的是第三个参数，所以：
        第一次进来，_queueHooks 函数的返回值是：
         {
			empty: jQuery.Callbacks("once memory").add(function() {
				data_priv.remove( elem, [ type + "queue", key ] );
		  }
          empty 是一个回调对象，并且添加了一个回调函数
          回调对象 fire 的时候把 type + "queue"、type + "queueHooks" 两个属性都删掉
        */
	}
});

jQuery.fn.extend({
	queue: function( type, data ) {
		var setter = 2;

		if ( typeof type !== "string" ) {
			data = type;
			type = "fx";
			setter--;
		}

		if ( arguments.length < setter ) {
            // 获取的时候，jQuery 的通常做法是获取第一项对应的值
			return jQuery.queue( this[0], type );
		}

		return data === undefined ?
			this :
            // 获取的时候，jQuery 的通常做法是队每一项分别进行设置
			this.each(function() {
				var queue = jQuery.queue( this, type, data );

				// ensure a hooks for this queue
				jQuery._queueHooks( this, type );

                /*
                
                $(this).animate({width:300},2000);
                $(this).animate({height:300},2000);
                $(this).animate({left:300},2000);

                这里的动画会依次执行，其实就是一个队列 fx

                为什么这里添加动画后就可以立即执行动画呢？
                其实，就是【入队】后马上进行【出队】

                也就是下面的，队列名为 fx，并且队头元素不是 inprogress，就出队

                然后每个 animate 方法触发 next 方法，就可以使得所有动画连续起来
                 */

				if ( type === "fx" && queue[0] !== "inprogress" ) {
					jQuery.dequeue( this, type );
				}
			});
	},
	dequeue: function( type ) {
		return this.each(function() {
			jQuery.dequeue( this, type );
		});
	},
	// Based off of the plugin by Clint Helfers, with permission.
	// http://blindsignals.com/index.php/2009/07/jquery-delay/
    /*
    ① 例1：
    $('#div1').click(function(){
        $(this).animate({width:300},2000).animate({left:300},2000);
    });

    点击 ID 为 div1 的元素后，其宽度先花 2 秒变成 300px，随后花 2 秒向右移动 300px

    ② 例2：
    $('#div1').click(function(){
        $(this).animate({width:300},2000).delay(2000).animate({left:300},2000);
    });

    点击 ID 为 div1 的元素后，其宽度先花 2 秒变成 300px，停顿 2 秒，然后再花 2 秒向右移动 300px


    jQuery.fx.speeds = {
        slow : 600,
        fast : 200,
        _default : 400
    };

    delay(slow) 是指把 fx 队列延迟 600 毫秒
     */
	delay: function( time, type ) {
		time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
		type = type || "fx";

        // 返回之前，入队一个方法，时间 time 后出队下一个方法
		return this.queue( type, function( next, hooks ) {
			var timeout = setTimeout( next, time );
			hooks.stop = function() {
				clearTimeout( timeout );
			};
            // 后面的 animate 方法中会调用 hooks.stop 方法
		});
	},
    // 清空队列，即把队列变成空数组
	clearQueue: function( type ) {
		return this.queue( type || "fx", [] );
	},
	// Get a promise resolved when queues of a certain type
	// are emptied (fx is the type by default)
    /*
    ① 例1：
    $('#div1').click(function(){
        $(this).animate({width:300},2000).animate({left:300},2000);
        $(this).promise().done(function(){
            alert(123);
        });
    });

    点击 ID 为 div1 的元素后，其宽度先花 2 秒变成 300px，随后花 2 秒向右移动 300px;
    最后，弹出 123
     */ 
	promise: function( type, obj ) {
		var tmp,
			count = 1,
			defer = jQuery.Deferred(),
			elements = this,
			i = this.length,
			resolve = function() {
				if ( !( --count ) ) {
					defer.resolveWith( elements, [ elements ] );
				}
			};

		if ( typeof type !== "string" ) {
			obj = type;
			type = undefined;
		}
		type = type || "fx";

		while( i-- ) {
            /*
            tmp = {
                empty: jQuery.Callbacks("once memory").add(function() {
                    data_priv.remove( elem, [ type + "queue", key ] );
                })
            }

            前边写 dequeue 方法最后会执行 hooks.empty.fire();
            也就是每次出队会调用这里的 resolve 方法
            等到 count 减到 0 时就会调用 defer.resolveWith( elements, [ elements ] )
             */
			tmp = data_priv.get( elements[ i ], type + "queueHooks" );
			if ( tmp && tmp.empty ) {
				count++;
				tmp.empty.add( resolve );
			}
		}
		resolve();
		return defer.promise( obj );
	}
});

/*
① attr()   获取匹配的元素集合中的第一个元素的属性的值 或 设置每一个匹配元素的一个或多个属性。
② prop() 获取匹配的元素集中第一个元素的属性（property）值 或 设置每一个匹配元素的一个或多个属性。
③ removeAttr() 为匹配的元素集合中的每个元素中移除一个属性（attribute）。
④ removeProp() 为集合中匹配的元素删除一个属性（property）。
⑤ val() 获取匹配的元素集合中第一个元素的当前值 或 设置匹配的元素集合中每个元素的值

那么 attribute 和 property 有什么区别呢？

例：
<input id="cbox" type="checkbox" checked="checked" />

$('input').attr('checked')   // checked
$('input').prop('checked')   // true

attr() 方法读取直接写在标签上的属性（attribute），可以通过 setAttribute、getAttribute 进行设置、读取
prop() 方法是通过 . 号来进行设置、读取的属性（property）

换个角度看：
var cbox = document.getElementById('cbox');

① 对应 attr 方法
cbox.getAttribute('checked')  // checked

② 对应 prop 方法
cbox['checked'] // true
cbox.checked    // true

③ 获取 id
$('input').attr('id')   // cbox
$('input').prop('id')   // cbox

cbox.getAttribute('id') // cbox
cbox.id                 // cbox
cbox['id']              // cbox

id 这种常见属性，两种方法返回值一样

④ 设置自定义属性

$('input').attr('miaov','妙味')
input 会变为：
<input id="cbox" miaov="妙味" type="checkbox" checked="checked" />

$('input').prop('miaov','妙味')
input 还是：
<input id="cbox" type="checkbox" checked="checked" /> 没显示出来 miaov 属性

这两种方法是有区别的，如果换成 id 等常见属性两者是一样的。

⑤ 获取自定义属性
假如有 input 标签如下：
<input id="cbox" miaov="妙味" type="checkbox" checked="checked" />

$('input').attr('miaov')   // 妙味
$('input').prop('miaov'）  // （获取不到值，大多数浏览器都返回空）

⑥ 删除属性
<input id="cbox" miaov="妙味" type="checkbox" checked="checked" />

$('input').removeAttr('id')   可以删除 id 属性
$('input').removeProp('id')   删除不了 id 属性


总的来说：
基本可以总结为 attribute 节点都是在 HTML 代码中可见的，
而 property 只是一个普通的名值对属性
*/
var nodeHook, boolHook,
    /*
    \t 水平制表（跳到下一个 Tab 位置）
    \r 回车，将当前位置移到本行开头
    \n 换行，将当前位置移到下一行开头
    \f 换页，将当前位置移到下页开头
    */
	rclass = /[\t\r\n\f]/g,
	rreturn = /\r/g,
	rfocusable = /^(?:input|select|textarea|button)$/i;

jQuery.fn.extend({
	attr: function( name, value ) {
        /*
        ① jQuery.access: function( elems, fn, key, value, chainable, emptyGet, raw ) {}

        其中：
        elems 是操作的对象
        fn 调用的方法
        key 设置/获取的属性名
        value 设置的属性值
        chainable 为 true 表示设置操作，false 表示获取操作
        
        emptyGet, raw 这些没传的参数都是 undefined

        ② 下文会定义 jQuery.attr 方法
        */
		return jQuery.access( this, jQuery.attr, name, value, arguments.length > 1 );
	},

	removeAttr: function( name ) {
		return this.each(function() {
			jQuery.removeAttr( this, name );
		});
	},

	prop: function( name, value ) {
		return jQuery.access( this, jQuery.prop, name, value, arguments.length > 1 );
	},

	removeProp: function( name ) {
		return this.each(function() {
            // prop 是对象的属性，可以直接通过 [] 或 . 运算符取到
			delete this[ jQuery.propFix[ name ] || name ];
		});
	},

    /*
    ① 参数为一个 class 名
    $( "p" ).last().addClass( "selected" );
    最后一个 p 标签加一个名为 selected 的 class

    ② 参数为多个 class 名
    $( "p:last" ).addClass( "selected highlight" );
    最后一个 p 标签加上 selected、highlight 等两个 class

    ③ 参数为函数 function
    $( "div" ).addClass(function( index, currentClass ) {
      var addedClass;
     
      if ( currentClass === "red" ) {
        addedClass = "green";
        $( "p" ).text( "There is one green div" );
      }
     
      return addedClass;
    });
    如果某个 div 有名为 red 的 class，那就给它再加一个名为 green 的 class  
    */
	addClass: function( value ) {
		var classes, elem, cur, clazz, j,
			i = 0,
			len = this.length,
			proceed = typeof value === "string" && value;
            /*
            ① 如果参数 value 是字符串，那么 proceed 就是这个字符串
            ② 如果参数 value 不是字符串，那么 proceed 就是 false
            */
    
        // 参数 value 是函数
        // value.call( this, j, this.className ) 会返回一个 class 名或者 undefined
		if ( jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				jQuery( this ).addClass( value.call( this, j, this.className ) );
			});
        }
        /*
        ① 这里的 this.each 中的 this 指的是当前 jQuery 实例对象；
        可是，jQuery( this ) 中的这个 this 又是指什么呢？

        那就先从 each 方法看起，这里的 each 是 jQuery 实例方法：
        each: function( callback, args ) {
            return jQuery.each( this, callback, args );
        }
        
        它会调用 jQuery 的静态方法 jQuery.each( this, callback, args );
        
        静态方法 jQuery.each，
        jQuery.each: function( obj, callback, args ){}
        第二个参数 callback 内部的 this 会绑定为第一个参数的属性 obj[i]（一般情况下是 obj[0]，是个原生 dom 元素）
        callback.apply( obj[ i ], args )

        所以不能写成：
        this.addClass( value.call( this, j, this.className ) );

        因为这里的 this 是原生 dom 元素

        ② value.call( this, j, this.className ) 中的 this.className 是指节点当前的 class

        ③ 那这里的 j 又是指什么？
        看这里： callback.apply( obj[ i ], args )，实参为 args，即 this.each 的第二个实参 undefined
        所以，运行时，j 就是 undefined
        */
		
        // 参数 value 是字符串
		if ( proceed ) {
			// The disjunction here is for better compressibility (see removeClass)
            /*
            匹配任意不是空白的字符：
            core_rnotwhite = /\S+/g
            
            eg:
            "selected highlight".match(/\S+/g)
            // ["selected", "highlight"]
            */
			classes = ( value || "" ).match( core_rnotwhite ) || [];

			for ( ; i < len; i++ ) {
				elem = this[ i ];
                /*
                \t 水平制表（跳到下一个 Tab 位置）
                \r 回车，将当前位置移到本行开头
                \n 换行，将当前位置移到下一行开头
                \f 换页，将当前位置移到下页开头

                rclass = /[\t\r\n\f]/g

                把节点原来的 class 名前后加上空格，方便添加新的 class 
                ( " " + 'cls' + " " ).replace( /[\t\r\n\f]/g, " " )
                // " cls "

                另外，如果原来就没有 class 
                ( " " + '' + " " ).replace( /[\t\r\n\f]/g, " " )
                // "  "
                */
				cur = elem.nodeType === 1 && ( elem.className ?
					( " " + elem.className + " " ).replace( rclass, " " ) :
					" "
				);

                /*
                原来没有 class 这里 cur 会为 true 吗？会！！
                !! "  "
                // true

                所以说，elem.nodeType === 1 并且参数 value 是字符串就会走这里
                */
                // 这里要求 cur 为真，其实是要求 elem.nodeType === 1，元素类型为标签节点
				if ( cur ) {
					j = 0;
                    // 遍历 classes 数组：["selected", "highlight"]
					while ( (clazz = classes[j++]) ) {
                        // < 0 就是原来没这个 class，那就把它加进来
                        // 前后有空格，很好的避免了新的 class 是原 class 字符串的子串的情况
						if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
							cur += clazz + " ";
						}
					}
                    // 最后，去掉前后空格
					elem.className = jQuery.trim( cur );
				}
			}
		}

		return this;
	},

    /*
    ① 参数为一个 class 名
    $( "p:even" ).removeClass( "blue" );
    索引为偶数（0,2,4...）的 p 标签删除名为 blue 的 class

    ② 参数为多个 class 名
    $( "p:odd" ).removeClass( "blue under" );
    索引为奇数（1,3,5...）的 p 标签删除名为 blue 和 under 的 class

    ③ 参数为空
    $( "p:eq(1)" ).removeClass();
    删去第 2 个 p 标签的所有 class

    ④ 参数为函数
    $( "li:last" ).removeClass(function() {
      return $( this ).prev().attr( "class" );
    });
    删除函数参数返回的 class
    */
	removeClass: function( value ) {
		var classes, elem, cur, clazz, j,
			i = 0,
			len = this.length,
			proceed = arguments.length === 0 || typeof value === "string" && value;
            /*
            注意：这里的 && 运算符优先级高于 || ，所以以上代码相当于：
            proceed = arguments.length === 0 || (typeof value === "string" && value);

            ① 如果不传参数，那么 proceed 就是 true，后面就会删除所有的 class
            ② 如果参数 value 不是空字符串，那么那么 proceed 就是 true，后面会删除对应的 class
               （这里有个另类：如果 value 是 ' '，typeof ' ' === "string" && ' ' -> ' '，
                后面的 ( value || "" ).match( core_rnotwhite ) 会过滤掉的）
            ③ 如果有参数，并且参数 value 不是字符串，那么 proceed 就是 false
            */

        // 参数为函数
        // value.call( this, j, this.className ) 会返回一个 class 名或者 undefined
		if ( jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				jQuery( this ).removeClass( value.call( this, j, this.className ) );
			});
		}

        // proceed 为真，说明
		if ( proceed ) {
            /*
            匹配任意不是空白的字符：
            core_rnotwhite = /\S+/g
            
            eg:
            "selected highlight".match(/\S+/g)
            // ["selected", "highlight"]
            */
			classes = ( value || "" ).match( core_rnotwhite ) || [];

			for ( ; i < len; i++ ) {
				elem = this[ i ];
				// This expression is here for better compressibility (see addClass)
                /*
                \t 水平制表（跳到下一个 Tab 位置）
                \r 回车，将当前位置移到本行开头
                \n 换行，将当前位置移到下一行开头
                \f 换页，将当前位置移到下页开头

                rclass = /[\t\r\n\f]/g

                把节点原来的 class 名前后加上空格，方便添加新的 class 
                ( " " + 'cls' + " " ).replace( /[\t\r\n\f]/g, " " )
                // " cls "

                另外，如果原来就没有 class 
                ( " " + '' + " " ).replace( /[\t\r\n\f]/g, " " )
                // "  "
                */
				cur = elem.nodeType === 1 && ( elem.className ?
					( " " + elem.className + " " ).replace( rclass, " " ) :
					""
				);
                
                // 如果 cur 不为真，说明 elem.nodeType !== 1 或者说原来就没有 class，那就没必要继续了
				if ( cur ) {
					j = 0;
					while ( (clazz = classes[j++]) ) {
						// Remove *all* instances
                        // class 存在，则删除之
						while ( cur.indexOf( " " + clazz + " " ) >= 0 ) {
							cur = cur.replace( " " + clazz + " ", " " );
						}
					}
                    // 如果不传参数 value，也就是 undefined，那就清空 class 
					elem.className = value ? jQuery.trim( cur ) : "";
				}
			}
		}

		return this;
	},

    /*
    ① 参数为字符串，添加/删除指定 class
    .toggleClass( className )
    className 指 1 个或多个被空格分隔的 class 名

    ② 第一个参数为字符串，第二个参数为布尔值
    .toggleClass( className, state )
    state 决定是添加还是删除 class

    ③ 第一个参数为函数，第二个参数布尔值可选
    .toggleClass( function [, state ] )
    function 的输入：(元素索引,旧的 class 值,参数状态)
    function 的输出：class 名
    */
	toggleClass: function( value, stateVal ) {
		var type = typeof value;

        // 如果第一个参数是字符串，并且第二个参数是布尔值
		if ( typeof stateVal === "boolean" && type === "string" ) {
            // 第二个参数为 stateVal 为 true 添加 class；stateVal 为 false 删除 class
			return stateVal ? this.addClass( value ) : this.removeClass( value );
		}

        /*
        如果第一个参数是函数，递归调用
        value.call(this, i, this.className, stateVal) 会返回一个 class 值
        */
		if ( jQuery.isFunction( value ) ) {
			return this.each(function( i ) {
				jQuery( this ).toggleClass( value.call(this, i, this.className, stateVal), stateVal );
			});
		}

		return this.each(function() {
            // 第一个参数为字符串，第二个参数不是布尔值，或者根本没有第二个参数
			if ( type === "string" ) {
				// toggle individual class names
				var className,
					i = 0,
					self = jQuery( this ),
					classNames = value.match( core_rnotwhite ) || [];
                /*
                    "selected highlight".match(/\S+/g)
                    // ["selected", "highlight"]
                */

				while ( (className = classNames[ i++ ]) ) {
					// check each className given, space separated list
                    // 遍历 ["selected", "highlight"] 数组
                    // 有这个 class 就删除之；没有这个 class 就加上
					if ( self.hasClass( className ) ) {
						self.removeClass( className );
					} else {
						self.addClass( className );
					}
				}

			// Toggle whole class name
            // 参数为【空】，或【undefined】或【布尔值】
			} else if ( type === core_strundefined || type === "boolean" ) {
                // 把原来的 class 存起来
				if ( this.className ) {
					// store className if set
					data_priv.set( this, "__className__", this.className );
				}

				// If the element has a class name or if we're passed "false",
				// then remove the whole classname (if there was one, the above saved it).
				// Otherwise bring back whatever was previously saved (if anything),
				// falling back to the empty string if nothing was stored.
                /*
                    ① 原来有 class 或者值为 false，清空 class
                    ② 否则就恢复原来的 class（把原来存的取出来）
                    ③ 如果本身就没有 class，那就没有存 class 这个操作，那从缓存也取不出来，就返回 ""）
                */
				this.className = this.className || value === false ? "" : data_priv.get( this, "__className__" ) || "";
			}
		});
	},

    // 判断是否含有名为 selector 的 class
    // 如果调用对象是一组元素，只要有一个元素包含这个 class 就返回 true
    /*
    为什么这里是 【如果调用对象是一组元素，只要有一个元素包含这个 class 就返回 true】？
    看一下 togglClass 片段就懂了：
    if ( self.hasClass( className ) ) {
        self.removeClass( className );
    } else {
        self.addClass( className );
    }
    如果 self 是一组元素，只要这一组元素里有一个元素包含 className 这个 class，
    那就对 self 这一组元素，都删去 className 这个 class

    所以，这么定义 hasClass 函数是有道理的
    */
	hasClass: function( selector ) {
        // selector 前后加空格是为了避免 selector 是原来 className 子串的情况
		var className = " " + selector + " ",
			i = 0,
			l = this.length;
		for ( ; i < l; i++ ) {
            /*
                rclass = /[\t\r\n\f]/g

                把节点原来的 class 名前后加上空格，方便添加新的 class 
                ( " " + 'cls' + " " ).replace( /[\t\r\n\f]/g, " " )
                // " cls "

                另外，如果原来就没有 class 
                ( " " + '' + " " ).replace( /[\t\r\n\f]/g, " " )
                // "  "
            */
            // 遍历一组元素，只要有一个元素找到了，就返回 true
			if ( this[i].nodeType === 1 && (" " + this[i].className + " ").replace(rclass, " ").indexOf( className ) >= 0 ) {
				return true;
			}
		}

		return false;
	},

    /*
    ① 参数为空
    获取选择器匹配到的第一个元素的 value 值
    
    ② 一个参数（字符串 | 数字 | 数组）
    为选择器匹配到的每一个元素设置 value 值
    
    ③ 一个参数（函数）
    输入：（元素索引值，旧的 value）
    输出：待设置的新的 value
    */
	val: function( value ) {
		var hooks, ret, isFunction,
			elem = this[0];

        // 参数为空，获取 value
		if ( !arguments.length ) {
			if ( elem ) {
                /*
                valHooks: {
                    option: {
                        get: function( elem ) {}
                    },
                    select: {
                        get: function( elem ) {},
                        set: function( elem, value ) {}
                    }
                }
                （其实除了这个字面定义，后面还有动态添加 radio、chechbox 等标签）

                ① elem.type
                一般元素的 type 是 undefined，如 
                $('div')[0].type    // undefined
                也有元素有 type 属性：
                $('button')[0].type // button
                
                ② elem.nodeName.toLowerCase()
                <select id="multiple" multiple="multiple">
                    <option selected="selected">Multiple</option>
                    <option>Multiple2</option>
                    <option selected="selected">Multiple3</option>
                </select>
                
                这里的 select、option 标签就需要钩子做兼容
                */
				hooks = jQuery.valHooks[ elem.type ] || jQuery.valHooks[ elem.nodeName.toLowerCase() ];

                // 部分需要兼容 select、option 的元素在这里取完就返回了
				if ( hooks && "get" in hooks && (ret = hooks.get( elem, "value" )) !== undefined ) {
					return ret;
				}

				ret = elem.value;
                
                /*
                rreturn = /\r/g;
                */
				return typeof ret === "string" ?
					// handle most common string cases
                    // 去掉字符串中的回车，然后返回字符串
					ret.replace(rreturn, "") :
					// handle cases where value is null/undef or number
                    // null | undefined 返回 ""，数字等其他类型，直接返回
					ret == null ? "" : ret;
			}

			return;
		}

		isFunction = jQuery.isFunction( value );

		return this.each(function( i ) {
			var val;

            // 不是元素类型，直接返回
			if ( this.nodeType !== 1 ) {
				return;
			}

            // 参数是函数
			if ( isFunction ) {
                // 得到一个新的 value 值，其中 jQuery( this ).val()  是原来的 value 值
				val = value.call( this, i, jQuery( this ).val() );
			} else {
				val = value;
			}

			// Treat null/undefined as ""; convert numbers to string
            // undefined | null -> ""
			if ( val == null ) {
				val = "";
            // 数字转化为字符串
			} else if ( typeof val === "number" ) {
				val += "";
            // 对数组的每一项转成字符串
			} else if ( jQuery.isArray( val ) ) {
				val = jQuery.map(val, function ( value ) {
                    // 根据 jQuery.map 方法的定义，这里的 value 是数组的元素，而不是元素索引
					return value == null ? "" : value + "";
				});
                /*
                val = [null,23,'232','abc']
                -> var = ["", "23", "232", "abc"]
                */
			}
            // 至此，已经把需要设置的 val 修正完毕
            
            // select、radio、checkbox 等标签需要钩子做兼容
			hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

			// If set returns undefined, fall back to normal setting
			if ( !hooks || !("set" in hooks) || hooks.set( this, val, "value" ) === undefined ) {
                /*
                相当于：

                if (hooks){
                    if ("set" in hooks){
                        if (hooks.set( this, val, "value" ) === undefined){
                            this.value = val;
                        }
                    } else {
                        this.value = val;
                    }
                } else {
                    this.value = val;
                }

                没有用钩子兼容情况，就在这里直接赋值
                 */
				this.value = val;
			}
		});
	}
});

/*
举例说明一下钩子机制：

① 不用钩子机制，要写很多 if-else

// 考生分数以及父亲名
function examinee(name, score, fatherName) {
    return {
        name: name,
        score: score,
        fatherName: fatherName
    };
}
  
// 审阅考生们
function judge(examinees) {
    var result = {};
    for (var i in examinees) {
        var curExaminee = examinees[i];
        var ret = curExaminee.score;
        // 判断是否有后门关系
        if (curExaminee.fatherName === 'xijingping') {
            ret += 1000;
        } else if (curExaminee.fatherName === 'ligang') {
            ret += 100;
        } else if (curExaminee.fatherName === 'pengdehuai') {
            ret += 50;
        }
        result[curExaminee.name] = ret;
    }
    return result;
}
  
  
var lihao = examinee("lihao", 10, 'ligang');
var xida = examinee('xida', 8, 'xijinping');
var peng = examinee('peng', 60, 'pengdehuai');
var liaoxiaofeng = examinee('liaoxiaofeng', 100, 'liaodaniu');
  
var result = judge([lihao, xida, peng, liaoxiaofeng]);
  
// 根据分数选取前三名
for (var name in result) {
    console.log("name:" + name);
    console.log("score:" + score);
}

② 运用钩子

// relationHook 是个钩子函数，用于得到关系得分
var relationHook = {
    "xijinping": 1000,   
    "ligang": 100,
    "pengdehuai": 50,
　　 // 新的考生只需要在钩子里添加关系分
}
 
// 考生分数以及父亲名
function examinee(name, score, fatherName) {
    return {
        name: name,
        score: score,
        fatherName: fatherName
    };
}
  
// 审阅考生们
function judge(examinees) {
    var result = {};
    for (var i in examinees) {
        var curExaminee = examinees[i];
        var ret = curExaminee.score;
        if (relationHook[curExaminee.fatherName] ) {
            ret += relationHook[curExaminee.fatherName] ;
        }
        result[curExaminee.name] = ret;
    }
    return result;
}
  
  
var lihao = examinee("lihao", 10, 'ligang');
var xida = examinee('xida', 8, 'xijinping');
var peng = examinee('peng', 60, 'pengdehuai');
var liaoxiaofeng = examinee('liaoxiaofeng', 100, 'liaodaniu');
  
var result = judge([lihao, xida, peng, liaoxiaofeng]);
  
// 根据分数选取前三名
for (var name in result) {
    console.log("name:" + name);
    console.log("score:" + score);
}

使用钩子去处理特殊情况，可以让代码的逻辑更加清晰，省去大量的条件判断，
上面的钩子机制的实现方式，采用的就是表驱动方式，
就是我们事先预定好一张表（俗称打表），用这张表去适配特殊情况。
 */

jQuery.extend({
	valHooks: {
		option: {
			get: function( elem ) {
				// attributes.value is undefined in Blackberry 4.7 but
				// uses .value. See #6932
				var val = elem.attributes.value;
				return !val || val.specified ? elem.value : elem.text;
                /*
                这里一开始，我想当然的以为上面的语句等价于：
                !val || (val.specified ? elem.value : elem.text);

                一旦 val 为 undefined，以上语句就会执行不通，报错

                其实，看一下运算符优先级：
                优先级5	逻辑或	从左到右	|| 
                优先级4	条件运算符	从右到左	? : 

                以上语句应该等价于：
                (!val || val.specified) ? elem.value : elem.text;
                ① 当 val 为 undefined 的时候，就返回 elem.value；
                ② 否则当 val.specified 为真，返回 elem.text

                eg: 
                ① 有明确的 value 属性，返回这个 value 属性：
                <option id="opt" value="hello">111</option>
                opt.value // hello
                ② 没有明确的 value 属性，返回文本属性
                <option id="opt">111</option>
                opt.value // 111
                */
			}
		},
        /*
        <select id="multiple" multiple="multiple">
            <option selected="selected">Multiple</option>
            <option>Multiple2</option>
            <option selected="selected">Multiple3</option>
        </select>
        */
		select: {
			get: function( elem ) {
				var value, option,
					options = elem.options,     //  [option, option, option, selectedIndex: 1]
					index = elem.selectedIndex, // 1
					one = elem.type === "select-one" || index < 0, // false 单选还是多选
					values = one ? null : [],  // [] 单选下拉的时候值只有一个，多选下拉值是一组
					max = one ? index + 1 : options.length, // 3
					i = index < 0 ?
						max :
						one ? index : 0; // 0

				// Loop through all the selected options
                // 遍历所有选中的 option
				for ( ; i < max; i++ ) {
					option = options[ i ];

					// IE6-9 doesn't update selected after form reset (#2551)
                    // 确保当前 option 被选中了
					if ( ( option.selected || i === index ) &&
							// Don't return options that are disabled or in a disabled optgroup
                            // 确保 option 没有 disabled，并且父节点也不能 disabled，父节点也不能是 optgroup
							( jQuery.support.optDisabled ? !option.disabled : option.getAttribute("disabled") === null ) &&
							( !option.parentNode.disabled || !jQuery.nodeName( option.parentNode, "optgroup" ) ) ) {

						// Get the specific value for the option
                        // 获取每一个 option 的 value
						value = jQuery( option ).val();

						// We don't need an array for one selects
						if ( one ) {
							return value;
						}

						// Multi-Selects return an array
                        // Multi-Selects 返回一个数组
						values.push( value );
					}
				}

				return values;
			},

            // value 和某个option 匹配上了，就选中了那个 option
			set: function( elem, value ) {
				var optionSet, option,
					options = elem.options,
					values = jQuery.makeArray( value ),
					i = options.length;

				while ( i-- ) {
					option = options[ i ];
                    /*
                    option.selected 的值被设为 true 或 false
                    如果某个 option 的值 jQuery(option).val() 就是我们要设置的 values 这个数组里
                    那么，这个 option.selected 就是 true
                    */
					if ( (option.selected = jQuery.inArray( jQuery(option).val(), values ) >= 0) ) {
						optionSet = true;
					}
				}

				// force browsers to behave consistently when non-matching value is set
                // 如果一个都没有匹配到，将 selectedIndex 强制改成 -1
				if ( !optionSet ) {
					elem.selectedIndex = -1;
				}
				return values;
			}
		}
	},

	attr: function( elem, name, value ) {
		var hooks, ret,
			nType = elem.nodeType;

		// don't get/set attributes on text, comment and attribute nodes
        // 节点不存在，或者节点类型是【文本】、【注释】、【属性】，那就返回，其实相当于返回 undefined
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		// Fallback to prop when attributes are not supported
        /*
        typeof elem.getAttribute === "undefined"
        如果节点不支持 getAttribute 方法，那就用 jQuery.prop 方法

        举个例子：
        $(document).attr('title','hello');
        这样是没用的，document 没有 getAttribute、setAttribute 等方法

        document.getAttribute // undefined
        document.setAttribute // undefined
         */
		if ( typeof elem.getAttribute === core_strundefined ) {
			return jQuery.prop( elem, name, value );
		}

		// All attributes are lowercase
		// Grab necessary hook if one is defined
        /*
        说一说 jQuery 中的 hooks 机制：

        先用 support 进行功能检测，然后定义一系列 hooks 方法进行兼容性修复，比如这里的 attrHooks 就是其中一种
        一般 attrHooks 这类方法会有多个属性，代表那几个属性有兼容性问题，这个属性如果有 get 子属性说明有获取兼容性问题
        这个属性如果有 set 子属性说明有设置兼容性问题。attrHooks 中没有的属性说明是正常的，那就不用管了。

        attrHooks: {
            type: {
                set: function( elem, value ) {}
            }
        }

        这里只有 type 属性和 set 子属性，说明 type 属性的设置（set）需要兼容

         */ 
        // 获取钩子方法，解决真的某种属性的【设置/获取】兼容问题
        // 类型不为元素节点，或者不是 xml 节点
		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
			name = name.toLowerCase();
			hooks = jQuery.attrHooks[ name ] ||
				( jQuery.expr.match.bool.test( name ) ? boolHook : nodeHook );
                // nodeHook 是 undefined
		}
        /*
        booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped";
        jQuery.expr.match.bool : new RegExp( "^(?:" + booleans + ")$", "i" );
        相当于：
        jQuery.expr.match.bool : /^(?:checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped)$/i
         
        boolHook = {
            set: function( elem, value, name ) {
                if ( value === false ) {
                    // Remove boolean attributes when set to false
                    jQuery.removeAttr( elem, name );
                } else {
                    elem.setAttribute( name, name );
                }
                return name;
            }
        };

        看例子：
        对于 <input type="checkbox" checked="checked">
        $('input').attr('checked') // checked
        $('input').prop('checked') // true

        $('input').attr('checked','checked') 这种写法当然是好的，
        但是 $('input').attr('checked',true) 会怎样呢？

        以上的 boolHook 是兼容这种写法的：
        $('input').attr('checked',true) 
        -> elem.setAttribute( name, name ) 
        -> input.setAttribute( 'checked', 'checked' )
        
         */

        // 有第三个参数，进行设置操作
		if ( value !== undefined ) {

            // 参数为 null，会删掉这个属性
			if ( value === null ) {
				jQuery.removeAttr( elem, name );

            // hooks 解决 set 有兼容性问题的属性，如 type 属性有 set 兼容问题
			} else if ( hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ) {
				return ret;
            // 没有兼容问题，就调用 setAttribute 就好了，这里还把待设置的值强制转换成字符串
			} else {
				elem.setAttribute( name, value + "" );
				return value;
			}
        // 没有第三个参数，进行读取操作，先看有没有需要有兼容问题
		} else if ( hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ) {
			return ret;
        // 没有兼容问题
		} else {
            // jQuery.find = Sizzle
            // Sizzle.attr() 已经实现了获取属性这个方法，这里直接用
			ret = jQuery.find.attr( elem, name );

			// Non-existent attributes return null, we normalize to undefined
			return ret == null ?
				undefined :
				ret;
		}
	},

	removeAttr: function( elem, value ) {
		var name, propName,
			i = 0,
			attrNames = value && value.match( core_rnotwhite );
        /*  
            var core_rnotwhite = /\S+/g;

            "selected highlight".match(/\S+/g)
            // ["selected", "highlight"]

            如果这里的 value 不是字符串，果断报错！
        */

        // 获取到了 attribute 名，并且是元素
		if ( attrNames && elem.nodeType === 1 ) {
			while ( (name = attrNames[i++]) ) {
                /*
                propFix: {
                    "for": "htmlFor",
                    "class": "className"
                }
                修正属性名，比如取一个元素的 class 应该是：
                elem['className'] 或 elem.className

                所以，这两种写法都可以删除 class
                ① $('#div1').removeAttr('class');
                ② $('#div1').removeAttr('className');
                */
				propName = jQuery.propFix[ name ] || name;

				// Boolean attributes get special treatment (#10870)
                /*
                jQuery.expr.match.bool : 
                /^(?:checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped)$/i
                
                这种值为布尔值的属性区别对待
                */
				if ( jQuery.expr.match.bool.test( name ) ) {
					// Set corresponding property to false
					elem[ propName ] = false;
				}
                
                // 一般情况下，直接调用原生的 removeAttribute 方法
				elem.removeAttribute( name );
			}
		}
	},

    /*
    说明 type 属性的 set 有兼容问题
    之前 support 里有检测到的问题 support.radioValue

    // Check if an input maintains its value after becoming a radio
    // Support: IE9, IE10
    // input 变成 radio 后是否保持原来的 value
    input = document.createElement("input");
    input.value = "t";
    input.type = "radio";
    support.radioValue = input.value === "t";

     */
	attrHooks: {
		type: {
			set: function( elem, value ) {
                // 有 support.radioValue 兼容性问题，并且要设置 input 元素的 type 为 radio
				if ( !jQuery.support.radioValue && value === "radio" && jQuery.nodeName(elem, "input") ) {
					// Setting the type on a radio button after the value resets the value in IE6-9
					// Reset value to default in case type is set after value during creation
					
                    // 先存下原来的 input.value 值
                    var val = elem.value;
                    // 设置 input.type = "radio";
					elem.setAttribute( "type", value );

                    // 如果原来是有 input.value 值，重新赋值回去，以免上边的操作修改了 value 属性值
					if ( val ) {
						elem.value = val;
					}
					return value;
				}
			}
		}
	},

    // 修正属性名，比如获取 class，应该是 elem.className
    
	propFix: {
		"for": "htmlFor",
		"class": "className"
	},
    /*
    后面还有兼容以下属性的小写形式：
    jQuery.each([
        "tabIndex",
        "readOnly",
        "maxLength",
        "cellSpacing",
        "cellPadding",
        "rowSpan",
        "colSpan",
        "useMap",
        "frameBorder",
        "contentEditable"
    ], function() {
        jQuery.propFix[ this.toLowerCase() ] = this;
    });
     */

	prop: function( elem, name, value ) {
		var ret, hooks, notxml,
			nType = elem.nodeType;

		// don't get/set properties on text, comment and attribute nodes
        // 文本，注释，属性等节点类型直接返回（undefined）
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

        // 不是 xml
		notxml = nType !== 1 || !jQuery.isXMLDoc( elem );

		if ( notxml ) {
			// Fix name and attach hooks
            /* 
            先修正属性名，然后去 hooks 里匹配
            propHooks: {
                tabIndex: {
                    get: function( elem ) {}
                }
            }
            */
			name = jQuery.propFix[ name ] || name;
			hooks = jQuery.propHooks[ name ];
		}
        
        // 设置 prop，一般情况下：elem[ name ] = value
		if ( value !== undefined ) {
			return hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ?
				ret :
				( elem[ name ] = value );
        // 获取 prop，一般情况下：elem[ name ]
		} else {
			return hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ?
				ret :
				elem[ name ];
		}
	},

    /*
    下面写道：
    if ( !jQuery.support.optSelected ) {
        jQuery.propHooks.selected = {
            get: function( elem ) {
                var parent = elem.parentNode;
                if ( parent && parent.parentNode ) {
                    parent.parentNode.selectedIndex;
                }
                return null;
            }
        };
    }
    只要在获取option的selected的值时，先访问select.selectedIndex属性，就可以设置option.selected = true了。
    意思就是在访问option的selected属性时，先访问其父级select元素的selectedIndex属性，
    强迫浏览器计算option的selected属性，以得到正确的值。
    需要注意的是option元素的父元素不一定是select，也有可能是optgroup。
    这里是支持IE9+,所以option的parentNode是optgroup，optgroup的parentNode是select。
     */  
	propHooks: {
        // tab 键获取焦点顺序
		tabIndex: {
			get: function( elem ) {
                /*
                rfocusable = /^(?:input|select|textarea|button)$/i;

                rfocusable.test('input') // true

                【input|select|textarea|button 等标签或带有 tabindex、href 等属性的元素】，取其 tabIndex 属性

                换个角度想：能获取焦点的，一定是用鼠标点击有效果的交互元素
                */
				return elem.hasAttribute( "tabindex" ) || rfocusable.test( elem.nodeName ) || elem.href ?
					elem.tabIndex :
					-1;
			}
		}
	}
});

// Hooks for boolean attributes
// 解决设置【值为布尔值的属性】的时候的兼容问题
boolHook = {
	set: function( elem, value, name ) {
		if ( value === false ) {
			// Remove boolean attributes when set to false
			jQuery.removeAttr( elem, name );
		} else {
			elem.setAttribute( name, name );
		}
		return name;
	}
};

/*
jQuery.expr.match.bool : /^(?:checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped)$/i
jQuery.expr.match.bool.source : "^(?:checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped)$"

typeof jQuery.expr.match.bool.source // "string"

jQuery.expr.match.bool.source.match( /\w+/g ) 
-> ["checked", "selected", "async", "autofocus", "autoplay", "controls", "defer", "disabled", "hidden", "ismap", "loop", "multiple", "open", "readonly", "required", "scoped"]
*/
jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function( i, name ) {
	var getter = jQuery.expr.attrHandle[ name ] || jQuery.find.attr;

    // 重新定义 jQuery.expr.attrHandle[ name ] 方法
	jQuery.expr.attrHandle[ name ] = function( elem, name, isXML ) {
		    // 暂存 jQuery.expr.attrHandle[ name ]
        var fn = jQuery.expr.attrHandle[ name ],
			ret = isXML ?
				undefined :
				/* jshint eqeqeq: false */
				// Temporarily disable this handler to check existence
                /*
                这里需要短暂的把 jQuery.expr.attrHandle[ name ] 方法置为 undefined，
                是因为 jQuery.find.attr 会调用 jQuery.expr.attrHandle[ name ]
                */
				(jQuery.expr.attrHandle[ name ] = undefined) !=
					getter( elem, name, isXML ) ?

					name.toLowerCase() :
					null;

		// Restore handler
        // 恢复 jQuery.expr.attrHandle[ name ]
		jQuery.expr.attrHandle[ name ] = fn;

		return ret;
	};
});

// Support: IE9+
// Selectedness for an option in an optgroup can be inaccurate
/*
ie 下创建一个 select 下拉菜单的时候，默认没有 option 子项选中的
其他浏览器默认第一个 option 是选中状态，所以，这里做一个兼容

上文有一个 propHooks.tabIndex 这里针对部分浏览器有 jQuery.propHooks.selected

只要在获取option的selected的值时，先访问select.selectedIndex属性，就可以设置option.selected = true了。
意思就是在访问option的selected属性时，先访问其父级select元素的selectedIndex属性，
强迫浏览器计算option的selected属性，以得到正确的值。
需要注意的是option元素的父元素不一定是select，也有可能是optgroup。
这里是支持IE9+,所以option的parentNode是optgroup，optgroup的parentNode是select。
 */
if ( !jQuery.support.optSelected ) {
	jQuery.propHooks.selected = {
		get: function( elem ) {
			var parent = elem.parentNode;
			if ( parent && parent.parentNode ) {
				parent.parentNode.selectedIndex;
			}
			return null;
		}
	};
}

// 兼容这些属性的小写形式
jQuery.each([
	"tabIndex",
	"readOnly",
	"maxLength",
	"cellSpacing",
	"cellPadding",
	"rowSpan",
	"colSpan",
	"useMap",
	"frameBorder",
	"contentEditable"
], function() {
	jQuery.propFix[ this.toLowerCase() ] = this;
});

// Radios and checkboxes getter/setter
// 兼容 radio、checkbox 的设置和获取
jQuery.each([ "radio", "checkbox" ], function() {
	jQuery.valHooks[ this ] = {
		set: function( elem, value ) {
            // 如果 value 值和【单选框|复选框】的值匹配上了，则选中该【单选框|复选框】
			if ( jQuery.isArray( value ) ) {
				return ( elem.checked = jQuery.inArray( jQuery(elem).val(), value ) >= 0 );
			}
		}
	};
	if ( !jQuery.support.checkOn ) {
		jQuery.valHooks[ this ].get = function( elem ) {
			// Support: Webkit
			// "" is returned instead of "on" if a value isn't specified
            // 对于 radio 、 checkbox 大多数的默认值是 on，老版本的 webkit 的默认值却为 null
			return elem.getAttribute("value") === null ? "on" : elem.value;
		};
	}
});



var rkeyEvent = /^key/,
	rmouseEvent = /^(?:mouse|contextmenu)|click/,
	rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
	rtypenamespace = /^([^.]*)(?:\.(.+)|)$/;

function returnTrue() {
	return true;
}

function returnFalse() {
	return false;
}

function safeActiveElement() {
	try {
		return document.activeElement;
	} catch ( err ) { }
}

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
/*
事件绑定有多种方式，以 click 事件为例：

① $('#foo').click(function(){ })
② $('#foo').bind('click',function(){ })
③ $("foo").delegate("td", "click", function() { });
④ $("foo").on("click", "td", function() { });

以上 4 种方式，本质上一样，最后都是交给 on 方法处理的


on 方法流程如下：
elem.on('click','p',function(){});
-> jQuery.fn.on
-> jQuery.event.add         给选中元素注册事件处理程序
-> jQuery.event.dispatch    分派（执行）事件处理函数
-> jQuery.event.fix         修正 Event 对象
-> jQuery.event.handlers    组装事件处理器队列
-> 执行事件处理函数

jQuery 还做了以下工作：
（1）兼容问题处理
    ① 事件对象的获取兼容，IE的event在是在全局的window，标准的是event是事件源参数传入到回调函数中
    ② 目标对象的获取兼容，IE中采用srcElement，标准是target
    ③ relatedTarget只是对于mouseout、mouseover有用。在IE中分成了to和from两个Target变量，在mozilla中没有分开。为了保证兼容，采用relatedTarget统一起来
    ④ event的坐标位置兼容
    ...

（2）事件的存储优化
    jQuery并没有将事件处理函数直接绑定到DOM元素上，
    而是通过.data存储在缓存.data存储在缓存.cahce上，
    这里就是之前分析的贯穿整个体系的缓存系统了
    
    ① 声明绑定的时候：
    首先为DOM元素分配一个唯一ID，绑定的事件存储在
    .cahce[唯一ID][.expand ][ 'events' ]上，
    而events是个键-值映射对象，键就是事件类型，对应的值就是由事件处理函数组成的数组，
    最后在DOM元素上绑定（addEventListener/ attachEvent）一个事件处理函数eventHandle，
    这个过程由 jQuery.event.add 实现。
    
    ② 执行绑定的时候：
    当事件触发时eventHandle被执行，
    eventHandle再去$.cache中寻找曾经绑定的事件处理函数并执行，
    这个过程由 jQuery.event. trigger 和 jQuery.event.handle实现。

    ③ 事件销毁
    事件的销毁则由jQuery.event.remove 实现，
    remove对缓存$.cahce中存储的事件数组进行销毁，
    当缓存中的事件全部销毁时，
    调用removeEventListener/detachEvent销毁绑定在DOM元素上的事件处理函数eventHandle。

（3）事件处理器 jQuery.event.handlers
    针对【事件代理】和【原生事件】（例如"click"）绑定，区别对待：
    事件委托从队列头部推入，而普通事件绑定从尾部推入，
    通过记录delegateCount来划分，委托(delegate)绑定和普通绑定。

    这里的【事件代理】和【原生事件】这样理解：

    如果有一个表格有100个tr元素，每个都要绑定mouseover/mouseout事件，
    改成事件代理的方式，可以节省99次绑定，更何况它还能监听将来添加的tr元素。

    这种机制使用的是事件冒泡机制实现的，我们把事件处理函数绑定在tr的父元素上，
    然后再tr上面触发的事件会冒泡到tr的父元素，因此父元素就可以触发这个事件处理函数，
    在事件处理函数中就可以通过这个event获取到事件源，然后对事件源tr进行处理。

    使用事件代理时，最好是绑定目标元素的父元素，
    因为绑定document的话，在IE下有时还是会失灵。

    不过，这样需要对一些不冒泡的事件做一些处理，
    比如一些表单事件，有的只冒泡到form，有的冒泡到document，有的压根不冒泡。

    对于focus，blur，change，submit，reset，select等
    不会冒泡的事件（有些浏览器支持，有些不支持），
    在标准浏览器下，我们可以设置addEventListener的最后一个参数为true（捕获）就行了，
    因为捕获操作的话，事件会从document到事件源，这时就能使用事件代理机制了。
    IE就比较麻烦了，要用focusin代替focus，focusout代替blur，selectstart代替select。
    change，submit，reset就复杂了，必须用其他事件来模拟，还要判断事件源的类型，
    selectedIndex，keyCode等相关属性。
    
    这个课题被一个叫reglib的库搞定了。
    jQuery就是吸取了reglib的经验，兼容了各种事件。
*/

/*
例：
dom 结构：
<div id="div1">
    <div id="div2">
        <p id="p1">
            <a href="#" id="a1">a标签</a>
        </p>
    </div>
</div>

监听代码：
$('#div1').on('click',function(){
    console.log('div1')
});
$('#div2').on('click',function(){
    console.log('div2')
});
$('#div2').on('click','p,a',function(e){
    console.log(e.currentTarget.nodeName)
});
$('#p1').on('click',function(){
    console.log('p1')
});

点击 a 标签后，打印内容以及顺序如下：
p1 -> A -> P -> div2 -> div1

点击 p 标签后，打印内容以及顺序如下：
p1 -> P -> div2 -> div1

点击 div2 标签后，打印内容以及顺序如下：
div2 -> div1

点击 div1 标签后，打印内容以及顺序如下：
div1

关于事件顺序可以看到：
p 本身绑了事件，还委派给了 div2 
① 当 div2 上事件触发时，先处理委派 p 的方法，然后再处理 div2 本身的回调方法。
② p 自身的回调方法先执行，再执行委派在 div2 上的回调方法。

以上顺序其实就是事件冒泡顺序，从事件源目标元素也就是 event.target 指定的元素，
一直往上冒泡到 document 或者 body，途经的元素上如果有对应的事件都会被依次触发。

这句总结很关键，是理解后面 jQuery.event.handlers 方法的关键。
*/
jQuery.event = {

	global: {},

    /*
    .on 方法最后会调用：
    jQuery.event.add( this, types, fn, data, selector )
    */
	add: function( elem, types, handler, data, selector ) {

		var handleObjIn, eventHandle, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = data_priv.get( elem );
        /*
        这里 get 方法没有第二个参数 key，那就把这个 elem 对应的所有的数据都取出来
        cache = {
            "0": { },
            "1": { // DOM节点1缓存数据，
                "name1": value1,
                "name2": value2
            },
            "2": { // DOM节点2缓存数据，
                "name1": value1,
                "name2": value2
            }
            // ......
        };

        这里的 elemData 是 cache 里一个属性（对象）。
        data_priv.get( elem ) 这个方法的作用是：
        ① 如果之前已经给这个 elem 缓存过数据，就返回对应的缓存对象；
        ② 如果之前没缓存过数据，那就新创建一个缓存对象，并作为返回值；

        通过分析 Data.prototype.get 源码，之所以有这个效果，其实是因为：
        Data.prototype.key 方法，这个方法执行时，如果 elem 没有缓存过数据，就新开辟一个 {}
        并返回这个 {} 在 cache 中对应的索引

        而 Data.prototype.get 方法中： cache = this.cache[ this.key( owner ) ]
        this.key( owner ) 创建一个新的 {}，并返回索引 n，
        于是，this.cache[n] 就可以找到这个 {} 了。

        所以，elemData 就是对这个 {} 的引用了，下面对 elemData 的操作就是对这个 {} 的操作！！
        所以，下面压根看不到对 elemData 的存储操作，不要觉得奇怪，因为【所改即所得】嘛！
        */

		// Don't attach events to noData or text/comment nodes (but allow plain objects)
        // elemData 必定是一个对象，如果是假，那肯定有问题了，赶紧返回！
		if ( !elemData ) {
			return;
		}

		// Caller can pass in an object of custom data in lieu of the handler
		/*
        ① 一般情况下 handler 就是一个回调函数 fn
        ② handler 还可以是一个json对象
        {
            handler:function(){处理函数},
            selector:执行上下文
         }
        */
        if ( handler.handler ) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
			selector = handleObjIn.selector;
		}

		// Make sure that the handler has a unique ID, used to find/remove it later
		// 给 handler 事件处理函数添加一个唯一的 id
        if ( !handler.guid ) {
			handler.guid = jQuery.guid++;
		}

		// Init the element's event structure and main handler, if this is the first
		// 如果 elemData 没有 events 属性，初始化一个空对象
        if ( !(events = elemData.events) ) {
			events = elemData.events = {};
		}

        /*
        如果 elemData 没有 handle 属性，把一个函数赋值给它
        这个 handle 属性指向一个函数，
        这个函数就是实际上绑定在 dom 节点上的唯一处理函数！这很重要！
        每次触发事件，实际只执行这一个函数，
        而这个函数封装了 dispatch 函数，最终分发给每一个实际处理函数。
        */
		if ( !(eventHandle = elemData.handle) ) {
			eventHandle = elemData.handle = function( e ) {
				// Discard the second event of a jQuery.event.trigger() and
				// when an event is called after a page has unloaded
                /*
                core_strundefined : "undefined"

                jQuery.event.triggered !== e.type 比较特殊

                在 trigger 方法执行元素的默认方法时，有三句：
                jQuery.event.triggered = type;
                elem[ type ](); // 这里的 type 就是指 submit，click 等元素默认事件方法
                jQuery.event.triggered = undefined;

                比如一些特殊元素有自己的默认方法，比如:
                form.submit()，button.click() 等
                
                按照 jQuery 事件处理流程，对于 click() 方法
                有参数时会触发 on 方法
                没有参数时会触发 trigger 方法

                而  trigger 方法又会遍历【该元素及其祖先元素】，
                然后依次在【该元素及其祖先元素】上调用 handle.apply( cur, data ) 
                而 handle 会调用 dispatch ，然后执行回调函数

                那么问题就来了，刚才执行默认事件之前已经把以上的冒泡过程执行了一遍

                所以，这次就不应该再执行了
                也就是当 jQuery.event.triggered === e.type 时，就不能再执行 dispatch 了

                等 click() 执行完了，又会重新赋值 jQuery.event.triggered = undefined 
                后面又可以用 handle 来调用 dispatch 了
                */
				return typeof jQuery !== core_strundefined && (!e || jQuery.event.triggered !== e.type) ?
					jQuery.event.dispatch.apply( eventHandle.elem, arguments ) :
					undefined;
			};
			// Add elem as a property of the handle fn to prevent a memory leak with IE non-native events
			eventHandle.elem = elem;
		}

		// Handle multiple events separated by a space
        /*
        core_rnotwhite = /\S+/g

        多个事件合在一个字符串里拆开：
        "click mouseover".match(/\S+/g) ->  ["click", "mouseover"]
        */
		types = ( types || "" ).match( core_rnotwhite ) || [""];
		t = types.length;
		while ( t-- ) {
            /*
            namespace 命名空间机制。该可以对事件进行更为精细的控制，
            开发人员可以指定特定空间的事件，删除特定命名空间的事件，
            以及触发特定命名空间的事件。

            rtypenamespace = /^([^.]*)(?:\.(.+)|)$/;
            匹配命名空间，把事件和它的命名空间区分开

            ① rtypenamespace.exec("keydown.myPlugin.plugin")
            -> ["keydown.myPlugin.plugin", "keydown", "myPlugin.plugin", index: 0, input: "keydown.myPlugin.plugin"]
            */
			tmp = rtypenamespace.exec( types[t] ) || [];
			type = origType = tmp[1];
            /*
            (1) type 事件：
            "keydown"

            (2) namespaces 命名空间组：
            "myPlugin.plugin".split( "." ).sort() -> ["myPlugin", "plugin"]
            */
			namespaces = ( tmp[2] || "" ).split( "." ).sort();

			// There *must* be a type, no attaching namespace-only handlers
            // type 为 undefined，跳出本次循环，不注册没事件名的事件
			if ( !type ) {
				continue;
			}

			// If event changes its type, use the special event handlers for the changed type
			special = jQuery.event.special[ type ] || {};
            /*
            special: {
                load: {
                    noBubble: true
                },
                click: {
                    trigger: function() {...},
                    _default: function( event ) {...}
                },
                focus: {
                    trigger: function() {},
                    delegateType: "focusin"
                }
                ...
            }
            不是所有的事件名可以直接使用的，有些事件名需要修正，比如 focus、blur
            */
			// If selector defined, determine special event api type, otherwise given type
			/*
            有 selector 表示是事件委托，比如：
            浏览器原生的focus事件不冒泡，所以用special来把type转变为'focusin'来模拟冒泡。
            */
            type = ( selector ? special.delegateType : special.bindType ) || type;

			// Update special based on newly reset type
            /*
            根据新的 type 修正 special，还是以 focus 为例：
            ① special = jQuery.event.special[ 'focus' ]
                special = {
                    trigger: function() {},
                    delegateType: "focusin"
                }
            ② 存在 selector 时，type = special.delegateType
            即：type = "focusin"
            ③ special = jQuery.event.special["focusin"]
                special =  {
                    setup: function, 
                    teardown: function
                }
            */
			special = jQuery.event.special[ type ] || {};

			// handleObj is passed to all event handlers
            /*
            根据上文，handleObjIn 可能是对象，也可能是 undefined
            jQuery.extend 如果有 2 个参数，那就第二个参数的属性复制给第一个参数
            这里确定是 2 个参数，只不过当第二个参数是 undefined 时，不会把 undefined 复制过去
            */
			handleObj = jQuery.extend({
				type: type, // 修正后的事件类型
				origType: origType, // 真正的事件类型
				data: data,
				handler: handler,
				guid: handler.guid,
				selector: selector,
				needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
				namespace: namespaces.join(".")
			}, handleObjIn );
            /*
            jQuery.expr.match.needsContext = /^[\x20\t\r\n\f]*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\([\x20\t\r\n\f]*((?:-\d)?\d*)[\x20\t\r\n\f]*\)|)(?=[^-]|$)/i
            handleObj.needsContext 表示：
            selector 存在并且有关系选择器或者伪类时值为 true

            这个 handleObj.needsContext 会决定在 jQuery.event.handlers 方法中
            是用 jQuery() 还是 jQuery.find() 方法来根据 selector 找当前元素（this）的子元素
            */

			// Init the event handler queue if we're the first
            /*
            上面写：
            events = elemData.events
            */
            /*
            ① 当前类型事件处理数组不存在的时候，就创建这个数组，并事件绑定
            elem.addEventListener( type, eventHandle, false );
            ② 每个新的类型过来都会绑定一次，例如 click ，mouseover 事件都会分别绑定
            ③ 同类型的事件过来就不走这里了，直接加到 handlers 里
            */
			if ( !(handlers = events[ type ]) ) {
				handlers = events[ type ] = [];
				handlers.delegateCount = 0;
                /*
                 handlers -> [delegateCount: 0]
                 handlers["delegateCount"] -> 0

                 handlers.delegateCount 为【事件代理】个数
                */
                

				// Only use addEventListener if the special events handler returns false
                /*
                ① 如果没有special.setup函数或者special.setup函数执行后返回false，则直接用addEventListener绑定事件。
                
                special.setup 中会调用
                document.addEventListener( orig, handler, true )
                注意第三个参数是 true，表示捕获事件，主要针对 focus/blur 等不支持冒泡的事件
                
                ② addEventListener注册的是什么？
                是eventHandle（eventHandle = elemData.handle），
                这是唯一注册在元素上的事件处理函数！
                它的作用就是执行dispatch，从而执行真正的事件处理函数（队列）！
                */
				if ( !special.setup || special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
					if ( elem.addEventListener ) {
                        /*
                        ① 绑定事件，注意这里的 useCapture 是 false，在冒泡阶段触发
                        ② 默认的触发循序是从事件源目标元素也就是 event.target 指定的元素，
                           一直往上冒泡到 document 或者 body，途经的元素上如果有对应的事件都会被依次触发。
                        */
						elem.addEventListener( type, eventHandle, false );
					}
				}
			}

            // 貌似所有的 special 都没有 add 方法 
			if ( special.add ) {
				special.add.call( elem, handleObj );

				if ( !handleObj.handler.guid ) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add to the element's handler list, delegates in front
            /*
            arrayObject.splice(index,howmany,item1,.....,itemX)
            其中：
            index: 规定添加/删除项目的位置，使用负数可从数组结尾处规定位置
            howmany: 要删除的项目数量。如果设置为 0，则不会删除项目
            item1,.....,itemX: 向数组添加的新项目。

            如果有selector，那么就是委托，委托是先处理的。
            委托排在handlers数组前面，插入到原有委托的最后面，在所有非委托前面（通过delegateCount）定位；
            不是委托就直接推入到整个数组最后。

            真正的事件处理函数怎么缓存的？
            处理函数以handler的属性存储在handleObj对象上，
            当然handleObj对象上还有其它属性以便执行阶段可以用到。

            前面有：
            elemData = data_priv.get( elem );
            events = elemData.events;
            handlers = events[ type ];
            */
			if ( selector ) {
				handlers.splice( handlers.delegateCount++, 0, handleObj );
			} else {
				handlers.push( handleObj );
			}
            /*
            总结一下：
            如果 type 这个事件从没出现过时，把eventHandle函数通过addEventListener注册到元素上。
            如果已经有handlers，那么说明eventHandle已经注册过，无需再次注册，
            把含有事件处理函数的对象handleObj推入到数组即可。
            
            每次绑定的核心就是把handleObj对象添加到事件类型type对应的events[type]上。
            */

			// Keep track of which events have ever been used, for event optimization
			jQuery.event.global[ type ] = true;
		}

		// Nullify elem to prevent memory leaks in IE
        // elem 置为 null，防止 ie 下内存泄漏
		elem = null;
	},
    /*
    add 方法的作用是：将所有参数合并成一个 handleObj 对象，并把这个对象放到缓存系统中。
    每个不同的事件类型都有一个处理函数数组 handlers，比如 click 事件有自己的 handlers，
    mouseover 事件也有自己的 handlers。

    对于同一个元素只会绑定一次事件处理函数 eventHandle ，所有的事件都由这个方法
    来分发，它会根据事件的类型来触发相应的事件处理函数。比如 click 事件发生了， 
    eventHandle 会执行 click 对应的 handlers 数组里的所有方法。
    
    ① elemData.handle
    eventHandle = elemData.handle = function( e ) {}
    调用了 jQuery.event.dispatch 函数来根据事件类型分发事件

    ② elemData.events
    elemData = data_priv.get( elem );
    events = elemData.events;
    handlers = events[ type ];

    elemData : {
        handle : function( e ) {},
        events : {
            click : [handleObj,handleObj,handleObj,...]
            mouseover : [handleObj,handleObj,handleObj,...]
            mousedown : [handleObj,handleObj,handleObj,...]
        }
    }

    elem 在缓存系统中的对应值是 elemData，它有 handle、events 等两个属性。

    handle 是一个回调函数，并且它有一个 elem 属性指向 elem 元素。比如，
    click 事件发生时，会触发 handle 函数，handle 函数执行 click 事件
    相应的 eventHandle 来执行 handlers 数组里的所有方法。

    events 是一个 json 对象，有 click、mouseover 等与多种事件对应的属性。
    这里每个属性有分别对应一个 handlers 数组。handlers.delegateCount 表示
    代理事件个数。

    总结一下 jQuery.event.add 函数：
    ① 如果没有为委托元素 elem 建立缓存，在调用 get 时创建缓存；
    ② 赋予 elemData.handle 一个匿名函数，调用 jQuery.event.dispatch 函数。
    ③ 往 elemData.events 对象添加不同事件类型的事件对象数组 [handleObj,handleObj..]。
    ④ 给 elem 绑定一个 type 类型的事件，触发时调用 elemData.handle。

    */

	// Detach an event or set of events from an element
    // 删除绑定在元素 elem 上的一个或一组事件
	remove: function( elem, types, handler, selector, mappedTypes ) {

		var j, origCount, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = data_priv.hasData( elem ) && data_priv.get( elem );

        // elemData 没数据或者没事件数据，直接返回
		if ( !elemData || !(events = elemData.events) ) {
			return;
		}

		// Once for each type.namespace in types; type may be omitted
        /*
        core_rnotwhite = /\S+/g

        "click mouseover".match(/\S+/g) ->  ["click", "mouseover"]
        */
        /*
        types = ( types || "" ).match( core_rnotwhite ) || [""]
        这句得注意一下：
        
        ① 先看 ( types || "" ).match( core_rnotwhite )
        如果 types 为 undefined，false，null等，就会是：
        "".match( core_rnotwhite ) -> null
        
        另外，如果 types 只是空格，换行，回车，换页等空白符，也返回 null 

        ② 当 ① 返回 null，则 types = [""]
        下面的注释很详细解释 types = [""] 会意味着什么
        */
		types = ( types || "" ).match( core_rnotwhite ) || [""];
		t = types.length;
		while ( t-- ) {
            /*
            rtypenamespace.exec("keydown.myPlugin.plugin")
            -> ["keydown.myPlugin.plugin", "keydown", "myPlugin.plugin", index: 0, input: "keydown.myPlugin.plugin"]
            -> type = "keydown"
            -> namespaces = ["myPlugin", "plugin"]
            */
			tmp = rtypenamespace.exec( types[t] ) || [];
			type = origType = tmp[1];
			namespaces = ( tmp[2] || "" ).split( "." ).sort();

			// Unbind all events (on this namespace, if provided) for the element
			// 没有传入特定 type，那就移除所有 type
            if ( !type ) {
				for ( type in events ) {
                    // mappedTypes 为 true 表示任意类型都可以删
					jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
				}
				continue;
			}
            /*
            这里递归调用 jQuery.event.remove 方法，
            为什么第二个参数会是 type + types[ t ] 呢？

            ① 要想执行这个回调，就得 type 为假
            ② type = rtypenamespace.exec( types[t] )[1]
            ③ 经验证，不管 types[t] 是什么值，type 始终为字符串
               rtypenamespace.exec(undefined)
               -> ["undefined", "undefined", undefined, index: 0, input: "undefined"]
               rtypenamespace.exec({})
               -> ["[object Object]", "[object Object]", undefined, index: 0, input: "[object Object]"]
               rtypenamespace.exec([1,23])
               -> ["1,23", "1,23", undefined, index: 0, input: "1,23"]
               rtypenamespace.exec('..h.d,lf...s@#$%ie')
               -> ["..h.d,lf...s@#$%ie", "", ".h.d,lf...s@#$%ie", index: 0, input: "..h.d,lf...s@#$%ie"]
            ④ 要想 type 为假，那么只有 types[t] 为空字符串 ''
               rtypenamespace.exec('')
               -> ["", "", undefined, index: 0, input: ""]
            ⑤ eg:
            var events = {
                'click' : { a:1},
                'mouseover' : { b:2}, 
                'scroll' : { c:3}
            };

            var types = [""]
            var t = types.length,
                tmp,
                rtypenamespace = /^([^.]*)(?:\.(.+)|)$/;

            while(t--){
                tmp = rtypenamespace.exec( types[t] ) || [];  
                type = tmp[1]; 

                if ( !type ) {
                    for ( type in events ) {
                        console.log('type:',type);
                        console.log('types[ t ]:',types[ t ]);
                    }
                    continue;  
                }
            }

            打印结果如下：
            type: click
            types[ t ]: 
            type: mouseover
            types[ t ]: 
            type: scroll
            types[ t ]: 

            ⑥ type + types[ t ] 相当于 type + ''
            所以，作用是将 type 转为字符串么
            */

			special = jQuery.event.special[ type ] || {};
			type = ( selector ? special.delegateType : special.bindType ) || type;
			handlers = events[ type ] || [];
            /*
            以 tmp[2] = "bb.cc" 为例：
            namespaces = ( tmp[2] || "" ).split( "." ).sort()
            -> ["bb","cc"]
            
            namespaces.join("\\.(?:.*\\.|)")
            -> "bb\.(?:.*\.|)cc"

            于是，
            tmp = new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" )
            -> /(^|\.)bb\.(?:.*\.|)cc(\.|$)/
            */
			tmp = tmp[2] && new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" );

			// Remove matching events
			origCount = j = handlers.length;
			while ( j-- ) {
				handleObj = handlers[ j ];
                
                // 前边递归调用 remove 方法时 mappedTypes 为 true
                // 也就是任意类型都可以删，不需要再单独考虑类型是否匹配了
				if ( ( mappedTypes || origType === handleObj.origType ) &&
                    // 没有传入回调函数，或者回调函数的 guid 要匹配上
					( !handler || handler.guid === handleObj.guid ) &&
                    // 没有命名空间（也就没有tmp[2]）或命名空间匹配上
					( !tmp || tmp.test( handleObj.namespace ) ) &&
                    // && 优先级高于 ||，没有选择器，或者选择器匹配上，或者通配
					( !selector || selector === handleObj.selector || selector === "**" && handleObj.selector ) ) {
					// 从 handlers 数组里删除对应的 handleObj
                    handlers.splice( j, 1 );
                    
                    // 如果是委托事件被删除了，还有把委托事件计数器减 1
					if ( handleObj.selector ) {
						handlers.delegateCount--;
					}
                    // 特殊事件删除
					if ( special.remove ) {
						special.remove.call( elem, handleObj );
					}
				}
			}

			// Remove generic event handler if we removed something and no more handlers exist
			// (avoids potential for endless recursion during removal of special event handlers)
			/*
            ① 如果原来确实有事件绑定，然后这次全清空了，那就解除该类型事件监听
            也就是说，如果原来没有时间绑定 origCount === 0，那就根本没绑定，更谈不上解除监听
            ② 删除 events 的 type 属性
            */
            if ( origCount && !handlers.length ) {
				if ( !special.teardown || special.teardown.call( elem, namespaces, elemData.handle ) === false ) {
					jQuery.removeEvent( elem, type, elemData.handle );
				}

				delete events[ type ];
			}
		}

		// Remove the expando if it's no longer used
        /*
        如果 events 清空了，也就是各种类型事件监听都没有了，那就从缓存删除
        */
		if ( jQuery.isEmptyObject( events ) ) {
			delete elemData.handle;
			data_priv.remove( elem, "events" );
		}
	},
    /*
    ① 1 个事件名参数
    $('input').trigger('click');

    ② 2 个参数，第 2 个参数类似于 event.data 属性，作为回调函数的参数
    $('input').click(function (e, data) {
        alert(data);
    }).trigger('click', 123);

    ③ 2 个参数，第 2 个参数为数组
    $('input').click(function (e, data1, data2) {
        alert(data1 + ',' + data2);
    }).trigger('click', ['abc', '123']);
    */
    /*
    jQuery.event.trigger 被调用
    ① jQuery.fn.trigger 
       jQuery.event.trigger( type, data, this )
    ② jQuery.fn.triggerHandler
       jQuery.event.trigger( type, data, elem, true )
       可以看到，onlyHandlers 参数在 triggerHandler 调用时为 true
   
   总结：
   trigger 执行事件hanlder/执行冒泡/执行默认行为
   triggerHandler 执行事件handler/不冒泡/不执行默认行为

   （onlyHandlers 为 true 就表示仅执行事件handler）
    */
	trigger: function( event, data, elem, onlyHandlers ) {

		var i, cur, tmp, bubbleType, ontype, handle, special,
			eventPath = [ elem || document ],
            /*
            event 除了可以是 "click" 这种，还可以事件？
            core_hasOwn = {}.hasOwnProperty
            */
			type = core_hasOwn.call( event, "type" ) ? event.type : event,
			namespaces = core_hasOwn.call( event, "namespace" ) ? event.namespace.split(".") : [];

		cur = tmp = elem = elem || document;

		// Don't do events on text and comment nodes
        // 文本和注释节点，不处理
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}

		// focus/blur morphs to focusin/out; ensure we're not firing them right now
		/*
        rfocusMorph = /^(?:focusinfocus|focusoutblur)$/
        focusinfocus/focusoutblur 这种就返回

        focus/blur 事件变种成 focusin/out 进行处理
        如果浏览器原生支持 focusin/out，则确保当前不触发他们
        */
        if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
			return;
		}

        // 带命名空间的事件类型
		if ( type.indexOf(".") >= 0 ) {
			// Namespaced trigger; create a regexp to match event type in handle()
			namespaces = type.split(".");
			type = namespaces.shift();
			namespaces.sort();
		}

        // 'click' -> 'onclick'
		ontype = type.indexOf(":") < 0 && "on" + type;

		// Caller can pass in a jQuery.Event object, Object, or just an event type string
		/*
        ① 如果参数 event 是对象，把它修正为 jQuery.Event 的实例对象
        ② 如果是 'click' 这种字符串，那就不管了
        */
        event = event[ jQuery.expando ] ?
			event :
			new jQuery.Event( type, typeof event === "object" && event );

		// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
		// jQuery.fn.trigger 对应 3 ；jQuery.fn.triggerHandler 对应 2
        event.isTrigger = onlyHandlers ? 2 : 3;
		event.namespace = namespaces.join(".");
		event.namespace_re = event.namespace ?
			new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" ) :
			null;

        /*
        ① 没有命名空间 event.namespace 为假，event.namespace_re 为 null
        ② 有命名空间:
           假如 event.namespace = "aa.bb"
           event.namespace_re = /(^|\.)aa\.(?:.*\.|)bb(\.|$)/
        */

		// Clean up the event in case it is being reused
		event.result = undefined;
        /*
        如果 event 本身就是字符串 'click'
        'click'.target -> undefined
        
        目标就是 elem
        */
		if ( !event.target ) {
			event.target = elem;
		}

		// Clone any incoming data and prepend the event, creating the handler arg list
		/*
        jQuery.makeArray( ['abc', '123'], [ 'event' ] )
        -> ["event", "abc", "123"]
        
        对应这种调用形式：
        $('input').click(function (e, data1, data2) {
            alert(data1 + ',' + data2);
        }).trigger('click', ['abc', '123']);
        */
        data = data == null ?
			[ event ] :
			jQuery.makeArray( data, [ event ] );

		// Allow special events to draw outside the lines
		special = jQuery.event.special[ type ] || {};
		if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
			return;
		}

		// Determine event propagation path in advance, per W3C events spec (#9951)
		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
		if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {
            /*
            eg:
            type = 'focus';
            bubbleType = 'focusin';
            
            bubbleType + type -> 'focusinfocus'
            rfocusMorph.test('focusinfocus') -> true
            */
			bubbleType = special.delegateType || type;
			if ( !rfocusMorph.test( bubbleType + type ) ) {
				cur = cur.parentNode;
			}
            // 遍历所有祖先节点
			for ( ; cur; cur = cur.parentNode ) {
				eventPath.push( cur );
				tmp = cur;
			}

			// Only add window if we got to document (e.g., not plain obj or detached DOM)
			/*
            document.defaultView === window
            如果最后遍历到了 document 节点，那就把 window 也加进去
            */
            if ( tmp === (elem.ownerDocument || document) ) {
				eventPath.push( tmp.defaultView || tmp.parentWindow || window );
			}
		}

		// Fire handlers on the event path
		i = 0;
        // 遍历 eventPath 数组，触发事件
		while ( (cur = eventPath[i++]) && !event.isPropagationStopped() ) {
            /*
            ① i 为 1 (0++) 时，是最深层节点，自身事件
            ② i > 1，就是祖先元素了，冒泡事件
            */
			event.type = i > 1 ?
				bubbleType :
				special.bindType || type;

			// jQuery handler
            /*
            ① 如果 type 对应的 handlers 数组存在，返回返回 handle 这个分发事件函数
            ② 否则，返回 undefined
            */
			handle = ( data_priv.get( cur, "events" ) || {} )[ event.type ] && data_priv.get( cur, "handle" );
			if ( handle ) {
                // 触发 dispatch 
				handle.apply( cur, data );
			}

			// Native handler
            // handle = elem.onclick，触发 handle
			handle = ontype && cur[ ontype ];
            /*
            handle.apply( cur, data ) === false 
            意味着：不管返回值是不是 false，都会执行这个方法
            */
			if ( handle && jQuery.acceptData( cur ) && handle.apply && handle.apply( cur, data ) === false ) {
				event.preventDefault();
			}
		}
		event.type = type;

		// If nobody prevented the default action, do it now
        /*
        这一段表示浏览器默认行为的触发，比如:
        form.submit()，button.click() 等
        eg:
        document 元素没有 click 方法，但是 button 元素有 click 方法

        var btn = document.getElementsByTagName('button')[0]
        btn.click
        // function click() { [native code] }
        */
		if ( !onlyHandlers && !event.isDefaultPrevented() ) {

			if ( (!special._default || special._default.apply( eventPath.pop(), data ) === false) &&
				jQuery.acceptData( elem ) ) {

				// Call a native DOM method on the target with the same name name as the event.
				// Don't do default actions on window, that's where global variables be (#6170)
				if ( ontype && jQuery.isFunction( elem[ type ] ) && !jQuery.isWindow( elem ) ) {

					// Don't re-trigger an onFOO event when we call its FOO() method
                    /*
                    触发 FOO() 方法时，不要重复触发 onFOO 事件（上边已经触发过了）
                    */
					tmp = elem[ ontype ];

					if ( tmp ) {
						elem[ ontype ] = null;
					}

					// Prevent re-triggering of the same event, since we already bubbled it above
					/*
                    click() 带参数会触发 on 方法，不带参数会触发 trigger 方法
                    防止 click() -> trigger() -> handle (jQuery.event.triggered !== e.type) -> dispatch
                    */
                    jQuery.event.triggered = type;
					elem[ type ](); // 事件执行
					jQuery.event.triggered = undefined;

					if ( tmp ) {
						elem[ ontype ] = tmp;
					}
				}
			}
		}

		return event.result;
	},

    /*
    jQuery.event.dispatch VS jQuery.event.trigger
    ① dispatch 处理 elem 它自身的监听事件以及那些委托给 elem 的子元素的事件
       它只会在自身和更深层的子元素上触发回调事件，不会向 elem 上层的祖先元素冒泡
    ② trigger 不光处理 elem 这个元素上的委托事件和自身事件，还遍历祖先元素，
       依次触发所有祖先元素上的委托事件和自身事件
    
    那一般情况下，如果通过 on 方法给多个元素绑定 type 类型事件，是怎么冒泡触发的呢？
    那是因为，在 add 方法中，每个元素都会调用 elem.addEventListener( type, eventHandle, false )
    事件冒泡过程中，会在每个元素上触发 eventHandle，也就是在每个元素上调用 dispatch 方法。
    即：jQuery.event.dispatch.apply( eventHandle.elem, arguments )
    */
	dispatch: function( event ) {

		// Make a writable jQuery.Event from the native event object
        // 从元素事件对象，得到一个可写的修正后的事件对象
		event = jQuery.event.fix( event );

		var i, j, ret, matched, handleObj,
			handlerQueue = [],
			args = core_slice.call( arguments ),
            /*
            jQuery.event.add 方法中是这么调用的：
            jQuery.event.dispatch.apply( eventHandle.elem, arguments )
           
            所以，下面的 this 就是 eventHandle.elem

            handlers 就是对应 type 类型的回调函数数组
            */
			handlers = ( data_priv.get( this, "events" ) || {} )[ event.type ] || [],
			special = jQuery.event.special[ event.type ] || {};

		// Use the fix-ed jQuery.Event rather than the (read-only) native event
		// 将 args[0] 从原生的 event 对象替换为修正的 event 对象
        args[0] = event;
		event.delegateTarget = this;

		// Call the preDispatch hook for the mapped type, and let it bail if desired
		if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
			return;
		}

		// Determine handlers
        /*
        handlerQueue 是一个数组，数组元素是：
        { 
            elem: 节点, 
            handlers: [handleObj,handleObj...]
         }
        */
        // 通过 jQuery.event.handlers 方法得到一个实际会处理的回调队列
		handlerQueue = jQuery.event.handlers.call( this, event, handlers );

		// Run delegates first; they may want to stop propagation beneath us
		i = 0;
        // 不同层级的元素，受 isPropagationStopped 影响
		while ( (matched = handlerQueue[ i++ ]) && !event.isPropagationStopped() ) {
			event.currentTarget = matched.elem;

			j = 0;
            // 同一个元素，不同的事件，受 isImmediatePropagationStopped 影响
			while ( (handleObj = matched.handlers[ j++ ]) && !event.isImmediatePropagationStopped() ) {

				// Triggered event must either 1) have no namespace, or
				// 2) have namespace(s) a subset or equal to those in the bound event (both can have no namespace).
                /*
                ① 没有命名空间 event.namespace 为假，event.namespace_re 为 null
                ② 有命名空间:
                   假如 event.namespace = "aa.bb"
                   event.namespace_re = /(^|\.)aa\.(?:.*\.|)bb(\.|$)/
                */
				if ( !event.namespace_re || event.namespace_re.test( handleObj.namespace ) ) {

					event.handleObj = handleObj;
                    /*
                    $('.button').on('click',{user:'nanc'},function(e){
                        alert(e.data.user);
                     });
                     就是在这里给 event.data 赋值的
                    */
					event.data = handleObj.data;
                    
                    /* 
                    这里真正执行回调方法
                    ① 首先还是尝试 jQuery.event.special[ handleObj.origType ].handle 来执行，
                    ② 否则用 handleObj.handler 来执行
                    */
					ret = ( (jQuery.event.special[ handleObj.origType ] || {}).handle || handleObj.handler )
							.apply( matched.elem, args );

					if ( ret !== undefined ) {
                        // 如果某个回调队列中的某个函数执行返回 false，那就阻止默认行为，并阻止冒泡
						if ( (event.result = ret) === false ) {
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}
			}
		}

		// Call the postDispatch hook for the mapped type
        /*
        只有 jQuery.event.speical.beforeunload 有 postDispatch 属性，
        就是修复 Firefox 在 event.originalEvent.returnValue 没有设置时不 alert
        */
		if ( special.postDispatch ) {
			special.postDispatch.call( this, event );
		}

        // 返回最后的执行结果
		return event.result;
	},

    /*
    参数：
    event：修正过的 event 对象
    handlers：获取到的 handleObj 队列
    */
	handlers: function( event, handlers ) {
		var i, matches, sel, handleObj,
			handlerQueue = [],
			delegateCount = handlers.delegateCount,
			cur = event.target;

		// Find delegate handlers
		// Black-hole SVG <use> instance trees (#13180)
		// Avoid non-left-click bubbling in Firefox (#3861)
        /*
        （1）如果没有委托，即 delegateCount = 0，不会走下面的 if 块
        （2）如果有委托，取出绑定事件节点上的handlers，可以看出此时元素本身有事件，元素还要处理委托事件。
             jQuery规定事件执行顺序：
             ① 依赖委托节点在DOM树的深度安排优先级，委托的DOM节点层次越深，其执行优先级越高。
             ② 委托的事件处理程序相对于直接绑定的事件处理程序在队列的更前面。
        */
		if ( delegateCount && cur.nodeType && (!event.button || event.type !== "click") ) {
            /*
            eg:
            document.onclick = function(event){
                console.log(event.button);
                console.log('类型：',typeof event.button);
            }
            点击文档，打印 event.button，点击鼠标左键，结果如下：
            // 0
            // 类型： number

            !event.button || event.type !== "click"
            -> !(event.button && event.type === "click")
            -> !(非左键点击)
            -> 排除非左键点击
            -> 要么 event.button 为 0，即左键操作；要么不是点击事件
            */
            /*
            cur = event.target 从事件源（最深的节点开始），找父亲节点，直到 this 的子节点结束。
            越深的节点，优先级越高！

            jQuery.event.dispatch 是这样调用该方法的：
            jQuery.event.handlers.call( this, event, handlers )

            所以，下面的 this 就是 jQuery.event.add 中的 eventHandle.elem

            注意！！！
            ① 这里是从最深的节点开始找的，层次上溯
            ② 如果 cur 就是 this，根本就不会进入下面的 for 循环，直接把绑定自身的事件加入队列就好了
            */
			for ( ; cur !== this; cur = cur.parentNode || this ) {

				// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
                /*
                不处理 disabled 元素的点击事件
                相当于：
                if (!(cur.disabled === true && event.type === "click")) {
                    // process
                }
                */
				if ( cur.disabled !== true || event.type !== "click" ) {
					matches = [];
                    /*
                    依次取出属于委托（i从0到delegateCount-1）的每个 handleObj，
                    首先明确一点，我们不会执行所有的 handleObj，也就是说会丢掉一些
                    那丢掉哪一些呢？或者说保留哪一些呢？

                    还是看上面的例子：
                    点击 p 标签后，打印内容以及顺序如下：
                    p1 -> P -> div2 -> div1
                    
                    p 标签和 a 标签都委托在 div2 上，可是，
                    点击 p 标签，并不会触发 a 标签的回调

                    所以在 div2 的 handlers 里，只取出和 p 标签对应的 handleObj

                    换个角度讲：
                    div2 是父元素，p 又是 a 的父元素。子元素 p,a 点击事件委托给 div2
                    $('#div2').on('click','p,a',fn);
                    
                    div2 的点击事件有一个 handlers 数组，前一部分的 handleObj 是委托的。
                    假设 'p,a' 这个 selector 对应 handleObj[n]。
                    这里的 fn 既与 p 标签对应，也和 a 标签对应。
                    那么，点击 p 标签，冒泡到 #div2 后，就只该出发 p 标签的回调 fn，而不该触发 a 标签的 fn。
                    在 #div2 中找 'p,a'，找到了一组元素，我们以数组表示： [p,a]。
                    而我们点击的是 p（event.target），从 p 开始回溯，p 在数组 [p,a] 中，所以，p 的回调就是应该执行的。
                    而 a 是 p 的子元素，按照事件冒泡属性，是不会把 a 的回调取出来的。
                    */
					for ( i = 0; i < delegateCount; i++ ) {
						handleObj = handlers[ i ];

						// Don't conflict with Object.prototype properties (#13203)
						sel = handleObj.selector + " ";

						if ( matches[ sel ] === undefined ) {
                            /*
                            A: 如果在节点 this (eventHandle.elem) 中找到了选择器 sel 代表的一组元素，
                            B: cur 在这一组元素中
                            A && B -> matches[ sel ] 就为真，下面就会把这个 handleObj 加入处理列表
                            
                            两层 for 循环：（这里的 this 指调用 on 方法的元素）
                            第一层：cur 由 event.target -> this （cur 的父节点，到 this 结束）
                                    意思是：可能多个元素都委托给了 this 元素
                                    即元素 A 委托给了祖先元素，元素 B 也委托给了 this 元素...
                                    要把这些 A，B ... 都找出来
                                    
                            第二层：遍历 handlers 中委托的 handleObj 
                                    意思是：可能多次事件绑定（handleObj）都与元素 cur 有关
                                    即多次给元素 A 绑定某个类型事件（每次的 selector 可以相同，也可以不同），
                                    第一次 'div' 方式把 A 元素的事件委托给 this 元素；
                                    第二次 '.clsA' 方式把 A 元素的事件委托给 this 元素；
                                    第三次 '#a' 方式把 A 元素的事件委托给 this 元素；
                                    第四次还是 'div' 方式把 A 元素的事件委托给 this 元素；
                                    ...

                            总结一下：
                            $('#div1').on('click','p,a',fn1);
                            $('#div1').on('click','.clsA',fn1);
                            $('#div1').on('click','div',fn1);
                            ...
                            这里的  $('#div1') 就是上面说的 this。
                            我们要做的就是把【委托在 this 上的 'p,a'、'.clsA'、'div' 这些元素】找出来，
                            并把 handleObj 和这些元素对应起来。

                            当然了，前提是，我们找到的必须以 event.target 开始向上层找。
                            也就是说我们找的【委托在 this 上的 'p,a'、'.clsA'、'div' 这些元素】必须是 event.target 的祖先元素
                            */
							matches[ sel ] = handleObj.needsContext ?
								jQuery( sel, this ).index( cur ) >= 0 :
								jQuery.find( sel, this, null, [ cur ] ).length;
						}
						if ( matches[ sel ] ) {
							matches.push( handleObj );
						}
					}
					if ( matches.length ) {
						handlerQueue.push({ elem: cur, handlers: matches });
					}
				}
			}
		}

		// Add the remaining (directly-bound) handlers
        // 剩余的非委托的也加入到 handlerQueue 数组
		if ( delegateCount < handlers.length ) {
			handlerQueue.push({ elem: this, handlers: handlers.slice( delegateCount ) });
		}
        
        /*
        jQuery.event.handlers 作用：
        就是提取一个数组，数组元素形式是：
        { 
            elem: 节点, 
            handlers: [handleObj,handleObj...]
         }
        */
		return handlerQueue;
	},

	// Includes some event props shared by KeyEvent and MouseEvent
    // 键盘事件和鼠标事件共享的属性
    // 为什么不直接定义成数组，而是要用 split 方法呢
	props: "altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),

	fixHooks: {},
    /*
    在 chrome 控制台打印 jQuery.event.fixHooks：
    fixHooks: {
        click : {
            filter : function(event,original){},
            props : ["button", "buttons", "clientX", "clientY", "offsetX", "offsetY", "pageX", "pageY", "screenX", "screenY", "toElement"]
        }
    }

    fixHooks 就是一个各种 fixHook 组成的集合，
    一个 fixHook 就是一个针对某个事件类型的完整兼容对象。
    */

	keyHooks: {
        // 除了和鼠标事件的共享属性，键盘事件还有这些属性
		props: "char charCode key keyCode".split(" "),
		filter: function( event, original ) {

			// Add which for key events
			if ( event.which == null ) {
				event.which = original.charCode != null ? original.charCode : original.keyCode;
			}
            /*
            e.keyCode 和 e.charCode 区别：
            ① e.keyCode 是键码，如 a 对应 65
               keydown()、keyup() 返回的是键码
            ② e.charCode 是字符编码，如 a 对应 97
               keypress() 返回的是字符编码
            */

			return event;
		}
	},

	mouseHooks: {
        // 除了和键盘事件的共享属性，鼠标事件还有这些属性
		props: "button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
		filter: function( event, original ) {
			var eventDoc, doc, body,
				button = original.button;

            /*
            ① pageX/pageY
               获取相对于页面（body）原点的水平/垂直坐标
               （如果 body 有边框，还得把边框排除在外）
            ② screenX/screenY (非 jQuery 封装)
               获取显示器屏幕位置的水平/垂直坐标
            ③ clientX/clientY (非 jQuery 封装)
               获取相对于页面视口的水平/垂直坐标
            ④ clientLeft/clientTop
               左/上边框宽度，对应 css 的 borderLeft/borderTop
            */

			// Calculate pageX/Y if missing and clientX/Y available
			if ( event.pageX == null && original.clientX != null ) {
				eventDoc = event.target.ownerDocument || document;
				doc = eventDoc.documentElement;
				body = eventDoc.body;

				event.pageX = original.clientX + ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) - ( doc && doc.clientLeft || body && body.clientLeft || 0 );
				event.pageY = original.clientY + ( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) - ( doc && doc.clientTop  || body && body.clientTop  || 0 );
			}

			// Add which for click: 1 === left; 2 === middle; 3 === right
			// Note: button is not normalized, so don't use it
            /*
            event.which
            ① 鼠标事件，左中右键分别返回 1,2,3
            ② 键盘事件，返回对应的键码或字符编码

            一般，事件对象 event 没有 button 属性吧
            */
			if ( !event.which && button !== undefined ) {
				event.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
			}

			return event;
		}
	},

    /*
    jQuery.event.fix将原生的事件对象 event 修正为一个新的可写 event 对象，
    并对该 event 的属性以及方法统一接口；
    它内部调用了 jQuery.Event(event) 构造函数。
    */
	fix: function( event ) {
        // 已经修正过了，那就返回吧
		if ( event[ jQuery.expando ] ) {
			return event;
		}

        /*
        dispatch 方法是这么调用的：
        event = jQuery.event.fix( event );

        所以，这里的 this 都是指 jQuery.event
        */

		// Create a writable copy of the event object and normalize some properties
		var i, prop, copy,
			type = event.type,
            // 复制一个 event 副本，并规范化一些属性
			originalEvent = event,
			fixHook = this.fixHooks[ type ];
        /*
        fixHooks: {}
        最开始 fixHook 肯定是 undefined

        ① mouseHooks: {
            props: "button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
            filter: function( event, original ) {}
        }

        ② keyHooks: {
            props: "char charCode key keyCode".split(" "),
            filter: function( event, original ) {}
        }

        ③ 键盘/鼠标事件
        rkeyEvent = /^key/;
        rmouseEvent = /^(?:mouse|contextmenu)|click/
        */
		if ( !fixHook ) {
			this.fixHooks[ type ] = fixHook =
                // 鼠标事件
				rmouseEvent.test( type ) ? this.mouseHooks :
                // 键盘事件
				rkeyEvent.test( type ) ? this.keyHooks :
				{};
		}
        // fixHook 为 keyHooks 、mouseHooks 、{} 三者之一

        /*
        jQuery.event.props : 键盘鼠标事件的【共享属性】
        jQuery.event.keyHooks.props : 键盘事件的【独有属性】
        jQuery.event.mouseHooks.props : 鼠标事件的【独有属性】

        这里是把【共享属性】和【独有属性】拼接在一起
        */
		copy = fixHook.props ? this.props.concat( fixHook.props ) : this.props;

        /*
        根据原生 event 对象，创建 jQuery.Event 实例对象
        jQuery.Event 构造函数中有一句：event.originalEvent = originalEvent;
        所以，新的 event 对象，可以通过 originalEvent 属性获取原来 event 事件对象的一些属性
        */
		event = new jQuery.Event( originalEvent );

		i = copy.length;
        // 复制所有的 props 属性
		while ( i-- ) {
			prop = copy[ i ];
			event[ prop ] = originalEvent[ prop ];
		}

		// Support: Cordova 2.5 (WebKit) (#13255)
		// All events should have a target; Cordova deviceready doesn't
        // 如果没有 event.target，修正为 document
		if ( !event.target ) {
			event.target = document;
		}

		// Support: Safari 6.0+, Chrome < 28
		// Target should not be a text node (#504, #13143)
        // 如果 event.target 是文本节点，修正为其父节点
		if ( event.target.nodeType === 3 ) {
			event.target = event.target.parentNode;
		}

        // 最后，用钩子修正事件对象
		return fixHook.filter? fixHook.filter( event, originalEvent ) : event;
	},
    
    /*
    special 这个对象信息有点分散，在 chrome 下打印 $.event.special ，得到：
    special : {
        beforeunload : {
            postDispatch : function ( event ){}
        },
        blur : {
            delegateType : "focusout",
            trigger : function (){}
        },
        click : {
            trigger : function(){},
            _default : function(event){}
        },
        focus : {
            delegateType : "focusin",
            trigger : function(){}
        },
        focusin : {
            setup : fucntion(){},
            teardown : function(){}
        },
        focusout : {
            setup : fucntion(){},
            teardown : function(){}
        },
        load : {
            noBubble : true
        },
        mouseenter : {
            bindType : "mouseover",           
            delegateType : "mouseover",
            handle : function(){}
        },
        mouseleave : {
            bindType : "mouseout",           
            delegateType : "mouseout",
            handle : function(){}
        }
    }

    */

	special: {
		load: {
			// Prevent triggered image.load events from bubbling to window.load
			noBubble: true
		},
		focus: {
			// Fire native event if possible so blur/focus sequence is correct
			trigger: function() {
				if ( this !== safeActiveElement() && this.focus ) {
					this.focus();
					return false;
				}
			},
			delegateType: "focusin"
		},
		blur: {
			trigger: function() {
				if ( this === safeActiveElement() && this.blur ) {
					this.blur();
					return false;
				}
			},
			delegateType: "focusout"
		},
		click: {
			// For checkbox, fire native event so checked state will be right
			trigger: function() {
				if ( this.type === "checkbox" && this.click && jQuery.nodeName( this, "input" ) ) {
					this.click();
					return false;
				}
			},

			// For cross-browser consistency, don't fire native .click() on links
			_default: function( event ) {
				return jQuery.nodeName( event.target, "a" );
			}
		},

		beforeunload: {
			postDispatch: function( event ) {

				// Support: Firefox 20+
				// Firefox doesn't alert if the returnValue field is not set.
				if ( event.result !== undefined ) {
					event.originalEvent.returnValue = event.result;
				}
			}
		}
	},

    // 模拟事件
    /*
    对于不支持 focusin/focusout 事件的浏览器，我们用 focus/blur 事件来模拟：
    jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ), true )
    */
	simulate: function( type, elem, event, bubble ) {
		// Piggyback on a donor event to simulate a different one.
		// Fake originalEvent to avoid donor's stopPropagation, but if the
		// simulated event prevents default then we do the same on the donor.
		/*
        eg:
        var e = jQuery.extend({},
        {
            a: 1,
            b: 2,
            c: 3
        },
        {
            a: 11,
            d: 4
        });
        -> e: {a: 11, b: 2, c: 3, d: 4}
        将第二、第三个参数的属性依次复制给第一个参数，后复制的覆盖先复制的
        */
        var e = jQuery.extend(
			new jQuery.Event(),
			event,
			{
				type: type,
				isSimulated: true,
				originalEvent: {}
			}
		);
        // 冒泡
		if ( bubble ) {
            /*
            这里用 focus/blur 事件模拟 focusin/focusout 事件，
            虽然 focus/blur 事件不会冒泡，也就是不会在祖先元素上发生，
            但是 trigger 方法会依次找到所有祖先元素，手动触发事件
            */
			jQuery.event.trigger( e, null, elem );
		} else {
            /*
            dispatch 处理 elem 它自身的监听事件以及那些委托给 elem 的子元素的事件
            换句话讲：它只会在自身和更深层的子元素上触发回调事件，不会向 elem 上层的祖先元素冒泡
            */
			jQuery.event.dispatch.call( elem, e );
		}
        // 阻止默认事件回调
		if ( e.isDefaultPrevented() ) {
			event.preventDefault();
		}
	}
};

jQuery.removeEvent = function( elem, type, handle ) {
	if ( elem.removeEventListener ) {
		elem.removeEventListener( type, handle, false );
	}
};

jQuery.Event = function( src, props ) {
	// Allow instantiation without the 'new' keyword
    // 可以不用 new 关键词来新建 jQuery.Event 实例对象
	if ( !(this instanceof jQuery.Event) ) {
		return new jQuery.Event( src, props );
	}

	// Event object
    // src 是原生的事件对象
	if ( src && src.type ) {
		this.originalEvent = src;
		this.type = src.type;

		// Events bubbling up the document may have been marked as prevented
		// by a handler lower down the tree; reflect the correct value.
        // 默认行为是否已阻止
		this.isDefaultPrevented = ( src.defaultPrevented ||
			src.getPreventDefault && src.getPreventDefault() ) ? returnTrue : returnFalse;

	// Event type
    // src 是事件类型
	} else {
		this.type = src;
	}

	// Put explicitly provided properties onto the event object
    // 复制 props 中的所有属性
	if ( props ) {
		jQuery.extend( this, props );
	}

	// Create a timestamp if incoming event doesn't have one
    // 时间戳
	this.timeStamp = src && src.timeStamp || jQuery.now();

	// Mark it as fixed
    // 标记已修复
	this[ jQuery.expando ] = true;
};

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
    /*
    function returnFalse() {
        return false;
    }
    */
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse,

	preventDefault: function() {
        // 获取对应的原生事件
		var e = this.originalEvent;

		this.isDefaultPrevented = returnTrue;

		if ( e && e.preventDefault ) {
            // 原生对象的原生方法阻止默认行为
			e.preventDefault();
		}
	},
	stopPropagation: function() {
		var e = this.originalEvent;

		this.isPropagationStopped = returnTrue;

		if ( e && e.stopPropagation ) {
            // 原生对象的原生方法阻止事件冒泡
			e.stopPropagation();
		}
	},
    /*
    取消事件冒泡，并取消该事件的后续事件处理函数
    eg:
    <div>
       <span></span>
    </div>
    假设 div 有 1 个点击回调方法是 f1
    span 有 2 个点击回调方法是 f2、f3

    那么，如果点击了 span，一般情况下，会依次执行 f2->f3->f1

    如果在 f2 方法中调用了 stopImmediatePropagation 方法，
    那么，【本元素上的同类回调 f3】和【祖先元素元素上的 f1】都不会执行

    代码示例：
    $('input').click(function (e) {
        alert('input');
        e.stopImmediatePropagation();
    });
    $('input').click(function () {
        alert('input2');
    });
    $(document).click(function () {
        alert('document');
    });
    */
	stopImmediatePropagation: function() {
		this.isImmediatePropagationStopped = returnTrue;
		this.stopPropagation();
	}
};

// Create mouseenter/leave events using mouseover/out and event-time checks
// Support: Chrome 15+
/*
区别：
① mouseenter() 和 mouseleave() 穿过子元素不会触发，
② mouseover() 和 mouseout() 则会触发。

jQuery.each({
	mouseenter: "mouseover",
	mouseleave: "mouseout"
}, function( orig, fix ) {
    console.log('orig:',orig,'fix:',fix)
});
打印结果：
orig: mouseenter fix: mouseover
orig: mouseleave fix: mouseout

所以，这里新建了两个对象：
jQuery.event.special[ "mouseenter" ] 和
jQuery.event.special[ "mouseleave" ]
*/
jQuery.each({
	mouseenter: "mouseover",
	mouseleave: "mouseout"
}, function( orig, fix ) {
	jQuery.event.special[ orig ] = {
		delegateType: fix,
		bindType: fix,
        
        /*
        dispatch 方法中：

        args[0] = event; 
        // event 对象替换为修正后的 event 对象
        
        ret = ( (jQuery.event.special[ handleObj.origType ] || {}).handle || handleObj.handler )
							.apply( matched.elem, args )
                       
        所以，handle 的实参是修正后的 event 对象
        */
		handle: function( event ) {
			var ret,
				target = this,
				related = event.relatedTarget,
				handleObj = event.handleObj;

			// For mousenter/leave call the handler if related is outside the target.
			// NB: No relatedTarget if the mouse left/entered the browser window
			if ( !related || (related !== target && !jQuery.contains( target, related )) ) {
				event.type = handleObj.origType;
				ret = handleObj.handler.apply( this, arguments );
				event.type = fix;
			}
			return ret;
		}
	};
});

// Create "bubbling" focus and blur events
// Support: Firefox, Chrome, Safari
/*
① 是否冒泡
focus() 和 blur() 分别表示光标激活和丢失，事件触发元素是当前元素。
focusin() 和 focusout() 也表示光标激活和丢失，但事件触发元素可以是子元素，然后事件冒泡上来。

② 发生顺序（用户把焦点从 A 转移到 B）
   focusout：在 A 失去焦点前发送。
   blur：在 A 失去焦点后发送。
   focusin：在B获得焦点前发送。
   focus：在B获得焦点后发送。
*/
/*
对于不支持 focusin/focusout 事件的浏览器，我们用 focus/blur 事件来模拟：
jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ), true )

但是  focus/blur 事件不支持冒泡，所以，用事件捕获。
这两个事件都有 setup 方法来绑定捕获事件监听：
document.addEventListener( orig, handler, true )
第三个参数 useCapture 为 true

所以 jQuery.event.add 中的冒泡监听就不再监听冒泡事件了
if ( !special.setup || special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
    if ( elem.addEventListener ) {
        elem.addEventListener( type, eventHandle, false );
    }
}
*/
if ( !jQuery.support.focusinBubbles ) {
	jQuery.each({ focus: "focusin", blur: "focusout" }, function( orig, fix ) {

		// Attach a single capturing handler while someone wants focusin/focusout
		var attaches = 0,
			handler = function( event ) {
				jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ), true );
			};

		jQuery.event.special[ fix ] = {
			setup: function() {
				if ( attaches++ === 0 ) {
                    /*
                    a. 因为不支持 focusin/focusout 事件，所以监听 focus/blur 事件
                    b. 因为 focus/blur 不支持冒泡，所以捕获阶段监听
                    c. 事件发生时，触发 handler 方法
                    d. handler 方法模拟 focusin/focusout 事件

                    为什么捕获事件绑定在 document 上？
                    捕获事件由最外层元素向最里层元素传播，
                    不管那个元素发生了 focus/blur 事件
                    都是 document 上的捕获事件会最先触发
                    这里 handler 回调方法可以做一些事件处理和拦截过滤
                    */
					document.addEventListener( orig, handler, true );
				}
			},
			teardown: function() {
				if ( --attaches === 0 ) {
					document.removeEventListener( orig, handler, true );
				}
			}
		};
	});
}

/*
（1） .on( events [, selector ] [, data ], handler )
events：字符串，一个或多个空格隔开的事件类型"click"，可选的命名空间"keydown.myPlugin"
selector：一个选择器字符串，用于过滤出被选中的元素中能触发事件的后代元素。如果选择器是 null 或者忽略了该选择器，那么被选中的元素总是能触发事件。
data：任意类型，事件触发时，当一个事件被触发时，要传给 handler 的event.data
handler：函数，事件的回调函数。如果是一个返回 false 的函数，可以简写为 false。

（2） .on( events [, selector ] [, data ] )
events：json 对象，字符串的 key 表示一个或多个空格隔开的事件类型"click"，可选的命名空间"keydown.myPlugin"；value 表示事件回调函数
selector：一个选择器字符串，用于过滤出被选中的元素中能触发事件的后代元素。如果选择器是 null 或者忽略了该选择器，那么被选中的元素总是能触发事件。
data：任意类型，事件触发时，当一个事件被触发时，要传给 handler 的event.data
*/
jQuery.fn.extend({
    /*
    先来看看 on 方法的使用方式：
    （1）2 个参数，分别是事件类型和回调函数
         $('.button').on('click',funtion(){
             alert(1);
         })

    （2）2 个参数，第一个参数是多个事件
         $('.button').on('mouseover mouseout',funtion(){
            alert(1);
         });
      
    （3）第一个参数带事件命名空间
         $('.button').on('click.abc',function(){
            alert(1);
         });

    （4）3 个参数，使用额外数据和事件对象
         $('.button').on('click',{user:'nanc'},function(e){
            alert(e.data.user);
         });
    （5）以对象方式绑定多个事件
         $('.button').on({
            mouseover : function(){
                alert(1);
            },
            mouseout : function(){
                alert(2);
            }
         });

    （6）阻止默认行为，并取消冒泡
         $('.button').on('submit',false);

    */
	on: function( types, selector, data, fn, /*INTERNAL*/ one ) {
		var origFn, type;

		// Types can be a map of types/handlers
        /*
        ① types 是一个 json 对象，selector, data 都是可选
        types = {
            type1 : handler1,
            type2 : handler2,
            ...
        }
        */
		if ( typeof types === "object" ) {
			// ( types-Object, selector, data )
            /*
            如果 selector 不是字符串
            ① data 没有值就把 selector 的值赋给它
            ② selector 置为 undefined
            */
			if ( typeof selector !== "string" ) {
				// 相当于 ( types-Object, data ) 这种形式参数
				data = data || selector;
				selector = undefined;
			}
            // 递归
            // 都转成这种形式 .on( events [, selector ] [, data ], handler )
			for ( type in types ) {
				this.on( type, selector, data, types[ type ], one );
			}
            // 链式调用，返回当前对象
			return this;
		}
        
        // 兼容各种参数形式，不要的参数就置为 undefined
        // 2 个参数的情况 .on("click", fn)
		if ( data == null && fn == null ) {
			// ( types, fn )
			fn = selector;
			data = selector = undefined;
		} else if ( fn == null ) {
            // 3 个参数的情况 .on("click", "tr", fn)
			if ( typeof selector === "string" ) {
				// ( types, selector, fn )
				fn = data;
				data = undefined;
            // 3 个参数的情况 .on("click", { foo: "bar" }, fn)
			} else {
				// ( types, data, fn )
				fn = data;
				data = selector;
				selector = undefined;
			}
		}
        // 如果 fn 是 false，那 fn 就是一个返回 false 的函数
		if ( fn === false ) {
			fn = returnFalse;
        // 其他情况下，如果 fn 为假，那就直接返回
		} else if ( !fn ) {
			return this;
		}

        /*
        这个 one 参数专门为下面的 .one 方法服务的
        有了这个参数，表示对于某个元素的某一类事件，回调方法最多执行一次
        */
		if ( one === 1 ) {
			origFn = fn;
            // 执行一次就移除掉
			fn = function( event ) {
				// Can use an empty set, since event contains the info
                /*
                随便建立一个 jQuery 实例，调用 off 方法来解除事件绑定
                这里的 event 是 jQuery.Event 实例，它携带的信息能确定到底解除哪个事件绑定
                */
				jQuery().off( event );
				return origFn.apply( this, arguments );
			};
			// Use same guid so caller can remove using origFn
			fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
		}
		return this.each( function() {
            // 添加监听
			jQuery.event.add( this, types, fn, data, selector );
		});
	},
	one: function( types, selector, data, fn ) {
		return this.on( types, selector, data, fn, 1 );
	},
	off: function( types, selector, fn ) {
		var handleObj, type;
        /*
        off(event) 这种形式
        event 是 jQuery.Event 实例
        */
		if ( types && types.preventDefault && types.handleObj ) {
			// ( event )  dispatched jQuery.Event
			handleObj = types.handleObj;
            /*
            【递归调用】
             有命名空间的需要把命名空间带上
             如：（原事件是"keydown.myPlugin.plugin"）
             handleObj : {
                ...
                origType : "keydown"
                namespace : "myPlugin.plugin"
                ...
             }
             handleObj.origType + "." + handleObj.namespace
             -> "keydown.myPlugin.plugin"
            */
			jQuery( types.delegateTarget ).off(
				handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
				handleObj.selector,
				handleObj.handler
			);
			return this;
		}
        /*
        这种形式：
        off({
            mouseover : function(){
                alert(1);
            },
            mouseout : function(){
                alert(2);
            }
         }[,selector]); 

         同样是递归调用，转成最普通形式
        */
		if ( typeof types === "object" ) {
			// ( types-object [, selector] )
			for ( type in types ) {
				this.off( type, selector, types[ type ] );
			}
			return this;
		}
        // ( types [, fn] )
		if ( selector === false || typeof selector === "function" ) {
			fn = selector;
			selector = undefined;
		}
		if ( fn === false ) {
			fn = returnFalse;
		}
		return this.each(function() {
			jQuery.event.remove( this, types, fn, selector );
		});
	},
    /*
    trigger 和 triggerHandler 区别如下：
    ① trigger 会触发事件的默认行为、冒泡行为，而 triggerHandler 不会；
    ② trigger 会触发选择器获取的所有元素事件，而 triggerHandler 触发第一个元素事件
    ③ trigger 方法返回触发该方法的 jquery 实例，可以链式调用，
       而 triggerHandler 没有返回值，也就是返回 undefined；
    */
	trigger: function( type, data ) {
		return this.each(function() {
			jQuery.event.trigger( type, data, this );
		});
	},
	triggerHandler: function( type, data ) {
		var elem = this[0];
		if ( elem ) {
			return jQuery.event.trigger( type, data, elem, true );
		}
	}
});

/*
下文有：
jQuery.fn.extend({
	hover: function( fnOver, fnOut ) {
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	},

	bind: function( types, data, fn ) {
		return this.on( types, null, data, fn );
	},
	unbind: function( types, fn ) {
		return this.off( types, null, fn );
	},

	delegate: function( selector, types, data, fn ) {
		return this.on( types, selector, data, fn );
	},
	undelegate: function( selector, types, fn ) {
		// ( namespace ) or ( selector, types [, fn] )
		return arguments.length === 1 ? this.off( selector, "**" ) : this.off( types, selector || "**", fn );
	}
});
*/






var isSimple = /^.[^:#\[\.,]*$/,
	rparentsprev = /^(?:parents|prev(?:Until|All))/,
	rneedsContext = jQuery.expr.match.needsContext,
	// methods guaranteed to produce a unique set when starting from a unique set
	// 保证唯一
    guaranteedUnique = {
		children: true,
		contents: true,
		next: true,
		prev: true
	};

jQuery.fn.extend({
    /*
	参数：String/Element/jQuery 等类型指定的表达式
	作用：以当前 JQ 对象为上下文，寻找满足选择器 selector 的后代元素组成的 JQ 对象
    */
	find: function( selector ) {
		var i,
			ret = [],
			self = this,
			len = self.length;

		// 参数不是字符串，这里返回 JQ 对象
		if ( typeof selector !== "string" ) {
			/*
			① 找出元素 jQuery( selector )
			② 过滤元素
			③ 过滤规则：选出来的元素一定要是当前 JQ 对象的后代元素

			这里看一下 :
			$.fn.filter = function ( selector ) {
				return this.pushStack( winnow(this, selector || [], false) );
			}
			作用：过滤 this 这个对象，然后将链式调用的驱动对象指为过滤后的对象
			*/
			return this.pushStack( jQuery( selector ).filter(function() {
				/*
				对于 jQuery.contains( self[ i ], this ) 
				self[ i ] 是调用 find 方法的一组元素中的一个；
				this 是 jQuery( selector ) 这一组元素中的一个
				*/
				for ( i = 0; i < len; i++ ) {
					if ( jQuery.contains( self[ i ], this ) ) {
						return true;
					}
				}
			}) );
		}

		// 参数为字符串，调用静态方法 jQuery.find
		for ( i = 0; i < len; i++ ) {
			/*
			 jQuery.find 函数将在当前 self[ i ] 的
			 所有后代元素中筛选符合指定表达式 selector 的元素组成的 JQ 对象
			 ret 存放结果
			*/
			jQuery.find( selector, self[ i ], ret );
		}

		// Needed because $( selector, context ) becomes $( context ).find( selector )
		// 将链式调用的驱动 JQ 对象交给 ret
		ret = this.pushStack( len > 1 ? jQuery.unique( ret ) : ret );
		ret.selector = this.selector ? this.selector + " " + selector : selector;
		return ret;
	},

	/*
	参数：String/Element/jQuery 等类型指定的表达式
	作用：筛选出包含特定后代的元素，并以jQuery对象的形式返回
	*/
	has: function( target ) {
		var targets = jQuery( target, this ),
			l = targets.length;

		/*
		上面 targets = jQuery( target, this ) 已经过滤出后代元素了，为什么还需要后面的操作呢？
		原因：
		这里确实以 this 为上下文，得到了后代元素组 targets。但是，不要忘了，this 可能是一组元素
		吃大锅饭不行，下面还需要找出到底是 this 中的哪些元素是真的包含 targets[i] 的

		对于方法 $.fn.filter，哪个实例对象调用它，就过滤哪个实例对象
		这里是过滤调用 has 方法的 JQ 对象
		*/
		return this.filter(function() {
			var i = 0;
			for ( ; i < l; i++ ) {
				/*
				这里的 this 不能等同于外层的 this
				外层的 this 可以看到一组元素
				这里的 this 只是那一组元素中的一个
				*/
				if ( jQuery.contains( this, targets[i] ) ) {
					return true;
				}
			}
		});
	},

	// 下面的 filter 方法过滤后剩下的部分
	not: function( selector ) {
		return this.pushStack( winnow(this, selector || [], true) );
	},

	// 过滤调用该 filter 方法的 JQ 对象，然后叫链式调用的驱动对象交给过滤后的 JQ 对象
	filter: function( selector ) {
		return this.pushStack( winnow(this, selector || [], false) );
	},

    // 判断当前 JQ 对象是否在类数组 jQuery( selector ) 或数组 selector 中，返回值为布尔值
	is: function( selector ) {
        /*
        ① . 运算符优先级大于 ！
        ② 当 selector 是字符串的时候，看 this 是否在类数组 jQuery( selector ) 中
        ③ 将最终结果转为布尔值
         */
		return !!winnow(
			this,

			// If this is a positional/relative selector, check membership in the returned set
			// so $("p:first").is("p:last") won't return true for a doc with two "p".
			typeof selector === "string" && rneedsContext.test( selector ) ?
				jQuery( selector ) :
				selector || [],
			false
		).length;
	},

    /*
    作用：从当前匹配元素开始，逐级向上级选取符合指定表达式的第一个（最近的）元素，并以 jQuery 对象的形式返回。
    expr    String/Element/jQuery 等类型指定的表达式。
    context 可选/Element/jQuery 等类型指定表示查找范围的文档节点。
     */
    // 在给定的范围里，找出最近的的符合表达式 selectors 的元素
	closest: function( selectors, context ) {
		var cur,
			i = 0,
			l = this.length,
			matched = [],
            // 一组节点
			pos = ( rneedsContext.test( selectors ) || typeof selectors !== "string" ) ?
				jQuery( selectors, context || this.context ) :
				0;

        // 对 this 这一组元素，每个 this[i] 找到一个最近的 cur 就跳出内层循环
		for ( ; i < l; i++ ) {
			for ( cur = this[i]; cur && cur !== context; cur = cur.parentNode ) {
				// Always skip document fragments
				if ( cur.nodeType < 11 && (pos ?
                    // cur 在 pos 这一组节点当中
					pos.index(cur) > -1 :

					// Don't pass non-elements to Sizzle
					cur.nodeType === 1 &&
						jQuery.find.matchesSelector(cur, selectors)) ) {

					cur = matched.push( cur );
					break;
                    // 跳出内循环
				}
			}
		}
        // 对最终数组去重处理
		return this.pushStack( matched.length > 1 ? jQuery.unique( matched ) : matched );
	},

	// Determine the position of an element within
	// the matched set of elements
	index: function( elem ) {

		// No argument, return index in parent
        /*
        ① 没有参数，返回当前元素在其父节点中的索引
        ② jQuery.fn.first() 用于获取当前 jQuery 对象所匹配的元素中的第 1 个元素，并返回封装该元素的 jQuery 对象

        注意一下 this[ 0 ] 和 this.first() 的差异：
        this[ 0 ] 是指 this 对象的第一个原生节点
        this.first() 是指 this 对象的第一个原生节点包装后的 jQuery 对象
         */
		if ( !elem ) {
			return ( this[ 0 ] && this[ 0 ].parentNode ) ? this.first().prevAll().length : -1;
		}

		// index in selector
        /*
        jQuery( elem ) 是个类数组，索引 0，1，2... 分别对应原生对象
        这里返回原生对象 this[ 0 ] 在类数组 Query( elem ) 中的索引
         */
		if ( typeof elem === "string" ) {
			return core_indexOf.call( jQuery( elem ), this[ 0 ] );
		}

		// Locate the position of the desired element
        /*
        ① 如果 elem 是个 jQuery 对象，返回 elem[ 0 ] 在 this 这个 jQuery 对象中的索引
        ② elem 是原生对象，返回 elem 在 this 这个 jQuery 对象中的索引\

        其中，每个 jQuery 对象都有 jquery 属性
         */
		return core_indexOf.call( this,

			// If it receives a jQuery object, the first element is used
			elem.jquery ? elem[ 0 ] : elem
		);
	},

    /*
    作用：用于向当前匹配元素中添加符合指定表达式的元素，并以 jQuery 对象的形式返回
    expr    String/Element/jQuery 等类型指定的表达式。
    context 可选/Element/jQuery 等类型指定表示查找范围的文档节点，该参数只有在 expr 参数表示选择器字符串时才可用。
     */
	add: function( selector, context ) {
		var set = typeof selector === "string" ?
				jQuery( selector, context ) :
                // jQuery.makeArray 返回原生元素组成的数组
				jQuery.makeArray( selector && selector.nodeType ? [ selector ] : selector ),
                // this.get() 也是返回原生元素组成的数组
			all = jQuery.merge( this.get(), set );

        // 返回之前去重
		return this.pushStack( jQuery.unique(all) );
	},

    /*
    作用：用于将之前匹配的元素加入到当前匹配的元素中，并以新的jQuery对象的形式返回。
    selector  可选/String 类型指定的选择器字符串
    如果省略selector参数，则添加之前压栈之前的 jQuery 对象

    ① this.prevObject 表示压栈之前的 jQuery 对象
    ② this.prevObject.filter(selector) 表示按照选择符 selector 过滤 this.prevObject
     */
	addBack: function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter(selector)
		);
	}
});

// 从一个元素出发，迭代检索某个方向上的所有元素，找到了就返回
function sibling( cur, dir ) {
	while ( (cur = cur[dir]) && cur.nodeType !== 1 ) {}

	return cur;
}

jQuery.each({
	// 返回父元素
	parent: function( elem ) {
		var parent = elem.parentNode;
		// 11 文档碎片节点
		return parent && parent.nodeType !== 11 ? parent : null;
	},
	// 返回祖先元素
	parents: function( elem ) {
		return jQuery.dir( elem, "parentNode" );
	},
	// 返回祖先元素（到某个祖先元素终止）
	parentsUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "parentNode", until );
	},
	// 返回后面的一个兄弟节点
	next: function( elem ) {
		return sibling( elem, "nextSibling" );
	},
	// 返回前面的一个兄弟节点
	prev: function( elem ) {
		return sibling( elem, "previousSibling" );
	},
	// 返回后面的所有兄弟节点
	nextAll: function( elem ) {
		return jQuery.dir( elem, "nextSibling" );
	},
	// 返回前面的所有兄弟节点
	prevAll: function( elem ) {
		return jQuery.dir( elem, "previousSibling" );
	},
	// 返回后续的兄弟节点（到某个兄弟终止）
	nextUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "nextSibling", until );
	},
	// 返回前面的兄弟节点（到某个兄弟终止）
	prevUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "previousSibling", until );
	},
	// 返回所有的兄弟节点
	siblings: function( elem ) {
		return jQuery.sibling( ( elem.parentNode || {} ).firstChild, elem );
	},
	// 返回所有子节点
	children: function( elem ) {
		return jQuery.sibling( elem.firstChild );
	},
	// 返回当前框架文档或者子元素组成的数组
	contents: function( elem ) {
		// contentDocument 属性以 HTML 对象返回框架容纳的文档
		return elem.contentDocument || jQuery.merge( [], elem.childNodes );
	}
}, function( name, fn ) {
	jQuery.fn[ name ] = function( until, selector ) {
		// 这里得到了一个 matched 数组，下面会对这个数组进行过滤、去重、倒置等操作
		var matched = jQuery.map( this, fn, until );
		/*
		对 this 对象的每一个元素，执行：
		value = fn( this[ i ], i, until )

		以 fn = function( elem ) {
			return jQuery.dir( elem, "nextSibling" );
		} 为例：

		返回一个数组，数组内容为 this[ i ] 后面的所有兄弟元素

		那么 matched 的值就是一个二维数组吗？
		并不是！因为 match 方法最后有个处理：

		return core_concat.apply( [], ret );

		这意味着二维数据 ret，最后会转化为一维数组再返回，举例：
		[].concat.apply([],[[1],[2,3],[4,5]])
		-> [1, 2, 3, 4, 5]
		*/

		if ( name.slice( -5 ) !== "Until" ) {
			selector = until;
		}

		/*
		之前的 matched 中基本已经选好的数据，
		根据选择器 selector，再过滤一下 matched 中的元素
		*/
		if ( selector && typeof selector === "string" ) {
			matched = jQuery.filter( selector, matched );
		}

		// this 为 $('div') 等多个元素集合，对 matched 数组做一些处理
		if ( this.length > 1 ) {
			// Remove duplicates
			/*
			guaranteedUnique = {
				children: true,
				contents: true,
				next: true,
				prev: true
			};

			jQuery.unique() 函数用于根据元素在文档中出现的先后顺序对 DOM 元素数组进行排序，并移除重复的元素。
			*/
			if ( !guaranteedUnique[ name ] ) {
				jQuery.unique( matched );
			}

			// Reverse order for parents* and prev-derivatives
			/*
			rparentsprev = /^(?:parents|prev(?:Until|All))/

			parents、prevAll、prevUntil 等方法，倒置一下 matched 数组
			*/
			if ( rparentsprev.test( name ) ) {
				matched.reverse();
			}
		}

		/*
		将 matched 作为后面链式调用的驱动对象
		eg: $('div').pushStack($('span')).css('background','red') -> span背景变红
		*/
		return this.pushStack( matched );
	};
});

jQuery.extend({
    // 根据选择器 expr，过滤出符合要求的元素节点
	filter: function( expr, elems, not ) {
		var elem = elems[ 0 ];

		if ( not ) {
            // "div" -> ":not(div)"
			expr = ":not(" + expr + ")";
		}

        /*
            ① elems 长度为 1，并且是文档元素：
               调用 matchesSelector 方法，返回一个数组
            ② 否则，调用 matches 方法，jQuery.find.matches( expr，[ elems 中文档节点])

            总之，这里返回值就是一个数组。要么是一个空数组 []，要么是一个包含节点元素的数组
            所以，jQuery.filter 的作用是根据选择器，过滤出符合要求的元素节点
        */
		return elems.length === 1 && elem.nodeType === 1 ?
			jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [] :
			jQuery.find.matches( expr, jQuery.grep( elems, function( elem ) {
				return elem.nodeType === 1;
			}));
	},
	
	/**
	 * 从一个元素出发，迭代检索某个方向上的所有元素并记录，直到与遇到document对象或遇到until匹配的元素
	 * 迭代条件（简化）：cur.nodeType !== 9 && !jQuery( cur ).is( until )
	 * elem	起始元素
	 * dir	迭代方向，可选值：parentNode nextSibling previousSibling
	 * until 选择器表达式，如果遇到until匹配的元素，迭代终止
	 * 返回值：一组原生元素组成的数组
	 */
	dir: function( elem, dir, until ) {
		var matched = [],
			truncate = until !== undefined;
			/*
			① until 为 undefined 时，truncate 为 false;
			② until 不为 undefined 时，truncate 为 true;
			*/

		while ( (elem = elem[ dir ]) && elem.nodeType !== 9 ) {
			if ( elem.nodeType === 1 ) {
				//【until 为 undefined】或【找到了目标元素】，就终止查找
				if ( truncate && jQuery( elem ).is( until ) ) {
					break;
				}
				matched.push( elem );
			}
		}
		return matched;
	},

	// 返回元素 n 的所有后续兄弟元素组成的数组，包含 n ，不包含 elem
	sibling: function( n, elem ) {
		var matched = [];

		for ( ; n; n = n.nextSibling ) {
			if ( n.nodeType === 1 && n !== elem ) {
				matched.push( n );
			}
		}

		return matched;
	}
});

// Implement the identical functionality for filter and not
function winnow( elements, qualifier, not ) {
    /*
    先说一下 jQuery.grep 方法：
    grep: function( elems, callback, inv )
    ① 参数
    elems：数组或者带 length 属性的对象；
    callback：函数
    inv：布尔值，若不是布尔值强制转换为布尔值
    ② 返回值
    一个数组，由 elems 中部分元素组成的数组，也就是说过滤掉了一部分
    ③ 过滤规则：
       !!callback( elems[ i ], i ) 和 !!not 比较，相等就过滤掉这个元素 elems[ i ]
    ④ 总结：找出 elems 中经过 callback 方法运算后不为 inv 的一组元素
       
    下面这段代码功能和 jQuery.grep 挺像的，
    只不过过滤方法执行的时候内部 this 绑定到 elem，并且参数顺序换了一下（i 和 elem）
    */
	if ( jQuery.isFunction( qualifier ) ) {
		return jQuery.grep( elements, function( elem, i ) {
			/* jshint -W018 */
			return !!qualifier.call( elem, i, elem ) !== not;
		});
        // 返回 elements 中部分元素组成的【数组】，判断依据是 qualifier 函数返回值跟 not 是否相等
	}

    // qualifier 是文档节点
	if ( qualifier.nodeType ) {
		return jQuery.grep( elements, function( elem ) {
			return ( elem === qualifier ) !== not;
		});
        // 返回 elements 中部分元素组成的【数组】，判断依据是元素 elem 和 qualifier 是不是同一个节点
	}

    /*
    isSimple = /^.[^:#\[\.,]*$/ 任意字符（除换行符）开头，后面不能是 : # [ . , 等符号就行
    作用：匹配选择器

    isSimple.test('div')  // true
    isSimple.test('.cls') // true
    isSimple.test('#id')  // true

    isSimple.test('div:') // false
    isSimple.test('div#') // false
    */
    // qualifier 是字符串
	if ( typeof qualifier === "string" ) {
        // 如果是选择器字符串，就交给 jQuery.filter 方法处理完就返回
		if ( isSimple.test( qualifier ) ) {
			return jQuery.filter( qualifier, elements, not );
		}
        // 否则，用 jQuery.filter 将 qualifier 字符串修正为【数组】
		qualifier = jQuery.filter( qualifier, elements );
	}

    /*
    core_indexOf = [].indexOf  返回元素在数组中的索引
    [1,2,3].indexOf(1)    // 0
    [1,2,3].indexOf('1')  // -1
    [1,2,3].indexOf(4)    // -1

    这里的 qualifier 是一个数组
    */
	return jQuery.grep( elements, function( elem ) {
		return ( core_indexOf.call( qualifier, elem ) >= 0 ) !== not;
	});
    // 返回 elements 中部分元素组成的【数组】，判断依据是元素 elem 是否在数组 qualifier 之中
}



var rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
	rtagName = /<([\w:]+)/,
	rhtml = /<|&#?\w+;/,
	rnoInnerhtml = /<(?:script|style|link)/i,
	manipulation_rcheckableType = /^(?:checkbox|radio)$/i,
	// checked="checked" or checked
	rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
	rscriptType = /^$|\/(?:java|ecma)script/i,
	rscriptTypeMasked = /^true\/(.*)/,
	rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,

	// We have to close these tags to support XHTML (#13200)
	wrapMap = {

		// Support: IE 9
		option: [ 1, "<select multiple='multiple'>", "</select>" ],

		thead: [ 1, "<table>", "</table>" ],
		col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
		tr: [ 2, "<table><tbody>", "</tbody></table>" ],
		td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

		_default: [ 0, "", "" ]
	};

// Support: IE 9
wrapMap.optgroup = wrapMap.option;

wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;

/*
相当于：
rapMap = {
	optgroup:Array(3)
	option:Array(3)

	tbody:Array(3)
	tfoot:Array(3)
	colgroup:Array(3)
	caption:Array(3)
	thead:Array(3)

	col:Array(3)

	tr:Array(3)

	th:Array(3)
	td:Array(3)

	_default:Array(3)
};
*/

jQuery.fn.extend({
	/*
	对于 jQuery.access 方法（梳理一下该方法内部执行流程）:
	(1) value == undefined
	① key == null -> bulk = true;
	② value == undefined（没传参） -> arguments.length = 0（假），即 chainable 为假
	   -> fn.call(elems)
	   -> jQuery.text( this )
	 也就是说：$('p').text() 相当于 jQuery.text($('p'))

	(2) value !== undefined
	① key == null -> bulk = true;
	② value !== undefined（一定传参） -> chainable = true
	   a. value 不是 function -> raw = true 
	      -> fn.call( elems, value )
		  -> this.empty().append( ( this[ 0 ] && this[ 0 ].ownerDocument || document ).createTextNode( value ) )
		  也就是说：$('p').text('更新的内容') -> 所有的 p 标签内容变为 “更新的内容”
	   b. value 是 function -> raw = undefined（没传参）-> bulk = fn
	      -> fn = function( elem, key, value ) {
				  return bulk.call( jQuery( elem ), value );
			  };
		  -> for 循环：fn( elems[i], key, value.call( elems[i], i, fn( elems[i], key ) ) )
		  -> for 循环：bulk.call( jQuery( elems[i] ), value.call( elems[i], i, fn( elems[i], key ) ) )
		  -> 假设 val = value.call( elems[i], i, fn( elems[i], key ) )，以上相当于：
		     bulk.call( jQuery( elems[i] ), val)
		  -> for 循环：this[i].empty().append( ( this[i][ 0 ] && this[i][ 0 ].ownerDocument || document ).createTextNode( value ) );
		     -> 还是依次给 this 的每个元素更新文本内容
		  -> chainable = true，直接返回上面操作完的 this 对象
	*/
	text: function( value ) {
		return jQuery.access( this, function( value ) {
			return value === undefined ?
				jQuery.text( this ) :
				this.empty().append( ( this[ 0 ] && this[ 0 ].ownerDocument || document ).createTextNode( value ) );
		}, null, value, arguments.length );
	},

	// 在元素内部末尾插入子节点
	append: function() {
		return this.domManip( arguments, function( elem ) {
			// 	Element || document || DocumentFragment
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				/*
				① 如果 this 不是 table，那就不用修正，target 还是 this；
				② 如果 this 是 table，elem 是 tr，那就修正 target 为 this 下的第一个 tbody

				domManip 会执行：callback.call( this[ i ], node, i );
				也就是说，这里的 elem 就是文档碎片 node
				*/
				var target = manipulationTarget( this, elem );
				target.appendChild( elem );
			}
		});
	},

	// 在元素内部最前面插入子节点
	prepend: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.insertBefore( elem, target.firstChild );
			}
		});
	},

	// 在元素前面插入兄弟节点
	before: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this );
			}
		});
	},

	// 在元素后面插入兄弟节点
	after: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this.nextSibling );
			}
		});
	},

	// keepData is for internal use only--do not document
	/*
	作用：从文档中移除匹配的元素，同时移除与元素关联绑定的附加数据（data() 函数）和事件处理器等
	selector ：选择器
	keepData ：是否删除附加数据，默认删除
	*/
	remove: function( selector, keepData ) {
		var elem,
			/*
			① 有选择器（有传入合理参数），删除 this 中选出匹配元素
			② 没有选择器（没有传参），删除 this
			*/
			elems = selector ? jQuery.filter( selector, this ) : this,
			i = 0;

		for ( ; (elem = elems[i]) != null; i++ ) {
			// keepData 为假，表示删除附加数据
			if ( !keepData && elem.nodeType === 1 ) {
				/*
				① getAll( elem ) 获取 elem 及其所有子元素组成的数组
				② jQuery.cleanData 删除元素上的缓存数据（绑定的事件，用户添加的数据等等）
				*/
				jQuery.cleanData( getAll( elem ) );
			}

			if ( elem.parentNode ) {
				// jQuery.contains( elem.ownerDocument, elem ) 为 true 表示元素 elem 在文档 elem.ownerDocument 中
				if ( keepData && jQuery.contains( elem.ownerDocument, elem ) ) {
					// 标记 elem 中的 script 都执行过
					setGlobalEval( getAll( elem, "script" ) );
				}
				// 从文档中移除 elem 元素
				elem.parentNode.removeChild( elem );
			}
		}

		return this;
	},

	// 清空元素内容
	empty: function() {
		var elem,
			i = 0;

		for ( ; (elem = this[i]) != null; i++ ) {
			if ( elem.nodeType === 1 ) {

				// Prevent memory leaks
				jQuery.cleanData( getAll( elem, false ) );

				// Remove any remaining nodes
				/*
				清空元素内容

				eg:
				dom 元素如下：
				console.log(ad)
				-> <li id="ad" class="item"><div class="pic"><a href="http://fang.anjuke.com/loupan/?pi=2345-cnxh-feeds-xf-qita-shenghuo-cy1" data-li="item_a_18" onclick="T.dxwChannel.ajaxDsp(this,73,event)"><img width="100%" src="//img3.2345.com/eimg/201704/e06987a23463d5368ecc2b16626ab76d.jpg" alt=""></a></div><table class="cont"><tbody><tr><td><div class="title"><a href="http://fang.anjuke.com/loupan/?pi=2345-cnxh-feeds-xf-qita-shenghuo-cy1" data-li="item_a_18" onclick="T.dxwChannel.ajaxDsp(this,73,event)">[dsp]5月新开楼盘，户型好 交通便利 首付低！</a></div><div class="extra"><span class="cate">广告</span><span class="from">[dsp]安居客新房</span></div></td></tr></tbody></table></li>
				
				ad.textContent = ""
				console.log(ad)
				-> <li id="ad" class="item"></li>
				*/
				elem.textContent = "";
			}
		}

		return this;
	},

	clone: function( dataAndEvents, deepDataAndEvents ) {
		dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
		deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

		return this.map( function () {
			return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
		});
	},

	html: function( value ) {
		return jQuery.access( this, function( value ) {
			var elem = this[ 0 ] || {},
				i = 0,
				l = this.length;

			if ( value === undefined && elem.nodeType === 1 ) {
				return elem.innerHTML;
			}

			// See if we can take a shortcut and just use innerHTML
			if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
				!wrapMap[ ( rtagName.exec( value ) || [ "", "" ] )[ 1 ].toLowerCase() ] ) {

				value = value.replace( rxhtmlTag, "<$1></$2>" );

				try {
					for ( ; i < l; i++ ) {
						elem = this[ i ] || {};

						// Remove element nodes and prevent memory leaks
						if ( elem.nodeType === 1 ) {
							jQuery.cleanData( getAll( elem, false ) );
							elem.innerHTML = value;
						}
					}

					elem = 0;

				// If using innerHTML throws an exception, use the fallback method
				} catch( e ) {}
			}

			if ( elem ) {
				this.empty().append( value );
			}
		}, null, value, arguments.length );
	},

	replaceWith: function() {
		var
			// Snapshot the DOM in case .domManip sweeps something relevant into its fragment
			args = jQuery.map( this, function( elem ) {
				return [ elem.nextSibling, elem.parentNode ];
			}),
			i = 0;

		// Make the changes, replacing each context element with the new content
		this.domManip( arguments, function( elem ) {
			var next = args[ i++ ],
				parent = args[ i++ ];

			if ( parent ) {
				// Don't use the snapshot next if it has moved (#13810)
				if ( next && next.parentNode !== parent ) {
					next = this.nextSibling;
				}
				jQuery( this ).remove();
				parent.insertBefore( elem, next );
			}
		// Allow new content to include elements from the context set
		}, true );

		// Force removal if there was no new content (e.g., from empty arguments)
		return i ? this : this.remove();
	},

	detach: function( selector ) {
		return this.remove( selector, true );
	},

	/*
	① domManip 即 dom-Manipulate，也就是 dom 操作的意思
	② 参数 args 可以为 HTML字符串，DOM 元素，元素数组，或者 jQuery 对象
	③ domManip 完成两个功能：
	   a. 文档碎片 dom 添加
	   b. 如果 dom 节点里有 script 标签，额外处理一下
	④ domManip 的主要功能是为了实现 DOM 的插入和替换。具体共为以下 5 个函数服务
	内部后插入（append）
	内部前插入（prepend）
	外部前插入（before）
	外部后插入（after）
	替换元素 （replaceWith）

	jQuery.each 方法又生成了另外 5 个函数：
	appendTo、prependTo、insertBefore、insertAfter、replaceAll
	*/
	domManip: function( args, callback, allowIntersection ) {

		// Flatten any nested arrays
		/*
		① 将参数转为真数组
		② 即便有数组类型参数最终还是转成一维数组
		function f(){
			return [].concat.apply([],arguments);
		}
		f(1,2,3) -> [1, 2, 3]
		f(1,[2,3]) -> [1, 2, 3]
		*/
		args = core_concat.apply( [], args );

		var fragment, first, scripts, hasScripts, node, doc,
			i = 0,
			l = this.length,
			set = this,
			iNoClone = l - 1,
			value = args[ 0 ],
			isFunction = jQuery.isFunction( value );

		// We can't cloneNode fragments that contain checked, in WebKit
		/*
		!( l <= 1 || typeof value !== "string" || jQuery.support.checkClone || !rchecked.test( value ) ) 
		-> l > 1 && typeof value === "string" && !jQuery.support.checkClone && rchecked.test( value )

		rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i
		rchecked.test('checked="checked"') -> true

		旧的 WebKit，克隆 fragment 节点，如果该节点下有 input，那么 input 的 checkd 状态不会被复制
		*/
		if ( isFunction || !( l <= 1 || typeof value !== "string" || jQuery.support.checkClone || !rchecked.test( value ) ) ) {
			return this.each(function( index ) {
				var self = set.eq( index );
				if ( isFunction ) {
					/*
					实例方法：
					jQuery.fn.each: function( callback, args ) {
						return jQuery.each( this, callback, args );
					}
					静态方法：
					jQuery.each : function( obj, callback, args ) {
						...
						value = callback.call( obj[ i ], i, obj[ i ] );
						...
					}

					所以，下面的 this 为 set[index]
					*/
					args[ 0 ] = value.call( this, index, self.html() );
				}
				// 如果第一个参数是函数，将其修正为字符串后，递归调用 domManip 方法
				self.domManip( args, callback, allowIntersection );
			});
		}

		if ( l ) {
			fragment = jQuery.buildFragment( args, this[ 0 ].ownerDocument, false, !allowIntersection && this );
			first = fragment.firstChild;
			/*
			var args = $('p');
			fragment = jQuery.buildFragment( args, document, false, false );

			fragment.firstChild
			-> <p>This is a paragraph.</p>
			*/
			
			// 只有一个子节点
			if ( fragment.childNodes.length === 1 ) {
				fragment = first;
			}

			// 必须至少有一个子节点，要不然后面就不会继续处理了
			if ( first ) {
				/*
				① getAll 返回指定元素（参数 1）中标签名为参数 2 的子元素组成的数组
				② disableScript 方法禁用 script 标签
				③ 下面一句表示禁止 fragment 中的所有 script 标签
				*/
				scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
				hasScripts = scripts.length;

				// Use the original fragment for the last item instead of the first because it can end up
				// being emptied incorrectly in certain situations (#8070).
				for ( ; i < l; i++ ) {
					node = fragment;
					
					// 不是最后一个
					if ( i !== iNoClone ) {
						/*
						① 一个 jQuery 对象可能包含多个节点，为了保证每个节点都有碎片内容可用，这里需要克隆出 this.length 个碎片
						② 这里不光克隆碎片节点，连碎片节点的事件，缓存数据等都复制
						③ 碎片节点多次插入文档，script 脚本也是节点元素，多次执行也是应该的，所以下面有多份 script 元素
						*/
						node = jQuery.clone( node, true, true );

						// Keep references to cloned scripts for later restoration
						if ( hasScripts ) {
							// Support: QtWebKit
							// jQuery.merge because core_push.apply(_, arraylike) throws
							jQuery.merge( scripts, getAll( node, "script" ) );
						}
					}
					// 用第二个函数参数来处理获取的文档碎片 node
					callback.call( this[ i ], node, i );
				}

				if ( hasScripts ) {
					doc = scripts[ scripts.length - 1 ].ownerDocument;

					// Reenable scripts，解除脚本禁用
					jQuery.map( scripts, restoreScript );

					// Evaluate executable scripts on first document insertion
					for ( i = 0; i < hasScripts; i++ ) {
						node = scripts[ i ];
						/*
						① rscriptType = /^$|\/(?:java|ecma)script/i
						   type="text/javascript" 或 type="text/ecmascript" 或没有 type 的 script 标签可执行
						② data_priv.access( node, "globalEval" ) 为 true 表示脚本执行过了
						③ jQuery.contains( doc, node ) 为 true 表示 node 真正插入 doc 文档了
						*/
						if ( rscriptType.test( node.type || "" ) &&
							!data_priv.access( node, "globalEval" ) && jQuery.contains( doc, node ) ) {

							if ( node.src ) {
								// Hope ajax is available...
								// 通过 jQuery.ajax 方法发起 get 类型的 http 请求
								jQuery._evalUrl( node.src );
							} else {
								/*
								① globalEval 表示全局解析 script 脚本里的代码
								② rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g
								   剔除掉 html 注释

								   rcleanScript.exec('<!--  -->')
								   -> rcleanScript.exec('<!--  -->')
								*/
								jQuery.globalEval( node.textContent.replace( rcleanScript, "" ) );
							}
						}
					}
				}
			}
		}

		return this;
	}
});

jQuery.each({
	appendTo: "append",
	prependTo: "prepend",
	insertBefore: "before",
	insertAfter: "after",
	replaceAll: "replaceWith"
}, function( name, original ) {
	jQuery.fn[ name ] = function( selector ) {
		var elems,
			ret = [],
			insert = jQuery( selector ),
			last = insert.length - 1,
			i = 0;

		for ( ; i <= last; i++ ) {
			elems = i === last ? this : this.clone( true );
			jQuery( insert[ i ] )[ original ]( elems );

			// Support: QtWebKit
			// .get() because core_push.apply(_, arraylike) throws
			core_push.apply( ret, elems.get() );
		}

		return this.pushStack( ret );
	};
});

jQuery.extend({
	/*
	作用：克隆当前匹配元素集合的一个副本，并以 jQuery 对象的形式返回
	dataAndEvents：是否同时复制元素的附加数据和绑定事件，默认为 false
	deepDataAndEvents：是否同时复制元素的所有子元素的附加数据和绑定事件，默认值即为参数 withDataAndEvents的值。
	*/
	clone: function( elem, dataAndEvents, deepDataAndEvents ) {
		var i, l, srcElements, destElements,
			// 该方法将复制并返回调用它的节点的副本。如果传递给它的参数是 true，它还将递归复制当前节点的所有子孙节点。否则，它只复制当前节点。
			clone = elem.cloneNode( true ),
			// elem 是否已经在文档中
			inPage = jQuery.contains( elem.ownerDocument, elem );

		// Support: IE >= 9
		// Fix Cloning issues
		/*
		① 不支持单选框复选框状态复制（!jQuery.support.noCloneChecked），这里手工修正
		② 支持选中状态复制的就没必要走这一步了，clone 的时候就已经把选中状态复制过去了
		*/
		if ( !jQuery.support.noCloneChecked && ( elem.nodeType === 1 || elem.nodeType === 11 ) && !jQuery.isXMLDoc( elem ) ) {

			// We eschew Sizzle here for performance reasons: http://jsperf.com/getall-vs-sizzle/2
			// getAll 方法获得元素自身和所有的子元素
			destElements = getAll( clone );
			srcElements = getAll( elem );

			for ( i = 0, l = srcElements.length; i < l; i++ ) {
				// 当元素是单选框/复选框的时候，将源节点的选中状态赋值给目标节点
				fixInput( srcElements[ i ], destElements[ i ] );
			}
		}

		// Copy the events from the original to the clone
		// 复制元素的附加数据和绑定事件
		if ( dataAndEvents ) {
			// 同时复制元素的所有子元素的附加数据和绑定事件
			if ( deepDataAndEvents ) {
				/*
				① 大多数浏览器支持单选复选框状态复制，不走上面的 if 块，srcElements、destElements 在这里初始化
				② 剩余的少数浏览器，这里取上面 if 块修正过的 srcElements、destElements
				*/
				srcElements = srcElements || getAll( elem );
				destElements = destElements || getAll( clone );

				for ( i = 0, l = srcElements.length; i < l; i++ ) {
					// 依次复制附加数据和绑定事件
					cloneCopyEvent( srcElements[ i ], destElements[ i ] );
				}
			} else {
				cloneCopyEvent( elem, clone );
			}
		}

		// Preserve script evaluation history
		// 保存脚本历史执行记录
		destElements = getAll( clone, "script" );
		if ( destElements.length > 0 ) {
			/*
			① inPage 为 true，表示 elem 已经在文档中，对 destElements 中每个 script 标记为 false
			   data_priv.set(destElements[ i ], "globalEval", false) 表示脚本都执行过
			② inPage 为 false，elem 不在文档中，它下面的脚本有的执行过，有的没执行过
			   setGlobalEval( destElements, getAll( elem, "script" ) )
			   将 elem 中每个脚本是否执行过的标记复制过去
			*/
			setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
		}

		// Return the cloned set
		return clone;
	},

	/*
	有两个地方调用 buildFragment 方法：
	① parseHTML 中：
	   parsed = jQuery.buildFragment( [ data ], context, scripts );
	② domManip 中：
	   fragment = jQuery.buildFragment( args, this[ 0 ].ownerDocument, false, !allowIntersection && this );

	其中：
	elems 为数组或类数组
	context 为上下文
	scripts 为布尔值或数组
	selection 要么为 false，要么为 jQuery 对象（this）

	简单的看一下这个方法，就是创建一个文档碎片：
	buildFragment: function( elems, context, scripts, selection ) {
		var fragment = context.createDocumentFragment();
		// 第一步： 分解类型，jQuery对象，节点对象，文本，需要包装的元素等，分别加入 nodes 数组
		if ( jQuery.type( elem ) === "object" ) {
            jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );
        } else if ( !rhtml.test( elem ) ) {
            nodes.push( context.createTextNode( elem ) );
        } else {
            jQuery.merge( nodes, tmp.childNodes )
        }
		// 第二步，分别把 nodes 中的元素加入 fragment
		while ( (elem = nodes[ i++ ]) ) {
			fragment.appendChild( elem );
		}
		return fragment;
	};
	*/
	buildFragment: function( elems, context, scripts, selection ) {
		var elem, tmp, tag, wrap, contains, j,
			i = 0,
			l = elems.length,
			fragment = context.createDocumentFragment(),
			nodes = [];
		/*
		DocumentFragment 节点具有下列特征：
		① nodeType 的值为 11
		② nodeName 的值为 #document-fragment
		③ nodeValue 的值为 null
		④ parentNode 的值为 null
		⑤ 子节点可以是 Element、ProcessingInstruction、Comment、Text、CDATASection 或 EntityReference
		⑥ DocumentFragment 节点不属于文档树，继承的 parentNode 属性总是 null
		⑦ 把一个 DocumentFragment 节点插入文档树时，插入的不是 DocumentFragment 自身，而是它的所有子孙节点
		*/
		for ( ; i < l; i++ ) {
			elem = elems[ i ];

			if ( elem || elem === 0 ) {

				// Add nodes directly
				if ( jQuery.type( elem ) === "object" ) {
					// Support: QtWebKit
					// jQuery.merge because core_push.apply(_, arraylike) throws
					jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

				// Convert non-html into a text node
				/*
				rhtml = /<|&#?\w+;/ 匹配 < 或 &#?\w+;
				即匹配包含 < 或 实体 的字符串
				rhtml.test( '<abc' )		// true
				rhtml.test( 'abc&lt;aba' )  // true

				看两个 html 实体符号：
				显示    描述	  实体名称  实体编号
				<		小于号		&lt;	 &#60;
				>		大于号		&gt;	 &#62;
				*/
				// 将不包含 html 标签的字符串转换为文本节点
				} else if ( !rhtml.test( elem ) ) {
					nodes.push( context.createTextNode( elem ) );

				// Convert html into DOM nodes
				} else {
					/*
					① 循环第一次 tmp 为假
					② appendChild 方法的返回值是被添加的节点
					③ 后面的循环，tmp 就是第一次创建的 div 节点
					*/
					tmp = tmp || fragment.appendChild( context.createElement("div") );

					// Deserialize a standard representation
					/*
					rtagName = /<([\w:]+)/ 
					① \w 字母数字或下划线或汉字，不包括 < 和 > 这种符号
					② [\w:] 表示 \w 或 : 
					   也就是说，字母数字或下划线或汉字或:
					
					eg：
					rtagName.exec('<div') -> ["<div", "div", index: 0, input: "<div"]
					rtagName.exec('<div>') ->  ["<div", "div", index: 0, input: "<div>"]
					rtagName.exec('<div><span') -> ["<div", "div", index: 0, input: "<div><span"]

					注意这里的正则没有全局 g 匹配，所以只会取第一个标签

					下面的 tag 就是匹配出来的元素标签名
					*/
					tag = ( rtagName.exec( elem ) || ["", ""] )[ 1 ].toLowerCase();
					/*
					wrap 是从 wrapMap 中匹配出来的数组
					eg: 
					tag 为 thead，wrap 为 [ 1, "<table>", "</table>" ] 
                    tag 不在 wrapMap 属性列表里，wrap 为默认的 [ 0, "", "" ]
					*/
                    wrap = wrapMap[ tag ] || wrapMap._default;
					/*
					(1) rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi
						匹配没有闭合的标签

					① (?!exp) 匹配后面跟的不是exp的位置
					② br、img、input 等本来就不闭合的标签除外
					③ rxhtmlTag.exec('<span />') -> ["<span />", "span ", "span", index: 0, input: "<span />"]
					④ <span></span> 等闭合标签不会通过匹配 rxhtmlTag.exec('<span></span>') -> null

					(2) elem.replace( rxhtmlTag, "<$1></$2>" )
						用第二个参数替换第一个参数

					① 如果第二个参数是字符串，其中的 $1、$2 分别表示 rxhtmlTag 中第 1、2 个子表达式内容
					② 这个替换起到闭合标签的作用 <span /> -> <span ></span>

					(3) 对于 option、tr、td 等一部分元素，需要给他们加一层或多层默认的祖先元素
					eg:
					<td></td> -> <table><tbody><tr><td></td></tr></tbody></table>
					*/
                    tmp.innerHTML = wrap[ 1 ] + elem.replace( rxhtmlTag, "<$1></$2>" ) + wrap[ 2 ];

					// Descend through wrappers to the right content
					/*
					假如：tmp.innerHTML = <table><tbody><tr><td></td></tr></tbody></table>
					j = 3
					执行完下面的循环 tmp = <tr><td></td></tr>
					*/
					j = wrap[ 0 ];
					while ( j-- ) {
						tmp = tmp.lastChild;
					}

					// Support: QtWebKit
					// jQuery.merge because core_push.apply(_, arraylike) throws
					jQuery.merge( nodes, tmp.childNodes );

					// Remember the top-level container
					tmp = fragment.firstChild;

					// Fixes #12346
					// Support: Webkit, IE
					tmp.textContent = "";
				}
			}
		}

		// Remove wrapper from fragment
		fragment.textContent = "";

		i = 0;
		while ( (elem = nodes[ i++ ]) ) {

			// #4087 - If origin and destination elements are the same, and this is
			// that element, do not do anything
			/*
			jQuery.inArray : function ( elem, arr, i ) {
				return arr == null ? -1 : core_indexOf.call( arr, elem, i );
			}

			如果 elem 在数组 selection 里，则跳过这次循环
			*/
			if ( selection && jQuery.inArray( elem, selection ) !== -1 ) {
				continue;
			}

			// 判断 elem 是否已经在 document 文档当中
			contains = jQuery.contains( elem.ownerDocument, elem );

			// Append to fragment
			/*
			① appendChild 方法返回被添加的节点
			② getAll 返回指定元素（参数 1）中标签名为参数 2 的子元素组成的数组
			③ 获取 elem 中的 script 元素
			*/
			tmp = getAll( fragment.appendChild( elem ), "script" );

			// Preserve script evaluation history
			/*
			① setGlobalEval 会依次给 tmp 中每一个元素加一个 "globalEval" 属性：
			   for 循环: data_priv.set(elems[ i ], "globalEval",true)
			② contains 为 true，表示 elem 是否已经在 document 文档当中，那么就表示脚本执行过了
			*/
			if ( contains ) {
				setGlobalEval( tmp );
			}

			// Capture executables
			// domManip 方法调用 buildFragment 方法时，scripts 为 false，以下就没什么事了
			if ( scripts ) {
				j = 0;
				/*
				rscriptType = /^$|\/(?:java|ecma)script/i
				script 标签：
				老式写法：<script type="text/javascript"></script> 
				h5 写法：<script></script>
				
				eg:
				rscriptType.test("") -> true
				rscriptType.test("text/javascript") -> true
				*/
				while ( (elem = tmp[ j++ ]) ) {
					if ( rscriptType.test( elem.type || "" ) ) {
						scripts.push( elem );
					}
				}
			}
		}

		return fragment;
	},

	// 删除元素上的缓存数据（绑定的事件，用户添加的数据等等）
	cleanData: function( elems ) {
		var data, elem, events, type, key, j,
			special = jQuery.event.special,
			i = 0;

		for ( ; (elem = elems[ i ]) !== undefined; i++ ) {
			/*
			① 如果是文档节点，只有 nodeType 是 1 或 9，返回 true
			② 如果是普通对象，都返回 true
			*/
			if ( Data.accepts( elem ) ) {
				/*
				① 每个 Data() 构造函数里有一句：this.expando = jQuery.expando + Math.random();
				   所以，每一个 Data 实例都有一个固定的 expando 属性
				② data_priv = new Data(); 所以 data_priv 也有 expando 属性
				③ elem[ data_priv.expando ] 是 1,2,3...这种自然数
				④ data_priv.cache[ elem[ data_priv.expando ] ] 就是 elem 的私有缓存数据
				*/
				key = elem[ data_priv.expando ];

				if ( key && (data = data_priv.cache[ key ]) ) {
					/*
					① Object.keys() 方法会返回一个由一个给定对象的自身可枚举属性组成的数组，
					数组中属性名的排列顺序和使用 for...in 循环遍历该对象时返回的顺序一致 
					（两者的主要区别是 一个 for-in 循环还会枚举其原型链上的属性）。
					② data.events : {
							click : [handleObj,handleObj,handleObj,...]
							mouseover : [handleObj,handleObj,handleObj,...]
							mousedown : [handleObj,handleObj,handleObj,...]
					   }
					*/
					events = Object.keys( data.events || {} );
					if ( events.length ) {
						for ( j = 0; (type = events[j]) !== undefined; j++ ) {
							// 特殊事件，用 jQuery.event.remove 方法移除，开销较大
							if ( special[ type ] ) {
								jQuery.event.remove( elem, type );

							// This is a shortcut to avoid jQuery.event.remove's overhead
							// 一般的，用 jQuery.removeEvent 调用原生的 removeEventListener 方法移除事件
							} else {
								jQuery.removeEvent( elem, type, data.handle );
							}
						}
					}
					// 元素 elem 对应的【私有数据】都删除
					if ( data_priv.cache[ key ] ) {
						// Discard any remaining `private` data
						delete data_priv.cache[ key ];
					}
				}
			}
			// Discard any remaining `user` data
			// 元素 elem 对应的【用户添加的数据】都删除
			delete data_user.cache[ elem[ data_user.expando ] ];
		}
	},

	_evalUrl: function( url ) {
		return jQuery.ajax({
			url: url,
			type: "GET",
			dataType: "script",
			async: false,
			global: false,
			"throws": true
		});
	}
});

// Support: 1.x compatibility
// Manipulating tables requires a tbody
/*
作用：修正目标元素
① 一般情况下不用修正，直接返回 elem
② 如果元素 elem 是 table，并且 content 是 tr，返回 tbody
*/
function manipulationTarget( elem, content ) {
	/*
	注意运算符优先级：
	&& 高于 || 高于 ? :
	
	① 如果元素 elem 的 nodeName 为 table，并且 content 元素为 tr，返回 elem 下第一个 tbody 元素（没有就创建一个）
	③ 否则，直接返回 elem
	*/
	return jQuery.nodeName( elem, "table" ) &&
		jQuery.nodeName( content.nodeType === 1 ? content : content.firstChild, "tr" ) ?

		elem.getElementsByTagName("tbody")[0] ||
			elem.appendChild( elem.ownerDocument.createElement("tbody") ) :
		elem;
}

// Replace/restore the type attribute of script elements for safe DOM manipulation
/*
假如有两个脚本标签：
<script type="text/javascript" src="js/jquery-2.0.3.js"></script>
<script></script>

s1 = document.getElementsByTagName('script')[0];
s2 = document.getElementsByTagName('script')[1]

disableScript(s1)
-> <script type="true/text/javascript" src="js/jquery-2.0.3.js"></script>
disableScript(s2)
-> <script type="false/"></script>

这样脚本就不会执行了。举个例子：
脚本①：<script>alert(1)</script>
脚本②：<script type="false/">alert(1)</script>

脚本①会弹出 1，脚本②不会。

脚本③：<script type="text/javascript" src="js/jquery-2.0.3.js"></script>
脚本④：<script type="true/text/javascript" src="js/jquery-2.0.3.js"></script>

脚本③会加载 js/jquery-2.0.3.js，脚本④不会
*/
function disableScript( elem ) {
	elem.type = (elem.getAttribute("type") !== null) + "/" + elem.type;
	return elem;
}
/*
rscriptTypeMasked = /^true\/(.*)/

rscriptTypeMasked.exec("text/javascript") 
-> null
rscriptTypeMasked.exec("true/text/javascript")  
->  ["true/text/javascript", "text/javascript", index: 0, input: "true/text/javascript"]

restoreScript 方法解除脚本的禁用状态
*/
function restoreScript( elem ) {
	var match = rscriptTypeMasked.exec( elem.type );

	if ( match ) {
		elem.type = match[ 1 ];
	} else {
		elem.removeAttribute("type");
	}

	return elem;
}

// Mark scripts as having already been evaluated
function setGlobalEval( elems, refElements ) {
	var l = elems.length,
		i = 0;

	for ( ; i < l; i++ ) {
		/*
		注意第三个参数：
		!refElements || data_priv.get( refElements[ i ], "globalEval" )
		① 如果没有参数 refElements，以上表达式为 true
		② 如果 refElements[ i ] 存有属性 "globalEval"，以上表达式也为 true
		
		以上两种情况下，相当于：
		data_priv.set(elems[ i ], "globalEval",true)

		③ 如果有参考元素 refElements，依次将 refElements[ i ] 的执行状态赋值给 elems[ i ]
		*/
		data_priv.set(
			elems[ i ], "globalEval", !refElements || data_priv.get( refElements[ i ], "globalEval" )
		);
	}
}

// 复制附加数据和绑定事件
function cloneCopyEvent( src, dest ) {
	var i, l, type, pdataOld, pdataCur, udataOld, udataCur, events;

	// 如果目标不是 Element，直接返回
	if ( dest.nodeType !== 1 ) {
		return;
	}

	// 1. Copy private data: events, handlers, etc.
	// 如果有私有的缓存数据（events, handlers 等）
	if ( data_priv.hasData( src ) ) {
		// 获取 src 的私有数据
		pdataOld = data_priv.access( src );
		// 将 src 的私有数据依次复制给 dest
		pdataCur = data_priv.set( dest, pdataOld );
		// 事件是比较特殊的私有数据，直接复制过去还不行，还需要重新绑定事件
		events = pdataOld.events;

		if ( events ) {
			delete pdataCur.handle;
			pdataCur.events = {};

			for ( type in events ) {
				for ( i = 0, l = events[ type ].length; i < l; i++ ) {
					// 依次把事件绑定到目标元素上
					jQuery.event.add( dest, type, events[ type ][ i ] );
				}
			}
		}
	}

	// 2. Copy user data
	// 如果有自己添加的缓存数据
	if ( data_user.hasData( src ) ) {
		udataOld = data_user.access( src );
		// 为什么要先把缓存数据给一个中间变量呢？难道是因为这里的数据可以被用户更改，保险起见！
		udataCur = jQuery.extend( {}, udataOld );
		// 将源节点的数据赋值给目标节点
		data_user.set( dest, udataCur );
	}
}



// 根据标签名选择元素
function getAll( context, tag ) {
	var ret = context.getElementsByTagName ? context.getElementsByTagName( tag || "*" ) :
			context.querySelectorAll ? context.querySelectorAll( tag || "*" ) :
			[];

	/*
	&&　优先级高于　||
	① 没有 tag 参数或 context 的 nodeName 就是 tag，这时 ret 为 [context 所有子节点组成的数组]，所以返回的是数组 [ context, 所有子节点 ]
	② 有 tag 参数，返回的是 context 中标签名为 tag 的子元素组成的数组 [node1,node2,...]
	*/
	return tag === undefined || tag && jQuery.nodeName( context, tag ) ?
		jQuery.merge( [ context ], ret ) :
		ret;
}

// Support: IE >= 9
// 将单选框或复选框的值复值过去，克隆 clone 节点的时候调用这个方法
function fixInput( src, dest ) {
	var nodeName = dest.nodeName.toLowerCase();

	// Fails to persist the checked state of a cloned checkbox or radio button.
	/*
	① manipulation_rcheckableType = /^(?:checkbox|radio)$/i 匹配单选框或复选框
	② 强制将源节点的选中状态赋值给目标节点
	*/
	if ( nodeName === "input" && manipulation_rcheckableType.test( src.type ) ) {
		dest.checked = src.checked;

	// Fails to return the selected option to the default selected state when cloning options
	/*
	不会复制某些表单元素的动态，例如用户在 <textarea> 输入的内容、用户在<select>中选择的选项。
	*/
	} else if ( nodeName === "input" || nodeName === "textarea" ) {
		dest.defaultValue = src.defaultValue;
	}
}


jQuery.fn.extend({
	wrapAll: function( html ) {
		var wrap;

		if ( jQuery.isFunction( html ) ) {
			return this.each(function( i ) {
				jQuery( this ).wrapAll( html.call(this, i) );
			});
		}

		if ( this[ 0 ] ) {

			// The elements to wrap the target around
			wrap = jQuery( html, this[ 0 ].ownerDocument ).eq( 0 ).clone( true );

			if ( this[ 0 ].parentNode ) {
				wrap.insertBefore( this[ 0 ] );
			}

			wrap.map(function() {
				var elem = this;

				while ( elem.firstElementChild ) {
					elem = elem.firstElementChild;
				}

				return elem;
			}).append( this );
		}

		return this;
	},

	wrapInner: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each(function( i ) {
				jQuery( this ).wrapInner( html.call(this, i) );
			});
		}

		return this.each(function() {
			var self = jQuery( this ),
				contents = self.contents();

			if ( contents.length ) {
				contents.wrapAll( html );

			} else {
				self.append( html );
			}
		});
	},

    /*
    ① $('div').wrap('<strong class="b"></strong>');
    ② $('div').wrap('<strong />');
    ③ $('div').wrap('<strong>123</strong>');
    ④ $('div').wrap('<strong><em></em></strong>');
    ⑤ $('div').wrap(document.getElementById('wrapper'));
    ⑥ $('div').wrap(function(){});
     */
	wrap: function( html ) {
		var isFunction = jQuery.isFunction( html );

		return this.each(function( i ) {
			jQuery( this ).wrapAll( isFunction ? html.call(this, i) : html );
		});
	},

	unwrap: function() {
		return this.parent().each(function() {
			if ( !jQuery.nodeName( this, "body" ) ) {
				jQuery( this ).replaceWith( this.childNodes );
			}
		}).end();
	}
});








var curCSS, iframe,
	// swappable if display is none or starts with table except "table", "table-cell", or "table-caption"
	// see here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
	rdisplayswap = /^(none|table(?!-c[ea]).+)/,
	rmargin = /^margin/,
	rnumsplit = new RegExp( "^(" + core_pnum + ")(.*)$", "i" ),
	rnumnonpx = new RegExp( "^(" + core_pnum + ")(?!px)[a-z%]+$", "i" ),
	rrelNum = new RegExp( "^([+-])=(" + core_pnum + ")", "i" ),
	elemdisplay = { BODY: "block" },

	cssShow = { position: "absolute", visibility: "hidden", display: "block" },
	cssNormalTransform = {
		letterSpacing: 0,
		fontWeight: 400
	},

	cssExpand = [ "Top", "Right", "Bottom", "Left" ],
	cssPrefixes = [ "Webkit", "O", "Moz", "ms" ];

// return a css property mapped to a potentially vendor prefixed property
function vendorPropName( style, name ) {

	// shortcut for names that are not vendor prefixed
	if ( name in style ) {
		return name;
	}

	// check for vendor prefixed names
	var capName = name.charAt(0).toUpperCase() + name.slice(1),
		origName = name,
		i = cssPrefixes.length;

	while ( i-- ) {
		name = cssPrefixes[ i ] + capName;
		if ( name in style ) {
			return name;
		}
	}

	return origName;
}

function isHidden( elem, el ) {
	// isHidden might be called from jQuery#filter function;
	// in that case, element will be second argument
	elem = el || elem;
	return jQuery.css( elem, "display" ) === "none" || !jQuery.contains( elem.ownerDocument, elem );
}

// NOTE: we've included the "window" in window.getComputedStyle
// because jsdom on node.js will break without it.
function getStyles( elem ) {
	return window.getComputedStyle( elem, null );
}

function showHide( elements, show ) {
	var display, elem, hidden,
		values = [],
		index = 0,
		length = elements.length;

	for ( ; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}

		values[ index ] = data_priv.get( elem, "olddisplay" );
		display = elem.style.display;
		if ( show ) {
			// Reset the inline display of this element to learn if it is
			// being hidden by cascaded rules or not
			if ( !values[ index ] && display === "none" ) {
				elem.style.display = "";
			}

			// Set elements which have been overridden with display: none
			// in a stylesheet to whatever the default browser style is
			// for such an element
			if ( elem.style.display === "" && isHidden( elem ) ) {
				values[ index ] = data_priv.access( elem, "olddisplay", css_defaultDisplay(elem.nodeName) );
			}
		} else {

			if ( !values[ index ] ) {
				hidden = isHidden( elem );

				if ( display && display !== "none" || !hidden ) {
					data_priv.set( elem, "olddisplay", hidden ? display : jQuery.css(elem, "display") );
				}
			}
		}
	}

	// Set the display of most of the elements in a second loop
	// to avoid the constant reflow
	for ( index = 0; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}
		if ( !show || elem.style.display === "none" || elem.style.display === "" ) {
			elem.style.display = show ? values[ index ] || "" : "none";
		}
	}

	return elements;
}

jQuery.fn.extend({
	css: function( name, value ) {
		return jQuery.access( this, function( elem, name, value ) {
			var styles, len,
				map = {},
				i = 0;

			if ( jQuery.isArray( name ) ) {
				styles = getStyles( elem );
				len = name.length;

				for ( ; i < len; i++ ) {
					map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
				}

				return map;
			}

			return value !== undefined ?
				jQuery.style( elem, name, value ) :
				jQuery.css( elem, name );
		}, name, value, arguments.length > 1 );
	},
	show: function() {
		return showHide( this, true );
	},
	hide: function() {
		return showHide( this );
	},
	toggle: function( state ) {
		if ( typeof state === "boolean" ) {
			return state ? this.show() : this.hide();
		}

		return this.each(function() {
			if ( isHidden( this ) ) {
				jQuery( this ).show();
			} else {
				jQuery( this ).hide();
			}
		});
	}
});

jQuery.extend({
	// Add in style property hooks for overriding the default
	// behavior of getting and setting a style property
	cssHooks: {
		opacity: {
			get: function( elem, computed ) {
				if ( computed ) {
					// We should always get a number back from opacity
					var ret = curCSS( elem, "opacity" );
					return ret === "" ? "1" : ret;
				}
			}
		}
	},

	// Don't automatically add "px" to these possibly-unitless properties
	cssNumber: {
		"columnCount": true,
		"fillOpacity": true,
		"fontWeight": true,
		"lineHeight": true,
		"opacity": true,
		"order": true,
		"orphans": true,
		"widows": true,
		"zIndex": true,
		"zoom": true
	},

	// Add in properties whose names you wish to fix before
	// setting or getting the value
	cssProps: {
		// normalize float css property
		"float": "cssFloat"
	},

	// Get and set the style property on a DOM Node
	style: function( elem, name, value, extra ) {
		// Don't set styles on text and comment nodes
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
			return;
		}

		// Make sure that we're working with the right name
		var ret, type, hooks,
			origName = jQuery.camelCase( name ),
			style = elem.style;

		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( style, origName ) );

		// gets hook for the prefixed version
		// followed by the unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// Check if we're setting a value
		if ( value !== undefined ) {
			type = typeof value;

			// convert relative number strings (+= or -=) to relative numbers. #7345
			if ( type === "string" && (ret = rrelNum.exec( value )) ) {
				value = ( ret[1] + 1 ) * ret[2] + parseFloat( jQuery.css( elem, name ) );
				// Fixes bug #9237
				type = "number";
			}

			// Make sure that NaN and null values aren't set. See: #7116
			if ( value == null || type === "number" && isNaN( value ) ) {
				return;
			}

			// If a number was passed in, add 'px' to the (except for certain CSS properties)
			if ( type === "number" && !jQuery.cssNumber[ origName ] ) {
				value += "px";
			}

			// Fixes #8908, it can be done more correctly by specifying setters in cssHooks,
			// but it would mean to define eight (for every problematic property) identical functions
			if ( !jQuery.support.clearCloneStyle && value === "" && name.indexOf("background") === 0 ) {
				style[ name ] = "inherit";
			}

			// If a hook was provided, use that value, otherwise just set the specified value
			if ( !hooks || !("set" in hooks) || (value = hooks.set( elem, value, extra )) !== undefined ) {
				style[ name ] = value;
			}

		} else {
			// If a hook was provided get the non-computed value from there
			if ( hooks && "get" in hooks && (ret = hooks.get( elem, false, extra )) !== undefined ) {
				return ret;
			}

			// Otherwise just get the value from the style object
			return style[ name ];
		}
	},

	css: function( elem, name, extra, styles ) {
		var val, num, hooks,
			origName = jQuery.camelCase( name );

		// Make sure that we're working with the right name
		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( elem.style, origName ) );

		// gets hook for the prefixed version
		// followed by the unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// If a hook was provided get the computed value from there
		if ( hooks && "get" in hooks ) {
			val = hooks.get( elem, true, extra );
		}

		// Otherwise, if a way to get the computed value exists, use that
		if ( val === undefined ) {
			val = curCSS( elem, name, styles );
		}

		//convert "normal" to computed value
		if ( val === "normal" && name in cssNormalTransform ) {
			val = cssNormalTransform[ name ];
		}

		// Return, converting to number if forced or a qualifier was provided and val looks numeric
		if ( extra === "" || extra ) {
			num = parseFloat( val );
			return extra === true || jQuery.isNumeric( num ) ? num || 0 : val;
		}
		return val;
	}
});

curCSS = function( elem, name, _computed ) {
	var width, minWidth, maxWidth,
		computed = _computed || getStyles( elem ),

		// Support: IE9
		// getPropertyValue is only needed for .css('filter') in IE9, see #12537
		ret = computed ? computed.getPropertyValue( name ) || computed[ name ] : undefined,
		style = elem.style;

	if ( computed ) {

		if ( ret === "" && !jQuery.contains( elem.ownerDocument, elem ) ) {
			ret = jQuery.style( elem, name );
		}

		// Support: Safari 5.1
		// A tribute to the "awesome hack by Dean Edwards"
		// Safari 5.1.7 (at least) returns percentage for a larger set of values, but width seems to be reliably pixels
		// this is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
		if ( rnumnonpx.test( ret ) && rmargin.test( name ) ) {

			// Remember the original values
			width = style.width;
			minWidth = style.minWidth;
			maxWidth = style.maxWidth;

			// Put in the new values to get a computed value out
			style.minWidth = style.maxWidth = style.width = ret;
			ret = computed.width;

			// Revert the changed values
			style.width = width;
			style.minWidth = minWidth;
			style.maxWidth = maxWidth;
		}
	}

	return ret;
};


function setPositiveNumber( elem, value, subtract ) {
	var matches = rnumsplit.exec( value );
	return matches ?
		// Guard against undefined "subtract", e.g., when used as in cssHooks
		Math.max( 0, matches[ 1 ] - ( subtract || 0 ) ) + ( matches[ 2 ] || "px" ) :
		value;
}

function augmentWidthOrHeight( elem, name, extra, isBorderBox, styles ) {
	var i = extra === ( isBorderBox ? "border" : "content" ) ?
		// If we already have the right measurement, avoid augmentation
		4 :
		// Otherwise initialize for horizontal or vertical properties
		name === "width" ? 1 : 0,

		val = 0;

	for ( ; i < 4; i += 2 ) {
		// both box models exclude margin, so add it if we want it
		if ( extra === "margin" ) {
			val += jQuery.css( elem, extra + cssExpand[ i ], true, styles );
		}

		if ( isBorderBox ) {
			// border-box includes padding, so remove it if we want content
			if ( extra === "content" ) {
				val -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
			}

			// at this point, extra isn't border nor margin, so remove border
			if ( extra !== "margin" ) {
				val -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		} else {
			// at this point, extra isn't content, so add padding
			val += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

			// at this point, extra isn't content nor padding, so add border
			if ( extra !== "padding" ) {
				val += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		}
	}

	return val;
}

function getWidthOrHeight( elem, name, extra ) {

	// Start with offset property, which is equivalent to the border-box value
	var valueIsBorderBox = true,
		val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
		styles = getStyles( elem ),
		isBorderBox = jQuery.support.boxSizing && jQuery.css( elem, "boxSizing", false, styles ) === "border-box";

	// some non-html elements return undefined for offsetWidth, so check for null/undefined
	// svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
	// MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
	if ( val <= 0 || val == null ) {
		// Fall back to computed then uncomputed css if necessary
		val = curCSS( elem, name, styles );
		if ( val < 0 || val == null ) {
			val = elem.style[ name ];
		}

		// Computed unit is not pixels. Stop here and return.
		if ( rnumnonpx.test(val) ) {
			return val;
		}

		// we need the check for style in case a browser which returns unreliable values
		// for getComputedStyle silently falls back to the reliable elem.style
		valueIsBorderBox = isBorderBox && ( jQuery.support.boxSizingReliable || val === elem.style[ name ] );

		// Normalize "", auto, and prepare for extra
		val = parseFloat( val ) || 0;
	}

	// use the active box-sizing model to add/subtract irrelevant styles
	return ( val +
		augmentWidthOrHeight(
			elem,
			name,
			extra || ( isBorderBox ? "border" : "content" ),
			valueIsBorderBox,
			styles
		)
	) + "px";
}

// Try to determine the default display value of an element
function css_defaultDisplay( nodeName ) {
	var doc = document,
		display = elemdisplay[ nodeName ];

	if ( !display ) {
		display = actualDisplay( nodeName, doc );

		// If the simple way fails, read from inside an iframe
		if ( display === "none" || !display ) {
			// Use the already-created iframe if possible
			iframe = ( iframe ||
				jQuery("<iframe frameborder='0' width='0' height='0'/>")
				.css( "cssText", "display:block !important" )
			).appendTo( doc.documentElement );

			// Always write a new HTML skeleton so Webkit and Firefox don't choke on reuse
			doc = ( iframe[0].contentWindow || iframe[0].contentDocument ).document;
			doc.write("<!doctype html><html><body>");
			doc.close();

			display = actualDisplay( nodeName, doc );
			iframe.detach();
		}

		// Store the correct default display
		elemdisplay[ nodeName ] = display;
	}

	return display;
}

// Called ONLY from within css_defaultDisplay
function actualDisplay( name, doc ) {
	var elem = jQuery( doc.createElement( name ) ).appendTo( doc.body ),
		display = jQuery.css( elem[0], "display" );
	elem.remove();
	return display;
}

jQuery.each([ "height", "width" ], function( i, name ) {
	jQuery.cssHooks[ name ] = {
		get: function( elem, computed, extra ) {
			if ( computed ) {
				// certain elements can have dimension info if we invisibly show them
				// however, it must have a current display style that would benefit from this
				return elem.offsetWidth === 0 && rdisplayswap.test( jQuery.css( elem, "display" ) ) ?
					jQuery.swap( elem, cssShow, function() {
						return getWidthOrHeight( elem, name, extra );
					}) :
					getWidthOrHeight( elem, name, extra );
			}
		},

		set: function( elem, value, extra ) {
			var styles = extra && getStyles( elem );
			return setPositiveNumber( elem, value, extra ?
				augmentWidthOrHeight(
					elem,
					name,
					extra,
					jQuery.support.boxSizing && jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
					styles
				) : 0
			);
		}
	};
});

// These hooks cannot be added until DOM ready because the support test
// for it is not run until after DOM ready
jQuery(function() {
	// Support: Android 2.3
	if ( !jQuery.support.reliableMarginRight ) {
		jQuery.cssHooks.marginRight = {
			get: function( elem, computed ) {
				if ( computed ) {
					// Support: Android 2.3
					// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
					// Work around by temporarily setting element display to inline-block
					return jQuery.swap( elem, { "display": "inline-block" },
						curCSS, [ elem, "marginRight" ] );
				}
			}
		};
	}

	// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
	// getComputedStyle returns percent when specified for top/left/bottom/right
	// rather than make the css module depend on the offset module, we just check for it here
	if ( !jQuery.support.pixelPosition && jQuery.fn.position ) {
		jQuery.each( [ "top", "left" ], function( i, prop ) {
			jQuery.cssHooks[ prop ] = {
				get: function( elem, computed ) {
					if ( computed ) {
						computed = curCSS( elem, prop );
						// if curCSS returns percentage, fallback to offset
						return rnumnonpx.test( computed ) ?
							jQuery( elem ).position()[ prop ] + "px" :
							computed;
					}
				}
			};
		});
	}

});

if ( jQuery.expr && jQuery.expr.filters ) {
	jQuery.expr.filters.hidden = function( elem ) {
		// Support: Opera <= 12.12
		// Opera reports offsetWidths and offsetHeights less than zero on some elements
		return elem.offsetWidth <= 0 && elem.offsetHeight <= 0;
	};

	jQuery.expr.filters.visible = function( elem ) {
		return !jQuery.expr.filters.hidden( elem );
	};
}

// These hooks are used by animate to expand properties
jQuery.each({
	margin: "",
	padding: "",
	border: "Width"
}, function( prefix, suffix ) {
	jQuery.cssHooks[ prefix + suffix ] = {
		expand: function( value ) {
			var i = 0,
				expanded = {},

				// assumes a single number if not a string
				parts = typeof value === "string" ? value.split(" ") : [ value ];

			for ( ; i < 4; i++ ) {
				expanded[ prefix + cssExpand[ i ] + suffix ] =
					parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
			}

			return expanded;
		}
	};

	if ( !rmargin.test( prefix ) ) {
		jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
	}
});
var r20 = /%20/g,
	rbracket = /\[\]$/,
	rCRLF = /\r?\n/g,
	rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
	rsubmittable = /^(?:input|select|textarea|keygen)/i;

jQuery.fn.extend({
	serialize: function() {
		return jQuery.param( this.serializeArray() );
	},
	serializeArray: function() {
		return this.map(function(){
			// Can add propHook for "elements" to filter or add form elements
			var elements = jQuery.prop( this, "elements" );
			return elements ? jQuery.makeArray( elements ) : this;
		})
		.filter(function(){
			var type = this.type;
			// Use .is(":disabled") so that fieldset[disabled] works
			return this.name && !jQuery( this ).is( ":disabled" ) &&
				rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
				( this.checked || !manipulation_rcheckableType.test( type ) );
		})
		.map(function( i, elem ){
			var val = jQuery( this ).val();

			return val == null ?
				null :
				jQuery.isArray( val ) ?
					jQuery.map( val, function( val ){
						return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
					}) :
					{ name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
		}).get();
	}
});

//Serialize an array of form elements or a set of
//key/values into a query string
jQuery.param = function( a, traditional ) {
	var prefix,
		s = [],
		add = function( key, value ) {
			// If value is a function, invoke it and return its value
			value = jQuery.isFunction( value ) ? value() : ( value == null ? "" : value );
			s[ s.length ] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
		};

	// Set traditional to true for jQuery <= 1.3.2 behavior.
	if ( traditional === undefined ) {
		traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;
	}

	// If an array was passed in, assume that it is an array of form elements.
	if ( jQuery.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {
		// Serialize the form elements
		jQuery.each( a, function() {
			add( this.name, this.value );
		});

	} else {
		// If traditional, encode the "old" way (the way 1.3.2 or older
		// did it), otherwise encode params recursively.
		for ( prefix in a ) {
			buildParams( prefix, a[ prefix ], traditional, add );
		}
	}

	// Return the resulting serialization
	return s.join( "&" ).replace( r20, "+" );
};

function buildParams( prefix, obj, traditional, add ) {
	var name;

	if ( jQuery.isArray( obj ) ) {
		// Serialize array item.
		jQuery.each( obj, function( i, v ) {
			if ( traditional || rbracket.test( prefix ) ) {
				// Treat each array item as a scalar.
				add( prefix, v );

			} else {
				// Item is non-scalar (array or object), encode its numeric index.
				buildParams( prefix + "[" + ( typeof v === "object" ? i : "" ) + "]", v, traditional, add );
			}
		});

	} else if ( !traditional && jQuery.type( obj ) === "object" ) {
		// Serialize object item.
		for ( name in obj ) {
			buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
		}

	} else {
		// Serialize scalar item.
		add( prefix, obj );
	}
}
jQuery.each( ("blur focus focusin focusout load resize scroll unload click dblclick " +
	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
	"change select submit keydown keypress keyup error contextmenu").split(" "), function( i, name ) {

	// Handle event binding
    /*
    ① 如果参数大于 0，绑定事件
    $('.button').click(fn);
    -> $('.button').on( 'click', null, data, fn );
    ② 如果参数为空，触发事件
    $('.button').click()
    -> $('.button').trigger( 'click' );

    也就是说：
    $("#btn").trigger("click");
    可以简写为：
    $("#btn").click();
    */
	jQuery.fn[ name ] = function( data, fn ) {
		return arguments.length > 0 ?
			this.on( name, null, data, fn ) :
			this.trigger( name );
	};
});

jQuery.fn.extend({
    /*
    ① 2 个函数参数，第 1 个参数在鼠标移入的时候触发，第 2 个参数在鼠标移出时触发
    ② 如果只有 1 个函数参数，那移入移出都执行这个方法
    */
	hover: function( fnOver, fnOut ) {
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	},

	bind: function( types, data, fn ) {
		return this.on( types, null, data, fn );
	},
	unbind: function( types, fn ) {
		return this.off( types, null, fn );
	},

	delegate: function( selector, types, data, fn ) {
		return this.on( types, selector, data, fn );
	},
	undelegate: function( selector, types, fn ) {
		// ( namespace ) or ( selector, types [, fn] )
		return arguments.length === 1 ? this.off( selector, "**" ) : this.off( types, selector || "**", fn );
	}
});
var
	// Document location
	ajaxLocParts,
	ajaxLocation,

	ajax_nonce = jQuery.now(),

	ajax_rquery = /\?/,
	rhash = /#.*$/,
	rts = /([?&])_=[^&]*/,
	rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg,
	// #7653, #8125, #8152: local protocol detection
	rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
	rnoContent = /^(?:GET|HEAD)$/,
	rprotocol = /^\/\//,
	rurl = /^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,

	// Keep a copy of the old load method
	_load = jQuery.fn.load,

	/* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */
	prefilters = {},

	/* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */
	transports = {},

	// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
	allTypes = "*/".concat("*");

// #8138, IE may throw an exception when accessing
// a field from window.location if document.domain has been set
try {
	ajaxLocation = location.href;
} catch( e ) {
	// Use the href attribute of an A element
	// since IE will modify it given document.location
	ajaxLocation = document.createElement( "a" );
	ajaxLocation.href = "";
	ajaxLocation = ajaxLocation.href;
}

// Segment location into parts
ajaxLocParts = rurl.exec( ajaxLocation.toLowerCase() ) || [];

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports( structure ) {

	// dataTypeExpression is optional and defaults to "*"
	return function( dataTypeExpression, func ) {

		if ( typeof dataTypeExpression !== "string" ) {
			func = dataTypeExpression;
			dataTypeExpression = "*";
		}

		var dataType,
			i = 0,
			dataTypes = dataTypeExpression.toLowerCase().match( core_rnotwhite ) || [];

		if ( jQuery.isFunction( func ) ) {
			// For each dataType in the dataTypeExpression
			while ( (dataType = dataTypes[i++]) ) {
				// Prepend if requested
				if ( dataType[0] === "+" ) {
					dataType = dataType.slice( 1 ) || "*";
					(structure[ dataType ] = structure[ dataType ] || []).unshift( func );

				// Otherwise append
				} else {
					(structure[ dataType ] = structure[ dataType ] || []).push( func );
				}
			}
		}
	};
}

// Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {

	var inspected = {},
		seekingTransport = ( structure === transports );

	function inspect( dataType ) {
		var selected;
		inspected[ dataType ] = true;
		jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
			var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
			if( typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[ dataTypeOrTransport ] ) {
				options.dataTypes.unshift( dataTypeOrTransport );
				inspect( dataTypeOrTransport );
				return false;
			} else if ( seekingTransport ) {
				return !( selected = dataTypeOrTransport );
			}
		});
		return selected;
	}

	return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend( target, src ) {
	var key, deep,
		flatOptions = jQuery.ajaxSettings.flatOptions || {};

	for ( key in src ) {
		if ( src[ key ] !== undefined ) {
			( flatOptions[ key ] ? target : ( deep || (deep = {}) ) )[ key ] = src[ key ];
		}
	}
	if ( deep ) {
		jQuery.extend( true, target, deep );
	}

	return target;
}

jQuery.fn.load = function( url, params, callback ) {
	if ( typeof url !== "string" && _load ) {
		return _load.apply( this, arguments );
	}

	var selector, type, response,
		self = this,
		off = url.indexOf(" ");

	if ( off >= 0 ) {
		selector = url.slice( off );
		url = url.slice( 0, off );
	}

	// If it's a function
	if ( jQuery.isFunction( params ) ) {

		// We assume that it's the callback
		callback = params;
		params = undefined;

	// Otherwise, build a param string
	} else if ( params && typeof params === "object" ) {
		type = "POST";
	}

	// If we have elements to modify, make the request
	if ( self.length > 0 ) {
		jQuery.ajax({
			url: url,

			// if "type" variable is undefined, then "GET" method will be used
			type: type,
			dataType: "html",
			data: params
		}).done(function( responseText ) {

			// Save response for use in complete callback
			response = arguments;

			self.html( selector ?

				// If a selector was specified, locate the right elements in a dummy div
				// Exclude scripts to avoid IE 'Permission Denied' errors
				jQuery("<div>").append( jQuery.parseHTML( responseText ) ).find( selector ) :

				// Otherwise use the full result
				responseText );

		}).complete( callback && function( jqXHR, status ) {
			self.each( callback, response || [ jqXHR.responseText, status, jqXHR ] );
		});
	}

	return this;
};

// Attach a bunch of functions for handling common AJAX events
jQuery.each( [ "ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend" ], function( i, type ){
	jQuery.fn[ type ] = function( fn ){
		return this.on( type, fn );
	};
});

jQuery.extend({

	// Counter for holding the number of active queries
	active: 0,

	// Last-Modified header cache for next request
	lastModified: {},
	etag: {},

	ajaxSettings: {
		url: ajaxLocation,
		type: "GET",
		isLocal: rlocalProtocol.test( ajaxLocParts[ 1 ] ),
		global: true,
		processData: true,
		async: true,
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",
		/*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		traditional: false,
		headers: {},
		*/

		accepts: {
			"*": allTypes,
			text: "text/plain",
			html: "text/html",
			xml: "application/xml, text/xml",
			json: "application/json, text/javascript"
		},

		contents: {
			xml: /xml/,
			html: /html/,
			json: /json/
		},

		responseFields: {
			xml: "responseXML",
			text: "responseText",
			json: "responseJSON"
		},

		// Data converters
		// Keys separate source (or catchall "*") and destination types with a single space
		converters: {

			// Convert anything to text
			"* text": String,

			// Text to html (true = no transformation)
			"text html": true,

			// Evaluate text as a json expression
			"text json": jQuery.parseJSON,

			// Parse text as xml
			"text xml": jQuery.parseXML
		},

		// For options that shouldn't be deep extended:
		// you can add your own custom options here if
		// and when you create one that shouldn't be
		// deep extended (see ajaxExtend)
		flatOptions: {
			url: true,
			context: true
		}
	},

	// Creates a full fledged settings object into target
	// with both ajaxSettings and settings fields.
	// If target is omitted, writes into ajaxSettings.
	ajaxSetup: function( target, settings ) {
		return settings ?

			// Building a settings object
			ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

			// Extending ajaxSettings
			ajaxExtend( jQuery.ajaxSettings, target );
	},

	ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
	ajaxTransport: addToPrefiltersOrTransports( transports ),

	// Main method
	ajax: function( url, options ) {

		// If url is an object, simulate pre-1.5 signature
		if ( typeof url === "object" ) {
			options = url;
			url = undefined;
		}

		// Force options to be an object
		options = options || {};

		var transport,
			// URL without anti-cache param
			cacheURL,
			// Response headers
			responseHeadersString,
			responseHeaders,
			// timeout handle
			timeoutTimer,
			// Cross-domain detection vars
			parts,
			// To know if global events are to be dispatched
			fireGlobals,
			// Loop variable
			i,
			// Create the final options object
			s = jQuery.ajaxSetup( {}, options ),
			// Callbacks context
			callbackContext = s.context || s,
			// Context for global events is callbackContext if it is a DOM node or jQuery collection
			globalEventContext = s.context && ( callbackContext.nodeType || callbackContext.jquery ) ?
				jQuery( callbackContext ) :
				jQuery.event,
			// Deferreds
			deferred = jQuery.Deferred(),
			completeDeferred = jQuery.Callbacks("once memory"),
			// Status-dependent callbacks
			statusCode = s.statusCode || {},
			// Headers (they are sent all at once)
			requestHeaders = {},
			requestHeadersNames = {},
			// The jqXHR state
			state = 0,
			// Default abort message
			strAbort = "canceled",
			// Fake xhr
			jqXHR = {
				readyState: 0,

				// Builds headers hashtable if needed
				getResponseHeader: function( key ) {
					var match;
					if ( state === 2 ) {
						if ( !responseHeaders ) {
							responseHeaders = {};
							while ( (match = rheaders.exec( responseHeadersString )) ) {
								responseHeaders[ match[1].toLowerCase() ] = match[ 2 ];
							}
						}
						match = responseHeaders[ key.toLowerCase() ];
					}
					return match == null ? null : match;
				},

				// Raw string
				getAllResponseHeaders: function() {
					return state === 2 ? responseHeadersString : null;
				},

				// Caches the header
				setRequestHeader: function( name, value ) {
					var lname = name.toLowerCase();
					if ( !state ) {
						name = requestHeadersNames[ lname ] = requestHeadersNames[ lname ] || name;
						requestHeaders[ name ] = value;
					}
					return this;
				},

				// Overrides response content-type header
				overrideMimeType: function( type ) {
					if ( !state ) {
						s.mimeType = type;
					}
					return this;
				},

				// Status-dependent callbacks
				statusCode: function( map ) {
					var code;
					if ( map ) {
						if ( state < 2 ) {
							for ( code in map ) {
								// Lazy-add the new callback in a way that preserves old ones
								statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
							}
						} else {
							// Execute the appropriate callbacks
							jqXHR.always( map[ jqXHR.status ] );
						}
					}
					return this;
				},

				// Cancel the request
				abort: function( statusText ) {
					var finalText = statusText || strAbort;
					if ( transport ) {
						transport.abort( finalText );
					}
					done( 0, finalText );
					return this;
				}
			};

		// Attach deferreds
		deferred.promise( jqXHR ).complete = completeDeferred.add;
		jqXHR.success = jqXHR.done;
		jqXHR.error = jqXHR.fail;

		// Remove hash character (#7531: and string promotion)
		// Add protocol if not provided (prefilters might expect it)
		// Handle falsy url in the settings object (#10093: consistency with old signature)
		// We also use the url parameter if available
		s.url = ( ( url || s.url || ajaxLocation ) + "" ).replace( rhash, "" )
			.replace( rprotocol, ajaxLocParts[ 1 ] + "//" );

		// Alias method option to type as per ticket #12004
		s.type = options.method || options.type || s.method || s.type;

		// Extract dataTypes list
		s.dataTypes = jQuery.trim( s.dataType || "*" ).toLowerCase().match( core_rnotwhite ) || [""];

		// A cross-domain request is in order when we have a protocol:host:port mismatch
		if ( s.crossDomain == null ) {
			parts = rurl.exec( s.url.toLowerCase() );
			s.crossDomain = !!( parts &&
				( parts[ 1 ] !== ajaxLocParts[ 1 ] || parts[ 2 ] !== ajaxLocParts[ 2 ] ||
					( parts[ 3 ] || ( parts[ 1 ] === "http:" ? "80" : "443" ) ) !==
						( ajaxLocParts[ 3 ] || ( ajaxLocParts[ 1 ] === "http:" ? "80" : "443" ) ) )
			);
		}

		// Convert data if not already a string
		if ( s.data && s.processData && typeof s.data !== "string" ) {
			s.data = jQuery.param( s.data, s.traditional );
		}

		// Apply prefilters
		inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

		// If request was aborted inside a prefilter, stop there
		if ( state === 2 ) {
			return jqXHR;
		}

		// We can fire global events as of now if asked to
		fireGlobals = s.global;

		// Watch for a new set of requests
		if ( fireGlobals && jQuery.active++ === 0 ) {
			jQuery.event.trigger("ajaxStart");
		}

		// Uppercase the type
		s.type = s.type.toUpperCase();

		// Determine if request has content
		s.hasContent = !rnoContent.test( s.type );

		// Save the URL in case we're toying with the If-Modified-Since
		// and/or If-None-Match header later on
		cacheURL = s.url;

		// More options handling for requests with no content
		if ( !s.hasContent ) {

			// If data is available, append data to url
			if ( s.data ) {
				cacheURL = ( s.url += ( ajax_rquery.test( cacheURL ) ? "&" : "?" ) + s.data );
				// #9682: remove data so that it's not used in an eventual retry
				delete s.data;
			}

			// Add anti-cache in url if needed
			if ( s.cache === false ) {
				s.url = rts.test( cacheURL ) ?

					// If there is already a '_' parameter, set its value
					cacheURL.replace( rts, "$1_=" + ajax_nonce++ ) :

					// Otherwise add one to the end
					cacheURL + ( ajax_rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + ajax_nonce++;
			}
		}

		// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
		if ( s.ifModified ) {
			if ( jQuery.lastModified[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
			}
			if ( jQuery.etag[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
			}
		}

		// Set the correct header, if data is being sent
		if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
			jqXHR.setRequestHeader( "Content-Type", s.contentType );
		}

		// Set the Accepts header for the server, depending on the dataType
		jqXHR.setRequestHeader(
			"Accept",
			s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[0] ] ?
				s.accepts[ s.dataTypes[0] ] + ( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
				s.accepts[ "*" ]
		);

		// Check for headers option
		for ( i in s.headers ) {
			jqXHR.setRequestHeader( i, s.headers[ i ] );
		}

		// Allow custom headers/mimetypes and early abort
		if ( s.beforeSend && ( s.beforeSend.call( callbackContext, jqXHR, s ) === false || state === 2 ) ) {
			// Abort if not done already and return
			return jqXHR.abort();
		}

		// aborting is no longer a cancellation
		strAbort = "abort";

		// Install callbacks on deferreds
		for ( i in { success: 1, error: 1, complete: 1 } ) {
			jqXHR[ i ]( s[ i ] );
		}

		// Get transport
		transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

		// If no transport, we auto-abort
		if ( !transport ) {
			done( -1, "No Transport" );
		} else {
			jqXHR.readyState = 1;

			// Send global event
			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
			}
			// Timeout
			if ( s.async && s.timeout > 0 ) {
				timeoutTimer = setTimeout(function() {
					jqXHR.abort("timeout");
				}, s.timeout );
			}

			try {
				state = 1;
				transport.send( requestHeaders, done );
			} catch ( e ) {
				// Propagate exception as error if not done
				if ( state < 2 ) {
					done( -1, e );
				// Simply rethrow otherwise
				} else {
					throw e;
				}
			}
		}

		// Callback for when everything is done
		function done( status, nativeStatusText, responses, headers ) {
			var isSuccess, success, error, response, modified,
				statusText = nativeStatusText;

			// Called once
			if ( state === 2 ) {
				return;
			}

			// State is "done" now
			state = 2;

			// Clear timeout if it exists
			if ( timeoutTimer ) {
				clearTimeout( timeoutTimer );
			}

			// Dereference transport for early garbage collection
			// (no matter how long the jqXHR object will be used)
			transport = undefined;

			// Cache response headers
			responseHeadersString = headers || "";

			// Set readyState
			jqXHR.readyState = status > 0 ? 4 : 0;

			// Determine if successful
			isSuccess = status >= 200 && status < 300 || status === 304;

			// Get response data
			if ( responses ) {
				response = ajaxHandleResponses( s, jqXHR, responses );
			}

			// Convert no matter what (that way responseXXX fields are always set)
			response = ajaxConvert( s, response, jqXHR, isSuccess );

			// If successful, handle type chaining
			if ( isSuccess ) {

				// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
				if ( s.ifModified ) {
					modified = jqXHR.getResponseHeader("Last-Modified");
					if ( modified ) {
						jQuery.lastModified[ cacheURL ] = modified;
					}
					modified = jqXHR.getResponseHeader("etag");
					if ( modified ) {
						jQuery.etag[ cacheURL ] = modified;
					}
				}

				// if no content
				if ( status === 204 || s.type === "HEAD" ) {
					statusText = "nocontent";

				// if not modified
				} else if ( status === 304 ) {
					statusText = "notmodified";

				// If we have data, let's convert it
				} else {
					statusText = response.state;
					success = response.data;
					error = response.error;
					isSuccess = !error;
				}
			} else {
				// We extract error from statusText
				// then normalize statusText and status for non-aborts
				error = statusText;
				if ( status || !statusText ) {
					statusText = "error";
					if ( status < 0 ) {
						status = 0;
					}
				}
			}

			// Set data for the fake xhr object
			jqXHR.status = status;
			jqXHR.statusText = ( nativeStatusText || statusText ) + "";

			// Success/Error
			if ( isSuccess ) {
				deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
			} else {
				deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
			}

			// Status-dependent callbacks
			jqXHR.statusCode( statusCode );
			statusCode = undefined;

			if ( fireGlobals ) {
				globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
					[ jqXHR, s, isSuccess ? success : error ] );
			}

			// Complete
			completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );
				// Handle the global AJAX counter
				if ( !( --jQuery.active ) ) {
					jQuery.event.trigger("ajaxStop");
				}
			}
		}

		return jqXHR;
	},

	getJSON: function( url, data, callback ) {
		return jQuery.get( url, data, callback, "json" );
	},

	getScript: function( url, callback ) {
		return jQuery.get( url, undefined, callback, "script" );
	}
});

jQuery.each( [ "get", "post" ], function( i, method ) {
	jQuery[ method ] = function( url, data, callback, type ) {
		// shift arguments if data argument was omitted
		if ( jQuery.isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = undefined;
		}

		return jQuery.ajax({
			url: url,
			type: method,
			dataType: type,
			data: data,
			success: callback
		});
	};
});

/* Handles responses to an ajax request:
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
function ajaxHandleResponses( s, jqXHR, responses ) {

	var ct, type, finalDataType, firstDataType,
		contents = s.contents,
		dataTypes = s.dataTypes;

	// Remove auto dataType and get content-type in the process
	while( dataTypes[ 0 ] === "*" ) {
		dataTypes.shift();
		if ( ct === undefined ) {
			ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");
		}
	}

	// Check if we're dealing with a known content-type
	if ( ct ) {
		for ( type in contents ) {
			if ( contents[ type ] && contents[ type ].test( ct ) ) {
				dataTypes.unshift( type );
				break;
			}
		}
	}

	// Check to see if we have a response for the expected dataType
	if ( dataTypes[ 0 ] in responses ) {
		finalDataType = dataTypes[ 0 ];
	} else {
		// Try convertible dataTypes
		for ( type in responses ) {
			if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[0] ] ) {
				finalDataType = type;
				break;
			}
			if ( !firstDataType ) {
				firstDataType = type;
			}
		}
		// Or just use first one
		finalDataType = finalDataType || firstDataType;
	}

	// If we found a dataType
	// We add the dataType to the list if needed
	// and return the corresponding response
	if ( finalDataType ) {
		if ( finalDataType !== dataTypes[ 0 ] ) {
			dataTypes.unshift( finalDataType );
		}
		return responses[ finalDataType ];
	}
}

/* Chain conversions given the request and the original response
 * Also sets the responseXXX fields on the jqXHR instance
 */
function ajaxConvert( s, response, jqXHR, isSuccess ) {
	var conv2, current, conv, tmp, prev,
		converters = {},
		// Work with a copy of dataTypes in case we need to modify it for conversion
		dataTypes = s.dataTypes.slice();

	// Create converters map with lowercased keys
	if ( dataTypes[ 1 ] ) {
		for ( conv in s.converters ) {
			converters[ conv.toLowerCase() ] = s.converters[ conv ];
		}
	}

	current = dataTypes.shift();

	// Convert to each sequential dataType
	while ( current ) {

		if ( s.responseFields[ current ] ) {
			jqXHR[ s.responseFields[ current ] ] = response;
		}

		// Apply the dataFilter if provided
		if ( !prev && isSuccess && s.dataFilter ) {
			response = s.dataFilter( response, s.dataType );
		}

		prev = current;
		current = dataTypes.shift();

		if ( current ) {

		// There's only work to do if current dataType is non-auto
			if ( current === "*" ) {

				current = prev;

			// Convert response if prev dataType is non-auto and differs from current
			} else if ( prev !== "*" && prev !== current ) {

				// Seek a direct converter
				conv = converters[ prev + " " + current ] || converters[ "* " + current ];

				// If none found, seek a pair
				if ( !conv ) {
					for ( conv2 in converters ) {

						// If conv2 outputs current
						tmp = conv2.split( " " );
						if ( tmp[ 1 ] === current ) {

							// If prev can be converted to accepted input
							conv = converters[ prev + " " + tmp[ 0 ] ] ||
								converters[ "* " + tmp[ 0 ] ];
							if ( conv ) {
								// Condense equivalence converters
								if ( conv === true ) {
									conv = converters[ conv2 ];

								// Otherwise, insert the intermediate dataType
								} else if ( converters[ conv2 ] !== true ) {
									current = tmp[ 0 ];
									dataTypes.unshift( tmp[ 1 ] );
								}
								break;
							}
						}
					}
				}

				// Apply converter (if not an equivalence)
				if ( conv !== true ) {

					// Unless errors are allowed to bubble, catch and return them
					if ( conv && s[ "throws" ] ) {
						response = conv( response );
					} else {
						try {
							response = conv( response );
						} catch ( e ) {
							return { state: "parsererror", error: conv ? e : "No conversion from " + prev + " to " + current };
						}
					}
				}
			}
		}
	}

	return { state: "success", data: response };
}
// Install script dataType
jQuery.ajaxSetup({
	accepts: {
		script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
	},
	contents: {
		script: /(?:java|ecma)script/
	},
	converters: {
		"text script": function( text ) {
			jQuery.globalEval( text );
			return text;
		}
	}
});

// Handle cache's special case and crossDomain
jQuery.ajaxPrefilter( "script", function( s ) {
	if ( s.cache === undefined ) {
		s.cache = false;
	}
	if ( s.crossDomain ) {
		s.type = "GET";
	}
});

// Bind script tag hack transport
jQuery.ajaxTransport( "script", function( s ) {
	// This transport only deals with cross domain requests
	if ( s.crossDomain ) {
		var script, callback;
		return {
			send: function( _, complete ) {
				script = jQuery("<script>").prop({
					async: true,
					charset: s.scriptCharset,
					src: s.url
				}).on(
					"load error",
					callback = function( evt ) {
						script.remove();
						callback = null;
						if ( evt ) {
							complete( evt.type === "error" ? 404 : 200, evt.type );
						}
					}
				);
				document.head.appendChild( script[ 0 ] );
			},
			abort: function() {
				if ( callback ) {
					callback();
				}
			}
		};
	}
});
var oldCallbacks = [],
	rjsonp = /(=)\?(?=&|$)|\?\?/;

// Default jsonp settings
jQuery.ajaxSetup({
	jsonp: "callback",
	jsonpCallback: function() {
		var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( ajax_nonce++ ) );
		this[ callback ] = true;
		return callback;
	}
});

// Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

	var callbackName, overwritten, responseContainer,
		jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
			"url" :
			typeof s.data === "string" && !( s.contentType || "" ).indexOf("application/x-www-form-urlencoded") && rjsonp.test( s.data ) && "data"
		);

	// Handle iff the expected data type is "jsonp" or we have a parameter to set
	if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {

		// Get callback name, remembering preexisting value associated with it
		callbackName = s.jsonpCallback = jQuery.isFunction( s.jsonpCallback ) ?
			s.jsonpCallback() :
			s.jsonpCallback;

		// Insert callback into url or form data
		if ( jsonProp ) {
			s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
		} else if ( s.jsonp !== false ) {
			s.url += ( ajax_rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
		}

		// Use data converter to retrieve json after script execution
		s.converters["script json"] = function() {
			if ( !responseContainer ) {
				jQuery.error( callbackName + " was not called" );
			}
			return responseContainer[ 0 ];
		};

		// force json dataType
		s.dataTypes[ 0 ] = "json";

		// Install callback
		overwritten = window[ callbackName ];
		window[ callbackName ] = function() {
			responseContainer = arguments;
		};

		// Clean-up function (fires after converters)
		jqXHR.always(function() {
			// Restore preexisting value
			window[ callbackName ] = overwritten;

			// Save back as free
			if ( s[ callbackName ] ) {
				// make sure that re-using the options doesn't screw things around
				s.jsonpCallback = originalSettings.jsonpCallback;

				// save the callback name for future use
				oldCallbacks.push( callbackName );
			}

			// Call if it was a function and we have a response
			if ( responseContainer && jQuery.isFunction( overwritten ) ) {
				overwritten( responseContainer[ 0 ] );
			}

			responseContainer = overwritten = undefined;
		});

		// Delegate to script
		return "script";
	}
});
jQuery.ajaxSettings.xhr = function() {
	try {
		return new XMLHttpRequest();
	} catch( e ) {}
};

var xhrSupported = jQuery.ajaxSettings.xhr(),
	xhrSuccessStatus = {
		// file protocol always yields status code 0, assume 200
		0: 200,
		// Support: IE9
		// #1450: sometimes IE returns 1223 when it should be 204
		1223: 204
	},
	// Support: IE9
	// We need to keep track of outbound xhr and abort them manually
	// because IE is not smart enough to do it all by itself
	xhrId = 0,
	xhrCallbacks = {};

if ( window.ActiveXObject ) {
	jQuery( window ).on( "unload", function() {
		for( var key in xhrCallbacks ) {
			xhrCallbacks[ key ]();
		}
		xhrCallbacks = undefined;
	});
}

jQuery.support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
jQuery.support.ajax = xhrSupported = !!xhrSupported;

jQuery.ajaxTransport(function( options ) {
	var callback;
	// Cross domain only allowed if supported through XMLHttpRequest
	if ( jQuery.support.cors || xhrSupported && !options.crossDomain ) {
		return {
			send: function( headers, complete ) {
				var i, id,
					xhr = options.xhr();
				xhr.open( options.type, options.url, options.async, options.username, options.password );
				// Apply custom fields if provided
				if ( options.xhrFields ) {
					for ( i in options.xhrFields ) {
						xhr[ i ] = options.xhrFields[ i ];
					}
				}
				// Override mime type if needed
				if ( options.mimeType && xhr.overrideMimeType ) {
					xhr.overrideMimeType( options.mimeType );
				}
				// X-Requested-With header
				// For cross-domain requests, seeing as conditions for a preflight are
				// akin to a jigsaw puzzle, we simply never set it to be sure.
				// (it can always be set on a per-request basis or even using ajaxSetup)
				// For same-domain requests, won't change header if already provided.
				if ( !options.crossDomain && !headers["X-Requested-With"] ) {
					headers["X-Requested-With"] = "XMLHttpRequest";
				}
				// Set headers
				for ( i in headers ) {
					xhr.setRequestHeader( i, headers[ i ] );
				}
				// Callback
				callback = function( type ) {
					return function() {
						if ( callback ) {
							delete xhrCallbacks[ id ];
							callback = xhr.onload = xhr.onerror = null;
							if ( type === "abort" ) {
								xhr.abort();
							} else if ( type === "error" ) {
								complete(
									// file protocol always yields status 0, assume 404
									xhr.status || 404,
									xhr.statusText
								);
							} else {
								complete(
									xhrSuccessStatus[ xhr.status ] || xhr.status,
									xhr.statusText,
									// Support: IE9
									// #11426: When requesting binary data, IE9 will throw an exception
									// on any attempt to access responseText
									typeof xhr.responseText === "string" ? {
										text: xhr.responseText
									} : undefined,
									xhr.getAllResponseHeaders()
								);
							}
						}
					};
				};
				// Listen to events
				xhr.onload = callback();
				xhr.onerror = callback("error");
				// Create the abort callback
				callback = xhrCallbacks[( id = xhrId++ )] = callback("abort");
				// Do send the request
				// This may raise an exception which is actually
				// handled in jQuery.ajax (so no try/catch here)
				xhr.send( options.hasContent && options.data || null );
			},
			abort: function() {
				if ( callback ) {
					callback();
				}
			}
		};
	}
});
var fxNow, timerId,
	rfxtypes = /^(?:toggle|show|hide)$/,
	rfxnum = new RegExp( "^(?:([+-])=|)(" + core_pnum + ")([a-z%]*)$", "i" ),
	rrun = /queueHooks$/,
	animationPrefilters = [ defaultPrefilter ],
	tweeners = {
		"*": [function( prop, value ) {
			var tween = this.createTween( prop, value ),
				target = tween.cur(),
				parts = rfxnum.exec( value ),
				unit = parts && parts[ 3 ] || ( jQuery.cssNumber[ prop ] ? "" : "px" ),

				// Starting value computation is required for potential unit mismatches
				start = ( jQuery.cssNumber[ prop ] || unit !== "px" && +target ) &&
					rfxnum.exec( jQuery.css( tween.elem, prop ) ),
				scale = 1,
				maxIterations = 20;

			if ( start && start[ 3 ] !== unit ) {
				// Trust units reported by jQuery.css
				unit = unit || start[ 3 ];

				// Make sure we update the tween properties later on
				parts = parts || [];

				// Iteratively approximate from a nonzero starting point
				start = +target || 1;

				do {
					// If previous iteration zeroed out, double until we get *something*
					// Use a string for doubling factor so we don't accidentally see scale as unchanged below
					scale = scale || ".5";

					// Adjust and apply
					start = start / scale;
					jQuery.style( tween.elem, prop, start + unit );

				// Update scale, tolerating zero or NaN from tween.cur()
				// And breaking the loop if scale is unchanged or perfect, or if we've just had enough
				} while ( scale !== (scale = tween.cur() / target) && scale !== 1 && --maxIterations );
			}

			// Update tween properties
			if ( parts ) {
				start = tween.start = +start || +target || 0;
				tween.unit = unit;
				// If a +=/-= token was provided, we're doing a relative animation
				tween.end = parts[ 1 ] ?
					start + ( parts[ 1 ] + 1 ) * parts[ 2 ] :
					+parts[ 2 ];
			}

			return tween;
		}]
	};

// Animations created synchronously will run synchronously
function createFxNow() {
	setTimeout(function() {
		fxNow = undefined;
	});
	return ( fxNow = jQuery.now() );
}

function createTween( value, prop, animation ) {
	var tween,
		collection = ( tweeners[ prop ] || [] ).concat( tweeners[ "*" ] ),
		index = 0,
		length = collection.length;
	for ( ; index < length; index++ ) {
		if ( (tween = collection[ index ].call( animation, prop, value )) ) {

			// we're done with this property
			return tween;
		}
	}
}

function Animation( elem, properties, options ) {
	var result,
		stopped,
		index = 0,
		length = animationPrefilters.length,
		deferred = jQuery.Deferred().always( function() {
			// don't match elem in the :animated selector
			delete tick.elem;
		}),
		tick = function() {
			if ( stopped ) {
				return false;
			}
			var currentTime = fxNow || createFxNow(),
				remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),
				// archaic crash bug won't allow us to use 1 - ( 0.5 || 0 ) (#12497)
				temp = remaining / animation.duration || 0,
				percent = 1 - temp,
				index = 0,
				length = animation.tweens.length;

			for ( ; index < length ; index++ ) {
				animation.tweens[ index ].run( percent );
			}

			deferred.notifyWith( elem, [ animation, percent, remaining ]);

			if ( percent < 1 && length ) {
				return remaining;
			} else {
				deferred.resolveWith( elem, [ animation ] );
				return false;
			}
		},
		animation = deferred.promise({
			elem: elem,
			props: jQuery.extend( {}, properties ),
			opts: jQuery.extend( true, { specialEasing: {} }, options ),
			originalProperties: properties,
			originalOptions: options,
			startTime: fxNow || createFxNow(),
			duration: options.duration,
			tweens: [],
			createTween: function( prop, end ) {
				var tween = jQuery.Tween( elem, animation.opts, prop, end,
						animation.opts.specialEasing[ prop ] || animation.opts.easing );
				animation.tweens.push( tween );
				return tween;
			},
			stop: function( gotoEnd ) {
				var index = 0,
					// if we are going to the end, we want to run all the tweens
					// otherwise we skip this part
					length = gotoEnd ? animation.tweens.length : 0;
				if ( stopped ) {
					return this;
				}
				stopped = true;
				for ( ; index < length ; index++ ) {
					animation.tweens[ index ].run( 1 );
				}

				// resolve when we played the last frame
				// otherwise, reject
				if ( gotoEnd ) {
					deferred.resolveWith( elem, [ animation, gotoEnd ] );
				} else {
					deferred.rejectWith( elem, [ animation, gotoEnd ] );
				}
				return this;
			}
		}),
		props = animation.props;

	propFilter( props, animation.opts.specialEasing );

	for ( ; index < length ; index++ ) {
		result = animationPrefilters[ index ].call( animation, elem, props, animation.opts );
		if ( result ) {
			return result;
		}
	}

	jQuery.map( props, createTween, animation );

	if ( jQuery.isFunction( animation.opts.start ) ) {
		animation.opts.start.call( elem, animation );
	}

	jQuery.fx.timer(
		jQuery.extend( tick, {
			elem: elem,
			anim: animation,
			queue: animation.opts.queue
		})
	);

	// attach callbacks from options
	return animation.progress( animation.opts.progress )
		.done( animation.opts.done, animation.opts.complete )
		.fail( animation.opts.fail )
		.always( animation.opts.always );
}

function propFilter( props, specialEasing ) {
	var index, name, easing, value, hooks;

	// camelCase, specialEasing and expand cssHook pass
	for ( index in props ) {
		name = jQuery.camelCase( index );
		easing = specialEasing[ name ];
		value = props[ index ];
		if ( jQuery.isArray( value ) ) {
			easing = value[ 1 ];
			value = props[ index ] = value[ 0 ];
		}

		if ( index !== name ) {
			props[ name ] = value;
			delete props[ index ];
		}

		hooks = jQuery.cssHooks[ name ];
		if ( hooks && "expand" in hooks ) {
			value = hooks.expand( value );
			delete props[ name ];

			// not quite $.extend, this wont overwrite keys already present.
			// also - reusing 'index' from above because we have the correct "name"
			for ( index in value ) {
				if ( !( index in props ) ) {
					props[ index ] = value[ index ];
					specialEasing[ index ] = easing;
				}
			}
		} else {
			specialEasing[ name ] = easing;
		}
	}
}

jQuery.Animation = jQuery.extend( Animation, {

	tweener: function( props, callback ) {
		if ( jQuery.isFunction( props ) ) {
			callback = props;
			props = [ "*" ];
		} else {
			props = props.split(" ");
		}

		var prop,
			index = 0,
			length = props.length;

		for ( ; index < length ; index++ ) {
			prop = props[ index ];
			tweeners[ prop ] = tweeners[ prop ] || [];
			tweeners[ prop ].unshift( callback );
		}
	},

	prefilter: function( callback, prepend ) {
		if ( prepend ) {
			animationPrefilters.unshift( callback );
		} else {
			animationPrefilters.push( callback );
		}
	}
});

function defaultPrefilter( elem, props, opts ) {
	/* jshint validthis: true */
	var prop, value, toggle, tween, hooks, oldfire,
		anim = this,
		orig = {},
		style = elem.style,
		hidden = elem.nodeType && isHidden( elem ),
		dataShow = data_priv.get( elem, "fxshow" );

	// handle queue: false promises
	if ( !opts.queue ) {
		hooks = jQuery._queueHooks( elem, "fx" );
		if ( hooks.unqueued == null ) {
			hooks.unqueued = 0;
			oldfire = hooks.empty.fire;
			hooks.empty.fire = function() {
				if ( !hooks.unqueued ) {
					oldfire();
				}
			};
		}
		hooks.unqueued++;

		anim.always(function() {
			// doing this makes sure that the complete handler will be called
			// before this completes
			anim.always(function() {
				hooks.unqueued--;
				if ( !jQuery.queue( elem, "fx" ).length ) {
					hooks.empty.fire();
				}
			});
		});
	}

	// height/width overflow pass
	if ( elem.nodeType === 1 && ( "height" in props || "width" in props ) ) {
		// Make sure that nothing sneaks out
		// Record all 3 overflow attributes because IE9-10 do not
		// change the overflow attribute when overflowX and
		// overflowY are set to the same value
		opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

		// Set display property to inline-block for height/width
		// animations on inline elements that are having width/height animated
		if ( jQuery.css( elem, "display" ) === "inline" &&
				jQuery.css( elem, "float" ) === "none" ) {

			style.display = "inline-block";
		}
	}

	if ( opts.overflow ) {
		style.overflow = "hidden";
		anim.always(function() {
			style.overflow = opts.overflow[ 0 ];
			style.overflowX = opts.overflow[ 1 ];
			style.overflowY = opts.overflow[ 2 ];
		});
	}


	// show/hide pass
	for ( prop in props ) {
		value = props[ prop ];
		if ( rfxtypes.exec( value ) ) {
			delete props[ prop ];
			toggle = toggle || value === "toggle";
			if ( value === ( hidden ? "hide" : "show" ) ) {

				// If there is dataShow left over from a stopped hide or show and we are going to proceed with show, we should pretend to be hidden
				if ( value === "show" && dataShow && dataShow[ prop ] !== undefined ) {
					hidden = true;
				} else {
					continue;
				}
			}
			orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );
		}
	}

	if ( !jQuery.isEmptyObject( orig ) ) {
		if ( dataShow ) {
			if ( "hidden" in dataShow ) {
				hidden = dataShow.hidden;
			}
		} else {
			dataShow = data_priv.access( elem, "fxshow", {} );
		}

		// store state if its toggle - enables .stop().toggle() to "reverse"
		if ( toggle ) {
			dataShow.hidden = !hidden;
		}
		if ( hidden ) {
			jQuery( elem ).show();
		} else {
			anim.done(function() {
				jQuery( elem ).hide();
			});
		}
		anim.done(function() {
			var prop;

			data_priv.remove( elem, "fxshow" );
			for ( prop in orig ) {
				jQuery.style( elem, prop, orig[ prop ] );
			}
		});
		for ( prop in orig ) {
			tween = createTween( hidden ? dataShow[ prop ] : 0, prop, anim );

			if ( !( prop in dataShow ) ) {
				dataShow[ prop ] = tween.start;
				if ( hidden ) {
					tween.end = tween.start;
					tween.start = prop === "width" || prop === "height" ? 1 : 0;
				}
			}
		}
	}
}

function Tween( elem, options, prop, end, easing ) {
	return new Tween.prototype.init( elem, options, prop, end, easing );
}
jQuery.Tween = Tween;

Tween.prototype = {
	constructor: Tween,
	init: function( elem, options, prop, end, easing, unit ) {
		this.elem = elem;
		this.prop = prop;
		this.easing = easing || "swing";
		this.options = options;
		this.start = this.now = this.cur();
		this.end = end;
		this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
	},
	cur: function() {
		var hooks = Tween.propHooks[ this.prop ];

		return hooks && hooks.get ?
			hooks.get( this ) :
			Tween.propHooks._default.get( this );
	},
	run: function( percent ) {
		var eased,
			hooks = Tween.propHooks[ this.prop ];

		if ( this.options.duration ) {
			this.pos = eased = jQuery.easing[ this.easing ](
				percent, this.options.duration * percent, 0, 1, this.options.duration
			);
		} else {
			this.pos = eased = percent;
		}
		this.now = ( this.end - this.start ) * eased + this.start;

		if ( this.options.step ) {
			this.options.step.call( this.elem, this.now, this );
		}

		if ( hooks && hooks.set ) {
			hooks.set( this );
		} else {
			Tween.propHooks._default.set( this );
		}
		return this;
	}
};

Tween.prototype.init.prototype = Tween.prototype;

Tween.propHooks = {
	_default: {
		get: function( tween ) {
			var result;

			if ( tween.elem[ tween.prop ] != null &&
				(!tween.elem.style || tween.elem.style[ tween.prop ] == null) ) {
				return tween.elem[ tween.prop ];
			}

			// passing an empty string as a 3rd parameter to .css will automatically
			// attempt a parseFloat and fallback to a string if the parse fails
			// so, simple values such as "10px" are parsed to Float.
			// complex values such as "rotate(1rad)" are returned as is.
			result = jQuery.css( tween.elem, tween.prop, "" );
			// Empty strings, null, undefined and "auto" are converted to 0.
			return !result || result === "auto" ? 0 : result;
		},
		set: function( tween ) {
			// use step hook for back compat - use cssHook if its there - use .style if its
			// available and use plain properties where available
			if ( jQuery.fx.step[ tween.prop ] ) {
				jQuery.fx.step[ tween.prop ]( tween );
			} else if ( tween.elem.style && ( tween.elem.style[ jQuery.cssProps[ tween.prop ] ] != null || jQuery.cssHooks[ tween.prop ] ) ) {
				jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
			} else {
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	}
};

// Support: IE9
// Panic based approach to setting things on disconnected nodes

Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
	set: function( tween ) {
		if ( tween.elem.nodeType && tween.elem.parentNode ) {
			tween.elem[ tween.prop ] = tween.now;
		}
	}
};

jQuery.each([ "toggle", "show", "hide" ], function( i, name ) {
	var cssFn = jQuery.fn[ name ];
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return speed == null || typeof speed === "boolean" ?
			cssFn.apply( this, arguments ) :
			this.animate( genFx( name, true ), speed, easing, callback );
	};
});

jQuery.fn.extend({
	fadeTo: function( speed, to, easing, callback ) {

		// show any hidden elements after setting opacity to 0
		return this.filter( isHidden ).css( "opacity", 0 ).show()

			// animate to the value specified
			.end().animate({ opacity: to }, speed, easing, callback );
	},
	animate: function( prop, speed, easing, callback ) {
		var empty = jQuery.isEmptyObject( prop ),
			optall = jQuery.speed( speed, easing, callback ),
			doAnimation = function() {
				// Operate on a copy of prop so per-property easing won't be lost
				var anim = Animation( this, jQuery.extend( {}, prop ), optall );

				// Empty animations, or finishing resolves immediately
				if ( empty || data_priv.get( this, "finish" ) ) {
					anim.stop( true );
				}
			};
			doAnimation.finish = doAnimation;

		return empty || optall.queue === false ?
			this.each( doAnimation ) :
			this.queue( optall.queue, doAnimation );
	},
	stop: function( type, clearQueue, gotoEnd ) {
		var stopQueue = function( hooks ) {
			var stop = hooks.stop;
			delete hooks.stop;
			stop( gotoEnd );
		};

		if ( typeof type !== "string" ) {
			gotoEnd = clearQueue;
			clearQueue = type;
			type = undefined;
		}
		if ( clearQueue && type !== false ) {
			this.queue( type || "fx", [] );
		}

		return this.each(function() {
			var dequeue = true,
				index = type != null && type + "queueHooks",
				timers = jQuery.timers,
				data = data_priv.get( this );

			if ( index ) {
				if ( data[ index ] && data[ index ].stop ) {
					stopQueue( data[ index ] );
				}
			} else {
				for ( index in data ) {
					if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
						stopQueue( data[ index ] );
					}
				}
			}

			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && (type == null || timers[ index ].queue === type) ) {
					timers[ index ].anim.stop( gotoEnd );
					dequeue = false;
					timers.splice( index, 1 );
				}
			}

			// start the next in the queue if the last step wasn't forced
			// timers currently will call their complete callbacks, which will dequeue
			// but only if they were gotoEnd
			if ( dequeue || !gotoEnd ) {
				jQuery.dequeue( this, type );
			}
		});
	},
	finish: function( type ) {
		if ( type !== false ) {
			type = type || "fx";
		}
		return this.each(function() {
			var index,
				data = data_priv.get( this ),
				queue = data[ type + "queue" ],
				hooks = data[ type + "queueHooks" ],
				timers = jQuery.timers,
				length = queue ? queue.length : 0;

			// enable finishing flag on private data
			data.finish = true;

			// empty the queue first
			jQuery.queue( this, type, [] );

			if ( hooks && hooks.stop ) {
				hooks.stop.call( this, true );
			}

			// look for any active animations, and finish them
			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && timers[ index ].queue === type ) {
					timers[ index ].anim.stop( true );
					timers.splice( index, 1 );
				}
			}

			// look for any animations in the old queue and finish them
			for ( index = 0; index < length; index++ ) {
				if ( queue[ index ] && queue[ index ].finish ) {
					queue[ index ].finish.call( this );
				}
			}

			// turn off finishing flag
			delete data.finish;
		});
	}
});

// Generate parameters to create a standard animation
function genFx( type, includeWidth ) {
	var which,
		attrs = { height: type },
		i = 0;

	// if we include width, step value is 1 to do all cssExpand values,
	// if we don't include width, step value is 2 to skip over Left and Right
	includeWidth = includeWidth? 1 : 0;
	for( ; i < 4 ; i += 2 - includeWidth ) {
		which = cssExpand[ i ];
		attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
	}

	if ( includeWidth ) {
		attrs.opacity = attrs.width = type;
	}

	return attrs;
}

// Generate shortcuts for custom animations
jQuery.each({
	slideDown: genFx("show"),
	slideUp: genFx("hide"),
	slideToggle: genFx("toggle"),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" },
	fadeToggle: { opacity: "toggle" }
}, function( name, props ) {
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return this.animate( props, speed, easing, callback );
	};
});

jQuery.speed = function( speed, easing, fn ) {
	var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
		complete: fn || !fn && easing ||
			jQuery.isFunction( speed ) && speed,
		duration: speed,
		easing: fn && easing || easing && !jQuery.isFunction( easing ) && easing
	};

	opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration :
		opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[ opt.duration ] : jQuery.fx.speeds._default;

	// normalize opt.queue - true/undefined/null -> "fx"
	if ( opt.queue == null || opt.queue === true ) {
		opt.queue = "fx";
	}

	// Queueing
	opt.old = opt.complete;

	opt.complete = function() {
		if ( jQuery.isFunction( opt.old ) ) {
			opt.old.call( this );
		}

		if ( opt.queue ) {
			jQuery.dequeue( this, opt.queue );
		}
	};

	return opt;
};

jQuery.easing = {
	linear: function( p ) {
		return p;
	},
	swing: function( p ) {
		return 0.5 - Math.cos( p*Math.PI ) / 2;
	}
};

jQuery.timers = [];
jQuery.fx = Tween.prototype.init;
jQuery.fx.tick = function() {
	var timer,
		timers = jQuery.timers,
		i = 0;

	fxNow = jQuery.now();

	for ( ; i < timers.length; i++ ) {
		timer = timers[ i ];
		// Checks the timer has not already been removed
		if ( !timer() && timers[ i ] === timer ) {
			timers.splice( i--, 1 );
		}
	}

	if ( !timers.length ) {
		jQuery.fx.stop();
	}
	fxNow = undefined;
};

jQuery.fx.timer = function( timer ) {
	if ( timer() && jQuery.timers.push( timer ) ) {
		jQuery.fx.start();
	}
};

jQuery.fx.interval = 13;

jQuery.fx.start = function() {
	if ( !timerId ) {
		timerId = setInterval( jQuery.fx.tick, jQuery.fx.interval );
	}
};

jQuery.fx.stop = function() {
	clearInterval( timerId );
	timerId = null;
};

jQuery.fx.speeds = {
	slow: 600,
	fast: 200,
	// Default speed
	_default: 400
};

// Back Compat <1.8 extension point
jQuery.fx.step = {};

if ( jQuery.expr && jQuery.expr.filters ) {
	jQuery.expr.filters.animated = function( elem ) {
		return jQuery.grep(jQuery.timers, function( fn ) {
			return elem === fn.elem;
		}).length;
	};
}
jQuery.fn.offset = function( options ) {
	if ( arguments.length ) {
		return options === undefined ?
			this :
			this.each(function( i ) {
				jQuery.offset.setOffset( this, options, i );
			});
	}

	var docElem, win,
		elem = this[ 0 ],
		box = { top: 0, left: 0 },
		doc = elem && elem.ownerDocument;

	if ( !doc ) {
		return;
	}

	docElem = doc.documentElement;

	// Make sure it's not a disconnected DOM node
	if ( !jQuery.contains( docElem, elem ) ) {
		return box;
	}

	// If we don't have gBCR, just use 0,0 rather than error
	// BlackBerry 5, iOS 3 (original iPhone)
	if ( typeof elem.getBoundingClientRect !== core_strundefined ) {
		box = elem.getBoundingClientRect();
	}
	win = getWindow( doc );
	return {
		top: box.top + win.pageYOffset - docElem.clientTop,
		left: box.left + win.pageXOffset - docElem.clientLeft
	};
};

jQuery.offset = {

	setOffset: function( elem, options, i ) {
		var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
			position = jQuery.css( elem, "position" ),
			curElem = jQuery( elem ),
			props = {};

		// Set position first, in-case top/left are set even on static elem
		if ( position === "static" ) {
			elem.style.position = "relative";
		}

		curOffset = curElem.offset();
		curCSSTop = jQuery.css( elem, "top" );
		curCSSLeft = jQuery.css( elem, "left" );
		calculatePosition = ( position === "absolute" || position === "fixed" ) && ( curCSSTop + curCSSLeft ).indexOf("auto") > -1;

		// Need to be able to calculate position if either top or left is auto and position is either absolute or fixed
		if ( calculatePosition ) {
			curPosition = curElem.position();
			curTop = curPosition.top;
			curLeft = curPosition.left;

		} else {
			curTop = parseFloat( curCSSTop ) || 0;
			curLeft = parseFloat( curCSSLeft ) || 0;
		}

		if ( jQuery.isFunction( options ) ) {
			options = options.call( elem, i, curOffset );
		}

		if ( options.top != null ) {
			props.top = ( options.top - curOffset.top ) + curTop;
		}
		if ( options.left != null ) {
			props.left = ( options.left - curOffset.left ) + curLeft;
		}

		if ( "using" in options ) {
			options.using.call( elem, props );

		} else {
			curElem.css( props );
		}
	}
};


jQuery.fn.extend({

	position: function() {
		if ( !this[ 0 ] ) {
			return;
		}

		var offsetParent, offset,
			elem = this[ 0 ],
			parentOffset = { top: 0, left: 0 };

		// Fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is it's only offset parent
		if ( jQuery.css( elem, "position" ) === "fixed" ) {
			// We assume that getBoundingClientRect is available when computed position is fixed
			offset = elem.getBoundingClientRect();

		} else {
			// Get *real* offsetParent
			offsetParent = this.offsetParent();

			// Get correct offsets
			offset = this.offset();
			if ( !jQuery.nodeName( offsetParent[ 0 ], "html" ) ) {
				parentOffset = offsetParent.offset();
			}

			// Add offsetParent borders
			parentOffset.top += jQuery.css( offsetParent[ 0 ], "borderTopWidth", true );
			parentOffset.left += jQuery.css( offsetParent[ 0 ], "borderLeftWidth", true );
		}

		// Subtract parent offsets and element margins
		return {
			top: offset.top - parentOffset.top - jQuery.css( elem, "marginTop", true ),
			left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true )
		};
	},

	offsetParent: function() {
		return this.map(function() {
			var offsetParent = this.offsetParent || docElem;

			while ( offsetParent && ( !jQuery.nodeName( offsetParent, "html" ) && jQuery.css( offsetParent, "position") === "static" ) ) {
				offsetParent = offsetParent.offsetParent;
			}

			return offsetParent || docElem;
		});
	}
});


// Create scrollLeft and scrollTop methods
jQuery.each( {scrollLeft: "pageXOffset", scrollTop: "pageYOffset"}, function( method, prop ) {
	var top = "pageYOffset" === prop;

	jQuery.fn[ method ] = function( val ) {
		return jQuery.access( this, function( elem, method, val ) {
			var win = getWindow( elem );

			if ( val === undefined ) {
				return win ? win[ prop ] : elem[ method ];
			}

			if ( win ) {
				win.scrollTo(
					!top ? val : window.pageXOffset,
					top ? val : window.pageYOffset
				);

			} else {
				elem[ method ] = val;
			}
		}, method, val, arguments.length, null );
	};
});

function getWindow( elem ) {
	return jQuery.isWindow( elem ) ? elem : elem.nodeType === 9 && elem.defaultView;
}
// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
	jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name }, function( defaultExtra, funcName ) {
		// margin is only for outerHeight, outerWidth
		jQuery.fn[ funcName ] = function( margin, value ) {
			var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
				extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

			return jQuery.access( this, function( elem, type, value ) {
				var doc;

				if ( jQuery.isWindow( elem ) ) {
					// As of 5/8/2012 this will yield incorrect results for Mobile Safari, but there
					// isn't a whole lot we can do. See pull request at this URL for discussion:
					// https://github.com/jquery/jquery/pull/764
					return elem.document.documentElement[ "client" + name ];
				}

				// Get document width or height
				if ( elem.nodeType === 9 ) {
					doc = elem.documentElement;

					// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
					// whichever is greatest
					return Math.max(
						elem.body[ "scroll" + name ], doc[ "scroll" + name ],
						elem.body[ "offset" + name ], doc[ "offset" + name ],
						doc[ "client" + name ]
					);
				}

				return value === undefined ?
					// Get width or height on the element, requesting but not forcing parseFloat
					jQuery.css( elem, type, extra ) :

					// Set width or height on the element
					jQuery.style( elem, type, value, extra );
			}, type, chainable ? margin : undefined, chainable, null );
		};
	});
});
// Limit scope pollution from any deprecated API
// (function() {

// The number of elements contained in the matched element set
jQuery.fn.size = function() {
	return this.length;
};

jQuery.fn.andSelf = jQuery.fn.addBack;

// })();
if ( typeof module === "object" && module && typeof module.exports === "object" ) {
	// Expose jQuery as module.exports in loaders that implement the Node
	// module pattern (including browserify). Do not create the global, since
	// the user will be storing it themselves locally, and globals are frowned
	// upon in the Node module world.
	module.exports = jQuery;
} else {
	// Register as a named AMD module, since jQuery can be concatenated with other
	// files that may use define, but not via a proper concatenation script that
	// understands anonymous AMD modules. A named AMD is safest and most robust
	// way to register. Lowercase jquery is used because AMD module names are
	// derived from file names, and jQuery is normally delivered in a lowercase
	// file name. Do this after creating the global so that if an AMD module wants
	// to call noConflict to hide this version of jQuery, it will work.
	if ( typeof define === "function" && define.amd ) {
		define( "jquery", [], function () { return jQuery; } );
	}
}

// If there is a window object, that at least has a document property,
// define jQuery and $ identifiers
if ( typeof window === "object" && typeof window.document === "object" ) {
	window.jQuery = window.$ = jQuery;
}

})( window );