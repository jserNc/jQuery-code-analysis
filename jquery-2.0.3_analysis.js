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
/*
源码总共 8829 行（包括作者的注释），按行进行分解，总体框架如下：

注：
① 这里参考 [妙味课堂-逐行分析jQuery源码的奥妙]
② 这里的行数都是和 2.0.3 版本源码对应的，而不是当前文件

(function( window, undefined ) {

	(21 , 94) 定义一些变量和函数，其中包括 jQuery = function( selector, context ){}

	(96 , 283) 给 jQuery 函数添加一些方法和属性

	(285 , 347) jQuery.extend = jQuery.fn.extend = function(){} 静态和实例继承方法的定义

	(349 , 817) 调用 jQuery.extend() 扩展一些工具方法

	(877 , 2856) Sizzle : 复杂选择器的实现

	(2880 , 3042) jQuery.Callbacks : 回调对象实现函数的统一管理

	(3043 , 3183) jQuery.Deferred : 延迟对象实现对异步的统一管理

	(3184 , 3295) jQuery.support : 功能检测

	(3308 , 3652) .data() : 数据缓存

	(3653 , 3797) .queue() : 队列管理

	(3803 , 4299) attr、prop、val、addClass 等元素属性的操作方法

	(4300 , 5128) on、trigger 等事件操作方法

	(5140 , 6057) dom 操作方法

	(6058 , 6620) .css() : 样式操作

	(6621 , 7854) ajax 功能的封装

	(7855 , 8584) slideDown、animate 等动画相关操作

	(8585 , 8792) offset 等位置和尺寸相关方法

	(8804 , 8821) jQuery 对模块化的支持

	(8826) window.jQuery = window.$ = jQuery

})(window);

下面对一些重要的概念梳理一下，了解完这些概念后，读起源码就能做到有的放矢：

(1) 最外层的立即执行函数：
(function( window, undefined ) {
	// code
})(window);

这种写法有几点好处（更具体的分析可查看：http://nanchao.win/2017/07/03/argument-undefined/）：
① 一般情况下，项目中除了引入 jQuery 代码，还会有其他的 js 代码。
 这里将 jQuery 的所有代码由这个匿名函数包裹起来，那么这里定义的任何变量都是局部的，不会和其他的 js 代码互相干扰。
② 将 windows 作为形参和实参，是因为 window 对象处于作用域链的最顶端，所以 window 下属性查找速度会比较慢，这样做可以提高 window 下属性的遍历效率，
 另外，将 window 作为形参，那么在代码压缩过程中，匿名函数里的所有 window 标识符都可以简化为一个字母，压缩效率高。
③ 将 undefined 做为形参可以规避 ECMAScript3 中 undefined 可以被改写的问题。
 早期的 ECMAScript3 中，undefined 是可读可写的变量，后来的 ECMAScript5 中才修正为只读变量。
 而 undefined 作为有特殊含义的关键字，如果被修改会引起很多意想不到的麻烦。

 这么写为什么可以规避 undefined 被改写的问题？下面从正反两方面回答这个问题：

 a. 假如不要形参 undefined，依据作用域链的原理，匿名函数中的 undefined 就会取全局的 undefined，而全局中的 undefined 是可能被修改的，所以这样是不好的。
 b. 假如像上面那样将 undefined 作为形参，省略对应的实参。我们知道，在 js 中函数被省略的实参默认是 undefined（货真价实的 undefined），
那么，以上匿名函数执行时，这个货真价实的 undefined 就会复制给形参 undefined，所以，函数内部的 undefined 自然都是货真价实的 undefined 了。

(2) 伪构造函数 jQuery

既然上边说到匿名函数内部的变量都是局部的，对外都是不可见的，那么我们这么能用 jQuery，$ 这样的方法呢？

那是因为代码结尾有一句：window.jQuery = window.$ = jQuery
这样就把局部的 jQuery 方法挂载到全局对象 window 下面了，所以全局 jQuery 方法就是内部定义的 jQuery 方法。
另外，这也表明，jQuery 和 $ 是等价的，$ 可以看做是 jQuery 的简写别名。

	一般情况下，我们会这样写构造函数：
	var jQuery = function( selector, context ) {
		this.selector = selector;
		this.context = context;
		...
	}
	如果不使用 new 运算符，直接执行 jQuery() 方法时，函数里的 this 指向的是全局的 window 对象，
	这会导致挂载到 this 对象上的属性和方法全都变成全局属性和方法了，这样会对全局环境造成破坏。
	所以，jQuery 库并没有采取这种写法，而是这样写：

	var jQuery = function( selector, context ) {
return new jQuery.fn.init( selector, context, rootjQuery );
}

① 如果普通调用 jQuery 方法，比如 jQuery('div')
返回的是 new jQuery.fn.init( selector, context, rootjQuery )

② 如果用 new 运算符调用 jQuery 方法，比如 new jQuery('div')
new 运算符有个特性是，如果函数的返回值本来就是一个对象，那么 new 运算符的返回值就是那个对象。

也就是说，不管是否用 new 运算符调用 jQuery 方法，最终返回的都是这个对象
new jQuery.fn.init( selector, context, rootjQuery )

所以，jQuery.fn.init 才是真正的构造函数。

再看：
jQuery.fn = jQuery.prototype = {
	...
	init: function( selector, context, rootjQuery ) {}
	...
};

这里给 jQuery.prototype 定义了一系列的属性和方法，同时给 jQuery.prototype 也取了个别名 jQuery.fn。

所以，上面提到的 jQuery.fn.init 就是 jQuery.prototype.init。

我们知道，给 jQuery.prototype 添加属性和方法，意味着 jQuery 作为构造函数时，
jQuery 的实例对象都会自动拥有 jQuery.prototype 中的属性和方法。

可是，上边说到 jQuery 只是一个普通函数而已，并没有作为一个真正的构造函数使用，
那么给 jQuery.prototype 添加那么多属性和方法还有意义吗？答案是必须有！

继续往下看，还有一句：
jQuery.fn.init.prototype = jQuery.fn;

这句话的意思是将 jQuery.fn.init.prototype 指向 jQuery.fn，也就是 jQuery.prototype。
这意味着，给 jQuery.prototype 添加属性和方法统统都给了 jQuery.fn.init.prototype，
而 jQuery.fn.init 作为真正的构造方法，它是需要这些原型属性和方法的。

给 jQuery.fn 添加的属性和方法，其实都可以被真正的构造方法 jQuery.fn.init 的实例对象用的。

也就是说 new jQuery.fn.init( selector, context, rootjQuery ) 作为 jQuery.fn.init 的实例对象，
它拥有 jQuery.fn 的一切属性和方法。

(3) 静态和实例继承

首先明确一点，jQuery 是个函数，函数也属于对象的范畴，所以可以给它添加属性。

jQuery.extend = jQuery.fn.extend = function(){}

这两个方法共用一个定义，关于其参数个数和类型导致的功能差异暂且不详说，说说 jQuery 内部常用的形式：

① 静态继承
jQuery.extend({
	p1 : 1,
	f1 : function(){}
});

这样写的作用是把匿名对象的 p1 属性和 f1 方法复制给 jQuery 对象，所以，jQuery 这个对象就拥有 p1、f1 属性了。

jQuery 就是用这种写法来扩展工具方法的，比如 jQuery.each 方法。

② 实例继承
jQuery.fn.extend({
	p1 : 1,
	f1 : function(){}
});

这样写的作用是把匿名对象的 p1 属性和 f1 方法复制给 jQuery.fn 对象，前边说到 jQuery.fn.init.prototype = jQuery.fn，
所以，这里的 p1 和 f1 都复制给了 jQuery.fn.init.prototype，所以 jQuery.fn.init 的实例都拥有 p1、f1 属性了。
前边说到 $('div') 这种都是 jQuery.fn.init 的实例，所以，$('div') 就拥有 p1、f1 属性了。

jQuery 就是用这种写法来扩展实例方法的，比如 $('div').css 方法。

(4) 文档就绪函数

在 js 代码执行的时候，如果涉及页面 dom 元素的操作，要使得代码顺利执行不出错，前提条件就是 dom 元素结构必须在已经加载完成。

为了保证代码在 dom 元素加载完毕后执行，jQuery 采取的方式就是将代码用以下形式包裹起来，有以下 3 种写法：

① $(function(){
	// jQuery functions go here
});

② $(document).ready(function(){
	// jQuery functions go here
});

③ $(document).on('ready',function(){
	// jQuery functions go here
})

虽然看起来有些差别，但这三种写法本质没什么不同，jQuery 内部实现一样。它们的作用是：等文档 dom 结构加载完毕后，
再执行包裹起来的自定义代码。

判断文档 dom 结构是否加载完毕，是靠监听的是 DOMContentLoaded 事件。之所以不用 window.onload 事件是因为
window.onload 事件必须等页面全部资源（包括图片等）都加载完毕，才会触发，如果网速慢，资源多，就会一直等着；
而 DOMContentLoaded 事件只需要等 dom 结构加载完毕就可以触发，这样会比较合理。

具体实现可参考 http://nanchao.win/2017/05/02/ready/

(5) Sizzle 选择器

jQuery 几乎所有的功能都离不开 dom 元素，所以，一个重要的功能就是用 $(selector) 将所需的 dom 元素找出来。
这里的 selector 我们称之为”选择器“，它可以是字符串，可以是 dom 元素，也可以是 jQuery 对象等等。

如果 selector 是比较简单的选择器，比如 '#myId' ，表示要找出 id 为 myId 的元素，那么
直接调用 document.getElementById('myId') 就可以了。可是，如果选择器比较复杂，比如：
$('div + p span > a[title="hi"]')，这就不是单纯地用 js 原生 api 可以解决了，
这时候我们就需要 Sizzle 这个强大的选择器引擎，举个例子：

$('div span') 表示选取所有的 div 下的 span 元素
$('span > a[title="hi"]') 表示选取作为 span 的子元素并且 title 属性为 hi 的 a 标签

给 $ 函数传入 'div span' 这种选择器 Sizzle 就能匹配出相应的元素。当然了，以上的例子还是比较简单，
当选择器 selector 更加复杂时就更难体现出 Sizzle 的价值了，源码部分会详细地去了解它。

另外，Sizzle 是独立的一部分，不依赖任何库，如果你不想用 jQuery，可以把 Sizzle 单独拿出来用。

(6) 链式调用

平常使用 jQuery 过程中，我们会经常用的这种链式写法：
$('input').css('font-size','20px').click(function(){alert(1)})

这句的作用是，将所有的 input 元素字体设为 20px，然后监听所有的 input 元素的点击事件，当我们点击 input 元素时，弹出 1。

这样的链式写法，看起来语义清晰，写起来也挺方便的，其实它的实现原理也是很简单。

以上 css、click 方法都是我们定义在 jQuery.fn 上的方法，根据前边的分析我们知道，任何一个 jQuery() 方法生成的
对象（称之为 jQuery 实例对象）都可以调用jQuery.fn 上挂载的方法，所以 css、click 等方法是可以被 jQuery 实例对象调用的。

所以，我们断定，以下都是 jQuery 对象，以上写法才能行得通：
$('input')// jQuery 对象
$('input').css('font-size','20px')// jQuery 对象

事实也确实这样，为了方便立即，举个简单的例子：
var n = 1;
var o = {
	add : function(){
		n++;
		return o;
	},
	sub : function(){
		n--;
		return o;
	}
};
o.add().add().sub();
console.log(n); // 2

以上定义了一个对象 o，只要 o 的每一个方法的返回值都是这个对象 o，那么就可以实现链式调用了。jQuery 内部就是这个原理，
只不过 css、click 等方法的返回值都是 this，这个 this 就是指调用这些方法的 jQuery 实例对象。

更详细分析见 http://nanchao.win/2016/10/25/chain-call/

(7) 冲突处理

我们知道，在 $ 和 jQuery 是等价的，都表示内部的 jQuery 函数。可是，说到底，$ 和 jQuery 只是普通的标识符，并不是 JavaScript
语言的关键词和保留字。那么，不光 jQuery 库可以使用它们，我们的自定义代码，或者别的 JavaScript 库也都可以使用它们作为变量名。
假如另一个第三方库也用 $ 或者 jQuery 作为变量名，那就产生了冲突，先引入的那个就会被后引入的覆盖，以致于失效。所以，jQuery 库做出了防冲突的机制。

上面提到 jQuery 库加载过程中会执行：
window.jQuery = window.$ = jQuery

这意味着全局的 jQuery 和 $ 变量都会变为 jQuery 库里定义的 jQuery 函数了。也就是说，引入 jQuery 库会导致
全局的 jQuery 和 $ 变量被 jQuery 库中的 jQuery 函数覆盖。

考虑到这个问题，jQuery 做了两件事：

① 执行上面那句覆盖操作之前，就保存住原来的全局 jQuery 和 $ 变量
_jQuery = window.jQuery;
_$ = window.$;

也就是说，不管用还是不用，jQuery 库在一开始就会保存原来全局的 jQuery 和 $ 变量，万一后边用得上呢。

② 定义 jQuery.noConflict 函数，这个函数的作用是让 jQuery 放弃对 $ 和 jQuery 标识符的使用权，换成其他的标识符，以避免冲突。

// 如果 deep 为假，就只让出 $ 的控制权；如果 deep 为真，就同时让出 $ 和 jQuery 的使用权。
jQuery.noConflict: function( deep ) {
	// 如果全局 $ 为匿名函数内部的 jQuery，让出 $ 标识符
	if ( window.$ === jQuery ) {
		// 让出 $ 符，window.$ = 123
		window.$ = _$;
	}

	// 如果全局 jQuery 就是匿名函数内部的 jQuery，并且 deep 为真，那么就让出 jQuery 标识符
	if ( deep && window.jQuery === jQuery ) {
		window.jQuery = _jQuery;
	}

	return jQuery;
}

比如，执行 var jq = jQuery.noConflict(true);

意思就是：以后 jq 这个变量就代表 jQuery 库的 jQuery 方法了，全局的 $ 和 jQuery 标识符和 jQuery 库完全不相干了。


举例说明：
引入 jQuery 库之前，已经有了全局的 $ 和 jQuery 变量：
var $ = 123;
var jQuery = 456;
为了不让 jQuery 库覆盖这两个全局变量，我们这么做：

var jq = jQuery.noConflict(true);

这样，就释放了 jQuery 对全局的 jQuery 和 $ 变量的使用权。
全局的 $ 还是 123，全局的 jQuery 还是 456，jq 就是 jQuery 内部的 jQuery 方法了。

(8) 兼容性问题处理

我们自己写原生代码的时候，会遇到很多浏览器兼容问题，而用 jQuery 库后就不需要再去关注与浏览器兼容问题了，
这是因为 jQuery 库已经把这些兼容性问题处理好了。

处理兼容问题，在 jQuery 内部主要分为 2 步：

① 兼容性问题检测，得到一个功能支持性列表

jQuery.support = (function( support ) {
	// 功能检测代码
	return support;
})( {} );

在 chrome 下执行以上立即执行函数，得到：

jQuery.support = {
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
};

② 利用钩子（hooks）机制，解决兼容问题

也就是说 jQuery.support 只是进行功能检测，真正的兼容问题处理是靠一系列 hooks 方法完成的。

以 attrHooks 解决属性操作兼容性问题为例，attrHooks 对象会有多个属性，代表那几个属性有兼容性问题。
如果这个属性有 get 子属性说明获取该属性时兼容性问题，如果这个属性有 set 子属性说明设置该属性有设置兼容性问题。
attrHooks 中没有的属性说明是正常的，用常规途径获取或者设置该属性就好了。

attrHooks: {
	type: {
		set: function( elem, value ) {
			// 注意这里的 !jQuery.support.radioValue
			if ( !jQuery.support.radioValue && value === "radio" && jQuery.nodeName(elem, "input") ) {
				...
			}
		}
	}
	...
}

这里 type 属性和 set 子属性，说明 type 属性的设置（set）需要兼容。
很明显看到，如果 jQuery.support.radioValue 为 true，是不会真正执行以上 attrHooks.type.set 方法的。

以上的 attrHooks 只是钩子的一种，以上 jQuery.support 中的兼容问题都是分散在众多类似于 attrHooks 的钩子中完成的。

也许上面的叙述没能很好的说明钩子的用法，那就举个简单例子：

例如，假如学生获得了某比赛第一名，高考加 50 分，获得了第二名，高考加 30 分，获得了第三名，高考加 10 分。
那么，统计学生高考总分时，不同的奖项加分就可以用钩子机制来实现。

var reward = {
	firstPlace : 50,
	secondPlace : 30,
	thirdPlace : 10
}

function student(name, score, rewardPlace) {
	return {
		name: name,
		score: score,
		rewardPlace: rewardPlace
	};
}

function totalScore(studentInfo) {
	var result = studentInfo.score;
	if (reward[studentInfo.rewardPlace]) {
		result += reward[studentInfo.rewardPlace] ;
	}
	return result;
}

var info = student('nanc', 100, 'firstPlace')

console.log(totalScore(info))
-> 150


使用钩子去处理特殊情况，可以让代码的逻辑更加清晰，省去大量的条件判断，上面的钩子机制的实现方式，采用的就是表驱动方式，
就是我们事先预定好一张表（俗称打表），用这张表去适配特殊情况。
 */

(function (window, undefined) {

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
		/*
		首先，typeof undefined === "undefined"，是一个字符串
		
		一般情况下，判断一个变量是不是 undefined，以下两种方式都可以：
		① typeof window.v ==="undefined"
		② window.v === undefined
		
		但是，在一些老版本 ie 下，方式 ② 对于 xml 的节点方法判断不准确，所以推荐统一用方式 ①
		 */
		core_strundefined = typeof undefined,

		// Use the correct document accordingly with window argument (sandbox)
		location = window.location,
		document = window.document,
		docElem = document.documentElement,

		// Map over jQuery in case of overwrite
		// 因为后面会覆盖这个全局变量 window.jQuery，所以保存下引入 jQuery 库之前的全局 jQuery 变量，以便后面可以还原这个变量
		_jQuery = window.jQuery,

		// Map over the $ in case of overwrite
		// 同上，因为后面会覆盖这个全局变量 window.$，所以保存下引入 jQuery 库之前的全局 $ 变量，以便后面可以还原这个变量
		_$ = window.$,

		// [[Class]] -> type pairs
		class2type = {},

		// List of deleted data cache ids, so we can reuse them
		// 在之前的版本中，这个变量会和数据缓存id有关，这个版本中仅仅当做一个数组字面量
		core_deletedIds = [],

		core_version = "2.0.3",

		// Save a reference to some core methods
		// 连接两个或多个数组
		core_concat = core_deletedIds.concat,
		// 向数组的末尾添加一个或更多元素，并返回新的长度。
		core_push = core_deletedIds.push,
		// 从某个已有的数组返回选定的元素
		core_slice = core_deletedIds.slice,
		// 返回在数组中给定元素的索引,如果不存在返回 -1
		core_indexOf = core_deletedIds.indexOf,
		// 返回对象的类型字符串
		core_toString = class2type.toString,
		// 方法会返回一个布尔值，指示对象是否具有指定的属性作为自身(不继承)属性。
		core_hasOwn = class2type.hasOwnProperty,
		// 去掉字符串前后空格
		core_trim = core_version.trim,

		// Define a local copy of jQuery
		/*
		这就是贯穿整个源码的 jQuery 函数（函数也是对象），它充当构造函数的作用，其实也可以说是一个伪构造函数。
		
		下面会把很多工具方法挂载到这个函数（对象）上，比如：
		jQuery.extend({
			// functions here
		});
		
		也会把很多实例方法挂载到这个函数（对象）上，比如：
		jQuery.fn.extend({
			// functions here
		});
		
		对于以下两种方式调用 jQuery 函数：
		① jQuery(selector, context) 返回值是 new jQuery.fn.init( selector, context, rootjQuery )
		② new jQuery(selector, context) 返回值依然是 new jQuery.fn.init( selector, context, rootjQuery )
		 这是因为 js 语法规定，当函数返回值是一个对象时，用 new 运算符执行这个函数返回值就是那个对象。
		
		所以，我们看到，执行 jQuery 函数最后实际上都是在执行函数 jQuery.fn.init，这才算是真正的构造函数。
		 */
		jQuery = function (selector, context) {
			// The jQuery object is actually just the init constructor 'enhanced'
			return new jQuery.fn.init(selector, context, rootjQuery);
		},

		// Used for matching numbers
		/*
		source 方法获取正则表达式源文本，这里返回 "[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)" ，类型为 "string"
		匹配数字，包括正负号、科学计数法、.开头等多种情况的数字
		 */
		core_pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,

		// Used for splitting on whitespace
		/*
		jQuery 中变量命名有个规律：正则变量名最前面是'r'，函数名最前面是'f'
		匹配任意不是空白的字符
		 */
		core_rnotwhite = /\S+/g,

		// A simple way to check for HTML strings
		// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
		// Strict HTML recognition (#11290: must start with <)
		/*
		拆开两部分
		① (?:\s*(<[\w\W]+>)[^>]* 开头，如：' <div>abc</div>'
		② #([\w-]*)) 结尾，如：'#btn'
		
		这个正则的作用就是匹配 html 字符串以及 # 开头的字符串，主要分 3 类
		
		① 闭合标签
		rquickExpr.exec('<div >abc</div>')
		-> ["<div >abc</div>", "<div >abc</div>", undefined, index: 0, input: "<div >abc</div>"]
		
		② 非闭合标签
		rquickExpr.exec('<div >hello')
		-> ["<div >hello", "<div >", undefined, index: 0, input: "<div >hello"]
		
		③ #id
		rquickExpr.exec('#btn')
		-> ["#btn", undefined, "btn", index: 0, input: "#btn"]
		
		 */
		rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,

		// Match a standalone tag
		/*
		其中 \1 代表第一个 () 捕获的内容，这个正则的作用是匹配空标签字符串，比如：
		
		rsingleTag.exec('<div ></div>')
		-> ["<div ></div>", "div", index: 0, input: "<div ></div>"]
		
		rsingleTag.exec('<br />')
		-> ["<br />", "br", index: 0, input: "<br />"]
		
		带有属性或者有子节点的字符串，不会通过正则匹配，返回 null
		
		rsingleTag.exec('<div id="d"></div>')
		-> null
		
		rsingleTag.exec('<div>text</div>')
		-> null
		 */
		rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,

		// Matches dashed string for camelizing
		/*
		css 中属性在 js 中需要转驼峰后才可以识别，会用到这两个正则
		
		比如：border-left -> borderLeft，就需要用 rdashAlpha 把 -l 匹配出来，转出 L
		
		css 中的前缀有很多种，比如 -ms- -o- -webkit 等，
		-o-border-radius -> oBorderRadius
		-webkit-border-radius -> webkitBorderRadius
		-ms-border-radius -> MsBorderRadius
		
		可以看到，前缀 -ms- 是比较特殊的，转化后第一个字母 M 大写。所以这里要单独把 -ms- 开头的属性匹配出来
		 */
		rmsPrefix = /^-ms-/,
		rdashAlpha = /-([\da-z])/gi,

		// Used by jQuery.camelCase as callback to replace()
		// 返回第二个参数的大写形式，如 fcamelCase(null,'abc') -> 'ABC'
		fcamelCase = function (all, letter) {
			return letter.toUpperCase();
		},

		// The ready event handler and self cleanup method
		// 页面加载完毕，调用这个函数，执行 ready 函数队列，并取消 DOMContentLoaded、load 等两个事件的监听
		completed = function () {
			document.removeEventListener("DOMContentLoaded", completed, false);
			window.removeEventListener("load", completed, false);
			jQuery.ready();
		};

	jQuery.fn = jQuery.prototype = {
		// The current version of jQuery being used
		// 当前 jQuery 库版本 "2.0.3"
		jquery: core_version,

		/*
		注意看这里的写法：
		jQuery.fn = jQuery.prototype = {
			// props here
		}
		这里把 jQuery.prototype 指向了一个新的对象，这个新的对象的 constructor 属性显然不是指向 jQuery
		所以，这里强制将 constructor 属性指向 jQuery
		
		举个例子验证一下：
		
		方式一：
		function A(){}
		A.prototype = {};
		
		var a = new A();
		
		// a 是 A 的实例，但是 constructor 属性不是指向 A，怪怪的
		a instanceof A -> true
		a.constructor === A -> false
		
		方式二：
		function A(){}
			A.prototype = {
			constructor : A
		};
		
		var a = new A();
		
		// 这样就比较和谐了
		a instanceof A -> true
		a.constructor === A -> true
		 */
		constructor: jQuery,

		/*
		selector：选择器
		context：选择范围
		rootjQuery：$(document)
		
		(1) 第一个参数 selector 可能为：
		$(null), $(""), $(undefined), $(false)
		$('#id'), $('div'), $('.cls'), $('div + p span > a[title="hi"]')
		$('<li>'), $('<li>1</li><li>2</li>'), $("<iframe frameborder='0' width='0' height='0'/>")
		$(this), $(document),$(document.getElementsByTagName('div')[0]),$(document.getElementsByTagName('div'))
		$(function(){})
		$([]), $({})
		
		(2) 第二个参数 context 为选择范围，比如 $('li','ul') 表示选取 ul 元素内的 li 元素
		
		所有选择器形式参考：
		http://www.w3school.com.cn/jquery/jquery_ref_selectors.asp
		*/
		init: function (selector, context, rootjQuery) {
			var match, elem;

			// HANDLE: $(""), $(null), $(undefined), $(false)
			if (!selector) {
				return this;
			}

			// Handle HTML strings
			/*
			选择符 selector 是字符串

			$('#id'), $('div'), $('.cls'), $('div + p span > a[title="hi"]')
			$('<li>'), $('<li>1</li><li>2</li>')
			*/
			if (typeof selector === "string") {
				// $('<li>'), $('<li>1</li><li>2</li>')
				if (selector.charAt(0) === "<" && selector.charAt(selector.length - 1) === ">" && selector.length >= 3) {
					// Assume that strings that start and end with <> are HTML and skip the regex check
					// 如 match = [null,'<p>',null]
					match = [null, selector, null];
				} else {
					/*
					rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/

					上面已经分析过了，有 3 种形式字符串可以通过这个正则的匹配：
					① rquickExpr.exec('<div >abc</div>')
						 -> ["<div >abc</div>", "<div >abc</div>", undefined, index: 0, input: "<div >abc</div>"]

					② rquickExpr.exec('<div >hello')
						 -> ["<div >hello", "<div >", undefined, index: 0, input: "<div >hello"]

					③ rquickExpr.exec('#btn')
						 -> ["#btn", undefined, "btn", index: 0, input: "#btn"]

					而 ① 已经走了上面的 if 分支，所以，这里只剩下 '<div >hello'、'#btn' 这种形式字符串了
					 */
					match = rquickExpr.exec(selector);
				}

				// Match html or make sure no context is specified for #id
				/*
				match && (match[1] || !context) 为真进入下面的 if 代码块，有两种情况：

				① match && match[1]，对应： $('<div ></div>') 、$('<div >hello')、 $('<div ></div>', context) 等形式
				② match && !context，对应：$('#btn')
				 */
				if (match && (match[1] || !context)) {

					// HANDLE: $(html) -> $(array)
					// $('<div >abc</div>') 、$('<div >hello') 、$('<div ></div>', context) 这种形式
					if (match[1]) {
						/*
						context 可以是两种形式，比如：
						① $('<div ></div>',document) context 是原生对象
						② $('<div ></div>',$(document))context 是 jQuery 对象，$(document)[0] === document

						下面这句代码作用是：如果是 jQuery 对象，就取其对应的原生对象
						 */
						context = context instanceof jQuery ? context[0] : context;

						/*
						这里简要说明一下两个函数的用法：
						(1) jQuery.merge( first, second )
								将 second 的属性依次复制给 first，然后返回 first

						eg:
						$.merge(['a','b'],['c','d']) -> ["a", "b", "c", "d"]
						$.merge({0:'a',length:1},['c','d']) -> {0: "a", 1: "c", 2: "d", length: 3}

						(2) jQuery.parseHTML(data, context, keepScripts)
								将字符串 data 转换成一组 dom 元素组成的数组

						eg:
						$.parseHTML("<div>新建div标签</div>") -> [div]
						$.parseHTML("<a>link</a><b>my name is</b> jQuery.") -> [a, b, text]

						返回数组里的 div、a、b、text 都是指 dom 节点

						综合 (1)、(2)，可以知道下面这句的作用是，根据 selector 字符串，创建相应的 dom 节点，
						然后将这些 dom 节点依次挂载到 this 对象下（意思就是 this 对象可以引用这些节点）
						 */
						jQuery.merge(this, jQuery.parseHTML(
							match[1],
							/*
							根据运算符优先级，相当于：
							(context && context.nodeType) ? (context.ownerDocument || context) : document

							默认情况下 ownerDocument 就是 document，也可能是 iframe 的 contentDocument，所以：
							① 如果 context 不存在，那么，就取 document
							② 如果 context 存在，优先取 context.ownerDocument
							 */
							context && context.nodeType ? context.ownerDocument || context : document,
							// true 表示保留脚本标签
							true
						));

						// HANDLE: $(html, props)

						/*
						解释一下判断条件：
						(1) rsingleTag.test( match[1] ) 表示 selector 是 "<div></div>" 这种形式的单标签
						rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/ 匹配单个空标签

						单个标签没内容可以通过匹配
						rsingleTag.test('<div ></div>') -> true
						rsingleTag.test('<input />') -> true

						带有属性或者有子节点的标签，不会通过正则匹配，返回 null
						rsingleTag.test('<div id="d"></div>') -> false
						rsingleTag.test('<div>text</div>') -> false


						(2) jQuery.isPlainObject( context ) 表示 context 是普通的对象
						dom 节点，window 对象返回 false，其他 true

						jQuery.isPlainObject(window) -> false
						jQuery.isPlainObject(document) -> false
						jQuery.isPlainObject({a : 1}) -> true

						也就是说，第一个参数是单个空标签，第二个参数是字面量对象（标签的各种属性），会执行以下 if 代码块：
						$( "<div></div>", {
							"class" : "my-div",
							"id" : "div1"
						})

						作用是：创建一个新的 div 元素，然后这个 div 的 class 设为 "my-div"，id 设为 "div1"
						 */
						if (rsingleTag.test(match[1]) && jQuery.isPlainObject(context)) {
							// 遍历 context 中的属性，依次添加给新创建的 dom 元素
							for (match in context) {
								// Properties of context are called as methods if possible
								/*
								举个例子：
								$( "<div></div>", {
									"class": "my-div",
									on: {
										touchstart: function( event ) {
											// Do something
										}
									}
								})

								这里的 on 是一个函数，那就调用这个 on 函数：

								相当于：
								$("<div></div>").on({
										touchstart: function( event ) {
											// Do something
										}
								})
								 */
								if (jQuery.isFunction(this[match])) {
									this[match](context[match]);
									// ...and otherwise set as attributes
								} else {
									// 前面说到新创建的 dom 元素会挂载到 this 对象下，执行 this.attr() 方法时，会遍历 this 下挂载的 dom 元素，依次给这些 dom 元素添加属性
									this.attr(match, context[match]);
								}
							}
						}

						// 到这里，$('<div ></div>') 和 $('<div ></div>', context) 这种形式处理完毕，返回 this 对象
						return this;

						// HANDLE: $(#id)
						// $('#id') 这种形式
					} else {
						// 直接通过原生的 document.getElementById 方法获取到元素
						elem = document.getElementById(match[2]);

						// Check parentNode to catch when Blackberry 4.6 returns
						// nodes that are no longer in the document #6963
						/*
						黑莓 4.6 下克隆节点，会出现一个问题，有的节点已经不存在了，但是还是可以通过 document.getElementById 找到
						如果节点 elem 不存在，那么 elem.parentNode 肯定是不存在的，所以这里用双重判断规避以上问题
						 */
						if (elem && elem.parentNode) {
							// Inject the element directly into the jQuery object
							this.length = 1;
							this[0] = elem;
						}

						this.context = document;
						this.selector = selector;
						/*
						例如：<div id="ani"></div>
						$('#ani') 返回的 this 对象内容为：
						{
							0 : div#ani,
							length : 1,
							context : document,
							selector : '#ani'
						}
						 */
						// $('#id') 这种形式处理完毕，返回 this
						return this;
					}

					// HANDLE: $(expr, $(...))
					/*
					① !context 指的是排除上面分析过的两种，还有：
					$('div'), $('.cls'), $('div + p span > a[title="hi"]') 等形式

					② context.jquery 为真，说明 context 是 jQuery 对象（ 上面有定义：jQuery.prototype.jquery = core_version ）
					$( selector , $(selector1) ） 第二个参数 context 是一个 jQuery 对象这种形式

					这两类情况，不是简单的就可以匹配出相应元素的，所以交给超级选择器引擎 Sizzle 去完成。后面会详细解释 Sizzle。
					 */
				} else if (!context || context.jquery) {
					/*
					① context 存在的时候，比如 $( selector , $(selector1) ），返回值为：
						 $(selector1).find( selector )

					② 当选择器不存在的时候，比如 $( selector ），返回值为：
						 $(document).find( selector )

					这里的 find 方法就是运用 Sizzle 引擎来选择 dom 元素。
					 */
					return (context || rootjQuery).find(selector);

					// HANDLE: $(expr, context)
					// (which is just equivalent to: $(context).find(expr)
					/*
					find 方法是 jQuery 实例对象的方法，于是，当第二个参数 context 是 dom 原生对象的时候，那就将 context 转成 jQuery 对象，再调用 find 方法

					this.constructor 就是 jQuery，也就是 $，所以：
					$('ul',document) 实际上是执行 $(document).find('ul')
					 */
				} else {
					return this.constructor(context).find(selector);
				}

				// HANDLE: $(DOMElement)
				/*
				$(document)、$(document.getElementsByTagName('div')[0]) 这种参数是原生节点的形式
				
				首先，原生 dom 节点对象一定有 nodeType 属性
				如果 selector 是原生 dom 节点，那就不用再去找 dom 节点了，直接把 selector 往 this 上添加就好了
				 */
			} else if (selector.nodeType) {
				this.context = this[0] = selector;
				this.length = 1;
				return this;

				// HANDLE: $(function)
				// Shortcut for document ready
				/*
				$(function(){
					// code here
				}) 
				这种形式：selector 是函数，那就把这个函数加到队列里，等整个页面 dom 元素都加载完毕再执行这个方法
				
				这种写法实质上是：
				$(document).ready(function(){
					// code here
				})
				
				关于这个 $(document).ready() 方法，后面会分析
				 */
			} else if (jQuery.isFunction(selector)) {
				return rootjQuery.ready(selector);
			}

			/*
			首先说一下 jQuery.makeArray( arr, results ) 方法：
			① 如果 results 参数省略了，那么最终返回结果就是一个数组，返回数组的内容就是 arr 的元素
			② 如果 results 参数存在，那么最终返回结果就是 results（包含 arr 的元素）

			eg:
			jQuery.makeArray(['a','b'],{length:0}) -> {0: "a", 1: "b", length: 2}
			jQuery.makeArray(['c','d'],['a','b']) -> ["a", "b", "c", "d"]

			最后就剩下 selector 是 jQuery 实例这一种情况了（jQuery 实例对象都有 selector 属性，默认是 ""），例如：
			$($('#div1'))

			给 this 添加 selector、context 等两个属性，然后将 selector 对象也挂载到 this 对象下，
			所以，$($('#div1')) 和 $('#div1') 结果是一样的
			 */
			if (selector.selector !== undefined) {
				this.selector = selector.selector;
				this.context = selector.context;
			}

			// 以上情况都各自 return 了，这里返回最后一种情况
			return jQuery.makeArray(selector, this);
		},

		// Start with an empty selector
		// 存储选择字符串
		selector: "",

		// The default length of a jQuery object is 0
		// this 对象的长度
		length: 0,

		/*
		作用：转数组，原生元素组成的数组，例如：
		$('div') -> { 0: div, 1:div, 2:div, length:3}
		$('div').toArray() -> [div, div, div]
		 */
		toArray: function () {
			return core_slice.call(this);
		},

		// Get the Nth element in the matched element set OR
		// Get the whole matched element set as a clean array
		/*
		① 不传参数，和 toArray() 作用一样；
		② 传一个数字参数，数组作为索引，返回一个原生 dom 元素，兼容正整数和负整数的写法。例如 0 代表第一个元素，-1 代表最后一个元素
		 */
		get: function (num) {
			return num == null ?

				// Return a 'clean' array
				this.toArray() :

				// Return just the object
				(num < 0 ? this[this.length + num] : this[num]);
		},

		// Take an array of elements and push it onto the stack
		// (returning the new matched element set)
		// JQ 对象的入栈
		// $('div').pushStack($('span')).css('background','red') -> span背景变红
		// $('div').pushStack($('span')).css('background','red').end().css('background','green') -> span背景变红 div背景变绿
		pushStack: function (elems) {

			// Build a new jQuery matched element set
			// jQuery.merge( $(), elems )
			var ret = jQuery.merge(this.constructor(), elems);

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
		each: function (callback, args) {
			return jQuery.each(this, callback, args);
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
		ready: function (fn) {
			// Add the callback
			jQuery.ready.promise().done(fn);

			return this;
		},

		// 集合的截取
		// $('div').slice(1,3).css('background','green') -> 将第2、3个div背景变绿
		slice: function () {
			return this.pushStack(core_slice.apply(this, arguments));
		},


		// 集合的第一项
		// $('div').first().css('background','red')
		first: function () {
			return this.eq(0);
		},

		// 集合中最后一项
		// $('div').last().css('background','red')
		last: function () {
			return this.eq(-1);
		},

		// 集合的指定项
		// $('div').eq(2).css('background','red')
		eq: function (i) {
			var len = this.length,
				// i < 0-> j = len + i;
				// i >= 0 -> j = i;
				j = +i + (i < 0 ? len : 0);
			return this.pushStack(j >= 0 && j < len ? [this[j]] : []);
		},

		/*
		var arr = ['a','b','c'];
		arr = $.map(arr, function(elem,i){
			return elem + i;
		})
		arr -> ['a1','b2','c3']
		*/

		map: function (callback) {
			return this.pushStack(jQuery.map(this, function (elem, i) {
				return callback.call(elem, i, elem);
			}));
		},

		// 出栈
		end: function () {
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
	
	 如果是深拷贝$.extend(true, a, b); a 和 b 之间就不会再相互影响了
	 */
	jQuery.extend = jQuery.fn.extend = function () {
		var options, name, src, copy, copyIsArray, clone,
			target = arguments[0] || {},
			i = 1,
			length = arguments.length,
			deep = false;

		// Handle a deep copy situation
		// 第一个参数是布尔值，表明是否是深拷贝
		// 第一个参数是布尔值，那目标自然就是第二个参数了
		if (typeof target === "boolean") {
			deep = target;
			target = arguments[1] || {};
			// skip the boolean and the target
			i = 2;
		}

		// Handle case when target is a string or something (possible in deep copy)
		// 如果目标不是对象也不是函数，那么，就强制改成对象
		if (typeof target !== "object" && !jQuery.isFunction(target)) {
			target = {};
		}

		// extend jQuery itself if only one argument is passed
		// 扩展插件情况 （只有一个字面量参数）
		// 如果第一个参数是布尔值，那么另外还有一个对象字面量参数
		// 如果第一个参数就是对象字面量，那么就只有这一个参数
		if (length === i) {
			target = this;
			--i;
		}

		// 多个字面量参数的情况，后面的参数都扩展到第一个对象字面量上
		for (; i < length; i++) {
			// Only deal with non-null/undefined values
			// typeof null === "object" ,所以能到这里，但是，这里还是会过滤掉
			if ((options = arguments[i]) != null) {
				// Extend the base object
				for (name in options) {
					src = target[name];
					copy = options[name];

					// Prevent never-ending loop
					// 防止循环引用
					/*
					eg: 
					var a = {};
					$.extend(a, {name : a});
					 */
					if (target === copy) {
						continue;
					}

					// Recurse if we're merging plain objects or arrays
					// 深拷贝，并且 copy 有值（不为null）,并且 copy 是对象或数组
					if (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)))) {
						// copy 是数组
						if (copyIsArray) {
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
						target[name] = jQuery.extend(deep, clone, copy);

						// Don't bring in undefined values
						// undefined 值会丢掉
					} else if (copy !== undefined) {
						target[name] = copy;
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
		expando: "jQuery" + (core_version + Math.random()).replace(/\D/g, ""),

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
		
		其实情况 ① 也可以看成是 ②，只不过把引入 jQuery 之前的 $ 和 jQuery 当做 undefined
		 */


		// 如果省略了参数 deep 或该参数不为 true，则表示只让出对变量 $ 的控制权；如果该参数为 true，则表示同时让出变量 $ 和 jQuery 的控制权。
		noConflict: function (deep) {
			// 如果全局 $ 为匿名函数内部的 jQuery，让出 $ 标识符
			if (window.$ === jQuery) {
				// 让出 $ 符，window.$ = 123
				window.$ = _$;
			}

			// 如果全局 jQuery 就是匿名函数内部的 jQuery，并且 deep 为真，那么就让出 jQuery 标识符
			if (deep && window.jQuery === jQuery) {
				window.jQuery = _jQuery;
			}

			return jQuery;
		},

		// Is the DOM ready to be used? Set to true once it occurs.
		// DOM加载是否完成（内部）
		/*
		① $(function(){}); 相当于 $(document).ready(function(){});
		DOM 加载完执行这个匿名函数（DOM 加载完会触发 DOMContentLoaded 事件）
		
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
		holdReady: function (hold) {
			if (hold) {
				jQuery.readyWait++;
			} else {
				jQuery.ready(true);
			}
		},

		// Handle when the DOM is ready
		// 准备DOM触发
		// 这个 ready 是工具方法，$.ready，不是实例方法 $().ready
		/*
		ready 的实参一般为空，即 undefined，
		只有 holdReady 方法中调用时为 true，jQuery.ready( true );
		*/
		ready: function (wait) {

			// Abort if there are pending holds or we're already ready
			// wait 为 true 时，若 jQuery.readyWait 不为 0，说明锁住了没有释放，不继续往下执行；
			// wait 为 false 时，若 jQuery.isReady 为真，说明 dom 已经加载完了，也不继续往下执行
			// jQuery.isReady 默认为 false
			/*
			① wait === true 说明，ready 方法被 holdReady 锁住了，这里仅仅解锁一次锁住，如果解锁后，发现还是锁住状态，就不能继续往下走了
			② wait !== true，一般情况下都是这样。如果 isReady 是 true，返回；
			③ wait !== true，isReady 是 false，往下走
			*/
			if (wait === true ? --jQuery.readyWait : jQuery.isReady) {
				return;
			}

			// Remember that the DOM is ready
			// 标记 dom 已经加载完
			jQuery.isReady = true;

			// If a normal DOM Ready event fired, decrement, and wait if need be
			// ③ wait !== true，isReady 是 false，往下走，走到这发现 jQuery.readyWait 大于 0，还是得返回
			// 归根结底，一定要等到 jQuery.readyWait 为 0 才能继续往下走，触发回调方法队列
			if (wait !== true && --jQuery.readyWait > 0) {
				return;
			}

			// If there are functions bound, to execute
			/*
			这句使得待执行的回调函数的 this 指向 document，第一个实参指向 jQuery
			例如：
			$(function(arg){
				console.log(this);// document
				console.log(arg); // jQuery
			});
			*/
			// 触发回调队列
			readyList.resolveWith(document, [jQuery]);

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
			if (jQuery.fn.trigger) {
				jQuery(document).trigger("ready").off("ready");
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
		isFunction: function (obj) {
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
		isWindow: function (obj) {
			// obj 不是 undefined ，也不是 null
			return obj != null && obj === obj.window;
		},

		// 是否为数字
		isNumeric: function (obj) {
			// typeof 123 -> "number"
			// typeof NaN -> "number"
			// parseFloat(null) -> NaN
			// parseFloat(NaN) -> NaN
			// 不为 NaN，并且有限
			/*
			isFinite(123)// true
			isFinite(Number.MAX_VALUE)// true
			isFinite(Number.MAX_VALUE + Number.MAX_VALUE)// 超出最大范围了，false

			Number.MAX_VALUE -> 1.7976931348623157e+308
			Number.MAX_VALUE +1 -> 1.7976931348623157e+308

			Number.MAX_VALUE + Number.MAX_VALUE -> Infinity
			 */

			return !isNaN(parseFloat(obj)) && isFinite(obj);
		},

		// 判断数据类型
		type: function (obj) {
			// $.type(undefined) -> 'undefined'
			// $.type(null) -> 'null'
			if (obj == null) {
				return String(obj);
			}
			// core_toString = {}.toString
			// {}.toString === Object.prototype.toString
			// Support: Safari <= 5.1 (functionish RegExp)
			// Safari <= 5.1 typeof 正则变量会返回 "function"，后来都修正为 "object"
			return typeof obj === "object" || typeof obj === "function" ?
				class2type[core_toString.call(obj)] || "object" :
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
	
		isPlainObject: function (obj) {
			// Not plain objects:
			// - Any object or value whose internal [[Class]] property is not "[object Object]"
			// - DOM nodes
			// - window
			// 非 "object" ,DOM 节点, window 排除
			if (jQuery.type(obj) !== "object" || obj.nodeType || jQuery.isWindow(obj)) {
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
				if (obj.constructor &&
					!core_hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
					// !{}.hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf")
					// Object.prototype 才有属性 "isPrototypeOf"
					// 其他的对象都是继承它
					return false;
				}
			} catch (e) {
				return false;
			}

			// If the function hasn't returned already, we're confident that
			// |obj| is a plain object, created by {} or constructed with new Object
			return true;
		},

		// 是否为空对象
		/*
		isEmptyObject({name:'hello'})// 有可枚举属性 false
		
		isEmptyObject({})// 没可枚举属性 true
		isEmptyObject([])// 没可枚举属性 true
		 */
		isEmptyObject: function (obj) {
			var name;
			// for in 只能找到可枚举的属性(不管是自身的还是继承的)
			for (name in obj) {
				return false;
			}
			return true;
		},

		// 抛出异常
		error: function (msg) {
			throw new Error(msg);
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
		parseHTML: function (data, context, keepScripts) {
			// 不是【字符串】或者【空字符串】就返回
			if (!data || typeof data !== "string") {
				return null;
			}
			// 如果第二个参数为布尔值，没有执行上下文
			if (typeof context === "boolean") {
				keepScripts = context;
				context = false;
			}
			context = context || document;

			// rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/
			// eg：rsingleTag.exec('<div></div>')
			// 结果：["<div></div>", "div", index: 0, input: "<div></div>"]
			// rsingleTag 匹配不带任何属性且没有任何子节点的html结构
			// 单个标签
			var parsed = rsingleTag.exec(data),
				scripts = !keepScripts && [];

			// Single tag
			// 如果匹配到了空的元素标签，比如div，则创建一个div元素，函数结束
			if (parsed) {
				return [context.createElement(parsed[1])];
			}

			// 没有匹配到空的元素标签（比较复杂的html片段），把传入的data转为文档碎片，存储在jQuery.fragments这个对象里
			// 通过 buildFragment 方法创建一个新的div元素，传入的data会作为这个div的innerHTML
			// 不过，这里不会完全复制data，会进行一些必要的过滤
			//（如，过滤掉 html/title/head 等标签）和闭合没有闭合的标签等操作（如 <span /> 变成 <span ></span>）
			parsed = jQuery.buildFragment([data], context, scripts);

			/*
			如果 keepScripts 为 true，那 scripts 就是 false，那 scripts 就不会被删除
			如果 keepScripts 为 false，那 scripts 就是 []，scripts 会被删除
			 */
			if (scripts) {
				jQuery(scripts).remove();
			}

			// 转成数组
			return jQuery.merge([], parsed.childNodes);
		},

		// 解析JSON，字符串转成真正的 json
		/*
		eg:
		var str = '{"name":"hello"}'; // 严格模式的json字符串
		var obj = $.parseJSON(str);// 转成json结构
		 */
		parseJSON: JSON.parse,// ie8 以上版本支持

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
		parseXML: function (data) {
			var xml, tmp;
			// 必须是字符串，并且有内容
			if (!data || typeof data !== "string") {
				return null;
			}

			// Support: IE9
			try {
				tmp = new DOMParser(); // ie8 以上支持
				xml = tmp.parseFromString(data, "text/xml"); // 得到XML文档对象
			} catch (e) {
				xml = undefined;
			}
			// 如果字符串不是完整的XML，比如标签没闭合，或不是 xml 格式，ie9 下会报错（其他浏览器不报错，但是会有 parsererror 节点）

			if (!xml || xml.getElementsByTagName("parsererror").length) {
				jQuery.error("Invalid XML: " + data);
			}
			return xml;
		},

		// 空函数
		noop: function () { },

		// Evaluates a script in a global context
		// 全局解析js
		/*
		function test() {
			jQuery.globalEval( "var newVar = true;" )
		}
		test();
		// newVar === true 全局变量
		 */
		// 参数 code 是字符串
		globalEval: function (code) {
			var script,
				indirect = eval;

			code = jQuery.trim(code);

			if (code) {
				// If the code includes a valid, prologue position
				// strict mode pragma, execute code by injecting a
				// script tag into the document.
				// 严格模式下不支持 eval
				if (code.indexOf("use strict") === 1) {
					script = document.createElement("script");
					script.text = code;
					document.head.appendChild(script).parentNode.removeChild(script);
					// 一般情况查下 eval
					/*
					① 在函数里打印 a
					function test(){
						eval('var a = 1');
						console.log(a)
					}
					test(); // 1

					② 在函数外打印 a
					function test(){
						eval('var a = 1');
					}
					test();
					console.log(a) // 报错，找不到 a

					③ eval 换成 window.eval 就可以找到了
					function test(){
						window.eval('var a = 1');
					}
					test();
					console.log(a) // 1，找到了 a

					④ 把 eval 赋值给一个变量，也可以找到 a
					function test(){
						var val = eval;
						// 相当于 val = window.eval;
						val('var a = 1');
					}
					test();
					console.log(a) // 1，找到了 a

					为什么会这样？
				 （1）eval() 在函数里执行代码就只函数里起作用，在全局执行就可以全局范围起作用；
				 （2）如果这个方法由 window 对象来驱动，无论函数里还是全局环境执行，代码都在全局范围里起作用。
					 */
				} else {
					// Otherwise, avoid the DOM node creation, insertion
					// and removal by using an indirect global eval
					// 这里不能直接写 eval(code)，否在 code 只会在局部起作用
					indirect(code);
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
		camelCase: function (string) {
			return string.replace(rmsPrefix, "ms-").replace(rdashAlpha, fcamelCase);
		},

		/*
		$.nodeName(document.documentElement, 'html') // true
		 */
		// 是否为指定节点名（内部）
		nodeName: function (elem, name) {
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
		each: function (obj, callback, args) {
			var value,
				i = 0,
				length = obj.length,
				isArray = isArraylike(obj); // 是否是类数组，包括数组（jq对象也是类数组，有length，并且数组下标）

			// 内部使用
			if (args) {
				// 数组、类数组用 for 循环
				if (isArray) {
					for (; i < length; i++) {
						// callback 里的 this 指向 obj[ i ]，参数固定为 args
						value = callback.apply(obj[i], args);
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

						if (value === false) {
							break;
						}
					}
					// json 对象用 for in 循环
				} else {
					for (i in obj) {
						value = callback.apply(obj[i], args);

						if (value === false) {
							break;
						}
					}
				}

				// A special, fast, case for the most common use of each
				// 一般使用
			} else {
				// 数组，类数组用 for 循环
				if (isArray) {
					for (; i < length; i++) {
						// callback 里的 this 指向 obj[ i ]，第一二个参数分别为 i, obj[ i ]
						value = callback.call(obj[i], i, obj[i]);

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
						if (value === false) {
							break;
						}
					}
					// json 对象用 for in 循环
				} else {
					for (i in obj) {
						value = callback.call(obj[i], i, obj[i]);

						if (value === false) {
							break;
						}
					}
				}
			}

			return obj;
		},

		// 去掉前后空格
		/*
		var str = 'hello '
		str = $.trim(str);
		// 'hello'
		 */
		trim: function (text) {
			// undefined null -> ""
			// core_trim = core_version.trim
			// 用原生的 trim 方法
			return text == null ? "" : core_trim.call(text);
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
		makeArray: function (arr, results) {
			var ret = results || [];

			// 不为 null，不为 undefined
			if (arr != null) {
				// isArraylike 参数只能是对象，如 Object(123) 转成包装对象，不是类数组，然后走到 else
				// 字符串 "hi" 具有 length 属性，Object('hi') {0: "h", 1: "i", length: 2, [[PrimitiveValue]]: "hi"}
				if (isArraylike(Object(arr))) {
					jQuery.merge(ret,
						typeof arr === "string" ?
							[arr] : arr
					);
					// Object(123) {[[PrimitiveValue]]: 123} 走这里
				} else {
					// core_push = [].push
					core_push.call(ret, arr);
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
		inArray: function (elem, arr, i) {
			// core_indexOf = [].indexOf 原生的数组方法, i 表示查找起始位置，可选
			return arr == null ? -1 : core_indexOf.call(arr, elem, i);
		},

		// 第二个类数组的元素合并进第一个类数组
		merge: function (first, second) {
			var l = second.length,
				i = first.length,
				j = 0;

			// l 是数字时，可以根据 l 来遍历数组 second
			if (typeof l === "number") {
				for (; j < l; j++) {
					first[i++] = second[j];
				}
				// l 不是数字时，那就根据让索引 j++ 来遍历 second
			} else {
				while (second[j] !== undefined) {
					first[i++] = second[j++];
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
		grep: function (elems, callback, inv) {
			var retVal,
				ret = [],
				i = 0,
				length = elems.length;
			// 强制把第三个参数转成布尔值
			inv = !!inv;

			// Go through the array, only saving the items
			// that pass the validator function
			for (; i < length; i++) {
				// 函数执行结果强制转成布尔值
				// 如果 inv 为真，retVal 需要为假，才会把相应元素存进去
				// 如果 inv 为假，retVal 需要为真，才会把相应元素存进去
				retVal = !!callback(elems[i], i);
				if (inv !== retVal) {
					ret.push(elems[i]);
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
		map: function (elems, callback, arg) {
			var value,
				i = 0,
				length = elems.length,
				isArray = isArraylike(elems),
				ret = [];

			// Go through the array, translating each of the items to their
			// 类数组用 for 循环
			if (isArray) {
				for (; i < length; i++) {
					value = callback(elems[i], i, arg);

					if (value != null) {
						ret[ret.length] = value;
					}
				}

			// Go through every key on the object,
			// 其他用 for in 循环
			} else {
				for (i in elems) {
					value = callback(elems[i], i, arg);

					if (value != null) {
						ret[ret.length] = value;
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
			return core_concat.apply([], ret);
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

		$.proxy(show,document)();// document

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
		proxy: function(fn, context) {
			var tmp, args, proxy;

			/*
			var obj = {
				show : function(){
					console.log(this);
				}
			};
			$(document).click( obj.show ); // document
			$(document).click( $.proxy(obj.show, obj) ); // obj
			$(document).click( $.proxy(obj, 'show') ); // obj
			 */

			/*
			$.proxy(obj, 'show') 这种形式：

			context = obj; // 即 this 对象指向第一个参数
			fn = obj['show'] // 待执行函数

			相当于： $.proxy(obj['show'], obj)
			 */
			if (typeof context === "string") {
				tmp = fn[context];
				context = fn;
				fn = tmp;
			}

			// Quick check to determine if target is callable, in the spec
			// this throws a TypeError, but we will just return undefined.
			// 确保 fn 是函数
			if (!jQuery.isFunction(fn)) {
				return undefined;
			}

			// Simulated bind
			// 这种写法类似于 bind，除去前两个参数，其他的多余的参数和返回的新函数 f 的实参合并在一起，作为 f 的实参
			args = core_slice.call(arguments, 2);
			proxy = function () {
				return fn.apply(context || this, args.concat(core_slice.call(arguments)));
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
		access: function(elems, fn, key, value, chainable, emptyGet, raw) {
			var i = 0,
				length = elems.length,
				bulk = key == null;
				/*
				 key 为 undefined 或 null ,bulk 为 true;
				 其他情况，bulk 为 false;
				*/


			// Sets many values
			// $('#div1').css({'background':'green',width:'300px'}) 这种
			if (jQuery.type(key) === "object") {
				// 多组值，必定是设置
				chainable = true;
				// 递归
				for (i in key) {
					jQuery.access(elems, fn, i, key[i], true, emptyGet, raw);
				}

			// Sets one value
			// 有 value，也是设置
			} else if (value !== undefined) {
				// 手动标识设置
				chainable = true;

				// value 不是函数的时候，比如字符串 'green'，raw 为 true;
				if (!jQuery.isFunction(value)) {
					raw = true;
				}

				// 没有指定 key 的时候
				if (bulk) {
					// Bulk operations run against the entire set
					/*
					① value 不是函数的时候，raw 强制为 true
					② value 是函数的时候，如果 raw 本来就是【真】，也走这里
					*/
					if (raw) {
						fn.call(elems, value);
						fn = null;

					// ...except when executing function values
					// value 是函数，并且 raw 原本不为真 ，修正 fn
					} else {
						bulk = fn;
						fn = function (elem, key, value) {
							return bulk.call(jQuery(elem), value);
						};
					}
				}

				/*
				fn 为真，说明：
				① 指定了 key 值，fn 还是传入的 fn
				② fn 是修正后的，因为原来的 fn = null
				*/
				if (fn) {
					for (; i < length; i++) {
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
						fn(elems[i], key, raw ? value : value.call(elems[i], i, fn(elems[i], key)));
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
					fn.call(elems) :
					length ? fn(elems[0], key) : emptyGet;
		},

		// 当前时间
		// 1499526895632
		// +new Date() === Date.now()// true
		// (new Date()).getTime() === Date.now()// true
		now: Date.now,

		// A method for quickly swapping in/out CSS properties to get correct calculations.
		// Note: this method belongs to the css module but it's needed here for the support module.
		// If support gets modularized, this method should be moved back to the css module.
		// css 交换
		/*
		<div id="div1" style="width:100px;height:100px;background:red">aaa</div>

		① $('#div1').width() // 100

		还可以这样获取：
		② $('#div1').get(0).offsetWidth// 100

		不过，当把这个 div 隐藏（display:none）后，① 还是可以得到 100，而 ② 只能得到 0

		思路：
		把 display:none 改成 display:block，可是这样不就可以看见元素了，
		那就再加上 visibility:hidden，可是这样虽然看不见，但还是占据留白空间，
		那就再加上 position:absolute

		获取到值后，再把样式改回去
		 */
		swap: function(elem, options, callback, args) {
			var ret, name,
				old = {};

			// Remember the old values, and insert the new ones
			for (name in options) {
				// 原来的属性先存起来
				old[name] = elem.style[name];
				// 用新的属性
				elem.style[name] = options[name];
			}

			// 进行获取属性等操作
			ret = callback.apply(elem, args || []);

			// Revert the old values
			// 恢复原来的属性
			for (name in options) {
				elem.style[name] = old[name];
			}

			return ret;
		}
});

jQuery.ready.promise = function (obj) {
	// 第一次执行这个函数的时候 readyList 这个全局变量是 undefined，所以可以继续往下走
	if (!readyList) {

		readyList = jQuery.Deferred();

		// Catch cases where $(document).ready() is called after the browser event has already occurred.
		// we once tried to use readyState "interactive" here, but it caused issues like the one
		// discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15
		// dom 已经加载好了
		if (document.readyState === "complete") {
			// Handle it asynchronously to allow scripts the opportunity to delay ready
			// 这个延迟是兼容 ie 的
			setTimeout(jQuery.ready);
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
			document.addEventListener("DOMContentLoaded", completed, false);

			// A fallback to window.onload, that will always work
			// 有的浏览器会缓存事件，可能会先触发 load
			window.addEventListener("load", completed, false);
		}
	}
	return readyList.promise(obj);
};

// Populate the class2type map
jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function (i, name) {
	class2type["[object " + name + "]"] = name.toLowerCase();
});

// 数组，类数组都返回 true
function isArraylike(obj) {
	var length = obj.length,
		type = jQuery.type(obj);

	// window 可能会影响下面的判断，所以先过滤之
	if (jQuery.isWindow(obj)) {
		return false;
	}

	// dom 元素一般没有 length 属性，一旦有了 length 属性，那么这个 dom 元素也是类数组了
	if (obj.nodeType === 1 && length) {
		return true;
	}


	/*
	① 真数组返回 true
	② 带 length 属性的函数排除掉
	③ ( length === 0 || typeof length === "number" && length > 0 && ( length - 1 ) in obj );
			本来想简写为：typeof length === "number" && length >= 0 && ( length - 1 ) in obj )
			只不过，0 - 1 = -1，(-1 in obj) 不满足，所以，这里得单独把 length === 0 拿出来
	 */
	return type === "array" || type !== "function" &&
		(length === 0 ||
			typeof length === "number" && length > 0 && (length - 1) in obj);
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
(function (window, undefined) {

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
		// 首选 doc
		preferredDoc = window.document,
		dirruns = 0,
		done = 0,
		// 可以以 classCache(key,value)、tokenCache(key,value)、compilerCache(key,value) 的方式存储键值对
		classCache = createCache(),
		tokenCache = createCache(),
		compilerCache = createCache(),
		hasDuplicate = false,
		sortOrder = function (a, b) {
			if (a === b) {
				hasDuplicate = true;
				return 0;
			}
			return 0;
		},

		// General-purpose constants
		strundefined = typeof undefined,
		// -2147483648
		MAX_NEGATIVE = 1 << 31,

		// Instance methods
		hasOwn = ({}).hasOwnProperty,
		arr = [],
		pop = arr.pop,
		push_native = arr.push,
		push = arr.push,
		slice = arr.slice,
		// Use a stripped-down indexOf if we can't use a native one
		// 首选数组原生的 indexOf 方法，否则自定义
		indexOf = arr.indexOf || function (elem) {
			var i = 0,
				len = this.length;
			for (; i < len; i++) {
				if (this[i] === elem) {
					return i;
				}
			}
			return -1;
		},

		booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

		// Regular expressions

		// Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
		// 表示“空白符”{\x20 空格}{\t 制表符}{\r 回车}{\n 换行}{\f 换页}
		whitespace = "[\\x20\\t\\r\\n\\f]",

		/*
		r = new RegExp(characterEncoding)
		-> r = /(?:\\.|[\w-]|[^\x00-\xa0])+/
		三类可以通过匹配：
		① \任意非换行字符r.exec('\\1')-> ["\1", index: 0, input: "\1"]
		② word 或 -r.exec('-')-> ["-", index: 0, input: "-"]
		③ 非 \x00-\xa0 字符 如 r.exec('\xab') 可以通过匹配（字符 '\xab' 在当前文件编码下不能显示，所以这里就不写了）
		*/
		// http://www.w3.org/TR/css3-syntax/#characters
		characterEncoding = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",

		// Loosely modeled on CSS identifier characters
		// An unquoted value should be a CSS identifier http://www.w3.org/TR/css3-selectors/#attribute-selectors
		// Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
		identifier = characterEncoding.replace("w", "w#"),

		/*
		r = new RegExp(attributes);
		r.exec("[a=b]")-> ["[a=b]", "a", "=", undefined, undefined, "b", index: 0, input: "[a=b]"]
		r.exec("[a ^= b]") -> ["[a ^= b]", "a", "^=", undefined, undefined, "b", index: 0, input: "[a ^= b]"]
		r.exec("[a $= 'b']") -> ["[a $= 'b']", "a", "$=", "'", "b", undefined, index: 0, input: "[a $= 'b']"]
		*/
		// Acceptable operators http://www.w3.org/TR/selectors/#attribute-selectors
		attributes = "\\[" + whitespace + "*(" + characterEncoding + ")" + whitespace +
			"*(?:([*^$|!~]?=)" + whitespace + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + identifier + ")|)|)" + whitespace + "*\\]",

		// Prefer arguments quoted,
		// then not containing pseudos/brackets,
		// then attribute selectors/non-parenthetical expressions,
		// then anything else
		// These preferences are here to reduce the number of selectors
		// needing tokenize in the PSEUDO preFilter
		/*
		r = new RegExp( "^" + pseudos )
		r.exec(':not([type="submit"])')
		-> [":not([type="submit"])", "not", "[type="submit"]", undefined, undefined, "[type="submit"]", "type", "=", """, "submit", undefined, index: 0, input: ":not([type="submit"])"]
		*/
		pseudos = ":(" + characterEncoding + ")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|" + attributes.replace(3, 8) + ")*)|.*)\\)|)",

		// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
		rtrim = new RegExp("^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g"),

		// /^[\x20\t\r\n\f]*,[\x20\t\r\n\f]*/匹配逗号
		rcomma = new RegExp("^" + whitespace + "*," + whitespace + "*"),
		// 匹配连接符
		rcombinators = new RegExp("^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*"),

		// 匹配兄弟关系符
		rsibling = new RegExp(whitespace + "*[+~]"),
		// = 后跟的若干字符不是 ] ' " 这 3 中字符其中一种，然后是 ]
		rattributeQuotes = new RegExp("=" + whitespace + "*([^\\]'\"]*)" + whitespace + "*\\]", "g"),

		rpseudo = new RegExp(pseudos),
		ridentifier = new RegExp("^" + identifier + "$"),

		matchExpr = {
			"ID": new RegExp("^#(" + characterEncoding + ")"),
			"CLASS": new RegExp("^\\.(" + characterEncoding + ")"),
			"TAG": new RegExp("^(" + characterEncoding.replace("w", "w*") + ")"),
			"ATTR": new RegExp("^" + attributes),
			"PSEUDO": new RegExp("^" + pseudos),
			/*
			matchExpr.CHILD.exec(':first-child')
			-> [":first-child", "first", "child", undefined, undefined, undefined, undefined, undefined, undefined, index: 0, input: ":first-child"]
			matchExpr.CHILD.exec(":nth-child(-2n+3)")
			-> [":nth-child(-2n+3)", "nth", "child", "-2n+3", "-2n", "-", "2", "+", "3", index: 0, input: ":nth-child(-2n+3)"]
			*/
			"CHILD": new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
				"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
				"*(\\d+)|))" + whitespace + "*\\)|)", "i"),
			"bool": new RegExp("^(?:" + booleans + ")$", "i"),
			// For use in libraries implementing .is()
			// We use this for POS matching in `select`
			// 以 > + ~ 等三个字符开头，或位置伪类
			"needsContext": new RegExp("^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
				whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i")
		},

		/*
		rnative.exec('push() { [native code] }')
		-> ["push() { [native c", index: 0, input: "push() { [native code] }"]
		
		rnative.exec([].push)
		-> ["function push() { [native c", index: 0, input: "function push() { [native code] }"]
		
		该正则可以用来判断原生方法
		 */
		rnative = /^[^{]+\{\s*\[native \w/,

		// Easily-parseable/retrievable ID or TAG or CLASS selectors
		// 匹配 #id tag .class 等 3 种选择器
		rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

		// input|select|textarea|button
		rinputs = /^(?:input|select|textarea|button)$/i,
		// h1 h2
		rheader = /^h\d$/i,
		/*
		rescape.exec('\\')
		-> ["\", index: 0, input: "\"]
		rescape.exec("'")
		-> ["'", index: 0, input: "'"]
		 */
		rescape = /'|\\/g,

		/*
		runescape = /\\([\da-f]{1,6}[\x20\t\r\n\f]?|([\x20\t\r\n\f])|.)/gi
		匹配 3 种情况，各举一例(字符串种的 \\ 相当于 \)：
		① 1-6 位十六进制字符runescape.exec('\\123abc ') -> ["\123abc ", "123abc ", undefined, index: 0, input: "\123abc "]
		② 空白字符 runescape.exec('\\\t') -> ["\ ", "", "", index: 0, input: "\"]
		③ 换行符以外的任意字符 runescape.exec('\\z') -> ["\z", "z", undefined, index: 0, input: "\z"]
		 */
		// CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
		runescape = new RegExp("\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig"),
		// 根据十六进制码点 escaped 返回相应的字符
		funescape = function (_, escaped, escapedWhitespace) {
			/*
			前缀 0x 表示十六进制
			① "0x" + escaped 返回字符串，eg : "0x" + '73ab30' -> "0x73ab30"
			② "0x" + escaped - 0x10000 返回数字，eg : "0x73ab30" - 0x10000 -> 7514928
			*/
			var high = "0x" + escaped - 0x10000;
			// NaN means non-codepoint
			// Support: Firefox
			// Workaround erroneous numeric interpretation of +"0x"
			/*
			当 escaped 含有不是 16 进制字符的时候，如 '0xabcdef' - 0x10000 ―> NaN
			这里用 high !== high 表示 high 为 NaN。
	
			因为 NaN 是 JavaScript 中唯一不等于自身的值
			*/
			return high !== high || escapedWhitespace ?
				escaped :
				// BMP codepoint
				/*
				String.fromCharCode 返回一个或多个 Unicode 代码组成的字符串
				eg:
				String.fromCharCode( 0x10000 ) -> " "（空格）
				String.fromCharCode(100,114,101,97,109) -> "dream"
				*/
				high < 0 ?
					// BMP 字符，把刚才减的加回去
					String.fromCharCode(high + 0x10000) :
					// Supplemental Plane codepoint (surrogate pair)
					String.fromCharCode(high >> 10 | 0xD800, high & 0x3FF | 0xDC00);
		};
		/*
			参考：
			https://segmentfault.com/a/1190000006960642
			http://javascript.ruanyifeng.com/grammar/string.html

			(1) BMP
			Unicode 字符（U+0000 - U+10FFFF）分为 17 组平面，每个平面拥有 2^16 (65,536)个码点。

			① 第一个平面（0 号平面）我们称之为 BMP（基本多文种平面, Basic Multilingual Plane），它包含了最常用的从 U+0000 到 U+FFFF 的码点。

			② 其余 16号平面（U+100000 到 U+10FFFF）称为补充的平面。这里我将不讨论它；

			所以，总体上可以将 Unicode 字符分为 BMP 字符和非 BMP 字符（补充字符）两大类。

			(2) javascript 字符集
			每个字符在 JavaScript 内部都是以 16 位（即 2 个字节）的 UTF-16 格式储存。也就是说，JavaScript 的单位字符长度固定为 16 位长度，即 2 个字节。

			但是，UTF-16 有两种长度：
			① 对于 U+0000 到 U+FFFF 之间的字符，长度为 16 位（即 2 个字节）；
			② 对于 U+10000 到 U+10FFFF 之间的字符，长度为 32 位（即4个字节），而且前两个字节在 0xD800 到 0xDBFF 之间，后两个字节在 0xDC00 到 0xDFFF 之间。
			举例来说，U+1D306 对应的字符写成 UTF-16 就是 0xD834 0xDF06。浏览器会正确将这四个字节识别为一个字符，但是 JavaScript 内部的字符长度总是固定为 16 位，会把这四个字节视为两个字符。

			var s = '\uD834\uDF06';

			s.length// 2
			/^.$/.test(s) // false
			s.charAt(0) // ""
			s.charAt(1) // ""
			s.charCodeAt(0) // 55348
			s.charCodeAt(1) // 57094

			问题来了，如果不将大于 U+FFFF 的字符，从 Unicode 转为 UTF-16，会怎样呢？
			"\u20BB7" -> " 7"

			上面代码表示，如果直接在 \u 后面跟上超过 0xFFFF 的数值（比如 \u20BB7），JavaScript 会理解成 \u20BB+7。
			由于 \u20BB 是一个不可打印字符，所以只会显示一个空格，后面跟着一个 7

			也就是说 "\u20BB7" 被解析成了 "\u20BB" + "7" 这是不对的。所以，才需要转换。

			对于 U+10000 到 U+10FFFF 之间的字符，JavaScript 总是视为两个字符（字符的 length 属性为 2），用来匹配单个字符的正则表达式会失败（ JavaScript 认为这里不止一个字符），
			charAt 方法无法返回单个字符，charCodeAt 方法返回每个字节对应的十进制值

			对于 4 个字节的 Unicode 字符，假定 C 是字符的 Unicode 编号，H 是前两个字节，L 是后两个字节，则它们之间的换算关系如下：

			// 将大于 U+FFFF 的字符，从 Unicode 转为 UTF-16
			H = Math.floor((C - 0x10000) / 0x400) + 0xD800
			L = (C - 0x10000) % 0x400 + 0xDC00

			换种写法：
			H = ((C - 0x10000) >> 10) | 0xD800
			L = ((C - 0x10000) & 0x3FF) | 0xDC00

			A. 先看看 H = Math.floor((C - 0x10000) / 0x400) + 0xD800 和 H = ((C - 0x10000) >> 10) | 0xD800 为什么等价：

			0x400 换成十进制就是 1024， >> 10 表示按位右移 10 位，每右移 1 位相当于除 2，右移 10 位就是除以 2^10 = 1024
			另外，除法（/）不能保证结果是整数，但是右移的结果一定是整数，eg：
			C = 0x1da39-> 121401
			(C - 0x10000) / 0x400-> 54.5556640625
			(C - 0x10000) >> 10-> 54

			上面两种写法一个是 + 0xD800，一个是 | 0xD800，为什么会一样呢？
			0xD800 换成二进制是 0b1101100000000000 (后面 11 个 0)
			假设 C 为最大的 0x10FFFF，(0x10FFFF - 0x10000) >> 10 -> 0b1111111111（后面 10 个 1）
			所以，可以看出，+ 和 | 效果确实一样，| 运算速度更快一些。

			B. 再看看 L = (C - 0x10000) % 0x400 + 0xDC00 和 L = ((C - 0x10000) & 0x3FF) | 0xDC00 为什么等价：
			0x400 -> 0b10000000000
			0x3FF ->0b1111111111

			% 0x400 意味着舍弃大于等于 0x400 的部分，保留小于 0x400 的部分
			& 0x3FF 前面 6 位都是 0，后面 10 位都是 1，所以也是保留小于 0x400 的部分

			另外 0xDC00 -> 0b1101110000000000 (后面 10 个 0)，所以 + 0xDC00 和 | 0xDC00 效果一样。

			// 将大于 U+FFFF 的字符，从 UTF-16 转为 Unicode
			C = (H - 0xD800) * 0x400 + L - 0xDC00 + 0x10000
		*/


	// Optimize for push.apply( _, NodeList )
	// 如果浏览器支持 push.apply 方法，那就最好了，否则就自己实现这个方法
	try {
		/*
		preferredDoc = window.document
		
		eg:
		preferredDoc.childNodes
		-> [<!DOCTYPE html>, comment, comment, html]
		
		arr = [<!DOCTYPE html>, comment, comment, html, <!DOCTYPE html>, comment, comment, html]
		 */
		push.apply(
			(arr = slice.call(preferredDoc.childNodes)),
			preferredDoc.childNodes
		);
		// Support: Android<4.0
		// Detect silently failing push.apply
		// 如果浏览器能执行 push.apply 方法，这里就默默地执行好了，否则报错，就会执行下面的 catch 语句
		arr[preferredDoc.childNodes.length].nodeType;
	} catch (e) {
		// arr.length 不为 0 ，说明 slice.call 方法可以用
		push = {
			apply: arr.length ?

				// Leverage slice if possible
				function (target, els) {
					push_native.apply(target, slice.call(els));
				} :

				// Support: IE<9
				// Otherwise append directly
				function (target, els) {
					var j = target.length,
						i = 0;
					// Can't trust NodeList.length
					while ((target[j++] = els[i++])) { }
					// while 循环最后一次条件不成立，但是 j 还是加 1 了，所以得减回去
					target.length = j - 1;
				}
		};
	}

	/*
		参考：http://zhenhua-lee.github.io/framework/sizzle.html
		
		Sizzle 把复杂选择器表达式，拆成一个个【块表达式】和【块间关系】
	
	 【块间关系】分为 4 类：
		① ">" 父子关系
		② [\x20\t\r\n\f] 祖宗后代关系
		③ "+" 紧邻兄弟元素
		④ "~" 之后的所有兄弟元素

	 【块表达式】分为 3 类：
		① 简单表达式。包括 id、class、tag
		② 属性表达式
		③ 伪表达式。包括位置伪类、子元素伪类、内容伪类、可见伪类、表单伪类
	
		Sizzle 以【块表达式】为单位进行解析，而且顺序是 “从右到左”，也就是说先分析右边的【块表达式】，再分析左边的【块表达式】
		至于为什么要 “从右到左”，而不是 “从左到右” 。想想 dom 树形结构就很容易理解了，从子节点向上找某个祖先节点容易，但是从祖先节点找到某个后代节点可不那么容易。

		不过，也有例外，位置伪类是 “从由到左” 解析是不行的。以 $(".content > p:first")：

		<div>
			<p>aa</p>
		</div>
		<div class="content">
			<p>bb</p>
			<p>cc</p>
		</div>

		首先，对选择表达式分解成【块表达式】和【块间关系】

		".content > p:first"
		-> [.content, >, p:first]

		然后，“从右向左” 来分析【块表达式】，具体为：
		a. 根据 p:first 找到 <p>aa</p>
		b. 然后验证 <p>aa</p> 的父元素的 class 是不是 content
		c. 父元素 class 不是 content，返回 null

		这个结果明显是不对的。
	
		所以：
		① 一般情况下，都是 “从右向左” 解析
		② 遇到位置伪类就 “从左到右” 解析
		③ 如果选择器表达式的最左边存在 #id 选择器，也会 “从左到右” 解析
		 （首先对最左边进行查询，并将其作为下一步的执行上下文，达到缩小查找范围的目的）
	
		
		Sizzle 整体结构：
		
		if(document.querySelectorAll) {
			sizzle = function(query, context) {
				return makeArray(context.querySelectorAll(query));
			}
		} else {
			sizzle 引擎实现，主要模拟 querySelectorAll
		}
		
		可以看到，Sizzle 选择器引擎的主要工作就是向上兼容 querySelectorAll 这个 API，假如所有浏览器都支持该 API，那 Sizzle 就没有存在的必要了
		
		几个主要函数：
		Sizzle = function(selector, context, result, seed) // Sizzle 引擎的入口函数
		Sizzle.find // 主查找函数
		Sizzle.filter // 主过滤函数
		Sizzle.selectors.relative: { // 块间关系处理函数集
			"+" : function() {},
			" " : function() {},
			">" : function() {},
			"~" : function() {}
		}
		
	
		看看怎么从 jQuery.fn.init 方法走到 Sizzle 方法的：
		
		① jQuery.fn.init 方法中调用 jQuery.fn.find 方法：
		else if ( !context || context.jquery ) {
			return ( context || rootjQuery ).find( selector );
		} else {
			return this.constructor( context ).find( selector );
		}
		
		② jQuery.fn.find 中调用 jQuery.find 方法：
		for ( i = 0; i < len; i++ ) {
			jQuery.find( selector, self[ i ], ret );
		}
		
		③ jQuery.find 其实就是 Sizzle 函数
		jQuery.find = Sizzle;
	*/

	/*
	1 对于单一选择器，且是 ID、Tag、Class 三种类型之一，则直接获取并返回结果
	2 对于支持 querySelectorAll 方法的浏览器，通过执行 querySelectorAll 方法获取并返回匹配的 dom 元素
	3 除上之外则调用 select 方法获取并返回匹配的 dom 元素
	 */
	function Sizzle(selector, context, results, seed) {
		var match, elem, m, nodeType,
			// QSA vars
			i, groups, old, nid, newContext, newSelector;

		if ((context ? context.ownerDocument || context : preferredDoc) !== document) {
			setDocument(context);
		}

		// 修正 context 和 results
		context = context || document;
		results = results || [];

		// 选择器不合法，直接返回 results
		if (!selector || typeof selector !== "string") {
			return results;
		}

		// 元素的 nodeType 是 1，文档（document）nodeType 是 9。若 context 既不是元素又不是 document，那就返回空数组
		if ((nodeType = context.nodeType) !== 1 && nodeType !== 9) {
			return [];
		}

		// html 文档，并且没有 seed
		if (documentIsHTML && !seed) {
			// Shortcuts
			/*
			rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/
			匹配 3 种情况
			① #([\w-]+)匹配 #idmatch[1]
			② (\w+)匹配 tagmatch[2]
			③ \.([\w-]+) 匹配 .class match[3]
			*/
			if ((match = rquickExpr.exec(selector))) {
				// Speed-up: Sizzle("#ID")
				/*
				rquickExpr.exec('#test')
				-> match = ["#test", "test", undefined, undefined, index: 0, input: "#test"]
				-> match[1] = "test"
	
				这里处理 id 类型选择器，如 #test
	
				那么问题来了，selector 为 "#ID" 这种形式不是在 jQuery.fn.init 方法中处理过了吗？
				怎么会走到这里来呢？
	
				仔细看 jQuery.fn.init 源码会发现：
				$("#ID") 这种形式确实在 jQuery.fn.init 中已经处理掉了
				但是，$("#ID", context) 这种有第二个参数 context 的情况会走这里
				*/
				if ((m = match[1])) {
					// context 为 document
					if (nodeType === 9) {
						// getElementById 方法只能在 document 对象上调用，普通的元素没有这个方法
						elem = context.getElementById(m);
						// Check parentNode to catch when Blackberry 4.6 returns
						// nodes that are no longer in the document #6963
						// 兼容 Blackberry 4.6 bug
						if (elem && elem.parentNode) {
							// Handle the case where IE, Opera, and Webkit return items
							// by name instead of ID
							// 有的浏览器会根据 name 返回，而不是 id，所以这里再确认一遍
							if (elem.id === m) {
								results.push(elem);
								return results;
							}
							// 元素没取到或者没有父元素，则忽略
						} else {
							return results;
						}
						// Context 不是 document
					} else {
						// Context is not a document
						/*
						需要同时满足以下 4 个条件：
						① context.ownerDocument 必须存在，即 document 要存在
						② document.getElementById( m ) 能获取到元素 elem
						③ elem 是 context 的子元素
						④ elem 的 id 值 为 m
						*/
						if (context.ownerDocument && (elem = context.ownerDocument.getElementById(m)) &&
							contains(context, elem) && elem.id === m) {
							results.push(elem);
							return results;
						}
					}

					// Speed-up: Sizzle("TAG")
					// 处理 tag 类型选择器，如 div
				} else if (match[2]) {
					// 和 getElementById 方法不同，普通元素拥有 getElementsByTagName 方法
					push.apply(results, context.getElementsByTagName(selector));
					return results;

					// Speed-up: Sizzle(".CLASS")
					// 处理 class 类型选择器，如 .cls（需要支持 getElementsByClassName 方法）
				} else if ((m = match[3]) && support.getElementsByClassName && context.getElementsByClassName) {
					push.apply(results, context.getElementsByClassName(m));
					return results;
				}
			}

			/*
			说一下 querySelector 和 querySelectorAll
	
			(1) querySelector VS querySelectorAll
	
			querySelector 返回的是第一个匹配元素，querySelectorAll 返回的是所有匹配元素集合
	
			(2) querySelectorAll VS getElementsBy*
	
			querySelectorAll 返回的是一个 Static Node List，而 getElementsBy 系列的返回的是一个 Live Node List。
			也就是说，返回结果集合后，前者不会自动更新，后者会自动更新。
	
			区别在于：
			document.getElementsByTagName('div') === document.getElementsByTagName('div') -> true
			document.querySelectorAll('div') === document.querySelectorAll('div') -> false
	
			返回 true 意味着 getElementsBy 每次拿到的是同一个 object。返回 false 意味着每次返回都是不一样的 object。
	
			eg:
			// 初始时 dom 中没有 <img> 元素
			x = document.querySelectorAll('img')
			y = document.getElementsByTagName('img')
			document.body.appendChild(new Image())
			x.length // 0
			y.length // 1
	
			以下的 qSA 就是指 querySelectorAll
	
			① support.qsa 是指浏览器支持 querySelectorAll
			② rbuggyQSA 是指 qsa 相关的 bug
	
			querySelectorAll 可用，并且不会触发 bug，才执行以下 if 语句
			*/
			// QSA path
			if (support.qsa && (!rbuggyQSA || !rbuggyQSA.test(selector))) {
				// expando = "sizzle" + -(new Date())，如 "sizzle-1499319258080"
				nid = old = expando;
				newContext = context;
				// context 为 document，newSelector 值才为 selector，否则为 false
				newSelector = nodeType === 9 && selector;

				// qSA works strangely on Element-rooted queries
				// We can work around this by specifying an extra ID on the root
				// and working up from there (Thanks to Andrew Dupont for the technique)
				// IE 8 doesn't work on object elements
				/*
				querySelectorAll 有一个 bug，该 bug 在某些情况下会把当前节点（context）也作为结果返回。
	
				为了规避这个 bug，我们给选择器前面加上 context 的 id（如果 context 没有 id，加个 id，随后去掉）。
				比如：
				原 selector : "str1, str2, str3"
				新 selector : "[id='contextId'] str1, [id='contextId'] str2, [id='contextId'] str3"
				*/
				// context 为元素，并且元素标签名不能是 object
				if (nodeType === 1 && context.nodeName.toLowerCase() !== "object") {
					groups = tokenize(selector);

					// context 有 id 值
					if ((old = context.getAttribute("id"))) {
						// rescape = /'|\\/g，修正 id 值
						nid = old.replace(rescape, "\\$&");
						// context 没有 id 属性，加个属性 "sizzle-1499319258080"
					} else {
						context.setAttribute("id", nid);
					}
					// 注意末尾有一个空格
					nid = "[id='" + nid + "'] ";

					i = groups.length;
					while (i--) {
						// 新生成每一组选择器字符串。每个选择器字符串以 "[id='contextId'] " 这种形式开头
						groups[i] = nid + toSelector(groups[i]);
					}
					/*
					rsibling = new RegExp( whitespace + "*[+~]" ) 用于判定选择器是否存在兄弟关系符
	
					① 若包含 + ~ 符号，则取 context 的父节点作为上下文
					② 否则，context 不变
					*/
					newContext = rsibling.test(selector) && context.parentNode || context;
					newSelector = groups.join(",");
				}

				if (newSelector) {
					/*
					这里之所以需要用 try...catch，是因为 jquery 所支持的某些选择器是 querySelectorAll 所不支持的，
					当使用这些选择器时，querySelectorAll 会报非法选择器，故需要 jquery 自身去实现。
					*/
					try {
						push.apply(results,
							newContext.querySelectorAll(newSelector)
						);
						return results;
					} catch (qsaError) {
					} finally {
						/*
						本来没有 id 的元素加上了 id，这里要删掉
	
						old = expando 怎么会为 false 呢，是因为这一句给 old 重新赋值了
						if ( (old = context.getAttribute("id")) ) {}
						*/
						if (!old) {
							context.removeAttribute("id");
						}
					}
				}
			}
		}

		// All others
		/*
		 若 seed 存在或不支持 querySelectorAll 等方法的时候，用 select 方法来获取结果
		
		 rtrim /^[\x20\t\r\n\f]+|((?:^|[^\\])(?:\\.)*)[\x20\t\r\n\f]+$/g
		 selector.replace( rtrim, "$1" ) 作用是去掉 selector 两边的空白
		*/
		return select(selector.replace(rtrim, "$1"), context, results, seed);
	}
	/*
	简化一下 Sizzle、select 等两个函数来看一看【seed 存在与否】对代码执行流程的影响：
	function Sizzle( selector, context, results, seed ) {
		if ( documentIsHTML && !seed ) {
			if ( (match = rquickExpr.exec( selector )) ) {
				// getElementById、getElementsByTagName、getElementsByClassName 等方式 return results
			}
			if ( support.qsa && (!rbuggyQSA || !rbuggyQSA.test( selector )) ) {
				// querySelectorAll 方式 return results
			}
		}
		return select( selector.replace( rtrim, "$1" ), context, results, seed );
	}
	
	function select( selector, context, results, seed ) {
		match = tokenize( selector );
		if ( !seed ) {
			if ( match.length === 1 ) {
				// seed = find();
			}
		}
		compile( selector, match )(
			seed,
			context,
			!documentIsHTML,
			results,
			rsibling.test( selector )
		);
		return results;
	}
	
	可以看到：
	① seed 为 undefined/null/false 时，Sizzle 函数首先会尝试以原生 api 返回 result，
		 若当前浏览器不支持 getElementsByClassName、querySelectorAll 等方法，就调用 select 函数，
		 select 函数会先给 seed 赋值（如果 match.length 不为 1，也就是 selector 存在逗号，有多个分组时，不会给 seed 赋值），
		 最后调用 compile()() 函数；
	② seed 有值时，Sizzle 函数会直接调用 select 函数，然后调用 compile()() 函数。
	*/

	/**
	 * Create key-value caches of limited size
	 * @returns {Function(string, Object)} Returns the Object data after storing it on itself with
	 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
	 *	deleting the oldest entry
	 */
	/*
	返回值为一个函数（对象），可以向这个对象存储键值对，例如：
	var myCache = createCache();
	var cache = myCache('a','b');
	
	// cache 就是存进去的 value 值
	console.log(cache)
	-> 'b'
	
	// key 值后需要跟空格才能取出 value 值
	console.log(myCache['a '])
	-> 'b'
	
	// key 值后不跟空格是取不出 value 值的
	console.log(myCache['a'])
	-> undefined
	
	总之，cache 是当前缓存操作的 value 值，myCache 是缓存键值对的函数（对象）。
	*/
	function createCache() {
		var keys = [];

		function cache(key, value) {
			// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
			/*
			① key 作为属性名，这里在它末尾加一个空格，比较另类。
				 这是因为 cache 是一个数组（对象），本身具有一些属性和方法，为了不和它本身的属性方法名冲突，所以只好用另类的属性名以示区分。
			② push 函数的作用是向数组末尾添加元素，然后返回数组新的长度。Expr.cacheLength 是个常量，50。
			③ keys 数组在这里只是起到判断数据长度的作用，事件数据是存在 cache 函数（对象）上的。
				 当长度大于 50 时，删除最早加入的缓存数据。
			*/
			if (keys.push(key += " ") > Expr.cacheLength) {
				// Only keep the most recent entries
				// shift：删除并返回数组的第一个元素
				delete cache[keys.shift()];
			}
			/*
			① 在 cache 这个函数（对象）下，存储键值对 key-value，注意这里的 key 是加了空格的
			② value 作为函数返回值
			*/
			return (cache[key] = value);
		}
		return cache;
	}

	/**
	 * Mark a function for special use by Sizzle
	 * @param {Function} fn The function to mark
	 */
	// 给函数添加一个属性，起到标记函数的作用
	function markFunction(fn) {
		// expando = "sizzle" + -(new Date())
		// "sizzle-1499323096360"
		fn[expando] = true;
		return fn;
	}

	/**
	 * Support testing using an element
	 * @param {Function} fn Passed the created div and expects a boolean result
	 */
	// 以布尔值的形式返回 fn(div)
	function assert(fn) {
		var div = document.createElement("div");
		// 注意：try/catch/finally 语句执行完毕才会执行函数的 return 语句
		try {
			// 执行结果转成布尔值
			return !!fn(div);
		} catch (e) {
			return false;
			// 执行完毕，清理辅助元素
		} finally {
			// Remove from its parent by default
			if (div.parentNode) {
				div.parentNode.removeChild(div);
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
	/*
 举个例子就知道这个函数的用法了：
 addHandle( "type|href|height|width", fn);
 
 给指定的几个属性加上同一个 handler 方法
	*/
	function addHandle(attrs, handler) {
		var arr = attrs.split("|"),
			i = attrs.length;

		while (i--) {
			// 把一组属性指向同一个函数
			Expr.attrHandle[arr[i]] = handler;
		}
	}

	/**
	 * Checks document order of two siblings
	 * @param {Element} a
	 * @param {Element} b
	 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
	 */
	// 检查两个兄弟节点在文档中的顺序。如果返回值小于 0 ，表明 a 在 b 前；如果返回值大于 0，表明 a 在 b 后。
	function siblingCheck(a, b) {
		var cur = b && a,
			/*
			① MAX_NEGATIVE 为最小的负数 -2147483648 （1 << 31）
	
			② ~ 是 “否运算”，即将每个二进制位都变为相反值（0 变为 1，1 变为 0）。
			有个规律：一个数与自身的取反值相加，等于-1
	
			假如 a.sourceIndex = 3; b.sourceIndex = 4
			~b.sourceIndex -> ~4 -> -5
			~a.sourceIndex -> ~3 -> -4
	
			-5 - -4 -> -1
			结果小于 0 ，认为 a 在 b 前
	
			绕这么大个圈子，为什么不直接 a.sourceIndex - b.sourceIndex 呢？
			*/
			diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
				(~b.sourceIndex || MAX_NEGATIVE) -
				(~a.sourceIndex || MAX_NEGATIVE);

		// Use IE sourceIndex if available on both nodes
		// ie 通过 sourceIndex 来判断
		if (diff) {
			return diff;
		}

		// Check if b follows a
		// 如果在 a 的后续兄弟节点中找到了 b，那就返回 -1，表示 a 在 b 前面
		if (cur) {
			while ((cur = cur.nextSibling)) {
				if (cur === b) {
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
	// 创建一个柯里函数，判断元素 elem 是否同时满足俩条件：① 标签名是 input ；② 类型是指定的 type
	function createInputPseudo(type) {
		return function (elem) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === type;
		};
	}

	/**
	 * Returns a function to use in pseudos for buttons
	 * @param {String} type
	 */
	// 创建一个柯里函数，判断元素 elem 是否同时满足俩条件：① 标签名是 input 或 button；② 类型是指定的 type
	function createButtonPseudo(type) {
		return function (elem) {
			var name = elem.nodeName.toLowerCase();
			return (name === "input" || name === "button") && elem.type === type;
		};
	}

	/**
	 * Returns a function to use in pseudos for positionals
	 * @param {Function} fn
	 */
	// 位置伪类。这里的 fn 可以为：Expr.pseudos["first"|"last"|"eq"|"even"|"odd"|"lt"|"gt"|]
	function createPositionalPseudo(fn) {
		// markFunction(func) 给 func 函数添加一个 expando 属性，起到标记该函数的作用
		return markFunction(function (argument) {
			// 将 argument 转为数值
			argument = +argument;
			return markFunction(function (seed, matches) {
				var j,
					/*
					例：
					Expr.pseudos.eq: createPositionalPseudo(function( matchIndexes, length, argument ) {
						return [ argument < 0 ? argument + length : argument ];
					})
	
					fn([], seed.length, argument) 会返回数组 [argument < 0 ? argument + seed.length : argument]
	
					matchIndexes 表示根据伪类函数选择出的一组索引值
					*/
					matchIndexes = fn([], seed.length, argument),
					i = matchIndexes.length;

				// Match elements found at the specified indexes
				while (i--) {
					/*
					① j = matchIndexes[i]
					② 如果 seed[j] 存在
						 a. matches[j] = seed[j]
						 b. seed[j] = !seed[j]
					*/
					if (seed[(j = matchIndexes[i])]) {
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
	isXML = Sizzle.isXML = function (elem) {
		// documentElement is verified for cases where it doesn't yet exist
		// (such as loading iframes in IE - #4833)
		/*
		elem 可以是元素或 document
		① elem 是普通元素，eg : elem = div1
		div1.ownerDocument -> document
	
		② elem 是 document
		document.ownerDocument -> null （竟然不是 undefined）
	
		关于 document.documentElement.nodeName 的值
		① xml 文档下，以 http://www.w3school.com.cn/example/xmle/cd_catalog.xml 为例：
		在 chrome 下打印结果是 "html"，"html" !== "HTML"；
		在 ie9 下打印结果是 "CATALOG"
		在 ie7,ie8 下打印结果是 "HTML"
	
		总之，在 ie8 以上浏览器中，打印结果都不是 "HTML"
	
		② html 文档下：
		document.documentElement.nodeName 是 "HTML"，"HTML" === "HTML"
		*/
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
	/*
	作用：设置当前 document 相关的值
	参数：普通元素或当前 document
	返回值：当前 document
	*/
	setDocument = Sizzle.setDocument = function (node) {
		// preferredDoc = window.document，这里的 doc 就是指向当前文档对象
		var doc = node ? node.ownerDocument || node : preferredDoc,
			// document.defaultView === window
			parent = doc.defaultView;

		// If no document and documentElement is available, return
		if (doc === document || doc.nodeType !== 9 || !doc.documentElement) {
			return document;
		}

		// Set our document
		document = doc;
		docElem = doc.documentElement;

		// Support tests
		// 不是 xml 就认为是 html
		documentIsHTML = !isXML(doc);

		// Support: IE>8
		// If iframe document is assigned to "document" variable and if iframe has been reloaded,
		// IE will throw "permission denied" error when accessing "document" variable, see jQuery #13936
		// IE6-8 do not support the defaultView property so parent will be undefined
		// 被嵌套的子页面在卸载之前，执行 setDocument 方法
		if (parent && parent.attachEvent && parent !== parent.top) {
			parent.attachEvent("onbeforeunload", function () {
				setDocument();
			});
		}

		/* Attributes
		---------------------------------------------------------------------- */

		// Support: IE<8
		// Verify that getAttribute really returns attributes and not properties (excepting IE8 booleans)
		/*
		检测：是否 getAttribute 方法返回的只是 attributes，而不是 properties
		举例：
		在 chrome 下，设置 div.className = "i"，div.getAttribute("className") 返回是 null，!div.getAttribute("className") -> true，符合预期。
		也就是说，getAttribute 方法只能获取写在标签里的 attributes，而不能获取通过 . 运算符设置的 properties
		*/
		support.attributes = assert(function (div) {
			div.className = "i";
			return !div.getAttribute("className");
		});

		/* getElement(s)By*
		---------------------------------------------------------------------- */

		// Check if getElementsByTagName("*") returns only elements
		/*
		检测：是否 getElementsByTagName(*) 返回的只是元素（有的浏览器除了返回元素，还返回注释）
		这里给 div 添加了一个注释节点，如果最后 div.getElementsByTagName("*").length 还是 0，就是符合预期的
		*/
		support.getElementsByTagName = assert(function (div) {
			div.appendChild(doc.createComment(""));
			return !div.getElementsByTagName("*").length;
		});

		// Check if getElementsByClassName can be trusted
		// 检测 getElementsByClassName 方法是否可用
		support.getElementsByClassName = assert(function (div) {
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
		// 低版本 ie 浏览器下，可以通过 document.getElementsByName(v) 方法获取 id 为 v 的元素。
		support.getById = assert(function (div) {
			docElem.appendChild(div).id = expando;
			return !doc.getElementsByName || !doc.getElementsByName(expando).length;
		});

		// ID find and filter
		if (support.getById) {
			// 在上下文 context 中找 id 值为 id 的元素，返回值为数组
			Expr.find["ID"] = function (id, context) {
				// 其中 strundefined = typeof undefined
				if (typeof context.getElementById !== strundefined && documentIsHTML) {
					var m = context.getElementById(id);
					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document #6963
					return m && m.parentNode ? [m] : [];
				}
			};
			// eg : Expr.filter["ID"]('id1')(elem) 当元素 elem 的 id 值为 id1 返回 true，否则返回 false
			Expr.filter["ID"] = function (id) {
				// 修正 id 属性值（将 Unicode 码点转成相应字符）
				var attrId = id.replace(runescape, funescape);
				return function (elem) {
					return elem.getAttribute("id") === attrId;
				};
			};
		} else {
			// Support: IE6/7
			// getElementById is not reliable as a find shortcut
			delete Expr.find["ID"];

			Expr.filter["ID"] = function (id) {
				var attrId = id.replace(runescape, funescape);
				return function (elem) {
					var node = typeof elem.getAttributeNode !== strundefined && elem.getAttributeNode("id");
					return node && node.value === attrId;
				};
			};
		}

		// Tag
		// support.getElementsByTagName 用来检测 getElementsByTagName(*) 是否只返回元素节点，有的浏览器除了返回与元素，还返回注释
		Expr.find["TAG"] = support.getElementsByTagName ?
			// getElementsByTagName(*) 只返回元素节点，不包括注释，这是理想情况
			function (tag, context) {
				if (typeof context.getElementsByTagName !== strundefined) {
					return context.getElementsByTagName(tag);
				}
			} :
			// getElementsByTagName(*) 除了返回元素节点，还包括注释，所以需要对 tag === "*" 做特殊处理
			function (tag, context) {
				var elem,
					tmp = [],
					i = 0,
					results = context.getElementsByTagName(tag);

				// Filter out possible comments
				if (tag === "*") {
					while ((elem = results[i++])) {
						if (elem.nodeType === 1) {
							tmp.push(elem);
						}
					}

					return tmp;
				}
				return results;
			};

		// Class
		// 通过 class 名获取元素
		Expr.find["CLASS"] = support.getElementsByClassName && function (className, context) {
			if (typeof context.getElementsByClassName !== strundefined && documentIsHTML) {
				return context.getElementsByClassName(className);
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

		/*
		rnative = /^[^{]+\{\s*\[native \w/ 可以用来判断原生方法
	
		例如，chrome 下：
		document.querySelectorAll
		-> 'function querySelectorAll() { [native code] }'
	
		rnative.test('function querySelectorAll() { [native code] }')
		-> true
	
		也就是说，chrome 有原生的 document.querySelectorAll 方法
		*/
		if ((support.qsa = rnative.test(doc.querySelectorAll))) {
			// Build QSA regex
			// Regex strategy adopted from Diego Perini
			// 做以下测试，往数组 rbuggyQSA 中插入字符串，以便后来根据这些字符串生成正则表达式
			assert(function (div) {
				// Select is set to empty string on purpose
				// This is to test IE's treatment of not explicitly
				// setting a boolean content attribute,
				// since its presence should be enough
				// http://bugs.jquery.com/ticket/12359
				div.innerHTML = "<select><option selected=''></option></select>";

				/*
				booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped";
	
				new RegExp("\\[" + whitespace + "*(?:value|" + booleans + ")")
				-> /\[[\x20\t\r\n\f]*(?:value|checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped)/
	
				[ 后跟若干空白字符，然后再跟 value/checked/selected/async... 等其中一个
	
				在这里，chrome 等大多数浏览器 div.querySelectorAll("[selected]") 为 1，也就是说可以找到 <option selected=''></option> 节点的
				而低版本 ie8 浏览器找不到
				*/
				// Support: IE8
				// Boolean attributes and "value" are not treated correctly
				if (!div.querySelectorAll("[selected]").length) {
					rbuggyQSA.push("\\[" + whitespace + "*(?:value|" + booleans + ")");
				}

				// Webkit/Opera - :checked should return selected option elements
				// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
				// IE8 throws error here and will not see later tests
				/*
				ie 8 虽然支持 querySelectorAll 方法，但是 div.querySelectorAll(":checked") 会报错。
	
				那么问题来了，这里报错影响了后面代码执行怎么办？
	
				值得注意的是，当前匿名方法是由 assert 方法执行的。而 assert 方法是用 try/catch/finally 结果写的。
				所以，即便出错了也不会影响后续代码的执行。
				*/
				if (!div.querySelectorAll(":checked").length) {
					rbuggyQSA.push(":checked");
				}
			});

			assert(function (div) {

				// Support: Opera 10-12/IE8
				// ^= $= *= and empty values
				// Should not select anything
				// Support: Windows 8 Native Apps
				// The type attribute is restricted during .innerHTML assignment
				var input = doc.createElement("input");
				input.setAttribute("type", "hidden");
				div.appendChild(input).setAttribute("t", "");

				/*
				new RegExp("[*^$]=" + whitespace + "*(?:''|\"\")")
				-> /[*^$]=[\x20\t\r\n\f]*(?:''|"")/
	
				匹配 *= "" 或 ^= '' 或 $= "" 这类情况
	
				理想情况下，t 属性值为空字符串，不应该被 [t*= ""]、[t^= ""]、[t$= ""] 匹配出来
				*/
				if (div.querySelectorAll("[t^='']").length) {
					rbuggyQSA.push("[*^$]=" + whitespace + "*(?:''|\"\")");
				}

				// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
				// IE8 throws error here and will not see later tests
				// ie 8 下执行 div.querySelectorAll(":checked") 会报错
				if (!div.querySelectorAll(":enabled").length) {
					rbuggyQSA.push(":enabled", ":disabled");
				}

				// Opera 10-11 does not throw on post-comma invalid pseudos
				div.querySelectorAll("*,:x");
				rbuggyQSA.push(",.*:");
			});
		}

		/*
		如果元素将被指定的选择器字符串选择，Element.matches()方法返回 true; 否则返回 false。
		一些浏览器使用了非标准名称来实现它，采用 前缀+ matchesSelector() 的方式
	
		例如这里的 webkitMatchesSelector、mozMatchesSelector、oMatchesSelector、msMatchesSelector
	
		用法：
		var result = element.matches(selectorString);
		返回值 result 的值为 true 或 false
		参数 selectorString 是个 css 选择器字符串
	
		eg:
		<div id="foo">This is the element!</div>
	
		var el = document.getElementById("foo");
		if (el.webkitMatchesSelector("div")) {
			console.log("当前元素是 div");
		}
	
		打印结果为：当前元素是 div
		*/
		if ((support.matchesSelector = rnative.test((matches = docElem.webkitMatchesSelector ||
			docElem.mozMatchesSelector ||
			docElem.oMatchesSelector ||
			docElem.msMatchesSelector)))) {

			assert(function (div) {
				// Check to see if it's possible to do matchesSelector
				// on a disconnected node (IE 9)
				/*
				相当于：support.disconnectedMatch = div.matches('div')
	
				div 是个没有插入到文档的节点，这里就是检测这种没插入到文档的节点是不是可以用 matches 方法
				*/
				support.disconnectedMatch = matches.call(div, "div");

				// This should fail with an exception
				// Gecko does not error, returns false instead
				matches.call(div, "[s!='']:x");
				/*
				向数组 rbuggyMatches 插入 "!=" 和 pseudos 等 2 个元素。其中：
				pseudos = ":(" + characterEncoding + ")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|" + attributes.replace( 3, 8 ) + ")*)|.*)\\)|)"
				*/
				rbuggyMatches.push("!=", pseudos);
			});
		}

		// 把之前由字符串组成的数组转成一个正则表达式
		rbuggyQSA = rbuggyQSA.length && new RegExp(rbuggyQSA.join("|"));
		rbuggyMatches = rbuggyMatches.length && new RegExp(rbuggyMatches.join("|"));

		/* Contains
		---------------------------------------------------------------------- */

		/*
		compareDocumentPosition() 方法比较两个节点，并返回描述它们在文档中位置的整数。
	
		返回值可能是：
		1：没有关系，两个节点不属于同一个文档。
		2：第一节点（P1）位于第二个节点后（P2）。
		4：第一节点（P1）位于第二节点（P2）前。
		8：第一节点（P1）位于第二节点内（P2）。
		16：第二节点（P2）位于第一节点内（P1）。
		32：没有关系，或是两个节点是同一元素的两个属性。
		注释：返回值可以是值的组合。例如，返回 20 意味着在 p2 在 p1 内部（16），并且 p1 在 p2 之前（4）。
	
		eg:
		var p1=document.getElementById("p1");
		var p2=document.getElementById("p2");
		p1.compareDocumentPosition(p2);
		// 结果为 4
		*/

		// Element contains another
		// Purposefully does not implement inclusive descendent
		// As in, an element does not contain itself
		contains = rnative.test(docElem.contains) || docElem.compareDocumentPosition ?
			// 原生支持 contains 或 compareDocumentPosition 方法
			function (a, b) {
				// 如果 a 是 document，那就降级为 html 节点
				var adown = a.nodeType === 9 ? a.documentElement : a,
					bup = b && b.parentNode;
				/*
				① 如果 a 和 b 的父节点全等，那 b 当然属于 a 的内部元素
				② 如果 a 不是 b 的父节点，a 是 b 的祖先节点，当然也算 b 属于 a 的内部元素
	
				这里要这么绕一下，是因为原生的 contains 方法包含自己（a.contains(a) -> true），
				而这里封装的方法认为节点不能自己包含自己（contains(a,a) -> false）
	
				另外，注意一下 & 运算符:
				compareDocumentPosition 方法返回 16 表示第二节点（b）位于第一节点内（a）
				16 & 16 -> 16
				20 & 16 -> 16
	
				其他情况，表示节点 b 不在节点 a 内
				1 & 16-> 0
				2 & 16-> 0
				4 & 16-> 0
				8 & 16-> 0
				32 & 16 -> 0
				*/
				return a === bup || !!(bup && bup.nodeType === 1 && (
					adown.contains ?
						adown.contains(bup) :
						a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16
				));
			} :
			// 既不支持 contains 方法，也不支持 compareDocumentPosition 方法
			function (a, b) {
				if (b) {
					// 这里也可以看到，从 b 的父元素开始与 a 比较。也就是说，如果 a === b，contains(a,a) -> false
					while ((b = b.parentNode)) {
						if (b === a) {
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
			/*
			返回元素 a 和 b 的位置关系。作用类似于原生的 compareDocumentPosition 方法。
			① a === b，返回 0；
			② a 在 b 之前，返回 -1；
			③ a 在 b 之后，返回 1
			*/
			function (a, b) {
				// Flag for duplicate removal
				// 同一个节点返回 0
				if (a === b) {
					hasDuplicate = true;
					return 0;
				}

				// 用 compareDocumentPosition 方法获取结果
				var compare = b.compareDocumentPosition && a.compareDocumentPosition && a.compareDocumentPosition(b);

				if (compare) {
					// Disconnected nodes
					// a 和 b 没有关系，不在同一文档中
					if (compare & 1 ||
						(!support.sortDetached && b.compareDocumentPosition(a) === compare)) {

						// Choose the first element that is related to our preferred document
						// a 在文档中，b 不在文档中，返回 -1
						if (a === doc || contains(preferredDoc, a)) {
							return -1;
						}
						// b 在文档中，a 不在文档中，返回 1
						if (b === doc || contains(preferredDoc, b)) {
							return 1;
						}

						// Maintain original order
						/*
						① sortInput 为 undefined，返回 0；
						② sortInput 为一个数组（sortInput = !support.sortStable && results.slice( 0 )），那就返回 a、b 的索引值之差
						*/
						return sortInput ?
							(indexOf.call(sortInput, a) - indexOf.call(sortInput, b)) :
							0;
					}
					/*
					① compare 为 4 表示，第一节点（a）位于第二节点（b）前，返回 -1；
					② a 和 b 不相等，a 也不在 b 之前，那只能认为 a 在 b 之后了，返回 1。
					*/
					return compare & 4 ? -1 : 1;
				}

				// Not directly comparable, sort on existence of method
				/*
				① a.compareDocumentPosition 若是存在，那就说明 b.compareDocumentPosition 不存在，那就认为 a 在 b 前，返回 -1
				② a 和 b 不相等，a 也不在 b 之前，那只能认为 a 在 b 之后了，返回 1。
				*/
				return a.compareDocumentPosition ? -1 : 1;
			} :
			function (a, b) {
				var cur,
					i = 0,
					aup = a.parentNode,
					bup = b.parentNode,
					ap = [a],
					bp = [b];

				// Exit early if the nodes are identical
				// 同一个节点返回 0
				if (a === b) {
					hasDuplicate = true;
					return 0;

					// Parentless nodes are either documents or disconnected
					// 如果某个节点没有父元素，那么这个节点要么是 document，要么还没有插入文档中
				} else if (!aup || !bup) {
					/*
					① a 是 document，认为 a 在 b 前面，返回 -1；
					② b 是 document，说明 a 不是 document，认为 a 在 b 后面，返回 1；
					③ aup 存在，说明 bup 不存在，那就认为 a 在 b 前面，返回 -1
					④ bup 存在，说明 aup 不存在，那就认为 a 在 b 后面，返回 1
					⑤ 最后，根据 a、b 在数组 sortInput （也可能是 undefined）中的索引值来计算
					*/
					return a === doc ? -1 :
						b === doc ? 1 :
							aup ? -1 :
								bup ? 1 :
									sortInput ?
										(indexOf.call(sortInput, a) - indexOf.call(sortInput, b)) :
										0;

					// If the nodes are siblings, we can do a quick check
					// 父节点相同，说明是兄弟关系
				} else if (aup === bup) {
					return siblingCheck(a, b);
				}

				// Otherwise we need full lists of their ancestors for comparison
				cur = a;
				// 将 a 的祖先节点都加入到数组 ap 中，越是顶层节点，越是排在数组前面，所以 ap =[document, html, body, ...]
				while ((cur = cur.parentNode)) {
					ap.unshift(cur);
				}
				cur = b;
				// 将 b 的祖先节点都加入到数组 bp 中，越是顶层节点，越是排在数组前面，所以 bp =[document, html, body, ...]
				while ((cur = cur.parentNode)) {
					bp.unshift(cur);
				}

				/*
				document.documentElement.parentNode -> document
				document.parentNode -> null
				可以推断，数组 ap 和 数组 bp 第一个元素都是 document，第二个元素都是 html 元素...
				*/

				// Walk down the tree looking for a discrepancy
				// 相当于从 document 节点向下找子节点，如果遍历到某个层，ap[i] !== bp[i]，那就说明当前 ap[i] 和 bp[i] 是兄弟节点，因为他们上一次还是相同的
				while (ap[i] === bp[i]) {
					i++;
				}

				return i ?
					// Do a sibling check if the nodes have a common ancestor
					/*
					① i 的初始值为 0，如果 i 不为 0，说明最起码 document 是 a、b 的共同祖先节点
		
					② 假如 i 为 5，既然 i 停在 5 这里，没有继续增加，说明 ap[5] !== bp[5]，同时也意味着 ap[4] === bp[4]，
					那么 ap[5] 和 bp[5] 妥妥的是兄弟关系。
		
					③ ap[5] 和 bp[5] 的位置关系反映了 a、b 之间的位置关系
					*/
					siblingCheck(ap[i], bp[i]) :

					/*
					i 为 0 ，说明 a[0] 或者 b[0] 肯定至少有一个不存在于文档当中
					① ap[0] === preferredDoc，说明 b 不在文档当中，那就认为 a 在 b 之前，返回 -1；
					② bp[0] === preferredDoc，说明 a 不在文档当中，那就认为 a 在 b 之后，返回 1；
					③ a、b 都不存在于文档中，那就认为 a、b 位序相同，返回 0
					*/
					// Otherwise nodes in our document sort first
					ap[i] === preferredDoc ? -1 :
						bp[i] === preferredDoc ? 1 :
							0;
			};

		// 最后返回当前文档
		return doc;
	};

	// 在一批节点（种子节点） elements 中挑选符合选择器 expr 的节点
	Sizzle.matches = function (expr, elements) {
		return Sizzle(expr, null, null, elements);
	};

	// 判断一个节点 elem 是否符合选择器 expr
	Sizzle.matchesSelector = function (elem, expr) {
		// Set document vars if needed
		if ((elem.ownerDocument || elem) !== document) {
			setDocument(elem);
		}

		// Make sure that attribute selectors are quoted
		/*
		rattributeQuotes = /=[\x20\t\r\n\f]*([^\]'"]*)[\x20\t\r\n\f]*\]/g
	
		这个正则表示：= 后跟的若干字符不是 ] ' " 这 3 中字符其中一种，然后是 ]
	
		以下这句的作用是将属性选择器中的属性值用引号包起来，eg :
		"[a = b]".replace( rattributeQuotes, "='$1']" )
		-> "[a ='b']"
		*/
		expr = expr.replace(rattributeQuotes, "='$1']");

		// 首选 matches 方法来判断 elem 是否符合选择器 expr
		if (support.matchesSelector && documentIsHTML &&
			(!rbuggyMatches || !rbuggyMatches.test(expr)) &&
			(!rbuggyQSA || !rbuggyQSA.test(expr))) {

			try {
				// 如果不报错的情况下，ret 为 true 或 false
				var ret = matches.call(elem, expr);

				// IE 9's matchesSelector returns false on disconnected nodes
				if (ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11) {
					return ret;
				}
			} catch (e) { }
		}

		// 退而求其次用 Sizzle 方法来判断 elem 是否符合选择器 expr
		return Sizzle(expr, document, null, [elem]).length > 0;
	};

	// Sizzle.contains 实际就是调用上面定义的 contains 方法
	Sizzle.contains = function (context, elem) {
		// Set document vars if needed
		if ((context.ownerDocument || context) !== document) {
			setDocument(context);
		}
		return contains(context, elem);
	};

	// 获取元素 elem 属性名 name 对应的属性值
	Sizzle.attr = function (elem, name) {
		// Set document vars if needed
		if ((elem.ownerDocument || elem) !== document) {
			setDocument(elem);
		}

		/*
		addHandle 方法中有：Expr.attrHandle[ arr[i] ] = handler;
		例如：addHandle( "type|href|height|width", fn);
		*/
		var fn = Expr.attrHandle[name.toLowerCase()],
			// Don't get fooled by Object.prototype properties (jQuery #13807)
			// name.toLowerCase() 是 Expr.attrHandle 的自身属性，而不能是从原型链继承的属性
			val = fn && hasOwn.call(Expr.attrHandle, name.toLowerCase()) ?
				fn(elem, name, !documentIsHTML) :
				undefined;

		/*
		support.attributes 为 true 表示 getAttribute 方法返回的只是 attributes，而不是 properties
	
		① val 不为 undefined，返回 val；
		② 如果 val 为 undefined，对于 support.attributes 为真 或 xml 文档，返回 elem.getAttribute( name )
		③ 如果 val 为 undefined，并且 support.attributes 为假，那就返回 elem.getAttributeNode(name).value
		④ 以上都不满足，返回 null
		*/
		return val === undefined ?
			support.attributes || !documentIsHTML ?
				elem.getAttribute(name) :
				(val = elem.getAttributeNode(name)) && val.specified ?
					val.value :
					null :
			val;
	};

	// 抛出错误
	Sizzle.error = function (msg) {
		throw new Error("Syntax error, unrecognized expression: " + msg);
	};

	/**
	 * Document sorting and removing duplicates
	 * @param {ArrayLike} results
	 */
	// 先排序，再去重
	Sizzle.uniqueSort = function (results) {
		var elem,
			duplicates = [],
			j = 0,
			i = 0;

		// Unless we *know* we can detect duplicates, assume their presence
		hasDuplicate = !support.detectDuplicates;
		sortInput = !support.sortStable && results.slice(0);
		/*
		sortOrder 方法返回元素 a 和 b 的位置关系。作用类似于原生的 compareDocumentPosition 方法。
		① a === b，返回 0；
		② a 在 b 之前，返回 -1；
		③ a 在 b 之后，返回 1
		
		这里对 results 数组排序，会改变 results 数组
		 */
		results.sort(sortOrder);

		// 如果有重复
		if (hasDuplicate) {
			while ((elem = results[i++])) {
				if (elem === results[i]) {
					// 将重复元素的索引保存起来，另外 push() 方法可向数组的末尾添加一个或多个元素，并返回新的长度
					j = duplicates.push(i);
				}
			}
			while (j--) {
				// 遍历数组 duplicates，依次删除 results 中重复元素
				results.splice(duplicates[j], 1);
			}
		}

		return results;
	};

	/**
	 * Utility function for retrieving the text value of an array of DOM nodes
	 * @param {Array|Element} elem
	 */
	// 获取一个或一组节点的文本
	getText = Sizzle.getText = function (elem) {
		var node,
			ret = "",
			i = 0,
			nodeType = elem.nodeType;

		// elem 是数组，递归调用
		if (!nodeType) {
			// If no nodeType, this is expected to be an array
			for (; (node = elem[i]); i++) {
				// Do not traverse comment nodes
				ret += getText(node);
			}
			// 1 - Element, 9 - Document, 11 - DocumentFragment,
		} else if (nodeType === 1 || nodeType === 9 || nodeType === 11) {
			// Use textContent for elements
			// innerText usage removed for consistency of new lines (see #11153)
			if (typeof elem.textContent === "string") {
				return elem.textContent;
			} else {
				// Traverse its children
				// 递归调用
				for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
					ret += getText(elem);
				}
			}
			// 3 - Text, 4 - CDATASection
		} else if (nodeType === 3 || nodeType === 4) {
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
		//针对浏览器兼容性问题，添加特殊的获取属性方法，如 value、disabled 等
		attrHandle: {},

		find: {},

		// 4 种关系，其中 first 表示紧密程序，“父子关系” 和 “相邻兄弟关系” 是紧密的
		relative: {
			">": { dir: "parentNode", first: true },
			" ": { dir: "parentNode" },
			"+": { dir: "previousSibling", first: true },
			"~": { dir: "previousSibling" }
		},

		preFilter: {
			/*
			举几个例子：
			"[a ^= b]" -> match = ["[a ^= b]", "a", "^=", undefined, undefined, "b", index: 0, input: "[a ^= b]"]
			"[a=b]"-> match = ["[a=b]", "a", "=", undefined, undefined, "b", index: 0, input: "[a=b]"]
			"[a $= 'b']" -> match = ["[a $= 'b']", "a", "$=", "'", "b", undefined, index: 0, input: "[a $= 'b']"]
			*/
			"ATTR": function (match) {
				// 修正属性名（将 Unicode 码点转成相应字符）
				match[1] = match[1].replace(runescape, funescape);

				// Move the given value to match[3] whether quoted or unquoted
				// 修正属性值（将属性值移到 match[3] 位置，并将 Unicode 码点转成相应字符）
				match[3] = (match[4] || match[5] || "").replace(runescape, funescape);

				/*
				a[title~=flower]
				作用：选择 title 属性包含单词 "flower" 的所有元素
	
				~= 要求属性值是以空格分隔的列表。所以这里需给 match[3] 前后补上空格
				*/
				if (match[2] === "~=") {
					match[3] = " " + match[3] + " ";
				}
				// 返回数组前 4 个元素（因为这些就够用了）
				return match.slice(0, 4);
			},
			/*
			例如：
			matchExpr.CHILD.exec(':first-child')
			-> match = [":first-child", "first", "child", undefined, undefined, undefined, undefined, undefined, undefined, index: 0, input: ":first-child"]
	
			matchExpr.CHILD.exec(":nth-child(even)")
			-> [":nth-child(even)", "nth", "child", "even", undefined, undefined, undefined, undefined, undefined, index: 0, input: ":nth-child(even)"]
	
			matchExpr.CHILD.exec(":nth-child(-2n+3)")
			-> match = [":nth-child(-2n+3)", "nth", "child", "-2n+3", "-2n", "-", "2", "+", "3", index: 0, input: ":nth-child(-2n+3)"]
	
			match[1] type 取值有： only、first、last、nth、nth-last
			match[2] what 取值有： child、of-type
			match[3] 表示参数，只能是 type 为 nth、nth-last 时才有参数
					 xn + y 或 odd/even
	
			match[4]、match[5]、match[6]、match[7]、match[8]
			也都是针对 type 为 nth、nth-last 的情况
			*/
			"CHILD": function (match) {
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
				// type 转小写字符
				match[1] = match[1].toLowerCase();

				/*
				① jQuery( ":nth-of-type(index/even/odd/equation)" )
				选择同属于一个父元素之下，并且标签名相同的子元素中的第 n 个
	
				② jQuery( ":nth-child(index/even/odd/equation)" )
				选择父元素的第 n 个子元素
	
				其中：
				index 为每个相匹配子元素的索引值，从 1 开始
				even 表示偶数索引，odd 表示奇数索引
				equation 表示一个方程式，如 4n
				*/
				if (match[1].slice(0, 3) === "nth") {
					// nth-* requires argument
					/*
					:nth-of-type() 或 :nth-child 都需要参数，如果没参数就报错！
					*/
					if (!match[3]) {
						Sizzle.error(match[0]);
					}

					// numeric x and y parameters for Expr.filter.CHILD
					// remember that false/true cast respectively to 0/1
					/*
					分两种：
					① ":nth-child(-2n+3)"
					match[4] xn + y 表达式中的 xn 部分，如 "-2n"
					match[5] xn 的符号，正或负，如 "-"
					match[6] x 的值，如 "2"
					match[7] y 的符号，正或负，如 "+"
					match[8] y 的值，如 "3"
	
					② ":nth-child(even)"
					match[3] 为 "even"，match[4]、match[5]、match[6]、match[7]、match[8] 都是 undefined
	
					对于 ①：
					match[4] = +(match[5] + (match[6] || 1))
					-> 比如 +("-" + ("2" || 1))
					-> -2
	
					match[5] = +( match[7] + match[8] )
					-> 比如 +( "+" + "3" )
					-> 3
	
					所以，match[4]、match[5] 分别对应 'xn + y' 中的 x、y 转成数值后的形式
	
					对于 ②：
					match[4] = +( 2 * ( match[3] === "even" || match[3] === "odd" ) );
					-> 比如 +( 2 * true )
					-> 2
	
					match[5] = +( match[3] === "odd" )
					-> 比如 +( false )
					-> 0
	
					参数为 'even' 相当于 '2n'，参数 'odd' 相当于 '2n + 1'
					*/
					match[4] = +(match[4] ? match[5] + (match[6] || 1) : 2 * (match[3] === "even" || match[3] === "odd"));
					match[5] = +((match[7] + match[8]) || match[3] === "odd");

					// other types prohibit arguments
					// 其他 type 如果有参数，也报错！
				} else if (match[3]) {
					Sizzle.error(match[0]);
				}

				return match;
			},
			/*
			matchExpr.PSEUDO.exec(':not([type="submit"])')
			-> [":not([type="submit"])", "not", "[type="submit"]", undefined, undefined, "[type="submit"]", "type", "=", """, "submit", undefined, index: 0, input: ":not([type="submit"])"]
			matchExpr.PSEUDO.exec(':first')
			-> [":first", "first", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, index: 0, input: ":first"]
			matchExpr.PSEUDO.exec(':not(.red)')
			-> [":not(.red)", "not", ".red", undefined, undefined, ".red", undefined, undefined, undefined, undefined, undefined, index: 0, input: ":not(.red)"]
	
			matchExpr.PSEUDO.exec(':contains("nc.com")')
			-> match = [":contains("nc.com")", "contains", ""nc.com"", """, "nc.com", undefined, undefined, undefined, undefined, undefined, undefined, index: 0, input: ":contains("nc.com")"]
			*/
			// 修正 match[0] 和 match[2]，返回返回 [match[0],match[1],match[2]]
			"PSEUDO": function (match) {
				var excess,
					unquoted = !match[5] && match[2];

				// child 是伪类的一种，上面已经分析过 child 伪类，所以这里跳过
				if (matchExpr["CHILD"].test(match[0])) {
					return null;
				}

				// Accept quoted arguments as-is
				if (match[3] && match[4] !== undefined) {
					match[2] = match[4];

					// Strip excess characters from unquoted arguments
					// 取出多余的字符
				} else if (unquoted && rpseudo.test(unquoted) &&
					// Get excess from tokenize (recursively)
					(excess = tokenize(unquoted, true)) &&
					// advance to the next closing parenthesis
					(excess = unquoted.indexOf(")", unquoted.length - excess) - unquoted.length)) {

					// excess is a negative index
					// eg : 'abcdefg'.slice(0,-2) -> "abcde"
					match[0] = match[0].slice(0, excess);
					match[2] = unquoted.slice(0, excess);
				}

				// Return only captures needed by the pseudo filter method (type and argument)
				return match.slice(0, 3);
			}
		},

		/*
		f(x) 和 g(x)合成为 f(g(x))，有一个隐藏的前提，就是 f 和 g 都只能接受一个参数。
	
		函数 curry 化（柯里化）：
		所谓“柯里化”，就是把一个多参数的函数，转成单参数函数。
	
		eg:
		// 柯里化之前
		function add(x, y) {
			return x + y;
		}
	
		add(1, 2) // 3
	
		// 柯里化之后
		function addX(y) {
			return function (x) {
			return x + y;
			};
		}
	
		addX(2)(1) // 3
	
		*/

		filter: {
			/*
			① nodeNameSelector 为 "*"，即 Expr.filter["TAG"]("*")(elem)，一直返回 true；
			② 其他情况，Expr.filter["TAG"](nodeNameSelector)(elem)，当 elem.nodeName.toLowerCase() === nodeNameSelector 才返回 true
			*/
			"TAG": function (nodeNameSelector) {
				var nodeName = nodeNameSelector.replace(runescape, funescape).toLowerCase();
				return nodeNameSelector === "*" ?
					function () { return true; } :
					function (elem) {
						return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
					};
			},
			/*
			① 如果 classCache 缓存里有 className 对应的函数，直接用这个函数
			② 否则，新建并返回一个函数 Expr.filter["CLASS"](className)(elem)，当 elem 的 class 中有 className 时，返回 true
			*/
			"CLASS": function (className) {
				/*
				classCache = createCache()
				① 存数据：classCache('a','b')
				② 取数据：classCache('a ')
				*/
				var pattern = classCache[className + " "];
				/*
				以 className 为 cls 为例：
				pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )
				-> pattern = /(^|[\x20\t\r\n\f])cls([\x20\t\r\n\f]|$)/
				*/
				return pattern ||
					(pattern = new RegExp("(^|" + whitespace + ")" + className + "(" + whitespace + "|$)")) &&
					classCache(className, function (elem) {
						return pattern.test(typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== strundefined && elem.getAttribute("class") || "");
					});
			},
			/*
			对于选择器：[type="checkbox"]
			name : "type" , operator : "=" , check : "checkbox"
	
			根据属性值片段和属性值的关系返回相应结果
			*/
			"ATTR": function (name, operator, check) {
				return function (elem) {
					// 获取 elem 元素名为 name 的属性值
					var result = Sizzle.attr(elem, name);

					if (result == null) {
						return operator === "!=";
					}
					// 没有 operator 意味着只要该 elem 元素有 name 属性就行了。既然能走到这个函数，那必然有 name 属性，所以直接返回 true 就好了。
					if (!operator) {
						return true;
					}

					// result 强制转为字符串
					result += "";

					return operator === "=" ? result === check :
						operator === "!=" ? result !== check :
							operator === "^=" ? check && result.indexOf(check) === 0 :
								operator === "*=" ? check && result.indexOf(check) > -1 :
									operator === "$=" ? check && result.slice(-check.length) === check :
										// eg：lang~=en 匹配 <html lang="zh_CN en">
										// Expr.preFilter.ATTR 方法保证 check 字符串前后必定是空格
										operator === "~=" ? (" " + result + " ").indexOf(check) > -1 :
											// eg：lang=|en 匹配 <html lang="en-US">
											operator === "|=" ? result === check || result.slice(0, check.length + 1) === check + "-" :
												false;
				};
			},

			"CHILD": function (type, what, argument, first, last) {
				var simple = type.slice(0, 3) !== "nth",
					forward = type.slice(-4) !== "last",
					ofType = what === "of-type";

				return first === 1 && last === 0 ?

					// Shortcut for :nth-*(n)
					function (elem) {
						return !!elem.parentNode;
					} :

					function (elem, context, xml) {
						var cache, outerCache, node, diff, nodeIndex, start,
							dir = simple !== forward ? "nextSibling" : "previousSibling",
							parent = elem.parentNode,
							name = ofType && elem.nodeName.toLowerCase(),
							useCache = !xml && !ofType;

						if (parent) {

							// :(first|last|only)-(child|of-type)
							if (simple) {
								while (dir) {
									node = elem;
									while ((node = node[dir])) {
										if (ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1) {
											return false;
										}
									}
									// Reverse direction for :only-* (if we haven't yet done so)
									start = dir = type === "only" && !start && "nextSibling";
								}
								return true;
							}

							start = [forward ? parent.firstChild : parent.lastChild];

							// non-xml :nth-child(...) stores cache data on `parent`
							if (forward && useCache) {
								// Seek `elem` from a previously-cached index
								outerCache = parent[expando] || (parent[expando] = {});
								cache = outerCache[type] || [];
								nodeIndex = cache[0] === dirruns && cache[1];
								diff = cache[0] === dirruns && cache[2];
								node = nodeIndex && parent.childNodes[nodeIndex];

								while ((node = ++nodeIndex && node && node[dir] ||

									// Fallback to seeking `elem` from the start
									(diff = nodeIndex = 0) || start.pop())) {

									// When found, cache indexes on `parent` and break
									if (node.nodeType === 1 && ++diff && node === elem) {
										outerCache[type] = [dirruns, nodeIndex, diff];
										break;
									}
								}

								// Use previously-cached element index if available
							} else if (useCache && (cache = (elem[expando] || (elem[expando] = {}))[type]) && cache[0] === dirruns) {
								diff = cache[1];

								// xml :nth-child(...) or :nth-last-child(...) or :nth(-last)?-of-type(...)
							} else {
								// Use the same loop as above to seek `elem` from the start
								while ((node = ++nodeIndex && node && node[dir] ||
									(diff = nodeIndex = 0) || start.pop())) {

									if ((ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1) && ++diff) {
										// Cache the index of each encountered element
										if (useCache) {
											(node[expando] || (node[expando] = {}))[type] = [dirruns, diff];
										}

										if (node === elem) {
											break;
										}
									}
								}
							}

							// Incorporate the offset, then check against cycle size
							diff -= last;
							return diff === first || (diff % first === 0 && diff / first >= 0);
						}
					};
			},

			"PSEUDO": function (pseudo, argument) {
				// pseudo-class names are case-insensitive
				// http://www.w3.org/TR/selectors/#pseudo-classes
				// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
				// Remember that setFilters inherits from pseudos
				var args,
					/*
					Expr.setFilters 就拥有了 Expr.pseudos 的属性
					如果伪类 pseudo 在 Expr.pseudos 中找不到，那就报个错。
					*/
					fn = Expr.pseudos[pseudo] || Expr.setFilters[pseudo.toLowerCase()] ||
						Sizzle.error("unsupported pseudo: " + pseudo);

				// The user may use createPseudo to indicate that
				// arguments are needed to create the filter function
				// just as Sizzle does
				if (fn[expando]) {
					return fn(argument);
				}

				// But maintain support for old signatures
				if (fn.length > 1) {
					args = [pseudo, pseudo, "", argument];
					return Expr.setFilters.hasOwnProperty(pseudo.toLowerCase()) ?
						markFunction(function (seed, matches) {
							var idx,
								matched = fn(seed, argument),
								i = matched.length;
							while (i--) {
								idx = indexOf.call(seed, matched[i]);
								seed[idx] = !(matches[idx] = matched[i]);
							}
						}) :
						function (elem) {
							return fn(elem, 0, args);
						};
				}

				return fn;
			}
		},

		pseudos: {
			// Potentially complex pseudos
			"not": markFunction(function (selector) {
				// Trim the selector passed to compile
				// to avoid treating leading and trailing
				// spaces as combinators
				var input = [],
					results = [],
					// compile 方法生成超级匹配函数
					matcher = compile(selector.replace(rtrim, "$1"));

				// 伪类
				return matcher[expando] ?
					markFunction(function (seed, matches, context, xml) {
						var elem,
							unmatched = matcher(seed, null, xml, []),
							i = seed.length;

						// Match elements unmatched by `matcher`
						while (i--) {
							if ((elem = unmatched[i])) {
								seed[i] = !(matches[i] = elem);
							}
						}
					}) :
					function (elem, context, xml) {
						input[0] = elem;
						matcher(input, null, xml, results);
						return !results.pop();
					};
			}),

			// 包含选择器 selector 对应的节点
			"has": markFunction(function (selector) {
				return function (elem) {
					return Sizzle(selector, elem).length > 0;
				};
			}),

			// 包含文本 text
			"contains": markFunction(function (text) {
				return function (elem) {
					return (elem.textContent || elem.innerText || getText(elem)).indexOf(text) > -1;
				};
			}),

			// "Whether an element is represented by a :lang() selector
			// is based solely on the element's language value
			// being equal to the identifier C,
			// or beginning with the identifier C immediately followed by "-".
			// The matching of C against the element's language value is performed case-insensitively.
			// The identifier C does not have to be a valid language name."
			// http://www.w3.org/TR/selectors/#lang-pseudo
			"lang": markFunction(function (lang) {
				// lang value must be a valid identifier
				if (!ridentifier.test(lang || "")) {
					Sizzle.error("unsupported lang: " + lang);
				}
				lang = lang.replace(runescape, funescape).toLowerCase();
				return function (elem) {
					var elemLang;
					do {
						if ((elemLang = documentIsHTML ?
							elem.lang :
							elem.getAttribute("xml:lang") || elem.getAttribute("lang"))) {

							elemLang = elemLang.toLowerCase();
							return elemLang === lang || elemLang.indexOf(lang + "-") === 0;
						}
						// 只要是元素节点，就取父元素，层层上溯，直到 document 节点
					} while ((elem = elem.parentNode) && elem.nodeType === 1);
					return false;
				};
			}),

			// Miscellaneous
			// url#id 这种形式
			"target": function (elem) {
				var hash = window.location && window.location.hash;
				return hash && hash.slice(1) === elem.id;
			},

			// 当前元素是否为 html 节点
			"root": function (elem) {
				return elem === docElem;
			},

			// 是否获取焦点
			"focus": function (elem) {
				// document.hasFocus() 方法返回一个 Boolean，表明当前文档或者当前文档内的节点是否获得了焦点。
				return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
			},

			// Boolean properties
			// 未禁用
			"enabled": function (elem) {
				return elem.disabled === false;
			},

			// 禁用
			"disabled": function (elem) {
				return elem.disabled === true;
			},

			// 选中（input 和 option 标签才可能有选中状态）
			"checked": function (elem) {
				// In CSS3, :checked should return both checked and selected elements
				// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
				var nodeName = elem.nodeName.toLowerCase();
				return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
			},

			// selected 属性是否为 true
			"selected": function (elem) {
				// Accessing this property makes selected-by-default
				// options in Safari work properly
				// 在访问 option 的 selected 属性时，先访问其父级 select 元素的 selectedIndex 属性，强迫浏览器计算 option 的 selected 属性，以得到正确的值。
				if (elem.parentNode) {
					elem.parentNode.selectedIndex;
				}

				return elem.selected === true;
			},

			// Contents
			"empty": function (elem) {
				// http://www.w3.org/TR/selectors/#empty-pseudo
				// :empty is only affected by element nodes and content nodes(including text(3), cdata(4)),
				// not comment, processing instructions, or others
				// Thanks to Diego Perini for the nodeName shortcut
				// Greater than "@" means alpha characters (specifically not starting with "#" or "?")
				for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
					/*
					① elem.nodeName > "@" 表示 elem.nodeName 是普通字母，而不是 # ? 等特殊字符
						 eg:
						 '@'.charCodeAt(0) -> 64
						 'A'.charCodeAt(0) -> 65
						 '#'.charCodeAt(0) -> 35
					② elem.nodeType === 3 代表元素或属性中的文本内容
					③ elem.nodeType === 4 代表文档中的 CDATA 部分（不会由解析器解析的文本）
					*/
					if (elem.nodeName > "@" || elem.nodeType === 3 || elem.nodeType === 4) {
						return false;
					}
				}
				// 没有子元素，或者空文本的元素
				return true;
			},

			// 当前元素是否含有子元素或文本，和上面的 empty 方法作用相反
			"parent": function (elem) {
				return !Expr.pseudos["empty"](elem);
			},

			// Element/input types
			// 是否为 h1、h2 这种标题标签
			"header": function (elem) {
				// rheader = /^h\d$/i，其中 i 表示对大小写不敏感
				return rheader.test(elem.nodeName);
			},

			// 是否为 input、select、textarea、button 等 4 种标签
			"input": function (elem) {
				// rinputs = /^(?:input|select|textarea|button)$/i
				return rinputs.test(elem.nodeName);
			},

			// 是否为按钮
			"button": function (elem) {
				var name = elem.nodeName.toLowerCase();
				return name === "input" && elem.type === "button" || name === "button";
			},

			// 文本类型的 input 标签
			"text": function (elem) {
				var attr;
				// IE6 and 7 will map elem.type to 'text' for new HTML5 types (search, etc)
				// use getAttribute instead to test this case
				return elem.nodeName.toLowerCase() === "input" &&
					elem.type === "text" &&
					((attr = elem.getAttribute("type")) == null || attr.toLowerCase() === elem.type);
			},

			// Position-in-collection
			// 索引为第一个
			"first": createPositionalPseudo(function () {
				return [0];
			}),
			// 索引为最后一个
			"last": createPositionalPseudo(function (matchIndexes, length) {
				return [length - 1];
			}),
			// 索引为 argument（兼容负数情况）
			"eq": createPositionalPseudo(function (matchIndexes, length, argument) {
				return [argument < 0 ? argument + length : argument];
			}),
			// 索引为偶数
			"even": createPositionalPseudo(function (matchIndexes, length) {
				var i = 0;
				for (; i < length; i += 2) {
					matchIndexes.push(i);
				}
				return matchIndexes;
			}),
			// 索引为奇数
			"odd": createPositionalPseudo(function (matchIndexes, length) {
				var i = 1;
				for (; i < length; i += 2) {
					matchIndexes.push(i);
				}
				return matchIndexes;
			}),
			// 小于 argument 的索引
			"lt": createPositionalPseudo(function (matchIndexes, length, argument) {
				var i = argument < 0 ? argument + length : argument;
				for (; --i >= 0;) {
					matchIndexes.push(i);
				}
				return matchIndexes;
			}),
			// 大于 argument 的索引
			"gt": createPositionalPseudo(function (matchIndexes, length, argument) {
				var i = argument < 0 ? argument + length : argument;
				for (; ++i < length;) {
					matchIndexes.push(i);
				}
				return matchIndexes;
			})
		}
	};

	Expr.pseudos["nth"] = Expr.pseudos["eq"];

	// Add button/input type pseudos
	for (i in { radio: true, checkbox: true, file: true, password: true, image: true }) {
		Expr.pseudos[i] = createInputPseudo(i);
	}
	/*
	Expr.pseudos[ "radio" ] = createInputPseudo( "radio" )
	-> function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "radio";
		}
	
	Expr.pseudos[ "submit" ] = createButtonPseudo( "submit" )
	-> function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return (name === "input" || name === "button") && elem.type === "submit";
		}
	*/
	for (i in { submit: true, reset: true }) {
		Expr.pseudos[i] = createButtonPseudo(i);
	}

	// Easy API for creating new setFilters
	function setFilters() { }
	// 注意一下这里，上面以字面量的形式定义了 Expr.filter，但是没有定义 Expr.filters，不要混淆了
	setFilters.prototype = Expr.filters = Expr.pseudos;
	// 这样，Expr.setFilters 就拥有了 Expr.pseudos 的属性
	Expr.setFilters = new setFilters();

	/*
	① 如果 parseOnly 为 true 表示只是测试选择器的合法性，那就返回 soFar 剩余长度（如果长度不为 0 ，那就说明选择器不合法）
	② 否则，最后返回值为一个二维数组，例如： [[token,token],[token,token,tokens],[token,token,tokens,tokens]]
	
	其中 token 类型有：TAG, ID, CLASS, ATTR, CHILD, PSEUDO, >, +, 空格, ~
	
	举个例子：
	
	tokenize('div p + .clr [type=checkbox], #box p,div + span')
	-> [Array(7), Array(3), Array(3)]
	
	Array(7) , Array(3), Array(3) 分别为：
	[
		{value: "div", type: "TAG", matches: ["div"]},
		{value: " ", type: " "},
		{value: "p", type: "TAG", matches: ["p"]},
		{value: " + ", type: "+"},
		{value: ".clr", type: "CLASS", matches: ["clr"]},
		{value: " ", type: " "},
		{value: "[type=checkbox]", type: "ATTR", matches: ["type", "=", "checkbox"]}
	],
	[
		{value: "#box", type: "ID", matches:["box"]},
		{value: " ", type: " "},
		{value: "p", type: "TAG", matches: ["p"]}
	],
	[
		{value: "div", type: "TAG", matches: ["div"]},
		{value: " + ", type: "+"},
		{value: "span", type: "TAG", matches: ["span"]}
	]
	*/
	function tokenize(selector, parseOnly) {
		var matched, match, tokens, type,
			soFar, groups, preFilters,
			// 这里之所以加一个空格，是因为存的时候就加了一个空格（这样会比较特殊，不至于和 tokenCache 这个方法（对象）的自身属性冲突）
			cached = tokenCache[selector + " "];

		// 分解完每一个 selector，都会把相应的 tokens 存在缓存里，如果下次遇到同样的 selector 就不会重新分析了，直接去缓存取
		if (cached) {
			// 如果测试选择器的合法性，就返回 0，表示是合法的。否则就返回缓存的副本。
			return parseOnly ? 0 : cached.slice(0);
		}

		soFar = selector;
		// groups 表示目前已经匹配到的规则组，在这个例子里边，groups 的长度最后是 2，存放的是每个规则对应的 Token 序列
		groups = [];
		preFilters = Expr.preFilter;

		// 逐步分解 selector 字符串，直到拆分完毕
		while (soFar) {

			// Comma and first run

			// 第一步：以逗号（,） 为分隔符，拆分 soFar，其中 rcomma = /^[\x20\t\r\n\f]*,[\x20\t\r\n\f]*/
			/*
			① 开头必须是 [\x20\t\r\n\f]，所以不通过匹配
			rcomma.exec('a,b') -> null
			② 以下形式可以通过匹配，开头要么是逗号，要么是空格，换行等
			rcomma.exec(' ,b') -> [" ,", index: 0, input: " ,b"]
			rcomma.exec(',b')-> [",", index: 0, input: ",b"]
			rcomma.exec(', b') -> [", ", index: 0, input: ", b"]
			*/
			if (!matched || (match = rcomma.exec(soFar))) {
				if (match) {
					// Don't consume trailing commas as valid
					/*
					注意一下 stringObject.slice(start,end) 用法：
					第一个参数 start 表示起始下标，省略第二个参数表示知道字符串结尾
	
					eg: 'abcdef'.slice(2) -> "cdef"
	
					以 soFar = ',abcd' 为例：
					match = rcomma.exec( ',abcd' )
					-> match = [",", index: 0, input: ",abcd"]
	
					soFar.slice( match[0].length )
					-> ',abcd'.slice( 1 )
					-> "abcd"
	
					再举个极端点的例子，soFar = ','
					soFar.slice( match[0].length )
					-> ','.slice( 1 )
					-> ""
	
					这里的做法是，遇到这种情况，soFar 保持不变
	
					也就是说，遇到这种情况，soFar 字符串一直是 ','，长度不会减少，不会为 0，
					那么就是不合符要求的 selector，会报错！
	
					执行 $(',')，报错！
					Syntax error, unrecognized expression: ,
					*/
					soFar = soFar.slice(match[0].length) || soFar;
				}
				/*
				① 将 tokens 初始化为 []
				② 将 tokens 加入到 groups 数组末尾
				③ 后面对 tokens 的修改，也是对 groups 数组的修改
				④ 外层 while 循环执行多次，可能多次执行这句，最后，groups 大致结构为：
					 [[token,token],[token,token,tokens],[token,token,tokens,tokens]]
					 其中	[token,token] 为 tokens
				*/
				groups.push(tokens = []);
			}

			matched = false;

			// Combinators
			// rcombinators = /^[\x20\t\r\n\f]*([>+~]|[\x20\t\r\n\f])[\x20\t\r\n\f]*/
			/*
			rcombinators 跟上面的 rcomma 挺类似的，只不过逗号（,）换成了 [>+~]|[\x20\t\r\n\f] 其中之一
			分别对应 4 种【块间关系】：
			① ">" 父子关系
			② [\x20\t\r\n\f] 祖宗后代关系
			③ "+" 紧邻兄弟元素
			④ "~" 之后的所有兄弟元素
	
			那就以 > 为例：
			① 开头必须是 [\x20\t\r\n\f]，所以不通过匹配
			rcombinators.exec('a>b') -> null
			② 以下形式可以通过匹配，开头要么是逗号，要么是空格，换行等
			rcombinators.exec(' >b') -> [" >", ">", index: 0, input: " >b"]
			rcombinators.exec('>b')-> [">", ">", index: 0, input: ">b"]
			rcombinators.exec('> b') -> ["> ", ">", index: 0, input: "> b"]
			*/
			if ((match = rcombinators.exec(soFar))) {
				// 匹配到的 soFar 片段，比如 " >"
				matched = match.shift();
				// 这里处理 4 中类型 token ： >, +, 空格, ~
				tokens.push({
					// 匹配到的字符串片段 " > "
					value: matched,
					// Cast descendant combinators to space
					/*
					whitespace = "[\\x20\\t\\r\\n\\f]"
					rtrim = new RegExp("^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g")
					即：rtrim = /^[\x20\t\r\n\f]+|((?:^|[^\\])(?:\\.)*)[\x20\t\r\n\f]+$/g
	
					// 以下保持原字符串不变
					"+".replace( rtrim, " " ) -> "+"
					"~".replace( rtrim, " " ) -> "~"
					">".replace( rtrim, " " ) -> ">"
	
					// 以下将原字符串替换为 " "
					" ".replace( rtrim, " " )-> " "
					"\r".replace( rtrim, " " ) -> " "
					"\n".replace( rtrim, " " ) -> " "
					"\t".replace( rtrim, " " ) -> " "
					"\t\n\n".replace( rtrim, " " ) -> " "
	
					也就是说，空格、回车、换行、换页等空白符存的类型都是空格（" "）
					*/
					type: match[0].replace(rtrim, " ")
				});
				// 留下剩余的部分
				soFar = soFar.slice(matched.length);
			}

			// Filters
			/*
				Expr.filter : {
					'ID': function(){...},
					"TAG": function(){...},
					"CLASS": function(){...},
					"ATTR": function(){...},
					"CHILD": function(){...},
					"PSEUDO": function(){...},
				}
				其中，ID 属性是后面动态加入的

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
			// type 为 "ID"、"TAG"、"CLASS"、"ATTR"、"CHILD"、"PSEUDO" 其中一种
			for (type in Expr.filter) {
				/*
				进入 if 代码块的条件为：
				soFar 能通过 matchExpr[ type ] 这个正则的匹配
	
				① 对于 type 为 "ID"、"TAG"、"CLASS"，那么 match = matchExpr[ type ].exec( soFar )
				② 对于 type 为 "ATTR"、"CHILD"、"PSEUDO"，那么 match = preFilters[ type ]( matchExpr[ type ].exec( soFar ) )
				*/
				if ((match = matchExpr[type].exec(soFar)) && (!preFilters[type] ||
					(match = preFilters[type](match)))) {

					// 匹配到的 soFar 片段，比如 'div'
					matched = match.shift();
					tokens.push({
						value: matched,// 匹配到的字符串片段
						type: type,// token 类型
						matches: match // 正则匹配结果数组
					});
					// 从原字符串中丢掉已匹配部分
					soFar = soFar.slice(matched.length);
				}
			}

			// 如果没有找到片段，说明选择器写法有误，那就不再继续循环了
			if (!matched) {
				break;
			}
		}

		// Return the length of the invalid excess
		// if we're just parsing
		// Otherwise, throw an error or return tokens
		/*
		① 如果只是测试选择器的合法性，那就返回 soFar 剩余长度（如果长度不为 0 ，那就说明选择器不合法）
		② 如果 soFar 不是空字符串（没分解完），那就报错。如果为空字符串，表示正常分解完，那就缓存下来
	
		注意一下 tokenCache( selector, groups ).slice( 0 )
		tokenCache( selector, groups ) 不光是存储键值对 selector-groups，它还有返回值 groups
	
		所以，最后的返回结果是 groups 数组的副本（深复制）
		*/
		return parseOnly ?
			soFar.length :
			soFar ?
				/*
				Sizzle.error = function( msg ) {
					throw new Error( "Syntax error, unrecognized expression: " + msg );
				};
				eg:
				执行 $(',') 会报错：
				-> Uncaught Error: Syntax error, unrecognized expression: ,
				*/
				Sizzle.error(selector) :
				// Cache the tokens
				// 分解完每一个 selector，都会把相应的 tokens 存在缓存里，如果下次遇到同样的 selector 就不会重新分析了，直接去缓存取
				tokenCache(selector, groups).slice(0);
	}

	// 将 token 中的 value 连起来，返回一个字符串。相当于 tokenize 方法的逆操作。
	function toSelector(tokens) {
		var i = 0,
			len = tokens.length,
			selector = "";
		for (; i < len; i++) {
			selector += tokens[i].value;
		}
		return selector;
	}

	/*
	① matcher 是一个函数
	② combinator 是以下 4 个 json 对象之一：
		relative = {
			">": { dir: "parentNode", first: true },
			" ": { dir: "parentNode" },
			"+": { dir: "previousSibling", first: true },
			"~": { dir: "previousSibling" }
		}
	③ base 是 true 或 undefined
	*/
	function addCombinator(matcher, combinator, base) {
		var dir = combinator.dir,
			checkNonElements = base && dir === "parentNode",
			// done 的初始值为 0
			doneName = done++;

		// > 和 + 两种关系运算符（紧密的）
		return combinator.first ?
			// Check against closest ancestor/preceding element
			function (elem, context, xml) {
				while ((elem = elem[dir])) {
					if (elem.nodeType === 1 || checkNonElements) {
						// 既然是紧密关系，找到了第一个紧密节点就要用 matcher 做决断，成就成，不成就不成
						return matcher(elem, context, xml);
					}
				}
			} :

			// 空格 和 ~ 两种关系运算符
			// Check against all ancestor/preceding elements
			function (elem, context, xml) {
				var data, cache, outerCache,
					dirkey = dirruns + " " + doneName;

				// We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
				if (xml) {
					while ((elem = elem[dir])) {
						// 以祖先关系为例，只要有一个祖先满足要求就好了。当然了，如果所有的祖先都不满足，那就只能是 undefined（false）了
						if (elem.nodeType === 1 || checkNonElements) {
							if (matcher(elem, context, xml)) {
								return true;
							}
						}
					}
				} else {
					while ((elem = elem[dir])) {
						if (elem.nodeType === 1 || checkNonElements) {
							outerCache = elem[expando] || (elem[expando] = {});
							// 有缓存，不用调用 matcher 函数
							if ((cache = outerCache[dir]) && cache[0] === dirkey) {
								// 非紧密关系，只要有一个相关元素符合要求就行了
								if ((data = cache[1]) === true || data === cachedruns) {
									return data === true;
								}
								// 没有缓存，调用 matcher 函数
							} else {
								/*
								① cache = [ dirkey ]
								cache[0] = dirkey;
								cache[1] = matcher( elem, context, xml ) || cachedruns
	
								② 这里修改了 elem[ expando ] 对象
								a. 修改 outerCache 相当于修改 elem[ expando ] 对象，所以：
								outerCache[ dir ] = [ dirkey ]
								-> elem[ expando ] : {
										 dir : [ dirkey ]
									 }
								b. 修改 cache 也相当于修改 elem[ expando ] 对象
								-> elem[ expando ] : {
										 dir : [ dirkey,matcher( elem, context, xml ) || cachedruns]
									 }
								*/
								cache = outerCache[dir] = [dirkey];
								cache[1] = matcher(elem, context, xml) || cachedruns;
								// 非紧密关系，只要有一个相关元素符合要求就行了
								if (cache[1] === true) {
									return true;
								}
							}
						}
					}
				}
			};
	}

	/*
	① matchers 长度为 1，返回 matchers[0]；
	② matchers 长度大于 1，返回一个新的函数
		 新的函数执行时会依次执行每一个 matchers[i]，只要有一个返回 false，最终结果就是 false
	*/
	function elementMatcher(matchers) {
		return matchers.length > 1 ?
			function (elem, context, xml) {
				var i = matchers.length;
				// 从右到左
				while (i--) {
					// 只要有一个 matcher 执行结果是 false，那就说明当前节点 elem 不符合要求
					if (!matchers[i](elem, context, xml)) {
						return false;
					}
				}
				return true;
			} :
			matchers[0];
	}

	function condense(unmatched, map, filter, context, xml) {
		var elem,
			newUnmatched = [],
			i = 0,
			len = unmatched.length,
			// map 有值时 mapped 为 true
			mapped = map != null;

		for (; i < len; i++) {
			if ((elem = unmatched[i])) {
				// 如果没有过滤器，或者能通过过滤器，就把当前 elem 加入到 newUnmatched 数组里
				if (!filter || filter(elem, context, xml)) {
					newUnmatched.push(elem);
					if (mapped) {
						map.push(i);
					}
				}
			}
		}

		return newUnmatched;
	}

	function setMatcher(preFilter, selector, matcher, postFilter, postFinder, postSelector) {
		if (postFilter && !postFilter[expando]) {
			postFilter = setMatcher(postFilter);
		}
		if (postFinder && !postFinder[expando]) {
			postFinder = setMatcher(postFinder, postSelector);
		}
		return markFunction(function (seed, results, context, xml) {
			var temp, i, elem,
				preMap = [],
				postMap = [],
				preexisting = results.length,

				// Get initial elements from seed or context
				elems = seed || multipleContexts(selector || "*", context.nodeType ? [context] : context, []),

				// Prefilter to get matcher input, preserving a map for seed-results synchronization
				matcherIn = preFilter && (seed || !selector) ?
					condense(elems, preMap, preFilter, context, xml) :
					elems,

				matcherOut = matcher ?
					// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
					postFinder || (seed ? preFilter : preexisting || postFilter) ?

						// ...intermediate processing is necessary
						[] :

						// ...otherwise use results directly
						results :
					matcherIn;

			// Find primary matches
			if (matcher) {
				matcher(matcherIn, matcherOut, context, xml);
			}

			// Apply postFilter
			if (postFilter) {
				temp = condense(matcherOut, postMap);
				postFilter(temp, [], context, xml);

				// Un-match failing elements by moving them back to matcherIn
				i = temp.length;
				while (i--) {
					if ((elem = temp[i])) {
						matcherOut[postMap[i]] = !(matcherIn[postMap[i]] = elem);
					}
				}
			}

			if (seed) {
				if (postFinder || preFilter) {
					if (postFinder) {
						// Get the final matcherOut by condensing this intermediate into postFinder contexts
						temp = [];
						i = matcherOut.length;
						while (i--) {
							if ((elem = matcherOut[i])) {
								// Restore matcherIn since elem is not yet a final match
								temp.push((matcherIn[i] = elem));
							}
						}
						postFinder(null, (matcherOut = []), temp, xml);
					}

					// Move matched elements from seed to results to keep them synchronized
					i = matcherOut.length;
					while (i--) {
						if ((elem = matcherOut[i]) &&
							(temp = postFinder ? indexOf.call(seed, elem) : preMap[i]) > -1) {

							seed[temp] = !(results[temp] = elem);
						}
					}
				}

				// Add elements to results, through postFinder if defined
			} else {
				matcherOut = condense(
					matcherOut === results ?
						matcherOut.splice(preexisting, matcherOut.length) :
						matcherOut
				);
				if (postFinder) {
					postFinder(null, results, matcherOut, xml);
				} else {
					push.apply(results, matcherOut);
				}
			}
		});
	}

	// 一组 tokens 生成一个函数
	function matcherFromTokens(tokens) {
		var checkContext, matcher, j,
			len = tokens.length,
			// 第一个 token 如果是 > + ~ 空格 四者之一则 leadingRelative 为相应的 json 对象，否则为 undefined
			leadingRelative = Expr.relative[tokens[0].type],
			// 如果 leadingRelative 为 undefined，则返回 Expr.relative[" "]
			implicitRelative = leadingRelative || Expr.relative[" "],
			// 如果 leadingRelative 有值，说明最开头的 token 是 4 个关系运算符之一，则跳过这个 token
			i = leadingRelative ? 1 : 0,

			// The foundational matcher ensures that elements are reachable from top-level context(s)
			// elem 需和 context 全等
			matchContext = addCombinator(function (elem) {
				return elem === checkContext;
			}, implicitRelative, true),
			// elem 和 contexts 其中之一全等即可
			matchAnyContext = addCombinator(function (elem) {
				return indexOf.call(checkContext, elem) > -1;
			}, implicitRelative, true),
			matchers = [function (elem, context, xml) {
				return (!leadingRelative && (xml || context !== outermostContext)) || (
					(checkContext = context).nodeType ?
						// 如果 context 是一个元素，那就得全匹配
						matchContext(elem, context, xml) :
						// 如果 context 是一组元素，那就匹配这一组元素其中一个就好了
						matchAnyContext(elem, context, xml));
			}];

		for (; i < len; i++) {
			if ((matcher = Expr.relative[tokens[i].type])) {
				matchers = [addCombinator(elementMatcher(matchers), matcher)];
			} else {
				/*
				tokenize('div:eq(3)')
				-> [[
					{value: "div", type: "TAG", matches: ["div"]}
					{value: ":eq(3)", type: "PSEUDO", matches: ["eq", "3"]}
				]]
	
				① 以 token = {value: "div", type: "TAG", matches: ["div"]} 为例：
				matcher = Expr.filter[ "TAG" ].apply( null, "div" )
				-> matcher = function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === "div";
				}
	
				② 以 token = {value: ":eq(3)", type: "PSEUDO", matches: ["eq", "3"]} 为例：
				matcher = Expr.filter[ "PSEUDO" ].apply( null, ["eq", "3"] )
				-> matcher = Expr.pseudos[ "eq" ]["3"]
				-> matcher = markFunction(function( seed, matches ) {
					var j,
						matchIndexes = [3],
						i = matchIndexes.length;
	
					while ( i-- ) {
						if ( seed[ (j = matchIndexes[i]) ] ) {
							seed[j] = !(matches[j] = seed[j]);
						}
					}
				});
				-> matcher = markFunction(function( seed, matches ) {
						if ( seed[3] ) {
							matches[3] = seed[3];
							seed[3] = !seed[3];
						}
				});
				*/
				matcher = Expr.filter[tokens[i].type].apply(null, tokens[i].matches);

				// Return special upon seeing a positional matcher
				// 位置伪类
				if (matcher[expando]) {
					// Find the next relative operator (if any) for proper handling
					j = ++i;
					for (; j < len; j++) {
						if (Expr.relative[tokens[j].type]) {
							break;
						}
					}
					return setMatcher(
						i > 1 && elementMatcher(matchers),
						i > 1 && toSelector(
							// If the preceding token was a descendant combinator, insert an implicit any-element `*`
							tokens.slice(0, i - 1).concat({ value: tokens[i - 2].type === " " ? "*" : "" })
						).replace(rtrim, "$1"),
						matcher,
						i < j && matcherFromTokens(tokens.slice(i, j)),
						j < len && matcherFromTokens((tokens = tokens.slice(j))),
						j < len && toSelector(tokens)
					);
				}
				matchers.push(matcher);
			}
		}

		return elementMatcher(matchers);
	}

	// elementMatchers 和 setMatchers 都是数组
	function matcherFromGroupMatchers(elementMatchers, setMatchers) {
		// A counter to specify which element is currently being matched
		// 标识当前正在匹配的元素
		var matcherCachedRuns = 0,
			bySet = setMatchers.length > 0,
			byElement = elementMatchers.length > 0,
			/*
			在 select 方法中调用了这个超级匹配器，生成最终符合选择器的 dom 集合
	
			var superMatcher = compile( selector, match );
			superMatcher(
				seed,
				context,
				!documentIsHTML,
				results,
				rsibling.test( selector )
			);
	
			其中 rsibling = new RegExp( whitespace + "*[+~]" ) 用于判定选择器是否存在兄弟关系符
			*/
			superMatcher = function (seed, context, xml, results, expandContext) {
				var elem, j, matcher,
					setMatched = [],
					matchedCount = 0,
					i = "0",
					// 如果有 seed，就是 []
					unmatched = seed && [],
					/*
					对于 rsibling.test( selector )，返回值要么 true 要么 false
					true != null-> true
					false != null -> true
	
					所以，在 select 方法中调用这个超级匹配器时，outermost 始终为 true
					*/
					outermost = expandContext != null,
					contextBackup = outermostContext,
					// We must always have either seed elements or context
					/*
					① 如果有种子集合 seed 就用这个种子集合作为备选节点
					② 否则把 context 下所有节点当做备选节点
					*/
					elems = seed || byElement && Expr.find["TAG"]("*", expandContext && context.parentNode || context),
					// Use integer dirruns iff this is the outermost matcher
					/*
					① contextBackup 为 undefined|null 时，dirruns += 1
					② 否则，dirruns += Math.random() || 0.1
					*/
					dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1);

				if (outermost) {
					outermostContext = context !== document && context;
					// 全局保存当前匹配的元素索引
					cachedruns = matcherCachedRuns;
				}

				// Add elements passing elementMatchers directly to results
				// Keep `i` a string if there are no elements so `matchedCount` will be "00" below
				for (; (elem = elems[i]) != null; i++) {
					if (byElement && elem) {
						j = 0;
						/*
						一个 selector 可能对于多组 tokens，一组 tokens 对应一个 elementMatcher（或 setMatcher）
						也就是说，对于 "part1,part2,part3..." 这个 selector	，不管 elem 满足哪个 part 都是可以的，见好就收，没必须继续循环。
						*/
						while ((matcher = elementMatchers[j++])) {
							if (matcher(elem, context, xml)) {
								results.push(elem);
								break;
							}
						}
						if (outermost) {
							dirruns = dirrunsUnique;
							// 全局保存当前匹配的元素索引，每一个元素匹配结束，索引值加 1
							cachedruns = ++matcherCachedRuns;
						}
					}

					// Track unmatched elements for set filters
					if (bySet) {
						// They will have gone through all possible matchers
						if ((elem = !matcher && elem)) {
							matchedCount--;
						}

						// Lengthen the array for every element, matched or not
						if (seed) {
							unmatched.push(elem);
						}
					}
				}

				// Apply set filters to unmatched elements
				matchedCount += i;
				if (bySet && i !== matchedCount) {
					j = 0;
					while ((matcher = setMatchers[j++])) {
						matcher(unmatched, setMatched, context, xml);
					}

					if (seed) {
						// Reintegrate element matches to eliminate the need for sorting
						if (matchedCount > 0) {
							while (i--) {
								if (!(unmatched[i] || setMatched[i])) {
									setMatched[i] = pop.call(results);
								}
							}
						}

						// Discard index placeholder values to get only actual matches
						setMatched = condense(setMatched);
					}

					// Add matches to results
					push.apply(results, setMatched);

					// Seedless set matches succeeding multiple successful matchers stipulate sorting
					if (outermost && !seed && setMatched.length > 0 &&
						(matchedCount + setMatchers.length) > 1) {

						Sizzle.uniqueSort(results);
					}
				}

				// Override manipulation of globals by nested matchers
				if (outermost) {
					dirruns = dirrunsUnique;
					outermostContext = contextBackup;
				}

				return unmatched;
			};

		return bySet ?
			markFunction(superMatcher) :
			superMatcher;
	}

	// 这里的 group = tokenize( selector ) 是一个二维数组
	compile = Sizzle.compile = function (selector, group /* Internal Use Only */) {
		var i,
			setMatchers = [],
			elementMatchers = [],
			// 读取缓存
			cached = compilerCache[selector + " "];

		// 没有缓存才走这里
		if (!cached) {
			// Generate a function of recursive functions that can be used to check each element
			if (!group) {
				group = tokenize(selector);
			}
			// i 表示 selector 被逗号分隔成多少部分
			i = group.length;
			while (i--) {
				/*
					注意这个 matcherFromTokens( group[i] ) 返回值为 elementMatcher( matchers )
					① 一般情况下这个 elementMatcher( matchers ) 就是一个新的函数，这个函数没有 expando 属性
					② 不过，当 matchers 长度为 1 时，elementMatcher( matchers ) 就是 matchers[0]，这个函数是可能有 expando 属性的
				 */
				cached = matcherFromTokens(group[i]);
				if (cached[expando]) {
					setMatchers.push(cached);
				} else {
					elementMatchers.push(cached);
				}
			}

			// Cache the compiled function
			// 生成超级匹配器，并缓存起来
			cached = compilerCache(selector, matcherFromGroupMatchers(elementMatchers, setMatchers));
		}

		return cached;
	};

	function multipleContexts(selector, contexts, results) {
		var i = 0,
			len = contexts.length;
		for (; i < len; i++) {
			Sizzle(selector, contexts[i], results);
		}
		return results;
	}

	/*
	 * select 方法是 Sizzle 选择器包的核心方法之一，其主要完成下列任务：
	 * 1、调用 tokenize 方法完成对选择器的解析
	 * 2、对于没有初始集合（即 seed 没有赋值）且是单一块选择器（即选择器字符串中没有逗号），
	 *完成下列事项：
	 *1) 对于首选择器是 ID 类型且 context 是 document 的，则直接获取对象替代传入的 context 对象
	 *2) 若选择器是单一选择器，且是 id、class、tag 类型的，则直接获取并返回匹配的DOM元素
	 *3) 获取最后一个 id、class、tag 类型选择器的匹配 DOM 元素赋值给初始集合（即 seed 变量）
	 * 3、通过调用 compile 方法获取“预编译”代码并执行，获取并返回匹配的 DOM 元素
	 *
	 * @param selector 已去掉头尾空白的选择器字符串
	 * @param context 执行匹配的最初的上下文（即 DOM 元素集合）。若 context 没有赋值，则取 document。
	 * @param results 已匹配出的部分最终结果。若 results 没有赋值，则赋予空数组。
	 * @param seed 初始集合
	 */


	/*
	 浏览器实现的基本接口
	 
	 除了 querySelector,querySelectorAll
	 
	 HTML 文档一共有这么四个 API：
	 
	 getElementById，上下文只能是 HTML 文档。
	 getElementsByName，上下文只能是 HTML 文档。
	 getElementsByTagName，上下文可以是 HTML 文档，XML 文档及元素节点。
	 getElementsByClassName，上下文可以是 HTML 文档及元素节点。IE8 还没有支持。
	 所以要兼容的话 sizzle 最终只会有三种完全靠谱的可用
	 
	 Expr.find = {
				 'ID': context.getElementById,
				 'CLASS' : context.getElementsByClassName,
				 'TAG' : context.getElementsByTagName
	 }
	 
	 
	 selector："div > p + div.aaron input[type="checkbox"]"
	 
	 解析规则：
	 1. 按照从右到左
	 2. 取出最后一个token比如[type="checkbox"] 对应的 token 为：
	 
	 tokenize('div p + .clr [type=checkbox], #box p,div + span')
	 -> [[
		 {value: "div", type: "TAG", matches: ["div"]},
		 {value: " ", type: " "},
		 {value: "p", type: "TAG", matches: ["p"]},
		 {value: " + ", type: "+"},
		 {value: ".clr", type: "CLASS", matches: ["clr"]},
		 {value: " ", type: " "},
		 {value: "[type=checkbox]", type: "ATTR", matches: ["type", "=", "checkbox"]}
	 ],
	 [
		 {value: "#box", type: "ID", matches:["box"]},
		 {value: " ", type: " "},
		 {value: "p", type: "TAG", matches: ["p"]}
	 ],
	 [
		 {value: "div", type: "TAG", matches: ["div"]},
		 {value: " + ", type: "+"},
		 {value: "span", type: "TAG", matches: ["span"]}
	 ]]
	 3. 过滤类型 如果 type 是 > + ~ 空 四种关系选择器中的一种，则跳过，再继续过滤
	 4. 直到匹配到为 ID,CLASS,TAG中一种 , 因为这样才能通过浏览器的接口索取
		 （从右往左匹配，但是右边第一个是 "[type="checkbox"]" ，Expr.find 不认识这种选择器，跳过，继续向左）
	 5. 此时 seed 就有值了，这样把刷选的条件给缩的很小了
	 6. 如果匹配的 seed 有多个就需要进一步的过滤了，修正选择器 selector: "div > p + div.aaron [type="checkbox"]"
	 7. 最后，跳到下一阶段的编译函数
	*/
	function select(selector, context, results, seed) {
		var i, tokens, token, type, find,
			/*
			tokenize('#box p')
			-> [[
				{value: "#box", type: "ID", matches:["box"]},
				{value: " ", type: " "},
				{value: "p", type: "TAG", matches: ["p"]}
			]]
	
			结果为一个二维数组
			*/
			match = tokenize(selector);

		// 以下的代码块的作用是选出种子元素集合，最终的结果一定在种子元素集合中产生
		if (!seed) {
			// Try to minimize operations if there is only one group
			/*
				如果选择器里没有逗号，则只有一组的情况下才会在下面给 seed 赋值。
				这样做是有道理的，假如有多组并列选择器，div span,.cls input[type="text"]
				这样就 seed 为 span 集合或者 input 集合都不合适，情况会弄得很复杂。

				也就是说，多组并列选择器的情况，这里就不会给 seed 赋值，也就是说 seed 没值的情况会让超级匹配器 superMatcher 来处理
			*/
			if (match.length === 1) {

				// Take a shortcut and set the context if the root selector is an ID
				// tokens 组成的一维数组
				tokens = match[0] = match[0].slice(0);
				/*
					同时满足以下几个条件：
					① 有三个以上的 token
					② 第一个选择器是 id 选择器
					③ 支持 getElementById 方法
					④ context 为 document
					⑤ 当前文档是 html 类型
					⑥ 第二个选择器的类型是（空格 + > ~）其中之一
				*/
				if (tokens.length > 2 && (token = tokens[0]).type === "ID" &&
					support.getById && context.nodeType === 9 && documentIsHTML &&
					Expr.relative[tokens[1].type]) {


					// 将 context 修正为 id 选择器指定的节点，缩写查找范围（Expr.find["ID"] 方法返回值是数组）
					context = (Expr.find["ID"](token.matches[0].replace(runescape, funescape), context) || [])[0];
					// 对于 []，[][0] （context）值为 undefined
					if (!context) {
						return results;
					}
					// 从原选择器字符串中丢掉这个 id 选择器
					selector = selector.slice(tokens.shift().value.length);
				}

				// Fetch a seed set for right-to-left matching
				/*
				matchExpr["needsContext"] = new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
				以下两类通过匹配（也就是说以下两类不会进入下面的 while 循环）：
				① > + ~ 三种关系符
				② :even、:odd、:eq、:gt、:lt、:nth、:first、:last 等八种伪类
				*/
				i = matchExpr["needsContext"].test(selector) ? 0 : tokens.length;
				// 从后边的规则开始
				while (i--) {
					token = tokens[i];

					// Abort if we hit a combinator
					// 遇到（空格 + > ~）跳出结束循环
					if (Expr.relative[(type = token.type)]) {
						break;
					}

					/*
					Expr.find["ID"](id, context)			返回一个数组，元素是 context 中 id 值为 id 的元素
					Expr.find["TAG"]( tag, context )		返回一个数组，元素是 context 中 标签名为 tag 的元素
					Expr.find["CLASS"]( className, context )	返回一个数组，元素是 context 中 class 名为 className 的元素
	
					type 必须是 "ID"、"TAG"、"CLASS" 三者之一才能进入以下的 if 块
					*/
					if ((find = Expr.find[type])) {
						// Search, expanding context for leading sibling combinators
						// seed 是原生 dom 元素组成的数组，也就是说最终的结果一定在这个集合里
						if ((seed = find(
							// id 或 class 或 tag 值
							token.matches[0].replace(runescape, funescape),
							/*
							rsibling = new RegExp(whitespace + "*[+~]")
							如果 tokens[0].type 是 + 或 ~ 的情况，即兄弟节点，则 context 修正为 context.parentNode
							*/
							rsibling.test(tokens[0].type) && context.parentNode || context
						))) {
							// If seed is empty or no tokens remain, we can return early
							// 删除当前 token
							tokens.splice(i, 1);
							// 剩余的 token 重新组合成 selector 字符串
							selector = seed.length && toSelector(tokens);
							// 如果没有剩余选择符，那么这个 seed 就是最终的结果，在这里返回最终结果就好
							if (!selector) {
								push.apply(results, seed);
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
		/*
			生成编译函数:
			var superMatcher = compile( selector, match );
			superMatcher(
				seed,
				context,
				!documentIsHTML,
				results,
				rsibling.test( selector )
			);
		
			seed 是种子，也就是说，最终选出的元素一定是在这个集合里产生
		*/
		compile(selector, match)(
			seed,
			context,
			!documentIsHTML,
			results,
			rsibling.test(selector)
		);
		return results;
	}

	// One-time assignments
	/*
	expando = "sizzle" + -(new Date())
	-> "sizzle-1504088090141"
	
	expando.split("")
	-> ["s", "i", "z", "z", "l", "e", "-", "1", "5", "0", "4", "0", "8", "8", "1", "4", "5", "5", "8", "7"]
	
	expando.split("").sort( sortOrder )
	-> ["4", "s", "z", "z", "l", "e", "-", "1", "5", "0", "i", "0", "8", "8", "1", "4", "5", "5", "8", "7"]
	
	expando.split("").sort( sortOrder ).join("")
	-> "4szzle-150i088145587"
	
	既然 sortOrder 返回值一直是 0，那数组元素顺序不应该改变，而这里变了，说明排序方法不稳定
	*/
	// Sort stability
	support.sortStable = expando.split("").sort(sortOrder).join("") === expando;

	// Support: Chrome<14
	// Always assume duplicates if they aren't passed to the comparison function
	support.detectDuplicates = hasDuplicate;

	// Initialize against the default document
	setDocument();

	// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
	// Detached nodes confoundingly follow *each other*
	support.sortDetached = assert(function (div1) {
		// Should return 1, but returns 4 (following)
		return div1.compareDocumentPosition(document.createElement("div")) & 1;
	});

	// Support: IE<8
	// Prevent attribute/property "interpolation"
	// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
	if (!assert(function (div) {
		div.innerHTML = "<a href='#'></a>";
		return div.firstChild.getAttribute("href") === "#";
	})) {
		addHandle("type|href|height|width", function (elem, name, isXML) {
			if (!isXML) {
				/*
				注意一下这里的 getAttribute 方法第 2 个参数。
				一般情况下，我们给 getAttribute 方法指定 1 个参数就好了，这里指定 2 个参数为了兼容低版本 ie。
				① 第二个参数取值为 1，表示获取属性名时大小写敏感（默认情况下是不敏感的）
				② 第二个参数取值为 2，表示返回属性原始值（默认情况下低版本 ie 返回的属性值可能是修改过的，例如相对路径的 img 标签得到的是绝对路径）
				*/
				return elem.getAttribute(name, name.toLowerCase() === "type" ? 1 : 2);
			}
		});
	}

	// Support: IE<9
	// Use defaultValue in place of getAttribute("value")
	if (!support.attributes || !assert(function (div) {
		div.innerHTML = "<input/>";
		div.firstChild.setAttribute("value", "");
		return div.firstChild.getAttribute("value") === "";
	})) {
		addHandle("value", function (elem, name, isXML) {
			if (!isXML && elem.nodeName.toLowerCase() === "input") {
				return elem.defaultValue;
			}
		});
	}

	// Support: IE<9
	// Use getAttributeNode to fetch booleans when getAttribute lies
	if (!assert(function (div) {
		return div.getAttribute("disabled") == null;
	})) {
		addHandle(booleans, function (elem, name, isXML) {
			var val;
			if (!isXML) {
				return (val = elem.getAttributeNode(name)) && val.specified ?
					val.value :
					elem[name] === true ? name.toLowerCase() : null;
			}
		});
	}

	// 把 Sizzle 的属性和方法赋给 jQuery 对象
	jQuery.find = Sizzle;
	jQuery.expr = Sizzle.selectors;
	jQuery.expr[":"] = jQuery.expr.pseudos;
	jQuery.unique = Sizzle.uniqueSort;
	jQuery.text = Sizzle.getText;
	jQuery.isXMLDoc = Sizzle.isXML;
	jQuery.contains = Sizzle.contains;


})(window);
// String to Object options format cache
var optionsCache = {};

// Convert String-formatted options into Object-formatted ones and store in cache
function createOptions(options) {
	// 假如 options 为 'once memory'
	// 注意这种写法：object = optionsCache[ options ] = {}
	// object 和 optionsCache[ options ] 指向同一个对象，当 object 对这个对象进行修改，也会反应在 optionsCache[ options ] 上
	var object = optionsCache[options] = {};
	/*
	core_rnotwhite = /\S+/g 匹配任意不是空白的字符

	'once memory'.match(/\S+/g) -> ["once", "memory"]match 的正则参数如果是全局匹配，返回的数组就像这样很简单的

	$.each(arr, function(i, value){
		// i 是 key 'name', 'age' ...
		// value 是元素 'hello', 20 ...
		// code
		return false;
	});
	 */
	jQuery.each(options.match(core_rnotwhite) || [], function (_, flag) {
		// 修改 object 相当于也修改了 optionsCache[ options ]
		object[flag] = true;
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

	cb.fire() // 依次触发 aaa，bbb 方法打印 1、2

	跟事件绑定类似：
	document.addEventListener('click',function(){console.log(1),false});
	document.addEventListener('click',function(){console.log(2),false});
	document.addEventListener('click',function(){console.log(3),false});

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
jQuery.Callbacks = function (options) {

	// Convert options from String-formatted to Object-formatted if needed
	// (we check in cache first)
	// Convert String-formatted options into Object-formatted ones and store in cache//
	/*
	① 如果参数 options 不是字符串，比如对象字面量形式，那 options = jQuery.extend( {}, options )

	② 如果参数 options 是字符串，如 'once memory'

	var optionsCache = {};


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
		(optionsCache[options] || createOptions(options)) :
		jQuery.extend({}, options);

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
		fire = function (data) {
			// 如果有 memory 参数，则记录 data
			memory = options.memory && data;
			// 标记触发过回调队列
			fired = true;
			firingIndex = firingStart || 0;
			firingStart = 0;
			firingLength = list.length;
			// 标记正在执行回调队列
			firing = true;
			for (; list && firingIndex < firingLength; firingIndex++) {
				/*
				① 如果配置了 stopOnFalse 参数，当有一个回调函数返回 false，就终止循环
				② list[ firingIndex ].apply( data[ 0 ], data[ 1 ] ) === false
					 这句除了是个判断条件，也实实在在地依次执行了 list 队列里的函数
				③ 这里把所有函数的执行上下文都绑定为 data[0]，也就是下面拥有多个 api 方法的 self 对象
				 */
				if (list[firingIndex].apply(data[0], data[1]) === false && options.stopOnFalse) {
					// 阻止将来由 add 方法添加的回调
					memory = false; // To prevent further calls using add
					break;
				}
			}
			// 标记回调队列已执行完毕
			firing = false;
			if (list) {
				// 如果没有配置 once 参数，stack 为 []

				// 前面的 firing 过程中，再调用 fire(value) 方法时并不会打断 firing，而是将 value 压栈，
				// 等firing 结束，再执行下一个 fire(value)

				// 回调队列执行过程中，调用 self.fire(arg) 方法，新的参数会存在 stack 中
				// 依次用 stack 中的值，作为参数来执行回调队列
				// 如 stack = [[context,arg1],[context,arg2],...]
				/*
				针对的是情况是 fireWith 方法中提到的例子，函数 fn1 中又调用 fire 方法
				 */
				if (stack) {
					if (stack.length) {
						fire(stack.shift());
					}
					/*
					首先，这里 stack 为 false，说明配置了 once 参数
					其实，这里针对的是 $.callbacks('once memory') 这种情况，
					既要保证每个函数只执行一次，又要保证 fire 后添加的函数也能执行
					eg:
					function aaa(){console.log(1)}
					function bbb(){console.log(2)}
					var cb = $.callbacks('once memory');

					cb.add(aaa);
					cb.fire();

					cb.add(bbb)

					虽然 bbb 是在 fire 后添加的，但是有 memory 参数，所以会执行：
					fire( memory );

					那么执行完毕后，list 数组当然要清空，不然以后每次 add(fn)，都会把之前执行过的函数再执行一遍
					 */
				} else if (memory) {
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
			eg:
			① cb.add(fn1,fn2)
			② cb.add(fn1,[fn2,fn3])
			 */
			add: function () {
				if (list) {
					// First, we save the current length
					var start = list.length;
					(function add(args) {
						jQuery.each(args, function (_, arg) {
							var type = jQuery.type(arg);
							// 参数为 function
							if (type === "function") {
								/*
								① 如果没有 options.unique 参数，直接存
								② 如果有 options.unique 参数，并且没有之前没有存过，也存
								*/
								if (!options.unique || !self.has(arg)) {
									list.push(arg);
								}
								// 参数为类数组 cb.add([f1,f2,f3])
							} else if (arg && arg.length && type !== "string") {
								// Inspect recursively
								// 递归
								add(arg);
							}
						});
					})(arguments);
					// Do we need to add the callbacks to the
					// current firing batch?
					// 比如 fn1 执行过程中调用了 add(fn2)，那么执行把 list 数组长度更新一下，fn2 也会被执行到的
					if (firing) {
						firingLength = list.length;
						// With memory, if we're not firing then
						// we should call right away
						/*
						 ① 对应这种情况：
						 var cb = $.Callbacks('memory');
						 cb.add(fn1);
						 cb.fire();
						 cb.add(fn2);

						 有 memory 参数时，fn2 是在 fire 后添加的，我们要想 fn2 也能执行，那么就再这里再调用 fire( memory )
						 而这个 memory 是上次执行 fire 方法时的 options.memory && data ，也就是 data，也即是上次执行 fire 方法的执行上下文和实参
						 另外，fn1 已经执行过了，但是还存在 list 数组中，可是我们并不想再次触发它，所以，起始位置得重新算
						 如果再次执行 cb.fire()，那么 fn1 和 fn2 当然都会执行了

						 ② 对于特列 var cb = $.Callbacks('once memory');
						 不光有 memory 还要求每个函数只执行一次，其实上次执行 fire 的时候会清空 list = []，那么这里重新算得的起始位置是 0，和上面的分析也不冲突
						*/
					} else if (memory) {
						// 从上次执行完的位置开始
						firingStart = start;
						fire(memory);
					}
				}
				return this;
			},
			// Remove a callback from the list
			remove: function () {
				if (list) {
					jQuery.each(arguments, function (_, arg) {
						var index;
						// inArray 返回元素在数组中的索引，第三个参数 index 表示查找起始位置
						// 这样每次存下上次查找到的位置，作为下次查找的起始位置，提高效率
						while ((index = jQuery.inArray(arg, list, index)) > -1) {
							list.splice(index, 1);
							// Handle firing indexes
							// 如果正则执行回调队列，修正队列长度，不然取不到队列最后一个元素会报错的
							if (firing) {
								if (index <= firingLength) {
									firingLength--;
								}
								if (index <= firingIndex) {
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
			/*
			① 如果有参数 fn 并且 fn 已经存在回调队列里，返回 true
			② 如果没有参数，只要回调队列不为空，就返回 true
			 */
			has: function (fn) {
				return fn ? jQuery.inArray(fn, list) > -1 : !!(list && list.length);
			},
			// Remove all callbacks from the list
			// 清空回调队列
			empty: function () {
				list = [];
				firingLength = 0;
				return this;
			},
			// Have the list do nothing anymore
			// self.add、self.fire 、self.fieWith 都不能触发 fire 方法来启动回调队列了
			disable: function () {
				// 后续的所有函数都不继续执行了 list 不为真，所有的函数都启动不了
				list = stack = memory = undefined;
				return this;
			},
			// Is it disabled?
			// 如果 disable 过了，返回 true
			disabled: function () {
				return !list;
			},
			/*
				① 没有 memory 参数
				self.add、self.fire 、self.fieWith 都不能触发 fire 方法来执行回调队列了

				② 有 memory 参数
				self.add 方法可以触发 fire 方法来执行回调队列
			*/
			lock: function () {
				stack = undefined;
				if (!memory) {
					self.disable();
				}
				return this;
			},
			// Is it locked?
			// 如果 lock 过了，返回 true
			locked: function () {
				return !stack;
			},
			// Call all callbacks with the given context and arguments
			fireWith: function (context, args) {
				// 回调队列没有被触发过，或者是 stack 为数组（没有配置 once 参数时，stack 为 []）
				if (list && (!fired || stack)) {
					/*
					① 第一次调用 cb.fire('hello') -> fired = true
					② 要想第二次调用 cb.fire('hello') 会执行，必须 stack 为数组，也就是说没有配置 once 参数
					 */
					args = args || [];
					// [1,2,3].slice() -> [1, 2, 3]
					args = [context, args.slice ? args.slice() : args];
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

					观察上面这段代码，我们以为程序会死循环，一直执行 fn1 -> fn1 ...
					实际执行上面的代码，我们发现执行顺序是 fn1 -> fn2 -> fn1 -> fn2 ...

					这是因为这里采取了措施，如果在 firing 过程中，再次调用 cb.fire()，也会把上次的函数队列完全执行完，再执行新的 fire 队列
					 */
					if (firing) {
						// 正在执行回调队列，把新增的 fire 参数加入 stack 数组
						stack.push(args);
					} else {
						// args = [ context, args.slice ? args.slice() : args ]
						fire(args);
					}
				}
				return this;
			},
			// Call all the callbacks with the given arguments
			// cb.fire(value) 回调函数队列的每一个函数都会以 value 为实参执行（执行上下文为这里的 this，也就是 self）
			fire: function () {
				self.fireWith(this, arguments);
				return this;
			},
			// To know if the callbacks have already been called at least once
			// 回调队列至少执行过一次，就返回 true
			fired: function () {
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
		},1000);
		return dfd;// 对外暴露接口 resolve|notify|reject 可以改变状态
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

	1 秒后弹出 ’成功‘（并且报错：newDfd.reject 为 undefined ，不是一个函数）

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

	$.Deferred(read) === d // true

 */

/*
	deferred 对象 api：

	* 事件订阅：done | fail | progress
	* 事件发布：resolve | reject | notify

	(1) $.Deferred(func)
	接受一个 function 参数，function 里边可以使用 this 来调用生成的 deferred 对象

	(2) deferred.done(fn)
	添加【成功】时调用的回调函数

	(3) deferred.fail(fn)
	添加【失败】时调用的回调方法

	(4) deferred.progress(fn)
	添加【处理中】调用的回调方法

	(5) deferred.resolve/resolveWith([context], args)
	在任务处理【成功】之后使用此方法触发【成功】事件，之前加入到 done 队列的回调函数会被依次触发

	(6) deferred.reject/rejectWith([context], args)
	在任务处理【失败】之后使用此方法触发【失败】事件，之前加入到 fail 队列的回调函数会被依次触发

	(7) deferred.notify/notifyWith([context], args)
	在任务【处理中】可以使用此方法触发【处理中】事件，之前加入到 progress 队列的回调会被依次触发

	(8) deferred.promise()
	简单理解就是生成一个跟 deferred 一样的对象，但是无法在外部用 resolve、reject、notify 等去修改当前任务状态

	(9) deferred.then(fnDone, fnFail, fnProgress)
	可以直接传入 3 个回调函数，分别对应 done|fail|progress 三个状态的回调，相当于这种写法的快捷方式：

	deferred.done(fnDone).fail(fnFail).progress(fnProgress)

	(10) deferred.always(fn)
	添加回调方法 fn，不管【成功】还是【失败】，都会触发 fn 方法
*/
jQuery.extend({
	/*
	① 延迟对象 deferred 有 3 种状态：成功 | 失败 | 处理中
	② 3 个 $.Callbacks 管理器，分别管理以上 3 种状态的回调队列
	*/
	Deferred: function (func) {
		var tuples = [
			// action, add listener, listener list, final state
			["resolve", "done", jQuery.Callbacks("once memory"), "resolved"],
			["reject", "fail", jQuery.Callbacks("once memory"), "rejected"],
			["notify", "progress", jQuery.Callbacks("memory")]
		],
			// 初始状态
			state = "pending",
			promise = {
				// 返回当前状态
				state: function () {
					return state;
				},
				// 不管是 done 还是 fail 都会执行的任务
				always: function () {
					deferred.done(arguments).fail(arguments);
					return this;
				},

				/*
				deferred.then(fnDone,fnFail,fnProgress) 方法是 deferred.done(fnDone).fail(fnFail).progress(fnProgress) 写法的快捷方式

				then 就是很单纯的一个方法，之所以写得比较复杂，是因为 pipe 和 then 方法共用代码，而 pipe 方法比较复杂

				看看 pipe 方法怎么用：
				(1) pipe 方法的回调函数返回普通类型的值，比如字符串

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

					// 3 秒后弹出 'hi妙味'。

					这里 pipe 和 then 一样，第一个函数参数，是【成功】的回调函数，
					另外，返回值 arguments[0] + '妙味' 作为 newDfd【成功】的回调函数的实参。

					所以以上执行过程是：
					① dfd.resolve('hi')
					② 执行 did.pipe 的 resolve 后的回调函数，返回字符串 'hi妙味'
					③ dfd.pipe 函数本身返回一个新的延迟对象 newDfd，这个延迟对象的 resolve 回调函数的实参为 'hi妙味'
					④ 自动触发新的延迟对象 newDfd 的 resolveWith 方法
					⑤ 执行 newDfd.done 指定的回调方法，参数为 'hi妙味'


				(2) pipe 方法的回调函数返回延迟对象

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

					3 秒后弹出 'hi'

					执行流程如下：
					① dfd.resolve('hi')
					② 执行 did.pipe 的 resolve 后的回调函数，返回延迟对象 dfd
					③ dfd.pipe 函数本身返回一个新的延迟对象 newDfd，这个延迟对象的 resolve 回调函数的实参为 'hi'
					④ 自动触发新的延迟对象 newDfd 的 resolve 方法
					⑤ 执行 newDfd.done 指定的回调方法，参数为 'hi'
				*/
				then: function ( /* fnDone, fnFail, fnProgress */) {
					var fns = arguments;
					/*
					return jQuery.Deferred(function(newDefer){}).promise();

					$.Deferred(func) 这种形式：
					执行函数 func，this 和实参都为 deferred，并且返回 Deferred 实例对象

					then/pipe 最后返回的是一个 promise 对象

					流程：
					① jQuery.Deferred() 会新建一个延迟对象 newDefer
					② 如果给构造方法 jQuery.Deferred 传入函数参数 jQuery.Deferred(fn)，那么这个新的延迟对象 newDefer 会作为实参传给 fn
					③ 所以，jQuery.Deferred(function(newDefer){}) 返回的就是一个新建的延迟对象 newDefer，然后将 newDefer 传给匿名函数
					② jQuery.Deferred(function(newDefer){}).promise() 即 newDefer.promise()

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
					return jQuery.Deferred(function (newDefer) {
						jQuery.each(tuples, function (i, tuple) {
							// action = "resolve" | "reject" | "notify"
							var action = tuple[0],
								/*
								① 参数是 done、fail、progress 的回调方法
									 fns[0] -> 【成功】后触发
									 fns[1] -> 【失败】后触发
									 fns[2] -> 【进行中】触发
								② 如果 fns[i] 是函数，则赋值给 fn，否则 fn 是 false
								 */
								fn = jQuery.isFunction(fns[i]) && fns[i];

							// deferred[ done | fail | progress ] for forwarding actions to newDefer
							/*
							这里如果只是定义 then 方法没必要这么复杂，只是 pipe/then 方法共用这个定义，大部分代码都是针对 pipe 函数写的

							如果单纯的实现 then 方法，只需要这么写就行了：
							deferred[ tuple[1] ](function() {
								fn.apply( this, arguments );
							});

							下面理一理 pipe 方法流程：

							(1) 给 deferred[ done | fail | progress ] 分别添加匿名回调方法，
									匿名回调方法内部的 this 最终是 fire 带过来的，谁调用 fire 方法，这个 this 就是谁
							(2) deferred[ done | fail | progress ] 的匿名回调方法分别被 deferred[ resolve | reject | notify ] 方法触发
							(3) 以【成功】为例：
								 deferred[ resolve ] 执行
								 -> deferred[ done ] 的匿名回调方法执行
								 -> returned = fns[0].apply( this, arguments )
								 a. 如果 returned.promise 是函数，说明返回值是 $.Deferred 的实例，那就：
										延迟对象 returned 【成功】后调用 newDefer.resolve
										延迟对象 returned 【失败】后调用 newDefer.reject
										延迟对象 returned 【进行中】调用 newDefer.notify
								 b. 如果 returned 就是一般的类型，那就：
										延迟对象 deferred 【成功】后调用 newDefer.resolveWith
										延迟对象 deferred 【失败】后调用 newDefer.rejectWith
										延迟对象 deferred 【进行中】调用 newDefer.notifyWith

										这里的 deferred[ resolveWith | rejectWith | notifyWith ] 方法实质就是 fireWith 方法
										fireWith 方法有两个参数，第一个参数是给回调函数的执行上下文，第二个参数是给回调函数的实参

										① 关于第一个参数 this === promise ? newDefer.promise() : this
										如果 this 是 deferred.promise，那就转交给 newDefer.promise，否则还是 deferred.promise

										② 关于第二个参数 fn ? [ returned ] : arguments
										如果 fn 是函数，那就把函数的返回值作为实参；如果 fn 不是函数，那就把 deferred[ resolve | reject | notify ] 的实参传过去
							 */
							deferred[tuple[1]](function () {
								// fn 是函数，returned 就是函数返回值（可能是 undefined，也可能是其他）
								// fn 不是函数，就是 false
								var returned = fn && fn.apply(this, arguments);
								// 如果回调返回的是一个Deferred实例
								if (returned && jQuery.isFunction(returned.promise)) {
									// 继续绑定事件
									returned.promise()
										.done(newDefer.resolve)
										.fail(newDefer.reject)
										.progress(newDefer.notify);
								} else {
									// 如果回调返回的是不是一个 Deferred 实例，则被当做 args 由 XXXWith 派发出去
									newDefer[action + "With"](this === promise ? newDefer.promise() : this, fn ? [returned] : arguments);
								}
							});
						});
						// 退出前手工设置 null 避免闭包造成的内存占用
						fns = null;
					}).promise();
				},
				// Get a promise for this deferred
				// If obj is provided, the promise aspect is added to the object
				/*
				疑问，函数里的 promise 到底是指包含这个函数的 promise 对象，还是当前的 promise 属性？

				做个试验：
				① promise 对象的 promise 属性是匿名函数
				var promise = {
					promise : function(){
						console.log(typeof promise);
					}
				};
				promise.promise()
				// 打印结果：object
				也就是说，函数里的 promise 指的是外层的对象，而不是里面的 promise 属性。确实应该这样，毕竟是属性，又不是函数名。

				② promise 对象的 promise 属性是名为 promise 的函数
				var promise = {
					promise : function promise(){
						console.log(typeof promise);
					}
				};
				promise.promise()
				// 打印结果：function
				这样写，函数里的 promise 就是指当前函数了。

				所以，下面 promise 函数的作用是：
				a. 有参数，把 promise 的属性和方法都赋值给它，然后返回这个参数
				b. 没有参数，就返回 promise
				 */
				promise: function (obj) {
					return obj != null ? jQuery.extend(obj, promise) : promise;
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

		所以，deferred 比 promise 多出 resolve、reject、notify 等三个方法，而 resolve、reject 等方法是可以修改状态的，
		所以 promise 对象外部不可以修改状态，而 deferred 外部可以修改状态（参考上面的【例子13】、【例子14】）
		 */

		// Keep pipe for back-compat
		// 两个方法共用一段代码
		promise.pipe = promise.then;

		// Add list-specific methods
		jQuery.each(tuples, function (i, tuple) {
			// list = $.callbacks("once memory");
			var list = tuple[2],
				// "resolved" | "rejected" | undefined
				stateString = tuple[3];

			// promise[ done | fail | progress ] = list.add
			/*
			promise[ "done" ] = $.Callbacks("once memory").add
			promise[ "fail" ] = $.Callbacks("once memory").add
			promise[ "progress" ] = $.Callbacks("memory").add
			*/
			promise[tuple[1]] = list.add;

			// Handle state
			if (stateString) {
				list.add(function () {
					// state = [ resolved | rejected ]
					state = stateString;

					/*
						① 这里 stateString 为真，那么 i 只能是 0 或 1，所以这里是向 doneList | failList 各添加 3 个回调函数

						② 异或 ^ : 两个二进制位不同返回 1，相同返回 0，如：
							0 ^ 1 -> (00) ^ (01) -> 1
							1 ^ 1 -> (01) ^ (01) -> 0

						总结一下：

						(1）resolve 方法会触发：
								a. state 变为 resolved
								b. 使得 failList 禁用，也就是 fail 的回调都不能执行
								c. 锁住 processList

						(2) reject 方法会触发：
								a. state 变为 rejected
								b. 使得 doneList 禁用，也就是 done 的回调都不能执行
								c. 锁住 processList

						相当于：
						doneList : [changeState, failList.disable, processList.lock]
						failList : [changeState, doneList.disable, processList.lock]

						a. changeState 改变状态的匿名函数，deferred的状态，分为三种：pending(初始状态), resolved(解决状态), rejected(拒绝状态)
						b. 不论 deferred 对象最终是 resolve（还是 reject），在首先改变对象状态之后，都会 disable 另一个函数列表 failList(或者 doneList)
						c. 然后 lock processList 保持其状态，最后执行剩下的之前 done（或者fail）进来的回调函数

						[ reject_list | resolve_list ].disable; progress_list.lock
					 */
				}, tuples[i ^ 1][2].disable, tuples[2][2].lock);
			}

			// deferred[ resolve | reject | notify ]
			deferred[tuple[0]] = function () {
				deferred[tuple[0] + "With"](this === deferred ? promise : this, arguments);
				return this;
			};
			// deferred[ resolveWith | rejectWith | notifyWith ]
			deferred[tuple[0] + "With"] = list.fireWith;
		});

		// Make the deferred a promise
		promise.promise(deferred);

		// Call given func if any
		/*
		$.Deferred(func) 这种形式：
		执行函数 func，this 和参数都为 deferred

		换句话讲：$.Deferred() 接受一个 function 参数，function 里面可以用 this 来获取 deferred 对象
		*/
		if (func) {
			func.call(deferred, deferred);
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

	② 两个延迟对象都【成功】才触发 when 的 done 回调
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

	两个延迟对象都【成功】了，才弹出 ‘成功’

	③ 只要有一个【失败】，就会触发 when 的 fail 回调
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

	有一个延迟对象 bbb() 失败了，所以弹出 ’失败‘

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

	以上都是直接弹出 ’成功‘

	⑥ 如果参数不是延迟对象，会把参数传递给 when 的 done 回调
	$.when(123,456).done(function(){
		console.log(arguments[0]);
		console.log(arguments[1]);
		alert('成功');
	}).fail(function(){
		alert('失败');
	});

	以上打印的 arguments[0]、arguments[1] 分别是 123 ，456

	⑦ 如果参数是延迟对象，会把每个延迟对象的实参和执行上下文依次传递给 when 的 done 回调
	function aaa(){
		var dfd = $.Deferred();
		dfd.resolve('aaa 中延迟对象的实参');
		return dfd;
	}
	function bbb(){
		var dfd = $.Deferred();
		dfd.resolve('bbb 中延迟对象的实参');
		return dfd;
	}
	$.when(aaa(),bbb()).done(function(){
		console.log('this:',this);
		console.log(arguments[0]);
		console.log(arguments[1]);
		alert('成功');
	});


	打印结果：
	this: (2) [Object, Object]
	”aaa 中延迟对象的实参“
	”bbb 中延迟对象的实参”

	 */

	// Deferred helper
	// 延迟对象的辅助方法
	// $.when() 返回 deferred.promise();
	when: function (subordinate /* , ..., subordinateN */) {
		var i = 0,
			// 参数转为数组
			resolveValues = core_slice.call(arguments),
			length = resolveValues.length,

			// the count of uncompleted subordinates
			/*
			注意一下运算符的优先级， || 优先级高于 ? :

			① length 不为 1，或者第一个参数是延迟对象
				 remaining 为参数个数 length
			② length 为 1，有且仅有一个参数
				 a. 若这个参数是延迟对象，那么 remaining 为 1
				 b. 若这个参数不是延迟对象，那么 remaining 为 0
			 */
			remaining = length !== 1 || (subordinate && jQuery.isFunction(subordinate.promise)) ? length : 0,

			// the master Deferred. If resolveValues consist of only a single Deferred, just use that.
			/*
			① remaining === 1
				 有且仅有一个参数 subordinate，并且这个参数是延迟对象，那么 deferred 就是这个延迟对象 subordinate
			② 其他所有情况，新建一个延迟对象，赋给 deferred
			 */
			deferred = remaining === 1 ? subordinate : jQuery.Deferred(),

			// Update function for both resolve and progress values
			// 这个方法可以收集每个延迟对象的 done|progress 的回调函数执行过程中的上下文和实参
			updateFunc = function (i, contexts, values) {
				return function (value) {
					contexts[i] = this;
					values[i] = arguments.length > 1 ? core_slice.call(arguments) : value;
					/*
					① values 要么是 progressValues，要么是 resolveValues
					② 如果有参数延迟对象的 progress 事件发生，就会触发一次 deferred.notifyWith，多个 progress 事件发生，触发多次
					③ 如果有参数延迟对象的 done 事件发生，那就执行一次 --remaining，等到 remaining 为 0 了，就触发 deferred.resolveWith
					 */
					if (values === progressValues) {
						deferred.notifyWith(contexts, values);
						// remaining 为 0，即所有的延迟对象都【成功】了，触发 master Deferred 的 resolveWith
					} else if (!(--remaining)) {
						deferred.resolveWith(contexts, values);
					}
				};
			},

			progressValues, progressContexts, resolveContexts;

		// add listeners to Deferred subordinates; treat others as resolved
		if (length > 1) {
			progressValues = new Array(length);
			progressContexts = new Array(length);
			resolveContexts = new Array(length);
			for (; i < length; i++) {
				// 当前参数是延迟对象，【成功】或者【进行中】都调用函数 updateFunc
				if (resolveValues[i] && jQuery.isFunction(resolveValues[i].promise)) {
					resolveValues[i].promise()
						/*
						① resolveValues 是 when() 的实参数组

						② done、fail、progress 等方法的参数应该是函数的定义，这里却是函数的执行，
						 这是因为 updateFunc 函数返回值就是一个新的函数

						③ 如果 when 的参数中有多个延迟对象（deferred0，deferred1，deferred2...），
						这里为每一个延迟对象用 updateFunc 方法定义动态回调函数

						比如：
						a. resolveValues[ 0 ].promise.done(updateFunc( 0, resolveContexts, resolveValues ) )
						 其中：updateFunc( 0, resolveContexts, resolveValues ) 是新生成的函数 f0

						b. 当 resolveValues[ 0 ].promise.done 事件发生后，f0 会执行

						c. f0 执行过程中会把当前的上下文和实参分别保存在 resolveContexts, resolveValues 中
						 */
						.done(updateFunc(i, resolveContexts, resolveValues))
						// 只要有一个延迟对象失败，master Deferred 就失败了
						.fail(deferred.reject)
						.progress(updateFunc(i, progressContexts, progressValues));
					// 当前参数不是延迟对象，剩余延迟对象个数直接减 1
				} else {
					--remaining;
				}
			}
		}

		// if we're not waiting on anything, resolve the master
		/*
		① 如果 when 的参数中有延迟对象，等这些延迟对象都执行完毕后，remaining 为 0，就开始执行 deferred.resolveWith

		② 这些延迟对象执行过程中会修正 resolveContexts 和 resolveValues，即修正最终 deferred 执行的回调函数的上下文和实参
		 */
		if (!remaining) {
			deferred.resolveWith(resolveContexts, resolveValues);
		}

		return deferred.promise();
	}
});


// 功能检测，并不修复兼容性
// 后面的 hooks 来修复兼容问题
/*
	jQuery.support 值其实就是一个对象 {...}
	在 chrome 下用 for-in 循环把它的值打印出来
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
jQuery.support = (function (support) {
	var input = document.createElement("input"),
		fragment = document.createDocumentFragment(),
		div = document.createElement("div"),
		select = document.createElement("select"),
		opt = select.appendChild(document.createElement("option"));

	/*
	appendChild 方法返回被添加的那个节点：eg:

	var select = document.createElement("select");
	var option =document.createElement("option");
	var node = select.appendChild(option);
	option === node
	// true
	*/

	// Finish early in limited environments
	// 基本上所有浏览器 input.type 值都默认为 "text"，所以都不会在这里就返回
	if (!input.type) {
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
	support.noCloneChecked = input.cloneNode(true).checked;

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
	input.setAttribute("checked", "t");
	input.setAttribute("name", "t");

	fragment.appendChild(input);

	// Support: Safari 5.1, Android 4.x, Android 2.3
	// old WebKit doesn't clone checked state correctly in fragments
	// 旧的 WebKit，克隆 fragment 节点，如果该节点下有 input，那么 input 的 checkd 状态不会被复制
	support.checkClone = fragment.cloneNode(true).cloneNode(true).lastChild.checked;

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
	// red

	ie 浏览器返回空，也就是说，克隆一个节点后，给新节点背景属性赋值，源节点的背景属性也被修改了

	jquery 统一了这个问题
	eg:
	var div = $('<div>');
	div.css('backgroundColor','red');
	div.clone().css('backgroundColor','');
	console.log(div.css('backgroundColor'));
	// red

	这样所有浏览器都返回 red
	*/
	div.style.backgroundClip = "content-box";
	div.cloneNode(true).style.backgroundClip = "";
	support.clearCloneStyle = div.style.backgroundClip === "content-box";

	// Run tests that need a body at doc ready
	// 剩下的检查需要在 dom 加载完成后来执行
	jQuery(function () {
		var container, marginDiv,
			// Support: Firefox, Android 2.3 (Prefixed box-sizing versions).
			divReset = "padding:0;margin:0;border:0;display:block;-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box",
			body = document.getElementsByTagName("body")[0];

		if (!body) {
			// Return for frameset docs that don't have a body
			return;
		}

		container = document.createElement("div");
		container.style.cssText = "border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px";
		// left 设置成 -9999px 是为了不让这个元素在可见范围里，影响页面功能
		// margin-top:1px 是 jQuery 老版本中检测其他属性用到的，这个版本用不上

		// Check box-sizing and margin behavior.
		body.appendChild(container).appendChild(div);
		div.innerHTML = "";
		// Support: Firefox, Android 2.3 (Prefixed box-sizing versions).
		// 怪异模式
		div.style.cssText = "-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%";

		// Workaround failing boxSizing test due to offsetWidth returning wrong value
		// with some non-1 values of body zoom, ticket #13543
		// zoom是放大页面的属性，等于1的时候，不放大也不缩小
		jQuery.swap(body, body.style.zoom != null ? { zoom: 1 } : {}, function () {
			support.boxSizing = div.offsetWidth === 4;
			// offsetWidth 包括 width + padding + border，怪异模式下就是 width
			// 怪异模式下，等于4，支持boxSizing，所有浏览器都支持
		});

		// Use window.getComputedStyle because jsdom on node.js will break without it.
		if (window.getComputedStyle) {
			// 当元素属性是百分数时，只有 Safari 返回百分数，其他浏览器都会返回像素值
			support.pixelPosition = (window.getComputedStyle(div, null) || {}).top !== "1%";
			support.boxSizingReliable = (window.getComputedStyle(div, null) || { width: "4px" }).width === "4px";
			// IE下，如果是怪异模式，width不等于4px，需要减去padding，border
			// 其他浏览器，width 都是 4px

			// Support: Android 2.3
			// Check if div with explicit width and no margin-right incorrectly
			// gets computed margin-right based on width of container. (#3333)
			// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
			marginDiv = div.appendChild(document.createElement("div"));
			marginDiv.style.cssText = div.style.cssText = divReset;
			marginDiv.style.marginRight = marginDiv.style.width = "0";
			div.style.width = "1px";

			support.reliableMarginRight =
				!parseFloat((window.getComputedStyle(marginDiv, null) || {}).marginRight);
		}

		body.removeChild(container);
	});

	return support;
})({});

/*
① attr 不合适设置大量数据
	$('#div1').attr('name','hello');
	$('#div1').attr('name')	// hello

	相当于：

	document.getElemntById('div1').setAttribute('name','hello');
	document.getElemntById('div1').getAttribute('name'); // hello

② prop 不适合设置大量数据
	$('#div1').prop('name','hello');
	$('#div1').prop('name')	// hello

	相当于：

	document.getElemntById('div1').name = 'hello';
	document.getElemntById('div1').name;	// hello

③ data 可以设置大量数据
	$('#div1').data('name','hello');
	$('#div1').data('name')	// hello

④ 内存泄漏
	不用的内存应该回收，如果不用的变量不回收，就会导致内存泄漏。

	js 中导致内存泄漏：

	【dom 元素】和【对象】之间互相引用，大部分浏览器会出现内存泄漏

	var oDiv = document.getElemntById('div1');
	var obj = {};

	oDiv.name = obj;
	obj.age = oDiv;

	$('#div1').attr('name',obj);
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
	rbrace.exec('{123}')->["{123}", index: 0, input: "{123}"]
	rbrace.exec('sas{123}') -> ["{123}", index: 3, input: "sas{123}"]
	rbrace.exec('sas[123]') -> ["[123]", index: 3, input: "sas[123]"]
	*/
	rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/,
	rmultiDash = /([A-Z])/g;

/*
① 一般情况下，对象的属性是可以随意修改的
	var obj = {name:'hello'};
	obj.name = 'hi';

	console.log(obj.name);// hi

② Object.preventExtensions/freeze 使得对象的属性不能修改
	var obj = {name:'hello'};
	Object.freeze(obj);
	obj.name = 'hi';

	console.log(obj.name);// hello

③ Object.defineProperty
	var obj = {name: 'hello'};

	Object.defineProperty( obj, 0, {
		get: function() {
			return {};
		}
	});

	console.log(obj[0]);// {}
	obj[0] = 123;
	console.log(obj[0]);// {}

	这样就为 obj 对象添加了属性 0，这个属性只能获取，因为没有 set 方法，所以不能修改

	get 或 set 不是必须成对出现，任写其一就可以。如果不设置方法，则 get 和 set 的默认值为 undefined
	当使用了 get 或 set 方法，不允许使用 writable 和 value 这两个属性
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
	Object.defineProperty(this.cache = {}, 0, {
		get: function () {
			return {};
		}
	});
	/*
	var data = new Data();
	data.cache[0] // {} 这个属性只有 get 方法，所以不能设置
	data.expando// "jQuery2030182001339212814580.7107637158134246"
	*/

	// 重复的概率很小，忽略不计，当做唯一的
	this.expando = jQuery.expando + Math.random();
}

Data.uid = 1;

Data.accepts = function (owner) {
	// Accepts only:
	//- Node
	//- Node.ELEMENT_NODE 1
	//- Node.DOCUMENT_NODE 9
	//- Object
	//- Any
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
	key: function (owner) {
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

		if (!Data.accepts(owner)) {
			return 0;
		}

		var descriptor = {},
			// Check if the owner object already has a cache key
			// 在 owner 节点上找 owner["jQuery2030182001339212814580.7107637158134246"] 属性，看是否存在
			unlock = owner[this.expando];

		// If not, create one
		// 正常情况下没有这个属性
		if (!unlock) {
			unlock = Data.uid++;

			// Secure it in a non-enumerable, non-writable property
			try {
				// 为 owner 节点添加只读的 jQuery2030182001339212814580.7107637158134246 属性
				descriptor[this.expando] = { value: unlock };
				Object.defineProperties(owner, descriptor);
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
			} catch (e) {
				descriptor[this.expando] = unlock;
				jQuery.extend(owner, descriptor);
				/*
					这种写法 jQuery2030182001339212814580.7107637158134246 属性是可以改的。
					只是某些版本浏览器不支持以上写法，所以才采取这种方法退而求其次
				 */
			}
		}

		// Ensure the cache object
		// 在 cache 中开辟一块空间给属性 unlock
		if (!this.cache[unlock]) {
			this.cache[unlock] = {};
		}

		return unlock;
	},
	set: function (owner, data, value) {
		var prop,
			// There may be an unlock assigned to this node,
			// if there is no entry for this "owner", create one inline
			// and set the unlock as though an owner entry had always existed
			unlock = this.key(owner),
			cache = this.cache[unlock];

		// Handle: [ owner, key, value ] args
		/*
			对应这种形式：
			$.data(document.body,'age','27');
		 */
		if (typeof data === "string") {
			cache[data] = value;

		// Handle: [ owner, { properties } ] args
		/*
			对应这种形式：
			$.data(document.body,{'age':'27','job':it});
		 */
		} else {
			// Fresh assignments by object are shallow copied
			if (jQuery.isEmptyObject(cache)) {
				jQuery.extend(this.cache[unlock], data);
				// Otherwise, copy the properties one-by-one to the cache object
			} else {
				for (prop in data) {
					cache[prop] = data[prop];
				}
			}
		}
		return cache;
	},
	get: function (owner, key) {
		// Either a valid cache is found, or will be created.
		// New caches will be created and the unlock returned,
		// allowing direct access to the newly created
		// empty data object. A valid owner object must be provided.
		var cache = this.cache[this.key(owner)];

		return key === undefined ?
			cache : cache[key];
	},
	access: function (owner, key, value) {
		var stored;
		// In cases where either:
		//
		// 1. No key was specified
		// 2. A string key was specified, but no value provided
		//
		// Take the "read" path and allow the get method to determine
		// which value to return, respectively either:
		//
		// 1. The entire cache object
		// 2. The data stored at the key
		//
		if (key === undefined ||
			((key && typeof key === "string") && value === undefined)) {

			stored = this.get(owner, key);

			return stored !== undefined ?
				stored : this.get(owner, jQuery.camelCase(key));
		}

		// [*]When the key is not a string, or both a key and value
		// are specified, set or extend (existing objects) with either:
		//
		// 1. An object of properties
		// 2. A key and value
		//
		this.set(owner, key, value);

		// Since the "set" path can have two possible entry points
		// return the expected data based on which path was taken[*]
		return value !== undefined ? value : key;
	},
	remove: function (owner, key) {
		var i, name, camel,
			unlock = this.key(owner),
			cache = this.cache[unlock];

		// 没有指定看key值，那 owner 对应的所有的数据都清空
		// 对应这种形式： $.removeData(document.body)
		if (key === undefined) {
			this.cache[unlock] = {};

		} else {
			// Support array or space separated string of keys
			// key 是数组
			// 对应这种形式： $.removeData(document.body,['age','job'])
			if (jQuery.isArray(key)) {
				// If "name" is an array of keys...
				// When data is initially created, via ("key", "val") signature,
				// keys will be converted to camelCase.
				// Since there is no way to tell _how_ a key was added, remove
				// both plain key and camelCase key. #12786
				// This will only penalize the array argument path.
				name = key.concat(key.map(jQuery.camelCase));
			} else {
				// 转驼峰，如 all-name -> allName
				camel = jQuery.camelCase(key);
				// Try the string as a key before any manipulation
				if (key in cache) {
					// all-name、allName 这种都要删除
					name = [key, camel];
				} else {
					// If a key with the spaces exists, use it.
					// Otherwise, create an array by matching non-whitespace
					// 先转驼峰，转完驼峰还找不到，再去掉空格再找
					name = camel;
					name = name in cache ?
						[name] : (name.match(core_rnotwhite) || []);
				}
			}

			i = name.length;
			while (i--) {
				delete cache[name[i]];
			}
		}
	},
	hasData: function (owner) {
		return !jQuery.isEmptyObject(
			this.cache[owner[this.expando]] || {}
		);
	},
	discard: function (owner) {
		if (owner[this.expando]) {
			delete this.cache[owner[this.expando]];
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
即 id 就好比是打开一个房间( DOM 节点)的钥匙。

例如：Body元素 expando：uid

jQuery203054840829130262140.37963378243148327: 3

先在 dom 元素上找到 expando 对应值，也就 uid，然后通过这个 uid 找到数据 cache 对象中的内容

所以cache对象结构应该像下面这样:

cache = {
	"uid1": { // DOM 节点 1 的缓存数据，
		"name1": value1,
		"name2": value2
	},
	"uid2": { // DOM 节点 2 的缓存数据，
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

	hasData: function (elem) {
		return data_user.hasData(elem) || data_priv.hasData(elem);
	},

	data: function (elem, name, data) {
		return data_user.access(elem, name, data);
	},

	removeData: function (elem, name) {
		data_user.remove(elem, name);
	},

	// TODO: Now that all calls to _data and _removeData have been replaced
	// with direct calls to data_priv methods, these can be deprecated.
	_data: function (elem, name, data) {
		return data_priv.access(elem, name, data);
	},

	_removeData: function (elem, name) {
		data_priv.remove(elem, name);
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

	a) $('div').html('hello');
	// 3 个 div 的内容都变成hello 了

	b) $('div').html();
	// 只返回第一个 div 的内容 aaa
 */
jQuery.fn.extend({
	data: function (key, value) {
		var attrs, name,
			elem = this[0], // 一组元素里的第一个元素
			i = 0,
			data = null;

		// Gets all values
		/*
		eg :
		$('#div1').data('name','hello');
		$('#div1').data('age',30);

		console.log($('#div1').data('name');// hello
		console.log($('#div1').data();// {name : "hello", age : 30}
		 */
		if (key === undefined) {
			if (this.length) {
				data = data_user.get(elem);// 第一个元素对于的所有数据

				/*
				html5 新属性 data-
				eg:
				<div id="div1" data-miaov="妙味">aaa</div>
				<div id="div2" data-miaov-all="全部妙味">bbb</div>

				$('#div1').get(0).dataset.miaov // 妙味
				$('#div2').get(0).dataset.miaovAll// 全部妙味

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
				if (elem.nodeType === 1 && !data_priv.get(elem, "hasDataAttrs")) {
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
					for (; i < attrs.length; i++) {
						name = attrs[i].name;

						if (name.indexOf("data-") === 0) {
							// data-miaov-allm -> miaovAll
							name = jQuery.camelCase(name.slice(5));
							// 把 data- 属性加入到 cache 中
							// data[name] 存在是有可能的，data[name] 不存在就是 undefined
							dataAttr(elem, name, data[name]);
						}
					}
					data_priv.set(elem, "hasDataAttrs", true);
				}
			}

			return data;
		}

		// Sets multiple values
		/*
		$('div').data({name:'hello',age:30})这种形式
		 */
		if (typeof key === "object") {
			// 对 $('div') 获取到的每一个 div 都进行设置操作
			return this.each(function () {
				data_user.set(this, key);
			});
		}

		return jQuery.access(this, function (value) {
			var data,
				camelKey = jQuery.camelCase(key);

			// The calling jQuery object (element matches) is not empty
			// (and therefore has an element appears at this[ 0 ]) and the
			// `value` parameter was not undefined. An empty jQuery object
			// will result in `undefined` for elem = this[ 0 ] which will
			// throw an exception if an attempt to read a data cache is made.
			// 获取
			if (elem && value === undefined) {
				// Attempt to get data from the cache
				// with the key as-is
				// 找到了直接返回
				data = data_user.get(elem, key);
				if (data !== undefined) {
					return data;
				}

				// Attempt to get data from the cache
				// with the key camelized
				// 转驼峰，找到了直接返回
				data = data_user.get(elem, camelKey);
				if (data !== undefined) {
					return data;
				}

				// Attempt to "discover" the data in
				// HTML5 custom data-* attrs
				// 找 data- 属性，找到了就返回
				data = dataAttr(elem, camelKey, undefined);
				if (data !== undefined) {
					return data;
				}

				// We tried really hard, but the data doesn't exist.
				return;
			}

			// Set the data...
			this.each(function () {
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
				var data = data_user.get(this, camelKey);

				// For HTML5 data-* attribute interop, we have to
				// store property names with dashes in a camelCase form.
				// This might not apply to all properties...*
				data_user.set(this, camelKey, value);

				// *... In the case of properties that might _actually_
				// have dashes, we need to also store a copy of that
				// unchanged property.
				if (key.indexOf("-") !== -1 && data !== undefined) {
					data_user.set(this, key, value);
				}
			});
		}, null, value, arguments.length > 1, null, true);
		// arguments.length > 1 设置操作
		// arguments.length <= 1 获取操作
	},

	removeData: function (key) {
		return this.each(function () {
			data_user.remove(this, key);
		});
	}
});

function dataAttr(elem, key, data) {
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
	if (data === undefined && elem.nodeType === 1) {
		name = "data-" + key.replace(rmultiDash, "-$1").toLowerCase();
		data = elem.getAttribute(name);

		// 属性里的值一般是字符串，但是 cache 里存各种类型的值
		if (typeof data === "string") {
			try {
				data = data === "true" ? true :
					data === "false" ? false :
						data === "null" ? null :
							// Only convert to a number if it doesn't change the string
							// 字符串数字 -> 数字，如 '100' -> 100
							+data + "" === data ? +data :
								// 字符串对象，转成真正的对象
								rbrace.test(data) ? JSON.parse(data) :
									data;

			/*
				rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/
				匹配 [xxx] 或 {xxx} 结尾
				eg:
				rbrace.exec('{123}')->["{123}", index: 0, input: "{123}"]
				rbrace.exec('sas{123}') -> ["{123}", index: 3, input: "sas{123}"]
				rbrace.exec('sas[123]') -> ["[123]", index: 3, input: "sas[123]"]
			 */
			} catch (e) { }

			// Make sure we set the data so it isn't changed later
			data_user.set(elem, key, data);
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

	在 document 元素上建立名为 q1 的队列，然后把 aaa、bbb 方法分别加入到队列里

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
	$(document).dequeue('q1');// aaa() -> 打印 1
	$(document).dequeue('q1');// bbb() -> 打印 2

⑤ 动画
	#div1 { width:100px; height:100px; background:red; position:absolute;}

	$('#div1').click(function(){
		$(this).animate({width:300},2000);其实是调用 setInterval
		$(this).animate({height:300},2000); 其实是调用 setInterval
		$(this).animate({left:300},2000); 其实是调用 setInterval
	});

	先花 2 秒宽度变成 300px，然后花 2 秒高度变成 300px，最后花 2 秒向右移动 300px

	一般情况下我们用以上 3 个定时器，不会按照顺序依次执行，肯定会串的，
	而这里的动画确实做到了前一个动画执行完，才开始后一个动画，这种顺序性就是队列机制来保证的

⑥ 入队，出队，animate
	$('#div1').click(function(){
		$(this).animate({width:300},2000).queue('fx',function(){
			$(this).dequeue(); // dequeue 方法没写实参，默认是 'fx'
		}).animate({left:300},2000);
	});

	这个动画队列内部使用的名字就是 fx，中间的入队函数的必须要调用 dequeue 出队，否则后面的动画不会执行。

	以上写法相当于：

	$('#div1').click(function(){
		$(this).animate({width:300},2000).queue('fx',function(next){
			next();
		}).animate({left:300},2000);
	});
 */

jQuery.extend({
	/*
	queue 入队，相当于数组的 push 方法

	这个方法既是 setter 又是 getter
	第一个参数是 dom 元素；
	第二个参数是队列名称；
	第三个参数是 function 或 function 组成的数组

	若是三个参数，就是入队；若是两个参数，就是获取队列

	注意，若第三个参数是数组，就会重置整个队列
	*/
	queue: function (elem, type, data) {
		var queue;

		if (elem) {
			// 默认的队列名称是 fx
			type = (type || "fx") + "queue";
			queue = data_priv.get(elem, type);

			// Speed up dequeue by getting out quickly if this is just a lookup
			if (data) {
				if (!queue || jQuery.isArray(data)) {
					/*
					一般情况下，第一次取不到队列属性（即 queue 为 undefined）,会初始化一个队列 queue

					可是，为什么 data 是数组也走这里初始化队列呢？

					$.queue(document, 'q1', aaa);
					$.queue(document, 'q1', [bbb]);

					console.log($.queue(document, 'q1'))
					// [bbb]

					这说明，如果第三个参数是数组时，不管队列在前面存了什么，都重新初始化

					另外，jQuery.makeArray(data) 确保了 queue 一定是个数组，所以下面可以用 push 方法
					 */
					queue = data_priv.access(elem, type, jQuery.makeArray(data));
				} else {
					queue.push(data);
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
	/*
	dequeue 出队，相当于数组的 shift 方法
	上边的例子中，我们出队时都是调用 dequeue 方法，每次需要出队，就主动调用一次 dequeue
	也就是说，上边出队多少次，我们就调用了多少次 dequeue 方法

	如果我们想要调用一次 dequeue，然后执行多次出队操作，就得靠下面的 next 方法
	也就是说，第一个方法调用时，主动调用一次 next 方法，就可以触发下一次出队了
	如果每个方法调用时，都主动触发 next 方法，那就把整个队列串起来了，整个队列执行一次 dequeue 就可以出队所有
	*/
	dequeue: function (elem, type) {
		type = type || "fx";

		// queue 只有 2 个参数，返回队列 queue
		var queue = jQuery.queue(elem, type),
			startLength = queue.length,
			// 队头的函数
			fn = queue.shift(),
			hooks = jQuery._queueHooks(elem, type),
			next = function () {
				jQuery.dequeue(elem, type);
			};

		// If the fx queue is dequeued, always remove the progress sentinel
		if (fn === "inprogress") {
			fn = queue.shift();
			startLength--;
		}

		if (fn) {

			// Add a progress sentinel to prevent the fx queue from being
			// automatically dequeued
			if (type === "fx") {
				// 如果是队列名是 fx,把 inprogress 加入到队头
				queue.unshift("inprogress");
			}

			// clear up the last queue stop function
			delete hooks.stop;
			// next 方法作为 fn 的实参
			fn.call(elem, next, hooks);
			/*
			例：
			var body = $('body');
			function cb1(next,hooks) {
				console.log(11111)
				next()
			}

			function cb2() {
				console.log(22222)
			}

			// set
			$.queue(body, 'aa', cb1); // 第三个参数为function
			$.queue(body, 'aa', cb2);

			$.dequeue(body, 'aa');
			// 依次打印 11111、22222
			*/
		}

		// 所有的元素都出队了，清理缓存数据
		if (!startLength && hooks) {
			hooks.empty.fire();
		}
	},

	// not intended for public consumption - generates a queueHooks object, or returns the current one
	// 出队结束后，清除队列缓存数据
	_queueHooks: function (elem, type) {
		var key = type + "queueHooks";
		/*
		① 第一次执行这个 _queueHooks 方法，data_priv.get( elem, key ) 为 undefined，所以用 data_priv.access() 初始化；
		② 以后再执行这个 _queueHooks 方法，data_priv.get( elem, key ) 就可以取出值了。
		*/
		return data_priv.get(elem, key) || data_priv.access(elem, key, {
			empty: jQuery.Callbacks("once memory").add(function () {
				data_priv.remove(elem, [type + "queue", key]);
			})
		});
		/*
		access 方法进行设置的时候，返回的是第三个参数，所以：
		第一次进来，_queueHooks 函数的返回值是：
		{
			empty: jQuery.Callbacks("once memory").add(function() {
				data_priv.remove( elem, [ type + "queue", key ] );
			})
		}
		empty 是一个回调对象，并且添加了一个回调函数
		回调对象 fire() 的时候把 type + "queue"、type + "queueHooks" 两个属性都删掉
		*/
	}
});


jQuery.fn.extend({
	/*
	① 如果队列名 type 不为 fx，只是入队
	② 如果队列名 type 为 fx，并且对头不是 "inprogress"，那么入队后马上出队
	*/
	queue: function (type, data) {
		var setter = 2;

		// $('div').queue(funtion(){}) 这种一个参数形式
		if (typeof type !== "string") {
			data = type;
			type = "fx";
			setter--;
		}

		// 获取 this 的第一个元素对应的队列
		if (arguments.length < setter) {
			return jQuery.queue(this[0], type);
		}

		return data === undefined ?
			this :
			// 入队
			this.each(function () {
				var queue = jQuery.queue(this, type, data);

				// ensure a hooks for this queue
				// 每一个单独的元素都给一个钩子，将来清理缓存数据用
				jQuery._queueHooks(this, type);

				/*
				$(this).animate({width:300},2000);
				$(this).animate({height:300},2000);
				$(this).animate({left:300},2000);

				这里的动画会依次执行，其实就是一个队列 fx

				为什么这里添加动画后就可以立即执行动画呢？
				其实，就是【入队】后马上进行【出队】

				也就是下面的，队列名为 fx，并且队头元素不是 inprogress，就出队

				另外，每个 animate 方法还触发 next 方法，就可以使得所有动画连续起来
				 */

				if (type === "fx" && queue[0] !== "inprogress") {
					jQuery.dequeue(this, type);
				}
			});
	},
	dequeue: function (type) {
		return this.each(function () {
			jQuery.dequeue(this, type);
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
	 */
	delay: function (time, type) {
		/*
		jQuery.fx.speeds = {
			slow : 600,
			fast : 200,
			_default : 400
		};

		time 为 'slow'，相当于延迟 600 毫秒
		*/
		time = jQuery.fx ? jQuery.fx.speeds[time] || time : time;
		type = type || "fx";

		// 延迟 time 执行下一个出队
		return this.queue(type, function (next, hooks) {
			var timeout = setTimeout(next, time);
			hooks.stop = function () {
				clearTimeout(timeout);
			};
			// 后面的 animate 方法中会调用 hooks.stop 方法
		});
	},
	/*
	前面说到，只要参数 jQuery.queue ( elem, type, data ) 第三个参数为数组，就会重置这个队列
	清空队列，即把队列变成空数组
	*/
	clearQueue: function (type) {
		return this.queue(type || "fx", []);
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
	promise: function (type, obj) {
		var tmp,
			count = 1,
			defer = jQuery.Deferred(),
			elements = this,
			i = this.length,
			resolve = function () {
				if (!(--count)) {
					defer.resolveWith(elements, [elements]);
				}
			};

		// 例如 $('div').promise(obj)
		if (typeof type !== "string") {
			obj = type;
			type = undefined;
		}
		type = type || "fx";

		while (i--) {
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
			tmp = data_priv.get(elements[i], type + "queueHooks");
			if (tmp && tmp.empty) {
				count++;
				tmp.empty.add(resolve);
			}
		}
		resolve();
		// 返回一个 promise 对象
		return defer.promise(obj);
	}
});

/*
① attr() 获取匹配的元素集合中的第一个元素的属性的值 或 设置每一个匹配元素的一个或多个属性。
② prop() 获取匹配的元素集中第一个元素的属性（property）值 或 设置每一个匹配元素的一个或多个属性。
③ removeAttr() 为匹配的元素集合中的每个元素中移除一个属性（attribute）。
④ removeProp() 为集合中匹配的元素删除一个属性（property）。
⑤ val() 获取匹配的元素集合中第一个元素的当前值 或 设置匹配的元素集合中每个元素的值

那么 attribute 和 property 有什么区别呢？

例：
<input id="cbox" type="checkbox" checked="checked" />

$('input').attr('checked') // checked
$('input').prop('checked') // true

attr() 方法读取直接写在标签上的属性（attribute），可以通过 setAttribute、getAttribute 进行设置、读取
prop() 方法是通过 . 号来进行设置、读取的属性（property）

换个角度看：
var cbox = document.getElementById('cbox');

① 对应 attr 方法
	cbox.getAttribute('checked')// checked

② 对应 prop 方法
	cbox['checked'] // true
	cbox.checked// true

③ 获取 id
	$('input').attr('id') // cbox
	$('input').prop('id') // cbox

	cbox.getAttribute('id') // cbox
	cbox.id // cbox
	cbox['id']// cbox

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

	$('input').attr('miaov') // 妙味
	$('input').prop('miaov'）// （获取不到值，大多数浏览器都返回空）

⑥ 删除属性
	<input id="cbox" miaov="妙味" type="checkbox" checked="checked" />

	$('input').removeAttr('id') 可以删除 id 属性
	$('input').removeProp('id') 删除不了 id 属性

	总的来说：
	基本可以总结为 attribute 节点都是在 HTML 代码中可见的，
	而 property 只是一个普通的键值对属性
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
	attr: function (name, value) {
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
		return jQuery.access(this, jQuery.attr, name, value, arguments.length > 1);
	},

	removeAttr: function (name) {
		return this.each(function () {
			jQuery.removeAttr(this, name);
		});
	},

	prop: function (name, value) {
		return jQuery.access(this, jQuery.prop, name, value, arguments.length > 1);
	},

	removeProp: function (name) {
		return this.each(function () {
			// prop 是对象的属性，可以直接通过 [] 或 . 运算符取到
			delete this[jQuery.propFix[name] || name];
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
	addClass: function (value) {
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
		if (jQuery.isFunction(value)) {
			return this.each(function (j) {
				jQuery(this).addClass(value.call(this, j, this.className));
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
		if (proceed) {
			// The disjunction here is for better compressibility (see removeClass)
			/*
			匹配任意不是空白的字符：
			core_rnotwhite = /\S+/g

			eg:
			"selected highlight".match(/\S+/g)
			// ["selected", "highlight"]
			*/
			classes = (value || "").match(core_rnotwhite) || [];

			for (; i < len; i++) {
				elem = this[i];
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
				// ""
				*/
				cur = elem.nodeType === 1 && (elem.className ?
					(" " + elem.className + " ").replace(rclass, " ") :
					" "
				);

				/*
				原来没有 class 这里 cur 会为 true 吗？会！！
				!! ""
				// true

				所以说，elem.nodeType === 1 并且参数 value 是字符串就会走这里
				*/
				// 这里要求 cur 为真，其实是要求 elem.nodeType === 1，元素类型为标签节点
				if (cur) {
					j = 0;
					// 遍历 classes 数组：["selected", "highlight"]
					while ((clazz = classes[j++])) {
						// < 0 就是原来没这个 class，那就把它加进来
						// 前后有空格，很好的避免了新的 class 是原 class 字符串的子串的情况
						if (cur.indexOf(" " + clazz + " ") < 0) {
							cur += clazz + " ";
						}
					}
					// 最后，去掉前后空格
					elem.className = jQuery.trim(cur);
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
	removeClass: function (value) {
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
		if (jQuery.isFunction(value)) {
			return this.each(function (j) {
				jQuery(this).removeClass(value.call(this, j, this.className));
			});
		}

		// proceed 为真，说明
		if (proceed) {
			/*
			匹配任意不是空白的字符：
			core_rnotwhite = /\S+/g

			eg:
			"selected highlight".match(/\S+/g)
			// ["selected", "highlight"]
			*/
			classes = (value || "").match(core_rnotwhite) || [];

			for (; i < len; i++) {
				elem = this[i];
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
				// ""
				*/
				cur = elem.nodeType === 1 && (elem.className ?
					(" " + elem.className + " ").replace(rclass, " ") :
					""
				);

				// 如果 cur 不为真，说明 elem.nodeType !== 1 或者说原来就没有 class，那就没必要继续了
				if (cur) {
					j = 0;
					while ((clazz = classes[j++])) {
						// Remove *all* instances
						// class 存在，则删除之
						while (cur.indexOf(" " + clazz + " ") >= 0) {
							cur = cur.replace(" " + clazz + " ", " ");
						}
					}
					// 如果不传参数 value，也就是 undefined，那就清空 class
					elem.className = value ? jQuery.trim(cur) : "";
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
	toggleClass: function (value, stateVal) {
		var type = typeof value;

		// 如果第一个参数是字符串，并且第二个参数是布尔值
		if (typeof stateVal === "boolean" && type === "string") {
			// 第二个参数为 stateVal 为 true 添加 class；stateVal 为 false 删除 class
			return stateVal ? this.addClass(value) : this.removeClass(value);
		}

		/*
		如果第一个参数是函数，递归调用
		value.call(this, i, this.className, stateVal) 会返回一个 class 值
		*/
		if (jQuery.isFunction(value)) {
			return this.each(function (i) {
				jQuery(this).toggleClass(value.call(this, i, this.className, stateVal), stateVal);
			});
		}

		return this.each(function () {
			// 第一个参数为字符串，第二个参数不是布尔值，或者根本没有第二个参数
			if (type === "string") {
				// toggle individual class names
				var className,
					i = 0,
					self = jQuery(this),
					classNames = value.match(core_rnotwhite) || [];
				/*
					"selected highlight".match(/\S+/g)
					// ["selected", "highlight"]
				*/

				while ((className = classNames[i++])) {
					// check each className given, space separated list
					// 遍历 ["selected", "highlight"] 数组
					// 有这个 class 就删除之；没有这个 class 就加上
					if (self.hasClass(className)) {
						self.removeClass(className);
					} else {
						self.addClass(className);
					}
				}

				// Toggle whole class name
				// 参数为【空】，或【undefined】或【布尔值】
			} else if (type === core_strundefined || type === "boolean") {
				// 把原来的 class 存起来
				if (this.className) {
					// store className if set
					data_priv.set(this, "__className__", this.className);
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
				this.className = this.className || value === false ? "" : data_priv.get(this, "__className__") || "";
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
	hasClass: function (selector) {
		// selector 前后加空格是为了避免 selector 是原来 className 子串的情况
		var className = " " + selector + " ",
			i = 0,
			l = this.length;
		for (; i < l; i++) {
			/*
					rclass = /[\t\r\n\f]/g

					把节点原来的 class 名前后加上空格，方便添加新的 class
					( " " + 'cls' + " " ).replace( /[\t\r\n\f]/g, " " )
					// " cls "

					另外，如果原来就没有 class
					( " " + '' + " " ).replace( /[\t\r\n\f]/g, " " )
					// ""
			*/
			// 遍历一组元素，只要有一个元素找到了，就返回 true
			if (this[i].nodeType === 1 && (" " + this[i].className + " ").replace(rclass, " ").indexOf(className) >= 0) {
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
	val: function (value) {
		var hooks, ret, isFunction,
			elem = this[0];

		// 参数为空，获取 value
		if (!arguments.length) {
			if (elem) {
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
				$('div')[0].type// undefined
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
				hooks = jQuery.valHooks[elem.type] || jQuery.valHooks[elem.nodeName.toLowerCase()];

				// 部分需要兼容 select、option 的元素在这里取完就返回了
				if (hooks && "get" in hooks && (ret = hooks.get(elem, "value")) !== undefined) {
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

		isFunction = jQuery.isFunction(value);

		return this.each(function (i) {
			var val;

			// 不是元素类型，直接返回
			if (this.nodeType !== 1) {
				return;
			}

			// 参数是函数
			if (isFunction) {
				// 得到一个新的 value 值，其中 jQuery( this ).val()是原来的 value 值
				val = value.call(this, i, jQuery(this).val());
			} else {
				val = value;
			}

			// Treat null/undefined as ""; convert numbers to string
			// undefined | null -> ""
			if (val == null) {
				val = "";
				// 数字转化为字符串
			} else if (typeof val === "number") {
				val += "";
				// 对数组的每一项转成字符串
			} else if (jQuery.isArray(val)) {
				val = jQuery.map(val, function (value) {
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
			hooks = jQuery.valHooks[this.type] || jQuery.valHooks[this.nodeName.toLowerCase()];

			// If set returns undefined, fall back to normal setting
			if (!hooks || !("set" in hooks) || hooks.set(this, val, "value") === undefined) {
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
			} else if (curExaminee.fatherName === '小刚') {
				ret += 100;
			} else if (curExaminee.fatherName === '小华') {
				ret += 50;
			}
			result[curExaminee.name] = ret;
		}
		return result;
	}


	var lihao = examinee("lihao", 10, '小刚');
	var xida = examinee('xida', 8, '小明');
	var peng = examinee('peng', 60, '小华');
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
		"小明": 1000,
		"小刚": 100,
		"小华": 50,
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


	var lihao = examinee("lihao", 10, '小刚');
	var xida = examinee('xida', 8, '小明');
	var peng = examinee('peng', 60, '小华');
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
			get: function (elem) {
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
			get: function (elem) {
				var value, option,
					options = elem.options, //[option, option, option, selectedIndex: 1]
					index = elem.selectedIndex, // 1
					one = elem.type === "select-one" || index < 0, // false 单选还是多选
					values = one ? null : [],	// [] 单选下拉的时候值只有一个，多选下拉值是一组
					max = one ? index + 1 : options.length, // 3
					i = index < 0 ?
						max :
						one ? index : 0; // 0

				// Loop through all the selected options
				// 遍历所有选中的 option
				for (; i < max; i++) {
					option = options[i];

					// IE6-9 doesn't update selected after form reset (#2551)
					// 确保当前 option 被选中了
					if ((option.selected || i === index) &&
						// Don't return options that are disabled or in a disabled optgroup
						// 确保 option 没有 disabled，并且父节点也不能 disabled，父节点也不能是 optgroup
						(jQuery.support.optDisabled ? !option.disabled : option.getAttribute("disabled") === null) &&
						(!option.parentNode.disabled || !jQuery.nodeName(option.parentNode, "optgroup"))) {

						// Get the specific value for the option
						// 获取每一个 option 的 value
						value = jQuery(option).val();

						// We don't need an array for one selects
						if (one) {
							return value;
						}

						// Multi-Selects return an array
						// Multi-Selects 返回一个数组
						values.push(value);
					}
				}

				return values;
			},

			// value 和某个option 匹配上了，就选中了那个 option
			set: function (elem, value) {
				var optionSet, option,
					options = elem.options,
					values = jQuery.makeArray(value),
					i = options.length;

				while (i--) {
					option = options[i];
					/*
					option.selected 的值被设为 true 或 false
					如果某个 option 的值 jQuery(option).val() 就是我们要设置的 values 这个数组里
					那么，这个 option.selected 就是 true
					*/
					if ((option.selected = jQuery.inArray(jQuery(option).val(), values) >= 0)) {
						optionSet = true;
					}
				}

				// force browsers to behave consistently when non-matching value is set
				// 如果一个都没有匹配到，将 selectedIndex 强制改成 -1
				if (!optionSet) {
					elem.selectedIndex = -1;
				}
				return values;
			}
		}
	},

	attr: function (elem, name, value) {
		var hooks, ret,
			nType = elem.nodeType;

		// don't get/set attributes on text, comment and attribute nodes
		// 节点不存在，或者节点类型是【文本】、【注释】、【属性】，那就返回，其实相当于返回 undefined
		if (!elem || nType === 3 || nType === 8 || nType === 2) {
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
		if (typeof elem.getAttribute === core_strundefined) {
			return jQuery.prop(elem, name, value);
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
		// 获取钩子方法，解决针对某种属性的【设置/获取】兼容问题
		// 类型不为元素节点，或者不是 xml 节点
		if (nType !== 1 || !jQuery.isXMLDoc(elem)) {
			name = name.toLowerCase();
			hooks = jQuery.attrHooks[name] ||
				(jQuery.expr.match.bool.test(name) ? boolHook : nodeHook);
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
		if (value !== undefined) {

			// 参数为 null，会删掉这个属性
			if (value === null) {
				jQuery.removeAttr(elem, name);

				// hooks 解决 set 有兼容性问题的属性，如 type 属性有 set 兼容问题
			} else if (hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== undefined) {
				return ret;
				// 没有兼容问题，就调用 setAttribute 就好了，这里还把待设置的值强制转换成字符串
			} else {
				elem.setAttribute(name, value + "");
				return value;
			}
			// 没有第三个参数，进行读取操作，先看有没有需要有兼容问题
		} else if (hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null) {
			return ret;
			// 没有兼容问题
		} else {
			// jQuery.find = Sizzle
			// Sizzle.attr() 已经实现了获取属性这个方法，这里直接用
			ret = jQuery.find.attr(elem, name);

			// Non-existent attributes return null, we normalize to undefined
			return ret == null ?
				undefined :
				ret;
		}
	},

	removeAttr: function (elem, value) {
		var name, propName,
			i = 0,
			attrNames = value && value.match(core_rnotwhite);
		/*
			var core_rnotwhite = /\S+/g;

			"selected highlight".match(/\S+/g)
			// ["selected", "highlight"]

			如果这里的 value 不是字符串，果断报错！
		*/

		// 获取到了 attribute 名，并且是元素
		if (attrNames && elem.nodeType === 1) {
			while ((name = attrNames[i++])) {
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
				propName = jQuery.propFix[name] || name;

				// Boolean attributes get special treatment (#10870)
				/*
				jQuery.expr.match.bool :
				/^(?:checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped)$/i

				这种值为布尔值的属性区别对待
				*/
				if (jQuery.expr.match.bool.test(name)) {
					// Set corresponding property to false
					elem[propName] = false;
				}

				// 一般情况下，直接调用原生的 removeAttribute 方法
				elem.removeAttribute(name);
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
			set: function (elem, value) {
				// 有 support.radioValue 兼容性问题，并且要设置 input 元素的 type 为 radio
				if (!jQuery.support.radioValue && value === "radio" && jQuery.nodeName(elem, "input")) {
					// Setting the type on a radio button after the value resets the value in IE6-9
					// Reset value to default in case type is set after value during creation

					// 先存下原来的 input.value 值
					var val = elem.value;
					// 设置 input.type = "radio";
					elem.setAttribute("type", value);

					// 如果原来是有 input.value 值，重新赋值回去，以免上边的操作修改了 value 属性值
					if (val) {
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

	prop: function (elem, name, value) {
		var ret, hooks, notxml,
			nType = elem.nodeType;

		// don't get/set properties on text, comment and attribute nodes
		// 文本，注释，属性等节点类型直接返回（undefined）
		if (!elem || nType === 3 || nType === 8 || nType === 2) {
			return;
		}

		// 不是 xml
		notxml = nType !== 1 || !jQuery.isXMLDoc(elem);

		if (notxml) {
			// Fix name and attach hooks
			/*
			先修正属性名，然后去 hooks 里匹配
			propHooks: {
				tabIndex: {
					get: function( elem ) {}
				}
			}
			*/
			name = jQuery.propFix[name] || name;
			hooks = jQuery.propHooks[name];
		}

		// 设置 prop，一般情况下：elem[ name ] = value
		if (value !== undefined) {
			return hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== undefined ?
				ret :
				(elem[name] = value);
			// 获取 prop，一般情况下：elem[ name ]
		} else {
			return hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null ?
				ret :
				elem[name];
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
	只要在获取 option 的 selected 的值时，先访问 select.selectedIndex 属性，就可以设置 option.selected = true 了。
	意思就是在访问 option 的 selected 属性时，先访问其父级 select 元素的 selectedIndex 属性，
	强迫浏览器计算 option 的 selected 属性，以得到正确的值。
	需要注意的是 option 元素的父元素不一定是 select，也有可能是 optgroup。
	这里是支持 IE9+，所以 option 的 parentNode 是 optgroup，optgroup 的 parentNode是select。
	 */
	propHooks: {
		// tab 键获取焦点顺序
		tabIndex: {
			get: function (elem) {
				/*
				rfocusable = /^(?:input|select|textarea|button)$/i;

				rfocusable.test('input') // true

				【input|select|textarea|button 等标签或带有 tabindex、href 等属性的元素】，取其 tabIndex 属性

				换个角度想：能获取焦点的，一定是用鼠标点击有效果的交互元素
				*/
				return elem.hasAttribute("tabindex") || rfocusable.test(elem.nodeName) || elem.href ?
					elem.tabIndex :
					-1;
			}
		}
	}
});

// Hooks for boolean attributes
// 解决设置【值为布尔值的属性】的时候的兼容问题
boolHook = {
	set: function (elem, value, name) {
		if (value === false) {
			// Remove boolean attributes when set to false
			jQuery.removeAttr(elem, name);
		} else {
			elem.setAttribute(name, name);
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
jQuery.each(jQuery.expr.match.bool.source.match(/\w+/g), function (i, name) {
	var getter = jQuery.expr.attrHandle[name] || jQuery.find.attr;

	// 重新定义 jQuery.expr.attrHandle[ name ] 方法
	jQuery.expr.attrHandle[name] = function (elem, name, isXML) {
		// 暂存 jQuery.expr.attrHandle[ name ]
		var fn = jQuery.expr.attrHandle[name],
			ret = isXML ?
				undefined :
				/* jshint eqeqeq: false */
				// Temporarily disable this handler to check existence
				/*
				这里需要短暂的把 jQuery.expr.attrHandle[ name ] 方法置为 undefined，
				是因为 jQuery.find.attr 会调用 jQuery.expr.attrHandle[ name ]
				*/
				(jQuery.expr.attrHandle[name] = undefined) !=
					getter(elem, name, isXML) ?

					name.toLowerCase() :
					null;

		// Restore handler
		// 恢复 jQuery.expr.attrHandle[ name ]
		jQuery.expr.attrHandle[name] = fn;

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
if (!jQuery.support.optSelected) {
	jQuery.propHooks.selected = {
		get: function (elem) {
			var parent = elem.parentNode;
			if (parent && parent.parentNode) {
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
], function () {
	jQuery.propFix[this.toLowerCase()] = this;
});

// Radios and checkboxes getter/setter
// 兼容 radio、checkbox 的设置和获取
jQuery.each(["radio", "checkbox"], function () {
	jQuery.valHooks[this] = {
		set: function (elem, value) {
			// 如果 value 值和【单选框|复选框】的值匹配上了，则选中该【单选框|复选框】
			if (jQuery.isArray(value)) {
				return (elem.checked = jQuery.inArray(jQuery(elem).val(), value) >= 0);
			}
		}
	};
	if (!jQuery.support.checkOn) {
		jQuery.valHooks[this].get = function (elem) {
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
	} catch (err) { }
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
-> jQuery.event.add 给选中元素注册事件处理程序
-> jQuery.event.dispatch分派（执行）事件处理函数
-> jQuery.event.fix 修正 Event 对象
-> jQuery.event.handlers组装事件处理器队列
-> 执行事件处理函数

jQuery 还做了以下工作：
（1）兼容问题处理
	① 事件对象的获取兼容，IE 的 event 在全局的 window 对象下，标准的 event 是作为事件源参数传入到回调函数中
	② 目标对象的获取兼容，IE 中采用 event.srcElement，标准是 event.target
	③ relatedTarget 只是对于 mouseout、mouseover 有用。在 IE 中分成了 to 和 from 两个 Target 变量，在 mozilla 中没有分开。为了保证兼容，采用 relatedTarget 统一起来
	④ event 的坐标位置兼容
	...

（2）事件的存储优化
	jQuery 并没有将事件处理函数直接绑定到DOM元素上，
	而是通过 .data 存储在缓存 .data 存储在缓存 .cahce 上，
	这里就是之前分析的贯穿整个体系的缓存系统了

	① 声明绑定的时候：
	首先为 DOM 元素分配一个唯一 ID，绑定的事件存储在
	.cahce[唯一ID][.expand ][ 'events' ]上，
	而 events 是个键-值映射对象，键就是事件类型，对应的值就是由事件处理函数组成的数组，
	最后在 DOM 元素上绑定（addEventListener/ attachEvent）一个事件处理函数 eventHandle，
	这个过程由 jQuery.event.add 实现。

	② 执行绑定的时候：
	当事件触发时eventHandle被执行，
	eventHandle再去$.cache中寻找曾经绑定的事件处理函数并执行，
	这个过程由 jQuery.event.trigger 和 jQuery.event.handle实现。

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
	add: function (elem, types, handler, data, selector) {

		var handleObjIn, eventHandle, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = data_priv.get(elem);
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
		if (!elemData) {
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
		if (handler.handler) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
			selector = handleObjIn.selector;
		}

		// Make sure that the handler has a unique ID, used to find/remove it later
		// 给 handler 事件处理函数添加一个唯一的 id
		if (!handler.guid) {
			handler.guid = jQuery.guid++;
		}

		// Init the element's event structure and main handler, if this is the first
		// 如果 elemData 没有 events 属性，初始化一个空对象
		if (!(events = elemData.events)) {
			events = elemData.events = {};
		}

		/*
		如果 elemData 没有 handle 属性，把一个函数赋值给它
		这个 handle 属性指向一个函数，
		这个函数就是实际上绑定在 dom 节点上的唯一处理函数！这很重要！
		每次触发事件，实际只执行这一个函数，
		而这个函数封装了 dispatch 函数，最终分发给每一个实际处理函数。
		*/
		if (!(eventHandle = elemData.handle)) {
			eventHandle = elemData.handle = function (e) {
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

				而trigger 方法又会遍历【该元素及其祖先元素】，
				然后依次在【该元素及其祖先元素】上调用 handle.apply( cur, data )
				而 handle 会调用 dispatch ，然后执行回调函数

				那么问题就来了，刚才执行默认事件之前已经把以上的冒泡过程执行了一遍

				所以，这次就不应该再执行了
				也就是当 jQuery.event.triggered === e.type 时，就不能再执行 dispatch 了

				等 click() 执行完了，又会重新赋值 jQuery.event.triggered = undefined
				后面又可以用 handle 来调用 dispatch 了
				*/
				return typeof jQuery !== core_strundefined && (!e || jQuery.event.triggered !== e.type) ?
					jQuery.event.dispatch.apply(eventHandle.elem, arguments) :
					undefined;
			};
			// Add elem as a property of the handle fn to prevent a memory leak with IE non-native events
			eventHandle.elem = elem;
		}

		// Handle multiple events separated by a space
		/*
		core_rnotwhite = /\S+/g

		多个事件合在一个字符串里拆开：
		"click mouseover".match(/\S+/g) ->["click", "mouseover"]
		*/
		types = (types || "").match(core_rnotwhite) || [""];
		t = types.length;
		while (t--) {
			/*
			namespace 命名空间机制。该可以对事件进行更为精细的控制，
			开发人员可以指定特定空间的事件，删除特定命名空间的事件，
			以及触发特定命名空间的事件。

			rtypenamespace = /^([^.]*)(?:\.(.+)|)$/;
			匹配命名空间，把事件和它的命名空间区分开

			① rtypenamespace.exec("keydown.myPlugin.plugin")
			-> ["keydown.myPlugin.plugin", "keydown", "myPlugin.plugin", index: 0, input: "keydown.myPlugin.plugin"]
			*/
			tmp = rtypenamespace.exec(types[t]) || [];
			type = origType = tmp[1];
			/*
			(1) type 事件：
			"keydown"

			(2) namespaces 命名空间组：
			"myPlugin.plugin".split( "." ).sort() -> ["myPlugin", "plugin"]
			*/
			namespaces = (tmp[2] || "").split(".").sort();

			// There *must* be a type, no attaching namespace-only handlers
			// type 为 undefined，跳出本次循环，不注册没事件名的事件
			if (!type) {
				continue;
			}

			// If event changes its type, use the special event handlers for the changed type
			special = jQuery.event.special[type] || {};
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
			type = (selector ? special.delegateType : special.bindType) || type;

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
					special ={
						setup: function,
						teardown: function
					}
			*/
			special = jQuery.event.special[type] || {};

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
				needsContext: selector && jQuery.expr.match.needsContext.test(selector),
				namespace: namespaces.join(".")
			}, handleObjIn);
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
			if (!(handlers = events[type])) {
				handlers = events[type] = [];
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
				if (!special.setup || special.setup.call(elem, data, namespaces, eventHandle) === false) {
					if (elem.addEventListener) {
						/*
						① 绑定事件，注意这里的 useCapture 是 false，在冒泡阶段触发
						② 默认的触发循序是从事件源目标元素也就是 event.target 指定的元素，
							 一直往上冒泡到 document 或者 body，途经的元素上如果有对应的事件都会被依次触发。
						*/
						elem.addEventListener(type, eventHandle, false);
					}
				}
			}

			// 貌似所有的 special 都没有 add 方法
			if (special.add) {
				special.add.call(elem, handleObj);

				if (!handleObj.handler.guid) {
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
			if (selector) {
				handlers.splice(handlers.delegateCount++, 0, handleObj);
			} else {
				handlers.push(handleObj);
			}
			/*
			总结一下：
			如果 type 这个事件从没出现过时，把 eventHandle 函数通过 addEventListener 注册到元素上。
			如果已经有 handlers，那么说明 eventHandle 已经注册过，无需再次注册，
			把含有事件处理函数的对象 handleObj 推入到数组即可。

			每次绑定的核心就是把 handleObj 对象添加到事件类型 type 对应的 events[type] 上。
			*/

			// Keep track of which events have ever been used, for event optimization
			jQuery.event.global[type] = true;
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
	remove: function (elem, types, handler, selector, mappedTypes) {

		var j, origCount, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = data_priv.hasData(elem) && data_priv.get(elem);

		// elemData 没数据或者没事件数据，直接返回
		if (!elemData || !(events = elemData.events)) {
			return;
		}

		// Once for each type.namespace in types; type may be omitted
		/*
		core_rnotwhite = /\S+/g

		"click mouseover".match(/\S+/g) ->["click", "mouseover"]
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
		types = (types || "").match(core_rnotwhite) || [""];
		t = types.length;
		while (t--) {
			/*
			rtypenamespace.exec("keydown.myPlugin.plugin")
			-> ["keydown.myPlugin.plugin", "keydown", "myPlugin.plugin", index: 0, input: "keydown.myPlugin.plugin"]
			-> type = "keydown"
			-> namespaces = ["myPlugin", "plugin"]
			*/
			tmp = rtypenamespace.exec(types[t]) || [];
			type = origType = tmp[1];
			namespaces = (tmp[2] || "").split(".").sort();

			// Unbind all events (on this namespace, if provided) for the element
			// 没有传入特定 type，那就移除所有 type
			if (!type) {
				for (type in events) {
					// mappedTypes 为 true 表示任意类型都可以删
					jQuery.event.remove(elem, type + types[t], handler, selector, true);
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

			special = jQuery.event.special[type] || {};
			type = (selector ? special.delegateType : special.bindType) || type;
			handlers = events[type] || [];
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
			tmp = tmp[2] && new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)");

			// Remove matching events
			origCount = j = handlers.length;
			while (j--) {
				handleObj = handlers[j];

				// 前边递归调用 remove 方法时 mappedTypes 为 true
				// 也就是任意类型都可以删，不需要再单独考虑类型是否匹配了
				if ((mappedTypes || origType === handleObj.origType) &&
					// 没有传入回调函数，或者回调函数的 guid 要匹配上
					(!handler || handler.guid === handleObj.guid) &&
					// 没有命名空间（也就没有tmp[2]）或命名空间匹配上
					(!tmp || tmp.test(handleObj.namespace)) &&
					// && 优先级高于 ||，没有选择器，或者选择器匹配上，或者通配
					(!selector || selector === handleObj.selector || selector === "**" && handleObj.selector)) {
					// 从 handlers 数组里删除对应的 handleObj
					handlers.splice(j, 1);

					// 如果是委托事件被删除了，还有把委托事件计数器减 1
					if (handleObj.selector) {
						handlers.delegateCount--;
					}
					// 特殊事件删除
					if (special.remove) {
						special.remove.call(elem, handleObj);
					}
				}
			}

			// Remove generic event handler if we removed something and no more handlers exist
			// (avoids potential for endless recursion during removal of special event handlers)
			/*
				① 如果原来确实有事件绑定，然后这次全清空了，那就解除该类型事件监听
				也就是说，如果原来没有事件绑定 origCount === 0，那就根本没绑定，更谈不上解除监听
				② 删除 events 的 type 属性
			*/
			if (origCount && !handlers.length) {
				if (!special.teardown || special.teardown.call(elem, namespaces, elemData.handle) === false) {
					jQuery.removeEvent(elem, type, elemData.handle);
				}

				delete events[type];
			}
		}

		// Remove the expando if it's no longer used
		/*
		如果 events 清空了，也就是各种类型事件监听都没有了，那就从缓存删除
		*/
		if (jQuery.isEmptyObject(events)) {
			delete elemData.handle;
			data_priv.remove(elem, "events");
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
	trigger: function (event, data, elem, onlyHandlers) {

		var i, cur, tmp, bubbleType, ontype, handle, special,
			eventPath = [elem || document],
			/*
			event 除了可以是 "click" 这种，还可以事件？
			core_hasOwn = {}.hasOwnProperty
			*/
			type = core_hasOwn.call(event, "type") ? event.type : event,
			namespaces = core_hasOwn.call(event, "namespace") ? event.namespace.split(".") : [];

		cur = tmp = elem = elem || document;

		// Don't do events on text and comment nodes
		// 文本和注释节点，不处理
		if (elem.nodeType === 3 || elem.nodeType === 8) {
			return;
		}

		// focus/blur morphs to focusin/out; ensure we're not firing them right now
		/*
		rfocusMorph = /^(?:focusinfocus|focusoutblur)$/
		focusinfocus/focusoutblur 这种就返回

		focus/blur 事件变种成 focusin/out 进行处理
		如果浏览器原生支持 focusin/out，则确保当前不触发他们
		*/
		if (rfocusMorph.test(type + jQuery.event.triggered)) {
			return;
		}

		// 带命名空间的事件类型
		if (type.indexOf(".") >= 0) {
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
		event = event[jQuery.expando] ?
			event :
			new jQuery.Event(type, typeof event === "object" && event);

		// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
		// jQuery.fn.trigger 对应 3 ；jQuery.fn.triggerHandler 对应 2
		event.isTrigger = onlyHandlers ? 2 : 3;
		event.namespace = namespaces.join(".");
		event.namespace_re = event.namespace ?
			new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)") :
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
		if (!event.target) {
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
			[event] :
			jQuery.makeArray(data, [event]);

		// Allow special events to draw outside the lines
		special = jQuery.event.special[type] || {};
		if (!onlyHandlers && special.trigger && special.trigger.apply(elem, data) === false) {
			return;
		}

		// Determine event propagation path in advance, per W3C events spec (#9951)
		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
		if (!onlyHandlers && !special.noBubble && !jQuery.isWindow(elem)) {
			/*
			eg:
			type = 'focus';
			bubbleType = 'focusin';

			bubbleType + type -> 'focusinfocus'
			rfocusMorph.test('focusinfocus') -> true
			*/
			bubbleType = special.delegateType || type;
			if (!rfocusMorph.test(bubbleType + type)) {
				cur = cur.parentNode;
			}
			// 遍历所有祖先节点
			for (; cur; cur = cur.parentNode) {
				eventPath.push(cur);
				tmp = cur;
			}

			// Only add window if we got to document (e.g., not plain obj or detached DOM)
			/*
				document.defaultView === window
				如果最后遍历到了 document 节点，那就把 window 也加进去
			*/
			if (tmp === (elem.ownerDocument || document)) {
				eventPath.push(tmp.defaultView || tmp.parentWindow || window);
			}
		}

		// Fire handlers on the event path
		i = 0;
		// 遍历 eventPath 数组，触发事件
		while ((cur = eventPath[i++]) && !event.isPropagationStopped()) {
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
			handle = (data_priv.get(cur, "events") || {})[event.type] && data_priv.get(cur, "handle");
			if (handle) {
				// 触发 dispatch
				handle.apply(cur, data);
			}

			// Native handler
			// handle = elem.onclick，触发 handle
			handle = ontype && cur[ontype];
			/*
				handle.apply( cur, data ) === false
				意味着：不管返回值是不是 false，都会执行这个方法
			*/
			if (handle && jQuery.acceptData(cur) && handle.apply && handle.apply(cur, data) === false) {
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
		if (!onlyHandlers && !event.isDefaultPrevented()) {

			if ((!special._default || special._default.apply(eventPath.pop(), data) === false) &&
				jQuery.acceptData(elem)) {

				// Call a native DOM method on the target with the same name name as the event.
				// Don't do default actions on window, that's where global variables be (#6170)
				if (ontype && jQuery.isFunction(elem[type]) && !jQuery.isWindow(elem)) {

					// Don't re-trigger an onFOO event when we call its FOO() method
					/*
					触发 FOO() 方法时，不要重复触发 onFOO 事件（上边已经触发过了）
					*/
					tmp = elem[ontype];

					if (tmp) {
						elem[ontype] = null;
					}

					// Prevent re-triggering of the same event, since we already bubbled it above
					/*
						click() 带参数会触发 on 方法，不带参数会触发 trigger 方法
						防止 click() -> trigger() -> handle (jQuery.event.triggered !== e.type) -> dispatch
					*/
					jQuery.event.triggered = type;
					elem[type](); // 事件执行
					jQuery.event.triggered = undefined;

					if (tmp) {
						elem[ontype] = tmp;
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
	dispatch: function (event) {

		// Make a writable jQuery.Event from the native event object
		// 从元素事件对象，得到一个可写的修正后的事件对象
		event = jQuery.event.fix(event);

		var i, j, ret, matched, handleObj,
			handlerQueue = [],
			args = core_slice.call(arguments),
			/*
			jQuery.event.add 方法中是这么调用的：
			jQuery.event.dispatch.apply( eventHandle.elem, arguments )

			所以，下面的 this 就是 eventHandle.elem

			handlers 就是对应 type 类型的回调函数数组
			*/
			handlers = (data_priv.get(this, "events") || {})[event.type] || [],
			special = jQuery.event.special[event.type] || {};

		// Use the fix-ed jQuery.Event rather than the (read-only) native event
		// 将 args[0] 从原生的 event 对象替换为修正的 event 对象
		args[0] = event;
		event.delegateTarget = this;

		// Call the preDispatch hook for the mapped type, and let it bail if desired
		if (special.preDispatch && special.preDispatch.call(this, event) === false) {
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
		handlerQueue = jQuery.event.handlers.call(this, event, handlers);

		// Run delegates first; they may want to stop propagation beneath us
		i = 0;
		// 不同层级的元素，受 isPropagationStopped 影响
		while ((matched = handlerQueue[i++]) && !event.isPropagationStopped()) {
			event.currentTarget = matched.elem;

			j = 0;
			// 同一个元素，不同的事件，受 isImmediatePropagationStopped 影响
			while ((handleObj = matched.handlers[j++]) && !event.isImmediatePropagationStopped()) {

				// Triggered event must either 1) have no namespace, or
				// 2) have namespace(s) a subset or equal to those in the bound event (both can have no namespace).
				/*
					① 没有命名空间 event.namespace 为假，event.namespace_re 为 null
					② 有命名空间:
						 假如 event.namespace = "aa.bb"
						 event.namespace_re = /(^|\.)aa\.(?:.*\.|)bb(\.|$)/
				*/
				if (!event.namespace_re || event.namespace_re.test(handleObj.namespace)) {

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
					ret = ((jQuery.event.special[handleObj.origType] || {}).handle || handleObj.handler)
						.apply(matched.elem, args);

					if (ret !== undefined) {
						// 如果某个回调队列中的某个函数执行返回 false，那就阻止默认行为，并阻止冒泡
						if ((event.result = ret) === false) {
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
		if (special.postDispatch) {
			special.postDispatch.call(this, event);
		}

		// 返回最后的执行结果
		return event.result;
	},

	/*
	参数：
	event：修正过的 event 对象
	handlers：获取到的 handleObj 队列
	*/
	handlers: function (event, handlers) {
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
		if (delegateCount && cur.nodeType && (!event.button || event.type !== "click")) {
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
			for (; cur !== this; cur = cur.parentNode || this) {

				// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
				/*
				不处理 disabled 元素的点击事件
				相当于：
				if (!(cur.disabled === true && event.type === "click")) {
					// process
				}
				*/
				if (cur.disabled !== true || event.type !== "click") {
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
					for (i = 0; i < delegateCount; i++) {
						handleObj = handlers[i];

						// Don't conflict with Object.prototype properties (#13203)
						sel = handleObj.selector + " ";

						if (matches[sel] === undefined) {
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
							这里的$('#div1') 就是上面说的 this。
							我们要做的就是把【委托在 this 上的 'p,a'、'.clsA'、'div' 这些元素】找出来，
							并把 handleObj 和这些元素对应起来。

							当然了，前提是，我们找到的必须以 event.target 开始向上层找。
							也就是说我们找的【委托在 this 上的 'p,a'、'.clsA'、'div' 这些元素】必须是 event.target 的祖先元素
							*/
							matches[sel] = handleObj.needsContext ?
								jQuery(sel, this).index(cur) >= 0 :
								jQuery.find(sel, this, null, [cur]).length;
						}
						if (matches[sel]) {
							matches.push(handleObj);
						}
					}
					if (matches.length) {
						handlerQueue.push({ elem: cur, handlers: matches });
					}
				}
			}
		}

		// Add the remaining (directly-bound) handlers
		// 剩余的非委托的也加入到 handlerQueue 数组
		if (delegateCount < handlers.length) {
			handlerQueue.push({ elem: this, handlers: handlers.slice(delegateCount) });
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
		filter: function (event, original) {

			// Add which for key events
			if (event.which == null) {
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
		filter: function (event, original) {
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
			if (event.pageX == null && original.clientX != null) {
				eventDoc = event.target.ownerDocument || document;
				doc = eventDoc.documentElement;
				body = eventDoc.body;

				event.pageX = original.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
				event.pageY = original.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0);
			}

			// Add which for click: 1 === left; 2 === middle; 3 === right
			// Note: button is not normalized, so don't use it
			/*
			event.which
			① 鼠标事件，左中右键分别返回 1,2,3
			② 键盘事件，返回对应的键码或字符编码

			一般，事件对象 event 没有 button 属性吧
			*/
			if (!event.which && button !== undefined) {
				event.which = (button & 1 ? 1 : (button & 2 ? 3 : (button & 4 ? 2 : 0)));
			}

			return event;
		}
	},

	/*
		jQuery.event.fix将原生的事件对象 event 修正为一个新的可写 event 对象，
		并对该 event 的属性以及方法统一接口；
		它内部调用了 jQuery.Event(event) 构造函数。
	*/
	fix: function (event) {
		// 已经修正过了，那就返回吧
		if (event[jQuery.expando]) {
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
			fixHook = this.fixHooks[type];
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
		if (!fixHook) {
			this.fixHooks[type] = fixHook =
				// 鼠标事件
				rmouseEvent.test(type) ? this.mouseHooks :
					// 键盘事件
					rkeyEvent.test(type) ? this.keyHooks :
						{};
		}
		// fixHook 为 keyHooks 、mouseHooks 、{} 三者之一

		/*
			jQuery.event.props : 键盘鼠标事件的【共享属性】
			jQuery.event.keyHooks.props : 键盘事件的【独有属性】
			jQuery.event.mouseHooks.props : 鼠标事件的【独有属性】

			这里是把【共享属性】和【独有属性】拼接在一起
		*/
		copy = fixHook.props ? this.props.concat(fixHook.props) : this.props;

		/*
			根据原生 event 对象，创建 jQuery.Event 实例对象
			jQuery.Event 构造函数中有一句：event.originalEvent = originalEvent;
			所以，新的 event 对象，可以通过 originalEvent 属性获取原来 event 事件对象的一些属性
		*/
		event = new jQuery.Event(originalEvent);

		i = copy.length;
		// 复制所有的 props 属性
		while (i--) {
			prop = copy[i];
			event[prop] = originalEvent[prop];
		}

		// Support: Cordova 2.5 (WebKit) (#13255)
		// All events should have a target; Cordova deviceready doesn't
		// 如果没有 event.target，修正为 document
		if (!event.target) {
			event.target = document;
		}

		// Support: Safari 6.0+, Chrome < 28
		// Target should not be a text node (#504, #13143)
		// 如果 event.target 是文本节点，修正为其父节点
		if (event.target.nodeType === 3) {
			event.target = event.target.parentNode;
		}

		// 最后，用钩子修正事件对象
		return fixHook.filter ? fixHook.filter(event, originalEvent) : event;
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
			trigger: function () {
				if (this !== safeActiveElement() && this.focus) {
					this.focus();
					return false;
				}
			},
			delegateType: "focusin"
		},
		blur: {
			trigger: function () {
				if (this === safeActiveElement() && this.blur) {
					this.blur();
					return false;
				}
			},
			delegateType: "focusout"
		},
		click: {
			// For checkbox, fire native event so checked state will be right
			trigger: function () {
				if (this.type === "checkbox" && this.click && jQuery.nodeName(this, "input")) {
					this.click();
					return false;
				}
			},

			// For cross-browser consistency, don't fire native .click() on links
			_default: function (event) {
				return jQuery.nodeName(event.target, "a");
			}
		},

		beforeunload: {
			postDispatch: function (event) {

				// Support: Firefox 20+
				// Firefox doesn't alert if the returnValue field is not set.
				if (event.result !== undefined) {
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
	simulate: function (type, elem, event, bubble) {
		// Piggyback on a donor event to simulate a different one.
		// Fake originalEvent to avoid donor's stopPropagation, but if the
		// simulated event prevents default then we do the same on the donor.
		/*
		eg:
		var e = jQuery.extend({}, {
			a: 1,
			b: 2,
			c: 3
			}, {
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
		if (bubble) {
			/*
				这里用 focus/blur 事件模拟 focusin/focusout 事件，
				虽然 focus/blur 事件不会冒泡，也就是不会在祖先元素上发生，
				但是 trigger 方法会依次找到所有祖先元素，手动触发事件
			*/
			jQuery.event.trigger(e, null, elem);
		} else {
			/*
				dispatch 处理 elem 它自身的监听事件以及那些委托给 elem 的子元素的事件
				换句话讲：它只会在自身和更深层的子元素上触发回调事件，不会向 elem 上层的祖先元素冒泡
			*/
			jQuery.event.dispatch.call(elem, e);
		}
		// 阻止默认事件回调
		if (e.isDefaultPrevented()) {
			event.preventDefault();
		}
	}
};

jQuery.removeEvent = function (elem, type, handle) {
	if (elem.removeEventListener) {
		elem.removeEventListener(type, handle, false);
	}
};

jQuery.Event = function (src, props) {
	// Allow instantiation without the 'new' keyword
	// 可以不用 new 关键词来新建 jQuery.Event 实例对象
	if (!(this instanceof jQuery.Event)) {
		return new jQuery.Event(src, props);
	}

	// Event object
	// src 是原生的事件对象
	if (src && src.type) {
		this.originalEvent = src;
		this.type = src.type;

		// Events bubbling up the document may have been marked as prevented
		// by a handler lower down the tree; reflect the correct value.
		// 默认行为是否已阻止
		this.isDefaultPrevented = (src.defaultPrevented ||
			src.getPreventDefault && src.getPreventDefault()) ? returnTrue : returnFalse;

		// Event type
		// src 是事件类型
	} else {
		this.type = src;
	}

	// Put explicitly provided properties onto the event object
	// 复制 props 中的所有属性
	if (props) {
		jQuery.extend(this, props);
	}

	// Create a timestamp if incoming event doesn't have one
	// 时间戳
	this.timeStamp = src && src.timeStamp || jQuery.now();

	// Mark it as fixed
	// 标记已修复
	this[jQuery.expando] = true;
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

	preventDefault: function () {
		// 获取对应的原生事件
		var e = this.originalEvent;

		this.isDefaultPrevented = returnTrue;

		if (e && e.preventDefault) {
			// 原生对象的原生方法阻止默认行为
			e.preventDefault();
		}
	},
	stopPropagation: function () {
		var e = this.originalEvent;

		this.isPropagationStopped = returnTrue;

		if (e && e.stopPropagation) {
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
	stopImmediatePropagation: function () {
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
}, function (orig, fix) {
	jQuery.event.special[orig] = {
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
		handle: function (event) {
			var ret,
				target = this,
				related = event.relatedTarget,
				handleObj = event.handleObj;

			// For mousenter/leave call the handler if related is outside the target.
			// NB: No relatedTarget if the mouse left/entered the browser window
			if (!related || (related !== target && !jQuery.contains(target, related))) {
				event.type = handleObj.origType;
				ret = handleObj.handler.apply(this, arguments);
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

	但是focus/blur 事件不支持冒泡，所以，用事件捕获。
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
if (!jQuery.support.focusinBubbles) {
	jQuery.each({ focus: "focusin", blur: "focusout" }, function (orig, fix) {

		// Attach a single capturing handler while someone wants focusin/focusout
		var attaches = 0,
			handler = function (event) {
				jQuery.event.simulate(fix, event.target, jQuery.event.fix(event), true);
			};

		jQuery.event.special[fix] = {
			setup: function () {
				if (attaches++ === 0) {
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
					document.addEventListener(orig, handler, true);
				}
			},
			teardown: function () {
				if (--attaches === 0) {
					document.removeEventListener(orig, handler, true);
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
	on: function (types, selector, data, fn, /*INTERNAL*/ one) {
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
		if (typeof types === "object") {
			// ( types-Object, selector, data )
			/*
				如果 selector 不是字符串
				① data 没有值就把 selector 的值赋给它
				② selector 置为 undefined
			*/
			if (typeof selector !== "string") {
				// 相当于 ( types-Object, data ) 这种形式参数
				data = data || selector;
				selector = undefined;
			}
			// 递归
			// 都转成这种形式 .on( events [, selector ] [, data ], handler )
			for (type in types) {
				this.on(type, selector, data, types[type], one);
			}
			// 链式调用，返回当前对象
			return this;
		}

		// 兼容各种参数形式，不要的参数就置为 undefined
		// 2 个参数的情况 .on("click", fn)
		if (data == null && fn == null) {
			// ( types, fn )
			fn = selector;
			data = selector = undefined;
		} else if (fn == null) {
			// 3 个参数的情况 .on("click", "tr", fn)
			if (typeof selector === "string") {
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
		if (fn === false) {
			fn = returnFalse;
			// 其他情况下，如果 fn 为假，那就直接返回
		} else if (!fn) {
			return this;
		}

		/*
			这个 one 参数专门为下面的 .one 方法服务的
			有了这个参数，表示对于某个元素的某一类事件，回调方法最多执行一次
		*/
		if (one === 1) {
			origFn = fn;
			// 执行一次就移除掉
			fn = function (event) {
				// Can use an empty set, since event contains the info
				/*
					随便建立一个 jQuery 实例，调用 off 方法来解除事件绑定
					这里的 event 是 jQuery.Event 实例，它携带的信息能确定到底解除哪个事件绑定
				*/
				jQuery().off(event);
				return origFn.apply(this, arguments);
			};
			// Use same guid so caller can remove using origFn
			fn.guid = origFn.guid || (origFn.guid = jQuery.guid++);
		}
		return this.each(function () {
			// 添加监听
			jQuery.event.add(this, types, fn, data, selector);
		});
	},
	one: function (types, selector, data, fn) {
		return this.on(types, selector, data, fn, 1);
	},
	off: function (types, selector, fn) {
		var handleObj, type;
		/*
			off(event) 这种形式
			event 是 jQuery.Event 实例
		*/
		if (types && types.preventDefault && types.handleObj) {
			// ( event )dispatched jQuery.Event
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
			jQuery(types.delegateTarget).off(
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
		if (typeof types === "object") {
			// ( types-object [, selector] )
			for (type in types) {
				this.off(type, selector, types[type]);
			}
			return this;
		}
		// ( types [, fn] )
		if (selector === false || typeof selector === "function") {
			fn = selector;
			selector = undefined;
		}
		if (fn === false) {
			fn = returnFalse;
		}
		return this.each(function () {
			jQuery.event.remove(this, types, fn, selector);
		});
	},
	/*
		trigger 和 triggerHandler 区别如下：
		① trigger 会触发事件的默认行为、冒泡行为，而 triggerHandler 不会；
		② trigger 会触发选择器获取的所有元素事件，而 triggerHandler 触发第一个元素事件
		③ trigger 方法返回触发该方法的 jquery 实例，可以链式调用，
			 而 triggerHandler 没有返回值，也就是返回 undefined；
	*/
	trigger: function (type, data) {
		return this.each(function () {
			jQuery.event.trigger(type, data, this);
		});
	},
	triggerHandler: function (type, data) {
		var elem = this[0];
		if (elem) {
			return jQuery.event.trigger(type, data, elem, true);
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
	find: function (selector) {
		var i,
			ret = [],
			self = this,
			len = self.length;

		// 参数不是字符串，这里返回 JQ 对象
		if (typeof selector !== "string") {
			/*
				① 找出元素 jQuery( selector )
				② 过滤元素
				③ 过滤规则：选出来的元素一定要是当前 JQ 对象的后代元素

				这里看一下 :
				$.fn.filter = function ( selector ) {
					return this.pushStack( winnow(this, selector || [], false) );
				}
				作用：过滤 jQuery( selector ) 这个对象，然后返回一个新的 jQuery 对象
			*/
			return this.pushStack(jQuery(selector).filter(function () {
				/*
					对于 jQuery.contains( self[ i ], this )
					self[ i ] 是调用 find 方法的一组元素中的一个；
					this 是 jQuery( selector ) 这一组元素中的一个
				*/
				for (i = 0; i < len; i++) {
					if (jQuery.contains(self[i], this)) {
						return true;
					}
				}
			}));
		}

		// 参数为字符串，调用静态方法 jQuery.find
		for (i = 0; i < len; i++) {
			/*
			 jQuery.find = Sizzle，jQuery.find 就是对 Sizzle 函数的引用
			 jQuery.find 函数将当前 self[ i ] 的所有后代元素中筛选符合指定表达式 selector 的元素
			 ret 数组存放结果
			*/
			jQuery.find(selector, self[i], ret);
		}

		// Needed because $( selector, context ) becomes $( context ).find( selector )
		// ret 是一个数组，这里转成 jQuery 对象
		ret = this.pushStack(len > 1 ? jQuery.unique(ret) : ret);
		ret.selector = this.selector ? this.selector + " " + selector : selector;
		return ret;
	},

	/*
		参数：String/Element/jQuery 等类型指定的表达式
		作用：筛选出包含特定后代的元素，并以jQuery对象的形式返回
	*/
	has: function (target) {
		var targets = jQuery(target, this),
			l = targets.length;

		/*
			上面 targets = jQuery( target, this ) 已经过滤出后代元素了，为什么还需要后面的操作呢？
			原因：
			这里确实以 this 为上下文，得到了后代元素组 targets。但是，不要忘了，this 可能是一组元素
			吃大锅饭不行，下面还需要找出到底是 this 中的哪些元素是真的包含 targets[i] 的

			对于方法 $.fn.filter，哪个实例对象调用它，就过滤哪个实例对象
			这里是过滤调用 has 方法的 JQ 对象
		*/
		return this.filter(function () {
			var i = 0;
			for (; i < l; i++) {
				/*
					这里的 this 不能等同于外层的 this
					外层的 this 可以看到一组元素
					这里的 this 只是那一组元素中的一个
				*/
				if (jQuery.contains(this, targets[i])) {
					return true;
				}
			}
		});
	},

	// 下面的 filter 方法过滤后剩下的部分
	not: function (selector) {
		return this.pushStack(winnow(this, selector || [], true));
	},

	// 过滤调用该 filter 方法的 JQ 对象，然后将链式调用的驱动对象交给过滤后的 JQ 对象
	filter: function (selector) {
		return this.pushStack(winnow(this, selector || [], false));
	},

	// 判断当前 JQ 对象是否在类数组 jQuery( selector ) 或数组 selector 中，返回值为布尔值
	is: function (selector) {
		/*
			① . 运算符优先级大于 ！
			② 当 selector 是字符串的时候，看 this 是否在类数组 jQuery( selector ) 中
			③ 将最终结果转为布尔值
		 */
		return !!winnow(
			this,

			// If this is a positional/relative selector, check membership in the returned set
			// so $("p:first").is("p:last") won't return true for a doc with two "p".
			typeof selector === "string" && rneedsContext.test(selector) ?
				jQuery(selector) :
				selector || [],
			false
		).length;
	},

	/*
		作用：从当前匹配元素开始，逐级向上级选取符合指定表达式的第一个（最近的）元素，并以 jQuery 对象的形式返回。
		exprString/Element/jQuery 等类型指定的表达式。
		context 可选/Element/jQuery 等类型指定表示查找范围的文档节点。
	*/
	// 在给定的范围里，找出最近的的符合表达式 selectors 的元素
	closest: function (selectors, context) {
		var cur,
			i = 0,
			l = this.length,
			matched = [],
			// 一组节点
			pos = (rneedsContext.test(selectors) || typeof selectors !== "string") ?
				jQuery(selectors, context || this.context) :
				0;

		// 对 this 这一组元素，每个 this[i] 找到一个最近的 cur 就跳出内层循环
		for (; i < l; i++) {
			for (cur = this[i]; cur && cur !== context; cur = cur.parentNode) {
				// Always skip document fragments
				if (cur.nodeType < 11 && (pos ?
					// cur 在 pos 这一组节点当中
					pos.index(cur) > -1 :

					// Don't pass non-elements to Sizzle
					cur.nodeType === 1 &&
					jQuery.find.matchesSelector(cur, selectors))) {

					cur = matched.push(cur);
					break;
					// 跳出内循环
				}
			}
		}
		// 对最终数组去重处理
		return this.pushStack(matched.length > 1 ? jQuery.unique(matched) : matched);
	},

	// Determine the position of an element within
	// the matched set of elements
	index: function (elem) {

		// No argument, return index in parent
		/*
			① 没有参数，返回当前元素在其父节点中的索引
			② jQuery.fn.first() 用于获取当前 jQuery 对象所匹配的元素中的第 1 个元素，并返回封装该元素的 jQuery 对象

			注意一下 this[ 0 ] 和 this.first() 的差异：
			this[ 0 ] 是指 this 对象的第一个原生节点
			this.first() 是指 this 对象的第一个原生节点包装后的 jQuery 对象
		*/
		if (!elem) {
			return (this[0] && this[0].parentNode) ? this.first().prevAll().length : -1;
		}

		// index in selector
		/*
			jQuery( elem ) 是个类数组，索引 0，1，2... 分别对应原生对象
			这里返回原生对象 this[ 0 ] 在类数组 Query( elem ) 中的索引
		 */
		if (typeof elem === "string") {
			return core_indexOf.call(jQuery(elem), this[0]);
		}

		// Locate the position of the desired element
		/*
			① 如果 elem 是个 jQuery 对象，返回 elem[ 0 ] 在 this 这个 jQuery 对象中的索引
			② elem 是原生对象，返回 elem 在 this 这个 jQuery 对象中的索引\

			其中，每个 jQuery 对象都有 jquery 属性
		 */
		return core_indexOf.call(this,

			// If it receives a jQuery object, the first element is used
			elem.jquery ? elem[0] : elem
		);
	},

	/*
		作用：用于向当前匹配元素中添加符合指定表达式的元素，并以 jQuery 对象的形式返回
		exprString/Element/jQuery 等类型指定的表达式。
		context 可选/Element/jQuery 等类型指定表示查找范围的文档节点，该参数只有在 expr 参数表示选择器字符串时才可用。
	 */
	add: function (selector, context) {
		var set = typeof selector === "string" ?
			jQuery(selector, context) :
			// jQuery.makeArray 返回原生元素组成的数组
			jQuery.makeArray(selector && selector.nodeType ? [selector] : selector),
			// this.get() 也是返回原生元素组成的数组
			all = jQuery.merge(this.get(), set);

		// 返回之前去重
		return this.pushStack(jQuery.unique(all));
	},

	/*
		作用：用于将之前匹配的元素加入到当前匹配的元素中，并以新的jQuery对象的形式返回。
		selector可选/String 类型指定的选择器字符串
		如果省略selector参数，则添加之前压栈之前的 jQuery 对象

		① this.prevObject 表示压栈之前的 jQuery 对象
		② this.prevObject.filter(selector) 表示按照选择符 selector 过滤 this.prevObject
	 */
	addBack: function (selector) {
		return this.add(selector == null ?
			this.prevObject : this.prevObject.filter(selector)
		);
	}
});

// 从一个元素出发，迭代检索某个方向上的所有元素，找到了就返回
function sibling(cur, dir) {
	while ((cur = cur[dir]) && cur.nodeType !== 1) { }

	return cur;
}

jQuery.each({
	// 返回父元素
	parent: function (elem) {
		var parent = elem.parentNode;
		// 11 文档碎片节点
		return parent && parent.nodeType !== 11 ? parent : null;
	},
	// 返回祖先元素
	parents: function (elem) {
		return jQuery.dir(elem, "parentNode");
	},
	// 返回祖先元素（到某个祖先元素终止）
	parentsUntil: function (elem, i, until) {
		return jQuery.dir(elem, "parentNode", until);
	},
	// 返回后面的一个兄弟节点
	next: function (elem) {
		return sibling(elem, "nextSibling");
	},
	// 返回前面的一个兄弟节点
	prev: function (elem) {
		return sibling(elem, "previousSibling");
	},
	// 返回后面的所有兄弟节点
	nextAll: function (elem) {
		return jQuery.dir(elem, "nextSibling");
	},
	// 返回前面的所有兄弟节点
	prevAll: function (elem) {
		return jQuery.dir(elem, "previousSibling");
	},
	// 返回后续的兄弟节点（到某个兄弟终止）
	nextUntil: function (elem, i, until) {
		return jQuery.dir(elem, "nextSibling", until);
	},
	// 返回前面的兄弟节点（到某个兄弟终止）
	prevUntil: function (elem, i, until) {
		return jQuery.dir(elem, "previousSibling", until);
	},
	// 返回所有的兄弟节点
	siblings: function (elem) {
		return jQuery.sibling((elem.parentNode || {}).firstChild, elem);
	},
	// 返回所有子节点
	children: function (elem) {
		return jQuery.sibling(elem.firstChild);
	},
	// 返回当前框架文档或者子元素组成的数组
	contents: function (elem) {
		// contentDocument 属性以 HTML 对象返回框架容纳的文档
		return elem.contentDocument || jQuery.merge([], elem.childNodes);
	}
}, function (name, fn) {
	jQuery.fn[name] = function (until, selector) {
		// 这里得到了一个 matched 数组，下面会对这个数组进行过滤、去重、倒置等操作
		var matched = jQuery.map(this, fn, until);
		/*
		对 this 对象的每一个元素，执行：
		value = fn( this[ i ], i, until )

		以 fn = function( elem ) {
			return jQuery.dir( elem, "nextSibling" );
			// 返回一个数组，数组内容为 this[ i ] 后面的所有兄弟元素
		} 为例：

		那么 matched 的值就是一个二维数组吗？
		并不是！因为 match 方法最后有个处理：

		return core_concat.apply( [], ret );

		这意味着二维数据 ret，最后会转化为一维数组再返回，举例：
		[].concat.apply([],[[1],[2,3],[4,5]])
		-> [1, 2, 3, 4, 5]
		*/

		if (name.slice(-5) !== "Until") {
			selector = until;
		}

		/*
		之前的 matched 中基本已经选好的数据，
		根据选择器 selector，再过滤一下 matched 中的元素
		*/
		if (selector && typeof selector === "string") {
			matched = jQuery.filter(selector, matched);
		}

		// this 为 $('div') 等多个元素集合，对 matched 数组做一些处理
		if (this.length > 1) {
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
			if (!guaranteedUnique[name]) {
				jQuery.unique(matched);
			}

			// Reverse order for parents* and prev-derivatives
			/*
			rparentsprev = /^(?:parents|prev(?:Until|All))/

			parents、prevAll、prevUntil 等方法，倒置一下 matched 数组
			*/
			if (rparentsprev.test(name)) {
				matched.reverse();
			}
		}

		/*
			将 matched 作为后面链式调用的驱动对象
			eg: $('div').pushStack($('span')).css('background','red') -> span背景变红
		*/
		return this.pushStack(matched);
	};
});

jQuery.extend({
	// 根据选择器 expr，过滤出符合要求的元素节点
	filter: function (expr, elems, not) {
		var elem = elems[0];

		if (not) {
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
			jQuery.find.matchesSelector(elem, expr) ? [elem] : [] :
			jQuery.find.matches(expr, jQuery.grep(elems, function (elem) {
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
	dir: function (elem, dir, until) {
		var matched = [],
			truncate = until !== undefined;
		/*
			① until 为 undefined 时，truncate 为 false;
			② until 不为 undefined 时，truncate 为 true;
		*/
		while ((elem = elem[dir]) && elem.nodeType !== 9) {
			if (elem.nodeType === 1) {
				//【until 为 undefined】或【找到了目标元素】，就终止查找
				if (truncate && jQuery(elem).is(until)) {
					break;
				}
				matched.push(elem);
			}
		}
		return matched;
	},

	// 返回元素 n 的所有后续兄弟元素组成的数组，包含 n ，不包含 elem
	sibling: function (n, elem) {
		var matched = [];

		for (; n; n = n.nextSibling) {
			if (n.nodeType === 1 && n !== elem) {
				matched.push(n);
			}
		}

		return matched;
	}
});

// Implement the identical functionality for filter and not
function winnow(elements, qualifier, not) {
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
	if (jQuery.isFunction(qualifier)) {
		return jQuery.grep(elements, function (elem, i) {
			/* jshint -W018 */
			return !!qualifier.call(elem, i, elem) !== not;
		});
		// 返回 elements 中部分元素组成的【数组】，判断依据是 qualifier 函数返回值跟 not 是否相等
	}

	// qualifier 是文档节点
	if (qualifier.nodeType) {
		return jQuery.grep(elements, function (elem) {
			return (elem === qualifier) !== not;
		});
		// 返回 elements 中部分元素组成的【数组】，判断依据是元素 elem 和 qualifier 是不是同一个节点
	}

	/*
		isSimple = /^.[^:#\[\.,]*$/ 任意字符（除换行符）开头，后面不能是 : # [ . , 等符号就行
		作用：匹配选择器

		isSimple.test('div')// true
		isSimple.test('.cls') // true
		isSimple.test('#id')// true

		isSimple.test('div:') // false
		isSimple.test('div#') // false
	*/
	// qualifier 是字符串
	if (typeof qualifier === "string") {
		// 如果是选择器字符串，就交给 jQuery.filter 方法处理完就返回
		if (isSimple.test(qualifier)) {
			return jQuery.filter(qualifier, elements, not);
		}
		// 否则，用 jQuery.filter 将 qualifier 字符串修正为【数组】
		qualifier = jQuery.filter(qualifier, elements);
	}

	/*
		core_indexOf = [].indexOf返回元素在数组中的索引
		[1,2,3].indexOf(1)// 0
		[1,2,3].indexOf('1')// -1
		[1,2,3].indexOf(4)// -1

		这里的 qualifier 是一个数组
	*/
	return jQuery.grep(elements, function (elem) {
		return (core_indexOf.call(qualifier, elem) >= 0) !== not;
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
		option: [1, "<select multiple='multiple'>", "</select>"],

		thead: [1, "<table>", "</table>"],
		col: [2, "<table><colgroup>", "</colgroup></table>"],
		tr: [2, "<table><tbody>", "</tbody></table>"],
		td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],

		_default: [0, "", ""]
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
	text: function (value) {
		return jQuery.access(this, function (value) {
			return value === undefined ?
				jQuery.text(this) :
				this.empty().append((this[0] && this[0].ownerDocument || document).createTextNode(value));
		}, null, value, arguments.length);
	},

	// 在元素内部末尾插入子节点
	append: function () {
		return this.domManip(arguments, function (elem) {
			// 	Element || document || DocumentFragment
			if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
				/*
					① 如果 this 不是 table，那就不用修正，target 还是 this；
					② 如果 this 是 table，elem 是 tr，那就修正 target 为 this 下的第一个 tbody

					domManip 会执行：callback.call( this[ i ], node, i );
					也就是说，这里的 elem 就是文档碎片 node
				*/
				var target = manipulationTarget(this, elem);
				target.appendChild(elem);
			}
		});
	},

	// 在元素内部最前面插入子节点
	prepend: function () {
		return this.domManip(arguments, function (elem) {
			if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
				var target = manipulationTarget(this, elem);
				target.insertBefore(elem, target.firstChild);
			}
		});
	},

	// 在元素前面插入兄弟节点
	before: function () {
		return this.domManip(arguments, function (elem) {
			if (this.parentNode) {
				this.parentNode.insertBefore(elem, this);
			}
		});
	},

	// 在元素后面插入兄弟节点
	after: function () {
		return this.domManip(arguments, function (elem) {
			if (this.parentNode) {
				this.parentNode.insertBefore(elem, this.nextSibling);
			}
		});
	},

	// keepData is for internal use only--do not document
	/*
		作用：从文档中移除匹配的元素，同时移除与元素关联绑定的附加数据（data() 函数）和事件处理器等
		selector ：选择器
		keepData ：是否删除附加数据，默认删除
	*/
	remove: function (selector, keepData) {
		var elem,
			/*
				① 有选择器（有传入合理参数），删除 this 中选出匹配元素
				② 没有选择器（没有传参），删除 this
			*/
			elems = selector ? jQuery.filter(selector, this) : this,
			i = 0;

		for (; (elem = elems[i]) != null; i++) {
			// keepData 为假，表示删除附加数据
			if (!keepData && elem.nodeType === 1) {
				/*
					① getAll( elem ) 获取 elem 及其所有子元素组成的数组
					② jQuery.cleanData 删除元素上的缓存数据（绑定的事件，用户添加的数据等等）
				*/
				jQuery.cleanData(getAll(elem));
			}

			if (elem.parentNode) {
				// jQuery.contains( elem.ownerDocument, elem ) 为 true 表示元素 elem 在文档 elem.ownerDocument 中
				if (keepData && jQuery.contains(elem.ownerDocument, elem)) {
					// 标记 elem 中的 script 都执行过
					setGlobalEval(getAll(elem, "script"));
				}
				// 从文档中移除 elem 元素
				elem.parentNode.removeChild(elem);
			}
		}

		return this;
	},

	// 清空元素内容
	empty: function () {
		var elem,
			i = 0;

		for (; (elem = this[i]) != null; i++) {
			if (elem.nodeType === 1) {

				// Prevent memory leaks
				jQuery.cleanData(getAll(elem, false));

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

	// 元素节点复制，可复制元素节点相关的缓存数据（事件，用户自定义数据等）
	clone: function (dataAndEvents, deepDataAndEvents) {
		dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
		deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

		// 从 this 这一组元素克隆出另一组元素
		return this.map(function () {
			/*
				这里的 this 是外层 this 代表的一组元素中的一个，相当于 this[i]，其中：
				① dataAndEvents 表示是否复制 this[i] 的缓存数据
				② deepDataAndEvents 表示是否复制 this[i] 的子节点缓存数据
			 */
			return jQuery.clone(this, dataAndEvents, deepDataAndEvents);
		});
	},

	/*
	对于 jQuery.access 方法（梳理一下该方法内部执行流程）:
	(1) value == undefined
		① key == null -> bulk = true;
		② value == undefined（没传参） -> arguments.length = 0（假），即 chainable 为假
			 -> fn.call(elems)
			 -> this[ 0 ].innerHTML;
			 也就是说：$('p').html() 相当于 $('p')[ 0 ].innerHTML

	(2) value !== undefined
		① key == null -> bulk = true;
		② value !== undefined（一定传参） -> chainable = true
			 a. value 不是 function -> raw = true
					-> fn.call( elems, value )
			 b. value 是 function -> raw = undefined（没传参）-> bulk = fn
					-> fn = function( elem, key, value ) {
								return bulk.call( jQuery( elem ), value );
							};
	*/
	html: function (value) {
		return jQuery.access(this, function (value) {
			var elem = this[0] || {},
				i = 0,
				l = this.length;

			if (value === undefined && elem.nodeType === 1) {
				return elem.innerHTML;
			}

			// See if we can take a shortcut and just use innerHTML
			/*
				① rnoInnerhtml = /<(?:script|style|link)/i
				② rtagName = /<([\w:]+)/
						a. \w 字母数字或下划线或汉字，不包括 < 和 > 这种符号
						b. [\w:] 表示 \w 或 :
								也就是说，字母数字或下划线或汉字或:

						eg：
						rtagName.exec('<div') -> ["<div", "div", index: 0, input: "<div"]
						rtagName.exec('<div>') ->["<div", "div", index: 0, input: "<div>"]
						rtagName.exec('<div><span') -> ["<div", "div", index: 0, input: "<div><span"]

						注意这里的正则没有全局 g 匹配，所以只会取第一个标签

						下面的 tag 就是匹配出来的元素标签名
				③ 匹配出来的标签名不能在 wrapMap 对象中
			 */
			if (typeof value === "string" && !rnoInnerhtml.test(value) &&
				!wrapMap[(rtagName.exec(value) || ["", ""])[1].toLowerCase()]) {
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

				(3) 以下这句起到闭合标签的作用
				 */
				value = value.replace(rxhtmlTag, "<$1></$2>");

				try {
					for (; i < l; i++) {
						elem = this[i] || {};

						// Remove element nodes and prevent memory leaks
						if (elem.nodeType === 1) {
							// 删除元素上的缓存数据（绑定的事件，用户添加的数据等等）
							jQuery.cleanData(getAll(elem, false));
							elem.innerHTML = value;
						}
					}

					elem = 0;

					// If using innerHTML throws an exception, use the fallback method
				} catch (e) { }
			}

			// 如果进入了上面的 if，那么 elem 就为 0 了，就不会走这里
			if (elem) {
				this.empty().append(value);
			}
		}, null, value, arguments.length);
	},

	// 元素替换
	replaceWith: function () {
		var
			// Snapshot the DOM in case .domManip sweeps something relevant into its fragment
			/*
				① elem -> [ elem.nextSibling, elem.parentNode ]
				② map 方法最后一句：return concat.apply( [], ret )
				③ 所以，args 是一维数组
			 */
			args = jQuery.map(this, function (elem) {
				return [elem.nextSibling, elem.parentNode];
			}),
			i = 0;

		// Make the changes, replacing each context element with the new content
		this.domManip(arguments, function (elem) {
			/*
				① elem 表示处理 arguments 后得到的文档碎片
				② 内部的 this 是外部 this 代表的一组元素中的一个 this[i]
				③ domManip 方法的第二个参数（就是这个函数）会执行 this.length 遍，所以 i 会一直增加的
			 */
			var next = args[i++],
				parent = args[i++];

			if (parent) {
				// Don't use the snapshot next if it has moved (#13810)
				// 这个函数循环执行过程中会删除一些节点，如果刚好把 args 中某个节点删除了，这里修正一下兄弟节点
				if (next && next.parentNode !== parent) {
					next = this.nextSibling;
				}
				// 删除本节点
				jQuery(this).remove();
				// 插入新节点
				parent.insertBefore(elem, next);
			}
			// Allow new content to include elements from the context set
		}, true);

		// Force removal if there was no new content (e.g., from empty arguments)
		// 返回当前 jQuery 对象本身(虽然其匹配的元素已从文档中被移除)。
		return i ? this : this.remove();
	},

	// 跟 remove 函数基本一样，只不过 remove 会默认删除缓存数据，这里是不删除缓存数据
	detach: function (selector) {
		return this.remove(selector, true);
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
	domManip: function (args, callback, allowIntersection) {

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
		args = core_concat.apply([], args);

		var fragment, first, scripts, hasScripts, node, doc,
			i = 0,
			l = this.length,
			set = this,
			iNoClone = l - 1,
			value = args[0],
			isFunction = jQuery.isFunction(value);

		// We can't cloneNode fragments that contain checked, in WebKit
		/*
		!( l <= 1 || typeof value !== "string" || jQuery.support.checkClone || !rchecked.test( value ) )
		-> l > 1 && typeof value === "string" && !jQuery.support.checkClone && rchecked.test( value )

		rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i
		rchecked.test('checked="checked"') -> true

		旧的 WebKit，克隆 fragment 节点，如果该节点下有 input，那么 input 的 checkd 状态不会被复制
		*/
		if (isFunction || !(l <= 1 || typeof value !== "string" || jQuery.support.checkClone || !rchecked.test(value))) {
			return this.each(function (index) {
				var self = set.eq(index);
				if (isFunction) {
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
					args[0] = value.call(this, index, self.html());
				}
				// 如果第一个参数是函数，将其修正为字符串后，递归调用 domManip 方法
				self.domManip(args, callback, allowIntersection);
			});
		}

		if (l) {
			fragment = jQuery.buildFragment(args, this[0].ownerDocument, false, !allowIntersection && this);
			first = fragment.firstChild;
			/*
				var args = $('p');
				fragment = jQuery.buildFragment( args, document, false, false );

				fragment.firstChild
				-> <p>This is a paragraph.</p>
			*/

			// 只有一个子节点
			if (fragment.childNodes.length === 1) {
				fragment = first;
			}

			// 必须至少有一个子节点，要不然后面就不会继续处理了
			if (first) {
				/*
					① getAll 返回指定元素（参数 1）中标签名为参数 2 的子元素组成的数组
					② disableScript 方法禁用 script 标签
					③ 下面一句表示禁止 fragment 中的所有 script 标签
				*/
				scripts = jQuery.map(getAll(fragment, "script"), disableScript);
				hasScripts = scripts.length;

				// Use the original fragment for the last item instead of the first because it can end up
				// being emptied incorrectly in certain situations (#8070).
				for (; i < l; i++) {
					node = fragment;

					// 不是最后一个
					if (i !== iNoClone) {
						/*
							① 一个 jQuery 对象可能包含多个节点，为了保证每个节点都有碎片内容可用，这里需要克隆出 this.length 个碎片
							② 这里不光克隆碎片节点，连碎片节点的事件，缓存数据等都复制
							③ 碎片节点多次插入文档，script 脚本也是节点元素，多次执行也是应该的，所以下面有多份 script 元素
						*/
						node = jQuery.clone(node, true, true);

						// Keep references to cloned scripts for later restoration
						if (hasScripts) {
							// Support: QtWebKit
							// jQuery.merge because core_push.apply(_, arraylike) throws
							jQuery.merge(scripts, getAll(node, "script"));
						}
					}
					// 用第二个函数参数来处理获取的文档碎片 node
					callback.call(this[i], node, i);
				}

				if (hasScripts) {
					doc = scripts[scripts.length - 1].ownerDocument;

					// Reenable scripts，解除脚本禁用
					jQuery.map(scripts, restoreScript);

					// Evaluate executable scripts on first document insertion
					for (i = 0; i < hasScripts; i++) {
						node = scripts[i];
						/*
							① rscriptType = /^$|\/(?:java|ecma)script/i
							 type="text/javascript" 或 type="text/ecmascript" 或没有 type 的 script 标签可执行
							② data_priv.access( node, "globalEval" ) 为 true 表示脚本执行过了
							③ jQuery.contains( doc, node ) 为 true 表示 node 真正插入 doc 文档了
						*/
						if (rscriptType.test(node.type || "") &&
							!data_priv.access(node, "globalEval") && jQuery.contains(doc, node)) {

							if (node.src) {
								// Hope ajax is available...
								// 通过 jQuery.ajax 方法发起 get 类型的 http 请求
								jQuery._evalUrl(node.src);
							} else {
								/*
									① globalEval 表示全局解析 script 脚本里的代码
									② rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g
									 剔除掉 html 注释

									 rcleanScript.exec('<!---->')
									 -> rcleanScript.exec('<!---->')
								*/
								jQuery.globalEval(node.textContent.replace(rcleanScript, ""));
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
	// 当前元素插入到选择器匹配的每一个元素内部末尾
	appendTo: "append",
	// 当前元素插入到选择器匹配的每一个元素内部开头
	prependTo: "prepend",
	// 当前元素插入到选择器匹配的每一个元素前面
	insertBefore: "before",
	// 当前元素插入到选择器匹配的每一个元素后面
	insertAfter: "after",
	// 当前元素替换掉所有的匹配元素
	replaceAll: "replaceWith"
}, function (name, original) {
	jQuery.fn[name] = function (selector) {
		var elems,
			ret = [],
			insert = jQuery(selector),
			last = insert.length - 1,
			i = 0;

		for (; i <= last; i++) {
			elems = i === last ? this : this.clone(true);
			//eg: jQuery( insert[ i ] ).append( elems )
			jQuery(insert[i])[original](elems);

			// Support: QtWebKit
			// .get() because core_push.apply(_, arraylike) throws
			/*
				elems.get() 获得 elem 这个 jQuery 对象的所有原生节点组成的数组
			 */
			core_push.apply(ret, elems.get());
		}

		/*
			看一下 pushStack 方法：
			jQuery.fn.pushStack : function ( elems ) {
				// 新建一个 jQuery 对象
				var ret = jQuery.merge( this.constructor(), elems );

				// 原来的 this 入栈
				ret.prevObject = this;
				ret.context = this.context;

				// 返回新建的 jQuery 对象
				return ret;
			}
		 */
		return this.pushStack(ret);
	};
});

jQuery.extend({
	/*
		作用：克隆当前匹配元素集合的一个副本，并以 jQuery 对象的形式返回
		dataAndEvents：是否同时复制元素的附加数据和绑定事件，默认为 false
		deepDataAndEvents：是否同时复制元素的所有子元素的附加数据和绑定事件，默认值即为参数 withDataAndEvents的值。
	*/
	clone: function (elem, dataAndEvents, deepDataAndEvents) {
		var i, l, srcElements, destElements,
			// 该方法将复制并返回调用它的节点的副本。如果传递给它的参数是 true，它还将递归复制当前节点的所有子孙节点。否则，它只复制当前节点。
			clone = elem.cloneNode(true),
			// elem 是否已经在文档中
			inPage = jQuery.contains(elem.ownerDocument, elem);

		// Support: IE >= 9
		// Fix Cloning issues
		/*
			① 不支持单选框复选框状态复制（!jQuery.support.noCloneChecked），这里手工修正
			② 支持选中状态复制的就没必要走这一步了，clone 的时候就已经把选中状态复制过去了
		*/
		if (!jQuery.support.noCloneChecked && (elem.nodeType === 1 || elem.nodeType === 11) && !jQuery.isXMLDoc(elem)) {

			// We eschew Sizzle here for performance reasons: http://jsperf.com/getall-vs-sizzle/2
			// getAll 方法获得元素自身和所有的子元素
			destElements = getAll(clone);
			srcElements = getAll(elem);

			for (i = 0, l = srcElements.length; i < l; i++) {
				// 当元素是单选框/复选框的时候，将源节点的选中状态赋值给目标节点
				fixInput(srcElements[i], destElements[i]);
			}
		}

		// Copy the events from the original to the clone
		// 复制元素的附加数据和绑定事件
		if (dataAndEvents) {
			// 同时复制元素的所有子元素的附加数据和绑定事件
			if (deepDataAndEvents) {
				/*
					① 大多数浏览器支持单选复选框状态复制，不走上面的 if 块，srcElements、destElements 在这里初始化
					② 剩余的少数浏览器，这里取上面 if 块修正过的 srcElements、destElements
				*/
				srcElements = srcElements || getAll(elem);
				destElements = destElements || getAll(clone);

				for (i = 0, l = srcElements.length; i < l; i++) {
					// 依次复制附加数据和绑定事件
					cloneCopyEvent(srcElements[i], destElements[i]);
				}
			} else {
				cloneCopyEvent(elem, clone);
			}
		}

		// Preserve script evaluation history
		// 保存脚本历史执行记录
		destElements = getAll(clone, "script");
		if (destElements.length > 0) {
			/*
				① inPage 为 true，表示 elem 已经在文档中，对 destElements 中每个 script 标记为 false
				 data_priv.set(destElements[ i ], "globalEval", false) 表示脚本都执行过
				② inPage 为 false，elem 不在文档中，它下面的脚本有的执行过，有的没执行过
				 setGlobalEval( destElements, getAll( elem, "script" ) )
				 将 elem 中每个脚本是否执行过的标记复制过去
			*/
			setGlobalEval(destElements, !inPage && getAll(elem, "script"));
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
	buildFragment: function (elems, context, scripts, selection) {
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
		for (; i < l; i++) {
			elem = elems[i];

			if (elem || elem === 0) {

				// Add nodes directly
				if (jQuery.type(elem) === "object") {
					// Support: QtWebKit
					// jQuery.merge because core_push.apply(_, arraylike) throws
					jQuery.merge(nodes, elem.nodeType ? [elem] : elem);

					// Convert non-html into a text node
					/*
						rhtml = /<|&#?\w+;/ 匹配 < 或 &#?\w+;
						即匹配包含 < 或 实体 的字符串
						rhtml.test( '<abc' )		// true
						rhtml.test( 'abc&lt;aba' )// true
		
						看两个 html 实体符号：
						显示描述	 实体名称实体编号
						<	 小于号		&lt;	 &#60;
						>	 大于号		&gt;	 &#62;
					*/
					// 将不包含 html 标签的字符串转换为文本节点
				} else if (!rhtml.test(elem)) {
					nodes.push(context.createTextNode(elem));

					// Convert html into DOM nodes
				} else {
					/*
						① 循环第一次 tmp 为假
						② appendChild 方法的返回值是被添加的节点
						③ 后面的循环，tmp 就是第一次创建的 div 节点
					*/
					tmp = tmp || fragment.appendChild(context.createElement("div"));

					// Deserialize a standard representation
					/*
						rtagName = /<([\w:]+)/
						① \w 字母数字或下划线或汉字，不包括 < 和 > 这种符号
						② [\w:] 表示 \w 或 :
						 也就是说，字母数字或下划线或汉字或:

						eg：
						rtagName.exec('<div') -> ["<div", "div", index: 0, input: "<div"]
						rtagName.exec('<div>') ->["<div", "div", index: 0, input: "<div>"]
						rtagName.exec('<div><span') -> ["<div", "div", index: 0, input: "<div><span"]

						注意这里的正则没有全局 g 匹配，所以只会取第一个标签

						下面的 tag 就是匹配出来的元素标签名
					*/
					tag = (rtagName.exec(elem) || ["", ""])[1].toLowerCase();
					/*
						wrap 是从 wrapMap 中匹配出来的数组
						eg:
						tag 为 thead，wrap 为 [ 1, "<table>", "</table>" ]
						tag 不在 wrapMap 属性列表里，wrap 为默认的 [ 0, "", "" ]
					*/
					wrap = wrapMap[tag] || wrapMap._default;
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
					tmp.innerHTML = wrap[1] + elem.replace(rxhtmlTag, "<$1></$2>") + wrap[2];

					// Descend through wrappers to the right content
					/*
						假如：tmp.innerHTML = <table><tbody><tr><td></td></tr></tbody></table>
						j = 3
						执行完下面的循环 tmp = <tr><td></td></tr>
					*/
					j = wrap[0];
					while (j--) {
						tmp = tmp.lastChild;
					}

					// Support: QtWebKit
					// jQuery.merge because core_push.apply(_, arraylike) throws
					jQuery.merge(nodes, tmp.childNodes);

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
		while ((elem = nodes[i++])) {

			// #4087 - If origin and destination elements are the same, and this is
			// that element, do not do anything
			/*
				jQuery.inArray : function ( elem, arr, i ) {
					return arr == null ? -1 : core_indexOf.call( arr, elem, i );
				}

				如果 elem 在数组 selection 里，则跳过这次循环
			*/
			if (selection && jQuery.inArray(elem, selection) !== -1) {
				continue;
			}

			// 判断 elem 是否已经在 document 文档当中
			contains = jQuery.contains(elem.ownerDocument, elem);

			// Append to fragment
			/*
				① appendChild 方法返回被添加的节点
				② getAll 返回指定元素（参数 1）中标签名为参数 2 的子元素组成的数组
				③ 获取 elem 中的 script 元素
			*/
			tmp = getAll(fragment.appendChild(elem), "script");

			// Preserve script evaluation history
			/*
				① setGlobalEval 会依次给 tmp 中每一个元素加一个 "globalEval" 属性：
				 for 循环: data_priv.set(elems[ i ], "globalEval",true)
				② contains 为 true，表示 elem 是否已经在 document 文档当中，那么就表示脚本执行过了
			*/
			if (contains) {
				setGlobalEval(tmp);
			}

			// Capture executables
			// domManip 方法调用 buildFragment 方法时，scripts 为 false，以下就没什么事了
			if (scripts) {
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
				while ((elem = tmp[j++])) {
					if (rscriptType.test(elem.type || "")) {
						scripts.push(elem);
					}
				}
			}
		}

		return fragment;
	},

	// 删除元素上的缓存数据（绑定的事件，用户添加的数据等等）
	cleanData: function (elems) {
		var data, elem, events, type, key, j,
			special = jQuery.event.special,
			i = 0;

		for (; (elem = elems[i]) !== undefined; i++) {
			/*
				① 如果是文档节点，只有 nodeType 是 1 或 9，返回 true
				② 如果是普通对象，都返回 true
			*/
			if (Data.accepts(elem)) {
				/*
					① 每个 Data() 构造函数里有一句：this.expando = jQuery.expando + Math.random();
					 所以，每一个 Data 实例都有一个固定的 expando 属性
					② data_priv = new Data(); 所以 data_priv 也有 expando 属性
					③ elem[ data_priv.expando ] 是 1,2,3...这种自然数
					④ data_priv.cache[ elem[ data_priv.expando ] ] 就是 elem 的私有缓存数据
				*/
				key = elem[data_priv.expando];

				if (key && (data = data_priv.cache[key])) {
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
					events = Object.keys(data.events || {});
					if (events.length) {
						for (j = 0; (type = events[j]) !== undefined; j++) {
							// 特殊事件，用 jQuery.event.remove 方法移除，开销较大
							if (special[type]) {
								jQuery.event.remove(elem, type);

								// This is a shortcut to avoid jQuery.event.remove's overhead
								// 一般的，用 jQuery.removeEvent 调用原生的 removeEventListener 方法移除事件
							} else {
								jQuery.removeEvent(elem, type, data.handle);
							}
						}
					}
					// 元素 elem 对应的【私有数据】都删除
					if (data_priv.cache[key]) {
						// Discard any remaining `private` data
						delete data_priv.cache[key];
					}
				}
			}
			// Discard any remaining `user` data
			// 元素 elem 对应的【用户添加的数据】都删除
			delete data_user.cache[elem[data_user.expando]];
		}
	},

	// get 方式的 ajax 请求
	_evalUrl: function (url) {
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
function manipulationTarget(elem, content) {
	/*
		注意运算符优先级：
		&& 高于 || 高于 ? :

		① 如果元素 elem 的 nodeName 为 table，并且 content 元素为 tr，返回 elem 下第一个 tbody 元素（没有就创建一个）
		③ 否则，直接返回 elem
	*/
	return jQuery.nodeName(elem, "table") &&
		jQuery.nodeName(content.nodeType === 1 ? content : content.firstChild, "tr") ?

		elem.getElementsByTagName("tbody")[0] ||
		elem.appendChild(elem.ownerDocument.createElement("tbody")) :
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
function disableScript(elem) {
	elem.type = (elem.getAttribute("type") !== null) + "/" + elem.type;
	return elem;
}
/*
	rscriptTypeMasked = /^true\/(.*)/

	rscriptTypeMasked.exec("text/javascript")
	-> null
	rscriptTypeMasked.exec("true/text/javascript")
	->["true/text/javascript", "text/javascript", index: 0, input: "true/text/javascript"]

	restoreScript 方法解除脚本的禁用状态
*/
function restoreScript(elem) {
	var match = rscriptTypeMasked.exec(elem.type);

	if (match) {
		elem.type = match[1];
	} else {
		elem.removeAttribute("type");
	}

	return elem;
}

// Mark scripts as having already been evaluated
function setGlobalEval(elems, refElements) {
	var l = elems.length,
		i = 0;

	for (; i < l; i++) {
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
			elems[i], "globalEval", !refElements || data_priv.get(refElements[i], "globalEval")
		);
	}
}

// 复制附加数据和绑定事件
function cloneCopyEvent(src, dest) {
	var i, l, eventType, pdataOld, pdataCur, udataOld, udataCur, events;

	// 如果目标不是 Element，直接返回
	if (dest.nodeType !== 1) {
		return;
	}

	// 1. Copy private data: events, handlers, etc.
	// 如果有私有的缓存数据（events, handlers 等）
	if (data_priv.hasData(src)) {
		// 获取 src 的私有数据
		pdataOld = data_priv.access(src);
		// 将 src 的私有数据依次复制给 dest
		pdataCur = data_priv.set(dest, pdataOld);
		// 事件是比较特殊的私有数据，直接复制过去还不行，还需要重新绑定事件
		events = pdataOld.events;

		if (events) {
			delete pdataCur.handle;
			pdataCur.events = {};

			// 源文件中这里的变量名是 type，在 sublime 编辑器下会影响下文的关键词高亮效果，所以这里改了个变量名
			for (eventType in events) {
				for (i = 0, l = events[eventType].length; i < l; i++) {
					// 依次把事件绑定到目标元素上
					jQuery.event.add(dest, eventType, events[eventType][i]);
				}
			}
		}
	}

	// 2. Copy user data
	// 如果有自己添加的缓存数据
	if (data_user.hasData(src)) {
		udataOld = data_user.access(src);
		// 为什么要先把缓存数据给一个中间变量呢？难道是因为这里的数据可以被用户更改，保险起见！
		udataCur = jQuery.extend({}, udataOld);
		// 将源节点的数据赋值给目标节点
		data_user.set(dest, udataCur);
	}
}



// 根据标签名选择元素
function getAll(context, tag) {
	var ret = context.getElementsByTagName ? context.getElementsByTagName(tag || "*") :
		context.querySelectorAll ? context.querySelectorAll(tag || "*") :
			[];

	/*
		&&　优先级高于　||
		① 没有 tag 参数或 context 的 nodeName 就是 tag，这时 ret 为 [context 所有子节点组成的数组]，所以返回的是数组 [ context, 所有子节点 ]
		② 有 tag 参数，返回的是 context 中标签名为 tag 的子元素组成的数组 [node1,node2,...]
	*/
	return tag === undefined || tag && jQuery.nodeName(context, tag) ?
		jQuery.merge([context], ret) :
		ret;
}

// Support: IE >= 9
// 将单选框或复选框的值复值过去，克隆 clone 节点的时候调用这个方法
function fixInput(src, dest) {
	var nodeName = dest.nodeName.toLowerCase();

	// Fails to persist the checked state of a cloned checkbox or radio button.
	/*
		① manipulation_rcheckableType = /^(?:checkbox|radio)$/i 匹配单选框或复选框
		② 强制将源节点的选中状态赋值给目标节点
	*/
	if (nodeName === "input" && manipulation_rcheckableType.test(src.type)) {
		dest.checked = src.checked;

		// Fails to return the selected option to the default selected state when cloning options
		/*
			不会复制某些表单元素的动态，例如用户在 <textarea> 输入的内容、用户在<select>中选择的选项。
		*/
	} else if (nodeName === "input" || nodeName === "textarea") {
		dest.defaultValue = src.defaultValue;
	}
}


jQuery.fn.extend({
	/*
		作用：用于在所有匹配元素用单个元素包裹起来
		分三步：
		① 根据选择器匹配出元素，然后克隆它，作为【包裹元素】
		② 毕竟【包裹元素】，总得找个地方插入文档的。如果当期元素已经在文档里，那么，把包裹元素放到 this[0] 前面。
		③ 把 this 用【包裹元素】最深子节点包裹起来
	*/
	wrapAll: function (html) {
		var wrap;

		// 参数是函数，递归调用本方法
		if (jQuery.isFunction(html)) {
			return this.each(function (i) {
				jQuery(this).wrapAll(html.call(this, i));
			});
		}

		// 最起码得有一个元素，否则不往下执行了
		if (this[0]) {

			// The elements to wrap the target around
			// 包裹元素
			wrap = jQuery(html, this[0].ownerDocument).eq(0).clone(true);

			/*
			① parentNode 存在说明元素在文档里，例如 html 节点的父节点是 document
				 document.documentElement.parentNode === document -> true

			② warp 元素插入到 this[0] 元素前面
			 */
			if (this[0].parentNode) {
				wrap.insertBefore(this[0]);
			}

			/*
				①jQuery.fn.map: function ( callback ) {
					return this.pushStack( jQuery.map( this, function( elem, i ) {
						return callback.call( elem, i, elem );
					}));
				}
				②jQuery.map: function ( elems, callback, arg ) {
					...
					value = callback( elems[ i ], i, arg )
					...
				}

				所以，以下的回调函数里的 this 就是 elem[i]，也就是 wrap[i]
				层层往下找到最深的节点，然后把 this 添加到 warp 下最深的节点里
			 */
			wrap.map(function () {
				var elem = this;

				while (elem.firstElementChild) {
					elem = elem.firstElementChild;
				}

				return elem;
			}).append(this);
		}

		return this;
	},

	wrapInner: function (html) {
		// 函数参数，递归调用
		if (jQuery.isFunction(html)) {
			return this.each(function (i) {
				jQuery(this).wrapInner(html.call(this, i));
			});
		}

		return this.each(function () {
			var self = jQuery(this),
				// jQuery.fn.contents 返回当前元素子元素组成的数组
				contents = self.contents();

			// 在每个匹配元素的所有子节点外部包裹指定的 html 结构
			if (contents.length) {
				contents.wrapAll(html);
			// 在元素 self 内部末尾插入子节点 html
			} else {
				self.append(html);
			}
			/*
				上面两种插入方式其实本质上还是一种
				① 如果 self 有子节点，用 html 把子节点包裹起来，那 html 还是在 self 内部
				② 如果 self 没有子节点，那么，直接把 html 插入 self 内部
			 */
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
	// wrapAll 是把整个 this 用 html 包裹起来，而 warp 是每个 this[i] 用 html 包裹起来
	wrap: function (html) {
		var isFunction = jQuery.isFunction(html);

		return this.each(function (i) {
			jQuery(this).wrapAll(isFunction ? html.call(this, i) : html);
		});
	},

	// 移除每个匹配元素的父元素
	unwrap: function () {
		/*
			① jQuery.fn.parent 方法有个入栈操作，后面有个 end 方法 出栈
			② 对每个元素的父元素进行替换
		 */
		return this.parent().each(function () {
			if (!jQuery.nodeName(this, "body")) {
				jQuery(this).replaceWith(this.childNodes);
			}
		}).end();
	}
});



var curCSS, iframe,
	// swappable if display is none or starts with table except "table", "table-cell", or "table-caption"
	// see here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
	rdisplayswap = /^(none|table(?!-c[ea]).+)/,
	rmargin = /^margin/,
	rnumsplit = new RegExp("^(" + core_pnum + ")(.*)$", "i"),
	rnumnonpx = new RegExp("^(" + core_pnum + ")(?!px)[a-z%]+$", "i"),
	rrelNum = new RegExp("^([+-])=(" + core_pnum + ")", "i"),
	elemdisplay = { BODY: "block" },

	cssShow = { position: "absolute", visibility: "hidden", display: "block" },
	cssNormalTransform = {
		letterSpacing: 0,
		fontWeight: 400
	},

	cssExpand = ["Top", "Right", "Bottom", "Left"],
	cssPrefixes = ["Webkit", "O", "Moz", "ms"];

// return a css property mapped to a potentially vendor prefixed property
/*
	① 如果属性 name 在 style 对象里就直接返回这个传进来的 name；
	② 如果 ① 不成立，那就循环给 name 加上 cssPrefixes 中的前缀，修正后的 name 在 style 里有则立即跳出循环，返回修正后的 name
	③ 以上都不成立，则返回传进来的 name
*/
function vendorPropName(style, name) {

	// shortcut for names that are not vendor prefixed
	if (name in style) {
		return name;
	}

	// check for vendor prefixed names
	var capName = name.charAt(0).toUpperCase() + name.slice(1),
		origName = name,
		i = cssPrefixes.length;

	while (i--) {
		// chrome 下：borderEnd -> webkitBorderEnd
		name = cssPrefixes[i] + capName;
		if (name in style) {
			return name;
		}
	}

	return origName;
}


/*
	作用：判断元素 elem 是否隐藏了（不包括 hidden）
	eg:
	例子一：
	<div id="d1" style="display:none">display:none</div>
	<div id="d2" style="visibility:hidden">visibility:hidden</div>
	<script id="script1" type="text/javascript" src="js/jquery-2.0.3.js"></script>

	① display:none 返回 true
	isHidden(d1) -> true

	② visibility:hidden 返回 false
	isHidden(d2) -> false

	③ 默认隐藏的元素 返回 true
	script1.style.display -> ""
	isHidden(script1) -> true

	例子二：
	元素 style 没有设置 display 属性，在样式表里设置：
	<style>
		#div1 {
			display:none;
		}
	</style>
	<div id="div1">display:none</div>

	div1.style.display -> ""
	isHidden(div1) -> true
*/
function isHidden(elem, el) {
	// isHidden might be called from jQuery#filter function;
	// in that case, element will be second argument
	elem = el || elem;
	return jQuery.css(elem, "display") === "none" || !jQuery.contains(elem.ownerDocument, elem);
}

// NOTE: we've included the "window" in window.getComputedStyle
// because jsdom on node.js will break without it.
// 获取元素 elem 当前所有样式
function getStyles(elem) {
	return window.getComputedStyle(elem, null);
}

function showHide(elements, show) {
	var display, elem, hidden,
		values = [],
		index = 0,
		length = elements.length;

	for (; index < length; index++) {
		elem = elements[index];
		// 当前元素没有 style 属性，跳过
		if (!elem.style) {
			continue;
		}

		values[index] = data_priv.get(elem, "olddisplay");
		display = elem.style.display;
		if (show) {
			// Reset the inline display of this element to learn if it is
			// being hidden by cascaded rules or not
			// 将元素的 style.display 属性设为 "" (默认值)，以便知道元素到底为什么隐藏
			if (!values[index] && display === "none") {
				/*
					注意：elem.style.display = "" ，使得元素恢复默认的 display 属性
					比如，使得 div 按照块级框显示，span 按照行内框显示，script 等本来就不可见的标签还是不显示

					eg:
					(1) 没有样式表，只是在 style 标签上给元素的 display 属性赋值
					① 在页面里新建 3 个元素：
					<script id="script1" type="text/javascript" src="js/jquery-2.0.3.js"></script>
					<span id="span1" style="display:none">元素 display:none</span>
					<div id="div1" style="display:none">display:none</div>

					② 以上 script 默认不显示，span、div 是强制不显示，下面分别打印它们的 style.display 属性：
					script1.style.display -> ""
					span1.style.display -> "none"
					div1.style.display-> "none"

					③ 分别对它们设置 style.display = ""
					script1.style.display = "";
					span1.style.display = "";
					div1.style.display = "";

					script1 还是看不见，span1、div1 可以看见了，只是 span1 以行内框显示，div1 以块级框显示

					④ 再次打印它们的 style.display 属性，都是 ""：
					script1.style.display -> ""
					span1.style.display -> ""
					div1.style.display-> ""

					⑤ 可见，elem.style.display = "" 的作用是使得元素恢复默认的 display 属性

					(2) 有样式表
					#div1 {
						display:none;
					}

					样式表里将 div1 的 display 属性设为 none，那么
					div1.style.display = "";

					div1 显示出来！！

					这说明，div1.style.display = "" 只是修改 style.display 为默认值，并不能决定元素可见

					元素可不可见除了取决于元素类型（script、style 等标签默认隐藏），还取决于有没有样式表设定它的 display 属性

					(3) 再看看 elem.style.display = ""，其实也挺容易理解的：
					一般情况下，我们不会给在元素标签里给元素单独设置 style 值，那么 style.display 默认值就是 ""，也挺简单的一个道理
				*/
				elem.style.display = "";
			}

			// Set elements which have been overridden with display: none
			// in a stylesheet to whatever the default browser style is
			// for such an element
			// 样式表里设置了 display : none 的元素
			if (elem.style.display === "" && isHidden(elem)) {
				/*
					① css_defaultDisplay(elem.nodeName) 获取 elem 元素的默认 display 属性
					② data_priv.access 方法是设置还是获取值取决于参数
						 a. css_defaultDisplay(elem.nodeName) 为 undefined，获取值：
								values[ index ] = data_priv.get( elem, "olddisplay" )
						 b. css_defaultDisplay(elem.nodeName) 有值，设置值：
								values[ index ] = css_defaultDisplay(elem.nodeName)
				*/
				values[index] = data_priv.access(elem, "olddisplay", css_defaultDisplay(elem.nodeName));
			}
		} else {
			/*
				① values[ index ] = data_priv.get( elem, "olddisplay" )
				② 如果没有缓存 olddisplay 属性，这里存一下
			*/
			if (!values[index]) {
				hidden = isHidden(elem);

				/*
					① display = elem.style.display;
					② display && display !== "none"，说明 display 不是 "" 也不是 "none"，display 可能是其他值
					③ 运算符优先级 && 高于 ||
				*/
				if (display && display !== "none" || !hidden) {
					/*
						① hidden 为 true，说明，elem 的最终呈现的 display 属性为 none，
						 但是 elem.style.display !== "none"，所以一定是样式表里设置了 none
						 这时，把 display 属性存起来

						② hidden 为 false，说明元素可见， elem 的最终呈现的 display 属性肯定不为 none
						 这时，把 jQuery.css(elem, "display") 存起来
					*/
					data_priv.set(elem, "olddisplay", hidden ? display : jQuery.css(elem, "display"));
				}
			}
		}
	}

	// Set the display of most of the elements in a second loop
	// to avoid the constant reflow
	// 这个循环真正来设置元素的 display 属性
	for (index = 0; index < length; index++) {
		elem = elements[index];
		if (!elem.style) {
			continue;
		}
		/*
			这个 if 判断条件有点奇怪，换种方式看：
			!show || elem.style.display === "none" || elem.style.display === ""
			-> !(show && elem.style.display !== "none" && elem.style.display !== "")

			也就是说满足以下条件的元素就不会进入 if 语句：
			show && elem.style.display !== "none" && elem.style.display !== ""

			show 的作用就是让元素显示出来。
			如果满足 elem.style.display !== "none" && elem.style.display !== ""
			那这个元素必定可见啊，那就没必要进入 if 语句重新设置一遍了
		*/
		if (!show || elem.style.display === "none" || elem.style.display === "") {
			/*
				① show 为 true，设置 display 为 values[ index ] || ""
				② show 为 false，设置 display 为 "none"
			*/
			elem.style.display = show ? values[index] || "" : "none";
		}
	}

	return elements;
}

jQuery.fn.extend({
	css: function (name, value) {
		/*
			这里说的 this 都是指调用 jQuery.fn.css 方法的 jQuery 实例对象
			(1) value 有值的情况
				① name 和 value 都是字符串等非函数值
				 -> for 循环：fn( this[i], name, value )
				 -> return this
				② name == undefined，value 是字符串等非函数值（用 value 渠道 name）
				 -> fn.call ( this, value )
				 -> return this
				③ name == undefined，value 是函数，稍微复杂，不在这里写

			(2) value 没值的情况，value == undefined
				① name 为字符串
				 -> fn( this[0], name )
		*/
		return jQuery.access(this, function (elem, name, value) {
			var styles, len,
				map = {},
				i = 0;


			// jQuery.isArray: Array.isArray 原生方法判断数组
			if (jQuery.isArray(name)) {
				// 获取元素最终呈现样式
				styles = getStyles(elem);
				len = name.length;

				for (; i < len; i++) {
					map[name[i]] = jQuery.css(elem, name[i], false, styles);
				}

				// name 是数组的时候，返回数组里的所有属性对应的属性值（最终渲染的）
				return map;
			}

			/*
			① value 不为 undefined，设置值 jQuery.style( elem, name, value )
			② value 为 undefined，获取值 jQuery.css( elem, name )
			*/
			return value !== undefined ?
				jQuery.style(elem, name, value) :
				jQuery.css(elem, name);
		}, name, value, arguments.length > 1);
	},
	// 显示 this 下面的所有元素
	show: function () {
		return showHide(this, true);
	},
	// 隐藏 this 下面的所有元素
	hide: function () {
		return showHide(this);
	},
	// 显示/隐藏 状态切换
	toggle: function (state) {
		// 参数是布尔值，强制 this 下所有的元素 显示/隐藏
		if (typeof state === "boolean") {
			return state ? this.show() : this.hide();
		}

		// 参数不是布尔值，针对 this 下每一个元素，隐藏的显示，显示的隐藏
		return this.each(function () {
			if (isHidden(this)) {
				jQuery(this).show();
			} else {
				jQuery(this).hide();
			}
		});
	}
});

jQuery.extend({
	// Add in style property hooks for overriding the default
	// behavior of getting and setting a style property
	cssHooks: {
		opacity: {
			get: function (elem, computed) {
				if (computed) {
					// We should always get a number back from opacity
					var ret = curCSS(elem, "opacity");
					return ret === "" ? "1" : ret;
				}
			}
		}
	},

	// Don't automatically add "px" to these possibly-unitless properties
	// 这些属性数字后不能加 'px'
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
	// 获取或者设置元素 style 属性
	style: function (elem, name, value, extra) {
		// Don't set styles on text and comment nodes
		// 文本节点和注释节点，直接返回
		if (!elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style) {
			return;
		}

		// Make sure that we're working with the right name
		var ret, type, hooks,
			/*
				jQuery.camelCase 将 css 属性名转成驼峰写法（将 - 后面的字母转成大写）：
				eg:
				margin-top -> marginTop
				-moz-transform -> MozTransform
				-webkit-transform -> WebkitTransform
			*/
			origName = jQuery.camelCase(name),
			style = elem.style;

		/*
			① jQuery.cssProps: {
					// normalize float css property
					"float": "cssFloat"
			 }
			② 如果在 jQuery.cssProps 对象中找到对应的属性名，则 name 就是这个找到的属性名；
			③ 如果在 jQuery.cssProps 对象中找不到，则：
			 a. vendorPropName( style, origName ) 返回修正后的 origName
			 b. 将这个修正后的 origName 存入 jQuery.cssProps 对象
			 c. 将这个修正后的 origName 赋值给 name

			总之，name 就是 css 属性名在 style 对象中对应的属性名

			列 2 个的 style 属性名举例：
			(1) "border"
			-> origName = jQuery.camelCase( "border" )
				-> origName = "border"
				-> vendorPropName( style, "border" )
				-> name = "border"
			(2) "border-bottom"
			-> origName = jQuery.camelCase( "border-bottom" )
				-> origName = "borderBottom"
				-> vendorPropName( style, "borderBottom" )
				-> name = "borderBottom"
		*/
		name = jQuery.cssProps[origName] || (jQuery.cssProps[origName] = vendorPropName(style, origName));

		/*
		jQuery.cssHooks : {
			borderWidth : {
				expand : function(){},
				set : function(){}
			},
			height : {
				get : function(){},
				set : function(){}
			},
			margin : {
				expand : function(){}
			},
			opacity : {
				get : function(){}
			},
			padding : {
				expand : function(){},
				set : function(){}
			},
			width : {
				get : function(){},
				set : function(){}
			}
		}
		*/
		// gets hook for the prefixed version
		// followed by the unprefixed version
		hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName];

		// Check if we're setting a value
		// 有 value 值，表示设置
		if (value !== undefined) {
			type = typeof value;


			/*
				rrelNum = new RegExp( "^([+-])=(" + core_pnum + ")", "i" )
				① core_pnum 匹配数字，包括正负号、科学计数法、.开头等多种情况的数字
				② rrelNum 匹配 "+=3" 这种字符串，注意 = 左右不能有空格

				rrelNum.exec("+=3") -> ["+=3", "+", "3", index: 0, input: "+=3"]
				rrelNum.exec("+ =3") -> null
				rrelNum.exec("+= 3") -> null

				rrelNum.exec("-=3") -> ["-=3", "-", "3", index: 0, input: "-=3"]
			*/
			// convert relative number strings (+= or -=) to relative numbers. #7345
			if (type === "string" && (ret = rrelNum.exec(value))) {
				/*
					对于 ( ret[1] + 1 ) * ret[2]，举例（当然了，数组以下写法会报错的）：
					① ret = rrelNum.exec("+=3") -> ["+=3", "+", "3", index: 0, input: "+=3"]
					 -> ("+" + 1) * "3"
					 -> "+1" * "3"
					 -> 3

					② ret = rrelNum.exec("-=3") -> ["-=3", "-", "3", index: 0, input: "-=3"]
					 -> ("-" + 1) * "3"
					 -> "-1" * "3"
					 -> -3

					value = 相对值 + 原来的值
				*/
				value = (ret[1] + 1) * ret[2] + parseFloat(jQuery.css(elem, name));
				// Fixes bug #9237
				// 经过以上操作，type 已经转为 number 类型了
				type = "number";
			}

			// Make sure that NaN and null values aren't set. See: #7116
			if (value == null || type === "number" && isNaN(value)) {
				return;
			}

			// If a number was passed in, add 'px' to the (except for certain CSS properties)
			/*
				当 value 为 number 类型时，排除一些不能加 'px' 的，剩下的都要加 'px'
				比如：
				① zIndex、opacity、zoom 等应该是纯数字
				② width、height 等数字后要跟 'px'
			*/
			if (type === "number" && !jQuery.cssNumber[origName]) {
				value += "px";
			}

			// Fixes #8908, it can be done more correctly by specifying setters in cssHooks,
			// but it would mean to define eight (for every problematic property) identical functions
			/*
				关于 jQuery.support.clearCloneStyle ，举个例子：

				var div = document.createElement('div');
				div.style.backgroundColor = 'red';
				div.cloneNode(true).style.backgroundColor = '';
				console.log(div.style.backgroundColor);
				// red

				克隆一个节点后，给新的节点背景颜色值设为 ''，那么源节点的背景颜色应该保持不变才对，
				大多数浏览器打印结果都是 'red'；可是，ie 浏览器偏不，打印结果是 ''

				除了背景色 backgroundColor，其他的背景属性 backgroundXxx 都有这个问题

				满足以下条件，就将 style[ name ] = "" 写成 style[ name ] = "inherit"
			*/
			if (!jQuery.support.clearCloneStyle && value === "" && name.indexOf("background") === 0) {
				style[name] = "inherit";
			}

			// If a hook was provided, use that value, otherwise just set the specified value
			/*
				这种判断条件挺巧妙的：
				① 如果 !hooks || !("set" in hooks) ，则直接执行 style[ name ] = value;
				② 如果 ① 的条件不满足，则执行 (value = hooks.set( elem, value, extra ))
				 这里就用了钩子方法的设置操作
				③ a. 如果 ② 的执行结果为 undefined，结束
				 b. 如果 ② 的执行结果不为 undefined，则继续执行 style[ name ] = value;
			*/
			if (!hooks || !("set" in hooks) || (value = hooks.set(elem, value, extra)) !== undefined) {
				style[name] = value;
			}
			// value === undefined 获取值
		} else {
			// If a hook was provided get the non-computed value from there
			/*
				注意：hooks.get() 方法第二个参数是 false 表示取 non-computed 值，以 jQuery.cssHooks[ "width" ] 为例：
				jQuery.cssHooks[ "width" ].get = function( elem, computed, extra ) {
					if ( computed ) {...}
				}
				所以，当 computed 为 false 时，这里返回默认值 undefined
			*/
			if (hooks && "get" in hooks && (ret = hooks.get(elem, false, extra)) !== undefined) {
				return ret;
			}

			// Otherwise just get the value from the style object
			return style[name];
		}
	},

	// 获取元素最终的属性值（大部分情况下通过 curCSS 方法获取）
	css: function (elem, name, extra, styles) {
		var val, num, hooks,
			/*
				jQuery.camelCase 会将 - 后面的字母转成大写
				eg:
				jQuery.camelCase( 'border' )-> "border"
				jQuery.camelCase( 'margin-top' )-> "marginTop"
			*/
			origName = jQuery.camelCase(name);

		// Make sure that we're working with the right name
		// name 就是 css 属性名在 style 对象中对应的属性名
		name = jQuery.cssProps[origName] || (jQuery.cssProps[origName] = vendorPropName(elem.style, origName));

		// gets hook for the prefixed version
		// followed by the unprefixed version
		hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName];

		// If a hook was provided get the computed value from there
		if (hooks && "get" in hooks) {
			val = hooks.get(elem, true, extra);
		}

		// Otherwise, if a way to get the computed value exists, use that
		// 如果上面的钩子方法没有得到值，那就获取渲染的值
		if (val === undefined) {
			val = curCSS(elem, name, styles);
		}


		/*
			① cssNormalTransform = {
				letterSpacing: 0,
				fontWeight: 400
			}
			② 将 "normal" 转成数字
		*/
		//convert "normal" to computed value
		if (val === "normal" && name in cssNormalTransform) {
			val = cssNormalTransform[name];
		}

		// Return, converting to number if forced or a qualifier was provided and val looks numeric
		if (extra === "" || extra) {
			num = parseFloat(val);
			return extra === true || jQuery.isNumeric(num) ? num || 0 : val;
		}
		return val;
	}
});

// 获取元素的最终渲染后得到的属性值（少数属性值需要修正）
curCSS = function (elem, name, _computed) {
	var width, minWidth, maxWidth,
		/*
			① getStyles( elem ) 获取元素 elem 最终的样式
			② 如果已经算好了最终样式 _computed，那就用这个 _computed
			③ 否则重新算 getStyles( elem )
		*/
		computed = _computed || getStyles(elem),

		// Support: IE9
		// getPropertyValue is only needed for .css('filter') in IE9, see #12537
		ret = computed ? computed.getPropertyValue(name) || computed[name] : undefined,
		style = elem.style;

	if (computed) {
		// ret === "" 并且 elem 不在文档中
		if (ret === "" && !jQuery.contains(elem.ownerDocument, elem)) {
			/*
				① jQuery.styl 会先从钩子方法获取属性
				② 如果 ① 中没有获取到，直接从 elem.style 获取
			*/
			ret = jQuery.style(elem, name);
		}

		// Support: Safari 5.1
		// A tribute to the "awesome hack by Dean Edwards"
		// Safari 5.1.7 (at least) returns percentage for a larger set of values, but width seems to be reliably pixels
		// this is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
		/*
			① rnumnonpx = new RegExp( "^(" + core_pnum + ")(?!px)[a-z%]+$", "i" )
			例如：
			rnumnonpx.test('20px') -> false

			rnumnonpx.test('20abc') -> true
			rnumnonpx.test('20%') -> true

			② rmargin = /^margin/
			rmargin.test('margin-top') -> true
		*/
		// 针对 name 是 /^margin/ 并且值是百分数的情况，修正 ret
		if (rnumnonpx.test(ret) && rmargin.test(name)) {

			// Remember the original values
			// 保存原来的值
			width = style.width;
			minWidth = style.minWidth;
			maxWidth = style.maxWidth;

			/*
				改变 elem.style 的属性，会立即改变 computed，举个例子：
				<div id="div1">div1</div>

				computed =getStyles( div1 );
				console.log(computed.width) -> "auto"

				div1.style.width = '100px';
				console.log(computed.width) -> "100px"
			*/
			// Put in the new values to get a computed value out
			style.minWidth = style.maxWidth = style.width = ret;
			ret = computed.width;

			// Revert the changed values
			// 恢复原来的值
			style.width = width;
			style.minWidth = minWidth;
			style.maxWidth = maxWidth;
		}
	}

	// 绝大多数情况，不需要修正，直接在这里返回 getStyles( elem )[name]
	return ret;
};

// 从一段字符串里取出 '12px' 这样的【数值+单位】的子串
function setPositiveNumber(elem, value, subtract) {
	/*
		整个函数都没用到 elem 变量，为什么？

		rnumsplit = new RegExp( "^(" + core_pnum + ")(.*)$", "i" ) 把字符串中的数字匹配出来
		其中 . 表示除换行符以外的任意字符

		eg :
		rnumsplit.exec('1.2') -> ["1.2", "1.2", "", index: 0, input: "1.2"]
		rnumsplit.exec('1abc') -> ["1abc", "1", "abc", index: 0, input: "1abc"]

		① 如果字符串 value 中不包含数字，那就直接返回这个字符串

		② Math.max( 0, matches[ 1 ] - ( subtract || 0 ) ) + ( matches[ 2 ] || "px" )
		 数值 + 单位（默认是 'px'）

		 a. 数值 Math.max( 0, matches[ 1 ] - ( subtract || 0 ) )
		 b. 单位 ( matches[ 2 ] || "px" )
	*/
	var matches = rnumsplit.exec(value);
	return matches ?
		// Guard against undefined "subtract", e.g., when used as in cssHooks
		Math.max(0, matches[1] - (subtract || 0)) + (matches[2] || "px") :
		value;
}

// 针对 extra 的 width/height 修正值
function augmentWidthOrHeight(elem, name, extra, isBorderBox, styles) {
	/*
		① extra === ( isBorderBox ? "border" : "content" ) ―> i = 4
		② 否则:
		 a. name === "width" -> i = 1
		 b. name !== "width" -> i = 0
	*/
	var i = extra === (isBorderBox ? "border" : "content") ?
		// If we already have the right measurement, avoid augmentation
		4 :
		// Otherwise initialize for horizontal or vertical properties
		name === "width" ? 1 : 0,

		val = 0;

	/*
		① i 为 4 ，不会进入下面的循环，直接返回 0
		② i 为 1 或 0 ，执行 2 次循环

		a. i 为 1，name === "width"
		 下面循环两次，其实是 i 为 1 和 3，以 extra === "margin" 为例，对应：
			extra + cssExpand[ 1 ] -> "marginRight"
			extra + cssExpand[ 3 ] -> "marginLeft"
		b. i 为 0，name === "height"
		 下面循环两次，其实是 i 为 0 和 2，以 extra === "margin" 为例，对应：
			extra + cssExpand[ 0 ] -> "marginTop"
			extra + cssExpand[ 2 ] -> "marginBottom"
	*/
	for (; i < 4; i += 2) {
		// both box models exclude margin, so add it if we want it
		if (extra === "margin") {
			/*
				① cssExpand = [ "Top", "Right", "Bottom", "Left" ]
				② jQuery.css 方法第三个参数是 true，表示最终结果会转为为 number 类型
				③ 不管是 content-box 还是 border-box 算整个元素框尺寸时都要加上 margin
			*/
			val += jQuery.css(elem, extra + cssExpand[i], true, styles);
		}
		/*
			 border-box 包括 padding 和 border，所以有：
			 ① extra === "margin"
					val += jQuery.css( elem, extra + cssExpand[ i ], true, styles );
			 ② extra === "border"
					不会进入 for 循环，不用修正
			 ③ extra === "padding"
					val -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			 ④ extra === "content"
					val -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
					val -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
		 */

		if (isBorderBox) {
			// border-box includes padding, so remove it if we want content
			if (extra === "content") {
				val -= jQuery.css(elem, "padding" + cssExpand[i], true, styles);
			}

			// at this point, extra isn't border nor margin, so remove border
			if (extra !== "margin") {
				val -= jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);
			}
			/*
				content-box 不包括 padding 和 border，所以有：
				① extra === "margin"
					 val += jQuery.css( elem, extra + cssExpand[ i ], true, styles );
					 val += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
					 val += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
				② extra === "border"
					 val += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
					 val += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
				③ extra === "padding"
					 val += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
				④ extra === "content"
					 不会进入 for 循环，不用修正
			 */
		} else {
			// at this point, extra isn't content, so add padding
			val += jQuery.css(elem, "padding" + cssExpand[i], true, styles);

			// at this point, extra isn't content nor padding, so add border
			if (extra !== "padding") {
				val += jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);
			}
		}
	}

	return val;
}

// 针对 extra 的 width/height 值
function getWidthOrHeight(elem, name, extra) {

	// Start with offset property, which is equivalent to the border-box value
	var valueIsBorderBox = true,
		/*
			① offsetWidth 包括 width + padding + border，相当于怪异模式下就是 width
			② offsetHeight 包括 height + padding + border，相当于怪异模式下就是 height
		 */
		val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
		styles = getStyles(elem),
		isBorderBox = jQuery.support.boxSizing && jQuery.css(elem, "boxSizing", false, styles) === "border-box";

	// some non-html elements return undefined for offsetWidth, so check for null/undefined
	// svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
	// MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
	if (val <= 0 || val == null) {
		// Fall back to computed then uncomputed css if necessary
		// 首先获取最终的渲染值
		val = curCSS(elem, name, styles);
		// 不行的话，再获取 style 属性
		if (val < 0 || val == null) {
			val = elem.style[name];
		}

		// Computed unit is not pixels. Stop here and return.
		/*
			rnumnonpx = new RegExp( "^(" + core_pnum + ")(?!px)[a-z%]+$", "i" ) 不带 px 单位
			例如：
			rnumnonpx.test('20px') -> false

			rnumnonpx.test('20abc') -> true
			rnumnonpx.test('20%') -> true

			不带 px 单位，直接在这里返回值
		 */
		if (rnumnonpx.test(val)) {
			return val;
		}

		// we need the check for style in case a browser which returns unreliable values
		// for getComputedStyle silently falls back to the reliable elem.style
		/*
			support.boxSizingReliable = ( window.getComputedStyle( div, null ) || { width: "4px" } ).width === "4px";

			在怪异模式（border-box）下：
			① IE 下，width 不等于 4px，需要减去 padding，border
			② 其他浏览器，width 都是 4px

			也就是说，怪异模式下的 ie，应该当做 content-box 来求值
		 */
		valueIsBorderBox = isBorderBox && (jQuery.support.boxSizingReliable || val === elem.style[name]);

		// Normalize "", auto, and prepare for extra
		val = parseFloat(val) || 0;
	}

	// use the active box-sizing model to add/subtract irrelevant styles
	return (val +
		augmentWidthOrHeight(
			elem,
			name,
			extra || (isBorderBox ? "border" : "content"),
			valueIsBorderBox,
			styles
		)
	) + "px";
}

// Try to determine the default display value of an element
// 根据元素名获取元素的默认 display 属性值
function css_defaultDisplay(nodeName) {
	var doc = document,
		// elemdisplay = { BODY: "block" }
		display = elemdisplay[nodeName];

	// nodeName 不是 BODY，执行下面：
	if (!display) {
		/*
			获取 nodeName 类型元素默认的 display 属性
			eg:
			actualDisplay('div',document)-> "block"
			actualDisplay('style',document)-> "none"
			actualDisplay('a',document)-> "inline"
		*/
		display = actualDisplay(nodeName, doc);

		// If the simple way fails, read from inside an iframe
		// 如果上边没有获取的 display 属性或者 display 属性是 none，那就在 iframe 里再获取一遍
		if (display === "none" || !display) {
			// Use the already-created iframe if possible
			/*
				① iframe 是上面定义的一个全局变量，如果没有给它初始化，这里给它初始化
				② 强制 iframe 的 display 属性为 block
				③ appendTo 方法会返回一个原生 dom 元素组成的数组，所以下面要用 iframe[0] 获取原生元素
			*/
			iframe = (iframe ||
				jQuery("<iframe frameborder='0' width='0' height='0'/>")
					.css("cssText", "display:block !important")
			).appendTo(doc.documentElement);

			// Always write a new HTML skeleton so Webkit and Firefox don't choke on reuse
			doc = (iframe[0].contentWindow || iframe[0].contentDocument).document;
			doc.write("<!doctype html><html><body>");
			doc.close();

			display = actualDisplay(nodeName, doc);
			// 从文档中移除这个 iframe
			iframe.detach();
		}

		// Store the correct default display
		elemdisplay[nodeName] = display;
	}

	return display;
}

// Called ONLY from within css_defaultDisplay
/*
	作用：获取标签默认的 display 属性
	eg:
	actualDisplay('div',document)-> "block"
	actualDisplay('style',document)-> "none"
	actualDisplay('a',document)-> "inline"
*/
function actualDisplay(name, doc) {
	var elem = jQuery(doc.createElement(name)).appendTo(doc.body),
		/*
			① elem 是 jQuery( doc.createElement( name ) ) 对应的元素 dom 组成的数组
			② elem[0] 是 doc.createElement( name ) 创建的这个 dom 元素
		*/
		display = jQuery.css(elem[0], "display");
	elem.remove();
	return display;
}

jQuery.each(["height", "width"], function (i, name) {
	jQuery.cssHooks[name] = {
		get: function (elem, computed, extra) {
			if (computed) {
				/*
					① rdisplayswap = /^(none|table(?!-c[ea]).+)/ 匹配 none 或 table 开头但后面不跟 -c[ea]
					eg:
					rdisplayswap.test('none')			 -> true
					rdisplayswap.test('table-column')-> true
					rdisplayswap.test('table-row-group') -> true

					rdisplayswap.test('table-cell') -> false
					rdisplayswap.test('inline')		-> false
					② 有些元素在计算尺寸信息时，需要将其显示才能算
					<div id="div1" style="width:100px;height:100px;background:red">aaa</div>

					a. $('#div1').width() // 100

					还可以这样获取：
					b. $('#div1').get(0).offsetWidth// 100

					不过，当把这个 div 隐藏（display:none）后，a 还是可以得到 100，而 b 只能得到 0
				*/
				// certain elements can have dimension info if we invisibly show them
				// however, it must have a current display style that would benefit from this
				return elem.offsetWidth === 0 && rdisplayswap.test(jQuery.css(elem, "display")) ?
					/*
						① jQuery.swap 作用：给元素 elem 加上样式 cssShow 使得元素显示出来，计算完尺寸后，再将样式还原
						② cssShow = { position: "absolute", visibility: "hidden", display: "block" }
						 这三个属性配合一起使用，可使得元素内容既看不见，又不占据空间，还可以计算尺寸
						③ 属性替换完了，执行getWidthOrHeight( elem, name, extra ) 获取尺寸
						④ 还原属性
					*/
					jQuery.swap(elem, cssShow, function () {
						return getWidthOrHeight(elem, name, extra);
					}) :
					getWidthOrHeight(elem, name, extra);
			}
		},

		set: function (elem, value, extra) {
			var styles = extra && getStyles(elem);
			/*
				① value 表示 width/height 值
				② augmentWidthOrHeight(...) 表示 width/height 的修正值 subtract
				③ 最终设置的值是：Math.max( 0, value - 修正值)
			*/
			return setPositiveNumber(elem, value, extra ?
				augmentWidthOrHeight(
					elem,
					name,
					extra,
					jQuery.support.boxSizing && jQuery.css(elem, "boxSizing", false, styles) === "border-box",
					styles
				) : 0
			);
		}
	};
});

// These hooks cannot be added until DOM ready because the support test
// for it is not run until after DOM ready
jQuery(function () {
	// Support: Android 2.3
	// 有的浏览器 marginRight 计算不准确
	if (!jQuery.support.reliableMarginRight) {
		jQuery.cssHooks.marginRight = {
			get: function (elem, computed) {
				if (computed) {
					// Support: Android 2.3
					// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
					// Work around by temporarily setting element display to inline-block
					/*
						① 有的元素 marginRight 计算不准确，所以用这个钩子方法来算
						② 将元素的 display 属性暂时替换为 "inline-block"
						③ 计算 curCSS( elem, "marginRight" )
						④ 最后将 display 属性还原
					*/
					return jQuery.swap(elem, { "display": "inline-block" },
						curCSS, [elem, "marginRight"]);
				}
			}
		};
	}

	// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
	// getComputedStyle returns percent when specified for top/left/bottom/right
	// rather than make the css module depend on the offset module, we just check for it here
	/*
		① 当元素属性是百分数时，只有 Safari 返回百分数，其他浏览器都会返回像素值
		② 这里指返回百分数并且 jQuery.fn.position 方法存在的情况下
		③ 修正为像素值
	*/
	if (!jQuery.support.pixelPosition && jQuery.fn.position) {
		jQuery.each(["top", "left"], function (i, prop) {
			jQuery.cssHooks[prop] = {
				get: function (elem, computed) {
					if (computed) {
						computed = curCSS(elem, prop);
						// if curCSS returns percentage, fallback to offset
						/*
							① rnumnonpx = new RegExp( "^(" + core_pnum + ")(?!px)[a-z%]+$", "i" )
							 匹配百分数形式

							 例如：
							 rnumnonpx.test('20px') -> false

							 rnumnonpx.test('20%') -> true
							② 如果 computed 是百分数，那就调用 jQuery( elem ).position()[ prop ] 获取像素值
							 否则，就用 computed
						*/
						return rnumnonpx.test(computed) ?
							jQuery(elem).position()[prop] + "px" :
							computed;
					}
				}
			};
		});
	}

});

if (jQuery.expr && jQuery.expr.filters) {
	/*
		① 给 jQuery.expr.filters 对象加上 hidden、visible 等两个方法

		② HTMLElement.offsetWidth 是一个只读属性，返回一个元素的布局宽度。
		一个典型的 offsetWidth 是测量元素的边框(border)、水平线上的内边距(padding)、竖直方向滚动条(scrollbar)（如果存在的话）、以及CSS设置的宽度(width)的值。

		HTMLElement.offsetHeight 同理
	*/
	jQuery.expr.filters.hidden = function (elem) {
		// Support: Opera <= 12.12
		// Opera reports offsetWidths and offsetHeights less than zero on some elements
		return elem.offsetWidth <= 0 && elem.offsetHeight <= 0;
	};

	// 返回值和 hidden 函数相反
	jQuery.expr.filters.visible = function (elem) {
		return !jQuery.expr.filters.hidden(elem);
	};
}

// These hooks are used by animate to expand properties
jQuery.each({
	margin: "",
	padding: "",
	border: "Width"
}, function (prefix, suffix) {
	/*
		① prefix 指 margin、padding、border
		② suffix 指 ""、""、"Width"
	*/
	jQuery.cssHooks[prefix + suffix] = {
		expand: function (value) {
			var i = 0,
				expanded = {},

				// assumes a single number if not a string
				parts = typeof value === "string" ? value.split(" ") : [value];

			for (; i < 4; i++) {
				/*
					① cssExpand = [ "Top", "Right", "Bottom", "Left" ]
					② 组成 marginTop、paddingTop、borderTopWidth 等属性名
					③ 比如 value = "12px 24px 36px 48px"
					 -> parts = ["12px", "24px", "36px", "48px"]
					④ 以 marginLeft 为例：
					 a. 如果 parts[ 3 ] 存在，值为 parts[ 3 ]；
					 b. 以上不存在，值为 parts[ 1 ]；
					 c. 还不存在，值为 parts[ 0 ]

					 这就是 css 中的【值复制】机制
				*/
				expanded[prefix + cssExpand[i] + suffix] =
					parts[i] || parts[i - 2] || parts[0];
			}

			return expanded;
		}
	};

	/*
		① rmargin = /^margin/
			 rmargin.test('margin') -> true

		② jQuery.cssHooks[ "padding" ].set = setPositiveNumber
			 jQuery.cssHooks[ "borderWidth" ].set = setPositiveNumber

		③ setPositiveNumber ：从一段字符串里取出 '12px' 这样的【数值+单位】的子串
	 */
	if (!rmargin.test(prefix)) {
		jQuery.cssHooks[prefix + suffix].set = setPositiveNumber;
	}
});

var r20 = /%20/g,
	rbracket = /\[\]$/,
	rCRLF = /\r?\n/g,
	rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
	rsubmittable = /^(?:input|select|textarea|keygen)/i;

jQuery.fn.extend({
	// $('form').serialize() -> "uid=1&username=%E5%BC%A0%E4%B8%89&password=123456&grade=3&sex=1&hobby=1&hobby=2"
	serialize: function () {
		return jQuery.param(this.serializeArray());
	},
	/*
	作用：返回将表单元素编码后的数组

	例：
	<form name="myForm" action="http://www.365mini.com" method="post">
			<input name="uid" type="hidden" value="1" />
			<input name="username" type="text" value="张三" />
			<input name="password" type="text" value="123456" />
			<select name="grade" id="grade">
					<option value="1">一年级</option>
					<option value="2">二年级</option>
					<option value="3" selected="selected">三年级</option>
					<option value="4">四年级</option>
					<option value="5">五年级</option>
					<option value="6">六年级</option>
			</select>
			<input name="sex" type="radio" checked="checked" value="1" />男
			<input name="sex" type="radio" value="0" />女
			<input name="hobby" type="checkbox" checked="checked" value="1" />游泳
			<input name="hobby" type="checkbox" checked="checked" value="2" />跑步
			<input name="hobby" type="checkbox" value="3" />羽毛球
			<input name="btn" id="btn" type="button" value="点击" />
	</form>

	对<form>元素进行序列化可以直接序列化其内部的所有表单元素：
	var formArray = $("form").serializeArray();

	以下是序列化后的结果数组formArray的内容：
	[
			{ name: "uid", value: "1" },
			{ name: "username", value: "张三" },
			{ name: "password", value: "123456" },
			{ name: "grade", value: "3" },
			{ name: "sex", value: "1" },
			{ name: "hobby", value: "1" },
			{ name: "hobby", value: "2" }
	];

	 */
	serializeArray: function () {
		/*
		jQuery.fn.map: function ( callback ) {
			return this.pushStack( jQuery.map( this, function( elem, i ) {
				return callback.call( elem, i, elem );
			}));
		}
		 */
		// 第一步：将 form 下的所有表单元素找出来
		return this.map(function () {
			// Can add propHook for "elements" to filter or add form elements
			/*
			① 这里的 this 是原生 dom 元素
			② jQuery.fn.map 会将返回的数组包装成 jQuery 对象
			③ elements 集合可返回包含表单中所有元素的数组，即 formObject.elements
				 元素在数组中出现的顺序和它们在表单的 HTML 源代码中出现的顺序相同。
				 每个元素都有一个 type 属性，其字符串值说明了元素的类
			 */
			var elements = jQuery.prop(this, "elements");
			return elements ? jQuery.makeArray(elements) : this;
		})
			// 第二步：将有选中值的 input/option 元素过滤出来
			.filter(function () {
				var type = this.type;
				// Use .is(":disabled") so that fieldset[disabled] works
				/*
				① rsubmittable = /^(?:input|select|textarea|keygen)/i
				rsubmittable.test( this.nodeName )
				节点名必须是以上类型

				② rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i
				!rsubmitterTypes.test( type )
				节点的 type 属性不能是以上类型

				③ manipulation_rcheckableType = /^(?:checkbox|radio)$/i
				!manipulation_rcheckableType.test( type )
				 */
				return this.name && !jQuery(this).is(":disabled") &&
					rsubmittable.test(this.nodeName) && !rsubmitterTypes.test(type) &&
					(this.checked || !manipulation_rcheckableType.test(type));
			})
			// 第三步：依次将选中元素转成 { name: "sex", value: "1" } 形式
			.map(function (i, elem) {
				var val = jQuery(this).val();

				return val == null ?
					null :
					// checkbox 这种，返回值是数组
					jQuery.isArray(val) ?
						jQuery.map(val, function (val) {
							// rCRLF = /\r?\n/g
							return { name: elem.name, value: val.replace(rCRLF, "\r\n") };
						}) :
						// radio 这种，返回单个值
						{ name: elem.name, value: val.replace(rCRLF, "\r\n") };
			}).get();
		// 最后，jQuery.fn.get() 方法，用于将 jQuery 对象转成原生数组
	}
});

//Serialize an array of form elements or a set of
//key/values into a query string
/*
	作用：创建数组或对象的序列化表示
	a：要进行序列化的数组或对象
	traditional：规定是否使用传统的方式浅层进行序列化（参数序列化）
 */
jQuery.param = function (a, traditional) {
	var prefix,
		s = [],
		add = function (key, value) {
			// If value is a function, invoke it and return its value
			/*
				① 如果 value 是函数，那就执行这个函数，并将函数返回值给 value
				② 如果 value 不是函数也不是 null/undefined，那 value 不变，否则 value 为 ""
			 */
			value = jQuery.isFunction(value) ? value() : (value == null ? "" : value);
			/*
				① 给 s[ s.length ] 赋值，相当于数组长度加 1，并且在数组默认插入新值，这种写法相当于 s.push()
				② 插入的新值是 encodeURIComponent 编码后的字符串
			 */
			s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
		};

	// Set traditional to true for jQuery <= 1.3.2 behavior.
	// 如果这里没有设置 traditional 的值，那就取 jQuery.ajaxSettings.traditional 的全局设置
	if (traditional === undefined) {
		traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;
	}

	// If an array was passed in, assume that it is an array of form elements.
	if (jQuery.isArray(a) || (a.jquery && !jQuery.isPlainObject(a))) {
		// Serialize the form elements
		jQuery.each(a, function () {
			add(this.name, this.value);
		});

	} else {
		// If traditional, encode the "old" way (the way 1.3.2 or older
		// did it), otherwise encode params recursively.
		// 深度递归的方式序列化对象
		for (prefix in a) {
			buildParams(prefix, a[prefix], traditional, add);
		}
	}

	// Return the resulting serialization
	/*
		① r20 = /%20/g 表示空格
		② 键值对用 "&" 拼成字符串，然后用 + 替换 空格
	 */
	return s.join("&").replace(r20, "+");
};

// 供 jQuery.param 方法调用，以创建序列号字符串
function buildParams(prefix, obj, traditional, add) {
	var name;

	// obj 是数组
	if (jQuery.isArray(obj)) {
		// Serialize array item.
		jQuery.each(obj, function (i, v) {
			/*
				① rbracket = /\[\]$/ 匹配 [] 结尾
				eg: rbracket.test('[]') -> true
				② 下面非传统方式中，如果 v 不是 object，则以 [] 结尾
			 */
			if (traditional || rbracket.test(prefix)) {
				// Treat each array item as a scalar.
				/*
					① obj 是数组，以 prefix 为键，以 v 为值
					② add 方法在 jQuery.param 方法中定义，这里调用 add 方法会修改数组 s
				 */
				add(prefix, v);

			} else {
				// Item is non-scalar (array or object), encode its numeric index.
				/*
					① typeof v === "object"
					buildParams( prefix+"[i]", v, traditional, add )
					② typeof v !== "object"
					buildParams( prefix+"[]", v, traditional, add )
				 */
				buildParams(prefix + "[" + (typeof v === "object" ? i : "") + "]", v, traditional, add);
			}
		});
		// 非传统方式，并且 obj 是对象
	} else if (!traditional && jQuery.type(obj) === "object") {
		// Serialize object item.
		// 递归
		for (name in obj) {
			buildParams(prefix + "[" + name + "]", obj[name], traditional, add);
		}

	} else {
		// Serialize scalar item.
		add(prefix, obj);
	}
}

jQuery.each(("blur focus focusin focusout load resize scroll unload click dblclick " +
	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
	"change select submit keydown keypress keyup error contextmenu").split(" "), function (i, name) {

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
		jQuery.fn[name] = function (data, fn) {
			return arguments.length > 0 ?
				this.on(name, null, data, fn) :
				this.trigger(name);
		};
	});

jQuery.fn.extend({
	/*
		① 2 个函数参数，第 1 个参数在鼠标移入的时候触发，第 2 个参数在鼠标移出时触发
		② 如果只有 1 个函数参数，那移入移出都执行这个方法
	*/
	hover: function (fnOver, fnOut) {
		return this.mouseenter(fnOver).mouseleave(fnOut || fnOver);
	},
	// 把事件绑定在元素上，非委托
	bind: function (types, data, fn) {
		return this.on(types, null, data, fn);
	},
	// 解除事件绑定，非委托
	unbind: function (types, fn) {
		return this.off(types, null, fn);
	},
	// 事件绑定，可以委托，也可以不委托
	delegate: function (selector, types, data, fn) {
		return this.on(types, selector, data, fn);
	},
	// 解除事件绑定
	undelegate: function (selector, types, fn) {
		// ( namespace ) or ( selector, types [, fn] )
		return arguments.length === 1 ? this.off(selector, "**") : this.off(types, selector || "**", fn);
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
	 *- BEFORE asking for a transport
	 *- AFTER param serialization (s.data is a string if s.processData is true)
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
	// 这么写是为了避免解析成注释，导致压缩的时候出错？
	allTypes = "*/".concat("*");


// #8138, IE may throw an exception when accessing
// a field from window.location if document.domain has been set
try {
	// 一般写法，返回当前页面地址
	ajaxLocation = location.href;
} catch (e) {
	// Use the href attribute of an A element
	// since IE will modify it given document.location
	// 兼容写法，返回当前页面地址
	ajaxLocation = document.createElement("a");
	ajaxLocation.href = "";
	ajaxLocation = ajaxLocation.href;
}

/*
	rurl = /^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/
	匹配 url 中协议、域名和端口部分

	eg：
	url = "http://www.nanchao.win:80/tags/js:Search?search=jq&go=Go"
	rurl.exec(url);
	-> ["http://www.nanchao.win:80", "http:", "www.nanchao.win", "80", index: 0, input: "http://www.nanchao.win:80/tags/js:Search?search=jq&go=Go"]
*/
// Segment location into parts
ajaxLocParts = rurl.exec(ajaxLocation.toLowerCase()) || [];


/*
jQuery.extend({
	* 前置过滤器
	ajaxPrefilter: addToPrefiltersOrTransports(prefilters),

	* 请求分发器
	ajaxTransport: addToPrefiltersOrTransports(transports),
});
前置过滤器 和 请求分发器 都是由这个 addToPrefiltersOrTransports 方法生成
*/
// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
// 向 prefilters 和 transports 两个 json 对象添加数据
function addToPrefiltersOrTransports(structure) {

	// dataTypeExpression is optional and defaults to "*"
	return function (dataTypeExpression, func) {

		// 如果 dataTypeExpression 不是字符串，那么，dataTypeExpression 强制改为 "*"
		if (typeof dataTypeExpression !== "string") {
			func = dataTypeExpression;
			dataTypeExpression = "*";
		}

		var dataType,
			i = 0,
			/*
				core_rnotwhite = /\S+/g 匹配任意不是空白的字符

				eg:
				"jsonp xml".match(/\S+/g)
				// ["jsonp", "xml"]
			*/
			dataTypes = dataTypeExpression.toLowerCase().match(core_rnotwhite) || [];

		// func 必须是函数
		if (jQuery.isFunction(func)) {
			// For each dataType in the dataTypeExpression
			while ((dataType = dataTypes[i++])) {
				// Prepend if requested
				// 第一个字母是 + ，如 "+abc"[0] -> "+"，则丢掉这个 +
				if (dataType[0] === "+") {
					dataType = dataType.slice(1) || "*";
					/*
						以 structure 为 prefilters 为例：
						prefilters 原本是空对象 {}

						① 如果 prefilters[ dataType ] 为 undefined，那么就创建一个空数组
						 prefilters[ dataType ] = [];
						② 如果 prefilters[ dataType ] 已经初始化为数组了，就用这个数组
						③ 往这个数组 prefilters[ dataType ] 头部加入函数 func
					*/
					(structure[dataType] = structure[dataType] || []).unshift(func);

					// Otherwise append
				} else {
					// 第一个字母不是 + 的时候，把函数 func 加入数组尾部
					(structure[dataType] = structure[dataType] || []).push(func);
				}
			}
		}
	};
}

// Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports(structure, options, originalOptions, jqXHR) {

	var inspected = {},
		// structure 为 transports，seekingTransport 为 true
		seekingTransport = (structure === transports);

	function inspect(dataType) {
		var selected;
		inspected[dataType] = true;
		// structure[ dataType ] 是一个数组，里面存的是函数
		jQuery.each(structure[dataType] || [], function (_, prefilterOrFactory) {
			// 执行函数 prefilterOrFactory
			var dataTypeOrTransport = prefilterOrFactory(options, originalOptions, jqXHR);
			// 执行结果 dataTypeOrTransport 是字符串，并且 structure 为 prefilters，并且没有执行过 inspect( dataTypeOrTransport )
			if (typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[dataTypeOrTransport]) {
				// options.dataTypes 数组头部加入 dataTypeOrTransport
				options.dataTypes.unshift(dataTypeOrTransport);
				/*
				这里递归调用，那下面的 false 可以执行到吗？是可以的！

				eg:
				function f(num){
					if (num === 1){
						f(2);
						console.log('可以执行 return false');
						return false;
					} else if (num === 2){
						return true;
					}
					return;
				}
				f(1) -> false 并且打印 可以执行 return false
				*/
				inspect(dataTypeOrTransport);
				return false;
				// structure 为 transports
			} else if (seekingTransport) {
				// 返回 prefilterOrFactory( options, originalOptions, jqXHR )
				return !(selected = dataTypeOrTransport);
			}
		});
		// 如果 structure 为 prefilters，selected 一直是 undefined
		return selected;
	}

	/*
		① && 优先级高于 ||
		② 优先返回 inspect( options.dataTypes[ 0 ] ) 的结果
		③ 当 ② 中返回值为假时，如果 inspected[ "*" ] 也是假（说明 options.dataTypes[ 0 ] 不为 "*"），那么返回 inspect( "*" )

		其实，简单点理解就是：
		优先返回 inspect( options.dataTypes[ 0 ] ) ，如果为假，则返回 inspect( "*" )
	*/
	return inspect(options.dataTypes[0]) || !inspected["*"] && inspect("*");
}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend(target, src) {
	var key, deep,
		// flatOptions 里有的属性不需要深度复制，成为 target 下的第一级属性
		flatOptions = jQuery.ajaxSettings.flatOptions || {};

	for (key in src) {
		if (src[key] !== undefined) {
			/*
				flatOptions[ key ] ? target : ( deep || (deep = {}) )
				① 如果 flatOptions[ key ] 为真，则设置 target[ key ] = src[ key ]
				② 如果 flatOptions[ key ] 为假，则设置 deep[ key ] = src[ key ]

				这里是浅拷贝
			*/
			(flatOptions[key] ? target : (deep || (deep = {})))[key] = src[key];
		}
	}
	if (deep) {
		/*
			jQuery.extend 第一个参数为 true 表示深拷贝
			var o1 = {
				a : [1,2]
			};

			var o2 = {
				b : [3,4]
			};

			jQuery.extend( true, o1, o2 );

			console.log(o1);
			-> {
				a : [1,2],
				b : [3,4]
			}
		*/
		jQuery.extend(true, target, deep);
	}

	return target;
}

// 从服务器加载数据，并使用返回的 html 内容替换当前匹配元素的内容
jQuery.fn.load = function (url, params, callback) {

	// _load = jQuery.fn.load 为旧的 load 方法，多个 jQuery 版本共存的情况？
	if (typeof url !== "string" && _load) {
		return _load.apply(this, arguments);
	}

	var selector, type, response,
		self = this,
		off = url.indexOf(" ");
	/*
		你还可以在URL字符串后面追加指定的选择器(与URL之间用空格隔开)，以便于只使用加载的html文档中匹配选择器的部分内容来替换当前匹配元素的内容。如果该文档没有匹配选择器的内容，就使用空字符串("")来替换当前匹配元素的内容。
	*/
	if (off >= 0) {
		selector = url.slice(off);
		url = url.slice(0, off);
	}

	// If it's a function
	// 如果第二个实参是函数，那就把它当第三个参数，第二个实参 params 变为 undefined
	if (jQuery.isFunction(params)) {

		// We assume that it's the callback
		callback = params;
		params = undefined;

		// Otherwise, build a param string
		// 默认使用 GET 方式，如果提供了对象形式的数据，则自动转为 POST 方式
	} else if (params && typeof params === "object") {
		type = "POST";
	}

	// If we have elements to modify, make the request
	// 如果是 $() 这种没有选取到元素的，没必要发出请求，浪费资源！
	if (self.length > 0) {
		jQuery.ajax({
			url: url,

			// if "type" variable is undefined, then "GET" method will be used
			type: type,
			dataType: "html",
			data: params
			// 内容替换
		}).done(function (responseText) {

			// Save response for use in complete callback
			response = arguments;
			// 如果有 selector ，只需要 selector 匹配出来的内容
			self.html(selector ?

				// If a selector was specified, locate the right elements in a dummy div
				// Exclude scripts to avoid IE 'Permission Denied' errors
				jQuery("<div>").append(jQuery.parseHTML(responseText)).find(selector) :

				// Otherwise use the full result
				responseText);
			// 回调
		}).complete(callback && function (jqXHR, status) {
			/*
				jQuery.fn.each : function ( callback, args ) {
					return jQuery.each( this, callback, args );
				}
				在 this 的每一个元素上执行 callback.apply( this[ i ], args )
			*/
			self.each(callback, response || [jqXHR.responseText, status, jqXHR]);
		});
	}

	return this;
};

// Attach a bunch of functions for handling common AJAX events
jQuery.each(["ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend"], function (i, type) {
	/*
		eg:
		jQuery.fn.ajaxStart = function(fn){
			return this.on( 'ajaxStart', fn );
		}
	*/
	jQuery.fn[type] = function (fn) {
		return this.on(type, fn);
	};
});

jQuery.extend({

	// Counter for holding the number of active queries
	active: 0,

	// Last-Modified header cache for next request
	lastModified: {},
	etag: {},

	ajaxSettings: {
		// 当前页面地址
		url: ajaxLocation,
		type: "GET",
		/*
			① rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/
			本地协议

			② ajaxLocParts 是这样形式的数组：
			["http://www.nanchao.win:80", "http:", "www.nanchao.win", "80", index: 0, input: "http://www.nanchao.win:80/tags/js:Search?search=jq&go=Go"]
		*/
		isLocal: rlocalProtocol.test(ajaxLocParts[1]),
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
		// 这里的属性不要深度复制
		flatOptions: {
			url: true,
			context: true
		}
	},

	// Creates a full fledged settings object into target
	// with both ajaxSettings and settings fields.
	// If target is omitted, writes into ajaxSettings.
	/*
		作用：设置AJAX的全局默认设置
		该函数用于更改jQuery中AJAX请求的默认设置选项。之后执行的所有AJAX请求，如果对应的选项参数没有设置，将使用这里的默认设置
	*/
	ajaxSetup: function (target, settings) {
		return settings ?

			/*
				① ajaxExtend( target, jQuery.ajaxSettings )
				将 jQuery.ajaxSettings 的属性深度复制给 target，返回 target
				② 然后将 settings 的属性深度复制给 target，这样就可以覆盖 jQuery.ajaxSettings 中的全局配置属性

				以上的深度复制的属性不包括 jQuery.ajaxSettings.flatOptions 中的属性
			*/
			// Building a settings object
			// 返回修改后的 target
			ajaxExtend(ajaxExtend(target, jQuery.ajaxSettings), settings) :

			// Extending ajaxSettings
			// 返回修改后的 jQuery.ajaxSettings
			ajaxExtend(jQuery.ajaxSettings, target);
	},

	ajaxPrefilter: addToPrefiltersOrTransports(prefilters),
	ajaxTransport: addToPrefiltersOrTransports(transports),

	// Main method
	/*
		url : 请求地址
		options ： 请求配置参数，缺省参数则用 jQuery.ajaxSetup() 配置的全局参数
	*/
	ajax: function (url, options) {

		// If url is an object, simulate pre-1.5 signature
		// $.ajax({}) 形式
		if (typeof url === "object") {
			options = url;
			url = undefined;
		}

		// Force options to be an object
		// options 为假时，强制变为对象
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
			// 最终的配置对象
			s = jQuery.ajaxSetup({}, options),
			// Callbacks context
			callbackContext = s.context || s,
			// Context for global events is callbackContext if it is a DOM node or jQuery collection
			/*
				① 如果 callbackContext 是 dom 元素或者 jQuery 对象，则全局事件的上下文是 jQuery( callbackContext )
				② 否则，全局事件的上下文是 jQuery.event
			*/
			globalEventContext = s.context && (callbackContext.nodeType || callbackContext.jquery) ?
				jQuery(callbackContext) :
				jQuery.event,
			// Deferreds
			// 新建一个延迟对象
			deferred = jQuery.Deferred(),
			// 新建一个回调队列
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
				/*
					① 如果不存在 responseHeaders 哈希表，创建之
					② 从哈希表里取出“键”对应的“值”
				*/
				getResponseHeader: function (key) {
					var match;
					if (state === 2) {
						if (!responseHeaders) {
							// 初始化为 json 对象
							responseHeaders = {};
							/*
								① rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg 匹配 key:value 这种形式
								eg:
								rheaders.exec('Last-Modified:Mon, 07 Aug 2017 06:13:06 GMT');
								-> ["Last-Modified:Mon, 07 Aug 2017 06:13:06 GMT", "Last-Modified", "Mon, 07 Aug 2017 06:13:06 GMT", index: 0, input: "Last-Modified:Mon, 07 Aug 2017 06:13:06 GMT"]

								② 循环取出每一个键值对
							*/
							while ((match = rheaders.exec(responseHeadersString))) {
								// responseHeaders["Last-Modified"] = "Mon, 07 Aug 2017 06:13:06 GMT"
								responseHeaders[match[1].toLowerCase()] = match[2];
							}
						}
						match = responseHeaders[key.toLowerCase()];
					}
					/*
						① 如果 match 为 undefined 或 null ，则返回 null
						② match 为其他值，返回 match
					*/
					return match == null ? null : match;
				},

				// Raw string
				// 如果请求完成，返回纯字符串
				getAllResponseHeaders: function () {
					return state === 2 ? responseHeadersString : null;
				},

				// Caches the header
				setRequestHeader: function (name, value) {
					var lname = name.toLowerCase();
					if (!state) {
						/*
							① 如果 requestHeadersNames[ lname ] 不存在，则requestHeadersNames[ lname ] = name
							② 如果 requestHeadersNames[ lname ] 存在，则取出来用
							③ 不管 ① 还是 ②，都有：requestHeaders[ requestHeadersNames[ lname ] ] = value;

							那么，requestHeadersNames 就是这个一个 json对象：
							{
								name1.toLowerCase() : name1,
								name2.toLowerCase() : name2,
								name2.toLowerCase() : name2,
								...
							}
						*/
						// 给 requestHeadersNames json 对象加键值对
						name = requestHeadersNames[lname] = requestHeadersNames[lname] || name;
						// 给 requestHeaders json 对象加键值对
						requestHeaders[name] = value;
					}
					return this;
				},

				// Overrides response content-type header
				overrideMimeType: function (type) {
					if (!state) {
						s.mimeType = type;
					}
					return this;
				},

				// Status-dependent callbacks
				statusCode: function (map) {
					var code;
					if (map) {
						if (state < 2) {
							for (code in map) {
								// Lazy-add the new callback in a way that preserves old ones
								// statusCode = s.statusCode || {}
								statusCode[code] = [statusCode[code], map[code]];
							}
						} else {
							// Execute the appropriate callbacks
							jqXHR.always(map[jqXHR.status]);
						}
					}
					return this;
				},

				// Cancel the request
				abort: function (statusText) {
					// strAbort = "canceled" 默认的 abort 信息
					var finalText = statusText || strAbort;
					if (transport) {
						transport.abort(finalText);
					}
					done(0, finalText);
					return this;
				}
			};

		// Attach deferreds
		/*

			① 首先明确：函数（function）声明时所在的环境代表其作用域方向！！
			也就是说函数的作用域链是在其声明时确定，而不是其调用时！！

			② deferred.promise( jqXHR )

			先看 deferred.promise 函数声明：
			deferred.promise : function ( obj ) {
				return obj != null ? jQuery.extend( obj, promise ) : promise;
			}

			执行 deferred.promise( jqXHR ) 会让 jqXHR 继承 deferred.promise 方法，然后返回 jqXHR
			注意是继承 deferred.promise，而不是 deferred

			这意味着：jqXHR 可以当做 deferred.promise 来用，比如
			jqXHR.done(function(){alert('done')})
			deferred.resolve()
			//弹出 done

			③ 执行 jqXHR.complete = completeDeferred.add
			使得 jqXHR.complete 可以当做 completeDeferred.add 方法来用
			jqXHR.complete(function(){alert('complete')})
			completeDeferred.fire();
			// 弹出 complete
		 */
		deferred.promise(jqXHR).complete = completeDeferred.add;
		jqXHR.success = jqXHR.done;
		jqXHR.error = jqXHR.fail;

		// Remove hash character (#7531: and string promotion)
		// Add protocol if not provided (prefilters might expect it)
		// Handle falsy url in the settings object (#10093: consistency with old signature)
		// We also use the url parameter if available
		/*
			① ( url || s.url || ajaxLocation ) + "" 将 url 强制转为字符串
				url 是 ajax: function( url, options ) 传入的实参
				s.url 是全局设置的默认 url
				ajaxLocation 是当前地址

			② rhash = /#.*$/
				rhash.test('#video') -> true

			③ rprotocol = /^\/\//
				rprotocol.test('//www.nc.com') -> true

				ajaxLocParts 是这样一个数组
				["http://www.nanchao.win:80", "http:", "www.nanchao.win", "80", index: 0, input: "http://www.nanchao.win:80/tags/js:Search?search=jq&go=Go"]

				先把 url 强制转为字符串，然后去掉哈希部分，最后补全协议名
		*/
		s.url = ((url || s.url || ajaxLocation) + "").replace(rhash, "")
			.replace(rprotocol, ajaxLocParts[1] + "//");

		// Alias method option to type as per ticket #12004
		// method 可以看作是 type 的别名
		s.type = options.method || options.type || s.method || s.type;

		// Extract dataTypes list
		/*
			先去除左右空格，然后转小写，最后把取出非空部分组成数组
			eg:
			① jQuery.trim(' JSON XML ') -> "JSON XML"
				"JSON XML".toLowerCase() -> "json xml"
				"json xml".match( core_rnotwhite ) -> ["json", "xml"]

			② jQuery.trim("*").toLowerCase().match( core_rnotwhite ) -> ["*"]
		*/
		s.dataTypes = jQuery.trim(s.dataType || "*").toLowerCase().match(core_rnotwhite) || [""];

		// A cross-domain request is in order when we have a protocol:host:port mismatch
		if (s.crossDomain == null) {
			/*
				rurl = /^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/
				匹配 url 中协议、域名和端口部分

				eg：
				url = "http://www.nanchao.win:80/tags/js:Search?search=jq&go=Go"
				rurl.exec(url);
				-> ["http://www.nanchao.win:80", "http:", "www.nanchao.win", "80", index: 0, input: "http://www.nanchao.win:80/tags/js:Search?search=jq&go=Go"]
			*/
			parts = rurl.exec(s.url.toLowerCase());
			// 协议、域名、端口，只要有一个和当前页面 url 不匹配，则跨域
			s.crossDomain = !!(parts &&
				(parts[1] !== ajaxLocParts[1] || parts[2] !== ajaxLocParts[2] ||
					(parts[3] || (parts[1] === "http:" ? "80" : "443")) !==
					(ajaxLocParts[3] || (ajaxLocParts[1] === "http:" ? "80" : "443")))
			);
		}

		// Convert data if not already a string
		if (s.data && s.processData && typeof s.data !== "string") {
			// 当 s.tata 不是字符串时，序列化为字符串
			s.data = jQuery.param(s.data, s.traditional);
		}

		// Apply prefilters
		/*
		inspect( s.dataTypes[ 0 ] )
		-> 依次执行 prefilters[s.dataTypes[ 0 ]] 这个数组里每一个函数 fn(s, options, jqXHR)
		*/
		inspectPrefiltersOrTransports(prefilters, s, options, jqXHR);

		// If request was aborted inside a prefilter, stop there
		if (state === 2) {
			return jqXHR;
		}

		// We can fire global events as of now if asked to
		fireGlobals = s.global;

		// Watch for a new set of requests
		if (fireGlobals && jQuery.active++ === 0) {
			// 触发 ajaxStart 事件
			jQuery.event.trigger("ajaxStart");
		}

		// Uppercase the type
		// 'abc'.toUpperCase() -> "ABC"
		s.type = s.type.toUpperCase();

		// Determine if request has content
		/*
		rnoContent = /^(?:GET|HEAD)$/
		rnoContent.test('GET') -> true
		*/
		s.hasContent = !rnoContent.test(s.type);

		// Save the URL in case we're toying with the If-Modified-Since
		// and/or If-None-Match header later on
		cacheURL = s.url;

		// More options handling for requests with no content
		// 假如 s.type = 'GET' -> s.hasContent = false
		if (!s.hasContent) {

			// If data is available, append data to url
			if (s.data) {
				/*
					ajax_rquery = /\?/
					① 如果 cacheURL 中已经有 ?， 则 s.url 后跟 &
					② 如果 cacheURL 中没有 ?， 则 s.url 后跟 ?

					然后，把 s.data 附在 s.url 后面
				*/
				cacheURL = (s.url += (ajax_rquery.test(cacheURL) ? "&" : "?") + s.data);
				// #9682: remove data so that it's not used in an eventual retry
				delete s.data;
			}

			// Add anti-cache in url if needed
			// 禁止缓存
			if (s.cache === false) {
				// rts = /([?&])_=[^&]*/
				/*
					rts.test('?_=1502420014500') -> true
					rts.test('&_=1502420014500') -> true

					(1) cacheURL 中有 &_=1502420014500 这种形式，把数字加 1
					(2) cacheURL 中没有 &_=1502420014500 这种形式，生成这种形式
				*/
				s.url = rts.test(cacheURL) ?
					/*
						① $1 表示与 rts 中第一个子表达式匹配的文本
						② ajax_nonce = jQuery.now() -> 1502420014500
					*/
					// If there is already a '_' parameter, set its value
					cacheURL.replace(rts, "$1_=" + ajax_nonce++) :

					// Otherwise add one to the end
					cacheURL + (ajax_rquery.test(cacheURL) ? "&" : "?") + "_=" + ajax_nonce++;
			}
		}

		/*
			jQuery.lastModified: {}
			jQuery.etag: {}

			在请求成功后，会执行：
			modified = jqXHR.getResponseHeader("Last-Modified")
			jQuery.lastModified[ cacheURL ] = modified;

			modified = jqXHR.getResponseHeader("etag")
			jQuery.etag[ cacheURL ] = modified
		*/
		// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
		if (s.ifModified) {
			// 如果上次返回头里有 Last-Modified 字段，这次请求头里带上 If-Modified-Since 字段
			if (jQuery.lastModified[cacheURL]) {
				jqXHR.setRequestHeader("If-Modified-Since", jQuery.lastModified[cacheURL]);
			}
			// 如果上次返回头里有 etag 字段，这次请求头里带上 If-None-Match 字段
			if (jQuery.etag[cacheURL]) {
				jqXHR.setRequestHeader("If-None-Match", jQuery.etag[cacheURL]);
			}
		}

		// Set the correct header, if data is being sent
		/*
			① && 优先级高于 ||
			s.data && s.hasContent && s.contentType !== false 或 options.contentType

			② s = jQuery.ajaxSetup( {}, options )
		*/
		if (s.data && s.hasContent && s.contentType !== false || options.contentType) {
			jqXHR.setRequestHeader("Content-Type", s.contentType);
		}

		// Set the Accepts header for the server, depending on the dataType
		jqXHR.setRequestHeader(
			"Accept",
			// 看一个请求头里 Accept 字段实例：
			// Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8
			/*
				s.accepts 是这种形式：
				accepts: {
					"*": allTypes,
					text: "text/plain",
					html: "text/html",
					xml: "application/xml, text/xml",
					json: "application/json, text/javascript"
				}
				以 s.dataTypes[ 0 ] 是 html 为例：
				s.accepts[ s.dataTypes[0] ] + ( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" )
				-> "text/html" + ", " + allTypes + "; q=0.01"
				-> "text/html" + ", " + allTypes + "; q=0.01"
			*/
			// -> "text/html,*/*; q=0.01"

			s.dataTypes[0] && s.accepts[s.dataTypes[0]] ?
				s.accepts[s.dataTypes[0]] + (s.dataTypes[0] !== "*" ? ", " + allTypes + "; q=0.01" : "") :
				s.accepts["*"]
		);

		// Check for headers option
		// 依次设置请求头
		for (i in s.headers) {
			jqXHR.setRequestHeader(i, s.headers[i]);
		}

		// Allow custom headers/mimetypes and early abort
		if (s.beforeSend && (s.beforeSend.call(callbackContext, jqXHR, s) === false || state === 2)) {
			// Abort if not done already and return
			// 如果设置了 s.beforeSend 函数，并且这个函数执行后返回值是 false，或者执行完后 state 为 2，则终止
			return jqXHR.abort();
		}

		// aborting is no longer a cancellation
		// 将 strAbort 标识修正为 "abort"
		strAbort = "abort";

		// Install callbacks on deferreds
		/*
			注册回调函数：
			jqXHR.success( s.success );
			jqXHR.error( s.error );
			jqXHR.complete( s.complete );
		*/
		for (i in { success: 1, error: 1, complete: 1 }) {
			jqXHR[i](s[i]);
		}


		/*
			inspect( s.dataTypes[ 0 ] )
			-> 依次执行 transports[s.dataTypes[ 0 ]] 这个数组里每一个函数 fn(s, options, jqXHR)
		*/
		// Get transport
		transport = inspectPrefiltersOrTransports(transports, s, options, jqXHR);
		/*
			例如 transport : {
				send: function( _, complete ) {},
				abort: function() {}
			};
		*/

		// If no transport, we auto-abort
		if (!transport) {
			done(-1, "No Transport");
		} else {
			// 开始发送请求
			jqXHR.readyState = 1;

			// Send global event
			if (fireGlobals) {
				// globalEventContext 是 ajaxSend 等全局事件的执行上下文
				globalEventContext.trigger("ajaxSend", [jqXHR, s]);
			}
			// Timeout
			// 异步请求并且设置了超时时间
			if (s.async && s.timeout > 0) {
				timeoutTimer = setTimeout(function () {
					jqXHR.abort("timeout");
				}, s.timeout);
			}

			try {
				state = 1;
				// 发送请求
				transport.send(requestHeaders, done);
			} catch (e) {
				// Propagate exception as error if not done
				if (state < 2) {
					done(-1, e);
					// Simply rethrow otherwise
				} else {
					throw e;
				}
			}
		}

		// Callback for when everything is done
		function done(status, nativeStatusText, responses, headers) {
			var isSuccess, success, error, response, modified,
				statusText = nativeStatusText;

			// Called once
			if (state === 2) {
				return;
			}

			// State is "done" now
			state = 2;

			// Clear timeout if it exists
			// 清除超时定时器
			if (timeoutTimer) {
				clearTimeout(timeoutTimer);
			}

			// Dereference transport for early garbage collection
			// (no matter how long the jqXHR object will be used)
			// 取消 transport 的引用
			transport = undefined;

			// Cache response headers
			// 返回头
			responseHeadersString = headers || "";

			// Set readyState
			// readyState 置为 4
			jqXHR.readyState = status > 0 ? 4 : 0;

			// Determine if successful
			// 成功的 HTTP 状态码
			isSuccess = status >= 200 && status < 300 || status === 304;

			// Get response data
			// 获取返回数据
			if (responses) {
				response = ajaxHandleResponses(s, jqXHR, responses);
			}

			// Convert no matter what (that way responseXXX fields are always set)
			// 转换返回数据
			response = ajaxConvert(s, response, jqXHR, isSuccess);

			// If successful, handle type chaining
			// 成功
			if (isSuccess) {

				// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
				if (s.ifModified) {
					// 取出返回头的 Last-Modified 字段
					modified = jqXHR.getResponseHeader("Last-Modified");
					if (modified) {
						// 将 Last-Modified 字段存下来
						jQuery.lastModified[cacheURL] = modified;
					}
					// 取出返回头的 etag 字段
					modified = jqXHR.getResponseHeader("etag");
					if (modified) {
						// 将 etag 字段存下来
						jQuery.etag[cacheURL] = modified;
					}
				}

				// if no content
				if (status === 204 || s.type === "HEAD") {
					statusText = "nocontent";

					// if not modified
				} else if (status === 304) {
					statusText = "notmodified";

					// If we have data, let's convert it
				} else {
					// response 是经过转换后的返回数据
					statusText = response.state;
					success = response.data;
					error = response.error;
					isSuccess = !error;
				}
				// 失败
			} else {
				// We extract error from statusText
				// then normalize statusText and status for non-aborts
				error = statusText;
				if (status || !statusText) {
					statusText = "error";
					if (status < 0) {
						status = 0;
					}
				}
			}

			// Set data for the fake xhr object
			jqXHR.status = status;
			jqXHR.statusText = (nativeStatusText || statusText) + "";

			// Success/Error
			if (isSuccess) {
				// 触发成功回调
				deferred.resolveWith(callbackContext, [success, statusText, jqXHR]);
			} else {
				// 触发失败回调
				deferred.rejectWith(callbackContext, [jqXHR, statusText, error]);
			}

			// Status-dependent callbacks
			// 参数 statusCode 为 s.statusCode || {}
			jqXHR.statusCode(statusCode);
			statusCode = undefined;

			if (fireGlobals) {
				// 触发 ajaxSuccess 或 ajaxError 事件
				globalEventContext.trigger(isSuccess ? "ajaxSuccess" : "ajaxError",
					[jqXHR, s, isSuccess ? success : error]);
			}

			// Complete
			// completeDeferred = jQuery.Callbacks("once memory")
			completeDeferred.fireWith(callbackContext, [jqXHR, statusText]);

			if (fireGlobals) {
				// 触发 ajaxComplete 事件
				globalEventContext.trigger("ajaxComplete", [jqXHR, s]);
				// Handle the global AJAX counter
				// 当所有的请求都执行完毕，触发 ajaxStop 事件
				if (!(--jQuery.active)) {
					jQuery.event.trigger("ajaxStop");
				}
			}
		}

		// 整个 ajax 方法最后返回 jqXHR 对象
		return jqXHR;
	},

	// 获取 json 数据
	getJSON: function (url, data, callback) {
		return jQuery.get(url, data, callback, "json");
	},

	// 获取脚本
	getScript: function (url, callback) {
		return jQuery.get(url, undefined, callback, "script");
	}
});

// jQuery.get/jQuery.post 方法，本质还是调用 jQuery.ajax 方法
jQuery.each(["get", "post"], function (i, method) {
	jQuery[method] = function (url, data, callback, type) {
		// shift arguments if data argument was omitted
		// 如果第二个参数是函数，则调整参数顺序
		if (jQuery.isFunction(data)) {
			type = type || callback;
			callback = data;
			data = undefined;
		}

		// 调用 jQuery.ajax 方法
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
function ajaxHandleResponses(s, jqXHR, responses) {

	var ct, type, finalDataType, firstDataType,
		contents = s.contents,
		// s.dataTypes = jQuery.trim( s.dataType || "*" ).toLowerCase().match( core_rnotwhite ) || [""];
		dataTypes = s.dataTypes;

	// Remove auto dataType and get content-type in the process
	while (dataTypes[0] === "*") {
		dataTypes.shift();
		if (ct === undefined) {
			// 内容类型
			ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");
		}
	}

	// Check if we're dealing with a known content-type
	if (ct) {
		for (type in contents) {
			/*
				如 contents = {
					script: /(?:java|ecma)script/
				}
			*/
			if (contents[type] && contents[type].test(ct)) {
				// type 加到数组 dataTypes 头部
				dataTypes.unshift(type);
				break;
			}
		}
	}

	// Check to see if we have a response for the expected dataType
	// 返回头里有 dataTypes[ 0 ] 字段，那它就是最终的类型
	if (dataTypes[0] in responses) {
		finalDataType = dataTypes[0];
	} else {
		// Try convertible dataTypes
		for (type in responses) {
			/*
			s.converters : {
				"text script": function( text ) {
					jQuery.globalEval( text );
					return text;
				},
				"* text": String,
				"text html": true,
				"text json": jQuery.parseJSON,
				"text xml": jQuery.parseXML
			}
			*/
			if (!dataTypes[0] || s.converters[type + " " + dataTypes[0]]) {
				finalDataType = type;
				break;
			}
			if (!firstDataType) {
				firstDataType = type;
			}
		}
		// Or just use first one
		finalDataType = finalDataType || firstDataType;
	}

	// If we found a dataType
	// We add the dataType to the list if needed
	// and return the corresponding response
	if (finalDataType) {
		if (finalDataType !== dataTypes[0]) {
			dataTypes.unshift(finalDataType);
		}
		// 返回指定类型数据
		return responses[finalDataType];
	}
}

/* Chain conversions given the request and the original response
 * Also sets the responseXXX fields on the jqXHR instance
 */
function ajaxConvert(s, response, jqXHR, isSuccess) {
	var conv2, current, conv, tmp, prev,
		converters = {},
		// Work with a copy of dataTypes in case we need to modify it for conversion
		// 深度复制 s.dataTypes 数组，以免后面修改了它
		dataTypes = s.dataTypes.slice();

	// Create converters map with lowercased keys
	if (dataTypes[1]) {
		/*
		s.converters : {
			"text script": function( text ) {
				jQuery.globalEval( text );
				return text;
			},
			"* text": String,
			"text html": true,
			"text json": jQuery.parseJSON,
			"text xml": jQuery.parseXML
		}

		// 将 s.converters 中的转换函数依次以键值对的形式存入 converters
		*/
		for (conv in s.converters) {
			// 转换函数
			converters[conv.toLowerCase()] = s.converters[conv];
		}
	}

	current = dataTypes.shift();

	// Convert to each sequential dataType
	while (current) {
		/*
		responseFields: {
			xml: "responseXML",
			text: "responseText",
			json: "responseJSON"
		}
		*/
		if (s.responseFields[current]) {
			// eg: jqXHR.responseText = response;
			jqXHR[s.responseFields[current]] = response;
		}

		// Apply the dataFilter if provided
		// s.dataFilter 函数处理
		if (!prev && isSuccess && s.dataFilter) {
			response = s.dataFilter(response, s.dataType);
		}

		prev = current;
		current = dataTypes.shift();

		if (current) {

			// There's only work to do if current dataType is non-auto
			if (current === "*") {

				current = prev;

				// Convert response if prev dataType is non-auto and differs from current
			} else if (prev !== "*" && prev !== current) {

				// Seek a direct converter
				// 转换函数
				conv = converters[prev + " " + current] || converters["* " + current];

				// If none found, seek a pair
				if (!conv) {
					// eg: conv2 = "text json"
					for (conv2 in converters) {

						// If conv2 outputs current
						// eg:tmp = ["text", "json"]
						tmp = conv2.split(" ");
						if (tmp[1] === current) {

							// If prev can be converted to accepted input
							// 再匹配一次转换函数
							conv = converters[prev + " " + tmp[0]] ||
								converters["* " + tmp[0]];
							if (conv) {
								// Condense equivalence converters
								if (conv === true) {
									// eg：conv2 = "text json"
									conv = converters[conv2];

									// Otherwise, insert the intermediate dataType
								} else if (converters[conv2] !== true) {
									current = tmp[0];
									// tmp[ 1 ] 加入数组 dataTypes 头部
									dataTypes.unshift(tmp[1]);
								}
								break;
							}
						}
					}
				}

				// Apply converter (if not an equivalence)
				if (conv !== true) {

					// Unless errors are allowed to bubble, catch and return them
					// 默认 s[ "throws" ] 为 undefined
					if (conv && s["throws"]) {
						// 得到最终的返回数据
						response = conv(response);
					} else {
						try {
							response = conv(response);
						} catch (e) {
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
// 把这些属性都赋给 jQuery.ajaxSettings 对象，作为全局默认属性
jQuery.ajaxSetup({
	accepts: {
		script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
	},
	contents: {
		script: /(?:java|ecma)script/
	},
	converters: {
		"text script": function (text) {
			jQuery.globalEval(text);
			return text;
		}
	}
});

// Handle cache's special case and crossDomain
/*
	jQuery.ajaxPrefilter( "script", func )
	在数组 prefilters[ "script" ] 头部加入 func
*/
jQuery.ajaxPrefilter("script", function (s) {
	// 默认可以用缓存资源
	if (s.cache === undefined) {
		s.cache = false;
	}
	// 跨域的脚本请求都是 get 请求
	if (s.crossDomain) {
		s.type = "GET";
	}
});

// Bind script tag hack transport
/*
	jQuery.ajaxTransport( "script", func )
	在数组 transports[ "script" ] 头部加入 func
*/
jQuery.ajaxTransport("script", function (s) {
	// This transport only deals with cross domain requests
	// 跨域请求
	if (s.crossDomain) {
		var script, callback;
		return {
			send: function (_, complete) {
				// 创建 script 标签，并添加属性
				script = jQuery("<script>").prop({
					async: true,
					charset: s.scriptCharset,
					src: s.url
					// 监听 load 和 error 事件
				}).on(
					"load error",
					// 这个 callback 方法也供下面的 abort 方法调用
					callback = function (evt) {
						script.remove();
						callback = null;
						if (evt) {
							complete(evt.type === "error" ? 404 : 200, evt.type);
						}
					}
				);
				// script 是 jQuery 对象，script[ 0 ] 是原生 dom 节点
				document.head.appendChild(script[0]);
			},
			abort: function () {
				if (callback) {
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
	jsonpCallback: function () {
		/*
			① 首先取 oldCallbacks 数组最后一个元素作为 callback
			② 如果返回 undefined，那么 callback 为
			 jQuery.expando + "_" + ( ajax_nonce++ )
			 -> "jQuery20304472516315766977" + "_" + (1502441925906 + 1)
			 -> "jQuery20304472516315766977_1502441925907"
		*/
		var callback = oldCallbacks.pop() || (jQuery.expando + "_" + (ajax_nonce++));
		this[callback] = true;
		return callback;
	}
});

// Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter("json jsonp", function (s, originalSettings, jqXHR) {

	var callbackName, overwritten, responseContainer,
		/*
			rjsonp = /(=)\?(?=&|$)|\?\?/
			eg:
			rjsonp.exec('=?&') -> ["=?", "=", index: 0, input: "=?&"]
			rjsonp.exec('??') -> ["??", undefined, index: 0, input: "??"]
			rjsonp.exec('=?') -> ["=?", "=", index: 0, input: "=?"]

			① s.jsonp === false -> jsonProp = false
			② s.jsonp !== false -> jsonProp 为 "url" 或 false 或 "data"
		*/
		jsonProp = s.jsonp !== false && (rjsonp.test(s.url) ?
			"url" :
			typeof s.data === "string" && !(s.contentType || "").indexOf("application/x-www-form-urlencoded") && rjsonp.test(s.data) && "data"
		);

	// Handle iff the expected data type is "jsonp" or we have a parameter to set
	if (jsonProp || s.dataTypes[0] === "jsonp") {

		// Get callback name, remembering preexisting value associated with it
		/*
			① 如果 s.jsonpCallback 是个函数，那就取这个函数返回值
			② 如果 s.jsonpCallback 不是函数，那就取 s.jsonpCallback
			③ 不管是 ① 还是 ②，都将结果覆盖原来的 s.jsonpCallback
		*/
		callbackName = s.jsonpCallback = jQuery.isFunction(s.jsonpCallback) ?
			s.jsonpCallback() :
			s.jsonpCallback;

		// Insert callback into url or form data
		if (jsonProp) {
			// eg : 'callback=?&'.replace( rjsonp, "$1" + 'func' ) -> "callback=func&"
			s[jsonProp] = s[jsonProp].replace(rjsonp, "$1" + callbackName);
		} else if (s.jsonp !== false) {
			/*
				ajax_rquery = /\?/

				eg ：s.jsonp = "callback"
				s.url += "&callback=func";
			*/
			s.url += (ajax_rquery.test(s.url) ? "&" : "?") + s.jsonp + "=" + callbackName;
		}

		// Use data converter to retrieve json after script execution
		s.converters["script json"] = function () {
			if (!responseContainer) {
				/*
					jQuery.error : function ( msg ) {
						throw new Error( msg );
					}
				*/
				jQuery.error(callbackName + " was not called");
			}
			return responseContainer[0];
		};

		// force json dataType
		s.dataTypes[0] = "json";

		// Install callback
		/*
			① 原来的全局 callbackName 变量赋给 overwritten
			② 新的全局 callbackName 是一个函数，函数在执行的时候，会给 responseContainer 变量赋值
		*/
		overwritten = window[callbackName];
		window[callbackName] = function () {
			responseContainer = arguments;
		};

		// Clean-up function (fires after converters)
		// 请求成功或者失败后都执行
		jqXHR.always(function () {
			// Restore preexisting value
			// 还原全局的 callbackName 变量
			window[callbackName] = overwritten;

			// Save back as free
			if (s[callbackName]) {
				// make sure that re-using the options doesn't screw things around
				s.jsonpCallback = originalSettings.jsonpCallback;

				// save the callback name for future use
				// 保存回调函数名，以备将来取用
				oldCallbacks.push(callbackName);
			}

			// Call if it was a function and we have a response
			if (responseContainer && jQuery.isFunction(overwritten)) {
				overwritten(responseContainer[0]);
			}

			// 变量释放
			responseContainer = overwritten = undefined;
		});

		// Delegate to script
		return "script";
	}
});

// 注意：jQuery.ajaxSettings.xhr 是一个函数
jQuery.ajaxSettings.xhr = function () {
	try {
		return new XMLHttpRequest();
	} catch (e) { }
};

// xhrSupported 就是原生 js 里的 new XMLHttpRequest();
var xhrSupported = jQuery.ajaxSettings.xhr(),
	// 状态码修正
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
	// xhrCallbacks[( id = xhrId++ )] = callback("abort")
	xhrCallbacks = {};

if (window.ActiveXObject) {
	// 当文档或一个子资源（如 iframe）正在被卸载时, 触发 unload事件
	jQuery(window).on("unload", function () {
		for (var key in xhrCallbacks) {
			// 依次执行 xhrCallbacks 中的每一个方法
			xhrCallbacks[key]();
		}
		xhrCallbacks = undefined;
	});
}


// 是否支持跨域资源共享，返回布尔值
// !!xhrSupported 是将 xhrSupported 强制转为布尔值
jQuery.support.cors = !!xhrSupported && ("withCredentials" in xhrSupported);
// 是否支持 ajax
jQuery.support.ajax = xhrSupported = !!xhrSupported;

/*
	jQuery.ajaxTransport :function( dataTypeExpression, func ){}
	这里只有一个实参，那么：
	func = dataTypeExpression;
	dataTypeExpression = "*";
*/
// 其实这里的 options 就是 jQuery.ajax() 方法中的 s
jQuery.ajaxTransport(function (options) {
	var callback;
	// Cross domain only allowed if supported through XMLHttpRequest
	// 除非支持 cors（跨站资源共享），否则不能跨域
	if (jQuery.support.cors || xhrSupported && !options.crossDomain) {
		/*
			简单的，即：
			return {
				send: function( headers, complete ) {},
				abort: function() {}
			};
		*/
		return {
			send: function (headers, complete) {
				var i, id,
					// new XMLHttpRequest()
					xhr = options.xhr();
				/*
					open(
						 string method, // 表示HTTP动词，比如“GET”、“POST”、“PUT”和“DELETE”
						 string url,// 表示请求发送的网址
						 optional boolean async,// 表示请求是否为异步
						 optional string user,// 表示用于认证的用户名，默认为空字符串
						 optional string password // 表示用于认证的密码，默认为空字符串
					)
				 */
				xhr.open(options.type, options.url, options.async, options.username, options.password);
				// Apply custom fields if provided
				if (options.xhrFields) {
					for (i in options.xhrFields) {
						xhr[i] = options.xhrFields[i];
					}
				}
				// Override mime type if needed
				if (options.mimeType && xhr.overrideMimeType) {
					// 原生的 xhr.overrideMimeType 方法用来指定服务器返回数据的MIME类型
					xhr.overrideMimeType(options.mimeType);
				}
				// X-Requested-With header
				// For cross-domain requests, seeing as conditions for a preflight are
				// akin to a jigsaw puzzle, we simply never set it to be sure.
				// (it can always be set on a per-request basis or even using ajaxSetup)
				// For same-domain requests, won't change header if already provided.
				if (!options.crossDomain && !headers["X-Requested-With"]) {
					headers["X-Requested-With"] = "XMLHttpRequest";
				}
				// Set headers
				// 请求头
				for (i in headers) {
					// 原生的 xhr.setRequestHeader 方法用于设置HTTP头信息。该方法必须在open()之后、send()之前调用
					xhr.setRequestHeader(i, headers[i]);
				}
				// Callback
				/*
					① 不传参数，即 type 为 undefined，为表示'成功'
					② type 为 "error"，为表示'失败'
					③ type 为 "abort"，为表示'终止'
				 */
				callback = function (type) {
					return function () {
						if (callback) {
							delete xhrCallbacks[id];
							callback = xhr.onload = xhr.onerror = null;
							if (type === "abort") {
								xhr.abort();
							} else if (type === "error") {
								complete(
									// file protocol always yields status 0, assume 404
									xhr.status || 404,
									xhr.statusText
								);
							} else {
								complete(
									/*
										xhrSuccessStatus = {
												0: 200,
												1223: 204
										}
										如果状态码是 0 或 1223，则修正，否则直接用该状态码
									 */
									xhrSuccessStatus[xhr.status] || xhr.status,
									xhr.statusText,
									// Support: IE9
									// #11426: When requesting binary data, IE9 will throw an exception
									// on any attempt to access responseText
									typeof xhr.responseText === "string" ? {
										text: xhr.responseText
									} : undefined,
									// 原生的 getAllResponseHeaders 方法返回服务器发来的所有HTTP头信息，格式为字符串
									xhr.getAllResponseHeaders()
								);
							}
						}
					};
				};
				// Listen to events
				// 这里的 callback()、callback("error")、callback("abort") 返回值都是函数
				xhr.onload = callback();
				xhr.onerror = callback("error");
				// Create the abort callback
				callback = xhrCallbacks[(id = xhrId++)] = callback("abort");
				// Do send the request
				// This may raise an exception which is actually
				// handled in jQuery.ajax (so no try/catch here)
				/*
					send方法用于实际发出HTTP请求。
					① 如果不带参数，就表示HTTP请求只包含头信息；
					② 如果带有参数，就表示除了头信息，还带有包含具体数据的信息体。
				 */
				xhr.send(options.hasContent && options.data || null);
			},
			abort: function () {
				// 这里的 callback 就是上面的 callback("abort")，这是一个函数
				if (callback) {
					callback();
				}
			}
		};
	}
});



var fxNow, timerId,
	rfxtypes = /^(?:toggle|show|hide)$/,
	rfxnum = new RegExp("^(?:([+-])=|)(" + core_pnum + ")([a-z%]*)$", "i"),
	rrun = /queueHooks$/,
	animationPrefilters = [defaultPrefilter],
	tweeners = {
		// 这数组里的函数作用就是创建一个 tween ，然后修正 tween，最后返回 tween
		"*": [function (prop, value) {
			// 实际调用时，这里的 this 是指 animation
			var tween = this.createTween(prop, value),
				// 当前值
				target = tween.cur(),
				/*
					rfxnum.exec('+=20px')
					-> ["+=20px", "+", "20", "px", index: 0, input: "+=20px"]

					rfxnum.exec('20px')
					-> ["20px", undefined, "20", "px", index: 0, input: "20px"]
				*/
				parts = rfxnum.exec(value),
				/*
					① unit 指单位
					② jQuery.cssNumber 是指不需要单位的属性，比如 opacity、fontWeight 等
					③ unit 为 parts[ 3 ] 或 "" 或 "px"
				*/
				unit = parts && parts[3] || (jQuery.cssNumber[prop] ? "" : "px"),


				// Starting value computation is required for potential unit mismatches
				/*
					① ( jQuery.cssNumber[ prop ] || unit !== "px" && +target ) false，start 为 false
					② ( jQuery.cssNumber[ prop ] || unit !== "px" && +target ) 为 true，表示 prop 属性没单位，或者单位不是 px
					 start = rfxnum.exec( jQuery.css( tween.elem, prop ) )
					 -> ["20px", undefined, "20", "px", index: 0, input: "20px"] 这种形式数组
				*/
				start = (jQuery.cssNumber[prop] || unit !== "px" && +target) &&
					rfxnum.exec(jQuery.css(tween.elem, prop)),
				scale = 1,
				maxIterations = 20;

			// prop 原单位和当前要设置的单位不一样，修正 start
			if (start && start[3] !== unit) {
				// Trust units reported by jQuery.css
				// unit 没值的时候，用 jQuery.css 取出来的单位
				unit = unit || start[3];

				// Make sure we update the tween properties later on
				// parts 为 null 是强制改为 []
				parts = parts || [];

				// Iteratively approximate from a nonzero starting point
				// target 转为数值，赋给 start
				start = +target || 1;

				do {
					// If previous iteration zeroed out, double until we get *something*
					// Use a string for doubling factor so we don't accidentally see scale as unchanged below
					scale = scale || ".5";

					// Adjust and apply
					start = start / scale;
					jQuery.style(tween.elem, prop, start + unit);

					// Update scale, tolerating zero or NaN from tween.cur()
					// And breaking the loop if scale is unchanged or perfect, or if we've just had enough
				} while (scale !== (scale = tween.cur() / target) && scale !== 1 && --maxIterations);
			}

			// Update tween properties
			// 修正 tween 的属性
			if (parts) {
				start = tween.start = +start || +target || 0;
				tween.unit = unit;
				// If a +=/-= token was provided, we're doing a relative animation
				/*
					rfxnum.exec('+=20px')
					-> ["+=20px", "+", "20", "px", index: 0, input: "+=20px"]

					parts[ 1 ] 为真，说明是相对值
				*/
				tween.end = parts[1] ?
					start + (parts[1] + 1) * parts[2] :
					+parts[2];
			}

			return tween;
		}]
	};

// Animations created synchronously will run synchronously
// 返回当前时间戳
function createFxNow() {
	/*
		① 省略 setTimeout 的第二个参数，则该参数默认为 0
		② 将 fxNow 值变为当前时间戳并返回后，然后尽可能快地将 fxNow 置为 undefined
	*/
	setTimeout(function () {
		fxNow = undefined;
	});
	return (fxNow = jQuery.now());
}

// 实际调用 animation.createTween( prop, value ) -> animation.tweens.push( tween ) 给动画 animation 添加新的 tween
function createTween(value, prop, animation) {
	var tween,
		/*
			① tweeners[ prop ] 为数组，数组元素都是函数
			② collection 也是数组，是数组 tweeners[ prop ] 和数组 tweeners[ "*" ] 的合集
		 */
		collection = (tweeners[prop] || []).concat(tweeners["*"]),
		index = 0,
		length = collection.length;
	// 依次执行这一组函数，只要有一个返回值不为假，那就将这个返回值作为整个 createTween 函数的返回值
	for (; index < length; index++) {
		/*
			collection[ index ] 函数内部会执行 this.createTween( prop, value )
			也就是：animation.createTween( prop, value )
			也就是：先创建一个 tween，然后 animation.tweens.push( tween )

			collection[ index ].call( animation, prop, value ) 的作用就是创建一个 tween，
			然后对这个 tween 进行修正，最后返回这个 tween
		*/
		if ((tween = collection[index].call(animation, prop, value))) {

			// we're done with this property
			return tween;
		}
	}
}
/*
	Animation 一经调用，内部的 tick 函数将被 jQuery.fx.timer 函数推入 jQuery.timers 堆栈，
	立刻开始按照 jQuery.fx.interval 的间隔运动。Animation 函数返回一个animation对象（也是promise对象）。

	所以要想使动画异步，就不能立即调用 Animation。

	jQuery.fn.animate 中使用了 queue 队列，把 Animation 函数的调用封装在 doAnimation 函数中，
	通过把 doAnimation 推入指定的队列，按照队列顺序异步触发 doAnimation，从而异步调用 Animation。

	参数示例：
	properties :{
		opacity: 0.25,
		left: '50',
		height: 'toggle'
	}

	options : {
		duration :1000,
		specialEasing: {
			height: 'linear'
		},
		step: function(now, fx) {
			console.log('step')
		},
		progress:function(){
			console.log('progress')
		},
		complete:function(){
			console.log('动画完成')
		}
	}
*/
function Animation(elem, properties, options) {
	var result,
		stopped,
		index = 0,
		length = animationPrefilters.length,
		deferred = jQuery.Deferred().always(function () {
			/*
				① $('div:animated') 可以选出正在进行动画的元素；
				② 等动画结束后，删除 tick.elem，就不会被匹配出来了
			*/
			// don't match elem in the :animated selector
			delete tick.elem;
		}),
		/*
			tick 函数是对 properties 中多属性执行动画。每个属性的作为一个运动对象 tween，然后把他们依次放入 animation.tweens 中（一个堆栈 []）。
			tick 函数内通过时间换算出百分比 percent（过去的时间 / 总持续时间），然后传入 tween.run() 来完成一步运动。

			tick 函数返回值：
			a. 如果 animate 执行结束或被停止，返回 false；
			b. 如果 animate 动画过程中，返回剩余的动画时间
		 */
		tick = function () {
			if (stopped) {
				return false;
			}
			/*
				动画的原理：运用定时器循环改变元素属性

				(1) 关于动画，我们很容易想到的方案是：

					① 执行总次数 = 执行总时间 / 13
					② 每次增量 = ( 结束值 - 开始值 ) / 执行总次数

					这种方式固然很直观，问题在于：
					JavaScript是单线程的语言，setTimeout、setInterval定时的向语言的任务队列添加执行代码，
					但是必须等到队列中已有的代码执行完毕，若遇到长任务，则拖延明显。
					例如 setInterval(func, 13)，实际上并不能保证每 13ms 会执行一次 func。

				(2) 所以，jQuery 摒弃以上方案，采用以下方案：

					① remaining = Math.max( 0, animation.startTime + animation.duration - currentTime )
					 	开始时间 + 总持续时间 - 当前时间 -> 剩余持续时间
					② temp = remaining / animation.duration || 0
					 	剩余持续时间 / 总持续时间
					③ percent = 1 - temp
					 	1 - 剩余持续时间 / 总持续时间 -> 已经持续时间 / 总持续时间
					④ this.now = ( this.end - this.start ) * percent + this.start;
					 	时间流逝了多少比例，距离就相应移动多少比例

					通过这种方式也许原本期望 tick 执行 100 次，但浏览器在你延时时间内（比方说 2000ms）时间内只给你调用了 90 次的情况下也能完整完成一个动画。
			*/
			var currentTime = fxNow || createFxNow(),
				remaining = Math.max(0, animation.startTime + animation.duration - currentTime),
				// archaic crash bug won't allow us to use 1 - ( 0.5 || 0 ) (#12497)
				temp = remaining / animation.duration || 0,
				percent = 1 - temp,
				index = 0,
				length = animation.tweens.length;

			// 依次执行每个属性对应的动画
			for (; index < length; index++) {
				animation.tweens[index].run(percent);
			}

			// 每执行一次 tick 方法，就触发一次 deferred 的进行中状态
			deferred.notifyWith(elem, [animation, percent, remaining]);

			if (percent < 1 && length) {
				return remaining;
				// percent === 1 或 length === 0，说明这个 animate 结束了，那就触发 deferred 的成功状态
			} else {
				deferred.resolveWith(elem, [animation]);
				return false;
			}
		},
		animation = deferred.promise({
			elem: elem,
			props: jQuery.extend({}, properties),
			opts: jQuery.extend(true, { specialEasing: {} }, options),
			originalProperties: properties,
			originalOptions: options,
			startTime: fxNow || createFxNow(),
			duration: options.duration,
			tweens: [],
			// 创建单个属性运动对象
			createTween: function (prop, end) {
				/*
					每个属性运动的 easing 是可以不同的，options.easing 可以定义公用样式，
					但优先级是低于 options.specialEasing.prop 这样对属性直接指定的，每个属性的easing属性可能不一样。
				 */
				var tween = jQuery.Tween(elem, animation.opts, prop, end,
					animation.opts.specialEasing[prop] || animation.opts.easing);
				animation.tweens.push(tween);
				return tween;
			},
			// 停止动画
			stop: function (gotoEnd) {
				var index = 0,
					// if we are going to the end, we want to run all the tweens
					// otherwise we skip this part
					length = gotoEnd ? animation.tweens.length : 0;
				if (stopped) {
					return this;
				}
				stopped = true;

				/*
					当前 animate 对应的每一个 tween 都直接运动到最终状态

					如果 gotoEnd 为 false，那么 length 为 0 ，就不会执行这个 for 循环
				*/
				for (; index < length; index++) {
					animation.tweens[index].run(1);
				}

				// resolve when we played the last frame
				// otherwise, reject
				if (gotoEnd) {
					deferred.resolveWith(elem, [animation, gotoEnd]);
				} else {
					deferred.rejectWith(elem, [animation, gotoEnd]);
				}
				return this;
			}
		}),
		props = animation.props;

	// 修正 props 和 specialEasing 对象
	propFilter(props, animation.opts.specialEasing);

	// 对动画相关的配置属性，元素属性等做一些修正
	for (; index < length; index++) {
		/*
			animationPrefilters = [ defaultPrefilter ] 是个数组默认只有一项 defalutPrefilter

			defalutPrefilter 的作用是 show/hide/toggle 机制处理、inline 元素处理等等
		*/
		result = animationPrefilters[index].call(animation, elem, props, animation.opts);
		// defaultPrefilter() 没有返回值，默认是 undefined，它执行完不会 return。除非是 animationPrefilters 中其他方法有返回值
		if (result) {
			return result;
		}
	}

	// 对每一个属性，创建一个 tween，加入 animation.tweens
	jQuery.map(props, createTween, animation);

	// 如果指定了开始前的回调函数，那就执行这个函数
	if (jQuery.isFunction(animation.opts.start)) {
		animation.opts.start.call(elem, animation);
	}

	/*
		① jQuery.fx.timer 方法把每个正在运动的 tick 加入 jQuery.timers 数组
		② jQuery 动画只有一个唯一的定时器 setInterval，它会循环调用 jQuery.timers 里的每个 tick 函数
		③ 一个定时器对应多个 animate，一个 animate 对应一个 tick，一个 tick 对应多个 tween

			setInterval
				├── animate ── tick
				├── animate ── tick
				├── animate ── tick
							├── tween
							├── tween
								├── tween
	*/
	jQuery.fx.timer(
		// tick 是一个函数，这里给它添加 3 个属性，然后返回 tick 函数
		jQuery.extend(tick, {
			elem: elem,
			anim: animation,
			queue: animation.opts.queue
		})
	);

	// attach callbacks from options
	return animation.progress(animation.opts.progress)
		.done(animation.opts.done, animation.opts.complete)
		.fail(animation.opts.fail)
		.always(animation.opts.always);
}

/*
	specialEasing 是一个 json 对象，指定某个特定属性的缓动方式

	这个 propFilter 方法没有指定返回值，它的作用是修正 props 和 specialEasing 对象
 */
function propFilter(props, specialEasing) {
	var index, name, easing, value, hooks;

	// camelCase, specialEasing and expand cssHook pass
	// 遍历 props 中每个属性
	for (index in props) {
		/*
				jQuery.camelCase 将 css 属性名转成驼峰写法（将 - 后面的字母转成大写）：
				eg:
				margin-top -> marginTop
				-moz-transform -> MozTransform
				-webkit-transform -> WebkitTransform
		*/
		name = jQuery.camelCase(index);
		easing = specialEasing[name];
		value = props[index];
		// props[ index ] 是数组，则修正 props[ index ] 和 easing
		if (jQuery.isArray(value)) {
			easing = value[1];
			value = props[index] = value[0];
		}

		// 属性名转驼峰后和原来的属性名不一样，则用新的属性名替换旧的
		if (index !== name) {
			props[name] = value;
			delete props[index];
		}

		// 钩子
		hooks = jQuery.cssHooks[name];

		// margin、padding、borderWidth 等属性
		if (hooks && "expand" in hooks) {
			/*
				例如：
				当 name 是 margin 时，
				jQuery.cssHooks.margin.expand('10px 20px 30px 40px')
				-> {
					marginTop : '10px',
					marginRight : '20px',
					marginBottom : '30px',
					marginLeft : '40px',
				}

				① 删除 props[ "margin" ] 属性
				② 如果 props 中没有 marginTop 等值，则新建 props[ "marginTop" ] 等属性
			*/
			value = hooks.expand(value);
			delete props[name];

			// not quite $.extend, this wont overwrite keys already present.
			// also - reusing 'index' from above because we have the correct "name"
			for (index in value) {
				if (!(index in props)) {
					props[index] = value[index];
					specialEasing[index] = easing;
				}
			}
		} else {
			specialEasing[name] = easing;
		}
		/*
			不管是 if 还是 else 都会执行 specialEasing[ index ] = easing 表示：

			props[ index ] 是数组时，用 props[ index ] 替换原来的 specialEasing[ name ]
		 */
	}
}

// jQuery.Animation 是 Animation 的超集
jQuery.Animation = jQuery.extend(Animation, {

	// props 为多个属性，这个函数的作用是，为每个属性 prop 建立一个数组 tweeners[ prop ]，然后将 callback 函数加入到每一个数组最前面
	tweener: function (props, callback) {
		if (jQuery.isFunction(props)) {
			callback = props;
			props = ["*"];
		} else {
			props = props.split(" ");
		}

		var prop,
			index = 0,
			length = props.length;

		// tweeners 是一个 json 对象，它的每个属性都是数组，数组元素都是函数
		for (; index < length; index++) {
			prop = props[index];
			// 若对应属性没初始化，则初始化为 []
			tweeners[prop] = tweeners[prop] || [];
			// callback 加入到数组最前面
			tweeners[prop].unshift(callback);
		}
	},

	// 向 animationPrefilters = [ defaultPrefilter ] 这个数组添加函数
	prefilter: function (callback, prepend) {
		if (prepend) {
			// 函数加在数组最前面
			animationPrefilters.unshift(callback);
		} else {
			// 函数加在数组最后面
			animationPrefilters.push(callback);
		}
	}
});

// 默认过滤方法
/*
	defaultPrefilter 是数组 animationPrefilters = [ defaultPrefilter ] 中的元素

	Animation 方法会执行：
	result = animationPrefilters[ index ].call( animation, elem, props, animation.opts )
*/
function defaultPrefilter(elem, props, opts) {
	/* jshint validthis: true */
	var prop, value, toggle, tween, hooks, oldfire,
		// 实际调用时，this 会指向 animation
		anim = this,
		orig = {},
		style = elem.style,
		// element 元素是否可见，isHidden( elem ) 为 true 表示元素隐藏了
		hidden = elem.nodeType && isHidden(elem),
		dataShow = data_priv.get(elem, "fxshow");

	// handle queue: false promises
	if (!opts.queue) {
		hooks = jQuery._queueHooks(elem, "fx");
		// 初始化 hooks.unqueued
		if (hooks.unqueued == null) {
			hooks.unqueued = 0;
			oldfire = hooks.empty.fire;
			hooks.empty.fire = function () {
				if (!hooks.unqueued) {
					oldfire();
				}
			};
		}
		hooks.unqueued++;

		anim.always(function () {
			// doing this makes sure that the complete handler will be called
			// before this completes
			anim.always(function () {
				hooks.unqueued--;
				// 当动画队列长度为 0 的时候，清理缓存
				if (!jQuery.queue(elem, "fx").length) {
					hooks.empty.fire();
				}
			});
		});
	}

	// height/width overflow pass
	// 如果 height、width 等属性需要动画，那么 inline 元素得变为 inline-block 才有效果
	if (elem.nodeType === 1 && ("height" in props || "width" in props)) {
		// Make sure that nothing sneaks out
		// Record all 3 overflow attributes because IE9-10 do not
		// change the overflow attribute when overflowX and
		// overflowY are set to the same value
		/*
			① 记录 3 个 overflow 属性。因为在 IE9-10 下，当 overflowX、overflowY 设置为同样的值后，overflow 属性不会改变
			② 下面会将 overflow 设为 hidden，等动画结束，再还原原来的值
		*/
		opts.overflow = [style.overflow, style.overflowX, style.overflowY];

		// Set display property to inline-block for height/width
		// animations on inline elements that are having width/height animated
		if (jQuery.css(elem, "display") === "inline" &&
			jQuery.css(elem, "float") === "none") {
			// 强制改为 inline-block，因为这样才能修改元素的宽或高
			style.display = "inline-block";
		}
	}

	// opts.overflow 有值，说明 height、width 等属性需要动画
	if (opts.overflow) {
		// 将 overflow 强制改为 hidden，这样就不会因为height、width 等改变导致样式错乱
		style.overflow = "hidden";
		// 动画结束，将 overflow 属性还原
		anim.always(function () {
			style.overflow = opts.overflow[0];
			style.overflowX = opts.overflow[1];
			style.overflowY = opts.overflow[2];
		});
	}


	/*
		例如 props : {
			opacity: 0.25,
			left: '50',
			height: 'toggle'
		}

		以下 for 循环针对属性值为 toggle|show|hide 的情况，比如上面的 height : 'toggle'
	*/
	// show/hide pass
	for (prop in props) {
		value = props[prop];
		// rfxtypes = /^(?:toggle|show|hide)$/，值为 toggle|show|hide
		if (rfxtypes.exec(value)) {
			// 删除这个属性，不过，value 还是原属性值
			delete props[prop];
			// value === "toggle" 时 toggle 就是 true
			toggle = toggle || value === "toggle";
			/*
				能进入下面的 if 代码块，只有 2 种情况：
				① hidden === true && value === 'hide'，hidden 为 true 说明已经在隐藏状态，而目标 value 还是隐藏，那就 continue
				② hidden === false && value === 'show'，hidden 为 true 说明已经在显示状态，而目标 value 还是显示，那就 continue

				continue 会导致不会执行：
				orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop )

				情形 ② 有个例外，下面会分析。

				③ 不符合 ① 和 ② 的情形会执行：
				orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );
			*/
			if (value === (hidden ? "hide" : "show")) {

				// If there is dataShow left over from a stopped hide or show and we are going to proceed with show, we should pretend to be hidden
				/*
					dataShow = data_priv.get( elem, "fxshow" )，缓存的一个对象

					① 能进入这个 if 判断，并且 value === "show" 说明 hidden === false，也就是元素处于显示状态
					② 如果 dataShow[ prop ] 有值，说明这个属性有正在发生的动画，那就按照【隐藏-> 显示】处理，
					 所以，修正 hidden 为 true ，然后执行：
					 orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );

					综上分析，只要给 orig[ prop ] 赋值，说明要进行显示/隐藏状态转换的
				*/
				//
				if (value === "show" && dataShow && dataShow[prop] !== undefined) {
					hidden = true;
				} else {
					continue;
				}
			}
			/*
				函数一开始定义了 orig = {}

				&& 优先级 高于 ||
				① 如果 dataShow[ prop ] 有值，那么复制一份给 orig
				② 否则，orig 取元素的 style 属性

				一开始，dataShow 是不存在的，取的就是 style 的值，后来运动起来了，dataShow 就有值了，orig[ prop ] 就一直被新值覆盖
			*/
			orig[prop] = dataShow && dataShow[prop] || jQuery.style(elem, prop);
		}
	}

	/*
		试想：
		① 没有一个属性值是 value = toggle|show|hide，那么 orig = {}，空对象，就不会执行下面的 if 代码块
		② 即便有属性值是 value = toggle|show|hide，举个极端例子：假如元素当前处于隐藏状态，hidden === true，而所有的 value = 'hide'
			那么，都 continue 了，不会给 orig[ prop ] 赋值，所以，还是不会执行下面的 if 代码块

		③ 假如元素当前处于隐藏状态，hidden === true，只要有一个 value = 'show' 就不会 continue ，就会给 orig[ prop ] 赋值，就会执行下面的 if 代码块

		所以，!jQuery.isEmptyObject( orig ) 意味着肯定需要切换隐藏/显示状态
	*/
	if (!jQuery.isEmptyObject(orig)) {

		if (dataShow) {
			// 以 dataShow 中的 hidden 属性为准
			if ("hidden" in dataShow) {
				hidden = dataShow.hidden;
			}
			// 没有 dataShow ，初始化 dataShow
		} else {
			dataShow = data_priv.access(elem, "fxshow", {});
		}

		// store state if its toggle - enables .stop().toggle() to "reverse"
		// 如果 toggle 为真，dataShow.hidden 属性取反
		if (toggle) {
			dataShow.hidden = !hidden;
		}

		/*
			dataShow 是这样一个 json 对象：
			{
				hidden : true | flase | undefined,
				prop1 : 20,
				prop2 : 100,
				...
			}
		*/

		// 目前在隐藏状态，首先将元素显示出来，然后再执行动画变大
		if (hidden) {
			// 显示元素
			jQuery(elem).show();
		} else {
			// 目前在显示状态，先执行动画变小，最后将元素隐藏
			anim.done(function () {
				// 隐藏元素
				jQuery(elem).hide();
			});
		}

		// 动画结束，移除缓存 fxshow，还原 style 属性
		anim.done(function () {
			var prop;

			data_priv.remove(elem, "fxshow");
			for (prop in orig) {
				jQuery.style(elem, prop, orig[prop]);
			}
		});


		for (prop in orig) {
			/*
				① createTween 函数的作用是给动画 anim 添加新的 tween

				② createTween 的第一个参数代表该属性动画的目标值
				 a. hidden 为 true，说明在隐藏状态，那么动画结果是显示，目标值是 dataShow[ prop ]
				 b. hidden 为 false，说明在显示状态，那么动画结果是隐藏，目标值是 0
			*/
			tween = createTween(hidden ? dataShow[prop] : 0, prop, anim);

			if (!(prop in dataShow)) {
				// prop 的开始值缓存在 dataShow 中
				dataShow[prop] = tween.start;
				/*
					为什么要给 hidden 为 true 的时候单独写呢？

					举个例子：
					加入一开始元素就是隐藏 hidden 为 true，而有属性的 value 为 show，那么该运动到哪里呢？

					hidden 为 true 时，
					tween = createTween(dataShow[ prop ] , prop, anim )

					可是第一次的时候，dataShow[ prop ] 并没有值，为 undefined，那么终点值为多少呢？

					这里将终点值设为起点值 tween.end = tween.start

					tween.start 是该属性当前值（jQuery.css( tween.elem, prop )），因为隐藏元素也是可以有高度的，例如：
					.div {
						height : 100px;
						display : none;
					}
				*/
				if (hidden) {
					tween.end = tween.start;
					/*
						① prop === "width" || prop === "height" 开始值为 1
						② 其他，开始值为 0
					*/
					tween.start = prop === "width" || prop === "height" ? 1 : 0;
				}
			}
		}
	}
}

/*
	作用：生成单个属性的运动对象

	Tween 和 Tween.prototype.init 的关系类似于 jQuery 和 jQuery.prototype.init 的关系
*/
function Tween(elem, options, prop, end, easing) {
	return new Tween.prototype.init(elem, options, prop, end, easing);
}
jQuery.Tween = Tween;

Tween.prototype = {
	constructor: Tween,
	init: function (elem, options, prop, end, easing, unit) {
		this.elem = elem;
		this.prop = prop;
		// 默认的缓动算法是 swing
		this.easing = easing || "swing";
		this.options = options;
		// 初始值
		this.start = this.now = this.cur();
		// 最终值
		this.end = end;
		// 单位
		this.unit = unit || (jQuery.cssNumber[prop] ? "" : "px");
	},
	// 获取当前值
	cur: function () {
		var hooks = Tween.propHooks[this.prop];
		// 如果当前属性有自己的钩子方法，就用之，否则用默认的钩子方法
		return hooks && hooks.get ?
			hooks.get(this) :
			Tween.propHooks._default.get(this);
	},
	// 运动到 percent 对应的值
	run: function (percent) {
		var eased,
			hooks = Tween.propHooks[this.prop];

		if (this.options.duration) {
			/*
				jQuery.easing = {
					linear: function( p ) {},
					swing: function( p ) {}
				};

				如只有 linear、swing 两种函数一个实参就够了，但是这里的运动函数是可用用插件扩展的，传多个参数方便扩展方法使用
			*/
			this.pos = eased = jQuery.easing[this.easing](
				percent, this.options.duration * percent, 0, 1, this.options.duration
			);
		} else {
			this.pos = eased = percent;
		}

		// 一小步目标值
		this.now = (this.end - this.start) * eased + this.start;

		// 移动一小步
		if (this.options.step) {
			this.options.step.call(this.elem, this.now, this);
		}

		if (hooks && hooks.set) {
			hooks.set(this);
		} else {
			Tween.propHooks._default.set(this);
		}
		return this;
	}
};

// Tween 和 Tween.prototype.init 构造函数共用原型
Tween.prototype.init.prototype = Tween.prototype;

// 钩子，处理差异性
Tween.propHooks = {
	_default: {
		get: function (tween) {
			var result;

			// ① 直接读元素属性值
			if (tween.elem[tween.prop] != null &&
				(!tween.elem.style || tween.elem.style[tween.prop] == null)) {
				return tween.elem[tween.prop];
			}

			// passing an empty string as a 3rd parameter to .css will automatically
			// attempt a parseFloat and fallback to a string if the parse fails
			// so, simple values such as "10px" are parsed to Float.
			// complex values such as "rotate(1rad)" are returned as is.
			// ② 用 css 方法取属性值
			result = jQuery.css(tween.elem, tween.prop, "");
			// Empty strings, null, undefined and "auto" are converted to 0.
			return !result || result === "auto" ? 0 : result;
		},
		set: function (tween) {
			// use step hook for back compat - use cssHook if its there - use .style if its
			// available and use plain properties where available
			if (jQuery.fx.step[tween.prop]) {
				jQuery.fx.step[tween.prop](tween);
			} else if (tween.elem.style && (tween.elem.style[jQuery.cssProps[tween.prop]] != null || jQuery.cssHooks[tween.prop])) {
				jQuery.style(tween.elem, tween.prop, tween.now + tween.unit);
			} else {
				tween.elem[tween.prop] = tween.now;
			}
		}
	}
};

// Support: IE9
// Panic based approach to setting things on disconnected nodes

Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
	set: function (tween) {
		if (tween.elem.nodeType && tween.elem.parentNode) {
			tween.elem[tween.prop] = tween.now;
		}
	}
};

/*
	jQuery.fn.extend({
		// 显示 this 下面的所有元素
		show: function() {
			return showHide( this, true );
		},
		// 隐藏 this 下面的所有元素
		hide: function() {
			return showHide( this );
		},
		// 显示/隐藏 状态切换
		toggle: function( state ) {
			// 参数是布尔值，强制 this 下所有的元素 显示/隐藏
			if ( typeof state === "boolean" ) {
				return state ? this.show() : this.hide();
			}

			// 参数不是布尔值，针对 this 下每一个元素，隐藏的显示，显示的隐藏
			return this.each(function() {
				if ( isHidden( this ) ) {
					jQuery( this ).show();
				} else {
					jQuery( this ).hide();
				}
			});
		}
	});
*/

jQuery.each(["toggle", "show", "hide"], function (i, name) {
	// jQuery.fn[ "toggle" ] 等方法之前有定义过
	var cssFn = jQuery.fn[name];
	jQuery.fn[name] = function (speed, easing, callback) {
		return speed == null || typeof speed === "boolean" ?
			// 第一个参数为空，或布尔值，用普通方法直接展现/隐藏
			cssFn.apply(this, arguments) :
			// 否则调用动画方法
			this.animate(genFx(name, true), speed, easing, callback);
		/*
		genFx( 'show', true) 返回：
		{
			height : "show"
			width : "show"
			opacity : "show"
			marginBottom : "show"
			marginLeft : "show"
			marginRight : "show"
			marginTop : "show"
			paddingBottom : "show"
			paddingLeft : "show"
			paddingRight : "show"
			paddingTop : "show"
		}
		*/
	};
});
/*
	#ani {
		background: #0ff;
		margin: 30px;
		padding: 30px;
		height: 300px;
		width: 300px;
	}
	<div id="ani"></div>

	$('#ani').hide(20000) 执行过程中，在 chrome 调试面板中可以看到 #ani 的 style 属性在不停地变化，其中一个时刻为：

	style = "overflow: hidden; height: 149.034px; padding: 14.9034px; margin: 14.9034px; width: 149.034px; opacity: 0.49678;"

	等到动画结束，style 变为：

	style = "display: none;"
*/

jQuery.fn.extend({
	fadeTo: function (speed, to, easing, callback) {

		// show any hidden elements after setting opacity to 0
		return this.filter(isHidden).css("opacity", 0).show()

			// animate to the value specified
			.end().animate({ opacity: to }, speed, easing, callback);
	},
	/*
		queue 队列是一个堆栈，比如 elem 的 "fx" 队列，jQuery.queue(elem, "fx") 即为缓存 jQuery._data(elem, "fxqueue")。
		每个元素的 "fx" 队列都是不同的，因此不同元素或不同队列之间的动画是同步的，相同元素且相同队列之间的动画是异步的。
		添加到 "fx" 队列的函数若是队列中当前的第一个函数，将被直接触发，而后面添加到队列中的函数需要手动调用 jQuery.dequeue 才会启动执行。

		jQuery.fn.animate() 调用核心函数 Animation( elem, properties, options )
	*/
	animate: function (prop, speed, easing, callback) {
		// prop 是否为空对象
		var empty = jQuery.isEmptyObject(prop),
			// 修正后的配置对象，包括持续时间、缓动方法、回调函数等
			optall = jQuery.speed(speed, easing, callback),
			doAnimation = function () {
				// Operate on a copy of prop so per-property easing won't be lost
				// Animation 一经调用，内部的 tick 函数将被 jQuery.fx.timer 函数推入 jQuery.timers 堆栈，立刻开始按照 jQuery.fx.interval 的间隔运动。
				var anim = Animation(this, jQuery.extend({}, prop), optall);

				// Empty animations, or finishing resolves immediately
				/*
					① jQuery.fn.finish 执行时 jQuery._data( this, "finish" ) 设置为 "finish"
					② prop 是空对象或有结束标记，立即终止该动画
				*/
				if (empty || data_priv.get(this, "finish")) {
					anim.stop(true);
				}
			};
		doAnimation.finish = doAnimation;

		/*
			① prop 是空对象，则直接同步执行 doAnimation
			② optall.queue === false 表示不使用 queue 队列机制，也是直接同步执行 doAnimation
			③ 否则，将 doAnimation 加入队列，排队
		*/
		return empty || optall.queue === false ?
			this.each(doAnimation) :
			this.queue(optall.queue, doAnimation);
		/*
			并不是添加到队列的都是 doAnimation，比如 jQuery.fn.delay 方法源码中有：
			return this.queue( type, function( next, hooks ) {
				var timeout = window.setTimeout( next, time );
				hooks.stop = function() {
					window.clearTimeout( timeout );
				};
			});
		*/
	},
	/*
		动画队列中除了 doAnimation ，还可以是普通的方法，比如这里用 queue 入队了一个普通匿名方法

		$('#div1').ckick(function(){
			$(this).animate({width:300},2000).queue('fx',function(){
				$(this).dequeue(); // dequeue 方法没写实参，默认是 'fx'
			}).animate({left:300},2000);
		});

		type 表示队列名称
		clearQueue 表示是否清空未执行完的动画队列
		gotoEnd 表示是否将正在执行的动画跳到结束位置

		举个例子：http://www.w3school.com.cn/tiy/t.asp?f=jquery_stop_params
		$("#start").click(function(){
			$("div").animate({left:'100px'},5000);
			$("div").animate({fontSize:'3em'},5000);
		});

		① clearQueue、gotoEnd 均为 false，会停止当前活动的动画，但允许已排队的动画向前执行
			$("#stop").click(function(){
				$("div").stop();
			});
			假如在执行移动过程中，会马上停止移动，然后立即执行字体变大的动画

		② clearQueue 为 true，gotoEnd 为 false，停止当前活动的动画，并清空动画队列；因此元素上的所有动画都会停止
			$("#stop").click(function(){
				$("div").stop(true);
			});
			假如在执行移动过程中，马上停止移动，也不会执行后面的动画了

		③ clearQueue 为 false，gotoEnd 为 true，立即执行完当前动画，然后继续执行后面的动画
			$("#stop").click(function(){
				$("div").stop(false,true);
			});
			假如在执行移动过程中，立即移动到 100px 处，然后执行后面的字体变大动画

		④ clearQueue、gotoEnd 均为 true，立即完成当前活动的动画，然后停下来
			$("#stop").click(function(){
				$("div").stop(true,true);
			});
			a. 假如在执行移动过程中，立即移动到 100px 处，并不会执行后面的字体变大动画
			b. 假如在执行字体变大过程中，立即字体变大为 3em，然后停下来
	*/
	stop: function (type, clearQueue, gotoEnd) {

		/*
			hooks.stop = function() {
				clearTimeout( timeout );
			};
		*/
		var stopQueue = function (hooks) {
			var stop = hooks.stop;
			// 删除 hooks.stop ，紧接着执行 stop 清除了延迟定时器，导致下一个动画不会触发
			delete hooks.stop;
			stop(gotoEnd);
		};

		// 修正参数对应关系
		if (typeof type !== "string") {
			gotoEnd = clearQueue;
			clearQueue = type;
			type = undefined;
		}

		// 清空队列
		if (clearQueue && type !== false) {
			// 参数为空数组表示清空队列，而不是简单的入队
			this.queue(type || "fx", []);
		}

		return this.each(function () {
			var dequeue = true,
				index = type != null && type + "queueHooks",
				timers = jQuery.timers,
				data = data_priv.get(this);

			// 调用 stopQueue 使得动画之间的驱动断开
			if (index) {
				if (data[index] && data[index].stop) {
					stopQueue(data[index]);
				}
			} else {
				for (index in data) {
					// rrun = /queueHooks$/
					if (data[index] && data[index].stop && rrun.test(index)) {
						stopQueue(data[index]);
					}
				}
			}


			for (index = timers.length; index--;) {
				// tick 的 elem 和 queue 都能对应上
				if (timers[index].elem === this && (type == null || timers[index].queue === type)) {
					// 运动到最终状态
					timers[index].anim.stop(gotoEnd);
					dequeue = false;
					/*
						dequeue === false && gotoEnd == 真

						意味着肯定执行了这里，gotoEnd 为真会怎样呢？

						gotoEnd 为 true，stop 内部会调用 run(1)，并执行 deferred.resolveWith，
						从而执行 complete 函数，从而 dequeue 下一个动画
					*/
					// jQuery.timers 中删除这个 tick
					timers.splice(index, 1);
				}
			}

			// start the next in the queue if the last step wasn't forced
			// timers currently will call their complete callbacks, which will dequeue
			// but only if they were gotoEnd
			/*
				也就是说：dequeue === false && gotoEnd == 真 才不会执行下面的出队操作，其他的所有情况都会执行出队

				上面分析了 dequeue === false && gotoEnd == 真 会进行一次 dequeue，所以这里不能重复 dequeue
			*/
			if (dequeue || !gotoEnd) {
				jQuery.dequeue(this, type);
			}
		});
	},
	finish: function (type) {
		/*
			① type === undefined/null -> type = 'fx'
			② 其他 -> type = type
		*/
		if (type !== false) {
			type = type || "fx";
		}
		return this.each(function () {
			var index,
				data = data_priv.get(this),
				/*
					这里取出了 queue，下面又执行 jQuery.queue( this, type, [] )，清空队列，那么变量 queue 会跟着被清空吗？

					queue 并不会跟着被清空，原因如下：
					jQuery.queue( this, type, [] )
					-> data_priv.access( this, type, jQuery.makeArray(data) )
					 注意 jQuery.makeArray(data) 首先回新建一个空数组 []，然后将 data 加入这个空数组 []
					-> data_priv.set( this, type, [] )
					-> data_priv.cache[data_priv.key( this )][type] = []

					也就是说，data_priv.cache[data_priv.key( this )][type] 指向了一个新的空数组，而 queue 还指向原来的那个数组

					举个简单例子：
					var data = {
						fxqueue : [1,2,3]
					},
					queue = data.fxqueue;

					打印一下：
					console.log(data.fxqueue) -> [1,2,3]
					console.log(queue) -> [1,2,3]

					然后将 data.fxqueue 指向一个新的空数组：
					data.fxqueue = [];

					再打印一下：
					console.log(data.fxqueue) -> []
					console.log(queue) -> [1,2,3]
				*/
				queue = data[type + "queue"],
				hooks = data[type + "queueHooks"],
				timers = jQuery.timers,
				length = queue ? queue.length : 0;

			// enable finishing flag on private data
			// 记住结束状态
			data.finish = true;

			// empty the queue first
			// 清空队列，相当于 data_priv.cache[data_priv.key( this )][type] = []
			jQuery.queue(this, type, []);

			if (hooks && hooks.stop) {
				// 停止
				hooks.stop.call(this, true);
			}

			// look for any active animations, and finish them
			for (index = timers.length; index--;) {
				// tick 的 elem 和 queue 都能对应上
				if (timers[index].elem === this && timers[index].queue === type) {
					// 动画停止，直接到结束状态
					timers[index].anim.stop(true);
					// jQuery.timers 中删除这个 tick
					timers.splice(index, 1);
				}
			}

			// look for any animations in the old queue and finish them
			for (index = 0; index < length; index++) {
				/*
					① 已经执行的 doAnimation 已经不在 queue 中了
					② 所以，在 queue 中的都是没执行，没执行的除了 doAnimation 还有可能其他的普通函数
					 如果是 doAnimation 的就调用 anim.stop( true ) 直接到结束状态
				*/
				if (queue[index] && queue[index].finish) {
					/*
						jQuery.fn.animate 中有 doAnimation.finish = doAnimation

						遍历执行队列中所有 doAnimation 函数（有 finish 属性的才是 doAnimation 函数）。
						由于缓存中带有 finish 标记，动画对象一创建就将调用 anim.stop( true )

						也就是说这里这里并不会真正执行动画，而是直接变到结束位置

						jQuery.fn.finish -> doAnimation -> anim.stop( true )
					*/

					queue[index].finish.call(this);
				}
			}

			// turn off finishing flag
			// 删除结束状态
			delete data.finish;
		});
	}
});

// Generate parameters to create a standard animation
/*
	生成一个属性组成的 json 对象，作为 jQuery.fn.animate() 的第一个参数，例如
	show 方法的 props 为 genFx( 'show', true)：
	{
		height : "show"
		width : "show"
		opacity : "show"
		marginBottom : "show"
		marginLeft : "show"
		marginRight : "show"
		marginTop : "show"
		paddingBottom : "show"
		paddingLeft : "show"
		paddingRight : "show"
		paddingTop : "show"
	}

	slideDown 方法的 props 为 genFx( 'show' )：
	{
		height : "show"
		marginBottom : "show"
		marginTop : "show"
		paddingBottom : "show"
		paddingTop : "show"
	}

	slideDown 动画和 show 动画的唯一区别就是前者没有水平方向上的变化
*/
function genFx(type, includeWidth) {
	var which,
		attrs = { height: type },
		i = 0;

	// if we include width, step value is 1 to do all cssExpand values,
	// if we don't include width, step value is 2 to skip over Left and Right
	includeWidth = includeWidth ? 1 : 0;
	/*
		cssExpand = [ "Top", "Right", "Bottom", "Left" ]

		① 如果参数 includeWidth 是 true，那么 i 每次加 1，遍历 cssExpand 的所有属性
		② 否则，那么 i 每次加 2，跳过 cssExpand 的 "Right" 和 "Left" 属性
	*/
	for (; i < 4; i += 2 - includeWidth) {
		which = cssExpand[i];
		attrs["margin" + which] = attrs["padding" + which] = type;
	}

	if (includeWidth) {
		attrs.opacity = attrs.width = type;
	}

	return attrs;
}

/*
	jQuery.fn.slideDown 动画变化的属性为：genFx("show")
	-> {
		height: "show",
		paddingTop: "show",
		marginTop: "show",
		paddingBottom: "show",
		marginBottom: "show"
	}
*/
// Generate shortcuts for custom animations
jQuery.each({
	slideDown: genFx("show"),
	slideUp: genFx("hide"),
	slideToggle: genFx("toggle"),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" },
	fadeToggle: { opacity: "toggle" }
}, function (name, props) {
	jQuery.fn[name] = function (speed, easing, callback) {
		return this.animate(props, speed, easing, callback);
	};
});

// 返回修正后的持续时间、缓动方法、回调函数等组成的配置对象
jQuery.speed = function (speed, easing, fn) {
	/*
		① speed 是一个对象，opt 为包含这个对象的所有属性的新 json 对象
		② speed 不是对象，则 opt 为包含 complete、duration、easing 等三个属性的 json 对象
	*/
	var opt = speed && typeof speed === "object" ? jQuery.extend({}, speed) : {
		// complete 首先取 fn 的值，如果是假，再去取 easing 的值，如果还是假，取 speed 的值
		complete: fn || !fn && easing ||
			jQuery.isFunction(speed) && speed,
		duration: speed,
		// easing，在 fn 为真时取 easing 值；否则 easing 为真且不为函数时，也取 easing 值
		easing: fn && easing || easing && !jQuery.isFunction(easing) && easing
	};

	/*
		修正持续时间遵循以下规则：
		① 若 jQuery.fx.off 为真，也就是全局设定关闭动画，那么持续时间强制为 0；
		② 若 jQuery.fx.off 为假：
			 a. 若设置的持续时间是数字，那就用这个数字；
			 b. 若设置的持续时间不是数字，那么就去 jQuery.fx.speeds 中去匹配，
			'slow' 对应 600 毫秒，'fast' 对应 200 毫秒，其他所有情况都是默认的 400 毫秒。
	*/
	opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration :
		opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[opt.duration] : jQuery.fx.speeds._default;

	// normalize opt.queue - true/undefined/null -> "fx"
	// 若opt.queue 为 false，表示不使用 queue 队列机制
	if (opt.queue == null || opt.queue === true) {
		// 默认队列是 fx
		opt.queue = "fx";
	}

	// Queueing
	opt.old = opt.complete;

	// 修正 opt.complete
	opt.complete = function () {
		if (jQuery.isFunction(opt.old)) {
			opt.old.call(this);
		}

		/*
			每个元素的 "fx" 队列都是不同的，因此不同元素或不同队列之间的动画是同步的，相同元素且相同队列之间的动画是异步的。
			添加到 "fx" 队列的函数若是队列中当前的第一个函数，将被直接触发，而后面添加到队列中的函数需要手动调用 jQuery.dequeue 才会启动执行。

			每个 elem 可以添加多个 animate，等到上一个 animate 执行结束的时候，就出队（执行）下一个 animate
		*/
		if (opt.queue) {
			jQuery.dequeue(this, opt.queue);
		}
	};

	// 返回修正后的持续时间、缓动方法、回调函数等组成的配置对象
	return opt;
};

// 默认提供两种运动方式可选
jQuery.easing = {
	// 线性
	linear: function (p) {
		return p;
	},
	// 摇摆缓动
	swing: function (p) {
		// y = 0.5 - 0.5 * (π * x)
		return 0.5 - Math.cos(p * Math.PI) / 2;
	}
};

/*
	整个动画机制只使用一个定时器 setInterval ，把 tick 推入堆栈 jQuery.timers ，
	每次定时器调用 jQuery.fx.tick() 遍历堆栈里的函数，
	通过 tick 的返回值知道是否运动完毕，完毕的栈出，没有动画的时候就 jQuery.fx.stop() 暂停。
	jQuery.fx.start() 开启定时器前会检测是开启状态，防止重复开启。
	每次把tick推入堆栈的时候都会调用 jQuery.fx.start() 。
	这样就做到了需要时自动开启，不需要时自动关闭。
*/
jQuery.timers = [];
// Tween.prototype.init 是 tween 对象的构造函数
jQuery.fx = Tween.prototype.init;

// 动画帧，遍历执行 jQuery.timers 数组里的方法
jQuery.fx.tick = function () {
	var timer,
		timers = jQuery.timers,
		i = 0;

	// 当前时间戳
	fxNow = jQuery.now();

	for (; i < timers.length; i++) {
		timer = timers[i];
		// Checks the timer has not already been removed
		/*
			① timer() 返回值为假表示执行完毕，所以从数组中移除
			② 之所以验证 timers[ i ] === timer 是因为 timer() 执行过程中可能会修改 jQuery.timers 数组
		*/
		if (!timer() && timers[i] === timer) {
			/*
				① i-- 表示删除的是当前的 timer
				② i-- 使得下次执行 for 循环时，i 值不变，以免跳过下一个 timer
				③ 由于数组长度动态变化，所以 for 循环开始并没有缓存 jQuery.timers 的长度
			*/
			timers.splice(i--, 1);
		}
	}

	// timers 为空数组时，停止动画
	if (!timers.length) {
		jQuery.fx.stop();
	}
	fxNow = undefined;
};

// 将函数加入 jQuery.timers 数组
jQuery.fx.timer = function (timer) {
	if (timer() && jQuery.timers.push(timer)) {
		jQuery.fx.start();
	}
};

// 每帧动画时间间隔
jQuery.fx.interval = 13;

// 开始动画，整个 jQuery 动画系统就这一个定时器 setInterval
jQuery.fx.start = function () {
	if (!timerId) {
		timerId = setInterval(jQuery.fx.tick, jQuery.fx.interval);
	}
};

// 停止动画
jQuery.fx.stop = function () {
	clearInterval(timerId);
	timerId = null;
};

// 动画时长
jQuery.fx.speeds = {
	slow: 600,
	fast: 200,
	// Default speed
	_default: 400
};

// Back Compat <1.8 extension point
jQuery.fx.step = {};

if (jQuery.expr && jQuery.expr.filters) {
	jQuery.expr.filters.animated = function (elem) {
		return jQuery.grep(jQuery.timers, function (fn) {
			return elem === fn.elem;
		}).length;
	};
}






/*
	作用：设置/返回当前匹配元素相对于文档原点的坐标。该函数只对可见元素有效。

	jQuery.fn.offset() 返回的是相对于文档原点的坐标
	jQuery.fn.position() 返回的是相对于最近的定位祖先元素的坐标
*/
jQuery.fn.offset = function (options) {
	// 有参数，设置每一个匹配元素元素坐标
	if (arguments.length) {
		// 显式传入参数 undefined，直接返回 this
		return options === undefined ?
			this :
			// 依次设置每一个元素的坐标
			this.each(function (i) {
				// 这里的 this 是原生 dom 元素
				jQuery.offset.setOffset(this, options, i);
			});
	}

	// 剩下的都是没有参数，获取第一个匹配元素元素坐标
	var docElem, win,
		// 第一个匹配元素
		elem = this[0],
		box = { top: 0, left: 0 },
		// document
		doc = elem && elem.ownerDocument;

	if (!doc) {
		return;
	}

	/*
		document 对象是每个 dom 树的根，但是它并不代表树中的一个 html 元素，
		document.documentElement 属性引用了作为文档根元素的 html 标签，
		document.body 属性引用了 body 标签
	*/
	docElem = doc.documentElement;

	// Make sure it's not a disconnected DOM node
	if (!jQuery.contains(docElem, elem)) {
		return box;
	}

	// If we don't have gBCR, just use 0,0 rather than error
	// BlackBerry 5, iOS 3 (original iPhone)
	if (typeof elem.getBoundingClientRect !== core_strundefined) {
		/*
			getBoundingClientRect 方法返回元素的大小及其相对于视口的位置
			eg:
			div = $('div')[0];
			div.getBoundingClientRect()
			-> { top: 287.625, right: 308, bottom: 387.625, left: 8 ,height: 100, width: 300 }
		*/
		box = elem.getBoundingClientRect();
	}
	win = getWindow(doc);
	/*
		win.pageYOffset 表示垂直方向滚动条已经滚动过的距离，比 document.documentElement.scrollTop 兼容性好
		win.pageXOffset 表示水平方向滚动条已经滚动过的距离，比 document.documentElement.scrollLeft 兼容性好

		docElem.clientTop表示 html 元素的上边框宽度
		docElem.clientLeft 表示 html 元素的左边框宽度

		最终结果返回的是元素相对于页面左上角的坐标
	*/
	return {
		top: box.top + win.pageYOffset - docElem.clientTop,
		left: box.left + win.pageXOffset - docElem.clientLeft
	};
};


jQuery.offset = {
	// 设置元素相对页面原点的坐标 options : { top : num1, left : num2 }
	setOffset: function (elem, options, i) {
		var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
			/*
				获取元素的定位方式
				eg:
				<div id="div" style="position:relative;width:300px;height:100px;background-color:#0ff;"></div>
				<input type="">

				jQuery.css($("div")[0],"position")
				-> "relative"

				jQuery.css($("input")[0],"position")
				"static"
			*/
			position = jQuery.css(elem, "position"),
			// elem 是原生 dom 节点
			curElem = jQuery(elem),
			props = {};

		// Set position first, in-case top/left are set even on static elem
		if (position === "static") {
			// static 定位强制改为 relative 定位
			elem.style.position = "relative";
		}

		// 获取当前相对页面原点的坐标
		curOffset = curElem.offset();
		/*
			eg:
			<div id="div" style="position:relative;width:300px;height:100px;background-color:#0ff;"></div>
			jQuery.css( div, "top" ) -> "0px"
			jQuery.css( div, "left" ) -> "0px"
		*/
		curCSSTop = jQuery.css(elem, "top");
		curCSSLeft = jQuery.css(elem, "left");
		// absolute、fixed 等定位，如果 left 或 top 值为 auto，那就需要计算具体值
		calculatePosition = (position === "absolute" || position === "fixed") && (curCSSTop + curCSSLeft).indexOf("auto") > -1;

		// Need to be able to calculate position if either top or left is auto and position is either absolute or fixed
		if (calculatePosition) {
			/*
				curElem.position() 获取元素相对于定位的祖先元素的坐标，返回结果是这种形式：
				{ top: 287.625, left: 8 }
			*/
			curPosition = curElem.position();
			curTop = curPosition.top;
			curLeft = curPosition.left;
			// 带单位的字符串转为纯数值 "0px" -> 0
		} else {
			curTop = parseFloat(curCSSTop) || 0;
			curLeft = parseFloat(curCSSLeft) || 0;
		}

		// 如果参数 options 是函数，那就执行这个函数，将返回值替换它
		if (jQuery.isFunction(options)) {
			options = options.call(elem, i, curOffset);
		}

		/*
			props = {};

			options.top - curOffset.top 为相对原点坐标纵坐标的差值
			options.left - curOffset.left 为相对原点坐标横坐标的差值

			props : {
				top : 纵坐标差值 + curTop,
				left : 横坐标差值 + curLeft
			}

			通过改变元素的 top、left 值，使得元素相对原点坐标变为 options.top 和 options.left
		*/
		if (options.top != null) {

			props.top = (options.top - curOffset.top) + curTop;
		}
		if (options.left != null) {
			props.left = (options.left - curOffset.left) + curLeft;
		}

		if ("using" in options) {
			options.using.call(elem, props);

		} else {
			// 更新 top/left 值
			curElem.css(props);
		}
	}
};


jQuery.fn.extend({
	// 返回的是相对于最近的定位祖先元素的坐标（原点是定位祖先元素的左上角）
	position: function () {
		if (!this[0]) {
			return;
		}

		var offsetParent, offset,
			elem = this[0],
			parentOffset = { top: 0, left: 0 };

		// Fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is it's only offset parent
		if (jQuery.css(elem, "position") === "fixed") {
			// We assume that getBoundingClientRect is available when computed position is fixed
			/*
				getBoundingClientRect 方法返回元素的大小及其相对于视口的位置
				eg:
				div = $('div')[0];
				div.getBoundingClientRect()
				-> { top: 287.625, right: 308, bottom: 387.625, left: 8 ,height: 100, width: 300 }

				ie6/ie7/ie8 等不支持 fixed 定位，如果当前浏览器支持 fixed 定位，那就认为 getBoundingClientRect 方法也是可用的
			*/
			offset = elem.getBoundingClientRect();

		} else {
			// Get *real* offsetParent
			// this.offsetParent() 返回一个数组，分别对应 this 中每个元素的定位父元素
			offsetParent = this.offsetParent();

			// Get correct offsets
			// 获取相对于页面原点的坐标
			offset = this.offset();

			// 如果父元素不是 html 元素，那就获取父元素相对于页面原点的坐标
			if (!jQuery.nodeName(offsetParent[0], "html")) {
				parentOffset = offsetParent.offset();
			}

			// jQuery.css() 方法第三个参数为 true 表示获取值转为数值形式
			// Add offsetParent borders
			parentOffset.top += jQuery.css(offsetParent[0], "borderTopWidth", true);
			parentOffset.left += jQuery.css(offsetParent[0], "borderLeftWidth", true);
		}

		/*
			以 left 值为例，值为当前元素到定位祖先元素左上角的水平位移

			left = 当前元素离页面原点水平位移 - 父元素离页面原点水平位移 - 父元素的左边框宽度 - 当前元素自身的左外边距

			其实，就是当前元素左外边距到父元素左边框的距离
		*/
		// Subtract parent offsets and element margins
		return {
			top: offset.top - parentOffset.top - jQuery.css(elem, "marginTop", true),
			left: offset.left - parentOffset.left - jQuery.css(elem, "marginLeft", true)
		};
	},

	// 返回最近的定位祖先元素
	offsetParent: function () {
		return this.map(function () {
			/*
				整个源码最开始部分，有定义 var docElem = document.documentElement

				HTMLElement.offsetParent 是一个只读属性，返回一个指向最近的包含该元素的定位元素。
				如果没有定位的元素，则 offsetParent 为最近的 table, table cell 或根元素（标准模式下为 html；quirks 模式下为 body）。
				当元素的 style.display 设置为 "none" 时，offsetParent 返回 null。offsetParent 很有用，因为 offsetTop 和 offsetLeft 都是相对于其内边距边界的。
			*/
			var offsetParent = this.offsetParent || docElem;

			// 遇到 position 为 static 的元素，比如 table 等，继续找
			while (offsetParent && (!jQuery.nodeName(offsetParent, "html") && jQuery.css(offsetParent, "position") === "static")) {
				offsetParent = offsetParent.offsetParent;
			}

			// 返回的元素肯定定位元素（relative|absolute|fixed），实在找不到就是 html 元素
			return offsetParent || docElem;
		});
	}
});

/*
	这里生成 jQuery.fn.scrollLeft 和 jQuery.fn.scrollTop 方法

	jQuery.fn.scrollLeft ：设置或返回当前匹配元素相对于水平滚动条左侧的偏移
	jQuery.fn.scrollTop ：设置或返回当前匹配元素相对于垂直滚动条顶部的偏移
*/
// Create scrollLeft and scrollTop methods
jQuery.each({ scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function (method, prop) {
	var top = "pageYOffset" === prop;

	/*
		① 不传参数，val === undefined，arguments.length === 0，获取值
			fn( this[0], method )
			-> return win ? win[ prop ] : elem[ method ]

			也就是说
			a. 对于 window 或 document 元素有：
			window.scrollTop -> window.pageYOffset
			document.scrollTop -> window.pageYOffset

			b. 普通元素：
			div1 = document.getElementById('div1')
			$(div1).scrollTop() -> div.scrollTop

		② 传参数，val !== undefined，arguments.length === 1，设置值
			假定 val 就是普通数字，不是函数，
			循环执行：fn( this[i], method, value );
			a. 对于 window 或 document 元素有：
			win.scrollTo(
				!top ? val : window.pageXOffset,
				top ? val : window.pageYOffset
			);

			如果 top 为 true，表示改变 y 方向的位移，x 方向不变，也就是：
			win.scrollTo( window.pageXOffset , val );

			如果 top 为 false，表示改变 x 方向的位移，y 方向不变，也就是：
			win.scrollTo( val , window.pageXOffset );

			b. 普通元素：
			div.scrollTop = val
	*/
	jQuery.fn[method] = function (val) {
		return jQuery.access(this, function (elem, method, val) {
			/*
				这里的 elem 为原生 dom 元素

				对于 getWindow( elem ) ：
				① elem 是 window，那就返回 window
				② elem 是 document，也返回 window
				③ 其他情况，返回 false
			*/
			var win = getWindow(elem);

			if (val === undefined) {
				return win ? win[prop] : elem[method];
			}

			if (win) {
				/*
					① top 为 true，改变 y 方向位移，x 方向不变；
					② top 为 false，改变 x 方向位移，y 方向不变；
				*/
				win.scrollTo(
					!top ? val : window.pageXOffset,
					top ? val : window.pageYOffset
				);

			} else {
				// eg: div.scrollTop = val
				elem[method] = val;
			}
		}, method, val, arguments.length, null);
	};
});

/*
	① elem 是 window，那就返回 window
	② elem 是 document，也返回 window
	③ elem 是其他普通元素，返回 false
*/
function getWindow(elem) {
	// elem.nodeType === 9 说明是 document，document.defaultView === window -> true
	return jQuery.isWindow(elem) ? elem : elem.nodeType === 9 && elem.defaultView;
}


// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each({ Height: "height", Width: "width" }, function (name, type) {
	jQuery.each({ padding: "inner" + name, content: type, "": "outer" + name }, function (defaultExtra, funcName) {

		// funcName 分别为："innerHeight"/"innerwidth"、"height"/"width"、"outerHeight"/"outerwidth"
		/*
			(1) 以 innerHeight 方法为例（type 为 "height"）：
					① 无参数 jQuery.fn.innerHeight()
					chainable 为 0，type 为 "height"

					-> jQuery.access( this, fn, "height", undefined, 0, null );
					-> fn( this[0], "height" )
					-> a. this[0] 是 window ，返回 window.document.documentElement.clientHeight
					也就是说，$(window).innerHeight() -> window.document.documentElement.clientHeight
					b. this[0] 是 document（document.nodeType === 9），返回：
					Math.max(
						document.body.scrollHeight, html.scrollHeight,
						document.body.offsetHeight, html.offsetHeight,
						html.clientHeight
					);
					c. jQuery.css( this[0], "height", "padding" )

					② 有参数，jQuery.fn.innerHeight(v1,v2)
					（假定 v1 就是普通值，不是函数）
					chainable 为 "padding"，type 为 "height"

					-> jQuery.access( this, fn, "height", v1 , "padding", null );
					到这里可以看到，即便传了 2 个参数 v1、v2，也会忽略第二个参数
					-> 循环执行：fn( this[i], "height", v1 );
					-> a. 同上
					b. 同上
					c. jQuery.style( this[i], "height", v1 , "padding" );

			(2) 以 outerHeight 方法为例（type 为 "height"）：
					① 无参数 jQuery.fn.outerHeight()
					chainable 为 0，type 为 "height"

					-> jQuery.access( this, fn, "height", undefined, 0, null );
					-> fn( this[0], "height" )
					-> a. 同上
					b. 同上
					c. jQuery.css( this[0], "height", "border" )

					② 有参数 jQuery.fn.outerHeight(true, v2)
					chainable 为 false，type 为 "height"

					-> jQuery.access( this, fn, "height", undefined, 0, null );
					-> fn( this[0], "height" )
					-> a. 同上
					b. 同上
					c. jQuery.css( this[0], "height", "margin" )

					③ 有参数 jQuery.fn.outerHeight(v1, v2)
					（假定 v1 就是普通值，不是函数）
					chainable 为 true，type 为 "height"

					-> jQuery.access( this, fn, "height", v1 , true, null );
					-> 循环执行：fn( this[i], "height", v1 );
					-> a. 同上
					b. 同上
					c. jQuery.style( this[i], "height", v1, "border");
		*/
		// margin is only for outerHeight, outerWidth
		jQuery.fn[funcName] = function (margin, value) {
			/*
				① 参数个数大于 0，defaultExtra 为 "padding"|"content"，chainable 为 "padding"|"content"
					 对应 "innerHeight"/"innerwidth"、"height"/"width" 等 4 个方法
				② 参数个数大于 0，defaultExtra 为 ""，margin 不是布尔值，chainable 为 true
					 对应 "outerHeight"/"outerwidth" 等 2 个方法
				③ 无参数，chainable 为 0

				总结：
				a. 对于 "innerHeight"/"innerwidth"、"height"/"width" 等 4 个方法
					 只要参数个数大于 0，chainable 就是设置真，表示设置
				b. 对于 "outerHeight"/"outerwidth" 等 2 个方法
					 不光要参数大于 0，第一个参数还不能是布尔值，才表示设置
			*/
			var chainable = arguments.length && (defaultExtra || typeof margin !== "boolean"),
				/*
					① defaultExtra 为 "padding"|"content" 时，extra 也为 "padding"|"content"
					 对应 "innerHeight"/"innerwidth"、"height"/"width" 等 4 个方法
					② defaultExtra 为 "" 时：
					 对应 "outerHeight"/"outerwidth" 等 2 个方法

					 如果 margin === true || value === true，extra 为 "margin"；
					 否则 extra 为 "border"

					总结：
					a. 对于 "innerHeight"/"innerwidth" 方法 extra 为 "padding"
					b. 对于 "height"/"width" 方法，extra 为 "content"
					c. 对于 "outerHeight"/"outerwidth" 方法，extra 为 "margin" 或 "border"
				*/
				extra = defaultExtra || (margin === true || value === true ? "margin" : "border");

			return jQuery.access(this, function (elem, type, value) {
				var doc;

				// 注意这里是 isWindow 不是 getWindow ，别看错了
				if (jQuery.isWindow(elem)) {
					// As of 5/8/2012 this will yield incorrect results for Mobile Safari, but there
					// isn't a whole lot we can do. See pull request at this URL for discussion:
					// https://github.com/jquery/jquery/pull/764
					return elem.document.documentElement["client" + name];
				}

				// Get document width or height
				if (elem.nodeType === 9) {
					doc = elem.documentElement;

					// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
					// whichever is greatest
					return Math.max(
						elem.body["scroll" + name], doc["scroll" + name],
						elem.body["offset" + name], doc["offset" + name],
						doc["client" + name]
					);
					/*
					Math.max(
						document.body[ "scroll" + name ], html[ "scroll" + name ],
						document.body[ "offset" + name ], html[ "offset" + name ],
						html[ "client" + name ]
					);
					 */
				}

				return value === undefined ?
					// Get width or height on the element, requesting but not forcing parseFloat
					jQuery.css(elem, type, extra) :

					// Set width or height on the element
					jQuery.style(elem, type, value, extra);
			}, type, chainable ? margin : undefined, chainable, null);
		};
	});
});
// Limit scope pollution from any deprecated API
// (function() {

// The number of elements contained in the matched element set
// 当前选择器匹配到的元素个数
jQuery.fn.size = function () {
	return this.length;
};

jQuery.fn.andSelf = jQuery.fn.addBack;

// })();
/*
	说一说模块化：

	Java 语言有一个概念叫 package，逻辑上相关的代码写在一个 package 里，外部 import 这个 package 就可以用里面的代码了。
	这种隔离作用域、分离逻辑、组织代码的思想，叫做”模块化“

	模块化的好处是：
	* 解决项目中的变量污染问题。
	* 开发效率高，有利于多人协同开发。
	* 职责单一，方便代码重用和维护 。
	* 解决文件依赖问题，无需关注引包顺序 。

	可是，JavaScript 在设计的时候并没有提供类似功能。可是随着前端业务的发展，这种模块化的需求愈发明显。所以，在模块化的道路上经过了以下的探索：

	① 函数

		函数一个功能就是实现特定逻辑的一组语句打包，而且 JavaScript 的作用域就是基于函数的，所以把函数作为模块化的第一步是很自然的事情，
		在一个文件里面编写几个相关函数就是最开始的模块了

		// file.js

		function fn1(){}
		function fn2(){}


		缺点：污染了全局变量，无法保证不与其他模块发生变量名冲突，而且模块成员之间没什么关系

	② 对象

		把所有的模块成员封装在一个对象中

		// file.js

		var myModule = {
			v1: 1,
			v2: 2,
			fn1: function(){},
			fn2: function(){}
		}

		缺点：外部可以随意修改内部成员 myModel.v1 = 3;

	③ 立即执行函数

		var myModule = (function(){
			var v1 = 1;
			var v2 = 2;

			function fn1(){}

			function fn2(){}

			return {
				fn1: fn1,
				fn2: fn2
			};
		})();

		这种形式比较好，jQuery 就是采用这种形式

	以上都是 JavaScript 模块化的基础，目前，通行的 JavaScript 模块规范主要有三种：CommonJS、AMD、CMD

	(1) CommonJS

	第一个流行的模块化规范是由服务器端的 JavaScript 应用带来，CommonJS 规范是由 nodejs 发扬光大。

	a. 定义模块：
		根据 CommonJS 规范，一个单独的文件就是一个模块。每一个模块都是一个单独的作用域，
		也就是说，在该模块内部定义的变量，无法被其他模块读取，除非定义为 global 对象的属性

	b. 模块输出：
		模块只有一个出口，module.exports 对象，我们需要把模块希望输出的内容放入该对象

	c. 加载模块：
		加载模块使用 require 方法，该方法读取一个文件并执行，返回文件内部的 module.exports 对象

	基本使用

	第一步：模块定义

		// myModel.js

		var v1 = 1;

		function fn1(){}

		function fn2(){}

		module.exports = {
			f1 : fn1,
			f2 : fn2
		}

	第二步：加载模块

		var myModel = require('./myModel.js');
		myModel.f1();

		可以看到，CommonJS 规范中，代码是同步执行的，require 加载模块后，同步读取模块文件内容，并编译执行以得到模块接口。
		这在服务器端是没问题的，服务器端的文件读取都在本地，速度很快。但是这样做在浏览器端读取远程文件显然是不合理的。

	(2) AMD


	AMD 全称 Asynchronous Module Definition，即异步模块定义。它是一个适合浏览器端模块化开发的规范。
	由于 JavaScript 不是原生支持，所以使用 AMD 规范进行页面开发需要用到 RequireJS 库。

	requireJS 主要解决两个问题

	1. 多个 js 文件可能有依赖关系，被依赖的文件需要早于依赖它的文件加载到浏览器
	2. js 加载的时候浏览器会停止页面渲染，加载文件越多，页面失去响应时间越长


	a. define 函数定义模块

		define(id, dependencies, factory);

		id：可选参数，用来定义模块的标识，如果没有提供该参数，取脚本文件名（不包括文件后缀）
		dependencies：是一个当前模块依赖的模块名称数组
		factory：工厂方法，模块初始化要执行的函数或对象。如果为函数，它应该只被执行一次。如果是对象，此对象应该为模块的输出值


	b. require 函数加载模块

		require(dependencies, callback);

		dependencies ：表示所依赖的模块
		callback ： 一个回调函数，当前面指定的模块都加载成功后，它将被调用。加载的模块会以参数形式传入该函数，从而在回调函数内部就可以使用这些模块


		require()函数在加载依赖的函数的时候是异步加载的，这样浏览器不会失去响应，它指定的回调函数，只有前面的模块都加载成功后，才会运行，解决了依赖性的问题。

	基本使用：

	第一步：引入 requirejs，并且设置入口文件

		<script data-main='js/main' src='http://apps.bdimg.com/libs/require.js/2.1.9/require.min.js'></script>

	第二步：定义模块

		// myModule.js

		define('myModule', ['foo', 'bar'], function ( foo, bar ) {
			var myModule = {
				fn1 : function(){
				// code
				}
			}
			return myModule;
		});

	第三步：加载模块

		require(['foo', 'bar'], function ( foo, bar ) {
			foo.doSomething();
		});

	(3) CMD

	CMD 全称 Common Module Definition，即通用模块定义，CMD 规范是国内发展出来的，就像 AMD 有个 requireJS，CMD 有个浏览器的实现 SeaJS，
	SeaJS 要解决的问题和 requireJS 一样，只不过在模块定义方式和模块加载（可以说运行、解析）时机上有所不同。

	基本使用:

	第一步：引入包文件 sea.js

		<script src='http://apps.bdimg.com/libs/seajs/2.3.0/sea.js'></script>

	第二步：定义模块。

		// student.js

		define(function(require,exports,module){
			function Student(){
				this.name = '张三';
			}
			// 对外暴露该模块的接口：
			module.exports = new Student();
		})

	第三步：使用模块。第一个参数是使用模块的路径，第二个回调函数中的参数是所要使用模块暴露出来的一个接口。

		seajs.use('./student.js',function(stu){
			console.log(stu.name); // 张三
		});
*/
// CommonJS 规范
if (typeof module === "object" && module && typeof module.exports === "object") {
	// Expose jQuery as module.exports in loaders that implement the Node
	// module pattern (including browserify). Do not create the global, since
	// the user will be storing it themselves locally, and globals are frowned
	// upon in the Node module world.
	module.exports = jQuery;
	// AMD 规范
} else {
	// Register as a named AMD module, since jQuery can be concatenated with other
	// files that may use define, but not via a proper concatenation script that
	// understands anonymous AMD modules. A named AMD is safest and most robust
	// way to register. Lowercase jquery is used because AMD module names are
	// derived from file names, and jQuery is normally delivered in a lowercase
	// file name. Do this after creating the global so that if an AMD module wants
	// to call noConflict to hide this version of jQuery, it will work.
	if (typeof define === "function" && define.amd) {
		define("jquery", [], function () { return jQuery; });
	}
}

// If there is a window object, that at least has a document property,
// define jQuery and $ identifiers
// 如果是浏览器环境，将 jQuery 和 $ 挂载到全局对象 window 下
if (typeof window === "object" && typeof window.document === "object") {
	window.jQuery = window.$ = jQuery;
}

}) (window);
