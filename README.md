# jQuery-code-analysis

用过 jQuery 的人应该都有感受，它比原生 JavaScript 容易得多，不得不好奇它是怎么做到的，于是决定打开 jQuery 源码一探究竟。本文针对的是 jQuery 2.0.3 版本源码，对其中一些重要又基本的概念进行梳理，有时间的话，后面会陆续对各个具体的功能模块进行分析。

**jQuery 2.0.3 源码一共 8829 行（包括作者的注释），按行进行分解，总体框架如下：**

```
(function( window, undefined ) {

    (21 , 94) 定义一些变量和函数，其中包括：
    jQuery = function( selector, context ){}

    (96 , 283) 给 jQuery 函数添加一些方法和属性

    (285 , 347) 静态和实例继承方法的定义 

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
```

下面对一些重要的概念梳理一下，了解完这些概念后，读起源码就能做到有的放矢：

**(1) 最外层的立即执行函数：**

```
(function( window, undefined ) {
    // code
})(window);
```

这种写法有几点好处：

① 一般情况下，项目中除了引入 jQuery 代码，还会有其他的 js 代码。这里将 jQuery 的所有代码由这个匿名函数包裹起来，那么这里定义的任何变量都是局部的，不会和其他的 js 代码互相干扰。

② 将 windows 作为形参和实参，是因为 window 对象处于作用域链的最顶端，所以 window 下属性查找速度会比较慢，这样做可以提高 window 下属性的遍历效率，另外，将 window 作为形参，那么在代码压缩过程中，匿名函数里的所有 window 标识符都可以简化为一个字母，压缩效率高。

③ 将 undefined 做为形参可以规避 ECMAScript3 中 undefined 可以被改写的问题。早期的 ECMAScript3 中，undefined 是可读可写的变量，后来的 ECMAScript5 中才修正为只读变量。而 undefined 作为有特殊含义的关键字，如果被修改会引起很多意想不到的麻烦。

为什么这么写可以规避 undefined 被改写的问题呢？下面从正反两方面回答这个问题：

a. 假如不要形参 undefined，依据作用域链的原理，匿名函数中的 undefined 就会取全局的 undefined，而全局中的 undefined 是可能被修改的，所以这样是不好的。
  
b. 假如像上面那样将 undefined 作为形参，省略对应的实参。我们知道，在 js 中函数被省略的实参默认是 undefined（货真价实的 undefined），那么，以上匿名函数执行时，这个货真价实的 undefined 就会复制给形参 undefined，所以，函数内部的 undefined 自然都是货真价实的 undefined 了。

**(2) 伪构造函数 jQuery**

既然函数内部的变量都是局部的，全局环境下是不可见的，那么为什么我们能用 jQuery 方法呢？

其实代码结尾有一句：
```
window.jQuery = window.$ = jQuery
```
这样就把局部的 jQuery 方法挂载到全局对象 window 下面了，所以全局 jQuery 方法就是内部定义的 jQuery 方法。另外，这也表明，jQuery 和 $ 是等价的，$ 可以看做是 jQuery 的简写别名。

一般情况下，我们会这样写构造函数：

```
var jQuery = function( selector, context ) {
    this.selector = selector;
    this.context = context;
    ...
}
```

如果不使用 new 运算符，直接执行 jQuery() 方法时，函数里的 this 指向的是全局的 window 对象，
这会导致挂载到 this 对象上的属性和方法全都变成全局属性和方法了，这样会对全局环境造成破坏。
所以，jQuery 库并没有采取这种写法，而是这样写：

```
var jQuery = function( selector, context ) {
    return new jQuery.fn.init(selector,context,rootjQuery);
}
```

① 如果普通调用 jQuery 方法，比如 jQuery('div') 返回的是:
```
new jQuery.fn.init( selector, context, rootjQuery )
```

② 如果用 new 运算符调用 jQuery 方法，比如 new jQuery('div')。new 运算符有个特性是，如果函数的返回值本来就是一个对象，那么 new 运算符的返回值就是那个对象。也就是说，不管是否用 new 运算符调用 jQuery 方法，最终返回的都是这个对象：
```
new jQuery.fn.init( selector, context, rootjQuery )
```

所以，jQuery.fn.init 才是真正的构造函数。

再看：
```
jQuery.fn = jQuery.prototype = {
    ...
    init: function( selector, context, rootjQuery ) {}
    ...
};
```

这里给 jQuery.prototype 定义了一系列的属性和方法，同时给 jQuery.prototype 也取了个别名 jQuery.fn。所以，上面提到的 jQuery.fn.init 就是 jQuery.prototype.init。

我们知道，给 jQuery.prototype 添加属性和方法，意味着 jQuery 作为构造函数时，jQuery 的实例对象都会自动拥有 jQuery.prototype 中的属性和方法。

可是，上边说到 jQuery 只是一个普通函数而已，并没有作为一个真正的构造函数使用，那么给 jQuery 原型添加那么多属性和方法还有意义吗？答案是必须有！

继续往下看，还有一句：
```
jQuery.fn.init.prototype = jQuery.fn;
```

这句话的意思是将 jQuery.fn.init.prototype 指向 jQuery.fn，也就是 jQuery.prototype。这意味着，给 jQuery.prototype 添加属性和方法统统都给了 jQuery.fn.init.prototype，而 jQuery.fn.init 作为真正的构造方法，它是需要这些原型属性和方法的。

给 jQuery.fn 添加的属性和方法，其实都可以被真正的构造方法 jQuery.fn.init 的实例对象用的。也就是说 new jQuery.fn.init( selector, context, rootjQuery ) 作为 jQuery.fn.init 的实例对象，它拥有 jQuery.fn 的一切属性和方法。

**(3) 静态和实例继承**
    
首先明确一点，jQuery 是个函数，函数也属于对象的范畴，所以可以给它添加属性。

```
jQuery.extend = jQuery.fn.extend = function(){}
```

这两个方法共用一个定义，关于其参数个数和类型导致的功能差异暂且不详说，说说 jQuery 内部常用的形式：

① 静态继承
```
jQuery.extend({
    p1 : 1,
    f1 : function(){}
});
```

这样写的作用是把匿名对象的 p1 属性和 f1 方法复制给 jQuery 对象，所以，jQuery 这个对象就拥有 p1、f1 属性了。jQuery 就是用这种写法来扩展工具方法的，比如 jQuery.each 方法。

② 实例继承
```
jQuery.fn.extend({
    p1 : 1,
    f1 : function(){}
});
```

这样写的作用是把匿名对象的 p1 属性和 f1 方法复制给 jQuery.fn 对象，前边说到：
```
jQuery.fn.init.prototype = jQuery.fn
```
所以，这里的 p1 和 f1 都复制给了 jQuery.fn.init.prototype，所以 jQuery.fn.init 的实例都拥有 p1、f1 属性了。前边说到 $('div') 这种都是 jQuery.fn.init 的实例，所以，$('div') 就拥有 p1、f1 属性了。jQuery 就是用这种写法来扩展实例方法的，比如 $('div').css 方法。

**(4) 文档就绪函数**

在 js 代码执行的时候，如果涉及页面 dom 元素的操作，要使得代码顺利执行不出错，前提条件就是 dom 元素结构必须在已经加载完成。为了保证代码在 dom 元素加载完毕后执行，jQuery 采取的方式就是将代码用以下形式包裹起来，有以下 3 种写法：

```
// 方式一
$(function(){
    // jQuery functions go here
});

// 方式二
$(document).ready(function(){
    // jQuery functions go here
});

// 方式三
$(document).on('ready',function(){
    // jQuery functions go here
})
```
虽然看起来有些差别，但这三种写法本质没什么不同，jQuery 内部实现一样。它们的作用是：等文档 dom 结构加载完毕后，再执行包裹起来的自定义代码。

判断文档 dom 是否加载完毕，一般监听 DOMContentLoaded 事件。之所以不用 window.onload 事件是因为 window.onload 事件必须等页面全部资源（包括图片等）都加载完毕，才会触发，如果网速慢，资源多，就会一直等着；而 DOMContentLoaded 事件只需要等 dom 结构加载完毕就可以触发，这样会比较合理。

**(5) Sizzle 选择器**
    
jQuery 几乎所有的功能都离不开 dom 元素，所以，一个重要的功能就是用 $(selector) 将所需的 dom 元素找出来。这里的 selector 我们称之为”选择器“，它可以是字符串，可以是 dom 元素，也可以是 jQuery 对象等等。

如果 selector 是比较简单的选择器，比如 '#myId' ，表示要找出 id 为 myId 的元素，那么直接调用 document.getElementById('myId') 就可以了。可是，如果选择器比较复杂，比如：$('div + p span > a[title="hi"]')，这就不是单纯地用 js 原生 api 可以解决了，这时候我们就需要 Sizzle 这个强大的选择器引擎，举个例子：

$('div span') 表示选取所有的 div 下的 span 元素。$('span > a[title="hi"]') 表示选取作为 span 的子元素并且 title 属性为 hi 的 a 标签

给 $ 函数传入 'div span' 这种选择器 Sizzle 就能匹配出相应的元素。当然了，以上的例子还是比较简单，当选择器 selector 更加复杂时就更难体现出 Sizzle 的价值了，源码部分会详细地去了解它。

另外，Sizzle 是独立的一部分，不依赖任何库，如果你不想用 jQuery，可以把 Sizzle 单独拿出来用。

**(6) 链式调用**

平常使用 jQuery 过程中，会经常用到这种链式写法：
```
$('input').css('width','20px').click(function(){alert(1)})
```

这句的作用是，将所有的 input 元素字体设为 20px，然后监听所有的 input 元素的点击事件，当我们点击 input 元素时，弹出 1。

这样的链式写法，看起来语义清晰，写起来也挺方便的，其实它的实现原理也是很简单。

以上 css、click 方法都是我们定义在 jQuery.fn 上的方法，根据前边的分析我们知道，任何一个 jQuery() 方法生成的对象（称之为 jQuery 实例对象）都可以调用jQuery.fn 上挂载的方法，所以 css、click 等方法是可以被 jQuery 实例对象调用的。

所以，我们断定以下都是 jQuery 对象：
```
$('input')                          // jQuery 对象
$('input').css('font-size','20px')  // jQuery 对象
```

事实也确实这样，举个简单的例子：
```
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
console.log(n);     // 2
```

以上定义了一个对象 o，只要 o 的每一个方法的返回值都是这个对象 o，那么就可以实现链式调用了。jQuery 内部就是这个原理，只不过 css、click 等方法的返回值都是 this，这个 this 就是指调用这些方法的 jQuery 实例对象。

**(7) 冲突处理**

我们知道，在 $ 和 jQuery 是等价的，都表示内部的 jQuery 函数。可是，说到底，$ 和 jQuery 只是普通的标识符，并不是 JavaScript语言的关键词和保留字。那么，不光 jQuery 库可以使用它们，我们的自定义代码，或者别的 JavaScript 库也都可以使用它们作为变量名。假如另一个第三方库也用 $ 或者 jQuery 作为变量名，那就产生了冲突，先引入的那个就会被后引入的覆盖，以致于失效。所以，jQuery 库做出了防冲突的机制。

上面提到 jQuery 库加载过程中会执行：
```
window.jQuery = window.$ = jQuery
```

这意味着全局的 jQuery 和 $ 变量都会变为 jQuery 库里定义的 jQuery 函数了。也就是说，引入 jQuery 库会导致全局的 jQuery 和 $ 变量被 jQuery 库中的 jQuery 函数覆盖。

考虑到这个问题，jQuery 做了两件事：

① 执行上面那句覆盖操作之前，就保存住原来的全局 jQuery 和 $ 变量
```
_jQuery = window.jQuery;
_$ = window.$;
```

也就是说，不管用还是不用，jQuery 库在一开始就会保存原来全局的 jQuery 和 $ 变量。

② 定义 jQuery.noConflict 函数，这个函数的作用是让 jQuery 放弃对 $ 和 jQuery 标识符的使用权，换成其他的标识符，以避免冲突。

```
// 如果 deep 为假，就只让出 $ 的控制权；
// 如果 deep 为真，就同时让出 $ 和 jQuery 的使用权。
jQuery.noConflict: function( deep ) {
    // 如果全局 $ 为匿名函数内部的 jQuery，让出 $ 标识符
    if ( window.$ === jQuery ) {
        // 让出 $ 符，window.$ = 123
        window.$ = _$;
    }

    // 如果全局 jQuery 就是匿名函数内部的 jQuery，并且 deep 为真，
    // 那么就让出 jQuery 标识符
    if ( deep && window.jQuery === jQuery ) {
        window.jQuery = _jQuery;
    }

    return jQuery;
}
```

比如，执行：
```
var jq = jQuery.noConflict(true);
```

意思就是：以后 jq 这个变量就代表 jQuery 库的 jQuery 方法了，全局的 $ 和 jQuery 标识符和 jQuery 库完全不相干了。


举例说明：假如引入 jQuery 库之前，已经有了全局的 $ 和 jQuery 变量：
```
var $ = 123;
var jQuery = 456;
```
为了不让 jQuery 库覆盖这两个全局变量，我们这么做：
```
var jq = jQuery.noConflict(true);
```

这样，就释放了 jQuery 对全局的 jQuery 和 $ 变量的使用权。全局的 $ 还是 123，全局的 jQuery 还是 456，jq 就是 jQuery 内部的 jQuery 方法了。

**(8) 兼容性问题处理**

我们自己写原生代码的时候，会遇到很多浏览器兼容问题，而用 jQuery 库后就不需要再去关注与浏览器兼容问题了，这是因为 jQuery 库已经把这些兼容性问题处理好了。处理兼容问题，在 jQuery 内部主要分为两步：

① 兼容性问题检测，得到一个功能支持性列表
```
jQuery.support = (function( support ) {
    // 功能检测代码
    return support;
})( {} );
```

在 chrome 下执行以上立即执行函数，得到：
```
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
```
② 利用钩子（hooks）机制，解决兼容问题

也就是说 jQuery.support 只是进行功能检测，真正的兼容问题处理是靠一系列 hooks 方法完成的。

以 attrHooks 解决属性操作兼容性问题为例，attrHooks 对象会有多个属性，代表那几个属性有兼容性问题。如果这个属性有 get 子属性说明获取该属性时兼容性问题，如果这个属性有 set 子属性说明设置该属性有设置兼容性问题。attrHooks 中没有的属性说明是正常的，用常规途径获取或者设置该属性就好了。
```
attrHooks: {
    type: {
        set: function( elem, value ) {
            // 注意这里的 !jQuery.support.radioValue
            if ( !jQuery.support.radioValue 
                 && value === "radio" 
                 && jQuery.nodeName(elem, "input") ) {
                ...
            }
        }
    }
    ...
}
```
这里 type 属性和 set 子属性，说明 type 属性的设置（set）需要兼容。很明显看到，如果 jQuery.support.radioValue 为 true，是不会真正执行以上 attrHooks.type.set 方法的。

以上的 attrHooks 只是钩子的一种，以上 jQuery.support 中的兼容问题都是分散在众多类似于 attrHooks 的钩子中完成的。如果上面的叙述没能很好的说明钩子的用法，那就再举个简单例子：

例如，假如学生获得了某比赛第一名，考生加 50 分，获得了第二名，高考加 30 分，获得了第三名，高考加 10 分。那么，统计学生高考总分时，不同的奖项加分就可以用钩子机制来实现。
```
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
    if (reward[studentInfo.rewardPlace] ) {
        result += reward[studentInfo.rewardPlace] ;
    }
    return result;
}

var info = student('nanc', 100, 'firstPlace')

console.log(totalScore(info))
-> 150
```

使用钩子去处理特殊情况，可以让代码的逻辑更加清晰，省去大量的条件判断，上面的钩子机制的实现方式，采用的就是表驱动方式，就是我们事先预定好一张表（俗称打表），用这张表去适配特殊情况。

参考：
1. jQuery官网（http://api.jquery.com）
2. 妙味课堂-逐行分析jQuery源码的奥妙
3. 中文api文档（http://www.365mini.com/page/jquery-quickstart.htm）
4. jQuery源码分析系列（http://www.cnblogs.com/aaronjs/archive/2013/08/24/3279314.html）
